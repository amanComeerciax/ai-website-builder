import { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, ExternalLink } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import './PreviewPanel.css'

// Assemble all VFS files into a single HTML document for srcdoc
const assemblePreview = (files) => {
    // Dynamically find index.html which might be at root or in public/
    const htmlFilePath = Object.keys(files).find(path => path.endsWith('index.html'))
    const htmlFile = htmlFilePath ? files[htmlFilePath] : null
    
    // Dynamically find main CSS and JS files
    const cssFilePath = Object.keys(files).find(path => path.endsWith('.css'))
    const cssFile = cssFilePath ? files[cssFilePath] : null
    
    const jsFilePath = Object.keys(files).find(path => path.endsWith('.js') || path.endsWith('.jsx'))
    const jsFile = jsFilePath ? files[jsFilePath] : null

    if (!htmlFile) {
        // No index.html — try to build a basic preview from whatever we have
        let css = ''
        let js = ''
        Object.entries(files).forEach(([path, file]) => {
            if (path.endsWith('.css')) css += file.content + '\n'
            if (path.endsWith('.js') || path.endsWith('.jsx')) js += file.content + '\n'
        })
        return `<!DOCTYPE html>
<html>
<head><style>${css}</style></head>
<body>
<div id="root"><p style="color:#888;font-family:sans-serif;padding:2rem;">No index.html found. Add one to see a preview.</p></div>
<script type="module">${js}<\/script>
</body>
</html>`
    }

    let html = htmlFile.content

    // Inject CSS if referenced but provided separately
    if (cssFile && !html.includes(cssFile.content)) {
        html = html.replace(
            /<link[^>]*href=["']style\.css["'][^>]*\/?>/i,
            `<style>${cssFile.content}</style>`
        )
    }

    // Inject JS if referenced but provided separately
    if (jsFile && !html.includes(jsFile.content)) {
        html = html.replace(
            /<script[^>]*src=["']script\.js["'][^>]*><\/script>/i,
            `<script>${jsFile.content}<\/script>`
        )
    }

    return html
}

export default function PreviewPanel() {
    const { files } = useEditorStore()
    const iframeRef = useRef(null)
    const [viewMode, setViewMode] = useState('desktop')
    const [refreshKey, setRefreshKey] = useState(0)

    // Debounced preview update
    const updatePreview = useCallback(() => {
        if (!iframeRef.current) return
        const html = assemblePreview(files)
        iframeRef.current.srcdoc = html
    }, [files])

    useEffect(() => {
        const timeout = setTimeout(updatePreview, 500)
        return () => clearTimeout(timeout)
    }, [files, refreshKey, updatePreview])

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

            <div className="pp-iframe-container">
                <div className="pp-iframe-wrapper" style={{ maxWidth: viewWidths[viewMode] }}>
                    <iframe
                        ref={iframeRef}
                        className="pp-iframe"
                        title="Live Preview"
                        sandbox="allow-scripts allow-modals"
                        key={refreshKey}
                    />
                </div>
            </div>
        </div>
    )
}
