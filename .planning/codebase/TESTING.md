# Testing System

Currently, the application does **not** have a formal automated testing suite (no Jest, Mocha, or Cypress configurations present).

## Future Recommendations
- **Frontend Testing:** Implement Vitest or Jest. Crucial areas include the complex file-tree assembly and Monaco editor VFS syncing inside `editorStore.js`.
- **Backend Testing:** Implement Supertest + Jest to validate the Express JSON API inputs, particularly the JWT Clerk token verification middleware (`requireAuth.js`).
- **Worker Testing:** Simulate BullMQ job payloads to verify `aiWorker.js` completes the complex `understanding -> planning -> generating` pipeline correctly without crashing.
