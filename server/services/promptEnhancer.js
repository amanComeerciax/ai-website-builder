/**
 * Prompt Enhancer — The brain of the 5-step pipeline
 * 
 * Takes raw user input (prompt + optional theme/name/description/colors)
 * and produces a complete, technical EnrichedSpec for code generation.
 * 
 * Two-layer enrichment:
 *   Layer 1 (Rule-based): Theme lookup, siteType→sections mapping, defaults
 *   Layer 2 (LLM-based):  Mistral interprets vague phrases, expands intent
 * 
 * The LLM never sees the raw user prompt alone — always the enriched version.
 */

const { getTheme, mergeUserColors } = require('../config/themeRegistry.js');
const { callModel } = require('./modelRouter.js');

/**
 * Site type → default sections mapping.
 * When we detect a site type from the prompt, we know which sections make sense.
 */
const SITE_TYPE_SECTIONS = {
  'coffee-shop':   ['hero', 'menu', 'about', 'testimonials', 'gallery', 'contact', 'footer'],
  'restaurant':    ['hero', 'menu', 'about', 'chef', 'reservations', 'testimonials', 'gallery', 'contact', 'footer'],
  'bakery':        ['hero', 'products', 'about', 'specials', 'testimonials', 'contact', 'footer'],
  'portfolio':     ['hero', 'projects', 'about', 'skills', 'experience', 'testimonials', 'contact', 'footer'],
  'agency':        ['hero', 'services', 'portfolio', 'about', 'team', 'testimonials', 'cta', 'contact', 'footer'],
  'saas':          ['hero', 'features', 'how-it-works', 'pricing', 'testimonials', 'faq', 'cta', 'footer'],
  'ecommerce':     ['hero', 'featured-products', 'categories', 'about', 'testimonials', 'newsletter', 'footer'],
  'blog':          ['hero', 'featured-posts', 'categories', 'about', 'newsletter', 'footer'],
  'landing':       ['hero', 'features', 'about', 'testimonials', 'cta', 'footer'],
  'gym':           ['hero', 'programs', 'trainers', 'pricing', 'testimonials', 'schedule', 'contact', 'footer'],
  'salon':         ['hero', 'services', 'pricing', 'gallery', 'about', 'team', 'booking', 'testimonials', 'footer'],
  'hotel':         ['hero', 'rooms', 'amenities', 'gallery', 'about', 'testimonials', 'booking', 'contact', 'footer'],
  'education':     ['hero', 'courses', 'features', 'instructors', 'testimonials', 'pricing', 'faq', 'footer'],
  'medical':       ['hero', 'services', 'doctors', 'about', 'testimonials', 'appointment', 'contact', 'footer'],
  'real-estate':   ['hero', 'listings', 'services', 'about', 'testimonials', 'contact', 'footer'],
  'default':       ['hero', 'features', 'about', 'testimonials', 'contact', 'footer'],
};

/**
 * Section → Required content mapping.
 * Tells the AI EXACTLY what each section must contain to prevent empty sections.
 */
const SECTION_CONTENT_GUIDE = {
  'hero':          'Full-width hero with heading, subtext, CTA button, and a decorative image/gradient background',
  'menu':          'At least 6 menu items in a grid/cards, each with name, description, and price',
  'rooms':         '3-4 room/suite cards, each with an image placeholder (use CSS gradient), name, price per night, and a features list',
  'amenities':     '6 amenity cards in a grid, each with an icon, title, and short description',
  'gallery':       '6-8 image cards in a responsive grid using CSS gradient placeholders or placehold.co images',
  'testimonials':  '3 testimonial cards with quote text, customer name, role/title, and a star rating',
  'about':         'About section with company story text, mission statement, and key stats (e.g., years, clients, projects)',
  'features':      '4-6 feature cards with icon, heading, and description text',
  'services':      '4-6 service cards with icon, name, description, and a "Learn More" link',
  'pricing':       '3 pricing tier cards (Basic/Pro/Enterprise) with price, feature list, and CTA button',
  'team':          '3-4 team member cards with avatar placeholder, name, role, and social links',
  'contact':       'Contact form with name, email, message fields, a submit button, plus address/phone/email info',
  'footer':        'Footer with logo, navigation links, social media icons, and copyright text',
  'cta':           'Full-width call-to-action banner with heading, subtext, and prominent button',
  'faq':           '5-6 FAQ accordion items with question and answer text',
  'how-it-works':  '3-4 steps with number, icon, title, and description in a horizontal timeline',
  'newsletter':    'Newsletter signup with heading, description, email input, and subscribe button',
  'projects':      '4-6 project cards with image placeholder, title, category tag, and description',
  'skills':        'Skills section with progress bars or percentage indicators for 6-8 skills',
  'experience':    '3-4 experience timeline items with company, role, date range, and description',
  'portfolio':     '4-6 portfolio items in a filterable grid with image, title, and category',
  'programs':      '3-4 program/class cards with name, description, schedule, and price',
  'trainers':      '3-4 trainer cards with photo placeholder, name, specialization, and bio',
  'schedule':      'Weekly schedule table/grid showing time slots and activities',
  'courses':       '4-6 course cards with image, title, instructor, duration, and price',
  'instructors':   '3-4 instructor cards with photo placeholder, name, subject, and bio',
  'doctors':       '3-4 doctor cards with photo placeholder, name, specialization, and available hours',
  'appointment':   'Appointment booking form with date picker, time slots, and service selection',
  'listings':      '4-6 property listing cards with image, price, location, bedrooms/bathrooms, and area',
  'booking':       'Booking/reservation form with date inputs, guest count, and room/service selection',
  'chef':          'Chef profile section with large image placeholder, name, bio, and signature dishes',
  'reservations':  'Reservation form with date, time, party size, and special requests',
  'categories':    '4-6 category cards in a grid with image placeholder, name, and item count',
  'featured-products': '4-6 product cards with image placeholder, name, price, and add-to-cart button',
  'featured-posts':    '3-4 blog post cards with image, title, date, excerpt, and read-more link',
  'specials':      '3-4 special offer cards with image, title, description, and original/sale price',
};

