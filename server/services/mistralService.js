/**
 * Mistral Cloud AI Service
 * 
 * Uses the official @mistralai/mistralai SDK.
 * Handles model routing fallback from Qwen, reasoning tasks, and classification.
 */

const { Mistral } = require('@mistralai/mistralai');

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Lazy initialization so the app doesn't crash on boot if the key is missing
let mistralClient = null;
function getClient() {
  if (!mistralClient) {
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is not configured in the environment.');
    }
    mistralClient = new Mistral({ apiKey: MISTRAL_API_KEY });
  }
  return mistralClient;
}

/**
 * Call Mistral's Cloud API with streaming support for NDJSON chunks locally.
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - Current message / task
 * @param {object} options - Options containing temperature and jsonMode boolean
 * @returns {Promise<{ content: string, model: string, durationMs: number }>}
 */
async function callMistral(systemPrompt, userPrompt, options = {}) {
  const client = getClient();
  const model = options.model || process.env.MISTRAL_MODEL || 'mistral-small-latest';
  const temperature = options.temperature || 0.3;
  const jsonMode = options.jsonMode || false;

  console.log(`[Mistral Service] Calling ${model} (temp: ${temperature}, json: ${jsonMode})`);
  const startTime = Date.now();

  try {
    const chatStreamResponse = await client.chat.stream({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature,
      responseFormat: jsonMode ? { type: 'json_object' } : undefined
    });

    let content = '';
    // Iterate the streaming iterator
    for await (const chunk of chatStreamResponse) {
      const deltaContent = chunk?.data?.choices?.[0]?.delta?.content;
      if (deltaContent) {
        content += deltaContent;
      }
    }

    // In JSON Mode, we should proactively validate what Mistral returned
    if (jsonMode) {
      try {
        JSON.parse(content);
      } catch (e) {
        throw new Error(`Mistral generation returned invalid JSON structure: ${e.message}`);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Mistral Service] ✅ Generation succeeded in ${(durationMs / 1000).toFixed(1)}s (${content.length} chars)`);
    
    return {
      content,
      model,
      durationMs
    };

  } catch (error) {
    console.error(`[Mistral Error] Request failed:`, error);
    throw new Error(`Mistral API generation failed: ${error.message}`);
  }
}

module.exports = { callMistral };
