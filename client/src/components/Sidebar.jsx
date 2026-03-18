import { NavLink, useNavigate } from 'react-router-dom'
import { useClerk, useAuth } from "@clerk/clerk-react"
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useProjectStore } from '../stores/projectStore'
import { 
    Wind, 
    PanelLeftClose, 
    ChevronDown, 
    Home, 
    Search, 
    Book, 
    Grid, 
    Star, 
    User, 
    Users, 
    Share, 
    Zap,
    FolderPlus,
    LayoutTemplate
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar() {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const { signOut } = useClerk()
    const { userData, fetchUserData } = useAuthStore()
    const { toggleSidebar, toggleWorkspaceDropdown, setCreateFolderOpen, isWorkspaceDropdownOpen } = useUIStore()
    const { projects } = useProjectStore()
    const navigate = useNavigate()
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(false)

    // Get up to 3 most recently edited projects
    const recentProjects = projects.slice(0, 3)

    useEffect(() => {
        if (isLoaded && isSignedIn && !userData) {
            fetchUserData(getToken)
        }
    }, [isLoaded, isSignedIn, fetchUserData, getToken, userData])

    const userEmail = userData?.email || 'User'
    const userInitial = userData?.email ? userData.email[0].toUpperCase() : 'U';
    const userName = userData?.email ? userData.email.split('@')[0] : 'User';

    return (
        <aside className="lv-sidebar">
            <div className="lv-sidebar-top">
                <div className="lv-brand">
                    <Wind size={28} className="lv-brand-icon" />
                </div>
                <button className="lv-icon-btn" onClick={toggleSidebar}>
                    <PanelLeftClose size={18} />
                </button>
            </div>

            <div className="lv-workspace-selector" onClick={toggleWorkspaceDropdown}>
                <div className="lv-workspace-left">
                    <div className="lv-workspace-avatar">{userInitial}</div>
                    <span className="lv-workspace-name">{userName}'s Lovable</span>
                </div>
                <ChevronDown 
                    size={14} 
                    className="lv-workspace-chevron" 
                    style={{ transform: isWorkspaceDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} 
                />
            </div>

            <nav className="lv-nav-group">
                <NavLink to="/dashboard" end className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                    <Home size={14} />
                    <span>Home</span>
                </NavLink>
                <button className="lv-nav-link">
                    <Search size={14} />
                    <span>Search</span>
                    <div className="lv-badge">⌘K</div>
                </button>
                <NavLink to="/resources" className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                    <Book size={14} />
                    <span>Resources</span>
                </NavLink>
            </nav>

            <div className="lv-nav-section">
                <h3 className="lv-section-label">Projects</h3>
                <nav className="lv-nav-group">
                    <NavLink 
                        to="/projects/all"
                        className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}
                    >
                        <Grid size={14} />
                        <span>All projects</span>
                    </NavLink>

                    {isProjectsExpanded && (
                        <div className="lv-sub-nav">
                            <button className="lv-nav-link lv-indented" onClick={() => setCreateFolderOpen(true)}>
                                <FolderPlus size={14} />
                                <span>New folder</span>
                            </button>
                        </div>
                    )}
                    
                    <NavLink to="/projects/starred" className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                        <Star size={14} />
                        <span>Starred</span>
                    </NavLink>
                    <NavLink to="/projects/mine" className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                        <User size={14} />
                        <span>Created by me</span>
                    </NavLink>
                    <NavLink to="/projects/shared" className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                        <Users size={14} />
                        <span>Shared with me</span>
                    </NavLink>
                </nav>
            </div>

            <div className="lv-nav-section lv-recents-section">
                <h3 className="lv-section-label">Recents</h3>
                {recentProjects.length > 0 ? (
                    recentProjects.map(proj => (
                        <NavLink key={proj.id} to={`/chat/${proj.id}`} className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                            <LayoutTemplate size={14} style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                        </NavLink>
                    ))
                ) : (
                    <div className="lv-empty-recents">No recent projects</div>
                )}
            </div>

            <div className="lv-sidebar-bottom">
                <div className="lv-share-card">
                    <div className="lv-share-info">
                        <h4>Share IndiForge</h4>
                        <p>100 credits per paid referral</p>
                    </div>
                    <button className="lv-share-btn">
                        <Share size={14} />
                    </button>
                </div>

                <button className="lv-upgrade-btn" onClick={() => navigate('/pricing')}>
                    <Zap size={14} />
                    <span>Upgrade to Pro</span>
                </button>

                <div className="lv-user-row" onClick={() => signOut(() => navigate("/"))}>
                    <div className="lv-user-avatar">{userInitial}</div>
                    <span className="lv-user-name" style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</span>
                </div>
            </div>
        </aside>
    )
}
