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

// ── POST /api/generate/suggest-names — AI name generation for brand ──
router.post("/suggest-names", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "prompt is required" });

        const systemPrompt = `You are a creative brand naming expert. Generate exactly 3 brand names based on the user's input.

RULES:
1. If the user's prompt clearly describes a business/website (contains specific industry keywords, clear intent), generate names RELATED to their business idea.
   Example: "make a landing page for my AI SaaS startup" → names like "NeuralForge", "SynthWave AI", "CloudMind"
   Example: "coffee shop website" → names like "BrewHaven", "Bean & Bloom", "Roast Republic"
2. If the user's prompt is vague/unclear (generic words, gibberish, or no clear business intent), generate random creative brand names that sound professional and modern.
   Example: "make something cool" → names like "Luminary", "Vexora", "Pinnacle"
3. Names should be 1-2 words, catchy, memorable, and suitable as a website header brand name.
4. Output ONLY the 3 names separated by newlines. No numbering, no explanations, no quotes.`;

        const { callModel } = require('../services/modelRouter.js');
        const response = await callModel('suggest_names', prompt, systemPrompt);
        const names = response.content.trim().split('\n').map(n => n.trim()).filter(Boolean).slice(0, 3);

        res.json({ names: names.length > 0 ? names : ["Luminary", "Vexora", "NovaBrand"] });
    } catch (err) {
        console.error("[generate /suggest-names]", err);
        res.json({ names: ["Luminary", "Vexora", "NovaBrand"] });
    }
});

