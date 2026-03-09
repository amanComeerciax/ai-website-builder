import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import './DashboardLayout.css'

export default function DashboardLayout() {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="dashboard-main">
                <TopBar />
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
