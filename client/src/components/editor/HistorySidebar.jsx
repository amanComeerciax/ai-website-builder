import { useState, useEffect } from 'react';
import { Clock, RotateCcw, X, FileCode } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useChatStore } from '../../stores/chatStore';
import { apiClient } from '../../lib/api';
import './HistorySidebar.css';

export default function HistorySidebar({ projectId, onClose }) {
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  const generationPhase = useChatStore(s => s.generationPhase);

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
    if (!confirm("Restore this version? Current code will be overwritten.")) return;
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
                  onClick={() => !isActive && handleRestore(version._id)}
                >
                  <div className="hs-item-name">{version.name || `Version ${versions.length - idx}`}</div>
                  <div className="hs-item-time">{formatTime(version.createdAt)}</div>
                  {isActive && <div className="hs-item-badge">Current</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
