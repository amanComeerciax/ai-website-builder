import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { apiClient } from '../../lib/api';
import { toast } from 'react-hot-toast';
import './InviteLinkModal.css';

export default function InviteLinkModal({ isOpen, onClose, workspaceId }) {
    const { getToken } = useAuth();
    const [role, setRole] = useState('editor');
    const [expiresIn, setExpiresIn] = useState('5d');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const handleCreateLink = async () => {
        if (!workspaceId) return;
        setIsGenerating(true);
        try {
            const token = await getToken();
            const { inviteUrl } = await apiClient.generateInviteLink({ workspaceId, role, expiresIn }, token);
            await navigator.clipboard.writeText(inviteUrl);
            toast.success('Invite link copied to clipboard!');
            onClose();
        } catch (err) {
            toast.error(err.message || 'Failed to generate link');
        } finally {
            setIsGenerating(false);
        }
    };

    const getExpiryText = () => {
        switch (expiresIn) {
            case '1d': return '1 day';
            case '5d': return '5 days';
            case '7d': return '7 days';
            case '30d': return '30 days';
            case 'never': return 'Never';
            default: return '5 days';
        }
    };

    return (
        <div className="lv-invitelink-backdrop" onClick={onClose}>
            <div className="lv-invitelink-modal" onClick={e => e.stopPropagation()}>
                <div className="lv-invitelink-header">
                    <div>
                        <h2>Workspace invite link</h2>
                        <p>Generate a link to invite people to this workspace.<br/>Links expire after {getExpiryText()}.</p>
                    </div>
                    <button className="lv-invitelink-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="lv-invitelink-body">
                    <div>
                        <label className="lv-invitelink-label">Role</label>
                        <div className="lv-invitelink-select-wrapper">
                            <select 
                                className="lv-invitelink-select" 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                            <ChevronDown size={16} className="lv-invitelink-select-icon" />
                        </div>
                    </div>
                    <div>
                        <label className="lv-invitelink-label">Expires in</label>
                        <div className="lv-invitelink-select-wrapper">
                            <select 
                                className="lv-invitelink-select" 
                                value={expiresIn} 
                                onChange={(e) => setExpiresIn(e.target.value)}
                            >
                                <option value="1d">1 Day</option>
                                <option value="5d">5 Days</option>
                                <option value="7d">7 Days</option>
                                <option value="30d">30 Days</option>
                                <option value="never">Never</option>
                            </select>
                            <ChevronDown size={16} className="lv-invitelink-select-icon" />
                        </div>
                    </div>
                </div>

                <div className="lv-invitelink-footer">
                    <button 
                        className="lv-invitelink-btn lv-invitelink-btn-secondary" 
                        onClick={onClose}
                        disabled={isGenerating}
                    >
                        Cancel
                    </button>
                    <button 
                        className="lv-invitelink-btn lv-invitelink-btn-primary" 
                        onClick={handleCreateLink}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Creating...' : 'Create invite link'}
                    </button>
                </div>
            </div>
        </div>
    );
}
