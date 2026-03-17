# Plan 02: AI Worker Multi-Phase Pipeline with Progress Events & Strict Parser

---
wave: 1
depends_on: []
files_modified:
  - server/workers/aiWorker.js
autonomous: true
requirements: []
---

## Goal
Rebuild `aiWorker.js` to implement a full 3-phase generation pipeline (Understand → Plan → Generate Code) that emits granular `job.updateProgress()` events at each step. Add a strict output parser that validates the LLM's final code output is a valid JSON file-map before marking the job complete.

## must_haves
- The worker must emit progress events with `{ event, payload }` shape for SSE consumption
- The worker must call `streamWithQwen()` for the code generation phase
- The worker must validate the final output is parseable as `{ files: { [path]: content } }` JSON
- On parse failure, the worker must retry the generation (up to 2 retries) before failing

## Tasks

### Task 1: Rebuild `aiWorker.js` with 3-phase pipeline and progress events

<read_first>
- server/workers/aiWorker.js
- server/services/qwen.js
</read_first>

<action>
Completely rewrite `aiWorker.js` to implement:

```js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { generateWithQwen, streamWithQwen } = require('../services/qwen.js');

const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const aiWorker = new Worker('AI_Generation_Queue', async job => {
  console.log(`[Worker] Job ${job.id} started for project: ${job.data.projectId}`);
  const { prompt } = job.data;
  if (!prompt) throw new Error("Missing 'prompt' in job data");

  // ─── PHASE 1: THINKING (Understand Intent) ───
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Analyzing your request...' }
  });

  const systemInstruct = `You are a senior full-stack developer. Analyze the user request and output a JSON plan: { "appName": "string", "description": "string", "files": ["path/file.jsx", ...] }`;
  const planPrompt = `Analyze this request and plan the file structure:\n\nUser: "${prompt}"`;

  const rawPlan = await generateWithQwen(systemInstruct, planPrompt, true, 3);
  let plan;
  try {
    plan = JSON.parse(rawPlan);
  } catch (e) {
    plan = { appName: 'App', description: prompt, files: ['src/App.jsx', 'src/index.css'] };
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'project structure', message: `Planned ${plan.files.length} files` }
  });

  // ─── PHASE 2: PLANNING (Emit file operation logs) ───
  for (const filePath of plan.files) {
    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: filePath }
    });
    // Small delay for visual streaming effect
    await new Promise(r => setTimeout(r, 200));
  }

  // ─── PHASE 3: CODE GENERATION (Stream tokens) ───
  await job.updateProgress({
    event: 'log',
    payload: { type: 'Editing', file: 'all files', message: 'Generating code...' }
  });

  const codeSystemPrompt = `You are a code generator. Output ONLY valid JSON with this exact shape:
{
  "files": {
    "src/App.jsx": "file content here",
    "src/index.css": "file content here"
  }
}
No markdown, no explanations, ONLY the raw JSON object.`;

  const codePrompt = `Generate the complete code for: "${prompt}"\n\nFiles to create: ${plan.files.join(', ')}\n\nOutput a single JSON object mapping file paths to file contents.`;

  // Try up to 3 times to get valid parseable output
  let parsedFiles = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const rawCode = await generateWithQwen(codeSystemPrompt, codePrompt, true, 1);
      const parsed = JSON.parse(rawCode);

      // Strict validation: must have a "files" key with object value
      if (!parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Missing or invalid "files" key in LLM output');
      }

      // Validate each file entry is a string
      for (const [path, content] of Object.entries(parsed.files)) {
        if (typeof content !== 'string') {
          throw new Error(`File "${path}" content is not a string`);
        }
      }

      parsedFiles = parsed.files;
      break; // Success!

    } catch (parseErr) {
      console.error(`[Worker] Parse attempt ${attempt}/3 failed:`, parseErr.message);
      await job.updateProgress({
        event: 'log',
        payload: { type: 'Reading', file: 'output', message: `Retrying generation (${attempt}/3)...` }
      });
      if (attempt === 3) throw new Error(`Code generation failed after 3 parse attempts: ${parseErr.message}`);
    }
  }

  // ─── COMPLETE ───
  await job.updateProgress({
    event: 'complete',
    payload: {
      summary: `Generated ${Object.keys(parsedFiles).length} files for "${plan.appName || 'your app'}"`,
      files: parsedFiles
    }
  });

  return { success: true, files: parsedFiles };

}, {
  connection,
  concurrency: 1
});

aiWorker.on('completed', job => {
  console.log(`✅ [Worker] Job ${job.id} completed`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job?.id} failed: ${err.message}`);
});

module.exports = { aiWorker };
```

Key design decisions:
- Phase 1 uses `generateWithQwen()` (non-streaming, JSON mode) for structured intent analysis
- Phase 3 uses `generateWithQwen()` with JSON mode for the full code output (streaming individual tokens is less useful when we need the complete JSON to parse)
- The strict parser validates: (a) valid JSON, (b) has `files` key, (c) each value is a string
- Retries up to 3 times on parse failure before throwing
- Progress events use `{ event, payload }` shape that the SSE route from Plan 01 will forward directly
</action>

<acceptance_criteria>
- `server/workers/aiWorker.js` contains `job.updateProgress({` at least 4 times (thinking, logs, complete)
- `server/workers/aiWorker.js` contains `event: 'thinking'`
- `server/workers/aiWorker.js` contains `event: 'log'`
- `server/workers/aiWorker.js` contains `event: 'complete'`
- `server/workers/aiWorker.js` contains `JSON.parse(rawCode)`
- `server/workers/aiWorker.js` contains `parsed.files`
- `server/workers/aiWorker.js` contains `for (let attempt = 1; attempt <= 3`
- `module.exports` includes `aiWorker`
</acceptance_criteria>

## Verification
1. `grep -c "updateProgress" server/workers/aiWorker.js` returns >= 5
2. `grep -c "event:" server/workers/aiWorker.js` returns >= 4
3. `grep "streamWithQwen\|generateWithQwen" server/workers/aiWorker.js` shows imports from qwen.js
4. `grep -c "parsed.files" server/workers/aiWorker.js` returns >= 1
5. `node -e "require('./server/workers/aiWorker.js')"` exits without syntax error (Redis connection may fail gracefully)
