const express = require("express")
const router = express.Router()
const Project = require("../models/Project")
const Message = require("../models/Message")
const Version = require("../models/Version")
const Template = require("../models/Template")

// Mock Auth wrapper for now until Clerk is fully engaged
const mockUser = (req, res, next) => {
    // CLI Bypass
    if (req.headers['x-cli-token'] === 'stackforge-dev-cli') {
        req.auth = { userId: "local_test_user" };
        return next();
    }
    
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
        const { name, folderId, templateId } = req.body;
        
        // Handle Template Instantiation
        if (templateId) {
            const template = await Template.findById(templateId);
            if (!template) return res.status(404).json({ error: "Template not found" });

            // Build the files dictionary for the frontend editor (path -> content)
            const templateFiles = {};
            template.files.forEach(f => {
                if (!f.isFolder) templateFiles[f.path] = f.content;
            });

            // Create project WITH file tree (Schema.Types.Mixed now supports dotted keys)
            const project = await Project.create({
                userId,
                name: name || template.name,
                status: 'done', // BYPASS AI QUEUE — instant load
                folderId: folderId || null,
                techStack: template.track,
                currentFileTree: templateFiles
            });

            // Log initial message
            await Message.create({
                projectId: project._id,
                role: 'user',
                content: `Started building using the ${template.name} template.`,
                status: 'done'
            });

            // Return project + raw files so the frontend can load them into the editor VFS
            return res.status(201).json({ 
                project, 
                templateFiles,
                outputTrack: template.track,
                previewType: template.track === 'html' ? 'srcdoc' : 'sandpack'
            });
        }

        // Handle Empty Normal Project
        const project = await Project.create({
            userId,
            name: name || 'Untitled Project',
            status: 'idle',
            folderId: folderId || null
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

// ── GET /api/projects/:id/files — Get project files for CLI pull ──
router.get("/:id/files", mockUser, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const project = await Project.findOne({ _id: req.params.id, userId });
        
        if (!project) return res.status(404).json({ error: "Project not found" });
        
        res.json({ files: project.currentFileTree || {} });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/:id/versions — Get history of project versions ──
router.get("/:id/versions", mockUser, async (req, res, next) => {
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
router.post("/:id/versions/:versionId/restore", mockUser, async (req, res, next) => {
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

// ── POST /api/projects/:id/messages — Add a message to a workspace ──
router.post("/:id/messages", mockUser, async (req, res, next) => {
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
