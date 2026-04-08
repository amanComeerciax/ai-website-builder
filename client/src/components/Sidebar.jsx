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
    LogOut,
    LayoutTemplate,
    MoreHorizontal,
    Edit2,
    Trash2,
    Settings,
    FolderInput,
    ChevronRight,
    HelpCircle,
    FileText,
    Check,
    Moon
} from 'lucide-react'
import { useFolderStore } from '../stores/folderStore'
import RenameModal from './modals/RenameModal'
import DeleteModal from './modals/DeleteModal'
import MoveToFolderModal from './modals/MoveToFolderModal'
import WorkspaceDropdown from './WorkspaceDropdown'
import './Sidebar.css'

export default function Sidebar() {
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const { user: clerkUser } = useUser()
    const { signOut } = useClerk()
    const { userData, fetchUserData, syncUser } = useAuthStore()
    const { toggleSidebar, toggleWorkspaceDropdown, setCreateFolderOpen, isWorkspaceDropdownOpen } = useUIStore()
    const { projects, fetchProjects, toggleStar, renameProject, deleteProject, moveToFolder } = useProjectStore()
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

    // User profile dropdown
    const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
    const [appearanceTheme, setAppearanceTheme] = useState('system') // 'light', 'dark', 'system'
    const userProfileRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userProfileRef.current && !userProfileRef.current.contains(e.target)) {
                setIsUserProfileOpen(false)
            }
        }
        if (isUserProfileOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isUserProfileOpen])

    // Get up to 3 most recently edited projects
    const recentProjects = projects.slice(0, 3)

    useEffect(() => {
        if (isLoaded && isSignedIn && clerkUser) {
            const sync = async () => {
                const token = await getToken();
                
                // Sync user metadata to backend
                await syncUser(getToken, {
                    email: clerkUser.primaryEmailAddress?.emailAddress,
                    name: clerkUser.fullName || clerkUser.username || "",
                    avatar: clerkUser.imageUrl || ""
                });

                fetchProjects(token)
                if (fetchFolders) fetchFolders(token)
            }
            sync()
        }
    }, [isLoaded, isSignedIn, clerkUser, syncUser, fetchProjects, fetchFolders, getToken])

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

    const userEmail = userData?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'User'
    const userName = userData?.name || clerkUser?.fullName || clerkUser?.username || userEmail.split('@')[0] || 'User';
    const userInitial = userName[0].toUpperCase();
    const userAvatar = userData?.avatar || clerkUser?.imageUrl;

    // ── Handlers ──
    const handleStar = async (projId) => {
        const token = await getToken();
        toggleStar(projId, token)
        setMenuOpenId(null)
    }

    const handleOpenRename = (proj) => {
        setRenameModal({ open: true, id: proj.id || proj._id, name: proj.name })
        setMenuOpenId(null)
    }

    const handleOpenDelete = (proj) => {
        setDeleteModal({ open: true, id: proj.id || proj._id, name: proj.name })
        setMenuOpenId(null)
    }

    const handleOpenMove = (proj) => {
        setMoveModal({ open: true, id: proj.id || proj._id, name: proj.name, folderId: proj.folderId || null })
        setMenuOpenId(null)
    }

    const handleRenameConfirm = async (newName) => {
        const token = await getToken();
        renameProject(renameModal.id, newName, token)
    }

    const handleDeleteConfirm = async () => {
        const token = await getToken();
        deleteProject(deleteModal.id, token)
    }

    const handleMoveConfirm = async (folderId) => {
        const token = await getToken();
        moveToFolder(moveModal.id, folderId, token)
    }

    // ── Render a project row with three-dot menu ──
    const renderProjectRow = (proj) => {
        const projId = proj.id || proj._id
        const isMenuOpen = menuOpenId === projId
        const isStarred = proj.isStarred

        return (
            <div key={projId} className="lv-project-row">
                <NavLink 
                    to={`/chat/${projId}`} 
                    className={({ isActive }) => `lv-nav-link lv-project-link ${isActive ? 'lv-nav-link-active' : ''}`}
                >
                    <LayoutTemplate size={14} style={{ flexShrink: 0 }} />
                    <span className="lv-project-name" title={proj.name}>{proj.name}</span>
                </NavLink>

                <button 
                    className={`lv-three-dot ${isMenuOpen ? 'lv-three-dot-active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMenuOpenId(isMenuOpen ? null : projId)
                    }}
                >
                    <MoreHorizontal size={14} />
                </button>

                {isMenuOpen && (
                    <div className="lv-dot-menu" ref={menuRef}>
                        <button className="lv-dot-menu-item" onClick={() => handleStar(projId)}>
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
                        <button className="lv-dot-menu-item" onClick={() => navigate(`/chat/${projId}`)}>
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

            <div className="lv-sidebar-scroll-area">
                <div className="lv-workspace-selector" onClick={toggleWorkspaceDropdown}>
                <div className="lv-workspace-left">
                    {userAvatar ? (
                        <img src={userAvatar} alt="" className="lv-workspace-avatar" style={{ objectFit: 'cover' }} />
                    ) : (
                        <div className="lv-workspace-avatar">{userInitial}</div>
                    )}
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
                                    key={folder.id || folder._id} 
                                    to={`/projects/folder/${folder.id || folder._id}`}
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

                <div className="lv-user-row-container" ref={userProfileRef}>
                    <button className="lv-user-row" onClick={() => setIsUserProfileOpen(!isUserProfileOpen)}>
                        {userAvatar ? (
                            <img src={userAvatar} alt="" className="lv-user-avatar" style={{ objectFit: 'cover' }} />
                        ) : (
                            <div className="lv-user-avatar">{userInitial}</div>
                        )}
                        <div className="lv-user-info">
                            <span className="lv-user-name" title={userName}>{userName}</span>
                        </div>
                    </button>
                    {isUserProfileOpen && (
                        <div className="lv-user-dropdown">
                            <div className="lv-user-dropdown-header">
                                {userAvatar ? (
                                    <img src={userAvatar} alt="" className="lv-user-avatar-large" style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div className="lv-user-avatar-large">{userInitial}</div>
                                )}
                                <div className="lv-user-dropdown-info">
                                    <span className="lv-user-dropdown-name" title={userName}>{userName}</span>
                                    <span className="lv-user-dropdown-email" title={userEmail}>{userEmail}</span>
                                </div>
                            </div>
                            <div className="lv-dot-menu-divider" />
                            <button className="lv-dot-menu-item" onClick={() => navigate('/settings#profile')}>
                                <User size={14} /><span>Profile</span>
                            </button>
                            <button className="lv-dot-menu-item" onClick={() => navigate('/settings#account')}>
                                <Settings size={14} /><span>Settings</span>
                            </button>
                            
                            <div className="lv-dot-menu-item lv-appearance-item">
                                <div className="lv-appearance-item-left">
                                    <Moon size={14} /><span>Appearance</span>
                                </div>
                                <ChevronRight size={14} />
                                <div className="lv-submenu">
                                    <div className="lv-appearance-previews">
                                        <div className={`lv-preview-box lv-preview-light ${appearanceTheme === 'light' ? 'active' : ''}`} onClick={() => setAppearanceTheme('light')} />
                                        <div className={`lv-preview-box lv-preview-dark ${appearanceTheme === 'dark' ? 'active' : ''}`} onClick={() => setAppearanceTheme('dark')} />
                                        <div className={`lv-preview-box lv-preview-system ${appearanceTheme === 'system' ? 'active' : ''}`} onClick={() => setAppearanceTheme('system')} />
                                    </div>
                                    <button className="lv-dot-menu-item" style={{justifyContent: 'space-between'}} onClick={() => setAppearanceTheme('light')}>
                                        <span>Light</span>{appearanceTheme === 'light' && <Check size={14} />}
                                    </button>
                                    <button className="lv-dot-menu-item" style={{justifyContent: 'space-between'}} onClick={() => setAppearanceTheme('dark')}>
                                        <span>Dark</span>{appearanceTheme === 'dark' && <Check size={14} />}
                                    </button>
                                    <button className="lv-dot-menu-item" style={{justifyContent: 'space-between'}} onClick={() => setAppearanceTheme('system')}>
                                        <span>System</span>{appearanceTheme === 'system' && <Check size={14} />}
                                    </button>
                                </div>
                            </div>

                            <div className="lv-dot-menu-item lv-appearance-item">
                                <div className="lv-appearance-item-left">
                                    <HelpCircle size={14} /><span>Support</span>
                                </div>
                                <ChevronRight size={14} />
                                <div className="lv-submenu">
                                    <button className="lv-dot-menu-item">
                                        <span>Help Center</span>
                                    </button>
                                    <button className="lv-dot-menu-item">
                                        <span>Email Support</span>
                                    </button>
                                    <button className="lv-dot-menu-item">
                                        <span>Join Discord</span>
                                    </button>
                                </div>
                            </div>
                            <button className="lv-dot-menu-item">
                                <FileText size={14} /><span>Documentation</span>
                            </button>
                            <button className="lv-dot-menu-item">
                                <Users size={14} /><span>Community</span>
                            </button>
                            <button className="lv-dot-menu-item" onClick={() => navigate("/")}>
                                <Home size={14} /><span>Homepage</span>
                            </button>
                            
                            <div className="lv-dot-menu-divider" />
                            
                            <button className="lv-dot-menu-item" onClick={() => signOut(() => navigate("/"))}>
                                <LogOut size={14} /><span>Sign out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </aside>

        <WorkspaceDropdown />

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
