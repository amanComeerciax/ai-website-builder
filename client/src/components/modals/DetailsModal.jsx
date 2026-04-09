import { useRef, useEffect } from 'react'
import { X, Folder, User, Clock, Calendar } from 'lucide-react'
import './DetailsModal.css'

export default function DetailsModal({ isOpen, onClose, project, ownerName, folderName }) {
    const overlayRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    if (!isOpen || !project) return null

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
               ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    return (
        <div className="dtl-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose() }}>
            <div className="dtl-modal">
                <div className="dtl-header">
                    <h2 className="dtl-title">Project details</h2>
                    <button className="dtl-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="dtl-card">
                    <div className="dtl-row">
                        <span className="dtl-label">Location</span>
                        <span className="dtl-value">
                            <Folder size={14} className="dtl-value-icon" />
                            {folderName || project.name}
                        </span>
                    </div>
                    <div className="dtl-divider" />
                    <div className="dtl-row">
                        <span className="dtl-label">Owner</span>
                        <span className="dtl-value">{ownerName || 'You'}</span>
                    </div>
                    <div className="dtl-divider" />
                    <div className="dtl-row">
                        <span className="dtl-label">Tech Stack</span>
                        <span className="dtl-value dtl-value-badge">{project.techStack || 'React'}</span>
                    </div>
                    <div className="dtl-divider" />
                    <div className="dtl-row">
                        <span className="dtl-label">Status</span>
                        <span className="dtl-value">
                            <span className={`dtl-status-dot ${project.status === 'done' ? 'dtl-status-done' : project.status === 'generating' ? 'dtl-status-gen' : ''}`} />
                            {project.status === 'done' ? 'Complete' : project.status === 'generating' ? 'Generating' : project.status === 'failed' ? 'Failed' : 'Idle'}
                        </span>
                    </div>
                    <div className="dtl-divider" />
                    <div className="dtl-row">
                        <span className="dtl-label">Modified</span>
                        <span className="dtl-value">{formatDate(project.updatedAt)}</span>
                    </div>
                    <div className="dtl-divider" />
                    <div className="dtl-row">
                        <span className="dtl-label">Created</span>
                        <span className="dtl-value">{formatDate(project.createdAt)}</span>
                    </div>
                </div>

                <div className="dtl-footer">
                    <button className="dtl-close-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    )
}
