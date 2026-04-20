import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../stores/authStore';
import { Users, Shield, ShieldAlert, ShieldCheck, Loader2, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminTemplatesPage.css'; // Reusing some base styles

export default function AdminUsersPage() {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { userData, fetchUserData } = useAuthStore();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (isLoaded && isSignedIn && !userData) {
            fetchUserData(getToken);
        }
    }, [isLoaded, isSignedIn, userData, fetchUserData, getToken]);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState(null); // clerkId of user being updated

    useEffect(() => {
        if (isLoaded && isSignedIn && userData) {
            fetchUsers();
        }
    }, [isLoaded, isSignedIn, userData]);

    const fetchUsers = async () => {
        try {
            const token = await getToken();
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (clerkId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Are you sure you want to change this user to ${newRole}?`)) return;

        setActionLoading(clerkId);
        try {
            const token = await getToken();
            const res = await fetch(`/api/admin/users/${clerkId}/role`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.clerkId === clerkId ? { ...u, role: newRole } : u));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update user role');
            }
        } catch (err) {
            console.error('Action failed', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (!isLoaded || (isSignedIn && !userData)) return <div className="admin-loading"><Loader2 className="spinning" /> Loading...</div>;

    const isAdmin = userData?.role === 'admin';
    if (!isSignedIn || !isAdmin) {
        return <div className="admin-unauthorized"><h1>Unauthorized</h1></div>;
    }

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(search.toLowerCase()) || 
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-templates-page">
            <div className="admin-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} /> Dashboard
                </button>
                <div className="admin-brand">
                    <Users size={28} />
                    <h1>User Management</h1>
                </div>
                <p>Manage system roles and permissions for all registered users.</p>
            </div>

            <div className="admin-container">
                <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
                    <div className="search-box" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '8px 16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        width: '100%',
                        maxWidth: '400px'
                    }}>
                        <Search size={18} style={{ opacity: 0.5, marginRight: '10px' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state" style={{ textAlign: 'center', padding: '100px' }}>
                        <Loader2 className="spinning" size={40} />
                        <p style={{ marginTop: '10px', opacity: 0.5 }}>Fetching users...</p>
                    </div>
                ) : (
                    <div className="users-table-container" style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.05)', fontSize: '12px', textTransform: 'uppercase', opacity: 0.5 }}>
                                <tr>
                                    <th style={{ padding: '16px' }}>User</th>
                                    <th style={{ padding: '16px' }}>Status/Tier</th>
                                    <th style={{ padding: '16px' }}>Role</th>
                                    <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.clerkId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '12px' }} />
                                                ) : (
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', marginRight: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {user.name?.charAt(0) || user.email?.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{user.name || 'Anonymous'}</div>
                                                    <div style={{ fontSize: '12px', opacity: 0.5 }}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ 
                                                fontSize: '11px', 
                                                padding: '2px 8px', 
                                                borderRadius: '10px', 
                                                background: user.subscription?.tier === 'pro' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                                                color: user.subscription?.tier === 'pro' ? '#a78bfa' : 'inherit'
                                            }}>
                                                {user.subscription?.tier || 'free'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', color: user.role === 'admin' ? '#10b981' : 'inherit' }}>
                                                {user.role === 'admin' ? <ShieldCheck size={16} style={{ marginRight: '6px' }} /> : <Shield size={16} style={{ marginRight: '6px', opacity: 0.3 }} />}
                                                {user.role || 'user'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button 
                                                className={`action-btn ${user.role === 'admin' ? 'demote' : 'promote'}`}
                                                onClick={() => toggleRole(user.clerkId, user.role || 'user')}
                                                disabled={actionLoading === user.clerkId || user.clerkId === userData.clerkId}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '500',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: user.role === 'admin' ? '#ef4444' : '#10b981',
                                                    opacity: (actionLoading === user.clerkId || user.clerkId === userData.clerkId) ? 0.5 : 1
                                                }}
                                            >
                                                {actionLoading === user.clerkId ? 'Processing...' : (user.role === 'admin' ? 'Revoke Admin' : 'Make Admin')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
