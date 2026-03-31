import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { 
    Send, Bot, User, Lightbulb, RefreshCw, Package, 
    FileEdit, FilePlus, Bookmark, ThumbsUp, ThumbsDown, 
    Copy, MoreHorizontal, Plus, MousePointer2, MessageSquare, 
    Mic, ArrowUp, ArrowRight, ChevronRight, ChevronDown, Cpu, Cloud,
    Palette, ExternalLink, Sparkles
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import WebsiteStylePicker from './WebsiteStylePicker'
import './ChatPanel.css'

export default function ChatPanel() {
    const { projectId } = useParams()
    const { 
        messages, isGenerating, generationPhase, generationLogs, 
        generationSummary, generationTaskName, isDetailsExpanded,
        isIdeVisible, selectedModel, generationTheme, generationSiteType,
        isConfigured, addMessage, startGeneration, setDetailsExpanded, 
        setIdeVisible, setSelectedModel, completeProjectConfig
    } = useChatStore()
    const { getToken } = useAuth()
    
    const [input, setInput] = useState('')
    const [isThoughtExpanded, setIsThoughtExpanded] = useState(false)
    const [configStep, setConfigStep] = useState(0)
    const [styleOptions, setStyleOptions] = useState({ 
        theme: 'modern-dark', 
        websiteName: '', 
        description: '', 
        logoUrl: '', 
        brandColors: [] 
    })
    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, generationPhase, generationLogs])

    const handleSend = () => {
        const trimmed = input.trim()
        if (!trimmed || isGenerating) return

        addMessage({ role: 'user', content: trimmed })
        setInput('')
        
        // GATING: Only generate if configured
        if (!isConfigured) {
            // Delay for natural feel
            setTimeout(() => {
                addMessage({ 
                    role: 'assistant', 
                    content: "I'm still waiting for you to complete the design setup above! Please finish the steps so I can start building your site correctly. 😊" 
                });
            }, 600);
            return;
        }

        // CHATBOT LOGIC: Don't build for simple greetings
        const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'hola'];
        if (greetings.includes(trimmed.toLowerCase().replace(/[?.,!]/g, ''))) {
            setTimeout(() => {
                addMessage({ 
                    role: 'assistant', 
                    content: "Hello! I'm your AI builder. How can I help you with your website today?" 
                });
            }, 600);
            return;
        }

        // Pass the style options (theme + brand info) to the generator
        startGeneration(trimmed, projectId, null, styleOptions)
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

    const handleNextStep = async () => {
        const token = await getToken();
        
        let userContent = "";
        let assistantNext = "";
        
        if (configStep === 0) {
            userContent = `The name is **${styleOptions.websiteName}**.`;
            assistantNext = "Nice name! Can you give me a short description of what your website or business is about?";
        } else if (configStep === 1) {
            userContent = `Description: ${styleOptions.description}`;
            assistantNext = "Perfect. Lastly, do you have a logo URL or specific hex colors you'd like to use? (Optional)";
        } else if (configStep === 2) {
            // Finalize!
            completeProjectConfig(projectId, token, styleOptions);
            return;
        }

        addMessage({ role: 'user', content: userContent });
        
        // Delay assistant message slightly for more natural feel
        setTimeout(() => {
            addMessage({ role: 'assistant', content: assistantNext });
            setConfigStep(prev => prev + 1);
        }, 600);
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
                                    <div className="flex flex-col gap-0.5">
                                        <span className="cp-cc-title">{generationTaskName}</span>
                                        {generationTheme && (
                                            <span className="text-[10px] text-[#888] flex items-center gap-1">
                                                <Palette size={10} className="text-[#3a3aff]" /> {generationTheme} • {generationSiteType || 'Website'}
                                            </span>
                                        )}
                                    </div>
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

            {/* INPUT AREA */}
            <div className="cp-input-area">
                {/* CONVERSATIONAL PIPELINE: Multi-step Intake */}
                {!isConfigured && !isGenerating && (
                    <div style={{ marginBottom: '16px' }}>
                        <div className="website-style-picker-container">
                            <WebsiteStylePicker 
                                step={configStep} 
                                value={styleOptions} 
                                onChange={setStyleOptions} 
                            />
                        </div>
                        <button 
                            style={{
                                width: '100%', padding: '14px 20px',
                                background: configStep === 2 
                                    ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' 
                                    : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: '#fff', border: 'none',
                                borderRadius: '14px', fontSize: '14px', fontWeight: '600',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: configStep === 2 
                                    ? '0 4px 20px rgba(139,92,246,0.3)' 
                                    : '0 4px 20px rgba(59,130,246,0.25)',
                                transition: 'all 0.3s ease',
                                marginTop: '12px',
                                letterSpacing: '-0.01em',
                            }}
                            onClick={handleNextStep}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                        >
                            {configStep === 2 ? (
                                <><Sparkles size={16} /> Build Your Website</>
                            ) : (
                                <>Continue <ArrowRight size={16} /></>
                            )}
                        </button>
                        
                        {configStep > 0 && (
                            <button 
                                style={{
                                    width: '100%', padding: '10px',
                                    background: 'transparent', color: 'rgba(255,255,255,0.35)',
                                    border: 'none', borderRadius: '10px',
                                    fontSize: '12px', fontWeight: '500',
                                    cursor: 'pointer', marginTop: '6px',
                                    transition: 'all 0.2s',
                                    letterSpacing: '-0.01em',
                                }}
                                onClick={() => setConfigStep(prev => prev - 1)}
                                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                            >
                                ← Back to previous step
                            </button>
                        )}
                    </div>
                )}

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
