const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { callModel } = require('../services/modelRouter.js');
const { 
  buildContextQuestions,
  buildParsePrompt, 
  buildPlanPrompt,
  buildTrackAPrompt,
  buildTrackBPrompt,
  buildSummaryPrompt,
  buildErrorClassifyPrompt,
  buildFixFilePrompt
} = require('../rules/promptBuilder.js');
const { validateCode } = require('../rules/codeValidator.js');
const { broadcastFileUpdate } = require('../services/websocket.js');
const { classifyError } = require('../utils/errorClassifier.js');
const { fixFile } = require('../utils/autoFixer.js');
const { matchTemplate } = require('../utils/templateMatcher.js');

const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Helper: strip markdown fences from AI JSON responses
 */
function stripFences(str) {
  return str.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

/**
 * Helper: parse JSON safely, returns null on failure
 */
function safeParseJSON(str) {
  try { return JSON.parse(stripFences(str)); } catch { return null; }
}

/**
 * Helper: extract actual code from a JSON wrapper envelope
 * Models sometimes return: {"status":"fixed","file":"...code..."} even when told not to
 */
function extractCodeFromWrapper(str) {
  if (!str || typeof str !== 'string' || !str.trimStart().startsWith('{')) return str;
  try {
    const parsed = JSON.parse(str);
    const code = parsed.file || parsed.code || parsed.content || parsed.html || 
                 parsed.fixedCode || parsed.fixed_code || parsed.result;
    if (code && typeof code === 'string' && code.length > 20) {
      console.log('[Worker V3] Extracted code from JSON wrapper');
      return code;
    }
  } catch { /* not JSON */ }
  return str;
}

/**
 * Normalize AI multi-file response into a flat { "filepath": "code" } map.
 * Handles all known Mistral response formats.
 */
function normalizeFilesResponse(parsed) {
  // Format 1: { files: { "app/page.js": "code" } }  ← expected
  if (parsed.files && typeof parsed.files === 'object' && !Array.isArray(parsed.files)) {
    const entries = Object.entries(parsed.files);
    if (entries.length > 0 && typeof entries[0][1] === 'string') return parsed.files;
  }
  // Format 2: Array of { path, content } objects
  if (Array.isArray(parsed)) {
    const result = {};
    for (const item of parsed) {
      if (item.path && typeof item.content === 'string') result[item.path] = item.content;
    }
    if (Object.keys(result).length > 0) return result;
  }
  // Format 3: { files: [{ path, content }] }
  if (parsed.files && Array.isArray(parsed.files)) {
    const result = {};
    for (const item of parsed.files) {
      if (item.path && typeof item.content === 'string') result[item.path] = item.content;
    }
    if (Object.keys(result).length > 0) return result;
  }
  // Format 4: Single { path, content }
  if (parsed.path && typeof parsed.content === 'string') return { [parsed.path]: parsed.content };
  // Format 5: Flat object where keys look like file paths
  const result = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string' && (key.includes('/') || key.includes('.'))) result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : {};
}

/**
 * BullMQ Worker — StackForge AI V3.0 6-Layer Pipeline
 * 
 * LAYER 0: Context passthrough   (enrichedPrompt already built by ChatPanel)
 * LAYER 1: Parse intent          (Groq → parse_prompt)
 * LAYER 2: Plan architecture     (Groq → plan_structure)
 * LAYER 3: Generate code         (Mistral → generate_html / generate_file)
 * LAYER 4: Validate code         (Local regex → codeValidator)
 * LAYER 5: Summarize             (Groq → summarize)
 */
const aiWorker = new Worker('AI_Generation_Queue', async job => {
  const { prompt, projectId, existingFiles } = job.data;
  if (!prompt) throw new Error("Missing 'prompt' in job data");

  console.log(`[Worker V3] Job ${job.id} started | project: ${projectId}`);

  // ─── LAYER 1: PARSE INTENT ────────────────────────────────────────
  await job.updateProgress({ 
    event: 'thinking', 
    payload: { message: '🔍 Parsing your request...', phase: 'parse' } 
  });

  let parsedSitePlan;
  try {
    const parseSystemPrompt = buildParsePrompt();
    const result = await callModel('parse_prompt', prompt, parseSystemPrompt);
    parsedSitePlan = safeParseJSON(result.content);
    
    if (!parsedSitePlan || !parsedSitePlan.outputTrack) {
      throw new Error('Invalid parse response structure');
    }
    console.log(`[Worker V3] Layer 1 ✅ Parse: Track=${parsedSitePlan.outputTrack} Site=${parsedSitePlan.siteType}`);
  } catch (e) {
    console.warn(`[Worker V3] Layer 1 fallback (${e.message})`);
    parsedSitePlan = {
      siteType: 'website',
      outputTrack: 'html',
      colorPreference: 'light',
      sections: ['hero', 'about', 'contact', 'footer'],
      fontMood: 'modern',
      targetAudience: 'general'
    };
  }

  let isNextjs = parsedSitePlan.outputTrack === 'nextjs';

  await job.updateProgress({ 
    event: 'thinking', 
    payload: { 
      message: `✅ Understood: ${parsedSitePlan.siteType} (${isNextjs ? 'Next.js' : 'HTML'} track)`,
      phase: 'parse',
      track: parsedSitePlan.outputTrack
    } 
  });

  // ─── LAYER 1.5: TEMPLATE MATCHING ────────────────────────────────
  let matchedTemplateFiles = null;
  
  await job.updateProgress({ 
    event: 'thinking', 
    payload: { message: '🔍 Searching for matching templates...', phase: 'template_match' } 
  });

  try {
    const templateMatch = await matchTemplate(parsedSitePlan);
    if (templateMatch) {
      matchedTemplateFiles = templateMatch.files;
      // Force track to match the template's requirements
      parsedSitePlan.outputTrack = templateMatch.track;
      isNextjs = parsedSitePlan.outputTrack === 'nextjs';
      
      await job.updateProgress({ 
        event: 'thinking', 
        payload: { message: `✨ Matched template: ${templateMatch.name}`, phase: 'template_match' } 
      });
      console.log(`[Worker V3] Layer 1.5 ✅ Template Match: ${templateMatch.slug} with ${matchedTemplateFiles?.length || 0} files`);
    } else {
      console.log(`[Worker V3] Layer 1.5 ℹ️ Built from scratch (no template match)`);
    }
  } catch (err) {
    console.warn(`[Worker V3] Layer 1.5 fallback (${err.message}) — skipping template matching`);
  }

  // ─── LAYER 2: PLAN ARCHITECTURE ──────────────────────────────────
  await job.updateProgress({ 
    event: 'thinking', 
    payload: { message: '📐 Drafting the site architecture...', phase: 'plan' } 
  });

  let planDetails = { 
    siteType: parsedSitePlan.siteType,
    sections: parsedSitePlan.sections,
    colorPreference: parsedSitePlan.colorPreference,
    fontMood: parsedSitePlan.fontMood
  };
  
  try {
    const planSystemPrompt = buildPlanPrompt(parsedSitePlan);
    const result = await callModel('plan_structure', prompt, planSystemPrompt);
    const parsed = safeParseJSON(result.content);

    if (parsed && typeof parsed === 'object') {
      planDetails = {
        ...planDetails,
        ...parsed,
        siteType: parsed.siteType || planDetails.siteType,
        colorScheme: parsed.colorScheme || parsed.colors || { preference: parsedSitePlan.colorPreference }
      };
      console.log(`[Worker V3] Layer 2 ✅ Plan: ${Object.keys(planDetails).join(', ')}`);
    } else {
      throw new Error('Plan returned non-object');
    }
  } catch (e) {
    console.warn(`[Worker V3] Layer 2 fallback (${e.message}) — using parsed plan as-is`);
  }

  await job.updateProgress({ 
    event: 'acting', 
    payload: { 
      message: `✍️ Writing ${isNextjs ? 'React components' : 'HTML'}...`,
      phase: 'generate',
      track: parsedSitePlan.outputTrack
    } 
  });

  // ─── LAYER 3+4: GENERATE + VALIDATE ──────────────────────────────
  let finalFiles = {};

  // Detect if this is a follow-up prompt (user wants to modify existing code, not start fresh)
  const isFollowUp = existingFiles && Object.keys(existingFiles).length > 0;
  let existingCodeContext = '';
  
  if (isFollowUp) {
    // Extract existing file contents to inject as context
    // The VFS format from the editor is { "path": { content: "..." } }
    const fileEntries = Object.entries(existingFiles)
      .filter(([_, val]) => val && (typeof val === 'string' || val.content))
      .map(([path, val]) => {
        const content = typeof val === 'string' ? val : val.content;
        return `--- ${path} ---\n${content}`;
      });
    
    if (fileEntries.length > 0) {
      existingCodeContext = `\n\n<existing_website_code>\nThe user has an EXISTING website. They want you to MODIFY it, not rebuild from scratch.\nYou MUST preserve all existing structure, styles, and content EXCEPT for the specific changes the user requested.\nDo NOT generate a completely new website. Only apply the requested changes.\n\n${fileEntries.join('\n\n')}\n</existing_website_code>`;
      
      console.log(`[Worker V3] Follow-up detected — injecting ${fileEntries.length} existing files as context`);
    }
  }

  if (!isNextjs) {
    // ─── TRACK A: HTML ────────────────────────────────────
    const trackAPrompt = buildTrackAPrompt(planDetails, matchedTemplateFiles);
    // For follow-ups, append the existing code context to the system prompt
    const finalSystemPrompt = isFollowUp && existingCodeContext
      ? trackAPrompt + existingCodeContext
      : trackAPrompt;
    let htmlContent = '';
    let generated = false;

    for (let retry = 0; retry < 2; retry++) {
      try {
        if (retry > 0) {
          await job.updateProgress({ 
            event: 'acting', 
            payload: { message: `♻️ Full regeneration (attempt ${retry + 1})...`, phase: 'generate' } 
          });
        }

        const result = await callModel('generate_html', prompt, finalSystemPrompt);
        let rawHtml = result.content
          .replace(/^```(?:html|json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

        // Handle case where model returns HTML wrapped in JSON
        // e.g. {"file": "<!DOCTYPE html>..."} or {"html": "..."}
        if (rawHtml.startsWith('{') && !rawHtml.startsWith('<!')) {
          try {
            const parsed = JSON.parse(rawHtml);
            const extracted = parsed.file || parsed.html || parsed.content || parsed.code || parsed['index.html'];
            if (extracted && typeof extracted === 'string' && extracted.includes('<')) {
              rawHtml = extracted;
              console.log('[Worker V3] Extracted HTML from JSON wrapper');
            }
          } catch {
            // Not valid JSON — treat as raw HTML
          }
        }

        htmlContent = rawHtml;

        const validation = validateCode(htmlContent, 'html');
        if (validation.isValid) {
          console.log(`[Worker V3] Layer 3+4 ✅ HTML validated (${htmlContent.length} chars)`);
          generated = true;
          break;
        }

        // ── AUTO-FIX LOOP ──
        console.log(`[Worker V3] HTML validation failed (${validation.code}), entering auto-fix loop...`);
        await job.updateProgress({ 
          event: 'acting', 
          payload: { message: `🔧 Fixing ${validation.code}...`, phase: 'fixing' } 
        });

        const classified = await classifyError(validation.message, 'index.html');
        const fixResult = await fixFile({
          filePath: 'index.html',
          fileContent: htmlContent,
          fixInstruction: classified.fixInstruction,
          outputTrack: 'html',
          maxAttempts: 2
        });

        if (fixResult.fixed) {
          htmlContent = extractCodeFromWrapper(fixResult.content);
          console.log(`[Worker V3] Layer 3+4 ✅ HTML auto-fixed after ${fixResult.attempts} fix attempt(s)`);
          generated = true;
          break;
        }

        console.warn(`[Worker V3] Auto-fix exhausted for HTML, falling back to full regen`);
      } catch (err) {
        console.warn(`[Worker V3] HTML attempt ${retry + 1} failed: ${err.message}`);
      }
    }

    if (!generated && !htmlContent) throw new Error('HTML generation failed after all attempts');
    finalFiles['index.html'] = htmlContent;

  } else {
    // ─── TRACK B: NEXT.JS ─────────────────────────────────
    const trackBPrompt = buildTrackBPrompt(planDetails, matchedTemplateFiles);
    // For follow-ups, append the existing code context to the system prompt
    const finalTrackBPrompt = isFollowUp && existingCodeContext
      ? trackBPrompt + existingCodeContext
      : trackBPrompt;
    let generated = false;

    for (let retry = 0; retry < 2; retry++) {
      try {
        if (retry > 0) {
          await job.updateProgress({ 
            event: 'acting', 
            payload: { message: `♻️ Full Next.js regeneration (attempt ${retry + 1})...`, phase: 'generate' } 
          });
        }

        const result = await callModel('generate_file', prompt, finalTrackBPrompt);
        const rawContent = result.content
          .replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

        const parsedResponse = safeParseJSON(rawContent);
        if (!parsedResponse) throw new Error('AI returned non-JSON for Next.js generation');
        
        const filesObj = normalizeFilesResponse(parsedResponse);
        if (Object.keys(filesObj).length === 0) throw new Error('AI returned no recognizable file entries');

        let allPass = true;
        const batchFiles = {};
        let failedFile = null;
        let failedValidation = null;

        for (const [path, content] of Object.entries(filesObj)) {
          const validation = validateCode(content, 'nextjs');
          if (!validation.isValid) {
            allPass = false;
            failedFile = path;
            failedValidation = validation;
            console.warn(`[Worker V3] Validation failed in ${path} (${validation.code})`);
            break;
          }
          batchFiles[path] = content;

          await job.updateProgress({ 
            event: 'acting', 
            payload: { 
              message: `📄 Created ${path}`,
              phase: 'generate',
              file: path
            }
          });
        }

        if (allPass) {
          finalFiles = { ...finalFiles, ...batchFiles };
          console.log(`[Worker V3] Layer 3+4 ✅ Next.js: ${Object.keys(finalFiles).length} files`);
          generated = true;
          break;
        }

        // ── AUTO-FIX LOOP for the failed file ──
        if (failedFile && failedValidation) {
          console.log(`[Worker V3] Next.js validation failed in ${failedFile} (${failedValidation.code}), entering auto-fix loop...`);
          await job.updateProgress({ 
            event: 'acting', 
            payload: { message: `🔧 Fixing ${failedFile} (${failedValidation.code})...`, phase: 'fixing' } 
          });

          const classified = await classifyError(failedValidation.message, failedFile);
          const fixResult = await fixFile({
            filePath: failedFile,
            fileContent: filesObj[failedFile],
            fixInstruction: classified.fixInstruction,
            outputTrack: 'nextjs',
            maxAttempts: 2
          });

          if (fixResult.fixed) {
            // Replace the broken file and accept all others
            filesObj[failedFile] = extractCodeFromWrapper(fixResult.content);
            finalFiles = { ...filesObj };
            console.log(`[Worker V3] Layer 3+4 ✅ Next.js auto-fixed ${failedFile} after ${fixResult.attempts} attempt(s)`);
            generated = true;
            break;
          }

          console.warn(`[Worker V3] Auto-fix exhausted for ${failedFile}, falling back to full regen`);
        }

      } catch (err) {
        console.warn(`[Worker V3] Next.js attempt ${retry + 1} failed: ${err.message}`);
        finalFiles = {};
      }
    }

    if (!generated || Object.keys(finalFiles).length === 0) {
      throw new Error('Next.js generation exhausted after all attempts');
    }

    // ── SAFETY NET: Ensure minimum viable Next.js file set ──
    // If the AI only generated a partial set (e.g. just globals.css), 
    // merge with template scaffolding to create a working project
    const requiredFiles = ['app/page.js', 'app/layout.js', 'app/globals.css'];
    const missingFiles = requiredFiles.filter(f => !finalFiles[f]);
    
    if (missingFiles.length > 0) {
      console.warn(`[Worker V3] Next.js output missing critical files: ${missingFiles.join(', ')}`);
      
      // Fill from template scaffolding first
      if (matchedTemplateFiles && Array.isArray(matchedTemplateFiles)) {
        for (const templateFile of matchedTemplateFiles) {
          if (!templateFile.isFolder && !finalFiles[templateFile.path]) {
            finalFiles[templateFile.path] = templateFile.content;
            console.log(`[Worker V3] Filled missing ${templateFile.path} from template scaffolding`);
          }
        }
      }
      
      // If still missing critical files, generate minimal defaults
      if (!finalFiles['app/layout.js']) {
        finalFiles['app/layout.js'] = `import './globals.css';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body className="antialiased min-h-screen">\n        {children}\n      </body>\n    </html>\n  );\n}`;
        console.log('[Worker V3] Generated fallback app/layout.js');
      }
      if (!finalFiles['app/page.js']) {
        finalFiles['app/page.js'] = `export default function Home() {\n  return (\n    <main className="flex min-h-screen flex-col items-center justify-center p-24">\n      <h1 className="text-4xl font-bold">Welcome</h1>\n      <p className="mt-4 text-lg text-gray-500">Your Next.js app is ready.</p>\n    </main>\n  );\n}`;
        console.log('[Worker V3] Generated fallback app/page.js');
      }
      if (!finalFiles['app/globals.css']) {
        finalFiles['app/globals.css'] = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --background: #ffffff;\n  --foreground: #171717;\n}\n\nbody {\n  background-color: var(--background);\n  color: var(--foreground);\n}`;
        console.log('[Worker V3] Generated fallback app/globals.css');
      }
    }
    
    // Ensure package.json always exists with required scripts for Sandpack
    if (!finalFiles['package.json']) {
      finalFiles['package.json'] = JSON.stringify({
        name: "stackforge-nextjs-app",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start"
        },
        dependencies: {
          "next": "^14.0.0",
          "react": "^18.0.0",
          "react-dom": "^18.0.0"
        },
        devDependencies: {
          "tailwindcss": "^3.4.0",
          "postcss": "^8.4.31",
          "autoprefixer": "^10.4.17"
        }
      }, null, 2);
      console.log('[Worker V3] Added package.json with scripts for Sandpack compatibility');
    } else {
      // If package.json exists but lacks scripts, add them
      try {
        const pkg = JSON.parse(finalFiles['package.json']);
        if (!pkg.scripts || !pkg.scripts.dev) {
          pkg.scripts = { dev: "next dev", build: "next build", start: "next start", ...pkg.scripts };
          finalFiles['package.json'] = JSON.stringify(pkg, null, 2);
          console.log('[Worker V3] Patched package.json with missing scripts.dev');
        }
      } catch { /* not valid JSON, leave as-is */ }
    }
    // ── POST-PROCESS: Remove broken local imports ──
    // If the AI generated imports to files that don't exist in the output, strip them
    const allGeneratedPaths = Object.keys(finalFiles);
    for (const [filePath, content] of Object.entries(finalFiles)) {
      if (typeof content !== 'string') continue;
      const lines = content.split('\n');
      const cleanedLines = lines.filter(line => {
        // Match: import X from '../components/...' or './someFile'
        const localImportMatch = line.match(/import\s+.*\s+from\s+['"](\.\/.+|\.\.\/[^'"]*)['"];?\s*$/);
        if (!localImportMatch) return true; // keep non-import lines
        
        const importPath = localImportMatch[1];
        // Resolve relative to the file's directory
        const fileDir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
        const resolvedBase = fileDir ? `${fileDir}/${importPath}`.replace(/\/\.\//g, '/') : importPath.replace(/^\.\//, '');
        // Normalize: remove leading ./  and resolve ../
        const normalized = resolvedBase.replace(/[^/]+\/\.\.\//g, '');
        
        // Check if any generated file matches this import (with or without extension)
        const exists = allGeneratedPaths.some(p => 
          p === normalized || 
          p === normalized + '.js' || p === normalized + '.jsx' || 
          p === normalized + '.ts' || p === normalized + '.tsx'
        );
        
        if (!exists) {
          console.warn(`[Worker V3] Stripping broken import from ${filePath}: "${line.trim()}"`);
          return false; // remove this line
        }
        return true;
      });
      
      if (cleanedLines.length !== lines.length) {
        finalFiles[filePath] = cleanedLines.join('\n');
      }
    }
    
    console.log(`[Worker V3] Final Next.js output: ${Object.keys(finalFiles).length} files — [${Object.keys(finalFiles).join(', ')}]`);
  }

  // ─── LAYER 5: SUMMARIZE ──────────────────────────────────────────
  await job.updateProgress({ 
    event: 'thinking', 
    payload: { message: '📝 Writing summary...', phase: 'summarize' } 
  });

  let summary = `Built your ${parsedSitePlan.siteType} successfully.`;
  let appName = parsedSitePlan.siteType || 'Your Site';
  let suggestedActions = [
    'Make it dark mode',
    'Add a contact form',
    'Make it mobile responsive',
    'Add an about section'
  ];

  try {
    const summarySystemPrompt = buildSummaryPrompt(Object.keys(finalFiles), planDetails);
    const result = await callModel('summarize', prompt, summarySystemPrompt);
    const summaryData = safeParseJSON(result.content);
    
    if (summaryData) {
      summary = summaryData.summary || summary;
      appName = summaryData.appName || appName;
      suggestedActions = summaryData.suggestedActions || suggestedActions;
      console.log(`[Worker V3] Layer 5 ✅ Summary: "${summary.substring(0, 60)}..."`);
    }
  } catch (e) {
    console.warn(`[Worker V3] Layer 5 summary failed (${e.message}) — using default`);
  }

  console.log(`[Worker V3] Job ${job.id} ✅ | Track: ${isNextjs ? 'Next.js' : 'HTML'} | Files: ${Object.keys(finalFiles).length}`);

  return {
    summary,
    appName,
    suggestedActions,
    outputTrack: isNextjs ? 'nextjs' : 'html',
    previewType: isNextjs ? 'sandpack' : 'srcdoc',
    files: finalFiles,
    plan: {
      siteType: parsedSitePlan.siteType,
      track: parsedSitePlan.outputTrack,
      sections: parsedSitePlan.sections
    }
  };

}, {
  connection,
  concurrency: 1,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20
  }
});

