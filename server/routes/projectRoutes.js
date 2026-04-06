const express = require("express")
const router = express.Router()
const Project = require("../models/Project")
const Message = require("../models/Message")
const Version = require("../models/Version")
const { generateProjectName } = require('../utils/nameGenerator.js');

const { requireAuth } = require('../middleware/requireAuth');

// ── GET /api/projects — List user's projects ──
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const projects = await Project.find({ userId }).sort({ createdAt: -1 });
        res.json({ projects });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects — Create a new workspace ──
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const userPrompt = req.body.prompt || req.body.name || '';
        
        // AI-generated creative name (falls back to cleaned prompt if Groq fails)
        const projectName = await generateProjectName(userPrompt);
        
        const project = await Project.create({
            userId,
            name: projectName,
            status: 'idle',
            folderId: req.body.folderId || null
        });
        res.status(201).json({ project });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/:id — Get full workspace context (HYDRATION) ──
router.get("/:id", requireAuth, async (req, res, next) => {
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
router.put("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const { name, previewUrl, netlifySiteId, activeVersionId, folderId } = req.body
        
        const updateData = { name, previewUrl, netlifySiteId, activeVersionId }
        if (folderId !== undefined) {
            updateData.folderId = folderId
        }
 
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { $set: updateData },
            { new: true, runValidators: true }
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
        const userId = req.auth.userId
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
            { new: true, runValidators: true }
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
        const userId = req.auth.userId;
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
// ── GET /api/projects/:id/versions — Get history of project versions ──
router.get("/:id/versions", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const project = await Project.findOne({ _id: req.params.id, userId });
        
        if (!project) return res.status(404).json({ error: "Project not found" });
        
        // Exclude the heavy fileTree field for the list view
        const versions = await Version.find({ projectId: project._id })
            .select('-fileTree')
            .sort({ createdAt: -1 });
            
        res.json({ versions, activeVersionId: project.activeVersionId });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects/:id/versions/:versionId/restore — Restore a specific version ──
router.post("/:id/versions/:versionId/restore", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const project = await Project.findOne({ _id: req.params.id, userId });
        
        if (!project) return res.status(404).json({ error: "Project not found" });
        
        const version = await Version.findOne({ _id: req.params.versionId, projectId: project._id });
        if (!version) return res.status(404).json({ error: "Version not found" });
        
        project.currentFileTree = version.fileTree;
        project.activeVersionId = version._id;
        await project.save();
        
        res.json({ message: "Restored successfully", project });
    } catch (error) {
        next(error);
    }
});

module.exports = router
