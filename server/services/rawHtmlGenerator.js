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
      'aura.html': 'Tech, SaaS, smart home, software, futuristic, startups',
      'terroir.html': 'Coffee, premium food, organic, luxury, natural, elegant',
    };

    const templateList = htmlFiles.map((f, i) => {
      const desc = templateDescriptions[f] || 'General purpose website';
      return `${i + 1}. ${f} : ${desc}`;
    }).join('\n    ');

    const selectionPrompt = `User details: "${queryStr}"
    
    Choose the best matching design style from the following list:
    ${templateList}
    
    Reply ONLY with the exact filename.`;
    
    let chosenFile = htmlFiles[0];
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

  const systemPrompt = `You are an expert web developer acting as a LIVE CODE EDITOR.
The user has an EXISTING website (provided below) and wants you to make SPECIFIC changes.

CRITICAL RULES:
1. You MUST read and understand the full existing HTML provided.
2. Apply ONLY the changes the user requested. Do NOT regenerate or rearrange unmentioned sections.
3. Preserve ALL existing structure, CSS, animations, scripts, and class names that the user did NOT ask to change.
4. If the user asks to change a brand name / logo text, find ALL occurrences in the HTML and replace them.
5. If the user asks for images, use high-quality Unsplash source URLs: https://source.unsplash.com/WIDTHxHEIGHT/?KEYWORDS
   - For hero images: https://source.unsplash.com/1600x900/?keywords
   - For feature/card images: https://source.unsplash.com/800x600/?keywords
   - For background images: https://source.unsplash.com/1920x1080/?keywords
   Pick keywords relevant to the business (e.g., "coffee,cafe,latte" for a coffee shop).
6. If there are broken/empty image placeholders or src="" in the existing code, auto-fill them with relevant Unsplash URLs.
7. Return ONLY the complete modified HTML. No markdown wrapping. No explanations.`;

  const userMessage = `=== USER'S EDIT REQUEST ===
${userPrompt}

=== BUSINESS CONTEXT ===
Business Name: ${enrichedSpec.businessName || 'N/A'}
Description: ${enrichedSpec.description || 'N/A'}

=== EXISTING WEBSITE HTML (modify this) ===
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
3. For images, use high-quality Unsplash source URLs:
   - Hero images: https://source.unsplash.com/1600x900/?KEYWORDS
   - Feature/card images: https://source.unsplash.com/800x600/?KEYWORDS
   - Background images: https://source.unsplash.com/1920x1080/?KEYWORDS
   Choose keywords relevant to the business (e.g., "coffee,beans,latte" for a café).
4. If ANY image src is empty, broken, or uses a placeholder, replace it with a relevant Unsplash URL.
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
async function generateRawHtml(enrichedSpec, onProgress, existingHtml = null, requestModel = null) {
  let finalHtml;
  let internalTemplateName = 'custom';

  if (existingHtml) {
    // ── MODE 2: CONTEXTUAL EDIT ──
    console.log(`[Generator] ✏️ EDIT MODE — modifying existing website (${existingHtml.length} chars)`);
    finalHtml = await editExistingHtml(existingHtml, enrichedSpec.rawPrompt, enrichedSpec, onProgress, requestModel);
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
