const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const Workspace = require('../models/Workspace');

const router = express.Router();

// ── GET /api/workspaces/:id/members — List all members ──
router.get("/:id/members", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const workspaceId = req.params.id;

        // Verify caller is a member
        const callerMember = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
        if (!callerMember) {
            return res.status(403).json({ error: "You are not a member of this workspace" });
        }

        const members = await WorkspaceMember.find({ workspaceId }).sort({ joinedAt: 1 }).lean();
        
        res.json({ members, callerRole: callerMember.role });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/workspaces/:id/members/:memberId/role — Change member role ──
router.put("/:id/members/:memberId/role", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id: workspaceId, memberId } = req.params;
        const { role } = req.body;

        if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
            return res.status(400).json({ error: "Invalid role. Must be admin, editor, or viewer." });
        }

        // Verify caller is owner
        const callerMember = await WorkspaceMember.findOne({ workspaceId, userId });
        if (!callerMember || callerMember.role !== 'owner') {
            return res.status(403).json({ error: "Only the workspace owner can change roles" });
        }

        // Can't change the owner's own role
        const targetMember = await WorkspaceMember.findById(memberId);
        if (!targetMember) return res.status(404).json({ error: "Member not found" });
        if (targetMember.role === 'owner') {
            return res.status(400).json({ error: "Cannot change the owner's role" });
        }

        targetMember.role = role;
        await targetMember.save();

        res.json({ member: targetMember });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/workspaces/:id/members/:memberId — Kick/remove a member ──
router.delete("/:id/members/:memberId", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id: workspaceId, memberId } = req.params;

        // Verify caller is owner or admin
        const callerMember = await WorkspaceMember.findOne({ workspaceId, userId });
        if (!callerMember || !['owner', 'admin'].includes(callerMember.role)) {
            return res.status(403).json({ error: "Only owners and admins can remove members" });
        }

        const targetMember = await WorkspaceMember.findById(memberId);
        if (!targetMember) return res.status(404).json({ error: "Member not found" });
        
        // Can't remove the owner
        if (targetMember.role === 'owner') {
            return res.status(400).json({ error: "Cannot remove the workspace owner" });
        }

        // Admin can't remove another admin (only owner can)
        if (targetMember.role === 'admin' && callerMember.role !== 'owner') {
            return res.status(403).json({ error: "Only the owner can remove admins" });
        }

        await WorkspaceMember.findByIdAndDelete(memberId);

        res.json({ message: "Member removed" });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/workspaces/:id/members/:memberId/block — Block a member ──
router.put("/:id/members/:memberId/block", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { id: workspaceId, memberId } = req.params;

        // Only owner can block
        const callerMember = await WorkspaceMember.findOne({ workspaceId, userId });
        if (!callerMember || callerMember.role !== 'owner') {
            return res.status(403).json({ error: "Only the workspace owner can block members" });
        }

        const targetMember = await WorkspaceMember.findById(memberId);
        if (!targetMember) return res.status(404).json({ error: "Member not found" });
        if (targetMember.role === 'owner') {
            return res.status(400).json({ error: "Cannot block the workspace owner" });
        }

        // Toggle block/unblock
        targetMember.status = targetMember.status === 'blocked' ? 'active' : 'blocked';
        await targetMember.save();

        res.json({ member: targetMember, message: `Member ${targetMember.status === 'blocked' ? 'blocked' : 'unblocked'}` });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/workspaces/:id/invitations — List pending invitations for a workspace ──
router.get("/:id/invitations", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const workspaceId = req.params.id;

        // Verify caller is a member
        const callerMember = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
        if (!callerMember) {
            return res.status(403).json({ error: "You are not a member of this workspace" });
        }

        const invitations = await WorkspaceInvitation.find({ 
            workspaceId, 
            status: 'pending' 
        }).sort({ createdAt: -1 }).lean();

        res.json({ invitations });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
