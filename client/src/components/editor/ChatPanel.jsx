import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { 
    Send, Bot, User, Lightbulb, RefreshCw, Package, 
    FileEdit, FilePlus, Bookmark,
    Plus, 
    Mic, ArrowUp, ArrowRight, ChevronRight, ChevronDown,
    Palette, ExternalLink, Sparkles, Camera, Paperclip, X,
    Eye, Upload, Monitor, ImagePlus, Zap, Copy, Check,
    Undo2, ThumbsUp, ThumbsDown, MoreHorizontal, Square,
    Trash2, Share2, Rocket, Settings2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useChatStore } from '../../stores/chatStore'
import { useEditorStore } from '../../stores/editorStore'
import WebsiteStylePicker from './WebsiteStylePicker'
import './ChatPanel.css'

export default function ChatPanel() {
    const { projectId } = useParams()
    const location = useLocation()
    const { 
        messages, isGenerating, generationPhase, generationLogs, 
        generationSummary, generationTaskName, isDetailsExpanded,
        isIdeVisible, selectedModel, generationSiteType,
        isConfigured, addMessage, startGeneration, setDetailsExpanded, 
        setIdeVisible, setSelectedModel, completeProjectConfig, setActiveView,
        isVisualEditMode, toggleVisualEditMode,
        selectedElements, removeSelectedElement, clearSelectedElements,
        thinkingMessage, isEditMode, memberRole,
        cancelGeneration,
        configStep, setConfigStep,
        styleOptions, setStyleOptions
    } = useChatStore()
    const { getToken } = useAuth()
    
    const [input, setInput] = useState('')
    const [isThoughtExpanded, setIsThoughtExpanded] = useState(false)
    const [attachments, setAttachments] = useState([])
    const [showAttachMenu, setShowAttachMenu] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [cycleIndex, setCycleIndex] = useState(0)
    const [isCompact, setIsCompact] = useState(false)
    const [copiedId, setCopiedId] = useState(null)
    const [lightboxSrc, setLightboxSrc] = useState(null)
    const [fileSnapshot, setFileSnapshot] = useState(null) // For undo: snapshot of files before generation
    const [lastUserPrompt, setLastUserPrompt] = useState('') // For undo: re-fill input
    
    const messagesEndRef = useRef(null)
    const fileInputRef = useRef(null)
    const attachMenuRef = useRef(null)
    const panelRef = useRef(null)

    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false)
    const moreMenuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
                setMoreMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // If navigated from TemplatesPage or Dashboard with prompt/templateId in URL, pre-fill it
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const urlTemplateId = params.get('templateId')
        const urlPrompt = params.get('prompt')
        
        setStyleOptions(prev => {
            const next = { ...prev }
            if (urlTemplateId && !prev.templateId) next.templateId = urlTemplateId
            if (urlPrompt && !prev.initialPrompt) next.initialPrompt = urlPrompt
            return next
        })
    }, [location.search])

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

    // Remove a selected element chip — notify BOTH the store AND the iframe
    const handleRemoveElement = useCallback((xpath) => {
        removeSelectedElement(xpath)
        // Tell the iframe to remove the visual highlight for this element
        const iframe = document.querySelector('.pp-iframe-wrapper iframe')
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage({ type: 'VE_DESELECT', xpath }, '*')
            } catch (e) { /* sandbox may block */ }
        }
    }, [removeSelectedElement])

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

    const handleSend = async () => {
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

        setInput('')
        setAttachments([])
        
        if (!isConfigured) {
            addMessage({ role: 'user', content: messageContent, images: msgImages.length > 0 ? msgImages : undefined })
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
            addMessage({ role: 'user', content: messageContent, images: msgImages.length > 0 ? msgImages : undefined })
            setTimeout(() => {
                addMessage({ 
                    role: 'assistant', 
                    content: "Hello! I'm your AI builder. How can I help you with your website today?" 
                })
            }, 600)
            return
        }

        // Improved prompt quality check: detect gibberish, vague, and non-actionable prompts
        const isNonActionablePrompt = (text) => {
            const cleaned = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase().trim()
            const words = cleaned.split(/\s+/).filter(w => w.length > 0)
            
            // Single character or empty
            if (cleaned.length < 2) return true
            
            // All same character repeated
            if (/^(.)\1+$/.test(cleaned.replace(/\s/g, ''))) return true
            
            // Keyboard mash: high consonant ratio with no real words
            const noSpaces = cleaned.replace(/\s/g, '')
            const vowelCount = (noSpaces.match(/[aeiou]/gi) || []).length
            const vowelRatio = noSpaces.length > 0 ? vowelCount / noSpaces.length : 0
            if (noSpaces.length > 4 && vowelRatio < 0.12) return true
            
            // Common throwaway / vague single words that aren't website instructions
            const throwawayWords = new Set([
                'this', 'that', 'what', 'yes', 'no', 'ok', 'okay', 'sure', 'test',
                'testing', 'junky', 'junk', 'stuff', 'thing', 'things', 'idk', 'hmm',
                'um', 'uh', 'huh', 'nah', 'nope', 'yep', 'yeah', 'yea', 'lol', 'lmao',
                'haha', 'bruh', 'bro', 'dude', 'cool', 'nice', 'wow', 'meh', 'blah',
                'asdf', 'qwer', 'zxcv', 'sdfg', 'hjkl', 'nothing', 'something',
                'whatever', 'random', 'check', 'see', 'try', 'done', 'thanks', 'thank',
                'bye', 'stop', 'wait', 'go', 'help', 'why', 'how', 'who', 'when',
                'where', 'the', 'a', 'an', 'it', 'is', 'was', 'are', 'do', 'does',
                'can', 'will', 'just', 'only', 'here', 'there', 'now', 'then',
                'please', 'plz', 'pls', 'aaa', 'bbb', 'xxx', 'zzz', 'abc'
            ])
            
            // If it's just 1-2 throwaway words, it's not actionable
            if (words.length <= 2 && words.every(w => throwawayWords.has(w))) return true
            
            // If it's a single word and not a clear website action keyword, reject
            const actionKeywords = new Set([
                'add', 'create', 'build', 'make', 'change', 'update', 'fix', 'remove',
                'delete', 'move', 'style', 'color', 'font', 'resize', 'align', 'center',
                'navbar', 'footer', 'header', 'hero', 'section', 'page', 'button',
                'form', 'image', 'text', 'link', 'menu', 'sidebar', 'card', 'grid',
                'responsive', 'mobile', 'dark', 'light', 'animate', 'animation',
                'deploy', 'publish', 'portfolio', 'blog', 'ecommerce', 'landing',
                'redesign', 'improve', 'refactor', 'optimize'
            ])
            if (words.length === 1 && !actionKeywords.has(words[0])) return true
            
            return false
        }

        if (isNonActionablePrompt(trimmed) && !(selectedElements && selectedElements.length > 0)) {
            addMessage({ role: 'user', content: messageContent, images: msgImages.length > 0 ? msgImages : undefined })
            setTimeout(() => {
                addMessage({ 
                    role: 'assistant', 
                    content: `It looks like that message might have been accidental or doesn't have enough context for me to work with! Could you describe what you'd like me to do more specifically? Here are some ideas:\n\n• "Add a contact form with email and phone fields"\n• "Change the color scheme to dark mode"\n• "Make the hero section text bigger and bolder"\n• "Add a testimonials section with real user reviews"\n• "Create a responsive navbar with a logo"` 
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
            // Build RICH descriptors for the backend (includes section context so AI can tell apart two <a> tags)
            const elementDescs = selectedElements.map((el, i) => {
                const tag = el.tag || 'element'
                const id = el.id ? `#${el.id}` : ''
                const text = el.text ? ` containing "${el.text.substring(0, 60)}"` : ''
                // Extract parent section hint from xpath (e.g., "nav" or "footer")
                const xpathParts = (el.xpath || '').split('/')
                const sectionHint = xpathParts.find(p => /^(nav|header|footer|section|main|aside)\[/.test(p))
                const sectionStr = sectionHint ? ` in <${sectionHint.replace(/\[\d+\]/, '')}>` : ''
                return `${i + 1}. <${tag}${id}>${text}${sectionStr}`
            }).join('\n')
            backendPrompt = `[Visual Edit on ${selectedElements.length} element(s):\n${elementDescs}]\n${messageContent}`
        }

        // Collect actual attachment data for the AI
        const imageData = attachments.filter(a => a.type === 'image').map(a => a.preview)
        const fileData = attachments.filter(a => a.type === 'file').map(a => ({ name: a.name, content: a.content }))

        // Snapshot current files for undo before generation replaces them
        const currentFiles = useEditorStore.getState().files
        const currentHtml = useEditorStore.getState().htmlContent
        setFileSnapshot({ files: { ...currentFiles }, htmlContent: currentHtml })
        setLastUserPrompt(trimmed)

        // Show clean message to user (store visual edit elements separately for rendering tag chips)
        addMessage({ 
            role: 'user', 
            content: messageContent,
            visualEditElements: visualEditElements,
            images: imageData.length > 0 ? imageData : undefined
        })

        const token = await getToken()
        startGeneration(backendPrompt, projectId, token, styleOptions, imageData, fileData)
    }

    const actionChips = [
        "Verify it works",
        "Add authentication",
        "Make it mobile responsive",
        "Add dark mode",
        "Deploy to production"
    ]

    const handleChipClick = (chip) => { setInput(chip) }

    // Copy message text
    const handleCopy = (msgId, text) => {
        // Strip attachment description tags for cleaner copy
        const cleaned = text.replace(/\[Attached (?:image|file): [^\]]+\]\n?/g, '').trim()
        navigator.clipboard.writeText(cleaned)
        setCopiedId(msgId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Strip attachment tags and markdown symbols from displayed chat messages
    const cleanMessageContent = (content) => {
        return content
            .replace(/\[Visual Edit on[^\]]*\]\n?/g, '')        // strip visual edit prefix
            .replace(/\[Visual Edit on \d+ element\(s\):[^\]]*\]\n?/g, '') // multi-element version
            .replace(/\n?\[Attached (?:image|file): [^\]]+\]/g, '') // strip attachment markers
            .replace(/\*\*([^*]+)\*\*/g, '$1')                   // **bold** → plain
            .replace(/\*([^*]+)\*/g, '$1')                       // *italic* → plain
            .replace(/^#{1,6}\s+/gm, '')                         // # headers → plain
            .trim()
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
        const token = await getToken()
        
        let userContent = ''
        let assistantNext = ''
        
        if (configStep === 0) {
            userContent = 'The name is ' + styleOptions.websiteName + '.'
            assistantNext = "Nice name! Can you give me a short description of what your website or business is about?"
        } else if (configStep === 1) {
            userContent = 'Description: ' + styleOptions.description
            // If templateId is already set (from TemplatesPage URL), skip category step
            if (styleOptions.templateId) {
                addMessage({ role: 'user', content: userContent })
                setTimeout(async () => {
                    addMessage({ role: 'assistant', content: "Perfect! Using your selected theme. Let's build! 🚀" })
                    const freshToken = await getToken()
                    completeProjectConfig(projectId, freshToken, styleOptions)
                }, 600)
                return
            }
            assistantNext = "Perfect! Now pick a category and theme that matches your vision."
        } else if (configStep === 2) {
            if (!styleOptions.templateId) {
                return // Don't proceed without a theme selected
            }
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

    const handleStop = () => {
        cancelGeneration()
        addMessage({ 
            role: 'assistant', 
            content: 'Generation stopped. Feel free to try a different prompt!' 
        })
    }

    const handleUndo = () => {
        if (!fileSnapshot) return
        const editorStore = useEditorStore.getState()
        // Restore the previous snapshot
        editorStore.setFiles(fileSnapshot.files)
        editorStore.setPreview('srcdoc', fileSnapshot.htmlContent)
        // Reset generation UI state
        const store = useChatStore.getState()
        store._sync({ 
            generationPhase: 'idle', 
            generationLogs: [], 
            generationSummary: '', 
            generationTaskName: '' 
        })
        // Pre-fill the input with the last user prompt so they can edit and re-send
        setInput(lastUserPrompt)
        setFileSnapshot(null)
        addMessage({ 
            role: 'assistant', 
            content: '↩️ Changes undone. Your previous version has been restored. Edit your prompt and try again!' 
        })
    }

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
                                        <div key={i} className="cp-msg-image-wrap" onClick={() => setLightboxSrc(src)}>
                                            <img src={src} alt="Attachment" className="cp-msg-image" />
                                            <div className="cp-msg-image-overlay">
                                                <Eye size={14} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p>{cleanMessageContent(msg.content)}</p>
                            <button 
                                className={`cp-copy-btn ${copiedId === msg.id ? 'copied' : ''}`}
                                onClick={() => handleCopy(msg.id, msg.content)}
                                title="Copy message"
                            >
                                {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
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
                                <div className="cp-action-bar">
                                    <button className="cp-action-icon" title="Undo" onClick={handleUndo} disabled={!fileSnapshot}><Undo2 size={16} /></button>
                                    <button className="cp-action-icon" title="Good response"><ThumbsUp size={16} /></button>
                                    <button className="cp-action-icon" title="Bad response"><ThumbsDown size={16} /></button>
                                    <button 
                                        className={`cp-action-icon ${copiedId === 'edit-summary' ? 'active' : ''}`} 
                                        title="Copy" 
                                        onClick={() => handleCopy('edit-summary', generationSummary)}
                                    >
                                        {copiedId === 'edit-summary' ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                    <div className="cp-more-menu-wrapper" ref={moreMenuRef} style={{position: 'relative'}}>
                                        <button 
                                            className={`cp-action-icon ${isMoreMenuOpen ? 'active' : ''}`} 
                                            title="More"
                                            onClick={() => setMoreMenuOpen(!isMoreMenuOpen)}
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {isMoreMenuOpen && (
                                            <div className="cp-more-dropdown active" style={{position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '4px', minWidth: '140px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                                <button className="cp-more-item" onClick={() => { setMoreMenuOpen(false); toast('Features settings triggered'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Settings2 size={14} /> Features
                                                </button>
                                                <button className="cp-more-item" onClick={() => { setMoreMenuOpen(false); toast('Share version functionality triggered'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Share2 size={14} /> Share
                                                </button>
                                                <button className="cp-more-item" onClick={() => { setMoreMenuOpen(false); toast('Deploying version...'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Rocket size={14} /> Deploy
                                                </button>
                                                <div className="cp-more-divider" style={{height: '1px', background: '#334155', margin: '2px 0'}}></div>
                                                <button className="cp-more-item delete" onClick={() => { 
                                                    setMoreMenuOpen(false); 
                                                    if(window.confirm('Delete this version?')) {
                                                        handleUndo();
                                                        useChatStore.getState().setGenerationPhase('idle');
                                                        useChatStore.getState().setGenerationSummary('');
                                                        toast.success('Version deleted successfully');
                                                    }
                                                }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
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
                                <div className="cp-action-bar">
                                    <button className="cp-action-icon" title="Undo" onClick={handleUndo} disabled={!fileSnapshot}><Undo2 size={16} /></button>
                                    <button className="cp-action-icon" title="Good response"><ThumbsUp size={16} /></button>
                                    <button className="cp-action-icon" title="Bad response"><ThumbsDown size={16} /></button>
                                    <button 
                                        className={`cp-action-icon ${copiedId === 'gen-summary' ? 'active' : ''}`} 
                                        title="Copy" 
                                        onClick={() => handleCopy('gen-summary', generationSummary)}
                                    >
                                        {copiedId === 'gen-summary' ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                    <div className="cp-more-menu-wrapper" ref={moreMenuRef} style={{position: 'relative'}}>
                                        <button 
                                            className={`cp-action-icon ${isMoreMenuOpen ? 'active' : ''}`} 
                                            title="More"
                                            onClick={() => setMoreMenuOpen(!isMoreMenuOpen)}
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {isMoreMenuOpen && (
                                            <div className="cp-more-dropdown active" style={{position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '4px', minWidth: '140px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                                <button className="cp-more-item" onClick={() => { setMoreMenuOpen(false); toast('Features settings triggered'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Settings2 size={14} /> Features
                                                </button>
                                                <button className="cp-more-item" onClick={() => { setMoreMenuOpen(false); toast('Share version functionality triggered'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Share2 size={14} /> Share
                                                </button>
                                                <button className="cp-more-item" onClick={() => { setMoreMenuOpen(false); toast('Deploying version...'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Rocket size={14} /> Deploy
                                                </button>
                                                <div className="cp-more-divider" style={{height: '1px', background: '#334155', margin: '2px 0'}}></div>
                                                <button className="cp-more-item delete" onClick={() => { 
                                                    setMoreMenuOpen(false); 
                                                    if(window.confirm('Delete this version?')) {
                                                        handleUndo();
                                                        useChatStore.getState().setGenerationPhase('idle');
                                                        useChatStore.getState().setGenerationSummary('');
                                                        toast.success('Version deleted successfully');
                                                    }
                                                }} style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'}} onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    <>
                                        <img src={att.preview} alt={att.name} />
                                        <div className="cp-attachment-preview-overlay" onClick={() => setLightboxSrc(att.preview)}>
                                            <Eye size={16} />
                                        </div>
                                    </>
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
                                <button className="cp-el-tag-x" onClick={() => handleRemoveElement(el.xpath)}>
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Viewer RBAC banner */}
                {memberRole === 'viewer' && (
                    <div style={{
                        padding: '8px 14px', margin: '0 0 8px 0',
                        background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '8px', fontSize: '12px', color: '#818cf8',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <Eye size={13} /> You have view-only access to this workspace.
                    </div>
                )}

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={memberRole === 'viewer' ? 'View-only mode — editing disabled' : 'Ask Simple Task Hub...'}
                    className="cp-textarea"
                    rows={1}
                    disabled={memberRole === 'viewer'}
                    style={memberRole === 'viewer' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => setShowAttachMenu(!showAttachMenu)}
                                disabled={memberRole === 'viewer'}
                                style={memberRole === 'viewer' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                                disabled={isGenerating || memberRole === 'viewer'}
                                style={memberRole === 'viewer' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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
                            title={memberRole === 'viewer' ? "View-only mode — visual edits disabled" : "Visual edits"}
                            disabled={memberRole === 'viewer'}
                            style={memberRole === 'viewer' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <span>✏️</span>{!isCompact && <span className="cp-ve-label">Visual edits</span>}
                        </button>
                        <button 
                            className="cp-tiny-btn" 
                            title={memberRole === 'viewer' ? "Disabled" : "Mic"}
                            disabled={memberRole === 'viewer'}
                            style={memberRole === 'viewer' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <Mic size={16} />
                        </button>
                        {isGenerating ? (
                            <button 
                                className='cp-send-btn active cp-stop-btn'
                                onClick={handleStop}
                                title="Stop generation"
                            >
                                <Square size={14} fill="currentColor" />
                            </button>
                        ) : (
                            <button 
                                className={'cp-send-btn' + (canSend && memberRole !== 'viewer' ? ' active' : '')}
                                onClick={handleSend}
                                disabled={!canSend || memberRole === 'viewer'}
                            >
                                <ArrowUp size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Lightbox */}
            {lightboxSrc && (
                <div className="cp-lightbox" onClick={() => setLightboxSrc(null)}>
                    <div className="cp-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={lightboxSrc} alt="Preview" />
                        <button className="cp-lightbox-close" onClick={() => setLightboxSrc(null)}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}

function getTagIcon(tag) {
    if (!tag) return '?'
    const map = { h1: 'H', h2: 'H', h3: 'H', h4: 'H', p: 'P', span: 'S', div: 'D', a: 'A', button: 'B', input: 'I', img: 'I', section: 'S', nav: 'N', header: 'H', footer: 'F' }
    return map[tag.toLowerCase()] || tag[0]?.toUpperCase() || '?'
}
