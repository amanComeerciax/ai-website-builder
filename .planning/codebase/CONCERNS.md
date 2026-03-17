# Technical Concerns & Debt

There are a few areas in the early MVP architecture that present medium-to-long term concerns.

## 1. AI Generation Pipeline
The current AI generation mock (`qwen.js`) simulates an inference API call. Real integration requires streaming output (SSE or WebSockets) rather than simple polling. The `getGenerationStatus()` endpoint currently just returns a JSON blob of the state. It needs to eventually stream delta lines of text up directly into `editorStore.js` and the `ChatPanel.jsx`.

## 2. Security of Sandboxed Code
The `PreviewPanel.jsx` utilizes an `iframe` with `srcdoc` to render user/AI-generated HTML, JS, and CSS. While it enforces `sandbox="allow-scripts allow-modals"`, it still executes arbitrary Javascript locally in the client's browser. Adding strong CSP (Content Security Policy) headers and perhaps shifting the sandbox compilation to a WebWorker or a true container environment is likely necessary prior to mass production.

## 3. Persistent State Synchronization
Currently, `editorStore.js` only keeps files in memory. If a user refreshes the page on `/editor/:id`, the generative code is lost. We need an aggressive auto-save mechanism pushing the `editorStore.files` blob payload back up to MongoDB via `/api/projects/:id` debounced on keystrokes or generated updates.
