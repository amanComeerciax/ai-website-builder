import { useState, useMemo } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, Loader2, Download } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
} from "@codesandbox/sandpack-react"
import { useEditorStore } from '../../stores/editorStore'
import { useChatStore } from '../../stores/chatStore'
import { ErrorBoundary } from '../ErrorBoundary'
import './PreviewPanel.css'

export default function PreviewPanel() {
    const { files, previewType, htmlContent } = useEditorStore()
    const { isGenerating, generationPhase } = useChatStore()
    const [viewMode, setViewMode] = useState('desktop')
    const [refreshKey, setRefreshKey] = useState(0)

    const viewWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    }

    // ── TRACK A: srcdoc preview (instant, no build step) ──────────────
    // Used for simple HTML sites generated as a single index.html
    const isSrcdoc = previewType === 'srcdoc' && htmlContent;

    // ── TRACK B: Sandpack template detection ──────────────────────────
    const sandpackTemplate = useMemo(() => {
        if (isSrcdoc) return 'vanilla';
        const fileNames = Object.keys(files).map(k => k.startsWith('/') ? k : `/${k}`);
        if (fileNames.includes('/index.html') && !fileNames.some(k => k.endsWith('.jsx') || k.endsWith('.tsx'))) {
            return 'vanilla';
        }
        // Force 'react' template universally! Sandpack's nextjs template implies WebContainers which randomly OOM 
        // crash, trigger node worker bugs, and break on CI. Pure react transpiles fast in browser.
        return 'react'; 
    }, [files, isSrcdoc])

    // ── TRACK B: Build Sandpack file map with AI file overrides ──────
    const sandpackFiles = useMemo(() => {
        if (isSrcdoc) return {}; // not used in srcdoc mode

        const result = {}
        Object.entries(files).forEach(([path, file]) => {
            const cleanPath = path.startsWith('/') ? path : `/${path}`
            result[cleanPath] = file.content
        })
        
        const fileNames = Object.keys(result);

        if (sandpackTemplate === 'vanilla') {
            if (!result['/index.html'] && result['/public/index.html']) {
                result['/index.html'] = result['/public/index.html'];
            }
        } else if (sandpackTemplate === 'react') {
            const isNextRouterApp = fileNames.some(f => f.startsWith('/app/') || f.startsWith('/pages/'));
            
            // ── MAGIC PURE REACT BRIDGE ──
            // Intercepts AI files and ensures they run perfectly in the Sandpack React template.
            
            // ── PERMANENT FIX: Runtime-safe lucide-react wrapper ──
            // Instead of maintaining a static whitelist (impossible to keep in sync with
            // the version Sandpack loads), we inject a wrapper module that dynamically
            // re-exports icons and returns safe fallbacks for any that don't exist.
            
            // Step 1: Inject the safe wrapper module into the Sandpack file system
            result['/lucide-safe.js'] = `
import * as LucideIcons from 'lucide-react';

// Create a Proxy that returns a safe fallback SVG for any icon that doesn't exist
const SafeIcon = (name) => {
  const Icon = LucideIcons[name];
  if (Icon) return Icon;
  // Return a tiny empty SVG placeholder instead of undefined
  const Fallback = ({ size = 24, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="10" opacity="0.3"/>
    </svg>
  );
  Fallback.displayName = name + 'Fallback';
  return Fallback;
};

// Re-export everything that exists
export * from 'lucide-react';

// Export the SafeIcon helper for dynamic access
export { SafeIcon };
`.trim();

            // Step 2: Process all files
            Object.keys(result).forEach(name => {
                if (name === '/lucide-safe.js') return; // skip our own wrapper
                if (name.endsWith('.jsx') || name.endsWith('.js') || name.endsWith('.tsx') || name.endsWith('.ts')) {
                    if (typeof result[name] === 'string') {
                        let content = result[name];
                        
                        // Auto-correct Tailwind unescaped double quotes inside JSX strings
                        content = content.replace(/-\["([^"]+)"\]/g, (match, p1) => `-['${p1.replace(/\s+/g, '_')}']`);
                        content = content.replace(/-\['([^']+)'\]/g, (match, p1) => `-['${p1.replace(/\s+/g, '_')}']`);
                        
                        // Auto-correct `@/` imports
                        content = content.replace(/from\s+['"]@\//g, "from '/src/");
                        content = content.replace(/import\s+['"]@\//g, "import '/src/");

                        // ── COLLISION DETECTION ──
                        // Collect all identifiers imported from react-router-dom BEFORE processing lucide
                        // This prevents conflicts like `Link` (lucide icon) vs `Link` (router component)
                        const routerImports = new Set();
                        const routerImportRegex = /import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"]/g;
                        let routerMatch;
                        while ((routerMatch = routerImportRegex.exec(content)) !== null) {
                            routerMatch[1].split(',').forEach(name => {
                                routerImports.add(name.trim().split(/\s+as\s+/)[0]); // handle "Link as RouterLink"
                            });
                        }
                        
                        // ── PERMANENT ICON FIX ──
                        // Rewrite ALL lucide-react imports to use our safe wrapper
                        const lucideImportRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
                        content = content.replace(lucideImportRegex, (match, iconList) => {
                            const icons = iconList.split(',').map(s => s.trim()).filter(Boolean);
                            
                            // Strip common AI suffix hallucinations
                            const cleanedIcons = icons.map(icon => {
                                return icon.replace(/(Icon|Logo|Outline|Filled|Solid)$/i, '');
                            });
                            
                            // Filter out icons that collide with react-router-dom imports
                            const safeIcons = cleanedIcons.filter(icon => !routerImports.has(icon));
                            const skippedIcons = cleanedIcons.filter(icon => routerImports.has(icon));
                            
                            if (skippedIcons.length > 0) {
                                console.log(`[PreviewPanel] Skipped lucide shim for router-colliding icons: ${skippedIcons.join(', ')}`);
                            }
                            
                            if (safeIcons.length === 0) return ''; // All icons collided, remove the import entirely
                            
                            // Build safe import: import from our wrapper + add SafeIcon fallbacks
                            const safeImport = `import { SafeIcon, ${[...new Set(safeIcons)].join(', ')} } from '/lucide-safe.js'`;
                            
                            // For each icon, add a local fallback reassignment after the import  
                            const fallbacks = safeIcons.map(icon => {
                                // Also fix JSX usage if name was cleaned
                                const originalIcon = icons[cleanedIcons.indexOf(icon)];
                                if (originalIcon !== icon) {
                                    content = content.replace(new RegExp(`<${originalIcon}\\b`, 'g'), `<${icon}`);
                                    content = content.replace(new RegExp(`</${originalIcon}\\b`, 'g'), `</${icon}`);
                                }
                                return `const _${icon} = typeof ${icon} !== 'undefined' ? ${icon} : SafeIcon('${icon}');`;
                            });
                            
                            // Replace each icon usage in JSX with the safe version
                            safeIcons.forEach(icon => {
                                // Replace <IconName with <_IconName (the safe version)
                                content = content.replace(new RegExp(`<${icon}(\\s|\\/)`, 'g'), `<_${icon}$1`);
                                content = content.replace(new RegExp(`</${icon}>`, 'g'), `</_${icon}>`);
                            });
                            
                            return safeImport + ';\n' + fallbacks.join('\n');
                        });
                        
                        result[name] = content;

                    }
                }
            });

            // 2. Build the synthetic React entry point for Vite React apps
            const appPath = fileNames.find(f => f === '/src/App.jsx' || f === '/src/App.js' || f === '/App.jsx' || f === '/App.js');
            const entryPath = fileNames.find(f => f === '/src/index.js' || f === '/src/index.jsx' || f === '/src/main.jsx' || f === '/src/main.js');
            const stylesPath = fileNames.find(f => f === '/src/styles.css' || f === '/src/index.css' || f === '/src/App.css' || f === '/styles.css');
                
                if (appPath && appPath !== '/App.js') {
                    const importPath = appPath.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '');
                    result['/App.js'] = `export { default } from '${importPath}';\n`;
                } else if (!appPath) {
                    const anyJsx = fileNames.find(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
                    if (anyJsx) {
                        result['/App.js'] = `export { default } from '${anyJsx.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '')}';\n`;
                    }
                }
                
                if (entryPath && entryPath !== '/index.js') {
                    const importPath = entryPath.replace(/^\//, './').replace(/\.(jsx|tsx|js|ts)$/, '');
                    result['/index.js'] = `import '${importPath}';\n`;
                } else if (!entryPath) {
                    const styleImport = stylesPath ? `import '${stylesPath.replace(/^\//, './')}';\n` : '';
                    const appImport = appPath ? appPath.replace(/^\//, './').replace(/\.(jsx|tsx|js|ts)$/, '') : './App';
                    
                    result['/index.js'] = [
                        `import React, { StrictMode } from "react";`,
                        `import { createRoot } from "react-dom/client";`,
                        styleImport,
                        `import App from "${appImport}";`,
                        `const root = createRoot(document.getElementById("root"));`,
                        `root.render(<StrictMode><App /></StrictMode>);`
                    ].filter(Boolean).join('\n');
                }

                if (appPath && !result['/App.js'] && !result['/App.jsx']) {
                     const importPath = appPath.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '');
                     result['/App.js'] = `export { default } from '${importPath}';\n`;
                }
            
            // Robust package.json validation for Pure React fallback
            const defaultPackageJson = {
                name: "stackforge-react-app",
                version: "1.0.0",
                main: "/index.js",
                dependencies: {
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "react-router-dom": "latest",
                    "lucide-react": "0.263.1",
                    "framer-motion": "latest",
                    "clsx": "latest",
                    "tailwind-merge": "latest",
                    "axios": "latest",
                    "react-hook-form": "latest",
                    "@hookform/resolvers": "latest",
                    "zod": "latest",
                    "@tanstack/react-query": "latest",
                    "date-fns": "latest",
                    "recharts": "latest",
                    "react-is": "latest",
                    "zustand": "latest",
                    "react-hot-toast": "latest"
                }
            };

            if (!result['/package.json']) {
                result['/package.json'] = JSON.stringify(defaultPackageJson, null, 2);
            } else {
                try {
                    const parsedPkg = JSON.parse(result['/package.json']);
                    if (parsedPkg.dependencies) {
                        parsedPkg.dependencies['react-is'] = 'latest';
                        delete parsedPkg.dependencies['next']; // Purge next completely to ensure vanilla react execution
                        result['/package.json'] = JSON.stringify(parsedPkg, null, 2);
                    }
                } catch (e) {
                    console.warn('[PreviewPanel] AI generated a malformed package.json. Falling back to default.', e);
                    result['/package.json'] = JSON.stringify(defaultPackageJson, null, 2);
                }
            }
        }
        
        return result
    }, [files, sandpackTemplate, isSrcdoc])

    // Automatically discover any unapproved/hallucinated NPM imports and inject them into Sandpack
    const dynamicDependencies = useMemo(() => {
        const deps = {
            "lucide-react": "0.263.1",
            "framer-motion": "latest",
            "recharts": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest",
            "@tanstack/react-query": "latest",
            "zustand": "latest"
        };
        
        if (!sandpackFiles) return deps;
        
        Object.values(sandpackFiles).forEach(content => {
            if (typeof content !== 'string') return;
            // Use [\s\S]*? instead of .*? to correctly capture multi-line destructured imports!
            const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'".]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                let pkgName = match[1];
                // Ignore relative/absolute path imports and Next.js internal modules
                if (!pkgName.startsWith('.') && !pkgName.startsWith('/') && !pkgName.startsWith('@/') && !pkgName.startsWith('next')) {
                    // Extract root NPM package name handling scopes (e.g. '@hello-pangea/dnd' -> '@hello-pangea/dnd')
                    if (pkgName.startsWith('@')) {
                        const parts = pkgName.split('/');
                        pkgName = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
                    } else {
                        pkgName = pkgName.split('/')[0];
                    }
                    
                    // Don't auto-fetch React since Sandpack handles it
                    if (pkgName !== 'react' && pkgName !== 'react-dom') {
                        deps[pkgName] = "latest";
                    }
                }
            }
        });
        return deps;
    }, [sandpackFiles]);

    // ── ZIP DOWNLOAD LOGIC ────────────────────────────────────────────
    const handleDownloadZip = async () => {
        const zip = new JSZip();
        // Use business name from files if possible, otherwise default
        let appName = 'my-website';
        if (files['/package.json']) {
            try {
                appName = JSON.parse(files['/package.json']).name;
            } catch (e) {
                console.warn('Failed to parse package.json for download name', e);
            }
        }
        
        if (isSrcdoc) {
            // Track A: Single HTML file
            zip.file("index.html", htmlContent);
        } else {
            // Track B: Multi-file React project
            Object.entries(files).forEach(([path, file]) => {
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                const content = typeof file === 'string' ? file : file.content;
                zip.file(cleanPath, content);
            });
        }
        
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${appName.replace(/\s+/g, '-').toLowerCase()}.zip`);
    };

    return (
        <div className="preview-panel">
            <div className="pp-toolbar">
                <div className="pp-url-bar">
                    <span className="pp-url-dot green" />
                    <span className="pp-url-dot yellow" />
                    <span className="pp-url-dot red" />
                    <div className="pp-url-text">
                        {isSrcdoc ? 'preview — HTML' : 'localhost:3000'}
                    </div>
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
                    <button className="pp-view-btn" onClick={() => setRefreshKey(k => k + 1)} title="Refresh">
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        className="pp-view-btn download" 
                        onClick={handleDownloadZip} 
                        title="Download ZIP"
                        disabled={!isSrcdoc && Object.keys(files).length === 0}
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            <div className="pp-iframe-container" key={refreshKey}>
                <div className="pp-iframe-wrapper" style={{ maxWidth: viewWidths[viewMode] }}>

                    {/* ── TRACK A: Instant srcdoc preview (HTML/CDN only, zero errors) ── */}
                    {isSrcdoc ? (
                        <iframe
                            srcDoc={htmlContent}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Generated website preview"
                        />
                    ) : Object.keys(files).length === 0 ? (
                        /* ── No files yet: show placeholder instead of Sandpack Hello World ── */
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', height: '100%', gap: '1rem',
                            color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif',
                            textAlign: 'center', padding: '2rem'
                        }}>
                            {(isGenerating || generationPhase === 'thinking' || generationPhase === 'streaming_logs') ? (
                                <>
                                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                                    <p style={{ fontSize: '0.9rem' }}>Generating your website...</p>
                                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                                </>
                            ) : (
                                <>
                                    <Monitor size={40} strokeWidth={1.2} />
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                                        No preview yet
                                    </p>
                                    <p style={{ fontSize: '0.8rem', maxWidth: '260px' }}>
                                        Send a prompt to generate your website
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        /* ── TRACK B: Sandpack React preview ── */
                        <ErrorBoundary>
                            <SandpackProvider
                                template={sandpackTemplate}
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
                                    ]
                                }}
                            >
                                <SandpackLayout style={{ height: '100%', border: 'none', background: 'transparent' }}>
                                    <SandpackPreview 
                                        style={{ height: '100%' }} 
                                        showNavigator={false}
                                        showRefreshButton={false}
                                        showOpenInCodeSandbox={false}
                                    />
                                </SandpackLayout>
                            </SandpackProvider>
                        </ErrorBoundary>
                    )}
                </div>
            </div>
        </div>
    )
}
