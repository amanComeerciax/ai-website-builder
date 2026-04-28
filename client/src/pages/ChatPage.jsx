import { useState, useEffect, useRef } from 'react'
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
import SetupWizard from '../components/editor/SetupWizard'
import RenameModal from '../components/modals/RenameModal'
import MoveToFolderModal from '../components/modals/MoveToFolderModal'
import DetailsModal from '../components/modals/DetailsModal'
import PublishModal from '../components/modals/PublishModal'
import SharePopover from '../components/modals/SharePopover'
import JoinProjectModal from '../components/modals/JoinProjectModal'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useChatStore } from '../stores/chatStore'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import { useFolderStore } from '../stores/folderStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useAuthStore } from '../stores/authStore'
import { useUser } from '@clerk/clerk-react'
import { useToast } from '../components/UIComponents/Toasts/tsx/ToastPill'
import { useRecentlyViewedStore } from '../stores/recentlyViewedStore'
import './ChatPage.css'

export default function ChatPage() {
    const { projectId } = useParams()
    const { isLoaded: isAuthLoaded, getToken } = useAuth()
    const { user: clerkUser } = useUser()
    const location = useLocation()
    const navigate = useNavigate()
    const inviteToken = new URLSearchParams(location.search).get('inviteToken')
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
    const [isShareOpen, setIsShareOpen] = useState(false)
    const shareBtnRef = useRef(null)
    const { toast } = useToast()
    
    const { 
        isGenerating, generationStatus, isDetailsExpanded, setDetailsExpanded,
        isIdeVisible, setIdeVisible, activeView, setActiveView, messages, addMessage, startGeneration,
        generationPhase, isVisualEditMode, isConfigured, generationLogs
    } = useChatStore()
    const { files } = useEditorStore()
    
    // Determine if the user has ANY generated content (not just the demo file)
    const hasGeneratedContent = Object.keys(files).some(f => f !== 'App.jsx') || 
        generationPhase === 'complete' || generationPhase === 'streaming_logs' || generationPhase === 'thinking'
        
    // Deployment state
    const [isDeploying, setIsDeploying] = useState(false)
    const [buildProgress, setBuildProgress] = useState(0)
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

    // Check project access periodically (kick if access removed)
    useEffect(() => {
        if (!projectId || projectId === 'new') return;
        const interval = setInterval(async () => {
            try {
                const token = await getToken();
                const res = await fetch(`/api/projects/${projectId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.status === 403 || res.status === 404) {
                    navigate('/dashboard');
                }
            } catch(e) {}
        }, 5000);
        return () => clearInterval(interval);
    }, [projectId, getToken, navigate]);

    // Build Progress tracker 
    useEffect(() => {
        if (!isGenerating) {
            setBuildProgress(100);
            setTimeout(() => setBuildProgress(0), 500);
            return;
        }

        // Base progress on SSE data
        if (generationPhase === 'thinking') setBuildProgress(15);
        else if (generationPhase === 'streaming_logs') {
            const calculated = 15 + ((generationLogs?.length || 0) * 7);
            setBuildProgress(Math.min(calculated, 95));
        }

        // Asymptotic fill between steps
        const interval = setInterval(() => {
            setBuildProgress(prev => prev < 95 ? prev + 1 : prev);
        }, 800);

        return () => clearInterval(interval);
    }, [isGenerating, generationPhase, generationLogs?.length]);

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

    useEffect(() => {
        if (projectId && projectId !== 'new' && isAuthLoaded) {
            const sync = async () => {
                const token = await getToken();
                const { activeWorkspaceId } = useWorkspaceStore.getState();
                const currentProjects = useProjectStore.getState().projects;
                
                // Only fetch if project isn't already in store
                if (!currentProjects.find(p => p.id === projectId)) {
                    await useProjectStore.getState().fetchProjects(token, activeWorkspaceId);
                }
            }
            sync();
        }
        // Track recently viewed
        if (projectId && projectId !== 'new') {
            useRecentlyViewedStore.getState().addRecentlyViewed(projectId);
        }
    }, [projectId, isAuthLoaded]); // Removed 'project' and 'getToken' to stop the loop

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
            const load = async () => {
                const token = await getToken();
                await useChatStore.getState().loadProject(projectId, token, inviteToken);
                useProjectStore.getState().fetchProjects(token);
                useEditorStore.getState().loadProject(projectId);
            }
            load()
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
                        content: `Great choice! Here's a live preview of the **${templateName || templateId}** theme. 👉\n\nTo make it yours, **what's your brand name?**\n\n_Step 1 of 2_` 
                    });

                    // Pre-set templateId in styleOptions so SetupWizard skips Step 3 (Theme)
                    useChatStore.getState().setStyleOptions(prev => ({
                        ...prev,
                        templateId: templateId,
                        initialPrompt: templateName || templateId,
                    }));

                    // Force show the preview panel with the template HTML
                    useChatStore.setState({ isIdeVisible: true, activeView: 'preview' });
                    
                } else if (prompt) {
                    // ── STANDARD PROMPT FLOW ──
                    addMessage({ role: 'user', content: prompt })

                    if (isConfigured) {
                        startGeneration(prompt, projectId, token, {})
                    } else {
                        // Store the initial prompt so AI can use it for category inference later
                        useChatStore.getState().setStyleOptions(prev => ({
                            ...prev,
                            initialPrompt: prompt,
                        }));

                        addMessage({ 
                            role: 'assistant', 
                            content: `Hi! I'm excited to build your website for **"${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"**. To get started, pick a category and choose a theme from the options below.` 
                        });

                        // Show the SetupWizard in the right panel
                        useChatStore.setState({ isIdeVisible: true, activeView: 'preview' });
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
                    {isGenerating && (
                        <div className="ep-tool-btn" style={{ cursor: 'default', color: '#a78bfa', background: 'transparent' }}>
                            <Loader2 size={14} className="ep-spin" />
                            <span>Building... {buildProgress}%</span>
                        </div>
                    )}
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <button 
                            ref={shareBtnRef}
                            className="ep-tool-btn ep-share-btn"
                            onClick={(e) => {
                                if (!hasGeneratedContent || isGenerating) {
                                    e.preventDefault();
                                    toast({
                                        title: "Website generation incomplete",
                                        variant: "warning",
                                        duration: 3000,
                                    });
                                } else {
                                    setIsShareOpen(!isShareOpen)
                                }
                            }}
                        >
                            <Share2 size={14} />
                            <span>Share</span>
                        </button>
                        <SharePopover 
                            isOpen={isShareOpen} 
                            onClose={() => setIsShareOpen(false)} 
                            buttonRef={shareBtnRef}
                            projectId={projectId}
                            publishedUrl={publishedUrl}
                        />
                    </div>
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
                            onClick={(e) => {
                                if (isDeploying) return;
                                if (!hasGeneratedContent || isGenerating) {
                                    e.preventDefault();
                                    toast({
                                        title: "Website generation incomplete",
                                        variant: "warning",
                                        duration: 3000,
                                    });
                                    return;
                                }
                                setIsPublishModalOpen(true);
                            }}
                            title={isGenerating ? "Wait for generation to complete" : !hasGeneratedContent ? "Nothing to deploy yet" : "Publish your site"}
                            style={isDeploying || isGenerating || !hasGeneratedContent ? { opacity: 0.7, cursor: isDeploying ? 'wait' : 'not-allowed' } : {}}
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
                            {activeView === 'preview' && (
                                !isConfigured
                                    ? <SetupWizard />
                                    : <PreviewPanel />
                            )}
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

            {inviteToken && (
                <JoinProjectModal 
                    inviteToken={inviteToken}
                    onClose={(newProjectId) => {
                        const searchParams = new URLSearchParams(location.search)
                        searchParams.delete('inviteToken')
                        navigate({ pathname: location.pathname, search: searchParams.toString() }, { replace: true })
                    }}
                />
            )}
        </div>
    )
}
