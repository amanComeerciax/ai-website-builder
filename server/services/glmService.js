/**
 * GLM (Zhipu AI) Cloud AI Service
 * 
 * Used for: Fast reasoning and content generation (OpenAI-compatible)
 * Routes: parse_prompt, plan_structure, chat_response
 * 
 * Model: glm-4-flash or glm-4
 */

const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_MAX_RETRIES = 2;

/**
 * Generate a response from GLM Cloud API (OpenAI-compatible).
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userMessage - User message
 * @param {object} options
 * @param {boolean} options.jsonMode - Request JSON output format
 * @param {number} options.temperature - 0.2 for plan, 0.5 for chat
 * @returns {{ content: string, model: string, durationMs: number }}
 */
async function callGLM(systemPrompt, userMessage, options = {}) {
  // Collect all GLM tokens from environment variables
  const tokens = [];
  if (process.env.GLM_API_KEY) tokens.push(process.env.GLM_API_KEY);
  
  let i = 2;
  while (process.env[`GLM_API_KEY_${i}`]) {
    tokens.push(process.env[`GLM_API_KEY_${i}`]);
    i++;
  }

  if (tokens.length === 0) {
    throw new Error('GLM_API_KEY is not configured.');
  }

  const GLM_MODEL = process.env.GLM_MODEL || 'glm-4-flash';
  const { jsonMode = false, temperature = 0.2 } = options;
  const startTime = Date.now();
  let lastError = null;

  // Try each token
  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const currentToken = tokens[tokenIndex];
    const isLastToken = tokenIndex === tokens.length - 1;

    for (let attempt = 1; attempt <= GLM_MAX_RETRIES; attempt++) {
      try {
        console.log(`[GLM Service] Token ${tokenIndex + 1}/${tokens.length} — Attempt ${attempt}/${GLM_MAX_RETRIES} — model: ${GLM_MODEL}, temp: ${temperature}`);

        const response = await fetch(GLM_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            model: GLM_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature,
            max_tokens: 4096,
          })
        });

        if (response.status === 429) {
          if (!isLastToken && attempt === GLM_MAX_RETRIES) {
            console.warn(`[GLM Service] Token ${tokenIndex + 1} rate limited. Trying next token...`);
            break; // Move to next token
          }
          if (attempt < GLM_MAX_RETRIES) {
            console.warn(`[GLM Service] 429 Rate limited — backing off 5s...`);
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }
          throw new Error('GLM rate limited after all retries');
        }

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`GLM HTTP ${response.status}: ${errBody.substring(0, 200)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content || content.length === 0) {
          throw new Error('GLM returned empty response');
        }

        if (jsonMode) {
          try {
            let clean = content.trim();
            if (clean.startsWith('```json')) clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
            else if (clean.startsWith('```')) clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
            JSON.parse(clean); 
          } catch (e) {
            throw new Error('GLM returned invalid JSON');
          }
        }

        const durationMs = Date.now() - startTime;
        console.log(`[GLM Service] ✅ Completed in ${(durationMs / 1000).toFixed(1)}s (${content.length} chars)`);

        return { content, model: GLM_MODEL, durationMs };

      } catch (error) {
        lastError = error;
        const isRateLimit = error.message.includes('429') || error.message.includes('rate limit');
        
        if (attempt === GLM_MAX_RETRIES) {
          if (!isLastToken && isRateLimit) {
            console.warn(`[GLM Service] Token ${tokenIndex + 1} failed with rate limit. Trying fallback...`);
            break; // Move to next token
          }
          console.error(`[GLM Service] ❌ Failed after ${GLM_MAX_RETRIES} attempts on token ${tokenIndex + 1}:`, error.message);
          if (isLastToken) throw error;
        }

        console.warn(`[GLM Service] Attempt ${attempt} on token ${tokenIndex + 1} failed: ${error.message}. Retrying...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  throw lastError || new Error('GLM generation failed after trying all tokens.');
}

module.exports = { callGLM };
