# Plan 01: SSE Streaming Route & Strict Validation Strategy

---
wave: 1
depends_on: []
files_modified:
  - server/routes/generate.js
autonomous: true
requirements: []
---

## Goal
Replace the current `POST /api/generate` (which returns a `202 + jobId`) with a new `GET /api/generate/stream/:jobId` SSE endpoint. This endpoint will hold the HTTP connection open, attach a `QueueEvents` listener to the Redis queue, and push real-time `job.updateProgress` events to the React frontend. Based on `RESEARCH.md`, the AI worker will emit high-level phase events rather than raw code tokens to ensure the final code payload can be strictly validated using `JSON.parse` before sending to the client.

## must_haves
- The SSE endpoint must send `Content-Type: text/event-stream` headers
- The SSE endpoint must emit `event: progress`, `event: complete`, and `event: error` typed events matching payload shapes
- The connection must be explicitly cleaned up when the client disconnects

## Tasks

### Task 1: Create SSE streaming endpoint `GET /api/generate/stream/:jobId`

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

4. Listens for `progress` events on the specific `jobId`. Since BullMQ passes object payloads, we destructure:
   ```js
   queueEvents.on('progress', ({ jobId: id, data }) => {
     if (id === req.params.jobId) {
       res.write(`event: ${data.event}\ndata: ${JSON.stringify(data.payload)}\n\n`);
     }
   });
   ```

5. Listens for `completed` and `failed` events to gracefully close the stream:
   ```js
   queueEvents.on('completed', ({ jobId: id, returnvalue }) => {
     if (id === req.params.jobId) {
       res.write(`event: complete\ndata: ${returnvalue || '"done"'}\n\n`);
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

6. Sends a keep-alive ping every 15 seconds to prevent browser timeouts:
   ```js
   const keepAlive = setInterval(() => {
     res.write(': keep-alive\n\n');
   }, 15000);
   ```

7. On client disconnect, cleans up the Redis listeners:
   ```js
   function cleanup() {
     clearInterval(keepAlive);
     queueEvents.close();
     res.end();
   }
   req.on('close', cleanup);
   ```

Keep the existing `POST /` and `GET /status/:jobId` routes intact for backward compatibility and initialization.
</action>

<acceptance_criteria>
- `server/routes/generate.js` contains `router.get("/stream/:jobId"`
- The route sets `Content-Type: text/event-stream` header
- The route imports and uses `QueueEvents` from `bullmq`
- The route writes SSE-formatted events: `event: ...\ndata: ...\n\n`
- The route has a `cleanup()` function that calls `queueEvents.close()`
- The route listens for `req.on('close', cleanup)`
</acceptance_criteria>

## Verification
1. `grep -c "text/event-stream" server/routes/generate.js` returns 1
2. `grep -c "QueueEvents" server/routes/generate.js` returns at least 2
3. `node -e "require('./server/routes/generate.js')"` exits without syntax error
