/**
 * Prompt Builder — constructs system/user prompts for each generation phase
 * 
 * Exports: buildPhase1Prompt, buildPhase2Prompt, buildPhase3Prompt,
 *          buildTrackAPrompt, buildSummaryPrompt
 * 
 * CRITICAL: buildPhase3Prompt/buildTrackAPrompt keep system prompts minimal for Qwen.
 */

const { getRulesForPhase } = require('./ruleLoader.js');

/**
 * Phase 1: Parse the user's prompt (Mistral)
 * Classifies intent, interprets vague phrases, determines outputTrack.
 */
function buildPhase1Prompt(userPrompt) {
  const rules = getRulesForPhase('phase1');

  const systemPrompt = [
    'You are an expert prompt analyst for a website builder AI.',
    'Analyze the user request and output structured JSON.',
    '',
    rules,
    '',
    'IMPORTANT — outputTrack field:',
    '  Set outputTrack to "html" for: landing pages, portfolios, restaurant/bakery/coffee shop sites,',
    '  blogs, simple websites, any single-page or "simple" request without explicit framework.',
    '  Set outputTrack to "nextjs" for: dashboards, SaaS apps, e-commerce with cart/auth,',
    '  admin panels, multi-page apps with routing, AND anytime the user explicitly asks for React, Next.js, full-stack, or MERN.',
    '',
    'If the user explicitly requests React/Next.js/full-stack, you MUST use "nextjs".',
    'Otherwise, when in doubt or for simple sites, default to "html". It is faster and previews instantly.',
    '',
    'Return ONLY valid JSON with this shape (no markdown fences, no explanations):',
    '{',
    '  "classification": "new_site|edit_existing|add_feature|style_change",',
    '  "siteType": "string",',
    '  "pageType": "landing|dashboard|portfolio|ecommerce|blog|docs",',
    '  "outputTrack": "html|nextjs",',
    '  "vaguePhrases": [{"phrase": "string", "interpretation": "string"}],',
    '  "assumptions": ["string"],',
    '  "colorPreference": "light|dark|auto",',
    '  "targetAudience": "string",',
    '  "sections": ["hero", "features", "footer"]',
    '}',
  ].join('\n');

  const userMessage = `Analyze this website request:\n\n"${userPrompt}"`;

  return { systemPrompt, userMessage };
}

/**
 * Phase 2: Plan the file structure (Mistral)
 * Takes Phase 1 output and produces a file tree + design decisions.
 */
function buildPhase2Prompt(spec) {
  const rules = getRulesForPhase('phase2');

  const systemPrompt = [
    'You are a senior frontend architect.',
    'Given an analyzed request and theme specification, plan the complete file structure and design system.',
    '',
    rules,
    '',
    '=== DESIGN SYSTEM CONSTRAINTS ===',
    `Theme: ${spec.themeName || 'Modern Dark'}`,
    `Colors: ${JSON.stringify(spec.colorScheme || {})}`,
    `Fonts: ${JSON.stringify(spec.fontPair || {})}`,
    '',
    '=== CRITICAL FILE LIMIT CONSTRAINT ===',
    'You MUST restrict the fileTree to the absolute core. STRICTLY MAXIMUM 12 FILES TOTAL.',
    'Do NOT use TypeScript. All files must use .jsx or .js extensions.',
    'Do NOT create separate files for simple components like Button, Input, Card, or Modals. Use standard HTML tags or inline them.',
    'Do NOT create separate Context files if not strictly necessary.',
    'Combine logic where possible. IMPORTANT: Use standard React Vite conventions (e.g. src/App.jsx, src/index.css).',
    '',
    'Return ONLY valid JSON with this shape:',
    '{',
    '  "fileTree": [{"path": "src/App.jsx", "purpose": "Main entry", "imports": [], "exports": ["default"]}],',
    '  "sections": ["hero", "features", "testimonials", "cta", "footer"],',
    '  "colorScheme": {"bg": "#0f0f0f", "surface": "#1a1a1a", "text": "#e8e8e8", "accent": "#3b82f6"},',
    '  "fontPair": {"heading": "Syne", "body": "DM Sans"},',
    '  "projectGlossary": {"AppName": "string", "tagline": "string"}',
    '}',
    'No markdown fences, no explanations.'
  ].join('\n');

  const userMessage = [
    `Plan the file structure for this enriched request:`,
    '',
    `Business Name: ${spec.businessName || 'App'}`,
    `Site Type: ${spec.siteType || 'website'}`,
    `Requested Sections: ${(spec.sections || []).join(', ')}`,
    '',
    `Technical Spec:`,
    JSON.stringify(spec, null, 2)
  ].join('\n');

  return { systemPrompt, userMessage };
}

