import { useState, useMemo } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, Loader2, Download } from 'lucide-react'
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
} from "@codesandbox/sandpack-react"
import { useEditorStore } from '../../stores/editorStore'
import { downloadProjectAsZip } from '../../utils/downloadZip'
import './PreviewPanel.css'

// ── All packages the Sandpack preview is allowed to install ──────
// Must stay in sync with server/utils/codeValidator.js ALLOWED_PACKAGES
// NOTE: 'next' is intentionally excluded — Sandpack uses the React template,
// and next/* imports are stripped during the Next.js→React transformation.
const SANDPACK_ALLOWED_DEPS = {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'lucide-react': '^0.263.1',
    'clsx': 'latest',
    'tailwind-merge': 'latest',
    'date-fns': 'latest',
    'framer-motion': 'latest',
    '@radix-ui/react-dialog': 'latest',
    '@radix-ui/react-dropdown-menu': 'latest',
    '@radix-ui/react-select': 'latest',
    'recharts': 'latest',
    'react-hot-toast': 'latest',
    'zustand': 'latest',
    'zod': 'latest',
    '@hookform/resolvers': 'latest',
    'react-hook-form': 'latest',
    '@tanstack/react-query': 'latest',
    'axios': 'latest',
}

/**
 * Strip Next.js-specific code from a component so it works in plain React.
 * Removes: "use client", next/font/google imports, next/* imports,
 * metadata exports, and font variable declarations.
 */
