import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '../../lib/api'
import { useToast } from '../UIComponents/Toasts/tsx/ToastPill'
import { useProjectStore } from '../../stores/projectStore'

export default function JoinProjectModal({ inviteToken, onClose }) {
    const navigate = useNavigate()
    const { getToken, isSignedIn } = useAuth()
    const { toast } = useToast()

    const [inviteInfo, setInviteInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        const fetchInfo = async () => {
            if (!inviteToken) return;
            try {
                const data = await apiClient.getProjectInviteInfo(inviteToken)
                setInviteInfo(data)
            } catch (err) {
                setError(err.message || 'Invalid or expired invite link')
            } finally {
                setLoading(false)
            }
        }
        fetchInfo()
    }, [inviteToken])

    const handleAccept = async () => {
        if (!isSignedIn) {
            navigate(`/login?redirect=/project-invite/${inviteToken}`)
            return
        }
        setProcessing(true)
        try {
            const authToken = await getToken()
            const data = await apiClient.acceptProjectInvite(inviteToken, authToken)
            toast({ title: "You've joined the project!", variant: 'success', duration: 3000 })
            // Refresh projects so the newly joined project becomes available
            await useProjectStore.getState().fetchProjects(authToken)
            onClose(data.projectId) // close the modal and update url
        } catch (err) {
            toast({ title: err.message || 'Failed to join', variant: 'error', duration: 4000 })
            setProcessing(false)
            if (err.message?.includes('already a collaborator') || err.message?.includes('owner of this project')) {
                 onClose()
            }
        }
    }

    const handleDecline = async () => {
        if (isSignedIn) {
            try {
                const authToken = await getToken()
                await apiClient.declineProjectInvite(inviteToken, authToken)
            } catch {}
        }
        toast({ title: 'Invitation declined', variant: 'neutral', duration: 2000 })
        navigate('/dashboard')
    }

    if (!inviteToken) return null

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                width: '420px', background: '#161616', border: '1px solid #2a2a2a',
                borderRadius: '16px', padding: '40px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {loading ? (
                    <>
                        <div style={{
                            width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)',
                            borderTopColor: '#3b82f6', borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#888', marginTop: '12px', fontSize: '14px' }}>Loading invitation...</p>
                    </>
                ) : error ? (
                    <>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>❌</div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Invitation Expired</h2>
                        <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>{error}</p>
                        <button 
                            style={{ width: '100%', height: '44px', borderRadius: '10px', border: 'none', background: '#fff', color: '#111', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} 
                            onClick={() => navigate('/dashboard')}
                        >
                            Go to Dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #f97316, #ec4899)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '20px',
                        }}>
                            <span style={{ fontSize: '20px' }}>🔥</span>
                        </div>

                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>You've been invited!</h2>
                        <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                            You've been invited to collaborate on "<strong style={{ color: '#fff' }}>{inviteInfo.projectName}</strong>" by {inviteInfo.invitedByName}.
                        </p>

                        <button
                            style={{ width: '100%', height: '44px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', color: '#111', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px', transition: 'all 0.15s' }}
                            onClick={handleAccept}
                            disabled={processing}
                        >
                            <span style={{ fontSize: '14px' }}>✓</span>
                            {processing ? 'Joining...' : 'Accept invitation'}
                        </button>

                        <button
                            style={{ width: '100%', height: '44px', borderRadius: '10px', border: '1px solid #333', background: 'transparent', color: '#888', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
                            onClick={handleDecline}
                            disabled={processing}
                        >
                            <span style={{ fontSize: '14px' }}>✕</span>
                            Decline invitation
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
