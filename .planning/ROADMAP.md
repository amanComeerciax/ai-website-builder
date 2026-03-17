# Roadmap

## Phase 1: Real-time SSE Backend Stream & Strict Validation
**Goal:** Upgrade the Express backend and AI worker to emit standard Server-Sent Events reflecting truth from the local Qwen 2.5 LLM, ensuring guaranteed structural schemas are passed to the UI.

- [ ] Extract the raw prompt from the frontend incoming request
- [ ] Implement `SSE` headers and keep-alive strategy in `/api/generate` POST block
- [ ] Connect the `BullMQ` job tracker to emit partial outputs (Logs & Tokens) via `job.progress`
- [ ] Refactor `aiWorker.js` to process LLM streams, parse valid code blocks, and push JSON back into Redis
- [ ] Create parser fallback: Error handle if Qwen spits out unparseable code arrays

## Phase 2: Frontend SSE Ingestion & Editor Update
**Goal:** Strip the `setTimeout` mock inside `chatStore` and hook the store directly into the native HTTP SSE stream from `/api/generate`, updating the IDE reactively.

- [ ] Connect `chatStore.js` to the actual `/api/generate` SSE channel using `EventSource` or `fetch` stream readers.
- [ ] Handle `Thinking`, `Logs`, and `Complete` events streamed from the worker in real time.
- [ ] Ingest the raw file data payload on completion into the `editorStore.js` Virtual File System.
- [ ] Ensure the 3-panel UI expands smoothly based on the `isIdeVisible` rules defined earlier.
