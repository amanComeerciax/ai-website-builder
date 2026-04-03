const { callModel } = require('./modelRouter.js');
const { getRandomizedCatalog, trackUsage } = require('../component-kit/snippetRegistry.js');

/**
 * Two-Stage Layout Planner with Diversity Engine
 * Stage 1: Design Theme & Structural Plan
 * Stage 2: Randomized Snippet Selection & Content Injection
 */
async function planLayout(enrichedSpec, previousLayoutSpec = null) {
  const brandName = enrichedSpec.businessName || 'My Business';
  onProgress('Thinking about design theme...', enrichedSpec.onProgress);

  // --- STAGE 1: THEME & STRUCTURE ---
  const themePrompt = `You are a world-class Creative Director. 
Your job is to define the visual aesthetic and structural flow for a premium, high-conversion website: "${brandName}".

YOUR JOB:
1. Define a "designMood": Choose from ["Premium Dark", "Glassmorphism", "Cyberpunk", "Aurora Gradient", "Neon Glow", "Frosted Glass", "Cinematic Dark"] — pick creatively based on the brand.
2. Generate "designTokens": Specific hex colors (mostly dark neutrals with vibrant accent) and Google fonts (e.g., Outfit, Plus Jakarta Sans, Space Grotesk).
3. Define "animationStrategy": Choose from ["fade-up", "staggered-reveal", "parallax", "scale-in", "slide-reveal"].
4. Define "layoutStructure": An ordered array of 6-9 section CATEGORIES to create a premium, content-rich website. 
   MUST always start with "nav" and end with "footer".
   Choose from: [nav, hero, logos, features, stats, testimonials, pricing, faq, cta, footer, team, gallery, about, contact]
   Use at LEAST 7 sections for a premium feel.

OUTPUT VALID JSON ONLY:
{
  "designMood": "...",
  "designTokens": { "bg": "#09090b", "surface": "#18181b", "accent": "#...", "accentHover": "#...", "text": "#fafafa", "textDim": "#a1a1aa", "border": "rgba(255,255,255,0.1)", "fontHeading": "Outfit", "fontBody": "Inter" },
  "animationStrategy": "fade-up",
  "layoutStructure": ["nav", "hero", "logos", "features", "stats", "testimonials", "pricing", "faq", "cta", "footer"]
}`;

  const themeUserMsg = `Brand: "${brandName}"
Type: ${enrichedSpec.siteType}
Description: ${enrichedSpec.description || enrichedSpec.rawPrompt}
Tone: ${enrichedSpec.tone || 'premium and modern'}

IMPORTANT: Create a UNIQUE combination. Do NOT default to the same structure every time.
Vary the sections used — for example, one site might have [nav, hero, about, features, team, cta, footer] and another [nav, hero, logos, features, stats, pricing, faq, footer].`;

  let themePlan;
  try {
    const themeResult = await callModel('plan_theme', themeUserMsg, themePrompt);
    themePlan = parseJsonResponse(themeResult.content);
    console.log(`[LayoutPlanner] 🎨 Theme Defined: ${themePlan.designMood}`);
  } catch (e) {
    console.warn('[LayoutPlanner] Theme planning failed, using fallback theme.');
    themePlan = {
      designMood: "Modern Dark",
      designTokens: buildFallbackLayout(enrichedSpec).designTokens,
      animationStrategy: "fade-up",
      layoutStructure: getRandomFallbackStructure()
    };
  }

  // Ensure nav and footer are always included
  if (!themePlan.layoutStructure.includes('nav')) {
    themePlan.layoutStructure.unshift('nav');
  }
  if (!themePlan.layoutStructure.includes('footer')) {
    themePlan.layoutStructure.push('footer');
  }

  // --- STAGE 2: RANDOMIZED SNIPPET SELECTION & CONTENT ---
  onProgress('Selecting premium snippets...', enrichedSpec.onProgress);
  
  // KEY CHANGE: Use randomized catalog instead of full catalog
  // This forces different snippet combos each generation
  const randomizedCatalog = getRandomizedCatalog(themePlan.layoutStructure, 3);
  
  console.log(`[LayoutPlanner] 🎲 Randomized catalog: ${randomizedCatalog.length} snippets for ${themePlan.layoutStructure.length} sections`);

  // Build a more explicit variable listing that the AI can't ignore
  const snippetInstructions = randomizedCatalog.map(c => {
    const varList = c.variables.map(v => `"${v}": "..."`).join(', ');
    return `- [${c.category.toUpperCase()}] snippetId: "${c.id}"
    Required content keys: { ${varList} }`;
  }).join('\n');

  const selectionPrompt = `You are a world-class UI/UX Copywriter building a website for "${brandName}".

## AVAILABLE SNIPPETS
${snippetInstructions}

## INSTRUCTIONS
For each category in: [${themePlan.layoutStructure.join(', ')}]
1. Pick ONE snippetId from the matching category above
2. In the "content" object, provide a value for **EVERY** key listed in "Required content keys"
3. Write premium, brand-specific copy — NO empty strings, NO placeholders

## CONTENT QUALITY RULES
- headings: Bold, compelling, max 6 words
- subtext: 1-2 sentences, professional tone
- badgeText: 2-3 words (e.g. "Now Live")
- feature titles: 2-4 words each
- feature descriptions: 15-25 words each
- stats values: Impressive numbers like "10,000+" or "99.9%"
- testimonial quotes: 15-30 words, realistic and specific
- FAQ answers: 20-40 words, helpful and complete
- pricing: Realistic dollar amounts
- IMAGE URLS: For any variable ending in "Image" or "Url", provide a relevant Unsplash URL in this format:
  https://images.unsplash.com/photo-{ID}?w=800&h=600&fit=crop&q=80
  Choose photos that match the brand's industry. Example IDs for common categories:
  - Tech/SaaS: photo-1551434678-e076c223a692, photo-1460925895917-afdab827c52f
  - Food/Coffee: photo-1495474472287-4d71bcdd2085, photo-1509042239860-f550ce710b93
  - Fitness: photo-1534258936925-c58bed479fcb, photo-1517836357463-d25dfeac3438
  - Fashion: photo-1441986300917-64674bd600d8, photo-1558618666-fcd25c85f82e
  - Real Estate: photo-1560518883-ce09059eeffa, photo-1512917774080-9991f1c4c750
  - Team/Office: photo-1522071820081-009f0129c71c, photo-1519389950473-47ba0277781c
  - General/Abstract: photo-1498050108023-c5249f4df085, photo-1504384308090-c894fdcc538d

## OUTPUT — VALID JSON ONLY
{
  "meta": { "title": "${brandName} - ...", "description": "..." },
  "sections": [
    { "snippetId": "exact-id-from-list", "content": { "key1": "value1", "key2": "value2" } }
  ]
}

CRITICAL: Each section's "content" MUST have ALL keys from that snippet's "Required content keys". Missing keys = blank sections = FAILURE. Output exactly ${themePlan.layoutStructure.length} sections.`;

  const selectionUserMsg = `Brand: "${brandName}"
Description: ${enrichedSpec.description || enrichedSpec.rawPrompt}
Target Structure: ${themePlan.layoutStructure.join(' → ')}`;

  try {
    const selectionResult = await callModel('plan_snippets', selectionUserMsg, selectionPrompt);
    const finalPlan = parseJsonResponse(selectionResult.content);
    
    // Track which snippets were selected for anti-repetition
    const usedIds = finalPlan.sections.map(s => s.snippetId);
    trackUsage(usedIds);
    
    return {
      ...finalPlan,
      designTokens: themePlan.designTokens,
      meta: { ...finalPlan.meta, mood: themePlan.designMood }
    };
  } catch (e) {
    console.error('[LayoutPlanner] Snippet selection failed:', e.message);
    return buildFallbackLayout(enrichedSpec);
  }
}

