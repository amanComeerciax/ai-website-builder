import { useState } from 'react'
import { X, Briefcase } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { toast } from 'react-hot-toast'
import './CreateWorkspaceModal.css'

export default function CreateWorkspaceModal({ isOpen, onClose }) {
    const [name, setName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { getToken } = useAuth()
    const { createWorkspace, switchWorkspace } = useWorkspaceStore()

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        const token = await getToken()
        if (!token) return

        setIsSubmitting(true)
        try {
            const workspace = await createWorkspace(name.trim(), token)
            await switchWorkspace(workspace._id, token)
            toast.success('Workspace created successfully')
            setName('')
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to create workspace')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="lv-modal-overlay">
            <div className="lv-modal-content create-workspace-modal">
                <button className="lv-modal-close" onClick={onClose}>
                    <X size={18} />
                </button>
                
                <div className="lv-modal-header">
                    <div className="lv-modal-icon-bg">
                        <Briefcase size={20} color="#6366f1" />
                    </div>
                    <h2>Create a Workspace</h2>
                    <p>Workspaces keep your projects and folders organized and isolated.</p>
                </div>

                <form onSubmit={handleSubmit} className="lv-modal-form">
                    <div className="lv-input-group">
                        <label>Workspace Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Marketing Team, Acme Corp"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={40}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="lv-modal-actions">
                        <button 
                            type="button" 
                            className="lv-btn-cancel" 
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="lv-btn-primary"
                            disabled={!name.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Workspace'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
