/**
 * Raw HTML Generator
 * 
 * TWO MODES:
 *   1. FRESH GENERATION — Picks a design blueprint, adapts content to match the user's brand.
 *   2. CONTEXTUAL EDIT — Takes the EXISTING generated HTML and applies targeted changes
 *      based on the user's follow-up prompt (rename, recolor, add images, etc.)
 * 
 * The user NEVER sees which internal blueprint was used.
 */

const fs = require('fs').promises;
const path = require('path');
const { callModel } = require('./modelRouter');

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function getRawTemplate(enrichedSpec, requestModel) {
  const templatesDir = path.join(__dirname, '../templates/raw');
  await ensureDirectoryExists(templatesDir);
  
  try {
    const files = await fs.readdir(templatesDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) return null;

    const queryStr = `${enrichedSpec.businessName || ''} - ${enrichedSpec.description || ''} - ${enrichedSpec.rawPrompt || ''}`;

    // Build selection prompt dynamically from available templates
    const templateDescriptions = {
      // ── Original templates ──
      'aura.html': 'Tech, SaaS, smart home, software, futuristic, startups, AI, automation',
      'terroir.html': 'Coffee shop, premium food brand, organic, luxury beverage, natural, artisan, tea',
      'solar-terms.html': 'Cultural, traditional, nature, Chinese aesthetics, elegant, poetry, seasons, heritage',
      'build-log.html': 'Developer blog, indie hacker, shipping in public, tech portfolio, changelog, open-source',
      'lifebydesign.html': 'Personal blog, lifestyle, self-improvement, wellness coaching, intentional living, habits, journaling, productivity',
      // ── New templates ──
      'tempate1.html': 'Developer platform, API tools, SaaS product, tech startup, devtools, cloud infrastructure, code tools, CLI, SDK, backend service, hosting',
      'template2.html': 'Wellness, meditation, mindfulness, yoga studio, health coaching, mental health, breathwork, self-care, spa, retreat, holistic healing',
      'template3.html': 'Restaurant, food business, Mexican kitchen, dining, bistro, cafe, bar, catering, chef portfolio, culinary, bakery, pizzeria, food truck',
      'template4.html': 'Portfolio, freelancer, art director, designer, creative agency, personal brand, photography, illustrator, architect, consultant',
      'template5.html': 'Fashion brand, clothing, e-commerce, boutique, luxury apparel, streetwear, accessories, jewelry, shoe brand, online store, retail'
    };

    const templateList = htmlFiles.map((f, i) => {
      const desc = templateDescriptions[f] || 'General purpose website';
      return `${i + 1}. ${f} — ${desc}`;
    }).join('\n    ');

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

Reply with ONLY the exact filename (e.g. template3.html). No explanation.`;
    
    let chosenFile = htmlFiles[Math.floor(Math.random() * htmlFiles.length)];
    try {
        const selRes = await callModel('template_selector', queryStr, selectionPrompt, { forceModel: requestModel });
        const respFilename = selRes.content.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        if (htmlFiles.includes(respFilename)) {
            chosenFile = respFilename;
        } else {
            // Fuzzy match
            const match = htmlFiles.find(f => respFilename.includes(f.replace('.html', '')));
            if (match) chosenFile = match;
        }
    } catch (err) {
        console.warn('[Generator] Style prediction failed, using default', err.message);
        chosenFile = htmlFiles[Math.floor(Math.random() * htmlFiles.length)];
    }

    console.log(`[Generator] Selected design style: ${chosenFile}`);
    return { name: chosenFile.replace('.html', ''), content: await fs.readFile(path.join(templatesDir, chosenFile), 'utf-8') };
    
  } catch (e) {
    console.error('[Generator] Error reading design styles:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// MODE 2: CONTEXTUAL EDIT — Modify existing HTML with user's follow-up
// ─────────────────────────────────────────────────────────
async function editExistingHtml(existingHtml, userPrompt, enrichedSpec, onProgress, requestModel) {
  onProgress({ event: 'thinking', message: 'Analyzing your edit request...' });
  onProgress({ event: 'log', type: 'Reading', file: 'current website', message: 'Reviewing your existing website code' });

  console.log(`[Generator] ✏️ editExistingHtml called — prompt: "${userPrompt.substring(0, 100)}..."`);

  const systemPrompt = `You are an expert web developer acting as a LIVE CODE EDITOR.
The user has an EXISTING website (provided below) and wants you to make SPECIFIC changes.

CRITICAL RULES:
1. You MUST read and understand the full existing HTML provided.
2. Apply ONLY the changes the user requested. Do NOT regenerate or rearrange unmentioned sections.
3. Preserve ALL existing structure, CSS, animations, scripts, and class names that the user did NOT ask to change.
4. If the user asks to change a brand name / logo text, find ALL occurrences in the HTML and replace them.
5. For images, use ONLY high-quality images.unsplash.com URLs with REAL photo IDs. The format is:
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
6. If there are broken/empty image placeholders or src="" in the existing code, auto-fill them with relevant Unsplash URLs from the list above.

FONT CHANGE RULES:
7. When the user asks to change fonts:
   a. Add a Google Fonts <link> in the <head> section (e.g., <link href="https://fonts.googleapis.com/css2?family=TT+Commons:wght@400;500;600;700&display=swap" rel="stylesheet">)
   b. Apply font-family CSS to the EXACT elements the user specified using inline style or a <style> block.
   c. If the user says "change font of all a tags", add a CSS rule: a { font-family: 'TT Commons', sans-serif !important; }
   d. Always preserve existing font-sizes, colors, and weights unless told otherwise.

LOGO / ICON RULES:
8. When the user asks to add a "logo" beside a brand name:
   a. Use an inline SVG icon or a Unicode emoji (e.g., 🍕 for pizza) placed BEFORE the brand text inside the same container.
   b. NEVER add a broken <img> tag with a fake URL. If you cannot find a real image, use an SVG or emoji.
   c. Style the logo to match the brand text size using vertical-align and appropriate sizing.

INTENT INTERPRETATION:
9. Interpret user intent intelligently. "Add a pizza logo beside the div" means add a small icon/logo INSIDE the same div, before the text — NOT add text saying "Pizza Logo".
10. Return ONLY the complete modified HTML. No markdown wrapping. No explanations.
11. The output must start with <!DOCTYPE html> and end with </html>.
12. Do NOT pick a different design template. Keep all existing colors, fonts, layout, and structure intact.`;

  const userMessage = `=== USER'S EDIT REQUEST ===
${userPrompt}

=== BUSINESS CONTEXT ===
Business Name: ${enrichedSpec.businessName || 'N/A'}
Description: ${enrichedSpec.description || 'N/A'}

=== EXISTING WEBSITE HTML (modify this — keep everything else EXACTLY the same) ===
${existingHtml}`;

  onProgress({ event: 'thinking', message: 'Applying your changes...' });

  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
  
  let finalHtml = response.content.trim();
  
  // Clean markdown wrapping
  if (finalHtml.startsWith('```html')) {
      finalHtml = finalHtml.replace(/^```html/, '').replace(/```$/, '').trim();
  } else if (finalHtml.startsWith('```')) {
      finalHtml = finalHtml.replace(/^```/, '').replace(/```$/, '').trim();
  }

  onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: 'Applied your changes successfully' });

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
    return desc;
  }).join(', ');

  console.log(`[Generator] 🎯 VISUAL EDIT — targeting ${elements.length} element(s): ${elementDescriptions}`);
  console.log(`[Generator] 🎯 User request: "${editPrompt}"`);

  onProgress({ event: 'thinking', message: `Targeting ${elements.length} element(s) for your edit...` });
  onProgress({ event: 'log', type: 'Reading', file: 'selected elements', message: `Found ${elements.length} element(s) to modify` });

  const systemPrompt = `You are an expert web developer performing SURGICAL element-level edits.
The user has selected SPECIFIC elements on their website and wants ONLY those elements modified.

TARGET ELEMENTS:
${elements.map((el, i) => {
  let desc = `  ${i + 1}. <${el.tag}> element`;
  if (el.id) desc += ` with id="${el.id}"`;
  if (el.text) desc += ` — currently showing: "${el.text}"`;
  return desc;
}).join('\n')}

CRITICAL RULES:
1. Find the target elements in the HTML by matching their tag name${elements.some(e => e.id) ? ', id' : ''}${elements.some(e => e.text) ? ', and text content' : ''}.
2. Apply the user's requested changes ONLY to those specific elements.
3. Do NOT touch ANY other part of the HTML — no section reordering, no template changes, no style changes outside the targets.
4. Preserve the ENTIRE rest of the document exactly as-is: structure, CSS, scripts, classes, animations, etc.
5. Return the COMPLETE modified HTML document. Start with <!DOCTYPE html>, end with </html>.
6. No markdown wrapping. No explanations. Raw HTML only.`;

  const userMessage = `=== EDIT REQUEST FOR SELECTED ELEMENTS ===
${editPrompt}

=== BUSINESS CONTEXT ===
Business Name: ${enrichedSpec.businessName || 'N/A'}

=== FULL EXISTING WEBSITE HTML (modify ONLY the targeted elements) ===
${existingHtml}`;

  onProgress({ event: 'thinking', message: 'Applying targeted changes...' });

  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: requestModel });
  
  let finalHtml = response.content.trim();
  
  // Clean markdown wrapping
  if (finalHtml.startsWith('```html')) {
    finalHtml = finalHtml.replace(/^```html/, '').replace(/```$/, '').trim();
  } else if (finalHtml.startsWith('```')) {
    finalHtml = finalHtml.replace(/^```/, '').replace(/```$/, '').trim();
  }

  onProgress({ event: 'log', type: 'Editing', file: 'index.html', message: `Modified ${elements.length} element(s) successfully` });

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
