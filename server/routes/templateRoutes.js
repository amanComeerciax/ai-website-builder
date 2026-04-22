const express = require('express');
const router = express.Router();
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const Template = require('../models/Template');
const User = require('../models/User');

// Multer — HTML files in memory only
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.html') || file.originalname.endsWith('.htm')) {
            cb(null, true);
        } else {
            cb(new Error('Only .html files are accepted'), false);
        }
    }
});

const capitalize = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/templates
// USER-FACING: returns approved, visible-in-themes templates (deduplicated).
// Each template returned once with its full `categories` array.
// Frontend filters per category client-side.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find({
            isActive: true,
            approvalStatus: { $nin: ['pending', 'rejected'] }, // handles old templates missing this field
            $or: [
                { isVisible: true },
                { isVisibleInThemes: true }
            ]
        }).select('-htmlContent'); // don't send full HTML to list endpoint

        const list = templates.map(tmpl => ({
            id: `${(tmpl.categories[0] || 'custom')}/${tmpl.slug || tmpl._id}`,
            slug: tmpl.slug || tmpl._id.toString(),
            categoryId: tmpl.categories[0] || 'custom',   // primary category for routing
            allCategories: tmpl.categories,
            title: tmpl.name,
            description: tmpl.description,
            image: null,
            themeName: tmpl.themeName,
            themeTagline: tmpl.themeTagline,
            source: tmpl.source,
            submittedBy: tmpl.source === 'community' ? tmpl.submittedBy : null,
            isVisible: tmpl.isVisible,
            isVisibleInThemes: tmpl.isVisibleInThemes,
        }));

        res.status(200).json({ templates: list });
    } catch (error) {
        console.error('[TemplateRoute] GET /:', error);
        res.status(500).json({ error: 'Failed to retrieve templates' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/templates/admin  (ADMIN ONLY)
// Full list with all statuses — for admin management panel
// ─────────────────────────────────────────────────────────────────────────────
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true })
            .select('-htmlContent')
            .sort({ createdAt: -1 });

        const list = templates.map(tmpl => ({
            id: tmpl._id,
            slug: tmpl.slug,
            name: tmpl.name,
            themeName: tmpl.themeName,
            themeTagline: tmpl.themeTagline,
            description: tmpl.description,
            categories: tmpl.categories,
            source: tmpl.source,
            submittedBy: tmpl.submittedBy,
            approvalStatus: tmpl.approvalStatus,
            isVisible: tmpl.isVisible,
            isVisibleInThemes: tmpl.isVisibleInThemes,
            sizeBytes: tmpl.sizeBytes,
            createdAt: tmpl.createdAt,
        }));

        res.status(200).json({ templates: list });
    } catch (error) {
        console.error('[TemplateRoute] GET /admin:', error);
        res.status(500).json({ error: 'Failed to retrieve templates' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/templates/preview/:templateId or /api/templates/preview/:categoryId/:templateId
// Returns full HTML for a single template (by slug or Object ID, category-agnostic)
// ─────────────────────────────────────────────────────────────────────────────
router.get(['/preview/:templateId', '/preview/:categoryId/:templateId'], async (req, res) => {
    try {
        const { templateId } = req.params;
        const slug = templateId.replace('.json', '').replace('.html', '');

        const mongoose = require('mongoose');
        let query = { isActive: true };
        
        if (mongoose.Types.ObjectId.isValid(slug)) {
            query.$or = [{ _id: slug }, { slug: slug }];
        } else {
            query.slug = slug;
        }

        const template = await Template.findOne(query);

        if (!template) {
            return res.status(404).json({ error: 'Preview not available for this template' });
        }

        // Cache at browser level for 1 hour to reduce redundant fetches across sessions
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).json({ html: template.htmlContent });
    } catch (error) {
        console.error('[TemplateRoute] GET /preview:', error);
        res.status(500).json({ error: 'Failed to retrieve template preview' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/templates  (ADMIN ONLY)
// Upload a new template. Defaults: isVisible=false, isVisibleInThemes=true
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireAdmin, upload.single('htmlFile'), async (req, res) => {
    try {
        const { title, description, themeName, themeTagline } = req.body;

        let categories = [];
        if (req.body.categories) {
            try { categories = JSON.parse(req.body.categories); }
            catch { categories = req.body.categories.split(',').map(c => c.trim()).filter(Boolean); }
        }
        if (categories.length === 0 && req.body.category) categories = [req.body.category];

        let htmlContent = req.body.htmlContent || '';
        if (req.file) htmlContent = req.file.buffer.toString('utf-8');

        if (!title || categories.length === 0 || !htmlContent) {
            return res.status(400).json({ error: 'Missing required fields (title, at least one category, htmlContent or HTML file)' });
        }

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const categorySlugs = categories.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

        const template = await Template.findOneAndUpdate(
            { name: title },
            {
                name: title,
                description: description || 'Premium stackforge template',
                htmlContent,
                slug,
                categories: categorySlugs,
                themeName: themeName || '',
                themeTagline: themeTagline || '',
                sizeBytes: Buffer.byteLength(htmlContent, 'utf-8'),
                isActive: true,
                isVisible: false,          // hidden from Browse gallery by default
                isVisibleInThemes: true,   // immediately usable in Theme Picker
                source: 'admin',
                approvalStatus: 'approved',
            },
            { upsert: true, new: true, returnDocument: 'after' }
        );

        // Analyze for auto-chunking
        const { shouldChunk, chunkTemplate } = require('../services/templateChunker');
        const needsChunking = shouldChunk(htmlContent);
        let chunkingInfo = { enabled: false, lineCount: htmlContent.split('\n').length, sizeKB: (Buffer.byteLength(htmlContent, 'utf-8') / 1024).toFixed(1) };

        if (needsChunking) {
            const chunkResult = chunkTemplate(htmlContent);
            chunkingInfo = {
                enabled: true,
                lineCount: chunkResult.stats.totalLines,
                sizeKB: (chunkResult.stats.totalBytes / 1024).toFixed(1),
                totalSections: chunkResult.stats.totalSections,
                editableSections: chunkResult.stats.editableSections,
                sections: chunkResult.sections.map(s => ({ id: s.id, tag: s.tag, lines: s.lineCount, editable: s.isEditable }))
            };
        }

        res.status(201).json({
            success: true,
            message: 'Template saved to DB. Visible in Themes Picker immediately. Toggle "Browse visibility" to show in Browse gallery.',
            template: { id: template._id, slug, title: template.name, categories: template.categories },
            chunking: chunkingInfo
        });
    } catch (error) {
        console.error('[TemplateRoute] POST /:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/templates/:id/visibility  (ADMIN ONLY)
// Toggle isVisible (Browse gallery) and/or isVisibleInThemes (Theme Picker)
// Body: { isVisible?: bool, isVisibleInThemes?: bool }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/visibility', requireAdmin, async (req, res) => {
    try {
        const updates = {};
        if (typeof req.body.isVisible === 'boolean') updates.isVisible = req.body.isVisible;
        if (typeof req.body.isVisibleInThemes === 'boolean') updates.isVisibleInThemes = req.body.isVisibleInThemes;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Provide isVisible or isVisibleInThemes' });
        }

        const template = await Template.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!template) return res.status(404).json({ error: 'Template not found' });

        res.json({ success: true, isVisible: template.isVisible, isVisibleInThemes: template.isVisibleInThemes });
    } catch (error) {
        console.error('[TemplateRoute] PATCH /visibility:', error);
        res.status(500).json({ error: 'Failed to update visibility' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/templates/:id/categories  (ADMIN ONLY)
// Update a template's categories list.
// Body: { categories: string[] }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/categories', requireAdmin, async (req, res) => {
    try {
        const { categories } = req.body;
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'categories must be a non-empty array' });
        }

        const cleaned = categories.map(c => c.toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean);
        if (cleaned.length === 0) {
            return res.status(400).json({ error: 'At least one valid category is required' });
        }

        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { categories: cleaned },
            { new: true }
        );
        if (!template) return res.status(404).json({ error: 'Template not found' });

        res.json({ success: true, categories: template.categories });
    } catch (error) {
        console.error('[TemplateRoute] PATCH /categories:', error);
        res.status(500).json({ error: 'Failed to update categories' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/templates/:id/approve  (ADMIN ONLY)
// Approve a community submission. Optionally publish to Browse gallery too.
// Body: { publishToBrowse?: bool }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/approve', requireAdmin, async (req, res) => {
    try {
        const publishToBrowse = req.body.publishToBrowse === true;

        const template = await Template.findByIdAndUpdate(
            req.params.id,
            {
                approvalStatus: 'approved',
                isVisibleInThemes: true,
                ...(publishToBrowse && { isVisible: true })
            },
            { new: true }
        );
        if (!template) return res.status(404).json({ error: 'Template not found' });

        res.json({ success: true, approvalStatus: template.approvalStatus, isVisible: template.isVisible });
    } catch (error) {
        console.error('[TemplateRoute] PATCH /approve:', error);
        res.status(500).json({ error: 'Failed to approve template' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/templates/:id/reject  (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/reject', requireAdmin, async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { approvalStatus: 'rejected', isVisible: false, isVisibleInThemes: false },
            { new: true }
        );
        if (!template) return res.status(404).json({ error: 'Template not found' });

        res.json({ success: true, approvalStatus: template.approvalStatus });
    } catch (error) {
        console.error('[TemplateRoute] PATCH /reject:', error);
        res.status(500).json({ error: 'Failed to reject template' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/templates/:id  (ADMIN ONLY) — soft delete
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { isActive: false, isVisible: false, isVisibleInThemes: false },
            { new: true }
        );
        if (!template) return res.status(404).json({ error: 'Template not found' });

        res.json({ success: true, message: `Template "${template.name}" archived.` });
    } catch (error) {
        console.error('[TemplateRoute] DELETE /:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/templates/submit  (AUTHENTICATED — any user)
// User submits their project's website as a community template request.
// Body: { projectId, themeName, themeTagline, categories[], description? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/submit', requireAuth, async (req, res) => {
    try {
        const { projectId, themeName, themeTagline, categories, description } = req.body;
        const clerkId = req.auth.userId;

        if (!projectId || !themeName || !categories || categories.length === 0) {
            return res.status(400).json({ error: 'projectId, themeName, and at least one category are required' });
        }

        // Load user info for attribution
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Load project and grab its HTML
        const Project = require('../models/Project');
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId !== clerkId) return res.status(403).json({ error: 'You do not own this project' });

        const htmlContent = project.currentFileTree?.['index.html'];
        if (!htmlContent) {
            return res.status(400).json({ error: 'This project has no generated HTML yet. Build the project first.' });
        }

        const slug = `community-${themeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const categorySlugs = categories.map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

        // Check for duplicate submission from same user for same project
        const existing = await Template.findOne({ 'submittedBy.clerkId': clerkId, name: `${themeName} by ${user.name || user.email}` });
        if (existing && existing.approvalStatus === 'pending') {
            return res.status(409).json({ error: 'You already have a pending submission for this theme name. Please wait for admin review.' });
        }

        const template = await Template.create({
            name: `${themeName} by ${user.name || user.email.split('@')[0]}`,
            description: description || `Community template submitted by ${user.name || user.email}`,
            htmlContent,
            slug,
            categories: categorySlugs,
            themeName,
            themeTagline: themeTagline || '',
            sizeBytes: Buffer.byteLength(htmlContent, 'utf-8'),
            isActive: true,
            isVisible: false,
            isVisibleInThemes: false,
            source: 'community',
            submittedBy: { clerkId, name: user.name || '', email: user.email },
            approvalStatus: 'pending',
        });

        res.status(201).json({
            success: true,
            message: 'Your template has been submitted! An admin will review it shortly.',
            templateId: template._id,
        });
    } catch (error) {
        console.error('[TemplateRoute] POST /submit:', error);
        res.status(500).json({ error: 'Failed to submit template' });
    }
});

module.exports = router;
