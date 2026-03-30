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
async function assemble(enrichedSpec, onProgress = () => {}) {
  const themeId = enrichedSpec.themeId || 'modern-dark';
  const themeConfig = getTheme(themeId);

  // Step 1: Plan layout via AI
  onProgress({ event: 'thinking', message: 'Planning your website layout...' });

  let layoutSpec;
  try {
    layoutSpec = await planLayout(enrichedSpec);
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

  files['next-export/app/page.jsx'] = `${componentImports.join('\n')}

export default function Home() {
  return (
    <main>
${componentJSX.join('\n')}
    </main>
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
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function NavBar({ brand, links = [], ctaText, ctaLink = '#contact', logoUrl }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[72px]">
        <a href="#" className="font-heading text-2xl font-bold text-foreground no-underline">
          {logoUrl ? <img src={logoUrl} alt={brand} className="h-9" /> : brand}
        </a>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-6">
            {links.map((link, i) => (
              <a key={i} href={\`#\${String(link).toLowerCase().replace(/\\s+/g, '-')}\`}
                className="text-muted hover:text-primary text-sm font-body no-underline transition-colors">
                {link}
              </a>
            ))}
          </div>
          {ctaText && (
            <a href={ctaLink}
              className="hidden md:inline-flex bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold no-underline font-body hover:-translate-y-0.5 transition-all hover:shadow-lg">
              {ctaText}
            </a>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden px-6 py-4 bg-background border-t border-border flex flex-col gap-3">
          {links.map((link, i) => (
            <a key={i} href={\`#\${String(link).toLowerCase().replace(/\\s+/g, '-')}\`}
              onClick={() => setMobileOpen(false)}
              className="text-muted hover:text-primary text-sm font-body no-underline py-2">
              {link}
            </a>
          ))}
          {ctaText && (
            <a href={ctaLink} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold no-underline text-center mt-2">
              {ctaText}
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
`,

    HeroSection: () => `import { ArrowRight } from 'lucide-react';

export default function HeroSection({ variant = 'centered', heading, subtext, ctaText, ctaLink = '#contact', bgImage, secondaryCtaText, secondaryCtaLink = '#about', badgeText }) {
  if (variant === 'fullImage' || variant === 'split') {
    return (
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {bgImage && <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-background/90" />
        <div className="relative z-10 text-center max-w-[800px] px-6 pt-[120px] pb-20">
          {badgeText && (
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6 font-body">
              {badgeText}
            </span>
          )}
          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.1] text-foreground mb-6">{heading}</h1>
          <p className="font-body text-lg text-muted mb-10 max-w-[640px] mx-auto leading-relaxed">{subtext}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href={ctaLink}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-base font-semibold no-underline font-body hover:-translate-y-0.5 transition-all hover:shadow-xl">
              {ctaText} <ArrowRight size={18} />
            </a>
            {secondaryCtaText && (
              <a href={secondaryCtaLink}
                className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-3.5 rounded-xl text-base font-medium no-underline font-body hover:border-primary transition-colors">
                {secondaryCtaText}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-6 pt-[120px] pb-20">
      <div className="text-center max-w-[800px]">
        {badgeText && (
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6 font-body">
            {badgeText}
          </span>
        )}
        <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.1] text-foreground mb-6">{heading}</h1>
        <p className="font-body text-lg text-muted mb-10 max-w-[640px] mx-auto leading-relaxed">{subtext}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href={ctaLink}
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-base font-semibold no-underline font-body hover:-translate-y-0.5 transition-all hover:shadow-xl">
            {ctaText} <ArrowRight size={18} />
          </a>
          {secondaryCtaText && (
            <a href={secondaryCtaLink}
              className="inline-flex items-center gap-2 border border-border text-foreground px-8 py-3.5 rounded-xl text-base font-medium no-underline font-body hover:border-primary transition-colors">
              {secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
`,

    FeatureGrid: () => `import * as LucideIcons from 'lucide-react';

export default function FeatureGrid({ heading, subtext, items = [] }) {
  return (
    <section id="features" className="py-24 px-6 bg-surface">
      <div className="max-w-[1200px] mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">{heading}</h2>
        {subtext && <p className="font-body text-base text-muted mb-16 max-w-[600px] mx-auto">{subtext}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => {
            const IconComponent = LucideIcons[item.icon] || LucideIcons.Zap;
            return (
              <div key={i} className="bg-background border border-border rounded-2xl p-10 text-left hover:border-primary hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                  <IconComponent size={24} />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="font-body text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`,

    TestimonialSection: () => `import { Star } from 'lucide-react';

export default function TestimonialSection({ heading, subtext, items = [] }) {
  return (
    <section id="testimonials" className="py-24 px-6 bg-background">
      <div className="max-w-[1200px] mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">{heading}</h2>
        {subtext && <p className="font-body text-base text-muted mb-16">{subtext}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-8 text-left">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className={j < (item.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                ))}
              </div>
              <p className="font-body text-base text-muted mb-6 italic leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-heading font-bold text-lg">
                  {(item.name || 'U')[0]}
                </div>
                <div>
                  <div className="font-body text-sm font-semibold text-foreground">{item.name}</div>
                  <div className="font-body text-xs text-muted">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
`,

    AboutSection: () => `export default function AboutSection({ heading, description, image, stats = [] }) {
  return (
    <section id="about" className="py-24 px-6 bg-surface">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="rounded-2xl overflow-hidden">
          <img src={image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'}
            alt={heading} className="w-full h-[440px] object-cover" />
        </div>
        <div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-6">{heading}</h2>
          <p className="font-body text-base text-muted leading-relaxed mb-10">{description}</p>
          {stats.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="font-heading text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="font-body text-xs text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
`,

    CTASection: () => `import { ArrowRight } from 'lucide-react';

export default function CTASection({ heading, subtext, ctaText, ctaLink = '#contact', secondaryCtaText }) {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-primary to-primary-hover">
      <div className="max-w-[800px] mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">{heading}</h2>
        {subtext && <p className="font-body text-lg text-white/85 mb-9">{subtext}</p>}
        <div className="flex gap-4 justify-center flex-wrap">
          <a href={ctaLink}
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-xl text-base font-bold no-underline font-body hover:-translate-y-0.5 transition-all hover:shadow-xl">
            {ctaText} <ArrowRight size={18} />
          </a>
          {secondaryCtaText && (
            <a href="#" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-3.5 rounded-xl text-base font-medium no-underline font-body">
              {secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
`,

    ContactSection: () => `'use client';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactSection({ heading, subtext, email, phone, address }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thank you! We'll be in touch.");
  };

  return (
    <section id="contact" className="py-24 px-6 bg-background">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">{heading}</h2>
          {subtext && <p className="font-body text-base text-muted">{subtext}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block font-body text-sm text-muted mb-2">Full Name</label>
              <input type="text" placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground font-body text-sm outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block font-body text-sm text-muted mb-2">Email</label>
              <input type="email" placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground font-body text-sm outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block font-body text-sm text-muted mb-2">Message</label>
              <textarea rows={5} placeholder="Tell us about your project..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground font-body text-sm outline-none focus:border-primary transition-colors resize-y" />
            </div>
            <button type="submit"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl border-none text-base font-semibold cursor-pointer font-body hover:-translate-y-0.5 transition-all">
              Send Message <Send size={18} />
            </button>
          </form>
          <div className="flex flex-col gap-8 pt-2">
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Mail size={20} /></div>
              <div>
                <div className="font-body text-sm font-semibold text-foreground mb-1">Email</div>
                <div className="font-body text-sm text-muted">{email || 'hello@example.com'}</div>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Phone size={20} /></div>
              <div>
                <div className="font-body text-sm font-semibold text-foreground mb-1">Phone</div>
                <div className="font-body text-sm text-muted">{phone || '+1 (555) 000-0000'}</div>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPin size={20} /></div>
              <div>
                <div className="font-body text-sm font-semibold text-foreground mb-1">Address</div>
                <div className="font-body text-sm text-muted">{address || '123 Main Street, City'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`,

    FooterSection: () => `import { Twitter, Github, Linkedin, Facebook, Instagram, Globe } from 'lucide-react';

const socialIcons = { twitter: Twitter, github: Github, linkedin: Linkedin, facebook: Facebook, instagram: Instagram };

export default function FooterSection({ variant = 'simple', brand, description, links = [], socialLinks = [], copyright }) {
  const copyrightText = copyright || \`© \${new Date().getFullYear()} \${brand}. All rights reserved.\`;

  if (variant === 'withLinks') {
    const linkGroups = Array.isArray(links) && links.length > 0 && typeof links[0] === 'object' 
      ? links 
      : [
          { title: 'Product', items: ['Features', 'Pricing', 'FAQ'] },
          { title: 'Company', items: ['About', 'Blog', 'Careers'] },
          { title: 'Support', items: ['Help', 'Contact', 'Privacy'] },
        ];

    return (
      <footer className="pt-20 pb-10 px-6 bg-surface border-t border-border">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="font-heading text-2xl font-bold text-foreground mb-4">{brand}</div>
              {description && <p className="font-body text-sm text-muted leading-relaxed mb-6 max-w-[300px]">{description}</p>}
              <div className="flex gap-3">
                {socialLinks.map((s, i) => {
                  const name = typeof s === 'string' ? s : 'globe';
                  const Icon = socialIcons[name] || Globe;
                  return (
                    <a key={i} href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:border-primary hover:text-primary no-underline transition-all">
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>
            {linkGroups.map((group, i) => (
              <div key={i}>
                <div className="font-body text-xs font-semibold text-foreground mb-5 uppercase tracking-wider">{group.title}</div>
                <div className="flex flex-col gap-3">
                  {(group.items || []).map((item, j) => (
                    <a key={j} href="#" className="font-body text-sm text-muted hover:text-primary no-underline transition-colors">{item}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="font-body text-xs text-muted">{copyrightText}</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="py-12 px-6 bg-surface border-t border-border">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between flex-wrap gap-6">
        <div className="font-heading text-xl font-bold text-foreground">{brand}</div>
        <div className="flex gap-3">
          {socialLinks.map((s, i) => {
            const name = typeof s === 'string' ? s : 'globe';
            const Icon = socialIcons[name] || Globe;
            return (
              <a key={i} href="#" className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted hover:border-primary hover:text-primary no-underline transition-all">
                <Icon size={16} />
              </a>
            );
          })}
        </div>
        <p className="font-body text-xs text-muted">{copyrightText}</p>
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
