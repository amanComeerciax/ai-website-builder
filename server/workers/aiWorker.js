const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { callModel } = require('../services/modelRouter.js');
const { enhance } = require('../services/promptEnhancer.js');
const { assemble } = require('../services/templateAssembler.js');
const { generateRawHtml } = require('../services/rawHtmlGenerator.js');
const { extractVisionContext } = require('../services/groqService.js');
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
  const { projectId, prompt, existingFiles, enhanceOptions, model, images, fileContents } = job.data;
  let existingHtmlForEdit = null;
  if (!prompt) throw new Error("Missing 'prompt' in job data");

  const currentModel = model || 'mistral';

  // ─── STEP 1: ENHANCE PROMPT ────────────────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Analyzing your request...' }
  });

  let isModification = false;
  let previousLayoutSpec = null;
  let enhanceOptionsOverride = { ...(enhanceOptions || {}), requestModel: currentModel };

  const mongoose = require('mongoose');
  if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
    try {
      const Project = require('../models/Project');
      const project = await Project.findById(projectId);
      
      if (project && project.isConfigured) {
        // Inherit previous meta config
        enhanceOptionsOverride.theme = project.theme;
        enhanceOptionsOverride.websiteName = project.websiteName;
        enhanceOptionsOverride.description = project.description;

        // CRITICAL: Grab the existing generated HTML for contextual editing
        if (project.currentFileTree && project.currentFileTree['index.html']) {
          existingHtmlForEdit = project.currentFileTree['index.html'];
          isModification = true;
          enhanceOptionsOverride.isModification = true;
          console.log(`[Worker] 🔄 MODIFICATION MODE — project "${project.websiteName || project.name}" has existing HTML for editing`);
        } else {
          console.warn(`[Worker] ⚠️ Project is configured but no existing HTML found — treating as FRESH GENERATION`);
          isModification = false;
          enhanceOptionsOverride.isModification = false;
        }

        // Try to fetch previous layoutSpec from the latest Message that has one
        const Message = require('../models/Message');
        const lastMsg = await Message.findOne({ 
          projectId, 
          role: 'assistant', 
          layoutSpec: { $exists: true, $ne: null } 
        }).sort({ createdAt: -1 });

        if (lastMsg && lastMsg.layoutSpec) {
          previousLayoutSpec = lastMsg.layoutSpec;
          console.log(`[Worker] ✅ Found previous layoutSpec from message ${lastMsg._id}`);
        }
      } else {
        console.log(`[Worker] 🆕 NEW GENERATION — project not yet configured`);
      }
    } catch (dbErr) {
      console.warn(`[Worker] Failed to fetch previous project state:`, dbErr.message);
    }
  }

  let enhanced;
  try {
    enhanced = await enhance(prompt, { ...enhanceOptionsOverride, existingFiles });
    console.log(`[Worker] PromptEnhancer ✅ — site: ${enhanced.siteType}, theme: ${enhanced.themeName}, isModification: ${isModification}`);
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
        isModification: isModification,
      },
      enhancedPrompt: prompt,
      siteType: 'default',
      themeName: 'Modern Dark',
    };
  }

  await job.updateProgress({
    event: 'thinking',
    payload: { message: isModification ? 'Planning your changes...' : 'Selecting the perfect design...' }
  });

  await job.updateProgress({
    event: 'log',
    payload: {
      type: 'Reading',
      file: 'prompt analysis',
      message: isModification ? 'Preparing your requested changes...' : `Designing your ${enhanced.siteType} website`
    }
  });

  // ─── STEP 2 & 3: PLAN LAYOUT + ASSEMBLE ──────────────────────
  // The templateAssembler handles both steps internally:
  //   - Calls layoutPlanner to get AI-generated component selections
  //   - Renders them using pre-built HTML templates
  //   - Generates Next.js project files for export

  let result;
  try {
    if (isModification && existingHtmlForEdit) {
      console.log(`[Worker] ✏️ Routing to CONTEXTUAL EDIT mode`);
      console.log(`[Worker] 📝 Original prompt: "${prompt.substring(0, 120)}..."`);
      console.log(`[Worker] 📄 Existing HTML size: ${existingHtmlForEdit.length} chars`);
    } else {
      console.log(`[Worker] 🆕 Routing to FRESH GENERATION mode`);
      if (isModification && !existingHtmlForEdit) {
        console.warn(`[Worker] ⚠️ Project is configured but currentFileTree['index.html'] is missing — falling back to FRESH`);
      }
    }
    // Build prompt with attachment context
    let enrichedPrompt = prompt;
    
    // Process Images using Vision Extractor
    if (images && images.length > 0) {
      await job.updateProgress({
        event: 'thinking',
        payload: { message: `Analyzing ${images.length} attached image(s)...` }
      });
      
      const visionSpec = await extractVisionContext(images);
      
      if (visionSpec) {
        enrichedPrompt += `\n\n[USER ATTACHED SCREENSHOT(S) FOR REFERENCE]\n`;
        enrichedPrompt += `The user attached screenshot(s) for visual layout/style reference. A vision model analyzed the screenshot and extracted the following architectural and design constraints. YOU MUST ADHERE STRICTLY TO THESE EXTRACTED DETAILS:\n\n`;
        enrichedPrompt += `### VISION EXTRACTION SPEC ###\n${visionSpec}\n##############################\n`;
      } else {
        enrichedPrompt += `\n\n[User attached ${images.length} image(s) for reference]`;
      }
    }
    if (fileContents && fileContents.length > 0) {
      const fileDescs = fileContents.map(f => `--- ${f.name} ---\n${f.content?.substring(0, 2000)}`).join('\n');
      enrichedPrompt += `\n\n[User attached files for reference:]\n${fileDescs}`;
    }

    result = await generateRawHtml(enhanced.enrichedSpec, (progress) => {
      job.updateProgress({
        event: progress.event,
        payload: { type: progress.type, file: progress.file, message: progress.message }
      });
    }, isModification ? existingHtmlForEdit : null, currentModel, enrichedPrompt);
  } catch (e) {
    console.error(`[Worker] Generation failed:`, e.message);
    throw new Error(`Website generation failed: ${e.message}`);
  }

  // ─── STEP 4: SUMMARIZE ─────────────────────────────────────────
  await job.updateProgress({
    event: 'thinking',
    payload: { message: 'Wrapping up...' }
  });

  let summary = `Generated your ${enhanced.siteType} website successfully.`;
  let appName = enhanced.enrichedSpec.businessName || 'Website';
  let suggestedActions = ['Change the color scheme', 'Add more sections', 'Update the content', 'Download Next.js project'];

  try {
    const fileNames = Object.keys(result.files);
    const { systemPrompt, userMessage } = buildSummaryPrompt(fileNames, {
      projectGlossary: { AppName: appName },
      sections: result.layoutSpec.sections.map(s => s.component),
    }, isModification, prompt);
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
          const Version = require('../models/Version');

          // Create a Version snapshot for the timeline
          let versionId = null;
          try {
            const allFiles = { ...finalFiles, ...result.files };
            const newVersion = await Version.create({
              projectId: job.data.projectId,
              messageId: job.data.messageId || null,
              name: summary ? summary.substring(0, 100) : 'Generation',
              trigger: 'generation',
              fileTree: allFiles
            });
            versionId = newVersion._id;
            console.log(`[Worker] Created Version snapshot ${versionId}`);
          } catch (vErr) {
            console.error(`[Worker] Version persist failed:`, vErr.message);
          }

          await Project.findByIdAndUpdate(job.data.projectId, {
            isConfigured: true,
            status: 'done',
            currentFileTree: { ...finalFiles, ...result.files },
            outputTrack: 'html',
            // Use themeId for backend/frontend consistency
            theme: enhanced.enrichedSpec?.themeId || 'modern-dark',
            websiteName: enhanced.enrichedSpec?.businessName,
            description: enhanced.enrichedSpec?.description,
            ...(versionId && { activeVersionId: versionId })
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
