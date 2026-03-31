import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, ChevronDown, LayoutGrid, List, Heart, Users, LayoutTemplate, MoreVertical, Trash2, Clock, Star } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { toast } from 'react-hot-toast'
import './ProjectsPage.css'

// Helper to generate a unique, deterministic beautiful gradient based on Project ID
const getProjectGradient = (id) => {
    if (!id) return "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
    const colors = [
        ["#3b82f6", "#1e3a8a"], // Blue
        ["#8b5cf6", "#4c1d95"], // Violet
        ["#10b981", "#064e3b"], // Emerald
        ["#f59e0b", "#78350f"], // Amber
        ["#ec4899", "#831843"], // Pink
        ["#ef4444", "#7f1d1d"], // Red
        ["#6366f1", "#312e81"], // Indigo
        ["#14b8a6", "#134e4a"], // Teal
        ["#f43f5e", "#881337"], // Rose
        ["#84cc16", "#3f6212"], // Lime
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    const [c1, c2] = colors[index];
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
}

export default function ProjectsPage() {
    const { type, folderId } = useParams() // 'mine', 'starred', 'shared', 'all', or undefined if /projects/folder/:folderId
    const { isLoaded, isSignedIn, getToken } = useAuth()
    const { userData } = useAuthStore()
    const { projects, fetchProjects, deleteProject, toggleStar } = useProjectStore()
    const [activeDropdown, setActiveDropdown] = useState(null)
    
    // Attempt to pull in folderStore to get the name of the folder for the title
    let folders = [];
    try {
        const folderStore = require('../stores/folderStore').useFolderStore.getState();
        if (folderStore && folderStore.folders) {
            folders = folderStore.folders;
        }
    } catch(e) {}

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            const sync = async () => {
                const token = await getToken();
                fetchProjects(token);
            }
            sync()
        }
    }, [isLoaded, isSignedIn, getToken, fetchProjects])

    const handleDelete = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            const token = await getToken();
            const success = await deleteProject(projectId, token);
            if (success) {
                toast.success('Project deleted successfully');
            } else {
                toast.error('Failed to delete project');
            }
        }
        setActiveDropdown(null);
    }

    const handleToggleStar = async (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const token = await getToken();
            await toggleStar(projectId, token);
        } catch (error) {
            toast.error('Failed to update star status');
        }
    }

    const toggleDropdown = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDropdown(activeDropdown === id ? null : id);
    }

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Filter projects based on type or folderId
    const renderedProjects = projects.filter(p => {
        if (folderId) return p.folderId === folderId;
        
        // If type is 'all' or 'mine', act like a "Root" directory and hide projects in folders
        if (type === 'all' || type === 'mine') {
             return !p.folderId;
        }

        if (type === 'starred') return p.isStarred;
        if (type === 'shared') return p.isShared;
        return true;
    })

    let displayTitle = 'Projects';
    let emptyTitle = "Let's build something amazing";
    if (folderId) {
        const folder = folders.find(f => f.id === folderId || f._id === folderId);
        displayTitle = folder ? folder.name : 'Folder';
        emptyTitle = 'This folder is empty';
    } else {
        const titleMap = {
            'all': 'Projects',
            'mine': 'Mine',
            'starred': 'Starred',
            'shared': 'Shared'
        };
        displayTitle = titleMap[type] || 'Projects';
        if (type === 'starred') emptyTitle = 'No starred projects';
    }

    const userInitial = userData?.email ? userData.email[0].toUpperCase() : 'U'

    const renderEmptyState = () => (
        <div className="pp-empty-state">
            <div className="pp-empty-icon-wrapper">
                <LayoutTemplate size={48} className="pp-empty-icon" />
            </div>
            <h2>{emptyTitle}</h2>
            <p className="pp-empty-subtext">
                {type === 'starred' 
                    ? "Projects you star will appear here for quick access." 
                    : folderId 
                        ? "Create your first project in this folder."
                        : "Create your first project and start building your web application with AI."}
            </p>
            <Link to={folderId ? `/dashboard?folder=${folderId}` : "/dashboard"} className="pp-create-btn-large">
                Create new project
            </Link>
        </div>
    )

    return (
        <div className="projects-page">
            <header className="pp-header">
                <div className="pp-header-left">
                    <h1 className="pp-title">{displayTitle}</h1>
                    <button className="pp-header-more"><MoreVertical size={16} /></button>
                </div>
                
                <div className="pp-actions">
                    <div className="pp-search">
                        <Search size={14} className="pp-search-icon" />
                        <input type="text" placeholder="Search projects..." />
                    </div>
                    
                    <div className="pp-filters">
                        <button className="pp-filter-select">
                            Last edited <ChevronDown size={12} />
                        </button>
                        <button className="pp-filter-select">
                            Any visibility <ChevronDown size={12} />
                        </button>
                        <button className="pp-filter-select">
                            Any status <ChevronDown size={12} />
                        </button>
                    </div>

                    <div className="pp-view-switch">
                        <button className="pp-view-btn active"><LayoutGrid size={14} /></button>
                        <button className="pp-view-btn"><List size={14} /></button>
                    </div>
                </div>
            </header>

            <main className="pp-main">
                {(renderedProjects.length > 0 || type === 'all' || type === 'mine' || folderId) ? (
                    <div className="pp-grid">
                        {(type === 'all' || type === 'mine' || folderId) && (
                            <Link to={folderId ? `/dashboard?folder=${folderId}` : "/dashboard"} className="pp-card pp-create-card">
                                <div className="pp-card-preview creation-box">
                                    <div className="pp-plus-icon">+</div>
                                </div>
                                <div className="pp-card-content">
                                    <h3 className="pp-card-name">Create new project</h3>
                                </div>
                            </Link>
                        )}
                        
                        {renderedProjects.map(proj => (
                            <Link to={`/chat/${proj.id}`} key={proj.id} className="pp-card">
                                <div className="pp-card-preview" style={{ background: getProjectGradient(proj.id) }}>
                                    <div className="pp-browser-chrome" style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="pp-chrome-dots">
                                            <span style={{background: 'rgba(255,255,255,0.3)'}}></span>
                                            <span style={{background: 'rgba(255,255,255,0.3)'}}></span>
                                            <span style={{background: 'rgba(255,255,255,0.3)'}}></span>
                                        </div>
                                    </div>
                                    <div className="pp-preview-placeholder" style={{ color: 'white', fontSize: '3rem', fontWeight: 600, opacity: 0.9 }}>
                                         {proj.name ? proj.name.charAt(0).toUpperCase() : 'P'}
                                    </div>
                                    <button 
                                        className="pp-card-star" 
                                        onClick={(e) => handleToggleStar(e, proj.id)}
                                    >
                                        <Star size={14} fill={proj.isStarred ? "#fbbf24" : "none"} stroke={proj.isStarred ? "#fbbf24" : "currentColor"} />
                                    </button>
                                </div>
                                <div className="pp-card-footer">
                                    <div className="pp-footer-left">
                                        <div className="pp-mini-avatar">{userInitial}</div>
                                        <div className="pp-project-meta">
                                            <h3 className="pp-project-name">{proj.name}</h3>
                                            <span className="pp-project-date">Edited {proj.time}</span>
                                        </div>
                                    </div>
                                    <div className="pp-card-actions">
                                        <button 
                                            className="pp-more-trigger"
                                            onClick={(e) => toggleDropdown(e, proj.id)}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        
                                        {activeDropdown === proj.id && (
                                            <div className="pp-dropdown">
                                                <button className="pp-dropdown-item delete" onClick={(e) => handleDelete(e, proj.id)}>
                                                    <Trash2 size={14} />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    renderEmptyState()
                )}
            </main>
        </div>
    )
}
