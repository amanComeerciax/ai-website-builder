import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Search, ChevronDown, LayoutGrid, List, Heart, FolderPlus, Folder } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useFolderStore } from '../stores/folderStore'
import { useUIStore } from '../stores/uiStore'
import { apiClient } from '../lib/api'
import { useAuth } from '@clerk/clerk-react'
import './ProjectsPage.css'

export default function ProjectsPage() {
    const { type, folderId } = useParams()
    const navigate = useNavigate()
    const { userData } = useAuthStore()
    const { projects } = useProjectStore()
    const { folders } = useFolderStore()
    const { setCreateFolderOpen } = useUIStore()
    const { getToken } = useAuth()

    // Folder-specific state
    const [folderData, setFolderData] = useState(null)
    const [folderProjects, setFolderProjects] = useState([])
    const [isLoadingFolder, setIsLoadingFolder] = useState(false)

    // If we are in a folder view, fetch that folder's projects from the API
    useEffect(() => {
        if (!folderId) {
            setFolderData(null)
            setFolderProjects([])
            return
        }

        const loadFolderProjects = async () => {
            setIsLoadingFolder(true)
            try {
                const token = await getToken()
                const data = await apiClient.getFolderProjects(folderId, token)
                setFolderData(data.folder)
                // Map to same shape as projectStore items
                setFolderProjects((data.projects || []).map(p => ({
                    id: p._id,
                    name: p.name,
                    time: new Date(p.createdAt).toLocaleDateString(),
                    folderId: p.folderId
                })))
            } catch (err) {
                console.error('[ProjectsPage] Failed to load folder projects:', err)
                // Fallback: filter locally from store
                const localFolder = folders.find(f => f.id === folderId)
                setFolderData(localFolder || { name: 'Folder' })
                setFolderProjects(projects.filter(p => p.folderId === folderId))
            } finally {
                setIsLoadingFolder(false)
            }
        }

        loadFolderProjects()
    }, [folderId, getToken])

    // Choose which project list to show
    const isFolderView = !!folderId
    const renderedProjects = isFolderView
        ? folderProjects
        : projects.filter(p => {
            if (type === 'starred') return p.isStarred
            if (type === 'shared') return p.isShared
            return true
        })

    const userInitial = userData?.email ? userData.email[0].toUpperCase() : 'U'

    // Page title
    const titleMap = {
        'all': 'Projects',
        'mine': 'Created by me',
        'starred': 'Starred projects',
        'shared': 'Shared with me'
    }
    const pageTitle = isFolderView
        ? (folderData?.name || 'Folder')
        : (titleMap[type] || 'Projects')

    // Where "Create new project" navigates to
    const newProjectHref = isFolderView
        ? `/dashboard?folderId=${folderId}`
        : `/dashboard`

    const renderEmptyState = () => {
        if (isFolderView) {
            return (
                <div className="pp-empty-state">
                    <Folder size={48} className="pp-empty-icon" />
                    <h2>This folder is empty</h2>
                    <p>Create a new project to add it to this folder.</p>
                    <Link to={newProjectHref} className="pp-browse-btn">Create first project</Link>
                </div>
            )
        }

        let title, btnText

        if (type === 'starred') {
            title = "Star projects to access them quickly from any workspace"
            btnText = "Browse projects"
        } else if (type === 'shared') {
            title = "Projects you are invited to will appear here"
            btnText = "Start building"
        } else {
            title = "You haven't created any projects yet"
            btnText = "Create your first project"
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
                            <span className="pp-3d-text">Ask StackForge to...</span>
                        </div>
                    </div>
                    <div className="pp-3d-card card-right"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="projects-page">
            {/* Top Bar */}
            <div className="pp-top-bar">
                <div className="pp-heading-area">
                    {isFolderView && (
                        <div className="pp-folder-breadcrumb">
                            <Link to="/projects/all" className="pp-breadcrumb-link">Projects</Link>
                            <span className="pp-breadcrumb-sep">›</span>
                        </div>
                    )}
                    <h1 className="pp-heading">{pageTitle}</h1>
                </div>
                
                <div className="pp-controls">
                    <div className="pp-search-box">
                        <Search size={16} className="pp-search-icon" />
                        <input type="text" placeholder="Search your projects..." className="pp-search-input" />
                    </div>
                    
                    {!isFolderView && (
                        <button className="pp-filter-btn" onClick={() => setCreateFolderOpen(true)}>
                            <FolderPlus size={14} style={{ marginRight: '6px' }} />
                            New Folder
                        </button>
                    )}

                    <button className="pp-filter-btn">
                        Last edited <ChevronDown size={14} />
                    </button>

                    <div className="pp-view-toggles">
                        <button className="pp-view-btn active"><LayoutGrid size={16} /></button>
                        <button className="pp-view-btn"><List size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="pp-content-area">
                {isLoadingFolder ? (
                    <div className="pp-loading">Loading...</div>
                ) : (renderedProjects.length > 0 || !isFolderView) ? (
                    <div className="pp-grid">
                        {/* Create New card */}
                        <Link to={newProjectHref} className="pp-new-card">
                            <div className="pp-new-card-box">
                                <div className="pp-new-plus-icon">+</div>
                            </div>
                            <div className="pp-new-card-text">
                                {isFolderView ? `New project in "${pageTitle}"` : 'Create new project'}
                            </div>
                        </Link>
                        
                        {renderedProjects.map(proj => (
                            <Link to={`/chat/${proj.id}`} key={proj.id} className="pp-card">
                                <div className="pp-card-thumbnail">
                                    <div className="pp-thumbnail-placeholder">
                                        <div className="pp-mock-browser">
                                            <span className="pp-dot"></span>
                                            <span className="pp-dot"></span>
                                            <span className="pp-dot"></span>
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
