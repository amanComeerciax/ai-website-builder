import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Check, Mail } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { apiClient } from '../../lib/api'
import { toast } from 'react-hot-toast'
import './InviteMembersModal.css'

const ROLES = [
    { id: 'editor', label: 'Editor', desc: 'Can edit projects' },
    { id: 'viewer', label: 'Viewer', desc: 'Can view projects' },
    { id: 'admin', label: 'Admin', desc: 'Full management access' },
]

export default function InviteMembersModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('editor')
    const [isRoleOpen, setIsRoleOpen] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const { getToken } = useAuth()
    const { activeWorkspaceId } = useWorkspaceStore()
    const overlayRef = useRef(null)
    const roleRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    // Close role dropdown on outside click
    useEffect(() => {
        if (!isRoleOpen) return
        const handler = (e) => {
            if (roleRef.current && !roleRef.current.contains(e.target)) setIsRoleOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isRoleOpen])

    if (!isOpen) return null

    const handleSend = async () => {
        if (!email.trim() || !activeWorkspaceId) return
        setIsSending(true)
        try {
            const token = await getToken()
            const data = await apiClient.sendInvitation({
                email: email.trim(),
                role,
                workspaceId: activeWorkspaceId
            }, token)

            const results = data.results || []
            const sent = results.filter(r => r.status === 'sent')
            const alreadyMember = results.filter(r => r.status === 'already_member')
            const alreadyInvited = results.filter(r => r.status === 'already_invited')

            if (sent.length > 0) toast.success(`Invitation sent to ${sent.length} user(s)`)
            if (alreadyMember.length > 0) toast(`${alreadyMember.length} user(s) already in workspace`, { icon: 'ℹ️' })
            if (alreadyInvited.length > 0) toast(`${alreadyInvited.length} user(s) already invited`, { icon: 'ℹ️' })

            setEmail('')
            if (sent.length > 0) onClose()
        } catch (err) {
            toast.error(err.message || 'Failed to send invitation')
        } finally {
            setIsSending(false)
        }
    }

    const selectedRole = ROLES.find(r => r.id === role)

    return (
        <div className="inv-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose() }}>
            <div className="inv-modal">
                <button className="inv-close" onClick={onClose}><X size={18} /></button>

                <h2 className="inv-title">Invite members</h2>
                <p className="inv-subtitle">Invite members to your workspace by email</p>

                <div className="inv-form">
                    <div className="inv-field">
                        <label className="inv-label">Email</label>
                        <div className="inv-email-input-wrap">
                            <Mail size={16} className="inv-email-icon" />
                            <input
                                type="text"
                                className="inv-input"
                                placeholder="example1@email.com, example2@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="inv-field" ref={roleRef}>
                        <label className="inv-label">Role</label>
                        <button className="inv-role-trigger" onClick={() => setIsRoleOpen(!isRoleOpen)}>
                            <span>{selectedRole?.label}</span>
                            <ChevronDown size={14} className={`inv-chevron ${isRoleOpen ? 'open' : ''}`} />
                        </button>
                        {isRoleOpen && (
                            <div className="inv-role-dropdown">
                                {ROLES.map(r => (
                                    <button
                                        key={r.id}
                                        className={`inv-role-option ${role === r.id ? 'active' : ''}`}
                                        onClick={() => { setRole(r.id); setIsRoleOpen(false) }}
                                    >
                                        <div>
                                            <div className="inv-role-name">{r.label}</div>
                                            <div className="inv-role-desc">{r.desc}</div>
                                        </div>
                                        {role === r.id && <Check size={16} className="inv-check" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        className="inv-send-btn"
                        onClick={handleSend}
                        disabled={!email.trim() || isSending}
                    >
                        {isSending ? 'Sending...' : 'Send invitation'}
                    </button>
                </div>
            </div>
        </div>
    )
}
