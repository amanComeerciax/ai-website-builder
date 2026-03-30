/**
 * HTML Renderer — Converts component layout specs to a complete static HTML page
 * 
 * This is the "instant preview" engine. Each component has a render function
 * that outputs production-quality HTML with Tailwind CSS classes.
 * 
 * Usage:
 *   const { renderToHTML } = require('./html-renderer');
 *   const html = renderToHTML(layoutSpec, themeConfig);
 *   // → Complete <!DOCTYPE html>...</html> string
 */

const LUCIDE_ICON_SVG = {
  ArrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  Check: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  Star: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  Mail: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  Phone: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  MapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  Menu: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
  X: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  Zap: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  Shield: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  Globe: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  Heart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  Users: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  Target: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  Award: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  Coffee: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1"/><path d="M6 2v2"/></svg>',
  Sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  Clock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  Send: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  Twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>',
  Github: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',
  Linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>',
  Facebook: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
  Instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
};

function icon(name, size) {
  const sizeNum = size || 24;
  let svg = LUCIDE_ICON_SVG[name] || LUCIDE_ICON_SVG['Zap'];
  svg = svg.replace(/width="\d+"/, `width="${sizeNum}"`).replace(/height="\d+"/, `height="${sizeNum}"`);
  return svg;
}

function stars(count) {
  const filled = Math.min(Math.max(Math.round(count || 5), 0), 5);
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color: ${i < filled ? '#facc15' : '#4b5563'}">${icon('Star', 16)}</span>`
  ).join('');
}

const socialIconMap = { twitter: 'Twitter', github: 'Github', linkedin: 'Linkedin', facebook: 'Facebook', instagram: 'Instagram' };

// ════════════════════════════════════════════════════════════
// ── COMPONENT RENDERERS
// ════════════════════════════════════════════════════════════

function renderNavBar(props, theme) {
  // Safety: normalize links to strings (AI sometimes sends objects like {name:'Home', href:'#'})
  const rawLinks = props.links || ['Home', 'About', 'Services', 'Contact'];
  const links = rawLinks.map(link => {
    if (typeof link === 'string') return link;
    if (typeof link === 'object' && link !== null) return link.name || link.label || link.title || link.text || String(link);
    return String(link);
  });
  return `
  <nav style="position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(12px);background:${theme.bg}cc;border-bottom:1px solid ${theme.border};">
    <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:72px;">
      <a href="#" style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.5rem;font-weight:700;color:${theme.text};text-decoration:none;">
        ${props.logoUrl ? `<img src="${props.logoUrl}" alt="${props.brand || ''}" style="height:36px;">` : (props.brand || 'My Website')}
      </a>
      <div style="display:flex;align-items:center;gap:32px;">
        <div style="display:flex;gap:24px;" class="nav-links">
          ${links.map(link => `<a href="#${String(link).toLowerCase().replace(/\s+/g, '-')}" style="color:${theme.textDim};text-decoration:none;font-size:0.9rem;font-family:'${theme.fontBody}',sans-serif;transition:color 0.2s;" onmouseover="this.style.color='${theme.accent}'" onmouseout="this.style.color='${theme.textDim}'">${link}</a>`).join('')}
        </div>
        ${props.ctaText ? `<a href="${props.ctaLink || '#contact'}" style="background:${theme.accent};color:#fff;padding:10px 24px;border-radius:8px;font-size:0.9rem;font-weight:600;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px ${theme.accent}40'" onmouseout="this.style.transform='';this.style.boxShadow=''">${props.ctaText}</a>` : ''}
      </div>
    </div>
  </nav>`;
}

