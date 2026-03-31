// /**
//  * Layout Planner — AI-powered component selection and content generation
//  * 
//  * This replaces the old "AI writes ALL code" approach.
//  * Instead, AI only decides:
//  *   1. Which pre-built components to use
//  *   2. Which variant of each component
//  *   3. What content (text, images) to fill into each
//  * 
//  * The prompt is ~2KB instead of ~85KB, making it fast and reliable.
//  */

// const { callModel } = require('./modelRouter.js');
// const { getComponentCatalog, validateLayoutSpec, applyDefaults, getImagesForSiteType } = require('../component-kit/registry.js');

// /**
//  * Plan a website layout from an enriched spec.
//  * 
//  * @param {object} enrichedSpec - Output from PromptEnhancer
//  * @returns {object} Layout spec: { sections: [...], meta: {...} }
//  */
// async function planLayout(enrichedSpec) {
//   const catalog = getComponentCatalog();
//   const siteType = enrichedSpec.siteType || 'default';
//   const images = getImagesForSiteType(siteType);
//   const brandName = enrichedSpec.businessName || 'My Business';  const systemPrompt = `You are an ultra-premium website layout planner. Given a website request, select world-class pre-built components and fill them with professional content.

//  AVAILABLE COMPONENTS:
//  ${catalog.map(c => `- ${c.name} (variants: ${c.variants.join(', ')})
//    Required props: ${c.requiredProps.join(', ')}
//    Optional props: ${c.optionalProps.join(', ')}
//    ${c.itemSchema ? `Item schema: ${JSON.stringify(c.itemSchema)}` : ''}`).join('\n')}

//  STRICT RULES:
//  1. ALWAYS start with NavBar and end with FooterSection.
//  2. ALWAYS include HeroSection as the second component. Use "aurora" or "sparkles" for futuristic/modern brands.
//  3. Use BentoGrid for features if the business is "Tech", "Startup", or "Creative".
//  4. Use StickyScroll for "Services" or "How it works" sections if content is descriptive.
//  5. Include 7-10 sections total. Mix BentoGrid, Portfolio, FAQ, and Pricing for a complete high-end look.
//  6. For BentoGrid: Provide 5-6 items. Use "className" to vary sizes (e.g., md:col-span-2 for 2nd and 4th items).
//  7. HeroSection: Use "aurora" variant for the most premium feel.

//  RETURN ONLY VALID JSON:
//  {
//    "meta": { "title": "Page Title", "description": "SEO description" },
//    "sections": [
//      { "component": "NavBar", "variant": "transparent", "props": { ... } },
//      { "component": "HeroSection", "variant": "aurora", "props": { ... } },
//      ...
//    ]
//  }`;

//   const userMessage = `Plan a high-end, world-class website for this brand:

//  Brand: "${brandName}"
//  Site Type: ${siteType}
//  Theme: ${enrichedSpec.themeName || 'Modern Dark'}
//  Description: ${enrichedSpec.description || enrichedSpec.rawPrompt || 'A professional website'}
//  Tone: ${enrichedSpec.tone || 'sophisticated and premium'}

//  CRITICAL: 
//  - Use the new "BentoGrid" for features and "aurora" variants for Hero.
//  - Generate content that sounds bespoke and high-end for "${brandName}".
//  - If this is a Tech brand, ALWAYS use a BentoGrid.
//  - Ensure the flow of sections feels narrative and engaging.`;

//   let layoutSpec = null;

//   for (let attempt = 1; attempt <= 3; attempt++) {
//     try {
//       const result = await callModel('plan_layout', userMessage, systemPrompt);

//       // Clean the response (remove markdown fences if present)
//       let rawContent = result.content.trim();
//       rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

//       let parsed = JSON.parse(rawContent);

//       // Handle double-serialization edge case
//       if (typeof parsed === 'string') {
//         parsed = JSON.parse(parsed);
//       }

//       if (!parsed.sections || !Array.isArray(parsed.sections)) {
//         throw new Error('Missing "sections" array in layout spec');
//       }

//       // ALWAYS auto-fix to ensure no empty sections
//       parsed.sections = autoFixLayout(parsed.sections, enrichedSpec);

//       // Apply defaults for missing optional props
//       parsed.sections = applyDefaults(parsed.sections);

//       // Inject real images based on site type
//       parsed.sections = injectImages(parsed.sections, siteType);

//       // Validate after all fixes
//       const { valid, errors } = validateLayoutSpec(parsed.sections);
//       if (!valid) {
//         console.warn(`[LayoutPlanner] Validation warnings after auto-fix (attempt ${attempt}):`, errors);
//       }

//       layoutSpec = parsed;
//       console.log(`[LayoutPlanner] ✅ Layout planned — ${parsed.sections.length} sections (attempt ${attempt})`);
//       break;
//     } catch (e) {
//       console.error(`[LayoutPlanner] Attempt ${attempt}/3 failed:`, e.message);
//       if (attempt === 3) {
//         console.warn('[LayoutPlanner] All attempts failed, using fallback layout');
//         layoutSpec = buildFallbackLayout(enrichedSpec);
//       }
//       await new Promise(r => setTimeout(r, 500 * attempt));
//     }
//   }

//   return layoutSpec;
// }

// /**
//  * Auto-fix a layout by filling in missing/empty required props.
//  */
// function autoFixLayout(sections, spec) {
//   const siteType = spec.siteType || 'default';
//   const images = getImagesForSiteType(siteType);
//   const brandName = spec.businessName || 'My Business';

//   return sections.map(section => {
//     const props = { ...section.props };

//     switch (section.component) {
//       case 'NavBar':
//         if (!props.brand) props.brand = brandName;
//         if (!props.links) props.links = ['Home', 'About', 'Contact'];
//         break;

//       case 'HeroSection':
//         if (!props.heading) props.heading = `The Future of ${brandName}`;
//         if (!props.subtext) props.subtext = spec.description || `Innovation meets excellence in our premium ${siteType} solutions.`;
//         if (!props.ctaText) props.ctaText = 'Discover More';
//         break;

