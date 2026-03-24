import { useState } from 'react'
import { Folder, Lock, Users, X, Loader2 } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { useFolderStore } from '../stores/folderStore'
import { useAuth } from '@clerk/clerk-react'
import './CreateFolderModal.css'

export default function CreateFolderModal() {
  const { isCreateFolderOpen, setCreateFolderOpen } = useUIStore()
  const { createFolder, isLoading, error: folderError } = useFolderStore()
  const { getToken } = useAuth()
  
  const [folderName, setFolderName] = useState('')
  const [visibility, setVisibility] = useState('personal')
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    if (!folderName.trim()) return;
    
    try {
      setError(null);
      const token = await getToken();
      await createFolder(folderName.trim(), visibility, token);
      setFolderName('');
      setCreateFolderOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    }
  }

  if (!isCreateFolderOpen) return null

  return (
    <div className="lv-modal-overlay">
      <div className="lv-modal">
        <div className="lv-modal-header">
          <div>
            <h2>Create folder</h2>
            <p>Group related projects together</p>
          </div>
          <button className="lv-modal-close" onClick={() => setCreateFolderOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="lv-modal-content">
          <div className="lv-input-wrapper">
            <Folder size={16} className="lv-input-icon" />
            <input 
              type="text" 
              placeholder="e.g. Side Projects" 
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>

          {(error || folderError) && (
            <div className="lv-modal-error">
              {error || folderError}
            </div>
          )}

          <div className="lv-visibility-section">
            <label className="lv-vis-label">Visibility</label>
            
            <div 
              className={`lv-vis-option ${visibility === 'personal' ? 'active' : ''}`}
              onClick={() => setVisibility('personal')}
            >
              <div className="lv-radio">
                {visibility === 'personal' && <div className="lv-radio-fill" />}
              </div>
              <div className="lv-vis-text">
                <div className="lv-vis-title">
                  <Folder size={14} /> Personal
                </div>
                <p>Only you can see and add projects to this folder</p>
              </div>
            </div>

            <div 
              className={`lv-vis-option ${visibility === 'workspace' ? 'active' : ''}`}
              onClick={() => setVisibility('workspace')}
            >
              <div className="lv-radio">
                {visibility === 'workspace' && <div className="lv-radio-fill" />}
              </div>
              <div className="lv-vis-text">
                <div className="lv-vis-title">
                  <Users size={14} /> Workspace
                </div>
                <p>All workspace members can see and add projects to this folder</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lv-modal-footer">
          <button className="lv-btn-cancel" onClick={() => setCreateFolderOpen(false)}>Cancel</button>
          <button 
            className="lv-btn-create" 
            disabled={!folderName.trim() || isLoading}
            onClick={handleCreate}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
