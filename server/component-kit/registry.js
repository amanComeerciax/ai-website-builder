/**
 * Component Registry — Central catalog of all pre-built components
 * 
 * Each entry defines:
 *   - variants: available visual styles
 *   - requiredProps: props AI MUST provide
 *   - optionalProps: props AI CAN provide
 *   - defaultProps: fallback values
 * 
 * The AI Layout Planner uses this registry to select components
 * and fill them with content from the user's prompt.
 */

const COMPONENT_REGISTRY = {
  NavBar: {
    variants: ['transparent', 'solid'],
    requiredProps: ['brand'],
    optionalProps: ['links', 'ctaText', 'ctaLink', 'logoUrl'],
    defaultProps: {
      links: ['Home', 'About', 'Services', 'Contact'],
      ctaText: 'Get Started',
      ctaLink: '#contact',
    },
    description: 'Navigation bar with logo, links, and optional CTA button',
  },

  HeroSection: {
    variants: ['centered', 'split', 'fullImage', 'glass', 'parallax', 'aurora', 'sparkles', 'salient', 'radiant', 'stuxen'],
    requiredProps: ['heading', 'subtext', 'ctaText'],
    optionalProps: ['ctaLink', 'bgImage', 'secondaryCtaText', 'secondaryCtaLink', 'badgeText'],
    defaultProps: {
      ctaLink: '#contact',
      bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    },
    description: 'Hero section with heading, subtext, CTA, and background image. Aurora and Sparkles variants provide high-end animated backgrounds.',
  },

  BentoGrid: {
    variants: ['modern', 'glass'],
    requiredProps: ['heading', 'items'],
    optionalProps: ['subtext'],
    defaultProps: {
      subtext: 'Discover our multifaceted solutions',
    },
    description: 'Modern Bento-style grid for features or projects with variable card sizes.',
    itemSchema: {
      title: 'string',
      description: 'string',
      header: 'string (optional image or graphic)',
      icon: 'string (lucide icon name)',
      className: 'string (optional layout hint: md:col-span-2 etc)',
    },
  },

  StickyScroll: {
    variants: ['default'],
    requiredProps: ['items'],
    optionalProps: ['heading'],
    defaultProps: {
      heading: 'How it Works',
    },
    description: 'Scroll-triggered content reveal where images change as you scroll through text blocks.',
    itemSchema: {
      title: 'string',
      description: 'string',
      content: 'string (image URL or component)',
    },
  },

  FeatureGrid: {
    variants: ['cards', 'icons', 'glass', 'salient', 'radiant'],
    requiredProps: ['heading', 'items'],
    optionalProps: ['subtext'],
    defaultProps: {
      subtext: '',
    },
    description: 'Grid of feature cards with icon, title, and description',
    itemSchema: {
      icon: 'string (lucide icon name)',
      title: 'string',
      description: 'string',
    },
  },

  PricingSection: {
    variants: ['cards', 'glass'],
    requiredProps: ['heading', 'plans'],
    optionalProps: ['subtext'],
    defaultProps: {
      subtext: 'Choose the plan that works best for you',
    },
    description: 'Pricing comparison table',
    itemSchema: {
      name: 'string',
      price: 'string',
      features: 'string[]',
      ctaText: 'string',
      isPopular: 'boolean',
    },
  },

  PortfolioSection: {
    variants: ['grid', 'masonry'],
    requiredProps: ['heading', 'items'],
    optionalProps: ['subtext'],
    defaultProps: {
      subtext: 'Our latest work',
    },
    description: 'Gallery of projects or images',
    itemSchema: {
      title: 'string',
      category: 'string',
      image: 'string',
    },
  },

  FAQSection: {
    variants: ['accordion'],
    requiredProps: ['heading', 'items'],
    optionalProps: ['subtext'],
    defaultProps: {
      subtext: 'Frequently asked questions',
    },
    description: 'FAQ section with expandable answers',
    itemSchema: {
      question: 'string',
      answer: 'string',
    },
  },

  TestimonialSection: {
    variants: ['cards', 'glass'],
    requiredProps: ['heading', 'items'],
    optionalProps: ['subtext'],
    defaultProps: {
      subtext: 'What our customers say',
    },
    description: 'Customer testimonials with quote, name, role, and rating',
    itemSchema: {
      quote: 'string',
      name: 'string',
      role: 'string',
      rating: 'number (1-5)',
      avatar: 'string (image URL, optional)',
    },
  },

  AboutSection: {
    variants: ['story', 'glass'],
    requiredProps: ['heading', 'description'],
    optionalProps: ['image', 'stats'],
    defaultProps: {
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    },
    description: 'About section with story text, image, and optional stats',
    statsSchema: {
      label: 'string',
      value: 'string',
    },
  },

  CTASection: {
    variants: ['banner', 'glass'],
    requiredProps: ['heading', 'ctaText'],
    optionalProps: ['subtext', 'ctaLink', 'secondaryCtaText'],
    defaultProps: {
      ctaLink: '#contact',
    },
    description: 'Full-width call-to-action banner',
  },

  ContactSection: {
    variants: ['splitForm', 'glass'],
    requiredProps: ['heading'],
    optionalProps: ['subtext', 'email', 'phone', 'address'],
    defaultProps: {
      subtext: 'Get in touch with us',
      email: 'hello@example.com',
      phone: '+1 (555) 000-0000',
      address: '123 Main Street, City, State 12345',
    },
    description: 'Contact form with info sidebar',
  },

  FooterSection: {
    variants: ['simple', 'withLinks'],
    requiredProps: ['brand'],
    optionalProps: ['description', 'links', 'socialLinks', 'copyright'],
    defaultProps: {
      copyright: `© ${new Date().getFullYear()} All rights reserved.`,
      socialLinks: ['twitter', 'github', 'linkedin'],
    },
    description: 'Footer with brand, links, and social icons',
  },

  // ── Phase 2 Components (to be added later) ──
  // MenuGrid, PricingTable, TeamSection, GallerySection, FAQSection,
  // StatsSection, NewsletterSection
};