//       case 'BentoGrid':
//         if (!props.heading) props.heading = 'Innovation Unleashed';
//         if (!props.items || !Array.isArray(props.items)) {
//           props.items = [
//             { title: 'Global Infrastructure', description: 'Scale without limits on our distributed edge network.', icon: 'Globe', className: 'md:col-span-2' },
//             { title: 'Advanced AI', description: 'Next-gen intelligence for your business.', icon: 'Zap' },
//             { title: 'Secure by Design', description: 'Zero-trust architecture as standard.', icon: 'Shield' },
//             { title: 'Real-time Analytics', description: 'Insights that drive faster decisions.', icon: 'Target', className: 'md:col-span-2' }
//           ];
//         }
//         break;

//       case 'StickyScroll':
//         if (!props.items || !Array.isArray(props.items)) {
//           props.items = [
//             { title: 'Design First', description: 'Every pixel is crafted with precision and purpose.', content: images[0] },
//             { title: 'Performance Engineering', description: 'Optimized for speed that keeps you ahead.', content: images[1] }
//           ];
//         }
//         break;

//       case 'PricingSection':
//         if (!props.heading) props.heading = 'Transparent Pricing';
//         if (!props.plans) props.plans = [ { name: 'Pro', price: '$99', features: ['All Core Features', 'Support'], ctaText: 'Join Pro' } ];
//         break;

//       case 'FooterSection':
//         if (!props.brand) props.brand = brandName;
//         break;
//     }

//     return { ...section, props };
//   });
// }

// /**
//  * Inject real Unsplash images into all sections that need them
//  */
// function injectImages(sections, siteType) {
//   const images = getImagesForSiteType(siteType);
//   let imageIndex = 0;

//   return sections.map(section => {
//     const props = { ...section.props };

//     // 1. Hero background image
//     if (section.component === 'HeroSection') {
//       if (!props.bgImage || props.bgImage.includes('placeholder') || props.bgImage.includes('placehold')) {
//         props.bgImage = images[imageIndex % images.length];
//         imageIndex++;
//       }
//     }

//     // 2. About section image
//     if (section.component === 'AboutSection') {
//       if (!props.image || props.image.includes('placeholder') || props.image.includes('placehold')) {
//         props.image = images[imageIndex % images.length];
//         imageIndex++;
//       }
//     }

//     // 3. Portfolio items
//     if (section.component === 'PortfolioSection' && Array.isArray(props.items)) {
//       props.items = props.items.map(item => {
//         if (!item.image || item.image.includes('placeholder') || item.image.includes('placehold')) {
//           const img = images[imageIndex % images.length];
//           imageIndex++;
//           return { ...item, image: img };
//         }
//         return item;
//       });
//     }

//     // 4. BentoGrid headers/images
//     if (section.component === 'BentoGrid' && Array.isArray(props.items)) {
//       props.items = props.items.map(item => {
//         // Some bento items have a "header" which can be an image
//         if (!item.header || item.header.includes('placeholder') || item.header.includes('placehold')) {
//           const img = images[imageIndex % images.length];
//           imageIndex++;
//           return { ...item, header: img };
//         }
//         return item;
//       });
//     }

//     // 5. StickyScroll content (usually images)
//     if (section.component === 'StickyScroll' && Array.isArray(props.items)) {
//       props.items = props.items.map(item => {
//         if (!item.content || (typeof item.content === 'string' && (item.content.includes('placeholder') || item.content.includes('placehold')))) {
//           const img = images[imageIndex % images.length];
//           imageIndex++;
//           return { ...item, content: img };
//         }
//         return item;
//       });
//     }

//     // 6. Generic FeatureGrid with icons/images (if any use image variant)
//     if (section.component === 'FeatureGrid' && Array.isArray(props.items) && section.variant === 'images') {
//       props.items = props.items.map(item => {
//         if (!item.image || item.image.includes('placeholder') || item.image.includes('placehold')) {
//           const img = images[imageIndex % images.length];
//           imageIndex++;
//           return { ...item, image: img };
//         }
//         return item;
//       });
//     }

//     return { ...section, props };
//   });
// }

// /**
//  * Build a sensible fallback layout when AI fails completely
//  */
// function buildFallbackLayout(spec) {
//   const brandName = spec.businessName || 'My Website';
//   const siteType = spec.siteType || 'default';
//   const images = getImagesForSiteType(siteType);

