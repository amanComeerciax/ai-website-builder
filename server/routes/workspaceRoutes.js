const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Folder = require('../models/Folder');
const User = require('../models/User');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');

const router = express.Router();

// ── GET /api/workspaces — List user's workspaces (owned + member) ──
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        // Workspaces the user owns
        const ownedWorkspaces = await Workspace.find({ userId }).sort({ createdAt: 1 }).lean();
        
        // Lazy migration: ensure owner memberships exist for all owned workspaces
        for (const ws of ownedWorkspaces) {
            const existing = await WorkspaceMember.findOne({ workspaceId: ws._id, userId });
            if (!existing) {
                const user = await User.findOne({ clerkId: userId });
                await WorkspaceMember.create({
                    workspaceId: ws._id,
                    userId,
                    email: user?.email || '',
                    name: user?.name || user?.email?.split('@')[0] || 'Owner',
                    avatar: user?.avatar || '',
                    role: 'owner',
                    status: 'active'
                }).catch(() => {}); // ignore duplicate key errors
                console.log(`[Migration] Created owner membership for workspace ${ws._id}`);
            }
        }

        // Workspaces the user is a member of (but doesn't own)
        const memberships = await WorkspaceMember.find({ userId, status: 'active' }).lean();
        const memberWorkspaceIds = memberships
            .map(m => m.workspaceId)
            .filter(id => !ownedWorkspaces.some(w => w._id.toString() === id.toString()));
        
        const memberWorkspaces = memberWorkspaceIds.length > 0
            ? await Workspace.find({ _id: { $in: memberWorkspaceIds } }).lean()
            : [];
        
        // Tag each workspace with isOwner flag for the frontend
        const allWorkspaces = [
            ...ownedWorkspaces.map(w => ({ ...w, isOwner: true })),
            ...memberWorkspaces.map(w => ({ ...w, isOwner: false }))
        ];

        res.json({ workspaces: allWorkspaces });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/workspaces — Create a new workspace ──
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Workspace name is required" });
        }

        const user = await User.findOne({ clerkId: userId });
        const tier = user?.tier || user?.subscription?.tier || 'free';
        
        const workspace = await Workspace.create({ userId, name, plan: tier });
        
        // Auto-create owner membership
        await WorkspaceMember.create({
            workspaceId: workspace._id,
            userId,
            email: user?.email || '',
            name: user?.name || user?.email?.split('@')[0] || 'Owner',
            avatar: user?.avatar || '',
            role: 'owner',
            status: 'active'
        });

        res.status(201).json({ workspace: { ...workspace.toObject(), isOwner: true } });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/workspaces/:id — Rename a workspace ──
router.put("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Workspace name is required" });
        }

        const workspace = await Workspace.findOneAndUpdate(
            { _id: req.params.id, userId },
            { name },
            { new: true }
        );

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        res.json({ workspace });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/workspaces/:id — Delete a workspace ──
router.delete("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        // Don't allow deleting if it's their last workspace
        const workspaceCount = await Workspace.countDocuments({ userId });
        if (workspaceCount <= 1) {
            return res.status(400).json({ error: "Cannot delete your only workspace." });
        }

        const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, userId });
        
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Clean up all associated data
        await Promise.all([
            Project.deleteMany({ workspaceId: workspace._id }),
            Folder.deleteMany({ workspaceId: workspace._id }),
            WorkspaceMember.deleteMany({ workspaceId: workspace._id }),
            WorkspaceInvitation.deleteMany({ workspaceId: workspace._id })
        ]);

        res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
