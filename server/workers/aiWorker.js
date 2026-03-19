const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { callModel } = require('../services/modelRouter.js');
const { 
  buildPhase1Prompt, 
  buildPhase2Prompt, 
  buildPhase3Prompt,
  buildTrackAPrompt,
  buildSummaryPrompt 
} = require('../utils/promptBuilder.js');
const { validateFile } = require('../utils/codeValidator.js');
const { getRulesForPhase } = require('../utils/ruleLoader.js');

const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * BullMQ Worker — Dual-Track AI Generation Pipeline
 * 
 * Track A (HTML): Simple sites → single self-contained index.html → instant srcdoc preview
 * Track B (React): Complex apps → multi-file React → Sandpack preview
 * 
 * Track is decided by Mistral in Phase 1 (outputTrack: "html" | "react").
 * Default is always "html" — instant preview, zero red errors.
 * 
 * Phase 1: PARSE PROMPT  (Mistral) → classifies intent + picks Track A or B
 * Phase 2: PLAN STRUCTURE (Mistral) → only for Track B
 * Phase 3: GENERATE      (Qwen)    → Track A: 1 HTML file, Track B: all React files
 * Phase 4: SUMMARIZE     (Mistral) → summary + 4 suggested actions
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
    const fullMessage = contextString ? `${userMessage}\n\n${contextString}` : userMessage;
    const result = await callModel('parse_prompt', fullMessage, systemPrompt);
    sitePlan = JSON.parse(result.content);
    console.log(`[Worker] Phase 1 ✅ — ${result.model} — track: ${sitePlan.outputTrack || 'html'}, type: ${sitePlan.siteType}`);
  } catch (e) {
    console.warn(`[Worker] Phase 1 failed, using defaults:`, e.message);
    sitePlan = {
      classification: 'new_site',
      siteType: 'website',
      pageType: 'landing',
      outputTrack: 'html', // ← default to HTML (always works, always previews)
      vaguePhrases: [],
      assumptions: [],
      colorPreference: 'dark',
      targetAudience: 'general',
      sections: ['hero', 'features', 'about', 'contact', 'footer']
    };
  }

  // Default to Track A (HTML) if Mistral doesn't return a track
  const outputTrack = sitePlan.outputTrack === 'react' ? 'react' : 'html';
  console.log(`[Worker] ▶ Using Track ${outputTrack === 'html' ? 'A (HTML/instant preview)' : 'B (React/Sandpack)'}`);

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'prompt analysis', message: `${sitePlan.siteType} → Track ${outputTrack === 'html' ? 'A' : 'B'}` }
  });

  // ════════════════════════════════════════════
  // ── TRACK A: Single HTML file (instant preview)
  // ════════════════════════════════════════════
  if (outputTrack === 'html') {
    await job.updateProgress({
      event: 'thinking',
      payload: { message: 'Generating your website...' }
    });

    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: 'index.html' }
    });

    let htmlContent = null;
    const { systemPrompt, userMessage } = buildTrackAPrompt(sitePlan);
    
    // Build user message with any context (for edit requests)
    const fullUserMessage = contextString 
      ? `${userMessage}\n\nExisting files to update:\n${contextString}`
      : userMessage;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await callModel('generate_html', fullUserMessage, systemPrompt);
        let html = result.content;

        // Strip markdown code fences if AI wrapped it
        html = html
          .replace(/^```html?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        // If whole thing is JSON (model ignored instructions), try extracting HTML from inside
        if (html.startsWith('{') || html.startsWith('[')) {
          try {
            const parsed = JSON.parse(html);
            const candidate = parsed.html || parsed.content || parsed.code
              || parsed.files?.['index.html']
              || Object.values(parsed).find(v => typeof v === 'string' && v.includes('<html'));
            if (candidate && (candidate.includes('<!DOCTYPE') || candidate.includes('<html'))) {
              html = candidate;
              console.log(`[Worker] Extracted HTML from JSON wrapper (attempt ${attempt})`);
            }
          } catch (_) { /* not valid JSON — try as-is */ }
        }

        // Trim to the HTML block if there's preamble text before DOCTYPE
        const htmlStart = html.search(/<!DOCTYPE\s+html/i);
        if (htmlStart > 0) {
          html = html.substring(htmlStart);
        }
        // Trim anything after </html>
        const htmlEnd = html.search(/<\/html>/i);
        if (htmlEnd !== -1) {
          html = html.substring(0, htmlEnd + 7);
        }

        html = html.trim();

        if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
          throw new Error('Response does not look like valid HTML — no DOCTYPE or <html> tag found');
        }

        htmlContent = html;
        console.log(`[Worker] Track A ✅ — ${result.fallbackUsed ? 'Groq fallback' : result.model} — ${html.length} chars (attempt ${attempt}/3)`);
        break;
      } catch (e) {
        console.error(`[Worker] Track A attempt ${attempt}/3 failed:`, e.message);
        if (attempt === 3) {
          throw new Error(`HTML generation failed after 3 attempts: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    // Phase 4: Summarize
    let summary = 'Generated your website successfully.';
    let appName = sitePlan.siteType || 'Website';
    let suggestedActions = ['Make it dark mode', 'Add more sections', 'Change the color scheme', 'Add animations'];

    try {
      const { systemPrompt: sp, userMessage: um } = buildSummaryPrompt(['index.html'], sitePlan);
      const r = await callModel('summarize', um, sp);
      const s = JSON.parse(r.content);
      summary = s.summary || summary;
      appName = s.appName || appName;
      suggestedActions = s.suggestedActions || suggestedActions;
    } catch (e) {
      console.warn(`[Worker] Phase 4 summary failed (non-fatal):`, e.message);
    }

    console.log(`[Worker] Job ${job.id} complete — Track A — "${appName}"`);

    // Return Track A result: previewType tells the frontend to use srcdoc
    return {
      summary,
      appName,
      suggestedActions,
      outputTrack: 'html',
      previewType: 'srcdoc',  // ← frontend uses iframe srcdoc for instant preview
      files: {
        'index.html': htmlContent
      }
    };
  }

  // ════════════════════════════════════════════
  // ── TRACK B: React multi-file (Sandpack preview)
  // ════════════════════════════════════════════

  // Phase 2: Plan structure (Mistral)
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Planning structure...' }
  });

  let filePlan;
  try {
    const { systemPrompt, userMessage } = buildPhase2Prompt(sitePlan);
    const result = await callModel('plan_structure', userMessage, systemPrompt);
    filePlan = JSON.parse(result.content);
    if (!Array.isArray(filePlan.fileTree)) {
      filePlan.fileTree = [
        { path: 'src/App.jsx', purpose: 'Main entry component' },
        { path: 'src/index.css', purpose: 'Global styles' }
      ];
    }
    console.log(`[Worker] Phase 2 ✅ — ${result.model} — ${filePlan.fileTree.length} files planned`);
  } catch (e) {
    console.warn(`[Worker] Phase 2 failed, using defaults:`, e.message);
    filePlan = {
      fileTree: [
        { path: 'src/App.jsx', purpose: 'Main entry component', imports: [], exports: ['default'] },
        { path: 'src/index.css', purpose: 'Global styles' }
      ],
      sections: sitePlan.sections || ['hero', 'features', 'footer'],
      colorScheme: { bg: '#0f0f0f', surface: '#1a1a1a', text: '#e8e8e8', accent: '#3b82f6' },
      fontPair: { heading: 'Syne', body: 'DM Sans' },
      projectGlossary: { AppName: 'App' }
    };
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'project structure', message: `Planned ${filePlan.fileTree.length} files` }
  });

  for (const file of filePlan.fileTree) {
    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: file.path }
    });
    await new Promise(r => setTimeout(r, 150));
  }

  // Phase 3: Generate React code (Qwen → Groq fallback)
  await job.updateProgress({
    event: 'log',
    payload: { type: 'Editing', file: 'all files', message: 'Generating code...' }
  });

  const glossary = filePlan.projectGlossary || {};
  const codeRules = getRulesForPhase('phase3_qwen');

  const codeSystemPrompt = [
    'You are a senior React code generator. Output ONLY valid JSON:',
    '{ "files": { "src/App.jsx": "file content...", "src/index.css": "file content..." } }',
    '',
    codeRules,
    '',
    `Color scheme: ${JSON.stringify(filePlan.colorScheme || {})}`,
    `Font pair: ${JSON.stringify(filePlan.fontPair || {})}`,
    `App name: ${glossary.AppName || 'App'}`,
    '',
    'ONLY output the raw JSON object. No markdown fences.'
  ].join('\n');

  const codePrompt = [
    contextString ? 'Apply this update to the existing codebase:' : 'Generate the complete code for:',
    `"${prompt}"`,
    '',
    contextString || '',
    '',
    `Files to create: ${filePlan.fileTree.map(f => f.path).join(', ')}`,
    `File purposes: ${filePlan.fileTree.map(f => `${f.path} (${f.purpose})`).join(', ')}`,
    `Sections: ${(filePlan.sections || []).join(', ')}`,
    '',
    'Every .jsx MUST have valid React JSX with ES6 imports. Mock all data inline.',
    'No TypeScript. Every component needs default export. ONLY allowed packages.'
  ].join('\n');

  let generatedFiles = {};
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callModel('generate_file', codePrompt, codeSystemPrompt);
      const parsed = JSON.parse(result.content);

      if (!parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Missing "files" key in response');
      }
      for (const [path, content] of Object.entries(parsed.files)) {
        if (typeof content !== 'string') throw new Error(`File "${path}" is not a string`);
      }

      generatedFiles = parsed.files;
      console.log(`[Worker] Track B Phase 3 ✅ — attempt ${attempt}/3 — ${Object.keys(generatedFiles).length} files`);
      break;
    } catch (e) {
      console.error(`[Worker] Track B Phase 3 attempt ${attempt}/3 failed:`, e.message);
      if (attempt === 3) throw new Error(`React code generation failed: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  // Run code validator
  for (const [filePath, content] of Object.entries(generatedFiles)) {
    const { valid, violations } = validateFile(filePath, content);
    if (!valid) {
      console.warn(`[Worker] Validator: ${filePath} — ${violations.length} violations: ${violations.map(v => v.type).join(', ')}`);
    }
  }

  // Phase 4: Summarize
  let summary = `Generated ${Object.keys(generatedFiles).length} files`;
  let appName = glossary.AppName || 'App';
  let suggestedActions = ['Verify it works', 'Add authentication', 'Make it mobile responsive', 'Add dark mode'];

  try {
    const { systemPrompt, userMessage } = buildSummaryPrompt(Object.keys(generatedFiles), filePlan);
    const result = await callModel('summarize', userMessage, systemPrompt);
    const s = JSON.parse(result.content);
    summary = s.summary || summary;
    appName = s.appName || appName;
    suggestedActions = s.suggestedActions || suggestedActions;
    console.log(`[Worker] Phase 4 ✅ — "${appName}"`);
  } catch (e) {
    console.warn(`[Worker] Phase 4 summary failed (non-fatal):`, e.message);
  }

  console.log(`[Worker] Job ${job.id} complete — Track B — "${appName}" — ${Object.keys(generatedFiles).length} files`);

  return {
    summary,
    appName,
    suggestedActions,
    outputTrack: 'react',
    previewType: 'sandpack', // ← frontend uses Sandpack for React preview
    files: generatedFiles
  };

}, {
  connection,
  concurrency: 1
});

aiWorker.on('completed', job => {
  console.log(`✅ [Worker] Job ${job.id} completed successfully!`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ [Worker] Job ${job?.id} failed: ${err.message}`);
});

module.exports = { aiWorker };
