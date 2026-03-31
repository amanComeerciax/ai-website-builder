



/**
 * HTML Renderer — Premium theme-aware component rendering
 * UPDATED: Every component uses themeConfig colors/fonts, dark/light aware
 */

const LUCIDE_ICON_SVG = {
  ArrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  Check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  Star: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  Mail: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
  Phone: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 15.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  MapPin: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  Menu: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
  Send: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  Plus: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  Twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>',
  Github: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',
  Linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>',
  Instagram: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
  Zap: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  Shield: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  Globe: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  Users: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  Target: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  Award: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  Heart: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  Coffee: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1"/><path d="M6 2v2"/></svg>',
  Sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
  Clock: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  Leaf: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  Cpu: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
  TrendingUp: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  Pen: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
  Layout: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>',
  BookOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
};

const socialIconMap = { twitter: 'Twitter', github: 'Github', linkedin: 'Linkedin', instagram: 'Instagram' };

function icon(name, size) {
  const s = size || 22;
  let svg = LUCIDE_ICON_SVG[name] || LUCIDE_ICON_SVG['Zap'];
  return svg.replace(/width="\d+"/, `width="${s}"`).replace(/height="\d+"/, `height="${s}"`);
}

function stars(count) {
  const n = Math.min(Math.max(Math.round(count || 5), 0), 5);
  return Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < n ? '#facc15' : 'rgba(255,255,255,0.2)'}">${icon('Star', 13)}</span>`
  ).join('');
}