/**
 * Keyword → site type detection
 * We scan the user prompt for these keywords to auto-detect the site type.
 */
const SITE_TYPE_KEYWORDS = {
  'coffee':      'coffee-shop',
  'cafe':        'coffee-shop',
  'café':        'coffee-shop',
  'restaurant':  'restaurant',
  'food':        'restaurant',
  'dining':      'restaurant',
  'bakery':      'bakery',
  'cake':        'bakery',
  'pastry':      'bakery',
  'portfolio':   'portfolio',
  'personal':    'portfolio',
  'agency':      'agency',
  'studio':      'agency',
  'marketing':   'agency',
  'saas':        'saas',
  'app':         'saas',
  'software':    'saas',
  'startup':     'saas',
  'dashboard':   'saas',
  'shop':        'ecommerce',
  'store':       'ecommerce',
  'ecommerce':   'ecommerce',
  'e-commerce':  'ecommerce',
  'product':     'ecommerce',
  'blog':        'blog',
  'news':        'blog',
  'magazine':    'blog',
  'gym':         'gym',
  'fitness':     'gym',
  'yoga':        'gym',
  'workout':     'gym',
  'salon':       'salon',
  'spa':         'salon',
  'beauty':      'salon',
  'hair':        'salon',
  'hotel':       'hotel',
  'resort':      'hotel',
  'travel':      'hotel',
  'booking':     'hotel',
  'school':      'education',
  'course':      'education',
  'learning':    'education',
  'university':  'education',
  'tutor':       'education',
  'doctor':      'medical',
  'clinic':      'medical',
  'hospital':    'medical',
  'health':      'medical',
  'dental':      'medical',
  'property':    'real-estate',
  'real estate': 'real-estate',
  'realestate':  'real-estate',
  'housing':     'real-estate',
};

/**
 * Detect site type from the user's prompt using keyword matching.
 * @param {string} prompt
 * @returns {string} Detected site type or 'default'
 */
function detectSiteType(prompt) {
  const lower = prompt.toLowerCase();
  for (const [keyword, siteType] of Object.entries(SITE_TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return siteType;
    }
  }
  return 'default';
}

/**
 * Layer 1: Rule-based enrichment (zero LLM cost)
 * 
 * Takes the raw inputs and applies deterministic rules:
 * - Theme → color scheme + fonts + styles
 * - Prompt → site type → default sections
 * - User brand colors → merge into theme
 */
function ruleBasedEnrich(prompt, options = {}) {
  const {
    theme: themeId = 'modern-dark',
    websiteName = null,
    description = null,
    logoUrl = null,
    brandColors = null,
    isModification = false,
  } = options;

  // 1. Load and merge theme
  let theme = getTheme(themeId);
  if (brandColors && brandColors.length > 0) {
    theme = mergeUserColors(theme, brandColors);
  }

  // 2. Detect site type from prompt
  const siteType = detectSiteType(prompt);
  const sections = SITE_TYPE_SECTIONS[siteType] || SITE_TYPE_SECTIONS['default'];

  // 3. Determine color preference from theme
  const isDark = ['modern-dark', 'bold', 'elegant'].includes(themeId);

  return {
    // User inputs (raw)
    rawPrompt: prompt,
    websiteName,
    description,
    logoUrl,
    brandColors,

    // Rule-based enrichment
    themeId: theme.id,
    themeName: theme.name,
    siteType,
    sections,
    colorPreference: isDark ? 'dark' : 'light',
    colorScheme: theme.colorScheme,
    fontPair: theme.fontPair,
    borderRadius: theme.borderRadius,
    animationStyle: theme.animationStyle,
    styleKeywords: theme.styleKeywords,

    // Placeholders for LLM enrichment (filled in Layer 2)
    businessName: websiteName || null,
    tagline: null,
    targetAudience: null,
    tone: null,
    contentHints: null,
    isModification: isModification,
  };
}