/**
 * Get a random fallback structure to avoid repetitive layouts
 */
function getRandomFallbackStructure() {
  const structures = [
    ["nav", "hero", "logos", "features", "stats", "testimonials", "cta", "footer"],
    ["nav", "hero", "features", "about", "pricing", "faq", "cta", "footer"],
    ["nav", "hero", "logos", "features", "testimonials", "pricing", "footer"],
    ["nav", "hero", "about", "features", "team", "testimonials", "cta", "footer"],
    ["nav", "hero", "features", "stats", "pricing", "faq", "footer"],
    ["nav", "hero", "logos", "features", "gallery", "contact", "footer"],
  ];
  return structures[Math.floor(Math.random() * structures.length)];
}

/**
 * Helper to parse AI responses safely
 */
function parseJsonResponse(raw) {
  let clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  let parsed = JSON.parse(clean);
  return (typeof parsed === 'string') ? JSON.parse(parsed) : parsed;
}

/**
 * Progress helper
 */
function onProgress(msg, callback) {
  if (callback) callback({ event: 'thinking', message: msg });
}

function buildFallbackLayout(spec) {
  const brandName = spec.businessName || 'My Website';
  const structure = getRandomFallbackStructure();
  
  return {
    meta: {
      title: `${brandName} — Official Website`,
      description: spec.description || `Welcome to ${brandName}.`
    },
    designTokens: {
      bg: "#09090b",
      surface: "#18181b",
      accent: "#3b82f6",
      accentHover: "#2563eb",
      text: "#fafafa",
      textDim: "#a1a1aa",
      border: "#27272a",
      fontHeading: "Inter",
      fontBody: "Inter"
    },
    sections: [
      { snippetId: 'nav-glass', content: { brand: brandName, ctaText: 'Get Started' } },
      { snippetId: 'hero-aurora', content: { heading: `Welcome to ${brandName}`, subtext: 'A premium experience crafted just for you.', badgeText: 'Now Live', ctaText: 'Get Started', ctaLink: '#features', secondaryCtaText: 'Learn More', secondaryCtaLink: '#about' } },
      { snippetId: 'features-hover-cards', content: { heading: 'Why Choose Us', subtext: 'Built for the modern world.', badgeText: 'Features', feature1Title: 'Lightning Fast', feature1Desc: 'Optimized for speed and performance.', feature2Title: 'Secure by Default', feature2Desc: 'Enterprise-grade security built in.', feature3Title: 'Always Available', feature3Desc: '99.9% uptime guaranteed.' } },
      { snippetId: 'footer-minimal', content: { brand: brandName } }
    ]
  };
}

module.exports = { planLayout, buildFallbackLayout };