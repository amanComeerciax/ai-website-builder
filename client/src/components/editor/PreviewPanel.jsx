import { useState, useMemo } from 'react'
import { RefreshCw, Monitor, Tablet, Smartphone, Loader2, Download } from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useEditorStore } from '../../stores/editorStore'
import { useChatStore } from '../../stores/chatStore'
import './PreviewPanel.css'

/**
 * PreviewPanel — Simplified for Component Kit pipeline
 * 
 * Always uses iframe srcdoc for preview (zero build errors, instant rendering).
 * No more Sandpack, no more lucide-safe wrapper, no more React bridge.
 * 
 * Export downloads a complete Next.js project as ZIP.
 */
export default function PreviewPanel() {
    const { files, htmlContent } = useEditorStore()
    const { isGenerating, generationPhase } = useChatStore()
    const [viewMode, setViewMode] = useState('desktop')
    const [refreshKey, setRefreshKey] = useState(0)

    const viewWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    }

    // Get HTML content: prefer explicit htmlContent, fallback to index.html in files
    const previewHTML = useMemo(() => {
        if (htmlContent) return htmlContent;
        const indexFile = files['index.html'];
        if (indexFile) {
            return typeof indexFile === 'string' ? indexFile : indexFile.content;
        }
        return null;
    }, [htmlContent, files]);

    const hasPreview = !!previewHTML;

    // ── ZIP DOWNLOAD — Full Next.js project ──────────────────────
    const handleDownloadZip = async () => {
        const zip = new JSZip();
        let projectName = 'my-website';

        // Include all files (HTML preview + Next.js export files)
        Object.entries(files).forEach(([path, file]) => {
            // Strip 'next-export/' prefix for zip download so it's a clean project
            let cleanPath = path;
            if (cleanPath.startsWith('next-export/')) {
                cleanPath = cleanPath.replace('next-export/', '');
            }
            // Skip the preview HTML in the Next.js export
            if (cleanPath === 'index.html') {
                // Put it in a separate folder
                zip.file('preview/index.html', typeof file === 'string' ? file : file.content);
                return;
            }
            const content = typeof file === 'string' ? file : file.content;
            zip.file(cleanPath, content);

            // Extract project name from package.json
            if (cleanPath === 'package.json') {
                try { projectName = JSON.parse(content).name || projectName; } catch (e) {}
            }
        });

        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${projectName.replace(/\s+/g, '-').toLowerCase()}.zip`);
    };

    return (
        <div className="preview-panel">
            <div className="pp-toolbar">
                <div className="pp-url-bar">
                    <span className="pp-url-dot green" />
                    <span className="pp-url-dot yellow" />
                    <span className="pp-url-dot red" />
                    <div className="pp-url-text">
                        {hasPreview ? 'preview — live' : 'no preview'}
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
                        title="Download Next.js Project"
                        disabled={!hasPreview}
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            <div className="pp-iframe-container" key={refreshKey}>
                <div className="pp-iframe-wrapper" style={{ maxWidth: viewWidths[viewMode] }}>
                    {hasPreview ? (
                        /* ── Component Kit Preview: Always srcdoc ── */
                        <iframe
                            srcDoc={previewHTML}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Generated website preview"
                        />
                    ) : (
                        /* ── No preview yet ── */
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
                    )}
                </div>
            </div>
        </div>
    )
}
