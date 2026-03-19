/**
 * Mistral Cloud AI Service
 * 
 * Used for reasoning, planning, summarizing — NOT code generation.
 * Routes: parse_prompt, plan_structure, summarize
 * 
 * Model: mistral-small-latest (or MISTRAL_MODEL env var)
 * Retry: on 429 with 5s backoff, max 2 retries
 */

const { Mistral } = require('@mistralai/mistralai');

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';
const MISTRAL_MAX_RETRIES = parseInt(process.env.MISTRAL_MAX_RETRIES) || 2;

const client = MISTRAL_API_KEY ? new Mistral({ apiKey: MISTRAL_API_KEY }) : null;

/**
 * Generate a response from Mistral Cloud API.
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userMessage - User message
 * @param {object} options
 * @param {boolean} options.jsonMode - Request JSON output format
 * @param {number} options.temperature - 0.3 for planning/parsing, 0.5 for summaries
 * @returns {{ content: string, model: string, durationMs: number }}
 */
async function callMistral(systemPrompt, userMessage, options = {}) {
  if (!client) {
    throw new Error('MISTRAL_API_KEY is not configured.');
  }

  const { jsonMode = false, temperature = 0.3 } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= MISTRAL_MAX_RETRIES; attempt++) {
    try {
      console.log(`[Mistral Service] Attempt ${attempt}/${MISTRAL_MAX_RETRIES} — model: ${MISTRAL_MODEL}, temp: ${temperature}`);

      // Use streaming to avoid Node/Undici HeadersTimeoutError on long responses
      const streamResponse = await client.chat.stream({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature,
        responseFormat: jsonMode ? { type: 'json_object' } : undefined
      });

      let content = '';
      for await (const chunk of streamResponse) {
        const delta = chunk?.data?.choices?.[0]?.delta?.content;
        if (delta) content += delta;
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Mistral returned empty response');
      }

      if (jsonMode) {
        JSON.parse(content); // Validate parseable
      }

      const durationMs = Date.now() - startTime;
      console.log(`[Mistral Service] ✅ Completed in ${(durationMs / 1000).toFixed(1)}s (${content.length} chars)`);

      return { content, model: MISTRAL_MODEL, durationMs };

    } catch (error) {
      const isRateLimit = error.statusCode === 429 || error.message?.includes('429');

      if (isRateLimit && attempt < MISTRAL_MAX_RETRIES) {
        console.warn(`[Mistral Service] 429 Rate limited — backing off 5s before retry ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      if (attempt === MISTRAL_MAX_RETRIES) {
        console.error(`[Mistral Service] ❌ Failed after ${MISTRAL_MAX_RETRIES} attempts:`, error.message);
        throw new Error(`Mistral generation failed: ${error.message}`);
      }

      // Non-rate-limit error on non-final attempt — retry with 2s backoff
      console.warn(`[Mistral Service] Attempt ${attempt} failed: ${error.message}. Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

module.exports = { callMistral };
