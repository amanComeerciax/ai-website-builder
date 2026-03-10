import { NavLink, useNavigate } from 'react-router-dom'
import { useClerk } from "@clerk/clerk-react"
import {
    Wind,
    LayoutDashboard,
    Layers,
    Archive,
    Settings,
    LogOut,
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar() {
    const navigate = useNavigate()
    const { signOut } = useClerk()

    return (
        <aside className="zen-sidebar">
            {/* Logo */}
            <div className="zen-sidebar-logo">
                <div className="zen-sidebar-logo-icon">
                    <Wind size={20} />
                </div>
                <span className="zen-sidebar-logo-text">INDIFORGE AI</span>
            </div>

            {/* Navigation */}
            <nav className="zen-sidebar-nav">
                <NavLink to="/dashboard" end className={({ isActive }) => `zen-sidebar-link ${isActive ? 'zen-sidebar-link-active' : ''}`}>
                    <LayoutDashboard size={18} />
                    <span className="zen-sidebar-link-text">Dashboard</span>
                </NavLink>
                <NavLink to="/dashboard/projects" className={({ isActive }) => `zen-sidebar-link ${isActive ? 'zen-sidebar-link-active' : ''}`}>
                    <Layers size={18} />
                    <span className="zen-sidebar-link-text">Collections</span>
                </NavLink>
                <NavLink to="/dashboard/archive" className={({ isActive }) => `zen-sidebar-link ${isActive ? 'zen-sidebar-link-active' : ''}`}>
                    <Archive size={18} />
                    <span className="zen-sidebar-link-text">Archive</span>
                </NavLink>
            </nav>

            {/* Footer */}
            <div className="zen-sidebar-footer">
                <NavLink to="/dashboard/settings" className={({ isActive }) => `zen-sidebar-link ${isActive ? 'zen-sidebar-link-active' : ''}`}>
                    <Settings size={18} />
                    <span className="zen-sidebar-link-text">Settings</span>
                </NavLink>
                <button
                    className="zen-sidebar-link"
                    onClick={() => signOut(() => navigate("/"))}
                >
                    <LogOut size={18} />
                    <span className="zen-sidebar-link-text">Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
