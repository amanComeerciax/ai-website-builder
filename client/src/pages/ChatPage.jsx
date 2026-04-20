import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
    ChevronDown, Clock, PanelLeftClose, Rocket, Share2, 
    ArrowLeft, ChevronUp, History, Diff, Monitor, Code, List, Loader2 
} from 'lucide-react'
import ChatPanel from '../components/editor/ChatPanel'
import FileTree from '../components/editor/FileTree'
import CodeEditor from '../components/editor/CodeEditor'
import PreviewPanel from '../components/editor/PreviewPanel'
import DetailsPanel from '../components/editor/DetailsPanel'
import HistoryPanel from '../components/editor/HistoryPanel'
import HistorySidebar from '../components/editor/HistorySidebar'
import ProjectPopover from '../components/editor/ProjectPopover'
import VisualEditPanel from '../components/editor/VisualEditPanel'
import RenameModal from '../components/modals/RenameModal'
import MoveToFolderModal from '../components/modals/MoveToFolderModal'
import DetailsModal from '../components/modals/DetailsModal'
import PublishModal from '../components/modals/PublishModal'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useChatStore } from '../stores/chatStore'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import { useFolderStore } from '../stores/folderStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useAuthStore } from '../stores/authStore'
import { useRecentlyViewedStore } from '../stores/recentlyViewedStore'
import { useUser } from '@clerk/clerk-react'
import './ChatPage.css'