// ── POST /api/generate/suggest-description — AI description generation ──
router.post("/suggest-description", async (req, res) => {
    try {
        const { prompt, brandName } = req.body;
        if (!prompt && !brandName) return res.status(400).json({ error: "prompt or brandName required" });

        const context = [prompt, brandName].filter(Boolean).join('. Brand name: ');

        const systemPrompt = `You are an expert at writing compelling business descriptions for website generation. Write a detailed description for a website based on the user's input.

RULES:
1. If the user gave a CLEAR business idea (specific industry, clear intent, brand name that matches a concept):
   - Write a description that accurately reflects their business/website purpose
   - Include specific details about services, target audience, and unique selling points
   - Reference their brand name naturally
   Example input: "make a coffee website. Brand name: Coffee Day"
   Example output: "Coffee Day is a premium coffee shop and café experience. We specialize in artisan-roasted single-origin beans sourced from ethical farms across Colombia, Ethiopia, and Guatemala. Our menu features handcrafted espresso drinks, pour-over selections, and signature seasonal blends. We also offer a curated selection of pastries, light bites, and merchandise. Whether you're a casual coffee lover or a dedicated connoisseur, Coffee Day provides a warm, inviting space to enjoy the perfect cup."

2. If the user gave a VAGUE/UNCLEAR idea (generic words, gibberish, no clear intent):
   - Write a creative, professional description for a general-purpose website
   - Pick a random theme naturally (could be tech, lifestyle, creative agency, etc.)
   - Include contextual keywords that hint at the theme chosen
   Example input: "make something cool. Brand name: Holix"
   Example output: "Holix is a creative digital collective for passionate hobbyists and entertainment enthusiasts. We bring together a community of gaming aficionados, sports fans, movie buffs, and culture lovers under one roof. Discover curated content, join lively discussions, share your favorite moments, and connect with like-minded people who celebrate the things that make life exciting."

3. Keep it between 150-400 characters.
4. Write in first person plural ("We") for businesses, or third person for personal brands.
5. Output ONLY the description text. No quotes, no labels, no explanations.`;

        const { callModel } = require('../services/modelRouter.js');
        const response = await callModel('suggest_description', context, systemPrompt);
        const description = response.content.trim().replace(/^["']|["']$/g, '');

        res.json({ description: description || "We are a modern digital business dedicated to delivering exceptional experiences to our customers." });
    } catch (err) {
        console.error("[generate /suggest-description]", err);
        res.json({ description: "We are a modern digital business dedicated to delivering exceptional experiences to our customers." });
    }
});

// ── POST /api/generate/enhance-text — Enhance prompt or description ──
// For prompts: template-aware — fetches actual template features so the
// enhanced prompt aligns with what the builder can actually deliver.
router.post("/enhance-text", async (req, res) => {
    try {
        const { text, type } = req.body;
        if (!text) return res.status(400).json({ error: "text is required" });

        const { callModel } = require('../services/modelRouter.js');

        if (type === 'prompt') {
            // ── Step 1: Identify matching category ──
            const ALLOWED_CATEGORIES = [
                "agency", "automotive", "blog", "coffee-shop", "custom",
                "ecommerce", "education", "entertainment", "fashion", "fitness",
                "landing", "legal", "medical", "nonprofit", "portfolio",
                "real-estate", "restaurant", "saas", "service", "sports",
                "travel", "wedding", "wellness"
            ];

            const catSystemPrompt = `You are a website category classifier. Given a description, return the 1-2 MOST relevant categories.\nAvailable: ${ALLOWED_CATEGORIES.join(", ")}\nOutput ONLY category names separated by commas. No explanations.`;

            let matchedCats = [];
            try {
                const catResponse = await callModel('template_selector', text, catSystemPrompt, { forceModel: 'groq' });
                const rawCats = catResponse.content.trim().toLowerCase().split(',').map(c => c.replace(/[^a-z-]/g, '').trim()).filter(Boolean);
                matchedCats = rawCats.filter(c => ALLOWED_CATEGORIES.includes(c));
            } catch (_) { matchedCats = ['custom']; }

            // ── Step 2: Fetch real templates from matched categories ──
            const Template = require('../models/Template');
            let templateContext = '';
            try {
                const query = matchedCats.length > 0 && !matchedCats.includes('custom')
                    ? { isActive: true, isVisibleInThemes: true, categories: { $in: matchedCats } }
                    : { isActive: true, isVisibleInThemes: true };

                const templates = await Template.find(query)
                    .select('name description themeName themeTagline keywords categories')
                    .limit(8)
                    .lean();

                if (templates.length > 0) {
                    templateContext = templates.map(t => {
                        const parts = [];
                        if (t.themeName) parts.push(`Theme: ${t.themeName}`);
                        if (t.themeTagline) parts.push(`Style: ${t.themeTagline}`);
                        if (t.description) parts.push(`Features: ${t.description}`);
                        if (t.keywords) parts.push(`Keywords: ${t.keywords}`);
                        return parts.join('. ');
                    }).join('\n');
                }
            } catch (_) { /* continue without template context */ }

            // ── Step 3: Generate template-aligned enhanced prompt ──
            const systemPrompt = `You are a prompt enhancement expert for a website builder. The user wrote a website creation prompt. Rewrite it to be clearer and more descriptive — BUT only mention features and sections that the builder's templates actually support.

${templateContext ? `HERE ARE THE ACTUAL TEMPLATES AVAILABLE FOR THIS CATEGORY:\n${templateContext}\n` : ''}
CRITICAL RULES:
1. ONLY describe features, sections, and design elements that appear in the template descriptions above.
2. DO NOT invent features that aren't in the templates (like "dark mode", "animations", specific color schemes) unless the templates mention them.
3. Keep the user's original intent and business type.
4. Write naturally — the user should NOT know you're referencing templates. Make it sound like their own refined idea.
5. Keep it concise — 1-2 sentences max.
6. Each time you enhance, generate a DIFFERENT variation (different wording, highlight different template features).
7. Output ONLY the enhanced prompt text. No quotes, no explanations, no prefixes.

Example flow:
User: "portfolio site" → "Create a professional portfolio website with a project showcase section, about me page, skills overview, and a clean contact form."
User: "coffee shop website" → "Build a warm and inviting coffee shop website with a menu display, story section, location details, and online ordering."`;

            const response = await callModel('enhance_text', text, systemPrompt);
            const enhanced = response.content.trim().replace(/^["']|["']$/g, '');
            res.json({ enhanced: enhanced || text });

        } else {
            // ── Description enhancement (unchanged — no template dependency) ──
            const systemPrompt = `You are a description enhancement expert. The user wrote a business description for their website. Rewrite it to be clearer, more detailed, and more useful for AI website generation.

RULES:
1. Keep the original intent and all mentioned details.
2. Add professional structure: what the business does, who it serves, what makes it special.
3. Expand brief descriptions into rich, detailed ones (150-400 characters).
4. Fix grammar and make it sound polished and professional.
5. Output ONLY the enhanced description. No quotes, no labels.`;

            const response = await callModel('enhance_text', text, systemPrompt);
            const enhanced = response.content.trim().replace(/^["']|["']$/g, '');
            res.json({ enhanced: enhanced || text });
        }
    } catch (err) {
        console.error("[generate /enhance-text]", err);
        res.json({ enhanced: req.body?.text || "" });
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
