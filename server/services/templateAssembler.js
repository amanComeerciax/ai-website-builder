/**
 * Template Assembler — Orchestrates the full generation pipeline
 * 
 * Takes an enriched prompt spec → calls Layout Planner → renders HTML preview.
 * Also generates the Next.js project structure for export/download.
 * 
 * This replaces the old "dual track" (HTML vs React) system with a single
 * unified pipeline that always produces error-free output.
 */

const { renderToHTML } = require('../component-kit/html-renderer.js');
const { getTheme } = require('../config/themeRegistry.js');
const { planLayout, buildFallbackLayout } = require('./layoutPlanner.js');

/**
 * Full generation pipeline:
 *   EnrichedSpec → Layout Plan → HTML Preview + Next.js Export Files
 * 
 * @param {object} enrichedSpec - From PromptEnhancer
 * @param {function} onProgress - Callback for progress events
 * @returns {object} { html, layoutSpec, files, meta }
 */
async function assemble(enrichedSpec, onProgress = () => {}, previousLayoutSpec = null) {
  const themeId = enrichedSpec.themeId || 'modern-dark';
  const themeConfig = getTheme(themeId);

  // Step 1: Plan layout via AI
  onProgress({ event: 'thinking', message: 'Planning your website layout...' });

  let layoutSpec;
  try {
    layoutSpec = await planLayout(enrichedSpec, previousLayoutSpec);
    onProgress({ event: 'log', type: 'Reading', file: 'layout plan', message: `Planned ${layoutSpec.sections.length} sections` });
  } catch (e) {
    console.warn('[Assembler] Layout planning failed, using fallback:', e.message);
    layoutSpec = buildFallbackLayout(enrichedSpec);
    onProgress({ event: 'log', type: 'Reading', file: 'fallback layout', message: 'Using default template' });
  }

  // Step 2: Render HTML preview
  onProgress({ event: 'thinking', message: 'Building your website...' });

  const html = renderToHTML(layoutSpec, themeConfig);

  // Log each component being rendered
  for (const section of layoutSpec.sections) {
    onProgress({ event: 'log', type: 'Creating', file: `${section.component}.jsx` });
  }

  // Step 3: Generate Next.js project files for export
  onProgress({ event: 'log', type: 'Creating', file: 'Next.js project structure' });

  const nextjsFiles = generateNextJSFiles(layoutSpec, themeConfig, enrichedSpec);

  console.log(`[Assembler] ✅ Assembly complete — ${layoutSpec.sections.length} sections, ${Object.keys(nextjsFiles).length} export files, ${html.length} chars HTML`);

  return {
    html,                     // For iframe srcdoc preview (instant)
    layoutSpec,               // For iteration (edit existing layout)
    files: {                  // For editor file tree + DB storage
      'index.html': html,
      ...nextjsFiles,
    },
    previewType: 'srcdoc',    // Always srcdoc for preview
    meta: layoutSpec.meta || {},
  };
}

/**
 * Generate production-ready Next.js App Router project files.
 * Includes ACTUAL working React component files.
 */
