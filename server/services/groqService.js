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
const GROQ_MAX_RETRIES = 2;

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
async function callGroq(systemPrompt, userMessage, options = {}, history = []) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const { jsonMode = false, temperature = 0.2, tools = undefined } = options;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= GROQ_MAX_RETRIES; attempt++) {
    try {
      console.log(`[Groq Service] Attempt ${attempt}/${GROQ_MAX_RETRIES} — model: ${GROQ_MODEL}${tools ? ' (with tools)' : ''}`);

      const messages = history.length > 0 ? history : [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature,
          tools,
          tool_choice: tools ? 'auto' : undefined,
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
      const message = data.choices?.[0]?.message;

      if (jsonMode && message.content) {
        try { JSON.parse(message.content); } catch (e) { throw new Error('Invalid JSON returned'); }
      }

      const durationMs = Date.now() - startTime;
      console.log(`[Groq Service] ✅ Completed in ${(durationMs / 1000).toFixed(1)}s`);

      return { 
        content: message.content || '', 
        toolCalls: message.tool_calls,
        model: GROQ_MODEL, 
        durationMs 
      };

    } catch (error) {
      if (attempt === GROQ_MAX_RETRIES) throw error;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/**
 * Extract UI/Design context from an image using Groq Vision
 * 
 * @param {Array<{id: string, name: string, preview: string}>} images - Array of base64 images
 * @returns {Promise<string>} Detailed extracted design specification
 */
async function extractVisionContext(images) {
  if (!GROQ_API_KEY) {
    console.warn('[Groq Vision] API Key missing, skipping vision extraction.');
    return '';
  }

  if (!images || images.length === 0) return '';

  const visionPrompt = `You are an expert UI/UX designer. Analyze the attached screenshot(s) precisely.
Extract and describe the following in extreme detail so a web developer can perfectly recreate it:
1. Overall Layout (columns, cards, spacing)
2. Exact Colors (estimate hex codes for background, exact text colors, buttons)
3. Typography (is it Sans-serif like Inter, serif like Merriweather? Font weights and sizes)
4. Key UI Components (buttons, toggles, navbars, shadows, border radii)

Format as a highly structured, dense text block.`;

  // Format messages for OpenAI-compatible multimodal endpoint
  const contentArray = [
    { type: 'text', text: visionPrompt }
  ];

  // The client sends `preview` as "data:image/png;base64,....."
  for (const img of images) {
    if (img.preview) {
      contentArray.push({
        type: 'image_url',
        image_url: { url: img.preview }
      });
    }
  }

  const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
  console.log(`[Groq Vision] Extracting context from ${images.length} image(s) using ${VISION_MODEL}...`);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{ role: 'user', content: contentArray }],
        temperature: 0.1,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[Groq Vision Error] HTTP ${response.status}: ${errBody}`);
      return ''; // Graceful degradation
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log(`[Groq Vision] ✅ Extracted context (${content.length} chars)`);
    return content;

  } catch (error) {
    console.error(`[Groq Vision Error] Failed to extract context:`, error.message);
    return ''; // Fail open (just use text prompt)
  }
}

module.exports = { callGroq, extractVisionContext };
