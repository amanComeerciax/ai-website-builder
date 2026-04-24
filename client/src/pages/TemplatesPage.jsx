import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Skeleton } from 'boneyard-js/react';
import './TemplatesPage.css';

// Global cache for preview HTML so we don't re-fetch on repeat hovers
const templateHtmlCache = {};

export default function TemplatesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialPrompt = searchParams.get('prompt') || '';
    
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination / Lazy Loading States
    const [visibleCount, setVisibleCount] = useState(6);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = React.useRef(null);
    
    // AI Guided Selection States
    const [analyzingPrompt, setAnalyzingPrompt] = useState(!!initialPrompt);
    const [aiRecommendedCategory, setAiRecommendedCategory] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Reset pagination when category changes
    useEffect(() => {
        setVisibleCount(6);
    }, [selectedCategory, initialPrompt]);

    // Modal States
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    
    const [remixTemplate, setRemixTemplate] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [includeHistory, setIncludeHistory] = useState(false);
    const [includeKnowledge, setIncludeKnowledge] = useState(true);

    useEffect(() => {
        async function fetchTemplates() {
            try {
                const res = await fetch('/api/templates');
                const data = await res.json();
                if (res.ok) {
                    setTemplates(data.templates || []);
                } else {
                    toast.error(data.error || 'Failed to load templates');
                }
            } catch (err) {
                toast.error('Network error while loading templates');
            } finally {
                setLoading(false);
            }
        }
        fetchTemplates();
    }, []);

    // AI Categorization Effect
    useEffect(() => {
        if (!initialPrompt) return;

        async function analyzePrompt() {
            try {
                const res = await fetch('/api/generate/suggest-category', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: initialPrompt })
                });
                const data = await res.json();
                if (data.category) {
                    setAiRecommendedCategory(data.category);
                    setSelectedCategory(data.category);
                }
            } catch (err) {
                console.error('Failed to analyze prompt:', err);
            } finally {
                setAnalyzingPrompt(false);
            }
        }
        analyzePrompt();
    }, [initialPrompt]);

    // Step 1: Open Large Preview Modal
    const handlePreviewTemplate = async (template) => {
        setPreviewTemplate(template);
        setPreviewHtml(null);
        setPreviewLoading(true);

        try {
            const res = await fetch(`/api/templates/preview/${template.id}`);
            const data = await res.json();
            if (res.ok && data.html) {
                setPreviewHtml(data.html);
            } else {
                toast.error('Preview not available');
                setPreviewHtml('<div style="color:white; display:flex; align-items:center; justify-content:center; height:100%; font-family:sans-serif;">Preview not available</div>');
            }
        } catch (err) {
            toast.error('Failed to load preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    // Step 2: Open Remix Modal from Preview (or bypass if AI guided)
    const handleOpenRemix = () => {
        if (initialPrompt) {
            // Bypass remix modal completely, drop straight into builder with the user's prompt
            const promptParams = `templateId=${encodeURIComponent(previewTemplate.id)}&templateName=${encodeURIComponent(previewTemplate.title)}&prompt=${encodeURIComponent(initialPrompt)}`;
            navigate(`/chat/new?${promptParams}`);
            return;
        }

        setRemixTemplate(previewTemplate);
        setProjectName(`Remix of ${previewTemplate.title}`);
        setPreviewTemplate(null); // Close preview modal
    };

    // Step 3: Acknowledge and Remix -> Go to Builder
    const handleRemixSubmit = (e) => {
        e.preventDefault();
        const trimmedName = projectName.trim() || remixTemplate.title;
        // The project prompt incorporates the chosen name
        const promptParams = `templateId=${encodeURIComponent(remixTemplate.id)}&templateName=${encodeURIComponent(remixTemplate.title)}&prompt=${encodeURIComponent(`Build a website for "${trimmedName}" using the ${remixTemplate.title} layout base.`)}`;
        navigate(`/chat/new?${promptParams}`);
    };

    const closeAll = () => {
        setPreviewTemplate(null);
        setRemixTemplate(null);
        setPreviewHtml(null);
    };

    // Helper mapping to give each template a distinct, beautiful thumbnail
    const getThumbnail = (id) => {
        if (id.includes('saas') || id.includes('startup')) return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80';
        if (id.includes('coffee') || id.includes('roastery') || id.includes('terroir') || id.includes('restaurant')) return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80';
        if (id.includes('portfolio') || id.includes('blog') || id.includes('design') || id.includes('wellness')) return 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=800&q=80';
        if (id.includes('fashion') || id.includes('vesper')) return 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=800&q=80';
        if (id.includes('aura')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
        return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80';
    };


    // Sub-component for Live Previews - Auto-Loads via IntersectionObserver
    const LiveThumbnail = ({ template }) => {
        const [html, setHtml] = useState(templateHtmlCache[template.id] || null);
        const [isVisible, setIsVisible] = useState(false);
        const [isLoaded, setIsLoaded] = useState(false);
        const wrapperRef = React.useRef(null);

        // Visibility tracking
        useEffect(() => {
            if (!template?.id || template.id === 'undefined') return;
            if (templateHtmlCache[template.id]) {
                setHtml(templateHtmlCache[template.id]);
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // fetch only once
                }
            }, { rootMargin: '50px' });

            if (wrapperRef.current) {
                observer.observe(wrapperRef.current);
            }
            return () => observer.disconnect();
        }, [template.id]);

        // Fetching logic
        useEffect(() => {
            if (!isVisible || html) return;
            
            let mounted = true;
            fetch(`/api/templates/preview/${template.id}`)
                .then(res => res.json())
                .then(data => {
                    if (mounted && data.html) {
                        templateHtmlCache[template.id] = data.html;
                        setHtml(data.html);
                    }
                })
                .catch(() => {});
                
            return () => { mounted = false; };
        }, [isVisible, html, template.id]);

        return (
            <div className="lv-template-iframe-wrapper" ref={wrapperRef}>
                <div style={{ position: 'absolute', inset: 0, zIndex: isLoaded ? -1 : 10, opacity: isLoaded ? 0 : 1, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
                    <Skeleton name="template-preview" loading={true} style={{ width: '100%', height: '100%', display: 'block' }}>
                        <div style={{ width: '100%', height: '100%' }}></div>
                    </Skeleton>
                </div>
                {html && (
                    <iframe 
                        className={`lv-template-iframe ${isLoaded ? 'loaded' : ''}`}
                        srcDoc={html}
                        frameBorder="0"
                        scrolling="no"
                        loading="lazy"
                        title={template.title}
                        onLoad={() => setIsLoaded(true)}
                        style={{ WebkitTransform: 'scale(0.25)' }} /* Fallback to guarantee scale */
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
            </div>
        );
    };

    const filteredTemplates = templates.filter(tpl => {
        if (selectedCategory === 'all') return true;
        // Check if the template ID or slug has the category name in it e.g. "portfolio/xyz"
        return tpl.id.includes(selectedCategory) || (tpl.categoryId && tpl.categoryId.includes(selectedCategory));
    });

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isLoadingMore) {
                const hasMore = filteredTemplates.length > visibleCount;
                if (hasMore) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount(prev => prev + 6);
                        setIsLoadingMore(false);
                    }, 800); // Mimic network load time
                }
            }
        }, { rootMargin: '100px' });

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [filteredTemplates.length, visibleCount, isLoadingMore]);

    return (
        <div className="lv-templates-page">
            <div className="lv-templates-container">
                <div className="lv-templates-header">
                    {analyzingPrompt ? (
                        <>
                            <h1 className="lv-templates-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="spinner-border text-primary" style={{width: '24px', height: '24px', borderWidth: '3px'}}></div>
                                AI is analyzing your request...
                            </h1>
                            <p className="lv-templates-subtitle">We are finding the perfect structural blueprints for your project.</p>
                        </>
                    ) : aiRecommendedCategory ? (
                        <>
                            <h1 className="lv-templates-title">Recommended Blueprints</h1>
                            <p className="lv-templates-subtitle">
                                Based on your prompt, we recommend these <strong>{aiRecommendedCategory}</strong> templates. Choose the structure that best fits your needs.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="lv-templates-title">Start with a Blueprint</h1>
                            <p className="lv-templates-subtitle">Choose from our curated collection of professional templates to kickstart your next project.</p>
                        </>
                    )}
                </div>

                {(loading || analyzingPrompt) ? (
                    <div className="lv-templates-grid">
                        {[1,2,3,4,5,6].map(i => (
                            <div key={i} className="lv-template-card">
                                <div className="lv-template-image-wrapper">
                                    <div className="lv-template-iframe-wrapper">
                                        <Skeleton name="template-preview" loading={true} style={{ width: '100%', height: '100%', display: 'block' }}>
                                            <div className="lv-template-iframe" style={{ width: '100%', height: '100%' }}></div>
                                        </Skeleton>
                                    </div>
                                </div>
                                <div className="lv-template-info">
                                    <div className="lv-skel-block" style={{ width: '55%', height: '14px', borderRadius: '4px', marginBottom: '6px' }} />
                                    <div className="lv-skel-block" style={{ width: '80%', height: '10px', borderRadius: '3px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                        <p style={{ marginBottom: '24px', fontSize: '1.1rem', color: '#e5e7eb' }}>We've analyzed your unique request and are ready to build it.</p>
                        
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                            <button 
                                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => navigate(`/chat/new?prompt=${encodeURIComponent(initialPrompt)}`)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                                Generate Custom Layout
                            </button>
                            <button 
                                style={{ padding: '12px 24px', background: '#1f2937', color: 'white', borderRadius: '8px', border: '1px solid #374151', cursor: 'pointer' }}
                                onClick={() => setSelectedCategory('all')}
                            >
                                Browse other blueprints
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="lv-templates-grid">
                        {/* Auto-Generate Fallback Card */}
                        {initialPrompt && (
                            <div 
                                className="lv-template-card"
                                onClick={() => navigate(`/chat/new?prompt=${encodeURIComponent(initialPrompt)}`)}
                                style={{ border: '1px solid #8b5cf6', boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)' }}
                            >
                                <div className="lv-template-image-wrapper" style={{ background: 'linear-gradient(to bottom right, #0f172a, #1e1b4b)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', opacity: 0.8 }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                                    <span style={{ color: 'white', fontWeight: 500, letterSpacing: '0.5px' }}>Custom AI Structure</span>
                                </div>
                                <div className="lv-template-info">
                                    <h3 className="lv-template-name" style={{ color: '#c4b5fd' }}>Start from scratch</h3>
                                    <p className="lv-template-desc">None of these fit? Let the AI generate a completely custom layout using a theme.</p>
                                </div>
                            </div>
                        )}

                        {filteredTemplates.slice(0, visibleCount).map((tpl) => (
                            <div 
                                key={tpl.id} 
                                className="lv-template-card"
                                onClick={() => handlePreviewTemplate(tpl)}
                            >
                                <div className="lv-template-image-wrapper">
                                    <LiveThumbnail template={tpl} />
                                    <div className="lv-template-overlay">
                                        <span>Preview Template</span>
                                    </div>
                                </div>
                                <div className="lv-template-info">
                                    <h3 className="lv-template-name">{tpl.title}</h3>
                                    <p className="lv-template-desc">{tpl.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Infinite Scroll trigger and Loading Indicator */}
                {filteredTemplates.length > 0 && !loading && !analyzingPrompt && visibleCount < filteredTemplates.length && (
                    <div ref={loadMoreRef} style={{ padding: '40px 0', display: 'flex', justifyContent: 'center', width: '100%', marginTop: '20px' }}>
                        {isLoadingMore && (
                            <svg className="lv-spinner" viewBox="0 0 50 50" style={{ width: '32px', height: '32px' }}>
                                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                            </svg>
                        )}
                    </div>
                )}
            </div>

            {/* LARGE PREVIEW MODAL */}
            {previewTemplate && (
                <div className="lv-preview-modal-overlay" onClick={closeAll}>
                    <div className="lv-preview-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="lv-preview-header">
                            <div className="lv-preview-header-left">
                                <h2>{previewTemplate.title}</h2>
                                <span>by Antigravity AI</span>
                            </div>
                            <div className="lv-preview-header-right">
                                <button className="lv-action-btn-close" onClick={closeAll}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                                <button className="lv-action-btn-use" onClick={handleOpenRemix}>
                                    Use template
                                </button>
                            </div>
                        </div>
                        <div className="lv-preview-body">
                            {previewLoading ? (
                                <div className="lv-preview-loader">
                                    <div className="lv-spinner"></div>
                                    <p>Loading interactive preview...</p>
                                </div>
                            ) : (
                                <div className="lv-iframe-wrapper">
                                    <iframe 
                                        srcDoc={previewHtml} 
                                        frameBorder="0"
                                        title="Template Preview"
                                        sandbox="allow-scripts allow-same-origin"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* REMIX MODAL */}
            {remixTemplate && (
                <div className="lv-remix-modal-overlay" onClick={closeAll}>
                    <div className="lv-remix-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="lv-remix-close" onClick={closeAll}>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        
                        <div className="lv-remix-icon">
                            <div className="lv-heart-icon">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </div>
                        </div>
                        
                        <h2 className="lv-remix-title">Remix project</h2>
                        <p className="lv-remix-subtitle">
                            By remixing a project, you will create a copy that you own.
                        </p>

                        <form onSubmit={handleRemixSubmit} className="lv-remix-form">
                            <div className="lv-input-group">
                                <label>Project name</label>
                                <input 
                                    type="text" 
                                    value={projectName}
                                    onChange={e => setProjectName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="lv-toggle-group">
                                <div className="lv-toggle-label">
                                    <span>Include project history</span>
                                </div>
                                <label className="lv-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={includeHistory}
                                        onChange={e => setIncludeHistory(e.target.checked)}
                                    />
                                    <span className="lv-slider round"></span>
                                </label>
                            </div>

                            <div className="lv-toggle-group">
                                <div className="lv-toggle-label">
                                    <span>Include custom knowledge</span>
                                </div>
                                <label className="lv-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={includeKnowledge}
                                        onChange={e => setIncludeKnowledge(e.target.checked)}
                                    />
                                    <span className="lv-slider round checked"></span>
                                </label>
                            </div>

                            <div className="lv-remix-disclaimer">
                                <div className="lv-disclaimer-checkbox">
                                    <input type="checkbox" required id="remix-agree" />
                                </div>
                                <label htmlFor="remix-agree">
                                    When remixing a template, I agree to take responsibility over project security, compliance, data, and operations. The templates are provided for educational purposes and do not guarantee functionality or security out of the box.
                                </label>
                            </div>

                            <div className="lv-remix-actions">
                                <button type="button" className="lv-btn-cancel" onClick={closeAll}>Cancel</button>
                                <button type="submit" className="lv-btn-remix">Acknowledge and remix</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