function generateNextJSFiles(layoutSpec, themeConfig, enrichedSpec) {
  const files = {};
  const cs = themeConfig.colorScheme;
  const fp = themeConfig.fontPair;
  const brandName = enrichedSpec.businessName || 'My Website';

  // ── package.json ──
  files['next-export/package.json'] = JSON.stringify({
    name: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^14.2.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      'lucide-react': '^0.400.0',
      'framer-motion': '^11.0.0',
      'clsx': '^2.1.0',
      'tailwind-merge': '^2.2.0',
    },
    devDependencies: {
      tailwindcss: '^3.4.0',
      postcss: '^8.4.0',
      autoprefixer: '^10.4.0',
    },
  }, null, 2);

  // ── next.config.js ──
  files['next-export/next.config.js'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

module.exports = nextConfig;
`;

  // ── tailwind.config.js ──
  files['next-export/tailwind.config.js'] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${cs.accent}',
        'primary-hover': '${cs.accentHover || cs.accent}',
        background: '${cs.bg}',
        surface: '${cs.surface}',
        'surface-hover': '${cs.surfaceHover || cs.surface}',
        border: '${cs.border}',
        foreground: '${cs.text}',
        muted: '${cs.textDim}',
      },
      fontFamily: {
        heading: ['${fp.heading}', 'system-ui', 'sans-serif'],
        body: ['${fp.body}', 'system-ui', 'sans-serif'],
      },
      animation: {
        'aurora-mesh': 'aurora-mesh 20s infinite alternate',
        'border-move': 'border-move 3s linear infinite',
      },
      keyframes: {
        'aurora-mesh': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(1.2) translate(5%, 5%)' },
          '100%': { transform: 'scale(1) translate(-2%, 2%)' },
        },
        'border-move': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 0%' },
        },
      },
    },
  },
  plugins: [],
};
`;

  // ── postcss.config.js ──
  files['next-export/postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  // ── app/globals.css ──
  files['next-export/app/globals.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=${fp.heading.replace(/\s+/g, '+')}:wght@300;400;500;600;700&family=${fp.body.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap');

:root {
  --color-bg: ${cs.bg};
  --color-surface: ${cs.surface};
  --color-border: ${cs.border};
  --color-text: ${cs.text};
  --color-text-dim: ${cs.textDim};
  --color-accent: ${cs.accent};
  --font-heading: '${fp.heading}', system-ui, sans-serif;
  --font-body: '${fp.body}', system-ui, sans-serif;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

.aurora-bg {
  background-image: 
    radial-gradient(at 10% 20%, var(--color-accent)40 0px, transparent 50%),
    radial-gradient(at 90% 10%, #ff008020 0px, transparent 50%),
    radial-gradient(at 50% 50%, #7928ca20 0px, transparent 50%),
    radial-gradient(at 20% 80%, #0070f320 0px, transparent 50%),
    radial-gradient(at 80% 90%, var(--color-accent)30 0px, transparent 50%);
  filter: blur(80px);
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.moving-border-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), #ff0080, var(--color-accent), transparent);
  background-size: 200% 100%;
  border-radius: 14px;
  z-index: -1;
  opacity: 0.8;
}
`;

  // ── app/layout.jsx ──
  files['next-export/app/layout.jsx'] = `import './globals.css';

export const metadata = {
  title: '${(layoutSpec.meta?.title || brandName).replace(/'/g, "\\'")}',
  description: '${(layoutSpec.meta?.description || `Welcome to ${brandName}`).replace(/'/g, "\\'")}',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  // ══════════════════════════════════════════════════════════
  // ── ACTUAL REACT COMPONENT FILES (the missing piece!)
  // ══════════════════════════════════════════════════════════

  const usedComponents = new Set();
  for (const section of (layoutSpec.sections || [])) {
    usedComponents.add(section.component);
  }

  // Generate a real JSX component file for each used component
  for (const componentName of usedComponents) {
    const jsxCode = generateComponentJSX(componentName);
    if (jsxCode) {
      files[`next-export/components/${componentName}.jsx`] = jsxCode;
    }
  }

  // ── app/page.jsx ──
  const componentImports = [];
  const componentJSX = [];
  const importedComponents = new Set();

  for (const section of (layoutSpec.sections || [])) {
    const cName = section.component;
    if (!importedComponents.has(cName)) {
      componentImports.push(`import ${cName} from '@/components/${cName}';`);
      importedComponents.add(cName);
    }

    const propsStr = JSON.stringify(section.props || {}, null, 6)
      .replace(/"([^"]+)":/g, '$1:')
      .replace(/"/g, "'");

    componentJSX.push(`      <${cName} variant="${section.variant || 'default'}" {...${propsStr}} />`);
  }

  files['next-export/app/page.jsx'] = `'use client';
import { motion } from 'framer-motion';
${componentImports.join('\n')}

export default function Home() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
${componentJSX.join('\n')}
    </motion.main>
  );
}
`;

  // ── jsconfig.json (for @/ path alias) ──
  files['next-export/jsconfig.json'] = JSON.stringify({
    compilerOptions: {
      paths: { "@/*": ["./*"] }
    }
  }, null, 2);

  // ── README.md ──
  files['next-export/README.md'] = `# ${brandName}

Generated with StackForge AI Website Builder.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Fonts:** ${fp.heading}${fp.heading !== fp.body ? ` + ${fp.body}` : ''}
`;

  return files;
}


// ══════════════════════════════════════════════════════════
// ── REACT COMPONENT GENERATORS — One per component type
// ══════════════════════════════════════════════════════════

function generateComponentJSX(componentName) {
  const generators = {

    NavBar: () => `'use client';
import { useState, useEffect } from 'react';
import { Menu, X, motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

export default function NavBar({ brand, links = [], ctaText, ctaLink = '#contact', logoUrl }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  
  const navHeight = useTransform(scrollY, [0, 50], ["5.5rem", "4.5rem"]);
  const navBg = useTransform(scrollY, [0, 50], ["rgba(var(--color-bg), 0)", "rgba(10, 10, 10, 0.8)"]);
  const navBorder = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.1)"]);
  const navShadow = useTransform(scrollY, [0, 50], ["0px 0px 0px rgba(0,0,0,0)", "0px 10px 30px rgba(0,0,0,0.3)"]);

  return (
    <motion.nav 
      style={{ 
        height: navHeight, 
        backgroundColor: navBg, 
        borderBottom: "1px solid", 
        borderColor: navBorder,
        boxShadow: navShadow
      }}
      className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md transition-shadow duration-300"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        <motion.a 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          href="#" className="font-heading text-2xl font-black text-white no-underline tracking-tighter"
        >
          {logoUrl ? <img src={logoUrl} alt={brand} className="h-10" /> : brand}
        </motion.a>
        
        <div className="flex items-center gap-10">
          <div className="hidden md:flex gap-8">
            {links.map((link, i) => (
              <motion.a 
                key={i} 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={\`#\${String(link).toLowerCase().replace(/\\s+/g, '-')}\`}
                className="text-muted/80 hover:text-white text-sm font-bold no-underline transition-colors relative group"
              >
                {link}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </motion.a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            {ctaText && (
              <motion.a 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={ctaLink}
                className="hidden md:inline-flex bg-white text-black px-8 py-3 rounded-xl text-sm font-black no-underline hover:shadow-2xl transition-all"
              >
                {ctaText}
              </motion.a>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white p-2">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden px-6 py-10 bg-background border-b border-white/5 flex flex-col gap-6"
          >
            {links.map((link, i) => (
              <a key={i} href={\`#\${String(link).toLowerCase().replace(/\\s+/g, '-')}\`}
                onClick={() => setMobileOpen(false)}
                className="text-white hover:text-primary text-2xl font-bold no-underline"
              >
                {link}
              </a>
            ))}
            {ctaText && (
              <a href={ctaLink} className="bg-primary text-white px-6 py-5 rounded-2xl text-lg font-black no-underline text-center mt-4">
                {ctaText}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

`,

    HeroSection: () => `'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function HeroSection({ variant = 'centered', heading, subtext, ctaText, ctaLink = '#contact', bgImage, secondaryCtaText, secondaryCtaLink = '#about', badgeText }) {
  const isAurora = variant === 'aurora' || variant === 'sparkles';
  const isSplit = variant === 'split';

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-6 bg-background">
      {isAurora && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 aurora-bg opacity-50" 
          />
          {variant === 'sparkles' && (
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          )}
        </div>
      )}
      
      {!isAurora && bgImage && (
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 w-full h-full"
        >
          <img src={bgImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        </motion.div>
      )}
      
      <div className={\`relative z-10 max-w-[1200px] mx-auto w-full \${isSplit ? 'grid md:grid-cols-2 gap-16' : 'text-center'}\`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {badgeText && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className={\`inline-flex items-center gap-2 \${isAurora ? 'bg-white/5 border-white/10' : 'bg-primary/10 border-primary/20'} text-primary text-xs font-bold px-5 py-2 rounded-full mb-8 border tracking-wider uppercase backdrop-blur-md\`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {badgeText}
            </motion.span>
          )}
          <h1 className={\`font-heading text-5xl md:text-8xl font-bold leading-[1] \${isAurora ? 'text-white' : 'text-foreground'} mb-8 text-balance tracking-tighter\`}>
            {heading}
          </h1>
          <p className={\`font-body text-xl \${isAurora ? 'text-white/70' : 'text-muted/90'} mb-12 leading-relaxed \${!isSplit ? 'max-w-[750px] mx-auto' : ''}\`}>
            {subtext}
          </p>
          <div className={\`flex gap-5 flex-wrap \${!isSplit ? 'justify-center' : ''}\`}>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={ctaLink}
              className={\`inline-flex items-center gap-3 \${isAurora ? 'bg-white text-black' : 'bg-primary text-white shadow-2xl shadow-primary/20'} px-10 py-4 rounded-2xl text-lg font-bold no-underline relative overflow-hidden transition-all \${isAurora ? '' : 'moving-border-btn'}\`}
            >
              {ctaText} <ArrowRight size={20} />
            </motion.a>
            {secondaryCtaText && (
              <motion.a 
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                href={secondaryCtaLink}
                className="inline-flex items-center gap-3 border border-white/10 text-foreground px-10 py-4 rounded-2xl text-lg font-bold no-underline backdrop-blur-xl transition-colors"
              >
                {secondaryCtaText}
              </motion.a>
            )}
          </div>
        </motion.div>
        
        {isSplit && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:block relative"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3]">
              <img src={bgImage} alt="" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
`,

    FeatureGrid: () => `'use client';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export default function FeatureGrid({ heading, subtext, items = [], variant }) {
  const isGlass = variant === 'glass';

  return (
    <section id="features" className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            {heading}
          </motion.h2>
          {subtext && <p className="font-body text-xl text-muted/80 max-w-[700px] mx-auto">{subtext}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => {
            const IconComponent = LucideIcons[item.icon] || LucideIcons.Zap;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={\`p-10 rounded-3xl border transition-all duration-500 \${isGlass ? 'bg-white/5 border-white/10 backdrop-blur-xl' : 'bg-surface border-white/5'}\`}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 border border-primary/20">
                  <IconComponent size={28} />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-4">{item.title}</h3>
                <p className="font-body text-muted leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`,

    BentoGrid: () => `'use client';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

export default function BentoGrid({ heading, subtext, items = [] }) {
  return (
    <section id="features" className="py-32 px-6 bg-background">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight"
          >
            {heading}
          </motion.h2>
          {subtext && <p className="font-body text-xl text-muted/80 max-w-[600px] mx-auto">{subtext}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[25rem]">
          {items.map((item, i) => {
            const Icon = LucideIcons[item.icon] || LucideIcons.Zap;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={\`relative rounded-3xl overflow-hidden glass-card flex flex-col justify-between group \${item.className || ''}\`}
              >
                <div className="p-10 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                  <p className="font-body text-muted leading-relaxed text-lg">{item.description}</p>
                </div>
                {item.header ? (
                   <div className="mt-auto h-48 w-full border-t border-white/5 overflow-hidden">
                      <img src={item.header} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   </div>
                ) : (
                   <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`,

    StickyScroll: () => `'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, useScroll } from 'framer-motion';

export default function StickyScroll({ heading, items = [] }) {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [activeItem, setActiveItem] = useState(0);
  
  useEffect(() => {
    return scrollYProgress.onChange(v => {
      const index = Math.floor(v * items.length);
      if (index !== activeItem && index >= 0 && index < items.length) {
        setActiveItem(index);
      }
    });
  }, [scrollYProgress, items.length, activeItem]);

  return (
    <section ref={containerRef} className="relative min-h-[300vh] bg-surface">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 px-6">
          <div className="py-[10vh]">
             <h2 className="font-heading text-5xl font-black text-foreground mb-20">{heading}</h2>
             <div className="space-y-[30vh]">
                {items.map((item, i) => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: activeItem === i ? 1 : 0.2 }}
                    className="space-y-6"
                  >
                    <h3 className="font-heading text-3xl font-bold text-foreground">{item.title}</h3>
                    <p className="font-body text-xl text-muted leading-relaxed">{item.description}</p>
                  </motion.div>
                ))}
             </div>
             <div className="h-[20vh]" />
          </div>
          
          <div className="hidden lg:flex items-center justify-center p-10">
             <div className="relative w-full aspect-square max-w-[600px] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl bg-background">
                {items.map((item, i) => (
                  <motion.img 
                    key={i}
                    src={item.content}
                    animate={{ 
                      opacity: activeItem === i ? 1 : 0,
                      scale: activeItem === i ? 1 : 1.1
                    }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ))}
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`,

    PricingSection: () => `'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function PricingSection({ heading, subtext, plans = [], variant }) {
  return (
    <section id="pricing" className="py-32 px-6 bg-background relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           className="mb-24"
        >
          <h2 className="font-heading text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight">{heading}</h2>
          {subtext && <p className="font-body text-xl text-muted/80 max-w-2xl mx-auto">{subtext}</p>}
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={\`relative p-12 rounded-[3rem] flex flex-col glass-card border-white/5 \${plan.isPopular ? 'scale-105 z-10 border-primary/50' : 'scale-100 opacity-90'}\`}
            >
              {plan.isPopular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl">
                  Recommended
                </div>
              )}
              <div className="mb-10">
                <h3 className="font-heading text-xl font-bold text-foreground/70 mb-4 uppercase tracking-widest">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-black text-white">{plan.price}</span>
                  <span className="text-muted font-medium text-lg">/mo</span>
                </div>
              </div>
              <div className="flex-1 space-y-5 mb-12">
                {(plan.features || []).map((feat, j) => (
                  <div key={j} className="flex gap-4 text-left items-start">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-1 shrink-0">
                      <Check size={12} className="text-primary" />
                    </div>
                    <span className="text-muted/90 text-base font-medium leading-tight">{feat}</span>
                  </div>
                ))}
              </div>
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#contact" 
                className={\`relative py-5 rounded-2xl text-center font-black text-lg transition-all overflow-hidden \${plan.isPopular ? 'bg-primary text-white moving-border-btn' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}\`}
              >
                {plan.ctaText || 'Get Started'}
              </motion.a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,

    FAQSection: () => `'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function FAQSection({ heading, subtext, items = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-32 px-6 bg-background">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-6xl font-black text-foreground mb-6"
          >
            {heading}
          </motion.h2>
          {subtext && <p className="font-body text-xl text-muted/80 max-w-xl mx-auto">{subtext}</p>}
        </div>
        
        <div className="space-y-4">
          {items.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className={\`rounded-3xl overflow-hidden glass-card transition-all duration-500 \${openIndex === i ? 'border-primary/30 ring-1 ring-primary/20 bg-primary/5' : 'border-white/5'}\`}
            >
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-8 flex items-center justify-between text-left outline-none group"
              >
                <span className="text-xl font-bold text-white/90 group-hover:text-white transition-colors">{item.question}</span>
                <motion.div 
                  animate={{ rotate: openIndex === i ? 45 : 0, scale: openIndex === i ? 1.2 : 1 }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary shrink-0 transition-colors"
                >
                  <Plus size={20} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                  >
                    <div className="px-8 pb-8 text-muted/90 leading-relaxed text-lg border-t border-white/5 pt-6 mx-8">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,

    PortfolioSection: () => `'use client';
import { motion } from 'framer-motion';

export default function PortfolioSection({ heading, subtext, items = [] }) {
  return (
    <section id="portfolio" className="py-32 px-6 bg-surface relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl md:text-6xl font-black text-foreground mb-6"
          >
            {heading}
          </motion.h2>
          {subtext && <p className="font-body text-xl text-muted/80 max-w-2xl mx-auto">{subtext}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {items.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -12 }}
              className="group relative rounded-[3rem] overflow-hidden aspect-[4/5] bg-background border border-white/5 shadow-2xl"
            >
              <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-12">
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  className="space-y-5"
                >
                  <span className="inline-block bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full leading-none">{item.category}</span>
                  <h3 className="text-3xl font-bold text-white leading-tight tracking-tight">{item.title}</h3>
                  <div className="w-16 h-1 bg-primary rounded-full transition-all group-hover:w-24" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,

    AboutSection: () => `'use client';
import { motion } from 'framer-motion';

export default function AboutSection({ heading, description, image, stats = [] }) {
  return (
    <section id="about" className="py-32 px-6 bg-background overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-primary/10 blur-[80px] rounded-full opacity-40" />
          <div className="relative rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl glass-card p-4">
            <img src={image} alt={heading} className="w-full h-[600px] object-cover rounded-[3rem]" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-12"
        >
          <h2 className="font-heading text-5xl md:text-7xl font-black text-foreground leading-tight tracking-tighter">{heading}</h2>
          <p className="font-body text-xl text-muted/90 leading-relaxed max-w-2xl">{description}</p>
          
          {stats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 pt-12 border-t border-white/5">
              {stats.map((stat, i) => (
                <div key={i} className="space-y-3">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="font-heading text-5xl font-black text-primary tracking-tighter"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="font-body text-[10px] font-black text-muted uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
`,

    CTASection: () => `'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection({ heading, subtext, ctaText, ctaLink = '#contact' }) {
  return (
    <section className="py-40 px-6 bg-background relative overflow-hidden text-center">
      <div className="absolute inset-0 aurora-bg opacity-10 pointer-events-none" />
      <div className="max-w-[1000px] mx-auto relative z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           className="p-20 rounded-[5rem] glass-card border-primary/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
          <h2 className="font-heading text-5xl md:text-8xl font-black text-white mb-8 leading-none tracking-tighter">{heading}</h2>
          {subtext && <p className="font-body text-2xl text-white/70 mb-14 max-w-2xl mx-auto leading-relaxed">{subtext}</p>}
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={ctaLink}
            className="inline-flex items-center gap-4 bg-white text-black px-14 py-6 rounded-[2rem] text-xl font-black no-underline shadow-[0_20px_50px_rgba(255,255,255,0.15)] transition-all"
          >
            {ctaText} <ArrowRight size={24} strokeWidth={3} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
`,

    ContactSection: () => `'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactSection({ heading, subtext, email, phone, address }) {
  return (
    <section id="contact" className="py-32 px-6 bg-background overflow-hidden">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-heading text-5xl md:text-7xl font-black text-foreground mb-6 tracking-tighter"
          >
            {heading}
          </motion.h2>
          {subtext && <p className="font-body text-xl text-muted/80 max-w-2xl mx-auto">{subtext}</p>}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-6 flex flex-col justify-between"
          >
            {[
              { icon: Mail, label: 'Email', value: email || 'hello@example.com' },
              { icon: Phone, label: 'Phone', value: phone || '+1 (555) 000-0000' },
              { icon: MapPin, label: 'HQ', value: address || 'San Francisco, CA' },
            ].map((item, i) => (
              <div key={i} className="flex gap-8 p-10 rounded-[3rem] glass-card border-white/5 items-center group hover:bg-white/5 transition-all">
                <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                  <item.icon size={32} />
                </div>
                <div>
                  <div className="font-body text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">{item.label}</div>
                  <div className="font-heading text-2xl font-bold text-white">{item.value}</div>
                </div>
              </div>
            ))}
          </motion.div>
          
          <motion.form 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="p-12 rounded-[4rem] glass-card border-white/10 space-y-8 flex flex-col justify-center bg-white/[0.02]"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Full Name</label>
              <input type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white outline-none focus:border-primary focus:bg-white/10 transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Email Address</label>
              <input type="email" placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white outline-none focus:border-primary focus:bg-white/10 transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Your Message</label>
              <textarea rows={4} placeholder="How can we help?" className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white outline-none focus:border-primary focus:bg-white/10 transition-all resize-none font-medium" />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-black py-7 rounded-[1.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 group"
            >
              Send Request 
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Send size={24} />
              </motion.div>
            </motion.button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
`,

    FooterSection: () => `'use client';
import { motion } from 'framer-motion';
import { Twitter, Github, Linkedin, Facebook, Instagram, Globe } from 'lucide-react';

const socialIcons = { twitter: Twitter, github: Github, linkedin: Linkedin, facebook: Facebook, instagram: Instagram };

export default function FooterSection({ variant = 'simple', brand, description, links = [], socialLinks = [], copyright }) {
  const copyrightText = copyright || \`© \${new Date().getFullYear()} \${brand}. All rights reserved.\`;

  if (variant === 'withLinks') {
    const linkGroups = Array.isArray(links) && links.length > 0 && typeof links[0] === 'object' 
      ? links 
      : [
          { title: 'Product', items: ['Features', 'Pricing', 'FAQ'] },
          { title: 'Company', items: ['About', 'Blog', 'Careers'] },
          { title: 'Legal', items: ['Privacy', 'Terms', 'Cookies'] },
        ];

    return (
      <footer className="pt-40 pb-20 px-6 bg-background border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-20 mb-32">
            <div className="lg:col-span-2 space-y-10">
              <div className="font-heading text-4xl font-black text-white tracking-tighter">{brand}</div>
              {description && <p className="font-body text-xl text-muted/70 leading-relaxed max-w-sm">{description}</p>}
              <div className="flex gap-4">
                {socialLinks.map((s, i) => {
                  const name = typeof s === 'string' ? s.toLowerCase() : 'globe';
                  const Icon = socialIcons[name] || Globe;
                  return (
                    <motion.a 
                      key={i} 
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      href="#" 
                      className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-white border-white/10 transition-all"
                    >
                      <Icon size={24} />
                    </motion.a>
                  );
                })}
              </div>
            </div>
            {linkGroups.map((group, i) => (
              <div key={i} className="space-y-10">
                <div className="font-body text-[10px] font-black text-white uppercase tracking-[0.3em]">{group.title}</div>
                <div className="flex flex-col gap-5">
                  {(group.items || []).map((item, j) => (
                    <a key={j} href="#" className="text-muted/80 hover:text-white transition-colors no-underline font-medium text-lg">{item}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="text-muted text-sm font-semibold tracking-wide uppercase">{copyrightText}</p>
            <div className="flex gap-12">
              <a href="#" className="text-xs font-black text-muted uppercase tracking-[0.2em] hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-xs font-black text-muted uppercase tracking-[0.2em] hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-20 px-6 bg-background border-t border-white/5 relative">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="font-heading text-3xl font-black text-white tracking-tighter">{brand}</div>
        <div className="flex gap-6">
          {socialLinks.map((s, i) => {
            const name = typeof s === 'string' ? s.toLowerCase() : 'globe';
            const Icon = socialIcons[name] || Globe;
            return (
              <motion.a 
                key={i} 
                whileHover={{ scale: 1.2, color: '#fff' }}
                href="#" className="text-muted/60 transition-all"
              >
                <Icon size={28} />
              </motion.a>
            );
          })}
        </div>
        <p className="text-muted text-xs font-black uppercase tracking-[0.2em]">{copyrightText}</p>
      </div>
    </footer>
  );
}

`,

  };

  const gen = generators[componentName];
  return gen ? gen() : null;
}

module.exports = { assemble };
