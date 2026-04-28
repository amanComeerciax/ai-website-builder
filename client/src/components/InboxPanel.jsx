import { useState, useEffect } from 'react'
import { Mail, Check, XCircle, Clock } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useInvitationStore } from '../stores/invitationStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useProjectStore } from '../stores/projectStore'
import { apiClient } from '../lib/api'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import './InboxPanel.css'

export default function InboxPanel({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('inbox')
    const { getToken } = useAuth()
    const { inbox, inboxCount, isLoading, fetchInbox, acceptInvitation, declineInvitation, removeFromInbox } = useInvitationStore()
    const { fetchWorkspaces } = useWorkspaceStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (isOpen) {
            getToken().then(token => fetchInbox(token))
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleAccept = async (inv) => {
        try {
            const token = await getToken()
            if (inv.inviteType === 'project') {
                try {
                    const data = await apiClient.acceptProjectInvite(inv.token, token)
                    removeFromInbox(inv._id)
                    toast.success("You've joined the project!")
                    useProjectStore.getState().fetchProjects(token)
                    // No redirect for inbox acceptance
                } catch (err) {
                    if (
                        err.message?.includes('already a collaborator') || 
                        err.message?.includes('owner of this project') ||
                        err.message?.toLowerCase().includes('expired') ||
                        err.message?.toLowerCase().includes('invalid')
                    ) {
                        removeFromInbox(inv._id)
                        toast.error(err.message)
                        onClose()
                    } else {
                        throw err
                    }
                }
            } else {
                await acceptInvitation(inv._id, token)
                toast.success('Invitation accepted! Workspace added.')
                await fetchWorkspaces(token)
            }
        } catch (err) {
            toast.error(err.message || 'Failed to accept invitation')
        }
    }

    const handleDecline = async (inv) => {
        try {
            const token = await getToken()
            if (inv.inviteType === 'project') {
                try {
                    await apiClient.declineProjectInvite(inv.token, token)
                } catch (err) {
                    // Ignore error if it's already expired/deleted, just remove locally
                }
                removeFromInbox(inv._id)
            } else {
                await declineInvitation(inv._id, token)
            }
            toast('Invitation declined', { icon: '✕' })
        } catch (err) {
            toast.error(err.message || 'Failed to decline invitation')
        }
    }

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days} days ago`
    }

    return (
        <>
            <div className="lv-inbox-backdrop" onClick={onClose} />
            <div className="lv-inbox-popup">
                <div className="lv-inbox-tabs">
                    <button
                        className={`lv-inbox-tab ${activeTab === 'inbox' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inbox')}
                    >
                        Inbox
                    </button>
                    <button
                        className={`lv-inbox-tab ${activeTab === 'updates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('updates')}
                    >
                        What's new
                    </button>
                    {activeTab === 'inbox' && inbox.length > 0 && (
                        <button 
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', fontSize: '11px', cursor: 'pointer', padding: '0 8px' }}
                            onClick={() => {
                                inbox.forEach(inv => removeFromInbox(inv._id));
                                toast.success('Inbox cleared locally');
                            }}
                        >
                            Clear all
                        </button>
                    )}
                </div>

                <div className="lv-inbox-body">
                    {activeTab === 'inbox' ? (
                        isLoading ? (
                            <div className="lv-inbox-empty">
                                <div className="lv-inbox-spinner" />
                                <p>Loading...</p>
                            </div>
                        ) : inbox.length === 0 ? (
                            <div className="lv-inbox-empty">
                                <Mail size={32} strokeWidth={1.2} className="lv-inbox-empty-icon" />
                                <h4>No messages or invites</h4>
                                <p>Workspace and project invitations will appear here</p>
                            </div>
                        ) : (
                            inbox.map(inv => (
                                <div key={inv._id} className="lv-inbox-item">
                                    <div className="lv-inbox-item-avatar">
                                        {inv.invitedByName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="lv-inbox-item-body">
                                        <p className="lv-inbox-item-text">
                                            <strong>{inv.invitedByName || 'Someone'}</strong> invited you to{' '}
                                            {inv.inviteType === 'project' ? (
                                                <>project "<strong>{inv.projectName || 'a project'}</strong>"</>
                                            ) : (
                                                <><strong>{inv.workspaceName || 'a workspace'}</strong></>
                                            )}
                                            {' '}as <span className="lv-inbox-role-tag">{inv.role}</span>
                                        </p>
                                        <div className="lv-inbox-item-time">
                                            <Clock size={10} /> {timeAgo(inv.createdAt)}
                                        </div>
                                        <div className="lv-inbox-item-actions">
                                            <button className="lv-inbox-accept" onClick={() => handleAccept(inv)}>
                                                <Check size={12} /> Accept
                                            </button>
                                            <button className="lv-inbox-decline" onClick={() => handleDecline(inv)}>
                                                <XCircle size={12} /> Dismiss
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        /* What's new tab — static content like Lovable */
                        <>
                            <div className="lv-inbox-news-item">
                                <h4 className="lv-inbox-news-title">
                                    <span className="lv-inbox-news-dot" />
                                    Latest StackForge updates
                                </h4>
                                <p className="lv-inbox-news-desc">Take a look at the latest features, improvements, and bug fixes in StackForge.</p>
                                <span className="lv-inbox-news-time">Just now</span>
                            </div>
                            <div className="lv-inbox-news-item">
                                <h4 className="lv-inbox-news-title">
                                    <span className="lv-inbox-news-dot" />
                                    Workspace collaboration
                                </h4>
                                <p className="lv-inbox-news-desc">Invite team members to your workspace. Assign roles and manage access.</p>
                                <span className="lv-inbox-news-time">Today</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

