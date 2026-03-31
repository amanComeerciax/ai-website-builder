/**
 * Raw HTML Generator
 * 
 * Takes an enriched prompt and a raw HTML template, and uses the LLM
 * to intelligently replace the text, images, and content to match the user's prompt
 * while preserving the EXACT HTML structure, CSS, and animations.
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

async function getRawTemplate(enrichedSpec) {
  const templatesDir = path.join(__dirname, '../templates/raw');
  await ensureDirectoryExists(templatesDir);
  
  try {
    const files = await fs.readdir(templatesDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) return null;

    // Use name, description, and raw prompt to give Mistral full context
    const queryStr = `${enrichedSpec.businessName || ''} - ${enrichedSpec.description || ''} - ${enrichedSpec.rawPrompt || ''}`;

    // Auto-predict template class using Mistral
    const selectionPrompt = `User details: "${queryStr}"
    
    Choose the best matching template from the following list:
    1. aura.html : Good for tech, SaaS, smart home, software, futuristic, startups.
    2. terroir.html : Good for coffee, premium food, organic, luxury, natural, elegant.
    
    Reply ONLY with the exact filename (e.g., aura.html).`;
    
    let chosenFile = htmlFiles[0];
    try {
        const selRes = await callModel('template_selector', queryStr, selectionPrompt, { forceModel: 'mistral' });
        const respFilename = selRes.content.trim().toLowerCase();
        if (htmlFiles.includes(respFilename)) {
            chosenFile = respFilename;
        } else if (respFilename.includes('aura') && htmlFiles.includes('aura.html')) {
            chosenFile = 'aura.html';
        } else if (respFilename.includes('terroir') && htmlFiles.includes('terroir.html')) {
            chosenFile = 'terroir.html';
        }
    } catch (err) {
        console.warn('[RawHtmlGenerator] Auto-prediction failed, using default', err.message);
        chosenFile = htmlFiles[Math.floor(Math.random() * htmlFiles.length)];
    }

    return { name: chosenFile.replace('.html', ''), content: await fs.readFile(path.join(templatesDir, chosenFile), 'utf-8') };
    
  } catch (e) {
    console.error('[RawHtmlGenerator] Error reading raw templates:', e);
    return null;
  }
}

async function generateRawHtml(enrichedSpec, onProgress) {
  onProgress({ event: 'thinking', message: 'Locating raw HTML template...' });
  
  const template = await getRawTemplate(enrichedSpec);
  
  if (!template) {
    throw new Error('No raw HTML templates found in /server/templates/raw/');
  }

  onProgress({ event: 'log', type: 'Reading', file: template.name + '.html', message: `Found matching raw template` });
  onProgress({ event: 'thinking', message: 'Intelligently adapting template content...' });

  const systemPrompt = `You are an expert web developer and copywriter.
You will be provided with a pristine, fully-functional raw HTML template and a target business specification.
Your job is to rewrite ONLY the text content, image placeholders, and brand names inside the HTML to match the new business specification.

CRITICAL RULES:
1. NEVER modify the HTML structure, class names, CSS, scripts, or IDs.
2. Maintain the EXACT length and tone of the original text blocks (don't make short headings extremely long, it will break the layout).
3. If an image is needed, use Unsplash source URLs: https://source.unsplash.com/1200x800/?[keywords]
4. Return ONLY the final valid HTML code. Do not wrap it in markdown block quotes (e.g. \`\`\`html). Do not add any introductory or concluding text.`;

  const userMessage = `=== target specification ===
Business Name: ${enrichedSpec.businessName}
Target Audience: ${enrichedSpec.targetAudience}
Tone: ${enrichedSpec.tone}
Description: ${enrichedSpec.description}
========================

=== RAW HTML TEMPLATE TO MODIFY ===
${template.content}`;

  // Use mistral for this, string manipulation takes high reasoning
  const response = await callModel('generate_html', userMessage, systemPrompt, { forceModel: 'mistral' });
  
  let finalHtml = response.content.trim();
  
  // Clean markdown if mistral accidentally wrapped it
  if (finalHtml.startsWith('```html')) {
      finalHtml = finalHtml.replace(/^```html/, '').replace(/```$/, '').trim();
  } else if (finalHtml.startsWith('```')) {
      finalHtml = finalHtml.replace(/^```/, '').replace(/```$/, '').trim();
  }

  onProgress({ event: 'log', type: 'Creating', file: 'index.html', message: `Adapted content successfully` });

  onProgress({ event: 'thinking', message: 'Transpiling HTML to Next.js code...' });
  
  const nextjsSystemPrompt = `You are an expert Next.js developer. Convert the provided HTML into a valid Next.js App Router client component (app/page.jsx).
CRITICAL RULES:
1. Output ONLY valid JSX. Convert class= to className=, for= to htmlFor=, style="x: y;" to style={{x: 'y'}}, and ensure all tags like <img>, <br>, <input>, <hr> are self-closed.
2. Put 'use client'; at the top of the file since it has interactions.
3. Import Lucide icons like <ArrowRight size={16} /> instead of using <i data-lucide="arrow-right"></i>.
4. If there's script logic like Scroll observers or IntersectionObserver, wrap them inside a useEffect block inside the component.
5. Provide ONLY the raw code string, nothing else. DO NOT wrap in markdown \`\`\`jsx ... \`\`\`. Do not include explanations.`;

  let pageJsx = '';
  try {
      const jsxRes = await callModel('html_to_jsx', finalHtml, nextjsSystemPrompt, { forceModel: 'mistral' });
      pageJsx = jsxRes.content.trim();
      if (pageJsx.startsWith('```jsx')) pageJsx = pageJsx.replace(/^```jsx/, '').replace(/```$/, '').trim();
      else if (pageJsx.startsWith('```')) pageJsx = pageJsx.replace(/^```/, '').replace(/```$/, '').trim();
  } catch (err) {
      console.warn('[RawHtmlGenerator] Failed to generate JSX:', err.message);
      pageJsx = `export default function ErrorPage() {\n  return <div>Failed to compile Next.js project. Check the index.html fallback.</div>;\n}`;
  }

  onProgress({ event: 'log', type: 'Creating', file: 'app/page.jsx', message: `Transpiled Next.js files successfully` });

  const htmlExportFiles = {
      'index.html': finalHtml,
      'app/page.jsx': pageJsx,
      'app/layout.jsx': `export const metadata = { title: '${enrichedSpec.businessName}', description: '${enrichedSpec.description}' };\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <head>\n        <script src="https://cdn.tailwindcss.com"></script>\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}`,
      'package.json': JSON.stringify({ 
          name: enrichedSpec.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 
          version: "1.0.0",
          scripts: { dev: "next dev", build: "next build", start: "next start" },
          dependencies: { "next": "latest", "react": "latest", "react-dom": "latest", "lucide-react": "latest" }
      }, null, 2),
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */\nmodule.exports = {\n  content: ["./app/**/*.{js,jsx,ts,tsx}"],\n  theme: {\n    extend: {}\n  },\n  plugins: [],\n};`,
      'README.md': `# ${enrichedSpec.businessName}\n\nThis is a Next.js project generated from a premium raw HTML template.`
  };

  return {
    html: finalHtml,
    layoutSpec: { sections: [{ component: 'RawTemplate', meta: { template: template.name } }] }, // Fake layout spec
    files: htmlExportFiles,
    previewType: 'srcdoc',
    meta: { generatedFromRaw: true, templateName: template.name }
  };
}

module.exports = { generateRawHtml };
