/**
 * Theme Registry — Predefined website themes for generation
 * 
 * Each theme contains complete design specs: colors, fonts, radii,
 * animation style, and descriptive keywords that get injected into LLM prompts.
 * 
 * The LLM uses these as strict constraints — it generates WITHIN the theme,
 * but can adapt layout/content to the user's specific prompt.
 */

const THEMES = {
  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Dark',
    emoji: '🌑',
    description: 'Sleek dark interface with neon accents and glass effects',
    bestFor: ['tech', 'SaaS', 'startups', 'agency', 'portfolio'],
    colorScheme: {
      bg: '#09090b',
      surface: '#18181b',
      surfaceHover: '#27272a',
      border: '#3f3f46',
      text: '#fafafa',
      textDim: '#a1a1aa',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      gradient: 'from-blue-500 to-indigo-600',
    },
    fontPair: {
      heading: 'Syne',
      body: 'DM Sans',
      mono: 'JetBrains Mono',
    },
    borderRadius: '0.75rem',
    animationStyle: 'smooth',
    styleKeywords: [
      'glassmorphism with backdrop-blur',
      'subtle background gradients',
      'neon accent glows on hover',
      'dark zinc backgrounds',
      'soft border separators',
      'smooth CSS transitions (300ms)',
    ],
  },

  'modern-light': {
    id: 'modern-light',
    name: 'Modern Light',
    emoji: '☀️',
    description: 'Clean white design with soft shadows and crisp typography',
    bestFor: ['business', 'corporate', 'professional', 'consulting'],
    colorScheme: {
      bg: '#fafafa',
      surface: '#ffffff',
      surfaceHover: '#f4f4f5',
      border: '#e4e4e7',
      text: '#09090b',
      textDim: '#71717a',
      accent: '#6366f1',
      accentHover: '#4f46e5',
      gradient: 'from-indigo-500 to-purple-600',
    },
    fontPair: {
      heading: 'Inter',
      body: 'Inter',
      mono: 'Fira Code',
    },
    borderRadius: '0.75rem',
    animationStyle: 'crisp',
    styleKeywords: [
      'clean white backgrounds',
      'soft box-shadows (0 1px 3px rgba(0,0,0,0.1))',
      'subtle borders for card separation',
      'professional and airy layout',
      'generous whitespace',
      'smooth hover state transitions',
    ],
  },

  'minimal': {
    id: 'minimal',
    name: 'Minimal',
    emoji: '⬜',
    description: 'Black and white, typography-focused, no decoration',
    bestFor: ['portfolio', 'agency', 'photographer', 'writer', 'architect'],
    colorScheme: {
      bg: '#ffffff',
      surface: '#f8f8f8',
      surfaceHover: '#f0f0f0',
      border: '#e0e0e0',
      text: '#1a1a1a',
      textDim: '#666666',
      accent: '#000000',
      accentHover: '#333333',
      gradient: 'from-gray-900 to-gray-700',
    },
    fontPair: {
      heading: 'Space Grotesk',
      body: 'IBM Plex Sans',
      mono: 'IBM Plex Mono',
    },
    borderRadius: '0',
    animationStyle: 'minimal',
    styleKeywords: [
      'monochrome design — only black, white, grays',
      'typography is the main design element',
      'no decorative borders or shadows',
      'large bold headings with tight letter-spacing',
      'generous line-height for readability',
      'NO gradients, NO rounded corners, NO glow effects',
    ],
  },

  'bold': {
    id: 'bold',
    name: 'Bold & Vibrant',
    emoji: '🔥',
    description: 'High contrast, large type, energetic animations',
    bestFor: ['creative', 'events', 'music', 'sports', 'food', 'entertainment'],
    colorScheme: {
      bg: '#0f0f0f',
      surface: '#1e1e1e',
      surfaceHover: '#2a2a2a',
      border: '#333333',
      text: '#ffffff',
      textDim: '#b0b0b0',
      accent: '#f59e0b',
      accentHover: '#d97706',
      gradient: 'from-amber-500 to-orange-600',
    },
    fontPair: {
      heading: 'Outfit',
      body: 'Plus Jakarta Sans',
      mono: 'Fira Code',
    },
    borderRadius: '1rem',
    animationStyle: 'energetic',
    styleKeywords: [
      'large oversized headings (clamp(2.5rem, 5vw, 5rem))',
      'high contrast text on dark backgrounds',
      'vibrant amber/orange accent colors',
      'bold call-to-action buttons with scale transforms',
      'energetic hover animations (scale + rotate)',
      'gradient text effects on headings',
    ],
  },

  'elegant': {
    id: 'elegant',
    name: 'Elegant',
    emoji: '👑',
    description: 'Luxury feel with serif fonts, deep navy, and gold accents',
    bestFor: ['restaurant', 'hotel', 'jewelry', 'luxury', 'spa', 'fashion'],
    colorScheme: {
      bg: '#1a1a2e',
      surface: '#16213e',
      surfaceHover: '#1b2a4a',
      border: '#2a3f5f',
      text: '#e8e8e8',
      textDim: '#9ca3af',
      accent: '#c4a35a',
      accentHover: '#b8963e',
      gradient: 'from-amber-600 to-yellow-700',
    },
    fontPair: {
      heading: 'Playfair Display',
      body: 'Lora',
      mono: 'Courier Prime',
    },
    borderRadius: '0.25rem',
    animationStyle: 'subtle',
    styleKeywords: [
      'serif typography for a premium feel',
      'deep navy/dark blue backgrounds',
      'muted gold accent color for buttons and borders',
      'thin elegant border lines (1px solid)',
      'subtle fade-in animations',
      'letter-spacing on uppercase labels',
    ],
  },

  'playful': {
    id: 'playful',
    name: 'Playful',
    emoji: '🎪',
    description: 'Warm palette, rounded shapes, bouncy interactions',
    bestFor: ['kids', 'bakery', 'pet', 'education', 'toy', 'cafe'],
    colorScheme: {
      bg: '#fef3c7',
      surface: '#ffffff',
      surfaceHover: '#fef9c3',
      border: '#fde68a',
      text: '#1f2937',
      textDim: '#6b7280',
      accent: '#ec4899',
      accentHover: '#db2777',
      gradient: 'from-pink-500 to-rose-500',
    },
    fontPair: {
      heading: 'Quicksand',
      body: 'Nunito',
      mono: 'Comic Mono',
    },
    borderRadius: '1.5rem',
    animationStyle: 'bouncy',
    styleKeywords: [
      'warm sunny background tones',
      'fully rounded corners on cards and buttons',
      'playful pink accent with warm yellows',
      'bouncy spring animations on hover (scale 1.05)',
      'friendly and approachable typography',
      'soft pastel color palette overall',
    ],
  },
};

