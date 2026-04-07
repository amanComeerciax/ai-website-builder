import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useProjectStore } from '../stores/projectStore';
import toast from 'react-hot-toast';
import './TemplatesPage.css';

export default function TemplatesPage() {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { createProject } = useProjectStore();
    
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

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

    const handleUseTemplate = (template) => {
        setSelectedTemplate(template);
        setProjectName('');
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        const trimmedName = projectName.trim();
        if (!trimmedName) {
            toast.error("Please enter a project name");
            return;
        }

        setIsCreating(true);
        try {
            const token = await getToken();
            const prompt = `Build a website for "${trimmedName}" using the ${selectedTemplate.title} layout base. Make sure to keep the general structure of the ${selectedTemplate.categoryId} template but personalize it.`;
            
            const newProjectId = await createProject(prompt, token, null);
            
            // Navigate to chat/builder
            navigate(`/chat/${newProjectId}?prompt=${encodeURIComponent(prompt)}`);
            setSelectedTemplate(null);
        } catch (error) {
            console.error("Template creation error:", error);
            toast.error("Failed to start project");
        } finally {
            setIsCreating(false);
        }
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
                                onClick={() => handleUseTemplate(tpl)}
                            >
                                <div className="lv-template-image-wrapper">
                                    <img src={getThumbnail(tpl.id)} alt={tpl.title} className="lv-template-image" />
                                    <div className="lv-template-overlay">
                                        <span>Use Template</span>
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

                {/* Modal */}
                {selectedTemplate && (
                    <div className="lv-modal-overlay" onClick={() => !isCreating && setSelectedTemplate(null)}>
                        <div className="lv-modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2 className="lv-modal-title">Use {selectedTemplate.title}</h2>
                            <p className="lv-modal-desc">Enter a quick name or description for your new website.</p>
                            <form onSubmit={handleCreateProject}>
                                <input
                                    autoFocus
                                    type="text"
                                    className="lv-modal-input"
                                    placeholder={`e.g. "Acme Corp" or "A tech podcast"`}
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    disabled={isCreating}
                                />
                                <div className="lv-modal-actions">
                                    <button 
                                        type="button" 
                                        className="lv-btn-cancel" 
                                        onClick={() => setSelectedTemplate(null)}
                                        disabled={isCreating}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="lv-btn-primary"
                                        disabled={isCreating || !projectName.trim()}
                                    >
                                        {isCreating ? 'Creating...' : 'Start Generating'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
