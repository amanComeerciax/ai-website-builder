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

    // Convert VFS from { path: { content } } to Sandpack { path: content }
    const sandpackFiles = useMemo(() => {
        const result = {}
        Object.entries(files).forEach(([path, file]) => {
            // Sandpack expects paths to start with /
            const cleanPath = path.startsWith('/') ? path : `/${path}`
            result[cleanPath] = file.content
        })
        
        // Ensure a minimal entry point if missing
        if (!result['/App.jsx'] && !result['/App.js'] && !result['/index.js'] && !result['/index.jsx']) {
             result['/App.jsx'] = `import React from 'react';\n\nexport default function App() {\n  return <div style={{ padding: '20px', color: 'white' }}>No entry file (App.jsx) found in the project.</div>;\n}`;
        }
        
        return result
    }, [files])

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
                        template="react"
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