/**
 * Get a theme by ID. Falls back to 'modern-dark'.
 * @param {string} themeId
 * @returns {object} Complete theme config
 */
function getTheme(themeId) {
  return THEMES[themeId] || THEMES['modern-dark'];
}

/**
 * Get all available theme IDs and names (for frontend picker).
 * @returns {Array<{id: string, name: string, emoji: string, description: string}>}
 */
function getThemeList() {
  return Object.values(THEMES).map(t => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    description: t.description,
    bestFor: t.bestFor,
    accentColor: t.colorScheme.accent,
    bgColor: t.colorScheme.bg,
  }));
}

/**
 * Merge user's brand colors into a theme.
 * If user provides their own colors, they override the theme's accent.
 * @param {object} theme - Theme from THEMES
 * @param {string[]} brandColors - User's brand colors
 * @returns {object} Theme with merged colors
 */
function mergeUserColors(theme, brandColors) {
  if (!brandColors || brandColors.length === 0) return theme;

  const merged = JSON.parse(JSON.stringify(theme)); // deep clone
  if (brandColors[0]) {
    merged.colorScheme.accent = brandColors[0];
  }
  if (brandColors[1]) {
    merged.colorScheme.surface = brandColors[1];
  }
  return merged;
}

module.exports = { THEMES, getTheme, getThemeList, mergeUserColors };
