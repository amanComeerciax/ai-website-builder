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
  const GLM_API_KEY = process.env.GLM_API_KEY;
  const GLM_MODEL = process.env.GLM_MODEL || 'glm-4-flash';

  if (!GLM_API_KEY) {
    throw new Error('GLM_API_KEY is not configured.');
  }

  const { jsonMode = false, temperature = 0.2 } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= GLM_MAX_RETRIES; attempt++) {
    try {
      console.log(`[GLM Service] Attempt ${attempt}/${GLM_MAX_RETRIES} — model: ${GLM_MODEL}, temp: ${temperature}`);

      const response = await fetch(GLM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GLM_API_KEY}`
        },
        body: JSON.stringify({
          model: GLM_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature,
          max_tokens: 4096,
          // Note: GLM json response format might vary if not specified, 
          // usually just saying 'respond in json' in prompt is enough,
          // but we follow OpenAI style.
        })
      });

      if (response.status === 429) {
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
          // Sometimes models wrap JSON in markdown
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
      if (attempt === GLM_MAX_RETRIES) {
        console.error(`[GLM Service] ❌ Failed after ${GLM_MAX_RETRIES} attempts:`, error.message);
        throw new Error(`GLM generation failed: ${error.message}`);
      }

      console.warn(`[GLM Service] Attempt ${attempt} failed: ${error.message}. Retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

module.exports = { callGLM };
