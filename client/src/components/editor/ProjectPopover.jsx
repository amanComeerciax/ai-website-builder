import { useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Gift, Settings, Copy, Globe, 
    Edit2, Star, Folder, Info, Palette, 
    HelpCircle, ChevronRight 
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useProjectStore } from '../../stores/projectStore'
import { useAuth } from '@clerk/clerk-react'
import './ProjectPopover.css'

export default function ProjectPopover({ isOpen, onClose, project, onRename, onMove }) {
    const popoverRef = useRef(null)
    const navigate = useNavigate()
    const { userData } = useAuthStore()
    const { toggleStar } = useProjectStore()
    const { getToken } = useAuth()

    // ── Handlers ──
    const handleStarClick = async () => {
        if (!project) return;
        const token = await getToken();
        toggleStar(project.id || project._id, token);
        onClose();
    }

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const userName = userData?.email ? userData.email.split('@')[0] : 'User'
    const userInitial = userName.charAt(0).toUpperCase()

    return (
        <div className="project-popover" ref={popoverRef}>
            {/* Top Section */}
            <div className="ppv-section">
                <Link to="/dashboard" className="ppv-row ppv-back-link">
                    <ArrowLeft size={16} />
                    <span>Go to Dashboard</span>
                </Link>
            </div>

            {/* Workspace & Credits */}
            <div className="ppv-section">
                <div className="ppv-workspace-row">
                    <div className="ppv-workspace-avatar bg-pink-600">{userInitial}</div>
                    <span className="ppv-workspace-name">{userName}'s Workspace</span>
                    <span className="ppv-badge-free">FREE</span>
                </div>
                
                <div className="ppv-credits-card">
                    <div className="ppv-credits-header">
                        <span className="ppv-credits-title">Credits</span>
                        <span className="ppv-credits-amount">15.0 left &rsaquo;</span>
                    </div>
                    <div className="ppv-credits-bar">
                        <div className="ppv-credits-fill" style={{ width: '15%' }}></div>
                    </div>
                    <div className="ppv-credits-footer">
                        <span className="ppv-dot"></span>
                        Daily credits reset at midnight UTC
                    </div>
                </div>
            </div>

            {/* Free Credits Link */}
            <div className="ppv-section ppv-free-credits">
                <button className="ppv-row ppv-blue-text">
                    <Gift size={16} />
                    <span>Get free credits</span>
                </button>
            </div>

            {/* Menu Items */}
            <div className="ppv-menu-list">
                <button className="ppv-menu-item" onClick={() => navigate('/settings#project')}>
                    <Settings size={16} className="ppv-icon" />
                    <span className="ppv-label">Settings</span>
                    <span className="ppv-shortcut">⌘.</span>
                </button>
                <div className="ppv-divider"></div>
                
                <button className="ppv-menu-item">
                    <Copy size={16} className="ppv-icon" />
                    <span className="ppv-label">Remix this project</span>
                </button>
                <button className="ppv-menu-item">
                    <Globe size={16} className="ppv-icon" />
                    <span className="ppv-label">Publish to profile</span>
                    <span className="ppv-badge-new">New</span>
                </button>
                <div className="ppv-divider"></div>

                <button className="ppv-menu-item" onClick={onRename}>
                    <Edit2 size={16} className="ppv-icon" />
                    <span className="ppv-label">Rename project</span>
                </button>
                <button className="ppv-menu-item" onClick={handleStarClick}>
                    <Star 
                        size={16} 
                        className="ppv-icon" 
                        fill={project?.isStarred ? '#f59e0b' : 'transparent'} 
                        color={project?.isStarred ? '#f59e0b' : 'currentColor'} 
                    />
                    <span className="ppv-label">{project?.isStarred ? 'Unstar project' : 'Star project'}</span>
                </button>
                <button className="ppv-menu-item" onClick={onMove}>
                    <Folder size={16} className="ppv-icon" />
                    <span className="ppv-label">Move to folder</span>
                </button>
                <div className="ppv-divider"></div>

                <button className="ppv-menu-item">
                    <Info size={16} className="ppv-icon" />
                    <span className="ppv-label">Details</span>
                </button>
                <button className="ppv-menu-item">
                    <Palette size={16} className="ppv-icon" />
                    <span className="ppv-label">Appearance</span>
                    <ChevronRight size={14} className="ppv-chevron-right" />
                </button>
                <div className="ppv-divider"></div>

                <button className="ppv-menu-item">
                    <HelpCircle size={16} className="ppv-icon" />
                    <span className="ppv-label">Help</span>
                    <span className="ppv-shortcut">&nearr;</span>
                </button>
            </div>
        </div>
    )
}