//   return {
//     meta: {
//       title: `${brandName} — Official Website`,
//       description: spec.description || `Welcome to ${brandName}. Discover our services and get in touch.`,
//     },
//     sections: applyDefaults([
//       {
//         component: 'NavBar',
//         variant: 'transparent',
//         props: { brand: brandName, links: ['Home', 'Features', 'Process', 'FAQ'], ctaText: 'Get Started' },
//       },
//       {
//         component: 'HeroSection',
//         variant: 'aurora',
//         props: {
//           heading: spec.contentHints?.heroHeading || `The Future of ${brandName}`,
//           subtext: spec.contentHints?.heroSubtext || spec.description || `Experience innovation at its peak. We combine world-class engineering with bespoke design to create unique digital experiences.`,
//           ctaText: spec.contentHints?.ctaButtonText || 'Get Started',
//           secondaryCtaText: 'View Showcase',
//           badgeText: `💎 Premium Experience`,
//         },
//       },
//       {
//         component: 'BentoGrid',
//         props: {
//           heading: 'Engineered for Performance',
//           subtext: 'Discover why industry leaders choose our platform.',
//           items: [
//             { icon: 'Zap', title: 'Lightning Fast', description: 'Optimized for the next generation of speed and performance.', className: 'md:col-span-2' },
//             { icon: 'Shield', title: 'Secure Infrastructure', description: 'Enterprise-grade security built into the core.', icon: 'Shield' },
//             { icon: 'Globe', title: 'Global Reach', description: 'Deployed across a distributed edge network for zero latency.', icon: 'Globe' },
//             { icon: 'Cpu', title: 'AI Optimized', description: 'Leveraging next-gen artificial intelligence for your growth.', className: 'md:col-span-2' },
//           ]
//         },
//       },
//       {
//         component: 'AboutSection',
//         variant: 'story',
//         props: {
//           heading: `About ${brandName}`,
//           description: spec.description || `${brandName} was founded with a simple mission: to deliver exceptional products and services that make a real difference. Our passionate team combines innovation with expertise to help our clients succeed and grow beyond their expectations.`,
//           image: images[1] || images[0],
//           stats: [
//             { value: '500+', label: 'Happy Clients' },
//             { value: '10+', label: 'Years Experience' },
//             { value: '50+', label: 'Projects Completed' },
//           ],
//         },
//       },
//       {
//         component: 'TestimonialSection',
//         variant: 'cards',
//         props: {
//           heading: 'What Our Clients Say',
//           subtext: 'Real stories from real customers',
//           items: [
//             { quote: 'Absolutely outstanding service. They exceeded all our expectations and delivered on time. Would definitely recommend!', name: 'Sarah Johnson', role: 'CEO, TechVentures', rating: 5 },
//             { quote: 'The best decision we made for our business this year. The quality of work is simply exceptional and unmatched.', name: 'Michael Chen', role: 'Founder, StartupLab', rating: 5 },
//             { quote: 'Professional, responsive, and incredibly talented team. A pleasure to work with from start to finish.', name: 'Emily Rodriguez', role: 'Director, Creative Co', rating: 5 },
//           ],
//         },
//       },
//       {
//         component: 'CTASection',
//         variant: 'banner',
//         props: {
//           heading: 'Ready to Get Started?',
//           subtext: `Join hundreds of satisfied customers who trust ${brandName}. Start your journey today.`,
//           ctaText: 'Contact Us Today',
//           ctaLink: '#contact',
//         },
//       },
//       {
//         component: 'ContactSection',
//         variant: 'splitForm',
//         props: {
//           heading: 'Get In Touch',
//           subtext: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
//         },
//       },
//       {
//         component: 'FooterSection',
//         variant: 'withLinks',
//         props: {
//           brand: brandName,
//           description: spec.description || `${brandName} — delivering excellence since day one.`,
//           socialLinks: ['twitter', 'instagram', 'linkedin'],
//         },
//       },
//     ]),
//   };
// }

// module.exports = { planLayout, buildFallbackLayout };


/**
 * Layout Planner — AI-powered component selection and content generation
 * UPDATED: siteType-aware routing, premium variants, no hardcoded ALWAYS rules
 */

const { callModel } = require('./modelRouter.js');
const { getComponentCatalog, validateLayoutSpec, applyDefaults, getImagesForSiteType } = require('../component-kit/registry.js');

