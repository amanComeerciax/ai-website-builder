import { NavLink, useNavigate } from 'react-router-dom'
import { useClerk, useAuth, useUser } from "@clerk/clerk-react"
import { useEffect, useState, useRef } from 'react'
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
    Folder,
    LayoutTemplate,
    MoreHorizontal,
    Edit2,
    Trash2,
    Settings,
    FolderInput
} from 'lucide-react'
import { useFolderStore } from '../stores/folderStore'
import RenameModal from './modals/RenameModal'
import DeleteModal from './modals/DeleteModal'
import MoveToFolderModal from './modals/MoveToFolderModal'
import './Sidebar.css'

export default function Sidebar() {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const { user: clerkUser } = useUser()
    const { signOut } = useClerk()
    const { userData, fetchUserData } = useAuthStore()
    const { toggleSidebar, toggleWorkspaceDropdown, setCreateFolderOpen, isWorkspaceDropdownOpen } = useUIStore()
    const { projects, toggleStar, renameProject, deleteProject, moveToFolder } = useProjectStore()
    const { folders, fetchFolders } = useFolderStore()
    const navigate = useNavigate()
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(false)
    const [isCreatedByMeExpanded, setIsCreatedByMeExpanded] = useState(false)

    // Three-dot menu
    const [menuOpenId, setMenuOpenId] = useState(null)
    const menuRef = useRef(null)

    // Modal states
    const [renameModal, setRenameModal] = useState({ open: false, id: null, name: '' })
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' })
    const [moveModal, setMoveModal] = useState({ open: false, id: null, name: '', folderId: null })

    // Get up to 3 most recently edited projects
    const recentProjects = projects.slice(0, 3)

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            if (!userData) fetchUserData(getToken);
            fetchFolders(getToken);
        }
    }, [isLoaded, isSignedIn, fetchUserData, fetchFolders, getToken, userData])

    // Close three-dot menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpenId(null)
            }
        }
        if (menuOpenId) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpenId])

    // Derive user info: prefer our DB data, fallback to Clerk's session data
    const userEmail = userData?.email || clerkUser?.primaryEmailAddress?.emailAddress || '';
    const userInitial = userEmail ? userEmail[0].toUpperCase() : (clerkUser?.firstName?.[0]?.toUpperCase() || 'U');
    const userName = userData?.email 
        ? userData.email.split('@')[0] 
        : (clerkUser?.firstName || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User');

    // ── Handlers ──
    const handleStar = (projId) => {
        toggleStar(projId)
        setMenuOpenId(null)
    }

    const handleOpenRename = (proj) => {
        setRenameModal({ open: true, id: proj.id, name: proj.name })
        setMenuOpenId(null)
    }

    const handleOpenDelete = (proj) => {
        setDeleteModal({ open: true, id: proj.id, name: proj.name })
        setMenuOpenId(null)
    }

    const handleOpenMove = (proj) => {
        setMoveModal({ open: true, id: proj.id, name: proj.name, folderId: proj.folderId || null })
        setMenuOpenId(null)
    }

    const handleRenameConfirm = (newName) => {
        renameProject(renameModal.id, newName)
    }

    const handleDeleteConfirm = () => {
        deleteProject(deleteModal.id)
    }

    const handleMoveConfirm = (folderId) => {
        moveToFolder(moveModal.id, folderId)
    }

    // ── Render a project row with three-dot menu ──
    const renderProjectRow = (proj) => {
        const isMenuOpen = menuOpenId === proj.id
        const isStarred = proj.isStarred

        return (
            <div key={proj.id} className="lv-project-row">
                <NavLink 
                    to={`/chat/${proj.id}`} 
                    className={({ isActive }) => `lv-nav-link lv-project-link ${isActive ? 'lv-nav-link-active' : ''}`}
                >
                    <LayoutTemplate size={14} style={{ flexShrink: 0 }} />
                    <span className="lv-project-name">{proj.name}</span>
                </NavLink>

                <button 
                    className={`lv-three-dot ${isMenuOpen ? 'lv-three-dot-active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMenuOpenId(isMenuOpen ? null : proj.id)
                    }}
                >
                    <MoreHorizontal size={14} />
                </button>

                {isMenuOpen && (
                    <div className="lv-dot-menu" ref={menuRef}>
                        <button className="lv-dot-menu-item" onClick={() => handleStar(proj.id)}>
                            <Star size={14} fill={isStarred ? '#fbbf24' : 'none'} color={isStarred ? '#fbbf24' : '#999'} />
                            <span>{isStarred ? 'Unstar' : 'Star'}</span>
                        </button>
                        <button className="lv-dot-menu-item" onClick={() => handleOpenMove(proj)}>
                            <FolderInput size={14} />
                            <span>Move to folder</span>
                        </button>
                        <button className="lv-dot-menu-item" onClick={() => handleOpenRename(proj)}>
                            <Edit2 size={14} />
                            <span>Rename</span>
                        </button>
                        <button className="lv-dot-menu-item" onClick={() => navigate(`/chat/${proj.id}`)}>
                            <Settings size={14} />
                            <span>Settings</span>
                        </button>
                        <div className="lv-dot-menu-divider" />
                        <button className="lv-dot-menu-item lv-dot-menu-danger" onClick={() => handleOpenDelete(proj)}>
                            <Trash2 size={14} />
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
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
                    {/* All projects with expand toggle */}
                    <div className="lv-nav-item-with-toggle">
                        <NavLink 
                            to="/projects/all"
                            className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}
                        >
                            <Grid size={14} />
                            <span>All projects</span>
                        </NavLink>
                        <button 
                            className="lv-item-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsProjectsExpanded(!isProjectsExpanded);
                            }}
                        >
                            <ChevronDown 
                                size={14} 
                                style={{ 
                                    transform: isProjectsExpanded ? 'rotate(180deg)' : 'none', 
                                    transition: 'transform 0.2s',
                                    color: isProjectsExpanded ? '#fff' : '#666'
                                }} 
                            />
                        </button>
                    </div>

                    {isProjectsExpanded && (
                        <div className="lv-sub-nav">
                            <button className="lv-nav-link lv-indented" onClick={() => setCreateFolderOpen(true)}>
                                <FolderPlus size={14} />
                                <span>New folder</span>
                            </button>
                            
                            {folders.map(folder => (
                                <NavLink 
                                    key={folder.id} 
                                    to={`/projects/folder/${folder.id}`}
                                    className={({ isActive }) => `lv-nav-link lv-indented ${isActive ? 'lv-nav-link-active' : ''}`}
                                >
                                    <Folder size={14} />
                                    <span>{folder.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}
                    
                    <NavLink to="/projects/starred" className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                        <Star size={14} />
                        <span>Starred</span>
                    </NavLink>

                    {/* Created by me — with expand toggle */}
                    <div className="lv-nav-item-with-toggle">
                        <NavLink 
                            to="/projects/mine"
                            className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}
                        >
                            <User size={14} />
                            <span>Created by me</span>
                        </NavLink>
                        <button 
                            className="lv-item-toggle"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsCreatedByMeExpanded(!isCreatedByMeExpanded);
                            }}
                        >
                            <ChevronDown 
                                size={14} 
                                style={{ 
                                    transform: isCreatedByMeExpanded ? 'rotate(180deg)' : 'none', 
                                    transition: 'transform 0.2s',
                                    color: isCreatedByMeExpanded ? '#fff' : '#666'
                                }} 
                            />
                        </button>
                    </div>

                    {isCreatedByMeExpanded && (
                        <div className="lv-sub-nav lv-created-projects">
                            {projects.length > 0 ? (
                                projects.map(proj => renderProjectRow(proj))
                            ) : (
                                <div className="lv-empty-recents lv-indented">No projects yet</div>
                            )}
                        </div>
                    )}

                    <NavLink to="/projects/shared" className={({ isActive }) => `lv-nav-link ${isActive ? 'lv-nav-link-active' : ''}`}>
                        <Users size={14} />
                        <span>Shared with me</span>
                    </NavLink>
                </nav>
            </div>

            <div className="lv-nav-section lv-recents-section">
                <h3 className="lv-section-label">Recents</h3>
                {recentProjects.length > 0 ? (
                    recentProjects.map(proj => renderProjectRow(proj))
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

        {/* ── Modals ── */}
        <RenameModal
            isOpen={renameModal.open}
            onClose={() => setRenameModal({ open: false, id: null, name: '' })}
            projectName={renameModal.name}
            onConfirm={handleRenameConfirm}
        />
        <DeleteModal
            isOpen={deleteModal.open}
            onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
            projectName={deleteModal.name}
            onConfirm={handleDeleteConfirm}
        />
        <MoveToFolderModal
            isOpen={moveModal.open}
            onClose={() => setMoveModal({ open: false, id: null, name: '', folderId: null })}
            projectName={moveModal.name}
            currentFolderId={moveModal.folderId}
            onConfirm={handleMoveConfirm}
        />
        </>
    )
}
