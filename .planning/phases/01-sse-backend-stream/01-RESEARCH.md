# Phase 1 Research: SSE Backend Stream & Validation

## Domain Understanding: Server-Sent Events (SSE) & BullMQ
To stream real-time tokens from a background `worker_threads` (via BullMQ) through an Express `POST` or `GET` route to a React frontend, we must bridge asynchronous memory silos.

### 1. BullMQ `QueueEvents` as the Bridge
BullMQ provides the `QueueEvents` class specifically for cross-process communication. 
- The `aiWorker.js` runs in isolation. It uses `job.updateProgress(payload)` to emit data.
- The Express route `GET /api/generate/stream/:jobId` instantiates `new QueueEvents('AI_Generation_Queue')`.
- Express listens to `queueEvents.on('progress', ({ jobId, data }) => ...)` and forwards only the events matching the requested `jobId` to the HTTP stream.

### 2. Express SSE Anatomy
A standard Express SSE route must hold the connection open:
```js
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
});
// Write format:
res.write(`event: log\ndata: ${JSON.stringify(payload)}\n\n`);
```
**CRITICAL PITFALL:** The connection must be explicitly cleaned up when the client disconnects (`req.on('close')`) to prevent Redis connection leaks.

### 3. Qwen 2.5 Streaming vs Strict Parse
- **Streaming mode (`stream: true`)** in `qwen.js` via HTTP POST to Ollama yields token chunks in NDJSON format.
- Streaming is fantastic for visual UX, but **terrible** for programmatic file writing if the stream is abruptly cut or malformed.
- **Architectural Decision:** We will use `stream: false` when generating the final JSON file map to ensure the worker can physically `JSON.parse` the entire payload and validate the schema before updating the Virtual File System. We will only emit **high-level phase progress logs** (Thinking, Planning, Editing) via SSE for the UX, rather than raw tokens. *Alternatively*, if we stream tokens, the frontend must assemble them. Given the strict JSON constraint, we favor strict backend parsing + phase logging over raw token streaming.

## Required Implementations
1. **`generate.js` Route:** A new `GET /stream/:jobId` route that pipes BullMQ `job.updateProgress` to `res.write()`.
2. **`aiWorker.js` Pipeline:** A rigorous parser loop.
    - Ask Qwen for JSON.
    - Try to `JSON.parse`.
    - If it fails, retry up to 3 times.
    - Emit granular `updateProgress` along the way to update the ChatPanel 4-state UI.
3. **`queue.js` Configuration:** Ensure Redis connections are exported cleanly so `generate.js` can attach `QueueEvents`.

## Validation Strategy
The resulting plans must strictly enforce the `JSON.parse` wrapper around the Qwen API call in the worker to guarantee the frontend never crashes on a bad hallucination.