// ─────────────────────────────────────────────
// Per siteType: which hero variant, which sections, which style
// ─────────────────────────────────────────────
const SITE_BLUEPRINTS = {
  'saas': {
    heroVariant: 'radiant', featureComponent: 'FeatureGrid', featureVariant: 'radiant',
    navVariant: 'default', footerVariant: 'default', testimonialVariant: 'default',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'StickyScroll', 'TestimonialSection', 'PricingSection', 'FAQSection', 'CTASection', 'FooterSection'],
    tone: 'modern, bold, futuristic',
    iconSet: ['Zap', 'Shield', 'Globe', 'Cpu', 'Target', 'Layers', 'BarChart', 'Lock'],
  },
  'tech': {
    heroVariant: 'radiant', featureComponent: 'FeatureGrid', featureVariant: 'radiant',
    navVariant: 'default', footerVariant: 'default', testimonialVariant: 'grid',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'StickyScroll', 'TestimonialSection', 'PricingSection', 'FAQSection', 'CTASection', 'FooterSection'],
    tone: 'innovative, technical, premium',
    iconSet: ['Cpu', 'Code', 'Globe', 'Zap', 'Shield', 'Database', 'Network', 'Terminal'],
  },
  'agency': {
    heroVariant: 'stuxen', featureComponent: 'FeatureGrid', featureVariant: 'bold',
    navVariant: 'bold', footerVariant: 'magazine', testimonialVariant: 'spotlight',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'PortfolioSection', 'AboutSection', 'TestimonialSection', 'CTASection', 'ContactSection', 'FooterSection'],
    tone: 'creative, bold, confident',
    iconSet: ['Pen', 'Layout', 'Palette', 'TrendingUp', 'Users', 'Award', 'Star', 'Rocket'],
  },
  'portfolio': {
    heroVariant: 'stuxen', featureComponent: 'PortfolioSection', featureVariant: 'bold',
    navVariant: 'bold', footerVariant: 'minimal', testimonialVariant: 'spotlight',
    sections: ['NavBar', 'HeroSection', 'PortfolioSection', 'AboutSection', 'FeatureGrid', 'TestimonialSection', 'ContactSection', 'FooterSection'],
    tone: 'minimal, clean, sophisticated',
    iconSet: ['Pen', 'Camera', 'Code', 'Layout', 'Layers', 'Star', 'Award', 'Eye'],
  },
  'restaurant': {
    heroVariant: 'fullImage', featureComponent: 'FeatureGrid', featureVariant: 'warm',
    navVariant: 'minimal', footerVariant: 'minimal', testimonialVariant: 'spotlight',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'TestimonialSection', 'GallerySection', 'ContactSection', 'FooterSection'],
    tone: 'warm, inviting, luxurious',
    iconSet: ['UtensilsCrossed', 'Wine', 'Star', 'Clock', 'MapPin', 'Heart', 'Award', 'Leaf'],
  },
  'coffee-shop': {
    heroVariant: 'split', featureComponent: 'FeatureGrid', featureVariant: 'warm',
    navVariant: 'minimal', footerVariant: 'minimal', testimonialVariant: 'grid',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'TestimonialSection', 'ContactSection', 'FooterSection'],
    tone: 'cozy, warm, artisanal',
    iconSet: ['Coffee', 'Leaf', 'Star', 'Clock', 'MapPin', 'Heart', 'Sun', 'Wind'],
  },
  'gym': {
    heroVariant: 'fullImage', featureComponent: 'FeatureGrid', featureVariant: 'energetic',
    navVariant: 'bold', footerVariant: 'default', testimonialVariant: 'grid',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'PricingSection', 'TestimonialSection', 'CTASection', 'ContactSection', 'FooterSection'],
    tone: 'energetic, powerful, motivating',
    iconSet: ['Dumbbell', 'Flame', 'Target', 'Trophy', 'Zap', 'Heart', 'Clock', 'Users'],
  },
  'hotel': {
    heroVariant: 'fullImage', featureComponent: 'FeatureGrid', featureVariant: 'warm',
    navVariant: 'minimal', footerVariant: 'magazine', testimonialVariant: 'spotlight',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'PortfolioSection', 'TestimonialSection', 'ContactSection', 'FooterSection'],
    tone: 'luxurious, elegant, refined',
    iconSet: ['Star', 'Wine', 'Wifi', 'Car', 'Utensils', 'Pool', 'Spa', 'Key'],
  },
  'salon': {
    heroVariant: 'salient', featureComponent: 'FeatureGrid', featureVariant: 'energetic',
    navVariant: 'minimal', footerVariant: 'minimal', testimonialVariant: 'spotlight',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'PricingSection', 'TestimonialSection', 'ContactSection', 'FooterSection'],
    tone: 'elegant, stylish, glamorous',
    iconSet: ['Scissors', 'Sparkles', 'Star', 'Heart', 'Clock', 'Award', 'Leaf', 'Crown'],
  },
  'medical': {
    heroVariant: 'salient', featureComponent: 'FeatureGrid', featureVariant: 'clean',
    navVariant: 'default', footerVariant: 'minimal', testimonialVariant: 'grid',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'TestimonialSection', 'FAQSection', 'ContactSection', 'FooterSection'],
    tone: 'trustworthy, professional, caring',
    iconSet: ['Heart', 'Shield', 'Users', 'Clock', 'Award', 'CheckCircle', 'Activity', 'Stethoscope'],
  },
  'education': {
    heroVariant: 'salient', featureComponent: 'FeatureGrid', featureVariant: 'clean',
    navVariant: 'default', footerVariant: 'magazine', testimonialVariant: 'grid',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'PricingSection', 'TestimonialSection', 'FAQSection', 'FooterSection'],
    tone: 'inspiring, approachable, credible',
    iconSet: ['BookOpen', 'GraduationCap', 'Users', 'Star', 'Award', 'Clock', 'Globe', 'Lightbulb'],
  },
  'ecommerce': {
    heroVariant: 'split', featureComponent: 'BentoGrid', featureVariant: 'cards',
    navVariant: 'default', footerVariant: 'default', testimonialVariant: 'grid',
    sections: ['NavBar', 'HeroSection', 'BentoGrid', 'AboutSection', 'TestimonialSection', 'CTASection', 'FooterSection'],
    tone: 'vibrant, exciting, trustworthy',
    iconSet: ['ShoppingBag', 'Star', 'Shield', 'Truck', 'Gift', 'Heart', 'Award', 'Zap'],
  },
  'default': {
    heroVariant: 'salient', featureComponent: 'FeatureGrid', featureVariant: 'cards',
    navVariant: 'default', footerVariant: 'default', testimonialVariant: 'default',
    sections: ['NavBar', 'HeroSection', 'FeatureGrid', 'AboutSection', 'TestimonialSection', 'CTASection', 'ContactSection', 'FooterSection'],
    tone: 'professional, modern, clean',
    iconSet: ['Zap', 'Shield', 'Globe', 'Target', 'Star', 'Award', 'Users', 'TrendingUp'],
  },
};

