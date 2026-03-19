const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { callModel } = require('../services/modelRouter.js');
const { buildPhase1Prompt, buildPhase2Prompt, buildPhase3Prompt, buildSummaryPrompt } = require('../utils/promptBuilder.js');
const { validateFile } = require('../utils/codeValidator.js');
const { getRulesForPhase } = require('../utils/ruleLoader.js');

// Connection matches the Queue connection setup
const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * BullMQ Worker — 4-Phase AI Generation Pipeline
 * 
 * Phase 1: PARSE PROMPT   — Mistral classifies intent, interprets vague phrases
 * Phase 2: PLAN STRUCTURE  — Mistral plans file tree, colors, fonts
 * Phase 3: GENERATE FILES  — Qwen generates each file (with validator + Groq fallback)
 * Phase 4: SUMMARIZE       — Mistral creates summary + suggested actions
 * 
 * Each phase emits job.updateProgress({ event, payload }) events
 * forwarded to the frontend via SSE in generate.js
 */
const aiWorker = new Worker('AI_Generation_Queue', async job => {
  console.log(`[Worker] Job ${job.id} started for project: ${job.data.projectId}`);
  const { prompt, model, existingFiles } = job.data;
  if (!prompt) throw new Error("Missing 'prompt' in job data");

  // Build existing files context string for edit/iterate requests
  let contextString = '';
  if (existingFiles && Object.keys(existingFiles).length > 0) {
    contextString = '### EXISTING CODEBASE:\n';
    for (const [path, fileObj] of Object.entries(existingFiles)) {
      const content = typeof fileObj === 'string' ? fileObj : fileObj.content;
      contextString += `\n--- ${path} ---\n${content}\n`;
    }
  }

  // ─── PHASE 1: PARSE PROMPT (Mistral) ─────────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Understanding your request...' }
  });

  let sitePlan;
  try {
    const { systemPrompt, userMessage } = buildPhase1Prompt(prompt);
    // Add context for edit requests
    const fullMessage = contextString 
      ? `${userMessage}\n\n${contextString}` 
      : userMessage;
    
    const result = await callModel('parse_prompt', fullMessage, systemPrompt);
    sitePlan = JSON.parse(result.content);
    console.log(`[Worker] Phase 1 ✅ — ${result.model} — classified as: ${sitePlan.classification || 'new_site'}`);
  } catch (e) {
    console.warn(`[Worker] Phase 1 parse failed, using defaults:`, e.message);
    sitePlan = {
      classification: 'new_site',
      siteType: 'website',
      pageType: 'landing',
      vaguePhrases: [],
      assumptions: [prompt],
      colorPreference: 'dark',
      targetAudience: 'general'
    };
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'prompt analysis', message: `Classified as: ${sitePlan.classification || 'new_site'}` }
  });

  // ─── PHASE 2: PLAN STRUCTURE (Mistral) ────────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Planning structure...' }
  });

  let filePlan;
  try {
    const { systemPrompt, userMessage } = buildPhase2Prompt(sitePlan);
    const result = await callModel('plan_structure', userMessage, systemPrompt);
    filePlan = JSON.parse(result.content);
    
    // Ensure fileTree is an array
    if (!Array.isArray(filePlan.fileTree)) {
      filePlan.fileTree = [
        { path: 'src/App.jsx', purpose: 'Main entry component', imports: [], exports: ['default'] },
        { path: 'src/index.css', purpose: 'Global styles', imports: [], exports: [] }
      ];
    }
    console.log(`[Worker] Phase 2 ✅ — ${result.model} — planned ${filePlan.fileTree.length} files`);
  } catch (e) {
    console.warn(`[Worker] Phase 2 parse failed, using defaults:`, e.message);
    filePlan = {
      fileTree: [
        { path: 'src/App.jsx', purpose: 'Main entry component', imports: [], exports: ['default'] },
        { path: 'src/index.css', purpose: 'Global styles', imports: [], exports: [] }
      ],
      sections: ['hero', 'features', 'footer'],
      colorScheme: { bg: '#0f0f0f', surface: '#1a1a1a', text: '#e8e8e8', accent: '#3b82f6' },
      fontPair: { heading: 'Syne', body: 'DM Sans' },
      projectGlossary: { AppName: 'App' }
    };
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'project structure', message: `Planned ${filePlan.fileTree.length} files` }
  });

  // Emit file creation logs for UI streaming
  for (const file of filePlan.fileTree) {
    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: file.path }
    });
    await new Promise(r => setTimeout(r, 150));
  }

  // ─── PHASE 3: GENERATE FILES (Qwen per file, with validation + Groq fallback) ─
  await job.updateProgress({
    event: 'log',
    payload: { type: 'Editing', file: 'all files', message: 'Generating code...' }
  });

  const generatedFiles = {};
  const glossary = filePlan.projectGlossary || {};

  // Strategy: Generate all files in a single JSON call (more context-aware)
  // This is better than per-file for small projects (<10 files)
  const codeRules = getRulesForPhase('phase3_qwen');
  
  const codeSystemPrompt = [
    'You are a senior React code generator. Output ONLY valid JSON with this exact shape:',
    '{ "files": { "src/App.jsx": "file content...", "src/index.css": "file content..." } }',
    '',
    codeRules,
    '',
    'Additional context:',
    `Color scheme: ${JSON.stringify(filePlan.colorScheme || {})}`,
    `Font pair: ${JSON.stringify(filePlan.fontPair || {})}`,
    `App name: ${glossary.AppName || 'App'}`,
    '',
    'ONLY output the raw JSON object. No markdown fences.'
  ].join('\n');

  const codePrompt = [
    contextString ? `Apply this update/request to the existing codebase:` : `Generate the complete code for:`,
    `"${prompt}"`,
    '',
    contextString || '',
    '',
    `Files to create: ${filePlan.fileTree.map(f => f.path).join(', ')}`,
    `File purposes: ${filePlan.fileTree.map(f => `${f.path} (${f.purpose})`).join(', ')}`,
    `Sections to include: ${(filePlan.sections || []).join(', ')}`,
    '',
    'Output a single JSON object. Every .jsx file must have valid React JSX syntax with proper ES6 imports.',
    'Mock all data inline. No TypeScript. Every component needs a default export.'
  ].join('\n');

  // Strict validation loop — 3 attempts
  let parsedFiles = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callModel('generate_file', codePrompt, codeSystemPrompt);
      const parsed = JSON.parse(result.content);

      if (!parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Missing or invalid "files" key in LLM output');
      }

      for (const [path, content] of Object.entries(parsed.files)) {
        if (typeof content !== 'string') {
          throw new Error(`File "${path}" content is not a string`);
        }
      }

      parsedFiles = parsed.files;
      
      if (result.fallbackUsed) {
        console.log(`[Worker] Phase 3 ✅ — Groq fallback — ${Object.keys(parsedFiles).length} files`);
      } else {
        console.log(`[Worker] Phase 3 ✅ — attempt ${attempt}/3 — ${Object.keys(parsedFiles).length} files`);
      }
      break;

    } catch (parseErr) {
      console.error(`[Worker] Phase 3 attempt ${attempt}/3 failed:`, parseErr.message);
      await job.updateProgress({
        event: 'log',
        payload: { type: 'Reading', file: 'output', message: `Retrying generation (${attempt}/3)...` }
      });
      if (attempt === 3) {
        throw new Error(`Code generation failed after 3 attempts: ${parseErr.message}`);
      }
    }
  }

  // Run code validator on each file
  let totalViolations = 0;
  for (const [filePath, content] of Object.entries(parsedFiles)) {
    const { valid, violations } = validateFile(filePath, content);
    if (!valid) {
      totalViolations += violations.length;
      console.warn(`[Worker] Validator: ${filePath} has ${violations.length} violations:`,
        violations.map(v => v.type).join(', '));
    }
    generatedFiles[filePath] = content;
  }

  if (totalViolations > 0) {
    console.log(`[Worker] ⚠️ ${totalViolations} total code quality violations (non-blocking)`);
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Editing', file: 'all files', message: `Generated ${Object.keys(generatedFiles).length} files` }
  });

  // ─── PHASE 4: SUMMARIZE (Mistral) ────────────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Finishing up...' }
  });

  let summary = `Generated ${Object.keys(generatedFiles).length} files`;
  let appName = glossary.AppName || filePlan.projectGlossary?.AppName || 'your app';
  let suggestedActions = ['Verify it works', 'Add authentication', 'Make it mobile responsive', 'Add dark mode'];

  try {
    const { systemPrompt, userMessage } = buildSummaryPrompt(Object.keys(generatedFiles), filePlan);
    const result = await callModel('summarize', userMessage, systemPrompt);
    const summaryData = JSON.parse(result.content);
    summary = summaryData.summary || summary;
    appName = summaryData.appName || appName;
    suggestedActions = summaryData.suggestedActions || suggestedActions;
    console.log(`[Worker] Phase 4 ✅ — ${result.model} — "${appName}"`);
  } catch (e) {
    console.warn(`[Worker] Phase 4 summary failed, using defaults:`, e.message);
  }

  // ─── COMPLETE ─────────────────────────────────────────────────────
  console.log(`[Worker] Job ${job.id} returning ${Object.keys(generatedFiles).length} files for "${appName}"`);

  return {
    summary: `${summary}"${appName}"`,
    appName,
    suggestedActions,
    files: generatedFiles
  };

}, {
  connection,
  concurrency: 1
});

// Worker Events
aiWorker.on('completed', job => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully!`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job?.id} failed: ${err.message}`);
});

module.exports = { aiWorker };