// ─────────────────────────────────────────────
// Theme helper — detect dark vs light
// ─────────────────────────────────────────────
function isDarkTheme(theme) {
  const bg = theme.bg || '#fff';
  const hex = bg.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

// ═══════════════════════════════════════════════
// NAVBAR — Visual Diversity (3 Variants)
// ═══════════════════════════════════════════════
function renderNavBar(props, theme, variant) {
  const dark = isDarkTheme(theme);
  const v = variant || 'default';
  const rawLinks = props.links || ['Home', 'About', 'Services', 'Contact'];
  const links = rawLinks.map(l => typeof l === 'string' ? l : (l.name || l.label || l.title || l.text || 'Link'));
  const brand = props.brand || 'Brand';

  // ── MINIMAL (Centered logo, clean lines — Restaurant/Medical/Education) ──
  if (v === 'minimal') {
    return `
<nav id="main-nav" class="fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,height,box-shadow] duration-300 ${dark ? 'bg-black/60' : 'bg-white/90'} backdrop-blur-lg" style="opacity:0; transform:translateY(-100%);">
  <div class="max-w-7xl mx-auto px-6 md:px-8">
    <div class="flex items-center justify-between h-14 md:h-16 border-b ${dark ? 'border-white/5' : 'border-black/5'}">
      <div class="nav-links hidden md:flex gap-8 items-center">
        ${links.slice(0, Math.ceil(links.length / 2)).map(link => `<a href="#${String(link).toLowerCase().replace(/\\s+/g, '-')}" class="font-body text-[13px] font-medium ${dark ? 'text-white/60 hover:text-white' : 'text-black/50 hover:text-black'} transition-colors duration-200 uppercase tracking-[0.12em]">${link}</a>`).join('')}
      </div>
      <a href="#" class="font-heading text-lg md:text-xl font-black text-theme-text tracking-tighter no-underline absolute left-1/2 -translate-x-1/2">
        ${props.logoUrl ? `<img src="${props.logoUrl}" alt="${brand}" class="h-7 object-contain">` : brand}
      </a>
      <div class="nav-links hidden md:flex gap-8 items-center">
        ${links.slice(Math.ceil(links.length / 2)).map(link => `<a href="#${String(link).toLowerCase().replace(/\\s+/g, '-')}" class="font-body text-[13px] font-medium ${dark ? 'text-white/60 hover:text-white' : 'text-black/50 hover:text-black'} transition-colors duration-200 uppercase tracking-[0.12em]">${link}</a>`).join('')}
      </div>
    </div>
  </div>
</nav>`;
  }

  // ── BOLD (Agency / Creative — strong presence) ──
  if (v === 'bold') {
    return `
<nav id="main-nav" class="fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,height,box-shadow] duration-300 ${dark ? 'bg-[#0d0d0d]' : 'bg-white'} border-b ${dark ? 'border-white/5' : 'border-black/5'}" style="opacity:0; transform:translateY(-100%);">
  <div class="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between h-16 md:h-20">
    <a href="#" class="font-heading text-xl md:text-2xl font-black text-theme-text tracking-tighter no-underline uppercase">
      ${props.logoUrl ? `<img src="${props.logoUrl}" alt="${brand}" class="h-8 object-contain">` : brand}
    </a>
    <div class="flex items-center gap-0">
      <div class="nav-links hidden md:flex items-center">
        ${links.map(link => `<a href="#${String(link).toLowerCase().replace(/\\s+/g, '-')}" class="font-body text-sm font-medium ${dark ? 'text-white/60 hover:text-white' : 'text-black/50 hover:text-black'} transition-colors duration-200 px-5 py-2 relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[2px] after:bg-theme-accent after:transition-all after:duration-300 hover:after:w-3/4">${link}</a>`).join('')}
      </div>
      ${props.ctaText ? `
      <a href="${props.ctaLink || '#contact'}" class="ml-4 inline-flex items-center justify-center bg-theme-accent text-white px-7 py-3 rounded-none font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:bg-white hover:text-black">${props.ctaText}</a>` : ''}
    </div>
  </div>
</nav>`;
  }

  // ── DEFAULT (Glassmorphic — SaaS/General) ──
  return `
<nav id="main-nav" class="fixed top-0 inset-x-0 z-50 backdrop-blur-xl transition-[background-color,border-color,height,box-shadow] duration-300 ease-in-out border-b ${dark ? 'bg-black/40 border-white/10' : 'bg-white/80 border-black/5'}" style="opacity:0; transform:translateY(-100%);">
  <div class="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between h-16 md:h-20">
    <a href="#" class="font-heading text-xl md:text-2xl font-extrabold text-theme-text tracking-tight no-underline">
      ${props.logoUrl ? `<img src="${props.logoUrl}" alt="${brand}" class="h-8 object-contain">` : brand}
    </a>
    <div class="flex items-center gap-8">
      <div class="nav-links hidden md:flex gap-8 items-center">
        ${links.map(link => `<a href="#${String(link).toLowerCase().replace(/\\s+/g, '-')}" class="font-body text-sm font-medium ${dark ? 'text-white/70 hover:text-white' : 'text-black/60 hover:text-black'} transition-colors duration-200">${link}</a>`).join('')}
      </div>
      ${props.ctaText ? `
      <a href="${props.ctaLink || '#contact'}" class="inline-flex items-center justify-center bg-theme-accent hover:bg-theme-hover text-white px-6 py-2.5 rounded-theme font-body text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-theme-accent/30">${props.ctaText}</a>` : ''}
    </div>
  </div>
</nav>`;
}

// ═══════════════════════════════════════════════
// HERO — Tailwind Component
// ═══════════════════════════════════════════════
function renderHeroSection(props, theme, variant) {
  const v = variant || 'centered';
  const dark = isDarkTheme(theme);

  // ── RADIANT (Tech / SaaS Dark Mode) ──
  if (v === 'radiant') {
    return `
<section class="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_center,theme(colors.theme-accent/20%),transparent_70%)] pointer-events-none"></div>
  <div class="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-theme-accent/30 blur-[120px] rounded-[100%] pointer-events-none"></div>
  <div class="relative z-10 text-center max-w-5xl px-6 pt-32 pb-20 mx-auto flex flex-col items-center">
    ${props.badgeText ? `<a href="#" class="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-body text-xs font-semibold px-4 py-1.5 rounded-full mb-8 hover:bg-white/10 transition backdrop-blur-md"><span>✨</span> ${props.badgeText} ${icon('ArrowRight', 14)}</a>` : ''}
    <h1 class="font-heading text-6xl md:text-8xl font-black leading-[1.05] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-8 drop-shadow-2xl">${props.heading}</h1>
    <p class="font-body text-lg md:text-xl leading-relaxed text-zinc-400 mx-auto mb-10 max-w-2xl">${props.subtext}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a href="${props.ctaLink || '#contact'}" class="inline-flex justify-center items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-body text-sm font-bold transition-all duration-300 hover:scale-105 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">${props.ctaText}</a>
      ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="inline-flex justify-center items-center gap-2 border border-white/10 text-white px-8 py-4 rounded-xl font-body text-sm font-semibold transition-all duration-200 hover:bg-white/5 backdrop-blur-md">${props.secondaryCtaText}</a>` : ''}
    </div>
  </div>
  <div class="relative w-full max-w-5xl mx-auto px-6 z-10 mt-10">
    <div class="rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur-xl shadow-2xl shadow-theme-accent/10">
      <div class="rounded-xl border border-white/5 bg-[#111] overflow-hidden">
        <div class="h-10 border-b border-white/5 flex items-center px-4 gap-2">
          <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
        </div>
        <div class="p-8 text-left text-sm font-mono text-zinc-400">
           <span class="text-theme-accent">~</span> npm install ${props.brand ? props.brand.toLowerCase().replace(/\\s+/g, '-') : 'radiant'}<br/>
           <span class="text-zinc-600">Installing dependencies...</span><br/>
           <span class="text-green-400">✓ Ready to build.</span>
        </div>
      </div>
    </div>
  </div>
</section>`;
  }

  // ── SALIENT (Clean / Pill / Wireframe SaaS) ──
  if (v === 'salient') {
    return `
<section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-theme-bg">
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
  <div class="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-theme-accent opacity-20 blur-[100px]"></div>
  <div class="relative z-10 text-center max-w-4xl px-6 pt-32 pb-24 mx-auto">
    ${props.badgeText ? `<div class="mx-auto w-fit mb-8 mb-6 flex items-center justify-center space-x-2 overflow-hidden rounded-full ${dark ? 'bg-white/5 ring-white/10' : 'bg-blue-50 ring-blue-200'} px-3 py-1 ring-1 backdrop-blur-md"><p class="text-sm font-medium ${dark ? 'text-white/90' : 'text-blue-900'}">${props.badgeText}</p></div>` : ''}
    <h1 class="font-heading text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-theme-text mb-8">${props.heading}</h1>
    <p class="font-body text-lg leading-relaxed text-theme-dim mx-auto mb-10 max-w-2xl">${props.subtext}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a href="${props.ctaLink || '#contact'}" class="inline-flex justify-center items-center gap-2 bg-theme-accent hover:bg-theme-hover text-white px-8 py-3.5 rounded-full font-body text-sm font-semibold transition-all duration-300 shadow-md">${props.ctaText}</a>
      ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="inline-flex justify-center items-center gap-2 bg-theme-surface border border-theme-border text-theme-text px-8 py-3.5 rounded-full font-body text-sm font-semibold transition-all duration-200 hover:bg-theme-accent/5 shadow-sm">${props.secondaryCtaText} ${icon('Play', 14)}</a>` : ''}
    </div>
  </div>
</section>`;
  }

  // ── STUXEN (Dark Digital Agency) ──
  if (v === 'stuxen') {
    return `
<section class="min-h-screen flex items-center relative overflow-hidden bg-[#0d0d0d]">
  <div class="absolute top-0 right-0 w-[50vw] h-[50vw] bg-theme-accent/10 rounded-full blur-[150px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
  <div class="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-theme-accent/5 rounded-full blur-[150px] pointer-events-none transform -translate-x-1/3 translate-y-1/3"></div>
  <div class="max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-24 grid lg:grid-cols-12 gap-16 items-center relative z-10 w-full">
    <div class="lg:col-span-7">
      ${props.badgeText ? `<div class="inline-flex items-center gap-2 bg-theme-accent/10 text-theme-accent font-body text-xs font-bold px-4 py-2 rounded-md mb-8 tracking-widest uppercase border-l-2 border-theme-accent">${props.badgeText}</div>` : ''}
      <h1 class="font-heading text-5xl md:text-7xl font-black leading-tight tracking-tight text-white mb-6 uppercase">${props.heading}</h1>
      <p class="font-body text-xl leading-relaxed text-zinc-400 mb-10 max-w-lg">${props.subtext}</p>
      <div class="flex flex-col flex-wrap sm:flex-row gap-6 items-start">
        <a href="${props.ctaLink || '#contact'}" class="inline-flex justify-center items-center gap-3 bg-theme-accent hover:bg-white hover:text-black text-white px-8 py-4 rounded-none font-body text-sm font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group">
          <span class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          <span class="relative z-10">${props.ctaText}</span>
          <span class="relative z-10">${icon('ArrowUpRight', 18)}</span>
        </a>
      </div>
    </div>
    <div class="lg:col-span-5 relative hidden lg:block">
       <div class="aspect-[4/5] rounded-tl-[100px] rounded-br-[100px] overflow-hidden border border-white/10 relative">
          <img src="${props.bgImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80'}" alt="Agency" class="w-full h-full object-cover">
          <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0d0d0d] to-transparent"></div>
       </div>
       <div class="absolute -bottom-10 -left-10 bg-[#111] border border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div class="font-heading text-4xl font-black text-white mb-1">10+</div>
          <div class="font-body text-xs uppercase tracking-widest text-zinc-500">Years of<br/>Excellence</div>
       </div>
    </div>
  </div>
</section>`;
  }

  // ── AURORA (SaaS / Tech) ──
  if (v === 'aurora' || v === 'sparkles') {
    return `
<section class="min-h-screen flex items-center justify-center relative overflow-hidden bg-theme-bg">
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute w-[900px] h-[900px] -top-[300px] left-1/2 -translate-x-1/2 bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-theme-accent/20 to-transparent animate-pulse" style="animation-duration: 8s;"></div>
    <div class="absolute w-[600px] h-[600px] -bottom-[200px] -left-[100px] bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-theme-accent/15 to-transparent animate-pulse" style="animation-duration: 12s; animation-direction: reverse;"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--tw-gradient-stops))] from-theme-accent/10 to-transparent bg-[length:40px_40px] opacity-50"></div>
  </div>
  <div class="relative z-10 text-center max-w-4xl px-6 pt-32 pb-24 mx-auto">
    ${props.badgeText ? `<div class="inline-flex items-center gap-2 bg-theme-accent/10 border border-theme-accent/20 text-theme-accent font-body text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase backdrop-blur-sm">${props.badgeText}</div>` : ''}
    <h1 class="font-heading text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-theme-text mb-8">${props.heading}</h1>
    <p class="font-body text-lg md:text-xl leading-relaxed text-theme-dim mx-auto mb-10 max-w-2xl">${props.subtext}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a href="${props.ctaLink || '#contact'}" class="inline-flex w-full sm:w-auto justify-center items-center gap-2.5 bg-theme-accent hover:bg-theme-hover text-white px-8 py-4 rounded-theme font-body text-base font-bold transition-all duration-300 shadow-xl shadow-theme-accent/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-theme-accent/40">${props.ctaText} ${icon('ArrowRight', 18)}</a>
      ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="inline-flex w-full sm:w-auto justify-center items-center gap-2.5 border ${dark ? 'border-white/10 hover:border-theme-accent hover:bg-theme-accent/5 text-white/90' : 'border-black/10 hover:border-theme-accent hover:bg-theme-accent/5 text-black/90'} px-8 py-4 rounded-theme font-body text-base font-medium transition-all duration-200 backdrop-blur-md">${props.secondaryCtaText}</a>` : ''}
    </div>
  </div>
</section>`;
  }

  // ── SPLIT (Agency / Local Biz) ──
  if (v === 'split') {
    return `
<section class="min-h-screen flex items-center bg-theme-bg overflow-hidden pt-24 md:pt-0">
  <div class="max-w-7xl mx-auto px-6 md:px-8 py-16 grid md:grid-cols-2 gap-12 md:gap-20 items-center w-full">
    <div class="order-2 md:order-1">
      ${props.badgeText ? `<div class="inline-flex items-center gap-2 bg-theme-accent/10 border border-theme-accent/20 text-theme-accent font-body text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">${props.badgeText}</div>` : ''}
      <h1 class="font-heading text-4xl md:text-6xl font-black leading-[1.1] tracking-tight text-theme-text mb-6">${props.heading}</h1>
      <p class="font-body text-lg md:text-xl leading-relaxed text-theme-dim mb-10 max-w-lg">${props.subtext}</p>
      <div class="flex flex-col sm:flex-row gap-4 items-start">
        <a href="${props.ctaLink || '#contact'}" class="inline-flex justify-center items-center gap-2 bg-theme-accent hover:bg-theme-hover text-white px-8 py-3.5 rounded-theme font-body text-sm font-bold transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-theme-accent/25">${props.ctaText} ${icon('ArrowRight', 16)}</a>
        ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="inline-flex justify-center items-center gap-2 border ${dark ? 'border-theme-border text-theme-text hover:border-theme-accent' : 'border-theme-border text-theme-text hover:border-theme-accent'} px-8 py-3.5 rounded-theme font-body text-sm font-medium transition-all duration-200">${props.secondaryCtaText}</a>` : ''}
      </div>
    </div>
    <div class="relative order-1 md:order-2">
      <div class="absolute -inset-4 md:-inset-8 bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-theme-accent/20 to-transparent opacity-70 blur-2xl"></div>
      <div class="relative rounded-[24px] overflow-hidden shadow-2xl ${dark ? 'shadow-black/50' : 'shadow-zinc-200'}">
        <img src="${props.bgImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80'}" alt="${props.heading}" class="w-full h-[400px] md:h-[600px] object-cover block">
        <div class="absolute inset-0 bg-gradient-to-tr from-theme-accent/10 to-transparent pointer-events-none"></div>
      </div>
    </div>
  </div>
</section>`;
  }

  // ── FULL IMAGE (Restaurant / Hotel) ──
  if (v === 'fullImage') {
    return `
<section class="min-h-screen flex items-center justify-center relative overflow-hidden">
  <img src="${props.bgImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80'}" alt="Hero Background" class="absolute inset-0 w-full h-full object-cover">
  <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20"></div>
  <div class="relative z-10 max-w-7xl w-full px-6 md:px-8 py-32 md:py-0 pt-48">
    <div class="max-w-2xl">
      ${props.badgeText ? `<div class="inline-flex items-center gap-2 border border-white/30 text-white font-body text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase backdrop-blur-sm">${props.badgeText}</div>` : ''}
      <h1 class="font-heading text-4xl md:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6 drop-shadow-lg">${props.heading}</h1>
      <p class="font-body text-lg md:text-xl leading-relaxed text-white/90 mb-10 drop-shadow">${props.subtext}</p>
      <div class="flex flex-col sm:flex-row gap-4 items-start">
        <a href="${props.ctaLink || '#contact'}" class="inline-flex justify-center items-center gap-2 bg-theme-accent hover:bg-theme-hover text-white px-8 py-4 rounded-theme font-body text-base font-bold transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/30">${props.ctaText} ${icon('ArrowRight', 18)}</a>
        ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="inline-flex justify-center items-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-theme font-body text-base font-medium transition-all duration-200 hover:bg-white/10 backdrop-blur-md hover:border-white/60">${props.secondaryCtaText}</a>` : ''}
      </div>
    </div>
  </div>
