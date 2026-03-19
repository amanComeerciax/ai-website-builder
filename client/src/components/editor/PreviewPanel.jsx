import { useState, useMemo } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Loader2 } from 'lucide-react'
import { 
    SandpackProvider, 
    SandpackLayout, 
    SandpackPreview, 
} from "@codesandbox/sandpack-react"
import { useEditorStore } from '../../stores/editorStore'
import './PreviewPanel.css'

export default function PreviewPanel() {
    const { files } = useEditorStore()
    const [viewMode, setViewMode] = useState('desktop')
    const [refreshKey, setRefreshKey] = useState(0)

    // Determine the correct Sandpack template (react vs vanilla HTML)
    // Determine the correct Sandpack template (react vs vanilla HTML vs vite-react)
    const sandpackTemplate = useMemo(() => {
        const fileNames = Object.keys(files).map(k => k.startsWith('/') ? k : `/${k}`);
        
        const hasPackageJson = fileNames.includes('/package.json');
        const hasReactFiles = fileNames.some(k => k.endsWith('.jsx') || k.endsWith('.tsx'));
        const hasViteConfig = fileNames.some(k => k.includes('vite.config'));
        
        if (hasReactFiles || hasPackageJson || hasViteConfig) {
            // If it has a root index.html alongside react files, it's a Vite app
            if (fileNames.includes('/index.html') || hasViteConfig) {
                return 'vite-react';
            }
            return 'react';
        }

        // Default to vanilla HTML/JS
        return 'vanilla';
    }, [files]);

    // Convert VFS from { path: { content } } to Sandpack { path: content }
    // CRITICAL: Override Sandpack template defaults so AI-generated code actually renders
    const sandpackFiles = useMemo(() => {
        const result = {}
        Object.entries(files).forEach(([path, file]) => {
            // Sandpack expects paths to start with /
            const cleanPath = path.startsWith('/') ? path : `/${path}`
            result[cleanPath] = file.content
        })
        
        const fileNames = Object.keys(result);
        
        if (sandpackTemplate === 'vanilla') {
            if (!result['/index.html']) {
                if (result['/public/index.html']) {
                    result['/index.html'] = result['/public/index.html'];
                } else {
                    result['/index.html'] = `<h1>No index.html found at root. Waiting for AI to generate...</h1>`;
                }
            }
            if (!result['/index.js']) {
                 result['/index.js'] = `// Suppressing CodeSandbox default boilerplate`;
            }
        } else if (sandpackTemplate === 'react' || sandpackTemplate === 'vite-react') {
            // ─── CRITICAL FIX: Override Sandpack's built-in "Hello world" defaults ───
            // The react template ships with /App.js = "Hello world" and /index.js importing ./App
            // We MUST overwrite these so they point to the AI's ACTUAL entry component.
            
            // Find the AI's actual App component
            const appPath = fileNames.find(f => 
                f === '/src/App.jsx' || f === '/src/App.js' || f === '/src/App.tsx' ||
                f === '/App.jsx' || f === '/App.js'
            );
            
            // Find the AI's actual entry/index file
            const entryPath = fileNames.find(f =>
                f === '/src/index.js' || f === '/src/index.jsx' || 
                f === '/src/main.jsx' || f === '/src/main.js' ||
                f === '/index.js' || f === '/index.jsx'
            );

            // Find the AI's styles file
            const stylesPath = fileNames.find(f => 
                f === '/src/styles.css' || f === '/src/index.css' || 
                f === '/src/styles/global.css' || f === '/styles.css' ||
                f === '/src/App.css'
            );
            
            if (appPath && appPath !== '/App.js') {
                // Bridge: Override Sandpack's default /App.js to re-export from AI's actual path
                // This makes the template's /index.js (import ./App) load the real component
                const importPath = appPath.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '');
                result['/App.js'] = `export { default } from '${importPath}';\n`;
            } else if (appPath === '/App.js') {
                // AI generated exactly /App.js — it will naturally override the template default
            } else if (!appPath && Object.keys(result).length > 0) {
                // No App component found — try to create a minimal bridge from whatever files exist
                const anyJsx = fileNames.find(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
                if (anyJsx) {
                    const importPath = anyJsx.replace(/^\//, './').replace(/\.(jsx|tsx)$/, '');
                    result['/App.js'] = `export { default } from '${importPath}';\n`;
                }
            }
            
            // Override /index.js to use proper imports + styles
            if (entryPath && entryPath !== '/index.js') {
                // AI has a custom entry (e.g. src/main.jsx) — use its content as /index.js
                result['/index.js'] = result[entryPath];
            } else if (!entryPath) {
                // No entry at all — create one that imports the App bridge + styles
                const styleImport = stylesPath ? `import '${stylesPath.replace(/^\//, './')}';\n` : '';
                result['/index.js'] = [
                    `import React, { StrictMode } from "react";`,
                    `import { createRoot } from "react-dom/client";`,
                    styleImport ? styleImport : ``,
                    `import App from "./App";`,
                    ``,
                    `const root = createRoot(document.getElementById("root"));`,
                    `root.render(<StrictMode><App /></StrictMode>);`
                ].filter(Boolean).join('\n');
            }
            
            // Override /styles.css so Sandpack's default body styles don't clobber AI themes
            if (!result['/styles.css'] && stylesPath) {
                result['/styles.css'] = result[stylesPath];
            } else if (!result['/styles.css']) {
                result['/styles.css'] = '/* No global styles generated */';
            }
            
            // Ensure package.json has all dependencies
            if (!result['/package.json']) {
                result['/package.json'] = JSON.stringify({
                    "name": "stackforge-generated-app",
                    "version": "1.0.0",
                    "main": "/index.js",
                    "dependencies": {
                        "react": "^18.2.0",
                        "react-dom": "^18.2.0",
                        "lucide-react": "^0.263.1",
                        "framer-motion": "latest",
                        "clsx": "latest",
                        "tailwind-merge": "latest"
                    }
                }, null, 2);
            }
        }
        
        return result
    }, [files, sandpackTemplate])

    const viewWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    }

    return (
        <div className="preview-panel">
            <div className="pp-toolbar">
                <div className="pp-url-bar">
                    <span className="pp-url-dot green" />
                    <span className="pp-url-dot yellow" />
                    <span className="pp-url-dot red" />
                    <div className="pp-url-text">localhost:3000</div>
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
                    <SandpackProvider
                        template={sandpackTemplate}
                        theme="dark"
                        files={sandpackFiles}
                        options={{
                            recompileMode: "immediate",
                            recompileDelay: 300,
                        }}
                    >
                        <SandpackLayout style={{ height: '100%', border: 'none', background: 'transparent' }}>
                            <SandpackPreview 
                                style={{ height: '100%' }} 
                                showNavigator={false}
                                showRefreshButton={false}
                                loadingAdComponent={() => (
                                    <div className="pp-loading" style={{ 
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
                </div>
            </div>
        </div>
    )
}

