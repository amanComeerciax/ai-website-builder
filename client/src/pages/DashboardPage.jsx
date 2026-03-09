import { Plus, FolderOpen, Clock, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import './DashboardPage.css'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { projects } = useProjectStore()

    return (
        <div className="dashboard-page animate-fade-in">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">My Projects</h1>
                    <p className="dashboard-subtitle">Build and manage your AI-generated websites</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/editor/new')}
                >
                    <Plus size={18} />
                    New Project
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="empty-state glass-card">
                    <div className="empty-icon">
                        <FolderOpen size={48} />
                    </div>
                    <h3 className="empty-title">No projects yet</h3>
                    <p className="empty-description">
                        Create your first AI-generated website by clicking the button above.
                        Describe what you want and let AI build it for you.
                    </p>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/editor/new')}
                    >
                        <Plus size={18} />
                        Create Your First Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            className="project-card glass-card"
                            onClick={() => navigate(`/editor/${project._id}`)}
                        >
                            <div className="project-preview">
                                <div className="project-preview-placeholder">
                                    <FolderOpen size={24} />
                                </div>
                            </div>
                            <div className="project-info">
                                <h3 className="project-name">{project.name}</h3>
                                <div className="project-meta">
                                    <span className={`badge badge-${project.status === 'complete' ? 'success' : project.status === 'generating' ? 'warning' : 'primary'}`}>
                                        {project.status}
                                    </span>
                                    <span className="project-date">
                                        <Clock size={12} />
                                        {new Date(project.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {project.deployUrl && (
                                    <a
                                        href={project.deployUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="project-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink size={12} />
                                        Live Site
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
