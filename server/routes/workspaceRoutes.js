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

// ── PUT /api/workspaces/:id — Update workspace (name, handle, avatar) ──
router.put("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { name, handle, avatar } = req.body;
        
        // Must be owner or admin
        const member = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId });
        if (!member || !['owner', 'admin'].includes(member.role)) {
            return res.status(403).json({ error: "Only owners and admins can update workspace settings" });
        }

        const updateData = {};
        if (name && name.trim()) updateData.name = name.trim();
        if (avatar !== undefined) updateData.avatar = avatar;
        
        // Handle update with uniqueness check
        if (handle !== undefined) {
            const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
            if (cleanHandle) {
                const existing = await Workspace.findOne({ handle: cleanHandle, _id: { $ne: req.params.id } });
                if (existing) {
                    return res.status(409).json({ error: "This handle is already taken" });
                }
                updateData.handle = cleanHandle;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        const workspace = await Workspace.findOneAndUpdate(
            { _id: req.params.id },
            updateData,
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

// ── POST /api/workspaces/:id/avatar — Upload workspace avatar (base64) ──
router.post("/:id/avatar", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { avatar } = req.body; // base64 string

        const member = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId });
        if (!member || !['owner', 'admin'].includes(member.role)) {
            return res.status(403).json({ error: "Only owners and admins can update the workspace avatar" });
        }

        if (!avatar) {
            return res.status(400).json({ error: "Avatar data is required" });
        }

        const workspace = await Workspace.findByIdAndUpdate(
            req.params.id,
            { avatar },
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

// ── GET /api/workspaces/:id/privacy — Get workspace privacy settings ──
router.get("/:id/privacy", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        // Must be a member of this workspace
        const member = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId, status: 'active' });
        if (!member) {
            return res.status(403).json({ error: "You are not a member of this workspace" });
        }

        const workspace = await Workspace.findById(req.params.id).lean();
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Return settings with defaults for workspaces that haven't configured them yet
        const defaults = {
            defaultProjectVisibility: 'workspace',
            defaultWebsiteAccess: 'anyone',
            restrictInvitations: false,
            allowEditorsTransfer: false,
            inviteLinksEnabled: true,
            whoCanPublish: 'editors',
            allowPreviewSharing: true,
            crossProjectSharing: true
        };

        const settings = { ...defaults, ...(workspace.privacySettings || {}) };

        res.json({ settings, memberRole: member.role });
    } catch (error) {
        next(error);
    }
});

// ── PUT /api/workspaces/:id/privacy — Update workspace privacy settings ──
router.put("/:id/privacy", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        // Must be owner or admin
        const member = await WorkspaceMember.findOne({ workspaceId: req.params.id, userId, status: 'active' });
        if (!member || !['owner', 'admin'].includes(member.role)) {
            return res.status(403).json({ error: "Only owners and admins can update privacy settings" });
        }

        const allowedFields = [
            'defaultProjectVisibility', 'defaultWebsiteAccess', 'restrictInvitations',
            'allowEditorsTransfer', 'inviteLinksEnabled', 'whoCanPublish',
            'allowPreviewSharing', 'crossProjectSharing'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[`privacySettings.${field}`] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid settings to update" });
        }

        const workspace = await Workspace.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        );

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        res.json({ settings: workspace.privacySettings });
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

// ── GET /api/workspaces/:id/project-collaborators — All project collaborators in this workspace ──
router.get("/:id/project-collaborators", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const workspaceId = req.params.id;

        // Must be a member
        const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
        if (!member) return res.status(403).json({ error: "Access denied" });

        // Load all projects in this workspace that have collaborators
        const projects = await Project.find({ workspaceId, 'collaborators.0': { $exists: true } }).lean();

        // Flatten to {projectId, projectName, collaborator}
        const collaborators = [];
        for (const project of projects) {
            for (const collab of (project.collaborators || [])) {
                collaborators.push({
                    projectId: project._id.toString(),
                    projectName: project.name,
                    collaborator: collab
                });
            }
        }

        res.json({ collaborators });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
