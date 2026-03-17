# Project Definition

## Context
StackForge AI is transitioning from a mock AI generation frontend to a fully functional, local LLM-powered backend. The goal of this milestone is to connect the isolated `aiWorker.js` thread (running Qwen 2.5 via HTTP) to the `ChatPanel` using Server-Sent Events (SSE) and BullMQ.

## Core Value Proposition
Real-time, persistent code generation powered by a local AI that streams file changes directly into the user's Virtual File System (VFS) without locking up the Express API or the user's browser.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Server-Sent Events (SSE)** | SSE is lightweight, native to HTTP, and perfectly suited for unidirectional streaming of LLM tokens and status updates from the Express API to the React frontend. | — Pending |
| **Strict LLM Validation** | Local smaller models (like Qwen 2.5 32b/14b) can hallucinate format boundaries. The `aiWorker.js` will explicitly parse and guarantee structural schemas (JSON file maps) before releasing updates to the UI, retrying natively if parsing fails. | — Pending |
| **BullMQ Job Tracking** | The AI worker executes out-of-band. The Express API will map the SSE connection to the specific `jobId` in Redis, listening for progress events emitted by the Node Worker thread. | — Pending |

## Requirements

### Validated
- ✓ Monorepo initialization and environment configurations are set.
- ✓ MongoDB integration for users and project states.
- ✓ `ChatPanel`, `DetailsPanel`, and `EditorPage` layouts are built and ready to receive streaming data.
- ✓ `BullMQ` connection and queue setup are scaffolded in `/services/queue.js`.

### Active
- [ ] Refactor `/api/generate` to return an SSE stream connection.
- [ ] Connect the `aiWorker.js` thread to emit real-time logs and tokens via `BullMQ` progress updates.
- [ ] Build the Strict Parser in the worker to extract target files and code blocks from the raw LLM string.
- [ ] Refactor `chatStore.js` to ingest real SSE events instead of the `setTimeout` simulation.

### Out of Scope
- [ ] WebSockets — too heavy, bidirectional not needed since the generation is server-driven.
- [ ] Third-party model APIs (OpenAI / Anthropic) — this milestone focuses strictly on the local Qwen HTTP bridge first.

---
*Last updated: March 17, 2026 after initialization*
