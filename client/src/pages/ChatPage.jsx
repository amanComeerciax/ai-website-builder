import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
    ChevronDown, Clock, PanelLeftClose, Rocket, Share2, 
    ArrowLeft, ChevronUp, History, Diff, Monitor, Code, List 
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
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useChatStore } from '../stores/chatStore'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import './ChatPage.css'

export default function ChatPage() {
    const { projectId } = useParams()
    const { isLoaded: isAuthLoaded, getToken } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const { getProjectById } = useProjectStore()
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [isChatVisible, setIsChatVisible] = useState(true)
    const [chatWidth, setChatWidth] = useState(() => Math.round(window.innerWidth * 0.2))
    const [isDragging, setIsDragging] = useState(false)
    const { 
        isGenerating, generationStatus, isDetailsExpanded, setDetailsExpanded,
        isIdeVisible, setIdeVisible, activeView, setActiveView, messages, addMessage, startGeneration,
        generationPhase, isVisualEditMode
    } = useChatStore()
    const { files } = useEditorStore()
    
    // Determine if the user has ANY generated content (not just the demo file)
    const hasGeneratedContent = Object.keys(files).some(f => f !== 'App.jsx') || 
        generationPhase === 'complete' || generationPhase === 'streaming_logs' || generationPhase === 'thinking'
    
    // The right panel only shows when:
    // 1. The user explicitly opened it (isIdeVisible via "Show details" / "Preview" buttons)
    // 2. OR the project has generated content from a previous session
    const showRightPanel = isIdeVisible || hasGeneratedContent
    
    const project = getProjectById(projectId)
    const projectName = project ? project.name : (projectId === 'new' ? 'Untitled Project' : 'Unknown Project')
    

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
                useChatStore.getState().loadProject(projectId, token);
                useEditorStore.getState().loadProject(projectId);
            }
            sync()
        }
    }, [projectId, isAuthLoaded, getToken]);

    // Auto-create project if navigated with /chat/new?prompt=...
    // This handles the LandingPage flow where no DB project exists yet
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const prompt = params.get('prompt')
        
        if (projectId === 'new' && prompt && isAuthLoaded) {
            const createAndRedirect = async () => {
                const token = await getToken();
                const { createProject } = useProjectStore.getState();
                const newId = await createProject(prompt, token);
                if (newId) {
                    // Redirect to the real project URL — include all style params
                    navigate(`/chat/${newId}${location.search}`, { replace: true });
                }
            }
            createAndRedirect();
            return; // Don't proceed with generation until redirect
        }
    }, [projectId, location.search, isAuthLoaded, getToken, navigate])

    // Auto-execute prompt from URL on load (after project is created with real ID)
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const prompt = params.get('prompt')
        
        if (prompt && projectId !== 'new' && messages.length === 0 && !isGenerating && isAuthLoaded) {
            const run = async () => {
                const token = await getToken();
                const { isConfigured } = useChatStore.getState();
                
                // Add the user's initial prompt as the first message
                addMessage({ role: 'user', content: prompt })

                if (isConfigured) {
                    // If already configured (e.g. returning to project), just build
                    startGeneration(prompt, projectId, token, {})
                } else {
                    // NEW FLOW: Wait for style config!
                    // Add an assistant response as the "voice" of the builder
                    addMessage({ 
                        role: 'assistant', 
                        content: `Hi! I'm excited to build your website for **"${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"**. \n\nTo get started, **please select a theme** from the options below.` 
                    });
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
                            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                        >
                            <span className="ep-app-name">{projectName}</span>
                            <ChevronDown size={14} className="ep-app-chevron" />
                        </button>
                        <span className="ep-app-subtitle">Previewing last saved version</span>
                        
                        <ProjectPopover 
                            isOpen={isPopoverOpen} 
                            onClose={() => setIsPopoverOpen(false)} 
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
                    <button className="ep-tool-btn ep-deploy-btn">
                        <Rocket size={14} />
                        <span>Deploy</span>
                    </button>
                </div>
            </div>

            {/* Workspace: centered chat-only OR 2-panel split */}
            <div className={`ep-workspace ${isDragging ? 'resizing' : ''} ${!showRightPanel ? 'ep-centered' : ''}`}>
                {/* Left: Chat/Agent Panel (20%, draggable) */}
                <div className="ep-panel ep-chat" style={showRightPanel ? { width: isChatVisible ? chatWidth : 0, minWidth: isChatVisible ? 200 : 0, overflow: isChatVisible ? undefined : 'hidden', transition: 'width 0.25s ease, min-width 0.25s ease' } : {}}>
                    {isChatVisible && (
                    <div className="ep-chat-container" style={{ position: 'relative' }}>
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
                    )}
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
        </div>
    )
}
