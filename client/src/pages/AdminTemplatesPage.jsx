import { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { LayoutTemplate, PlusCircle, Check, AlertCircle, Loader2, Layers, Zap, FileCode } from 'lucide-react';
import './AdminTemplatesPage.css';

export default function AdminTemplatesPage() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { user } = useUser();
    
    const [formData, setFormData] = useState({
        title: '',
        category: 'saas',
        description: '',
        htmlContent: ''
    });
    
    const [status, setStatus] = useState({ type: 'idle', message: '' });
    const [chunkingResult, setChunkingResult] = useState(null);

    const categories = [
        'saas', 'portfolio', 'landing', 'blog', 'ecommerce', 
        'restaurant', 'wellness', 'coffee-shop', 'fashion', 'service', 'sports', 'custom'
    ];

    // Live stats for the HTML textarea
    const lineCount = formData.htmlContent ? formData.htmlContent.split('\n').length : 0;
    const byteCount = formData.htmlContent ? new Blob([formData.htmlContent]).size : 0;
    const sizeKB = (byteCount / 1024).toFixed(1);
    const needsChunking = lineCount > 800 || byteCount > 25000;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.htmlContent) {
            setStatus({ type: 'error', message: 'Title and HTML content are required.' });
            return;
        }

        setStatus({ type: 'loading', message: 'Uploading template...' });
        setChunkingResult(null);

        try {
            const token = await getToken();
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Template successfully created!' });
                setChunkingResult(data.chunking || null);
                setFormData({ title: '', category: 'saas', description: '', htmlContent: '' });
                setTimeout(() => setStatus({ type: 'idle', message: '' }), 10000);
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to upload template.' });
            }
        } catch (err) {
            console.error('Error uploading template:', err);
            setStatus({ type: 'error', message: 'A network error occurred.' });
        }
    };

    if (!isLoaded) return <div className="admin-loading"><Loader2 className="spinning" /> Loading...</div>;

    // Security block on frontend
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (!isSignedIn || userEmail !== 'kingamaan14@gmail.com') {
        return (
            <div className="admin-unauthorized">
                <AlertCircle size={48} color="#ef4444" />
                <h1>Unauthorized</h1>
                <p>This page is restricted to administrators only.</p>
            </div>
        );
    }

    return (
        <div className="admin-templates-page">
            <div className="admin-header">
                <div className="admin-brand">
                    <LayoutTemplate size={28} />
                    <h1>Template Admin Panel</h1>
                </div>
                <p>Upload new templates directly to the filesystem and MongoDB.</p>
            </div>

            <div className="admin-container">
                <form onSubmit={handleSubmit} className="admin-form">
                    {status.type !== 'idle' && (
                        <div className={`admin-status alert-${status.type}`}>
                            {status.type === 'loading' && <Loader2 size={18} className="spinning" />}
                            {status.type === 'success' && <Check size={18} />}
                            {status.type === 'error' && <AlertCircle size={18} />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    {/* Chunking analysis result */}
                    {chunkingResult && (
                        <div className={`chunking-result ${chunkingResult.enabled ? 'chunked' : 'standard'}`}>
                            <div className="chunking-header">
                                {chunkingResult.enabled ? <Layers size={20} /> : <Zap size={20} />}
                                <strong>
                                    {chunkingResult.enabled 
                                        ? `Auto-Chunker: ${chunkingResult.editableSections} sections detected`
                                        : 'Standard mode — no chunking needed'
                                    }
                                </strong>
                            </div>
                            <div className="chunking-meta">
                                <span>{chunkingResult.lineCount} lines</span>
                                <span>{chunkingResult.sizeKB} KB</span>
                            </div>
                            {chunkingResult.enabled && chunkingResult.sections && (
                                <div className="chunking-sections">
                                    {chunkingResult.sections.filter(s => s.editable).map((s, i) => (
                                        <div key={i} className="chunk-tag">
                                            <FileCode size={12} />
                                            <span>{s.id}</span>
                                            <small>{s.lines}L</small>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group row">
                        <div className="form-field">
                            <label>Template Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Modern SaaS Hero" 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Category</label>
                            <select 
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Description (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="Brief description of the template's purpose..." 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="form-field">
                        <label>Raw HTML Code</label>
                        <textarea 
                            placeholder="Paste your raw HTML here..." 
                            value={formData.htmlContent}
                            onChange={e => setFormData({...formData, htmlContent: e.target.value})}
                            required
                        />
                        {/* Live size indicator */}
                        {formData.htmlContent && (
                            <div className={`size-indicator ${needsChunking ? 'chunked' : 'safe'}`}>
                                <div className="size-stats">
                                    <span>{lineCount} lines</span>
                                    <span className="size-dot">·</span>
                                    <span>{sizeKB} KB</span>
                                </div>
                                <div className={`size-badge ${needsChunking ? 'badge-chunked' : 'badge-safe'}`}>
                                    {needsChunking ? (
                                        <><Layers size={12} /> Auto-Chunker will activate</>
                                    ) : (
                                        <><Zap size={12} /> Standard mode</>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="admin-submit-btn"
                        disabled={status.type === 'loading'}
                    >
                        {status.type === 'loading' ? 'Uploading...' : 'Save Template'}
                        {!status.type && <PlusCircle size={16} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
