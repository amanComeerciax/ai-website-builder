---
wave: 1
depends_on: []
files_modified:
  - server/src/models/Project.js
  - server/src/models/Message.js
  - server/routes/projectRoutes.js
  - client/src/stores/chatStore.js
  - client/src/stores/editorStore.js
  - client/src/pages/ChatPage.jsx
autonomous: true
---

# Plan 01 - Week 1: Workspace Foundation

## Objective
Establish the primary MongoDB schemas for `Project` and `Message`, setup the workspace hydration endpoints, and wire the React frontend stores to seamlessly load historical chat state upon entering a `/workspace/:id` route. This mimics the "saved chat in ChatGPT" persistent UI.

## Requirements
- Create the core `Project` model with `activeVersionId`, `currentFileTree`, `previewUrl`, etc.
- Create the core `Message` model tracking chat content, role, `thinking/reasoning` field, `filesChanged`, and status.
- Add `POST /api/workspaces` (create project) and `GET /api/workspaces/:id` (load full context).
- Adjust frontend Zustands to wipe state on route change and repopulate cleanly via `GET /api/workspaces/:id`.

## Tasks

<task>
<read_first>
- server/src/models/Project.js (if exists) -> server/models/Project.js
- server/routes/projectRoutes.js
</read_first>
<action>
Create `server/models/Project.js` Mongoose schema exactly matching Lovable specs:
`userId` (String), `name` (String), `status` (String enum: idle, generating, done, failed), `activeVersionId` (ObjectId), `currentFileTree` (Map of path to R2Key string), `previewUrl` (String), `netlifySiteId` (String), `techStack` (String), `createdAt` (Date).
Create `server/models/Message.js` Mongoose schema matching Lovable specs:
`projectId` (ObjectId ref Project), `role` (String: user or assistant), `content` (String), `reasoning` (String), `versionId` (ObjectId ref Version), `filesChanged` (Array of {path, action}), `suggestedActions` ([String]), `status` (String enum: pending, done, failed), `createdAt` (Date).
</action>
<acceptance_criteria>
- `server/models/Project.js` contains `mongoose.model('Project', projectSchema)` with `activeVersionId`, `currentFileTree`, `previewUrl` fields.
- `server/models/Message.js` contains `projectId`, `role`, `content`, `reasoning` fields.
</acceptance_criteria>
</task>

<task>
<read_first>
- server/routes/projectRoutes.js
- server/server.js
</read_first>
<action>
Update `server/routes/projectRoutes.js`.
1. Modify `POST /` to create a new dummy `Project` document initialized with `status: 'idle'` and `userId: "local_test_user"` (until Clerk is fully active).
2. Create `GET /:id` endpoint. It MUST fetch the `Project` document AND perform `Message.find({ projectId: id }).sort('createdAt')` returning the `{ project, messages }` payload back to the client. This builds the hydration context window.
</action>
<acceptance_criteria>
- `server/routes/projectRoutes.js` exposes `router.get('/:id')` which populates both the Project and its ordered Message list.
- `server/routes/projectRoutes.js` has `router.post('/')` returning a fresh project doc.
</acceptance_criteria>
</task>

<task>
<read_first>
- client/src/pages/ChatPage.jsx
- client/src/stores/chatStore.js
- client/src/stores/editorStore.js
- client/src/lib/api.js
</read_first>
<action>
1. Add `getWorkspace(id)` to `api.js` pointing to `GET /api/projects/${id}`.
2. Update `chatStore.loadProject` in `client/src/stores/chatStore.js` to trigger `apiClient.getWorkspace(projectId)` instead of pulling exclusively from dummy `localStorage`. Populate `messages` strictly from the DB output. 
3. Setup `addMessage` to trigger `apiClient.createMessage(projectId, content, role)` before updating frontend state.
4. Ensure `ChatPage.jsx` shows the frontend loading correctly via `/workspace/:id` fetching.
</action>
<acceptance_criteria>
- `client/src/stores/chatStore.js` contains `const data = await apiClient.getWorkspace(projectId)` in `loadProject()`.
- The frontend UI state correctly fills `messages` array from DB source of truth.
</acceptance_criteria>
</task>

## Verification
- Can a Project be created and persisted physically to MongoDB?
- Do Messages inserted into MongoDB reliably reappear in the Chat UI when the page is reloaded?
- Are the Zustand stores correctly deriving their state purely from API server endpoints?
