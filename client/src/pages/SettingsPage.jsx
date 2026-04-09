import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Users, CreditCard, Cloud, Lock, User, Beaker, FileText, 
  Plug, Github, Search, ChevronDown, Check, MoreHorizontal, Settings,
  Pencil, Info, X, ExternalLink, Activity, FolderPlus
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../lib/api';
import { toast } from 'react-hot-toast';
import './SettingsPage.css';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Toggle = ({ isOn, onToggle }) => (
  <button className={`sp-toggle ${isOn ? 'on' : ''}`} onClick={onToggle}>
    <div className="sp-toggle-thumb" />
  </button>
);

const MutedDropdown = ({ options, value }) => (
  <div className="sp-select-wrapper">
    <select className="sp-select" value={value} onChange={() => {}}>
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
    <ChevronDown size={14} className="sp-select-icon" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PROFILE (NO SIDEBAR)
// ─────────────────────────────────────────────────────────────────────────────
const ProfilePage = () => {
    const navigate = useNavigate();
    
    return (
      <div className="sp-profile-container">
        <header className="sp-profile-nav">
          <div style={{fontWeight: 600, fontSize: '18px'}}>StackForge</div>
          <button className="sp-btn sp-btn-outline" onClick={() => navigate('/dashboard')}>Open StackForge</button>
        </header>
        
        <main className="sp-profile-hero">
          <div className="sp-banner">
            <div className="sp-banner-avatar">T</div>
          </div>
          
          <div className="sp-profile-name-row">
            <div>
              <h1 className="sp-profile-name">tikku</h1>
              <p className="sp-profile-handle">@tikku_vj</p>
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
  const [toggles, setToggles] = useState({ chat: true, auto: true, push: true });
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
            <span style={{borderBottom: '1px solid #444', paddingBottom: '1px'}}>Open profile on stackforge.app/@tikku_vj</span> ↗
          </a>
        </div>
        <div className="sp-row" style={{alignItems: 'center'}}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Username</h4>
            <p className="sp-row-desc">Your public identifier and profile URL.</p>
          </div>
          <div style={{display: 'flex', gap: '12px', flex: 1, maxWidth: '400px'}}>
            <input type="text" className="sp-input" defaultValue="tikku_vj" style={{background: 'rgba(255,255,255,0.02)'}} />
            <button className="sp-btn sp-btn-outline">Update</button>
          </div>
        </div>
        <div className="sp-row" style={{alignItems: 'center'}}>
          <div className="sp-row-info">
            <h4 className="sp-row-title">Email</h4>
            <p className="sp-row-desc">Your email address associated with your account.</p>
          </div>
          <div style={{flex: 1, maxWidth: '400px'}}>
            <input type="text" className="sp-input" defaultValue="vajapiy628@hlkes.com" disabled style={{opacity: 0.5}} />
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
                <div style={{fontSize: '11px', color: '#666'}}>vajapiy628@hlkes.com</div>
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
const WorkspacePage = () => (
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
          <p className="sp-row-desc">This is your workspace's avatar.</p>
        </div>
        <div className="sp-avatar-orange">T</div>
      </div>
      <div className="sp-row">
        <div className="sp-row-info">
          <h4 className="sp-row-title">Workspace Name</h4>
          <p className="sp-row-desc">Used to identify your workspace on the dashboard.</p>
        </div>
        <div style={{textAlign: 'right'}}>
          <input type="text" className="sp-input" defaultValue="tikku's StackForge" style={{width: '250px', marginBottom: '6px'}} />
          <div style={{fontSize: '11px', color: '#666'}}>18 / 50 characters</div>
        </div>
      </div>
      <div className="sp-row">
        <div className="sp-row-info">
          <h4 className="sp-row-title">Workspace Handle</h4>
          <p className="sp-row-desc">A unique URL for your workspace.</p>
        </div>
        <button className="sp-btn sp-btn-outline">Set handle</button>
      </div>
      <div className="sp-row">
        <div className="sp-row-info">
          <h4 className="sp-row-title">Credit Limit</h4>
          <p className="sp-row-desc">Set a soft limit for API credits.</p>
        </div>
        <input type="number" className="sp-input" placeholder="Optional" style={{width: '120px'}} />
      </div>
    </div>

    <div className="sp-card sp-card-danger">
      <h4 className="sp-row-title" style={{marginBottom: '8px'}}>Leave workspace</h4>
      <p className="sp-row-desc" style={{marginBottom: '16px'}}>Revoke your access to this workspace. Any resources you created will remain.</p>
      <button className="sp-btn sp-btn-danger-outline" disabled title="You cannot leave your last workspace">Leave workspace</button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PEOPLE
// ─────────────────────────────────────────────────────────────────────────────
const PeoplePage = () => (
  <div className="sp-content">
    <div className="sp-page-header">
      <div>
        <h1 className="sp-page-title">People</h1>
        <p className="sp-page-subtitle">Manage members and their roles.</p>
      </div>
      <a className="sp-docs-link">⊙ Docs</a>
    </div>

    <div className="sp-tabs">
      <button className="sp-tab active">All</button>
      <button className="sp-tab">Invitations</button>
      <button className="sp-tab">Collaborators</button>
    </div>

    <div className="sp-filter-bar">
      <div className="sp-search-bar">
        <Search size={14} />
        <input type="text" className="sp-input" placeholder="Search members..." />
      </div>
      <MutedDropdown options={['All roles', 'Owner', 'Editor', 'Viewer']} value="All roles" />
      <div style={{flex: 1}}></div>
      <button className="sp-btn sp-btn-outline" style={{borderStyle: 'dashed'}}>Copy Invite Link</button>
      <button className="sp-btn sp-btn-outline">Export</button>
      <button className="sp-btn sp-btn-white">Invite members</button>
    </div>

    <div className="sp-table-wrapper">
      <table className="sp-table">
        <thead>
          <tr>
            <th>Name ⇅</th>
            <th>Role ⇅</th>
            <th>Joined date ⇅</th>
            <th>Apr usage ⇅</th>
            <th>Total usage ⇅</th>
            <th>Credit limit ⇅</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="sp-table-user">
                <div className="sp-avatar-sm blue">T</div>
                <div>
                  <div style={{fontWeight: 600, color: '#fff'}}>tikku (you)</div>
                  <div style={{color: '#666', fontSize: '12px'}}>varushytoffical@gmail.com</div>
                </div>
              </div>
            </td>
            <td><MutedDropdown options={['Owner', 'Editor']} value="Owner" /></td>
            <td>Mar 12, 2026</td>
            <td>2 credits</td>
            <td>4 credits</td>
            <td>∞</td>
            <td><MoreHorizontal size={16} color="#666" style={{cursor: 'pointer'}} /></td>
          </tr>
        </tbody>
      </table>
      <div className="sp-table-footer">Showing 1-1 of 1</div>
    </div>
  </div>
);

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
// PAGE: PRIVACY
// ─────────────────────────────────────────────────────────────────────────────
const PrivacyPage = () => {
  const [toggles, setToggles] = useState({});
  const toggle = (k) => setToggles(p => ({...p, [k]: !p[k]}));

  const rows = [
    { label: 'Default project visibility', desc: 'Who can see projects by default.', right: <MutedDropdown options={['Workspace', 'Private', 'Public']} value="Workspace" /> },
    { label: 'Default website access', desc: 'Who can view published sites.', badge: 'Business', badgeClass: 'sp-badge-business', right: <MutedDropdown options={['Anyone', 'Workspace only']} value="Anyone" /> },
    { label: 'MCP servers access', desc: 'Allow Model Context Protocol servers.', badge: 'Business', badgeClass: 'sp-badge-business', t: 'mcp' },
    { label: 'Data collection opt out', desc: 'Prevent training on your code.', badge: 'Business', badgeClass: 'sp-badge-business', t: 'data' },
    { label: 'Restrict workspace invitations', desc: 'Only admins can invite.', badge: 'Enterprise', badgeClass: 'sp-badge-enterprise', t: 'inv' },
    { label: 'Allow editors to transfer projects', desc: 'Let editors move projects out.', badge: 'Enterprise', badgeClass: 'sp-badge-enterprise', t: 'transfer' },
    { label: 'Invite links', desc: 'Enable joining via secret link.', t: 'links', def: true },
    { label: 'Who can publish externally', desc: 'Restrict external deploys.', badge: 'Enterprise', badgeClass: 'sp-badge-enterprise', right: <MutedDropdown options={['Editors and above', 'Owners only']} value="Editors and above" /> },
    { label: 'Block publishing with critical findings', desc: 'Require passing security scans.', t: 'block' },
    { label: 'Require security scan before first publish', desc: 'Mandatory pentest.', t: 'scan' },
    { label: 'Allow public preview links sharing', desc: 'Share unpublished previews.', badge: 'Enterprise', badgeClass: 'sp-badge-enterprise', t: 'prev', def: true },
    { label: 'Cross-project sharing', desc: 'Allow component reuse.', t: 'cross', def: true },
    { label: 'Workspace discovery', desc: 'Users with matching domains can ask to join.', badge: 'Business', badgeClass: 'sp-badge-business', t: 'discover', def: true },
  ];

  return (
    <div className="sp-content">
      <div className="sp-page-header">
        <div>
          <h1 className="sp-page-title">Privacy & Security</h1>
          <p className="sp-page-subtitle">Configure privacy, security, and data access.</p>
        </div>
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
                isOn={toggles[r.t] !== undefined ? toggles[r.t] : r.def} 
                onToggle={() => toggle(r.t)} 
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
                <>{project.name} <Pencil size={12} color="#666" style={{cursor: 'pointer', marginLeft: '6px'}} onClick={() => setIsRenaming(true)} /></>
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
          <button className="sp-btn sp-btn-outline">Transfer</button>
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
            disabled={!project.publishedUrl || isUnpublishing}
          >
            {isUnpublishing ? 'Unpublishing...' : project.publishedUrl ? 'Unpublish' : 'Not published'}
          </button>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="sp-card sp-card-danger">
        <h4 className="sp-row-title" style={{marginBottom: '8px'}}>Delete project</h4>
        <p className="sp-row-desc" style={{marginBottom: '16px'}}>Permanently delete this project and all its assets. This action is irreversible.</p>
        {!confirmDelete ? (
          <button className="sp-btn sp-btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
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
// MAIN SHELL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const hash = location.hash || '#workspace';

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
      default: return <WorkspacePage />;
    }
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <button 
      className={`sp-nav-item ${hash === to ? 'active' : ''}`} 
      onClick={() => navigate(`/settings${to}`)}
    >
      <div className="sp-icon-wrap"><Icon size={16} /></div>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="sp-container">
      <aside className="sp-sidebar">
        <div className="sp-sidebar-header">
          <a className="sp-back-link" onClick={() => navigate('/dashboard')}><ArrowLeft size={16} /> Go back</a>
        </div>
        
        {/* If viewing project settings, show Project section injected at the top */}
        {(hash === '#project' || hash === '#domains') && (
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
          <NavItem to="#workspace" icon={() => <div className="sp-avatar-sm">T</div>} label="tikku's StackForge" />
          <NavItem to="#people" icon={Users} label="People" />
          <NavItem to="#plans" icon={CreditCard} label="Plans & credits" />
          <NavItem to="#cloud" icon={Cloud} label="Cloud & AI balance" />
          <NavItem to="#privacy" icon={Lock} label="Privacy & security" />
        </div>

        <div className="sp-section-label">Account</div>
        <div className="sp-nav-group">
          <NavItem to="#account" icon={User} label="tikku" />
          <NavItem to="#labs" icon={Beaker} label="Labs" />
        </div>

        <div className="sp-section-label">Knowledge</div>
        <div className="sp-nav-group">
          <NavItem to="#knowledge" icon={FileText} label="Knowledge" />
        </div>

        <div className="sp-section-label">Connectors</div>
        <div className="sp-nav-group" style={{marginBottom: '24px'}}>
          <NavItem to="#connectors" icon={Plug} label="Connectors" />
          <NavItem to="#github" icon={Github} label="GitHub" />
        </div>
      </aside>
      
      <main className="sp-main">
        {renderContent()}
      </main>
    </div>
  );
}
