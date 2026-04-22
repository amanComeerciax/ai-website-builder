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
async function callMistral(systemPrompt, userMessage, options = {}, history = []) {
  // Collect all Mistral tokens from environment variables
  const tokens = [];
  if (process.env.MISTRAL_API_KEY) tokens.push(process.env.MISTRAL_API_KEY);
  
  let i = 2;
  while (process.env[`MISTRAL_API_KEY_${i}`]) {
    tokens.push(process.env[`MISTRAL_API_KEY_${i}`]);
    i++;
  }

  if (tokens.length === 0) {
    throw new Error('MISTRAL_API_KEY is not configured.');
  }

  const { jsonMode = false, temperature = 0.3, tools = undefined } = options;
  const startTime = Date.now();

  // If tools are provided, we don't use streaming for now to simplify tool call handling
  const useStream = !tools;

  let lastError = null;

  // Try each token
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const currentToken = tokens[tokenIndex];
    const mistralClient = new Mistral({ apiKey: currentToken });
    const isLastToken = tokenIndex === tokens.length - 1;

    for (let attempt = 1; attempt <= MISTRAL_MAX_RETRIES; attempt++) {
      try {
        console.log(`[Mistral Service] Token ${tokenIndex + 1}/${tokens.length} — Attempt ${attempt}/${MISTRAL_MAX_RETRIES} — model: ${MISTRAL_MODEL}${tools ? ' (with tools)' : ''}`);

        const messages = history.length > 0 ? history : [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ];

        if (useStream) {
          const streamResponse = await mistralClient.chat.stream({
            model: MISTRAL_MODEL,
            messages,
            temperature,
            maxTokens: 16384,
            responseFormat: jsonMode ? { type: 'json_object' } : undefined
          });

          let content = '';
          for await (const chunk of streamResponse) {
            const delta = chunk?.data?.choices?.[0]?.delta?.content;
            if (delta) content += delta;
          }
          return { content, model: MISTRAL_MODEL, durationMs: Date.now() - startTime };
        } else {
          // Standard chat completion for tool calling
          const response = await mistralClient.chat.complete({
            model: MISTRAL_MODEL,
            messages,
            temperature,
            tools,
            toolChoice: 'auto',
            responseFormat: jsonMode ? { type: 'json_object' } : undefined
          });

          const choice = response.choices[0];
          return {
            content: choice.message.content || '',
            toolCalls: choice.message.toolCalls,
            model: MISTRAL_MODEL,
            durationMs: Date.now() - startTime
          };
        }

      } catch (error) {
        lastError = error;
        const isRateLimit = error.message.toLowerCase().includes('429') || 
                           error.message.toLowerCase().includes('rate limit') ||
                           error.message.toLowerCase().includes('quota');

        if (isRateLimit && !isLastToken && attempt === MISTRAL_MAX_RETRIES) {
          console.warn(`[Mistral Service] Token ${tokenIndex + 1} rate limited. Trying next token...`);
          break; // Move to next token
        }

        if (attempt === MISTRAL_MAX_RETRIES) throw error;
        console.warn(`[Mistral Service] Attempt ${attempt} failed: ${error.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError || new Error('Mistral generation failed after trying all tokens.');
}

module.exports = { callMistral };
