# Tech Stack
StackForge AI is a MERN-based monorepo running a React frontend and a Node/Express backend that coordinates an isolated AI worker thread.

## Frontend (Client)
- **Framework:** React 18 (via Vite)
- **Routing:** React Router v6
- **State Management:** Zustand (`authStore`, `uiStore`, `chatStore`, `projectStore`, `editorStore`)
- **Styling:** Tailwind CSS v4, vanilla CSS for specific component scoping (`.css` files alongside components)
- **UI Components:** Lucide React icons, Monaco Editor (`@monaco-editor/react`) for code editing, iframe for live previews
- **Authentication:** Clerk React (`@clerk/clerk-react`)

## Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Queue System:** BullMQ (backed by Redis) for async AI generation tasks. Bull Board integration for monitoring.
- **Authentication:** Clerk Express SDK (`@clerk/express`) + custom Sync webhooks to replicate user data in MongoDB
- **AI Processing:** Isolated `aiWorker.js` thread via Node's `worker_threads` to keep the main event loop unblocked. Local model inference using Qwen2.5 via HTTP (`qwen.js`).

## Dev & Build Tools
- **Monorepo:** Concurrently used at the root `package.json` to spin up both client and server via `npm run dev`.
- **Environment:** dotenv for `.env` management on the backend.
