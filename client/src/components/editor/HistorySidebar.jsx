import { useState, useEffect } from 'react';
import { Clock, RotateCcw, X, FileCode, MoreVertical, Trash2, Share2, Rocket, Settings2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useEditorStore } from '../../stores/editorStore';
import { useChatStore } from '../../stores/chatStore';
import { apiClient } from '../../lib/api';
import './HistorySidebar.css';

export default function HistorySidebar({ projectId, onClose }) {
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const generationPhase = useChatStore(s => s.generationPhase);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  // Re-fetch when generation completes
  useEffect(() => {
    if (generationPhase === 'complete' && projectId) {
      const timer = setTimeout(() => fetchVersions(), 1500);
      return () => clearTimeout(timer);
    }
  }, [generationPhase, projectId]);

  const fetchVersions = async () => {
    if (!projectId || projectId === 'new') return;
    setIsLoading(true);
    try {
      const data = await apiClient.getProjectVersions(projectId);
      setVersions(data.versions || []);
      setActiveVersionId(data.activeVersionId);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    setIsRestoring(true);
    try {
      const data = await apiClient.restoreVersion(projectId, versionId);
      setActiveVersionId(versionId);

      if (data.project && data.project.currentFileTree) {
        const restoredFiles = data.project.currentFileTree;
        useEditorStore.getState().loadGeneratedFiles(restoredFiles);

        const isHtml = data.project.outputTrack === 'html' ||
          (!data.project.outputTrack && restoredFiles['index.html'] && Object.keys(restoredFiles).length === 1);

        if (isHtml) {
          const htmlRaw = typeof restoredFiles['index.html'] === 'string'
            ? restoredFiles['index.html']
            : restoredFiles['index.html']?.content || '';
          useEditorStore.getState().setPreview('srcdoc', htmlRaw);
        } else {
          useEditorStore.getState().setPreview('sandpack', null);
        }
        useChatStore.getState().setActiveView('preview');
      }
      onClose();
    } catch (err) {
      console.error("Failed to restore version:", err);
      alert("Failed to restore version.");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteVersion = async (e, versionId) => {
    e.stopPropagation();
    setActiveDropdown(null);
    if (!window.confirm("Are you sure you want to delete this version?")) return;
    
    try {
      await apiClient.deleteVersion(projectId, versionId);
      toast.success("Version deleted");
      fetchVersions(); // refresh the version list
    } catch (err) {
      toast.error("Failed to delete version");
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="hs-overlay">
      <div className="hs-header">
        <div className="hs-header-title">
          <Clock size={14} />
          <span>History</span>
        </div>
        <button className="hs-close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="hs-content">
        {isLoading ? (
          <div className="hs-loading">
            <Clock size={18} className="hs-spin" />
            <span>Loading history...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="hs-empty">
            <FileCode size={24} />
            <span>No history yet</span>
            <p>Your changes will appear here after the first generation.</p>
          </div>
        ) : (
          <div className="hs-list">
            <div className="hs-section-label">Unpublished</div>
            {versions.map((version, idx) => {
              const isActive = version._id === activeVersionId;
              return (
                <div
                  key={version._id}
                  className={`hs-item ${isActive ? 'active' : ''}`}
                  onDoubleClick={() => !isActive && handleRestore(version._id)}
                  title={isActive ? "Current version" : "Double-click to restore this version"}
                  style={{ position: 'relative' }}
                >
                  <div className="hs-item-name" style={{ paddingRight: '20px' }}>{version.name || `Version ${versions.length - idx}`}</div>
                  <div className="hs-item-time">{formatTime(version.createdAt)}</div>
                  {isActive && <div className="hs-item-badge" style={{ right: '35px' }}>Current</div>}

                  <button 
                    className="hs-more-btn"
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === version._id ? null : version._id); }}
                    style={{position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'}}
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeDropdown === version._id && (
                    <div className="hs-dropdown" style={{position: 'absolute', right: '8px', top: 'calc(50% + 12px)', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '4px', minWidth: '130px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)', zIndex: 50}}>
                       <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); toast('Features settings triggered'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer'}} onMouseOver={e=>e.currentTarget.style.background='#334155'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                          <Settings2 size={13} /> Features
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); toast('Share functionality triggered'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer'}} onMouseOver={e=>e.currentTarget.style.background='#334155'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                          <Share2 size={13} /> Share
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); toast('Deploying version...'); }} style={{display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer'}} onMouseOver={e=>e.currentTarget.style.background='#334155'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                          <Rocket size={13} /> Deploy
                       </button>
                       <div style={{height: '1px', background: '#334155', margin: '2px 0'}}></div>
                       <button onClick={(e) => handleDeleteVersion(e, version._id)} style={{display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '6px 8px', background: 'none', border: 'none', color: '#fca5a5', fontSize: '13px', textAlign: 'left', borderRadius: '4px', cursor: 'pointer'}} onMouseOver={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.15)'} onMouseOut={e=>e.currentTarget.style.background='none'}>
                          <Trash2 size={13} /> Delete
                       </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
