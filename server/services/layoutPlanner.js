/**
 * Layout Planner — AI-powered component selection and content generation
 * 
 * This replaces the old "AI writes ALL code" approach.
 * Instead, AI only decides:
 *   1. Which pre-built components to use
 *   2. Which variant of each component
 *   3. What content (text, images) to fill into each
 * 
 * The prompt is ~2KB instead of ~85KB, making it fast and reliable.
 */

const { callModel } = require('./modelRouter.js');
const { getComponentCatalog, validateLayoutSpec, applyDefaults, getImagesForSiteType } = require('../component-kit/registry.js');

/**
 * Plan a website layout from an enriched spec.
 * 
 * @param {object} enrichedSpec - Output from PromptEnhancer
 * @returns {object} Layout spec: { sections: [...], meta: {...} }
 */
async function planLayout(enrichedSpec) {
  const catalog = getComponentCatalog();
  const siteType = enrichedSpec.siteType || 'default';
  const images = getImagesForSiteType(siteType);
  const brandName = enrichedSpec.businessName || 'My Business';

  const systemPrompt = `You are a website layout planner. Given a website request, select pre-built components and fill them with real content.

AVAILABLE COMPONENTS:
${catalog.map(c => `- ${c.name} (variants: ${c.variants.join(', ')})
  Required props: ${c.requiredProps.join(', ')}
  Optional props: ${c.optionalProps.join(', ')}
  ${c.itemSchema ? `Item schema: ${JSON.stringify(c.itemSchema)}` : ''}`).join('\n')}

STRICT RULES:
1. ALWAYS start with NavBar and end with FooterSection
2. ALWAYS include HeroSection as the second component
3. Include 6-8 sections total (NavBar, HeroSection, FeatureGrid, AboutSection or TestimonialSection, CTASection, ContactSection, FooterSection)
4. Fill ALL required props with real, meaningful content. NEVER leave any prop empty or null.
5. NavBar "links" MUST be a flat array of STRINGS like ["Home", "About", "Services", "Contact"]. NOT objects.
6. FooterSection "socialLinks" MUST be a flat array of STRINGS like ["twitter", "instagram", "linkedin"]. NOT objects.
7. For FeatureGrid items, provide EXACTLY 4-6 items. Each MUST have: icon (from: Zap, Shield, Globe, Heart, Users, Target, Award, Coffee, Sparkles, Clock), title (string), description (string 15-25 words).
8. For TestimonialSection items, provide EXACTLY 3 testimonials. Each MUST have: quote (30+ words), name (string), role (string), rating (number 4-5).
9. For AboutSection: MUST include a "description" prop with 40+ words AND a "stats" array with 3 items [{value:"500+", label:"Happy Clients"}].
10. For CTASection: MUST include both "heading" AND "subtext" AND "ctaText".
11. HeroSection: ALWAYS use variant "fullImage" or "split". MUST include "badgeText", "heading", "subtext", "ctaText", "secondaryCtaText".

USE THESE REAL IMAGES (pick relevant ones):
${images.map((url, i) => `- image_${i}: ${url}`).join('\n')}

Return ONLY valid JSON (no markdown fences, no explanation):
{
  "meta": { "title": "Page Title — Business Name", "description": "SEO description" },
  "sections": [
    { "component": "NavBar", "variant": "transparent", "props": { "brand": "Name", "links": ["Home", "About", "Services", "Contact"], "ctaText": "Get Started" } },
    { "component": "HeroSection", "variant": "fullImage", "props": { "heading": "...", "subtext": "...", "ctaText": "...", "badgeText": "...", "bgImage": "${images[0]}", "secondaryCtaText": "Learn More" } },
    ...more sections...
  ]
}`;

  const userMessage = `Plan the layout for this website:

Business: "${brandName}"
Type: ${siteType}
Theme: ${enrichedSpec.themeName || 'Modern Dark'}
Description: ${enrichedSpec.description || enrichedSpec.rawPrompt || 'A professional website'}
Target Audience: ${enrichedSpec.targetAudience || 'general audience'}
Tone: ${enrichedSpec.tone || 'professional'}
Tagline: ${enrichedSpec.tagline || ''}
Requested Sections: ${(enrichedSpec.sections || []).join(', ')}

Content hints:
${enrichedSpec.contentHints ? JSON.stringify(enrichedSpec.contentHints) : 'Generate appropriate content based on the business type.'}

CRITICAL: 
- Fill EVERY text prop with rich, specific content for "${brandName}" (a ${siteType} business). 
- NEVER leave any section empty. Each section must have visible, meaningful content.
- NavBar links must be STRINGS: ["Home", "About", ...] NOT objects.
- Use the provided image URLs for bgImage and image props.`;

  let layoutSpec = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callModel('plan_layout', userMessage, systemPrompt);
      
      // Clean the response (remove markdown fences if present)
      let rawContent = result.content.trim();
      rawContent = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      
      let parsed = JSON.parse(rawContent);

      // Handle double-serialization edge case
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Missing "sections" array in layout spec');
      }

      // ALWAYS auto-fix to ensure no empty sections
      parsed.sections = autoFixLayout(parsed.sections, enrichedSpec);

      // Apply defaults for missing optional props
      parsed.sections = applyDefaults(parsed.sections);

      // Inject real images based on site type
      parsed.sections = injectImages(parsed.sections, siteType);

      // Validate after all fixes
      const { valid, errors } = validateLayoutSpec(parsed.sections);
      if (!valid) {
        console.warn(`[LayoutPlanner] Validation warnings after auto-fix (attempt ${attempt}):`, errors);
      }

      layoutSpec = parsed;
      console.log(`[LayoutPlanner] ✅ Layout planned — ${parsed.sections.length} sections (attempt ${attempt})`);
      break;
    } catch (e) {
      console.error(`[LayoutPlanner] Attempt ${attempt}/3 failed:`, e.message);
      if (attempt === 3) {
        console.warn('[LayoutPlanner] All attempts failed, using fallback layout');
        layoutSpec = buildFallbackLayout(enrichedSpec);
      }
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }

  return layoutSpec;
}

