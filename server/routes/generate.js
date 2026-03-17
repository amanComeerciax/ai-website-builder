const { generationQueue } = require('../services/queue.js');
const { QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
// Ensure worker is spawned when routes load
require('../workers/aiWorker.js');

const express = require("express")
const router = express.Router()

// ── POST /api/generate — Start AI generation ──
router.post("/", async (req, res, next) => {
    try {
        const { projectId, prompt } = req.body

        if (!projectId || !prompt) {
            return res.status(400).json({ error: "projectId and prompt are required" })
        }

        // Drop the generation request onto the background worker queue instantly
        const job = await generationQueue.add('generate-site', {
            prompt,
            projectId,
            userId: "local_test_user"
        });

        console.log(`[API Generate] Job ${job.id} dispatched to BullMQ for project ${projectId}`);

        res.status(202).json({
            message: "Generation queued securely in BullMQ",
            jobId: job.id,
            projectId,
        })
    } catch (error) {
        next(error)
    }
})

// ── GET /api/generate/stream/:jobId — SSE stream of generation progress ──
router.get("/stream/:jobId", async (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    // Create a dedicated Redis connection for QueueEvents
    const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
        maxRetriesPerRequest: null
    });

    const queueEvents = new QueueEvents('AI_Generation_Queue', { connection });

    let cleaned = false;

    // Cleanup function to prevent Redis connection leaks
    function cleanup() {
        if (cleaned) return;
        cleaned = true;
        clearInterval(keepAlive);
        queueEvents.close().catch(() => {});
        connection.disconnect();
        res.end();
    }

    // Keep-alive ping every 15 seconds to prevent browser/proxy timeouts
    const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
    }, 15000);

    // Listen for progress events from the AI worker
    queueEvents.on('progress', ({ jobId: id, data }) => {
        if (id === req.params.jobId) {
            // Forward the worker's progress event shape directly to SSE
            const eventName = data.event || 'progress';
            const payload = data.payload || data;
            res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
        }
    });

    // Listen for job completion
    queueEvents.on('completed', ({ jobId: id, returnvalue }) => {
        if (id === req.params.jobId) {
            // returnvalue is the JSON string of the worker's return value
            res.write(`event: complete\ndata: ${returnvalue || '"done"'}\n\n`);
            cleanup();
        }
    });

    // Listen for job failure
    queueEvents.on('failed', ({ jobId: id, failedReason }) => {
        if (id === req.params.jobId) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: failedReason })}\n\n`);
            cleanup();
        }
    });

    // Client disconnects → clean up
    req.on('close', cleanup);

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ jobId: req.params.jobId, status: 'listening' })}\n\n`);
})

// ── GET /api/generate/status/:jobId — Check generation status (legacy) ──
router.get("/status/:jobId", async (req, res, next) => {
    try {
        // TODO: Check BullMQ job status
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
