const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { callModel } = require('../services/modelRouter.js');
const { enhance } = require('../services/promptEnhancer.js');
const { 
  buildPhase1Prompt, 
  buildPhase2Prompt, 
  buildPhase3Prompt,
  buildTrackAPrompt,
  buildSummaryPrompt 
} = require('../utils/promptBuilder.js');
const { validateFile } = require('../utils/codeValidator.js');
const { getRulesForPhase } = require('../utils/ruleLoader.js');
const { sanitizeReactCode } = require('../utils/codeFixer.js');

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
  const { prompt, model, existingFiles, enhanceOptions } = job.data;
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

  // ─── STEP 1 & 2: INTAKE + ENHANCE (PromptEnhancer) ──────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Understanding your request...' }
  });

  let enhanced;
  try {
    enhanced = await enhance(prompt, { ...(enhanceOptions || {}), existingFiles });
    console.log(`[Worker] PromptEnhancer ✅ — site: ${enhanced.siteType}, theme: ${enhanced.themeName}, track: ${enhanced.outputTrack}, isEdit: ${enhanced.enrichedSpec.isModification}`);
  } catch (e) {
    console.warn(`[Worker] PromptEnhancer failed, using legacy Phase 1:`, e.message);
    // Fallback to legacy Phase 1 if enhancer fails
    let sitePlan;
    try {
      const { systemPrompt, userMessage } = buildPhase1Prompt(prompt);
      const fullMessage = contextString ? `${userMessage}\n\n${contextString}` : userMessage;
      const result = await callModel('parse_prompt', fullMessage, systemPrompt);
      sitePlan = JSON.parse(result.content);
    } catch (_) {
      sitePlan = {
        classification: 'new_site', siteType: 'website', pageType: 'landing',
        outputTrack: 'html', vaguePhrases: [], assumptions: [],
        colorPreference: 'dark', targetAudience: 'general',
        sections: ['hero', 'features', 'about', 'contact', 'footer']
      };
    }
    enhanced = {
      enrichedSpec: sitePlan,
      enhancedPrompt: prompt,
      siteType: sitePlan.siteType || 'website',
      themeName: 'Modern Dark',
      outputTrack: sitePlan.outputTrack === 'nextjs' ? 'react' : 'html',
    };
  }

  const sitePlan = enhanced.enrichedSpec;

  const outputTrack = enhanced.outputTrack === 'react' ? 'react' : 'html';
  console.log(`[Worker] ▶ Using Track ${outputTrack === 'html' ? 'A (HTML/instant preview)' : 'B (React/Sandpack)'}`);

  await job.updateProgress({
    event: 'log',
    payload: { 
      type: enhanced.enrichedSpec.isModification ? 'Reading' : 'Reading', 
      file: 'prompt analysis', 
      message: `${enhanced.enrichedSpec.isModification ? 'Updating' : 'Creating'} ${enhanced.siteType} (${enhanced.themeName}) → Track ${outputTrack === 'html' ? 'A' : 'B'}` 
    }
  });

  // ════════════════════════════════════════════
  // ── TRACK A: Single HTML file (instant preview)
  // ════════════════════════════════════════════
  if (outputTrack === 'html') {
    await job.updateProgress({
      event: 'thinking',
      payload: { message: `Generating ${enhanced.siteType} website with ${enhanced.themeName} theme...` }
    });

    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: 'index.html' }
    });

    let htmlContent = null;
    // Use the enriched spec for Track A prompt building
    const trackASpec = {
      ...enhanced.enrichedSpec,
      siteType: enhanced.siteType,
      colorPreference: enhanced.enrichedSpec.colorPreference || 'dark',
    };
    const { systemPrompt, userMessage } = buildTrackAPrompt(trackASpec, enhanced.enrichedSpec.isModification);
    
    // Prepend the enhanced prompt to give the LLM our full technical spec
    const enhancedUserMessage = `${enhanced.enhancedPrompt}\n\n---\n\n${userMessage}`;
    
    // Build user message with any context (for edit requests)
    const fullUserMessage = contextString 
      ? `${enhancedUserMessage}\n\nExisting files to update:\n${contextString}`
      : enhancedUserMessage;

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
    let appName = sitePlan.businessName || sitePlan.siteType || 'Website';
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

    console.log(`[Worker] Job ${job.id} complete — Track A — "${appName}" — Theme: ${enhanced.themeName}`);

    const finalFiles = { 'index.html': htmlContent };

    if (job.data.messageId) {
      try {
        const Message = require('../models/Message');
        await Message.findByIdAndUpdate(job.data.messageId, {
          status: 'done',
          content: summary,
          files: finalFiles,
          previewType: 'srcdoc'
        });
        console.log(`[Worker] Saved Track A HTML to DB Message ${job.data.messageId}`);
      } catch (saveErr) {
        console.error(`[Worker] Failed to save HTML to DB for Message ${job.data.messageId}:`, saveErr.message);
      }
    }

    // Return Track A result: previewType tells the frontend to use srcdoc
    return {
      summary,
      appName,
      suggestedActions,
      outputTrack: 'html',
      previewType: 'srcdoc',  // ← frontend uses iframe srcdoc for instant preview
      files: finalFiles,
      themeUsed: enhanced.themeName,
      siteType: enhanced.siteType,
    };
  }

  // ════════════════════════════════════════════
  // ── TRACK B: React multi-file (Sandpack preview)
  // ════════════════════════════════════════════

  // Phase 2: Plan structure (Mistral) — enhanced spec provides colors/fonts
  await job.updateProgress({
    event: 'thinking',
    payload: { message: `Planning ${enhanced.siteType} app structure (${enhanced.themeName} theme)...` }
  });

  let filePlan;
  try {
    const phase2Input = {
      ...enhanced.enrichedSpec,
      siteType: enhanced.siteType,
      outputTrack: 'react',
    };
    const { systemPrompt, userMessage } = buildPhase2Prompt(phase2Input);
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
      sections: enhanced.enrichedSpec.sections || ['hero', 'features', 'footer'],
      colorScheme: enhanced.enrichedSpec.colorScheme || { bg: '#0f0f0f', surface: '#1a1a1a', text: '#e8e8e8', accent: '#3b82f6' },
      fontPair: enhanced.enrichedSpec.fontPair || { heading: 'Syne', body: 'DM Sans' },
      projectGlossary: { AppName: enhanced.enrichedSpec.businessName || 'App' }
    };
  }

  await job.updateProgress({
    event: 'log',
    payload: { type: 'Reading', file: 'project structure', message: `Planned ${filePlan.fileTree.length} files` }
  });

  // Show planned files as a summary (not individual fake "Creating" logs)
  await job.updateProgress({
    event: 'thinking',
    payload: { message: `Generating ${filePlan.fileTree.length} files...` }
  });

  // Phase 3: Generate React code (Mistral → Groq fallback)
  await job.updateProgress({
    event: 'log',
    payload: { type: 'Editing', file: 'all files', message: 'Generating code...' }
  });

  const glossary = filePlan.projectGlossary || {};
  let codeRules = getRulesForPhase('phase3_qwen');
  if (enhanced.enrichedSpec.isModification) {
    codeRules += '\n\n' + getRulesForPhase('iteration');
  }

  const codeSystemPrompt = [
    'You are a senior React (Vite) code generator. Output ONLY valid JSON:',
    '{ "files": { "src/App.jsx": "file content...", "src/index.css": "file content..." } }',
    '',
    codeRules,
    '',
    `Color scheme: ${JSON.stringify(filePlan.colorScheme || {})}`,
    `Font pair: ${JSON.stringify(filePlan.fontPair || {})}`,
    `App name: ${glossary.AppName || 'App'}`,
    '',
    `SAFE LUCIDE ICONS (ONLY use these): ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Menu, X, Search, Bell, Settings, User, Mail, Phone, Github, Twitter, Facebook, Instagram, Linkedin, Globe, Check, AlertCircle, Info, HelpCircle, Home, Layout, ShoppingBag, ShoppingCart, Zap, Star, Heart, Trash2, Plus, Minus, Download, Upload, ExternalLink, Eye, EyeOff, Lock, Unlock, Power, RefreshCw, Play, Pause, SkipBack, SkipForward`,
    '',
    'ONLY output the raw JSON object. No markdown fences.'
  ].join('\n');

  const codePrompt = [
    contextString ? 'Apply this update to the existing codebase:' : 'Generate the complete code for:',
    `"${prompt}"`,
    '',
    enhanced.enhancedPrompt ? `=== ENHANCED SPECIFICATION ===\n${enhanced.enhancedPrompt}\n` : '',
    contextString || '',
    '',
    `Files to create: ${filePlan.fileTree.map(f => f.path).join(', ')}`,
    `File purposes: ${filePlan.fileTree.map(f => `${f.path} (${f.purpose})`).join(', ')}`,
    `Sections: ${(filePlan.sections || []).join(', ')}`,
    '',
    'Every file MUST be plain JavaScript (.jsx/.js). NO TYPESCRIPT ALLOWED (no type annotations, no interfaces). Mock all data inline.',
    'Every component file MUST have a `export default function ComponentName() { ... }`. Mixed or named exports often cause runtime errors.',
    'CRITICAL: ALL React hooks (useState, useEffect, useRef, etc.) MUST be explicitly imported from \'react\' at the top of EVERY file that uses them. Forgetting imports causes fatal ReferenceErrors.',
    `ALLOWED PACKAGES: react, react-dom, react-router-dom, lucide-react, framer-motion, axios, zod, react-hook-form, @tanstack/react-query, recharts, zustand.`,
    'CRITICAL: When using `lucide-react`, only use common icons (e.g. Github, Twitter, Mail, ExternalLink, ArrowRight, Check, X, Menu). If you are unsure if an icon exists, do not use it.',
    'CRITICAL: NEVER use next.js features. NO next/link, NO next/image, NO next/font. Use standard React components and <img /> tags.',
    'CRITICAL: NEVER use unescaped double quotes inside JSX className strings (e.g. DO NOT write className="font-["DM Sans"]"). Use single quotes and underscores: className="font-[\'DM_Sans\']".',
    'CRITICAL: ALWAYS use `recharts` for ANY charts or graphs. NEVER draw charts manually using <canvas> or SVG paths.',
    'CRITICAL: Write FULL implementations for every file. NEVER write "// placeholder" or "// implement later".'
  ].join('\n');

  const esbuild = require('esbuild');
  let generatedFiles = {};
  let currentCodePrompt = codePrompt;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callModel('generate_file', currentCodePrompt, codeSystemPrompt);
      const parsed = JSON.parse(result.content);

      if (!parsed.files || typeof parsed.files !== 'object') {
        throw new Error('Missing "files" key in JSON response');
      }
      for (const [path, content] of Object.entries(parsed.files)) {
        if (typeof content !== 'string') throw new Error(`File "${path}" content is not a string`);
      }

      generatedFiles = parsed.files;

      // --- NEW: EXACT SYNTAX VALIDATION (SELF-HEALING LOOP) ---
      let syntaxError = null;
      for (const [path, content] of Object.entries(generatedFiles)) {
        if (path.endsWith('.jsx') || path.endsWith('.js') || path.endsWith('.tsx') || path.endsWith('.ts')) {
          try {
            esbuild.transformSync(content, { loader: 'jsx', jsx: 'automatic' });
          } catch (err) {
            // Get the specific error message from esbuild
            const errorMsg = err.errors && err.errors.length > 0 ? err.errors[0].text : err.message;
            const errorLine = err.errors && err.errors.length > 0 && err.errors[0].location ? ` at line ${err.errors[0].location.line}` : '';
            syntaxError = `Syntax Error in ${path}${errorLine}:\n${errorMsg}`;
            break;
          }
        }
      }

      if (syntaxError) {
        throw new Error(syntaxError);
      }

      // --- NEW: SANITIZE CODE (ICON FIXES & EXPORT ENFORCEMENT) ---
      const sanitized = {};
      for (const [path, content] of Object.entries(generatedFiles)) {
        sanitized[path] = sanitizeReactCode(path, content);
      }
      generatedFiles = sanitized;
      // --------------------------------------------------------

      console.log(`[Worker] Track B Phase 3 ✅ — attempt ${attempt}/3 — ${Object.keys(generatedFiles).length} files`);
      break;
    } catch (e) {
      console.error(`[Worker] Track B Phase 3 attempt ${attempt}/3 failed:`, e.message);
      if (attempt === 3) throw new Error(`React code generation consistently failed: ${e.message}`);
      
      // Auto-Feedback: Teach the AI what it did wrong so it can self-heal on the next loop
      currentCodePrompt += `\n\n### FEEDBACK FROM ATTEMPT ${attempt} ###\nYour previous JSON output or React code failed validation with the following error:\n${e.message}\nPlease carefully fix this error and output the complete JSON object again. Ensure valid Javascript/JSX syntax and proper JSON string escaping.`;
      
      await job.updateProgress({
        event: 'log',
        payload: { type: 'Investigating', file: 'syntax error', message: 'Auto-correcting AI hallucination...' }
      });

      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  // Log REAL files that were actually created
  for (const filePath of Object.keys(generatedFiles)) {
    await job.updateProgress({
      event: 'log',
      payload: { type: 'Creating', file: filePath }
    });
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
  let appName = sitePlan.businessName || glossary.AppName || 'App';
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

  // Persist files to Database if messageId is attached to the job
  if (job.data.messageId) {
    try {
      const Message = require('../models/Message');
      await Message.findByIdAndUpdate(job.data.messageId, {
        status: 'done',
        content: summary,
        files: generatedFiles,
        previewType: 'sandpack'
      });
      console.log(`[Worker] Saved ${Object.keys(generatedFiles).length} files to DB Message ${job.data.messageId}`);
    } catch (saveErr) {
      console.error(`[Worker] Failed to save files to DB for Message ${job.data.messageId}:`, saveErr.message);
    }
  }

  return {
    summary,
    appName,
    suggestedActions,
    outputTrack: 'react',
    previewType: 'sandpack', // ← frontend uses Sandpack for React preview
    files: generatedFiles,
    themeUsed: enhanced.themeName,
    siteType: enhanced.siteType,
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
