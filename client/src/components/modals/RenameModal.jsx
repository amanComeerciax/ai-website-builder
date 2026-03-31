import { useState, useEffect } from 'react'
import { X, Edit2 } from 'lucide-react'
import './SidebarModals.css'

export default function RenameModal({ isOpen, onClose, projectName, onConfirm }) {
  const [name, setName] = useState(projectName || '')

  useEffect(() => {
    if (isOpen) setName(projectName || '')
  }, [isOpen, projectName])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (name.trim() && name.trim() !== projectName) {
      onConfirm(name.trim())
    }
    onClose()
  }

  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sb-modal-header">
          <div>
            <h2>Rename project</h2>
            <p>Give your project a new name</p>
          </div>
          <button className="sb-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="sb-modal-body">
          <input
            className="sb-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Project name"
            autoFocus
          />
        </div>
        <div className="sb-modal-footer">
          <button className="sb-btn" onClick={onClose}>Cancel</button>
          <button
            className="sb-btn sb-btn-primary"
            disabled={!name.trim() || name.trim() === projectName}
            onClick={handleSubmit}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
