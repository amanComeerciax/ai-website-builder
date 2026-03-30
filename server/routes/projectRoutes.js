const express = require("express")
const router = express.Router()
const Project = require("../models/Project")
const Message = require("../models/Message")

const { requireAuth } = require('../middleware/requireAuth');

// ── GET /api/projects — List user's projects ──
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId;
        const projects = await Project.find({ userId }).sort({ createdAt: -1 });
        res.json({ projects });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects — Create a new workspace ──
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId;
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
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId
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
router.put("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId
        const { name, previewUrl, netlifySiteId, activeVersionId } = req.body
 
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { $set: { name, previewUrl, netlifySiteId, activeVersionId } },
            { returnDocument: 'after', runValidators: true }
        )

        if (!project) return res.status(404).json({ error: "Project not found" })
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── PATCH /api/projects/:id/config — Update style configuration ──
router.patch("/:id/config", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId
        const { theme, websiteName, description, logoUrl, brandColors, isConfigured } = req.body

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { 
                $set: { 
                    theme, 
                    websiteName, 
                    description, 
                    logoUrl, 
                    brandColors, 
                    isConfigured 
                } 
            },
            { returnDocument: 'after', runValidators: true }
        )

        if (!project) return res.status(404).json({ error: "Project not found" })
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── PUT /api/projects/:id/star — Toggle star status ──
router.put("/:id/star", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId;
        const project = await Project.findOne({ _id: req.params.id, userId });
        
        if (!project) return res.status(404).json({ error: "Project not found" });

        project.isStarred = !project.isStarred;
        await project.save();
        
        res.json({ project });
    } catch (error) {
        next(error);
    }
})

// ── DELETE /api/projects/:id — Delete workspace ──
router.delete("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.clerkId
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId })
        if (!project) return res.status(404).json({ error: "Project not found" })
        
        // Cascade delete messages
        await Message.deleteMany({ projectId: project._id });
        
        res.json({ message: "Workspace deleted" })
    } catch (error) {
        next(error)
    }
})

// ── POST /api/projects/:id/messages — Add a message to a workspace ──
router.post("/:id/messages", requireAuth, async (req, res, next) => {
    try {
        const { content, role } = req.body;
        if (!content || !role) {
            return res.status(400).json({ error: "content and role are required" });
        }
        const message = await Message.create({
            projectId: req.params.id,
            role,
            content,
            status: 'done'
        });
        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
});

module.exports = router
