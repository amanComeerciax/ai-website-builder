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
const mcpManager = require('./mcpManager.js');

/**
 * Routing table — maps task names to model + config
 */
const ROUTING_TABLE = {
  // Reasoning tasks → Mistral (fast, good at structured output)
  parse_prompt:   { model: 'mistral', temperature: 0.3, jsonMode: true },
  plan_structure:  { model: 'mistral', temperature: 0.3, jsonMode: true },
  plan_layout:     { model: 'mistral', temperature: 0.7, jsonMode: true },   // Component Kit layout planner
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
 * Supports tool calling if the model and task allow it.
 */
async function callModel(task, userMessage, systemPrompt, options = {}) {
  const route = ROUTING_TABLE[task];
  if (!route) {
    throw new Error(`[Model Router] Unknown task: "${task}".`);
  }

  const config = {
    temperature: options.temperature ?? route.temperature,
    jsonMode: options.jsonMode ?? route.jsonMode,
    useTools: options.useTools ?? route.useTools,
  };

  const targetModel = options.forceModel || route.model;
  
  // Initialize message history for the tool loop
  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  console.log(`[Model Router] Task "${task}" → ${targetModel} (temp: ${config.temperature}, useTools: ${config.useTools})`);

  try {
    return await runToolLoop(targetModel, messages, config, route);
  } catch (error) {
    if (route.useFallbackChain) {
      return await handleFallback(task, messages, config, route, error);
    }
    throw error;
  }
}

/**
 * Handles the Tool Use / Function Calling loop
 */
async function runToolLoop(model, messages, config, route) {
  const maxIterations = 5;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    
    // Get tools from MCP if enabled
    const tools = config.useTools ? mcpManager.getToolDefinitions() : undefined;

    const result = await executeModelCall(model, messages, { ...config, tools });
    
    // Check if the model wants to call a tool
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log(`[Model Router] 🛠 AI requested ${result.toolCalls.length} tool calls...`);
      
      // Add the assistant's request to history
      messages.push({ role: 'assistant', tool_calls: result.toolCalls });

      // Execute all tool calls
      for (const toolCall of result.toolCalls) {
        try {
          const toolResult = await mcpManager.executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
          
          // Add the tool result to history
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(toolResult)
          });
        } catch (toolError) {
          console.error(`[Model Router] Tool execution failed: ${toolError.message}`);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify({ error: toolError.message })
          });
        }
      }
      
      // Loop back to give results to the model
      continue;
    }

    // No tool calls — we have the final answer
    return result;
  }

  throw new Error("Maximum tool loop iterations reached");
}

async function handleFallback(task, messages, config, route, primaryError) {
  console.warn(`[Model Router] Primary model failed for "${task}": ${primaryError.message}`);

  // Simplistic fallback for now (no multi-step tool loop in fallback yet)
  if (route.model === 'mistral') {
    console.log(`[Model Router] Fallback: Attempting cloud Groq...`);
    return await executeModelCall('groq', messages, { ...config, temperature: 0.2 });
  }
  
  throw primaryError;
}

/**
 * Low-level execution of a single model call
 */
async function executeModelCall(model, messages, config) {
    if (model === 'mistral') {
        const system = messages.find(m => m.role === 'system')?.content || '';
        const user = messages.find(m => m.role === 'user')?.content || '';
        // Note: For tool loops, we need to pass the FULL messages array.
        // We'll update the services next.
        return await callMistral(system, user, config, messages);
    }
    if (model === 'groq') {
        return await callGroq('', '', config, messages);
    }
    if (model === 'qwen') {
        const system = messages.find(m => m.role === 'system')?.content || '';
        const user = messages.find(m => m.role === 'user')?.content || '';
        const content = await generateWithQwen(system, user, config.jsonMode);
        return { content, model: 'qwen', durationMs: 0 };
    }
    throw new Error(`Unknown model target: "${model}"`);
}

module.exports = { callModel, ROUTING_TABLE };

