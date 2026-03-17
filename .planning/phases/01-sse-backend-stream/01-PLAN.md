# Plan 01: SSE Streaming Route & Qwen Streaming Mode

---
wave: 1
depends_on: []
files_modified:
  - server/routes/generate.js
  - server/services/qwen.js
autonomous: true
requirements: []
---

## Goal
Replace the current `POST /api/generate` (which returns a `202 + jobId`) with a new `GET /api/generate/stream/:jobId` SSE endpoint that holds the HTTP connection open and pushes real-time events. Simultaneously, upgrade `qwen.js` to support Ollama's native streaming mode (`stream: true`) so tokens arrive incrementally.

## must_haves
- The SSE endpoint must send `Content-Type: text/event-stream` headers
- The SSE endpoint must emit `event: thinking`, `event: log`, `event: token`, `event: complete`, and `event: error` typed events
- `qwen.js` must support a `streamWithQwen()` function that returns an async iterable of token chunks
- The existing `generateWithQwen()` must remain unchanged for backward compatibility

## Tasks

### Task 1: Add `streamWithQwen()` to `qwen.js`

<read_first>
- server/services/qwen.js
</read_first>

<action>
Add a new exported async generator function `streamWithQwen(systemPrompt, userPrompt)` that:

1. Calls `POST ${OLLAMA_HOST}/api/generate` with `stream: true` in the payload body
2. Reads the response body as an NDJSON stream (each line is a JSON object with a `response` field containing token text and a `done` boolean)
3. Yields each token string as it arrives
4. On `done: true`, yields a final empty string and returns

The function signature:
```js
async function* streamWithQwen(systemPrompt, userPrompt) {
  const url = `${OLLAMA_HOST}/api/generate`;
  const payload = {
    model: OLLAMA_MODEL,
    system: systemPrompt,
    prompt: userPrompt,
    stream: true,
    options: { temperature: 0.1, num_ctx: 32768 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Ollama HTTP Error: ${response.status}`);

  const reader = response.body;
  let buffer = '';
  for await (const chunk of reader) {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line);
      yield parsed.response || '';
      if (parsed.done) return;
    }
  }
}
```

Add to `module.exports`: `{ generateWithQwen, streamWithQwen }`
</action>

<acceptance_criteria>
- `server/services/qwen.js` contains `async function* streamWithQwen(`
- `module.exports` object contains both `generateWithQwen` and `streamWithQwen`
- The fetch call inside `streamWithQwen` uses `stream: true` in the payload
- The function yields individual token strings via `yield parsed.response`
</acceptance_criteria>

---

### Task 2: Create SSE streaming endpoint `GET /api/generate/stream/:jobId`

<read_first>
- server/routes/generate.js
- server/services/queue.js
</read_first>

<action>
Add a new route `GET /stream/:jobId` to `generate.js` that:

1. Sets SSE headers:
   ```js
   res.writeHead(200, {
     'Content-Type': 'text/event-stream',
     'Cache-Control': 'no-cache',
     'Connection': 'keep-alive',
     'X-Accel-Buffering': 'no'
   });
   ```

2. Imports `QueueEvents` from `bullmq` and `IORedis` from `ioredis`

3. Creates a `QueueEvents` listener for `AI_Generation_Queue`:
   ```js
   const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
     maxRetriesPerRequest: null
   });
   const queueEvents = new QueueEvents('AI_Generation_Queue', { connection });
   ```

4. Listens for `progress` events on the specific `jobId`:
   ```js
   queueEvents.on('progress', ({ jobId: id, data }) => {
     if (id === req.params.jobId) {
       res.write(`event: ${data.event}\ndata: ${JSON.stringify(data.payload)}\n\n`);
     }
   });
   ```

5. Listens for `completed` and `failed` events to close the stream:
   ```js
   queueEvents.on('completed', ({ jobId: id }) => {
     if (id === req.params.jobId) {
       res.write(`event: complete\ndata: ${JSON.stringify({ status: 'done' })}\n\n`);
       cleanup();
     }
   });

   queueEvents.on('failed', ({ jobId: id, failedReason }) => {
     if (id === req.params.jobId) {
       res.write(`event: error\ndata: ${JSON.stringify({ error: failedReason })}\n\n`);
       cleanup();
     }
   });
   ```

6. Sends a keep-alive ping every 15 seconds:
   ```js
   const keepAlive = setInterval(() => {
     res.write(': keep-alive\n\n');
   }, 15000);
   ```

7. On client disconnect, cleans up:
   ```js
   function cleanup() {
     clearInterval(keepAlive);
     queueEvents.close();
     res.end();
   }
   req.on('close', cleanup);
   ```

Keep the existing `POST /` and `GET /status/:jobId` routes intact.
</action>

<acceptance_criteria>
- `server/routes/generate.js` contains `router.get("/stream/:jobId"`
- The route sets `Content-Type: text/event-stream` header
- The route imports and uses `QueueEvents` from `bullmq`
- The route writes SSE-formatted events: `event: ...\ndata: ...\n\n`
- The route has a `cleanup()` function that closes `queueEvents` and clears the keepAlive interval
- The route listens for `req.on('close', cleanup)`
</acceptance_criteria>

## Verification
1. `grep -c "streamWithQwen" server/services/qwen.js` returns at least 2 (definition + export)
2. `grep -c "text/event-stream" server/routes/generate.js` returns 1
3. `grep -c "QueueEvents" server/routes/generate.js` returns at least 2
4. `node -e "require('./server/services/qwen.js')"` exits without error
5. `node -e "require('./server/routes/generate.js')"` exits without error (when Redis is available)
