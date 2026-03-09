import { NavLink, useNavigate } from 'react-router-dom'
import {
    Sparkles,
    LayoutDashboard,
    FolderOpen,
    CreditCard,
    Settings,
    LogOut,
    Plus,
    HelpCircle
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar() {
    const navigate = useNavigate()

    return (
        <aside className="sidebar glass">
            {/* Logo */}
            <div className="sidebar-logo">
                <Sparkles size={22} className="logo-icon" />
                <span className="logo-text">StackForge <span className="gradient-text">AI</span></span>
            </div>

            {/* New Project Button */}
            <button
                className="btn btn-primary sidebar-new-btn"
                onClick={() => navigate('/editor/new')}
            >
                <Plus size={16} />
                New Project
            </button>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section">
                    <span className="sidebar-section-label">Main</span>
                    <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                        <LayoutDashboard size={18} />
                        Dashboard
                    </NavLink>
                    <NavLink to="/dashboard/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                        <FolderOpen size={18} />
                        Projects
                    </NavLink>
                </div>

                <div className="sidebar-section">
                    <span className="sidebar-section-label">Account</span>
                    <NavLink to="/pricing" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                        <CreditCard size={18} />
                        Subscription
                    </NavLink>
                    <NavLink to="/dashboard/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
                        <Settings size={18} />
                        Settings
                    </NavLink>
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button className="sidebar-link">
                    <HelpCircle size={18} />
                    Help & Docs
                </button>
                <button className="sidebar-link sidebar-link-danger">
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
