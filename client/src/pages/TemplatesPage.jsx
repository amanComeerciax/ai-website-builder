import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './TemplatesPage.css';

export default function TemplatesPage() {
    const navigate = useNavigate();
    
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Step 2: Open Remix Modal from Preview
    const handleOpenRemix = () => {
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
        if (id.includes('coffee') || id.includes('roastery') || id.includes('terroir')) return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80';
        if (id.includes('portfolio') || id.includes('blog') || id.includes('design')) return 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=800&q=80';
        if (id.includes('aura')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
        // fallback abstract graphic
        return 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80';
    };

    return (
        <div className="lv-templates-page">
            <div className="lv-templates-container">
                <div className="lv-templates-header">
                    <h1 className="lv-templates-title">Start with a Blueprint</h1>
                    <p className="lv-templates-subtitle">Choose from our curated collection of professional templates to kickstart your next project.</p>
                </div>

                {loading ? (
                    <div className="lv-loader"></div>
                ) : (
                    <div className="lv-templates-grid">
                        {templates.map((tpl) => (
                            <div 
                                key={tpl.id} 
                                className="lv-template-card"
                                onClick={() => handlePreviewTemplate(tpl)}
                            >
                                <div className="lv-template-image-wrapper">
                                    <img src={getThumbnail(tpl.id)} alt={tpl.title} className="lv-template-image" />
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