/**
 * Auto-fix a layout by filling in missing/empty required props.
 * ALWAYS runs (not just on validation failure) to guarantee no empty sections.
 */
function autoFixLayout(sections, spec) {
  const siteType = spec.siteType || 'default';
  const images = getImagesForSiteType(siteType);
  const brandName = spec.businessName || 'My Business';

  return sections.map(section => {
    const props = { ...section.props };

    switch (section.component) {
      case 'NavBar':
        if (!props.brand) props.brand = brandName;
        // Fix links: ensure they are strings
        if (props.links && Array.isArray(props.links)) {
          props.links = props.links.map(l => {
            if (typeof l === 'string') return l;
            if (typeof l === 'object' && l) return l.name || l.label || l.title || l.text || 'Link';
            return String(l);
          });
        } else {
          props.links = ['Home', 'About', 'Services', 'Contact'];
        }
        if (!props.ctaText) props.ctaText = 'Get Started';
        break;

      case 'HeroSection':
        if (!props.heading) props.heading = spec.contentHints?.heroHeading || `Welcome to ${brandName}`;
        if (!props.subtext) props.subtext = spec.contentHints?.heroSubtext || spec.description || `Discover what makes ${brandName} special. We deliver excellence in everything we do, combining innovation with dedication to create remarkable experiences.`;
        if (!props.ctaText) props.ctaText = spec.contentHints?.ctaButtonText || 'Get Started';
        if (!props.bgImage) props.bgImage = images[0];
        if (!props.badgeText) props.badgeText = `✨ Welcome to ${brandName}`;
        if (!props.secondaryCtaText) props.secondaryCtaText = 'Learn More';
        break;

      case 'FeatureGrid':
        if (!props.heading) props.heading = 'What We Offer';
        if (!props.subtext) props.subtext = `Everything you need from ${brandName}`;
        if (!props.items || !Array.isArray(props.items) || props.items.length === 0) {
          props.items = [
            { icon: 'Zap', title: 'Lightning Fast', description: 'Optimized performance and speed that keeps you ahead of the competition.' },
            { icon: 'Shield', title: 'Secure & Reliable', description: 'Enterprise-grade security that protects your data and gives you peace of mind.' },
            { icon: 'Heart', title: 'Customer First', description: 'We put our customers at the heart of everything we build and deliver.' },
            { icon: 'Globe', title: 'Global Reach', description: 'Connect with customers worldwide, anytime, anywhere with our platform.' },
          ];
        } else {
          // Fix items: ensure each has all required fields
          props.items = props.items.map(item => ({
            icon: item.icon || 'Zap',
            title: item.title || item.name || 'Feature',
            description: item.description || item.desc || item.text || 'A great feature that adds value.',
          }));
        }
        break;

      case 'TestimonialSection':
        if (!props.heading) props.heading = 'What Our Clients Say';
        if (!props.subtext) props.subtext = 'Real stories from real customers';
        if (!props.items || !Array.isArray(props.items) || props.items.length === 0) {
          props.items = [
            { quote: 'Absolutely outstanding service. They exceeded all our expectations and delivered on time. Highly recommended!', name: 'Sarah Johnson', role: 'CEO, TechVentures', rating: 5 },
            { quote: 'The best decision we made for our business this year. The quality of work is simply exceptional.', name: 'Michael Chen', role: 'Founder, StartupLab', rating: 5 },
            { quote: 'Professional, responsive, and incredibly talented team. A pleasure to work with from start to finish.', name: 'Emily Rodriguez', role: 'Director, Creative Co', rating: 5 },
          ];
        } else {
          // Fix items: ensure each has all required fields
          props.items = props.items.map(item => ({
            quote: item.quote || item.text || item.review || 'Great service and excellent results!',
            name: item.name || item.author || 'Happy Customer',
            role: item.role || item.title || item.position || 'Customer',
            rating: item.rating || item.stars || 5,
          }));
        }
        break;

      case 'AboutSection':
        if (!props.heading) props.heading = `About ${brandName}`;
        if (!props.description) props.description = spec.description || `${brandName} was founded with a simple mission: to deliver exceptional products and services that make a real difference. Our passionate team combines innovation with expertise to help our clients achieve their goals and grow beyond their expectations.`;
        if (!props.image) props.image = images[1] || images[0];
        if (!props.stats || !Array.isArray(props.stats) || props.stats.length === 0) {
          props.stats = [
            { value: '500+', label: 'Happy Clients' },
            { value: '10+', label: 'Years Experience' },
            { value: '50+', label: 'Projects Completed' },
          ];
        }
        break;

      case 'CTASection':
        if (!props.heading) props.heading = 'Ready to Get Started?';
        if (!props.subtext) props.subtext = `Join hundreds of satisfied customers who trust ${brandName}. Start your journey today.`;
        if (!props.ctaText) props.ctaText = 'Contact Us Today';
        if (!props.ctaLink) props.ctaLink = '#contact';
        break;

      case 'ContactSection':
        if (!props.heading) props.heading = 'Get In Touch';
        if (!props.subtext) props.subtext = "We'd love to hear from you. Send us a message and we'll respond as soon as possible.";
        break;

      case 'FooterSection':
        if (!props.brand) props.brand = brandName;
        if (!props.description) props.description = `${brandName} — delivering excellence since day one.`;
        // Fix socialLinks: ensure they are strings
        if (props.socialLinks && Array.isArray(props.socialLinks)) {
          props.socialLinks = props.socialLinks.map(s => {
            if (typeof s === 'string') return s;
            if (typeof s === 'object' && s) return s.name || s.platform || s.type || 'globe';
            return String(s);
          });
        }
        break;
    }

    return { ...section, props };
  });
}

