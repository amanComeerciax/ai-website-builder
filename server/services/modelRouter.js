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
const { callOpenRouter } = require('./openRouterService.js');

/**
 * Routing table — maps task names to model + config
 */
const ROUTING_TABLE = {
  // Reasoning tasks → Mistral (fast, good at structured output)
  parse_prompt:   { model: 'mistral', temperature: 0.3, jsonMode: true, fallbackToGroq: true },
  plan_structure:  { model: 'mistral', temperature: 0.3, jsonMode: true, fallbackToGroq: true },
  plan_layout:     { model: 'mistral', temperature: 0.6, jsonMode: true, fallbackToGroq: true },   // Component Kit layout planner
  summarize:       { model: 'mistral', temperature: 0.5, jsonMode: true, fallbackToGroq: true },
  template_selector: { model: 'mistral', temperature: 0.2, jsonMode: false },
  html_to_jsx:     { model: 'mistral', temperature: 0.2, jsonMode: false },

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
    // ─── TRIPLE FALLBACK CHAIN: Mistral -> Groq -> Qwen ───
    if (route.fallbackToGroq) {
      console.warn(`[Model Router] ${targetModel} failed for "${task}": ${error.message}`);
      
      // Step 2: Try Groq if primary (Mistral) failed
      if (targetModel === 'mistral') {
        try {
          console.log(`[Model Router] 🔄 Step 2: Falling back to Groq...`);
          const result = await callGroq(systemPrompt, userMessage, {
            ...config,
            temperature: 0.2
          });
          return { ...result, fallbackUsed: true };
        } catch (groqError) {
          console.warn(`[Model Router] Groq also failed: ${groqError.message}`);
          
          // Step 3: Try OpenRouter (Master Backup)
          try {
            console.log(`[Model Router] 🔄 Step 3: Falling back to OpenRouter...`);
            const result = await callOpenRouter(systemPrompt, userMessage, {
              ...config,
              temperature: 0.3
            });
            return { ...result, fallbackUsed: true };
          } catch (orError) {
            console.warn(`[Model Router] OpenRouter also failed: ${orError.message}`);
            // Proceed to Step 4
          }
        }
      }

      // Step 4: Final Fallback to local Qwen
      try {
        console.log(`[Model Router] 🔄 Step 4: Falling back to Qwen (Ultimate Backup)...`);
        const content = await generateWithQwen(systemPrompt, userMessage, config.jsonMode, 2, 'qwen');
        return { content, model: 'qwen', durationMs: 0, fallbackUsed: true };
      } catch (qwenError) {
        console.error(`[Model Router] ❌ All models (Mistral, Groq, OpenRouter, Qwen) failed for "${task}"`);
        throw new Error(`QUADRUPLE_FAILURE: All providers exhausted. Last error: ${qwenError.message}`);
      }
    }

    // No fallback configured — throw original error
    throw error;
  }
}

module.exports = { callModel, ROUTING_TABLE };
