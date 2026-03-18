const express = require("express")
const router = express.Router()
const Project = require("../models/Project")
const Message = require("../models/Message")

// Mock Auth wrapper for now until Clerk is fully engaged
const mockUser = (req, res, next) => {
    req.auth = { userId: "local_test_user" };
    next();
};

// ── GET /api/projects — List user's projects ──
router.get("/", mockUser, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const projects = await Project.find({ userId }).sort({ createdAt: -1 });
        res.json({ projects });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects — Create a new workspace ──
router.post("/", mockUser, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const project = await Project.create({
            userId,
            name: req.body.name || 'Untitled Project',
            status: 'idle'
        });
        res.status(201).json({ project });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/:id — Get full workspace context (HYDRATION) ──
router.get("/:id", mockUser, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const project = await Project.findOne({ _id: req.params.id, userId })
        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }
        
        // Hydrate all messages for this project
        const messages = await Message.find({ projectId: project._id }).sort('createdAt');
        
        res.json({ project, messages })
    } catch (error) {
        next(error)
    }
})

// ── PUT /api/projects/:id — Rename or update workspace ──
router.put("/:id", mockUser, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const { name, previewUrl, netlifySiteId, activeVersionId } = req.body

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { $set: { name, previewUrl, netlifySiteId, activeVersionId } },
            { new: true, runValidators: true }
        )

        if (!project) return res.status(404).json({ error: "Project not found" })
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── DELETE /api/projects/:id — Delete workspace ──
router.delete("/:id", mockUser, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId })
        if (!project) return res.status(404).json({ error: "Project not found" })
        
        // Cascade delete messages
        await Message.deleteMany({ projectId: project._id });
        
        res.json({ message: "Workspace deleted" })
    } catch (error) {
        next(error)
    }
})

module.exports = router
