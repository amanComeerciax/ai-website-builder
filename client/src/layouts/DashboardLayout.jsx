import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import WorkspaceDropdown from '../components/WorkspaceDropdown'
import CreateFolderModal from '../components/CreateFolderModal'
import SeamlessVideoLayer from '../components/SeamlessVideoLayer'
import { useUIStore } from '../stores/uiStore'
import { PanelLeftOpen } from 'lucide-react'
import './DashboardLayout.css'

export default function DashboardLayout() {
    const { isSidebarCollapsed, toggleSidebar } = useUIStore()

    return (
        <div className={`lv-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <SeamlessVideoLayer src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4" />
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
