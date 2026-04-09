const fs = require('fs').promises;
const path = require('path');
const { callModel } = require('./modelRouter');
const Template = require('../models/Template');

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
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
 * Falls back gracefully if a patch doesn't match (logs a warning).
 */
function applyPatches(originalHtml, patches) {
  let result = originalHtml;
  let appliedCount = 0;

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
      // Try trimmed match (AI sometimes adds/removes whitespace)
      const trimmedFind = patch.find.trim();
      if (result.includes(trimmedFind)) {
        result = result.replace(trimmedFind, patch.replace);
        appliedCount++;
      } else {
        console.warn(`[Patcher] ⚠️ Could not find patch target (${patch.find.substring(0, 80)}...)`);
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
- For images, use ONLY images.unsplash.com URLs with real photo IDs:
  https://images.unsplash.com/photo-PHOTOID?w=WIDTH&h=HEIGHT&fit=crop&q=80
  NEVER use source.unsplash.com — it is dead.

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

  const { result: finalHtml, appliedCount, totalPatches } = applyPatches(existingHtml, patches);

  if (appliedCount === 0) {
    console.error(`[Generator] ❌ No patches could be applied — falling back to unmodified HTML`);
    onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: '⚠️ Changes could not be applied — review your request' });
    return existingHtml;
  }

  onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: `Applied ${appliedCount}/${totalPatches} changes successfully` });

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

  const { result: finalHtml, appliedCount, totalPatches } = applyPatches(existingHtml, patches);

  if (appliedCount === 0) {
    console.error(`[Generator] ❌ No visual edit patches matched — returning unmodified HTML`);
    onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: '⚠️ Element changes could not be applied' });
    return existingHtml;
  }

  onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: `Modified ${appliedCount} element(s) successfully` });

  return finalHtml;
}

// ─────────────────────────────────────────────────────────
// MODE 1: FRESH GENERATION — Pick a design blueprint, adapt content
// ─────────────────────────────────────────────────────────
async function generateFreshHtml(enrichedSpec, onProgress, requestModel) {
  onProgress({ event: 'thinking', message: 'Selecting the best design for your project...' });
  
  const template = await getRawTemplate(enrichedSpec, requestModel);
  
  if (!template) {
    throw new Error('No design styles found. Please add HTML files to /server/templates/raw/');
  }

  // IMPORTANT: Do NOT expose template name to user — use generic label
  onProgress({ event: 'log', type: 'Reading', file: 'design style', message: 'Found the perfect design match' });
  onProgress({ event: 'thinking', message: 'Customizing the design for your brand...' });

  const systemPrompt = `You are an expert web developer and copywriter.
You will be provided with a design blueprint and a target business specification.
Your job is to rewrite ONLY the text content, image placeholders, and brand names to match the new business.

CRITICAL RULES:
1. NEVER modify the HTML structure, class names, CSS, scripts, or IDs.
2. Maintain the EXACT length and tone of the original text blocks.
3. For images, use ONLY high-quality images.unsplash.com URLs with REAL photo IDs. The format is:
   https://images.unsplash.com/photo-PHOTOID?w=WIDTH&h=HEIGHT&fit=crop&q=80
   Here are reliable photo IDs by category — pick the MOST relevant ones:
   BUSINESS/TECH: photo-1497366216548-37526070297c, photo-1522071820081-009f0129c71c, photo-1553877522-43269d4ea984
   FOOD/RESTAURANT: photo-1504674900247-0877df9cc836, photo-1414235077428-338989a2e8c0, photo-1517248135467-4c7edcad34c4
   NATURE/TRAVEL: photo-1506744038136-46273834b3fb, photo-1469474968028-56623f02e42e, photo-1507525428034-b723cf961d3e
   FASHION/LIFESTYLE: photo-1483985988355-763728e1935b, photo-1515886657613-9f3515b0c78f, photo-1469334031218-e382a71b716b
   HEALTH/FITNESS: photo-1571019613454-1cb2f99b2d8b, photo-1517836357463-d25dfeac3438, photo-1544367567-0f2fcb009e0b
   ABSTRACT/HERO: photo-1557682250-33bd709cbe85, photo-1579546929518-9e396f3cc809, photo-1557683316-973673baf926
   TEAM/PEOPLE: photo-1522202176988-66273c2fd55f, photo-1556761175-5973dc0f32e7, photo-1600880292203-757bb62b4baf
   Example: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop&q=80
   NEVER use source.unsplash.com — it is DEAD and returns errors.
4. If ANY image src is empty, broken, or uses source.unsplash.com, replace it with a relevant image from the curated list above.
5. Return ONLY the final valid HTML code. No markdown wrapping. No explanations.`;

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
