/**
 * Qwen Local AI Service (Strict Resiliency) — V3.0 FALLBACK ONLY
 * 
 * Interacts with Ollama HTTP API using qwen2.5-coder:latest.
 * This service is now the FALLBACK for all tasks — primary routing goes to
 * Mistral (code gen) and Groq (reasoning/planning).
 * 
 * Strict Controls (V3.0):
 * 1. MAX_INPUT_CHARS = 3500 -> Hard cap to prevent local OOM.
 * 2. num_ctx = 4096 -> Caps Ollama's KV cache strictly.
 * 3. stream: true -> Enables chunk reading.
 * 4. 30s token timeout -> Prevents silent hangs by resetting on every chunk.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:latest';
const QWEN_TIMEOUT_MS = 30000;  // 30s per-token timeout (V3.0 strict)
const MAX_INPUT_CHARS = 3500;   // 3.5k chars — strict fallback limit (V3.0)

/**
 * Generate code via local Qwen (Ollama) with streaming.
 * Note: Fallbacks are now handled by modelRouter.js
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message/code request
 * @param {boolean} jsonMode - Whether to request JSON output format
 * @param {number} retries - Max local retry attempts
 * @returns {Promise<string>} Generated content
 */
async function generateWithQwen(systemPrompt, userPrompt, jsonMode = false, retries = 3) {
  // ─── GUARD: Input length check ───
  const totalInputLength = (systemPrompt || '').length + (userPrompt || '').length;
  if (totalInputLength > MAX_INPUT_CHARS) {
    const err = new Error(`PROMPT_TOO_LARGE: Combined input is ${totalInputLength} chars (max ${MAX_INPUT_CHARS}). Route to a cloud model instead.`);
    err.code = 'PROMPT_TOO_LARGE';
    throw err;
  }

  // ─── LOCAL OLLAMA WITH STREAMING ───
  const url = `${OLLAMA_HOST}/api/generate`;

  const payload = {
    model: OLLAMA_MODEL,
    system: systemPrompt,
    prompt: userPrompt,
    stream: true,                    
    format: jsonMode ? 'json' : undefined,
    options: {
      temperature: 0.1,
      num_ctx: 4096,                // 4k context — strict V3.0 fallback cap
    }
  };

  console.log(`[Qwen] 🧠 FALLBACK generation: task has ${(systemPrompt||'').length + (userPrompt||'').length} chars | ctx=4096 | json=${jsonMode}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Qwen] Attempt ${attempt}/${retries} — streaming from Ollama...`);
      const startTime = Date.now();

      // Token-level AbortController — resets on each received chunk
      const controller = new AbortController();
      let tokenTimer = setTimeout(() => controller.abort(), QWEN_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        clearTimeout(tokenTimer);
        throw new Error(`Ollama HTTP Error: ${response.status} ${response.statusText}`);
      }

      // Parse streaming NDJSON response
      let fullContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        // Reset the token-level timeout on each received chunk
        clearTimeout(tokenTimer);

        if (done) {
          break;
        }

        tokenTimer = setTimeout(() => controller.abort(), QWEN_TIMEOUT_MS);

        buffer += decoder.decode(value, { stream: true });

        // Process complete NDJSON lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) {
              fullContent += chunk.response;
            }
          } catch (parseErr) {
            // Skip malformed NDJSON lines
            console.warn(`[Qwen Service] Skipping malformed NDJSON line`);
          }
        }
      }

      clearTimeout(tokenTimer);

      if (!fullContent || fullContent.trim().length === 0) {
        throw new Error('Ollama returned empty response');
      }

      // Validate JSON if requested
      if (jsonMode) {
        JSON.parse(fullContent); // Will throw if invalid
      }

      const durationMs = Date.now() - startTime;
      console.log(`[Qwen Service] ✅ Generation succeeded in ${(durationMs / 1000).toFixed(1)}s (${fullContent.length} chars)`);
      return fullContent;

    } catch (error) {
      const isTimeout = error.name === 'AbortError';
      const isConnectionDead = error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed');
      
      console.warn(`[Qwen Service] ❌ Attempt ${attempt}/${retries} failed: ${isTimeout ? 'TOKEN_TIMEOUT (30s no response)' : error.message}`);

      if (attempt === retries) {
        console.warn(`[Qwen Service] Local generation failed after ${retries} attempts. Escalating upstream...`);
        throw error; // Let modelRouter catch and fallback
      }

      // If Ollama is down entirely, don't waste time retrying locally
      if (isConnectionDead) {
        console.warn(`[Qwen Service] Ollama server is unreachable. Skipping remaining retries.`);
        throw error; // Let modelRouter catch and fallback
      }

      // Backoff before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

module.exports = { generateWithQwen };