/**
 * Inject real Unsplash images into all sections that need them
 */
function injectImages(sections, siteType) {
  const images = getImagesForSiteType(siteType);
  let imageIndex = 0;

  return sections.map(section => {
    const props = { ...section.props };

    // Hero background image
    if (section.component === 'HeroSection') {
      if (!props.bgImage || props.bgImage.includes('placeholder') || props.bgImage.includes('placehold')) {
        props.bgImage = images[imageIndex % images.length];
        imageIndex++;
      }
    }

    // About section image
    if (section.component === 'AboutSection') {
      if (!props.image || props.image.includes('placeholder') || props.image.includes('placehold')) {
        props.image = images[imageIndex % images.length];
        imageIndex++;
      }
    }

    // Testimonial avatars — generate initials-based, no need for image URLs
    // (the renderer already handles missing avatars with initial circles)

    return { ...section, props };
  });
}

/**
 * Build a sensible fallback layout when AI fails completely
 */
function buildFallbackLayout(spec) {
  const brandName = spec.businessName || 'My Website';
  const siteType = spec.siteType || 'default';
  const images = getImagesForSiteType(siteType);

  return {
    meta: {
      title: `${brandName} — Official Website`,
      description: spec.description || `Welcome to ${brandName}. Discover our services and get in touch.`,
    },
    sections: applyDefaults([
      {
        component: 'NavBar',
        variant: 'transparent',
        props: { brand: brandName, links: ['Home', 'Features', 'About', 'Contact'], ctaText: 'Get Started' },
      },
      {
        component: 'HeroSection',
        variant: 'fullImage',
        props: {
          heading: spec.contentHints?.heroHeading || `Welcome to ${brandName}`,
          subtext: spec.contentHints?.heroSubtext || spec.description || `Discover what makes ${brandName} special. We deliver excellence in everything we do, combining innovation with dedication to create remarkable experiences for our customers.`,
          ctaText: spec.contentHints?.ctaButtonText || 'Get Started',
          secondaryCtaText: 'Learn More',
          badgeText: `✨ Welcome to ${brandName}`,
          bgImage: images[0],
        },
      },
      {
        component: 'FeatureGrid',
        variant: 'cards',
        props: {
          heading: 'Why Choose Us',
          subtext: 'Everything you need to succeed',
          items: [
            { icon: 'Zap', title: 'Lightning Fast', description: 'Optimized for speed and performance from the ground up.' },
            { icon: 'Shield', title: 'Secure & Reliable', description: 'Enterprise-grade security that scales with your business.' },
            { icon: 'Heart', title: 'Made with Care', description: 'Every detail is crafted with passion and precision.' },
            { icon: 'Globe', title: 'Global Reach', description: 'Connect with customers worldwide, anytime, anywhere.' },
          ],
        },
      },
      {
        component: 'AboutSection',
        variant: 'story',
        props: {
          heading: `About ${brandName}`,
          description: spec.description || `${brandName} was founded with a simple mission: to deliver exceptional products and services that make a real difference. Our passionate team combines innovation with expertise to help our clients succeed and grow beyond their expectations.`,
          image: images[1] || images[0],
          stats: [
            { value: '500+', label: 'Happy Clients' },
            { value: '10+', label: 'Years Experience' },
            { value: '50+', label: 'Projects Completed' },
          ],
        },
      },
      {
        component: 'TestimonialSection',
        variant: 'cards',
        props: {
          heading: 'What Our Clients Say',
          subtext: 'Real stories from real customers',
          items: [
            { quote: 'Absolutely outstanding service. They exceeded all our expectations and delivered on time. Would definitely recommend!', name: 'Sarah Johnson', role: 'CEO, TechVentures', rating: 5 },
            { quote: 'The best decision we made for our business this year. The quality of work is simply exceptional and unmatched.', name: 'Michael Chen', role: 'Founder, StartupLab', rating: 5 },
            { quote: 'Professional, responsive, and incredibly talented team. A pleasure to work with from start to finish.', name: 'Emily Rodriguez', role: 'Director, Creative Co', rating: 5 },
          ],
        },
      },
      {
        component: 'CTASection',
        variant: 'banner',
        props: {
          heading: 'Ready to Get Started?',
          subtext: `Join hundreds of satisfied customers who trust ${brandName}. Start your journey today.`,
          ctaText: 'Contact Us Today',
          ctaLink: '#contact',
        },
      },
      {
        component: 'ContactSection',
        variant: 'splitForm',
        props: {
          heading: 'Get In Touch',
          subtext: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.",
        },
      },
      {
        component: 'FooterSection',
        variant: 'withLinks',
        props: {
          brand: brandName,
          description: spec.description || `${brandName} — delivering excellence since day one.`,
          socialLinks: ['twitter', 'instagram', 'linkedin'],
        },
      },
    ]),
  };
}

module.exports = { planLayout, buildFallbackLayout };
