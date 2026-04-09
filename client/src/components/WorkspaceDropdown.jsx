import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useAuth } from '@clerk/clerk-react'
import { Settings, UserPlus, Zap, Check, Plus, Globe } from 'lucide-react'
import './WorkspaceDropdown.css'

export default function WorkspaceDropdown() {
  const { isWorkspaceDropdownOpen, setWorkspaceDropdownOpen, setCreateWorkspaceOpen } = useUIStore()
  const { userData } = useAuthStore()
  const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspaceStore()
  const { getToken } = useAuth()

  if (!isWorkspaceDropdownOpen) return null

  const userName = userData?.email ? userData.email.split('@')[0] : 'User'
  const userInitial = userData?.email ? userData.email[0].toUpperCase() : 'U'
  const activeWorkspace = workspaces.find(w => w._id === activeWorkspaceId) || workspaces[0]
  const currentPlan = activeWorkspace?.plan?.toUpperCase() || 'FREE'

  return (
    <>
      <div className="lv-dropdown-backdrop" onClick={() => setWorkspaceDropdownOpen(false)} />
      <div className="lv-workspace-dropdown">
        <div className="lv-drop-header">
          <div className="lv-drop-avatar">{userInitial}</div>
          <div className="lv-drop-meta">
            <h3>{activeWorkspace?.name || `${userName}'s StackForge`}</h3>
            <p>{activeWorkspace?.plan === 'free' ? 'Free Plan' : activeWorkspace?.plan === 'pro' ? 'Pro Plan' : 'Business Plan'} • 1 member</p>
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
          {workspaces.map(ws => (
            <div 
                key={ws._id} 
                className={`lv-workspace-item ${ws._id === activeWorkspaceId ? 'active' : ''}`}
                onClick={async () => {
                    setWorkspaceDropdownOpen(false)
                    const token = await getToken()
                    switchWorkspace(ws._id, token)
                }}
            >
               <div className="lv-drop-avatar small">{userInitial}</div>
               <span className="lv-ws-name">{ws.name}</span>
               <span className="lv-badge-free">{ws.plan.toUpperCase()}</span>
               {ws._id === activeWorkspaceId && <Check size={16} className="lv-check-icon" />}
            </div>
          ))}
        </div>

        <div className="lv-drop-footer">
          <button 
            className="lv-footer-btn" 
            onClick={() => {
              setWorkspaceDropdownOpen(false)
              setCreateWorkspaceOpen(true)
            }}
          >
            <Plus size={16} /> Create new workspace
          </button>
          <button className="lv-footer-btn" onClick={() => setWorkspaceDropdownOpen(false)}><Globe size={16} /> Find workspaces</button>
        </div>
      </div>
    </>
  )
}
