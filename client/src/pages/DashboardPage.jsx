import { useState, useEffect, useRef } from 'react'
import { Plus, FolderOpen, Clock, ExternalLink, Image, PenTool, ChevronDown, MoreVertical, Camera, Globe, Wand2, Twitter, Github, MessageSquareText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../stores/projectStore'
import { useAuth } from '@clerk/clerk-react'
import './DashboardPage.css'

// Rotating placeholder
const PROMPTS = [
  "Describe what you want to create...",
  "A minimalist portfolio with dark mode...",
  "An e-commerce store for artisan candles...",
  "A SaaS dashboard with analytics charts...",
  "A restaurant site with online ordering...",
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, fetchProjects } = useProjectStore()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [promptValue, setPromptValue] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [placeholder, setPlaceholder] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects(getToken)
    }
  }, [isLoaded, isSignedIn, fetchProjects, getToken])

  // Typewriter placeholder
  useEffect(() => {
    const current = PROMPTS[placeholderIdx]
    let timeout
    if (!isDeleting) {
      if (charIdx < current.length) {
        timeout = setTimeout(() => {
          setPlaceholder(current.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        }, 45)
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2800)
      }
    } else {
      if (charIdx > 0) {
        timeout = setTimeout(() => {
          setPlaceholder(current.slice(0, charIdx - 1))
          setCharIdx(c => c - 1)
        }, 20)
      } else {
        setIsDeleting(false)
        setPlaceholderIdx(i => (i + 1) % PROMPTS.length)
      }
    }
    return () => clearTimeout(timeout)
  }, [charIdx, isDeleting, placeholderIdx])

  // Auto-resize textarea
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const handleSend = () => {
    if (promptValue.trim()) {
      navigate(`/editor/new?prompt=${encodeURIComponent(promptValue.trim())}`)
    }
  }

  if (!isLoaded) {
    return <div className="zen-loading">Loading...</div>
  }

  return (
    <>
      {/* HERO */}
      <section className="zen-hero">
        <h1 className="zen-hero-title zen-stagger" style={{ animationDelay: '0.1s' }}>
          Think it. Explore it.
        </h1>
        <p className="zen-hero-subtitle zen-stagger" style={{ animationDelay: '0.2s' }}>
          Explore freely, iterate fast. Your design, AI-powered.
        </p>

        {/* Prompt Input */}
        <div className="zen-prompt-wrapper zen-stagger" style={{ animationDelay: '0.4s' }}>
          <div className="zen-prompt-box">
            <div className="zen-prompt-textarea-area">
              <textarea
                ref={textareaRef}
                value={promptValue}
                onChange={(e) => { setPromptValue(e.target.value); handleInput() }}
                placeholder={placeholder}
                className="zen-prompt-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
            </div>
            <div className="zen-prompt-actions">
              <div className="zen-prompt-actions-left">
                <button className="zen-prompt-icon-btn" title="Upload image">
                  <Image size={18} />
                </button>
                <button className="zen-prompt-icon-btn" title="Draw">
                  <PenTool size={18} />
                </button>
                <div className="zen-prompt-divider" />
                <button className="zen-prompt-model-btn">
                  <span className="zen-model-dot" />
                  Gemini 3 Flash
                  <ChevronDown size={10} />
                </button>
              </div>
              <button className="zen-prompt-send-btn" onClick={handleSend} disabled={!promptValue.trim()}>
                Build
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="zen-quick-actions zen-stagger" style={{ animationDelay: '0.5s' }}>
          <button className="zen-quick-action-btn">
            <Camera size={14} />
            Recreate Screenshot
          </button>
          <button className="zen-quick-action-btn">
            <Globe size={14} />
            Import from Site
          </button>
          <button className="zen-quick-action-btn">
            <Wand2 size={14} />
            Explore Effects
          </button>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="zen-projects-section">
        <div className="zen-projects-header">
          <h2 className="zen-projects-title">Recent Projects</h2>
          <button className="zen-view-archive-btn">View Archive</button>
        </div>

        <div className="zen-projects-grid">
          {/* Create New Card */}
          <div className="zen-new-project-card zen-stagger" style={{ animationDelay: '0.6s' }} onClick={() => navigate('/editor/new')}>
            <div className="zen-new-project-icon">
              <Plus size={24} />
            </div>
            <span className="zen-new-project-text">New Project</span>
          </div>

          {/* Project Cards */}
          {projects.map((project, idx) => (
            <div
              key={project._id}
              className="zen-project-card zen-stagger"
              style={{ animationDelay: `${0.7 + idx * 0.1}s` }}
              onClick={() => navigate(`/editor/${project._id}`)}
            >
              <div className="zen-project-preview">
                <div className="zen-project-preview-placeholder">
                  <FolderOpen size={28} />
                </div>
              </div>
              <div className="zen-project-info">
                <div className="zen-project-info-row">
                  <div>
                    <h3 className="zen-project-name">{project.businessName || project.name}</h3>
                    <p className="zen-project-date">
                      <Clock size={10} />
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="zen-project-more-btn" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical size={16} />
                  </button>
                </div>
                {project.deployUrl && (
                  <a href={project.deployUrl} target="_blank" rel="noopener noreferrer" className="zen-project-link" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={10} />
                    Live Site
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* Empty state hint when no projects */}
          {projects.length === 0 && (
            <div className="zen-project-card zen-empty-card zen-stagger" style={{ animationDelay: '0.7s' }}>
              <div className="zen-project-preview">
                <div className="zen-project-preview-placeholder zen-project-preview-hint">
                  <FolderOpen size={28} />
                  <span>Your projects will appear here</span>
                </div>
              </div>
              <div className="zen-project-info">
                <div className="zen-project-info-row">
                  <div>
                    <h3 className="zen-project-name" style={{ color: '#525252' }}>No projects yet</h3>
                    <p className="zen-project-date">Create one above</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STICKY FOOTER */}
      <footer className="zen-footer">
        <div className="zen-footer-left">
          <div className="zen-footer-support">
            <MessageSquareText size={16} className="zen-footer-support-icon" />
            <span>SUPPORT ONLINE</span>
          </div>
          <div className="zen-footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
        <div className="zen-footer-right">
          <div className="zen-footer-social">
            <a href="#"><Twitter size={14} /></a>
            <a href="#"><Github size={14} /></a>
          </div>
          <div className="zen-footer-divider" />
          <span className="zen-footer-copyright">© 2026 STACKFORGE AI</span>
        </div>
      </footer>
    </>
  )
}