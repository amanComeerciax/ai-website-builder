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

  const visionPrompt = `You are an expert frontend developer and UI auditor. The user is showing you a screenshot of THEIR OWN website that has visual problems they want fixed.

Your job is to identify EVERY VISIBLE PROBLEM and provide EXACT fixes. Be thorough — the user is relying on your analysis.

═══ ANALYSIS CHECKLIST ═══

1. IMAGE PROBLEMS:
   - Are images too large, overflowing their containers, or displaying at raw resolution?
     FIX: "Add object-fit: cover; width: 100%; height: 250px; to the img elements in [section]"
   - Are images stretched or distorted?
     FIX: "Add object-fit: cover; to [selector]"
   - Are all images the SAME/duplicate? (identical images across different sections)
     FIX: "Replace each image with a unique, context-specific image"
   - Are images missing border-radius that other elements have?
     FIX: "Add border-radius: [Xpx]; to match the site's style"

2. TEXT / TYPOGRAPHY PROBLEMS:
   - Is text misaligned (e.g., overflowing, wrapped incorrectly, not centered)?
     FIX: "Add text-align: [value]; word-break: break-word; to [element]"
   - Are fonts inconsistent or not matching the design?
     FIX: "Change font-family/font-size/font-weight on [element]"
   - Is there a language mismatch? (e.g., Russian text on an English site, or vice versa)
     FIX: "Translate [section] text from [detected language] to [expected language]"
   - Is text too small, too large, or has wrong line-height?
     FIX: "Set font-size: [Xpx]; line-height: [X]; on [element]"

3. LAYOUT/GRID PROBLEMS:
   - Are elements not in a proper grid/flex layout when they should be?
     FIX: "Wrap elements in a container with display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;"
   - Are cards or items in a row at unequal heights?
     FIX: "Add min-height: [Xpx]; or use align-items: stretch; on the flex container"
   - Is content overflowing its container?
     FIX: "Add overflow: hidden; to [container]"

4. SPACING/ALIGNMENT:
   - Is spacing inconsistent between items?
     FIX: "Set consistent gap: [Xpx]; on the grid/flex container"
   - Are elements misaligned?
     FIX: "Add text-align: center; or justify-content: center; to [container]"

5. SECTION IDENTIFICATION (CRITICAL):
   For EVERY problem, identify the specific section:
   - Match to standard section names: hero, navbar, features, gallery, testimonials, about, pricing, team, contact, footer
   - If the section has visible heading text, include it
   - Report ALL problems you see, no matter how minor

═══ OUTPUT FORMAT (MANDATORY) ═══

SECTION: [exact section name/heading]
SEVERITY: [CRITICAL|HIGH|MEDIUM]
PROBLEMS:
- [specific problem] → FIX: [exact CSS/HTML fix]
- [specific problem] → FIX: [exact CSS/HTML fix]

═══ RULES ═══
- Report ALL visible problems. Be comprehensive.
- Be SPECIFIC: "The footer has text with font-size too large causing overflow" NOT "footer looks off"
- Include text/language problems, not just CSS/layout
- Rank by severity: CRITICAL (broken layout), HIGH (bad sizing/alignment), MEDIUM (minor spacing)`;

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
        max_tokens: 4000
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
