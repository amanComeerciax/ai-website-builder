# Roadmap — StackForge AI V3.0

## PHASE 0 — CRITICAL FIXES ✅
- [x] **TASK 0.1:** Fix `qwenService.js` (3500 char limit, 4096 ctx, 30s timeout).
- [x] **TASK 0.2:** Refined `mistralService.js` (code generation focus — already aligned).
- [x] **TASK 0.3:** Refined `groqService.js` (planning/reasoning focus — already aligned).
- [x] **TASK 0.4:** Updated `modelRouter.js` (V3 routing table with 12 tasks).

## PHASE 1 — RULE SYSTEM ✅
- [x] **TASK 1.1:** Created `section-10-iteration.md` with all iteration rules.
- [x] **TASK 1.2:** Updated `ruleLoader.js` (12 V3 phase mappings).
- [x] **TASK 1.3:** Refactored `promptBuilder.js` (8 builder functions).
- [x] **TASK 1.4:** Updated `codeValidator.js` (5 new rules + HTML track checks).

## PHASE 2 — CONTEXT COLLECTION AGENT ✅
- [x] **TASK 2.1:** Created `contextAgent.js` (Groq, max 3 questions, `buildEnrichedPrompt`).
- [x] **TASK 2.2:** Created `routes/context.js` (/questions + /enrich endpoints).
- [x] **TASK 2.3:** Built `ContextChips.jsx` + `ContextChips.css` (dark theme UI).
- [x] **TASK 2.4:** Wired context flow into `ChatPanel.jsx` (send → fetch → chips → enrich → generate).

## PHASE 3 — GENERATION PIPELINE REFACTOR
- [ ] **TASK 3.1:** Refactor `aiWorker.js` to full 6-layer pipeline.
- [ ] **TASK 3.2:** Implement template matching (html/nextjs tracks).

## PHASE 4 — CLI AND PREVIEW
- [ ] **TASK 4.1:** Develop `stackforge-cli` (file writer, command runner).
- [ ] **TASK 4.2:** Implement CLI WebSocket protocol.
- [ ] **TASK 4.3:** Build sequence (install -> dev -> tunnel).
- [ ] **TASK 4.4:** CLI setup modal in editor.

## PHASE 5 — AUTO-FIX LOOP
- [ ] **TASK 5.1:** Create `errorClassifier.js`.
- [ ] **TASK 5.2:** Create `autoFixer.js`.
- [ ] **TASK 5.3:** Wire auto-fix into CLI error handler.

## PHASE 6 — WORKSPACE FEATURES
- [ ] **TASK 6.1:** Star and rename workspaces.
- [ ] **TASK 6.2:** Delete workspace logic (soft delete).
- [ ] **TASK 6.3:** Sidebar workspace tree (Recent/Starred/Monthly).
- [ ] **TASK 6.4:** All Projects page (/projects).
- [ ] **TASK 6.5:** Empty states.

## PHASE 7 — TEMPLATE SYSTEM
- [ ] **TASK 7.1:** Update Template model (author, category, status).
- [ ] **TASK 7.2:** Seed templates script update.
- [ ] **TASK 7.3:** Template routes (remix/submit/approve).
- [ ] **TASK 7.4:** Template gallery UI.
- [ ] **TASK 7.5:** Publish as template flow.

## PHASE 8 — POLISH AND DEPLOY
- [ ] **TASK 8.1:** Production hardening (Zod, Helmet).
- [ ] **TASK 8.2:** Deployment (Render/Vercel).
- [ ] **TASK 8.3:** E2E QA checklist.

---
*Last updated: March 24, 2026*
