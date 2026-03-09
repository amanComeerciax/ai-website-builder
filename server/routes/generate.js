const express = require("express")
const router = express.Router()

// ── POST /api/generate — Start AI generation ──
router.post("/", async (req, res, next) => {
    try {
        const { projectId, prompt } = req.body

        if (!projectId || !prompt) {
            return res.status(400).json({ error: "projectId and prompt are required" })
        }

        // TODO: Add to BullMQ queue (Day 15)
        // For now, return a placeholder response
        res.json({
            message: "Generation queued",
            jobId: `job_${Date.now()}`,
            projectId,
        })
    } catch (error) {
        next(error)
    }
})

// ── GET /api/generate/status/:jobId — Check generation status ──
router.get("/status/:jobId", async (req, res, next) => {
    try {
        // TODO: Check BullMQ job status (Day 18)
        res.json({
            jobId: req.params.jobId,
            status: "pending",
            progress: 0,
            message: "Waiting to start...",
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router
