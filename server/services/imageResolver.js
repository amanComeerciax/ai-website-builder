/**
 * Image Resolver — Multi-tier server-side image search
 * 
 * Waterfall Strategy:
 *   Tier 1: Pexels API  — Free, CDN-backed stock photos, copyright-clean (200 req/hr)
 *   Tier 2: SerpAPI      — Google Images search, billions of results (100 searches/mo free)
 *   Tier 3: Pollinations — AI-generated fallback, always works (kept as last resort)
 * 
 * Flow:
 * 1. AI generates HTML with Pollinations URLs (descriptions embedded in the URL)
 * 2. This service extracts those descriptions
 * 3. Searches Pexels first → Google Images second → keeps Pollinations as last resort
 * 4. Replaces all URLs with resolved CDN-backed images before HTML reaches the browser
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const SERP_API_KEY = process.env.SERP_API_KEY;

const PEXELS_BASE = 'https://api.pexels.com/v1/search';
const SERP_BASE = 'https://serpapi.com/search.json';

// ── Shared cache across all tiers ──
const searchCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── Track SerpAPI usage to avoid burning free quota ──
let serpApiCallsThisSession = 0;
const SERP_MAX_PER_SESSION = 15; // Conservative: max 15 Google searches per generation session

// ─────────────────────────────────────────────────────────
// TIER 1: Pexels — Preferred (fast CDN, copyright-safe)
// ─────────────────────────────────────────────────────────
async function searchPexels(query, width = 800, height = 600) {
  if (!PEXELS_API_KEY) return null;

  const cacheKey = `pexels_${query}_${width}x${height}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  try {
    const url = `${PEXELS_BASE}?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
    const response = await fetch(url, {
      headers: { 'Authorization': PEXELS_API_KEY }
    });

    if (!response.ok) {
      console.warn(`[ImageResolver] Pexels error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.photos || data.photos.length === 0) return null;

    // Pick random from top results to avoid duplicates across cards
    const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 15));
    const photo = data.photos[randomIndex];
    const photoUrl = `${photo.src.original}?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;

    searchCache.set(cacheKey, { url: photoUrl, timestamp: Date.now(), tier: 'pexels' });
    return photoUrl;
  } catch (err) {
    console.error(`[ImageResolver] Pexels failed for "${query}":`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// TIER 2: SerpAPI (Google Images) — Fallback for niche queries
// ─────────────────────────────────────────────────────────
async function searchGoogle(query, width = 800, height = 600) {
  if (!SERP_API_KEY) return null;

  // Protect free quota
  if (serpApiCallsThisSession >= SERP_MAX_PER_SESSION) {
    console.warn(`[ImageResolver] SerpAPI session limit reached (${SERP_MAX_PER_SESSION}). Skipping Google search.`);
    return null;
  }

  const cacheKey = `serp_${query}_${width}x${height}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  try {
    const url = `${SERP_BASE}?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&num=10&safe=active`;
    const response = await fetch(url);
    serpApiCallsThisSession++;

    if (!response.ok) {
      console.warn(`[ImageResolver] SerpAPI error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.images_results || data.images_results.length === 0) return null;

    // Filter for usable images: must have original URL, prefer larger sizes
    const usableImages = data.images_results.filter(img => {
      const url = img.original || '';
      // Skip tiny images, SVGs, and potentially problematic sources
      if (!url || url.endsWith('.svg') || url.endsWith('.gif')) return false;
      const w = img.original_width || 0;
      const h = img.original_height || 0;
      if (w < 400 || h < 300) return false;
      return true;
    });

    if (usableImages.length === 0) return null;

    // Pick from top results
    const randomIndex = Math.floor(Math.random() * Math.min(usableImages.length, 8));
    const chosen = usableImages[randomIndex];
    const imageUrl = chosen.original;

    console.log(`[ImageResolver] 🔍 Google found: "${chosen.title}" from ${chosen.source}`);

    searchCache.set(cacheKey, { url: imageUrl, timestamp: Date.now(), tier: 'google' });
    return imageUrl;
  } catch (err) {
    console.error(`[ImageResolver] SerpAPI failed for "${query}":`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// WATERFALL: Try Pexels → Google → keep Pollinations
// ─────────────────────────────────────────────────────────
async function findImage(query, width = 800, height = 600) {
  // Tier 1: Pexels
  const pexelsResult = await searchPexels(query, width, height);
  if (pexelsResult) return { url: pexelsResult, tier: 'pexels' };

  // Tier 2: Google Images via SerpAPI
  const googleResult = await searchGoogle(query, width, height);
  if (googleResult) return { url: googleResult, tier: 'google' };

  // Tier 3: Keep the Pollinations URL (AI-generated, works but slower)
  return null; // Caller keeps the original URL
}

// ─────────────────────────────────────────────────────────
// MAIN: Resolve all images in generated HTML
// ─────────────────────────────────────────────────────────
/**
 * Resolve all images in HTML using the waterfall: Pexels → Google → Pollinations.
 * Extracts image descriptions from Pollinations URLs, alt text, or data attributes.
 * 
 * @param {string} html - The generated HTML content
 * @param {string} businessContext - The business name/type for fallback searches
 * @returns {Promise<string>} HTML with resolved image URLs
 */
