import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { X, Type, Palette as PaletteIcon, Box, Square, ChevronDown, Undo2, Plus, ArrowUp, Mic, MessageSquare } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import './VisualEditPanel.css'

const FONT_SIZES = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','36px','40px','48px','56px','64px','72px','80px','96px']
const FONT_WEIGHTS = ['100','200','300','400','500','600','700','800','900']
const ALIGNMENTS = ['left','center','right','justify']

export default function VisualEditPanel({ onApplyStyle, onClose }) {
    const { projectId } = useParams()
    const { 
        selectedElements, removeSelectedElement, clearSelectedElements,
        isVisualEditMode, setVisualEditMode,
        addMessage, startGeneration, isGenerating
    } = useChatStore()
    const { getToken } = useAuth()
    
    const [activeSection, setActiveSection] = useState('typography')
    const [hasPendingChanges, setHasPendingChanges] = useState(false)
    const [veInput, setVeInput] = useState('')
    
    const activeEl = selectedElements.length > 0 ? selectedElements[0] : null
    const styles = activeEl?.styles || {}
    
    const handleStyleChange = (prop, value) => {
        if (!activeEl) return
        onApplyStyle(activeEl.xpath, prop, value)
        setHasPendingChanges(true)
    }

    const handleClose = () => {
        setVisualEditMode(false)
        if (onClose) onClose()
    }

    const handleBackToChat = () => {
        setVisualEditMode(false)
        if (onClose) onClose()
    }
    
    // Send prompt from visual edit chat input — same pipeline as ChatPanel
    const handleVeSend = async () => {
        const trimmed = veInput.trim()
        if (!trimmed || isGenerating) return

        // Build element context
        let messageContent = trimmed
        if (selectedElements && selectedElements.length > 0) {
            const elementDescs = selectedElements.map(el => {
                const tag = el.tag || 'element'
                const id = el.id ? `#${el.id}` : ''
                const text = el.text ? ` ("${el.text.substring(0, 40)}")` : ''
                return `<${tag}${id}>${text}`
            }).join(', ')
            messageContent = `[Visual Edit on: ${elementDescs}]\n${trimmed}`
        }

        addMessage({ role: 'user', content: messageContent })
        setVeInput('')
        
        const token = await getToken()
        startGeneration(messageContent, projectId, token)
    }

    const canSend = veInput.trim().length > 0 && !isGenerating

    return (
        <div className="ve-panel">
            <div className="ve-header">
                <span className="ve-title">Visual edits</span>
                <button className="ve-close-btn" onClick={handleClose}>Close</button>
            </div>

            {selectedElements.length === 0 ? (
                <div className="ve-empty">
                    <div className="ve-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                        </svg>
                    </div>
                    <p className="ve-empty-title">Click elements in preview</p>
                    <p className="ve-empty-desc">Select elements to modify their styles visually</p>
                </div>
            ) : selectedElements.length > 1 ? (
                /* Multi-select: N elements selected message */
                <div className="ve-content">
                    <div className="ve-multi-select">
                        <div className="ve-multi-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </div>
                        <p className="ve-multi-title">{selectedElements.length} elements selected</p>
                        <p className="ve-multi-desc">Ask StackForge to modify the selected elements below</p>
                    </div>
                </div>
            ) : (
                <div className="ve-content">
                    {/* Single Element: full style editor */}
                    <div className="ve-selection-info">
                        <span>1 element selected</span>
                        <span className="ve-selection-hint">Modify the selected element below</span>
                    </div>

                    {/* Typography */}
                    <div className="ve-section">
                        <h3 className="ve-section-title">Typography</h3>
                        <div className="ve-row">
                            <div className="ve-field">
                                <label>Font size</label>
                                <select className="ve-select" value={styles.fontSize || ''} onChange={(e) => handleStyleChange('fontSize', e.target.value)}>
                                    <option value="">Inherit</option>
                                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="ve-field">
                                <label>Font style</label>
                                <select className="ve-select" value={styles.fontStyle || ''} onChange={(e) => handleStyleChange('fontStyle', e.target.value)}>
                                    <option value="">Normal</option>
                                    <option value="italic">Italic</option>
                                </select>
                            </div>
                        </div>
                        <div className="ve-row">
                            <div className="ve-field">
                                <label>Font weight</label>
                                <select className="ve-select" value={styles.fontWeight || ''} onChange={(e) => handleStyleChange('fontWeight', e.target.value)}>
                                    <option value="">Inherit</option>
                                    {FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div className="ve-field">
                                <label>Alignment</label>
                                <div className="ve-align-group">
                                    {ALIGNMENTS.map(a => (
                                        <button key={a} className={'ve-align-btn' + (styles.textAlign === a ? ' active' : '')} onClick={() => handleStyleChange('textAlign', a)} title={a}>
                                            <AlignIcon align={a} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="ve-section">
                        <h3 className="ve-section-title">Colors</h3>
                        <div className="ve-row">
                            <div className="ve-field">
                                <label>Text color</label>
                                <div className="ve-color-input">
                                    <input type="color" value={styles.color || '#ffffff'} onChange={(e) => handleStyleChange('color', e.target.value)} className="ve-color-picker" />
                                    <input type="text" value={styles.color || 'inherit'} onChange={(e) => handleStyleChange('color', e.target.value)} className="ve-color-text" />
                                </div>
                            </div>
                            <div className="ve-field">
                                <label>Background</label>
                                <div className="ve-color-input">
                                    <input type="color" value={styles.backgroundColor || '#000000'} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} className="ve-color-picker" />
                                    <input type="text" value={styles.backgroundColor || 'inherit'} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} className="ve-color-text" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Spacing */}
                    <div className="ve-section">
                        <h3 className="ve-section-title">Spacing</h3>
                        <div className="ve-row">
                            <div className="ve-field">
                                <label>Margin</label>
                                <div className="ve-spacing-row">
                                    {['Top','Right','Bottom','Left'].map(side => (
                                        <input key={side} type="text" placeholder="0" className="ve-spacing-input" title={'Margin ' + side} value={styles['margin' + side] || ''} onChange={(e) => handleStyleChange('margin' + side, e.target.value)} />
                                    ))}
                                </div>
                            </div>
                            <div className="ve-field">
                                <label>Padding</label>
                                <div className="ve-spacing-row">
                                    {['Top','Right','Bottom','Left'].map(side => (
                                        <input key={side} type="text" placeholder="0" className="ve-spacing-input" title={'Padding ' + side} value={styles['padding' + side] || ''} onChange={(e) => handleStyleChange('padding' + side, e.target.value)} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Border */}
                    <div className="ve-section">
                        <h3 className="ve-section-title">Border</h3>
                        <div className="ve-row">
                            <div className="ve-field">
                                <label>Border width</label>
                                <select className="ve-select" value={styles.borderWidth || ''} onChange={(e) => handleStyleChange('borderWidth', e.target.value)}>
                                    <option value="">None</option>
                                    <option value="1px">1px</option>
                                    <option value="2px">2px</option>
                                    <option value="3px">3px</option>
                                    <option value="4px">4px</option>
                                </select>
                            </div>
                            <div className="ve-field">
                                <label>Border color</label>
                                <div className="ve-color-input">
                                    <input type="color" value={styles.borderColor || '#333333'} onChange={(e) => handleStyleChange('borderColor', e.target.value)} className="ve-color-picker" />
                                    <input type="text" value={styles.borderColor || 'inherit'} onChange={(e) => handleStyleChange('borderColor', e.target.value)} className="ve-color-text" />
                                </div>
                            </div>
                        </div>
                        <div className="ve-row">
                            <div className="ve-field">
                                <label>Border style</label>
                                <select className="ve-select" value={styles.borderStyle || ''} onChange={(e) => handleStyleChange('borderStyle', e.target.value)}>
                                    <option value="">None</option>
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                </select>
                            </div>
                            <div className="ve-field">
                                <label>Border radius</label>
                                <select className="ve-select" value={styles.borderRadius || ''} onChange={(e) => handleStyleChange('borderRadius', e.target.value)}>
                                    <option value="">None</option>
                                    <option value="4px">4px</option>
                                    <option value="8px">8px</option>
                                    <option value="12px">12px</option>
                                    <option value="16px">16px</option>
                                    <option value="24px">24px</option>
                                    <option value="9999px">Full</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending changes bar */}
            {hasPendingChanges && (
                <div className="ve-pending-bar">
                    <div className="ve-pending-header">
                        <span className="ve-warning-icon">⚠</span> Pending changes
                    </div>
                    <div className="ve-pending-actions">
                        <button className="ve-discard-btn" onClick={() => setHasPendingChanges(false)}>Discard</button>
                        <button className="ve-send-btn" onClick={() => {
                            setHasPendingChanges(false)
                            handleBackToChat()
                        }}>Send update</button>
                    </div>
                </div>
            )}

            {/* Bottom bar: Back to Chat + tags + conditional chat input */}
            <div className="ve-bottom-bar">
                <button className="ve-back-btn" onClick={handleBackToChat}>
                    <Undo2 size={14} />
                    Back to Chat
                </button>
                {selectedElements.length > 0 && (
                    <div className="ve-tags">
                        {selectedElements.map((el, i) => (
                            <span key={el.xpath || i} className={'ve-tag ve-tag-' + el.tag}>
                                <span className="ve-tag-icon">{getTagIcon(el.tag)}</span>
                                {el.tag}{el.id ? '#' + el.id : ''}
                                <button className="ve-tag-x" onClick={() => removeSelectedElement(el.xpath)}>
                                    <X size={10} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Chat textarea + toolbar — show if any elements are selected */}
                {selectedElements.length > 0 && (
                    <>
                        <textarea
                            value={veInput}
                            onChange={(e) => setVeInput(e.target.value)}
                            placeholder={`Describe changes for ${selectedElements.length} elements...`}
                            className="ve-chat-textarea"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleVeSend()
                                }
                            }}
                        />

                        <div className="ve-chat-toolbar">
                            <div className="ve-chat-toolbar-left">
                                <button className="ve-tiny-btn"><Plus size={18} /></button>
                                <button className="ve-pill-active">
                                    <span style={{ fontSize: '12px' }}>✏️</span> Visual edits
                                </button>
                            </div>
                            <div className="ve-chat-toolbar-right">
                                <button className="ve-tiny-btn"><MessageSquare size={18} /></button>
                                <button className="ve-tiny-btn"><Mic size={18} /></button>
                                <button 
                                    className={'ve-send-circle' + (canSend ? ' active' : '')}
                                    onClick={handleVeSend}
                                    disabled={!canSend}
                                >
                                    <ArrowUp size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function AlignIcon({ align }) {
    const lines = {
        left: [{ x: 4, w: 16 }, { x: 4, w: 10 }, { x: 4, w: 14 }],
        center: [{ x: 4, w: 16 }, { x: 7, w: 10 }, { x: 5, w: 14 }],
        right: [{ x: 4, w: 16 }, { x: 10, w: 10 }, { x: 6, w: 14 }],
        justify: [{ x: 4, w: 16 }, { x: 4, w: 16 }, { x: 4, w: 16 }],
    }
    const l = lines[align] || lines.left
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {l.map((line, i) => (
                <line key={i} x1={line.x} y1={6 + i * 6} x2={line.x + line.w} y2={6 + i * 6} />
            ))}
        </svg>
    )
}

function getTagIcon(tag) {
    const map = { h1: 'H', h2: 'H', h3: 'H', h4: 'H', p: 'P', span: 'S', div: 'D', a: 'A', button: 'B', input: 'I', img: 'I', section: 'S', nav: 'N', header: 'H', footer: 'F' }
    return map[tag.toLowerCase()] || tag[0].toUpperCase()
}
