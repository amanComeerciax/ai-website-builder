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

  if (!isNextjs) {
    // ─── TRACK A: HTML ────────────────────────────────────
    const trackAPrompt = buildTrackAPrompt(planDetails, matchedTemplateFiles);
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

        const result = await callModel('generate_html', prompt, trackAPrompt);
        htmlContent = result.content
          .replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

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
          htmlContent = fixResult.content;
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
    let generated = false;

    for (let retry = 0; retry < 2; retry++) {
      try {
        if (retry > 0) {
          await job.updateProgress({ 
            event: 'acting', 
            payload: { message: `♻️ Full Next.js regeneration (attempt ${retry + 1})...`, phase: 'generate' } 
          });
        }

        const result = await callModel('generate_file', prompt, trackBPrompt);
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
            filesObj[failedFile] = fixResult.content;
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
