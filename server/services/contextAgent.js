/**
 * Context Collection Agent V3.0
 * 
 * Stage 0 of the 6-Layer Pipeline.
 * Given a user's raw first prompt, this agent determines if more info is needed
 * and returns up to 3 clarifying questions (with chip options for quick answers).
 * 
 * HOW IT WORKS:
 * 1. POST /api/context/questions  → AI analyzes prompt, returns { questions: [...] }
 * 2. Frontend shows ContextChips UI so user answers inline
 * 3. Answers are merged back into the generation job as enrichedPrompt
 * 4. POST /api/generate (with enrichedPrompt) → normal pipeline continues
 */

const { callModel } = require('../services/modelRouter');
const { buildContextQuestions } = require('../rules/promptBuilder');

/**
 * Generate context questions for a given user prompt.
 * Uses Groq (task: collect_context) — fast, cheap, JSON mode.
 * 
 * @param {string} userPrompt - The user's raw initial prompt
 * @returns {Promise<{ questions: Array, skipAllowed: boolean }>}
 */
async function collectContext(userPrompt) {
  if (!userPrompt || userPrompt.trim().length < 3) {
    return { questions: [], skipAllowed: true };
  }

  const systemPrompt = buildContextQuestions(userPrompt);

  try {
    const result = await callModel('collect_context', userPrompt, systemPrompt);
    let raw = result.content.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

    // Ensure structure is valid
    if (!Array.isArray(parsed.questions)) {
      return { questions: [], skipAllowed: true };
    }

    // Cap to max 3 questions (enforce plan spec)
    const questions = parsed.questions.slice(0, 3).map(q => ({
      text: q.text || '',
      type: q.type || 'text_input',
      chips: Array.isArray(q.chips) ? q.chips.slice(0, 5) : []
    }));

    console.log(`[Context Agent] Generated ${questions.length} context questions for prompt: "${userPrompt.substring(0, 50)}..."`);
    return { questions, skipAllowed: parsed.skipAllowed !== false };

  } catch (err) {
    console.warn(`[Context Agent] Failed to generate questions: ${err.message}. Skipping context collection.`);
    // Graceful degradation — return empty so generation continues immediately
    return { questions: [], skipAllowed: true };
  }
}

/**
 * Merge user answers into an enriched prompt string.
 * Called before dispatching the generation job.
 * 
 * @param {string} originalPrompt - User's original prompt
 * @param {Array<{ question: string, answer: string }>} answers - Answered context questions
 * @returns {string} Enriched prompt with context baked in
 */
function buildEnrichedPrompt(originalPrompt, answers = []) {
  if (!answers || answers.length === 0) return originalPrompt;

  const contextBlock = answers
    .filter(a => a.answer && a.answer.trim())
    .map(a => `- ${a.question}: ${a.answer}`)
    .join('\n');

  if (!contextBlock) return originalPrompt;

  return `${originalPrompt}\n\n[Additional context from user]\n${contextBlock}`;
}

module.exports = { collectContext, buildEnrichedPrompt };
