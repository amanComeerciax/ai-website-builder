---
phase: 01
slug: sse-backend-stream
date: 2026-03-17
---

# Validation Framework

**Validation target:** The `/api/generate/stream/:jobId` route must stay open without timing out, and the `aiWorker` must be able to gracefully recover from an unparseable hallucination from the LLM, ultimately pushing verified JSON to the frontend.

## Quality Dimension 1: Feature Complete
- When a prompt is submitted, the frontend logs should eventually receive `{ event: "complete", payload: { files: {...} } }`.

## Quality Dimension 2: System Architecture
- The Express app does not block.
- Redis handles the interconnect between worker and Express.

## Quality Dimension 4: Graceful Degradation & Errors
- If `JSON.parse` fails inside the worker, it MUST retry up to 3 times before failing the BullMQ job.

## Validation Method
1. Set up a curl or Postman request to `/api/generate/stream/MOCK_ID` to observe headers.
2. Observe worker console logs to ensure parsing succeeds or fails gracefully.
