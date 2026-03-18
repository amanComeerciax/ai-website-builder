---
wave: 2
depends_on: [1]
files_modified:
  - server/src/models/GenerationLog.js
  - server/workers/aiWorker.js
  - server/routes/generate.js
  - client/src/stores/chatStore.js
  - client/src/components/editor/DetailsPanel.jsx
  - client/src/components/editor/ChatPanel.jsx
autonomous: true
---

# Plan 02 - Week 2: Generation + Live Logs

## Objective
Convert the ephemeral frontend generation status logs into robust, persistent `GenerationLog` MongoDB events. Store the model's intermediate internal logs and "thoughts" securely so they can be replayed inside `ChatPanel` whenever an old message is viewed, and capture the Qwen contextual history via the new Message schemas.

## Requirements
- Create the core `GenerationLog` schema tracking real events.
- Update `aiWorker.js` to batch-save or immediately save logs into the DB (e.g. `action: "thinking", target: "framer-motion"`) as they are broadcasted via WebSocket/SSE.
- Enable `Message` UI objects to hold their specific AI `reasoning` block natively in the chat UI.
- Allow the frontend `DetailsPanel.jsx` to replay these logs for historical iterations.

## Tasks

<task>
<read_first>
- server/src/models/GenerationLog.js (if exists) -> server/models/GenerationLog.js
- server/workers/aiWorker.js
- server/routes/generate.js
</read_first>
<action>
Create `server/models/GenerationLog.js` Mongoose schema exactly matching Lovable specs:
`messageId` (ObjectId ref Message), `action` (String enum: thinking, reading, installing, editing, creating), `target` (String: filename/package), `detail` (String), `timestamp` (Date).
Update `server/workers/aiWorker.js`:
Instead of JUST emitting `job.updateProgress({ event: 'log' })`, when the worker emits a log, it must first execute `await GenerationLog.create({ messageId, action, target, timestamp: new Date() })` so it saves to the user's specific `messageId`. The `messageId` MUST be passed down from `generate.js` inside the job payload when the user sends a prompt!
</action>
<acceptance_criteria>
- `server/models/GenerationLog.js` contains `mongoose.model('GenerationLog', genLogSchema)` with `messageId`, `action`, `target` fields.
- `server/workers/aiWorker.js` contains an awaiting creation of `GenerationLog` before it `job.updateProgress()`.
</acceptance_criteria>
</task>

<task>
<read_first>
- server/workers/aiWorker.js
- server/routes/generate.js
</read_first>
<action>
Update `server/workers/aiWorker.js` to correctly capture Qwen's contextual `reasoning`/thought block from Phase 1.
Store this reasoning directly on the `Message` document by finding the existing pending message and doing `Message.findByIdAndUpdate(messageId, { reasoning: plan.description || 'Processed via Qwen' })`.
Pass `messageId` from `server/routes/generate.js` when enqueuing the job:
```javascript
const job = await generationQueue.add('generate-site', { prompt, projectId, existingFiles, messageId });
```
</action>
<acceptance_criteria>
- `server/workers/aiWorker.js` fetches the `Message` and inserts the `reasoning` field dynamically.
- `server/routes/generate.js` correctly creates a `Message` document for the User AND a pending `Message` document for the Assistant BEFORE pushing to BullMQ, and passes its `_id`.
</acceptance_criteria>
</task>

<task>
<read_first>
- client/src/stores/chatStore.js
- client/src/components/editor/ChatPanel.jsx
- client/src/components/editor/DetailsPanel.jsx
</read_first>
<action>
Modify `client/src/stores/chatStore.js` and `DetailsPanel.jsx`:
When a user clicks on an OLD message in the `ChatPanel`, update the `activeMessage` state.
`DetailsPanel.jsx` should check if the AI is actively generating. If NO, play back the specific `GenerationLog`s bound to the currently selected `Message` (fetch via `apiClient.getMessageLogs(msgId)`). If YES, listen to the live SSE stream.
Render the `reasoning` thought block natively inside the older assistant message bubble.
</action>
<acceptance_criteria>
- `client/src/components/editor/DetailsPanel.jsx` contains logic branching between active streaming logs and historical fetched `GenerationLog` array.
- The UI handles the layout identically for live and replayed contexts.
</acceptance_criteria>
</task>

## Verification
- Do live logs stream visibly to the page whilst writing simultaneously to `GenerationLog`?
- Clicking a historical message accurately queries `GET /api/messages/:id/logs` to replay the UI states?
- The model's Chain Of Thought is securely pinned inside the `Message.reasoning` array?
