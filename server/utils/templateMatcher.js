/**
 * Template Matcher V3.0
 * 
 * Compares the user's parsed intent against the database of seeded templates.
 * Uses Groq to determine the best baseline scaffolding to inject into Mistral.
 */

const { callModel } = require('../services/modelRouter.js');
const { buildTemplateMatchPrompt } = require('../rules/promptBuilder.js');
const Template = require('../models/Template');

/**
 * Strip markdown fences from AI responses
 */
function stripFences(str) {
  return str.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

/**
 * Look for a matching template based on user intent.
 * 
 * @param {object} parsedSitePlan - Layer 1 parsed intent
 * @returns {Promise<object|null>} The matching template document, or null if no match or error
 */
async function matchTemplate(parsedSitePlan) {
  try {
    // 1. Fetch available templates, excluding the heavy `files` array for context efficiency
    const availableTemplates = await Template.find({}, 'slug name description track features').lean();
    
    if (!availableTemplates.length) {
      console.log(`[TemplateMatcher] No templates available in DB.`);
      return null;
    }

    console.log(`[TemplateMatcher] Evaluating ${availableTemplates.length} templates...`);

    // 2. Ask Groq to pick the best match
    const systemPrompt = buildTemplateMatchPrompt(availableTemplates);
    const result = await callModel('select_template', JSON.stringify(parsedSitePlan), systemPrompt);
    
    const parsed = JSON.parse(stripFences(result.content));
    const selectedSlug = parsed.templateSlug;

    if (!selectedSlug) {
      console.log(`[TemplateMatcher] 🚫 No template matched the user intent.`);
      return null;
    }

    // 3. Fetch and return the full template (including files)
    const matchedTemplate = await Template.findOne({ slug: selectedSlug }).lean();
    
    if (matchedTemplate) {
      console.log(`[TemplateMatcher] ✅ Selected template: ${matchedTemplate.name} (${matchedTemplate.slug})`);
      return matchedTemplate;
    }

    return null;
  } catch (err) {
    console.warn(`[TemplateMatcher] ⚠️ Matching failed or timed out: ${err.message}. Defaulting to from-scratch generation.`);
    return null;
  }
}

module.exports = { matchTemplate };
