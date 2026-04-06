/**
 * AI Project Name Generator
 * 
 * Uses Groq to generate a creative 2-3 word project name from the user's prompt.
 * Falls back to a cleaned substring of the prompt if Groq fails.
 */

const { callGroq } = require('../services/groqService.js');

/**
 * Generate a creative project name from a user prompt.
 * @param {string} prompt - The user's initial prompt
 * @returns {Promise<string>} A short creative name (2-3 words)
 */
async function generateProjectName(prompt) {
  if (!prompt || prompt.trim().length === 0) return 'Untitled Project';

  try {
    const systemPrompt = `You are a creative branding assistant. Given a user's website request, generate a SHORT, catchy project name (2-3 words max). 
Rules:
- Return ONLY the name, nothing else. No quotes, no punctuation, no explanation.
- Make it sound like a real brand name (e.g., "Pizza Palace", "Brew Haven", "TechForge", "Style Studio")
- If the user mentions a specific business name, use or adapt that name.
- Keep it professional and memorable.`;

    const result = await callGroq(systemPrompt, prompt, { 
      temperature: 0.7, 
      jsonMode: false 
    });

    const name = result.content.trim().replace(/['"]/g, '').substring(0, 40);
    
    if (name.length > 0 && name.length <= 40) {
      console.log(`[NameGenerator] Generated name: "${name}" from prompt: "${prompt.substring(0, 50)}..."`);
      return name;
    }
  } catch (err) {
    console.warn(`[NameGenerator] Groq failed, using fallback:`, err.message);
  }

  // Fallback: clean up the prompt into a title-case name
  const fallback = prompt
    .replace(/^(create|build|make|design|generate)\s+(a|an|me|my)?\s*/i, '')
    .replace(/\s*(website|page|site|landing page|app)\s*/i, '')
    .trim()
    .substring(0, 30);
  
  return fallback || 'Untitled Project';
}

module.exports = { generateProjectName };
