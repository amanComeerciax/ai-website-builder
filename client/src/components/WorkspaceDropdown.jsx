import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { Settings, UserPlus, Zap, Check, Plus, Globe } from 'lucide-react'
import './WorkspaceDropdown.css'

export default function WorkspaceDropdown() {
  const { isWorkspaceDropdownOpen, setWorkspaceDropdownOpen } = useUIStore()
  const { userData } = useAuthStore()

  if (!isWorkspaceDropdownOpen) return null

  const userName = userData?.email ? userData.email.split('@')[0] : 'User'
  const workspaceName = `${userName}'s Lovable`
  const userInitial = userData?.email ? userData.email[0].toUpperCase() : 'U'

  return (
    <>
      <div className="lv-dropdown-backdrop" onClick={() => setWorkspaceDropdownOpen(false)} />
      <div className="lv-workspace-dropdown">
        <div className="lv-drop-header">
          <div className="lv-drop-avatar">{userInitial}</div>
          <div className="lv-drop-meta">
            <h3>{workspaceName}</h3>
            <p>Free Plan • 1 member</p>
          </div>
        </div>

        <div className="lv-drop-actions-row">
          <button className="lv-drop-btn"><Settings size={14} /> Settings</button>
          <button className="lv-drop-btn"><UserPlus size={14} /> Invite members</button>
        </div>

        <div className="lv-drop-pro-banner">
          <div className="lv-pro-left">
            <Zap size={16} className="lv-pro-icon" /> Turn Pro
          </div>
          <button className="lv-upgrade-badge">Upgrade</button>
        </div>

        <div className="lv-drop-credits-box">
          <div className="lv-credits-top">
            <h4>Credits</h4>
            <span>5 left ›</span>
          </div>
          <div className="lv-credits-bar">
            <div className="lv-credits-fill" style={{ width: '10%' }}></div>
          </div>
          <p className="lv-credits-reset"><span className="lv-dot"></span> Daily credits reset at midnight UTC</p>
        </div>

        <div className="lv-drop-workspaces">
          <h5>All workspaces</h5>
          <div className="lv-workspace-item active">
             <div className="lv-drop-avatar small">{userInitial}</div>
             <span className="lv-ws-name">{workspaceName}</span>
             <span className="lv-badge-free">FREE</span>
             <Check size={16} className="lv-check-icon" />
          </div>
        </div>

        <div className="lv-drop-footer">
          <button className="lv-footer-btn" onClick={() => setWorkspaceDropdownOpen(false)}><Plus size={16} /> Create new workspace</button>
          <button className="lv-footer-btn" onClick={() => setWorkspaceDropdownOpen(false)}><Globe size={16} /> Find workspaces</button>
        </div>
      </div>
    </>
  )
}
