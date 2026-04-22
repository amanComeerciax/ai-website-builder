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
const MISTRAL_MAX_RETRIES = parseInt(process.env.MISTRAL_MAX_RETRIES) || Math.max(3, mistralKeys.length);

function getMistralClient() {
  if (mistralKeys.length === 0) return null;
  return new Mistral({ apiKey: mistralKeys[currentMistralKeyIndex] });
}

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
  if (mistralKeys.length === 0) {
    throw new Error('No MISTRAL_API_KEY configured.');
  }

  const { jsonMode = false, temperature = 0.3, tools = undefined } = options;
  const startTime = Date.now();

  // If tools are provided, we don't use streaming for now to simplify tool call handling
  const useStream = !tools;

  for (let attempt = 1; attempt <= MISTRAL_MAX_RETRIES; attempt++) {
    try {
      const client = getMistralClient();
      console.log(`[Mistral Service] Attempt ${attempt}/${MISTRAL_MAX_RETRIES} — model: ${MISTRAL_MODEL}${tools ? ' (with tools)' : ''} [Key ${currentMistralKeyIndex + 1}/${mistralKeys.length}]`);

      const messages = history.length > 0 ? history : [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      if (useStream) {
        const streamResponse = await client.chat.stream({
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
        const response = await client.chat.complete({
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
      if (error.status === 429 || error.status === 401 || (error.message && error.message.includes('429'))) {
        console.warn(`[Mistral Service] API Key ${currentMistralKeyIndex + 1} hit Error ${error.status || '429'}. Rotating key...`);
        currentMistralKeyIndex = (currentMistralKeyIndex + 1) % mistralKeys.length;
      }
      
      if (attempt === MISTRAL_MAX_RETRIES) throw error;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

module.exports = { callMistral };
