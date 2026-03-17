# Plan 01: Rewire chatStore.js to consume real SSE stream

---
wave: 1
depends_on: []
files_modified:
  - client/src/stores/chatStore.js
  - client/src/lib/api.js
autonomous: true
requirements: []
---

## Goal
Replace the mock `simulateGeneration()` function (which uses `setTimeout` chains) with a real `startGeneration()` function that:
1. POSTs the prompt to `/api/generate` to get a `jobId`
2. Opens an `EventSource` connection to `/api/generate/stream/:jobId`
3. Handles `thinking`, `log`, `complete`, and `error` SSE events to update UI states in real time

## must_haves
- The mock `simulateGeneration` with `setTimeout` must be completely removed
- The new `startGeneration` must call the real backend and handle SSE events
- The `editorStore.setFiles()` must be called on the `complete` event to inject generated files into the VFS
- Error handling must gracefully update the UI if the backend fails

## Tasks

### Task 1: Add SSE stream URL helper to `api.js`

<read_first>
- client/src/lib/api.js
</read_first>

<action>
Add a new method `getStreamUrl(jobId)` to the `ApiClient` class that returns the full SSE endpoint URL:

```js
// ── SSE Stream ──
getStreamUrl(jobId) {
    return `${this.baseUrl}/generate/stream/${jobId}`
}
```

This is needed because `EventSource` requires a full URL string, not a fetch wrapper.
</action>

<acceptance_criteria>
- `client/src/lib/api.js` contains `getStreamUrl(jobId)`
- The method returns a URL string ending in `/generate/stream/${jobId}`
</acceptance_criteria>

---

### Task 2: Replace `simulateGeneration` with real `startGeneration` in `chatStore.js`

<read_first>
- client/src/stores/chatStore.js
- client/src/lib/api.js
- client/src/stores/editorStore.js
</read_first>

<action>
Rewrite `chatStore.js` to replace the entire `simulateGeneration` function with a real `startGeneration` that:

1. Import `apiClient` from `../../lib/api.js` at the top (NOTE: this is a Zustand store, so the import goes at the module level outside `create()`)
2. Import `useEditorStore` for cross-store VFS injection

3. The new `startGeneration` function:
```js
startGeneration: async (promptText, projectId) => {
    // Reset UI state
    set({ 
        isGenerating: true, 
        generationPhase: 'thinking',
        generationLogs: [],
        generationSummary: '',
        generationTaskName: 'Building ' + promptText.substring(0, 25) + '...',
        isDetailsExpanded: true
    });

    try {
        // Step 1: POST the prompt to get a jobId
        const { jobId } = await apiClient.startGeneration(projectId, promptText);
        
        if (!jobId) throw new Error('No jobId returned from server');

        // Step 2: Open SSE connection to stream events
        const streamUrl = apiClient.getStreamUrl(jobId);
        const eventSource = new EventSource(streamUrl);

        // Store the eventSource reference so we can close it on cleanup
        set({ _eventSource: eventSource });

        // Handle 'thinking' events
        eventSource.addEventListener('thinking', (e) => {
            const data = JSON.parse(e.data);
            set({ generationPhase: 'thinking' });
        });

        // Handle 'log' events (file operations)
        eventSource.addEventListener('log', (e) => {
            const data = JSON.parse(e.data);
            set(state => ({
                generationPhase: 'streaming_logs',
                generationLogs: [...state.generationLogs, { 
                    type: data.type, 
                    file: data.file,
                    message: data.message 
                }]
            }));
        });

        // Handle 'complete' event (job finished successfully)
        eventSource.addEventListener('complete', (e) => {
            const data = JSON.parse(e.data);
            
            // Inject generated files into the editorStore VFS
            if (data.files) {
                const editorStore = useEditorStore.getState();
                // Convert { "path": "content" } to the VFS format { "path": { content: "..." } }
                const fileMap = {};
                for (const [path, content] of Object.entries(data.files)) {
                    fileMap[path] = { content };
                }
                editorStore.setFiles(fileMap);
                
                // Open first file tab
                const firstFile = Object.keys(data.files)[0];
                if (firstFile) {
                    editorStore.setActiveFile(firstFile);
                }
            }

            set({ 
                generationPhase: 'complete',
                generationSummary: data.summary || 'Generation complete.',
                isGenerating: false
            });
            
            eventSource.close();
        });

        // Handle 'error' events
        eventSource.addEventListener('error', (e) => {
            console.error('[ChatStore] SSE error:', e);
            set({
                generationPhase: 'complete',
                generationSummary: 'Generation failed. Please try again.',
                isGenerating: false
            });
            eventSource.close();
        });

        // Handle native EventSource errors (connection drops)
        eventSource.onerror = (err) => {
            // EventSource auto-reconnects by default; only handle if closed
            if (eventSource.readyState === EventSource.CLOSED) {
                set({
                    generationPhase: 'complete',
                    generationSummary: 'Connection lost. Please try again.',
                    isGenerating: false
                });
            }
        };

    } catch (err) {
        console.error('[ChatStore] Generation error:', err);
        set({
            generationPhase: 'complete',
            generationSummary: `Error: ${err.message}`,
            isGenerating: false
        });
    }
},
```

4. Keep all other existing state and actions (messages, addMessage, clearMessages, etc.)
5. Remove the old `simulateGeneration` function entirely
6. Add a `cancelGeneration` action for cleanup:
```js
cancelGeneration: () => {
    const state = get();
    if (state._eventSource) {
        state._eventSource.close();
    }
    set({
        isGenerating: false,
        generationPhase: 'idle',
        _eventSource: null
    });
},
```
</action>

<acceptance_criteria>
- `client/src/stores/chatStore.js` does NOT contain `simulateGeneration`
- `client/src/stores/chatStore.js` does NOT contain `setTimeout`
- `client/src/stores/chatStore.js` contains `startGeneration`
- `client/src/stores/chatStore.js` contains `new EventSource(`
- `client/src/stores/chatStore.js` contains `addEventListener('thinking'`
- `client/src/stores/chatStore.js` contains `addEventListener('log'`
- `client/src/stores/chatStore.js` contains `addEventListener('complete'`
- `client/src/stores/chatStore.js` imports `apiClient`
- `client/src/stores/chatStore.js` imports `useEditorStore`
- `client/src/stores/chatStore.js` contains `editorStore.setFiles(`
</acceptance_criteria>

## Verification
1. `grep -c "simulateGeneration" client/src/stores/chatStore.js` returns 0
2. `grep -c "setTimeout" client/src/stores/chatStore.js` returns 0
3. `grep -c "startGeneration" client/src/stores/chatStore.js` returns >= 1
4. `grep -c "EventSource" client/src/stores/chatStore.js` returns >= 2
5. `grep -c "apiClient" client/src/stores/chatStore.js` returns >= 2
