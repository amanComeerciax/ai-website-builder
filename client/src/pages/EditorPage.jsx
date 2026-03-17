import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
    ChevronDown, Clock, PanelLeftClose, Rocket, Share2, 
    ArrowLeft, ChevronUp, History, Diff 
} from 'lucide-react'
import ChatPanel from '../components/editor/ChatPanel'
import FileTree from '../components/editor/FileTree'
import CodeEditor from '../components/editor/CodeEditor'
import PreviewPanel from '../components/editor/PreviewPanel'
import DetailsPanel from '../components/editor/DetailsPanel'
import ProjectPopover from '../components/editor/ProjectPopover'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import { useProjectStore } from '../stores/projectStore'
import './EditorPage.css'

export default function EditorPage() {
    const { projectId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { getProjectById } = useProjectStore()
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const { 
        isGenerating, generationStatus, isDetailsExpanded, setDetailsExpanded,
        isIdeVisible, messages, addMessage, startGeneration 
    } = useChatStore()
    
    const project = getProjectById(projectId)
    const projectName = project ? project.name : (projectId === 'new' ? 'Untitled Project' : 'Unknown Project')
    
    // Auto-execute prompt from URL on load
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const prompt = params.get('prompt')
        
        if (prompt && messages.length === 0 && !isGenerating) {
            addMessage({ role: 'user', content: prompt })
            startGeneration(prompt, projectId)
            // Remove prompt from URL to avoid re-triggering
            navigate(location.pathname, { replace: true })
        }
    }, [location.search, messages.length, isGenerating, addMessage, startGeneration, navigate, location.pathname, projectId])
    
    // Determine if we should show the center controls
    const showCenterControls = isIdeVisible && (isGenerating || generationStatus === 'complete')

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

                    <button className="ep-icon-btn" title="Version History">
                        <Clock size={18} />
                    </button>
                    <button className="ep-icon-btn" title="Toggle Sidebar">
                        <PanelLeftClose size={18} />
                    </button>
                </div>

                {/* Center Controls (Dynamic) */}
                <div className="ep-toolbar-center">
                    {showCenterControls && (
                        <div className="ep-center-nav">
                            <button className="ep-back-latest-btn">
                                <ArrowLeft size={14} />
                                Back to latest
                            </button>
                            
                            <div className="ep-center-tabs">
                                <button 
                                    className={`ep-center-tab ${!isDetailsExpanded ? 'active' : ''}`}
                                    onClick={() => setDetailsExpanded(false)}
                                >
                                    Preview
                                </button>
                                <button 
                                    className={`ep-center-tab ${isDetailsExpanded ? 'active' : ''}`}
                                    onClick={() => setDetailsExpanded(true)}
                                >
                                    Details
                                </button>
                            </div>

                            <div className="ep-history-nav">
                                <button className="ep-history-arrow"><ChevronUp size={16} /></button>
                                <button className="ep-history-arrow"><ChevronDown size={16} /></button>
                            </div>

                            <button className="ep-center-control-btn">
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

            {/* 3-Panel Workspace */}
            <div className={`ep-workspace ${!isIdeVisible ? 'ep-centered' : ''}`}>
                {/* Left: Chat Panel */}
                <div className="ep-panel ep-chat">
                    <ChatPanel />
                </div>

                {/* Center: FileTree + CodeEditor */}
                <div className="ep-panel ep-code">
                    <div className="ep-code-inner">
                        <FileTree />
                        <div className="ep-editor-area">
                            <CodeEditor />
                        </div>
                    </div>
                </div>

                {/* Right: Live Preview or Details Panel */}
                <div className="ep-panel ep-preview">
                    {isDetailsExpanded ? <DetailsPanel /> : <PreviewPanel />}
                </div>
            </div>
        </div>
    )
}
