import { useState, useEffect, useRef } from 'react'
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
import ProjectPopover from '../components/editor/ProjectPopover'
import CliOnboardingModal from '../components/editor/CliOnboardingModal'
import HistoryPanel from '../components/editor/HistoryPanel'
import { io } from 'socket.io-client'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import { useProjectStore } from '../stores/projectStore'
import { useEditorStore } from '../stores/editorStore'
import './ChatPage.css'

export default function ChatPage() {
    const { projectId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { getProjectById } = useProjectStore()
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [isCliModalOpen, setIsCliModalOpen] = useState(false)
    const [chatWidth, setChatWidth] = useState(400) // Default pixel width
    const [isDragging, setIsDragging] = useState(false)
    const creationStarted = useRef(false)
    const { 
        isGenerating, generationStatus, isDetailsExpanded, setDetailsExpanded,
        isIdeVisible, setIdeVisible, activeView, setActiveView, messages, addMessage, startGeneration,
        generationPhase
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
    
    // Resizer logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            // Native fix: If the user released the mouse outside the window, un-stick it!
            if (e.buttons === 0) {
                setIsDragging(false);
                return;
            }
            // Cap at 40% of viewport width max
            const maxWidth = window.innerWidth * 0.4;
            const newWidth = Math.min(Math.max(e.clientX, 280), maxWidth);
            setChatWidth(newWidth);
        };
        const handleMouseUp = () => setIsDragging(false);
        const handleMouseLeave = (e) => {
            if (e.buttons === 0) setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('mouseleave', handleMouseLeave);
            // Add user select none to body to prevent text highlighting while dragging
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = '';
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.addEventListener('mouseleave', handleMouseLeave);
            document.body.style.userSelect = '';
        };
    }, [isDragging]);

    // Switch completely isolated IDE workspaces when the URL changes
    useEffect(() => {
        if (projectId && projectId !== 'new') {
            useChatStore.getState().loadProject(projectId);
            useEditorStore.getState().loadProject(projectId);
            creationStarted.current = false; // Reset for future 'new' navigations
        }
    }, [projectId]);

    // Handle new project creation from URL prompt (Home page route)
    useEffect(() => {
        if (projectId === 'new' && !creationStarted.current) {
            creationStarted.current = true;
            
            // Clear the stores immediately so we don't flash the previous project
            useChatStore.getState()._sync({ messages: [], generationPhase: 'idle', activeProjectId: 'new' });
            useEditorStore.getState().setFiles({ "App.jsx": { content: "// Initializing..." } });
            
            const params = new URLSearchParams(location.search)
            const prompt = params.get('prompt') || 'Untitled Project'
            const isTemplate = params.get('isTemplate')
            const model = params.get('model') || ''
            
            // Create a dedicated real workspace for this prompt
            useProjectStore.getState().createProject(prompt).then((newId) => {
                const searchParams = new URLSearchParams();
                if (prompt !== 'Untitled Project') searchParams.set('prompt', prompt);
                if (isTemplate) searchParams.set('isTemplate', isTemplate);
                if (model) searchParams.set('model', model);
                
                navigate(`/chat/${newId}?${searchParams.toString()}`, { replace: true });
            }).catch(err => {
                console.error("[ChatPage] Failed to create project", err);
                creationStarted.current = false; // Allow user to try again if it failed
            });
        }
    }, [projectId, location.search, navigate]);
    
    // Auto-execute template instantiation
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const isTemplate = params.get('isTemplate')
        
        // If this is a template instantiation (and we have a real projectId), show the preview immediately
        if (isTemplate === 'true' && projectId !== 'new') {
            setIdeVisible(true);
            setActiveView('preview');
            // Clean URL
            navigate(location.pathname, { replace: true });
            return;
        }
    }, [location.search, navigate, location.pathname, setIdeVisible, setActiveView, projectId])
    
    // WebSockets: Connect to backend for live Sync and LocalTunnel integration
    useEffect(() => {
        if (!projectId || projectId === 'new') return;

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socket = io(API_BASE);

        socket.on('connect', () => {
            console.log('[Editor] Connected to LiveSync WebSocket');
            socket.emit('join-project', projectId);
        });

        // Handle auto-fix updates streaming directly from the CLI/backend
        socket.on('file-update', ({ path, content }) => {
            useEditorStore.getState().setFile(path, content);
            console.log(`[LiveSync] Received HMR update for: ${path}`);
        });

        // Handle the CLI exposing a secure external tunnel URL
        socket.on('tunnel-active', ({ url }) => {
            console.log(`[LocalDev] Secure tunnel active at: ${url}`);
            useEditorStore.getState().setTunnelUrl(url);
            // Optionally auto-open the IDE to the preview panel if they were chatting
            setIdeVisible(true);
            setActiveView('preview');
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId, setIdeVisible, setActiveView]);

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
                        className={`ep-icon-btn ${activeView === 'history' ? 'active' : ''}`} 
                        title="Version History"
                        onClick={() => {
                            setIdeVisible(true);
                            setActiveView('history');
                        }}
                    >
                        <Clock size={18} />
                    </button>
                    <button className="ep-icon-btn" title="Toggle Sidebar">
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
                                onClick={() => setActiveView('history')}
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
                    <button 
                        className="ep-tool-btn ep-share-btn"
                        onClick={() => setIsCliModalOpen(true)}
                    >
                        <Monitor size={14} />
                        <span>Run Locally</span>
                    </button>
                    <button className="ep-tool-btn ep-deploy-btn">
                        <Rocket size={14} />
                        <span>Deploy</span>
                    </button>
                </div>
            </div>

            <CliOnboardingModal 
                isOpen={isCliModalOpen} 
                onClose={() => setIsCliModalOpen(false)} 
                projectId={projectId} 
            />

            {/* Workspace: centered chat-only OR 2-panel split */}
            <div className={`ep-workspace ${isDragging ? 'resizing' : ''} ${!showRightPanel ? 'ep-centered' : ''}`}>
                {/* Left: Chat Panel */}
                <div className="ep-panel ep-chat" style={showRightPanel ? { width: chatWidth } : {}}>
                    <ChatPanel />
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

                        {/* Right: Toggleable Active View Panel */}
                        <div className="ep-panel ep-main-view">
                            {activeView === 'agent' && <DetailsPanel />}
                            {activeView === 'history' && <HistoryPanel projectId={projectId} />}
                            {activeView === 'code' && (
                                <div className="ep-code-inner">
                                    <FileTree />
                                    <div className="ep-editor-area">
                                        <CodeEditor />
                                    </div>
                                </div>
                            )}
                            {activeView === 'preview' && <PreviewPanel />}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