</section>`;
  }

  // ── CENTERED (Portfolio / Default) ──
  return `
<section class="min-h-screen flex items-center justify-center bg-theme-bg px-6 py-32 relative overflow-hidden">
  ${isDarkTheme(theme)
      ? `<div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,var(--tw-gradient-stops))] from-theme-accent/20 to-transparent pointer-events-none opacity-60"></div>`
      : `<div class="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--tw-gradient-stops))] from-theme-accent/10 to-transparent pointer-events-none opacity-50"></div>`
    }
  <div class="relative z-10 text-center max-w-3xl mx-auto pt-10">
    ${props.badgeText ? `<div class="inline-flex items-center gap-2 bg-theme-accent/10 border border-theme-accent/20 text-theme-accent font-body text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase">${props.badgeText}</div>` : ''}
    <h1 class="font-heading text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-theme-text mb-6">${props.heading}</h1>
    <p class="font-body text-lg md:text-xl leading-relaxed text-theme-dim mx-auto mb-10 max-w-2xl">${props.subtext}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a href="${props.ctaLink || '#contact'}" class="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-theme-accent hover:bg-theme-hover text-white px-8 py-3.5 rounded-theme font-body text-sm font-bold transition-all duration-300 shadow-xl shadow-theme-accent/25 hover:-translate-y-1">${props.ctaText} ${icon('ArrowRight', 16)}</a>
      ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="inline-flex w-full sm:w-auto justify-center items-center gap-2 border border-theme-border text-theme-text hover:border-theme-accent px-8 py-3.5 rounded-theme font-body text-sm font-medium transition-all duration-200">${props.secondaryCtaText}</a>` : ''}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// FEATURE GRID — Visual Diversity Engine
// ═══════════════════════════════════════════════
function renderFeatureGrid(props, theme, v) {
  const items = props.items || [];
  const dark = isDarkTheme(theme);

  // ── SALIENT (Clean SaaS / Light) ──
  if (v === 'salient') {
    return `
