const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

// ── GET /api/health — Server health check ──
router.get("/", async (req, res) => {
    const dbState = mongoose.connection.readyState
    const dbStatus = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" }

    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus[dbState] || "unknown",
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
    })
})

module.exports = router
