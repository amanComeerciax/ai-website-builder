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

        // All real category folder names from /server/templates
        const ALLOWED_CATEGORIES = [
            "agency", "automotive", "blog", "coffee-shop", "custom",
            "ecommerce", "education", "entertainment", "fashion", "fitness",
            "landing", "legal", "medical", "nonprofit", "portfolio",
            "real-estate", "restaurant", "saas", "service", "sports",
            "travel", "wedding", "wellness"
        ];

        const systemPrompt = `You are an expert website category classifier. Given a business description, return the MOST relevant template categories in order of relevance.

Available categories: ${ALLOWED_CATEGORIES.join(", ")}

Category definitions (classify by INTENT, not exact keywords):
- agency: marketing agencies, creative studios, digital agencies, consulting firms
- automotive: car dealerships, auto repair, vehicle rentals
- blog: personal blogs, news sites, content publishing, journalism
- coffee-shop: cafes, coffee shops, tea houses, specialty drinks
- custom: very generic or truly unclear requests
- ecommerce: online stores, shops, product selling, retail
- education: schools, courses, learning platforms, tutoring, training
- entertainment: events, shows, music, nightlife, concerts, venues
- fashion: clothing brands, apparel, boutiques, accessories
- fitness: gyms, personal training, yoga studios, workout, health coaching
- landing: product launch pages, app promotions, waitlists, single product
- legal: law firms, attorneys, legal services
- medical: clinics, hospitals, healthcare, doctors, dentists
- nonprofit: charities, NGOs, foundations, volunteer organizations
- portfolio: personal portfolios, freelancers, resumes, showcasing work
- real-estate: property listings, real estate agents, housing, rentals
- restaurant: restaurants, diners, food trucks, dining, bistros
- saas: software platforms, web apps, dashboards, SaaS tools with login
- service: professional services, home services, cleaning, plumbing, contractors
- sports: sports teams, athletic clubs, sports coaching
- travel: travel agencies, tour operators, trip planning, holiday packages, destinations, tours
- wedding: wedding planning, venues, photographers, bridal
- wellness: spas, meditation, mental health, therapy, holistic health

RULES:
1. Understand INTENT. "We plan trips to countries" → travel. "AI editor with subscription" → saas, landing.
2. Return 1-3 categories, comma-separated, most relevant first.
3. Output ONLY category names separated by commas. No explanations or extra text.
4. If completely vague, return: custom`;

        const { callModel } = require('../services/modelRouter.js');
        const response = await callModel('template_selector', prompt, systemPrompt, { forceModel: 'groq' });
        const responseText = response.content.trim();
        
        const rawCats = responseText.toLowerCase().split(',').map(c => c.replace(/[^a-z-]/g, '').trim()).filter(Boolean);
        const validCats = rawCats.filter(c => ALLOWED_CATEGORIES.includes(c));
        
        if (validCats.length === 0) {
            res.json({ category: "custom", categories: [] });
        } else {
            res.json({ category: validCats[0], categories: validCats });
        }
    } catch (err) {
        console.error("[generate /suggest-category]", err);
        res.json({ category: "custom", categories: [] });
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
            userId: req.auth?.userId || null,
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
    const redisStreamUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const connection = new IORedis(redisStreamUrl, {
        maxRetriesPerRequest: null,
        tls: redisStreamUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
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
