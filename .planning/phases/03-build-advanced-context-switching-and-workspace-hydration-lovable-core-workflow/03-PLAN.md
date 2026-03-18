---
wave: 3
depends_on: [2]
files_modified:
  - server/src/models/Version.js
  - server/workers/aiWorker.js
  - client/src/pages/ChatPage.jsx
  - client/src/components/editor/Timeline.jsx
  - client/src/components/editor/DiffViewer.jsx
autonomous: true
---

# Plan 03 - Week 3: Version Timeline + Navigation

## Objective
Implement `jsdiff` to power the Version Timeline functionality. Every AI prompt creates a new static snapshot (`Version`) that is zipped to Cloudflare R2 (or a local `.storage` mock directory initially) and generates a file-by-file Diff delta to preview what specifically changed between `v1` and `v2`.

## Requirements
- Create `Version` Mongoose schema representing immutable snapshots.
- Update `aiWorker.js` to build a `Version.diff`: map over newly generated files vs. existing file tree and calculate `jsdiff` block deltas `[{ path, added, removed }]`.
- Build the GitHub-style `<DiffViewer />` in React that highlights added/deleted lines in green/red dynamically toggled on click.
- Build the `Timeline.jsx` block tracking backward navigation logic. Clicking previous versions unzips the `r2ZipKey` and overwrites `editorStore` context.

## Tasks

<task>
<read_first>
- server/src/models/Version.js (if exists) -> server/models/Version.js
- server/workers/aiWorker.js
</read_first>
<action>
Create `server/models/Version.js` Mongoose schema exactly matching Lovable specs:
`projectId` (ObjectId ref Project), `messageId` (ObjectId ref Message), `versionNumber` (Number: 1, 2, 3..), `r2ZipKey` (String path), `fileTree` (Map/Array `[{path, r2Key, size}]`), `previewUrl` (String), `netlifySiteId` (String), `diff` (Array of `{path, added, removed}` containing standard diff changes), `createdAt` (Date).
Update `server/workers/aiWorker.js`:
At the completion of Phase 3 code-generation, use the `diff` (npm) module to calculate changes.
Fetch the current Project, establish `versionNumber = max + 1`.
Calculate `diff` across the `newFiles` versus the `existingFiles`.
Generate the `Version` DB document. Assign `Version._id` to the `Message.versionId` parent.
</action>
<acceptance_criteria>
- `server/models/Version.js` is correctly scaffolded containing the `diff` payload mapped per-file.
- `server/workers/aiWorker.js` creates a Version document explicitly tying the prompt message logic, calculates the diffs natively using the `diff` node library, and increments version numbering sequentially.
</acceptance_criteria>
</task>

<task>
<read_first>
- server/workers/aiWorker.js
- server/utils/storage.js -> (create)
</read_first>
<action>
Create `server/utils/storage.js` representing Cloudflare R2/S3 mocking.
For now, use Node's `archiver` and `fs.promises` to bundle the AI `parsedFiles` into a local directory `/server/storage/projects/{projectId}/versions/{versionId}.zip`. (Use `.storage/` as a placeholder for R2 block storage).
Return the mock `r2ZipKey` path (`projects/{projectId}/versions/{versionId}.zip`) to the newly saved `Version.r2ZipKey`.
</action>
<acceptance_criteria>
- `server/utils/storage.js` exports a `zipAndUpload(projectId, versionId, filesMap)` method.
- `server/workers/aiWorker.js` awaits `zipAndUpload` and accurately writes the `r2ZipKey`.
</acceptance_criteria>
</task>

<task>
<read_first>
- client/src/pages/ChatPage.jsx
- client/src/components/editor/DiffViewer.jsx (if exists)
- client/src/components/editor/Timeline.jsx (if exists)
</read_first>
<action>
Implement the `client/src/components/editor/Timeline.jsx` UI (top-center buttons + navigation).
When the user clicks "History" or the version numbers (v1 -> v2), dispatch `apiClient.getVersion(versionId)` resolving the exact zip file buffer, unpacking it, and overwriting `editorStore.files` gracefully!
Create the `<DiffViewer />` mapped to the "Changes" center-pill button. When active, read `activeVersion.diff` and render standard red/green line-by-line visualization of the text delta inside `CodeEditor`'s panel layout.
</action>
<acceptance_criteria>
- Clicking V1 vs V3 dynamically alters the file tree via HTTP fetch requests for the target zip blob.
- The Diff visualizer correctly renders red/green blocks per changed component line array.
</acceptance_criteria>
</task>

## Verification
- Has `jsdiff` successfully translated old vs. new code states accurately per generation attempt?
- Does navigating the Timeline trigger explicit restoration of exact previous versions, rather than corrupting the actively generated project states?
- Does viewing the history stream exact snapshots without affecting MongoDB main `Project` references until they explicit "Restore to this point"?
