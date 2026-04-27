import React, { useState, useEffect } from 'react';
import { 
    X, HelpCircle, Link as LinkIcon, Edit3, Plus, 
    Globe, Shield, Search, ChevronLeft, Rocket, Loader2,
    CheckCircle, AlertTriangle, Image as ImageIcon, Upload, Wand2
} from 'lucide-react';
import './PublishModal.css';

const PublishModal = ({ isOpen, onClose, project, onPublish, isPublishing }) => {
    const [step, setStep] = useState(1);
    const [url, setUrl] = useState('');
    const [access, setAccess] = useState('public');
    const [activePermission, setActivePermission] = useState('public');
    
    // Website Info State
    const [websiteTitle, setWebsiteTitle] = useState('');
    const [description, setDescription] = useState('');
    const [socialImage, setSocialImage] = useState(null);

    useEffect(() => {
        if (project) {
            setWebsiteTitle(project.websiteName || project.name || '');
            setDescription(project.description || '');
            setUrl(project.publishedUrl || `${project.name?.toLowerCase().replace(/\s+/g, '-') || 'site'}-${Math.floor(Math.random() * 1000)}.netlify.app`);
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="pm-step animate-in">
                        <p className="pm-section-label">Choose website address</p>
                        <div className="pm-section pm-url-container">
                            <div className="pm-icon-wrapper">
                                <LinkIcon size={20} />
                            </div>
                            <div className="pm-url-display">
                                {url}
                            </div>
                            <button className="pm-edit-btn" title="Edit URL (Locked in Beta)">
                                <Edit3 size={16} />
                            </button>
                        </div>
                        
                        <div className="pm-add-domain">
                            <Plus size={18} />
                            <span>Add custom domain</span>
                            <div className="pm-badge-pro">
                                <Rocket size={12} />
                                Pro
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="pm-step animate-in">
                        <p className="pm-section-label">Choose website access permissions</p>
                        <div className="pm-permissions-group">
                            <div 
                                className={`pm-permission-item ${activePermission === 'public' ? 'active' : ''}`}
                                onClick={() => setActivePermission('public')}
                            >
                                <div className="pm-icon-wrapper">
                                    <Globe size={20} />
                                </div>
                                <div className="pm-perm-info">
                                    <span className="pm-perm-title">Public</span>
                                    <span className="pm-perm-desc">Anyone with the URL</span>
                                </div>
                                <div className="pm-radio"></div>
                            </div>

                            <div className="pm-permission-item locked opacity-60">
                                <div className="pm-icon-wrapper">
                                    <Shield size={20} />
                                </div>
                                <div className="pm-perm-info">
                                    <span className="pm-perm-title">Within workspace</span>
                                    <span className="pm-perm-desc">Only members & collaborators</span>
                                </div>
                                <div className="pm-badge-pro">Business</div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="pm-step animate-in">
                        <div className="pm-field">
                            <div className="pm-input-label-row">
                                <label className="pm-input-label">Icon & title</label>
                                <span className="pm-char-counter">{websiteTitle.length}/60</span>
                            </div>
                            <input 
                                type="text"
                                className="pm-input"
                                value={websiteTitle}
                                onChange={(e) => setWebsiteTitle(e.target.value.slice(0, 60))}
                                placeholder="Website Title"
                            />
                        </div>

                        <div className="pm-field">
                            <div className="pm-input-label-row">
                                <label className="pm-input-label">Description</label>
                                <span className="pm-char-counter">{description.length}/160</span>
                            </div>
                            <textarea 
                                className="pm-input pm-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value.slice(0, 160))}
                                placeholder="E-commerce website for your brand..."
                            />
                        </div>

                        <div className="pm-field">
                            <label className="pm-input-label">Social image</label>
                            <div className="pm-social-preview-card">
                                <div className="pm-social-img-box">
                                    {socialImage ? (
                                        <img src={socialImage} alt="Social Preview" />
                                    ) : (
                                        <div className="pm-placeholder-social">
                                            <ImageIcon size={48} className="opacity-20" />
                                        </div>
                                    )}
                                </div>
                                <div className="pm-social-footer">
                                    <div className="pm-social-domain">YOUR-DOMAIN.NETLIFY.APP</div>
                                    <div className="pm-social-title">{websiteTitle || 'My Site'}</div>
                                    <div className="pm-social-desc">{description || 'Check out my awesome site!'}</div>
                                </div>
                            </div>
                            <div className="pm-social-actions" style={{display:'flex', gap:'8px', marginTop:'12px'}}>
                                <button className="pm-btn pm-btn-secondary" style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)'}}>
                                    <Upload size={14} /> Upload
                                </button>
                                <button className="pm-btn pm-btn-secondary" style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)'}}>
                                    <Wand2 size={14} /> Generate
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="pm-step animate-in">
                        <p className="pm-section-label">Review your settings</p>
                        
                        <div className="pm-review-row" onClick={() => setStep(1)}>
                            <div className="pm-review-icon"><LinkIcon size={18} /></div>
                            <div className="pm-review-content">
                                <span className="pm-review-label">URL <CheckCircle size={12} className="pm-check-circle" /></span>
                                <span className="pm-review-value">{url}</span>
                            </div>
                            <Edit3 size={14} className="text-zinc-600" />
                        </div>

                        <div className="pm-review-row" onClick={() => setStep(2)}>
                            <div className="pm-review-icon"><Globe size={18} /></div>
                            <div className="pm-review-content">
                                <span className="pm-review-label">Website access <CheckCircle size={12} className="pm-check-circle" /></span>
                                <span className="pm-review-value">Anyone with the link</span>
                            </div>
                            <Edit3 size={14} className="text-zinc-600" />
                        </div>

                        <div className="pm-review-row" onClick={() => setStep(3)}>
                            <div className="pm-review-icon"><Search size={18} /></div>
                            <div className="pm-review-content">
                                <span className="pm-review-label">Website info <CheckCircle size={12} className="pm-check-circle" /></span>
                                <span className="pm-review-value">{websiteTitle}</span>
                            </div>
                            <Edit3 size={14} className="text-zinc-600" />
                        </div>

                        <div className="pm-security-scan">
                            <div className="pm-security-left">
                                <Shield size={18} className="text-orange-400" />
                                <span>Security scan recommended</span>
                            </div>
                            <HelpCircle size={16} className="text-zinc-500" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 1: return "Website address";
            case 2: return "Who can see the website";
            case 3: return "Website info";
            case 4: return "Project settings";
            default: return "Publish Settings";
        }
    };

    const getStepDesc = () => {
        switch (step) {
            case 1: return "Choose your app's URL or use the generated one";
            case 2: return "Choose website access permissions";
            case 3: return "Help people discover your app";
            case 4: return "Review your settings";
            default: return "";
        }
    };

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal-content" onClick={e => e.stopPropagation()}>
                <div className="pm-header">
                    <div>
                        <h2>{getStepTitle()}</h2>
                        <p>{getStepDesc()}</p>
                    </div>
                    <div style={{display:'flex', gap:'12px'}}>
                        <a href="#" className="pm-docs-link">
                            <HelpCircle size={14} />
                            Docs
                        </a>
                        <button className="pm-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="pm-body">
                    {renderStep()}
                </div>

                <div className="pm-footer">
                    {step > 1 ? (
                        <button className="pm-back-btn" onClick={prevStep}>
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}
                    
                    {step < 4 ? (
                        <button className="pm-btn pm-btn-primary" onClick={nextStep}>
                            Continue
                        </button>
                    ) : (
                        <button 
                            className="pm-btn pm-btn-primary" 
                            onClick={() => onPublish({ websiteName: websiteTitle, description })}
                            disabled={isPublishing}
                            style={{minWidth: '120px'}}
                        >
                            {isPublishing ? (
                                <>
                                    <Loader2 size={16} className="ep-spin" style={{marginRight: '8px', display:'inline-block'}} />
                                    Publishing...
                                </>
                            ) : 'Publish'}
                        </button>
                    ) }
                </div>
            </div>
        </div>
    );
};

export default PublishModal;
