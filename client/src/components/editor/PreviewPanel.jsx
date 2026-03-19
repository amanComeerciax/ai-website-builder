import { useState, useMemo } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react'
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
} from "@codesandbox/sandpack-react"
import { useEditorStore } from '../../stores/editorStore'
import './PreviewPanel.css'

export default function PreviewPanel() {
    const { files, previewType, htmlContent } = useEditorStore()
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
        if (isSrcdoc) return 'vanilla'; // won't be used but set a safe default
        const fileNames = Object.keys(files).map(k => k.startsWith('/') ? k : `/${k}`);
        const hasReactFiles = fileNames.some(k => k.endsWith('.jsx') || k.endsWith('.tsx'));
        const hasViteConfig = fileNames.some(k => k.includes('vite.config'));
        if (hasReactFiles || hasViteConfig) return 'react';
        if (fileNames.includes('/index.html')) return 'vanilla';
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
        } else {
            // ── Override Sandpack react template's built-in "Hello world" defaults ──
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
            
            // Bridge: make Sandpack's /App.js re-export the AI's actual component
            if (appPath && appPath !== '/App.js') {
                const importPath = appPath.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '');
                result['/App.js'] = `export { default } from '${importPath}';\n`;
            } else if (!appPath) {
                const anyJsx = fileNames.find(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
                if (anyJsx) {
                    result['/App.js'] = `export { default } from '${anyJsx.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '')}';\n`;
                }
            }
            
            // Override /index.js entry point
            if (!entryPath) {
                const styleImport = stylesPath ? `import '${stylesPath.replace(/^\//, './')}';\n` : '';
                result['/index.js'] = [
                    `import React, { StrictMode } from "react";`,
                    `import { createRoot } from "react-dom/client";`,
                    styleImport,
                    `import App from "./App";`,
                    `const root = createRoot(document.getElementById("root"));`,
                    `root.render(<StrictMode><App /></StrictMode>);`
                ].filter(Boolean).join('\n');
            }
            
            // Ensure styles don't get clobbered
            if (!result['/styles.css']) {
                result['/styles.css'] = stylesPath ? result[stylesPath] : '/* styles */';
            }

            // Package.json with only allowed packages
            if (!result['/package.json']) {
                result['/package.json'] = JSON.stringify({
                    name: "stackforge-app",
                    version: "1.0.0",
                    main: "/index.js",
                    dependencies: {
                        "react": "^18.2.0",
                        "react-dom": "^18.2.0",
                        "lucide-react": "^0.263.1",
                        "framer-motion": "latest",
                        "clsx": "latest",
                        "tailwind-merge": "latest",
                        "date-fns": "latest",
                        "recharts": "latest",
                        "zustand": "latest",
                        "react-hot-toast": "latest",
                    }
                }, null, 2);
            }
        }
        
        return result
    }, [files, sandpackTemplate, isSrcdoc])

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
                    ) : (
                        /* ── TRACK B: Sandpack React preview ── */
                        <SandpackProvider
                            template={sandpackTemplate}
                            theme="dark"
                            files={sandpackFiles}
                            options={{
                                recompileMode: "immediate",
                                recompileDelay: 500,
                                autoReload: true,
                                externalResources: [
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