/**
 * Track A: Generate a single self-contained HTML file (Qwen/Mistral)
 * Use for simple sites, landing pages, portfolios.
 * Preview via iframe srcdoc — ZERO build step needed.
 */
function buildTrackAPrompt(sitePlan) {
  const rules = getRulesForPhase('track_a');

  const systemPrompt = [
    'You are a senior HTML/CSS/JavaScript developer generating a complete, beautiful website.',
    'Output ONLY raw HTML content. Start your response with <!DOCTYPE html> and end with </html>.',
    'DO NOT wrap your output in JSON. DO NOT use markdown code fences. DO NOT add any explanation.',
    'The VERY FIRST character of your response must be "<" and the VERY LAST must be ">".',
    '',
    '=== ABSOLUTE RULES (violating any of these causes an error) ===',
    '1. ONE FILE ONLY: output a single complete index.html — no imports, no require, no npm packages',
    '2. Load Tailwind CSS via CDN ONLY: <script src="https://cdn.tailwindcss.com"></script>',
    '3. For smooth scroll navigation: use document.querySelector(target).scrollIntoView({behavior:"smooth"})',
    '   NEVER use react-scroll, NEVER use import statements, NEVER use npm packages',
    '4. For icons: <script src="https://unpkg.com/lucide@latest"></script> then lucide.createIcons()',
    '5. For animations: use CSS @keyframes or AOS CDN — load via script/link tags',
    '6. All JavaScript inside <script> tags at bottom of <body> — vanilla JS only',
    '7. Images: ALWAYS use high-quality Unsplash URLs from the design rules library. If the category is unknown, use: https://images.unsplash.com/featured/?keyword1,keyword2&w=1200&q=80',
    '8. The file must open in Chrome with zero errors, no internet build step needed',
    '',
    rules,
  ].join('\n');

  const sections = (sitePlan.sections || ['hero', 'features', 'about', 'contact', 'footer']).join(', ');
  
  // Use enriched spec for colors and fonts if available
  const colors = sitePlan.colorScheme || {};
  const fontPair = sitePlan.fontPair || {};
  
  const colorTheme = sitePlan.themeName 
    ? `THEME: ${sitePlan.themeName.toUpperCase()}
       Background: ${colors.bg || '#09090b'}, Surface: ${colors.surface || '#18181b'}, 
       Text: ${colors.text || '#fafafa'}, Accent: ${colors.accent || '#3b82f6'}`
    : (sitePlan.colorPreference === 'dark'
        ? 'ELITE DARK: background #09090b (Zinc-950), surface #18181b (Zinc-900) with subtle borders, text #fafafa, accent: use a vibrant sapphire or emerald'
        : 'ELITE LIGHT: background #fafafa (Zinc-50), surface #ffffff with soft shadows, text #09090b, accent: use a premium professional blue or violet');

  const userMessage = [
    `Build a complete, stunning, responsive ${sitePlan.siteType || 'website'} as a single HTML file.`,
    '',
    colorTheme,
    fontPair.heading ? `Typography: ${fontPair.heading} for headings, ${fontPair.body} for body text` : '',
    sitePlan.styleKeywords?.length ? `Style notes: ${sitePlan.styleKeywords.join('; ')}` : '',
    `Target audience: ${sitePlan.targetAudience || 'general audience'}`,
    `Sections: ${sections}`,
    sitePlan.vaguePhrases?.length ? `Additional notes: ${sitePlan.vaguePhrases.map(v => v.interpretation).join('; ')}` : '',
    '',
    'CONTENT DENSITY REQUIREMENTS (CRITICAL):',
    '- EVERY section MUST have fully rendered content — NOT just a heading with empty space',
    '- Cards/grids: minimum 3 items per section, ideally 4-6',
    '- For images: ALWAYS use high-quality Unsplash URLs (e.g., https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800)',
    '- NEVER use placehold.co or generic grey boxes. Use real, stunning photography.',
    '- Use CSS gradients as decorative backgrounds: background: linear-gradient(135deg, #1a1a2e, #16213e)',
    '- Each card MUST include: an icon or image, a title, and description text',
    '- Testimonials: include 3 review cards with quote, name, and star rating',
    '- Gallery: include 6-8 image cards using real photography in a responsive grid',
    '- NEVER create a section with only a heading and blank space below it',
    '',
    'VISUAL QUALITY REQUIREMENTS:',
    '- Use Tailwind CSS classes for all styling (loaded from CDN)',
    '- Load Google Fonts via <link> tag for professional typography',
    '- Add smooth hover effects and subtle CSS transitions on interactive elements',
    '- Make navigation links use scrollIntoView for smooth scrolling (NO react-scroll)',
    '- Include real, meaningful content (not lorem ipsum)',
    '',
    'YOUR RESPONSE MUST START WITH: <!DOCTYPE html>',
    'YOUR RESPONSE MUST END WITH: </html>',
    'DO NOT wrap in JSON. DO NOT use code fences. Raw HTML only.',
  ].filter(Boolean).join('\n');

  return { systemPrompt, userMessage };
}

