import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
    Type, Layout, Grid3X3, Check, ChevronLeft, ChevronRight,
    Sparkles, Layers, Zap,
    FileText, Coffee, PenTool, Globe, Camera, Utensils, Code2,
    Briefcase, Heart, ShoppingBag, GraduationCap, Dumbbell, Music,
    Scale, Stethoscope, HandHeart, Home, Car, Trophy, Gem, Plane,
    Building2, Star
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import './SetupWizard.css'

const STEPS = [
    { id: 'name',  icon: Type,    label: 'Name'  },
    { id: 'about', icon: Layout,  label: 'About' },
    { id: 'theme', icon: Grid3X3, label: 'Theme' },
]

// Covers ALL 23 real categories from /server/templates
const CATEGORY_META = {
    agency:          { icon: Building2,   color: '#60a5fa', label: 'Agency'         },
    automotive:      { icon: Car,          color: '#f97316', label: 'Automotive'     },
    blog:            { icon: FileText,     color: '#f472b6', label: 'Blog'           },
    'coffee-shop':   { icon: Coffee,       color: '#fbbf24', label: 'Coffee Shop'   },
    custom:          { icon: Star,         color: '#a78bfa', label: 'Custom'         },
    ecommerce:       { icon: ShoppingBag,  color: '#34d399', label: 'E-Commerce'    },
    education:       { icon: GraduationCap,color: '#facc15', label: 'Education'     },
    entertainment:   { icon: Music,        color: '#e879f9', label: 'Entertainment' },
    fashion:         { icon: PenTool,      color: '#c084fc', label: 'Fashion'       },
    fitness:         { icon: Dumbbell,     color: '#4ade80', label: 'Fitness'       },
    landing:         { icon: Globe,        color: '#38bdf8', label: 'Landing Page'  },
    legal:           { icon: Scale,        color: '#94a3b8', label: 'Legal'         },
    medical:         { icon: Stethoscope,  color: '#f87171', label: 'Medical'       },
    nonprofit:       { icon: HandHeart,    color: '#f9a8d4', label: 'Non-Profit'    },
    portfolio:       { icon: Camera,       color: '#34d399', label: 'Portfolio'     },
    'real-estate':   { icon: Home,         color: '#fbbf24', label: 'Real Estate'   },
    restaurant:      { icon: Utensils,     color: '#fb923c', label: 'Restaurant'    },
    saas:            { icon: Code2,        color: '#818cf8', label: 'SaaS'          },
    service:         { icon: Briefcase,    color: '#38bdf8', label: 'Service'       },
    sports:          { icon: Trophy,       color: '#fde047', label: 'Sports'        },
    travel:          { icon: Plane,        color: '#22d3ee', label: 'Travel'        },
    wedding:         { icon: Gem,          color: '#fda4af', label: 'Wedding'       },
    wellness:        { icon: Heart,        color: '#f9a8d4', label: 'Wellness'      },
}

