import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { 
    Send, Bot, User, Lightbulb, RefreshCw, Package, 
    FileEdit, FilePlus, Bookmark,
    Plus, 
    Mic, ArrowUp, ArrowRight, ChevronRight, ChevronDown,
    Palette, ExternalLink, Sparkles, Camera, Paperclip, X,
    Eye, Upload, Monitor, ImagePlus, Zap
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import WebsiteStylePicker from './WebsiteStylePicker'
import './ChatPanel.css'

export default function ChatPanel() {
    const { projectId } = useParams()
    const { 
        messages, isGenerating, generationPhase, generationLogs, 
        generationSummary, generationTaskName, isDetailsExpanded,
        isIdeVisible, selectedModel, generationSiteType,
        isConfigured, addMessage, startGeneration, setDetailsExpanded, 
        setIdeVisible, setSelectedModel, completeProjectConfig, setActiveView,
        isVisualEditMode, toggleVisualEditMode,
        selectedElements, removeSelectedElement,
        thinkingMessage, isEditMode
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
    const [attachments, setAttachments] = useState([])
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [cycleIndex, setCycleIndex] = useState(0)
    const [isCompact, setIsCompact] = useState(false)
    
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)
    const attachMenuRef = useRef(null)
    const panelRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, generationPhase, generationLogs])

    // Auto-cycle thinking phrases when no backend message is available
    const thinkingPhrases = [
        'Thinking...', 'Planning the layout...', 'Diving deep...', 
        'Cooking up something great...', 'Almost there...'
    ]
    useEffect(() => {
        if (!isGenerating) { setCycleIndex(0); return }
        const interval = setInterval(() => {
            setCycleIndex(prev => (prev + 1) % thinkingPhrases.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [isGenerating])

    // ResizeObserver: detect panel width for compact/full mode
    useEffect(() => {
        const el = panelRef.current
        if (!el) return
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                setIsCompact(entry.contentRect.width < 320)
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Close attach menu on outside click
    useEffect(() => {
        if (!showAttachMenu) return
        const handler = (e) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
                setShowAttachMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showAttachMenu])

    // File processing
    const processFiles = useCallback((fileList) => {
        Array.from(fileList).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (ev) => {
                    setAttachments(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        file,
                        preview: ev.target.result,
                        type: 'image',
                        name: file.name
                    }])
                }
                reader.readAsDataURL(file)
            } else {
                const reader = new FileReader()
                reader.onload = (ev) => {
                    setAttachments(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        file,
                        preview: null,
                        type: 'file',
                        name: file.name,
                        content: ev.target.result
                    }])
                }
                reader.readAsText(file)
            }
        })
    }, [])

    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id))
    }

    // Drag and drop
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true) }
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false) }
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files)
        }
    }

    // Screenshot
    const handleScreenshot = () => {
        setShowAttachMenu(false)
        try {
            const iframe = document.querySelector('.pp-iframe-wrapper iframe')
            if (!iframe) {
                addMessage({ role: 'assistant', content: 'No preview available to screenshot. Generate a website first!' })
                return
            }
            addMessage({ role: 'assistant', content: '📸 Screenshot captured! Use ⌘+Shift+4 (Mac) or Win+Shift+S (Windows) to capture and paste your screenshot, or drag & drop the image here.' })
        } catch (err) {
            addMessage({ role: 'assistant', content: 'Screenshot capture failed. Use your OS screenshot tool instead.' })
        }
    }

    const handleSend = () => {
        const trimmed = input.trim()
        const hasAttachments = attachments.length > 0
        if (!trimmed && !hasAttachments) return
        if (isGenerating) return

        let messageContent = trimmed
        const attachDescs = []
        
        attachments.forEach(att => {
            if (att.type === 'image') attachDescs.push('[Attached image: ' + att.name + ']')
            else if (att.type === 'file') attachDescs.push('[Attached file: ' + att.name + ']')
        })

        if (attachDescs.length > 0) {
            messageContent = (trimmed ? trimmed + '\n\n' : '') + attachDescs.join('\n')
        }

        // Add visual edit elements context if present
        if (selectedElements && selectedElements.length > 0) {
            const elementDescs = selectedElements.map(el => {
                const tag = el.tag || 'element'
                const id = el.id ? `#${el.id}` : ''
                const text = el.text ? ` ("${el.text.substring(0, 40)}")` : ''
                return `<${tag}${id}>${text}`
            }).join(', ')
            messageContent = `[Visual Edit on: ${elementDescs}]\n${messageContent}`
        }

        const msgImages = attachments
            .filter(a => a.type === 'image')
            .map(a => a.preview)

        addMessage({ 
            role: 'user', 
            content: messageContent,
            images: msgImages.length > 0 ? msgImages : undefined
        })
        
        setInput('')
        setAttachments([])
        
        if (!isConfigured) {
            setTimeout(() => {
                addMessage({ 
                    role: 'assistant', 
                    content: "I'm still waiting for you to complete the design setup above! Please finish the steps so I can start building your site correctly. 😊" 
                })
            }, 600)
            return
        }

        const greetings = ['hi', 'hello', 'hey', 'yo', 'sup', 'hola']
        if (greetings.includes(trimmed.toLowerCase().replace(/[?.,!]/g, ''))) {
            setTimeout(() => {
                addMessage({ 
                    role: 'assistant', 
                    content: "Hello! I'm your AI builder. How can I help you with your website today?" 
                })
            }, 600)
            return
        }

        // If visual edit elements are selected, build context for backend but DON'T pollute the user message
        let backendPrompt = messageContent
        let visualEditElements = null
        if (selectedElements && selectedElements.length > 0) {
            visualEditElements = selectedElements.map(el => ({
                tag: el.tag || 'element',
                id: el.id || null,
                text: el.text ? el.text.substring(0, 40) : null
            }))
            const elementDescs = visualEditElements.map(el => {
                const id = el.id ? `#${el.id}` : ''
                const text = el.text ? ` ("${el.text}")` : ''
                return `<${el.tag}${id}>${text}`
            }).join(', ')
            backendPrompt = `[Visual Edit on: ${elementDescs}]\n${messageContent}`
        }

        // Collect actual attachment data for the AI
        const imageData = attachments.filter(a => a.type === 'image').map(a => a.preview)
        const fileData = attachments.filter(a => a.type === 'file').map(a => ({ name: a.name, content: a.content }))

        // Show clean message to user (store visual edit elements separately for rendering tag chips)
        addMessage({ 
            role: 'user', 
            content: messageContent,
            visualEditElements: visualEditElements,
            images: imageData.length > 0 ? imageData : undefined
        })

        startGeneration(backendPrompt, projectId, null, styleOptions, imageData, fileData)
    }

    const actionChips = [
        "Verify it works",
        "Add authentication",
        "Make it mobile responsive",
        "Add dark mode",
        "Deploy to production"
    ]

    const handleChipClick = (chip) => { setInput(chip) }

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
        const token = await getToken()
        
        let userContent = ''
        let assistantNext = ''
        
        if (configStep === 0) {
            userContent = 'The name is **' + styleOptions.websiteName + '**.'
            assistantNext = "Nice name! Can you give me a short description of what your website or business is about?"
        } else if (configStep === 1) {
            userContent = 'Description: ' + styleOptions.description
            assistantNext = "Perfect. Lastly, do you have a logo URL or specific hex colors you'd like to use? (Optional)"
        } else if (configStep === 2) {
            completeProjectConfig(projectId, token, styleOptions)
            return
        }

        addMessage({ role: 'user', content: userContent })
        
        setTimeout(() => {
            addMessage({ role: 'assistant', content: assistantNext })
            setConfigStep(prev => prev + 1)
        }, 600)
    }

    const canSend = (input.trim().length > 0 || attachments.length > 0) && !isGenerating

    return (
        <div 
            ref={panelRef}
            className={'chat-panel' + (isDragOver ? ' cp-drag-over' : '')}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragOver && (
                <div className="cp-drag-overlay">
                    <div className="cp-drag-content">
                        <Upload size={40} />
                        <p>Drop files here</p>
                        <span>Images, screenshots, or code files</span>
                    </div>
                </div>
            )}

            <div className="cp-messages">
                {messages.length === 0 && (
                    <div className="cp-empty">
                        <Bot size={32} className="cp-empty-icon" />
                        <p>Describe what you want to build or change.</p>
                        <p className="cp-empty-hint">Try: &quot;Add a dark navbar with a logo&quot;</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={'cp-msg cp-msg-' + msg.role}>
                        <div className="cp-msg-avatar">
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className="cp-msg-content">
                            {/* Visual edit tag chips (above message) */}
                            {msg.visualEditElements && msg.visualEditElements.length > 0 && (
                                <div className="cp-msg-tags">
                                    {msg.visualEditElements.map((el, i) => (
                                        <span key={i} className={`cp-el-tag cp-el-tag-${el.tag}`}>
                                            <span className="cp-el-tag-icon">{getTagIcon(el.tag)}</span>
                                            {el.tag}{el.id ? `#${el.id}` : ''}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {msg.images && msg.images.length > 0 && (
                                <div className="cp-msg-images">
                                    {msg.images.map((src, i) => (
                                        <img key={i} src={src} alt="Attachment" className="cp-msg-image" />
                                    ))}
                                </div>
                            )}
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}

                {/* AI GENERATION STREAM STATES */}
                {(isGenerating || generationPhase !== 'idle') && (
                    <div className="cp-ai-stream-container">
                        
                        {/* Dynamic Thinking Indicator */}
                        {(generationPhase === 'thinking' || generationPhase === 'streaming_logs' || generationLogs.length > 0) && isGenerating && (
                            <div className="cp-thought-row" onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}>
                                <Lightbulb size={16} className="cp-amber cp-pulse" />
                                <span>{thinkingMessage || thinkingPhrases[cycleIndex]}</span>
                                {isThoughtExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                        )}

                        {isThoughtExpanded && generationLogs.length > 0 && (
                            <div className="cp-thought-box">
                                <em>{thinkingMessage || 'Analyzing your request and determining the best approach...'}</em>
                            </div>
                        )}

                        {generationLogs.length > 0 && (
                            <div className="cp-logs-list">
                                {generationLogs.map((log, idx) => (
                                    <div key={idx} className="cp-log-row cp-slide-up">
                                        {getLogIcon(log.type)}
                                        <span className="cp-log-type">{log.type}</span>
                                        <span className="cp-log-pill">{log.file}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* EDIT MODE: Lovable-style compact card */}
                        {generationPhase === 'complete' && isEditMode && (
                            <>
                                <div className="cp-edit-card">
                                    <div className="cp-edit-card-header">
                                        <span className="cp-edit-card-title">{generationTaskName}</span>
                                        <button className="cp-icon-btn"><Bookmark size={16} /></button>
                                    </div>
                                    <div className="cp-cc-buttons">
                                        <button className="cp-cc-btn" onClick={() => { setDetailsExpanded(!isDetailsExpanded) }}>
                                            Details
                                        </button>
                                        <button 
                                            className="cp-cc-btn"
                                            onClick={() => {
                                                if (!isIdeVisible) setIdeVisible(true)
                                                setActiveView('preview')
                                            }}
                                        >
                                            <Monitor size={14} /> Preview
                                        </button>
                                    </div>
                                </div>
                                <div className="cp-edit-summary">
                                    <p>{generationSummary}</p>
                                </div>
                            </>
                        )}

                        {/* FRESH MODE: Full completion card */}
                        {generationPhase === 'complete' && !isEditMode && (
                            <>
                                {generationSummary && (
                                    <div className="cp-finished-text">
                                        <p className="cp-summary-paragraph">{generationSummary}</p>
                                    </div>
                                )}
                                <div className="cp-completion-card">
                                    <div className="cp-cc-header">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span className="cp-cc-title">{generationTaskName}</span>
                                            {generationSiteType && (
                                                <span style={{ fontSize: '10px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Palette size={10} style={{ color: '#3a3aff' }} /> {generationSiteType} &bull; AI Generated
                                                </span>
                                            )}
                                        </div>
                                        <button className="cp-icon-btn"><Bookmark size={18} /></button>
                                    </div>

                                    <div className="cp-cc-buttons">
                                        <button 
                                            className="cp-cc-btn"
                                            onClick={() => {
                                                if (!isIdeVisible) setIdeVisible(true)
                                                setActiveView('preview')
                                            }}
                                        >
                                            <Monitor size={14} /> Preview
                                        </button>
                                        <button 
                                            className="cp-cc-btn"
                                            onClick={() => {
                                                if (!isIdeVisible) setIdeVisible(true)
                                                setActiveView('code')
                                            }}
                                        >
                                            <ExternalLink size={14} /> View Code
                                        </button>
                                    </div>

                                    {isDetailsExpanded && (
                                        <div className="cp-cc-bottom-summary">
                                            <p>{generationSummary}</p>
                                        </div>
                                    )}

                                    <div className="cp-chips-container">
                                        {actionChips.map(chip => (
                                            <button key={chip} className="cp-chip" onClick={() => handleChipClick(chip)}>
                                                {chip}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* STYLE CONFIGURATOR */}
            {!isConfigured && messages.length > 0 && (
                <div className="website-style-picker-container">
                    <WebsiteStylePicker 
                        value={styleOptions}
                        onChange={setStyleOptions}
                        step={configStep}
                    />
                    <button 
                        style={{
                            width: '100%', padding: '14px',
                            background: configStep === 2 
                                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                                : 'linear-gradient(135deg, #3a8bfd 0%, #4466ff 100%)',
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
                        >
                            &larr; Back to previous step
                        </button>
                    )}
                </div>
            )}

            <div className="cp-input-tabs">
                <button className="cp-input-tab-left">&larr; Back to Preview</button>
                <button className="cp-input-tab-right active">Details</button>
            </div>
            
            <div className="cp-input-box">
                {/* Attachment thumbnails */}
                {attachments.length > 0 && (
                    <div className="cp-attachments-strip">
                        {attachments.map(att => (
                            <div key={att.id} className="cp-attachment-thumb">
                                {att.preview ? (
                                    <img src={att.preview} alt={att.name} />
                                ) : (
                                    <div className="cp-attachment-file">
                                        <Paperclip size={14} />
                                        <span>{att.name}</span>
                                    </div>
                                )}
                                <button className="cp-attachment-remove" onClick={() => removeAttachment(att.id)}>
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Selected element tag chips (always shown when elements selected) */}
                {selectedElements && selectedElements.length > 0 && (
                    <div className="cp-selected-elements">
                        {selectedElements.map((el, i) => (
                            <span key={el.xpath || i} className={`cp-el-tag cp-el-tag-${el.tag}`}>
                                <span className="cp-el-tag-icon">{getTagIcon(el.tag)}</span>
                                {el.tag}{el.id ? `#${el.id}` : ''}
                                <button className="cp-el-tag-x" onClick={() => removeSelectedElement(el.xpath)}>
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

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
                        {/* Attachment menu */}
                        <div className="cp-attach-container" ref={attachMenuRef}>
                            <button 
                                className="cp-tiny-btn" 
                                onClick={() => setShowAttachMenu(!showAttachMenu)}
                            >
                                <Plus size={18} />
                            </button>
                            
                            {showAttachMenu && (
                                <div className="cp-attach-menu">
                                    <button className="cp-attach-item" onClick={() => {
                                        if (fileInputRef.current) fileInputRef.current.click()
                                        setShowAttachMenu(false)
                                    }}>
                                        <ImagePlus size={16} />
                                        <span>Add files or photos</span>
                                    </button>
                                    <button className="cp-attach-item" onClick={handleScreenshot}>
                                        <Camera size={16} />
                                        <span>Take a screenshot</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <input 
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.html,.css,.js,.jsx,.tsx,.json,.txt,.md"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    processFiles(e.target.files)
                                }
                                e.target.value = ''
                            }}
                        />

                        <div className="cp-model-selector">
                            <select 
                                value={selectedModel} 
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className={`cp-model-dropdown ${isCompact ? 'compact' : ''}`}
                                disabled={isGenerating}
                            >
                                {isCompact ? (
                                    <>
                                        <option value="qwen">⚡ Qwen</option>
                                        <option value="mistral">☁️ Mistral</option>
                                        <option value="glm">🌏 GLM-4</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="qwen">⚡ Qwen (Local)</option>
                                        <option value="mistral">☁️ Mistral (Cloud)</option>
                                        <option value="glm">🌏 GLM-4 (Cloud)</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                    <div className="cp-toolbar-right">
                        <button 
                            className={`cp-visual-edit-btn ${isVisualEditMode ? 'active' : ''}`}
                            onClick={toggleVisualEditMode}
                            title="Visual edits"
                        >
                            <span>✏️</span>{!isCompact && <span className="cp-ve-label">Visual edits</span>}
                        </button>
                        <button className="cp-tiny-btn" title="Mic"><Mic size={16} /></button>
                        <button 
                            className={'cp-send-btn' + (canSend ? ' active' : '')}
                            onClick={handleSend}
                            disabled={!canSend}
                        >
                            <ArrowUp size={16} />
                        </button>
                    </div>
                </div>
            </div>


        </div>
    )
}

function getTagIcon(tag) {
    if (!tag) return '?'
    const map = { h1: 'H', h2: 'H', h3: 'H', h4: 'H', p: 'P', span: 'S', div: 'D', a: 'A', button: 'B', input: 'I', img: 'I', section: 'S', nav: 'N', header: 'H', footer: 'F' }
    return map[tag.toLowerCase()] || tag[0]?.toUpperCase() || '?'
}
