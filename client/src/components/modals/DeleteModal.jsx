import { X, AlertTriangle } from 'lucide-react'
import './SidebarModals.css'

export default function DeleteModal({ isOpen, onClose, projectName, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="sb-modal-overlay" onClick={onClose}>
      <div className="sb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sb-modal-header">
          <div>
            <h2>Delete project</h2>
            <p>This action cannot be undone.</p>
          </div>
          <button className="sb-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="sb-modal-body">
          <div className="sb-delete-warning">
            <AlertTriangle size={16} style={{ marginRight: '8px', verticalAlign: 'middle', color: '#ef4444' }} />
            You are about to permanently delete{' '}
            <span className="sb-delete-name">"{projectName}"</span>.
            All files, messages, and version history will be lost.
          </div>
        </div>
        <div className="sb-modal-footer">
          <button className="sb-btn" onClick={onClose}>Cancel</button>
          <button
            className="sb-btn sb-btn-danger"
            onClick={() => { onConfirm(); onClose(); }}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  )
}