/**
 * Unsplash image library organized by category.
 * Used by the layout planner to assign relevant images.
 */
const IMAGE_LIBRARY = {
  'coffee-shop': [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  ],
  'restaurant': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  ],
  'saas': [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551288049-bbbda5012375?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
  ],
  'agency': [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
  ],
  'ecommerce': [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
  ],
  'tech': [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
  ],
  'portfolio': [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
  ],
  'gym': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80',
  ],
  'salon': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
  ],
  'hotel': [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
  ],
  'medical': [
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
  ],
  'education': [
    'https://images.unsplash.com/photo-1523050854058-8df90110c476?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
  ],
  'default': [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
  ],
};

/**
 * Get all component names and their metadata for the AI prompt
 */
function getComponentCatalog() {
  const catalog = [];
  for (const [name, meta] of Object.entries(COMPONENT_REGISTRY)) {
    catalog.push({
      name,
      variants: meta.variants,
      requiredProps: meta.requiredProps,
      optionalProps: meta.optionalProps || [],
      description: meta.description,
      itemSchema: meta.itemSchema || null,
    });
  }
  return catalog;
}

/**
 * Validate a layout spec against the registry
 * @param {Array} sections - Array of { component, variant, props }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLayoutSpec(sections) {
  const errors = [];

  if (!Array.isArray(sections) || sections.length === 0) {
    return { valid: false, errors: ['Layout spec must be a non-empty array of sections'] };
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const { component, variant, props } = section;

    // Check component exists
    const meta = COMPONENT_REGISTRY[component];
    if (!meta) {
      errors.push(`Section ${i}: Unknown component "${component}". Available: ${Object.keys(COMPONENT_REGISTRY).join(', ')}`);
      continue;
    }

    // Check variant exists
    if (variant && !meta.variants.includes(variant)) {
      errors.push(`Section ${i}: Unknown variant "${variant}" for ${component}. Available: ${meta.variants.join(', ')}`);
    }

    // Check required props
    for (const prop of meta.requiredProps) {
      if (!props || props[prop] === undefined || props[prop] === null || props[prop] === '') {
        errors.push(`Section ${i} (${component}): Missing required prop "${prop}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Fill missing props with defaults
 * @param {Array} sections
 * @returns {Array} Sections with defaults applied
 */
function applyDefaults(sections) {
  return sections.map(section => {
    const meta = COMPONENT_REGISTRY[section.component];
    if (!meta) return section;

    const mergedProps = { ...meta.defaultProps, ...(section.props || {}) };
    return {
      ...section,
      variant: section.variant || meta.variants[0],
      props: mergedProps,
    };
  });
}

/**
 * Get images for a site type
 */
function getImagesForSiteType(siteType) {
  return IMAGE_LIBRARY[siteType] || IMAGE_LIBRARY['default'];
}

module.exports = {
  COMPONENT_REGISTRY,
  IMAGE_LIBRARY,
  getComponentCatalog,
  validateLayoutSpec,
  applyDefaults,
  getImagesForSiteType,
};
