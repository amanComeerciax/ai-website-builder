import { NavLink } from 'react-router-dom'
import { Bell, Home, Folder, BookOpen, ChevronDown, Zap } from 'lucide-react'
import { UserButton } from "@clerk/clerk-react"
import './TopBar.css'

export default function TopBar() {
    return (
        <header className="zen-topbar">
            {/* Left — Workspace Selector */}
            <div className="zen-topbar-left">
                <div className="zen-workspace-selector">
                    <div className="zen-workspace-avatar">P</div>
                    <span className="zen-workspace-name">Personal</span>
                    <ChevronDown size={12} className="zen-workspace-chevron" />
                </div>
            </div>

            {/* Center — Nav Pills */}
            <div className="zen-topbar-center">
                <div className="zen-nav-pills">
                    <NavLink to="/dashboard" end className={({ isActive }) => `zen-nav-pill ${isActive ? 'zen-nav-pill-active' : ''}`}>
                        <Home size={14} />
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/dashboard/projects" className={({ isActive }) => `zen-nav-pill ${isActive ? 'zen-nav-pill-active' : ''}`}>
                        <Folder size={14} />
                        <span>Projects</span>
                    </NavLink>
                    <NavLink to="/dashboard/library" className={({ isActive }) => `zen-nav-pill ${isActive ? 'zen-nav-pill-active' : ''}`}>
                        <BookOpen size={14} />
                        <span>Prompt Library</span>
                    </NavLink>
                </div>
            </div>

            {/* Right — Actions */}
            <div className="zen-topbar-right">
                <button className="zen-topbar-icon-btn" title="Notifications">
                    <Bell size={18} />
                    <span className="zen-notification-dot" />
                </button>
                <div className="zen-topbar-user">
                    <UserButton afterSignOutUrl="/" />
                </div>
                <div className="zen-credits-badge">
                    <Zap size={12} className="zen-credits-icon" />
                    <span>100</span>
                </div>
            </div>
        </header>
    )
}
