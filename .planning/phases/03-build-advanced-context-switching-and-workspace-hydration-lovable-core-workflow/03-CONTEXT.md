# Phase 3: Build advanced context switching and workspace hydration (Lovable Core Workflow)

## Goal
Implement the core workspace hydration architecture, context switching logic, and diff/timeline viewing systems that power Lovable's multi-project environment.

## Context

The user has mapped out the 5 core systems required to faithfully replicate Lovable's persistent workspaces:
1. Workspace Foundation (MongoDB project persistence)
2. Chat History Context (MongoDB message persistence with Role + Thought)
3. Version Snapshots (R2 Zip snapshot timelines and jsDiff)
4. Live Generation Logs (BullMQ + Websockets streaming to frontend)
5. Preview Deployment (Netlify IFrames)

Based on the prompt, the user wants us to build these sequentially:
*   **Week 1:** Data Models + Base UI (Project, Message, Versions)
*   **Week 2:** Generation & Live Logs
*   **Week 3:** Version Timeline & Diffing
*   **Week 4:** Project Pages

## Technical Approach
**1. Database Layer (MongoDB)**
-   Create Models: `Project`, `Message`, `Version`, `GenerationLog`.

**2. Storage Layer (R2/S3)**
-   Implement Zip generation + upload to R2 bucket.

**3. API Layer (Node.js/Express)**
-   Create routes for `GET /api/workspaces/:id`
-   Create routes for `POST /api/workspaces/:id/messages`
-   Update BullMQ `aiWorker` to integrate seamlessly with the new DB schema constraints.

**4. Frontend State (Zustand)**
-   Integrate full state restoration via React hydration routines when navigating to `/workspace/:projectId`.
-   Implement dynamic UI tab states according to the timeline.

## Next Steps
This phase is now logged. Run `/gsd-plan-phase 3` to start outlining the exact sub-tasks for implementation.
