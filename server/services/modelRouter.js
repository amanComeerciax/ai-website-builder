/**
 * Model Router — Central AI dispatch
 * 
 * Single entry point for all AI calls in the system.
 * Routes tasks to the correct model based on a routing table.
 * Handles Qwen→Groq automatic fallback for code generation tasks.
 * 
 * Usage:
 *   const { callModel } = require('./modelRouter');
 *   const result = await callModel('parse_prompt', userMessage, systemPrompt);
 */

const { generateWithQwen } = require('./qwenService.js');
const { callMistral } = require('./mistralService.js');
const { callGroq } = require('./groqService.js');

/**
 * Routing table — maps task names to model + config
 */
const ROUTING_TABLE = {
  // Reasoning tasks → Mistral (fast, good at structured output)
  parse_prompt:   { model: 'mistral', temperature: 0.3, jsonMode: true },
  plan_structure:  { model: 'mistral', temperature: 0.3, jsonMode: true },
  plan_layout:     { model: 'mistral', temperature: 0.4, jsonMode: true },   // Component Kit layout planner
  summarize:       { model: 'mistral', temperature: 0.5, jsonMode: true },

  // Chat → Groq (instant responses)
  chat_response:   { model: 'groq', temperature: 0.5, jsonMode: false },

  // Track A: Single HTML file generation → Mistral (rules are ~85KB, exceeds Qwen's 14K limit)
  generate_html:   { model: 'mistral', temperature: 0.1, jsonMode: false, fallbackToGroq: true },

  // Track B: React multi-file JSON generation → Mistral (rules ~85KB, exceeds Qwen's 14K limit)
  generate_file:   { model: 'mistral', temperature: 0.1, jsonMode: true, fallbackToGroq: true },
  fix_file:        { model: 'mistral', temperature: 0.1, jsonMode: true, fallbackToGroq: true },

  // Direct fallback
  fallback_file:   { model: 'groq', temperature: 0.2, jsonMode: true },
};

/**
 * Call the appropriate AI model for a given task.
 * 
 * @param {string} task - Task name from ROUTING_TABLE
 * @param {string} userMessage - The user prompt / input
 * @param {string} systemPrompt - System instructions
 * @param {object} options - Override defaults { temperature, jsonMode, forceModel }
 * @returns {{ content: string, model: string, durationMs: number, fallbackUsed: boolean }}
 */
async function callModel(task, userMessage, systemPrompt, options = {}) {
  const route = ROUTING_TABLE[task];
  if (!route) {
    throw new Error(`[Model Router] Unknown task: "${task}". Valid tasks: ${Object.keys(ROUTING_TABLE).join(', ')}`);
  }

  const config = {
    temperature: options.temperature ?? route.temperature,
    jsonMode: options.jsonMode ?? route.jsonMode,
  };

  const targetModel = options.forceModel || route.model;
  let fallbackUsed = false;

  console.log(`[Model Router] Task "${task}" → ${targetModel} (temp: ${config.temperature}, json: ${config.jsonMode})`);

  try {
    // ─── QWEN (local Ollama) ───
    if (targetModel === 'qwen') {
      const content = await generateWithQwen(
        systemPrompt, 
        userMessage, 
        config.jsonMode, 
        3,      // retries
        'qwen'  // force local, don't use Mistral fallback inside qwenService
      );
      return { content, model: 'qwen', durationMs: 0, fallbackUsed: false };
    }

    // ─── MISTRAL (cloud reasoning) ───
    if (targetModel === 'mistral') {
      const result = await callMistral(systemPrompt, userMessage, config);
      return { ...result, fallbackUsed: false };
    }

    // ─── GROQ (cloud fast fallback) ───
    if (targetModel === 'groq') {
      const result = await callGroq(systemPrompt, userMessage, config);
      return { ...result, fallbackUsed: false };
    }

    throw new Error(`[Model Router] Unknown model target: "${targetModel}"`);

  } catch (error) {
    // ─── AUTOMATIC FALLBACK: Qwen/Mistral → Groq ───
    if (route.fallbackToGroq && (targetModel === 'qwen' || targetModel === 'mistral')) {
      console.warn(`[Model Router] ${targetModel} failed for "${task}": ${error.message}`);
      console.log(`[Model Router] Auto-escalating to Groq fallback...`);
      
      try {
        const result = await callGroq(systemPrompt, userMessage, {
          ...config,
          temperature: 0.2 // Lower temp for code fallback
        });
        return { ...result, fallbackUsed: true };
      } catch (groqError) {
        console.error(`[Model Router] Groq fallback also failed:`, groqError.message);
        throw new Error(`All models failed for task "${task}". ${targetModel}: ${error.message}. Groq: ${groqError.message}`);
      }
    }

    // No fallback configured — throw original error
    throw error;
  }
}

module.exports = { callModel, ROUTING_TABLE };
