import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiClient } from '../lib/api'
import { useToast } from '../components/UIComponents/Toasts/tsx/ToastPill'

export default function JoinProjectPage() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { getToken, isSignedIn } = useAuth()
    const { toast } = useToast()

    const [inviteInfo, setInviteInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const data = await apiClient.getProjectInviteInfo(token)
                // SUCCESS -> REDIRECT TO CHAT PAGE WITH OVERLAY
                navigate(`/chat/${data.projectId}?inviteToken=${token}`, { replace: true })
            } catch (err) {
                setError(err.message || 'Invalid or expired invite link')
                setLoading(false)
            }
        }
        fetchInfo()
    }, [token])

    const handleAccept = async () => {
        if (!isSignedIn) {
            navigate(`/login?redirect=/project-invite/${token}`)
            return
        }
        setProcessing(true)
        try {
            const authToken = await getToken()
            const data = await apiClient.acceptProjectInvite(token, authToken)
            toast({ title: "You've joined the project!", variant: 'success', duration: 3000 })
            navigate(`/chat/${data.projectId}`)
        } catch (err) {
            toast({ title: err.message || 'Failed to join', variant: 'error', duration: 4000 })
            setProcessing(false)
        }
    }

    const handleDecline = async () => {
        if (isSignedIn) {
            try {
                const authToken = await getToken()
                await apiClient.declineProjectInvite(token, authToken)
            } catch {}
        }
        toast({ title: 'Invitation declined', variant: 'neutral', duration: 2000 })
        navigate('/dashboard')
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', padding: '20px', textAlign: 'center' }}>
                <div>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Invitation Invalid</h2>
                    <p style={{ color: '#888', marginBottom: '24px' }}>{error}</p>
                    <button 
                        style={{ padding: '10px 24px', borderRadius: '8px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    )
}

const pageStyle = {
    minHeight: '100vh', width: '100vw', background: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const cardStyle = {
    width: '420px', background: '#161616', border: '1px solid #2a2a2a',
    borderRadius: '16px', padding: '40px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
}

const iconContainerStyle = {
    fontSize: '32px', marginBottom: '16px',
}

const titleStyle = {
    color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px',
}

const subtitleStyle = {
    color: '#888', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px',
}

const actionBtnStyle = {
    width: '100%', height: '44px', borderRadius: '10px', border: '1px solid',
    fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    marginBottom: '8px', transition: 'all 0.15s',
}

const primaryBtnStyle = {
    width: '100%', height: '44px', borderRadius: '10px', border: 'none',
    background: '#fff', color: '#111', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer',
}

const spinnerStyle = {
    width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#3b82f6', borderRadius: '50%',
    animation: 'spin 1s linear infinite',
}
