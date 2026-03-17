# Plan 02: Update ChatPanel & EditorPage to use real generation

---
wave: 2
depends_on: [01]
files_modified:
  - client/src/components/editor/ChatPanel.jsx
  - client/src/pages/EditorPage.jsx
autonomous: true
requirements: []
---

## Goal
Update `ChatPanel.jsx` to call the new `startGeneration()` instead of `simulateGeneration()`, passing the real `projectId` from route params. Update `EditorPage.jsx` to also call `startGeneration` when a `?prompt=` URL param is detected, instead of the old mock function.

## must_haves
- `ChatPanel.jsx` must call `startGeneration(trimmed, projectId)` not `simulateGeneration(trimmed)`
- `EditorPage.jsx` URL prompt auto-execution must use the new `startGeneration`
- The `projectId` must be passed from route params correctly

## Tasks

### Task 1: Update `ChatPanel.jsx` to use `startGeneration`

<read_first>
- client/src/components/editor/ChatPanel.jsx
- client/src/stores/chatStore.js
</read_first>

<action>
In `ChatPanel.jsx`, change the following:

1. In the destructuring from `useChatStore`, replace `simulateGeneration` with `startGeneration`:
```js
const { 
    messages, isGenerating, generationPhase, generationLogs, 
    generationSummary, generationTaskName, isDetailsExpanded,
    isIdeVisible,
    addMessage, startGeneration, setDetailsExpanded, setIdeVisible
} = useChatStore()
```

2. Import `useParams` from `react-router-dom` to get the projectId:
```js
import { useParams } from 'react-router-dom'
```

3. Inside the component, extract the projectId:
```js
const { projectId } = useParams()
```

4. Update `handleSend` to pass projectId:
```js
const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) return
    addMessage({ role: 'user', content: trimmed })
    setInput('')
    startGeneration(trimmed, projectId)
}
```
</action>

<acceptance_criteria>
- `client/src/components/editor/ChatPanel.jsx` does NOT contain `simulateGeneration`
- `client/src/components/editor/ChatPanel.jsx` contains `startGeneration`
- `client/src/components/editor/ChatPanel.jsx` contains `useParams`
- `client/src/components/editor/ChatPanel.jsx` contains `startGeneration(trimmed, projectId)`
</acceptance_criteria>

---

### Task 2: Update `EditorPage.jsx` URL prompt handler

<read_first>
- client/src/pages/EditorPage.jsx
</read_first>

<action>
In the `useEffect` that parses the `?prompt=` URL parameter, update it to call `startGeneration` instead of `simulateGeneration`:

Find the line that calls `simulateGeneration` and replace with:
```js
startGeneration(prompt, projectId)
```

Also update the destructuring from `useChatStore` in `EditorPage.jsx` to use `startGeneration` instead of `simulateGeneration` (if it destructures the old function name).
</action>

<acceptance_criteria>
- `client/src/pages/EditorPage.jsx` does NOT contain `simulateGeneration`
- `client/src/pages/EditorPage.jsx` contains `startGeneration`
</acceptance_criteria>

## Verification
1. `grep -c "simulateGeneration" client/src/components/editor/ChatPanel.jsx` returns 0
2. `grep -c "startGeneration" client/src/components/editor/ChatPanel.jsx` returns >= 2
3. `grep -c "simulateGeneration" client/src/pages/EditorPage.jsx` returns 0
4. `grep -c "startGeneration" client/src/pages/EditorPage.jsx` returns >= 1
