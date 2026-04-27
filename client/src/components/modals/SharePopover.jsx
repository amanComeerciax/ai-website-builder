import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, ChevronRight, ChevronDown, UserPlus, Upload, Link2, ArrowLeft, Edit, Eye, Ban, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useToast } from '../UIComponents/Toasts/tsx/ToastPill';
import { apiClient } from '../../lib/api';

export default function SharePopover({ isOpen, onClose, buttonRef, projectId, publishedUrl }) {
    const [panel, setPanel] = useState(0); // 0=main, 1=people, 2=preview
    const [linkAccess, setLinkAccess] = useState('disabled'); // Starts disabled
    const [accessDropdownAnchor, setAccessDropdownAnchor] = useState(null); // {top, left, right} for fixed positioning
    const [activeDropdownId, setActiveDropdownId] = useState(null); // 'link1' | 'link2'
    const [inviteEmail, setInviteEmail] = useState('');
    const [collaborators, setCollaborators] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [ownerInfo, setOwnerInfo] = useState(null);
    const [inviteSending, setInviteSending] = useState(false);
    const [linkGenerating, setLinkGenerating] = useState(false);
    const [emailRole, setEmailRole] = useState('editor');
    const [isOwner, setIsOwner] = useState(false);
    const popoverRef = useRef(null);
    const { toast } = useToast();
    const { getToken } = useAuth();

    const { userData } = useAuthStore();
    const { workspaces, activeWorkspaceId } = useWorkspaceStore();

    const activeWorkspace = workspaces?.find(w => w._id === activeWorkspaceId) || { name: 'Workspace' };
    const userName = userData?.firstName
        ? `${userData.firstName}${userData.lastName ? ' ' + userData.lastName : ''}`
        : userData?.email?.split('@')[0] || 'You';
    const userHandle = userData?.username || userData?.email?.split('@')[0] || 'you';
    const userEmail = userData?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();
    const wsInitial = activeWorkspace.name.charAt(0).toUpperCase();

    /* ─── Fetch collaborators ─── */
    const fetchCollaborators = useCallback(async () => {
        if (!projectId) return;
        try {
            const token = await getToken();
            const data = await apiClient.getProjectCollaborators(projectId, token);
            setCollaborators(data.collaborators || []);
            setPendingInvites(data.pendingInvitations || []);
            setOwnerInfo(data.owner || null);
            setIsOwner(data.isOwner || false);
        } catch { /* silent */ }
    }, [projectId, getToken]);

    useEffect(() => { if (isOpen && projectId) fetchCollaborators(); }, [isOpen, projectId, fetchCollaborators]);

    /* ─── Reset on close ─── */
    useEffect(() => {
        if (!isOpen) {
            const t = setTimeout(() => { setPanel(0); setActiveDropdownId(null); setInviteEmail(''); }, 400);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    /* ─── Outside click to close popover ─── */
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e) => {
            // Don't close if clicking inside the access dropdown (it's fixed-position, outside popoverRef)
            if (e.target.closest('[data-share-dropdown]')) return;
            if (
                popoverRef.current && !popoverRef.current.contains(e.target) &&
                buttonRef?.current && !buttonRef.current.contains(e.target)
            ) onClose();
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [isOpen, onClose, buttonRef]);

    /* ─── Send email invite ─── */
    const handleSendInvite = async () => {
        if (!inviteEmail.trim() || !projectId) return;
        setInviteSending(true);
        try {
            const token = await getToken();
            const res = await apiClient.sendProjectInvitation(projectId, { email: inviteEmail.trim(), role: emailRole }, token);
            toast({ title: `Invitation sent to ${inviteEmail.trim()}`, variant: 'success', duration: 3000 });
            setInviteEmail('');
            if (res.invitation) {
                setPendingInvites(prev => [...prev, res.invitation]);
            } else {
                fetchCollaborators();
            }
        } catch (err) {
            toast({ title: err.message || 'Failed to send invitation', variant: 'error', duration: 3000 });
        } finally { setInviteSending(false); }
    };

    const handleCollabAccessChange = async (userIdOrEmail, newRole) => {
        try {
            const token = await getToken();
            if (newRole === 'disabled') {
                await apiClient.removeProjectCollaborator(projectId, userIdOrEmail, token);
                setCollaborators(prev => prev.filter(c => (c.userId || c.email) !== userIdOrEmail));
                toast({ title: 'Access removed', variant: 'success', duration: 2000 });
            } else {
                await apiClient.updateProjectCollaboratorRole(projectId, userIdOrEmail, newRole, token);
                setCollaborators(prev => prev.map(c => (c.userId || c.email) === userIdOrEmail ? { ...c, role: newRole } : c));
                toast({ title: 'Role updated', variant: 'success', duration: 2000 });
            }
        } catch (err) {
            toast({ title: err.message || 'Failed to update access', variant: 'error', duration: 3000 });
        }
    };

    const handlePendingInviteAccessChange = async (invitationId, newRole) => {
        try {
            const token = await getToken();
            if (newRole === 'disabled' || newRole === 'cancel') {
                await apiClient.revokeProjectInvitation(projectId, invitationId, token);
                setPendingInvites(prev => prev.filter(p => p._id !== invitationId));
                toast({ title: 'Invitation cancelled', variant: 'success', duration: 2000 });
            } else {
                await apiClient.updateProjectInvitationRole(projectId, invitationId, newRole, token);
                setPendingInvites(prev => prev.map(p => p._id === invitationId ? { ...p, role: newRole } : p));
                toast({ title: 'Invitation updated', variant: 'success', duration: 2000 });
            }
        } catch (err) {
            toast({ title: err.message || 'Failed to update invitation', variant: 'error', duration: 3000 });
        }
    };

    /* ─── Generate & copy invite link ─── */
    const handleCreateLink = async () => {
        if (!projectId) return;
        if (linkAccess === 'disabled') {
            toast({ title: 'Select "Edit access" or "View access" first', variant: 'warning', duration: 3000 });
            return;
        }
        setLinkGenerating(true);
        try {
            const token = await getToken();
            const data = await apiClient.generateProjectInviteLink(projectId, { role: linkAccess }, token);
            await navigator.clipboard.writeText(data.inviteUrl);
            toast({ title: 'Invite link copied! Expires in 8 hours', variant: 'success', duration: 3000 });
        } catch (err) {
            toast({ title: err.message || 'Failed to generate link', variant: 'error', duration: 3000 });
        } finally { setLinkGenerating(false); }
    };

    /* ─── Open dropdown using fixed positioning to escape overflow ─── */
    const openDropdown = (e, id) => {
        e.stopPropagation();
        if (activeDropdownId === id) { setActiveDropdownId(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setAccessDropdownAnchor({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        setActiveDropdownId(id);
    };

    if (!isOpen) return null;

    const collabCount = collaborators.length + pendingInvites.length;
    const panel2Height = 120 + 48 + (1 + collabCount) * 44 + 8 + 44 + 44 + 60;

    const PANEL_WIDTH = 360;

    return (
        <>
            {/* ── Outer shell ── */}
            <div
                ref={popoverRef}
                style={{
                    position: 'absolute', top: '100%', right: 0,
                    width: `${PANEL_WIDTH}px`,
                    background: '#1a1a1a',
                    border: '1px solid #2e2e2e',
                    borderRadius: '0 0 14px 14px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    zIndex: 9998,
                    // height driven by panel
                    height: panel === 0 ? '460px' : panel === 1 ? `${Math.max(panel2Height, 440)}px` : '400px',
                    transition: 'height 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* ── Sliding track ── */}
                <div style={{
                    display: 'flex',
                    width: `${PANEL_WIDTH * 3}px`,
                    height: '100%',
                    transform: `translateX(-${panel * PANEL_WIDTH}px)`,
                    transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                }}>

                    {/* ══════════ PANEL 1 — MAIN ══════════ */}
                    <div style={{ ...pStyle(PANEL_WIDTH), overflowY: 'auto' }}>
                        <h2 style={titleStyle}>Share project</h2>

                        {/* Add people fake input - only for owner */}
                        {isOwner && (
                            <div style={fakInputStyle} onClick={() => setPanel(1)}>
                                Add people
                            </div>
                        )}

                        <SectionLabel>Project access</SectionLabel>

                        {/* People you invited */}
                        <Row
                            left={<IconBox><Globe size={14} color="#888" /></IconBox>}
                            label={`People you invited${collabCount > 0 ? ` (${collabCount})` : ''}`}
                            right={<ChevronRight size={14} color="#555" />}
                            onClick={() => setPanel(1)}
                            hoverable
                        />
                        {collaborators.map((c, i) => (
                            <Row key={`c-p1-${i}`}
                                left={<Avatar bg="#10b981">{(c.name || c.email)?.charAt(0)?.toUpperCase()}</Avatar>}
                                label={<TwoLine top={c.name || c.email} bot={`${c.email} • ${c.workspaceName || 'Workspace'}`} />}
                                right={
                                    isOwner ? (
                                        <button
                                            onClick={(e) => openDropdown(e, `collab-p1-${c.userId || c.email}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#888', padding: 0 }}
                                        >
                                            {c.role === 'editor' ? 'Can edit' : 'Can view'} <ChevronDown size={10} />
                                        </button>
                                    ) : (
                                        <MetaChip>{c.role === 'editor' ? 'Can edit' : 'Can view'}</MetaChip>
                                    )
                                }
                            />
                        ))}

                        {pendingInvites.map((p, i) => (
                            <Row key={`p-p1-${i}`}
                                left={<Avatar bg="#555">{p.invitedEmail?.charAt(0)?.toUpperCase()}</Avatar>}
                                label={<TwoLine top={p.invitedEmail} bot="Pending..." botColor="#555" />}
                                right={
                                    isOwner ? (
                                        <button
                                            onClick={(e) => openDropdown(e, `pending-p1-${p._id}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#555', padding: 0 }}
                                        >
                                            {p.role === 'editor' ? 'Can edit' : 'Can view'} <ChevronDown size={10} />
                                        </button>
                                    ) : (
                                        <MetaChip>Pending</MetaChip>
                                    )
                                }
                            />
                        ))}

                        {/* Workspace */}
                        <Row
                            left={<Avatar bg="#d4622a">{wsInitial}</Avatar>}
                            label={activeWorkspace.name}
                            right={<MetaChip>Can edit</MetaChip>}
                        />

                        {/* You */}
                        <Row
                            left={<Avatar bg="#3b82f6">{ownerInfo?.name ? ownerInfo.name.charAt(0).toUpperCase() : userInitial}</Avatar>}
                            label={<TwoLine top={`${ownerInfo?.name || userHandle}${isOwner ? ' (you)' : ''}`} bot={ownerInfo?.email || userEmail} />}
                            right={<span style={{ fontSize: '12px', color: '#888' }}>Owner</span>}
                        />

                        {/* Invite link row */}
                        {isOwner && (
                            <Row
                                left={<IconBox><UserPlus size={14} color="#888" /></IconBox>}
                                label="Invite link"
                                right={
                                    <button
                                        onClick={(e) => openDropdown(e, 'link1')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#888', padding: 0 }}
                                    >
                                        {accessLabel(linkAccess)} <ChevronDown size={10} />
                                    </button>
                                }
                            />
                        )}

                        <div style={divStyle} />

                        {/* Create invite link button — only if owner */}
                        {isOwner && (
                            <button
                                style={{
                                    ...bigBtnStyle,
                                    background: linkAccess === 'disabled' ? '#3a3a3a' : '#e8e8e8',
                                    color: linkAccess === 'disabled' ? '#888' : '#111',
                                    cursor: 'pointer',
                                }}
                                onClick={handleCreateLink}
                                disabled={linkGenerating}
                            >
                                {linkGenerating ? 'Generating...' : linkAccess === 'disabled' ? 'Copy invite link' : 'Copy invite link'}
                            </button>
                        )}

                        <div style={divStyle} />

                        {/* Publish project */}
                        <GhostBtn
                            icon={<Upload size={14} />}
                            label="Publish project"
                            onClick={() => { onClose(); document.querySelector('.ep-deploy-btn')?.click(); }}
                        />

                        {/* Share preview — always visible, toast if not deployed */}
                        <GhostBtn
                            icon={<Link2 size={14} />}
                            label="Share preview"
                            onClick={() => {
                                if (!publishedUrl) {
                                    toast({ title: 'Deploy project first to share preview', variant: 'warning', duration: 3000 });
                                } else {
                                    setPanel(2);
                                }
                            }}
                        />

                        <div style={{ height: '10px' }} />
                    </div>

                    {/* ══════════ PANEL 2 — PEOPLE YOU INVITED ══════════ */}
                    <div style={{ ...pStyle(PANEL_WIDTH), overflowY: 'auto' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <BackBtn onClick={() => setPanel(0)} />
                            <h2 style={titleStyle}>Share project</h2>
                        </div>

                        {/* Email invite input */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                placeholder="Invite by email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSendInvite(); }}
                                style={{
                                    flex: 1, background: '#2a2a2a', border: '1px solid #333',
                                    borderRadius: '8px', height: '40px', padding: '0 12px',
                                    fontSize: '13px', color: '#fff', outline: 'none',
                                }}
                            />
                            <button
                                onClick={handleSendInvite}
                                disabled={!inviteEmail.trim() || inviteSending}
                                style={{
                                    background: inviteEmail.trim() ? '#fff' : '#444',
                                    color: inviteEmail.trim() ? '#111' : '#666',
                                    fontWeight: 700, fontSize: '13px', borderRadius: '8px',
                                    border: 'none', padding: '0 14px', height: '40px',
                                    cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                }}
                            >
                                {inviteSending ? '...' : 'Invite'}
                            </button>
                        </div>

                        {/* Role selector for email invite */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '12px', color: '#888' }}>Role:</span>
                            <button
                                onClick={() => setEmailRole('editor')}
                                style={{
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                    border: emailRole === 'editor' ? '1px solid #3b82f6' : '1px solid #333',
                                    background: emailRole === 'editor' ? 'rgba(59,130,246,0.15)' : '#2a2a2a',
                                    color: emailRole === 'editor' ? '#60a5fa' : '#888',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >Can edit</button>
                            <button
                                onClick={() => setEmailRole('viewer')}
                                style={{
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                    border: emailRole === 'viewer' ? '1px solid #3b82f6' : '1px solid #333',
                                    background: emailRole === 'viewer' ? 'rgba(59,130,246,0.15)' : '#2a2a2a',
                                    color: emailRole === 'viewer' ? '#60a5fa' : '#888',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >Can view</button>
                        </div>

                        {/* Who has access */}
                        <SectionLabel>Who has access</SectionLabel>

                        <Row
                            left={<Avatar bg="#3b82f6">{ownerInfo?.name?.charAt(0)?.toUpperCase() || userInitial}</Avatar>}
                            label={<TwoLine top={`${ownerInfo?.name || userHandle} (you)`} bot={ownerInfo?.email || userEmail} />}
                            right={<span style={{ fontSize: '12px', color: '#888' }}>Owner</span>}
                        />

                        {collaborators.map((c, i) => (
                            <Row key={`c-p2-${i}`}
                                left={<Avatar bg="#10b981">{(c.name || c.email)?.charAt(0)?.toUpperCase()}</Avatar>}
                                label={<TwoLine top={c.name || c.email} bot={`${c.email} • ${c.workspaceName || 'Workspace'}`} />}
                                right={
                                    isOwner ? (
                                        <button
                                            onClick={(e) => openDropdown(e, `collab-p2-${c.userId || c.email}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#888', padding: 0 }}
                                        >
                                            {c.role === 'editor' ? 'Can edit' : 'Can view'} <ChevronDown size={10} />
                                        </button>
                                    ) : (
                                        <MetaChip>{c.role === 'editor' ? 'Can edit' : 'Can view'}</MetaChip>
                                    )
                                }
                            />
                        ))}

                        {pendingInvites.map((p, i) => (
                            <Row key={`p-p2-${i}`}
                                left={<Avatar bg="#555">{p.invitedEmail?.charAt(0)?.toUpperCase()}</Avatar>}
                                label={<TwoLine top={p.invitedEmail} bot="Pending..." botColor="#555" />}
                                right={
                                    isOwner ? (
                                        <button
                                            onClick={(e) => openDropdown(e, `pending-p2-${p._id}`)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#555', padding: 0 }}
                                        >
                                            {p.role === 'editor' ? 'Can edit' : 'Can view'} <ChevronDown size={10} />
                                        </button>
                                    ) : (
                                        <MetaChip>Pending</MetaChip>
                                    )
                                }
                            />
                        ))}

                        {/* General access */}
                        <SectionLabel style={{ marginTop: '12px' }}>General access</SectionLabel>

                        <Row
                            left={<Avatar bg="#d4622a">{wsInitial}</Avatar>}
                            label={activeWorkspace.name}
                            right={<MetaChip>Can edit</MetaChip>}
                        />

                        {collaborators.map((c, i) => (
                            <Row key={`c-ws-${i}`}
                                left={<Avatar bg="#555">{c.workspaceName?.charAt(0)?.toUpperCase() || 'W'}</Avatar>}
                                label={c.workspaceName || 'Workspace'}
                                right={<MetaChip>{c.role === 'editor' ? 'Can edit' : 'Can view'}</MetaChip>}
                            />
                        ))}

                        {isOwner && (
                            <Row
                                left={<IconBox><UserPlus size={14} color="#888" /></IconBox>}
                                label="Invite link"
                                right={
                                    <button
                                        onClick={(e) => openDropdown(e, 'link2')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#888', padding: 0 }}
                                    >
                                        {accessLabel(linkAccess)} <ChevronDown size={10} />
                                    </button>
                                }
                            />
                        )}

                        <div style={{ height: '12px' }} />

                        {/* Create invite link button — only if owner */}
                        {isOwner && (
                            <button
                                style={{
                                    ...bigBtnStyle,
                                    background: linkAccess === 'disabled' ? '#3a3a3a' : '#e8e8e8',
                                    color: linkAccess === 'disabled' ? '#888' : '#111',
                                    cursor: 'pointer',
                                }}
                                onClick={handleCreateLink}
                                disabled={linkGenerating}
                            >
                                {linkGenerating ? 'Generating...' : linkAccess === 'disabled' ? 'Copy invite link' : 'Copy invite link'}
                            </button>
                        )}

                        <div style={{ height: '12px' }} />
                    </div>

                    {/* ══════════ PANEL 3 — SHARE PREVIEW ══════════ */}
                    <div style={{ ...pStyle(PANEL_WIDTH), overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <BackBtn onClick={() => setPanel(0)} />
                            <h2 style={titleStyle}>Share preview</h2>
                        </div>

                        <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6, marginBottom: '16px' }}>
                            Create a public link to allow anyone to access a view only version of your project. The link is valid for 7 days.
                        </p>

                        {/* Preview iframe thumbnail */}
                        <div style={{
                            width: '100%', height: '200px', background: '#fff',
                            borderRadius: '10px', overflow: 'hidden', marginBottom: '16px',
                            border: '1px solid #333', flexShrink: 0,
                        }}>
                            {publishedUrl ? (
                                <iframe
                                    src={publishedUrl}
                                    title="Site preview"
                                    style={{
                                        width: '200%', height: '200%',
                                        transform: 'scale(0.5)', transformOrigin: 'top left',
                                        border: 'none', pointerEvents: 'none',
                                    }}
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px' }}>
                                    No preview available
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => {
                                if (publishedUrl) {
                                    navigator.clipboard.writeText(publishedUrl);
                                    toast({ title: 'Preview link copied!', variant: 'success', duration: 2000 });
                                }
                            }}
                            style={{
                                width: '100%', height: '44px', background: '#252525',
                                color: '#fff', border: '1px solid #333', borderRadius: '10px',
                                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <Link2 size={16} /> Copy preview link
                        </button>

                        <div style={{ height: '12px' }} />
                    </div>
                </div>
            </div>

            {/* ── Fixed-position access dropdown (escapes overflow) ── */}
            {activeDropdownId && accessDropdownAnchor && (
                <AccessDropdown
                    isUser={activeDropdownId.startsWith('collab-') || activeDropdownId.startsWith('pending-')}
                    isPending={activeDropdownId.startsWith('pending-')}
                    selected={
                        activeDropdownId.startsWith('collab-') 
                        ? collaborators.find(c => activeDropdownId.includes(c.userId || c.email))?.role || 'editor'
                        : activeDropdownId.startsWith('pending-')
                        ? pendingInvites.find(p => activeDropdownId.includes(p._id))?.role || 'editor'
                        : linkAccess
                    }
                    anchor={accessDropdownAnchor}
                    onSelect={(v) => { 
                        if (activeDropdownId.startsWith('collab-')) {
                            const cid = activeDropdownId.replace('collab-p1-', '').replace('collab-p2-', '');
                            handleCollabAccessChange(cid, v);
                        } else if (activeDropdownId.startsWith('pending-')) {
                            const pid = activeDropdownId.replace('pending-p1-', '').replace('pending-p2-', '');
                            handlePendingInviteAccessChange(pid, v);
                        } else {
                            setLinkAccess(v); 
                        }
                        setActiveDropdownId(null); 
                    }}
                    onClose={() => setActiveDropdownId(null)}
                />
            )}
        </>
    );
}

/* ─── Access Level Dropdown (fixed-position, renders in portal-like fashion) ─── */
function AccessDropdown({ selected, anchor, onSelect, onClose, isUser = false, isPending = false }) {
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        // short delay so the openDropdown click doesn't immediately close
        const id = setTimeout(() => document.addEventListener('mousedown', h), 0);
        return () => { clearTimeout(id); document.removeEventListener('mousedown', h); };
    }, [onClose]);

    const options = isUser ? [
        { value: 'editor', icon: Edit, label: 'Can edit', desc: 'User can edit this project' },
        { value: 'viewer', icon: Eye, label: 'Can view', desc: 'User can view this project' },
        isPending 
            ? { value: 'cancel', icon: Ban, label: 'Cancel invite', desc: 'Revoke this pending invitation' }
            : { value: 'disabled', icon: Ban, label: 'Remove access', desc: 'Remove user from this project' },
    ] : [
        { value: 'editor', icon: Edit, label: 'Edit access', desc: 'Anyone with link can edit this project' },
        { value: 'viewer', icon: Eye, label: 'View access', desc: 'Anyone with link can view this project' },
        { value: 'disabled', icon: Ban, label: 'Disabled', desc: 'Deactivate the current invite link' },
    ];

    return (
        <div ref={ref} data-share-dropdown="true" style={{
            position: 'fixed',
            top: anchor.top,
            right: anchor.right,
            width: '260px',
            background: '#242424',
            border: '1px solid #383838',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            zIndex: 99999,
            padding: '4px',
        }}>
            {options.map(o => (
                <div
                    key={o.value}
                    onClick={() => onSelect(o.value)}
                    style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                        background: selected === o.value ? 'rgba(255,255,255,0.07)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = selected === o.value ? 'rgba(255,255,255,0.07)' : 'transparent'}
                >
                    <o.icon size={15} color={o.value === selected ? '#fff' : '#888'} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {o.label}
                            {selected === o.value && <Check size={12} color="#10b981" />}
                        </div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '2px', lineHeight: 1.4 }}>{o.desc}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Helpers ─── */
function accessLabel(v) {
    if (v === 'editor') return 'Edit access';
    if (v === 'viewer') return 'View access';
    return 'Disabled';
}

/* ─── Sub-components ─── */
function SectionLabel({ children, style }) {
    return <div style={{ fontSize: '10px', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', ...style }}>{children}</div>;
}

function TwoLine({ top, bot, botColor = '#666' }) {
    return (
        <span>
            <span style={{ display: 'block', fontSize: '13px', color: '#fff', fontWeight: 500 }}>{top}</span>
            <span style={{ fontSize: '11px', color: botColor, lineHeight: 1.3 }}>{bot}</span>
        </span>
    );
}

function Avatar({ bg, children }) {
    return <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{children}</div>;
}

function IconBox({ children }) {
    return <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</div>;
}

function MetaChip({ children }) {
    return <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#888' }}>{children}</div>;
}

function Row({ left, label, right, onClick, hoverable }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={() => hoverable && setHov(true)}
            onMouseLeave={() => hoverable && setHov(false)}
            style={{
                minHeight: '44px', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '4px 2px', cursor: onClick ? 'pointer' : 'default',
                background: hov ? 'rgba(255,255,255,0.04)' : 'transparent',
                borderRadius: '8px', transition: 'background 0.15s',
            }}
        >
            {left}
            <div style={{ flex: 1, fontSize: '13px', color: '#fff', minWidth: 0 }}>{label}</div>
            {right}
        </div>
    );
}

function BackBtn({ onClick }) {
    return (
        <button onClick={onClick} style={{ width: '28px', height: '28px', flexShrink: 0, background: '#2a2a2a', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={14} color="#fff" />
        </button>
    );
}

function GhostBtn({ icon, label, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                width: '100%', height: '40px',
                background: hov ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontSize: '13px', color: '#ccc', margin: '2px 0', transition: 'all 0.15s',
            }}
        >
            {React.cloneElement(icon, { color: '#888' })}
            {label}
        </button>
    );
}

/* ─── Static styles ─── */
const pStyle = (w) => ({ width: `${w}px`, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '16px 18px' });
const titleStyle = { fontSize: '17px', fontWeight: 700, color: '#fff', margin: '0 0 12px' };
const fakInputStyle = { background: '#2a2a2a', border: '1px solid #333', borderRadius: '9px', height: '40px', padding: '0 14px', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', marginBottom: '14px', cursor: 'text' };
const divStyle = { height: '1px', background: '#2a2a2a', margin: '8px 0' };
const bigBtnStyle = { height: '46px', width: '100%', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: 700, margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' };
