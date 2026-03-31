const { generationQueue } = require('../services/queue.js');
const { QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
// Ensure worker is spawned when routes load
require('../workers/aiWorker.js');
const { notifyCliRoomSwitch } = require('../services/websocket.js');

const mongoose = require('mongoose');
const Message = require('../models/Message');
const { verifyToken } = require("@clerk/express");

const express = require("express")
const router = express.Router()

/**
 * Auth middleware for generation route
 */
const clerkAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
    }
    try {
        const token = authHeader.split(' ')[1];
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });
        const userId = payload.sub;
        if (!userId) return res.status(401).json({ error: "Invalid token" });
        req.auth = { userId };
        next();
    } catch (error) {
        console.error('[ClerkAuth/Generate] Token verification failed:', error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// ── POST /api/generate — Start AI generation ──
router.post("/", clerkAuth, async (req, res, next) => {
    try {
        const { projectId, prompt, model, existingFiles } = req.body
        const userId = req.auth.userId;

        if (!projectId || !prompt) {
            return res.status(400).json({ error: "projectId and prompt are required" })
        }

        let assistantMessageId = null;

        // Only create DB messages if projectId is a valid MongoDB ObjectId
        const isValidObjectId = mongoose.Types.ObjectId.isValid(projectId) && projectId.length === 24;

        if (isValidObjectId) {
            // Document the user's prompt in the DB
            await Message.create({
                projectId,
                role: 'user',
                content: prompt,
                status: 'done'
            });

            // Create a pending slot for the Assistant's reply
            const assistantMsg = await Message.create({
                projectId,
                role: 'assistant',
                content: 'Generating your code...',
                status: 'pending'
            });
            assistantMessageId = assistantMsg._id;
        } else {
            console.log(`[API Generate] Skipping DB message creation — projectId "${projectId}" is not a valid ObjectId`);
        }

        // Drop the generation request onto the background worker queue instantly
        const job = await generationQueue.add('generate-site', {
            prompt,
            projectId,
            existingFiles,
            messageId: assistantMessageId,
            model: model || 'qwen',
            userId
        });

        // Auto-switch any CLI clients for this user to the new project room
        notifyCliRoomSwitch(userId, projectId);

        console.log(`[API Generate] Job ${job.id} dispatched for project ${projectId} (bound Msg ID: ${assistantMessageId})`);

        res.status(202).json({
            message: "Generation queued securely in BullMQ",
            jobId: job.id,
            projectId,
            messageId: assistantMessageId
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

    let isCleanedUp = false;

    // Cleanup function to prevent Redis connection leaks
    function cleanup() {
        if (isCleanedUp) return;
        isCleanedUp = true;
        clearInterval(keepAlive);
        queueEvents.close().catch(() => {});
        connection.disconnect();
        res.end();
    }

    // Keep-alive ping every 15 seconds to prevent browser/proxy timeouts
    const keepAlive = setInterval(() => {
        if (!isCleanedUp) res.write(': keep-alive\n\n');
    }, 15000);

    const jobId = req.params.jobId;

    // Listen for progress events from the AI worker
    queueEvents.on('progress', ({ jobId: id, data }) => {
        if (id === jobId && !isCleanedUp) {
            const eventName = data.event || 'progress';
            const payload = data.payload || data;
            res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
        }
    });

    // Listen for job completion
    queueEvents.on('completed', ({ jobId: id, returnvalue }) => {
        if (id === jobId && !isCleanedUp) {
            // BullMQ QueueEvents returns returnvalue as a JSON string already.
            // We must NOT double-stringify it. If it's an object, stringify it.
            // If it's already a string, check if it's valid JSON and use as-is.
            let sseData;
            if (typeof returnvalue === 'string') {
                // Already a JSON string from BullMQ — use directly
                sseData = returnvalue;
            } else if (typeof returnvalue === 'object' && returnvalue !== null) {
                sseData = JSON.stringify(returnvalue);
            } else {
                sseData = '"done"';
            }
            res.write(`event: complete\ndata: ${sseData}\n\n`);
            // Add a small delay before cleanup to ensure the buffer flushes
            setTimeout(cleanup, 500);
        }
    });

    // Listen for job failure
    queueEvents.on('failed', ({ jobId: id, failedReason }) => {
        if (id === jobId && !isCleanedUp) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: failedReason })}\n\n`);
            setTimeout(cleanup, 500);
        }
    });

    // Client disconnects → clean up
    req.on('close', cleanup);

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ jobId, status: 'listening' })}\n\n`);
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
