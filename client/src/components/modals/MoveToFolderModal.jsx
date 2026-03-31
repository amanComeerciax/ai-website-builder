import { useState, useMemo } from 'react'
import { X, Search, FolderPlus, Folder, Circle } from 'lucide-react'
import { useFolderStore } from '../../stores/folderStore'
import { useAuth } from '@clerk/clerk-react'
import './SidebarModals.css'

export default function MoveToFolderModal({ isOpen, onClose, projectName, currentFolderId, onConfirm }) {
  const { folders, createFolder } = useFolderStore()
  const { getToken } = useAuth()

  const [search, setSearch] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState(currentFolderId || null)
  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders
    return folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  }, [folders, search])

  if (!isOpen) return null

  const handleSave = () => {
    onConfirm(selectedFolderId)
    onClose()
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const token = await getToken()
      const newFolder = await createFolder(newFolderName.trim(), 'personal', token)
      setSelectedFolderId(newFolder.id)
      setNewFolderName('')
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to create folder:', err)
    }
  }

  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sb-modal-header">
          <div>
            <h2>Move to folder</h2>
            <p>Select a folder to move "{projectName}" to. A project can only be in one folder at a time.</p>
          </div>
          <button className="sb-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="sb-modal-body">
          {/* Search */}
          <div className="sb-search-wrapper">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search folders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Create New Folder */}
          {isCreating ? (
            <div className="sb-new-folder-row">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <button onClick={handleCreateFolder}>Create</button>
              <button onClick={() => { setIsCreating(false); setNewFolderName(''); }}>✕</button>
            </div>
          ) : (
            <button className="sb-create-folder-btn" onClick={() => setIsCreating(true)}>
              <FolderPlus size={14} />
              <span>Create new folder</span>
            </button>
          )}

          {/* Folder List */}
          <div className="sb-folder-list">
            {/* No folder option */}
            <button
              className={`sb-folder-item ${selectedFolderId === null ? 'active' : ''}`}
              onClick={() => setSelectedFolderId(null)}
            >
              <Circle size={14} fill={selectedFolderId === null ? '#60a5fa' : 'none'} color={selectedFolderId === null ? '#60a5fa' : '#666'} />
              <span>No folder</span>
              {currentFolderId === null && <span className="sb-folder-badge">Current</span>}
            </button>

            {filteredFolders.map(folder => (
              <button
                key={folder.id}
                className={`sb-folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <Folder size={14} />
                <span>{folder.name}</span>
                {currentFolderId === folder.id && <span className="sb-folder-badge">Current</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="sb-modal-footer">
          <button className="sb-btn" onClick={onClose}>Cancel</button>
          <button className="sb-btn sb-btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
