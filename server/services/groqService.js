/**
 * Groq Cloud AI Service
 * 
 * Target: Fast inference, chat fallbacks, user feedback.
 * Uses Llama-3.1-8b.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * Call Groq Cloud API via native `fetch`.
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - Current message / task
 * @param {object} options - Options containing temperature and JSON format override (if applicable)
 * @returns {Promise<{ content: string, model: string, durationMs: number }>}
 */
async function callGroq(systemPrompt, userPrompt, options = {}) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in the environment.');
  }

  const model = options.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const temperature = options.temperature || 0.5;
  const jsonMode = options.jsonMode || false;

  console.log(`[Groq Service] Calling ${model} (temp: ${temperature}, json: ${jsonMode})`);
  const startTime = Date.now();

  try {
    const payload = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: temperature,
      max_tokens: options.maxTokens || 8192,
    };

    // Note: Groq expects raw JSON parsing rules but optionally accepts response_format natively.
    if (jsonMode) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq HTTP Error: ${response.status} ${response.statusText} — ${errText}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq returned malformed response body');
    }

    if (jsonMode) {
      try {
        JSON.parse(content);
      } catch (e) {
        throw new Error(`Groq generation returned invalid JSON structure: ${e.message}`);
      }
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Groq Service] ✅ Generation succeeded in ${(durationMs / 1000).toFixed(1)}s (${content.length} chars)`);

    return {
      content,
      model,
      durationMs
    };

  } catch (error) {
    console.error(`[Groq Error] Request failed:`, error);
    throw new Error(`Groq API generation failed: ${error.message}`);
  }
}

module.exports = { callGroq };
