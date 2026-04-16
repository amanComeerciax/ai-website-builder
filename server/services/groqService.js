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

  const visionPrompt = `You are an expert UI/UX auditor. The user is showing you a screenshot of THEIR OWN website that has problems they want fixed.

Your job is to identify SPECIFIC PROBLEMS — not describe the design. Focus on what's BROKEN or WRONG.

Analyze and report:

1. LAYOUT PROBLEMS: Are elements misaligned? Is spacing inconsistent? Are columns uneven? Is content overflowing or overlapping?
2. SIZING ISSUES: Are images too large/small? Is text the wrong size? Are cards/containers improperly sized?
3. ALIGNMENT DEFECTS: Are elements not centered when they should be? Is text left-aligned when it should be centered? Are grid items misaligned?
4. MISSING PROPERTIES: Are there missing borders, shadows, padding, margins, or border-radius that make elements look broken?
5. IMAGE PROBLEMS: Are images stretched, cropped badly, or showing placeholder/broken content?
6. SECTION IDENTIFICATION: Identify WHICH section (hero, features, testimonials, gallery, pricing, footer, etc.) each problem is in.

FORMAT YOUR RESPONSE AS:
SECTION: [section name]
PROBLEMS:
- [specific problem 1 with exact CSS fix suggestion]
- [specific problem 2 with exact CSS fix suggestion]

ONLY report actual problems. Do NOT describe things that look fine. Do NOT suggest redesigns — only fixes.
Be specific: "The 3 image cards have unequal heights — add min-height or object-fit:cover" NOT "the layout could be improved".`;

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