async function planLayout(enrichedSpec) {
  const catalog = getComponentCatalog();
  const siteType = enrichedSpec.siteType || 'default';
  const blueprint = SITE_BLUEPRINTS[siteType] || SITE_BLUEPRINTS['default'];
  const images = getImagesForSiteType(siteType);
  const brandName = enrichedSpec.businessName || 'My Business';
  const themeId = enrichedSpec.themeId || 'modern-dark';
  const isDark = ['modern-dark', 'premium-dark', 'bold', 'elegant'].includes(themeId);

  const systemPrompt = `You are an expert website layout planner for ${siteType} businesses.

AVAILABLE COMPONENTS:
${catalog.map(c => `- ${c.name} (variants: ${c.variants.join(', ')})
  Required: ${c.requiredProps.join(', ')}
  Optional: ${c.optionalProps.join(', ')}
  ${c.itemSchema ? `Items: ${JSON.stringify(c.itemSchema)}` : ''}`).join('\n')}

SITE BLUEPRINT FOR "${siteType.toUpperCase()}":
- Hero variant to use: ${blueprint.heroVariant}
- Feature component: ${blueprint.featureComponent}
- Feature variant to use: ${blueprint.featureVariant || 'cards'}
- Recommended sections: ${blueprint.sections.join(' → ')}
- Tone: ${blueprint.tone}
- Relevant icons: ${blueprint.iconSet.join(', ')}
- Theme style: ${isDark ? 'DARK — use dark, rich, moody content' : 'LIGHT — use clean, airy, minimal content'}

RULES:
1. Use EXACTLY the hero variant specified: "${blueprint.heroVariant}"
2. Use the feature component specified: "${blueprint.featureComponent}" with variant: "${blueprint.featureVariant || 'cards'}"
3. Generate content that is 100% specific to "${brandName}" — no generic placeholder text
4. Items arrays must have 4-6 entries minimum, each unique and specific
5. For BentoGrid: vary className — use "md:col-span-2" on 2nd and 4th items
6. For PortfolioSection: 4-6 items with real project names related to "${siteType}"
7. Write in tone: ${blueprint.tone}
8. Start with NavBar, end with FooterSection — always
9. For FeatureGrid: use variant "${blueprint.featureVariant || 'cards'}" — do NOT use any other variant

RETURN ONLY VALID JSON:
{
  "meta": { "title": "...", "description": "..." },
  "sections": [
    { "component": "NavBar", "variant": "transparent", "props": { ... } },
    { "component": "HeroSection", "variant": "${blueprint.heroVariant}", "props": { ... } },
    ...
  ]
}`;

  const userMessage = `Plan a world-class ${siteType} website:

Brand: "${brandName}"
Theme: ${enrichedSpec.themeName || 'Modern Dark'}
Description: ${enrichedSpec.description || enrichedSpec.rawPrompt || ''}
Tone: ${enrichedSpec.tone || blueprint.tone}
Target audience: ${enrichedSpec.targetAudience || 'professionals'}

CRITICAL:
- Every text, title, description must sound like it was written specifically for "${brandName}"
- NOT generic — make content unique to this exact business type
- Use the "${blueprint.heroVariant}" hero variant — do NOT change this
- Use "${blueprint.featureComponent}" for features — do NOT change this`;

  let layoutSpec = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callModel('plan_layout', userMessage, systemPrompt);
      let rawContent = result.content.trim();
      rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      let parsed = JSON.parse(rawContent);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      if (!parsed.sections || !Array.isArray(parsed.sections)) throw new Error('Missing sections array');

      parsed.sections = autoFixLayout(parsed.sections, enrichedSpec, blueprint);
      parsed.sections = applyDefaults(parsed.sections);
      parsed.sections = injectImages(parsed.sections, siteType);

      const { valid, errors } = validateLayoutSpec(parsed.sections);
      if (!valid) console.warn(`[LayoutPlanner] Validation warnings (attempt ${attempt}):`, errors);

      layoutSpec = parsed;
      console.log(`[LayoutPlanner] ✅ ${parsed.sections.length} sections planned (attempt ${attempt})`);
      break;
    } catch (e) {
      console.error(`[LayoutPlanner] Attempt ${attempt}/3 failed:`, e.message);
      if (attempt === 3) layoutSpec = buildFallbackLayout(enrichedSpec, blueprint);
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }

  return layoutSpec;
}

// ─────────────────────────────────────────────
// autoFixLayout — ONLY fills missing props, never overwrites AI content
// ─────────────────────────────────────────────
function autoFixLayout(sections, spec, blueprint) {
  const siteType = spec.siteType || 'default';
  const bp = blueprint || SITE_BLUEPRINTS[siteType] || SITE_BLUEPRINTS['default'];
  const images = getImagesForSiteType(siteType);
  const brandName = spec.businessName || 'My Business';

  return sections.map(section => {
    const props = { ...section.props };

    switch (section.component) {
      case 'NavBar':
        if (!props.brand) props.brand = brandName;
        if (!props.links || props.links.length === 0) {
          props.links = getSiteNavLinks(siteType);
        }
        if (!props.ctaText) props.ctaText = getSiteCtaText(siteType);
        if (!section.variant) section.variant = bp.navVariant || 'default';
        break;

      case 'HeroSection':
        if (!props.heading) props.heading = `Welcome to ${brandName}`;
        if (!props.subtext) props.subtext = spec.description || `Premium ${siteType} experience tailored for you.`;
        if (!props.ctaText) props.ctaText = getSiteCtaText(siteType);
        // NEVER override variant — use what AI or blueprint specified
        break;

      case 'BentoGrid':
        if (!props.heading) props.heading = 'What We Offer';
        // Only add items if completely missing — never replace AI-generated ones
        if (!props.items || props.items.length === 0) {
          props.items = getDefaultBentoItems(siteType, bp.iconSet);
        }
        break;

      case 'FeatureGrid':
        if (!props.heading) props.heading = 'Our Services';
        if (!props.items || props.items.length === 0) {
          props.items = getDefaultFeatureItems(siteType, bp.iconSet);
        }
        // Use the dedicated featureVariant, NOT the heroVariant
        if (!section.variant || section.variant === bp.heroVariant) {
          section.variant = bp.featureVariant || 'cards';
        }
        break;

      case 'PricingSection':
        if (!props.heading) props.heading = 'Simple Pricing';
        if (!props.plans || props.plans.length === 0) {
          props.plans = getDefaultPricingPlans(siteType);
        }
        break;

      case 'TestimonialSection':
        if (!props.heading) props.heading = 'What Our Clients Say';
        if (!props.items || props.items.length === 0) {
          props.items = getDefaultTestimonials(brandName);
        }
        if (!section.variant) section.variant = bp.testimonialVariant || 'default';
        break;

      case 'FAQSection':
        if (!props.heading) props.heading = 'Frequently Asked Questions';
        if (!props.items || props.items.length === 0) {
          props.items = getDefaultFAQ(siteType, brandName);
        }
        break;

      case 'AboutSection':
        if (!props.heading) props.heading = `About ${brandName}`;
        if (!props.description) props.description = spec.description || `${brandName} is dedicated to delivering excellence in every aspect of our work.`;
        break;

      case 'CTASection':
        if (!props.heading) props.heading = 'Ready to Get Started?';
        if (!props.ctaText) props.ctaText = getSiteCtaText(siteType);
        break;

      case 'ContactSection':
        if (!props.heading) props.heading = 'Get In Touch';
        break;

      case 'FooterSection':
        if (!props.brand) props.brand = brandName;
        if (!section.variant) section.variant = bp.footerVariant || 'default';
        break;
    }

    return { ...section, props };
  });
}