/**
 * Layer 2: LLM-based enrichment (Mistral — fast + cheap)
 * 
 * Takes the rule-enriched spec and asks Mistral to:
 * - Generate a business name if not provided
 * - Write a tagline
 * - Identify target audience
 * - Suggest content tone
 * - Interpret any vague phrases in the prompt
 */
async function llmEnrich(ruleSpec, requestModel = null) {
  const systemPrompt = [
    'You are a website planning assistant. Given a website request and detected site type,',
    ruleSpec.isModification ? 'The user is requesting an EDIT to their EXISTING website. If they ask to change the name or theme, update the properties accordingly.' : 'fill in the missing details to help a code generator produce a complete website.',
    '',
    'Return ONLY valid JSON with this exact shape (no markdown, no explanation):',
    '{',
    '  "businessName": "string — use the provided name or invent a fitting one",',
    '  "tagline": "string — a short catchy tagline for the hero section",',
    '  "targetAudience": "string — who this site is for",',
    '  "tone": "string — the writing tone (e.g. warm, professional, playful)",',
    '  "contentHints": {',
    '    "heroHeading": "string — main hero heading text",',
    '    "heroSubtext": "string — hero paragraph text",',
    '    "ctaButtonText": "string — primary CTA button label"',
    '  }',
    '}',
  ].join('\n');

  const userMessage = [
    `Website request: "${ruleSpec.rawPrompt}"`,
    `Detected site type: ${ruleSpec.siteType}`,
    `Theme style: ${ruleSpec.themeName}`,
    ruleSpec.websiteName ? `Business name provided: ${ruleSpec.websiteName}${ruleSpec.isModification ? ' (You may change this if requested)' : ''}` : 'No business name provided — please suggest one.',
    ruleSpec.description ? `Description provided: ${ruleSpec.description}` : '',
    `Sections planned: ${ruleSpec.sections.join(', ')}`,
  ].filter(Boolean).join('\n');

  try {
    const result = await callModel('parse_prompt', userMessage, systemPrompt, { forceModel: requestModel });
    const parsed = JSON.parse(result.content);

    // Merge LLM output into the spec
    return {
      ...ruleSpec,
      businessName: ruleSpec.websiteName || parsed.businessName || 'MyWebsite',
      tagline: parsed.tagline || '',
      targetAudience: parsed.targetAudience || 'general audience',
      tone: parsed.tone || 'professional',
      contentHints: parsed.contentHints || null,
    };
  } catch (e) {
    console.warn(`[PromptEnhancer] LLM enrichment failed (non-fatal): ${e.message}`);
    // Fall back to rule-based only — still works!
    return {
      ...ruleSpec,
      businessName: ruleSpec.websiteName || 'MyWebsite',
      tagline: `Welcome to ${ruleSpec.websiteName || 'our website'}`,
      targetAudience: 'general audience',
      tone: 'professional',
      contentHints: null,
    };
  }
}

/**
 * Build the final enhanced prompt string from the enriched spec.
 * This is what actually goes to the LLM for code generation.
 * 
 * @param {object} spec - The fully enriched spec
 * @returns {string} A detailed technical prompt for the code-generating LLM
 */
