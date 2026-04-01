/**
 * OpenRouter AI Service
 * 
 * Provides access to a wide variety of LLM models through a unified API.
 * Primarily used as a high-redundancy fallback for reasoning tasks.
 * 
 * Model: openrouter/auto-free (automatically selects the best available free model)
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'nvidia/nemotron-nano-9b-v2:free';

/**
 * Generate a response using OpenRouter.
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userMessage - User message
 * @param {object} options
 * @param {boolean} options.jsonMode - Request JSON output format
 * @param {number} options.temperature - 0.2 to 0.5
 * @returns {{ content: string, model: string, durationMs: number }}
 */
async function callOpenRouter(systemPrompt, userMessage, options = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured.');
  }

  const { jsonMode = false, temperature = 0.3 } = options;
  const startTime = Date.now();

  try {
    console.log(`[OpenRouter Service] Calling ${DEFAULT_MODEL} (temp: ${temperature})...`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stackforge.ai', // Optional: identify your app
        'X-Title': 'StackForge AI'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature,
        response_format: jsonMode ? { type: 'json_object' } : undefined
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter Error ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('OpenRouter returned empty response');
    }

    const durationMs = Date.now() - startTime;
    console.log(`[OpenRouter Service] ✅ Completed in ${(durationMs / 1000).toFixed(1)}s (${content.length} chars)`);

    return { 
      content, 
      model: data.model || DEFAULT_MODEL, 
      durationMs 
    };

  } catch (error) {
    console.error(`[OpenRouter Service] ❌ Failed:`, error.message);
    throw error;
  }
}

module.exports = { callOpenRouter };
