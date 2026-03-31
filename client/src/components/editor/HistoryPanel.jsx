import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, AlertTriangle, FileCode } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useProjectStore } from '../../stores/projectStore';
import { useChatStore } from '../../stores/chatStore';
import { apiClient } from '../../lib/api';
import './HistoryPanel.css';

export default function HistoryPanel({ projectId }) {
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState(null);

  // Fetch versions using the apiClient (auto-injects Clerk token)
  const fetchVersions = async () => {
    if (!projectId || projectId === 'new') return;
    setIsLoading(true);
    try {
      const data = await apiClient.getProjectVersions(projectId);
      setVersions(data.versions || []);
      setActiveVersionId(data.activeVersionId);
    } catch (err) {
      console.error("Failed to load versions:", err);
      setError("Failed to load version history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  // Re-fetch versions when generation completes
  const generationPhase = useChatStore(s => s.generationPhase);
  useEffect(() => {
    if (generationPhase === 'complete' && projectId) {
      // Small delay to ensure DB has committed the version
      const timer = setTimeout(() => fetchVersions(), 1500);
      return () => clearTimeout(timer);
    }
  }, [generationPhase, projectId]);

  const handleRestore = async (versionId) => {
      if (!confirm("Are you sure you want to restore this version? Your current code will be overwritten.")) return;
      
      setIsRestoring(true);
      try {
          const data = await apiClient.restoreVersion(projectId, versionId);
          
          setActiveVersionId(versionId);
          
          // Force the editor to ingest the newly restored files directly from the server response
          if (data.project && data.project.currentFileTree) {
              const restoredFiles = data.project.currentFileTree;
              
              // 1. Inject files into the virtual file system
              useEditorStore.getState().loadGeneratedFiles(restoredFiles);
              
              // 2. Fix the preview binding! If it's HTML, we MUST update htmlContent
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
              
              // Optional: Switch back to the preview so the user instantly sees the restored UI
              useChatStore.getState().setActiveView('preview');
          }
      } catch (err) {
          console.error("Failed to restore version:", err);
          alert("Failed to restore version.");
      } finally {
          setIsRestoring(false);
      }
  };

  if (isLoading) {
      return (
          <div className="history-panel-loading">
              <Clock className="animate-spin opacity-50 mb-4" size={24} />
              <p>Loading timeline...</p>
          </div>
      );
  }

  if (versions.length === 0) {
      return (
          <div className="history-panel-empty">
              <FileCode className="opacity-30 mb-4" size={32} />
              <h3>No History Yet</h3>
              <p>Your previous generations will appear here.</p>
          </div>
      );
  }

  return (
    <div className="history-panel">
      <div className="hp-header">
        <Clock size={16} />
        <h3>Version Timeline</h3>
      </div>
      
      {error && (
          <div className="hp-error">
              <AlertTriangle size={14} /> {error}
          </div>
      )}

      <div className="hp-timeline">
        <AnimatePresence>
            {versions.map((version, idx) => {
                const isActive = version._id === activeVersionId;
                const isLatest = idx === 0;

                return (
                    <motion.div 
                        key={version._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`hp-version-card ${isActive ? 'active' : ''}`}
                    >
                        <div className="hp-version-timeline-line"></div>
                        <div className={`hp-version-dot ${isActive ? 'active-dot' : ''}`}></div>
                        
                        <div className="hp-version-content">
                            <div className="hp-version-header">
                                <h4>{version.name}</h4>
                                <span className="hp-time">
                                    {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            
                            <div className="hp-version-meta">
                                {new Date(version.createdAt).toLocaleDateString()}
                                {isActive && <span className="hp-badge active">Current State</span>}
                                {!isActive && isLatest && <span className="hp-badge">Latest Generation</span>}
                            </div>

                            {!isActive && (
                                <button 
                                    className="hp-restore-btn"
                                    onClick={() => handleRestore(version._id)}
                                    disabled={isRestoring}
                                >
                                    {isRestoring ? 'Restoring...' : (
                                        <>
                                            <RotateCcw size={12} /> Restore this version
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}
