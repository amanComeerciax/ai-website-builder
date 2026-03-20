import { useParams, Link } from 'react-router-dom'
import { Search, ChevronDown, LayoutGrid, List, Heart, Users, LayoutTemplate, FolderPlus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useUIStore } from '../stores/uiStore'
import './ProjectsPage.css'

export default function ProjectsPage() {
    const { type } = useParams() // 'mine', 'starred', 'shared', 'all'
    const { userData } = useAuthStore()
    const { projects } = useProjectStore()
    const { setCreateFolderOpen } = useUIStore()

    // Filter projects based on type
    const renderedProjects = projects.filter(p => {
        if (type === 'starred') return p.isStarred
        if (type === 'shared') return p.isShared
        // 'mine' and 'all' show all created by current user - assume all in store are mine right now
        return true
    })

    const userInitial = userData?.email ? userData.email[0].toUpperCase() : 'U'

    const renderEmptyState = () => {
        let title, btnText;

        if (type === 'starred') {
            title = "Star projects to access them quickly from any workspace";
            btnText = "Browse projects";
        } else if (type === 'shared') {
            title = "Projects you are invited to will appear here";
            btnText = "Start building";
        } else {
            title = "You haven't created any projects yet";
            btnText = "Create your first project";
        }

        return (
            <div className="pp-empty-state">
                <Heart size={48} className="pp-empty-icon" fill="currentColor" />
                <h2>{title}</h2>
                <button className="pp-browse-btn">{btnText}</button>
                
                <div className="pp-3d-cards-illustration">
                    <div className="pp-3d-card card-left"></div>
                    <div className="pp-3d-card card-center">
                        <div className="pp-3d-card-inner">
                            <span className="pp-3d-text">Ask Lovable to...</span>
                        </div>
                    </div>
                    <div className="pp-3d-card card-right"></div>
                </div>
            </div>
        )
    }

    const titleMap = {
        'all': 'Projects',
        'mine': 'Created by me',
        'starred': 'Starred projects',
        'shared': 'Shared with me'
    }

    return (
        <div className="projects-page">
            {/* Top Bar */}
            <div className="pp-top-bar">
                <h1 className="pp-heading">{titleMap[type] || 'Projects'}</h1>
                
                <div className="pp-controls">
                    <div className="pp-search-box">
                        <Search size={16} className="pp-search-icon" />
                        <input type="text" placeholder="Search your projects..." className="pp-search-input" />
                    </div>
                    
                    <button className="pp-filter-btn" onClick={() => setCreateFolderOpen(true)}>
                        <FolderPlus size={14} style={{ marginRight: '6px' }} />
                        New Folder
                    </button>

                    <button className="pp-filter-btn">
                        Last edited <ChevronDown size={14} />
                    </button>
                    <button className="pp-filter-btn">
                        Any visibility <ChevronDown size={14} />
                    </button>
                    <button className="pp-filter-btn">
                        Any status <ChevronDown size={14} />
                    </button>

                    <div className="pp-view-toggles">
                        <button className="pp-view-btn active"><LayoutGrid size={16} /></button>
                        <button className="pp-view-btn"><List size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="pp-content-area">
                {(renderedProjects.length > 0 || type === 'all' || type === 'mine') ? (
                    <div className="pp-grid">
                        {/* Dashboard / Create New box (always first if in a grid that supports creation) */}
                        {(type === 'all' || type === 'mine') && (
                            <Link to="/dashboard" className="pp-new-card">
                                <div className="pp-new-card-box">
                                    <div className="pp-new-plus-icon">+</div>
                                </div>
                                <div className="pp-new-card-text">Create new project</div>
                            </Link>
                        )}
                        
                        {renderedProjects.map(proj => (
                            <Link to={`/chat/${proj.id}`} key={proj.id} className="pp-card">
                                <div className="pp-card-thumbnail">
                                    <div className="pp-thumbnail-placeholder">
                                        <div className="pp-mock-browser">
                                            <span className="pp-dot"></span><span className="pp-dot"></span><span className="pp-dot"></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pp-card-bottom">
                                    <div className="pp-avatar bg-pink-600">{userInitial}</div>
                                    <div className="pp-card-info">
                                        <h3>{proj.name}</h3>
                                        <p>{proj.time}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    renderEmptyState()
                )}
            </div>
        </div>
    )
}
