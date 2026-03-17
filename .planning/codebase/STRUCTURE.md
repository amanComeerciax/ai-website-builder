# Directory Structure
The application is a monorepo partitioned primarily into two roots.

## Root Level
- `package.json` — Root manifest handling concurrent start scripts.
- `client/` — Vite-powered React frontend.
- `server/` — Express + Node backend.

## Client Directory (`client/`)
- `src/`
  - `components/` — Shared UI elements.
    - `editor/` — Contains the 3-panel Builder IDE components (`ChatPanel`, `CodeEditor`, `FileTree`, `PreviewPanel`).
  - `layouts/` — Layout wrappers (e.g., `DashboardLayout`).
  - `lib/` — Utility configurations, like `api.js` wrapper.
  - `pages/` — Top-level route components (`LandingPage`, `DashboardPage`, `EditorPage`, `pricing`, `auth`).
  - `stores/` — Zustand central state stores (`authStore.js`, `editorStore.js`, etc.).
  - `App.jsx` — Router configuration mapping paths to pages.

## Server Directory (`server/`)
- `src/`
  - `models/` — Mongoose schemas (`User.js`, `Project.js`).
  - `routes/` — Express route definitions grouping endpoints by entity (`auth.routes.js`, `generate.routes.js`).
  - `services/` — Heavy business logic (AI prompt engineering, queue logic).
  - `middleware/` — Express middleware (`requireAuth.js`, validatons).
  - `workers/` — Isolated thread logic (`aiWorker.js`).
  - `config/` — Configuration schemas (`db.js`, `queue.js`).
  - `index.js` — Main Express app bootstrap.
