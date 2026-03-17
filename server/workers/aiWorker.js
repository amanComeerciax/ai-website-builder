const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { generateWithQwen } = require('../services/qwen.js');

// Connection matches the Queue connection setup
const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * BullMQ Worker — 3-Phase AI Generation Pipeline
 * 
 * Phase 1: THINKING — Analyze intent, plan file structure
 * Phase 2: PLANNING — Emit file operation logs for UI streaming
 * Phase 3: CODE GEN — Generate code with strict JSON validation loop
 * 
 * Each phase emits job.updateProgress({ event, payload }) events
 * that are forwarded to the frontend via SSE in generate.js
 */
const aiWorker = new Worker('AI_Generation_Queue', async job => {
  console.log(`[Worker] Job ${job.id} started for project: ${job.data.projectId}`);
  const { prompt } = job.data;
  if (!prompt) throw new Error("Missing 'prompt' in job data");

  // ─── PHASE 1: THINKING (Understand Intent) ────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Analyzing your request...' }
  });

  const systemInstruct = [
    'You are a senior full-stack developer.',
    'Analyze the user request and output a JSON plan:',
    '{ "appName": "string", "description": "string", "files": ["path/file.jsx", ...] }',
    'Only output the JSON, nothing else.'
  ].join(' ');

  const planPrompt = `Analyze this request and plan the file structure:\n\nUser: "${prompt}"`;

  const rawPlan = await generateWithQwen(systemInstruct, planPrompt, true, 3);
  let plan;
  try {
    plan = JSON.parse(rawPlan);
    // Ensure plan.files is always an array
    if (!Array.isArray(plan.files)) {
      plan.files = ['src/App.jsx', 'src/index.css'];
    }
  } catch (e) {
    console.warn(`[Worker] Plan parse failed, using defaults:`, e.message);
    plan = { appName: 'App', description: prompt, files: ['src/App.jsx', 'src/index.css'] };
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'project structure', message: `Planned ${plan.files.length} files` }
  });

  // ─── PHASE 2: PLANNING (Emit file operation logs) ─────────────────
  for (const filePath of plan.files) {
    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: filePath }
    });
    // Small delay for visual streaming effect on the frontend
    await new Promise(r => setTimeout(r, 200));
  }

  // ─── PHASE 3: CODE GENERATION (Strict Validation Loop) ────────────
  await job.updateProgress({
    event: 'log',
    payload: { type: 'Editing', file: 'all files', message: 'Generating code...' }
  });

  const codeSystemPrompt = [
    'You are a code generator. Output ONLY valid JSON with this exact shape:',
    '{ "files": { "src/App.jsx": "file content...", "src/index.css": "file content..." } }',
    'The keys are file paths and the values are the COMPLETE file contents as strings.',
    'No markdown fences, no explanations, no comments outside the JSON.',
    'ONLY output the raw JSON object.'
  ].join('\n');

  const codePrompt = [
    `Generate the complete code for: "${prompt}"`,
    ``,
    `Files to create: ${plan.files.join(', ')}`,
    ``,
    `Output a single JSON object mapping file paths to their full file contents.`
  ].join('\n');

  // Strict validation loop — try up to 3 times to get valid parseable output
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
      console.log(`[Worker] Code generation succeeded on attempt ${attempt}/3 — ${Object.keys(parsedFiles).length} files`);
      break; // Success!

    } catch (parseErr) {
      console.error(`[Worker] Parse attempt ${attempt}/3 failed:`, parseErr.message);
      await job.updateProgress({
        event: 'log',
        payload: { type: 'Reading', file: 'output', message: `Retrying generation (${attempt}/3)...` }
      });
      if (attempt === 3) {
        throw new Error(`Code generation failed after 3 parse attempts: ${parseErr.message}`);
      }
    }
  }

  // ─── COMPLETE ─────────────────────────────────────────────────────
  console.log(`[Worker] Job ${job.id} returning ${Object.keys(parsedFiles).length} files`);

  return {
    summary: `Generated ${Object.keys(parsedFiles).length} files for "${plan.appName || 'your app'}"`,
    files: parsedFiles
  };

}, {
  connection,
  concurrency: 1 // Force sequential GPU/CPU execution to prevent OOM
});

// Worker Events
aiWorker.on('completed', job => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully!`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job?.id} failed: ${err.message}`);
});

module.exports = { aiWorker };
