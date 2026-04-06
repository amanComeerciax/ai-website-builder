const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');

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
                            
                            // We only extract metadata to keep the payload lightweight
                            templatesList.push({
                                id: `${dirent.name}/${file.replace('.json', '')}`,
                                category: capitalize(dirent.name),
                                categoryId: dirent.name,
                                title: templateData.meta?.title || capitalize(file.replace('.json', '')),
                                description: templateData.meta?.description || 'Start your project with this foundational template.',
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

module.exports = router;
