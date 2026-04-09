import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '../lib/api'
import './ProjectHoverPreview.css'

export default function ProjectHoverPreview({ project, position }) {
    const [isVisible, setIsVisible] = useState(false)
    const [previewHtml, setPreviewHtml] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const { getToken } = useAuth()
    const iframeRef = useRef(null)
    const fetchedIdRef = useRef(null)

    // Fetch the project's actual HTML when the hovered project changes
    useEffect(() => {
        if (!project?.id) return
        if (fetchedIdRef.current === project.id) return // already fetched

        setIsLoading(true)
        setPreviewHtml(null)
        fetchedIdRef.current = project.id

        let cancelled = false
        const fetchPreview = async () => {
            try {
                const token = await getToken()
                const data = await apiClient.getProjectPreviewHtml(project.id, token)
                if (!cancelled && data?.html) {
                    setPreviewHtml(data.html)
                }
            } catch (err) {
                console.warn('[HoverPreview] Failed to fetch:', err.message)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }
        fetchPreview()
        return () => { cancelled = true }
    }, [project?.id, getToken])

    // Animate in after mount
    useEffect(() => {
        const raf = requestAnimationFrame(() => setIsVisible(true))
        return () => { cancelAnimationFrame(raf); setIsVisible(false) }
    }, [])

    if (!project) return null

    // Clamp vertical position so it doesn't go off-screen
    const safeY = Math.min(position.y, window.innerHeight - 260)

    return (
        <div 
            className={`php-container ${isVisible ? 'php-visible' : ''}`}
            style={{ top: safeY, left: position.x }}
        >
            <div className="php-card">
                <div className="php-preview-wrapper">
                    {isLoading ? (
                        /* Skeleton shimmer while loading */
                        <div className="php-skeleton">
                            <div className="php-skel-bar php-skel-lg" />
                            <div className="php-skel-bar php-skel-md" />
                            <div className="php-skel-bar php-skel-sm" />
                            <div className="php-skel-row">
                                <div className="php-skel-box" />
                                <div className="php-skel-box" />
                            </div>
                        </div>
                    ) : previewHtml ? (
                        /* Real site preview via scaled iframe */
                        <div className="php-iframe-viewport">
                            <iframe
                                ref={iframeRef}
                                title="preview"
                                srcDoc={previewHtml}
                                sandbox="allow-same-origin"
                                className="php-iframe"
                                scrolling="no"
                            />
                        </div>
                    ) : (
                        /* Fallback: styled mockup if no HTML exists */
                        <div className="php-skeleton php-skeleton-static">
                            <div className="php-no-preview">No preview yet</div>
                        </div>
                    )}
                </div>
                <div className="php-info">
                    <h4 className="php-name">{project.name}</h4>
                    <p className="php-meta">Last edited {project.time}</p>
                </div>
            </div>
        </div>
    )
}
