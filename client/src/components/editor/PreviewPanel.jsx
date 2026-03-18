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
    const sandpackFiles = useMemo(() => {
        const result = {}
        Object.entries(files).forEach(([path, file]) => {
            // Sandpack expects paths to start with /
            const cleanPath = path.startsWith('/') ? path : `/${path}`
            result[cleanPath] = file.content
        })
        
        if (sandpackTemplate === 'vanilla') {
            // Fix vanilla routing if index is stuck inside public/
            if (!result['/index.html']) {
                if (result['/public/index.html']) {
                    result['/index.html'] = result['/public/index.html'];
                } else {
                    result['/index.html'] = `<h1>No index.html found at root. Waiting for AI to generate...</h1>`;
                }
            }
            // Prevent Sandpack from crashing trying to find an index.js
            if (!result['/index.js']) {
                 result['/index.js'] = `// Suppressing CodeSandbox default boilerplate`;
            }
        } else if (sandpackTemplate === 'react' || sandpackTemplate === 'vite-react') {
            // Fallback packages if the AI forgot package.json
            if (!result['/package.json']) {
                result['/package.json'] = JSON.stringify({
                    "name": "stackforge-generated-app",
                    "version": "1.0.0",
                    "main": "src/main.jsx",
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
            
            // Ensure a minimal entry point if missing
            if (!result['/src/App.jsx'] && !result['/src/main.jsx'] && !result['/App.jsx'] && !result['/App.js'] && !result['/index.js']) {
                 result['/App.jsx'] = `import React from 'react';\nexport default function App() { return <div style={{ padding: '20px', color: 'white' }}>Loading entry point...</div>; }`;
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

