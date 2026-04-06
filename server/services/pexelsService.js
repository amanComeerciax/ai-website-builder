/**
 * Pexels Image Service — Direct REST API integration
 * 
 * Replaces the over-engineered MCP approach with a simple, reliable
 * direct API call to Pexels. Called AFTER the AI generates a layout
 * to inject real, high-quality images into sections.
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/v1';

// Cache to avoid re-fetching the same query
const imageCache = new Map();

/**
 * Search for photos on Pexels and return an array of high-quality URLs.
 * @param {string} query - Search term e.g. "modern coffee shop interior"
 * @param {number} count - Number of photos to return (max 15)
 * @returns {Promise<string[]>} Array of image URLs
 */
async function searchPhotos(query, count = 5) {
  if (!PEXELS_API_KEY) {
    console.warn('[PexelsService] ⚠️ PEXELS_API_KEY not set — skipping image search');
    return [];
  }

  const cacheKey = `${query}_${count}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  try {
    const url = `${PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY }
    });

    if (!response.ok) {
      console.error(`[PexelsService] ❌ API error ${response.status}: ${await response.text()}`);
      return [];
    }

    const data = await response.json();
    const urls = (data.photos || []).map(p => p.src.large2x || p.src.large || p.src.original);

    console.log(`[PexelsService] ✅ Found ${urls.length} photos for "${query}"`);
    imageCache.set(cacheKey, urls);
    return urls;
  } catch (error) {
    console.error('[PexelsService] ❌ Fetch failed:', error.message);
    return [];
  }
}

/**
 * Build a contextual Pexels search query based on the site type and section.
 */
function buildQuery(siteType, section, brandName = '') {
  const queries = {
    saas: {
      HeroSection: 'modern tech office workspace',
      AboutSection: 'professional team collaboration startup',
      PortfolioSection: 'software dashboard interface',
      BentoGrid: 'technology abstract digital',
      StickyScroll: 'developer coding computer',
    },
    'coffee-shop': {
      HeroSection: 'cozy coffee shop interior aesthetic',
      AboutSection: 'barista brewing coffee',
      PortfolioSection: 'latte art coffee drinks',
      BentoGrid: 'coffee beans roasting',
      StickyScroll: 'espresso brewing cafe',
    },
    restaurant: {
      HeroSection: 'fine dining restaurant interior',
      AboutSection: 'chef cooking kitchen professional',
      PortfolioSection: 'gourmet food plating',
      BentoGrid: 'restaurant food dish',
    },
    gym: {
      HeroSection: 'modern gym fitness center interior',
      AboutSection: 'personal trainer coaching client',
      PortfolioSection: 'fitness workout exercise',
      BentoGrid: 'gym equipment weights',
    },
    agency: {
      HeroSection: 'creative agency office modern',
      AboutSection: 'team brainstorming design studio',
      PortfolioSection: 'branding design creative project',
      BentoGrid: 'graphic design creative work',
    },
    portfolio: {
      HeroSection: 'creative workspace minimal desk setup',
      AboutSection: 'designer working laptop creative',
      PortfolioSection: 'creative design project artwork',
      BentoGrid: 'design portfolio work',
    },
    medical: {
      HeroSection: 'modern medical clinic hospital',
      AboutSection: 'doctor patient consultation',
      PortfolioSection: 'medical healthcare professional',
    },
    hotel: {
      HeroSection: 'luxury hotel lobby interior',
      AboutSection: 'hotel resort amenities pool',
      PortfolioSection: 'hotel room luxury suite',
    },
    education: {
      HeroSection: 'modern university classroom learning',
      AboutSection: 'students studying campus',
      PortfolioSection: 'education learning online course',
    },
    ecommerce: {
      HeroSection: 'modern retail store minimalist',
      AboutSection: 'fashion lifestyle product',
      PortfolioSection: 'product photography minimal',
    },
  };

  const siteQueries = queries[siteType] || queries['saas'];
  return siteQueries[section] || `${siteType} professional business ${section.replace('Section', '')}`;
}

/**
 * POST-PROCESS a layout spec to inject real Pexels images into all sections.
 * This runs AFTER the AI generates the JSON layout, before HTML rendering.
 * 
 * @param {object} layoutSpec - The AI-generated layout spec { sections: [...] }
 * @param {string} siteType - e.g. 'saas', 'restaurant'
 * @param {string} brandName - e.g. 'Acme Corp'
 * @returns {Promise<object>} Updated layout spec with real Pexels images
 */
async function injectPexelsImages(layoutSpec, siteType, brandName) {
  if (!PEXELS_API_KEY || !layoutSpec?.sections) return layoutSpec;

  console.log(`[PexelsService] 🖼 Injecting Pexels images into ${layoutSpec.sections.length} sections...`);

  const updatedSections = await Promise.all(
    layoutSpec.sections.map(async (section) => {
      const props = { ...section.props };
      const component = section.component;
      const query = buildQuery(siteType, component, brandName);

      try {
        // Hero / About — single background or main image
        if (component === 'HeroSection' && needsImage(props.bgImage)) {
          const [url] = await searchPhotos(query, 3);
          if (url) props.bgImage = url;
        }

        if (component === 'AboutSection' && needsImage(props.image)) {
          const [url] = await searchPhotos(query, 3);
          if (url) props.image = url;
        }

        // Portfolio / BentoGrid / StickyScroll — items with images
        if (['PortfolioSection', 'BentoGrid', 'StickyScroll'].includes(component) && Array.isArray(props.items)) {
          const photos = await searchPhotos(query, props.items.length + 2);
          if (photos.length > 0) {
            props.items = props.items.map((item, i) => {
              const imageKey = component === 'BentoGrid' ? 'header' 
                             : component === 'StickyScroll' ? 'content'
                             : 'image';
              if (needsImage(item[imageKey])) {
                return { ...item, [imageKey]: photos[i % photos.length] };
              }
              return item;
            });
          }
        }
      } catch (e) {
        console.warn(`[PexelsService] Could not inject images for ${component}:`, e.message);
      }

      return { ...section, props };
    })
  );

  console.log(`[PexelsService] ✅ Image injection complete`);
  return { ...layoutSpec, sections: updatedSections };
}

/**
 * Check if an image URL needs to be replaced.
 * Returns true if the value is missing, not a URL, or a known placeholder.
 */
function needsImage(url) {
  if (!url || typeof url !== 'string' || url.trim().length < 5) return true;
  const clean = url.trim().toLowerCase();
  // CRITICAL: Must start with http — catches AI descriptive text like
  // "Advertising campaign showing..." used in place of actual URLs
  if (!clean.startsWith('http')) return true;
  return (
    clean.includes('placeholder') ||
    clean.includes('undefined') ||
    // Bare Unsplash URLs without params (from seed templates)
    (clean.includes('unsplash.com/photo-') && !clean.includes('?'))
  );
}

module.exports = { searchPhotos, injectPexelsImages };
