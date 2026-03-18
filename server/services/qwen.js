/**
 * Qwen Local AI Service with Mistral Fallback
 * 
 * Interacts with Ollama HTTP API to generate code using qwen2.5-coder:latest.
 * If local generation times out or fails (e.g. CPU bottlenecks), it falls back
 * to the Mistral API using mistral-large-latest.
 */

const { Mistral } = require('@mistralai/mistralai');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:latest';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const mistralClient = MISTRAL_API_KEY ? new Mistral({ apiKey: MISTRAL_API_KEY }) : null;

/**
 * Execute a prompt against the local Qwen model via Ollama.
 * Falls back to Mistral API on failure.
 * @param {string} preferredModel - 'qwen' (default with fallback) or 'mistral' (direct cloud)
 */
async function generateWithQwen(systemPrompt, userPrompt, jsonMode = false, retries = 2, preferredModel = 'qwen') {
  // If user explicitly chose Mistral, skip local Ollama entirely
  if (preferredModel === 'mistral') {
    if (!mistralClient) {
      throw new Error('Mistral model selected but no MISTRAL_API_KEY is configured.');
    }
    console.log(`[Model Router] User selected Mistral — skipping local Ollama, going straight to cloud...`);
    return await generateWithMistral(systemPrompt, userPrompt, jsonMode);
  }

  // ─── DEFAULT: ATTEMPT LOCAL OLLAMA FIRST (with Mistral fallback) ───
  const url = `${OLLAMA_HOST}/api/generate`;
  
  const payload = {
    model: OLLAMA_MODEL,
    system: systemPrompt,
    prompt: userPrompt,
    stream: false,
    format: jsonMode ? 'json' : undefined,
    options: {
      temperature: 0.1,    // Low temp for rigid, predictable code structure
      num_ctx: 32768,      // Expand context window for multi-file generation
    }
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[QWen Service] Attempt ${attempt}/${retries} - Generating locally via Ollama...`);
      
      const controller = new AbortController();
      // Reduced timeout to 60s - if CPU Mac can't finish in 60s, fallback to Cloud
      const timeoutId = setTimeout(() => controller.abort(), 60000); 

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (jsonMode) {
        JSON.parse(data.response); // Validate parseable
      }

      return data.response;

    } catch (error) {
      const isSystemTimeout = error.name === 'AbortError' || error.message.includes('fetch failed');
      console.warn(`[QWen Local Error] Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === retries) {
        console.warn(`[QWen] Local generation failed after ${retries} attempts. Escalating to Mistral Fallback...`);
        break; // Exit local retry loop, move to fallback
      }
      
      // If server is physically down (fetch failed) don't bother retrying locally
      if (error.message.includes('ECONNREFUSED')) break;

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // ─── 2. FALLBACK TO MISTRAL CLOUD API ───
  if (!mistralClient) {
    throw new Error('Local generation failed and no MISTRAL_API_KEY is configured for fallback.');
  }

  console.log(`[Mistral Fallback] Local Qwen failed, falling back to Mistral Cloud API...`);
  return await generateWithMistral(systemPrompt, userPrompt, jsonMode);
}

/**
 * Direct Mistral Cloud API generation (reusable helper).
 */
async function generateWithMistral(systemPrompt, userPrompt, jsonMode = false) {
  if (!mistralClient) {
    throw new Error('No MISTRAL_API_KEY configured.');
  }

  try {
    // We use .stream() instead of .complete() to bypass Node/Undici's hard 5-minute HeadersTimeoutError.
    // Heavy JSON payloads (like 6-file mega apps) can take >300s to generate completely. 
    // Streaming starts receiving headers instantly, keeping the TCP connection alive.
    const chatStreamResponse = await mistralClient.chat.stream({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      responseFormat: jsonMode ? { type: 'json_object' } : undefined
    });

    let content = '';
    for await (const chunk of chatStreamResponse) {
      const deltaContent = chunk?.data?.choices?.[0]?.delta?.content;
      if (deltaContent) {
        content += deltaContent;
      }
    }
    
    if (jsonMode) {
      JSON.parse(content); // Validate parseable
    }

    console.log(`[Mistral] Generation succeeded! (${content.length} characters)`);
    return content;

  } catch (mistralError) {
    console.error(`[Mistral Error]:`, mistralError);
    throw new Error(`Mistral generation failed: ${mistralError.message}`);
  }
}

module.exports = { generateWithQwen, generateWithMistral };