function buildEnhancedPrompt(spec) {
  const colorDesc = Object.entries(spec.colorScheme)
    .map(([key, val]) => `  ${key}: ${val}`)
    .join('\n');

  const sectionsList = spec.sections
    .map((s, i) => {
      const name = s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
      const guide = SECTION_CONTENT_GUIDE[s];
      return guide ? `  ${i + 1}. ${name} — ${guide}` : `  ${i + 1}. ${name}`;
    })
    .join('\n');

  const parts = [
    `Build a complete, professional ${spec.siteType.replace(/-/g, ' ')} website for "${spec.businessName}".`,
    '',
    '=== DESIGN SYSTEM (MUST follow exactly) ===',
    `Theme: ${spec.themeName}`,
    `Color Scheme:`,
    colorDesc,
    `Fonts: ${spec.fontPair.heading} for headings, ${spec.fontPair.body} for body text`,
    `Border Radius: ${spec.borderRadius}`,
    `Animation Style: ${spec.animationStyle}`,
    '',
    '=== STYLE GUIDELINES ===',
    ...spec.styleKeywords.map(kw => `- ${kw}`),
    '',
    `=== SECTIONS (in this order) ===`,
    sectionsList,
    '',
    '=== CONTENT ===',
    `Business Name: ${spec.businessName}`,
    spec.tagline ? `Tagline: ${spec.tagline}` : '',
    spec.description ? `Description: ${spec.description}` : '',
    `Target Audience: ${spec.targetAudience}`,
    `Tone: ${spec.tone}`,
    spec.logoUrl ? `Logo URL: ${spec.logoUrl}` : '',
  ];

  if (spec.contentHints) {
    parts.push('');
    parts.push('=== CONTENT HINTS ===');
    if (spec.contentHints.heroHeading) parts.push(`Hero Heading: "${spec.contentHints.heroHeading}"`);
    if (spec.contentHints.heroSubtext) parts.push(`Hero Subtext: "${spec.contentHints.heroSubtext}"`);
    if (spec.contentHints.ctaButtonText) parts.push(`CTA Button: "${spec.contentHints.ctaButtonText}"`);
  }

  parts.push('');
  parts.push('=== QUALITY REQUIREMENTS (MANDATORY) ===');
  parts.push('- Fully responsive (mobile-first design)');
  parts.push('- Professional typography with proper spacing');
  parts.push('- Smooth hover effects and transitions');
  parts.push('- Real, meaningful content (NOT lorem ipsum)');
  parts.push('- Use the exact colors from the design system above');
  parts.push('');
  parts.push('=== CONTENT DENSITY (CRITICAL — empty sections are UNACCEPTABLE) ===');
  parts.push('- EVERY section listed above MUST have visible, rendered content — not just a heading');
  parts.push('- Cards/grids: minimum 3 items per section, ideally 4-6');
  parts.push('- Use CSS gradients (linear-gradient) or placehold.co URLs for image placeholders');
  parts.push('- NEVER create a section with only a heading and empty space below it');
  parts.push('- If a section needs images, use: https://placehold.co/600x400/1a1a2e/ffffff?text=Image+Title');
  parts.push('- Each card/item MUST have: icon or image, title, and description text at minimum');

  return parts.filter(Boolean).join('\n');
}

/**
 * Main entry point — Full prompt enhancement pipeline.
 * 
 * @param {string} prompt - Raw user prompt ("Make a coffee website")
 * @param {object} options - { theme, websiteName, description, logoUrl, brandColors }
 * @returns {object} { enrichedSpec, enhancedPrompt, siteType, themeName }
 */
async function enhance(prompt, options = {}) {
  console.log(`[PromptEnhancer] Input: "${prompt}" | Theme: ${options.theme || 'default'}`);

  // Layer 1: Rule-based (instant, free)
  const ruleSpec = ruleBasedEnrich(prompt, options);
  console.log(`[PromptEnhancer] Rule-based → siteType: ${ruleSpec.siteType}, sections: ${ruleSpec.sections.length}, theme: ${ruleSpec.themeName}`);

  // Layer 2: LLM-based (Mistral, ~1-2 seconds)
  const enrichedSpec = await llmEnrich(ruleSpec, options.requestModel);
  console.log(`[PromptEnhancer] LLM-enriched → name: "${enrichedSpec.businessName}", audience: "${enrichedSpec.targetAudience}"`);

  // Build the final enhanced prompt string
  const enhancedPrompt = buildEnhancedPrompt(enrichedSpec);
  console.log(`[PromptEnhancer] Enhanced prompt: ${enhancedPrompt.length} chars (from ${prompt.length} char input)`);

  // Track detection: 
  // 1. Explicit user request in prompt (e.g. "in react", "use vanilla html")
  // 2. Default by site type
  const lowerPrompt = prompt.toLowerCase();
  let outputTrack = enrichedSpec.siteType === 'saas' || enrichedSpec.siteType === 'ecommerce' ? 'react' : 'html';

  if (lowerPrompt.includes('react') || lowerPrompt.includes('nextjs') || lowerPrompt.includes('components')) {
    outputTrack = 'react';
  } else if (lowerPrompt.includes('html') || lowerPrompt.includes('vanilla') || lowerPrompt.includes('single file')) {
    outputTrack = 'html';
  }

  return {
    enrichedSpec,
    enhancedPrompt,
    siteType: enrichedSpec.siteType,
    themeName: enrichedSpec.themeName,
    outputTrack
  };
}

module.exports = { enhance, ruleBasedEnrich, detectSiteType, buildEnhancedPrompt };
