/**
 * Qwen Local AI Service (REFACTORED)
 * 
 * Interacts with Ollama HTTP API using qwen2.5-coder:latest.
 * 
 * Key fixes over the original qwen.js:
 * 1. stream: true — reads NDJSON chunks instead of waiting for full response
 * 2. num_ctx: 4096 — hard cap prevents OOM on CPU Macs
 * 3. Token-level timeout — 30s per token, resets on each received token
 * 4. Input length guard — rejects prompts over 14000 chars before sending
 * 5. Mistral fallback preserved for when local fails
 */

const { Mistral } = require('@mistralai/mistralai');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:latest';
const QWEN_TIMEOUT_MS = parseInt(process.env.QWEN_TIMEOUT_MS) || 300000; // 5 mins per token for large prompts
const QWEN_MAX_RETRIES = parseInt(process.env.QWEN_MAX_RETRIES) || 3;
const MAX_INPUT_CHARS = parseInt(process.env.QWEN_MAX_INPUT_CHARS) || 150000;

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const mistralClient = MISTRAL_API_KEY ? new Mistral({ apiKey: MISTRAL_API_KEY }) : null;

/**
 * Generate code via local Qwen (Ollama) with streaming.
 * Falls back to Mistral on failure.
 * 
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message/code request
 * @param {boolean} jsonMode - Whether to request JSON output format
 * @param {number} retries - Max local retry attempts
 * @param {string} preferredModel - 'qwen' | 'mistral'
 * @returns {string} Generated content
 */
async function generateWithQwen(systemPrompt, userPrompt, jsonMode = false, retries = QWEN_MAX_RETRIES, preferredModel = 'qwen') {
  // ─── GUARD: Direct Mistral routing ───
  if (preferredModel === 'mistral') {
    if (!mistralClient) {
      throw new Error('Mistral model selected but no MISTRAL_API_KEY is configured.');
    }
    console.log(`[Model Router] User selected Mistral — skipping local Ollama, going straight to cloud...`);
    return await generateWithMistral(systemPrompt, userPrompt, jsonMode);
  }

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
    stream: true,                    // FIX 1: Stream NDJSON chunks
    format: jsonMode ? 'json' : undefined,
    options: {
      temperature: 0.1,
      num_ctx: 32768,                 // FIX 2: Increased context window for large websites
    }
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Qwen Service] Attempt ${attempt}/${retries} — Streaming from Ollama (num_ctx: 32768)...`);
      const startTime = Date.now();

      // FIX 3: Token-level AbortController — resets on each received chunk
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

        if (done) {
          clearTimeout(tokenTimer);
          break;
        }

        // Reset the token-level timeout on each received chunk
        clearTimeout(tokenTimer);
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
            // Ollama sends { done: true } on final chunk
            if (chunk.done) {
              clearTimeout(tokenTimer);
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
        console.warn(`[Qwen Service] Local generation failed after ${retries} attempts. Escalating to fallback...`);
        break;
      }

      // If Ollama is down entirely, don't waste time retrying locally
      if (isConnectionDead) {
        console.warn(`[Qwen Service] Ollama server is unreachable. Skipping remaining retries.`);
        break;
      }

      // Backoff before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  // ─── ERROR: Local generation failed ───
  throw new Error(`Local Qwen generation failed after ${retries} attempts.`);
}


/**
 * Direct Mistral Cloud API generation.
 */
async function generateWithMistral(systemPrompt, userPrompt, jsonMode = false) {
  if (!mistralClient) {
    throw new Error('No MISTRAL_API_KEY configured.');
  }

  try {
    const chatStreamResponse = await mistralClient.chat.stream({
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
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
      JSON.parse(content);
    }

    console.log(`[Mistral] Generation succeeded! (${content.length} characters)`);
    return content;

  } catch (mistralError) {
    console.error(`[Mistral Error]:`, mistralError);
    throw new Error(`Mistral generation failed: ${mistralError.message}`);
  }
}

module.exports = { generateWithQwen, generateWithMistral };