<section id="features" class="py-24 px-6 md:px-8 bg-slate-50 border-t border-slate-200">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-20">
      <h2 class="font-heading text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-slate-600 max-w-2xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      ${items.map(item => `
        <div class="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-full bg-blue-50 text-theme-accent flex items-center justify-center mb-6 ring-1 ring-blue-100">
            ${icon(item.icon || 'Zap', 20)}
          </div>
          <h3 class="font-heading text-xl font-bold text-slate-900 mb-3">${item.title}</h3>
          <p class="font-body text-slate-600 leading-relaxed text-sm">${item.description}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── RADIANT (Futuristic Tech / Dark Glow) ──
  if (v === 'radiant') {
    return `
<section id="features" class="py-32 px-6 md:px-8 bg-[#0a0a0a] relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-theme-accent/5 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none"></div>
  <div class="max-w-7xl mx-auto relative z-10">
    <div class="text-center mb-24">
      <h2 class="font-heading text-4xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-zinc-400 max-w-2xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${items.map(item => `
        <div class="group relative rounded-2xl bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-colors duration-300">
          <div class="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 text-white">
            ${icon(item.icon || 'Zap', 20)}
          </div>
          <h3 class="font-heading text-lg font-semibold text-white mb-3">${item.title}</h3>
          <p class="font-body text-zinc-400 text-sm leading-relaxed">${item.description}</p>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── WARM (Restaurant / Cafe / Hotel — organic, image-accent) ──
  if (v === 'warm') {
    return `
<section id="features" class="py-28 px-6 md:px-8 bg-theme-bg relative overflow-hidden">
  <div class="max-w-7xl mx-auto relative z-10">
    <div class="text-center mb-20">
      <span class="font-body text-sm font-semibold text-theme-accent uppercase tracking-[0.2em] mb-4 block">What We Offer</span>
      <h2 class="font-heading text-4xl md:text-5xl font-bold tracking-tight text-theme-text mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${items.map((item, i) => `
        <div class="group flex gap-6 p-8 rounded-2xl ${dark ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-stone-50 hover:bg-stone-100'} border ${dark ? 'border-white/5' : 'border-stone-200/60'} transition-all duration-500 hover:-translate-y-1 items-start">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-theme-accent/20 to-theme-accent/5 flex items-center justify-center text-theme-accent flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-inner">
            ${icon(item.icon || 'Zap', 28)}
          </div>
          <div class="flex-1">
            <h3 class="font-heading text-xl font-bold text-theme-text mb-2 tracking-tight">${item.title}</h3>
            <p class="font-body text-theme-dim leading-relaxed text-[0.93rem]">${item.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── BOLD (Agency / Creative — numbered, asymmetric) ──
  if (v === 'bold') {
    return `
<section id="features" class="py-32 px-6 md:px-8 bg-theme-bg relative overflow-hidden">
  <div class="max-w-7xl mx-auto relative z-10">
    <div class="mb-24">
      <h2 class="font-heading text-5xl md:text-7xl font-black tracking-tighter text-theme-text mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-xl text-theme-dim max-w-xl">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-0 border-t ${dark ? 'border-white/10' : 'border-black/10'}">
      ${items.map((item, i) => `
        <div class="group p-10 md:p-12 border-b ${dark ? 'border-white/10' : 'border-black/10'} ${i % 2 === 0 ? `md:border-r ${dark ? 'md:border-white/10' : 'md:border-black/10'}` : ''} hover:bg-theme-accent/[0.03] transition-all duration-500 relative overflow-hidden">
          <div class="absolute top-6 right-8 font-heading text-[5rem] font-black ${dark ? 'text-white/[0.04]' : 'text-black/[0.04]'} leading-none select-none group-hover:text-theme-accent/10 transition-colors duration-700">0${i + 1}</div>
          <div class="relative z-10">
            <div class="w-10 h-10 rounded-lg bg-theme-accent/10 flex items-center justify-center text-theme-accent mb-6 border border-theme-accent/20">
              ${icon(item.icon || 'Zap', 20)}
            </div>
            <h3 class="font-heading text-2xl font-black text-theme-text mb-4 tracking-tight uppercase">${item.title}</h3>
            <p class="font-body text-theme-dim leading-relaxed">${item.description}</p>
            <div class="mt-6 w-12 h-0.5 bg-theme-accent/40 group-hover:w-24 transition-all duration-700"></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── ENERGETIC (Gym / Salon — sharp, gradient, powerful) ──
  if (v === 'energetic') {
    return `
<section id="features" class="py-28 px-6 md:px-8 bg-theme-bg relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,var(--tw-gradient-stops))] from-theme-accent/8 to-transparent pointer-events-none"></div>
  <div class="max-w-7xl mx-auto relative z-10">
    <div class="text-center mb-20">
      <h2 class="font-heading text-4xl md:text-6xl font-black tracking-tight text-theme-text mb-4 uppercase">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-2xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      ${items.map((item, i) => `
        <div class="group relative rounded-none p-8 bg-gradient-to-b ${dark ? 'from-white/[0.06] to-white/[0.02]' : 'from-black/[0.03] to-transparent'} border-l-4 border-l-theme-accent ${dark ? 'border-y border-r border-white/5' : 'border-y border-r border-black/5'} hover:border-l-8 transition-all duration-300 overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-theme-accent/5 rounded-full blur-3xl group-hover:bg-theme-accent/15 transition-all duration-700 -translate-y-1/2 translate-x-1/2"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 rounded-full bg-theme-accent/15 flex items-center justify-center text-theme-accent mb-6 group-hover:bg-theme-accent group-hover:text-white transition-all duration-500">
              ${icon(item.icon || 'Zap', 26)}
            </div>
            <h3 class="font-heading text-lg font-black text-theme-text mb-3 uppercase tracking-wide">${item.title}</h3>
            <p class="font-body text-theme-dim text-sm leading-relaxed">${item.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── CLEAN (Medical / Education — professional, trustworthy) ──
  if (v === 'clean') {
    return `
<section id="features" class="py-28 px-6 md:px-8 bg-theme-bg">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-20">
      <h2 class="font-heading text-3xl md:text-5xl font-bold tracking-tight text-theme-text mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-2xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      ${items.map((item, i) => `
        <div class="group flex items-start gap-5 p-6 rounded-xl ${dark ? 'bg-white/[0.02] hover:bg-white/[0.05]' : 'bg-white hover:bg-blue-50/30'} border ${dark ? 'border-white/5' : 'border-slate-200'} transition-all duration-300 border-l-[3px] border-l-transparent hover:border-l-theme-accent">
          <div class="w-11 h-11 rounded-lg ${dark ? 'bg-theme-accent/10' : 'bg-blue-50'} flex items-center justify-center text-theme-accent flex-shrink-0 mt-0.5">
            ${icon(item.icon || 'Zap', 20)}
          </div>
          <div>
            <h3 class="font-heading text-base font-bold text-theme-text mb-1.5">${item.title}</h3>
            <p class="font-body text-theme-dim text-sm leading-relaxed">${item.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── DEFAULT (Generic — glassmorphism cards) ──
  return `
<section id="features" class="py-24 px-6 md:px-8 bg-theme-bg relative overflow-hidden">
  <div class="max-w-7xl mx-auto relative z-10">
    <div class="text-center mb-20">
      <h2 class="font-heading text-4xl md:text-5xl font-black tracking-tight text-theme-text mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-2xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${items.map((item, i) => {
    return `
        <div class="group relative rounded-3xl p-8 bg-theme-surface border ${dark ? 'border-white/5' : 'border-black/5'} overflow-hidden transition-all duration-500 hover:-translate-y-1">
          <div class="absolute inset-0 bg-gradient-to-br from-theme-accent/0 to-theme-accent/0 group-hover:from-theme-accent/5 group-hover:to-transparent transition-all duration-500"></div>
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-theme-accent/10 rounded-full blur-3xl group-hover:bg-theme-accent/20 transition-all duration-500"></div>
          
          <div class="relative z-10 flex flex-col h-full min-h-[220px]">
            <div class="w-12 h-12 rounded-xl bg-theme-accent/10 flex items-center justify-center text-theme-accent mb-6 border border-theme-accent/20 group-hover:scale-110 transition-transform duration-500">
              ${icon(item.icon || 'Zap', 24)}
            </div>
            
            <div>
              <h3 class="font-heading text-xl font-bold text-theme-text mb-3 tracking-tight">${item.title}</h3>
              <p class="font-body text-theme-dim line-clamp-4 leading-relaxed">${item.description}</p>
            </div>
          </div>
        </div>`;
  }).join('')}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// BENTO GRID — premium SaaS-style
// ═══════════════════════════════════════════════
function renderBentoGrid(props, theme) {
  const items = props.items || [];
  const dark = isDarkTheme(theme);
  const cardBg = dark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const cardBorder = dark ? 'rgba(255,255,255,0.08)' : theme.border;

  return `
<section id="features-bento" style="padding:120px 32px;background:${theme.bg};">
  <div style="max-width:1280px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:72px;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;color:${theme.text};margin:0 0 16px;">${props.heading || 'Features'}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.1rem;color:${theme.textDim};max-width:580px;margin:0 auto;line-height:1.7;">${props.subtext}</p>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;auto-rows:320px;">
      ${items.map((item, i) => {
    const isWide = (item.className || '').includes('col-span-2');
    return `
      <div style="grid-column:${isWide ? 'span 2' : 'span 1'};background:${cardBg};border:1px solid ${cardBorder};border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:all 0.35s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 60px rgba(0,0,0,${dark ? '0.35' : '0.1'})';" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="padding:32px;flex:1;">
          <div style="width:44px;height:44px;border-radius:10px;background:${theme.accent}18;border:1px solid ${theme.accent}22;display:flex;align-items:center;justify-content:center;color:${theme.accent};margin-bottom:20px;">${icon(item.icon || 'Zap', 20)}</div>
          <h3 style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.2rem;font-weight:700;color:${theme.text};margin:0 0 10px;letter-spacing:-0.02em;">${item.title}</h3>
          <p style="font-family:'${theme.fontBody}',sans-serif;font-size:0.9rem;line-height:1.65;color:${theme.textDim};margin:0;">${item.description}</p>
        </div>
        ${item.header ? `<div style="height:140px;overflow:hidden;border-top:1px solid ${cardBorder};"><img src="${item.header}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.6s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform=''"></div>` : `<div style="height:140px;background:linear-gradient(135deg,${theme.accent}12,${dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'});border-top:1px solid ${cardBorder};"></div>`}
      </div>`;
  }).join('')}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// PORTFOLIO — masonry-style hover reveal
// ═══════════════════════════════════════════════
function renderPortfolioSection(props, theme) {
  const items = props.items || [];
  const dark = isDarkTheme(theme);
  const fallbackImages = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  ];

  return `
<section id="portfolio" style="padding:120px 32px;background:${theme.surface};">
  <div style="max-width:1280px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:72px;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;color:${theme.text};margin:0 0 16px;">${props.heading}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.1rem;color:${theme.textDim};margin:0 auto;max-width:540px;line-height:1.7;">${props.subtext}</p>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;">
      ${items.map((item, i) => {
    const imgSrc = (item.image && !item.image.includes('undefined')) ? item.image : fallbackImages[i % fallbackImages.length];
    return `
      <div style="position:relative;border-radius:20px;overflow:hidden;aspect-ratio:4/3;cursor:pointer;" onmouseover="this.querySelector('.port-overlay').style.opacity='1';this.querySelector('img').style.transform='scale(1.08)'" onmouseout="this.querySelector('.port-overlay').style.opacity='0';this.querySelector('img').style.transform='scale(1)'">
        <img src="${imgSrc}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.7s cubic-bezier(0.4,0,0.2,1);">
        <div class="port-overlay" style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.3) 50%,transparent 100%);opacity:0;transition:opacity 0.4s;display:flex;flex-direction:column;justify-content:flex-end;padding:28px;">
          ${item.category ? `<span style="font-family:'${theme.fontBody}',sans-serif;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${theme.accent};margin-bottom:8px;">${item.category}</span>` : ''}
          <h3 style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.2rem;font-weight:700;color:#fff;margin:0;">${item.title}</h3>
        </div>
      </div>`}).join('')}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// ABOUT — split layout with stats
// ═══════════════════════════════════════════════
function renderAboutSection(props, theme) {
  const dark = isDarkTheme(theme);
  const statItems = props.stats || [];
  return `
<section id="about" style="padding:120px 32px;background:${theme.bg};overflow:hidden;">
  <div style="max-width:1280px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;">
    <div style="position:relative;">
      <div style="position:absolute;inset:-30px;background:radial-gradient(circle at 30% 50%,${theme.accent}14,transparent 70%);filter:blur(30px);"></div>
      <div style="position:relative;border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,${dark ? '0.4' : '0.1'});">
        <img src="${props.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80'}" alt="${props.heading}" style="width:100%;height:500px;object-fit:cover;display:block;">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,${theme.accent}18,transparent 60%);"></div>
      </div>
    </div>
    <div>
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;color:${theme.text};margin:0 0 24px;">${props.heading}</h2>
      <p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;line-height:1.8;color:${theme.textDim};margin:0 0 40px;">${props.description}</p>
      ${statItems.length > 0 ? `
      <div style="display:grid;grid-template-columns:repeat(${Math.min(statItems.length, 3)},1fr);gap:24px;padding-top:32px;border-top:1px solid ${theme.border};">
        ${statItems.map(s => `
        <div class="sf-stagger-card">
          <div class="sf-counter" data-target="${s.value}" style="font-family:'${theme.fontHeading}',sans-serif;font-size:2.2rem;font-weight:900;color:${theme.accent};letter-spacing:-0.03em;">${s.value}</div>
          <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.8rem;color:${theme.textDim};margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">${s.label}</div>
        </div>`).join('')}
      </div>` : ''}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// TESTIMONIALS — Visual Diversity (3 Variants)
// ═══════════════════════════════════════════════
function renderTestimonialSection(props, theme, variant) {
  const items = props.items || [];
  const dark = isDarkTheme(theme);
  const v = variant || 'default';

  // ── GRID (Static 3-column cards — Professional/Clean) ──
  if (v === 'grid') {
    return `
<section id="testimonials" class="py-28 px-6 md:px-8 bg-theme-bg">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="font-heading text-4xl md:text-5xl font-bold tracking-tight text-theme-text mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-2xl mx-auto">${props.subtext}</p>` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${items.slice(0, 6).map((item, i) => `
        <div class="sf-stagger-card group p-8 rounded-2xl ${dark ? 'bg-white/[0.03] border border-white/5 hover:border-theme-accent/30' : 'bg-white border border-slate-200 hover:border-theme-accent/50'} transition-all duration-500 hover:-translate-y-1 ${i === 0 ? 'md:col-span-2 md:row-span-1' : ''}">
          <div class="flex gap-1 mb-5 text-theme-accent">${stars(item.rating)}</div>
          <p class="font-body text-theme-dim leading-relaxed mb-8 ${i === 0 ? 'text-lg' : 'text-[0.95rem]'}">"${item.quote}"</p>
          <div class="flex items-center gap-4 mt-auto pt-6 border-t ${dark ? 'border-white/5' : 'border-slate-100'}">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-theme-accent/30 to-theme-accent/10 flex items-center justify-center text-theme-accent font-heading text-lg font-bold">
              ${(item.name || 'U')[0]}
            </div>
            <div>
              <div class="font-body text-sm font-bold text-theme-text">${item.name}</div>
              <div class="font-body text-xs text-theme-dim">${item.role || 'Customer'}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
  }

  // ── SPOTLIGHT (Single large featured quote — Luxury/Elegant) ──
  if (v === 'spotlight') {
    const featured = items[0] || { quote: '', name: 'Customer', role: '', rating: 5 };
    return `
<section id="testimonials" class="py-32 px-6 md:px-8 bg-theme-surface relative overflow-hidden">
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-theme-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="max-w-4xl mx-auto text-center relative z-10">
    <div class="mb-8">
      <h2 class="font-heading text-3xl md:text-4xl font-bold tracking-tight text-theme-text mb-4">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-theme-dim">${props.subtext}</p>` : ''}
    </div>
    <div class="relative p-12 md:p-16 rounded-3xl ${dark ? 'bg-white/[0.03] border border-white/10' : 'bg-white border border-slate-200 shadow-xl'} mb-12">
      <div class="absolute top-8 left-10 text-theme-accent/20 font-heading text-[8rem] leading-none select-none">"</div>
      <div class="relative z-10">
        <div class="flex justify-center gap-1 mb-8 text-theme-accent">${stars(featured.rating)}</div>
        <p class="font-body text-xl md:text-2xl leading-relaxed text-theme-text/80 mb-10 italic">"${featured.quote}"</p>
        <div class="flex items-center justify-center gap-4">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br from-theme-accent to-theme-accent/60 flex items-center justify-center text-white font-heading text-xl font-bold">
            ${(featured.name || 'U')[0]}
          </div>
          <div class="text-left">
            <div class="font-heading text-lg font-bold text-theme-text">${featured.name}</div>
            <div class="font-body text-sm text-theme-dim">${featured.role || 'Customer'}</div>
          </div>
        </div>
      </div>
    </div>
    ${items.length > 1 ? `
    <div class="flex justify-center gap-8 flex-wrap">
      ${items.slice(1, 4).map(item => `
        <div class="text-center max-w-[200px]">
          <p class="font-body text-sm text-theme-dim italic mb-3">"${item.quote.substring(0, 80)}..."</p>
          <div class="font-body text-xs font-bold text-theme-text">${item.name}</div>
        </div>
      `).join('')}
    </div>` : ''}
  </div>
</section>`;
  }

  // ── DEFAULT (Infinite Marquee Scroll) ──
  const scrollItems = [...items, ...items, ...items];
  return `
<section id="testimonials" class="py-32 bg-theme-surface relative overflow-hidden flex flex-col items-center justify-center">
  <div class="text-center mb-16 relative z-10 px-6">
    <h2 class="font-heading text-4xl md:text-5xl font-black tracking-tight text-theme-text mb-4">${props.heading}</h2>
    ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-2xl mx-auto">${props.subtext}</p>` : ''}
  </div>
  
  <div class="relative flex w-full max-w-[100vw] overflow-hidden">
    <div class="flex w-max animate-marquee gap-6 py-4 items-center">
      ${scrollItems.map(item => `
        <div class="w-[380px] shrink-0 rounded-2xl border ${dark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white/50'} p-6 backdrop-blur-sm transition-all duration-300 hover:border-theme-accent/50 hover:shadow-xl hover:shadow-theme-accent/10">
          <div class="flex gap-1 mb-4 text-theme-accent">
            ${stars(item.rating)}
          </div>
          <p class="font-body text-[0.95rem] leading-relaxed text-theme-dim mb-6 italic">"${item.quote}"</p>
          <div class="flex items-center gap-4 mt-auto">
            <div class="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent font-heading font-bold">
              ${(item.name || 'U')[0]}
            </div>
            <div>
              <div class="font-body text-sm font-bold text-theme-text">${item.name}</div>
              <div class="font-body text-xs text-theme-dim">${item.role || 'Customer'}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-theme-surface to-transparent"></div>
    <div class="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-theme-surface to-transparent"></div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// PRICING — Tailwind UI Corporate Glow
// ═══════════════════════════════════════════════
function renderPricingSection(props, theme) {
  const plans = props.plans || [];
  const dark = isDarkTheme(theme);

  return `
<section id="pricing" class="py-32 px-6 md:px-8 bg-theme-bg relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_center,var(--tw-gradient-stops))] from-theme-accent/5 to-transparent pointer-events-none"></div>
  <div class="max-w-6xl mx-auto text-center relative z-10">
    <h2 class="font-heading text-4xl md:text-5xl font-bold tracking-tight text-theme-text mb-4">${props.heading}</h2>
    ${props.subtext ? `<p class="font-body text-lg text-theme-dim max-w-2xl mx-auto mb-20">${props.subtext}</p>` : '<div class="mb-20"></div>'}
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
      ${plans.map(plan => `
        <div class="relative flex flex-col p-8 rounded-3xl ${plan.isPopular ? 'bg-theme-surface border-2 border-theme-accent shadow-2xl shadow-theme-accent/20 transform md:-translate-y-4' : `bg-theme-surface/50 border ${dark ? 'border-white/10' : 'border-black/5'} transition-transform duration-300 hover:-translate-y-2`}">
          ${plan.isPopular ? `<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-theme-accent text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">Most Popular</div>` : ''}
          
          <div class="text-left mb-8">
            <h3 class="font-heading text-xl font-bold text-theme-text mb-4">${plan.name}</h3>
            <div class="flex items-baseline gap-1 mb-4 overflow-hidden">
              <span class="font-heading text-4xl font-bold text-theme-text tracking-tight">${plan.price}</span>
              <span class="font-body text-sm font-medium text-theme-dim ml-1">${plan.price.includes('/') ? '' : '/mo'}</span>
            </div>
            ${plan.description ? `<p class="font-body text-xs text-theme-dim leading-relaxed">${plan.description}</p>` : ''}
          </div>
          
          <div class="flex-1 space-y-4 text-left mb-8">
            ${(plan.features || []).map(f => `
              <div class="flex items-start gap-3">
                <div class="mt-1 text-theme-accent flex-shrink-0">${icon('Check', 14)}</div>
                <span class="font-body text-sm text-theme-text/80">${f}</span>
              </div>
            `).join('')}
          </div>
          
          <a href="#contact" class="w-full inline-flex justify-center items-center py-3.5 rounded-xl font-body text-sm font-bold transition-all duration-300 ${plan.isPopular ? 'bg-theme-accent hover:bg-theme-hover text-white shadow-lg shadow-theme-accent/25 hover:-translate-y-0.5' : `bg-theme-text/5 hover:bg-theme-text/10 text-theme-text`}">
            ${plan.ctaText || 'Get Started'}
          </a>
        </div>
      `).join('')}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// FAQ — smooth accordion
// ═══════════════════════════════════════════════
function renderFAQSection(props, theme) {
  const items = props.items || [];
  const dark = isDarkTheme(theme);
  const cardBg = dark ? 'rgba(255,255,255,0.03)' : theme.surface;
  const cardBorder = dark ? 'rgba(255,255,255,0.07)' : theme.border;

  return `
<section id="faq" style="padding:120px 32px;background:${theme.bg};">
  <div style="max-width:760px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:64px;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;color:${theme.text};margin:0 0 16px;">${props.heading}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;color:${theme.textDim};">${props.subtext}</p>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${items.map((item, i) => `
      <div style="border:1px solid ${cardBorder};border-radius:16px;background:${cardBg};overflow:hidden;transition:border-color 0.3s;">
        <button style="width:100%;padding:22px 24px;background:none;border:none;display:flex;align-items:center;justify-content:space-between;cursor:pointer;text-align:left;outline:none;" onclick="const c=this.nextElementSibling;const ic=this.querySelector('.fq-ic');const isOpen=c.style.maxHeight;document.querySelectorAll('.fq-content').forEach(x=>{x.style.maxHeight=null;x.previousElementSibling.querySelector('.fq-ic').style.transform='';x.closest('div').style.borderColor='${cardBorder}';});if(!isOpen){c.style.maxHeight=c.scrollHeight+'px';ic.style.transform='rotate(45deg)';this.closest('div').style.borderColor='${theme.accent}';}">
          <span style="font-family:'${theme.fontBody}',sans-serif;font-size:1rem;font-weight:600;color:${theme.text};">${item.question}</span>
          <span class="fq-ic" style="color:${theme.accent};transition:transform 0.3s;flex-shrink:0;margin-left:16px;">${icon('Plus', 18)}</span>
        </button>
        <div class="fq-content" style="max-height:0;overflow:hidden;transition:max-height 0.35s ease-out;">
          <p style="padding:0 24px 22px;font-family:'${theme.fontBody}',sans-serif;font-size:0.93rem;line-height:1.75;color:${theme.textDim};margin:0;border-top:1px solid ${cardBorder};padding-top:16px;">${item.answer}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// CTA SECTION
// ═══════════════════════════════════════════════
function renderCTASection(props, theme) {
  const dark = isDarkTheme(theme);
  return `
<section id="cta" class="py-32 px-6 md:px-8 bg-theme-bg relative overflow-hidden">
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-theme-accent/20 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="max-w-5xl mx-auto relative z-10">
    <div class="relative overflow-hidden rounded-[40px] border ${dark ? 'border-white/10 bg-white/5' : 'border-black/5 bg-white'} p-12 md:p-20 text-center backdrop-blur-xl shadow-2xl">
      <div class="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
        ${icon('Zap', 120)}
      </div>
      <h2 class="font-heading text-4xl md:text-6xl font-bold tracking-tight text-theme-text mb-6">${props.heading}</h2>
      ${props.subtext ? `<p class="font-body text-lg md:text-xl text-theme-dim max-w-2xl mx-auto mb-12 leading-relaxed">${props.subtext}</p>` : ''}
      
      <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <a href="${props.ctaLink || '#contact'}" class="group relative inline-flex items-center gap-3 bg-theme-accent hover:bg-theme-hover text-white px-10 py-4 rounded-full font-body text-base font-bold transition-all duration-300 shadow-xl shadow-theme-accent/30 hover:-translate-y-1">
          <span>${props.ctaText}</span>
          <span class="group-hover:translate-x-1 transition-transform">${icon('ArrowRight', 20)}</span>
        </a>
        ${props.secondaryCtaText ? `<a href="${props.secondaryCtaLink || '#about'}" class="font-body text-base font-semibold text-theme-text hover:text-theme-accent transition-colors">${props.secondaryCtaText}</a>` : ''}
      </div>
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// CONTACT — split with form
// ═══════════════════════════════════════════════
function renderContactSection(props, theme) {
  const dark = isDarkTheme(theme);
  const inputBg = dark ? 'rgba(255,255,255,0.06)' : '#fff';
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : theme.border;

  return `
<section id="contact" style="padding:120px 32px;background:${theme.bg};">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:72px;">
      <h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;color:${theme.text};margin:0 0 16px;">${props.heading}</h2>
      ${props.subtext ? `<p style="font-family:'${theme.fontBody}',sans-serif;font-size:1.05rem;color:${theme.textDim};">${props.subtext}</p>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:60px;align-items:start;">
      <div style="display:flex;flex-direction:column;gap:20px;">
        ${[{ i: 'Mail', l: 'Email', v: props.email || 'hello@example.com' }, { i: 'Phone', l: 'Phone', v: props.phone || '+1 (555) 000-0000' }, { i: 'MapPin', l: 'Location', v: props.address || 'San Francisco, CA' }].map(x => `
        <div style="display:flex;gap:16px;align-items:center;padding:24px;border:1px solid ${dark ? 'rgba(255,255,255,0.07)' : theme.border};border-radius:16px;background:${dark ? 'rgba(255,255,255,0.03)' : theme.surface};">
          <div style="width:44px;height:44px;border-radius:12px;background:${theme.accent}15;display:flex;align-items:center;justify-content:center;color:${theme.accent};flex-shrink:0;">${icon(x.i, 20)}</div>
          <div>
            <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.75rem;font-weight:600;color:${theme.textDim};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">${x.l}</div>
            <div style="font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;font-weight:500;color:${theme.text};">${x.v}</div>
          </div>
        </div>`).join('')}
      </div>
      <form style="display:flex;flex-direction:column;gap:16px;" onsubmit="event.preventDefault();this.innerHTML='<div style=text-align:center;padding:40px;color:${theme.accent};font-family:sans-serif;font-weight:600;font-size:1.1rem>✓ Message sent! We\\'ll be in touch soon.</div>'">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="display:block;font-family:'${theme.fontBody}',sans-serif;font-size:0.78rem;font-weight:600;color:${theme.textDim};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Name</label>
            <input type="text" placeholder="John Doe" required style="width:100%;padding:13px 16px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${theme.text};font-family:'${theme.fontBody}',sans-serif;font-size:0.93rem;outline:none;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='${theme.accent}'" onblur="this.style.borderColor='${inputBorder}'">
          </div>
          <div>
            <label style="display:block;font-family:'${theme.fontBody}',sans-serif;font-size:0.78rem;font-weight:600;color:${theme.textDim};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Email</label>
            <input type="email" placeholder="you@example.com" required style="width:100%;padding:13px 16px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${theme.text};font-family:'${theme.fontBody}',sans-serif;font-size:0.93rem;outline:none;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='${theme.accent}'" onblur="this.style.borderColor='${inputBorder}'">
          </div>
        </div>
        <div>
          <label style="display:block;font-family:'${theme.fontBody}',sans-serif;font-size:0.78rem;font-weight:600;color:${theme.textDim};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Message</label>
          <textarea rows="5" placeholder="Tell us about your project..." required style="width:100%;padding:13px 16px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${theme.text};font-family:'${theme.fontBody}',sans-serif;font-size:0.93rem;outline:none;resize:vertical;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='${theme.accent}'" onblur="this.style.borderColor='${inputBorder}'"></textarea>
        </div>
        <button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;background:${theme.accent};color:#fff;padding:15px 32px;border-radius:12px;border:none;font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;font-weight:700;cursor:pointer;transition:all 0.3s;box-shadow:0 4px 20px ${theme.accent}35;" onmouseover="this.style.opacity='0.88';this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='1';this.style.transform=''">Send Message ${icon('Send', 16)}</button>
      </form>
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════
// STICKY SCROLL — JS-based (no CSS sticky bug)
// ═══════════════════════════════════════════════
function renderStickyScroll(props, theme) {
  const items = props.items || [];
  const dark = isDarkTheme(theme);
  const fallbackImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  ];

  return `
<section style="padding:120px 32px;background:${theme.surface};">
  <div style="max-width:1280px;margin:0 auto;">
    ${props.heading ? `<h2 style="font-family:'${theme.fontHeading}',sans-serif;font-size:clamp(2rem,4vw,3rem);font-weight:800;letter-spacing:-0.03em;color:${theme.text};margin:0 0 72px;text-align:center;">${props.heading}</h2>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;">
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${items.map((item, i) => {
    const imgSrc = (item.content && typeof item.content === 'string' && !item.content.includes('undefined')) ? item.content : fallbackImages[i % fallbackImages.length];
    return `
        <div class="ss-item" data-index="${i}" style="padding:32px;border-radius:20px;border:1px solid ${dark ? 'rgba(255,255,255,0.05)' : theme.border};cursor:pointer;transition:all 0.3s;opacity:${i === 0 ? '1' : '0.45'};" onclick="activateSS(${i})">
          <h3 style="font-family:'${theme.fontHeading}',sans-serif;font-size:1.3rem;font-weight:700;color:${theme.text};margin:0 0 12px;">${item.title}</h3>
          <p style="font-family:'${theme.fontBody}',sans-serif;font-size:0.95rem;line-height:1.7;color:${theme.textDim};margin:0;">${item.description}</p>
          <div class="ss-img-mobile" style="display:none;margin-top:20px;border-radius:16px;overflow:hidden;"><img src="${imgSrc}" style="width:100%;height:220px;object-fit:cover;display:block;"></div>
        </div>`;
  }).join('')}
      </div>
      <div style="position:sticky;top:120px;">
        <div style="border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,${dark ? '0.4' : '0.1'});aspect-ratio:4/3;position:relative;">
          ${items.map((item, i) => {
    const imgSrc = (item.content && typeof item.content === 'string' && !item.content.includes('undefined')) ? item.content : fallbackImages[i % fallbackImages.length];
    return `<img class="ss-panel" data-index="${i}" src="${imgSrc}" alt="${item.title}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 0.5s;opacity:${i === 0 ? '1' : '0'};">`;
  }).join('')}
        </div>
      </div>
    </div>
  </div>
</section>
<script>
function activateSS(idx) {
  document.querySelectorAll('.ss-item').forEach((el,i) => {
    el.style.opacity = i === idx ? '1' : '0.45';
    el.style.background = i === idx ? '${theme.accent}10' : '';
    el.style.borderColor = i === idx ? '${theme.accent}40' : '${dark ? 'rgba(255,255,255,0.05)' : theme.border}';
  });
  document.querySelectorAll('.ss-panel').forEach((el,i) => {
    el.style.opacity = i === idx ? '1' : '0';
  });
}
</script>`;
}

// ═══════════════════════════════════════════════
// FOOTER — Framer Mega Text Footer
// ═══════════════════════════════════════════════
function renderFooterSection(props, theme, variant) {
  const dark = isDarkTheme(theme);
  const rawSocial = props.socialLinks || ['twitter', 'linkedin'];
  const socialLinks = rawSocial.map(s => typeof s === 'string' ? s : (s && (s.name || s.platform)) || 'twitter');

  let linkGroups = [];
  const rawLinks = props.links;
  if (Array.isArray(rawLinks) && rawLinks.length > 0) {
    if (typeof rawLinks[0] === 'string') {
      linkGroups = [{ title: 'Quick Links', items: rawLinks }];
    } else if (typeof rawLinks[0] === 'object') {
      const isGrouped = rawLinks.some(g => Array.isArray(g.items) || Array.isArray(g.links));
      if (isGrouped) {
        linkGroups = rawLinks.map(g => ({
          title: g.title || g.name || g.heading || 'Links',
          items: (g.items || g.links || []).map(i => typeof i === 'string' ? i : (i.name || i.label || i.title || i.text || 'Link'))
        }));
      } else {
        linkGroups = [{
          title: 'Quick Links',
          items: rawLinks.map(i => typeof i === 'string' ? i : (i.name || i.label || i.title || i.text || 'Link'))
        }];
      }
    }
  }
  if (linkGroups.length === 0) {
    linkGroups = [
      { title: 'Product', items: ['Features', 'Pricing', 'FAQ'] },
      { title: 'Company', items: ['About', 'Blog', 'Careers'] },
      { title: 'Legal', items: ['Privacy', 'Terms', 'Cookies'] },
    ];
  }

  const v = variant || 'default';
  const brand = props.brand || 'Brand';
  const copyright = props.copyright || `© ${new Date().getFullYear()} ${brand}. All rights reserved.`;

  // ── MINIMAL (Single line, clean — Medical/Education) ──
  if (v === 'minimal') {
    return `
<footer class="bg-theme-bg border-t ${dark ? 'border-white/5' : 'border-black/5'} mt-10">
  <div class="max-w-7xl mx-auto px-6 md:px-8 py-10">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="font-heading text-lg font-bold text-theme-text tracking-tight">${brand}</div>
      <div class="flex flex-wrap justify-center gap-8">
        ${linkGroups.flatMap(g => g.items || []).slice(0, 6).map(item => `
          <a href="#" class="font-body text-sm text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors">${item}</a>
        `).join('')}
      </div>
      <div class="flex items-center gap-4">
        ${socialLinks.map(s => `
          <a href="#" class="text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors">
            ${icon(socialIconMap[s] || 'Globe', 16)}
          </a>
        `).join('')}
      </div>
    </div>
    <div class="text-center mt-8 pt-6 border-t ${dark ? 'border-white/5' : 'border-black/5'}">
      <p class="font-body text-xs text-theme-dim">${copyright}</p>
    </div>
  </div>
</footer>`;
  }

  // ── MAGAZINE (Newsletter-focused — Agency/Creative) ──
  if (v === 'magazine') {
    return `
<footer class="${dark ? 'bg-[#0a0a0a]' : 'bg-slate-50'} border-t ${dark ? 'border-white/5' : 'border-slate-200'} mt-10">
  <div class="max-w-7xl mx-auto px-6 md:px-8 py-20">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
      <div>
        <div class="font-heading text-4xl md:text-5xl font-black text-theme-text tracking-tighter mb-6">${brand}</div>
        ${props.description ? `<p class="font-body text-lg text-theme-dim leading-relaxed max-w-md mb-8">${props.description}</p>` : ''}
        <div class="flex gap-4">
          ${socialLinks.map(s => `
            <a href="#" class="w-11 h-11 rounded-xl ${dark ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white' : 'bg-black/5 hover:bg-black/10 text-black/40 hover:text-black'} flex items-center justify-center transition-all duration-300">
              ${icon(socialIconMap[s] || 'Globe', 18)}
            </a>
          `).join('')}
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-8">
        ${linkGroups.map(g => `
          <div>
            <div class="font-body text-xs font-bold text-theme-accent uppercase tracking-[0.15em] mb-5">${g.title}</div>
            <div class="flex flex-col gap-3">
              ${(g.items || []).map(item => `
                <a href="#" class="font-body text-sm text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors">${item}</a>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="flex flex-col md:flex-row items-center justify-between pt-8 border-t ${dark ? 'border-white/5' : 'border-slate-200'} gap-4">
      <p class="font-body text-sm text-theme-dim">${copyright}</p>
      <div class="flex gap-6">
        <a href="#" class="font-body text-sm text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors">Privacy</a>
        <a href="#" class="font-body text-sm text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors">Terms</a>
      </div>
    </div>
  </div>
</footer>`;
  }

  // ── DEFAULT (Mega footer with big brand watermark) ──
  return `
<footer class="bg-theme-surface border-t ${dark ? 'border-white/10' : 'border-black/5'} overflow-hidden rounded-t-[3rem] mt-10">
  <div class="max-w-7xl mx-auto px-6 md:px-8 py-20 pb-12">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-24 cursor-default">
      <div class="lg:col-span-5">
        <div class="font-heading text-2xl font-black text-theme-text tracking-tight mb-6">${brand}</div>
        ${props.description ? `<p class="font-body text-theme-dim leading-relaxed max-w-sm mb-8">${props.description}</p>` : ''}
        <div class="flex gap-4">
          ${socialLinks.map(s => `
            <a href="#" class="w-10 h-10 rounded-full border ${dark ? 'border-white/10 flex items-center justify-center text-theme-dim hover:text-white hover:bg-white/5' : 'border-black/10 flex items-center justify-center text-theme-dim hover:text-black hover:bg-black/5'} transition-all duration-300">
              ${icon(socialIconMap[s] || 'Globe', 18)}
            </a>
          `).join('')}
        </div>
      </div>
      
      <div class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
        ${linkGroups.map(g => `
          <div>
            <div class="font-body text-xs font-bold text-theme-text uppercase tracking-widest mb-6">${g.title}</div>
            <div class="flex flex-col gap-4">
              ${(g.items || []).map(item => `
                <a href="#" class="font-body text-sm font-medium text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors duration-200 w-fit relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-theme-accent after:transition-all after:duration-300 hover:after:w-full">${item}</a>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="flex flex-col md:flex-row items-center justify-between pt-8 border-t ${dark ? 'border-white/10' : 'border-black/5'} mb-16 gap-4">
      <p class="font-body text-sm text-theme-dim font-medium">${copyright}</p>
      <div class="flex gap-8">
        <a href="#" class="font-body text-sm font-medium text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors duration-200">Privacy Policy</a>
        <a href="#" class="font-body text-sm font-medium text-theme-dim ${dark ? 'hover:text-white' : 'hover:text-black'} transition-colors duration-200">Terms of Service</a>
      </div>
    </div>
    
    <div class="w-full text-center select-none flex justify-center items-center overflow-hidden">
      <h1 class="font-heading font-black text-theme-text/5 tracking-tighter w-full text-center leading-none" style="font-size: clamp(4rem, 15vw, 15rem);">
        ${brand.toUpperCase()}
      </h1>
    </div>
  </div>
</footer>`;
}

// ═══════════════════════════════════════════════
// DISPATCH MAP
// ═══════════════════════════════════════════════
const RENDERERS = {
  NavBar: renderNavBar,
  HeroSection: renderHeroSection,
  FeatureGrid: renderFeatureGrid,
  BentoGrid: renderBentoGrid,
  StickyScroll: renderStickyScroll,
  TestimonialSection: renderTestimonialSection,
  AboutSection: renderAboutSection,
  CTASection: renderCTASection,
  ContactSection: renderContactSection,
  FooterSection: renderFooterSection,
  PricingSection: renderPricingSection,
  FAQSection: renderFAQSection,
  PortfolioSection: renderPortfolioSection,
};

// ═══════════════════════════════════════════════
// MAIN RENDER — full HTML page
// ═══════════════════════════════════════════════
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
    borderRadius: themeConfig.borderRadius || '10px',
  };

  const meta = layoutSpec.meta || {};
  const title = meta.title || 'My Website';
  const description = meta.description || 'Built with AI';

  const fonts = [...new Set([theme.fontHeading, theme.fontBody])].filter(Boolean);
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900`).join('&')}&display=swap`;

  const sectionsHTML = (layoutSpec.sections || []).map((section, idx) => {
    const renderer = RENDERERS[section.component];
    if (!renderer) return `<!-- Unknown: ${section.component} -->`;
    try {
      return renderer(section.props || {}, theme, section.variant);
    } catch (e) {
      console.error(`[Renderer] Error in ${section.component}:`, e.message);
      return `<!-- Error: ${section.component} -->`;
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
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            theme: {
              bg: '${theme.bg}',
              surface: '${theme.surface}',
              border: '${theme.border}',
              text: '${theme.text}',
              dim: '${theme.textDim}',
              accent: '${theme.accent}',
              hover: '${theme.accentHover}'
            }
          },
          fontFamily: {
            heading: ['"${theme.fontHeading}"', 'system-ui', 'sans-serif'],
            body: ['"${theme.fontBody}"', 'system-ui', 'sans-serif']
          },
          borderRadius: {
            theme: '${theme.borderRadius}'
          }
        }
      }
    }
  </script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: '${theme.fontBody}', system-ui, sans-serif;
      background: ${theme.bg};
      color: ${theme.text};
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-100% / 3)); } }
    .animate-marquee { animation: marquee 30s linear infinite; }
    h1,h2,h3,h4,h5,h6 {
      font-family: '${theme.fontHeading}', system-ui, sans-serif;
    }
    img { max-width: 100%; height: auto; }
    a { transition: all 0.2s; }
    ::-webkit-scrollbar { width: 8px; }
    ::-webkit-scrollbar-track { background: ${theme.bg}; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.accent}; }
    .nav-links a { position: relative; }
    .nav-links a::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:1.5px; background:${theme.accent}; transition:width 0.25s; }
    .nav-links a:hover::after { width:100%; }
    @keyframes pulse-orb { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.12)} }

    /* ═══ PREMIUM ANIMATION ENGINE — CSS ═══ */
    .sf-reveal { opacity: 0; transform: translateY(40px); }
    .sf-reveal-left { opacity: 0; transform: translateX(-60px); }
    .sf-reveal-right { opacity: 0; transform: translateX(60px); }
    .sf-reveal-scale { opacity: 0; transform: scale(0.92); }
    .sf-heading-reveal { clip-path: inset(0 100% 0 0); }
    .sf-line-reveal { transform: scaleX(0); transform-origin: left; }
    .sf-stagger-card { opacity: 0; transform: translateY(50px) scale(0.96); }
    .sf-parallax-img { will-change: transform; }
    @keyframes sf-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
    @keyframes sf-glow-pulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
    .sf-float { animation: sf-float 6s ease-in-out infinite; }
    .sf-glow { animation: sf-glow-pulse 4s ease-in-out infinite; }
    @keyframes sf-gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    .sf-gradient-text { background-size: 200% 200%; animation: sf-gradient-shift 5s ease infinite; }
    /* ═══ END PREMIUM ANIMATION ENGINE ═══ */

    @media (max-width: 768px) {
      [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
      [style*="grid-template-columns: 2fr"] { grid-template-columns: 1fr !important; }
      .nav-links { display: none !important; }
    }
  </style>
</head>
<body>
${sectionsHTML}
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script>
if (typeof gsap !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // ═══════════════════════════════════════════════════════
  // PREMIUM ANIMATION ENGINE v2 — StackForge
  // ═══════════════════════════════════════════════════════

  // 1. HEADING CLIP-PATH REVEAL — cinematic text entrance
  gsap.utils.toArray('h1, h2').forEach(h => {
    gsap.fromTo(h, 
      { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
      { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 1.2, ease: 'power4.inOut',
        scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none none' }
      }
    );
  });

  // 2. PARAGRAPH & SUBTEXT — smooth fade + slide
  gsap.utils.toArray('section p').forEach(p => {
    gsap.from(p, {
      opacity: 0, y: 25, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: p, start: 'top 88%', toggleActions: 'play none none none' },
      delay: 0.2
    });
  });

  // 3. STAGGER CARDS — left-right alternating entrance
  document.querySelectorAll('section').forEach(section => {
    const cards = section.querySelectorAll('[class*="rounded-3xl"], [class*="rounded-2xl"], .sf-stagger-card');
    if (cards.length > 1) {
      gsap.fromTo(cards,
        { opacity: 0, y: 50, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)',
          stagger: { amount: 0.6, from: 'start' },
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none none' }
        }
      );
    }
  });

  // 4. CTA BUTTONS — pop-in with bounce
  gsap.utils.toArray('a[href="#contact"], a[href^="#"][class*="bg-theme-accent"], a[class*="bg-white"]').forEach(btn => {
    gsap.from(btn, {
      opacity: 0, scale: 0.8, duration: 0.6, ease: 'back.out(2)',
      scrollTrigger: { trigger: btn, start: 'top 90%', toggleActions: 'play none none none' },
      delay: 0.4
    });
  });

  // 5. COUNTER ANIMATION — live count-up for stats
  document.querySelectorAll('.sf-counter').forEach(counter => {
    const target = counter.getAttribute('data-target') || counter.textContent;
    const numMatch = target.match(/(\d+)/);
    if (numMatch) {
      const end = parseInt(numMatch[1]);
      const prefix = target.substring(0, target.indexOf(numMatch[1]));
      const suffix = target.substring(target.indexOf(numMatch[1]) + numMatch[1].length);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: end, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: counter, start: 'top 85%', toggleActions: 'play none none none' },
        onUpdate: () => { counter.textContent = prefix + Math.round(obj.val) + suffix; }
      });
    }
  });

  // 6. PARALLAX IMAGES — depth effect on scroll
  gsap.utils.toArray('section img[style*="object-fit:cover"], section img[class*="object-cover"]').forEach(img => {
    gsap.to(img, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: { trigger: img.closest('section') || img, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
    });
  });

  // 7. ICON BOXES — scale-in with rotation
  gsap.utils.toArray('[class*="rounded-xl"][class*="flex"][class*="items-center"][class*="justify-center"]').forEach((box, i) => {
    if (box.querySelector('svg')) {
      gsap.from(box, {
        opacity: 0, scale: 0.5, rotation: -15, duration: 0.6, ease: 'back.out(2.5)',
        scrollTrigger: { trigger: box, start: 'top 88%', toggleActions: 'play none none none' },
        delay: (i % 6) * 0.08
      });
    }
  });

  // 8. NAVBAR — smooth enter from top
  if (navEl) {
    gsap.fromTo(navEl, 
      { y: '-100%', opacity: 0 },
      { y: '0%', opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.1 }
    );
  }

  // 9. DECORATIVE BLURS — float in
  gsap.utils.toArray('[class*="blur-"][class*="absolute"]').forEach(blob => {
    gsap.from(blob, {
      scale: 0.5, opacity: 0, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: blob.closest('section') || blob, start: 'top 90%', toggleActions: 'play none none none' }
    });
  });

  // 10. BADGE / PILL — slide in from left
  gsap.utils.toArray('[class*="rounded-full"][class*="tracking-widest"], [class*="rounded-full"][class*="backdrop-blur"]').forEach(badge => {
    gsap.from(badge, {
      x: -30, opacity: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: badge, start: 'top 88%', toggleActions: 'play none none none' },
      delay: 0.1
    });
  });

  // 11. BORDER-TOP REVEAL — for pricing/feature sections
  gsap.utils.toArray('[style*="border-top"]').forEach(line => {
    gsap.from(line, {
      scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'power4.inOut',
      scrollTrigger: { trigger: line, start: 'top 85%', toggleActions: 'play none none none' }
    });
  });
}

  // PERMANENT IMAGE FIX: Auto-recovery for broken images
  window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
      console.warn('Image failed to load, applying fallback:', e.target.src);
      e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
      e.target.onerror = null; 
    }
  }, true);

  // Navbar scroll effect
  const nav = document.getElementById('main-nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        nav.style.height = '58px';
        nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
      } else {
        nav.style.height = '';
        nav.style.boxShadow = '';
      }
    });
  }
  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
</script>
</body>
</html>`;
}

module.exports = { renderToHTML, RENDERERS };