/**
 * Phase 3: Generate all React files in one call (Qwen)
 * CRITICAL: System prompt MUST stay compact for Qwen context limit.
 */
function buildPhase3Prompt(fileSpec, glossary) {
  const rules = getRulesForPhase('phase3_qwen');

  const systemPrompt = [
    'You are a code generator. Output ONLY the file content. No markdown fences.',
    '',
    rules
  ].join('\n');

  const userMessage = [
    `Write the file: ${fileSpec.path}`,
    `Purpose: ${fileSpec.purpose || 'Component'}`,
    fileSpec.imports?.length ? `Imports: ${fileSpec.imports.join(', ')}` : '',
    `Use exactly these names: ${JSON.stringify(glossary || {})}`,
    '',
    'Return ONLY the raw file content. No JSON wrapping. No markdown fences. No explanation.'
  ].filter(Boolean).join('\n');

  return { systemPrompt, userMessage };
}

/**
 * Phase 4: Summarize the generation (Mistral)
 */
function buildSummaryPrompt(filesCreated, plan) {
  const systemPrompt = [
    'You are a UX-focused AI that summarizes code generation results.',
    'Given the files that were created and the original plan, write a brief summary.',
    '',
    'Return ONLY valid JSON:',
    '{',
    '  "summary": "Built [AppName] — a [description] with [N] components.",',
    '  "appName": "string",',
    '  "suggestedActions": ["Verify it works", "Add authentication", "Make it mobile responsive", "Add dark mode"]',
    '}',
    'The suggestedActions array must have exactly 4 items — natural follow-up tasks the user might want.',
    'No markdown fences, no explanations.'
  ].join('\n');

  const userMessage = [
    'Summarize this generation:',
    '',
    `Files created: ${filesCreated.join(', ')}`,
    '',
    `Original plan: ${JSON.stringify(plan, null, 2)}`
  ].join('\n');

  return { systemPrompt, userMessage };
}

module.exports = { 
  buildPhase1Prompt, 
  buildPhase2Prompt, 
  buildPhase3Prompt, 
  buildTrackAPrompt,
  buildSummaryPrompt 
};
