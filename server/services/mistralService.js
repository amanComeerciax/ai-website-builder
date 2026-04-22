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

const mistralKeys = [
  process.env.MISTRAL_API_KEY,
  process.env.MISTRAL_API_KEY_2,
  process.env.MISTRAL_API_KEY_3
].filter(Boolean);
let currentMistralKeyIndex = 0;

const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';
const MISTRAL_MAX_RETRIES = parseInt(process.env.MISTRAL_MAX_RETRIES) || 3;

/**
 * Generate a response from Mistral Cloud API.
 */
async function callMistral(systemPrompt, userMessage, options = {}, history = []) {
  if (mistralKeys.length === 0) {
    throw new Error('No MISTRAL_API_KEY configured.');
  }

  const { jsonMode = false, temperature = 0.3, tools = undefined } = options;
  const startTime = Date.now();
  let lastError = null;

  // Try each token
  for (let tokenIndex = 0; tokenIndex < mistralKeys.length; tokenIndex++) {
    const currentToken = mistralKeys[tokenIndex];
    const mistralClient = new Mistral({ apiKey: currentToken });
    const isLastToken = tokenIndex === mistralKeys.length - 1;

    for (let attempt = 1; attempt <= MISTRAL_MAX_RETRIES; attempt++) {
      try {
        console.log(`[Mistral Service] Token ${tokenIndex + 1}/${mistralKeys.length} — Attempt ${attempt}/${MISTRAL_MAX_RETRIES} — model: ${MISTRAL_MODEL}`);

        const messages = history.length > 0 ? history : [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ];

        // Standard chat completion
        const response = await mistralClient.chat.complete({
          model: MISTRAL_MODEL,
          messages,
          temperature,
          tools,
          toolChoice: tools ? 'auto' : undefined,
          responseFormat: jsonMode ? { type: 'json_object' } : undefined
        });

        const choice = response.choices[0];
        const durationMs = Date.now() - startTime;
        console.log(`[Mistral Service] ✅ Completed in ${(durationMs / 1000).toFixed(1)}s`);

        return {
          content: choice.message.content || '',
          toolCalls: choice.message.toolCalls,
          model: MISTRAL_MODEL,
          durationMs
        };

      } catch (error) {
        lastError = error;
        const isRateLimit = error.message.toLowerCase().includes('429') || 
                           error.message.toLowerCase().includes('rate limit') ||
                           error.message.toLowerCase().includes('quota');

        if (isRateLimit && !isLastToken && attempt === MISTRAL_MAX_RETRIES) {
          console.warn(`[Mistral Service] Token ${tokenIndex + 1} rate limited. Trying next token...`);
          break; // Move to next token
        }

        if (attempt === MISTRAL_MAX_RETRIES) {
           if (isLastToken) throw error;
           break; // Move to next token
        }
        
        console.warn(`[Mistral Service] Attempt ${attempt} failed: ${error.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError || new Error('Mistral generation failed after trying all tokens.');
}

module.exports = { callMistral };
