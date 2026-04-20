const { generationQueue } = require('../services/queue.js');
const { QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const { getThemeList } = require('../config/themeRegistry.js');
// Ensure worker is spawned when routes load
require('../workers/aiWorker.js');

const mongoose = require('mongoose');
const Message = require('../models/Message');
const Project = require('../models/Project');
const WorkspaceMember = require('../models/WorkspaceMember');

const express = require("express")
const router = express.Router()

// ── GET /api/generate/themes — Return available themes for the frontend picker ──
router.get("/themes", (req, res) => {
    res.json({ themes: getThemeList() });
})

// ── POST /api/generate/suggest-category — AI inference for matching prompts to template categories ──
router.post("/suggest-category", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "prompt is required" });

        const ALLOWED_CATEGORIES = [
            "blog", "coffee-shop", "fashion", "landing", 
            "portfolio", "restaurant", "saas", "service", "wellness"
        ];

        // We use Llama via Groq for high-speed simple matching (or Gem fast fallback)
        const systemPrompt = `You are an expert intent classifier for a website builder. Map the user's prompt to EXACTLY ONE of the following precise template categories to ensure they get the best layout structure: ${ALLOWED_CATEGORIES.join(", ")}.

Rules:
1. If the user mentions 'shop', 'cart', 'buy', or 'store', classify as: ecommerce (if available) or landing.
2. If the user mentions 'dashboard', 'app', 'software', or 'login', classify as: saas
3. If they mention their own work, 'gallery', 'resume', or 'showcase', classify as: portfolio
4. If they mention food, cake, cafe, dining, bakery, classify as: coffee-shop or restaurant
5. DO NOT explain your reasoning.
6. ONLY reply with the single exact word from the list above.`;

        const { callModel } = require('../services/modelRouter.js');
        const response = await callModel('template_selector', prompt, systemPrompt, { forceModel: 'groq' });
        const responseText = response.content;
        
        let predictedCategory = "all"; // fallback
        // Clean response but keep hyphens to allow 'coffee-shop'
        const cleanResponse = responseText.toLowerCase().replace(/[^a-z-]/g, "");
        if (ALLOWED_CATEGORIES.includes(cleanResponse)) {
            predictedCategory = cleanResponse;
        }

        res.json({ category: predictedCategory });
    } catch (err) {
        console.error("[generate /suggest-category]", err);
        // Fallback to "all" if the AI call fails or rate limits
        res.json({ category: "all" });
    }
});

// ── POST /api/generate — Start AI generation ──
router.post("/", async (req, res, next) => {
    try {
        const { 
            projectId, prompt, model, existingFiles,
            // New fields for enhanced pipeline
            theme, websiteName, description, logoUrl, brandColors,
            // Template selection from the user
            templateId, category,
            // Attachment data
            images, fileContents
        } = req.body

        if (!projectId || !prompt) {
            return res.status(400).json({ error: "projectId and prompt are required" })
        }

        // RBAC: if this project belongs to a workspace, verify user has edit rights
        const isValidObjectId = mongoose.Types.ObjectId.isValid(projectId) && projectId.length === 24;
        if (isValidObjectId) {
            const project = await Project.findById(projectId);
            if (project && project.workspaceId) {
                const userId = req.auth?.userId;
                if (userId) {
                    const member = await WorkspaceMember.findOne({ 
                        workspaceId: project.workspaceId, userId, status: 'active' 
                    });
                    if (member && member.role === 'viewer') {
                        return res.status(403).json({ error: "Viewers cannot generate code. Contact the workspace owner for edit access." });
                    }
                }
            }
        }

        let assistantMessageId = null;

        // Only create DB messages if projectId is a valid MongoDB ObjectId
        // (isValidObjectId already declared above for RBAC check)

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
            model: model || 'mistral',
            userId: "local_test_user",
            // Attachment data
            images: images || [],
            fileContents: fileContents || [],
            // Pass enhanced pipeline options to the worker
            enhanceOptions: {
                theme: theme || 'modern-dark',
                websiteName: websiteName || null,
                description: description || null,
                logoUrl: logoUrl || null,
                brandColors: brandColors || null,
                templateId: templateId || null,
                category: category || null,
            }
        });

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
            // BullMQ v5: returnvalue can be an Object, a JSON string, or undefined.
            // We must ensure we send a valid JSON string to SSE exactly once.
            let stringifiedData;
            if (typeof returnvalue === 'string') {
                // Already a string — check if it's valid JSON, if so use directly
                try {
                    JSON.parse(returnvalue); // validate
                    stringifiedData = returnvalue;
                } catch {
                    stringifiedData = JSON.stringify({ summary: returnvalue });
                }
            } else if (returnvalue && typeof returnvalue === 'object') {
                stringifiedData = JSON.stringify(returnvalue);
            } else {
                stringifiedData = JSON.stringify({ summary: 'Generation complete.' });
            }
            console.log(`[SSE] Sending complete event (${stringifiedData.length} chars) for job ${id}`);
            res.write(`event: complete\ndata: ${stringifiedData}\n\n`);
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