function renderHeroSection(props, theme, variant) {
  const v = variant || 'centered';

  if (v === 'split') {
    return `
    <section style="min-height:100vh;display:flex;align-items:center;background:${theme.bg};padding:120px 24px 80px;">
      <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
        <div>
          ${props.badgeText ? `<span style="display:inline-block;background:${theme.accent}20;color:${theme.accent};font-size:0.8rem;font-weight:600;padding:6px 16px;border-radius:100px;margin-bottom:24px;font-family:'${theme.fontBody}',sans-serif;">${props.badgeText}</span>` : ''}
          <h1 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2.5rem,5vw,4rem);line-height:1.1;color:${theme.text};margin:0 0 24px;">${props.heading}</h1>
          <p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.15rem;line-height:1.7;color:${theme.textDim};margin:0 0 40px;">${props.subtext}</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <a href="${props.ctaLink || '#contact'}" style="display:inline-flex;align-items:center;gap:8px;background:${theme.accent};color:#fff;padding:14px 32px;border-radius:10px;font-size:1rem;font-weight:600;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px ${theme.accent}40'" onmouseout="this.style.transform='';this.style.boxShadow=''">${props.ctaText} ${icon('ArrowRight', 18)}</a>
            ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" style="display:inline-flex;align-items:center;gap:8px;border:1px solid ${theme.border};color:${theme.text};padding:14px 32px;border-radius:10px;font-size:1rem;font-weight:500;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.2s;" onmouseover="this.style.borderColor='${theme.accent}'" onmouseout="this.style.borderColor='${theme.border}'">${props.secondaryCtaText}</a>` : ''}
          </div>
        </div>
        <div style="position:relative;">
          <div style="border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
            <img src="${props.bgImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'}" alt="${props.heading}" style="width:100%;height:480px;object-fit:cover;display:block;">
          </div>
          <div style="position:absolute;inset:-1px;border-radius:16px;border:1px solid ${theme.accent}30;pointer-events:none;"></div>
        </div>
      </div>
    </section>`;
  }

  if (v === 'fullImage') {
    return `
    <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
      <img src="${props.bgImage || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80'}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,${theme.bg}ee,${theme.bg}cc);"></div>
      <div style="position:relative;z-index:1;text-align:center;max-width:800px;padding:120px 24px 80px;">
        ${props.badgeText ? `<span style="display:inline-block;background:${theme.accent}20;color:${theme.accent};font-size:0.8rem;font-weight:600;padding:6px 16px;border-radius:100px;margin-bottom:24px;font-family:'${theme.fontBody}',sans-serif;backdrop-filter:blur(4px);">${props.badgeText}</span>` : ''}
        <h1 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2.5rem,6vw,4.5rem);line-height:1.1;color:${theme.text};margin:0 0 24px;">${props.heading}</h1>
        <p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.2rem;line-height:1.7;color:${theme.textDim};margin:0 0 40px;max-width:640px;margin-left:auto;margin-right:auto;">${props.subtext}</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
          <a href="${props.ctaLink || '#contact'}" style="display:inline-flex;align-items:center;gap:8px;background:${theme.accent};color:#fff;padding:16px 36px;border-radius:12px;font-size:1.05rem;font-weight:600;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 12px 32px ${theme.accent}50'" onmouseout="this.style.transform='';this.style.boxShadow=''">${props.ctaText} ${icon('ArrowRight', 18)}</a>
          ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,0.2);color:${theme.text};padding:16px 36px;border-radius:12px;font-size:1.05rem;font-weight:500;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;backdrop-filter:blur(4px);transition:all 0.2s;">${props.secondaryCtaText}</a>` : ''}
        </div>
      </div>
    </section>`;
  }

  // Default: centered (no big image)
  return `
  <section style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:${theme.bg};padding:120px 24px 80px;">
    <div style="text-align:center;max-width:800px;">
      ${props.badgeText ? `<span style="display:inline-block;background:${theme.accent}15;color:${theme.accent};font-size:0.8rem;font-weight:600;padding:6px 16px;border-radius:100px;margin-bottom:24px;font-family:'${theme.fontBody}',sans-serif;">${props.badgeText}</span>` : ''}
      <h1 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2.5rem,6vw,4.5rem);line-height:1.1;color:${theme.text};margin:0 0 24px;">${props.heading}</h1>
      <p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.2rem;line-height:1.7;color:${theme.textDim};margin:0 0 40px;max-width:640px;margin-left:auto;margin-right:auto;">${props.subtext}</p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <a href="${props.ctaLink || '#contact'}" style="display:inline-flex;align-items:center;gap:8px;background:${theme.accent};color:#fff;padding:14px 32px;border-radius:10px;font-size:1rem;font-weight:600;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px ${theme.accent}40'" onmouseout="this.style.transform='';this.style.boxShadow=''">${props.ctaText} ${icon('ArrowRight', 18)}</a>
        ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" style="display:inline-flex;align-items:center;gap:8px;border:1px solid ${theme.border};color:${theme.text};padding:14px 32px;border-radius:10px;font-size:1rem;font-weight:500;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.2s;">${props.secondaryCtaText}</a>` : ''}
      </div>
    </div>
  </section>`;
}

function renderFeatureGrid(props, theme, variant) {
  const items = props.items || [];
  return `
  <section id="features" style="padding:100px 24px;background:${theme.surface};">
    <div style="max-width:1200px;margin:0 auto;text-align:center;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(1.8rem,3vw,2.5rem);color:${theme.text};margin:0 0 16px;">${props.heading}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;color:${theme.textDim};margin:0 0 60px;max-width:600px;margin-left:auto;margin-right:auto;">${props.subtext}</p>` : '<div style="margin-bottom:60px;"></div>'}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;">
        ${items.map(item => `
          <div style="background:${theme.bg};border:1px solid ${theme.border};border-radius:16px;padding:40px 32px;text-align:left;transition:all 0.3s;" onmouseover="this.style.borderColor='${theme.accent}';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 32px rgba(0,0,0,0.15)'" onmouseout="this.style.borderColor='${theme.border}';this.style.transform='';this.style.boxShadow=''">
            <div style="width:48px;height:48px;border-radius:12px;background:${theme.accent}15;display:flex;align-items:center;justify-content:center;color:${theme.accent};margin-bottom:20px;">
              ${icon(item.icon || 'Zap', 24)}
            </div>
            <h3 style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.2rem;color:${theme.text};margin:0 0 12px;">${item.title}</h3>
            <p style="font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;line-height:1.6;color:${theme.textDim};margin:0;">${item.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>`;
}

function renderTestimonialSection(props, theme) {
  const items = props.items || [];
  return `
  <section id="testimonials" style="padding:100px 24px;background:${theme.bg};">
    <div style="max-width:1200px;margin:0 auto;text-align:center;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(1.8rem,3vw,2.5rem);color:${theme.text};margin:0 0 16px;">${props.heading}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;color:${theme.textDim};margin:0 0 60px;">${props.subtext}</p>` : '<div style="margin-bottom:60px;"></div>'}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;">
        ${items.map(item => `
          <div style="background:${theme.surface};border:1px solid ${theme.border};border-radius:16px;padding:36px 32px;text-align:left;">
            <div style="display:flex;gap:2px;margin-bottom:20px;">${stars(item.rating)}</div>
            <p style="font-family:'${theme.fontBody}',sans-serif;font-size:1rem;line-height:1.7;color:${theme.textDim};margin:0 0 24px;font-style:italic;">"${item.quote}"</p>
            <div style="display:flex;align-items:center;gap:12px;">
              ${item.avatar ? `<img src="${item.avatar}" alt="${item.name}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">` : `<div style="width:44px;height:44px;border-radius:50%;background:${theme.accent}20;display:flex;align-items:center;justify-content:center;color:${theme.accent};font-family:'${theme.fontHeading}',sans-serif;font-weight:700;font-size:1.1rem;">${(item.name || 'U')[0]}</div>`}
              <div>
                <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;font-weight:600;color:${theme.text};">${item.name}</div>
                <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.8rem;color:${theme.textDim};">${item.role || ''}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>`;
}

function renderAboutSection(props, theme) {
  const statItems = props.stats || [];
  return `
  <section id="about" style="padding:100px 24px;background:${theme.surface};">
    <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
      <div style="border-radius:16px;overflow:hidden;">
        <img src="${props.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'}" alt="${props.heading}" style="width:100%;height:440px;object-fit:cover;display:block;">
      </div>
      <div>
        <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(1.8rem,3vw,2.5rem);color:${theme.text};margin:0 0 24px;">${props.heading}</h2>
        <p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;line-height:1.8;color:${theme.textDim};margin:0 0 40px;">${props.description}</p>
        ${statItems.length > 0 ? `
          <div style="display:grid;grid-template-columns:repeat(${Math.min(statItems.length, 3)},1fr);gap:24px;">
            ${statItems.map(stat => `
              <div>
                <div style="font-family:'${theme.fontHeading}',sans-serif;font-size:2rem;font-weight:700;color:${theme.accent};">${stat.value}</div>
                <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.85rem;color:${theme.textDim};margin-top:4px;">${stat.label}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  </section>`;
}

function renderCTASection(props, theme) {
  return `
  <section style="padding:80px 24px;background:linear-gradient(135deg,${theme.accent},${theme.accentHover || theme.accent}dd);">
    <div style="max-width:800px;margin:0 auto;text-align:center;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(1.8rem,4vw,2.8rem);color:#ffffff;margin:0 0 16px;">${props.heading}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.1rem;color:rgba(255,255,255,0.85);margin:0 0 36px;">${props.subtext}</p>` : '<div style="margin-bottom:36px;"></div>'}
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <a href="${props.ctaLink || '#contact'}" style="display:inline-flex;align-items:center;gap:8px;background:#ffffff;color:${theme.accent};padding:14px 36px;border-radius:10px;font-size:1rem;font-weight:700;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='';this.style.boxShadow=''">${props.ctaText} ${icon('ArrowRight', 18)}</a>
        ${props.secondaryCtaText ? `<a href="#" style="display:inline-flex;align-items:center;gap:8px;border:2px solid rgba(255,255,255,0.3);color:#ffffff;padding:14px 36px;border-radius:10px;font-size:1rem;font-weight:500;text-decoration:none;font-family:'${theme.fontBody}',sans-serif;">${props.secondaryCtaText}</a>` : ''}
      </div>
    </div>
  </section>`;
}

function renderContactSection(props, theme) {
  return `
  <section id="contact" style="padding:100px 24px;background:${theme.bg};">
    <div style="max-width:1200px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:60px;">
        <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(1.8rem,3vw,2.5rem);color:${theme.text};margin:0 0 16px;">${props.heading}</h2>
        ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;color:${theme.textDim};margin:0;">${props.subtext}</p>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;">
        <div>
          <form style="display:flex;flex-direction:column;gap:20px;" onsubmit="event.preventDefault();alert('Thank you! We\\'ll be in touch.')">
            <div>
              <label style="display:block;font-family:'${theme.fontBody}',sans-serif;font-size:0.85rem;color:${theme.textDim};margin-bottom:8px;">Full Name</label>
              <input type="text" placeholder="John Doe" style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid ${theme.border};background:${theme.surface};color:${theme.text};font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='${theme.accent}'" onblur="this.style.borderColor='${theme.border}'">
            </div>
            <div>
              <label style="display:block;font-family:'${theme.fontBody}',sans-serif;font-size:0.85rem;color:${theme.textDim};margin-bottom:8px;">Email</label>
              <input type="email" placeholder="john@example.com" style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid ${theme.border};background:${theme.surface};color:${theme.text};font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;outline:none;box-sizing:border-box;" onfocus="this.style.borderColor='${theme.accent}'" onblur="this.style.borderColor='${theme.border}'">
            </div>
            <div>
              <label style="display:block;font-family:'${theme.fontBody}',sans-serif;font-size:0.85rem;color:${theme.textDim};margin-bottom:8px;">Message</label>
              <textarea rows="5" placeholder="Tell us about your project..." style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid ${theme.border};background:${theme.surface};color:${theme.text};font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;outline:none;resize:vertical;box-sizing:border-box;" onfocus="this.style.borderColor='${theme.accent}'" onblur="this.style.borderColor='${theme.border}'"></textarea>
            </div>
            <button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:8px;background:${theme.accent};color:#fff;padding:14px 32px;border-radius:10px;border:none;font-size:1rem;font-weight:600;cursor:pointer;font-family:'${theme.fontBody}',sans-serif;transition:all 0.3s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform=''">Send Message ${icon('Send', 18)}</button>
          </form>
        </div>
        <div style="display:flex;flex-direction:column;gap:32px;padding-top:8px;">
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;border-radius:10px;background:${theme.accent}15;display:flex;align-items:center;justify-content:center;color:${theme.accent};flex-shrink:0;">${icon('Mail', 20)}</div>
            <div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;font-weight:600;color:${theme.text};margin-bottom:4px;">Email</div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;color:${theme.textDim};">${props.email || 'hello@example.com'}</div>
            </div>
          </div>
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;border-radius:10px;background:${theme.accent}15;display:flex;align-items:center;justify-content:center;color:${theme.accent};flex-shrink:0;">${icon('Phone', 20)}</div>
            <div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;font-weight:600;color:${theme.text};margin-bottom:4px;">Phone</div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;color:${theme.textDim};">${props.phone || '+1 (555) 000-0000'}</div>
            </div>
          </div>
          <div style="display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;border-radius:10px;background:${theme.accent}15;display:flex;align-items:center;justify-content:center;color:${theme.accent};flex-shrink:0;">${icon('MapPin', 20)}</div>
            <div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;font-weight:600;color:${theme.text};margin-bottom:4px;">Address</div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;color:${theme.textDim};">${props.address || '123 Main Street, City'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function renderFooterSection(props, theme, variant) {
  const v = variant || 'simple';
  // Safety: normalize socialLinks to strings
  const rawSocial = props.socialLinks || ['twitter', 'github', 'linkedin'];
  const socialLinks = rawSocial.map(s => typeof s === 'string' ? s : (s && (s.name || s.platform || s.type)) || 'globe');

  if (v === 'withLinks') {
    // Normalize links: AI sends many formats — normalize to [{title, items}]
    let linkGroups = [];
    const rawLinks = props.links;

    if (Array.isArray(rawLinks) && rawLinks.length > 0) {
      if (typeof rawLinks[0] === 'string') {
        // AI sent flat strings like ["Home", "About", "Contact"]
        // Group them into one column
        linkGroups = [
          { title: 'Quick Links', items: rawLinks },
        ];
      } else if (typeof rawLinks[0] === 'object') {
        // AI sent objects — normalize property names
        linkGroups = rawLinks.map(group => {
          const title = group.title || group.name || group.heading || group.category || 'Links';
          let items = group.items || group.links || group.children || group.pages || [];
          // If items are objects instead of strings, extract text
          items = items.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item) return item.name || item.label || item.title || item.text || 'Link';
            return String(item || 'Link');
          });
          return { title: String(title), items };
        });
      }
    }

    // Fallback if still empty
    if (linkGroups.length === 0) {
      linkGroups = [
        { title: 'Product', items: ['Features', 'Pricing', 'FAQ'] },
        { title: 'Company', items: ['About', 'Blog', 'Careers'] },
        { title: 'Support', items: ['Help', 'Contact', 'Privacy'] },
      ];
    }

    return `
    <footer style="padding:80px 24px 40px;background:${theme.surface};border-top:1px solid ${theme.border};">
      <div style="max-width:1200px;margin:0 auto;">
        <div style="display:grid;grid-template-columns:2fr ${linkGroups.map(() => '1fr').join(' ')};gap:48px;margin-bottom:60px;">
          <div>
            <div style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.5rem;font-weight:700;color:${theme.text};margin-bottom:16px;">${props.brand || 'My Website'}</div>
            ${props.description ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;line-height:1.7;color:${theme.textDim};margin:0 0 24px;max-width:300px;">${props.description}</p>` : ''}
            <div style="display:flex;gap:12px;">
              ${socialLinks.map(s => `<a href="#" style="width:36px;height:36px;border-radius:8px;border:1px solid ${theme.border};display:flex;align-items:center;justify-content:center;color:${theme.textDim};text-decoration:none;transition:all 0.2s;" onmouseover="this.style.borderColor='${theme.accent}';this.style.color='${theme.accent}'" onmouseout="this.style.borderColor='${theme.border}';this.style.color='${theme.textDim}'">${icon(socialIconMap[s] || 'Globe', 16)}</a>`).join('')}
            </div>
          </div>
          ${linkGroups.map(group => `
            <div>
              <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.85rem;font-weight:600;color:${theme.text};margin-bottom:20px;text-transform:uppercase;letter-spacing:0.05em;">${group.title}</div>
              <div style="display:flex;flex-direction:column;gap:12px;">
                ${(group.items || []).map(item => `<a href="#" style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;color:${theme.textDim};text-decoration:none;transition:color 0.2s;" onmouseover="this.style.color='${theme.accent}'" onmouseout="this.style.color='${theme.textDim}'">${item}</a>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div style="border-top:1px solid ${theme.border};padding-top:24px;text-align:center;">
          <p style="font-family:'${theme.fontBody}',sans-serif;font-size:0.8rem;color:${theme.textDim};margin:0;">${props.copyright || `© ${new Date().getFullYear()} ${props.brand}. All rights reserved.`}</p>
        </div>
      </div>
    </footer>`;
  }

  // Simple footer
  return `
  <footer style="padding:48px 24px;background:${theme.surface};border-top:1px solid ${theme.border};">
    <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;">
      <div style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.2rem;font-weight:700;color:${theme.text};">${props.brand}</div>
      <div style="display:flex;gap:12px;">
        ${socialLinks.map(s => `<a href="#" style="width:36px;height:36px;border-radius:8px;border:1px solid ${theme.border};display:flex;align-items:center;justify-content:center;color:${theme.textDim};text-decoration:none;transition:all 0.2s;" onmouseover="this.style.borderColor='${theme.accent}';this.style.color='${theme.accent}'" onmouseout="this.style.borderColor='${theme.border}';this.style.color='${theme.textDim}'">${icon(socialIconMap[s] || 'Globe', 16)}</a>`).join('')}
      </div>
      <p style="font-family:'${theme.fontBody}',sans-serif;font-size:0.8rem;color:${theme.textDim};margin:0;">${props.copyright || `© ${new Date().getFullYear()} ${props.brand}. All rights reserved.`}</p>
    </div>
  </footer>`;
}

// ════════════════════════════════════════════════════════════
// ── COMPONENT DISPATCH MAP
// ════════════════════════════════════════════════════════════

const RENDERERS = {
  NavBar: renderNavBar,
  HeroSection: renderHeroSection,
  FeatureGrid: renderFeatureGrid,
  TestimonialSection: renderTestimonialSection,
  AboutSection: renderAboutSection,
  CTASection: renderCTASection,
  ContactSection: renderContactSection,
  FooterSection: renderFooterSection,
};

// ════════════════════════════════════════════════════════════
// ── MAIN: Render full HTML page from layout spec
// ════════════════════════════════════════════════════════════

/**
 * Render a complete HTML page from a layout specification.
 * 
 * @param {object} layoutSpec - { sections: [...], theme: {...}, meta: {...} }
 * @param {object} themeConfig - Theme from themeRegistry (colorScheme, fontPair, etc.)
 * @returns {string} Complete HTML document string
 */
function renderToHTML(layoutSpec, themeConfig) {
  const theme = {
    bg: themeConfig.colorScheme?.bg || '#09090b',
    surface: themeConfig.colorScheme?.surface || '#18181b',
    border: themeConfig.colorScheme?.border || '#3f3f46',
    text: themeConfig.colorScheme?.text || '#fafafa',
    textDim: themeConfig.colorScheme?.textDim || '#a1a1aa',
    accent: themeConfig.colorScheme?.accent || '#3b82f6',
    accentHover: themeConfig.colorScheme?.accentHover || '#2563eb',
    fontHeading: themeConfig.fontPair?.heading || 'Inter',
    fontBody: themeConfig.fontPair?.body || 'Inter',
  };

  const meta = layoutSpec.meta || {};
  const title = meta.title || 'My Website';
  const description = meta.description || 'Built with AI';

  // Collect unique font families from theme
  const fonts = [...new Set([theme.fontHeading, theme.fontBody])].filter(Boolean);
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;

  // Render all sections (with individual error isolation)
  const sectionsHTML = (layoutSpec.sections || []).map((section, idx) => {
    const renderer = RENDERERS[section.component];
    if (!renderer) {
      console.warn(`[HTML Renderer] Unknown component: "${section.component}"`);
      return `<!-- Unknown component: ${section.component} -->`;
    }
    try {
      return renderer(section.props || {}, theme, section.variant);
    } catch (e) {
      console.error(`[HTML Renderer] Error rendering ${section.component} (index ${idx}):`, e.message);
      return `<!-- Error rendering ${section.component}: ${e.message} -->`;
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${googleFontsUrl}" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { 
      font-family: '${theme.fontBody}', system-ui, -apple-system, sans-serif; 
      background: ${theme.bg}; 
      color: ${theme.text};
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    img { max-width: 100%; }
    a { transition: all 0.2s ease; }

    /* Responsive: collapse grids on mobile */
    @media (max-width: 768px) {
      [style*="grid-template-columns: 1fr 1fr"],
      [style*="grid-template-columns:1fr 1fr"] {
        grid-template-columns: 1fr !important;
      }
      [style*="grid-template-columns: 2fr"],
      [style*="grid-template-columns:2fr"] {
        grid-template-columns: 1fr !important;
      }
      .nav-links { display: none !important; }
    }

    /* Fade-in animation */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    section { animation: fadeInUp 0.6s ease-out both; }
    section:nth-child(2) { animation-delay: 0.1s; }
    section:nth-child(3) { animation-delay: 0.2s; }
    section:nth-child(4) { animation-delay: 0.3s; }
    section:nth-child(5) { animation-delay: 0.4s; }
    section:nth-child(6) { animation-delay: 0.5s; }
  </style>
</head>
<body>
${sectionsHTML}
<script>
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
</script>
</body>
</html>`;
}

module.exports = { renderToHTML, RENDERERS };
