/**
 * Template Assembler — Orchestrates the full generation pipeline
 * 
 * Takes an enriched prompt spec → calls Layout Planner → renders HTML preview.
 * Also generates the Next.js project structure for export/download.
 * 
 * This replaces the old "dual track" (HTML vs React) system with a single
 * unified pipeline that always produces error-free output.
 */

const { renderToHTML, RENDERERS } = require('../component-kit/html-renderer.js');
const { getTheme, mergeUserColors } = require('../config/themeRegistry.js');
const { planLayout, buildFallbackLayout } = require('./layoutPlanner.js');
const { htmlToJsx } = require('../utils/htmlToJsx.js');

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
  let themeConfig = getTheme(themeId);
  
  // Merge AI-suggested or user-provided brand colors
  if (enrichedSpec.brandColors) {
    themeConfig = mergeUserColors(themeConfig, enrichedSpec.brandColors);
  }

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
  // ── DYNAMIC REACT COMPONENT GENERATION (HTML to JSX)
  // ══════════════════════════════════════════════════════════

  const componentImports = [];
  const componentJSX = [];

  for (const [index, section] of (layoutSpec.sections || []).entries()) {
    const cName = section.component + '_' + index;
    let htmlStr = '';
    
    // Generate the raw HTML string using the exact engine used for preview
    if (RENDERERS[section.component]) {
      try {
        htmlStr = RENDERERS[section.component](section, themeConfig);
      } catch (e) {
        console.error('[Assembler] Failed to render', section.component, e);
      }
    }

    // Convert HTML string to valid React JSX
    const jsxCode = htmlToJsx(htmlStr);

    files[`next-export/components/${cName}.jsx`] = `
export default function ${cName}() {
  return (
    ${jsxCode}
  );
}
`;

    componentImports.push(`import ${cName} from '@/components/${cName}';`);
    componentJSX.push(`      <${cName} />`);
  }

  // ── app/page.jsx ──
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

module.exports = { assemble };