async function resolveImages(html, businessContext = '') {
  if (!PEXELS_API_KEY && !SERP_API_KEY) {
    console.warn('[ImageResolver] No image API keys set — keeping original URLs');
    return html;
  }

  // Reset session counter for this generation
  serpApiCallsThisSession = 0;

  let pexelsCount = 0;
  let googleCount = 0;
  let unchangedCount = 0;
  const usedUrls = new Set();

  // ── STEP 1: Process all <img> tags ──
  const imgRegex = /<img[^>]*\ssrc\s*=\s*"([^"]*)"[^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];
  
  for (const match of matches) {
    const fullImgTag = match[0];
    const originalSrc = match[1];
    
    // Skip already-resolved URLs (Pexels CDN or valid Unsplash photo IDs)
    if (originalSrc.includes('images.pexels.com') || 
        (originalSrc.includes('images.unsplash.com/photo-') && !originalSrc.includes('/featured'))) {
      continue;
    }

    // ── Extract search query from the image context ──
    let searchQuery = '';

    // Priority 1: Description embedded in Pollinations URL
    const pollinationsMatch = originalSrc.match(/image\.pollinations\.ai\/prompt\/([^?]+)/);
    if (pollinationsMatch) {
      searchQuery = decodeURIComponent(pollinationsMatch[1]).replace(/%20/g, ' ');
    }

    // Priority 2: Alt text
    if (!searchQuery) {
      const altMatch = fullImgTag.match(/alt\s*=\s*"([^"]+)"/i);
      if (altMatch && altMatch[1].length > 2) {
        searchQuery = altMatch[1];
      }
    }

    // Priority 3: data-query attribute
    if (!searchQuery) {
      const dataMatch = fullImgTag.match(/data-(?:img-)?query\s*=\s*"([^"]+)"/i);
      if (dataMatch) searchQuery = dataMatch[1];
    }

    // Priority 4: Business context fallback
    if (!searchQuery) {
      searchQuery = businessContext || 'professional business website';
    }

    // Determine dimensions
    let width = 800, height = 600;
    const widthMatch = originalSrc.match(/width=(\d+)/);
    const heightMatch = originalSrc.match(/height=(\d+)/);
    if (widthMatch) width = parseInt(widthMatch[1]);
    if (heightMatch) height = parseInt(heightMatch[1]);

    // ── Waterfall search ──
    const result = await findImage(searchQuery, width, height);

    if (result && !usedUrls.has(result.url)) {
      html = html.replace(originalSrc, result.url);
      usedUrls.add(result.url);
      if (result.tier === 'pexels') pexelsCount++;
      else if (result.tier === 'google') googleCount++;
    } else if (result && usedUrls.has(result.url)) {
      // Duplicate — try with modified query to get a different image
      const altResult = await findImage(searchQuery + ' high quality photo', width, height);
      if (altResult && !usedUrls.has(altResult.url)) {
        html = html.replace(originalSrc, altResult.url);
        usedUrls.add(altResult.url);
        if (altResult.tier === 'pexels') pexelsCount++;
        else if (altResult.tier === 'google') googleCount++;
      } else {
        unchangedCount++;
      }
    } else {
      unchangedCount++;
    }
  }

  // ── STEP 2: Fix broken background-image URLs in CSS ──
  const bgRegex = /url\(\s*['"]?(https?:\/\/(?:source\.unsplash\.com|placehold\.co|placeholder\.com|via\.placeholder\.com|dummyimage\.com)[^'"\)]+)['"]?\s*\)/gi;
  const bgMatches = [...html.matchAll(bgRegex)];
  
  for (const bgMatch of bgMatches) {
    const brokenUrl = bgMatch[1];
    const result = await findImage(businessContext || 'abstract background', 1200, 800);
    if (result) {
      html = html.replace(brokenUrl, result.url);
      if (result.tier === 'pexels') pexelsCount++;
      else if (result.tier === 'google') googleCount++;
    }
  }

  // ── STEP 3: Fix empty src="" ──
  const emptySrcCount = (html.match(/src\s*=\s*""\s*/g) || []).length;
  if (emptySrcCount > 0) {
    const result = await findImage(businessContext || 'modern business', 800, 600);
    if (result) {
      html = html.replace(/src\s*=\s*""\s*/g, `src="${result.url}" `);
      if (result.tier === 'pexels') pexelsCount += emptySrcCount;
      else if (result.tier === 'google') googleCount += emptySrcCount;
    }
  }

  const total = pexelsCount + googleCount;
  console.log(`[ImageResolver] ✅ Resolved ${total} image(s) — Pexels: ${pexelsCount}, Google: ${googleCount}, Unchanged: ${unchangedCount}`);
  if (serpApiCallsThisSession > 0) {
    console.log(`[ImageResolver] 📊 SerpAPI calls this session: ${serpApiCallsThisSession}/${SERP_MAX_PER_SESSION}`);
  }

  return html;
}

/**
 * Clear the search cache
 */
function clearImageCache() {
  searchCache.clear();
  serpApiCallsThisSession = 0;
}

module.exports = { resolveImages, searchPexels, searchGoogle, findImage, clearImageCache };
