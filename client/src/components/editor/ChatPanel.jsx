import { useState, useRef, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { 
    Send, Bot, User, Lightbulb, RefreshCw, Package, 
    FileEdit, FilePlus, Bookmark, ThumbsUp, ThumbsDown, 
    Copy, MoreHorizontal, Plus, MousePointer2, MessageSquare, 
    Mic, ArrowUp, ChevronRight, ChevronDown, Cpu, Cloud
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import ContextChips from './ContextChips'
import './ChatPanel.css'

export default function ChatPanel() {
    const { projectId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { 
        messages, isGenerating, generationPhase, generationLogs, 
        generationSummary, generationTaskName, isDetailsExpanded,
        isIdeVisible, selectedModel,
        addMessage, startGeneration, setDetailsExpanded, setIdeVisible, setSelectedModel
    } = useChatStore()
    
    const [input, setInput] = useState('')
    const [isThoughtExpanded, setIsThoughtExpanded] = useState(false)
    const messagesEndRef = useRef(null)

    // V3.0: Context Collection State
    const [contextState, setContextState] = useState('idle')
    const [contextQuestions, setContextQuestions] = useState([])
    const [pendingPrompt, setPendingPrompt] = useState('')
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, generationPhase, generationLogs, contextState])

    // Extracted prompt logic so URL params and manual inputs use the exact same flow
    const processPrompt = async (promptText) => {
        if (!promptText || isGenerating) return

        // Check if this is the first message BEFORE mutating state
        const isFirstMessage = messages.length === 0

        addMessage({ role: 'user', content: promptText })

        if (isFirstMessage) {
            setContextState('loading')
            setPendingPrompt(promptText)
            try {
                // Ensure API_BASE works correctly (fallback to relative path)
                const fetchUrl = API_BASE ? `${API_BASE}/api/context/questions` : '/api/context/questions'
                
                const res = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: promptText })
                })
                
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
                const data = await res.json()

                if (data.questions && data.questions.length > 0) {
                    // Show the chips UI — user must answer (or skip)
                    setContextQuestions(data.questions)
                    setContextState('awaiting_answers')
                    return // ← pause here until ContextChips onSubmit/onSkip fires
                }
            } catch (err) {
                console.warn('[ChatPanel] Context fetch failed, skipping:', err.message)
            }
            // No questions needed (or fetch failed) — proceed immediately
            setContextState('done')
            startGeneration(promptText, projectId)
        } else {
            // Follow-up message — no context needed, generate directly
            startGeneration(promptText, projectId)
        }
    }

    // Step 1: User hits send — check if context questions are needed first
    const handleSend = () => {
        const trimmed = input.trim()
        if (trimmed) {
            setInput('')
            processPrompt(trimmed)
        }
    }

    // Auto-execute prompt from URL (e.g. from Home page)
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const urlPrompt = params.get('prompt')
        
        if (urlPrompt && messages.length === 0 && !isGenerating && contextState === 'idle') {
            processPrompt(urlPrompt)
            // Remove prompt from URL to avoid re-triggering
            navigate(location.pathname, { replace: true })
        }
    }, [location.search, messages.length, isGenerating, contextState, navigate, location.pathname])

    // Step 2: User answered context questions → enrich prompt and generate
    const handleContextSubmit = async (answers) => {
        setContextState('done')
        setContextQuestions([])
        
        let enrichedPrompt = pendingPrompt
        if (answers && answers.length > 0) {
            const contextBlock = answers
                .filter(a => a.answer?.trim())
                .map(a => `- ${a.question}: ${a.answer}`)
                .join('\n')
            if (contextBlock) {
                enrichedPrompt = `${pendingPrompt}\n\n[User context]\n${contextBlock}`
            }
        }
        startGeneration(enrichedPrompt, projectId)
    }

    // User skipped context collection → generate with original prompt
    const handleContextSkip = () => {
        setContextState('done')
        setContextQuestions([])
        startGeneration(pendingPrompt, projectId)
    }

    const actionChips = [
        "Verify it works",
        "Add authentication",
        "Make it mobile responsive",
        "Add dark mode",
        "Deploy to production"
    ]

    const handleChipClick = (chip) => {
        setInput(chip)
        // input field focuses automatically via standard interaction, but could add ref
    }

    const getLogIcon = (type) => {
        switch (type) {
            case 'Thinking': return <Lightbulb size={16} className="cp-log-icon cp-amber" />
            case 'Reading': return <RefreshCw size={16} className="cp-log-icon cp-gray" />
            case 'Installing': return <Package size={16} className="cp-log-icon cp-blue" />
            case 'Editing': return <FileEdit size={16} className="cp-log-icon cp-green" />
            case 'Creating': return <FilePlus size={16} className="cp-log-icon cp-teal" />
            default: return null
        }
    }

    return (
        <div className="chat-panel">
            <div className="cp-messages">
                {messages.length === 0 && (
                    <div className="cp-empty">
                        <Bot size={32} className="cp-empty-icon" />
                        <p>Describe what you want to build or change.</p>
                        <p className="cp-empty-hint">Try: "Add a dark navbar with a logo"</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`cp-msg cp-msg-${msg.role}`}>
                        <div className="cp-msg-avatar">
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className="cp-msg-content">
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}

                {/* AI GENERATION STREAM STATES */}
                {(isGenerating || generationPhase !== 'idle') && (
                    <div className="cp-ai-stream-container">
                        
                        {/* STATE 1: Thinking */}
                        {(generationPhase === 'thinking' || generationPhase === 'streaming_logs' || generationLogs.length > 0) && (
                            <div className="cp-thought-row" onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}>
                                <Lightbulb size={16} className="cp-amber cp-pulse" />
                                <span>Thinking...</span>
                                {isThoughtExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        )}

                        {isThoughtExpanded && (
                            <div className="cp-thought-box">
                                <i>I need to parse the user's intent, review the existing layout, and determine which files to read, edit, or create to fulfill the requirement safely.</i>
                            </div>
                        )}

                        {/* STATE 2: Streaming Logs */}
                        {generationLogs.length > 0 && (
                            <div className="cp-logs-list">
                                {generationLogs.map((log, idx) => (
                                    <div key={idx} className="cp-log-row cp-slide-up">
                                        {getLogIcon(log.type)}
                                        <span className="cp-log-type">{log.type}</span>
                                        {log.file && <span className="cp-log-pill">{log.file}</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* STATE 3: Finished Thinking */}
                        {(generationPhase === 'finished_thinking' || generationPhase === 'complete') && (
                            <div className="cp-finished-text">Finished thinking</div>
                        )}

                        {/* STATE 4: Summary Paragraph */}
                        {generationPhase === 'complete' && (
                            <p className="cp-summary-paragraph">
                                {generationSummary.replace('Simple Task Hub', '')}
                                <strong>Simple Task Hub</strong>
                                {generationSummary.split('Simple Task Hub')[1]}
                            </p>
                        )}

                        {/* COMPLETION CARD */}
                        {generationPhase === 'complete' && (
                            <div className="cp-completion-card">
                                <div className="cp-cc-header">
                                    <span className="cp-cc-title">{generationTaskName}</span>
                                    <button className="cp-icon-btn"><Bookmark size={18} /></button>
                                </div>

                                <div className="cp-cc-buttons">
                                    <button 
                                        className="cp-cc-btn"
                                        onClick={() => {
                                            if (!isIdeVisible) setIdeVisible(true);
                                            setDetailsExpanded(!isDetailsExpanded);
                                        }}
                                    >
                                        {isDetailsExpanded && isIdeVisible ? 'Hide details' : 'Show details'}
                                    </button>
                                    <button 
                                        className="cp-cc-btn"
                                        onClick={() => {
                                            setIdeVisible(true);
                                            setDetailsExpanded(false);
                                        }}
                                    >
                                        Preview
                                    </button>
                                </div>

                                <p className="cp-cc-bottom-summary">
                                    Built <strong>Simple Task Hub</strong> — interface updated with new layout components.
                                </p>

                                <div className="cp-cc-actions">
                                    <button className="cp-icon-btn"><ThumbsUp size={16} /></button>
                                    <button className="cp-icon-btn"><ThumbsDown size={16} /></button>
                                    <button className="cp-icon-btn"><Copy size={16} /></button>
                                    <button className="cp-icon-btn"><MoreHorizontal size={16} /></button>
                                </div>
                            </div>
                        )}

                        {/* ACTION CHIPS */}
                        {generationPhase === 'complete' && (
                            <div className="cp-chips-container">
                                {actionChips.map((chip, idx) => (
                                    <button key={idx} className="cp-chip" onClick={() => handleChipClick(chip)}>
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* V3.0: CONTEXT CHIPS — shown between message and generation */}
            {contextState === 'loading' && (
                <div className="cp-ctx-loading">
                    <Lightbulb size={14} className="cp-amber cp-pulse" />
                    <span>Thinking of questions...</span>
                </div>
            )}
            {contextState === 'awaiting_answers' && (
                <ContextChips
                    questions={contextQuestions}
                    onSubmit={handleContextSubmit}
                    onSkip={handleContextSkip}
                />
            )}

            {/* INPUT AREA */}
            <div className="cp-input-area">
                <div className="cp-input-tabs">
                    <button className="cp-input-tab-left">&larr; Back to Preview</button>
                    <button className="cp-input-tab-right active">Details</button>
                </div>
                
                <div className="cp-input-box">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Simple Task Hub..."
                        className="cp-textarea"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                    />
                    
                <div className="cp-input-toolbar">
                        <div className="cp-toolbar-left">
                            <button className="cp-tiny-btn"><Plus size={18} /></button>
                            <div className="cp-model-selector">
                                <select 
                                    value={selectedModel} 
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="cp-model-dropdown"
                                    disabled={isGenerating}
                                >
                                    <option value="qwen">⚡ Qwen (Local)</option>
                                    <option value="mistral">☁️ Mistral (Cloud)</option>
                                </select>
                            </div>
                        </div>
                        <div className="cp-toolbar-right">
                            <button className="cp-tiny-btn"><MessageSquare size={18} /></button>
                            <button className="cp-tiny-btn"><Mic size={18} /></button>
                            <button 
                                className={`cp-send-btn ${input.trim() ? 'active' : ''}`}
                                onClick={handleSend}
                                disabled={!input.trim() || isGenerating}
                            >
                                <ArrowUp size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
