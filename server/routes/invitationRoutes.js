const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const WorkspaceMember = require('../models/WorkspaceMember');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

const router = express.Router();

// ── POST /api/invitations — Send an invitation (email + role) ──
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { email, role, workspaceId } = req.body;

        if (!email || !workspaceId) {
            return res.status(400).json({ error: "Email and workspaceId are required" });
        }

        // Get workspace and privacy settings
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        // Verify user is a member
        const member = await WorkspaceMember.findOne({ workspaceId, userId });
        if (!member) {
            return res.status(403).json({ error: "You are not a member of this workspace" });
        }

        // ENFORCE: restrictInvitations — when ON, only owner/admin can invite
        const restrictInvitations = workspace.privacySettings?.restrictInvitations ?? false;
        if (restrictInvitations) {
            if (!['owner', 'admin'].includes(member.role)) {
                return res.status(403).json({ error: "Workspace invitations are restricted to admins and owners only" });
            }
        } else {
            // Default behavior: owner/admin only
            if (!['owner', 'admin'].includes(member.role)) {
                return res.status(403).json({ error: "Only owners and admins can send invitations" });
            }
        }

        const inviter = await User.findOne({ clerkId: userId });
        const inviterName = inviter?.name || inviter?.email?.split('@')[0] || 'Someone';

        // Handle comma-separated emails
        const emails = email.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const results = [];

        for (const invitedEmail of emails) {
            // Check if already a member
            const existingUser = await User.findOne({ email: invitedEmail });
            if (existingUser) {
                const existingMember = await WorkspaceMember.findOne({ 
                    workspaceId, 
                    userId: existingUser.clerkId 
                });
                if (existingMember) {
                    results.push({ email: invitedEmail, status: 'already_member' });
                    continue;
                }
            }

            // Check if there's already a pending invitation
            const existingInvite = await WorkspaceInvitation.findOne({
                workspaceId,
                invitedEmail,
                status: 'pending'
            });
            if (existingInvite) {
                results.push({ email: invitedEmail, status: 'already_invited' });
                continue;
            }

            // Create the invitation
            const invitation = await WorkspaceInvitation.create({
                workspaceId,
                invitedByUserId: userId,
                invitedByName: inviterName,
                invitedEmail,
                role: role || 'editor',
                workspaceName: workspace.name,
                status: 'pending'
            });

            results.push({ email: invitedEmail, status: 'sent', invitationId: invitation._id });
        }

        res.status(201).json({ results });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/invitations/inbox — Get current user's pending invitations ──
router.get("/inbox", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        // Get user's email from User model
        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Find all pending invitations for this email
        const invitations = await WorkspaceInvitation.find({
            invitedEmail: user.email.toLowerCase(),
            status: 'pending'
        }).sort({ createdAt: -1 }).lean();

        // Filter out expired ones
        const now = new Date();
        const validInvitations = invitations.filter(inv => {
            if (inv.expiresAt && now > new Date(inv.expiresAt)) {
                // Mark as expired in background
                WorkspaceInvitation.updateOne({ _id: inv._id }, { status: 'expired' }).exec();
                return false;
            }
            return true;
        });

        res.json({ invitations: validInvitations, count: validInvitations.length });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/invitations/:id/accept — Accept an invitation ──
router.put("/:id/accept", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        const invitation = await WorkspaceInvitation.findOne({
            _id: req.params.id,
            invitedEmail: user.email.toLowerCase(),
            status: 'pending'
        });

        if (!invitation) return res.status(404).json({ error: "Invitation not found or already processed" });

        // Check expiration
        if (invitation.isExpired()) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(410).json({ error: "This invitation has expired" });
        }

        // Create the membership
        await WorkspaceMember.create({
            workspaceId: invitation.workspaceId,
            userId: userId,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            avatar: user.avatar || '',
            role: invitation.role,
            status: 'active'
        });

        // Update invitation status
        invitation.status = 'accepted';
        await invitation.save();

        res.json({ message: "Invitation accepted", workspaceId: invitation.workspaceId });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "You are already a member of this workspace" });
        }
        next(error);
    }
});