// ─── COMPLETION HANDLER ───────────────────────────────────────────────────────
aiWorker.on('completed', async (job, returnvalue) => {
  console.log(`✅ [Worker V3] Job ${job.id} completed`);
  
  const projectId = job.data.projectId;
  const messageId = job.data.messageId;
  
  if (projectId && returnvalue?.files) {
    try {
      const Project = require('../models/Project');
      const Version = require('../models/Version');
      
      let versionId = null;
      try {
        const newVersion = await Version.create({
          projectId: projectId,
          messageId: messageId || null,
          name: returnvalue.summary || 'Initial Generation',
          trigger: 'generation',
          fileTree: returnvalue.files
        });
        versionId = newVersion._id;
        console.log(`[Worker V3] DB: Created Version snapshot ${versionId}`);
      } catch (vErr) {
        console.error(`[Worker V3] DB Version persist failed:`, vErr.message);
      }
      
      await Project.findByIdAndUpdate(projectId, {
        currentFileTree: returnvalue.files,
        status: 'done',
        lastGeneratedAt: new Date(),
        outputTrack: returnvalue.outputTrack,
        ...(versionId && { activeVersionId: versionId })
      });
      console.log(`[Worker V3] DB: saved ${Object.keys(returnvalue.files).length} files to project ${projectId}`);
    } catch (dbErr) {
      console.error(`[Worker V3] DB persist failed:`, dbErr.message);
    }
    
    // Update assistant message in DB with the summary
    if (messageId) {
      try {
        const Message = require('../models/Message');
        await Message.findByIdAndUpdate(messageId, {
          content: returnvalue.summary || 'Generated successfully.',
          status: 'done'
        });
      } catch (msgErr) {
        console.warn(`[Worker V3] Message update failed:`, msgErr.message);
      }
    }
    
    // Broadcast all files to CLI via WebSocket
    for (const [path, content] of Object.entries(returnvalue.files)) {
      broadcastFileUpdate(projectId, path, content);
    }
  }
});

// ─── FAILURE HANDLER ─────────────────────────────────────────────────────────
aiWorker.on('failed', async (job, err) => {
  console.error(`❌ [Worker V3] Job ${job?.id} failed: ${err.message}`);
  
  if (job?.data?.messageId) {
    try {
      const Message = require('../models/Message');
      await Message.findByIdAndUpdate(job.data.messageId, {
        content: `Generation failed: ${err.message}. Please try again.`,
        status: 'error'
      });
    } catch {}
  }
});

module.exports = { aiWorker };
