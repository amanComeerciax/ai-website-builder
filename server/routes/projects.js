const express = require("express")
const router = express.Router()
const Project = require("../models/Project")

// TODO: Add auth middleware after Clerk integration
// const { requireAuth } = require("../middleware/auth")

// ── GET /api/projects — List user's projects ──
router.get("/", async (req, res, next) => {
    try {
        // TODO: Use req.auth.userId after Clerk integration
        const userId = req.headers["x-user-id"] || "demo-user"

        const projects = await Project.find({ userId })
            .select("-files") // Don't send file contents in list view
            .sort({ createdAt: -1 })

        res.json({ projects })
    } catch (error) {
        next(error)
    }
})

// ── GET /api/projects/:id — Get project details ──
router.get("/:id", async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── POST /api/projects — Create a new project ──
router.post("/", async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"] || "demo-user"
        const { name, prompt, description } = req.body

        if (!name || !prompt) {
            return res.status(400).json({ error: "Name and prompt are required" })
        }

        const project = await Project.create({
            name,
            prompt,
            description: description || "",
            userId,
            status: "draft",
        })

        res.status(201).json({ project })
    } catch (error) {
        next(error)
    }
})

// ── PUT /api/projects/:id — Update project ──
router.put("/:id", async (req, res, next) => {
    try {
        const { name, description, files } = req.body

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: { name, description, files } },
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
router.delete("/:id", async (req, res, next) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id)
        if (!project) {
            return res.status(404).json({ error: "Project not found" })
        }
        res.json({ message: "Project deleted" })
    } catch (error) {
        next(error)
    }
})

module.exports = router
