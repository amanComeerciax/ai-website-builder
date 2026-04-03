/**
 * HTML Renderer — Premium Shell with Safe Animation System
 * 
 * KEY CHANGE: Uses CSS-only animations by default (always visible),
 * with GSAP as progressive enhancement that can't break visibility.
 * Integrated Lenis for high-end smooth scrolling.
 */

function renderToHTML(snippetsHTML, layoutSpec, themeConfig) {
  const theme = {
    bg: themeConfig?.colorScheme?.bg || '#09090b',
    surface: themeConfig?.colorScheme?.surface || '#18181b',
    border: themeConfig?.colorScheme?.border || 'rgba(255,255,255,0.1)',
    text: themeConfig?.colorScheme?.text || '#fafafa',
    textDim: themeConfig?.colorScheme?.textDim || '#a1a1aa',
    accent: themeConfig?.colorScheme?.accent || '#3b82f6',
    accentHover: themeConfig?.colorScheme?.accentHover || '#2563eb',
    fontHeading: themeConfig?.fontPair?.heading || 'Outfit',
    fontBody: themeConfig?.fontPair?.body || 'Inter',
    borderRadius: themeConfig?.borderRadius || '16px',
  };

  const title = layoutSpec?.meta?.title || 'Generated Website';
  const description = layoutSpec?.meta?.description || 'Built with AI';

  const fonts = [...new Set([theme.fontHeading, theme.fontBody])].filter(Boolean);
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900`).join('&')}&display=swap`;

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
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      darkMode: 'class',
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
  <\/script>
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

    /* ================================================================
       CSS-ONLY ANIMATION SYSTEM — Elements are ALWAYS visible
       ================================================================ */

    [data-animate] {
      opacity: 1 !important;
      transform: none !important;
    }

    .anim-ready [data-animate="fade-up"] {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .anim-ready [data-animate="fade-up"].in-view {
      opacity: 1;
      transform: translateY(0);
    }

    .anim-ready [data-animate="stagger-children"] > * {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .anim-ready [data-animate="stagger-children"].in-view > * {
      opacity: 1;
      transform: translateY(0);
    }
    .anim-ready [data-animate="stagger-children"].in-view > *:nth-child(1) { transition-delay: 0s; }
    .anim-ready [data-animate="stagger-children"].in-view > *:nth-child(2) { transition-delay: 0.1s; }
    .anim-ready [data-animate="stagger-children"].in-view > *:nth-child(3) { transition-delay: 0.2s; }
    .anim-ready [data-animate="stagger-children"].in-view > *:nth-child(4) { transition-delay: 0.3s; }
    .anim-ready [data-animate="stagger-children"].in-view > *:nth-child(5) { transition-delay: 0.4s; }
    .anim-ready [data-animate="stagger-children"].in-view > *:nth-child(6) { transition-delay: 0.5s; }

    .anim-ready [data-animate="slide-left"] {
      opacity: 0;
      transform: translateX(-60px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .anim-ready [data-animate="slide-left"].in-view {
      opacity: 1;
      transform: translateX(0);
    }

    .anim-ready [data-animate="slide-right"] {
      opacity: 0;
      transform: translateX(60px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .anim-ready [data-animate="slide-right"].in-view {
      opacity: 1;
      transform: translateX(0);
    }

    .anim-ready [data-animate="scale-in"] {
      opacity: 0;
      transform: scale(0.85);
      transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .anim-ready [data-animate="scale-in"].in-view {
      opacity: 1;
      transform: scale(1);
    }

    /* === PREMIUM GLASS SYSTEM === */
    .premium-glass {
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }
    .inner-glow {
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), inset 0 0 30px rgba(255, 255, 255, 0.03);
    }

    /* === PREMIUM BUTTON SYSTEM === */
    .btn-premium {
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-premium::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }
    .btn-premium:hover::after {
      transform: translateX(100%);
    }
    .btn-premium:hover {
      box-shadow: 0 0 40px -8px ${theme.accent};
      transform: translateY(-2px);
    }

    /* === ANIMATIONS === */
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px -5px ${theme.accent}40; } 50% { box-shadow: 0 0 40px -5px ${theme.accent}80; } }

    /* === CARD HOVER === */
    .card-hover { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .card-hover:hover { transform: translateY(-8px); border-color: ${theme.accent}33; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5), 0 0 30px -10px ${theme.accent}20; }

    /* === GRADIENT TEXT === */
    .gradient-text { background: linear-gradient(135deg, ${theme.text} 0%, ${theme.textDim} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

    /* === SCROLLBAR === */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${theme.bg}; }
    ::-webkit-scrollbar-thumb { background: ${theme.accent}33; border-radius: 3px; }

    /* === LENIS SMOOTH SCROLL CSS === */
    html.lenis, html.lenis body { height: auto; }
    .lenis.lenis-smooth { scroll-behavior: auto !important; }
    .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
    .lenis.lenis-stopped { overflow: hidden; }
    .lenis.lenis-scrolling iframe { pointer-events: none; }
  </style>
</head>
<body class="dark">
  ${snippetsHTML}

  <!-- SCRIPTS -->
  <script src="https://unpkg.com/lenis@1.1.20/dist/lenis.min.js"><\/script>
  <script>
    // 1. Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. Safe Animation Engine
    requestAnimationFrame(() => {
      document.body.classList.add('anim-ready');
    });

    // Legacy converter
    document.querySelectorAll('[data-gsap]').forEach(el => {
      const type = el.getAttribute('data-gsap');
      if (type === 'fade-up') el.setAttribute('data-animate', 'fade-up');
      else if (type === 'stagger-list') el.setAttribute('data-animate', 'stagger-children');
      else if (type === 'slide-left') el.setAttribute('data-animate', 'slide-left');
      else if (type === 'slide-right') el.setAttribute('data-animate', 'slide-right');
      else if (type === 'scale-in') el.setAttribute('data-animate', 'scale-in');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

    // 3. Robust Counters
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);

        const fullText = el.textContent.trim();
        // Extract numeric part (including commas/dots)
        const match = fullText.match(/([\d,.]+)/);
        if (!match) return;

        const numStr = match[1];
        const prefix = fullText.substring(0, fullText.indexOf(numStr));
        const suffix = fullText.substring(fullText.indexOf(numStr) + numStr.length);
        
        // Clean number for parsing
        const hasComma = numStr.includes(',');
        const hasDot = numStr.includes('.');
        const cleanNum = parseFloat(numStr.replace(/,/g, ''));
        const decimals = hasDot ? numStr.split('.')[1].length : 0;

        const duration = 2000;
        const startTime = performance.now();

        function tick(now) {
          const elapsed = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
          const value = eased * cleanNum;

          // Format the number back
          let formattedValue = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
          
          if (hasComma) {
            // Simple thousands separator for integers/float parts
            const parts = formattedValue.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            formattedValue = parts.join('.');
          }

          el.textContent = prefix + formattedValue + suffix;

          if (elapsed < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));
  <\/script>
</body>
</html>`;
}

module.exports = { renderToHTML };