// ── PUT /api/invitations/:id/decline — Decline an invitation ──
router.put("/:id/decline", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        const invitation = await WorkspaceInvitation.findOneAndUpdate(
            { _id: req.params.id, invitedEmail: user.email.toLowerCase(), status: 'pending' },
            { status: 'declined' },
            { new: true }
        );

        if (!invitation) return res.status(404).json({ error: "Invitation not found" });

        res.json({ message: "Invitation declined" });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/invitations/link — Generate a shareable invite link ──
router.post("/link", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { workspaceId, role, expiresIn } = req.body;

        if (!workspaceId) return res.status(400).json({ error: "workspaceId is required" });

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        // ENFORCE: inviteLinksEnabled — when OFF, block link generation
        const inviteLinksEnabled = workspace.privacySettings?.inviteLinksEnabled ?? true;
        if (!inviteLinksEnabled) {
            return res.status(403).json({ error: "Invite links are disabled for this workspace" });
        }

        // Verify ownership/admin
        const member = await WorkspaceMember.findOne({ workspaceId, userId });
        if (!member || !['owner', 'admin'].includes(member.role)) {
            return res.status(403).json({ error: "Only owners and admins can generate invite links" });
        }

        const inviter = await User.findOne({ clerkId: userId });

        // Calculate expiration
        let expiresAt = null;
        if (expiresIn) {
            const durations = { '1h': 3600000, '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
            const ms = durations[expiresIn];
            if (ms) expiresAt = new Date(Date.now() + ms);
        }

        const invitation = new WorkspaceInvitation({
            workspaceId,
            invitedByUserId: userId,
            invitedByName: inviter?.name || inviter?.email?.split('@')[0] || 'Someone',
            role: role || 'editor',
            workspaceName: workspace.name,
            expiresAt
        });

        const token = invitation.generateToken();
        await invitation.save();

        const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join/${token}`;

        res.status(201).json({ inviteUrl, token, expiresAt });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/invitations/join/:token — Join workspace via invite link ──
router.post("/join/:token", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { token } = req.params;

        const invitation = await WorkspaceInvitation.findOne({ token, status: 'pending' });
        if (!invitation) return res.status(404).json({ error: "Invalid or expired invite link" });

        if (invitation.isExpired()) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(410).json({ error: "This invite link has expired" });
        }

        // ENFORCE: inviteLinksEnabled — when OFF, block joining via link
        const workspace = await Workspace.findById(invitation.workspaceId);
        const inviteLinksEnabled = workspace?.privacySettings?.inviteLinksEnabled ?? true;
        if (!inviteLinksEnabled) {
            return res.status(403).json({ error: "Invite links have been disabled for this workspace" });
        }

        // Check if already a member
        const existing = await WorkspaceMember.findOne({ workspaceId: invitation.workspaceId, userId });
        if (existing) {
            return res.status(409).json({ error: "You are already a member of this workspace", workspaceId: invitation.workspaceId });
        }

        const user = await User.findOne({ clerkId: userId });

        // Create membership
        await WorkspaceMember.create({
            workspaceId: invitation.workspaceId,
            userId,
            email: user?.email || '',
            name: user?.name || user?.email?.split('@')[0] || 'User',
            avatar: user?.avatar || '',
            role: invitation.role,
            status: 'active'
        });

        // Note: don't mark link invitation as 'accepted' — links can be reused until expired
        // Unless it's an email-based invitation, mark it
        if (invitation.invitedEmail) {
            invitation.status = 'accepted';
            await invitation.save();
        }

        res.json({ message: "Joined workspace successfully", workspaceId: invitation.workspaceId });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "You are already a member of this workspace" });
        }
        next(error);
    }
});

module.exports = router;
