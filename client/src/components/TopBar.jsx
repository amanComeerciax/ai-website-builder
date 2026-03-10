import { Search, Bell } from 'lucide-react'
import { UserButton } from "@clerk/clerk-react"
import './TopBar.css'

export default function TopBar() {
    return (
        <header className="topbar glass">
            {/* Search */}
            <div className="topbar-search">
                <Search size={16} className="topbar-search-icon" />
                <input
                    type="text"
                    placeholder="Search projects..."
                    className="topbar-search-input"
                />
            </div>

            {/* Right Actions */}
            <div className="topbar-actions">
                <button className="topbar-icon-btn" title="Notifications">
                    <Bell size={18} />
                </button>
                <div className="topbar-user">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    )
}
