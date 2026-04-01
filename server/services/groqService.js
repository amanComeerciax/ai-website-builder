/**
 * Groq Cloud AI Service
 * 
 * Used for: fallback code generation (when Qwen fails), instant chat responses
 * Routes: fallback_file, fix_file (after Qwen retries), chat_response
 * 
 * Model: llama-3.1-8b-instant (OpenAI-compatible API)
 * Extremely fast — typically <2s response time
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MAX_RETRIES = 3;

/**
 * Generate a response from Groq Cloud API (OpenAI-compatible).
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userMessage - User message
 * @param {object} options
 * @param {boolean} options.jsonMode - Request JSON output format
 * @param {number} options.temperature - 0.2 for code fallback, 0.5 for chat
 * @returns {{ content: string, model: string, durationMs: number }}
 */
async function callGroq(systemPrompt, userMessage, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const { jsonMode = false, temperature = 0.2 } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= GROQ_MAX_RETRIES; attempt++) {
    try {
      console.log(`[Groq Service] Attempt ${attempt}/${GROQ_MAX_RETRIES} — model: ${GROQ_MODEL}, temp: ${temperature}`);

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature,
          max_tokens: 8192,
          response_format: jsonMode ? { type: 'json_object' } : undefined
        })
      });

      if (response.status === 429) {
        if (attempt < GROQ_MAX_RETRIES) {
          console.warn(`[Groq Service] 429 Rate limited — backing off 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw new Error('Groq rate limited after all retries');
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errBody.substring(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content || content.trim().length === 0) {
        throw new Error('Groq returned empty response');
      }

      if (jsonMode) {
        JSON.parse(content); // Validate parseable
      }

      const durationMs = Date.now() - startTime;
      console.log(`[Groq Service] ✅ Completed in ${(durationMs / 1000).toFixed(1)}s (${content.length} chars)`);

      return { content, model: GROQ_MODEL, durationMs };

    } catch (error) {
      if (attempt === GROQ_MAX_RETRIES) {
        console.error(`[Groq Service] ❌ Failed after ${GROQ_MAX_RETRIES} attempts:`, error.message);
        throw new Error(`Groq generation failed: ${error.message}`);
      }

      console.warn(`[Groq Service] Attempt ${attempt} failed: ${error.message}. Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

module.exports = { callGroq };
