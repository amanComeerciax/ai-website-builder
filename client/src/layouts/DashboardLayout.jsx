import { useState, useEffect } from 'react'
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        // Auto-collapse sidebar on mobile devices on initial load
        if (window.innerWidth < 768 && !isSidebarCollapsed) {
            toggleSidebar()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className={`lv-layout ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <SeamlessVideoLayer src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4" />
            <Sidebar />
            
            <WorkspaceDropdown />
            <CreateFolderModal />
            
            {isMobile && !isSidebarCollapsed && (
                <div className="lv-mobile-overlay" onClick={toggleSidebar} />
            )}
            
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
