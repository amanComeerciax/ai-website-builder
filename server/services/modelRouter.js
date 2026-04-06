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
const { callGLM } = require('./glmService.js');

/**
 * Routing table — maps task names to model + config
 */
const ROUTING_TABLE = {
  // Reasoning tasks → Mistral (fast, good at structured output)
  parse_prompt:   { model: 'mistral', temperature: 0.3, jsonMode: true },
  plan_structure:  { model: 'mistral', temperature: 0.3, jsonMode: true },
  plan_layout:     { model: 'mistral', temperature: 0.4, jsonMode: true },   // Component Kit layout planner
  summarize:       { model: 'mistral', temperature: 0.5, jsonMode: true },
  template_selector: { model: 'mistral', temperature: 0.2, jsonMode: false },
  html_to_jsx:     { model: 'mistral', temperature: 0.2, jsonMode: false },

  // Chat → Groq (instant responses)
  chat_response:   { model: 'groq', temperature: 0.5, jsonMode: false },

  // Code Generation → Mistral (with Qwen fallback)
  generate_html:   { model: 'mistral', temperature: 0.1, jsonMode: false, useFallbackChain: true },
  generate_file:   { model: 'mistral', temperature: 0.1, jsonMode: true,  useFallbackChain: true },
  fix_file:        { model: 'mistral', temperature: 0.1, jsonMode: true,  useFallbackChain: true },

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
    throw new Error(`[Model Router] Unknown task: "${task}".`);
  }

  const config = {
    temperature: options.temperature ?? route.temperature,
    jsonMode: options.jsonMode ?? route.jsonMode,
  };

  const targetModel = options.forceModel || route.model;
  
  console.log(`[Model Router] Task "${task}" → ${targetModel} (temp: ${config.temperature}, json: ${config.jsonMode})`);

  try {
    // 1. PRIMARY ATTEMPT
    const result = await executeModelCall(targetModel, systemPrompt, userMessage, config);
    return { ...result, fallbackUsed: false };

  } catch (primaryError) {
    // 2. MULTI-STAGE FALLBACK
    if (route.useFallbackChain) {
      console.warn(`[Model Router] Primary model ${targetModel} failed for "${task}": ${primaryError.message}`);

      // MISTRAL -> QWEN FALLBACK
      if (targetModel === 'mistral') {
          try {
              console.log(`[Model Router] Fallback (1/2): Attempting local Qwen...`);
              const content = await executeModelCall('qwen', systemPrompt, userMessage, config);
              return { content, model: 'qwen', durationMs: 0, fallbackUsed: true };
          } catch (qwenError) {
              console.warn(`[Model Router] Qwen fallback also failed: ${qwenError.message}`);
          }
      }

      // FINAL FALLBACK TO GROQ
      try {
          console.log(`[Model Router] Fallback (2/2): Attempting cloud Groq...`);
          const result = await executeModelCall('groq', systemPrompt, userMessage, { ...config, temperature: 0.2 });
          return { ...result, fallbackUsed: true };
      } catch (groqError) {
          console.error(`[Model Router] All fallbacks failed for "${task}".`);
          throw new Error(`All models failed: ${primaryError.message} -> ${groqError.message}`);
      }
    }

    // No fallback configured — throw original error
    throw primaryError;
  }
}

/**
 * Low-level execution of a single model call
 */
async function executeModelCall(model, systemPrompt, userMessage, config) {
    if (model === 'mistral') {
        return await callMistral(systemPrompt, userMessage, config);
    }
    if (model === 'qwen') {
        const content = await generateWithQwen(
            systemPrompt, 
            userMessage, 
            config.jsonMode, 
            3,      // retries
            'qwen'  // force local
        );
        return { content, model: 'qwen', durationMs: 0 };
    }
    if (model === 'groq') {
        return await callGroq(systemPrompt, userMessage, config);
    }
    if (model === 'glm') {
        return await callGLM(systemPrompt, userMessage, config);
    }
    throw new Error(`Unknown model target: "${model}"`);
}


module.exports = { callModel, ROUTING_TABLE };
