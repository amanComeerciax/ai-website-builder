import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import './DashboardLayout.css'

export default function DashboardLayout() {
    return (
        <div className="zen-dashboard-layout">
            <Sidebar />
            <div className="zen-dashboard-main zen-bg-gradient">
                <TopBar />
                <main className="zen-dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
