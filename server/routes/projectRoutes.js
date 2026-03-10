const express = require("express")
const router = express.Router()
const authMiddleware = require("../middleware/authMiddleware");
const { createProject, getUserProjects } = require("../controllers/projectController");
const Project = require("../models/Project")

// ── GET /api/projects — List user's projects ──
router.get("/", authMiddleware, getUserProjects);

// ── POST /api/projects — Create a new project ──
router.post("/", authMiddleware, createProject);

// ── GET /api/projects/:id — Get project details ──
router.get("/:id", authMiddleware, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const project = await Project.findOne({ _id: req.params.id, userId })
        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── PUT /api/projects/:id — Update project ──
router.put("/:id", authMiddleware, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const { businessName, businessType, description, services, themeColor, files } = req.body

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { $set: { businessName, businessType, description, services, themeColor, files } },
            { new: true, runValidators: true }
        )

        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }

        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── DELETE /api/projects/:id — Delete project ──
router.delete("/:id", authMiddleware, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const project = await Project.findOneAndDelete({ _id: req.params.id, userId })
        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }
        res.json({ message: "Project deleted" })
    } catch (error) {
        next(error)
    }
})

module.exports = router