export default function ChatPage() {
    const { projectId } = useParams()
    const { isLoaded: isAuthLoaded, getToken } = useAuth()
    const { user: clerkUser } = useUser()
    const location = useLocation()
    const navigate = useNavigate()
    const { getProjectById } = useProjectStore()
    const { folders, fetchFolders } = useFolderStore()
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isChatVisible, setIsChatVisible] = useState(true)
    const [chatWidth, setChatWidth] = useState(() => Math.round(window.innerWidth * 0.2))
    const [isDragging, setIsDragging] = useState(false)
    const [renameModal, setRenameModal] = useState({ open: false, id: null, name: '' })
    const [moveModal, setMoveModal] = useState({ open: false, id: null, name: '', folderId: null })
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    
    const { 
        isGenerating, generationStatus, isDetailsExpanded, setDetailsExpanded,
        isIdeVisible, setIdeVisible, activeView, setActiveView, messages, addMessage, startGeneration,
        generationPhase, isVisualEditMode
    } = useChatStore()
    const { files } = useEditorStore()
    
    // Determine if the user has ANY generated content (not just the demo file)
    const hasGeneratedContent = Object.keys(files).some(f => f !== 'App.jsx') || 
        generationPhase === 'complete' || generationPhase === 'streaming_logs' || generationPhase === 'thinking'
        
    // Deployment state
    const [isDeploying, setIsDeploying] = useState(false)
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
    const [publishedUrl, setPublishedUrl] = useState(null)

    const project = getProjectById(projectId)
    const folder = folders.find(f => f.id === project?.folderId)

    // Sync publishedUrl from store on load or change
    useEffect(() => {
        if (project?.publishedUrl) {
            setPublishedUrl(project.publishedUrl);
        }
    }, [project]);

    useEffect(() => {
        if (isAuthLoaded) {
            getToken().then(token => fetchFolders(token))
        }
    }, [isAuthLoaded, getToken, fetchFolders])

    const handleDeploy = async (metadata = {}) => {
        if (!projectId || projectId === 'new') return;
        setIsDeploying(true);
        try {
            const token = await getToken();
            
            // 1. Update project metadata (title/description) first
            if (metadata.websiteName || metadata.description) {
                await useProjectStore.getState().updateProjectConfig(projectId, metadata, token);
            }

            // 2. Trigger deployment
            const res = await fetch(`/api/projects/${projectId}/deploy`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.publishedUrl) {
                setPublishedUrl(data.publishedUrl);
                // Update store as well for immediate persistent UI elsewhere
                useProjectStore.setState((state) => ({
                    projects: state.projects.map(p => 
                        p.id === projectId ? { ...p, publishedUrl: data.publishedUrl } : p
                    )
                }));
                setIsPublishModalOpen(false);
            } else {
                console.error("Deploy failed:", data.error);
                alert(data.error || "Deploy failed");
            }
        } catch (err) {
            console.error("Deploy error:", err);
            alert("Deploy failed");
        } finally {
            setIsDeploying(false);
        }
    };
    
    // The right panel only shows when:
    // 1. The user explicitly opened it (isIdeVisible via "Show details" / "Preview" buttons)
    // 2. OR the project has generated content from a previous session
    const showRightPanel = isIdeVisible || hasGeneratedContent

    // Fetch project from API if not in local store (e.g., page refresh)
    useEffect(() => {
        if (projectId && projectId !== 'new' && !project && isAuthLoaded) {
            const fetchProject = async () => {
                const token = await getToken()
                const { activeWorkspaceId } = useWorkspaceStore.getState()
                await useProjectStore.getState().fetchProjects(token, activeWorkspaceId)
            }
            fetchProject()
        }
        // Track recently viewed
        if (projectId && projectId !== 'new') {
            useRecentlyViewedStore.getState().addRecentlyViewed(projectId)
        }
    }, [projectId, project, isAuthLoaded, getToken])

    const projectName = project ? project.name : (projectId === 'new' ? 'Untitled Project' : 'Loading...')
    

    // Resizer logic — capped between 15% and 30% of viewport
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return
            if (e.buttons === 0) { setIsDragging(false); return }
            const minW = Math.round(window.innerWidth * 0.15)
            const maxW = Math.round(window.innerWidth * 0.30)
            const newWidth = Math.min(Math.max(e.clientX, minW), maxW)
            setChatWidth(newWidth)
        }
        const handleMouseUp = () => setIsDragging(false)
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.userSelect = 'none'
        } else {
            document.body.style.userSelect = ''
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.userSelect = ''
        }
    }, [isDragging])

    // Switch completely isolated IDE workspaces when the URL changes
    useEffect(() => {
        if (projectId && isAuthLoaded) {
            const sync = async () => {
                const token = await getToken();
                // Ensure project store has data for the "Live" button and Modals
                useProjectStore.getState().fetchProjects(token);
                useChatStore.getState().loadProject(projectId, token);
                useEditorStore.getState().loadProject(projectId);
            }
            sync()
        }
    }, [projectId, isAuthLoaded, getToken]);

    // Auto-create project if navigated with /chat/new?prompt=... or /chat/new?templateId=...
    // This handles the LandingPage flow AND the Templates flow
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const prompt = params.get('prompt')
        const templateId = params.get('templateId')
        const templateName = params.get('templateName')
        
        if (projectId === 'new' && (prompt || templateId) && isAuthLoaded) {
            const createAndRedirect = async () => {
                const token = await getToken();
                
                // CRITICAL: Ensure server workspace state is loaded so activeWorkspaceId is not null
                const authStore = useAuthStore.getState();
                if (!authStore.userData) {
                    await authStore.fetchUserData(getToken);
                }
                
                const { createProject } = useProjectStore.getState();
                const { activeWorkspaceId } = useWorkspaceStore.getState();
                
                // Use template name or prompt for the project name
                const projectPrompt = prompt || templateName || 'Template Project';
                const newId = await createProject(projectPrompt, token, null, templateId || null, activeWorkspaceId);
                
                if (newId) {
                    // Build redirect URL — preserve prompt if present, add templateId context
                    const redirectParams = new URLSearchParams();
                    if (prompt) redirectParams.set('prompt', prompt);
                    if (templateId) {
                        redirectParams.set('templateId', templateId);
                        if (templateName) redirectParams.set('templateName', templateName);
                    }
                    const qs = redirectParams.toString();
                    navigate(`/chat/${newId}${qs ? '?' + qs : ''}`, { replace: true });
                }
            }
            createAndRedirect();
            return; // Don't proceed with generation until redirect
        }
    }, [projectId, location.search, isAuthLoaded, getToken, navigate])

    // Auto-execute prompt from URL on load (after project is created with real ID)
    // Also handles template preview: shows the live preview and asks for brand details
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const prompt = params.get('prompt')
        const templateId = params.get('templateId')
        const templateName = params.get('templateName')
        
        if ((prompt || templateId) && projectId !== 'new' && messages.length === 0 && !isGenerating && isAuthLoaded) {
            const run = async () => {
                const token = await getToken();
                const { isConfigured } = useChatStore.getState();

                if (templateId) {
                    // ── TEMPLATE PREVIEW FLOW ──
                    // The backend already pre-populated currentFileTree with the template HTML.
                    // The loadProject hydration in the first useEffect will load it into the editor store.
                    // We just need to show the preview and ask for user details.
                    
                    addMessage({ role: 'user', content: `I want to use the "${templateName || templateId}" theme` });
                    addMessage({ 
                        role: 'assistant', 
                        content: `Great choice! Here's a live preview of the **${templateName || templateId}** theme. 👉\n\nTo make it yours, **what's your brand name?**\n\n_Step 1 of 3_` 
                    });

                    // Force show the preview panel with the template HTML
                    useChatStore.setState({ isIdeVisible: true, activeView: 'preview' });
                    
                } else if (prompt) {
                    // ── STANDARD PROMPT FLOW ──
                    addMessage({ role: 'user', content: prompt })

                    if (isConfigured) {
                        startGeneration(prompt, projectId, token, {})
                    } else {
                        addMessage({ 
                            role: 'assistant', 
                            content: `Hi! I'm excited to build your website for **"${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"**. \n\nTo get started, **pick a category and choose a theme** from the options below.` 
                        });
                    }
                }

                // Remove all params from URL to avoid re-triggering
                navigate(location.pathname, { replace: true })
            }
            run()
        }
    }, [location.search, messages.length, isGenerating, addMessage, startGeneration, navigate, location.pathname, projectId, isAuthLoaded, getToken])
    
    // Always show center controls for the full IDE experience

    return (
        <div className="editor-page">
            {/* Top Toolbar */}
            <div className="ep-toolbar">
                <div className="ep-toolbar-left">
                    {/* App Name & Popover Trigger */}
                    <div className="ep-app-trigger-container">
                        <button 
                            className="ep-app-trigger"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                        >
                            <span className="ep-app-name">{projectName}</span>
                            <ChevronDown size={14} className="ep-app-chevron" />
                        </button>
                        <span className="ep-app-subtitle">Previewing last saved version</span>
                        
                        <ProjectPopover 
                            isOpen={isPopoverOpen} 
                            onClose={() => setIsPopoverOpen(false)} 
                            project={project}
                            onRename={() => {
                                setIsPopoverOpen(false)
                                setRenameModal({ open: true, id: project?.id || project?._id, name: project?.name })
                            }}
                            onMove={() => {
                                setIsPopoverOpen(false)
                                setMoveModal({ open: true, id: project?.id || project?._id, name: project?.name, folderId: project?.folderId })
                            }}
                            onDetails={() => {
                                setIsPopoverOpen(false)
                                setIsDetailsModalOpen(true)
                            }}
                        />
                    </div>

                    <div className="ep-toolbar-divider"></div>

                    <button 
                        className={`ep-icon-btn ${isHistoryOpen ? 'active' : ''}`} 
                        title="Version History"
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    >
                        <Clock size={18} />
                    </button>
                    <button 
                        className={`ep-icon-btn ${!isChatVisible ? 'active' : ''}`} 
                        title="Toggle Sidebar"
                        onClick={() => setIsChatVisible(!isChatVisible)}
                    >
                        <PanelLeftClose size={18} />
                    </button>
                </div>

                {/* Center Controls — Only visible when right panel is open */}
                <div className="ep-toolbar-center">
                    {showRightPanel && (
                    <div className="ep-center-nav">
                            <button className="ep-back-latest-btn">
                                <ArrowLeft size={14} />
                                Back to latest
                            </button>
                            
                            <div className="ep-center-pill-toggle">
                                <button 
                                    className={`ep-pill-btn ${activeView === 'agent' ? 'active' : ''}`}
                                    onClick={() => setActiveView('agent')}
                                >
                                    <List size={14} />
                                    Agent
                                </button>
                                <button 
                                    className={`ep-pill-btn ${activeView === 'code' ? 'active' : ''}`}
                                    onClick={() => setActiveView('code')}
                                >
                                    <Code size={14} />
                                    Code
                                </button>
                                <button 
                                    className={`ep-pill-btn ${activeView === 'preview' ? 'active' : ''}`}
                                    onClick={() => setActiveView('preview')}
                                >
                                    <Monitor size={14} />
                                    Preview
                                </button>
                            </div>

                            <div className="ep-history-nav">
                                <button className="ep-history-arrow"><ChevronUp size={16} /></button>
                                <button className="ep-history-arrow"><ChevronDown size={16} /></button>
                            </div>

                            <button 
                                className={`ep-center-control-btn ${activeView === 'history' ? 'active' : ''}`}
                                onClick={() => setActiveView(activeView === 'history' ? 'preview' : 'history')}
                            >
                                <History size={14} />
                                Timeline
                            </button>
                            <button className="ep-center-control-btn">
                                <Diff size={14} />
                                Changes
                            </button>
                    </div>
                    )}
                </div>

                <div className="ep-toolbar-right">
                    <button className="ep-tool-btn ep-share-btn">
                        <Share2 size={14} />
                        <span>Share</span>
                    </button>
                    {publishedUrl ? (
                        <div style={{display:'flex', gap:'8px'}}>
                            <a href={publishedUrl} target="_blank" rel="noreferrer" className="ep-tool-btn ep-deploy-btn published" style={{background: '#3b82f6', color: '#fff', border: 'none'}}>
                                <Rocket size={14} />
                                <span>Live</span>
                            </a>
                            <button 
                                className="ep-tool-btn ep-deploy-btn" 
                                onClick={() => setIsPublishModalOpen(true)}
                                title="Update site settings or re-deploy"
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="ep-tool-btn ep-deploy-btn" 
                            onClick={() => setIsPublishModalOpen(true)} 
                            disabled={isDeploying || !hasGeneratedContent}
                            title={!hasGeneratedContent ? "Nothing to deploy yet" : "Publish your site"}
                            style={isDeploying ? { opacity: 0.7, cursor: 'wait' } : {}}
                        >
                            {isDeploying ? (
                                <Loader2 size={14} className="ep-spin" />
                            ) : (
                                <Rocket size={14} />
                            )}
                            <span>{isDeploying ? 'Deploying...' : 'Deploy'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Workspace: centered chat-only OR 2-panel split */}
            <div className={`ep-workspace ${isDragging ? 'resizing' : ''} ${!showRightPanel ? 'ep-centered' : ''}`}>
                {/* Left: Chat/Agent Panel (20%, draggable) */}
                <div className="ep-panel ep-chat" style={showRightPanel ? { width: isChatVisible ? chatWidth : 0, minWidth: isChatVisible ? 200 : 0, overflow: 'hidden', transition: 'width 0.25s ease, min-width 0.25s ease' } : {}}>
                    <div className="ep-chat-container" style={{ position: 'relative', width: showRightPanel ? chatWidth : '100%', opacity: isChatVisible ? 1 : 0, transition: 'opacity 0.2s ease', pointerEvents: isChatVisible ? 'auto' : 'none', visibility: isChatVisible ? 'visible' : 'hidden' }}>
                        <ChatPanel />
                        
                        {isHistoryOpen && (
                            <HistorySidebar 
                                projectId={projectId} 
                                onClose={() => setIsHistoryOpen(false)} 
                            />
                        )}
                        
                        <div className={`ep-visual-edit-overlay ${isVisualEditMode ? 'active' : ''}`}>
                            {isVisualEditMode && (
                                <VisualEditPanel 
                                    onApplyStyle={(xpath, prop, value) => {
                                        const iframe = document.querySelector('.pp-iframe-wrapper iframe')
                                        if (iframe) {
                                            try {
                                                iframe.contentWindow.postMessage(
                                                    { type: 'VE_APPLY_STYLE', xpath, prop, value },
                                                    '*'
                                                )
                                            } catch(e) {}
                                        }
                                    }}
                                    onClose={() => useChatStore.getState().setVisualEditMode(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {showRightPanel && (
                    <>
                        {/* Resizer Slider */}
                        <div 
                            className="ep-resizer" 
                            onMouseDown={() => setIsDragging(true)}
                        >
                            <div className="ep-resizer-line"></div>
                        </div>

                        {/* Right: Preview/Code Panel (80%, takes remaining) */}
                        <div className="ep-panel ep-main-view">
                            {activeView === 'agent' && <DetailsPanel />}
                            {activeView === 'code' && (
                                <div className="ep-code-inner">
                                    <FileTree />
                                    <div className="ep-editor-area">
                                        <CodeEditor />
                                    </div>
                                </div>
                            )}
                            {activeView === 'preview' && <PreviewPanel />}
                            {activeView === 'history' && <HistoryPanel projectId={projectId} />}
                        </div>
                    </>
                )}
            </div>

            {/* Modals for Project Popover interactions */}
            <RenameModal
                isOpen={renameModal.open}
                onClose={() => setRenameModal({ open: false, id: null, name: '' })}
                projectName={renameModal.name}
                onConfirm={async (newName) => {
                    const token = await getToken();
                    useProjectStore.getState().renameProject(renameModal.id, newName, token);
                }}
            />
            <MoveToFolderModal
                isOpen={moveModal.open}
                onClose={() => setMoveModal({ open: false, id: null, name: '', folderId: null })}
                projectName={moveModal.name}
                currentFolderId={moveModal.folderId}
                onConfirm={async (folderId) => {
                    const token = await getToken();
                    useProjectStore.getState().moveToFolder(moveModal.id, folderId, token);
                }}
            />
            <DetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                project={project}
                ownerName={clerkUser?.fullName || clerkUser?.emailAddresses[0]?.emailAddress}
                folderName={folder?.name}
            />

            <PublishModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                project={project ? { ...project, publishedUrl } : null}
                onPublish={handleDeploy}
                isPublishing={isDeploying}
            />
        </div>
    )
}
