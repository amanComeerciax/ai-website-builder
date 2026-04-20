import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Users, CreditCard, Cloud, Lock, User, Beaker, FileText, 
  Plug, Github, Search, ChevronDown, Check, MoreHorizontal, Settings,
  Pencil, Info, X, ExternalLink, Activity, FolderPlus, ShieldAlert, LayoutTemplate,
  Loader2, Layers, Zap, FileCode, Shield, ShieldCheck, Upload
} from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import InviteMembersModal from '../components/modals/InviteMembersModal';
import InviteLinkModal from '../components/modals/InviteLinkModal';
import './SettingsPage.css';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Toggle = ({ isOn, onToggle }) => (
  <button className={`sp-toggle ${isOn ? 'on' : ''}`} onClick={onToggle}>
    <div className="sp-toggle-thumb" />
  </button>
);

const MutedDropdown = ({ options, value, onChange, disabled }) => (
  <div className="sp-select-wrapper">
    <select 
      className="sp-select" 
      value={value} 
      onChange={(e) => onChange && onChange(e.target.value)}
      disabled={disabled}
      style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
    >
      {options.map(opt => <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>{typeof opt === 'object' ? opt.label : opt}</option>)}
    </select>
    <ChevronDown size={14} className="sp-select-icon" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PROFILE (NO SIDEBAR)
// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    
    const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@example.com';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
      <div className="sp-profile-container">
        <header className="sp-profile-nav">
          <div style={{fontWeight: 600, fontSize: '18px'}}>StackForge</div>
          <button className="sp-btn sp-btn-outline" onClick={() => navigate('/dashboard')}>Open StackForge</button>
        </header>
        
        <main className="sp-profile-hero">
          <div className="sp-banner">
            <div className="sp-banner-avatar">{userInitial}</div>
          </div>
          
          <div className="sp-profile-name-row">
            <div>
              <h1 className="sp-profile-name">{userName}</h1>
              <p className="sp-profile-handle">{userEmail}</p>
              <div className="sp-profile-stats">
                <span>0</span> followers · <span>0</span> following
              </div>
            </div>
            <div className="sp-profile-actions">
              <button className="sp-btn sp-btn-outline">Edit profile</button>
              <button className="sp-btn sp-btn-outline" onClick={() => navigate('/settings#workspace')}>Account settings ⚙</button>
            </div>
          </div>

          <div className="sp-empty-state">
            <FolderPlus size={32} color="#666" style={{margin: '0 auto 12px'}} />
            <div style={{fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '4px'}}>No projects yet</div>
            <div style={{fontSize: '12px', color: '#666'}}>Projects will appear here once created</div>
          </div>

          <h3 className="sp-activity-title">
            <Activity size={16} color="#4f6ef7" /> 0 edits on StackForge in the last year
          </h3>
          <div className="sp-activity-container">
            <div className="sp-heatmap-grid">
              {/* Generate 53x7 grid, mock activity */}
              {Array.from({ length: 371 }).map((_, i) => {
                const lvl = Math.random() > 0.9 ? 1 : Math.random() > 0.95 ? 2 : Math.random() > 0.98 ? 3 : 0;
                return <div key={i} className={`sp-heatmap-cell ${lvl ? `lvl-${lvl}` : ''}`} title="No edits" />
              })}
            </div>
            <div className="sp-activity-stats">
              <div className="sp-stat-box"><span className="sp-stat-label">Daily Average</span><span className="sp-stat-value">0</span></div>
              <div className="sp-stat-box"><span className="sp-stat-label">Days Active</span><span className="sp-stat-value">0</span></div>
              <div className="sp-stat-box"><span className="sp-stat-label">Current Streak</span><span className="sp-stat-value">0 days</span></div>
              <div className="sp-stat-box"><span className="sp-stat-label">Total Edits</span><span className="sp-stat-value">0</span></div>
            </div>
          </div>
        </main>
        
        <footer className="sp-footer">
          <div className="sp-footer-inner">
            <div>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div>
              <h4>Product</h4>
              <a href="#">Pricing</a>
              <a href="#">Changelog</a>
              <a href="#">Docs</a>
            </div>
            <div>
              <h4>Resources</h4>
              <a href="#">Community</a>
              <a href="#">Contact</a>
              <a href="#">Partners</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
            <div>
              <h4>Connect</h4>
              <a href="#">Twitter</a>
              <a href="#">GitHub</a>
              <a href="#">Discord</a>
            </div>
          </div>
        </footer>
      </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: ACCOUNT SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const { user } = useUser();
  const userNameHandle = user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'username';
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@example.com';
  
  const [toggles, setToggles] = useState({ chat: true, auto: false, push: true });
  const [sound, setSound] = useState('first');

  const RadioOpt = ({ id, label }) => (
    <div 
      style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer'}} 
      onClick={() => setSound(id)}
    >
      <div style={{
        width: '14px', height: '14px', borderRadius: '50%', 
        border: `4px solid ${sound === id ? '#4f6ef7' : '#333'}`,
        background: sound === id ? '#fff' : 'transparent',
        boxSizing: 'border-box'
      }} />
      <span style={{fontSize: '13px', color: sound === id ? '#fff' : '#aaa', fontWeight: sound === id ? 500 : 400}}>{label}</span>
    </div>
  );

  return (
    <div className="sp-content" style={{maxWidth: '1000px'}}>
      <div className="sp-page-header" style={{flexDirection: 'column', gap: '4px', marginBottom: '32px'}}>
        <h1 className="sp-page-title">Account settings</h1>
        <p className="sp-page-subtitle">Personalize how others see and interact with you on StackForge.</p>
      </div>

      <div className="sp-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
          <div>
            <h3 style={{margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'}}>
              Vibe coding level <span className="sp-badge sp-badge-pro" style={{fontSize: '10px', padding: '1px 6px', background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', border: '1px solid rgba(124, 58, 237, 0.3)'}}>Beta</span>
            </h3>
            <p style={{margin: 0, fontSize: '13px', color: '#888'}}>Showcase your vibe coding momentum and progress on LinkedIn</p>
          </div>
          <button className="sp-btn sp-btn-outline" style={{background: '#1a1a1a'}}>in Add to LinkedIn</button>
        </div>
        
        <div className="sp-progress-bg" style={{background: '#2a2a2a', height: '6px', margin: '24px 0 12px 0'}}>
          <div className="sp-progress-fill" style={{width: '20%', background: '#7c3aed'}}></div>
        </div>
        <div style={{fontSize: '11px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'}}>
          L1: Bronze <Info size={12} color="#666" />
        </div>
      </div>

      <div className="sp-card-no-padding">
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Profile</h4>
            <p className="sp-row-desc">Change name, location, avatar, and banner on your profile.</p>
          </div>
          <a href="#" style={{color: '#888', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'}}>
            <span style={{borderBottom: '1px solid #444', paddingBottom: '1px'}}>Open profile on stackforge.app/@{userNameHandle}</span> ↗
          </a>
        </div>
        <div className="sp-row" style={{alignItems: 'center'}}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Username</h4>
            <p className="sp-row-desc">Your public identifier and profile URL.</p>
          </div>
          <div style={{display: 'flex', gap: '12px', flex: 1, maxWidth: '400px'}}>
            <input type="text" className="sp-input" defaultValue={userNameHandle} style={{background: 'rgba(255,255,255,0.02)'}} />
            <button className="sp-btn sp-btn-outline">Update</button>
          </div>
        </div>
        <div className="sp-row" style={{alignItems: 'center'}}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Email</h4>
            <p className="sp-row-desc">Your email address associated with your account.</p>
          </div>
          <div style={{flex: 1, maxWidth: '400px'}}>
            <input type="text" className="sp-input" value={userEmail} readOnly disabled style={{opacity: 0.5}} />
          </div>
        </div>
      </div>

      <div className="sp-card-no-padding">
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Chat suggestions</h4>
            <p className="sp-row-desc">Show helpful suggestions in the chat interface to enhance your experience.</p>
          </div>
          <Toggle isOn={toggles.chat} onToggle={() => setToggles({...toggles, chat: !toggles.chat})} />
        </div>
        <div className="sp-row sp-row-top">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Generation complete sound</h4>
            <p className="sp-row-desc">Plays a satisfying sound notification when a generation is finished.</p>
          </div>
          <div style={{width: '200px'}}>
            <RadioOpt id="first" label="First generation" />
            <RadioOpt id="always" label="Always" />
            <RadioOpt id="never" label="Never" />
          </div>
        </div>
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Auto-accept invitations</h4>
            <p className="sp-row-desc">Automatically join workspaces and projects when invited instead of requiring manual acceptance.</p>
          </div>
          <Toggle isOn={toggles.auto} onToggle={() => setToggles({...toggles, auto: !toggles.auto})} />
        </div>
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Push notifications</h4>
            <p className="sp-row-desc">Enable push notifications in the mobile app to customize these settings.</p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '32px'}}>
            <div>
              <div style={{fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '2px'}}>Agent action</div>
              <div style={{fontSize: '11px', color: '#666'}}>Stay updated when the agent finishes work</div>
            </div>
            <Toggle isOn={toggles.push} onToggle={() => setToggles({...toggles, push: !toggles.push})} />
          </div>
        </div>
      </div>

      <div className="sp-card-no-padding">
        <div className="sp-row sp-row-top" style={{paddingBottom: 0, borderBottom: 'none'}}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Linked accounts</h4>
            <p className="sp-row-desc">Manage accounts linked for sign-in.</p>
          </div>
          <div style={{flex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
              <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Lock size={16} color="#aaa" />
              </div>
              <div>
                <div style={{fontSize: '13px', fontWeight: 600, color: '#fff'}}>Password <span className="sp-badge" style={{background: '#333', fontSize: '9px', marginLeft: '6px'}}>Primary</span></div>
                <div style={{fontSize: '11px', color: '#666'}}>{userEmail}</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid #222'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <User size={16} color="#aaa" />
                </div>
                <div>
                  <div style={{fontSize: '13px', fontWeight: 600, color: '#fff'}}>Link company account</div>
                  <div style={{fontSize: '11px', color: '#666'}}>Use your organization's single sign-on</div>
                </div>
              </div>
              <button className="sp-btn sp-btn-outline" style={{height: '32px'}}>Link</button>
            </div>
          </div>
        </div>

        <div className="sp-row" style={{borderTop: 'none'}}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Two-factor authentication</h4>
            <p className="sp-row-desc">Secure your account with a one-time code via an authenticator app or SMS.</p>
          </div>
          <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <div style={{width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Lock size={16} color="#aaa" />
              </div>
              <div>
                <div style={{fontSize: '13px', fontWeight: 600, color: '#fff'}}>Re-authentication required</div>
                <div style={{fontSize: '12px', color: '#666', maxWidth: '250px', lineHeight: 1.4}}>For security, please re-authenticate to manage two-factor settings.</div>
              </div>
            </div>
            <button className="sp-btn sp-btn-outline">Reauthenticate</button>
          </div>
        </div>
      </div>

      <div className="sp-card-no-padding">
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Delete account</h4>
            <p className="sp-row-desc">Permanently delete your StackForge account. This cannot be undone.</p>
          </div>
          <button className="sp-btn" style={{background: '#ef4444', color: '#fff', border: 'none'}}>Delete account</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
const WorkspacePage = () => {
  const { getToken } = useAuth();
  const { activeWorkspaceId, workspaces, fetchWorkspaces } = useWorkspaceStore();
  const [workspace, setWorkspace] = useState(null);
  const [wsName, setWsName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [handleInput, setHandleInput] = useState('');
  const [isSavingHandle, setIsSavingHandle] = useState(false);
  const [callerRole, setCallerRole] = useState('viewer');
  const avatarInputRef = React.useRef(null);

  const canEdit = ['owner', 'admin'].includes(callerRole);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const load = async () => {
      const token = await getToken();
      const { workspaces: wsList } = await apiClient.getWorkspaces(token);
      // Use the active workspace, not the first one
      const ws = wsList?.find(w => w._id === activeWorkspaceId) || wsList?.[0];
      if (ws) {
        setWorkspace(ws);
        setWsName(ws.name || '');
        setHandleInput(ws.handle || '');
      }
      // Fetch caller's role in this workspace
      try {
        const { callerRole: cr } = await apiClient.getWorkspaceMembers(activeWorkspaceId, token);
        setCallerRole(cr || 'viewer');
      } catch { setCallerRole('viewer'); }
    };
    load();
  }, [activeWorkspaceId]);

  const handleSave = async () => {
    if (!workspace || !wsName.trim()) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      const { workspace: updated } = await apiClient.updateWorkspace(workspace._id, { name: wsName.trim() }, token);
      setWorkspace(updated);
      // Refresh workspace store so sidebar updates
      await fetchWorkspaces(token);
      toast.success('Workspace name updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const token = await getToken();
        const { workspace: updated } = await apiClient.uploadWorkspaceAvatar(workspace._id, ev.target.result, token);
        setWorkspace(updated);
        toast.success('Avatar updated');
      } catch (err) {
        toast.error(err.message || 'Failed to upload avatar');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveHandle = async () => {
    if (!workspace) return;
    const clean = handleInput.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    if (!clean) { toast.error('Handle cannot be empty'); return; }
    setIsSavingHandle(true);
    try {
      const token = await getToken();
      const { workspace: updated } = await apiClient.updateWorkspace(workspace._id, { handle: clean }, token);
      setWorkspace(updated);
      setShowHandleModal(false);
      toast.success('Handle updated');
    } catch (err) {
      toast.error(err.message || 'Handle already taken');
    } finally {
      setIsSavingHandle(false);
    }
  };

  const generateSuggestions = () => {
    const base = (wsName || 'workspace').toLowerCase().replace(/[^a-z0-9]/g, '');
    return [
      `${base}_dev`,
      `${base}_hq`,
      `${base}_io`,
      `the_${base}`
    ].map(s => s.slice(0, 20));
  };

  const initial = wsName?.[0]?.toUpperCase() || 'W';

  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Workspace Settings</h1>
          <p className="sp-page-subtitle">Manage your workspace details and preferences.</p>
        </div>
        <a className="sp-docs-link">⊙ Docs</a>
      </div>

      <div className="sp-card-no-padding">
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Workspace Avatar</h4>
            <p className="sp-row-desc">This is your workspace's avatar. Click to change.</p>
          </div>
          <div 
            className="sp-avatar-orange" 
            style={{ cursor: canEdit ? 'pointer' : 'default', overflow: 'hidden', position: 'relative', opacity: canEdit ? 1 : 0.7 }}
            onClick={() => canEdit && avatarInputRef.current?.click()}
            title={canEdit ? 'Click to change avatar' : 'You do not have permission to change the avatar'}
          >
            {workspace?.avatar ? (
              <img src={workspace.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            ) : initial}
          </div>
          {canEdit && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          )}
        </div>
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Workspace Name</h4>
            <p className="sp-row-desc">Used to identify your workspace on the dashboard.</p>
          </div>
          <div style={{textAlign: 'right'}}>
            <input 
              type="text" 
              className="sp-input" 
              value={wsName} 
              onChange={(e) => canEdit && setWsName(e.target.value.slice(0, 50))} 
              readOnly={!canEdit}
              style={{width: '250px', marginBottom: '6px', opacity: canEdit ? 1 : 0.6, cursor: canEdit ? 'text' : 'not-allowed'}} 
            />
            {canEdit && <div style={{fontSize: '11px', color: '#666'}}>{wsName.length} / 50 characters</div>}
          </div>
        </div>
        <div className="sp-row" style={{ cursor: canEdit ? 'pointer' : 'default' }} onClick={() => canEdit && setShowHandleModal(true)}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Workspace Handle</h4>
            <p className="sp-row-desc">A unique URL for your workspace.</p>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '13px', color: '#888'}}>{workspace?.handle || workspace?.slug || (canEdit ? '— Set handle' : '— Not set')}</span>
            {canEdit && <Pencil size={12} color="#666" />}
          </div>
        </div>
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Plan</h4>
            <p className="sp-row-desc">Current workspace plan.</p>
          </div>
          <span className="sp-badge" style={{background: '#252530', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#818cf8'}}>{workspace?.plan || 'free'}</span>
        </div>
      </div>

      {canEdit && wsName !== workspace?.name && (
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '16px'}}>
          <button className="sp-btn sp-btn-primary" onClick={handleSave} disabled={isSaving} style={{padding: '8px 20px'}}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      )}

      {!canEdit && (
        <div style={{
          padding: '12px 16px', marginTop: '16px',
          background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '10px', fontSize: '13px', color: '#818cf8',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Info size={14} /> You have <strong>{callerRole}</strong> access. Only owners and admins can edit workspace settings.
        </div>
      )}

      <div className="sp-card sp-card-danger">
        <h4 className="sp-row-title" style={{marginBottom: '8px'}}>Leave workspace</h4>
        <p className="sp-row-desc" style={{marginBottom: '16px'}}>Revoke your access to this workspace. Any resources you created will remain.</p>
        <button className="sp-btn sp-btn-danger-outline" disabled title="You cannot leave your last workspace">Leave workspace</button>
      </div>

      {/* Handle Modal */}
      {showHandleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={() => setShowHandleModal(false)}>
          <div style={{
            background: '#1a1a1a', borderRadius: '16px', width: '480px', maxWidth: '90vw',
            overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid #2a2a2a'
          }} onClick={e => e.stopPropagation()}>
            {/* Gradient banner */}
            <div style={{
              height: '120px', 
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                stackforge.app/@{handleInput || 'yourusername'}
              </span>
              <button 
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setShowHandleModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Set your workspace handle</h3>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '8px'
              }}>
                <span style={{ color: '#666', marginRight: '4px' }}>@</span>
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                  placeholder="username"
                  style={{
                    background: 'transparent', border: 'none', color: '#fff', fontSize: '14px',
                    outline: 'none', flex: 1
                  }}
                  autoFocus
                />
              </div>
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 20px 0' }}>Up to 20 characters (letters, numbers or _)</p>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Suggestions</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {generateSuggestions().map(s => (
                    <button
                      key={s}
                      onClick={() => setHandleInput(s)}
                      style={{
                        background: '#222', border: '1px solid #333', borderRadius: '6px',
                        color: '#ccc', fontSize: '12px', padding: '4px 12px', cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => { e.target.style.background = '#333'; e.target.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.target.style.background = '#222'; e.target.style.color = '#ccc'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="sp-btn sp-btn-outline" onClick={() => setShowHandleModal(false)}>Cancel</button>
                <button className="sp-btn sp-btn-white" onClick={handleSaveHandle} disabled={isSavingHandle || !handleInput.trim()}>
                  {isSavingHandle ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PEOPLE
// ─────────────────────────────────────────────────────────────────────────────
const PeoplePage = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { setInviteModalOpen, isInviteLinkModalOpen, setInviteLinkModalOpen } = useUIStore();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [callerRole, setCallerRole] = useState('viewer');
  const [callerUserId, setCallerUserId] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [roleSubmenu, setRoleSubmenu] = useState(null);
  const menuRef = React.useRef(null);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    const load = async () => {
      const token = await getToken();
      const { members: m, callerRole: cr } = await apiClient.getWorkspaceMembers(activeWorkspaceId, token);
      setMembers(m || []);
      setCallerRole(cr || 'viewer');
      // Identify who the current user is
      const currentUser = (m || []).find(mem => mem.email === clerkUser?.primaryEmailAddress?.emailAddress);
      if (currentUser) setCallerUserId(currentUser.userId);
      const { invitations } = await apiClient.getWorkspaceInvitations(activeWorkspaceId, token);
      setPendingInvites(invitations || []);
    };
    load();
  }, [activeWorkspaceId]);

  // Close menu on outside click
  useEffect(() => {
    if (!activeActionMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveActionMenu(null);
        setRoleSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activeActionMenu]);

  const handleRoleChange = async (memberId, newRole) => {
    if (!activeWorkspaceId) return;
    try {
      const token = await getToken();
      await apiClient.updateMemberRole(activeWorkspaceId, memberId, newRole, token);
      setMembers(prev => prev.map(m => m._id === memberId ? { ...m, role: newRole } : m));
      toast.success('Role updated');
    } catch (err) { toast.error(err.message) }
    setActiveActionMenu(null);
    setRoleSubmenu(null);
  };

  const handleRemove = async (memberId) => {
    if (!activeWorkspaceId) return;
    try {
      const token = await getToken();
      await apiClient.removeMember(activeWorkspaceId, memberId, token);
      setMembers(prev => prev.filter(m => m._id !== memberId));
      toast.success('Member removed');
    } catch (err) { toast.error(err.message) }
    setActiveActionMenu(null);
  };

  const handleBlock = async (memberId) => {
    if (!activeWorkspaceId) return;
    try {
      const token = await getToken();
      const { member } = await apiClient.blockMember(activeWorkspaceId, memberId, token);
      setMembers(prev => prev.map(m => m._id === memberId ? { ...m, status: member.status } : m));
      toast.success(member.status === 'blocked' ? 'Member blocked' : 'Member unblocked');
    } catch (err) { toast.error(err.message) }
    setActiveActionMenu(null);
  };

  const handleExport = () => {
    if (!members.length) return;
    const headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const csvRows = [headers.join(',')];
    members.forEach(m => {
        csvRows.push([
            `"${m.name || ''}"`,
            `"${m.email || ''}"`,
            `"${m.role || ''}"`,
            `"${m.status || ''}"`,
            `"${new Date(m.joinedAt || Date.now()).toISOString()}"`
        ].join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'workspace-members.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOwnerOrAdmin = ['owner', 'admin'].includes(callerRole);
  const isOwner = callerRole === 'owner';

  // Filter members
  let filtered = members;
  if (tab === 'collaborators') {
    filtered = filtered.filter(m => m.role !== 'owner');
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(m => (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q));
  }
  if (roleFilter !== 'All roles') {
    filtered = filtered.filter(m => m.role === roleFilter.toLowerCase());
  }

  // Menu item component
  const MenuItem = ({ onClick, icon, label, danger }) => (
    <button
      style={{
        width: '100%', padding: '8px 14px', background: 'none', border: 'none',
        color: danger ? '#ef4444' : '#ccc', fontSize: '13px', cursor: 'pointer',
        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
        transition: 'background 0.1s'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = '#2a2a2a'}
      onMouseOut={(e) => e.currentTarget.style.background = 'none'}
      onClick={onClick}
    >
      {icon}{label}
    </button>
  );

  const renderActionMenu = (member) => {
    const isSelf = member.userId === callerUserId;
    const isTargetOwner = member.role === 'owner';

    return (
      <div 
        ref={menuRef}
        style={{
          position: 'absolute', left: '100%', top: '-8px', marginLeft: '8px', background: '#1e1e1e',
          border: '1px solid #333', borderRadius: '10px', overflow: 'visible',
          zIndex: 9999, minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          padding: '4px 0'
        }}
      >
        {/* View profile — always shown */}
        <MenuItem
          icon={<ExternalLink size={14} />}
          label="View profile"
          onClick={() => { setActiveActionMenu(null); navigate('/settings#profile'); }}
        />

        {isSelf ? (
          <>
            {/* Own row: Set credit limit, Leave workspace */}
            <MenuItem
              icon={<CreditCard size={14} />}
              label="Set credit limit"
              onClick={() => { setActiveActionMenu(null); toast('Credit limits coming soon'); }}
            />
            <div style={{ borderTop: '1px solid #2a2a2a', margin: '4px 0' }} />
            <MenuItem
              icon={<ArrowLeft size={14} />}
              label="Leave workspace"
              danger
              onClick={() => { setActiveActionMenu(null); toast.error("Can't leave — this is your only workspace"); }}
            />
          </>
        ) : !isTargetOwner ? (
          <>
            {/* Other member row */}
            {isOwner && (
              <>
                {/* Change role sub-menu */}
                <div style={{ position: 'relative' }}>
                  <button
                    style={{
                      width: '100%', padding: '8px 14px', background: 'none', border: 'none',
                      color: '#ccc', fontSize: '13px', cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between',
                      transition: 'background 0.1s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#2a2a2a'; setRoleSubmenu(member._id); }}
                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    onClick={() => setRoleSubmenu(roleSubmenu === member._id ? null : member._id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={14} /> Change role
                    </span>
                    <ChevronDown size={12} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                  {roleSubmenu === member._id && (
                    <div style={{
                      position: 'absolute', right: '100%', top: 0, marginRight: '4px', background: '#1e1e1e',
                      border: '1px solid #333', borderRadius: '8px', overflow: 'hidden',
                      zIndex: 10000, minWidth: '130px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}>
                      {['admin', 'editor', 'viewer'].map(r => (
                        <button
                          key={r}
                          style={{
                            width: '100%', padding: '8px 14px', background: member.role === r ? '#2a2a2a' : 'none',
                            border: 'none', color: member.role === r ? '#818cf8' : '#ccc',
                            fontSize: '13px', cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'background 0.1s', textTransform: 'capitalize'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#2a2a2a'}
                          onMouseOut={(e) => { if (member.role !== r) e.currentTarget.style.background = 'none'; }}
                          onClick={() => handleRoleChange(member._id, r)}
                        >
                          {r}
                          {member.role === r && <Check size={14} color="#818cf8" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <div style={{ borderTop: '1px solid #2a2a2a', margin: '4px 0' }} />
            {isOwner && (
              <MenuItem
                icon={<span>⛔</span>}
                label={member.status === 'blocked' ? 'Unban from workspace' : 'Ban from workspace'}
                onClick={() => handleBlock(member._id)}
              />
            )}
            {isOwnerOrAdmin && (
              <MenuItem
                icon={<span>🗑</span>}
                label="Remove from workspace"
                danger
                onClick={() => handleRemove(member._id)}
              />
            )}
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">People</h1>
          <p className="sp-page-subtitle">Manage members and their roles.</p>
        </div>
        <a className="sp-docs-link">⊙ Docs</a>
      </div>

      <div className="sp-tabs">
        <button className={`sp-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All</button>
        <button className={`sp-tab ${tab === 'invitations' ? 'active' : ''}`} onClick={() => setTab('invitations')}>
          Invitations {pendingInvites.length > 0 && <span style={{background:'#ef4444',color:'#fff',fontSize:'10px',padding:'1px 6px',borderRadius:'8px',marginLeft:'4px'}}>{pendingInvites.length}</span>}
        </button>
        <button className={`sp-tab ${tab === 'collaborators' ? 'active' : ''}`} onClick={() => setTab('collaborators')}>Collaborators</button>
      </div>

      <div className="sp-filter-bar">
        <div className="sp-search-bar">
          <Search size={14} />
          <input type="text" className="sp-input" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <MutedDropdown options={['All roles', 'Owner', 'Admin', 'Editor', 'Viewer']} value={roleFilter} onChange={setRoleFilter} />
        <div style={{flex: 1}}></div>
        {isOwnerOrAdmin && (
          <>
            <button className="sp-btn sp-btn-outline" style={{borderStyle: 'dashed'}} onClick={() => setInviteLinkModalOpen(true)}>Copy Invite Link</button>
            <button className="sp-btn sp-btn-outline" onClick={handleExport} title="Export members (CSV)" style={{padding: '0 8px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
            <button className="sp-btn sp-btn-white" onClick={() => setInviteModalOpen(true)}>Invite members</button>
          </>
        )}
      </div>

      {tab === 'invitations' ? (
        <div className="sp-table-wrapper">
          <table className="sp-table">
            <thead><tr><th>Email</th><th>Role</th><th>Invited by</th><th>Sent</th><th>Status</th></tr></thead>
            <tbody>
              {pendingInvites.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', color: '#666', padding: '32px'}}>No pending invitations</td></tr>
              ) : pendingInvites.map(inv => (
                <tr key={inv._id}>
                  <td style={{color: '#fff'}}>{inv.invitedEmail}</td>
                  <td><span style={{textTransform: 'capitalize'}}>{inv.role}</span></td>
                  <td>{inv.invitedByName}</td>
                  <td>{formatDate(inv.createdAt)}</td>
                  <td><span style={{color: '#f59e0b', fontSize: '12px'}}>⏳ Pending</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sp-table-footer">Showing {pendingInvites.length} pending invitation(s)</div>
        </div>
      ) : (
        <div className="sp-table-wrapper">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Name ⇅</th>
                <th>Role ⇅</th>
                <th>Status</th>
                <th>Joined date ⇅</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => {
                const isSelf = member.userId === callerUserId;
                return (
                  <tr key={member._id} style={member.status === 'blocked' ? {opacity: 0.5} : {}}>
                    <td>
                      <div className="sp-table-user">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="sp-avatar-sm blue">{(member.name || member.email || '?')[0].toUpperCase()}</div>
                        )}
                        <div>
                          <div style={{fontWeight: 600, color: '#fff'}}>{member.name || 'Unknown'}{isSelf ? ' (you)' : ''}</div>
                          <div style={{color: '#666', fontSize: '12px'}}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{textTransform: 'capitalize', color: member.role === 'owner' ? '#818cf8' : '#ccc'}}>
                        {member.role}
                      </span>
                    </td>
                    <td>
                      <span style={{fontSize: '12px', color: member.status === 'blocked' ? '#ef4444' : '#22c55e'}}>
                        {member.status === 'blocked' ? '⛔ Blocked' : '● Active'}
                      </span>
                    </td>
                    <td>{formatDate(member.joinedAt)}</td>
                    <td style={{position: 'relative'}}>
                      <MoreHorizontal
                        size={16}
                        color="#666"
                        style={{cursor: 'pointer'}}
                        onClick={() => {
                          setActiveActionMenu(activeActionMenu === member._id ? null : member._id);
                          setRoleSubmenu(null);
                        }}
                      />
                      {activeActionMenu === member._id && renderActionMenu(member)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="sp-table-footer">Showing {filtered.length} of {members.length} members</div>
        </div>
      )}
      
      <InviteLinkModal 
        isOpen={isInviteLinkModalOpen} 
        onClose={() => setInviteLinkModalOpen(false)} 
        workspaceId={activeWorkspaceId} 
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PLANS
// ─────────────────────────────────────────────────────────────────────────────
const PlansPage = () => {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Plans & credits</h1>
          <p className="sp-page-subtitle">Manage your subscription and billing.</p>
        </div>
      </div>

      <div className="sp-grid-2">
        <div className="sp-card" style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{flex: 1}}>
            <h3 style={{fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0'}}>You're on Free plan</h3>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '13px'}}>
              <Check size={14} color="#4f6ef7" /> 5 daily credits (up to 30/month)
            </div>
          </div>
          <button className="sp-btn sp-btn-outline" style={{width: 'fit-content', marginTop: '16px'}}>Manage</button>
        </div>

        <div className="sp-card">
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px'}}>
            <span>Credits remaining</span>
            <span style={{fontWeight: 600}}>5</span>
          </div>
          <div className="sp-progress-bg"><div className="sp-progress-fill"></div></div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginTop: '16px'}}>
            <span>Daily credits (resets in 4h)</span>
            <span>5</span>
          </div>
        </div>
      </div>

      <div className="sp-billing-toggle">
        <button className={`sp-tab ${!annual ? 'active' : ''}`} onClick={() => setAnnual(false)}>Monthly</button>
        <button className={`sp-tab ${annual ? 'active' : ''}`} onClick={() => setAnnual(true)}>Annual <span className="sp-badge sp-badge-pro" style={{marginLeft: '4px'}}>Save 20%</span></button>
      </div>

      <div className="sp-grid-3">
        <div className="sp-plan-card">
          <h3>Pro</h3>
          <div className="sp-plan-price">${annual ? '4' : '5'}<span>/mo</span></div>
          <MutedDropdown options={['20 credits/month', '50 credits/month']} value="20 credits/month" />
          <button className="sp-btn sp-btn-primary sp-plan-btn" style={{marginTop: '16px'}}>Upgrade</button>
          <ul className="sp-plan-features">
            <li><Check size={14} /> Everything in Free</li>
            <li><Check size={14} /> Private projects</li>
            <li><Check size={14} /> Custom domains</li>
            <li><Check size={14} /> Priority support</li>
            <li><Check size={14} /> Higher rate limits</li>
            <li><Check size={14} /> Access to premium templates</li>
            <li><Check size={14} /> Advanced analytics</li>
            <li><Check size={14} /> Team collaboration (2 seats)</li>
          </ul>
        </div>
        
        <div className="sp-plan-card">
          <h3>Business</h3>
          <div className="sp-plan-price">${annual ? '40' : '50'}<span>/mo</span></div>
          <MutedDropdown options={['100 credits/month', '250 credits/month']} value="100 credits/month" />
          <button className="sp-btn sp-btn-outline sp-plan-btn" style={{marginTop: '16px'}}>Upgrade</button>
          <ul className="sp-plan-features">
            <li><Check size={14} /> Everything in Pro</li>
            <li><Check size={14} /> Unlimited team seats</li>
            <li><Check size={14} /> Role-based access control</li>
            <li><Check size={14} /> SSO & SAML</li>
            <li><Check size={14} /> Dedicated account manager</li>
            <li><Check size={14} /> Invoice billing</li>
            <li><Check size={14} /> API access</li>
          </ul>
        </div>

        <div className="sp-plan-card">
          <h3>Enterprise</h3>
          <div className="sp-plan-price" style={{fontSize: '22px'}}>Platform fee</div>
          <div style={{height: '36px', marginBottom: '16px'}}></div>
          <button className="sp-btn sp-btn-outline sp-plan-btn">Book a demo</button>
          <ul className="sp-plan-features">
            <li><Check size={14} /> Configurable credit volumes</li>
            <li><Check size={14} /> Custom SLAs</li>
            <li><Check size={14} /> On-premise deployment options</li>
            <li><Check size={14} /> Advanced security reporting</li>
            <li><Check size={14} /> 24/7 phone support</li>
            <li><Check size={14} /> Custom model fine-tuning</li>
          </ul>
        </div>
      </div>

      <div className="sp-card" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(45deg, #1e1e1e, #1a1a2e)'}}>
        <div>
          <h3 style={{margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600}}>Gift Cards</h3>
          <p style={{color: '#aaa', fontSize: '13px', margin: '0 0 16px 0'}}>Give the gift of building. Purchase credits for your team or friends.</p>
          <button className="sp-btn sp-btn-outline">See all gift cards</button>
        </div>
        <div style={{width: '120px', height: '80px', background: 'linear-gradient(135deg, #7c3aed, #4f6ef7)', borderRadius: '8px', transform: 'rotate(5deg)'}}></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: CLOUD
// ─────────────────────────────────────────────────────────────────────────────
const CloudPage = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Cloud & AI balance</h1>
          <p className="sp-page-subtitle">Monitor and review your resource usage.</p>
        </div>
      </div>

      <div className="sp-grid-2">
        <div className="sp-card" style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{flex: 1}}>
            <h3 style={{fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0'}}>Cloud + AI</h3>
            <div style={{color: '#666', fontSize: '13px', marginBottom: '16px'}}>Resets in 28 days</div>
            <button className="sp-btn sp-btn-outline" style={{width: 'fit-content'}}>Upgrade to top up ($0)</button>
          </div>
          <button className="sp-btn sp-btn-primary" style={{width: 'fit-content', marginTop: '16px'}}>Upgrade plan</button>
        </div>

        <div className="sp-card">
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <span style={{fontSize: '13px', fontWeight: 500}}>Cloud ⊙</span>
            <span style={{fontSize: '14px', fontWeight: 600}}>$0 / $25</span>
          </div>
          <div style={{color: '#666', fontSize: '12px', marginBottom: '16px'}}>Free balance used</div>
          
          <div style={{height: '1px', background: '#222', margin: '16px 0'}}></div>

          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
            <span style={{fontSize: '13px', fontWeight: 500}}>AI ⊙</span>
            <span style={{fontSize: '14px', fontWeight: 600}}>$0 / $1</span>
          </div>
          <div style={{color: '#666', fontSize: '12px'}}>Free balance used</div>
        </div>
      </div>

      <div className="sp-card-no-padding">
        <div className="sp-row sp-collapse-header" onClick={() => setExpanded(!expanded)}>
          <h4 className="sp-row-title" style={{margin: 0}}>Project breakdown</h4>
          <ChevronDown size={16} color="#666" style={{transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}} />
        </div>
        {expanded && (
          <table className="sp-table" style={{borderTop: '1px solid #222'}}>
            <thead>
              <tr>
                <th>Project</th>
                <th style={{textAlign: 'right'}}>AI usage</th>
                <th style={{textAlign: 'right'}}>Cloud usage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Simple Task Hub</td>
                <td style={{textAlign: 'right'}}>$0.00</td>
                <td style={{textAlign: 'right'}}>$0.00</td>
              </tr>
              <tr>
                <td>AI Launchpad</td>
                <td style={{textAlign: 'right'}}>$0.00</td>
                <td style={{textAlign: 'right'}}>$0.00</td>
              </tr>
              <tr>
                <td>Starry Night Project <span className="sp-badge sp-badge-enterprise" style={{marginLeft: '4px'}}>Deleted</span></td>
                <td style={{textAlign: 'right'}}>$0.00</td>
                <td style={{textAlign: 'right'}}>$0.00</td>
              </tr>
              <tr>
                <td>Kind Code Companion <span className="sp-badge sp-badge-enterprise" style={{marginLeft: '4px'}}>Deleted</span></td>
                <td style={{textAlign: 'right'}}>$0.00</td>
                <td style={{textAlign: 'right'}}>$0.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" style={{padding: '12px 16px', borderTop: '1px solid #222', textAlign: 'center', fontSize: '13px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <button className="sp-btn sp-btn-outline" style={{height: '28px', padding: '0 8px'}} disabled>←</button>
                    <span>Page 1</span>
                    <button className="sp-btn sp-btn-outline" style={{height: '28px', padding: '0 8px'}} disabled>→</button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <div style={{color: '#666', fontSize: '12px', fontStyle: 'italic', textAlign: 'center', marginTop: '24px'}}>
        Note: The $25 Cloud and $1 AI limits are temporary offerings and may change.
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PRIVACY (Dynamic per-workspace settings)
// ─────────────────────────────────────────────────────────────────────────────
const PrivacyPage = () => {
  const { getToken } = useAuth();
  const { activeWorkspaceId } = useWorkspaceStore();
  const [settings, setSettings] = useState(null);
  const [memberRole, setMemberRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch privacy settings on mount
  useEffect(() => {
    if (!activeWorkspaceId) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const token = await getToken();
        const data = await apiClient.getWorkspacePrivacy(activeWorkspaceId, token);
        if (!cancelled) {
          setSettings(data.settings);
          setMemberRole(data.memberRole);
        }
      } catch (err) {
        console.error('[PrivacyPage] Failed to load settings:', err);
        toast.error('Failed to load privacy settings');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeWorkspaceId, getToken]);

  const canEdit = memberRole === 'owner' || memberRole === 'admin';

  // Auto-save a single setting change
  const updateSetting = async (key, value) => {
    if (!canEdit) return;
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsSaving(true);
    try {
      const token = await getToken();
      await apiClient.updateWorkspacePrivacy(activeWorkspaceId, { [key]: value }, token);
      toast.success('Setting saved', { duration: 1500, style: { background: '#1a1a1a', color: '#fff', fontSize: '13px' } });
    } catch (err) {
      console.error('[PrivacyPage] Failed to save:', err);
      toast.error('Failed to save setting');
      // Revert on failure
      setSettings(prev => ({ ...prev, [key]: key.includes('enabled') || key.includes('allow') || key.includes('cross') ? !value : value }));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key) => {
    if (!settings) return;
    updateSetting(key, !settings[key]);
  };

  // Loading skeleton
  if (isLoading || !settings) {
    return (
      <div className="sp-content">
        <div className="sp-page-header">
          <div>
            <h1 className="sp-page-title">Privacy & Security</h1>
            <p className="sp-page-subtitle">Loading settings...</p>
          </div>
        </div>
        <div className="sp-card-no-padding">
          {[...Array(8)].map((_, i) => (
            <div className="sp-row" key={i} style={{ opacity: 0.3 }}>
              <div className="sp-row-info">
                <h4 className="sp-row-title" style={{ width: '60%', height: 14, background: '#333', borderRadius: 4 }}>&nbsp;</h4>
                <p className="sp-row-desc" style={{ width: '40%', height: 12, background: '#2a2a2a', borderRadius: 4, marginTop: 6 }}>&nbsp;</p>
              </div>
              <div style={{ width: 44, height: 24, background: '#333', borderRadius: 12 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows = [
    {
      label: 'Default project visibility',
      desc: 'Who can see new projects by default.',
      right: (
        <MutedDropdown
          options={[
            { value: 'workspace', label: 'Workspace' },
            { value: 'private', label: 'Private' },
            { value: 'public', label: 'Public' }
          ]}
          value={settings.defaultProjectVisibility}
          onChange={(v) => updateSetting('defaultProjectVisibility', v)}
          disabled={!canEdit}
        />
      )
    },
    {
      label: 'Default website access',
      desc: 'Who can view published sites.',
      badge: 'Business',
      badgeClass: 'sp-badge-business',
      right: (
        <MutedDropdown
          options={[
            { value: 'anyone', label: 'Anyone' },
            { value: 'workspace', label: 'Workspace only' }
          ]}
          value={settings.defaultWebsiteAccess}
          onChange={(v) => updateSetting('defaultWebsiteAccess', v)}
          disabled={!canEdit}
        />
      )
    },
    {
      label: 'Restrict workspace invitations',
      desc: 'Only owners and admins can invite new members.',
      badge: 'Enterprise',
      badgeClass: 'sp-badge-enterprise',
      key: 'restrictInvitations'
    },
    {
      label: 'Allow editors to transfer projects',
      desc: 'Let editors move projects out of this workspace.',
      badge: 'Enterprise',
      badgeClass: 'sp-badge-enterprise',
      key: 'allowEditorsTransfer'
    },
    {
      label: 'Invite links',
      desc: 'Enable joining this workspace via a secret link.',
      key: 'inviteLinksEnabled'
    },
    {
      label: 'Who can publish externally',
      desc: 'Restrict who can deploy sites to public URLs.',
      badge: 'Enterprise',
      badgeClass: 'sp-badge-enterprise',
      right: (
        <MutedDropdown
          options={[
            { value: 'editors', label: 'Editors and above' },
            { value: 'owners', label: 'Owners only' }
          ]}
          value={settings.whoCanPublish}
          onChange={(v) => updateSetting('whoCanPublish', v)}
          disabled={!canEdit}
        />
      )
    },
    {
      label: 'Allow public preview links sharing',
      desc: 'Share unpublished site previews with external users.',
      badge: 'Enterprise',
      badgeClass: 'sp-badge-enterprise',
      key: 'allowPreviewSharing'
    },
    {
      label: 'Cross-project sharing',
      desc: 'Allow reusing components and styles across projects.',
      key: 'crossProjectSharing'
    }
  ];

  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Privacy & Security</h1>
          <p className="sp-page-subtitle">Configure privacy, security, and data access for this workspace.</p>
        </div>
        {!canEdit && (
          <div style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 12, fontWeight: 500 }}>
            View only — contact a workspace admin to change settings
          </div>
        )}
      </div>

      <div className="sp-card-no-padding">
        {rows.map((r, i) => (
          <div className="sp-row" key={i}>
            <div className="sp-row-info">
              <h4 className="sp-row-title">
                {r.label}
                {r.badge && <span className={`sp-badge ${r.badgeClass}`}>{r.badge}</span>}
              </h4>
              <p className="sp-row-desc">{r.desc}</p>
            </div>
            {r.right ? r.right : (
              <Toggle
                isOn={settings[r.key]}
                onToggle={() => canEdit && toggleSetting(r.key)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: KNOWLEDGE
// ─────────────────────────────────────────────────────────────────────────────
const KnowledgePage = () => {
  const [showBanner, setShowBanner] = useState(true);
  const [text, setText] = useState('');

  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Knowledge</h1>
          <p className="sp-page-subtitle">Set global context and preferences for your AI agents.</p>
        </div>
      </div>

      {showBanner && (
        <div className="sp-banner-notice">
          <Info size={20} color="#4f6ef7" style={{marginTop: '2px'}} />
          <div>
            <div style={{fontWeight: 600, color: '#4f6ef7', marginBottom: '4px'}}>Workspace knowledge</div>
            <div style={{color: '#ccc', fontSize: '13px', lineHeight: 1.4}}>Any instructions provided here will be automatically injected into every AI prompt within this workspace, ensuring consistency across all projects.</div>
          </div>
          <button className="sp-banner-close" onClick={() => setShowBanner(false)}><X size={16} /></button>
        </div>
      )}

      <div className="sp-card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <h3 style={{margin: '0 0 16px 0', fontSize: '16px'}}>Workspace knowledge</h3>
            <ul style={{margin: 0, paddingLeft: '20px', color: '#aaa', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <li>Define preferred tech stacks (e.g., Tailwind CSS, Framer Motion)</li>
              <li>Provide brand guidelines and color codes</li>
              <li>Set coding conventions or API keys structure</li>
            </ul>
          </div>
          <button className="sp-btn sp-btn-outline"><ExternalLink size={14}/> Get inspiration</button>
        </div>
        
        <textarea 
          className="sp-knowledge-textarea" 
          placeholder="Set coding style, conventions, and preferences for all your projects..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        {text.length > 0 && (
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '16px'}}>
            <button className="sp-btn sp-btn-primary">Save changes</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PROJECT SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
const ProjectSettingsPage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('id');

  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [memberRole, setMemberRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [remixName, setRemixName] = useState('');
  const [remixIncludeHistory, setRemixIncludeHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toggles, setToggles] = useState({ badge: false, sharing: true });
  const { userData } = useAuthStore();

  // Share as Template
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({ themeName: '', themeTagline: '', categories: [], description: '' });
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const SHARE_CATEGORIES = [
    'saas', 'portfolio', 'landing', 'blog', 'ecommerce', 'restaurant',
    'wellness', 'coffee-shop', 'fashion', 'service', 'agency', 'education', 'custom'
  ];

  const toggleShareCategory = (cat) => {
    setShareForm(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handleShareSubmit = async () => {
    if (!shareForm.themeName || shareForm.categories.length === 0) return;
    setIsSubmittingShare(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/templates/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId, ...shareForm })
      });
      const data = await res.json();
      if (res.ok) {
        setShareSuccess(true);
        setShowShareModal(false);
        toast.success('Template submitted for admin review!');
      } else {
        toast.error(data.error || 'Failed to submit template');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsSubmittingShare(false);
    }
  };

  // Fetch project data
  useEffect(() => {
    if (!projectId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const data = await apiClient.getProject(projectId, token);
        setProject(data.project);
        setMessages(data.messages || []);
        setRenameValue(data.project.name || '');
        setMemberRole(data.memberRole || 'viewer');
      } catch (err) {
        console.error('[ProjectSettings] Failed to load:', err);
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectId, getToken]);

  // Rename project
  const handleRename = async () => {
    if (!renameValue.trim() || renameValue === project.name) {
      setIsRenaming(false);
      return;
    }
    setIsSaving(true);
    try {
      const token = await getToken();
      const data = await apiClient.updateProject(projectId, { name: renameValue.trim() }, token);
      setProject(data.project);
      setIsRenaming(false);
      toast.success('Project renamed');
    } catch (err) {
      toast.error('Failed to rename project');
    } finally {
      setIsSaving(false);
    }
  };

  // Unpublish project
  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const token = await getToken();
      await apiClient.unpublishProject(projectId, token);
      setProject(p => ({ ...p, publishedUrl: null, netlifySiteId: null }));
      toast.success('Project unpublished');
    } catch (err) {
      toast.error(err.message || 'Failed to unpublish');
    } finally {
      setIsUnpublishing(false);
    }
  };

  // Remix (duplicate) project
  const handleRemixOpen = () => {
    setRemixName(`Remix of ${project.name}`);
    setRemixIncludeHistory(false);
    setShowRemixModal(true);
  };

  const handleRemixSubmit = async () => {
    setIsRemixing(true);
    try {
      const token = await getToken();
      const data = await apiClient.remixProject(projectId, token);
      // If user customized the name, rename the remixed project
      const finalName = remixName.trim() || `Remix of ${project.name}`;
      if (finalName !== data.project.name) {
        await apiClient.updateProject(data.project._id, { name: finalName }, token);
      }
      toast.success(`Created "${finalName}"`);
      setShowRemixModal(false);
      navigate(`/settings?id=${data.project._id}#project`);
    } catch (err) {
      toast.error(err.message || 'Failed to duplicate project');
    } finally {
      setIsRemixing(false);
    }
  };

  // Delete project
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      await apiClient.deleteProject(projectId, token);
      toast.success('Project deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!projectId) {
    return (
      <div className="sp-content">
        <div className="sp-card" style={{textAlign: 'center', padding: '48px 24px'}}>
          <Settings size={32} color="#666" style={{margin: '0 auto 12px'}} />
          <p style={{color: '#888', fontSize: '14px'}}>No project selected. Open project settings from the sidebar menu.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="sp-content">
        <div className="sp-card" style={{textAlign: 'center', padding: '48px 24px'}}>
          <div className="sp-loading-spinner" />
          <p style={{color: '#888', fontSize: '14px', marginTop: '12px'}}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="sp-content">
        <div className="sp-card" style={{textAlign: 'center', padding: '48px 24px'}}>
          <p style={{color: '#ef4444', fontSize: '14px'}}>Project not found or you don't have access.</p>
          <button className="sp-btn sp-btn-outline" style={{marginTop: '12px'}} onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const ownerName = userData?.name || userData?.email?.split('@')[0] || 'You';
  const ownerInitial = ownerName[0]?.toUpperCase() || 'U';
  const createdAt = project.createdAt ? new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const messageCount = messages.length;
  const slug = project.publishedUrl ? new URL(project.publishedUrl).hostname : `${(project.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20)}.stackforge.app`;
  const canModifySettings = ['owner', 'admin'].includes(memberRole);

  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Project Settings</h1>
          <p className="sp-page-subtitle">Configure the current project.</p>
        </div>
      </div>

      {/* ── Info Grid ── */}
      <div className="sp-card">
        <div className="sp-project-grid">
          <div className="sp-project-meta-box">
            <div className="sp-project-meta-label">Project name</div>
            <div className="sp-project-meta-val">
              {isRenaming ? (
                <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                  <input
                    type="text"
                    className="sp-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(project.name); }}}
                    autoFocus
                    style={{fontSize: '14px', padding: '4px 8px', width: '180px'}}
                  />
                  <button className="sp-btn sp-btn-primary" onClick={handleRename} disabled={isSaving} style={{padding: '4px 10px', fontSize: '12px'}}>
                    {isSaving ? '...' : '✓'}
                  </button>
                  <button className="sp-btn sp-btn-outline" onClick={() => { setIsRenaming(false); setRenameValue(project.name); }} style={{padding: '4px 10px', fontSize: '12px'}}>✕</button>
                </div>
              ) : (
                <>{project.name} {canModifySettings && <Pencil size={12} color="#666" style={{cursor: 'pointer', marginLeft: '6px'}} onClick={() => setIsRenaming(true)} />}</>
              )}
            </div>
          </div>
          <div className="sp-project-meta-box">
            <div className="sp-project-meta-label">URL Subdomain</div>
            <div className="sp-project-meta-val">
              {project.publishedUrl ? (
                <a href={project.publishedUrl} target="_blank" rel="noopener noreferrer" style={{color: '#4f6ef7', textDecoration: 'none', fontSize: '13px'}}>
                  {slug} <ExternalLink size={10} style={{marginLeft: '4px'}} />
                </a>
              ) : (
                <span style={{color: '#666', fontSize: '13px'}}>Not published</span>
              )}
            </div>
          </div>
          <div className="sp-project-meta-box">
            <div className="sp-project-meta-label">Owner</div>
            <div className="sp-project-meta-val"><div className="sp-avatar-sm">{ownerInitial}</div> {ownerName}</div>
          </div>
          <div className="sp-project-meta-box">
            <div className="sp-project-meta-label">Created at</div>
            <div className="sp-project-meta-val">{createdAt}</div>
          </div>
          <div className="sp-project-meta-box">
            <div className="sp-project-meta-label">Messages count</div>
            <div className="sp-project-meta-val">{messageCount}</div>
          </div>
          <div className="sp-project-meta-box">
            <div className="sp-project-meta-label">Credits used</div>
            <div className="sp-project-meta-val">{messageCount} credits</div>
          </div>
        </div>
      </div>

      {/* ── Settings Rows ── */}
      <div className="sp-card-no-padding">
        <div className="sp-row">
          <div className="sp-row-info"><h4 className="sp-row-title">Project visibility</h4><p className="sp-row-desc">Who can view this project.</p></div>
          <MutedDropdown options={['Private', 'Workspace', 'Public']} value="Workspace" />
        </div>
        <div className="sp-row">
          <div className="sp-row-info"><h4 className="sp-row-title">Hide StackForge badge <span className="sp-badge sp-badge-pro">Pro</span></h4><p className="sp-row-desc">Remove the powered-by badge.</p></div>
          <Toggle isOn={toggles.badge} onToggle={() => setToggles(t => ({...t, badge: !t.badge}))} />
        </div>
        <div className="sp-row">
          <div className="sp-row-info"><h4 className="sp-row-title">Cross-project sharing</h4><p className="sp-row-desc">Allow sharing resources.</p></div>
          <Toggle isOn={toggles.sharing} onToggle={() => setToggles(t => ({...t, sharing: !t.sharing}))} />
        </div>
        <div className="sp-row">
          <div className="sp-row-info"><h4 className="sp-row-title">Transfer ownership</h4><p className="sp-row-desc">Transfer to another workspace member.</p></div>
          <button className="sp-btn sp-btn-outline" disabled={!canModifySettings}>Transfer</button>
        </div>
        <div className="sp-row">
          <div className="sp-row-info"><h4 className="sp-row-title">Remix this project</h4><p className="sp-row-desc">Create a duplicate with all files and settings.</p></div>
          <button className="sp-btn sp-btn-outline" onClick={handleRemixOpen}>
            Remix
          </button>
        </div>
        <div className="sp-row">
          <div className="sp-row-info"><h4 className="sp-row-title">Unpublish project</h4><p className="sp-row-desc">Take down the live website.</p></div>
          <button
            className="sp-btn sp-btn-outline"
            onClick={handleUnpublish}
            disabled={!project.publishedUrl || isUnpublishing || !canModifySettings}
          >
            {isUnpublishing ? 'Unpublishing...' : project.publishedUrl ? 'Unpublish' : 'Not published'}
          </button>
        </div>
      </div>

      {/* ── Share as Template ── */}
      <div className="sp-card-no-padding">
        <div className="sp-row">
          <div className="sp-row-info">
            <h4 className="sp-row-title">Share as Template</h4>
            <p className="sp-row-desc">
              {shareSuccess
                ? '✓ Your template was submitted! An admin will review it shortly.'
                : 'Submit your website as a community template. After admin approval, others can remix it.'}
            </p>
          </div>
          <button
            className="sp-btn sp-btn-outline"
            onClick={() => { setShowShareModal(true); setShareSuccess(false); }}
            disabled={shareSuccess}
          >
            {shareSuccess ? 'Submitted' : 'Share as Template'}
          </button>
        </div>
      </div>

      {/* Share as Template Modal */}
      {showShareModal && (
        <div className="sp-remix-overlay" onClick={() => setShowShareModal(false)}>
          <div className="sp-remix-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '480px'}}>
            <button className="sp-remix-close" onClick={() => setShowShareModal(false)}><X size={20} /></button>

            <div className="sp-remix-icon-wrap">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="url(#shareGrad)" stroke="none">
                <defs><linearGradient id="shareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient></defs>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>

            <h2 className="sp-remix-title">Share as Template</h2>
            <p className="sp-remix-desc">Give your website a theme name so others can discover and remix it.</p>

            <div className="sp-remix-field">
              <label>Theme Name *</label>
              <input
                type="text"
                placeholder='e.g. "Aurora", "Velocity"'
                value={shareForm.themeName}
                onChange={e => setShareForm(p => ({...p, themeName: e.target.value}))}
                className="sp-input"
                style={{width: '100%', marginTop: '6px'}}
              />
            </div>

            <div className="sp-remix-field" style={{marginTop: '12px'}}>
              <label>Tagline (optional)</label>
              <input
                type="text"
                placeholder='e.g. "Sleek & minimal"'
                value={shareForm.themeTagline}
                onChange={e => setShareForm(p => ({...p, themeTagline: e.target.value}))}
                className="sp-input"
                style={{width: '100%', marginTop: '6px'}}
              />
            </div>

            <div className="sp-remix-field" style={{marginTop: '12px'}}>
              <label>Categories * <span style={{fontWeight:400, color:'#888'}}>(pick all that apply)</span></label>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px', marginTop:'8px'}}>
                {SHARE_CATEGORIES.map(cat => {
                  const on = shareForm.categories.includes(cat);
                  return (
                    <button key={cat} type="button" onClick={() => toggleShareCategory(cat)} style={{
                      padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 500, fontFamily: 'inherit',
                      background: on ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${on ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      color: on ? '#a5b4fc' : '#888', transition: 'all 0.2s',
                    }}>
                      {cat.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sp-remix-actions" style={{marginTop: '20px'}}>
              <button className="sp-btn sp-btn-outline" onClick={() => setShowShareModal(false)}>Cancel</button>
              <button
                className="sp-btn sp-btn-white"
                onClick={handleShareSubmit}
                disabled={isSubmittingShare || !shareForm.themeName || shareForm.categories.length === 0}
              >
                {isSubmittingShare ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      <div className="sp-card sp-card-danger">
        <h4 className="sp-row-title" style={{marginBottom: '8px'}}>Delete project</h4>
        <p className="sp-row-desc" style={{marginBottom: '16px'}}>Permanently delete this project and all its assets. This action is irreversible.</p>
        {!confirmDelete ? (
          <button className="sp-btn sp-btn-danger" onClick={() => setConfirmDelete(true)} disabled={!canModifySettings}>Delete</button>
        ) : (
          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <span style={{color: '#ef4444', fontSize: '13px', fontWeight: 500}}>Are you sure?</span>
            <button className="sp-btn sp-btn-danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Yes, delete permanently'}
            </button>
            <button className="sp-btn sp-btn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* ── Remix Modal ── */}
      {showRemixModal && (
        <div className="sp-remix-overlay" onClick={() => setShowRemixModal(false)}>
          <div className="sp-remix-modal" onClick={e => e.stopPropagation()}>
            <button className="sp-remix-close" onClick={() => setShowRemixModal(false)}>
              <X size={20} />
            </button>
            
            <div className="sp-remix-icon-wrap">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="url(#heartGrad)" stroke="none">
                <defs><linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient></defs>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            
            <h2 className="sp-remix-title">Remix project</h2>
            <p className="sp-remix-desc">By remixing a project, you will create a copy that you own.</p>
            
            <div className="sp-remix-field">
              <label>Project name</label>
              <input
                type="text"
                value={remixName}
                onChange={e => setRemixName(e.target.value)}
                autoFocus
                className="sp-input"
                style={{width: '100%', marginTop: '6px'}}
              />
            </div>
            
            <div className="sp-remix-toggle-row">
              <span>Include project history</span>
              <Toggle isOn={remixIncludeHistory} onToggle={() => setRemixIncludeHistory(!remixIncludeHistory)} />
            </div>
            
            <div className="sp-remix-actions">
              <button className="sp-btn sp-btn-outline" onClick={() => setShowRemixModal(false)}>Cancel</button>
              <button className="sp-btn sp-btn-white" onClick={handleRemixSubmit} disabled={isRemixing}>
                {isRemixing ? 'Remixing...' : 'Remix'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: DOMAINS
// ─────────────────────────────────────────────────────────────────────────────
const DomainsPage = () => (
  <div className="sp-content">
    <div className="sp-page-header">
      <div>
        <h1 className="sp-page-title">Domains</h1>
        <p className="sp-page-subtitle">Manage custom domains for your project.</p>
      </div>
    </div>

    <div className="sp-warning-banner">
      <div style={{color: '#fde68a', fontSize: '13px', fontWeight: 500}}>Your project is not published yet, so domains will not route correctly.</div>
      <button className="sp-btn sp-btn-white" style={{background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none'}}>Publish now →</button>
    </div>

    <div className="sp-card-no-padding">
      <div className="sp-row">
        <div className="sp-row-info">
          <h4 className="sp-row-title">Buy a new domain <span className="sp-badge sp-badge-pro">Pro</span></h4>
          <p className="sp-row-desc">Purchase and auto-configure a custom domain.</p>
        </div>
        <button className="sp-btn sp-btn-primary">Buy new domain</button>
      </div>
      <div className="sp-row">
        <div className="sp-row-info">
          <h4 className="sp-row-title">Connect existing domain <span className="sp-badge sp-badge-pro">Pro</span></h4>
          <p className="sp-row-desc">Link a domain you already own via DNS.</p>
        </div>
        <button className="sp-btn sp-btn-outline" disabled>Connect domain</button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: LABS
// ─────────────────────────────────────────────────────────────────────────────
const LabsPage = () => (
  <div className="sp-content">
    <div className="sp-page-header">
      <div>
        <h1 className="sp-page-title">Labs</h1>
        <p className="sp-page-subtitle">Experimental features and early access functionality.</p>
      </div>
    </div>
    <div className="sp-card">
      <div className="sp-empty-state" style={{border: 'none', margin: 0, padding: '48px 0'}}>
        <Beaker size={32} color="#666" style={{margin: '0 auto 12px'}} />
        <div style={{fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '8px'}}>No active experiments</div>
        <div style={{fontSize: '13px', color: '#666'}}>Come back later to try out new and upcoming StackForge features.</div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: CONNECTORS
// ─────────────────────────────────────────────────────────────────────────────
const ConnectorsPage = () => (
  <div className="sp-content">
    <div className="sp-page-header">
      <div>
        <h1 className="sp-page-title">Connectors</h1>
        <p className="sp-page-subtitle">Integrate StackForge with your favorite tools.</p>
      </div>
    </div>
    <div className="sp-card-no-padding">
      <div className="sp-row">
        <div className="sp-row-info"><h4 className="sp-row-title">Supabase <span className="sp-badge" style={{background: '#3ecf8e', color: '#111'}}>Database</span></h4><p className="sp-row-desc">Connect automatically to your Supabase Postgres.</p></div>
        <button className="sp-btn sp-btn-outline">Connect</button>
      </div>
      <div className="sp-row">
        <div className="sp-row-info"><h4 className="sp-row-title">Vercel <span className="sp-badge" style={{background: '#fff', color: '#000'}}>Hosting</span></h4><p className="sp-row-desc">Deploy directly to Vercel edge networks.</p></div>
        <button className="sp-btn sp-btn-outline">Connect</button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: GITHUB
// ─────────────────────────────────────────────────────────────────────────────
const GithubPage = () => (
  <div className="sp-content">
    <div className="sp-page-header">
      <div>
        <h1 className="sp-page-title">GitHub</h1>
        <p className="sp-page-subtitle">Manage your GitHub integration and repositories.</p>
      </div>
    </div>
    <div className="sp-card">
      <div style={{display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'}}>
        <Github size={48} color="#fff" />
        <div>
          <h3 style={{margin: '0 0 4px 0', fontSize: '18px'}}>GitHub Connection</h3>
          <p style={{color: '#aaa', margin: 0, fontSize: '13px'}}>Link your account to push and pull code directly.</p>
        </div>
      </div>
      <button className="sp-btn sp-btn-white" style={{width: '100%'}}>Connect GitHub</button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: TEMPLATES MANAGER (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const TemplatesManagerPage = () => {
  const { getToken } = useAuth();

  const categories = [
    'saas', 'portfolio', 'landing', 'blog', 'ecommerce', 
    'restaurant', 'wellness', 'coffee-shop', 'fashion', 'service', 'sports',
    'agency', 'automotive', 'education', 'entertainment', 'fitness',
    'legal', 'medical', 'nonprofit', 'real-estate', 'travel', 'wedding', 'custom'
  ];

  const emptyTemplate = () => ({
    id: Date.now() + Math.random(),
    title: '',
    categories: [],
    description: '',
    themeName: '',
    themeTagline: '',
    htmlContent: '',
    htmlFile: null,
    status: 'pending', // pending | uploading | success | error
    error: '',
  });

  const [queue, setQueue] = useState([emptyTemplate()]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]); // { id, status, message, chunking }

  // ── Manage Templates State ──
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manage'
  const [adminTemplates, setAdminTemplates] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);

  const fetchAdminTemplates = async () => {
    setManageLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/templates/admin', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.templates) {
        setAdminTemplates(data.templates);
      }
    } catch (err) {
      console.error('Failed to fetch admin templates', err);
    } finally {
      setManageLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchAdminTemplates();
    }
  }, [activeTab]);

  const toggleVisibility = async (tmplId, field, currentVal) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/templates/${tmplId}/visibility`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentVal })
      });
      if (res.ok) {
        setAdminTemplates(prev => prev.map(t => t.id === tmplId ? { ...t, [field]: !currentVal } : t));
        toast.success('Visibility updated');
      }
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const handleApprove = async (tmplId, publishToBrowse) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/templates/${tmplId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishToBrowse })
      });
      if (res.ok) {
        fetchAdminTemplates();
        toast.success('Template approved');
      }
    } catch (err) {
      toast.error('Failed to approve template');
    }
  };

  const handleReject = async (tmplId) => {
    if (!window.confirm('Reject this community submission?')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/templates/${tmplId}/reject`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAdminTemplates();
    } catch (err) {
      toast.error('Failed to reject template');
    }
  };

  const handleDeleteTemplate = async (tmplId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/templates/${tmplId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminTemplates(prev => prev.filter(t => t.id !== tmplId));
        toast.success('Template archived limit-lessly');
      }
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const categoryLabel = (cat) => cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // ── Queue management ──
  const addToQueue = () => setQueue(prev => [...prev, emptyTemplate()]);

  const removeFromQueue = (id) => {
    if (queue.length === 1) return; // keep at least one
    setQueue(prev => prev.filter(t => t.id !== id));
  };

  const updateItem = (id, updates) => {
    setQueue(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const toggleCategory = (id, cat) => {
    setQueue(prev => prev.map(t => {
      if (t.id !== id) return t;
      const exists = t.categories.includes(cat);
      return { ...t, categories: exists ? t.categories.filter(c => c !== cat) : [...t.categories, cat] };
    }));
  };

  const handleFileChange = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateItem(id, { htmlFile: file, htmlContent: ev.target.result });
    };
    reader.readAsText(file);
  };

  const clearFile = (id) => {
    updateItem(id, { htmlFile: null, htmlContent: '' });
  };

  // ── Batch upload ──
  const handleBatchUpload = async () => {
    const valid = queue.filter(t => t.title && t.categories.length > 0 && (t.htmlContent || t.htmlFile));
    if (valid.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: valid.length });
    setResults([]);

    const token = await getToken();

    for (let i = 0; i < valid.length; i++) {
      const t = valid[i];
      setUploadProgress({ current: i + 1, total: valid.length });
      updateItem(t.id, { status: 'uploading' });

      try {
        const fd = new FormData();
        fd.append('title', t.title);
        fd.append('description', t.description);
        fd.append('categories', JSON.stringify(t.categories));
        fd.append('themeName', t.themeName);
        fd.append('themeTagline', t.themeTagline);

        if (t.htmlFile) {
          fd.append('htmlFile', t.htmlFile);
        } else {
          fd.append('htmlContent', t.htmlContent);
        }

        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();

        if (res.ok) {
          updateItem(t.id, { status: 'success' });
          setResults(prev => [...prev, { id: t.id, status: 'success', message: `${t.title} — uploaded to ${t.categories.length} categor${t.categories.length === 1 ? 'y' : 'ies'}`, chunking: data.chunking }]);
        } else {
          updateItem(t.id, { status: 'error', error: data.error || 'Failed' });
          setResults(prev => [...prev, { id: t.id, status: 'error', message: `${t.title} — ${data.error || 'Failed'}` }]);
        }
      } catch (err) {
        updateItem(t.id, { status: 'error', error: 'Network error' });
        setResults(prev => [...prev, { id: t.id, status: 'error', message: `${t.title} — Network error` }]);
      }
    }

    setIsUploading(false);
  };

  const allDone = queue.every(t => t.status === 'success' || t.status === 'error');
  const hasValid = queue.some(t => t.title && t.categories.length > 0 && (t.htmlContent || t.htmlFile));

  const resetAll = () => {
    setQueue([emptyTemplate()]);
    setResults([]);
    setUploadProgress({ current: 0, total: 0 });
  };

  // ── Collapsible template item ──
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="sp-content" style={{maxWidth: '1000px'}}>
      <div className="sp-page-header" style={{flexDirection: 'column', gap: '4px', marginBottom: '24px'}}>
        <h1 className="sp-page-title">Templates Manager</h1>
        <p className="sp-page-subtitle">Upload templates or manage existing ones.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer',
            color: activeTab === 'upload' ? '#fff' : '#888', fontSize: '13px', fontWeight: 600,
            borderBottom: `2px solid ${activeTab === 'upload' ? '#818cf8' : 'transparent'}`,
            transition: 'all 0.2s'
          }}
        >
          Upload Templates
        </button>
        <button
          onClick={() => setActiveTab('manage')}
          style={{
            background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer',
            color: activeTab === 'manage' ? '#fff' : '#888', fontSize: '13px', fontWeight: 600,
            borderBottom: `2px solid ${activeTab === 'manage' ? '#818cf8' : 'transparent'}`,
            transition: 'all 0.2s'
          }}
        >
          Manage Templates
        </button>
      </div>

      {activeTab === 'upload' && (
        <>
          {/* Upload Results */}
          {results.length > 0 && (
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {results.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px',
              background: r.status === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${r.status === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              fontSize: '12px', color: r.status === 'success' ? '#4ade80' : '#f87171',
            }}>
              {r.status === 'success' ? <Check size={14} /> : <X size={14} />}
              <span>{r.message}</span>
            </div>
          ))}
          <button onClick={resetAll} style={{
            alignSelf: 'flex-start', marginTop: '8px', padding: '6px 14px',
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '8px', color: '#a5b4fc', fontSize: '12px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + Upload more templates
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '13px',
        }}>
          <Loader2 size={16} style={{animation: 'spin 1s linear infinite'}} />
          <span>Uploading {uploadProgress.current} of {uploadProgress.total}...</span>
        </div>
      )}

      {/* Template Queue */}
      {!allDone && queue.map((item, idx) => {
        const isExpanded = expandedId === item.id || queue.length === 1;
        const hasContent = item.htmlContent || item.htmlFile;
        const lineCount = item.htmlContent ? item.htmlContent.split('\n').length : (item.htmlFile ? '—' : 0);
        const byteCount = item.htmlContent ? new Blob([item.htmlContent]).size : (item.htmlFile ? item.htmlFile.size : 0);
        const sizeKB = (byteCount / 1024).toFixed(1);

        return (
          <div key={item.id} style={{
            marginBottom: '12px', borderRadius: '14px',
            border: `1px solid ${item.status === 'success' ? 'rgba(34,197,94,0.3)' : item.status === 'error' ? 'rgba(239,68,68,0.3)' : item.status === 'uploading' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
            background: item.status === 'uploading' ? 'rgba(99,102,241,0.04)' : 'rgba(255,255,255,0.02)',
            overflow: 'hidden', transition: 'all 0.2s',
          }}>
            {/* Header — always visible */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: item.status === 'success' ? 'rgba(34,197,94,0.15)' : item.status === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.status === 'uploading' ? <Loader2 size={14} style={{color: '#818cf8', animation: 'spin 1s linear infinite'}} />
                  : item.status === 'success' ? <Check size={14} style={{color: '#4ade80'}} />
                  : item.status === 'error' ? <X size={14} style={{color: '#f87171'}} />
                  : <FileCode size={14} style={{color: '#818cf8'}} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title || `Template ${idx + 1}`}
                </div>
                <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '8px', marginTop: '1px' }}>
                  {item.categories.length > 0 && <span>{item.categories.length} categor{item.categories.length === 1 ? 'y' : 'ies'}</span>}
                  {hasContent && <span>{sizeKB} KB</span>}
                  {item.themeName && <span style={{color: '#818cf8'}}>"{item.themeName}"</span>}
                </div>
              </div>

              {queue.length > 1 && item.status === 'pending' && (
                <button onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }} style={{
                  background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px',
                  padding: '4px 8px', cursor: 'pointer', color: '#f87171', fontSize: '11px',
                  display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit',
                }}>
                  <X size={10} /> Remove
                </button>
              )}

              <ChevronDown size={14} style={{
                color: '#555', transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(180deg)' : 'none',
              }} />
            </div>

            {/* Expanded Body */}
            {isExpanded && item.status === 'pending' && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Title + Theme Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Template Title *</label>
                    <input className="sp-input" placeholder="e.g. Modern SaaS Hero" value={item.title}
                      onChange={e => updateItem(item.id, { title: e.target.value })}
                      style={{ width: '100%', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Theme Name (user sees)</label>
                    <input className="sp-input" placeholder="e.g. Aurora" value={item.themeName}
                      onChange={e => updateItem(item.id, { themeName: e.target.value })}
                      style={{ width: '100%', fontSize: '13px' }} />
                  </div>
                </div>

                {/* Tagline + Description */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Theme Tagline</label>
                    <input className="sp-input" placeholder="e.g. Sleek & minimal" value={item.themeTagline}
                      onChange={e => updateItem(item.id, { themeTagline: e.target.value })}
                      style={{ width: '100%', fontSize: '13px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', fontWeight: 500, marginBottom: '4px', display: 'block' }}>Description (internal)</label>
                    <input className="sp-input" placeholder="Brief description..." value={item.description}
                      onChange={e => updateItem(item.id, { description: e.target.value })}
                      style={{ width: '100%', fontSize: '13px' }} />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label style={{ fontSize: '11px', color: '#888', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Categories * — select one or more</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {categories.map(cat => {
                      const isChecked = item.categories.includes(cat);
                      return (
                        <button key={cat} type="button" onClick={() => toggleCategory(item.id, cat)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px',
                          background: isChecked ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isChecked ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          color: isChecked ? '#a5b4fc' : '#777', fontSize: '11px', fontWeight: 500,
                          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                        }}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                          {categoryLabel(cat)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* HTML Upload / Paste */}
                <div>
                  <label style={{ fontSize: '11px', color: '#888', fontWeight: 500, marginBottom: '6px', display: 'block' }}>HTML Content * — upload file or paste</label>

                  {item.htmlFile ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                      borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)',
                    }}>
                      <FileCode size={16} style={{ color: '#818cf8' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{item.htmlFile.name}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{sizeKB} KB · {lineCount} lines</div>
                      </div>
                      <button onClick={() => clearFile(item.id)} style={{
                        background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: '6px',
                        padding: '3px 8px', cursor: 'pointer', color: '#f87171', fontSize: '10px',
                        display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'inherit',
                      }}>
                        <X size={10} /> Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '16px', borderRadius: '10px', marginBottom: '8px',
                        border: '1.5px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                        onClick={() => document.getElementById(`file-input-${item.id}`)?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#6366f1'; }}
                        onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        onDrop={e => {
                          e.preventDefault(); e.stopPropagation();
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                          const file = e.dataTransfer?.files?.[0];
                          if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) handleFileChange(item.id, file);
                        }}
                      >
                        <Upload size={18} style={{ color: '#555' }} />
                        <span style={{ fontSize: '12px', color: '#888' }}>
                          Drop .html or <span style={{ color: '#818cf8', textDecoration: 'underline' }}>browse</span>
                        </span>
                      </div>
                      <input id={`file-input-${item.id}`} type="file" accept=".html,.htm"
                        onChange={e => handleFileChange(item.id, e.target.files?.[0])}
                        style={{ display: 'none' }} />
                      <textarea
                        placeholder="Or paste raw HTML here..."
                        value={item.htmlContent}
                        onChange={e => updateItem(item.id, { htmlContent: e.target.value, htmlFile: null })}
                        style={{
                          width: '100%', minHeight: '120px', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid #2a2a2a', borderRadius: '10px', padding: '12px',
                          color: '#ccc', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical',
                          outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#4f6ef7'}
                        onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add + Upload buttons */}
      {!allDone && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={addToQueue} disabled={isUploading} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#aaa', fontSize: '13px', fontWeight: 500, cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', fontFamily: 'inherit',
            opacity: isUploading ? 0.4 : 1,
          }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add Another Template
          </button>

          <button onClick={handleBatchUpload} disabled={isUploading || !hasValid} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '10px 24px', borderRadius: '10px',
            background: hasValid && !isUploading ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)',
            border: 'none', color: hasValid && !isUploading ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: '13px', fontWeight: 600, cursor: hasValid && !isUploading ? 'pointer' : 'not-allowed',
            boxShadow: hasValid && !isUploading ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
            transition: 'all 0.25s', fontFamily: 'inherit',
          }}>
            {isUploading ? (
              <><Loader2 size={16} style={{animation: 'spin 1s linear infinite'}} /> Uploading {uploadProgress.current}/{uploadProgress.total}...</>
            ) : (
              <><Upload size={16} /> Upload {queue.length > 1 ? `All ${queue.length} Templates` : 'Template'}</>
            )}
          </button>
        </div>
      )}

      {/* Queue count indicator */}
      {queue.length > 1 && !allDone && (
        <div style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
          {queue.length} template{queue.length > 1 ? 's' : ''} in queue · {queue.filter(t => t.title && t.categories.length > 0 && (t.htmlContent || t.htmlFile)).length} ready to upload
        </div>
      )}
        </>
      )}

      {activeTab === 'manage' && (
        <div className="sp-card">
          {manageLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 size={24} className="spinning" color="#666" style={{margin:'auto'}}/></div>
          ) : adminTemplates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No templates found.</div>
          ) : (
            <div className="sp-users-table-wrap">
              <table className="sp-users-table">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Source</th>
                    <th>Categories</th>
                    <th>Theme Picker</th>
                    <th>Browse Gallery</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminTemplates.map(t => {
                    const isPending = t.approvalStatus === 'pending';
                    const isRejected = t.approvalStatus === 'rejected';
                    return (
                      <tr key={t.id} style={{ opacity: isRejected ? 0.5 : 1 }}>
                        <td>
                          <div style={{fontWeight:500, color:'#fff'}}>{t.name}</div>
                          <div style={{fontSize:'11px', color:'#888', marginTop:'2px'}}>{(t.sizeBytes/1024).toFixed(1)} KB</div>
                        </td>
                        <td>
                          {t.source === 'community' ? (
                            <div>
                              <span className="sp-role-badge sp-role-user">Community</span>
                              <div style={{fontSize:'10px', color:'#666', marginTop:'2px'}}>by {t.submittedBy?.name || 'User'}</div>
                            </div>
                          ) : (
                            <span className="sp-role-badge sp-role-admin">Admin</span>
                          )}
                        </td>
                        <td>
                          <div style={{display:'flex', gap:'4px', flexWrap:'wrap', maxWidth:'140px'}}>
                            {t.categories.slice(0, 2).map(c => <span key={c} style={{fontSize:'10px', padding:'2px 6px', background:'rgba(255,255,255,0.05)', borderRadius:'4px'}}>{c}</span>)}
                            {t.categories.length > 2 && <span style={{fontSize:'10px', color:'#888'}}>+{t.categories.length - 2}</span>}
                          </div>
                        </td>
                        <td>
                          <Toggle isOn={t.isVisibleInThemes} onToggle={() => toggleVisibility(t.id, 'isVisibleInThemes', t.isVisibleInThemes)} disabled={isPending || isRejected} />
                        </td>
                        <td>
                          <Toggle isOn={t.isVisible} onToggle={() => toggleVisibility(t.id, 'isVisible', t.isVisible)} disabled={isPending || isRejected} />
                        </td>
                        <td>
                          <div style={{display:'flex', gap:'6px'}}>
                            {isPending && (
                              <>
                                <button onClick={() => handleApprove(t.id, false)} className="sp-btn sp-btn-outline" style={{padding:'4px 8px', fontSize:'11px', color:'#4ade80', borderColor:'rgba(74,222,128,0.3)'}}>Approve</button>
                                <button onClick={() => handleReject(t.id)} className="sp-btn sp-btn-outline" style={{padding:'4px 8px', fontSize:'11px', color:'#f87171', borderColor:'rgba(248,113,113,0.3)'}}>Reject</button>
                              </>
                            )}
                            {isRejected && <span style={{fontSize:'11px', color:'#f87171'}}>Rejected</span>}
                            {!isPending && (
                              <button onClick={() => handleDeleteTemplate(t.id, t.name)} style={{background:'none', border:'none', color:'#f87171', cursor:'pointer', padding:'4px'}} title="Archive Template">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: USERS MANAGER (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const UsersManagerPage = () => {
  const { getToken } = useAuth();
  const { userData } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.clerkId === clerkId ? { ...u, role: newRole } : u));
        toast.success('Role updated');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Action failed', err);
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sp-content" style={{maxWidth: '1000px'}}>
      <div className="sp-page-header" style={{flexDirection: 'column', gap: '4px', marginBottom: '32px'}}>
        <h1 className="sp-page-title">Users Manager</h1>
        <p className="sp-page-subtitle">Manage system roles and permissions for all registered users.</p>
      </div>

      <div className="sp-filter-bar" style={{marginBottom: '20px'}}>
        <div className="sp-search-bar">
          <Search size={14} />
          <input
            type="text"
            className="sp-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '80px 0'}}>
          <Loader2 size={32} style={{animation: 'spin 1s linear infinite', color: '#4f6ef7'}} />
          <p style={{marginTop: '12px', color: '#666', fontSize: '13px'}}>Fetching users...</p>
        </div>
      ) : (
        <div className="sp-table-wrapper">
          <table className="sp-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status/Tier</th>
                <th>Role</th>
                <th style={{textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.clerkId}>
                  <td>
                    <div className="sp-table-user">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" style={{width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover'}} />
                      ) : (
                        <div className="sp-avatar-sm blue">{(user.name || user.email || '?')[0].toUpperCase()}</div>
                      )}
                      <div>
                        <div style={{fontWeight: 600, color: '#fff'}}>{user.name || 'Anonymous'}</div>
                        <div style={{color: '#666', fontSize: '12px'}}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                      background: user.subscription?.tier === 'pro' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
                      color: user.subscription?.tier === 'pro' ? '#a78bfa' : '#888'
                    }}>
                      {user.subscription?.tier || 'free'}
                    </span>
                  </td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: user.role === 'admin' ? '#10b981' : '#888'}}>
                      {user.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} style={{opacity: 0.4}} />}
                      <span style={{textTransform: 'capitalize'}}>{user.role || 'user'}</span>
                    </div>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <button
                      className="sp-btn sp-btn-outline"
                      onClick={() => toggleRole(user.clerkId, user.role || 'user')}
                      disabled={actionLoading === user.clerkId || user.clerkId === userData?.clerkId}
                      style={{
                        height: '30px', padding: '0 12px', fontSize: '12px',
                        color: user.role === 'admin' ? '#ef4444' : '#10b981',
                        borderColor: user.role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
                        opacity: (actionLoading === user.clerkId || user.clerkId === userData?.clerkId) ? 0.5 : 1
                      }}
                    >
                      {actionLoading === user.clerkId ? 'Processing...' : (user.role === 'admin' ? 'Revoke Admin' : 'Make Admin')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sp-table-footer">Showing {filteredUsers.length} of {users.length} users</div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SHELL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const hash = location.hash || '#workspace';
  const { user } = useUser();
  const { userData } = useAuthStore();
  const { workspaces, activeWorkspaceId } = useWorkspaceStore();
  
  const activeWorkspace = workspaces?.find(w => w._id === activeWorkspaceId) || workspaces?.[0];
  const userName = user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const workspaceName = activeWorkspace?.name || 'Workspace';
  const workspaceInitial = workspaceName.charAt(0).toUpperCase();
  
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get('id');
  const isAdmin = userData?.role === 'admin';

  // Render Profile Page without sidebar
  if (hash === '#profile') {
    return <ProfilePage />;
  }

  const renderContent = () => {
    switch (hash) {
      case '#workspace': return <WorkspacePage />;
      case '#account': return <AccountSettingsPage />;
      case '#people': return <PeoplePage />;
      case '#plans': return <PlansPage />;
      case '#cloud': return <CloudPage />;
      case '#privacy': return <PrivacyPage />;
      case '#knowledge': return <KnowledgePage />;
      case '#project': return <ProjectSettingsPage />;
      case '#domains': return <DomainsPage />;
      case '#labs': return <LabsPage />;
      case '#connectors': return <ConnectorsPage />;
      case '#github': return <GithubPage />;
      case '#templates': return isAdmin ? <TemplatesManagerPage /> : <WorkspacePage />;
      case '#users': return isAdmin ? <UsersManagerPage /> : <WorkspacePage />;
      default: return <WorkspacePage />;
    }
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <button 
      className={`sp-nav-item ${hash === to ? 'active' : ''}`} 
      onClick={() => navigate(`/settings${location.search}${to}`)}
    >
      <div className="sp-icon-wrap"><Icon size={16} /></div>
      <span>{label}</span>
    </button>
  );

  const { isInviteModalOpen, setInviteModalOpen } = useUIStore();

  return (
    <>
    <div className="sp-container">
      <aside className="sp-sidebar">
        <div className="sp-sidebar-header">
          <a className="sp-back-link" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Go back</a>
        </div>
        
        {/* If viewing project settings or we have a context ID, show Project section injected at the top */}
        {(!!projectId || hash === '#project' || hash === '#domains') && (
          <>
            <div className="sp-section-label">Project</div>
            <div className="sp-nav-group">
              <NavItem to="#project" icon={Settings} label="Project settings" />
              <NavItem to="#domains" icon={Cloud} label="Domains" />
            </div>
          </>
        )}

        <div className="sp-section-label">Workspace</div>
        <div className="sp-nav-group">
          <NavItem to="#workspace" icon={() => <div className="sp-avatar-sm">{workspaceInitial}</div>} label={workspaceName} />
          <NavItem to="#people" icon={Users} label="People" />
          <NavItem to="#plans" icon={CreditCard} label="Plans & credits" />
          <NavItem to="#cloud" icon={Cloud} label="Cloud & AI balance" />
          <NavItem to="#privacy" icon={Lock} label="Privacy & security" />
        </div>

        <div className="sp-section-label">Account</div>
        <div className="sp-nav-group">
          <NavItem to="#account" icon={User} label={userName} />
          <NavItem to="#labs" icon={Beaker} label="Labs" />
        </div>

        <div className="sp-section-label">Knowledge</div>
        <div className="sp-nav-group">
          <NavItem to="#knowledge" icon={FileText} label="Knowledge" />
        </div>

        <div className="sp-section-label">Connectors</div>
        <div className="sp-nav-group" style={{marginBottom: isAdmin ? '0' : '24px'}}>
          <NavItem to="#connectors" icon={Plug} label="Connectors" />
          <NavItem to="#github" icon={Github} label="GitHub" />
        </div>

        {isAdmin && (
          <>
            <div className="sp-section-label" style={{marginTop: '24px'}}>Admin</div>
            <div className="sp-nav-group" style={{marginBottom: '24px'}}>
              <NavItem to="#templates" icon={LayoutTemplate} label="Templates Manager" />
              <NavItem to="#users" icon={ShieldAlert} label="Users Manager" />
            </div>
          </>
        )}
      </aside>
      
      <main className="sp-main">
        {renderContent()}
      </main>
    </div>
    <InviteMembersModal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </>
  );
}
