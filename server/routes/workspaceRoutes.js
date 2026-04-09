const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Folder = require('../models/Folder');
const User = require('../models/User');

const router = express.Router();

// ── GET /api/workspaces — List user's workspaces ──
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const workspaces = await Workspace.find({ userId }).sort({ createdAt: 1 });
        res.json({ workspaces });
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

        // Get user's tier for record keeping but no limits for now
        const user = await User.findOne({ clerkId: userId });
        const tier = user?.tier || user?.subscription?.tier || 'free';
        
        const workspace = await Workspace.create({ userId, name, plan: tier });
        res.status(201).json({ workspace });
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

        // Permanently delete associated projects and folders
        await Project.deleteMany({ workspaceId: workspace._id });
        await Folder.deleteMany({ workspaceId: workspace._id });

        res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
