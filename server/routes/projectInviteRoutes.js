const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const ProjectInvitation = require('../models/ProjectInvitation');
const Project = require('../models/Project');
const User = require('../models/User');
const WorkspaceMember = require('../models/WorkspaceMember');
const Workspace = require('../models/Workspace');
const { sendProjectInvitationEmail } = require('../services/emailService');

const router = express.Router();

// ── POST /api/projects/:projectId/invitations — Invite by email to a project ──
router.post("/:projectId/invitations", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { projectId } = req.params;
        const { email, role } = req.body;

        if (!email) return res.status(400).json({ error: "Email is required" });

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        // Check: must be project owner or workspace admin
        const isOwner = project.userId === userId;
        let isWsAdmin = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId, status: 'active' });
            if (member && ['owner', 'admin'].includes(member.role)) isWsAdmin = true;
        }
        if (!isOwner && !isWsAdmin) {
            return res.status(403).json({ error: "Only the project owner or workspace admins can invite collaborators" });
        }

        const inviter = await User.findOne({ clerkId: userId });
        const inviterName = inviter?.name || inviter?.email?.split('@')[0] || 'Someone';

        // Check if already a collaborator
        const existing = project.collaborators?.find(c => c.email === email.toLowerCase());
        if (existing) return res.status(409).json({ error: "User is already a collaborator" });

        // Check existing pending invitation
        const existingInvite = await ProjectInvitation.findOne({
            projectId, invitedEmail: email.toLowerCase(), status: 'pending'
        });
        if (existingInvite) {
            // If it's expired, clean it up so owner can reinvite
            if (existingInvite.isExpired()) {
                await ProjectInvitation.deleteOne({ _id: existingInvite._id });
            } else {
                return res.status(409).json({ error: "Invitation already pending for this email" });
            }
        }

        // Create invitation record WITH a token (so email link works)
        const invitation = new ProjectInvitation({
            projectId,
            workspaceId: project.workspaceId,
            invitedByUserId: userId,
            invitedByName: inviterName,
            projectName: project.name,
            invitedEmail: email.toLowerCase(),
            role: role || 'editor',
            status: 'pending',
            // Email invites expire in 7 days
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        const token = invitation.generateToken();
        await invitation.save();

        // Fire email — recipient gets same-style invite as workspace invite
        const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/project-invite/${token}`;
        sendProjectInvitationEmail({
            to: email.toLowerCase(),
            inviterName,
            projectName: project.name,
            role: role || 'editor',
            inviteUrl
        }).catch(err => console.error('[ProjectInvite] Email send failed:', err.message));

        res.status(201).json({ invitation: invitation.toObject() });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/:projectId/invitations — List project collaborators + pending invites ──
router.get("/:projectId/invitations", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { projectId } = req.params;

        const project = await Project.findById(projectId).lean();
        if (!project) return res.status(404).json({ error: "Project not found" });

        // Must have access
        const isOwner = project.userId === userId;
        const isCollaborator = project.collaborators?.some(c => c.userId === userId);
        let isWsMember = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId, status: 'active' });
            if (member) isWsMember = true;
        }
        if (!isOwner && !isCollaborator && !isWsMember) {
            return res.status(403).json({ error: "Access denied" });
        }

        const pendingRaw = await ProjectInvitation.find({ projectId, status: 'pending' }).lean();
        const collaborators = project.collaborators || [];

        // Filter out expired invites + mark them expired in background
        const now = new Date();
        const pending = pendingRaw.filter(inv => {
            if (inv.expiresAt && now > new Date(inv.expiresAt)) {
                ProjectInvitation.updateOne({ _id: inv._id }, { status: 'expired' }).exec();
                return false;
            }
            return true;
        });

        // Get owner info
        const owner = await User.findOne({ clerkId: project.userId });

        // Enrich collaborators with their workspace name for display
        const enrichedCollabs = await Promise.all((collaborators).map(async c => {
            const collabUser = await User.findOne({ clerkId: c.userId });
            let workspaceName = 'Workspace';
            const collabMember = await WorkspaceMember.findOne({ userId: c.userId, status: 'active' });
            if (collabMember) {
                const ws = await Workspace.findById(collabMember.workspaceId);
                if (ws) workspaceName = ws.name;
            }
            return { ...c, userDisplayName: collabUser?.name || c.name || c.email, workspaceName };
        }));

        res.json({
            collaborators: enrichedCollabs,
            pendingInvitations: pending,
            isOwner: project.userId === userId,
            owner: {
                userId: project.userId,
                name: owner?.name || owner?.email?.split('@')[0] || 'Owner',
                email: owner?.email || '',
                avatar: owner?.avatar || ''
            }
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects/:projectId/invitations/link — Generate project invite link (8hr expiry) ──
router.post("/:projectId/invitations/link", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { projectId } = req.params;
        const { role } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: "Project not found" });

        const isOwner = project.userId === userId;
        let isWsAdmin = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId, status: 'active' });
            if (member && ['owner', 'admin'].includes(member.role)) isWsAdmin = true;
        }
        if (!isOwner && !isWsAdmin) {
            return res.status(403).json({ error: "Only owners/admins can generate invite links" });
        }

        const inviter = await User.findOne({ clerkId: userId });

        // 8 hours expiry
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

        const invitation = new ProjectInvitation({
            projectId,
            workspaceId: project.workspaceId,
            invitedByUserId: userId,
            invitedByName: inviter?.name || inviter?.email?.split('@')[0] || 'Someone',
            projectName: project.name,
            role: role || 'editor',
            expiresAt
        });

        const token = invitation.generateToken();
        await invitation.save();

        const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/project-invite/${token}`;

        res.status(201).json({ inviteUrl, token, expiresAt });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/invite/:token — Get invite info (public, no auth needed to VIEW) ──
router.get("/invite/:token", async (req, res, next) => {
    try {
        const { token } = req.params;
        const invitation = await ProjectInvitation.findOne({ token, status: 'pending' });

        if (!invitation) return res.status(404).json({ error: "Invalid or expired invite link" });

        if (invitation.isExpired()) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(410).json({ error: "This invite link has expired" });
        }

        res.json({
            projectName: invitation.projectName,
            invitedByName: invitation.invitedByName,
            role: invitation.role,
            expiresAt: invitation.expiresAt
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects/invite/:token/accept — Accept project invite ──
router.post("/invite/:token/accept", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { token } = req.params;

        const invitation = await ProjectInvitation.findOne({ token, status: 'pending' });
        if (!invitation) return res.status(404).json({ error: "Invalid or expired invite link" });

        if (invitation.isExpired()) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(410).json({ error: "This invite link has expired" });
        }

        const project = await Project.findById(invitation.projectId);
        if (!project) return res.status(404).json({ error: "Project no longer exists" });

        // Check if already a collaborator
        const alreadyCollab = project.collaborators?.some(c => c.userId === userId);
        const user = await User.findOne({ clerkId: userId });

        if (alreadyCollab || project.userId === userId) {
            invitation.acceptedByUserId = userId;
            invitation.status = 'accepted';
            await invitation.save();
            
            await ProjectInvitation.updateMany(
                { projectId: invitation.projectId, invitedEmail: user?.email?.toLowerCase(), status: 'pending' },
                { status: 'accepted' }
            );

            const errMessage = alreadyCollab ? "You are already a collaborator on this project" : "You are the owner of this project";
            return res.status(409).json({ error: errMessage, projectId: project._id });
        }


        // Add as collaborator
        project.collaborators = project.collaborators || [];
        project.collaborators.push({
            userId,
            email: user?.email || '',
            name: user?.name || user?.email?.split('@')[0] || 'User',
            avatar: user?.avatar || '',
            role: invitation.role,
            joinedAt: new Date()
        });
        await project.save();

        // Mark this invitation as accepted
        invitation.acceptedByUserId = userId;
        invitation.status = 'accepted';
        await invitation.save();

        // Also clean up any OTHER pending email invites for this user on this project (deduplicate)
        await ProjectInvitation.updateMany(
            { projectId: invitation.projectId, invitedEmail: user?.email?.toLowerCase(), status: 'pending' },
            { status: 'accepted' }
        );

        res.json({
            message: "You've joined the project!",
            projectId: project._id,
            projectName: project.name
        });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects/invite/:token/decline — Decline project invite ──
router.post("/invite/:token/decline", requireAuth, async (req, res, next) => {
    try {
        const { token } = req.params;
        const invitation = await ProjectInvitation.findOne({ token, status: 'pending' });
        if (!invitation) return res.status(404).json({ error: "Invitation not found" });
        invitation.status = 'declined';
        await invitation.save();
        res.json({ message: "Invitation declined" });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/shared-with-me — Projects where current user is a collaborator ──
router.get("/shared-with-me", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });
        const email = user?.email?.toLowerCase();
        
        const query = {
            $or: [
                { 'collaborators.userId': userId }
            ]
        };
        if (email) {
            query.$or.push({ 'collaborators.email': email });
        }
        
        const projects = await Project.find(query).lean();
        res.json({ projects });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/projects/:projectId/invitations/:invitationId — Revoke an invitation ──
router.delete("/:projectId/invitations/:invitationId", requireAuth, async (req, res, next) => {
    try {
        const requesterId = req.auth.userId;
        const { projectId, invitationId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Only owner or workspace admin can revoke invitations
        const isOwner = project.userId === requesterId;
        let isWsAdmin = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId: requesterId, status: 'active' });
            if (member && ['owner', 'admin'].includes(member.role)) isWsAdmin = true;
        }
        if (!isOwner && !isWsAdmin) return res.status(403).json({ error: 'Permission denied' });

        await ProjectInvitation.findByIdAndDelete(invitationId);
        res.json({ message: 'Invitation revoked' });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/projects/:projectId/invitations/:invitationId — Update an invitation role ──
router.put("/:projectId/invitations/:invitationId", requireAuth, async (req, res, next) => {
    try {
        const requesterId = req.auth.userId;
        const { projectId, invitationId } = req.params;
        const { role } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const isOwner = project.userId === requesterId;
        let isWsAdmin = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId: requesterId, status: 'active' });
            if (member && ['owner', 'admin'].includes(member.role)) isWsAdmin = true;
        }
        if (!isOwner && !isWsAdmin) return res.status(403).json({ error: 'Permission denied' });

        const invitation = await ProjectInvitation.findById(invitationId);
        if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

        invitation.role = role;
        await invitation.save();

        res.json({ message: 'Invitation role updated' });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/projects/:projectId/collaborators/:userId — Remove a collaborator ──
router.delete("/:projectId/collaborators/:collaboratorUserId", requireAuth, async (req, res, next) => {
    try {
        const requesterId = req.auth.userId;
        const { projectId, collaboratorUserId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Only owner or workspace admin can remove collaborators
        const isOwner = project.userId === requesterId;
        let isWsAdmin = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId: requesterId, status: 'active' });
            if (member && ['owner', 'admin'].includes(member.role)) isWsAdmin = true;
        }
        if (!isOwner && !isWsAdmin) return res.status(403).json({ error: 'Permission denied' });

        project.collaborators = (project.collaborators || []).filter(c => 
            (c.userId && c.userId !== collaboratorUserId) || 
            (!c.userId && c.email !== collaboratorUserId) // support email as ID for users who haven't logged in
        );
        await project.save();

        res.json({ message: 'Collaborator removed' });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/projects/:projectId/collaborators/:userId — Update collaborator role ──
router.put("/:projectId/collaborators/:collaboratorUserId", requireAuth, async (req, res, next) => {
    try {
        const requesterId = req.auth.userId;
        const { projectId, collaboratorUserId } = req.params;
        const { role } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Only owner or workspace admin can modify collaborators
        const isOwner = project.userId === requesterId;
        let isWsAdmin = false;
        if (project.workspaceId) {
            const member = await WorkspaceMember.findOne({ workspaceId: project.workspaceId, userId: requesterId, status: 'active' });
            if (member && ['owner', 'admin'].includes(member.role)) isWsAdmin = true;
        }
        if (!isOwner && !isWsAdmin) return res.status(403).json({ error: 'Permission denied' });

        let found = false;
        if (project.collaborators) {
            for (let c of project.collaborators) {
                if ((c.userId && c.userId === collaboratorUserId) || (!c.userId && c.email === collaboratorUserId)) {
                    c.role = role;
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) return res.status(404).json({ error: 'Collaborator not found' });
        
        // Mongoose needs this if modifying nested array directly without markModified, but since we used direct reference it should be okay. To be safe:
        project.markModified('collaborators');
        await project.save();

        res.json({ message: 'Collaborator role updated' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
