const fs = require('fs');
const path = require('path');

/**
 * Loads a random JSON template for a given site type to use as a foundational blueprint.
 * This guarantees pristine, error-free component combinations while allowing the LLM
 * to customize the text, images, and brand-specific content.
 * 
 * @param {string} siteType 
 * @returns {object|null} The parsed JSON template spec, or null if none exist or an error occurs.
 */
function getRandomTemplate(siteType) {
    try {
        const templatesDir = path.join(__dirname, '..', 'templates', siteType);
        
        // If directory doesn't exist, return null
        if (!fs.existsSync(templatesDir)) return null;

        // Get all JSON files in the directory
        const files = fs.readdirSync(templatesDir)
            .filter(file => file.endsWith('.json'));

        if (files.length === 0) return null;

        // Pick a random template file
        const randomFile = files[Math.floor(Math.random() * files.length)];
        const filePath = path.join(templatesDir, randomFile);

        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (err) {
        console.warn(`[TemplateLoader] Failed to load template for ${siteType}:`, err.message);
        return null; // Fallback gracefully if JSON parsing fails or file access fails
    }
}

module.exports = { getRandomTemplate };
