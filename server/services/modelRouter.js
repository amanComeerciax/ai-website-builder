/**
 * Model Router V3.0 — Central AI Dispatch
 * 
 * ROUTING STRATEGY:
 *   Mistral API  → Code generation, file fixing (primary for code tasks)
 *   Groq API     → Reasoning, planning, context, classification, chat (primary for logic)
 *   Qwen (local) → Fallback for ALL tasks when cloud models fail
 * 
 * Usage:
 *   const { callModel } = require('./modelRouter');
 *   const result = await callModel('parse_prompt', userMessage, systemPrompt);
 */

const { generateWithQwen } = require('./qwenService.js');
const { callMistral } = require('./mistralService.js');
const { callGroq } = require('./groqService.js');

/**
 * V3.0 Routing Table — maps task names to model + config + fallback chain
 * 
 * TASK                    MODEL       TEMP    NOTES
 * parse_prompt            Groq        0.3     Returns structured JSON
 * collect_context         Groq        0.7     Generates clarifying questions
 * plan_structure          Groq        0.3     Returns file tree + design JSON
 * select_template         Groq        0.1     Returns templateId or null
 * summarize               Groq        0.5     Returns summary + suggestions
 * classify_error          Groq        0.1     Returns error classification JSON
 * chat_response           Groq        0.7     Instant conversational replies
 * generate_file           Mistral     0.2     Code generation (Next.js)
 * generate_html           Mistral     0.2     Code generation (HTML)
 * fix_file                Mistral     0.2     Targeted file rewrite
 * fix_error               Mistral     0.2     Error-specific fix
 * fallback_file           Qwen        0.2     When cloud fails entirely
 */
const ROUTING_TABLE = {
  // ── Reasoning & Planning → Groq (fast, cheap) ──
  parse_prompt:    { model: 'groq',    temperature: 0.3, jsonMode: true,  fallbackChain: ['qwen'] },
  collect_context: { model: 'groq',    temperature: 0.7, jsonMode: true,  fallbackChain: ['qwen'] },
  plan_structure:  { model: 'groq',    temperature: 0.3, jsonMode: true,  fallbackChain: ['qwen'] },
  select_template: { model: 'groq',    temperature: 0.1, jsonMode: true,  fallbackChain: ['qwen'] },
  summarize:       { model: 'groq',    temperature: 0.5, jsonMode: true,  fallbackChain: ['qwen'] },
  classify_error:  { model: 'groq',    temperature: 0.1, jsonMode: true,  fallbackChain: ['qwen'] },

  // ── Chat → Groq primary, Mistral fallback ──
  chat_response:   { model: 'groq',    temperature: 0.7, jsonMode: false, fallbackChain: ['mistral'] },

  // ── Code Generation → Mistral (quality code output) ──
  generate_html:   { model: 'mistral', temperature: 0.2, jsonMode: false, fallbackChain: ['groq', 'qwen'] },
  generate_file:   { model: 'mistral', temperature: 0.2, jsonMode: true,  fallbackChain: ['groq', 'qwen'] },
  fix_file:        { model: 'mistral', temperature: 0.2, jsonMode: false, fallbackChain: ['groq', 'qwen'] },
  fix_error:       { model: 'mistral', temperature: 0.2, jsonMode: false, fallbackChain: ['groq', 'qwen'] },

  // ── Local Fallback → Qwen (when all cloud models fail) ──
  fallback_file:   { model: 'qwen',   temperature: 0.2, jsonMode: true,  fallbackChain: ['groq'] },
};

/**
 * Dispatch a single call to a specific model.
 */
async function dispatchToModel(modelName, systemPrompt, userMessage, config) {
  if (modelName === 'qwen') {
    const startTime = Date.now();
    const content = await generateWithQwen(systemPrompt, userMessage, config.jsonMode);
    return { content, model: 'qwen', durationMs: Date.now() - startTime };
  }
  if (modelName === 'mistral') {
    return await callMistral(systemPrompt, userMessage, config);
  }
  if (modelName === 'groq') {
    // When Groq is used as a code-gen fallback, use the large 70B model for quality
    const groqConfig = { ...config };
    if (config._isCodeFallback) {
      groqConfig.model = 'llama-3.3-70b-versatile';
    }
    return await callGroq(systemPrompt, userMessage, groqConfig);
  }
  throw new Error(`Unknown model: "${modelName}"`);
}

/**
 * Call the appropriate AI model for a given task with automatic fallback chain.
 * 
 * @param {string} task - Task name from ROUTING_TABLE
 * @param {string} userMessage - The user prompt / input
 * @param {string} systemPrompt - System instructions
 * @param {object} options - Optional overrides (forceModel, temperature, jsonMode)
 * @returns {Promise<{ content: string, model: string, durationMs: number, fallbackUsed: boolean }>}
 */
async function callModel(task, userMessage, systemPrompt, options = {}) {
  const route = ROUTING_TABLE[task];
  if (!route) {
    throw new Error(`[Model Router] Unknown task: "${task}". Valid tasks: ${Object.keys(ROUTING_TABLE).join(', ')}`);
  }

  const isCodeTask = ['generate_file', 'generate_html', 'fix_file', 'fix_error'].includes(task);

  const config = {
    temperature: options.temperature ?? route.temperature,
    jsonMode: options.jsonMode ?? route.jsonMode,
    maxTokens: options.maxTokens ?? (isCodeTask ? 16384 : 4096),
  };

  const targetModel = options.forceModel || route.model;
  const fallbackChain = route.fallbackChain || [];
  
  // Build the full chain: primary model + fallbacks
  const modelsToTry = [targetModel, ...fallbackChain];
  const errors = [];

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const isFallback = i > 0;
    
    if (isFallback) {
      console.log(`[Model Router] 🔄 ${modelsToTry[i-1]} failed — falling back to ${currentModel} for task "${task}"...`);
      await new Promise(r => setTimeout(r, 1000)); // Brief backoff
    } else {
      console.log(`[Model Router] 🧠 Task "${task}" → ${currentModel.toUpperCase()} | temp=${config.temperature} | json=${config.jsonMode}`);
    }

    try {
      // Mark code-gen tasks so Groq fallback uses the 70B model
      const isCodeTask = ['generate_file', 'generate_html', 'fix_file', 'fix_error'].includes(task);
      const fallbackConfig = isFallback 
        ? { ...config, temperature: Math.min(config.temperature + 0.1, 0.3), _isCodeFallback: isCodeTask }
        : config;
        
      const result = await dispatchToModel(currentModel, systemPrompt, userMessage, fallbackConfig);
      
      if (isFallback) {
        console.log(`[Model Router] ✅ ${currentModel} fallback succeeded for task "${task}"`);
      }
      
      return { ...result, fallbackUsed: isFallback };

    } catch (error) {
      const is429 = error.message?.includes('429') || error.message?.includes('Rate limit');
      const reason = error.code === 'PROMPT_TOO_LARGE' 
        ? `Prompt too large (${error.message})` 
        : error.message;
      
      console.warn(`[Model Router] ⚠️ ${currentModel} failed for task "${task}": ${reason}`);
      errors.push(`${currentModel}: ${reason}`);

      // If rate-limited, wait a bit before trying the next model in the chain
      if (is429) {
        console.log(`[Model Router] ⏳ Rate limit detected, waiting 5s before next fallback...`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  // All models exhausted
  const errorSummary = errors.join(' | ');
  console.error(`[Model Router] ❌ ALL models exhausted for task "${task}": ${errorSummary}`);
  throw new Error(`All models exhausted for task "${task}". ${errorSummary}`);
}

module.exports = { callModel, ROUTING_TABLE };
