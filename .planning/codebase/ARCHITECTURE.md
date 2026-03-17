# Architecture
The system follows a classic decoupled Client-Server architecture with a highly specialized asynchronous worker layer on the backend for AI tasks.

## Data Flow
1. **User Request:** The user interacts with the React frontend (e.g., submitting a prompt in the `ChatPanel`).
2. **API Call:** The frontend sends a POST request with the user's Clerk JWT to the backend Express server.
3. **Queue Ingestion:** The backend creates a new `BullMQ` job representing the prompt and immediately responds with a `jobId`.
4. **Worker Processing:** The Node `worker_threads` pool (`aiWorker.js`) picks up the job from Redis, breaking the task into phases (understanding, planning, generating) without blocking the main Express thread.
5. **Polling / Streaming:** The frontend polls the generation status via `apiClient.getGenerationStatus()` (to be upgraded to SSE/WebSockets for true streaming).
6. **VFS Injection:** Once the code is generated, the frontend's `editorStore.js` ingests the raw files into its Virtual File System, mapping them directly to the Monaco editor and the `iframe` Preview Panel.

## Frontend Patterns
- **Zustand Stores:** Global state is isolated. For instance, the `editorStore.js` mimics a real operating system's filesystem, managing open tabs, current active file, and the flat-map of file paths to content strings.
- **Layout Assembly:** The core `EditorPage` utilizes a complex CSS Grid Layout splitting the screen into three interactive zones: AI Chat, File/Code Editor, and Iframe Sandbox.

## Backend Patterns
- **Services Layer:** Business logic is primarily abstracted into the `/services` directory (e.g. queue management), keeping controllers relatively thin.
- **Thread Isolation:** Heavy compute or blocking I/O (like waiting extensively for LLM inferences) is safely relegated to worker threads ensuring the primary API remains highly responsive to simple CRUD operations.
