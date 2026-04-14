const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const { requireAuth } = require('../middleware/requireAuth');
const User = require('../models/User');
const Template = require('../models/Template');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Utility to nicely capitalize strings
const capitalize = (str) => str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// GET /api/templates
router.get('/', async (req, res, next) => {
    try {
        const templatesList = [];

        // Read categories (folders) inside templates directory
        const categories = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });

        for (const dirent of categories) {
            if (dirent.isDirectory() && dirent.name !== 'raw') {
                const categoryFolder = path.join(TEMPLATES_DIR, dirent.name);
                const files = await fs.readdir(categoryFolder);

                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(categoryFolder, file);
                        try {
                            const fileContent = await fs.readFile(filePath, 'utf8');
                            const templateData = JSON.parse(fileContent);

                            // Handle both legacy { meta: { title } } and new { name, description } structures
                            const title = templateData.name || templateData.meta?.title || capitalize(file.replace('.json', ''));
                            const description = templateData.description || templateData.meta?.description || 'Start your project with this foundational template.';
                            const image = templateData.image || templateData.meta?.image || null;

                            templatesList.push({
                                id: `${dirent.name}/${file.replace('.json', '')}`,
                                category: capitalize(dirent.name),
                                categoryId: dirent.name,
                                title,
                                description,
                                image
                             });
                        } catch (parseErr) {
                            console.warn(`[TemplateRoute] Failed to parse template file ${file}:`, parseErr.message);
                        }
                    }
                }
            }
        }

        res.status(200).json({ templates: templatesList });

    } catch (error) {
        console.error('[TemplateRoute] Error reading templates:', error);
        res.status(500).json({ error: 'Failed to retrieve templates' });
    }
});

// GET /api/templates/preview/:categoryId/:templateId
router.get('/preview/:categoryId/:templateId', async (req, res, next) => {
    try {
        const { categoryId, templateId } = req.params;
        const templateName = templateId.replace('.json', '');
        
        const jsonPath = path.join(TEMPLATES_DIR, categoryId, `${templateName}.json`);

        // Try raw HTML first
        const nameNoHyphens = templateName.replace(/-/g, '');
        const rawHtmlPaths = [
            path.join(TEMPLATES_DIR, categoryId, `${templateName}.html`),
            path.join(TEMPLATES_DIR, categoryId, `${nameNoHyphens}.html`),
            path.join(TEMPLATES_DIR, 'raw', `${templateName}.html`),
            path.join(TEMPLATES_DIR, 'raw', `${nameNoHyphens}.html`),
        ];

        let previewHtml = null;

        for (const htmlPath of rawHtmlPaths) {
            try {
                previewHtml = await fs.readFile(htmlPath, 'utf8');
                break;
            } catch {}
        }

        // Fallback to rendering from JSON
        if (!previewHtml) {
            try {
                const jsonContent = await fs.readFile(jsonPath, 'utf8');
                const templateData = JSON.parse(jsonContent);
                const { renderToHTML } = require('../component-kit/html-renderer.js');
                const { getTheme } = require('../config/themeRegistry.js');
                const themeConfig = getTheme('modern-dark');
                previewHtml = renderToHTML(templateData, themeConfig);
            } catch (renderErr) {
                console.warn(`[TemplateRoute] Failed to render template ${categoryId}/${templateId}:`, renderErr.message);
                return res.status(404).json({ error: 'Preview not available for this template' });
            }
        }

        res.status(200).json({ html: previewHtml });

    } catch (error) {
        console.error('[TemplateRoute] Error reading template preview:', error);
        res.status(500).json({ error: 'Failed to retrieve template preview' });
    }
});

// POST /api/templates (ADMIN ONLY)
router.post('/', requireAuth, async (req, res, next) => {
    try {
        // 1. Security Check: Only specific admin email
        const user = await User.findOne({ clerkId: req.auth.userId });
        if (!user || user.email !== 'kingamaan14@gmail.com') {
            return res.status(403).json({ error: 'Unauthorized: Admin access only.' });
        }

        const { title, description, category, htmlContent } = req.body;
        if (!title || !category || !htmlContent) {
            return res.status(400).json({ error: 'Missing required fields (title, category, htmlContent)' });
        }

        // 2. Format names
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const categoryDir = path.join(TEMPLATES_DIR, categorySlug);
        
        // 3. Ensure category directory exists
        try {
            await fs.mkdir(categoryDir, { recursive: true });
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }

        // 4. Save HTML file
        const htmlPath = path.join(categoryDir, `${slug}.html`);
        await fs.writeFile(htmlPath, htmlContent, 'utf8');

        // 5. Save JSON metadata file
        const jsonPath = path.join(categoryDir, `${slug}.json`);
        const metadata = {
            name: title,
            description: description || 'Premium stackforge template',
            category: categorySlug
        };
        await fs.writeFile(jsonPath, JSON.stringify(metadata, null, 2), 'utf8');

        // 6. Sync to MongoDB (for AI Selection Fallback)
        await Template.findOneAndUpdate(
            { name: title },
            {
                name: title,
                description: description || 'Premium stackforge template',
                htmlContent: htmlContent,
                slug: slug,
                sizeBytes: Buffer.byteLength(htmlContent, 'utf-8'),
                isActive: true
            },
            { upsert: true, new: true, returnDocument: 'after' }
        );

        // 7. Analyze template structure for auto-chunking
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
                sections: chunkResult.sections.map(s => ({ 
                    id: s.id, 
                    tag: s.tag, 
                    lines: s.lineCount, 
                    editable: s.isEditable 
                }))
            };
        }

        res.status(201).json({ 
            success: true, 
            message: 'Template created successfully',
            template: {
                id: `${categorySlug}/${slug}`,
                title: title
            },
            chunking: chunkingInfo
        });

    } catch (error) {
        console.error('[TemplateRoute] Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

module.exports = router;