// ─────────────────────────────────────────────
// Site-specific helper functions
// ─────────────────────────────────────────────
function getSiteNavLinks(siteType) {
  const navLinks = {
    'saas': ['Features', 'Pricing', 'About', 'Blog', 'Contact'],
    'tech': ['Solutions', 'Products', 'About', 'Docs', 'Contact'],
    'agency': ['Work', 'Services', 'About', 'Process', 'Contact'],
    'portfolio': ['Work', 'About', 'Skills', 'Blog', 'Contact'],
    'restaurant': ['Menu', 'About', 'Reservations', 'Gallery', 'Contact'],
    'coffee-shop': ['Menu', 'About', 'Locations', 'Contact'],
    'gym': ['Programs', 'Trainers', 'Pricing', 'About', 'Contact'],
    'hotel': ['Rooms', 'Amenities', 'Gallery', 'About', 'Book Now'],
    'salon': ['Services', 'Gallery', 'Pricing', 'About', 'Book'],
    'medical': ['Services', 'Doctors', 'About', 'FAQ', 'Contact'],
    'education': ['Courses', 'Instructors', 'Pricing', 'About', 'Enroll'],
    'ecommerce': ['Shop', 'Collections', 'About', 'Blog', 'Contact'],
  };
  return navLinks[siteType] || ['Home', 'About', 'Services', 'Contact'];
}

function getSiteCtaText(siteType) {
  const ctas = {
    'saas': 'Start Free Trial',
    'tech': 'Get a Demo',
    'agency': 'Start a Project',
    'portfolio': 'Hire Me',
    'restaurant': 'Reserve a Table',
    'coffee-shop': 'Order Now',
    'gym': 'Join Today',
    'hotel': 'Book a Room',
    'salon': 'Book Appointment',
    'medical': 'Book Appointment',
    'education': 'Enroll Now',
    'ecommerce': 'Shop Now',
  };
  return ctas[siteType] || 'Get Started';
}

function getDefaultBentoItems(siteType, iconSet) {
  const bentoItems = {
    'saas': [
      { icon: iconSet[0] || 'Zap', title: 'Lightning Fast', description: 'Built for speed — sub-100ms response times guaranteed.', className: 'md:col-span-2' },
      { icon: iconSet[1] || 'Shield', title: 'Enterprise Security', description: 'SOC 2 certified with end-to-end encryption.' },
      { icon: iconSet[2] || 'Globe', title: 'Global Scale', description: 'Deploy across 40+ regions worldwide.' },
      { icon: iconSet[3] || 'Cpu', title: 'AI Powered', description: 'Intelligent automation that learns your workflow.', className: 'md:col-span-2' },
      { icon: iconSet[4] || 'Target', title: 'Real-time Analytics', description: 'Deep insights updated every second.' },
    ],
    'tech': [
      { icon: iconSet[0] || 'Cpu', title: 'Advanced Architecture', description: 'Built on cutting-edge distributed infrastructure.', className: 'md:col-span-2' },
      { icon: iconSet[1] || 'Shield', title: 'Security First', description: 'Zero-trust security model, always on.' },
      { icon: iconSet[2] || 'Globe', title: 'Global Network', description: 'Low latency access from anywhere.' },
      { icon: iconSet[3] || 'Zap', title: 'High Performance', description: 'Optimized for the most demanding workloads.', className: 'md:col-span-2' },
    ],
    'ecommerce': [
      { icon: iconSet[0] || 'ShoppingBag', title: 'Curated Collection', description: 'Handpicked products for the discerning buyer.', className: 'md:col-span-2' },
      { icon: iconSet[1] || 'Shield', title: 'Secure Checkout', description: 'Bank-grade security on every transaction.' },
      { icon: iconSet[2] || 'Truck', title: 'Fast Delivery', description: 'Same-day delivery in select cities.' },
      { icon: iconSet[3] || 'Star', title: 'Premium Quality', description: 'Every product quality-tested before listing.', className: 'md:col-span-2' },
    ],
  };
  return bentoItems[siteType] || bentoItems['saas'];
}

function getDefaultFeatureItems(siteType, iconSet) {
  const featureItems = {
    'restaurant': [
      { icon: iconSet[0] || 'UtensilsCrossed', title: 'Farm to Table', description: 'Ingredients sourced fresh daily from local farms.' },
      { icon: iconSet[1] || 'Wine', title: 'Curated Wine List', description: 'Over 200 selections from the world\'s finest vineyards.' },
      { icon: iconSet[2] || 'Star', title: 'Award Winning Chefs', description: 'Our team has earned 3 Michelin stars combined.' },
      { icon: iconSet[3] || 'Clock', title: 'Private Dining', description: 'Exclusive rooms for intimate gatherings and events.' },
    ],
    'gym': [
      { icon: iconSet[0] || 'Dumbbell', title: 'State-of-the-Art Equipment', description: 'Over 200 machines and free weights, updated annually.' },
      { icon: iconSet[1] || 'Users', title: 'Expert Trainers', description: 'Certified trainers with 10+ years of experience.' },
      { icon: iconSet[2] || 'Flame', title: 'Diverse Classes', description: 'HIIT, yoga, pilates, spin, and 30+ more classes weekly.' },
      { icon: iconSet[3] || 'Heart', title: 'Nutrition Coaching', description: 'Personalized meal plans and supplement guidance.' },
    ],
    'salon': [
      { icon: iconSet[0] || 'Scissors', title: 'Master Stylists', description: 'Award-winning stylists trained in Paris and Milan.' },
      { icon: iconSet[1] || 'Sparkles', title: 'Premium Products', description: 'Exclusive use of Kerastase, Oribe, and Davines.' },
      { icon: iconSet[2] || 'Clock', title: 'Easy Booking', description: 'Online scheduling, 7 days a week, no waiting.' },
      { icon: iconSet[3] || 'Heart', title: 'Luxury Experience', description: 'Complimentary drinks and consultation with every visit.' },
    ],
    'medical': [
      { icon: iconSet[0] || 'Shield', title: 'Board Certified', description: 'All physicians are board certified in their specialty.' },
      { icon: iconSet[1] || 'Clock', title: 'Same-Day Appointments', description: 'Urgent care available with minimal wait times.' },
      { icon: iconSet[2] || 'Heart', title: 'Patient-First Care', description: 'Compassionate care tailored to every individual.' },
      { icon: iconSet[3] || 'Activity', title: 'Advanced Diagnostics', description: 'In-house MRI, CT, and laboratory services.' },
    ],
    'agency': [
      { icon: iconSet[0] || 'Pen', title: 'Brand Strategy', description: 'We build brand identities that stand out and endure.' },
      { icon: iconSet[1] || 'Layout', title: 'UI/UX Design', description: 'Interfaces that users love and businesses rely on.' },
      { icon: iconSet[2] || 'TrendingUp', title: 'Growth Marketing', description: 'Data-driven campaigns that scale revenue, not just traffic.' },
      { icon: iconSet[3] || 'Code', title: 'Development', description: 'Pixel-perfect builds shipped on time, every time.' },
    ],
    'hotel': [
      { icon: iconSet[0] || 'Star', title: 'Luxury Suites', description: 'Spacious suites with panoramic city and ocean views.' },
      { icon: iconSet[1] || 'Utensils', title: 'Fine Dining', description: 'Two on-site restaurants with award-winning menus.' },
      { icon: iconSet[2] || 'Wifi', title: 'Business Center', description: 'Full conference facilities and high-speed connectivity.' },
      { icon: iconSet[3] || 'Star', title: 'Spa & Wellness', description: 'Full-service spa with indoor pool and fitness center.' },
    ],
  };
  return featureItems[siteType] || [
    { icon: iconSet[0] || 'Zap', title: 'Quality Service', description: 'We deliver the highest quality in everything we do.' },
    { icon: iconSet[1] || 'Users', title: 'Expert Team', description: 'Experienced professionals dedicated to your success.' },
    { icon: iconSet[2] || 'Shield', title: 'Trusted & Reliable', description: 'Thousands of satisfied clients trust us every day.' },
    { icon: iconSet[3] || 'Star', title: 'Award Winning', description: 'Recognized excellence across our industry.' },
  ];
}

