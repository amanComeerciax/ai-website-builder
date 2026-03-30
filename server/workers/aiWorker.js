const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { callModel } = require('../services/modelRouter.js');
const { enhance } = require('../services/promptEnhancer.js');
const { assemble } = require('../services/templateAssembler.js');
const { buildSummaryPrompt } = require('../utils/promptBuilder.js');

const connection = new IORedis(process.env.UPSTASH_REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * BullMQ Worker — Component Kit AI Generation Pipeline
 * 
 * Replaces the old dual-track (HTML vs React) system with a unified approach:
 * 
 *   Step 1: ENHANCE PROMPT  (PromptEnhancer — rule-based + Mistral)
 *   Step 2: PLAN LAYOUT     (Mistral — selects components, fills content as JSON)
 *   Step 3: ASSEMBLE         (Template Assembler — renders HTML from pre-built components)
 *   Step 4: SUMMARIZE        (Mistral — generates a user-facing summary)
 * 
 * The AI NEVER writes code. It only plans and fills content.
 * All code comes from pre-built, tested component templates.
 * Result: ZERO runtime errors, instant preview, production-ready export.
 */
const aiWorker = new Worker('AI_Generation_Queue', async job => {
  console.log(`[Worker] Job ${job.id} started for project: ${job.data.projectId}`);
  const { prompt, existingFiles, enhanceOptions } = job.data;
  if (!prompt) throw new Error("Missing 'prompt' in job data");

  // ─── STEP 1: ENHANCE PROMPT ────────────────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Understanding your request...' }
  });

  let enhanced;
  try {
    enhanced = await enhance(prompt, { ...(enhanceOptions || {}), existingFiles });
    console.log(`[Worker] PromptEnhancer ✅ — site: ${enhanced.siteType}, theme: ${enhanced.themeName}`);
  } catch (e) {
    console.warn(`[Worker] PromptEnhancer failed, using minimal defaults:`, e.message);
    enhanced = {
      enrichedSpec: {
        rawPrompt: prompt,
        businessName: enhanceOptions?.websiteName || 'My Website',
        siteType: 'default',
        themeName: 'Modern Dark',
        themeId: enhanceOptions?.theme || 'modern-dark',
        sections: ['navbar', 'hero', 'features', 'about', 'testimonials', 'contact', 'footer'],
        description: enhanceOptions?.description || '',
        targetAudience: 'general audience',
        tone: 'professional',
        tagline: '',
        contentHints: null,
        isModification: false,
      },
      enhancedPrompt: prompt,
      siteType: 'default',
      themeName: 'Modern Dark',
    };
  }

  await job.updateProgress({
    event: 'log',
    payload: {
      type: 'Reading',
      file: 'prompt analysis',
      message: `Creating ${enhanced.siteType} site with ${enhanced.themeName} theme`
    }
  });

  // ─── STEP 2 & 3: PLAN LAYOUT + ASSEMBLE ──────────────────────
  // The templateAssembler handles both steps internally:
  //   - Calls layoutPlanner to get AI-generated component selections
  //   - Renders them using pre-built HTML templates
  //   - Generates Next.js project files for export

  let result;
  try {
    result = await assemble(enhanced.enrichedSpec, (progress) => {
      job.updateProgress({
        event: progress.event,
        payload: {
          type: progress.type,
          file: progress.file,
          message: progress.message,
        }
      });
    });
  } catch (e) {
    console.error(`[Worker] Assembly failed:`, e.message);
    throw new Error(`Website assembly failed: ${e.message}`);
  }

  // ─── STEP 4: SUMMARIZE ─────────────────────────────────────────
  let summary = `Generated your ${enhanced.siteType} website successfully.`;
  let appName = enhanced.enrichedSpec.businessName || 'Website';
  let suggestedActions = ['Change the color scheme', 'Add more sections', 'Update the content', 'Download Next.js project'];

  try {
    const fileNames = Object.keys(result.files);
    const { systemPrompt, userMessage } = buildSummaryPrompt(fileNames, {
      projectGlossary: { AppName: appName },
      sections: result.layoutSpec.sections.map(s => s.component),
    });
    const r = await callModel('summarize', userMessage, systemPrompt);
    const s = JSON.parse(r.content);
    summary = s.summary || summary;
    appName = s.appName || appName;
    suggestedActions = s.suggestedActions || suggestedActions;
  } catch (e) {
    console.warn(`[Worker] Summary generation failed (non-fatal):`, e.message);
  }

  console.log(`[Worker] Job ${job.id} complete — "${appName}" — ${result.layoutSpec.sections.length} sections`);

  // ─── PERSIST TO DB ─────────────────────────────────────────────
  const finalFiles = { 'index.html': result.html };

  if (job.data.messageId) {
    try {
      const Message = require('../models/Message');
      await Message.findByIdAndUpdate(job.data.messageId, {
        status: 'done',
        content: summary,
        files: { ...finalFiles, ...result.files },
        previewType: 'srcdoc',
        layoutSpec: result.layoutSpec,
      });
      console.log(`[Worker] Saved to DB Message ${job.data.messageId}`);
      
      // CRITICAL CROSS-BROWSER FIX: Also update the Project model directly
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(job.data.projectId)) {
          const Project = require('../models/Project');
          await Project.findByIdAndUpdate(job.data.projectId, {
            isConfigured: true,
            status: 'done',
            // Use themeId for backend/frontend consistency
            theme: enhanced.enrichedSpec?.themeId || 'modern-dark',
            websiteName: enhanced.enrichedSpec?.businessName,
            description: enhanced.enrichedSpec?.description
          });
          console.log(`[Worker] ✅ HARD-SAVED Project ${job.data.projectId} as configured`);
      } else {
          console.warn(`[Worker] Skipping Project update — ID "${job.data.projectId}" is not an ObjectId`);
      }
    } catch (saveErr) {
      console.error(`[Worker] DB save failed:`, saveErr.message);
    }
  }

  // ─── RETURN TO FRONTEND ────────────────────────────────────────
  return {
    summary,
    appName,
    suggestedActions,
    outputTrack: 'component-kit',
    previewType: 'srcdoc',
    files: finalFiles,
    exportFiles: result.files,      // Full file set including Next.js export
    layoutSpec: result.layoutSpec,   // For iteration
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
