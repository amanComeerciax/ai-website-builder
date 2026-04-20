const fs = require('fs').promises;
const path = require('path');
const { callModel } = require('./modelRouter');
const Template = require('../models/Template');
const { resolveImages } = require('./imageResolver');
const { shouldChunk, chunkTemplate, reassembleTemplate, extractStyleContext } = require('./templateChunker');

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Post-processing: Fix broken image URLs in generated HTML.
 * Catches source.unsplash.com (dead), placehold.co, empty src, and
 * images.unsplash.com/featured (unreliable) — replaces with Pollinations AI.
 */
function fixBrokenImages(html, businessContext = '') {
  let fixCount = 0;
  const ctx = encodeURIComponent(businessContext || 'professional website hero image');

  // Fix source.unsplash.com (DEAD service)
  html = html.replace(/https?:\/\/source\.unsplash\.com\/[^\s"')]+/g, (match) => {
    fixCount++;
    const keywordsMatch = match.match(/\?([^"'\s]+)/);
    const keywords = keywordsMatch ? encodeURIComponent(keywordsMatch[1].replace(/[,&=]/g, ' ').trim()) : ctx;
    return `https://image.pollinations.ai/prompt/${keywords}?width=800&height=600&nologo=true`;
  });

  // Fix images.unsplash.com/featured (unreliable, often 404s)
  html = html.replace(/https?:\/\/images\.unsplash\.com\/featured\/?\?[^\s"')]+/g, (match) => {
    fixCount++;
    const keywordsMatch = match.match(/\?([^&"'\s]+)/);
    const keywords = keywordsMatch ? encodeURIComponent(keywordsMatch[1].replace(/[,&=]/g, ' ').trim()) : ctx;
    return `https://image.pollinations.ai/prompt/${keywords}?width=800&height=600&nologo=true`;
  });

  // Fix placehold.co, placeholder.com, via.placeholder.com, dummyimage.com
  html = html.replace(/https?:\/\/(placehold\.co|placeholder\.com|via\.placeholder\.com|dummyimage\.com)\/[^\s"')]+/g, () => {
    fixCount++;
    return `https://image.pollinations.ai/prompt/${ctx}?width=800&height=600&nologo=true`;
  });

  // Fix empty src=""
  html = html.replace(/src\s*=\s*""\s*/g, () => {
    fixCount++;
    return `src="https://image.pollinations.ai/prompt/${ctx}?width=800&height=600&nologo=true" `;
  });

  if (fixCount > 0) {
    console.log(`[ImageFixer] 🔧 Fixed ${fixCount} broken image URL(s)`);
  }

  return html;
}

/**
 * Extract the design system from existing HTML using code-based parsing.
 * Parses <style> blocks, inline styles, and class patterns to identify:
 * - Color palette (CSS variables, hex/rgb values)
 * - Font families
 * - Grid/layout patterns (grid-template-columns, flexbox)
 * - Spacing tokens (padding, margin, gap)
 * - Border-radius values
 * - Shadow patterns
 * Zero AI calls — pure regex/string parsing.
 */
function extractDesignSystem(html) {
  const design = {
    colors: [],
    fonts: [],
    gridPatterns: [],
    spacing: [],
    borderRadius: [],
    shadows: [],
    cssVariables: {},
    summary: ''
  };

  // Extract all <style> content
  const styleBlocks = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRegex.exec(html)) !== null) {
    styleBlocks.push(m[1]);
  }
  const allCss = styleBlocks.join('\n');

  // CSS Variables
  const varRegex = /--(\w[\w-]*)\s*:\s*([^;]+)/g;
  while ((m = varRegex.exec(allCss)) !== null) {
    design.cssVariables[`--${m[1]}`] = m[2].trim();
  }

  // Colors (hex, rgb, hsl)
  const colorSet = new Set();
  const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  while ((m = hexRegex.exec(allCss)) !== null) colorSet.add(m[0]);
  const rgbRegex = /rgba?\([^)]+\)/g;
  while ((m = rgbRegex.exec(allCss)) !== null) colorSet.add(m[0]);
  const hslRegex = /hsla?\([^)]+\)/g;
  while ((m = hslRegex.exec(allCss)) !== null) colorSet.add(m[0]);
  design.colors = [...colorSet].slice(0, 20);

  // Fonts
  const fontSet = new Set();
  const fontRegex = /font-family\s*:\s*([^;]+)/g;
  while ((m = fontRegex.exec(allCss)) !== null) {
    fontSet.add(m[1].trim().replace(/['"/]/g, '').split(',')[0].trim());
  }
  // Also check Google Fonts links
  const gfRegex = /fonts\.googleapis\.com\/css2?\?family=([^&"']+)/g;
  while ((m = gfRegex.exec(html)) !== null) {
    fontSet.add(decodeURIComponent(m[1]).replace(/\+/g, ' ').split(':')[0]);
  }
  design.fonts = [...fontSet].slice(0, 6);

  // Grid patterns
  const gridRegex = /grid-template-columns\s*:\s*([^;]+)/g;
  while ((m = gridRegex.exec(allCss)) !== null) design.gridPatterns.push(m[1].trim());

  // Border radius values
  const brSet = new Set();
  const brRegex = /border-radius\s*:\s*([^;]+)/g;
  while ((m = brRegex.exec(allCss)) !== null) brSet.add(m[1].trim());
  design.borderRadius = [...brSet].slice(0, 8);

  // Spacing (gap, padding, margin)
  const gapSet = new Set();
  const gapRegex = /(?:gap|padding|margin)\s*:\s*([^;]+)/g;
  while ((m = gapRegex.exec(allCss)) !== null) gapSet.add(m[1].trim());
  design.spacing = [...gapSet].slice(0, 12);

  // Box shadows
  const shadowSet = new Set();
  const shadowRegex = /box-shadow\s*:\s*([^;]+)/g;
  while ((m = shadowRegex.exec(allCss)) !== null) shadowSet.add(m[1].trim());
  design.shadows = [...shadowSet].slice(0, 5);

  // Build summary string for injection into prompts
  const parts = [];
  if (design.fonts.length > 0) parts.push(`Fonts: ${design.fonts.join(', ')}`);
  if (design.colors.length > 0) parts.push(`Color palette: ${design.colors.slice(0, 10).join(', ')}`);
  if (design.gridPatterns.length > 0) parts.push(`Grid patterns: ${design.gridPatterns.join(' | ')}`);
  if (design.borderRadius.length > 0) parts.push(`Border radius: ${design.borderRadius.join(', ')}`);
  if (design.spacing.length > 0) parts.push(`Spacing: ${design.spacing.slice(0, 6).join(', ')}`);
  if (design.shadows.length > 0) parts.push(`Shadows: ${design.shadows.slice(0, 3).join(' | ')}`);
  if (Object.keys(design.cssVariables).length > 0) {
    const vars = Object.entries(design.cssVariables).slice(0, 15).map(([k, v]) => `${k}: ${v}`).join('; ');
    parts.push(`CSS Variables: ${vars}`);
  }
  design.summary = parts.join('\n');

  return design;
}

/**
 * Extract a section map from the HTML — identifies all <section>, <header>, <footer>,
 * and major <div> blocks with IDs/classes so the AI can accurately target sections.
 */
function extractSectionMap(html) {
  const sections = [];
  // Match <section>, <header>, <footer>, <main>, <article>, <nav> with id/class
  const sectionRegex = /<(section|header|footer|main|article|nav)([^>]*)>/gi;
  let m;
  while ((m = sectionRegex.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const attrs = m[2];
    const idMatch = attrs.match(/id\s*=\s*["']([^"']+)["']/);
    const classMatch = attrs.match(/class\s*=\s*["']([^"']+)["']/);
    
    // Get a snippet of the content (first 150 chars after the opening tag)
    const contentStart = m.index + m[0].length;
    const snippet = html.substring(contentStart, contentStart + 150).replace(/<[^>]+>/g, ' ').trim().substring(0, 80);
    
    sections.push({
      tag,
      id: idMatch ? idMatch[1] : null,
      classes: classMatch ? classMatch[1] : null,
      contentPreview: snippet,
    });
  }
  return sections;
}

async function getRawTemplate(enrichedSpec, requestModel) {
  const queryStr = `${enrichedSpec.businessName || ''} - ${enrichedSpec.description || ''} - ${enrichedSpec.rawPrompt || ''}`;

  // ── PRIORITY 1: User pre-selected a template from the Category/Template picker ──
  if (enrichedSpec.templateId) {
    console.log(`[Generator] 🎯 User selected template: "${enrichedSpec.templateId}" — skipping AI selection`);
    try {
      const TEMPLATES_DIR = path.join(__dirname, '../templates');
      const [category, templateName] = enrichedSpec.templateId.split('/');

      if (!category || !templateName) {
        console.warn(`[Generator] Invalid templateId format: "${enrichedSpec.templateId}" — falling through to AI selection`);
      } else {
        // Try HTML file paths (same approach as templateRoutes.js)
        const nameNoHyphens = templateName.replace(/-/g, '');
        const htmlPaths = [
          path.join(TEMPLATES_DIR, category, `${templateName}.html`),
          path.join(TEMPLATES_DIR, category, `${nameNoHyphens}.html`),
          path.join(TEMPLATES_DIR, 'raw', `${templateName}.html`),
          path.join(TEMPLATES_DIR, 'raw', `${nameNoHyphens}.html`),
        ];

        let htmlContent = null;
        for (const htmlPath of htmlPaths) {
          try {
            htmlContent = await fs.readFile(htmlPath, 'utf-8');
            console.log(`[Generator] ✅ Loaded user-selected template HTML from: ${htmlPath}`);
            break;
          } catch {}
        }

        // Fallback: render from JSON if no raw HTML found
        if (!htmlContent) {
          const jsonPath = path.join(TEMPLATES_DIR, category, `${templateName}.json`);
          try {
            const jsonContent = await fs.readFile(jsonPath, 'utf-8');
            const templateData = JSON.parse(jsonContent);
            const { renderToHTML } = require('../component-kit/html-renderer.js');
            const { getTheme } = require('../config/themeRegistry.js');
            const themeConfig = getTheme(enrichedSpec.themeId || 'modern-dark');
            htmlContent = renderToHTML(templateData, themeConfig);
            console.log(`[Generator] ✅ Rendered user-selected template from JSON: ${jsonPath}`);
          } catch (renderErr) {
            console.warn(`[Generator] ⚠️ Failed to load/render user-selected template "${enrichedSpec.templateId}":`, renderErr.message);
          }
        }

        // Fallback: fetch from MongoDB (for templates uploaded via admin or community)
        if (!htmlContent) {
          try {
            const dbTemplate = await Template.findOne({ slug: templateName }).lean();
            if (dbTemplate && dbTemplate.htmlContent) {
              htmlContent = dbTemplate.htmlContent;
              console.log(`[Generator] ✅ Loaded user-selected template HTML from MongoDB: ${templateName}`);
            }
          } catch (dbErr) {
             console.warn(`[Generator] ⚠️ Error finding template "${templateName}" in MongoDB:`, dbErr.message);
          }
        }

        if (htmlContent) {
          return { name: templateName, content: htmlContent };
        }
        console.warn(`[Generator] ⚠️ User-selected template "${enrichedSpec.templateId}" not found — falling through to AI selection`);
      }
    } catch (err) {
      console.warn(`[Generator] ⚠️ Error loading user-selected template:`, err.message);
    }
  }

  // ── PRIORITY 2: AI-based selection from MongoDB ──
  try {
    const templates = await Template.find({ isActive: true }).select('name description keywords').lean();
    
    if (templates.length > 0) {
      console.log(`[Generator] 📦 Found ${templates.length} templates in MongoDB`);

      const templateList = templates.map((t, i) => 
        `${i + 1}. ${t.name} — ${t.description}${t.keywords ? ` (${t.keywords})` : ''}`
      ).join('\n    ');

      const selectionPrompt = `You are a design selector. Based on the user's business, pick the single best template.

User's business: "${queryStr}"

Available templates:
    ${templateList}

INSTRUCTIONS:
- Match by INDUSTRY and VIBE, not just exact keywords.
- A yoga studio should match wellness/mindfulness templates.
- A pizza shop should match restaurant/food templates.
- A graphic designer should match portfolio/freelancer templates.
- An online clothing store should match fashion/e-commerce templates.
- A developer tools company should match tech/SaaS/developer templates.
- If nothing is a strong match, pick the most visually versatile option.

Reply with ONLY the exact template name (e.g. template3). No explanation.`;

      let chosenTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      try {
        const selRes = await callModel('template_selector', queryStr, selectionPrompt, { forceModel: requestModel });
        const respName = selRes.content.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        
        const exactMatch = templates.find(t => t.name === respName);
        if (exactMatch) {
          chosenTemplate = exactMatch;
        } else {
          // Fuzzy match
          const fuzzy = templates.find(t => respName.includes(t.name) || t.name.includes(respName));
          if (fuzzy) chosenTemplate = fuzzy;
        }
      } catch (err) {
        console.warn('[Generator] Template selection failed, using random:', err.message);
      }

      // Fetch the full HTML content for the chosen template
      const fullTemplate = await Template.findOne({ name: chosenTemplate.name }).select('name htmlContent').lean();
      console.log(`[Generator] Selected template: ${fullTemplate.name} (from MongoDB)`);
      return { name: fullTemplate.name, content: fullTemplate.htmlContent };
    }
  } catch (dbErr) {
    console.warn('[Generator] MongoDB template lookup failed, falling back to filesystem:', dbErr.message);
  }

  // ── PRIORITY 3: Random selection from local filesystem (backward compatible) ──
  const templatesDir = path.join(__dirname, '../templates/raw');
  await ensureDirectoryExists(templatesDir);
  
  try {
    const files = await fs.readdir(templatesDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) return null;

    // Simple random selection for fallback mode
    const chosenFile = htmlFiles[Math.floor(Math.random() * htmlFiles.length)];
    console.log(`[Generator] Selected template: ${chosenFile} (from filesystem — fallback)`);
    return { name: chosenFile.replace('.html', ''), content: await fs.readFile(path.join(templatesDir, chosenFile), 'utf-8') };
    
  } catch (e) {
    console.error('[Generator] Error reading design styles:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// MODE 2: CONTEXTUAL EDIT — Surgical diff-patch approach
// Instead of regenerating 45K HTML, the AI returns compact JSON patches
// ─────────────────────────────────────────────────────────

/**
 * Apply an array of {find, replace} patches to the original HTML.
 * Falls back gracefully if a patch doesn't match (logs a warning).
 */
function applyPatches(originalHtml, patches) {
  let result = originalHtml;
  let appliedCount = 0;

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  for (const patch of patches) {
    if (!patch.find || patch.replace === undefined) {
      console.warn(`[Patcher] Skipping invalid patch:`, JSON.stringify(patch).substring(0, 100));
      continue;
    }

    // Try exact match first
    if (result.includes(patch.find)) {
      result = result.replace(patch.find, patch.replace);
      appliedCount++;
    } else {
      // Try trimmed match
      const trimmedFind = patch.find.trim();
      if (result.includes(trimmedFind)) {
        result = result.replace(trimmedFind, patch.replace);
        appliedCount++;
      } else {
        // Try simple fuzzy match: ignore all whitespace differences
        const findRegexStr = patch.find
            .split(/\\s+/)
            .filter(part => part.length > 0)
            .map(escapeRegExp)
            .join('\\\\s+');
            
        try {
           const regex = new RegExp(findRegexStr);
           if (regex.test(result)) {
               result = result.replace(regex, patch.replace);
               appliedCount++;
           } else {
               console.warn(`[Patcher] ⚠️ Could not find patch target (${patch.find.substring(0, 80)}...)`);
           }
        } catch (e) {
           console.warn(`[Patcher] ⚠️ Regex match failed for target (${patch.find.substring(0, 80)}...)`);
        }
      }
    }
  }

  console.log(`[Patcher] Applied ${appliedCount}/${patches.length} patches successfully`);
  return { result, appliedCount, totalPatches: patches.length };
}

async function editExistingHtml(existingHtml, userPrompt, enrichedSpec, onProgress, requestModel) {
  onProgress({ event: 'thinking', message: 'Analyzing your edit request...' });
  onProgress({ event: 'log', type: 'Reading', file: 'current website', message: 'Reviewing your existing website code' });

  const htmlLength = existingHtml.length;
  console.log(`[Generator] ✏️ editExistingHtml called — prompt: "${userPrompt.substring(0, 100)}..." (${htmlLength} chars)`);

  // ── PRE-PROCESSING: Extract design system and section map (code-based, zero AI cost) ──
  const designSystem = extractDesignSystem(existingHtml);
  const sectionMap = extractSectionMap(existingHtml);
  console.log(`[Generator] 🎨 Extracted design system: ${designSystem.colors.length} colors, ${designSystem.fonts.length} fonts, ${designSystem.gridPatterns.length} grids`);
  console.log(`[Generator] 📍 Section map: ${sectionMap.length} sections found`);

  // ── DETECT INTENT (MULTI-INTENT) ──
  // A user prompt can contain MULTIPLE tasks. We detect ALL of them.
  const lowerPrompt = userPrompt.toLowerCase();
  const editIntents = new Set();

  if (/change.*image|swap.*image|replace.*image|update.*image|new.*image|different.*image|change.*photo|swap.*photo|every.*image.*same|same.*image/i.test(lowerPrompt)) {
    editIntents.add('change_images');
  }
  if (/redesign|rebuild|redo|make.*new|rewrite|restyle/i.test(lowerPrompt)) {
    editIntents.add('redesign_section');
  }
  if (/change.*colou?r|change.*font|change.*text|update.*text|change.*heading|rename|change.*name|translat|english|languag|russian|spanish|french|german|chinese|hindi|arabic|no\s+\w+\s+language|use\s+\w+\s+language/i.test(lowerPrompt)) {
    editIntents.add('change_content');
  }
  if (/fix|improve|adjust|align|broken|wrong|bad|ugly|improper|issue|problem|suitable|proper/i.test(lowerPrompt)) {
    editIntents.add('fix_section');
  }

  // If nothing matched, fall back to the general intent
  if (editIntents.size === 0) editIntents.add('general');

  // Track whether the prompt references multiple distinct sections or "everywhere"
  const isMultiSection = /every|all|whole|entire|website|page|everywhere/i.test(lowerPrompt)
    || (lowerPrompt.match(/\b(and|also|plus|additionally)\b/g) || []).length >= 1;

  console.log(`[Generator] 🎯 Detected edit intents: [${[...editIntents].join(', ')}] | Multi-section: ${isMultiSection}`);

  // Build section map description for the AI
  const sectionMapDesc = sectionMap.length > 0
    ? sectionMap.map((s, i) => {
        let desc = `  ${i + 1}. <${s.tag}>`;
        if (s.id) desc += ` id="${s.id}"`;
        if (s.classes) desc += ` class="${s.classes.substring(0, 60)}"`;
        if (s.contentPreview) desc += ` — "${s.contentPreview.substring(0, 50)}..."`;
        return desc;
      }).join('\n')
    : '  (No semantic sections detected)';

  // ── MULTI-INTENT instruction builder ──
  // Each detected intent appends its own instruction block so the AI sees ALL tasks.
  const intentBlocks = [];

  if (editIntents.has('change_images')) {
    intentBlocks.push(`
═══ TASK: CHANGE IMAGES ═══
Replace image src URLs with new, UNIQUE Pollinations URLs that match the website context.

CRITICAL — UNIQUE IMAGE GENERATION PROCESS:
For EACH image on the page, follow this 3-step process:
  Step 1: Read the heading/text near the image to understand what it represents
  Step 2: Write a SPECIFIC, UNIQUE description for THAT image (minimum 5 words, max 12 words)
  Step 3: URL-encode the description and embed it in the Pollinations URL

Example for a hacker site with 4 sections:
  - GHOST section → "dark hooded figure in neon green cyberspace"
  - CODE section → "glowing lines of source code on black terminal"
  - DRIVE section → "encrypted hard drive with digital locks"
  - SERVER section → "server rack with blinking lights in dark room"

URL pattern: https://image.pollinations.ai/prompt/{URL-ENCODED-UNIQUE-DESCRIPTION}?width={W}&height={H}&nologo=true
  Hero/banners: width=1200&height=800 | Cards: width=800&height=600 | Avatars: width=400&height=400

IMAGE QUALITY RULES:
- Every <img> must also have: object-fit: cover; width: 100%; proper max-height; border-radius matching the site; overflow:hidden on its container
- NEVER repeat the same image URL or same description twice on the page
- NEVER use generic descriptions like "website image" or "section image" — be SPECIFIC to the content
- Each description must contain keywords from that specific section's heading/text
`);
  }

  if (editIntents.has('change_content')) {
    intentBlocks.push(`
═══ TASK: CHANGE CONTENT / LANGUAGE ═══
Modify text content as the user requested.
- If the user asked for a specific LANGUAGE (e.g. "use English", "no Russian"), translate ALL visible text in the targeted area(s) to the requested language.
- If the user mentioned changing headings, names, or labels, update those specifically.
- Keep all images, layout, and CSS untouched unless another TASK block says otherwise.
`);
  }

  if (editIntents.has('fix_section')) {
    intentBlocks.push(`
═══ TASK: FIX / IMPROVE SECTION ═══
Fix EVERYTHING wrong with the targeted section(s):
- Fix image sizing: add object-fit: cover, proper width/height, max-height constraints
- Fix image containers: add overflow: hidden, border-radius matching the site
- Fix layout: proper grid/flex, consistent columns, equal-height cards
- Fix alignment: text-align, justify-content, align-items
- Fix spacing: consistent padding, margin, gap
- Make the section look PROFESSIONAL and match the rest of the website's quality

CRITICAL — FIXING means IMPROVING, not DELETING:
- NEVER remove any content, cards, images, or HTML elements
- Keep ALL existing elements — just fix their CSS/styling/layout
- "Fix" = add/modify CSS properties, wrap in containers, add grid/flex
- "Fix" ≠ delete, remove, or simplify
`);
  }

  if (editIntents.has('redesign_section')) {
    intentBlocks.push(`
═══ TASK: REDESIGN SECTION ═══
Restructure the HTML of the target section, BUT:
- MUST use the same design system (colors, fonts, spacing, border-radius) as the rest of the site
- The redesigned section must look like it belongs to the same website
`);
  }

  // Always append design inheritance rules for quality
  intentBlocks.push(`
═══ DESIGN INHERITANCE RULES (apply to ALL changes) ═══
Before making ANY change, analyze the existing site's design system:
- Use the SAME color palette (CSS variables, hex values, gradients) for any new/modified element
- Use the SAME typography (font-family, sizes, weights) — never introduce new fonts
- Use the SAME layout patterns (grid columns, flex layouts, card structures)
- Use the SAME spacing system (padding, margin, gap values)
- Use the SAME decoration (border-radius, shadows, hover effects, transitions)

If you ADD any new section or content block:
- It MUST look like it was designed by the same designer who made the original template
- Use the SAME grid column count, card styling, heading hierarchy, section padding
- Include hover effects/transitions if the template has them
- NEVER create a section with raw unstyled images or plain text blocks
- Every new section MUST be responsive (use the same breakpoints as the blueprint)
- Every <img> must be inside a properly sized container with overflow:hidden and object-fit:cover
`);

  const intentInstructions = intentBlocks.join('\n');

  // Scope instruction — adapt based on whether this is multi-section
  const scopeInstruction = isMultiSection
    ? `\nSCOPE: The user's prompt references MULTIPLE areas or the whole website. You may create patches for MULTIPLE sections as needed. Still, ONLY change what the user explicitly asked for — do not add unrelated improvements.`
    : `\nSCOPE: Identify WHICH section(s) the user is referring to, and create patches ONLY for those section(s). Do NOT touch unrelated sections.`;

  // ── SURGICAL DIFF-PATCH APPROACH ──
  const systemPrompt = `You are an expert web developer and UI designer performing SURGICAL code edits.
The user has an existing website and wants specific changes. CAREFULLY read their FULL prompt — it may contain MULTIPLE separate tasks.

YOUR OUTPUT FORMAT — MANDATORY:
Return a JSON array of patches. Each patch has "find" (exact original snippet) and "replace" (modified snippet).

Example output:
[
  {"find": "<a href=\\"#menu\\">Menu</a>", "replace": "<a href=\\"#menu\\" style=\\"font-family: 'Inter', sans-serif\\">Menu</a>"},
  {"find": "</head>", "replace": "<link href=\\"https://fonts.googleapis.com/css2?family=Inter&display=swap\\" rel=\\"stylesheet\\">\\n</head>"}
]
${intentInstructions}
${scopeInstruction}

═══ WEBSITE SECTION MAP (use to identify sections the user is referring to) ═══
${sectionMapDesc}

═══ EXISTING DESIGN SYSTEM (use these values for any CSS changes/additions) ═══
${designSystem.summary || '(Could not extract — analyze the HTML inline styles and <style> blocks)'}

╔══════════════════════════════════════════════════════════════════╗
║  ZERO TOLERANCE RULES — VIOLATING ANY = TOTAL FAILURE           ║
╚══════════════════════════════════════════════════════════════════╝

RULE 0 — NEVER DELETE (HIGHEST PRIORITY RULE):
You MUST NEVER delete, remove, or empty out ANY section, div, image, card, or HTML element.
"Fixing" a section means ADDING or MODIFYING CSS/styles — NOT removing HTML.
If a section has 6 images, it must STILL have 6 images after your fix.
If a section has 4 cards, it must STILL have 4 cards after your fix.
The "replace" value in your patch must contain ALL the original HTML elements — just with added/modified CSS.
If your patch's "replace" has FEWER elements than "find", you have FAILED.
The ONLY time you may remove an element is if the user EXPLICITLY says "remove" or "delete".

RULE 1 — TASK DECOMPOSITION:
Before generating patches, FIRST decompose the user's prompt into INDIVIDUAL tasks.
For each task, identify WHICH section(s) it targets using the SECTION MAP above.
Then create patches for ALL tasks, not just the first one.
Use fuzzy matching for typos. "galery secion" = gallery section. "languange" = language.

RULE 2 — SCOPE AWARENESS:
You MUST ONLY create patches for sections/elements the user explicitly mentioned or referenced.
Do NOT touch sections the user didn't reference — even if you think they need improvement.
But if the user says "every image" or "all text" or "whole website", you MAY patch across multiple sections.

SPECIFICALLY, you MUST NOT:
✗ "Improve" or "fix" anything the user didn't ask about — even if you think it looks bad
✗ Add, remove, or reorder entire sections unless explicitly asked
✗ Delete ANY element from a section (see RULE 0)

RULE 3 — DESIGN CONSISTENCY:
Any CSS you add or modify MUST use values from the EXISTING DESIGN SYSTEM above.
- Use the same fonts, colors, border-radius, and spacing as the rest of the site
- Use the same grid column patterns
- If the site uses CSS variables (--var-name), use those in your patches
- NEVER introduce new colors, fonts, or spacing that don't exist in the design system

RULE 4 — IMAGE CONSTRAINTS:
When fixing images in the targeted section:
- CRITICAL: NEVER ADD new <img> tags! Only modify existing ones.
- DO NOT inject images into text marquees, headers, or paragraphs.
- Every <img> MUST preserve its original CSS classes, inline styles, and DOM structure.
- Do NOT change the layout flex or grid properties to accommodate an image.
- NEVER leave an <img> without size constraints (object-fit: cover, width: 100%).

RULE 5 — SCREENSHOT = PROBLEM REPORT:
If the user attached a screenshot with a VISION EXTRACTION SPEC, fix the CSS problems identified there.

RULE 6 — TYPO TOLERANCE:
Interpret past typos: "secion" = "section", "aligment" = "alignment", "chnage" = "change", "languange" = "language".

═══ PATCH RULES ═══

1. The "find" value MUST be an EXACT substring of the existing HTML — copy it character-for-character. Include enough context to be unique.
2. The "replace" value is the modified version.
3. EXTRACT JSON SAFELY: Since you are returning a JSON string of HTML, you MUST escape all internal double quotes as \\" and newlines as \\n. NEVER use unescaped double quotes inside the "find" or "replace" values, or it will break JSON.parse.
4. To add CSS, prefer patching the existing <style> block or adding inline styles.
5. For EXISTING images, use: https://image.pollinations.ai/prompt/{URL-ENCODED-DESCRIPTION}?width=800&height=600&nologo=true
   NEVER use source.unsplash.com, placehold.co, or inject new images.
6. DOUBLE-CHECK every patch: does this "find" string exist in the HTML? If not, DELETE that patch.

Return ONLY the JSON array. No markdown wrapping, no explanations.`;

  // ── PHASE 1: AI PROMPT UNDERSTANDING ──
  // Instead of ONLY using regex, we let the AI itself decompose the user prompt
  // into structured tasks. This is how Claude/GPT work — they "think" first.
  onProgress({ event: 'thinking', message: 'Understanding your request...' });
  onProgress({ event: 'log', type: 'Reading', file: 'prompt analysis', message: 'AI is breaking down your request into tasks...' });

  let aiTaskDecomposition = '';
  try {
    const decomposePrompt = `You are an expert at understanding user requests for website modifications.
The user sent a message asking for changes to their website. Your job is to break it down into a NUMBERED LIST of concrete, specific tasks.

For each task, identify:
1. WHAT to change (images, text, layout, alignment, colors, etc.)
2. WHERE to change it (which section: hero, footer, nav, gallery, etc. — or "all sections" if global)
3. HOW to change it (the specific modification)

EXAMPLES:
User: "change the images every images is same and use english no russian and fix footer"
Decomposition:
1. CHANGE IMAGES: Replace all duplicate/identical images across ALL sections with unique, contextually relevant images for each section
2. CHANGE LANGUAGE: Translate all Russian text to English across the ENTIRE website
3. FIX FOOTER: Fix the layout/alignment/styling of the FOOTER section

User: "dont use same images for GHOST, CODE, DRIVE, SERVER sections"
Decomposition:
1. CHANGE IMAGES: Replace the image in the GHOST section with a unique image matching "ghost" theme
2. CHANGE IMAGES: Replace the image in the CODE section with a unique image matching "code" theme
3. CHANGE IMAGES: Replace the image in the DRIVE section with a unique image matching "drive" theme
4. CHANGE IMAGES: Replace the image in the SERVER section with a unique image matching "server" theme

IMPORTANT:
- If the user attached a SCREENSHOT with identified problems, include those as SEPARATE tasks
- Include ALL tasks — do not skip any part of the user's request
- Be specific about WHICH sections are affected
- Interpret typos: "chnage" = change, "aligment" = alignment, "languange" = language

Return ONLY the numbered task list. No other text.`;

    const decomposeResult = await callModel('summarize', userPrompt, decomposePrompt, { forceModel: requestModel });
    aiTaskDecomposition = decomposeResult.content.trim();
    console.log(`[Generator] 🧠 AI Task Decomposition:\n${aiTaskDecomposition}`);
  } catch (decompErr) {
    console.warn(`[Generator] ⚠️ Task decomposition failed (non-fatal):`, decompErr.message);
    aiTaskDecomposition = `1. ${userPrompt}`; // Fallback to raw prompt
  }

  // ── PHASE 2: Generate patches using both the raw prompt AND the AI decomposition ──
  const userMessage = `=== EDIT REQUEST (the user's original message — interpret past typos) ===
${userPrompt}

=== AI TASK BREAKDOWN (structured interpretation of the above request) ===
${aiTaskDecomposition}

=== BUSINESS CONTEXT ===
Business: ${enrichedSpec.businessName || 'N/A'}

=== EXISTING HTML (${htmlLength} chars) — find exact snippets from this code ===
INSTRUCTIONS:
1. Use the AI TASK BREAKDOWN above as your checklist — create patches for EVERY numbered task.
2. For each task, find the exact HTML snippet to modify and create a patch.
3. Do NOT skip any task. Verify you have at least one patch per task.
4. For image changes: write a descriptive, UNIQUE prompt for EACH image based on its section context.

${existingHtml}`;

  onProgress({ event: 'thinking', message: editIntents.has('fix_section') ? 'Analyzing section issues...' : `Planning ${editIntents.size > 1 ? editIntents.size + ' ' : ''}surgical changes...` });
  onProgress({ event: 'log', type: 'Reading', file: 'task breakdown', message: `Identified ${aiTaskDecomposition.split('\n').filter(l => /^\d+\./.test(l.trim())).length} tasks to execute` });

  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
  
  let patchJson = response.content.trim();

  // Robustly extract JSON array if wrapped in markdown or conversational text
  try {
    const match = patchJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      patchJson = match[0];
    }
  } catch (e) {
    console.warn(`[Generator] ⚠️ Regex extraction failed, trying raw response string`);
  }

  console.log(`[Generator] 📦 AI returned ${patchJson.length} chars of patches (vs ${htmlLength} chars full HTML — ${Math.round((1 - patchJson.length / htmlLength) * 100)}% savings)`);

  let patches;
  try {
    patches = JSON.parse(patchJson);
    if (!Array.isArray(patches)) {
      throw new Error('Response is not an array');
    }
  } catch (parseErr) {
    // FALLBACK: Try a softer parse or drop to full HTML
    console.warn(`[Generator] ⚠️ JSON parse failed: ${parseErr.message}. Attempting cleanup...`);
    // Remove invisible control characters that break JSON
    patchJson = patchJson.replace(/[\\x00-\\x1F\\x7F-\\x9F]/g, " ");
    try {
      patches = JSON.parse(patchJson);
      console.log(`[Generator] ✅ Secondary JSON parse succeeded after cleanup`);
    } catch (secondErr) {
      console.warn(`[Generator] ⚠️ Secondary JSON parse failed. Checking if it returned full HTML...`);
      if (patchJson.includes('<!DOCTYPE html>') || patchJson.includes('<html')) {
        console.log(`[Generator] ↩️ Falling back to full-HTML mode`);
        onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: 'Applied changes (full rewrite mode)' });
        return patchJson;
      }
      throw new Error(`AI returned invalid patch format. Ensure there are no unescaped quotes or newlines in the payload. Error: ${secondErr.message}`);
    }
  }

  onProgress({ event: 'thinking', message: `Applying ${patches.length} surgical patches...` });

  let { result: finalHtml, appliedCount, totalPatches } = applyPatches(existingHtml, patches);

  if (appliedCount === 0) {
    console.error(`[Generator] ❌ No patches could be applied — falling back to unmodified HTML`);
    onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: '⚠️ Changes could not be applied — review your request' });
    return existingHtml;
  }

  onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: `Applied ${appliedCount}/${totalPatches} changes successfully` });

  // Post-process: resolve images via Pexels API (falls back to fixBrokenImages if no API key)
  onProgress({ event: 'log', type: 'Resolving', file: 'images', message: 'Finding matching stock photos...' });
  finalHtml = await resolveImages(finalHtml, enrichedSpec.businessName || enrichedSpec.description || '');

  return finalHtml;
}

// ─────────────────────────────────────────────────────────
// MODE 3: VISUAL EDIT — Targeted element modifications
// ─────────────────────────────────────────────────────────

/**
 * Parse the visual edit prefix to extract element descriptors and the actual prompt.
 * Input format: "[Visual Edit on: <span>, <p> ("some text")]\nchange font to bold"
 * Returns: { elements: [{tag: 'span'}, {tag: 'p', text: 'some text'}], prompt: 'change font to bold' }
 */
function parseVisualEditPrefix(prompt) {
  // NEW multi-line format with section context
  const newMatch = prompt.match(/^\[Visual Edit on \d+ element\(s\):\n([\s\S]+?)\]\n?([\s\S]*)$/);
  if (newMatch) {
    const elementsBlock = newMatch[1];
    const actualPrompt = newMatch[2].trim();
    const elements = [];
    const lineRegex = /\d+\.\s*<(\w+)(#[\w-]+)?>\s*(?:containing "([^"]*)")?\s*(?:in <(\w+)>)?/g;
    let lm;
    while ((lm = lineRegex.exec(elementsBlock)) !== null) {
      elements.push({ tag: lm[1], id: lm[2] ? lm[2].substring(1) : null, text: lm[3] || null, section: lm[4] || null });
    }
    if (elements.length > 0) return { elements, prompt: actualPrompt };
  }
  // LEGACY single-line format
  const match = prompt.match(/^\[Visual Edit on:\s*(.+?)\]\n?([\s\S]*)$/);
  if (!match) return null;

  const elementsStr = match[1];
  const actualPrompt = match[2].trim();
  
  // Parse element descriptors like: <span>, <p#myId> ("text content"), <div>
  const elements = [];
  const elementRegex = /<(\w+)(#[\w-]+)?>(?:\s*\("([^"]+)"\))?/g;
  let m;
  while ((m = elementRegex.exec(elementsStr)) !== null) {
    elements.push({
      tag: m[1],
      id: m[2] ? m[2].substring(1) : null,
      text: m[3] || null
    });
  }

  return { elements, prompt: actualPrompt };
}

/**
 * Targeted element editing — gives the AI surgical instructions 
 * to modify only the specific elements the user selected in the visual editor.
 */
async function editTargetedElements(existingHtml, parsedEdit, enrichedSpec, onProgress, requestModel) {
  const { elements, prompt: editPrompt } = parsedEdit;
  
  const elementDescriptions = elements.map(el => {
    let desc = `<${el.tag}>`;
    if (el.id) desc += ` with id="${el.id}"`;
    if (el.text) desc += ` containing text "${el.text}"`;
    if (el.section) desc += ` in <${el.section}> section`;
    return desc;
  }).join(', ');

  const htmlLength = existingHtml.length;
  console.log(`[Generator] 🎯 VISUAL EDIT — targeting ${elements.length} element(s): ${elementDescriptions}`);
  console.log(`[Generator] 🎯 User request: "${editPrompt}" (HTML: ${htmlLength} chars)`);

  onProgress({ event: 'thinking', message: `Targeting ${elements.length} element(s) for your edit...` });
  onProgress({ event: 'log', type: 'Reading', file: 'selected elements', message: `Found ${elements.length} element(s) to modify` });

  const systemPrompt = `You are an expert web developer performing SURGICAL element-level edits.
The user has selected SPECIFIC elements on their website and wants ONLY those elements modified.

TARGET ELEMENTS:
${elements.map((el, i) => {
  let desc = `  ${i + 1}. <${el.tag}> element`;
  if (el.id) desc += ` with id="${el.id}"`;
  if (el.text) desc += ` — currently showing: "${el.text}"`;
  if (el.section) desc += ` — located inside the <${el.section}> section`;
  return desc;
}).join('\n')}

YOUR OUTPUT FORMAT — MANDATORY:
Return a JSON array of patches. Each patch has "find" (exact original snippet from the HTML) and "replace" (modified version).

Example:
[
  {"find": "<a href=\\"#menu\\">Menu</a>", "replace": "<a href=\\"#menu\\" style=\\"font-weight: bold\\">Menu</a>"}
]

RULES:
1. The "find" value MUST be an EXACT character-for-character substring of the existing HTML.
2. Only create patches for the TARGET ELEMENTS listed above. Do NOT touch anything else.
3. Include enough surrounding context in "find" to make it unique (e.g., include the full tag with attributes).
4. To add CSS rules, patch "</head>" to inject a <style> block before it.
5. NEVER ADD new <img> elements. Only modify existing ones.
6. For existing images, preserve the exact CSS classes and sizing (object-fit: cover, width: 100%). You may use: https://image.pollinations.ai/prompt/{URL-ENCODED}?width=800&height=600&nologo=true
7. Return ONLY the JSON array. No markdown. No explanations.`;

  const userMessage = `=== EDIT REQUEST ===
${editPrompt}

=== BUSINESS CONTEXT ===
Business: ${enrichedSpec.businessName || 'N/A'}

=== EXISTING HTML (${htmlLength} chars) — find exact snippets from this ===
${existingHtml}`;

  onProgress({ event: 'thinking', message: 'Applying targeted changes...' });

  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
  
  let patchJson = response.content.trim();
  
  // Clean markdown wrapping
  if (patchJson.startsWith('```json')) {
    patchJson = patchJson.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (patchJson.startsWith('```')) {
    patchJson = patchJson.replace(/^```/, '').replace(/```$/, '').trim();
  }

  console.log(`[Generator] 📦 Visual edit: AI returned ${patchJson.length} chars of patches (vs ${htmlLength} chars — ${Math.round((1 - patchJson.length / htmlLength) * 100)}% savings)`);

  let patches;
  try {
    patches = JSON.parse(patchJson);
    if (!Array.isArray(patches)) throw new Error('Not an array');
  } catch (parseErr) {
    // Fallback: if AI returned full HTML
    console.warn(`[Generator] ⚠️ Visual edit: AI returned non-JSON, checking for full HTML fallback...`);
    if (patchJson.includes('<!DOCTYPE html>') || patchJson.includes('<html')) {
      console.log(`[Generator] ↩️ Using full-HTML fallback for visual edit`);
      onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: `Modified ${elements.length} element(s) (full rewrite)` });
      return patchJson;
    }
    throw new Error(`Visual edit returned invalid format: ${parseErr.message}`);
  }

  onProgress({ event: 'thinking', message: `Applying ${patches.length} patches to ${elements.length} element(s)...` });

  let { result: finalHtml, appliedCount, totalPatches } = applyPatches(existingHtml, patches);

  if (appliedCount === 0) {
    console.error(`[Generator] ❌ No visual edit patches matched — returning unmodified HTML`);
    onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: '⚠️ Element changes could not be applied' });
    return existingHtml;
  }

  onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: `Modified ${appliedCount} element(s) successfully` });

  // Post-process: resolve images via Pexels API
  onProgress({ event: 'log', type: 'Resolving', file: 'images', message: 'Finding matching stock photos...' });
  const fixedHtml = await resolveImages(finalHtml, enrichedSpec?.businessName || '');

  return fixedHtml;
}

// ─────────────────────────────────────────────────────────
// MODE 1: FRESH GENERATION — Pick a design blueprint, adapt content
// ─────────────────────────────────────────────────────────

/**
 * Build the system prompt for content customization (shared by single-shot and chunked modes)
 */
function getContentCustomizationPrompt(isChunkMode = false) {
  const chunkRule = isChunkMode
    ? `\n\nCHUNK MODE RULE: You are receiving ONE SECTION of a larger website. Customize ONLY this section's content. Do NOT add <html>, <head>, <body>, or <style> tags. Return ONLY the section HTML.`
    : `\n\nOUTPUT: Return ONLY the final valid HTML code. No markdown wrapping. No explanations.`;

  return `You are an expert web developer, UI designer, and copywriter.
You will be provided with a design blueprint and a target business specification.
Your PRIMARY job is to rewrite the text content, images, and brand names to match the new business.

═══ CONTENT RULES ═══

1. PRESERVE the HTML structure, class names, CSS, scripts, and IDs of the original blueprint.
2. Maintain the APPROXIMATE length and tone of the original text blocks.
3. IMAGES — STRICT PRESERVATION & AUTONOMOUS CONTEXT:
   - CRITICAL: DO NOT ADD any new <img> elements anywhere! Only use images where they already exist in the blueprint template.
   - Do NOT inject images into text marquees, headers, or paragraphs that were text-only.
   - For EVERY EXISTING <img> tag, think: "What should this image ACTUALLY show for this business?"
   - Write a short visual description (3-8 words) matching the specific card/section content.
   - Use this URL pattern to trigger our backend waterfall resolver:
     https://image.pollinations.ai/prompt/{URL-ENCODED-DESCRIPTION}?width={W}&height={H}&nologo=true
   
   Hero/banner images: width=1200&height=800
   Card/feature images: width=800&height=600
   Thumbnails/avatars: width=400&height=400
   
   Example for a chai shop "Masala Chai" card:
   <img src="https://image.pollinations.ai/prompt/hot%20masala%20chai%20glass%20cup%20with%20cardamom?width=800&height=600&nologo=true" alt="Masala Chai">
   
   IMAGE RULES:
   - NEVER add <img> tags that weren't in the original template.
   - Each image MUST have a UNIQUE description.
   - If ANY image src is empty, broken, or uses source.unsplash.com, replace it with a Pollinations URL.

═══ DESIGN INHERITANCE RULES (CRITICAL — for any new or modified content) ═══

5. DESIGN SYSTEM EXTRACTION:
   Before making ANY changes, you MUST analyze the blueprint's design system:
   - Identify the color palette (CSS variables, hex values, gradients)
   - Identify the typography (font families, sizes, weights, line-heights)
   - Identify the layout patterns (grid columns, flex layouts, card structures)
   - Identify the spacing system (padding, margin, gap values)
   - Identify the decoration patterns (border-radius, shadows, hover effects)
   ALL new content you create MUST use these EXACT same values.

6. IMAGE EXACT PRESERVATION & SIZING:
   - You MUST PRESERVE the exact CSS classes, inline styles, and DOM structure of the original <img> tags.
   - Do NOT remove or alter existing Tailwind classes on images or their parent containers.
   - Do NOT change the layout flex or grid properties to accommodate an image.
   - NEVER add new images to sections that did not originally require them. Keep the exact vibe, layout, and visual geometry as the original design.

7. SECTION QUALITY STANDARD:
   If you add ANY section, element, or content block that doesn't exist in the original blueprint:
   - It MUST look like it was designed by the same designer who made the original template
   - Use the SAME grid column count (if template uses 3-col, your new section uses 3-col)
   - Use the SAME card styling (padding, border-radius, background, shadows)
   - Use the SAME heading hierarchy (font-size, font-weight, color, spacing)
   - Use the SAME section spacing/padding as other sections in the template
   - Include proper hover effects if the template has them (transitions, transforms, opacity)
   - NEVER create a section with just a heading and raw unstyled images below it
   - EVERY new section must be responsive (use the same breakpoints as the blueprint)

8. LAYOUT QUALITY CHECKLIST (apply to every section in the output):
   ✓ Images are contained and properly sized (not overflowing)
   ✓ Grid/flex layouts have consistent gaps and alignment
   ✓ Text has proper contrast against its background
   ✓ Cards/items in a row have equal heights
   ✓ Mobile breakpoints are handled (if the blueprint has @media rules)
   ✓ No orphaned elements floating outside their containers${chunkRule}`;
}

/**
 * MODE 1-B: CHUNKED FRESH GENERATION — For large templates exceeding AI token limits.
 * Splits template into sections, processes each independently, reassembles.
 */
async function generateChunkedHtml(template, enrichedSpec, onProgress, requestModel) {
  console.log(`[Generator] 🔪 CHUNKED MODE — template "${template.name}" exceeds safe threshold`);
  onProgress({ event: 'thinking', message: 'Large template detected — using smart section-by-section processing...' });

  const chunkResult = chunkTemplate(template.content);
  const editableSections = chunkResult.sections.filter(s => s.isEditable);
  const totalSections = editableSections.length;

  onProgress({ event: 'log', type: 'Analyzing', file: 'design style', message: `Detected ${totalSections} sections to customize` });

  // Get CSS context for the AI (design tokens, colors, fonts — NOT the full CSS)
  const styleContext = extractStyleContext(chunkResult.head);

  const systemPrompt = getContentCustomizationPrompt(true);

  const businessContext = `=== TARGET SPECIFICATION ===
Business Name: ${enrichedSpec.businessName}
Target Audience: ${enrichedSpec.targetAudience}
Tone: ${enrichedSpec.tone}
Description: ${enrichedSpec.description}
========================`;

  // Process each section sequentially
  const customizedSections = [];

  for (let i = 0; i < editableSections.length; i++) {
    const section = editableSections[i];
    const sectionLabel = section.id.replace(/[-_]/g, ' ').replace(/\d+$/, '').trim() || section.tag;

    onProgress({ 
      event: 'thinking', 
      message: `Customizing section ${i + 1}/${totalSections}: ${sectionLabel}...` 
    });
    onProgress({ 
      event: 'log', 
      type: 'Creating', 
      file: `section ${i + 1}/${totalSections}`, 
      message: `Processing: ${sectionLabel} (${section.lineCount} lines)` 
    });

    const userMessage = `${businessContext}

=== DESIGN SYSTEM (CSS context — do NOT include in output) ===
${styleContext}

=== SECTION TO CUSTOMIZE (return ONLY this section's HTML) ===
${section.html}`;

    try {
      const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
      let sectionHtml = response.content.trim();

      // Clean markdown wrapping
      if (sectionHtml.startsWith('```html')) {
        sectionHtml = sectionHtml.replace(/^```html/, '').replace(/```$/, '').trim();
      } else if (sectionHtml.startsWith('```')) {
        sectionHtml = sectionHtml.replace(/^```/, '').replace(/```$/, '').trim();
      }

      // Strip any accidentally added <html>/<head>/<body> wrappers
      sectionHtml = sectionHtml
        .replace(/^<!DOCTYPE[^>]*>\s*/i, '')
        .replace(/^<html[^>]*>\s*/i, '')
        .replace(/<\/html>\s*$/i, '')
        .replace(/^<head>[\s\S]*?<\/head>\s*/i, '')
        .replace(/^<body[^>]*>\s*/i, '')
        .replace(/<\/body>\s*$/i, '')
        .trim();

      customizedSections.push(sectionHtml);
      console.log(`[Generator] ✅ Section ${i + 1}/${totalSections} (${sectionLabel}) — ${sectionHtml.length} chars`);
    } catch (err) {
      // On failure, keep original section content
      console.warn(`[Generator] ⚠️ Section ${i + 1} (${sectionLabel}) failed: ${err.message} — using original`);
      customizedSections.push(section.html);
    }
  }

  onProgress({ event: 'thinking', message: 'Assembling all sections into final website...' });

  // Reassemble into complete HTML
  let finalHtml = reassembleTemplate(chunkResult, customizedSections);

  onProgress({ event: 'log', type: 'Creating', file: 'index.html', message: `Website assembled from ${totalSections} sections` });

  // Post-process: resolve images
  onProgress({ event: 'log', type: 'Resolving', file: 'images', message: 'Finding matching stock photos...' });
  finalHtml = await resolveImages(finalHtml, enrichedSpec.businessName || enrichedSpec.description || '');

  return { html: finalHtml, templateName: template.name };
}

async function generateFreshHtml(enrichedSpec, onProgress, requestModel) {
  onProgress({ event: 'thinking', message: 'Selecting the best design for your project...' });
  
  const template = await getRawTemplate(enrichedSpec, requestModel);
  
  if (!template) {
    throw new Error('No design styles found. Please add HTML files to /server/templates/raw/');
  }

  // IMPORTANT: Do NOT expose template name to user — use generic label
  onProgress({ event: 'log', type: 'Reading', file: 'design style', message: 'Found the perfect design match' });

  // ── AUTO-CHUNKER: Route large templates to section-by-section processing ──
  if (shouldChunk(template.content)) {
    return await generateChunkedHtml(template, enrichedSpec, onProgress, requestModel);
  }

  // ── STANDARD: Small templates — single-shot processing ──
  onProgress({ event: 'thinking', message: 'Customizing the design for your brand...' });

  const systemPrompt = getContentCustomizationPrompt(false);

  const userMessage = `=== TARGET SPECIFICATION ===
Business Name: ${enrichedSpec.businessName}
Target Audience: ${enrichedSpec.targetAudience}
Tone: ${enrichedSpec.tone}
Description: ${enrichedSpec.description}
========================

=== DESIGN BLUEPRINT ===
${template.content}`;

  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
  
  let finalHtml = response.content.trim();
  
  // Clean markdown wrapping
  if (finalHtml.startsWith('```html')) {
      finalHtml = finalHtml.replace(/^```html/, '').replace(/```$/, '').trim();
  } else if (finalHtml.startsWith('```')) {
      finalHtml = finalHtml.replace(/^```/, '').replace(/```$/, '').trim();
  }

  onProgress({ event: 'log', type: 'Creating', file: 'index.html', message: 'Website code generated successfully' });

  // Post-process: resolve images via Pexels API (real stock photos)
  onProgress({ event: 'log', type: 'Resolving', file: 'images', message: 'Finding matching stock photos...' });
  finalHtml = await resolveImages(finalHtml, enrichedSpec.businessName || enrichedSpec.description || '');

  return { html: finalHtml, templateName: template.name };
}

// ─────────────────────────────────────────────────────────
// SHARED: Transpile HTML → Next.js JSX
// ─────────────────────────────────────────────────────────
async function transpileToNextJs(finalHtml, enrichedSpec, onProgress, requestModel) {
  onProgress({ event: 'thinking', message: 'Creating production-ready project files...' });
  
  const nextjsSystemPrompt = `You are an expert Next.js developer. Convert the provided HTML into a valid Next.js App Router client component (app/page.jsx).
CRITICAL RULES:
1. Output ONLY valid JSX. Convert class= to className=, for= to htmlFor=, style="x: y;" to style={{x: 'y'}}, and ensure all tags like <img>, <br>, <input>, <hr> are self-closed.
2. Put 'use client'; at the top of the file since it has interactions.
3. Import Lucide icons like <ArrowRight size={16} /> instead of using <i data-lucide="arrow-right"></i>.
4. If there's script logic like Scroll observers or IntersectionObserver, wrap them inside a useEffect block inside the component.
5. Provide ONLY the raw code string, nothing else. DO NOT wrap in markdown code fences. Do not include explanations.`;

  let pageJsx = '';
  try {
      const jsxRes = await callModel('html_to_jsx', finalHtml, nextjsSystemPrompt, { forceModel: requestModel });
      pageJsx = jsxRes.content.trim();
      if (pageJsx.startsWith('```jsx')) pageJsx = pageJsx.replace(/^```jsx/, '').replace(/```$/, '').trim();
      else if (pageJsx.startsWith('```')) pageJsx = pageJsx.replace(/^```/, '').replace(/```$/, '').trim();
  } catch (err) {
      console.warn('[Generator] Failed to generate JSX:', err.message);
      pageJsx = `'use client';\nexport default function Page() {\n  return <div>Failed to compile Next.js project. Check the index.html fallback.</div>;\n}`;
  }

  onProgress({ event: 'log', type: 'Creating', file: 'app/page.jsx', message: 'Project files ready' });

  const bizName = enrichedSpec.businessName || 'My Website';
  const safeName = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return {
      'index.html': finalHtml,
      'app/page.jsx': pageJsx,
      'app/layout.jsx': `export const metadata = { title: '${bizName}', description: '${enrichedSpec.description || ''}' };\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <head>\n        <script src="https://cdn.tailwindcss.com"></script>\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}`,
      'package.json': JSON.stringify({ 
          name: safeName, 
          version: "1.0.0",
          scripts: { dev: "next dev", build: "next build", start: "next start" },
          dependencies: { "next": "latest", "react": "latest", "react-dom": "latest", "lucide-react": "latest" }
      }, null, 2),
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: ["./app/**/*.{js,jsx,ts,tsx}"],\n  theme: {\n    extend: {}\n  },\n  plugins: [],\n};`,
      'README.md': `# ${bizName}\n\nGenerated website project.`
  };
}

