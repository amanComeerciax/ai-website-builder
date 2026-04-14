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
 * Uses multiple matching strategies for robustness:
 *  1. Exact match
 *  2. Trimmed match
 *  3. Whitespace-normalized match
 *  4. Key-content substring match (for short content like phone numbers, emails)
 */
function applyPatches(originalHtml, patches) {
  let result = originalHtml;
  let appliedCount = 0;

  for (const patch of patches) {
    if (!patch.find || patch.replace === undefined) {
      console.warn(`[Patcher] Skipping invalid patch:`, JSON.stringify(patch).substring(0, 100));
      continue;
    }

    let applied = false;

    // Strategy 1: Exact match
    if (result.includes(patch.find)) {
      result = result.replace(patch.find, patch.replace);
      applied = true;
    }

    // Strategy 2: Trimmed match
    if (!applied) {
      const trimmedFind = patch.find.trim();
      if (trimmedFind && result.includes(trimmedFind)) {
        result = result.replace(trimmedFind, patch.replace.trim());
        applied = true;
      }
    }

    // Strategy 3: Whitespace-normalized match
    // Collapse all whitespace sequences to single spaces for comparison
    if (!applied) {
      const normalizeWS = (s) => s.replace(/\s+/g, ' ').trim();
      const normalizedFind = normalizeWS(patch.find);
      
      if (normalizedFind.length > 10) {
        // Find the matching region in the original HTML
        const lines = result.split('\n');
        for (let i = 0; i < lines.length; i++) {
          // Check a window of lines around this position
          for (let windowSize = 1; windowSize <= 5 && (i + windowSize) <= lines.length; windowSize++) {
            const chunk = lines.slice(i, i + windowSize).join('\n');
            if (normalizeWS(chunk) === normalizedFind) {
              result = result.replace(chunk, patch.replace);
              applied = true;
              break;
            }
          }
          if (applied) break;
        }
      }
    }

    // Strategy 4: Key-content extraction match
    // For simple text changes (phone, email, etc.), extract the inner text content
    // and find the element containing it
    if (!applied) {
      // Extract text content from HTML snippet (strip tags)
      const extractText = (html) => html.replace(/<[^>]+>/g, '').trim();
      const findText = extractText(patch.find);
      
      if (findText.length > 3 && findText.length < 200) {
        // Look for this text in the result
        const textIndex = result.indexOf(findText);
        if (textIndex !== -1) {
          // Found the text — now find the surrounding tag context
          // Replace just the text content within a reasonable window
          const before = result.lastIndexOf('<', textIndex);
          const after = result.indexOf('>', result.indexOf('</', textIndex));
          
          if (before !== -1 && after !== -1 && (after - before) < 500) {
            const originalSnippet = result.substring(before, after + 1);
            const replaceText = extractText(patch.replace);
            const newSnippet = originalSnippet.replace(findText, replaceText);
            
            if (newSnippet !== originalSnippet) {
              result = result.replace(originalSnippet, newSnippet);
              applied = true;
              console.log(`[Patcher] 🎯 Text-match applied: "${findText.substring(0, 40)}" → "${replaceText.substring(0, 40)}"`);
            }
          }
        }
      }
    }

    if (applied) {
      appliedCount++;
    } else {
      console.warn(`[Patcher] ⚠️ Could not find patch target (${patch.find.substring(0, 80)}...)`);
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

  // ── SURGICAL DIFF-PATCH APPROACH ──
  // The AI returns ONLY the changed snippets as JSON, not the full 45K HTML
  const systemPrompt = `You are an expert web developer performing SURGICAL code edits.
The user has an existing website and wants specific changes. 

YOUR OUTPUT FORMAT — MANDATORY:
Return a JSON array of patches. Each patch has "find" (exact original snippet) and "replace" (modified snippet).

Example output:
[
  {"find": "<a href=\\"#menu\\">Menu</a>", "replace": "<a href=\\"#menu\\" style=\\"font-family: 'Inter', sans-serif\\">Menu</a>"},
  {"find": "</head>", "replace": "<link href=\\"https://fonts.googleapis.com/css2?family=Inter&display=swap\\" rel=\\"stylesheet\\">\\n</head>"}
]

CRITICAL RULES:
1. The "find" value MUST be an EXACT substring of the existing HTML — copy it character-for-character from the provided code. Include enough context to be unique.
2. The "replace" value is the modified version of that snippet.
3. Only include patches for things that ACTUALLY need to change. Do NOT patch unchanged code.
4. To add something to <head> (like a font link), use {"find": "</head>", "replace": "<new stuff here>\\n</head>"}.
5. To add an icon/logo before text in a container, find the container and replace it with the icon + original content.

FONT RULES:
- When changing fonts: add a Google Fonts <link> patch to </head>, then patch each targeted element's style or add a <style> rule.
- Use the format: font-family: 'FontName', sans-serif;

LOGO / ICON RULES:
- When adding a "logo" beside text: use an inline SVG or Unicode emoji (e.g., 🍕). NEVER use a broken <img> with a fake URL.
- Place it INSIDE the same container, BEFORE the brand text.

IMAGE RULES:
- For images, write a short visual description (3-8 words) of what the image should show.
  Use: https://image.pollinations.ai/prompt/{URL-ENCODED-DESCRIPTION}?width=800&height=600&nologo=true
  The description must match the specific content (e.g., "hot masala chai cup" for a chai item).
- NEVER use source.unsplash.com (DEAD), placehold.co, or leave src="" empty.
- Images MUST match the business context.

INTENT:
- "Add a pizza logo beside the div" = place an emoji/SVG inside the div before the text — NOT add text "Pizza Logo".
- Be precise. Return ONLY the JSON array. No markdown wrapping, no explanations.`;

  const userMessage = `=== EDIT REQUEST ===
${userPrompt}

=== BUSINESS CONTEXT ===
Business: ${enrichedSpec.businessName || 'N/A'}

=== EXISTING HTML (${htmlLength} chars) — find exact snippets from this code ===
${existingHtml}`;

  onProgress({ event: 'thinking', message: 'Planning surgical changes...' });

  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
  
  let patchJson = response.content.trim();

  // Clean markdown wrapping
  if (patchJson.startsWith('```json')) {
    patchJson = patchJson.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (patchJson.startsWith('```')) {
    patchJson = patchJson.replace(/^```/, '').replace(/```$/, '').trim();
  }

  console.log(`[Generator] 📦 AI returned ${patchJson.length} chars of patches (vs ${htmlLength} chars full HTML — ${Math.round((1 - patchJson.length / htmlLength) * 100)}% savings)`);

  let patches;
  try {
    patches = JSON.parse(patchJson);
    if (!Array.isArray(patches)) {
      throw new Error('Response is not an array');
    }
  } catch (parseErr) {
    // FALLBACK: If the AI returned full HTML instead of patches, use it directly
    console.warn(`[Generator] ⚠️ AI did not return valid JSON patches, checking if it returned full HTML...`);
    if (patchJson.includes('<!DOCTYPE html>') || patchJson.includes('<html')) {
      console.log(`[Generator] ↩️ Falling back to full-HTML mode`);
      onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: 'Applied changes (full rewrite mode)' });
      return patchJson;
    }
    throw new Error(`AI returned invalid patch format: ${parseErr.message}`);
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
5. For font changes, also add a Google Fonts <link> patch to </head>.
6. For logos, use inline SVG or emoji — NEVER broken <img> tags.
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
  const extraRule = isChunkMode
    ? `\n6. You are receiving ONE SECTION of a larger website. Customize ONLY this section's content. Do NOT add <html>, <head>, <body>, or <style> tags. Return ONLY the section HTML.`
    : `\n5. Return ONLY the final valid HTML code. No markdown wrapping. No explanations.`;

  return `You are an expert web developer and copywriter.
You will be provided with a design blueprint and a target business specification.
Your job is to rewrite ONLY the text content, images, and brand names to match the new business.

CRITICAL RULES:
1. NEVER modify the HTML structure, class names, CSS, scripts, or IDs.
2. Maintain the EXACT length and tone of the original text blocks.
3. IMAGES — AUTONOMOUS CONTEXT-AWARE SYSTEM:
   For EVERY <img> tag, think: "What should this image ACTUALLY show for this business?"
   Write a short visual description (3-8 words) matching the specific card/section content.
   Use this URL pattern:
   https://image.pollinations.ai/prompt/{URL-ENCODED-DESCRIPTION}?width={W}&height={H}&nologo=true
   
   Hero/banner images: width=1200&height=800
   Card/feature images: width=800&height=600
   Thumbnails/avatars: width=400&height=400
   
   Example for a chai shop "Masala Chai" card:
   <img src="https://image.pollinations.ai/prompt/hot%20masala%20chai%20glass%20cup%20with%20cardamom?width=800&height=600&nologo=true" alt="Masala Chai">
   
   RULES:
   - Each image MUST have a UNIQUE description that matches its specific card/item content.
   - Descriptions must be relevant to the business. A chai shop = chai, tea, Indian snacks images. A gym = weights, yoga, fitness images.
   - NEVER repeat the same URL on the page.
   - NEVER use source.unsplash.com (DEAD), placehold.co, or leave src="" empty.
4. If ANY image src is empty, broken, or uses source.unsplash.com, replace it with a Pollinations URL matching the business.${extraRule}`;
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
