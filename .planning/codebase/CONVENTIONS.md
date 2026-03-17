# Coding Conventions

The codebase follows straightforward React and Node conventions.

## Frontend Conventions
- **Naming:** 
  - `PascalCase` for React components (`ChatPanel.jsx`).
  - `camelCase` for utilities, custom hooks, and store files (`editorStore.js`).
  - `kebab-case` for strictly CSS files matching their component counterparts (`ChatPanel.css`).
- **CSS:** BEM-like or modular class naming to prevent global CSS bleed, preferring Vanilla CSS over Tailwind where highly custom, interactive scoping is needed (like the 3-panel IDE layout).
- **State:** Zustand is universally preferred over React Context for global state caching, enforcing explicit setter actions (`const { activeFile, setActiveFile } = useEditorStore()`).

## Backend Conventions
- **Routing:** Router index files group routes by domain (`/api/generate` maps to `generate.routes.js`).
- **Services:** Large operations must live in `services/`, not `controllers/` or `routes/`.
- **Async Execution:** Heavy tasks (AI local LLM inference) MUST be pushed to the `BullMQ` queue and processed via `worker_threads` inside `aiWorker.js` rather than blocking the main Node thread.