// ─────────────────────────────────────────────────────────
// PUBLIC API — Called by aiWorker.js
// ─────────────────────────────────────────────────────────
async function generateRawHtml(enrichedSpec, onProgress, existingHtml = null, requestModel = null, originalPrompt = null) {
  let finalHtml;
  let internalTemplateName = 'custom';

  // Use the original user prompt for edits (not the enhanced version which may transform intent)
  const editPrompt = originalPrompt || enrichedSpec.rawPrompt;

  if (existingHtml) {
    // Check if this is a visual-edit-targeted request
    const parsedVisualEdit = parseVisualEditPrefix(editPrompt);
    
    if (parsedVisualEdit && parsedVisualEdit.elements.length > 0) {
      // ── MODE 3: VISUAL EDIT (element-targeted) ──
      console.log(`[Generator] 🎯 VISUAL EDIT MODE — ${parsedVisualEdit.elements.length} element(s) targeted`);
      finalHtml = await editTargetedElements(existingHtml, parsedVisualEdit, enrichedSpec, onProgress, requestModel);
    } else {
      // ── MODE 2: CONTEXTUAL EDIT (general) ──
      console.log(`[Generator] ✏️ EDIT MODE — modifying existing website (${existingHtml.length} chars)`);
      finalHtml = await editExistingHtml(existingHtml, editPrompt, enrichedSpec, onProgress, requestModel);
    }
  } else {
    // ── MODE 1: FRESH GENERATION ──
    console.log(`[Generator] 🆕 FRESH MODE — generating from design blueprint`);
    const result = await generateFreshHtml(enrichedSpec, onProgress, requestModel);
    finalHtml = result.html;
    internalTemplateName = result.templateName;
  }

  // Transpile to Next.js files
  const allFiles = await transpileToNextJs(finalHtml, enrichedSpec, onProgress, requestModel);

  return {
    html: finalHtml,
    layoutSpec: { sections: [{ component: 'GeneratedPage', meta: {} }] },
    files: allFiles,
    previewType: 'srcdoc',
    meta: { generatedFromRaw: true }
  };
}

module.exports = { generateRawHtml };
