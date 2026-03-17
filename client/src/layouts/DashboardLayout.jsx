import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import WorkspaceDropdown from '../components/WorkspaceDropdown'
import CreateFolderModal from '../components/CreateFolderModal'
import { useUIStore } from '../stores/uiStore'
import { PanelLeftOpen } from 'lucide-react'
import './DashboardLayout.css'

export default function DashboardLayout() {
    const { isSidebarCollapsed, toggleSidebar } = useUIStore()

    return (
        <div className={`lv-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <Sidebar />
            
            <WorkspaceDropdown />
            <CreateFolderModal />
            
            <main className="lv-main">
                {isSidebarCollapsed && (
                    <button className="lv-sidebar-floater" onClick={toggleSidebar}>
                        <PanelLeftOpen size={18} />
                    </button>
                )}
                <Outlet />
            </main>
        </div>
    )
}