export default function SetupWizard() {
    const { projectId } = useParams()
    const { getToken } = useAuth()
    const {
        configStep, setConfigStep,
        styleOptions, setStyleOptions,
        addMessage,
        completeProjectConfig,
    } = useChatStore()

    const [templates, setTemplates]       = useState([])
    const [loadingTemplates, setLoading]  = useState(false)
    const [analyzingCat, setAnalyzing]    = useState(false)
    const [selectedTemplate, setSelectedTmpl] = useState(styleOptions.templateId || null)
    const [animDir, setAnimDir]           = useState('forward')
    const [animKey, setAnimKey]           = useState(0)

    // viewMode: 'recommended' | 'categories' | 'category-detail'
    const [viewMode, setViewMode]         = useState(null)
    const [aiCategories, setAiCategories] = useState([])
    const [browseCatId, setBrowseCatId]   = useState(null)

    const nameRef = useRef(null)
    const descRef = useRef(null)

    useEffect(() => {
        if (configStep === 0) nameRef.current?.focus()
        if (configStep === 1) descRef.current?.focus()
    }, [configStep])

    // Fetch templates on mount
    useEffect(() => {
        setLoading(true)
        fetch('/api/templates')
            .then(r => r.json())
            .then(d => setTemplates((d.templates || []).filter(t => t.isVisibleInThemes)))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    // AI suggestion on entering step 2
    useEffect(() => {
        if (configStep !== 2 || viewMode !== null) return
        const prompt = styleOptions.initialPrompt || styleOptions.description || styleOptions.websiteName
        if (!prompt) { setViewMode('categories'); return }
        setAnalyzing(true)
        fetch('/api/generate/suggest-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        })
            .then(r => r.json())
            .then(d => {
                const cats = d.categories && d.categories.length > 0 ? d.categories : []
                if (cats.length > 0) {
                    setAiCategories(cats)
                    setViewMode('recommended')
                } else {
                    setViewMode('categories')
                }
            })
            .catch(() => setViewMode('categories'))
            .finally(() => setAnalyzing(false))
    }, [configStep])

    // Build category map from fetched templates
    const categoriesMap = {}
    templates.forEach(t => {
        const cats = t.allCategories?.length > 0 ? t.allCategories : [t.categoryId || 'custom']
        cats.forEach(cid => {
            if (!categoriesMap[cid]) categoriesMap[cid] = []
            if (!categoriesMap[cid].find(x => x.slug === t.slug)) categoriesMap[cid].push(t)
        })
    })
    const allCategoryIds = Object.keys(categoriesMap).sort()

    // Recommended templates: union from AI-suggested categories, deduped
    const recommendedTemplates = (() => {
        if (aiCategories.length === 0) return templates
        const seen = new Set()
        const result = []
        aiCategories.forEach(catId => {
            ;(categoriesMap[catId] || []).forEach(t => {
                if (!seen.has(t.slug)) { seen.add(t.slug); result.push(t) }
            })
        })
        return result
    })()

    const browseCatTemplates = browseCatId ? (categoriesMap[browseCatId] || []) : []

    const advance = async () => {
        const token = await getToken()
        let userContent = ''
        let assistantNext = ''

        if (configStep === 0) {
            if (!styleOptions.websiteName?.trim()) return
            userContent   = 'The name is ' + styleOptions.websiteName + '.'
            assistantNext = 'Nice name! Can you give me a short description of what your website or business is about?'
        } else if (configStep === 1) {
            if (!styleOptions.description?.trim()) return
            userContent = 'Description: ' + styleOptions.description
            if (styleOptions.templateId) {
                addMessage({ role: 'user', content: userContent })
                setTimeout(async () => {
                    addMessage({ role: 'assistant', content: "Perfect! Using your selected theme. Let's build! 🚀" })
                    const freshToken = await getToken()
                    completeProjectConfig(projectId, freshToken, styleOptions)
                }, 600)
                return
            }
            assistantNext = 'Perfect! Now pick a category and theme that matches your vision.'
        } else if (configStep === 2) {
            if (!styleOptions.templateId) return
            completeProjectConfig(projectId, token, styleOptions)
            return
        }

        addMessage({ role: 'user', content: userContent })
        setTimeout(() => addMessage({ role: 'assistant', content: assistantNext }), 600)
        setAnimDir('forward')
        setAnimKey(k => k + 1)
        setConfigStep(prev => prev + 1)
    }

    const goBack = () => {
        setAnimDir('back')
        setAnimKey(k => k + 1)
        setConfigStep(prev => prev - 1)
    }

    const handleTmplSelect = (templateId) => {
        setSelectedTmpl(templateId)
        setStyleOptions(prev => ({ ...prev, templateId }))
    }

    const canPrimary = configStep === 0
        ? !!styleOptions.websiteName?.trim()
        : configStep === 1
            ? !!styleOptions.description?.trim()
            : !!styleOptions.templateId

    const progressPct = configStep === 0 ? 0 : configStep === 1 ? 50 : 100

    const renderTemplateBtn = (tmpl, accentColor) => {
        const isSelected = selectedTemplate === tmpl.id
        return (
            <button
                key={tmpl.id}
                className={`sw-tmpl-btn ${isSelected ? 'selected' : ''}`}
                style={isSelected ? { borderColor: accentColor, background: `${accentColor}14` } : {}}
                onClick={() => handleTmplSelect(tmpl.id)}
            >
                <div className="sw-tmpl-thumb">
                    {tmpl.image
                        ? <img src={tmpl.image} alt={tmpl.themeName || tmpl.title} loading="lazy" />
                        : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}08)` }} />
                    }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sw-tmpl-name">{tmpl.themeName || tmpl.title}</div>
                    <div className="sw-tmpl-desc">{tmpl.themeTagline || tmpl.description}</div>
                </div>
                {isSelected && (
                    <div className="sw-tmpl-check" style={{ background: accentColor }}>
                        <Check size={11} strokeWidth={3} color="#fff" />
                    </div>
                )}
            </button>
        )
    }

    const renderCustomAI = () => (
        <button
            className={`sw-tmpl-btn ${selectedTemplate === 'custom' ? 'selected' : ''}`}
            onClick={() => handleTmplSelect('custom')}
        >
            <div className="sw-tmpl-thumb" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} color="rgba(255,255,255,0.7)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sw-tmpl-name">Custom AI Build</div>
                <div className="sw-tmpl-desc">Generate a completely unique website from scratch using AI</div>
            </div>
            {selectedTemplate === 'custom' && (
                <div className="sw-tmpl-check">
                    <Check size={11} strokeWidth={3} color="#fff" />
                </div>
            )}
        </button>
    )

    return (
        <div className="sw-root">
            <div className="sw-card">
                {/* ── Progress ── */}
                <div className="sw-progress-track">
                    <div className="sw-progress-fill" style={{ width: `calc(${progressPct}% - 16px)` }} />
                    {STEPS.map((s, i) => {
                        const isDone   = i < configStep
                        const isActive = i === configStep
                        return (
                            <div key={s.id} className="sw-step-dot-wrap" onClick={() => {
                                if (i < configStep) { setAnimDir('back'); setAnimKey(k => k + 1); setConfigStep(i) }
                            }}>
                                <div className={`sw-step-dot ${isActive ? 'active' : isDone ? 'done' : ''}`}>
                                    {isDone ? <Check size={9} strokeWidth={3} /> : i + 1}
                                </div>
                                <span className={`sw-step-label ${isActive ? 'active' : isDone ? 'done' : ''}`}>{s.label}</span>
                            </div>
                        )
                    })}
                </div>

                {/* ── Step content ── */}
                <div key={animKey} className={`sw-step-content ${animDir === 'back' ? 'back' : ''}`}>

                    {/* Step 0: Brand Name */}
                    {configStep === 0 && (
                        <>
                            <div className="sw-header">
                                <h2 className="sw-heading">What's your brand name?</h2>
                                <p className="sw-subheading">This will appear as your site's brand name in the header</p>
                            </div>
                            <input
                                ref={nameRef}
                                className="sw-input"
                                type="text"
                                placeholder="e.g. BrewHouse Coffee"
                                value={styleOptions.websiteName || ''}
                                onChange={e => setStyleOptions(prev => ({ ...prev, websiteName: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && canPrimary && advance()}
                            />
                            <div className="sw-hint">
                                <span>Used in the header, footer, and page title</span>
                            </div>
                        </>
                    )}

                    {/* Step 1: Description */}
                    {configStep === 1 && (
                        <>
                            <div className="sw-header">
                                <h2 className="sw-heading">Describe your project</h2>
                                <p className="sw-subheading">The AI uses this to generate your content and choose the right design</p>
                            </div>
                            <textarea
                                ref={descRef}
                                className="sw-textarea"
                                rows={5}
                                maxLength={2500}
                                placeholder="What does your business do? e.g. A travel agency specializing in adventure tours across Southeast Asia..."
                                value={styleOptions.description || ''}
                                onChange={e => setStyleOptions(prev => ({ ...prev, description: e.target.value }))}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canPrimary) advance()
                                }}
                            />
                            <div className="sw-hint">
                                <span>More detail = better website &nbsp;·&nbsp; Cmd+Enter to continue</span>
                                <span className={`sw-hint-count ${(styleOptions.description || '').length > 2400 ? 'warn' : ''}`}>
                                    {(styleOptions.description || '').length}/2500
                                </span>
                            </div>
                        </>
                    )}

                    {/* Step 2: Theme */}
                    {configStep === 2 && (
                        <>
                            <div className="sw-header">
                                <h2 className="sw-heading">
                                    {viewMode === 'recommended' ? 'Recommended for you'
                                     : viewMode === 'category-detail' ? CATEGORY_META[browseCatId]?.label || 'Choose a theme'
                                     : 'Pick a category'}
                                </h2>
                                <p className="sw-subheading">
                                    {viewMode === 'recommended'
                                        ? `Best matches from ${aiCategories.map(c => CATEGORY_META[c]?.label || c).join(', ')}`
                                        : viewMode === 'category-detail'
                                            ? 'Choose a starting template for this category'
                                            : 'Browse all categories to find your perfect theme'}
                                </p>
                            </div>

                            {(loadingTemplates || analyzingCat) ? (
                                <div className="sw-loading">
                                    <div className="sw-loading-spinner" />
                                    <span>Finding the best themes for your project...</span>
                                </div>
                            ) : viewMode === 'recommended' ? (
                                <>
                                    <button className="sw-cat-back-btn" onClick={() => {
                                        setViewMode('categories')
                                        setSelectedTmpl(null)
                                        setStyleOptions(prev => ({ ...prev, templateId: '' }))
                                    }}>
                                        <ChevronLeft size={13} /> Browse all categories
                                    </button>
                                    <div className="sw-tmpl-list">
                                        {renderCustomAI()}
                                        {recommendedTemplates.map(tmpl => {
                                            const primaryCat = tmpl.categoryId || tmpl.allCategories?.[0] || 'landing'
                                            const color = CATEGORY_META[primaryCat]?.color || 'rgba(255,255,255,0.4)'
                                            return renderTemplateBtn(tmpl, color)
                                        })}
                                        {recommendedTemplates.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                                No templates matched. Browse all categories above.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : viewMode === 'category-detail' ? (
                                <>
                                    <button className="sw-cat-back-btn" onClick={() => {
                                        setViewMode('categories')
                                        setBrowseCatId(null)
                                        setSelectedTmpl(null)
                                        setStyleOptions(prev => ({ ...prev, templateId: '' }))
                                    }}>
                                        <ChevronLeft size={13} /> Back to all categories
                                    </button>
                                    {CATEGORY_META[browseCatId] && (
                                        <div className="sw-cat-section-label" style={{ color: CATEGORY_META[browseCatId].color }}>
                                            {CATEGORY_META[browseCatId].label}
                                        </div>
                                    )}
                                    <div className="sw-tmpl-list">
                                        {renderCustomAI()}
                                        {browseCatTemplates.map(tmpl => {
                                            const color = CATEGORY_META[browseCatId]?.color || 'rgba(255,255,255,0.4)'
                                            return renderTemplateBtn(tmpl, color)
                                        })}
                                        {browseCatTemplates.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                                No templates in this category yet.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Category grid */
                                <>
                                    {aiCategories.length > 0 && (
                                        <button className="sw-cat-back-btn" onClick={() => setViewMode('recommended')}>
                                            <Zap size={12} /> Back to AI Recommendations
                                        </button>
                                    )}
                                    <div className="sw-cat-grid">
                                        {allCategoryIds.map(cid => {
                                            const meta = CATEGORY_META[cid] || { icon: Layers, color: 'rgba(255,255,255,0.3)', label: cid }
                                            const Icon = meta.icon
                                            return (
                                                <button key={cid} className="sw-cat-btn" onClick={() => {
                                                    setBrowseCatId(cid)
                                                    setViewMode('category-detail')
                                                }}>
                                                    <div className="sw-cat-icon-wrap" style={{ background: `${meta.color}1a` }}>
                                                        <Icon size={15} color={meta.color} />
                                                    </div>
                                                    <span>{meta.label}</span>
                                                </button>
                                            )
                                        })}
                                        <button className="sw-cat-btn custom-ai" onClick={() => handleTmplSelect('custom')}>
                                            <div className="sw-cat-icon-wrap" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <Sparkles size={15} color="rgba(255,255,255,0.7)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 13 }}>Custom AI Build</div>
                                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginTop: 2 }}>Generate from scratch with AI blueprints</div>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="sw-footer">
                    <button
                        className={`sw-btn-primary ${configStep === 2 ? 'build' : ''}`}
                        onClick={advance}
                        disabled={!canPrimary}
                    >
                        {configStep === 2
                            ? <><Sparkles size={15} /> Build My Website</>
                            : <>Continue <ChevronRight size={15} /></>
                        }
                    </button>
                    {configStep > 0 && (
                        <button className="sw-btn-back" onClick={goBack}>← Back to previous step</button>
                    )}
                </div>
            </div>
        </div>
    )
}