function getDefaultPricingPlans(siteType) {
  const plans = {
    'saas': [
      { name: 'Starter', price: '$29', features: ['Up to 5 users', '10GB storage', 'Basic analytics', 'Email support'], ctaText: 'Start Free Trial' },
      { name: 'Pro', price: '$79', features: ['Unlimited users', '100GB storage', 'Advanced analytics', 'Priority support', 'API access', 'Custom integrations'], ctaText: 'Start Free Trial', isPopular: true },
      { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated infrastructure', 'SLA guarantee', '24/7 phone support', 'Custom contracts'], ctaText: 'Contact Sales' },
    ],
    'gym': [
      { name: 'Basic', price: '$29', features: ['Gym floor access', 'Locker room', '2 guest passes/month'], ctaText: 'Join Now' },
      { name: 'Premium', price: '$59', features: ['All Basic features', 'Unlimited group classes', 'Nutrition consultation', 'Personal trainer session'], ctaText: 'Join Now', isPopular: true },
      { name: 'Elite', price: '$99', features: ['All Premium features', 'Unlimited PT sessions', 'Priority booking', 'Meal plan included'], ctaText: 'Join Now' },
    ],
    'salon': [
      { name: 'Essential', price: '$50', features: ['Haircut & style', 'Blow dry', 'Basic consultation'], ctaText: 'Book Now' },
      { name: 'Signature', price: '$120', features: ['Cut, color & style', 'Deep conditioning', 'Scalp treatment', 'Complimentary toner'], ctaText: 'Book Now', isPopular: true },
      { name: 'Luxury', price: '$200', features: ['Full transformation', 'Balayage or highlights', 'Keratin treatment', 'Take-home kit'], ctaText: 'Book Now' },
    ],
    'education': [
      { name: 'Self-Paced', price: '$49', features: ['Access to all courses', 'Community forum', 'Certificate of completion'], ctaText: 'Enroll Now' },
      { name: 'Guided', price: '$149', features: ['Live weekly sessions', 'Mentor feedback', 'Career coaching', '1-on-1 office hours'], ctaText: 'Enroll Now', isPopular: true },
      { name: 'Bootcamp', price: '$499', features: ['Immersive program', 'Job placement support', 'Real projects', 'Lifetime access'], ctaText: 'Apply Now' },
    ],
  };
  return plans[siteType] || plans['saas'];
}

function getDefaultTestimonials(brandName) {
  return [
    { quote: `${brandName} completely exceeded our expectations. The quality and attention to detail is unmatched.`, name: 'Sarah Chen', role: 'CEO, Nexus Group', rating: 5 },
    { quote: `We've been loyal customers for 3 years. The team is responsive, professional, and genuinely cares about results.`, name: 'Marcus Webb', role: 'Director of Operations', rating: 5 },
    { quote: `Best decision we made this year. The ROI has been exceptional and the experience flawless from day one.`, name: 'Priya Sharma', role: 'Founder, LaunchPad', rating: 5 },
  ];
}

function getDefaultFAQ(siteType, brandName) {
  const faqs = {
    'saas': [
      { question: 'Is there a free trial?', answer: `Yes! ${brandName} offers a 14-day free trial with full access to all Pro features — no credit card required.` },
      { question: 'Can I cancel anytime?', answer: 'Absolutely. Cancel your subscription at any time with no cancellation fees or hidden charges.' },
      { question: 'How secure is my data?', answer: 'We use AES-256 encryption, SOC 2 Type II certification, and daily backups to keep your data safe.' },
      { question: 'Do you offer custom enterprise plans?', answer: 'Yes, we offer custom pricing and dedicated infrastructure for teams over 50. Contact our sales team.' },
      { question: 'What integrations are available?', answer: 'We integrate with 100+ tools including Slack, Salesforce, HubSpot, Zapier, and all major cloud providers.' },
    ],
    'gym': [
      { question: 'Do I need to sign a contract?', answer: 'No long-term contracts required. All memberships are month-to-month with no cancellation fees.' },
      { question: 'What are your opening hours?', answer: 'We are open 24/7 for members. Staffed hours are Monday-Friday 6am-10pm, weekends 7am-8pm.' },
      { question: 'Are personal trainers included?', answer: 'Personal training sessions are included in our Premium and Elite plans, or available as add-ons.' },
      { question: 'Is there parking available?', answer: 'Yes, free parking is available for all members in our dedicated lot adjacent to the facility.' },
    ],
  };
  return faqs[siteType] || faqs['saas'];
}

// ─────────────────────────────────────────────
// Image injection — updated to handle missing/placeholder images
// ─────────────────────────────────────────────
function injectImages(sections, siteType) {
  const images = getImagesForSiteType(siteType);
  let imageIndex = 0;

  return sections.map(section => {
    const props = { ...section.props };

    // Function to get next image from library
    const nextImg = () => {
      const img = images[imageIndex % images.length];
      imageIndex++;
      return img;
    };

    // Helper to check if image is missing or a placeholder/hallucination
    const isMissing = (url) => {
      if (!url || typeof url !== 'string') return true;
      const clean = url.trim().toLowerCase();
      return (
        !clean.startsWith('http') || 
        clean.includes('placeholder') || 
        clean.includes('placehold') || 
        clean.includes('undefined') ||
        clean.includes('[') || // Catch "[Image of ...]"
        clean.length < 10      // Catch extremely short "made up" strings
      );
    };

    if (section.component === 'HeroSection') {
      if (isMissing(props.bgImage)) {
        props.bgImage = nextImg();
      }
    }

    if (section.component === 'AboutSection') {
      if (isMissing(props.image)) {
        props.image = nextImg();
      }
    }

    if (section.component === 'PortfolioSection' && Array.isArray(props.items)) {
      props.items = props.items.map(item => {
        if (isMissing(item.image)) {
          return { ...item, image: nextImg() };
        }
        return item;
      });
    }

    if (section.component === 'BentoGrid' && Array.isArray(props.items)) {
      props.items = props.items.map(item => {
        if (isMissing(item.header)) {
          return { ...item, header: nextImg() };
        }
        return item;
      });
    }

    if (section.component === 'FeatureGrid' && Array.isArray(props.items)) {
      props.items = props.items.map(item => {
        if (item.image && isMissing(item.image)) {
          return { ...item, image: nextImg() };
        }
        return item;
      });
    }

    if (section.component === 'StickyScroll' && Array.isArray(props.items)) {
      props.items = props.items.map(item => {
        if (isMissing(item.content)) {
          return { ...item, content: nextImg() };
        }
        return item;
      });
    }

    return { ...section, props };
  });
}

// ─────────────────────────────────────────────
// Fallback — siteType-aware, never the same
// ─────────────────────────────────────────────
function buildFallbackLayout(spec, blueprint) {
  const brandName = spec.businessName || 'My Website';
  const siteType = spec.siteType || 'default';
  const bp = blueprint || SITE_BLUEPRINTS[siteType] || SITE_BLUEPRINTS['default'];
  const images = getImagesForSiteType(siteType);

  const baseSections = [
    {
      component: 'NavBar',
      variant: 'transparent',
      props: { brand: brandName, links: getSiteNavLinks(siteType), ctaText: getSiteCtaText(siteType) },
    },
    {
      component: 'HeroSection',
      variant: bp.heroVariant,  // ← siteType-specific hero
      props: {
        heading: spec.contentHints?.heroHeading || `Welcome to ${brandName}`,
        subtext: spec.contentHints?.heroSubtext || spec.description || `Premium ${siteType.replace(/-/g, ' ')} experience built for you.`,
        ctaText: spec.contentHints?.ctaButtonText || getSiteCtaText(siteType),
        secondaryCtaText: 'Learn More',
        badgeText: `✦ ${brandName}`,
        bgImage: images[0],
      },
    },
    {
      component: bp.featureComponent,  // ← BentoGrid or FeatureGrid per siteType
      props: {
        heading: 'What We Offer',
        subtext: `Everything you need, crafted specifically for ${siteType.replace(/-/g, ' ')} excellence.`,
        items: bp.featureComponent === 'BentoGrid'
          ? getDefaultBentoItems(siteType, bp.iconSet)
          : getDefaultFeatureItems(siteType, bp.iconSet),
      },
    },
    {
      component: 'AboutSection',
      variant: 'story',
      props: {
        heading: `About ${brandName}`,
        description: spec.description || `${brandName} was built with a singular mission: to redefine what's possible in ${siteType.replace(/-/g, ' ')}. Every detail is crafted with intention, every experience designed to exceed expectations.`,
        image: images[1] || images[0],
        stats: [
          { value: '500+', label: 'Happy Clients' },
          { value: '10+', label: 'Years Experience' },
          { value: '98%', label: 'Satisfaction Rate' },
        ],
      },
    },
    {
      component: 'TestimonialSection',
      variant: 'cards',
      props: {
        heading: 'Trusted by Thousands',
        subtext: 'Real stories from real customers',
        items: getDefaultTestimonials(brandName),
      },
    },
    {
      component: 'CTASection',
      variant: 'banner',
      props: {
        heading: 'Ready to Get Started?',
        subtext: `Join hundreds of satisfied customers who chose ${brandName}.`,
        ctaText: getSiteCtaText(siteType),
        ctaLink: '#contact',
      },
    },
    {
      component: 'ContactSection',
      variant: 'splitForm',
      props: {
        heading: 'Get In Touch',
        subtext: "We'd love to hear from you.",
      },
    },
    {
      component: 'FooterSection',
      variant: 'withLinks',
      props: {
        brand: brandName,
        description: `${brandName} — redefining ${siteType.replace(/-/g, ' ')} excellence.`,
        socialLinks: ['twitter', 'instagram', 'linkedin'],
      },
    },
  ];

  return {
    meta: {
      title: `${brandName} — ${siteType.replace(/-/g, ' ')} website`,
      description: spec.description || `Welcome to ${brandName}.`,
    },
    sections: applyDefaults(baseSections),
  };
}

module.exports = { planLayout, buildFallbackLayout };