function stripNextjsCode(code) {
    if (!code) return '';
    return code
        // Remove "use client" directive
        .replace(/^\s*["']use client["'];?\s*\n?/m, '')
        // Remove next/font/google and all next/* imports
        .replace(/^\s*import\s+.*from\s+['"]next\/[^'"]*['"].*\n?/gm, '')
        // Remove `export const metadata = { ... };`
        .replace(/^\s*export\s+const\s+metadata\s*=\s*\{[\s\S]*?\};?\s*\n?/m, '')
        // Remove font declarations like `const inter = Inter({ subsets: ["latin"], variable: "--font-body" })`
        .replace(/^\s*const\s+\w+\s*=\s*\w+\(\s*\{[^}]*subsets[^}]*\}\s*\);?\s*\n?/gm, '')
        // Remove className template literals referencing font variables: className={`${body.variable} ${heading.variable}`}
        .replace(/\s*className=\{`\$\{[^}]+\.variable\}[^`]*`\}/g, '');
}

export default function PreviewPanel() {
    const { files, previewType, htmlContent, tunnelUrl } = useEditorStore()
    const [viewMode, setViewMode] = useState('desktop')
    const [previewSource, setPreviewSource] = useState('cloud') // 'cloud' (Sandpack) | 'local' (localhost:3000 / tunnel)
    const [refreshKey, setRefreshKey] = useState(0)

    const viewWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    }

    // ── TRACK A: srcdoc preview (instant, no build step) ──────────────
    const isSrcdoc = previewType === 'srcdoc' && htmlContent;
    
    // Check if we should override with local terminal server
    const showLocalPreview = previewSource === 'local';

    // ── Detect whether the AI generated Next.js files ─────────────────
    const isNextjsOutput = useMemo(() => {
        const fileNames = Object.keys(files).map(k => k.startsWith('/') ? k : `/${k}`);
        return fileNames.some(k => 
            k.includes('/app/page.') || k.includes('/app/layout.') || k.includes('/app/globals.')
        );
    }, [files])

    // ── Scan generated files for imported packages ────────────────────
    const detectedDeps = useMemo(() => {
        const deps = { 'react': '^18.2.0', 'react-dom': '^18.2.0' };
        const importRegex = /from\s+['"]([^'".\/][^'"]*)['"]/g;
        
        Object.values(files).forEach(file => {
            const content = typeof file === 'string' ? file : file?.content || '';
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const fullPkg = match[1];
                const pkg = fullPkg.startsWith('@')
                    ? fullPkg.split('/').slice(0, 2).join('/')
                    : fullPkg.split('/')[0];
                
                // Skip 'next' — not available in Sandpack React preview
                if (pkg === 'next') continue;
                
                if (SANDPACK_ALLOWED_DEPS[pkg] && !deps[pkg]) {
                    deps[pkg] = SANDPACK_ALLOWED_DEPS[pkg];
                }
            }
        });
        
        return deps;
    }, [files])

    // ── TRACK B: Build Sandpack file map ─────────────────────────────
    // IMPORTANT: Always uses the "react" Sandpack template.
    // Next.js files (app/page.tsx etc.) are transformed into React-compatible format.
    const sandpackFiles = useMemo(() => {
        if (isSrcdoc || showLocalPreview) return {};

        const result = {}
        Object.entries(files).forEach(([path, file]) => {
            const cleanPath = path.startsWith('/') ? path : `/${path}`
            result[cleanPath] = file.content
        })
        
        const fileNames = Object.keys(result);

        if (isSrcdoc) {
            // vanilla — already handled above
        } else if (isNextjsOutput) {
            // ══════════════════════════════════════════════════════════
            // ── Native Next.js Routing ──
            // We use Sandpack's 'nextjs' template which natively supports
            // app/ routing, next/link, and next/image.
            // ══════════════════════════════════════════════════════════

            // Just add tsconfig.json to support @/ aliases natively
            result['/tsconfig.json'] = JSON.stringify({
                "compilerOptions": {
                    "baseUrl": ".",
                    "paths": {
                        "@/*": ["./*"]
                    }
                }
            }, null, 2);

            // Add basic next.config to disable image optimization in preview
            result['/next.config.mjs'] = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
};
export default nextConfig;
`.trim();

            // We still need package.json to declare dependencies
            result['/package.json'] = JSON.stringify({
                name: "stackforge-nextjs-app",
                version: "1.0.0",
                private: true,
                dependencies: {
                    ...detectedDeps,
                    "next": "latest",
                    "react": "latest",
                    "react-dom": "latest"
                }
            }, null, 2);
        } else {
            // ── Standard React files ──
            const appPath = fileNames.find(f => 
                f === '/src/App.jsx' || f === '/src/App.js' || 
                f === '/App.jsx' || f === '/App.js'
            );
            const entryPath = fileNames.find(f =>
                f === '/src/index.js' || f === '/src/index.jsx' || 
                f === '/src/main.jsx' || f === '/src/main.js'
            );
            const stylesPath = fileNames.find(f => 
                f === '/src/styles.css' || f === '/src/index.css' || 
                f === '/src/App.css' || f === '/styles.css'
            );
            
            if (appPath && appPath !== '/App.tsx' && appPath !== '/App.js') {
                const importPath = appPath.replace(/^\//, './').replace(/\.(jsx|tsx|js|ts)$/, '');
                result['/App.tsx'] = `export { default } from '${importPath}';\n`;
            } else if (!appPath) {
                const anyJsx = fileNames.find(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
                if (anyJsx) {
                    result['/App.tsx'] = `export { default } from '${anyJsx.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '')}';\n`;
                }
            }
            
            if (!entryPath) {
                const styleImport = stylesPath ? `import '${stylesPath.replace(/^\//, './')}';\n` : '';
                result['/index.tsx'] = [
                    `import React, { StrictMode } from "react";`,
                    `import { createRoot } from "react-dom/client";`,
                    styleImport,
                    `import App from "./App";`,
                    `const root = createRoot(document.getElementById("root"));`,
                    `root.render(<StrictMode><App /></StrictMode>);`
                ].filter(Boolean).join('\n');
            }
            
            if (!result['/styles.css']) {
                result['/styles.css'] = stylesPath ? result[stylesPath] : '/* styles */';
            }

            if (!result['/package.json']) {
                result['/package.json'] = JSON.stringify({
                    name: "stackforge-app",
                    version: "1.0.0",
                    main: "/index.tsx",
                    dependencies: detectedDeps
                }, null, 2);
            }
        }
        
        return result
    }, [files, isNextjsOutput, isSrcdoc, detectedDeps, showLocalPreview])

    return (
        <div className="preview-panel">
            <div className="pp-toolbar">
                <div className="pp-url-bar">
                    <span className="pp-url-dot green" />
                    <span className="pp-url-dot yellow" />
                    <span className="pp-url-dot red" />
                    <div className="pp-url-text">
                        {showLocalPreview 
                            ? (tunnelUrl || 'localhost:3000 — Local Terminal')
                            : isSrcdoc ? 'preview — HTML' : isNextjsOutput ? 'preview — Next.js' : 'preview'}
                    </div>
                </div>

                <div className="pp-source-toggle">
                    <button 
                        className={`pp-toggle-btn ${previewSource === 'cloud' ? 'active' : ''}`}
                        onClick={() => setPreviewSource('cloud')}
                    >
                        Cloud
                    </button>
                    <button 
                        className={`pp-toggle-btn ${previewSource === 'local' ? 'active' : ''}`}
                        onClick={() => setPreviewSource('local')}
                        title="View your terminal's localhost:3000"
                    >
                        Local
                    </button>
                </div>

                <div className="pp-actions">
                    <button
                        className={`pp-view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                        onClick={() => setViewMode('desktop')}
                        title="Desktop"
                    >
                        <Monitor size={14} />
                    </button>
                    <button
                        className={`pp-view-btn ${viewMode === 'tablet' ? 'active' : ''}`}
                        onClick={() => setViewMode('tablet')}
                        title="Tablet"
                    >
                        <Tablet size={14} />
                    </button>
                    <button
                        className={`pp-view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                        onClick={() => setViewMode('mobile')}
                        title="Mobile"
                    >
                        <Smartphone size={14} />
                    </button>
                    <div className="pp-toolbar-divider" />
                    <button className="pp-view-btn" onClick={() => setRefreshKey(k => k + 1)} title="Refresh">
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        className="pp-view-btn pp-download-btn" 
                        onClick={() => downloadProjectAsZip(files, 'my-project')} 
                        title="Download as ZIP"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            <div className="pp-iframe-container" key={refreshKey}>
                <div className="pp-iframe-wrapper" style={{ maxWidth: viewWidths[viewMode] }}>

                    {/* ── TRACK C: Local Host Preview (Bridge to Terminal) ── */}
                    {showLocalPreview ? (
                        <iframe
                            src={tunnelUrl || "http://localhost:3000"}
                            style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
                            title="Local Terminal Preview"
                        />
                    ) : isSrcdoc ? (
                        /* ── TRACK A: Instant srcdoc preview ── */
                        <iframe
                            srcDoc={htmlContent}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Generated website preview"
                        />
                    ) : (
                        /* ── TRACK B: Sandpack Preview ── */
                        <SandpackProvider
                            template={isNextjsOutput ? "nextjs" : "react-ts"}
                            theme="dark"
                            files={sandpackFiles}
                            options={{
                                recompileMode: "immediate",
                                recompileDelay: 500,
                                autoReload: true,
                                externalResources: [
                                    "https://cdn.tailwindcss.com",
                                    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
                                    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap",
                                    "https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800&display=swap",
                                    "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap",
                                    "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap",
                                    "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap",
                                    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
                                    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
                                ]
                            }}
                        >
                            <SandpackLayout style={{ height: '100%', border: 'none', background: 'transparent' }}>
                                <SandpackPreview 
                                    style={{ height: '100%' }} 
                                    showNavigator={false}
                                    showRefreshButton={false}
                                    showOpenInCodeSandbox={false}
                                    loadingAdComponent={() => (
                                        <div style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            height: '100%',
                                            gap: '12px',
                                            color: '#888'
                                        }}>
                                            <Loader2 className="animate-spin" size={24} />
                                            <span>Compiling...</span>
                                        </div>
                                    )}
                                />
                            </SandpackLayout>
                        </SandpackProvider>
                    )}
                </div>
            </div>
        </div>
    )
}
