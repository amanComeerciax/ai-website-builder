import { useState, useRef, useEffect } from 'react'
import { Plus, Mic, ArrowUp, MessageSquare, ArrowRight, Grid, Clock, LayoutTemplate, FolderOpen } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useRecentlyViewedStore } from '../stores/recentlyViewedStore'
import './DashboardPage.css'

// Rotating placeholder
const PROMPTS = [
  "Describe what you want to create...",
  "A minimalist portfolio with dark mode...",
  "An e-commerce store for artisan candles...",
  "A SaaS dashboard with analytics charts...",
  "A restaurant site with online ordering...",
]

// ── Live Thumbnail component ──
function LiveThumbnail({ projectId }) {
    const [html, setHtml] = useState(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!projectId) return
        let cancelled = false
        fetch(`/api/projects/${projectId}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return
                const tree = data?.project?.currentFileTree
                if (tree && tree['index.html']) {
                    setHtml(tree['index.html'])
                } else {
                    setFailed(true)
                }
            })
            .catch(() => !cancelled && setFailed(true))
        return () => { cancelled = true }
    }, [projectId])

    if (failed || !html) {
        return (
            <div className="lv-card-thumb-placeholder">
                <LayoutTemplate size={28} />
            </div>
        )
    }

    return (
        <iframe
            srcDoc={html}
            title="preview"
            sandbox="allow-same-origin"
            loading="lazy"
        />
    )
}

// ── Template Thumbnail ──
function TemplateThumbnail({ templateId }) {
    const [html, setHtml] = useState(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!templateId) return
        let cancelled = false
        fetch(`/api/templates/preview/${templateId}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return
                if (data?.html) {
                    setHtml(data.html)
                } else {
                    setFailed(true)
                }
            })
            .catch(() => !cancelled && setFailed(true))
        return () => { cancelled = true }
    }, [templateId])

    if (failed || !html) {
        return (
            <div className="lv-card-thumb-placeholder">
                <LayoutTemplate size={28} />
            </div>
        )
    }

    return (
        <iframe
            srcDoc={html}
            title="template preview"
            sandbox="allow-same-origin"
            loading="lazy"
        />
    )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user: clerkUser } = useUser()
  const { userData, fetchUserData } = useAuthStore()
  const [promptValue, setPromptValue] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [placeholder, setPlaceholder] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const textareaRef = useRef(null)
  
  const { projects, createProject } = useProjectStore()
  const { recentItems } = useRecentlyViewedStore()

  // Tab state
  const [activeTab, setActiveTab] = useState('projects')

  // Templates
  const [templates, setTemplates] = useState([])

  useEffect(() => {
      if (isLoaded && isSignedIn && !userData) {
          fetchUserData(getToken)
      }
  }, [isLoaded, isSignedIn, fetchUserData, getToken, userData])

  // Fetch templates on mount
  useEffect(() => {
      fetch('/api/templates')
          .then(r => r.json())
          .then(data => {
              if (data.templates) setTemplates(data.templates)
          })
          .catch(() => {})
  }, [])

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

  const userName = userData?.name || clerkUser?.fullName || clerkUser?.username || userData?.email?.split('@')[0] || 'User';

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const handleSend = async () => {
      const trimmed = promptValue.trim()
      if (trimmed) {
          const token = await getToken();
          const folderId = searchParams.get('folder');
          const { activeWorkspaceId } = useWorkspaceStore.getState();
          const newProjectId = await createProject(trimmed, token, folderId || null, null, activeWorkspaceId);
          
          const url = `/chat/${newProjectId}?prompt=${encodeURIComponent(trimmed)}`;
          navigate(url);
      }
  }

  // Build recently viewed list from stored IDs + project data
  const recentProjects = recentItems
      .map(item => {
          const proj = projects.find(p => p.id === item.projectId)
          return proj ? { ...proj, viewedAt: item.viewedAt } : null
      })
      .filter(Boolean)

  // Format time ago
  const timeAgo = (date) => {
      if (!date) return ''
      const now = Date.now()
      const ts = typeof date === 'number' ? date : new Date(date).getTime()
      const diff = Math.floor((now - ts) / 1000)
      if (diff < 60) return 'Just now'
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
      return new Date(ts).toLocaleDateString()
  }

  if (!isLoaded) {
    return null
  }

  return (
    <div className="lv-dashboard-page">
      <div className="lv-center-content">
        <h1 className="lv-hero-title">Ready to build, {userName}?</h1>
        
        <div className="lv-prompt-box">
          <textarea
            ref={textareaRef}
            value={promptValue}
            onChange={(e) => { setPromptValue(e.target.value); handleInput() }}
            placeholder={placeholder}
            className="lv-prompt-textarea"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="lv-prompt-toolbar">
            <div className="lv-toolbar-left">
              <button className="lv-tool-icon"><Plus size={24} /></button>
              <button className="lv-tool-icon"><MessageSquare size={24} /></button>
            </div>
            <div className="lv-toolbar-right">
              <button className="lv-tool-icon"><Mic size={24} /></button>
              <button 
                className={`lv-send-btn ${promptValue.trim() ? 'active' : ''}`}
                onClick={handleSend}
                disabled={!promptValue.trim()}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Section ── */}
      <div className="lv-tab-section">
        <div className="lv-tabs-bar">
          <button 
            className={`lv-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            My projects
          </button>
          <button 
            className={`lv-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recently viewed
          </button>
          <button 
            className={`lv-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button className="lv-tab-browse" onClick={() => navigate('/templates')}>
            Browse all <ArrowRight size={14} />
          </button>
        </div>

        {/* ── My Projects ── */}
        {activeTab === 'projects' && (
          projects.length > 0 ? (
            <div className="lv-cards-grid" key="projects">
              {projects.slice(0, 4).map(proj => (
                <div 
                  key={proj.id} 
                  className="lv-project-card"
                  onClick={() => navigate(`/chat/${proj.id}`)}
                >
                  <div className="lv-card-thumb">
                    <LiveThumbnail projectId={proj.id} />
                    <div className="lv-card-thumb-gradient" />
                    {proj.publishedUrl && <div className="lv-card-badge">Published</div>}
                  </div>
                  <div className="lv-card-body">
                    <div className="lv-card-title">{proj.name}</div>
                    <div className="lv-card-meta">{timeAgo(proj.updatedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv-empty-tab">
              <FolderOpen size={36} className="lv-empty-tab-icon" />
              <div className="lv-empty-tab-text">No projects yet</div>
              <button className="lv-empty-tab-btn" onClick={() => textareaRef.current?.focus()}>
                Create your first project
              </button>
            </div>
          )
        )}

        {/* ── Recently Viewed ── */}
        {activeTab === 'recent' && (
          recentProjects.length > 0 ? (
            <div className="lv-cards-grid" key="recent">
              {recentProjects.slice(0, 4).map(proj => (
                <div 
                  key={proj.id} 
                  className="lv-project-card"
                  onClick={() => navigate(`/chat/${proj.id}`)}
                >
                  <div className="lv-card-thumb">
                    <LiveThumbnail projectId={proj.id} />
                    <div className="lv-card-thumb-gradient" />
                    {proj.publishedUrl && <div className="lv-card-badge">Published</div>}
                  </div>
                  <div className="lv-card-body">
                    <div className="lv-card-title">{proj.name}</div>
                    <div className="lv-card-meta">Viewed {timeAgo(proj.viewedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv-empty-tab">
              <Clock size={36} className="lv-empty-tab-icon" />
              <div className="lv-empty-tab-text">No recently viewed projects</div>
              <div className="lv-card-meta">Projects you open will appear here</div>
            </div>
          )
        )}

        {/* ── Templates ── */}
        {activeTab === 'templates' && (
          templates.length > 0 ? (
            <div className="lv-cards-grid" key="templates">
              {templates.slice(0, 4).map(t => (
                <div 
                  key={t.id} 
                  className="lv-project-card"
                  onClick={() => navigate(`/templates`)}
                >
                  <div className="lv-card-thumb">
                    <TemplateThumbnail templateId={t.id} />
                    <div className="lv-card-thumb-gradient" />
                  </div>
                  <div className="lv-card-body">
                    <div className="lv-card-title">{t.title}</div>
                    <div className="lv-card-desc">{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lv-empty-tab">
              <LayoutTemplate size={36} className="lv-empty-tab-icon" />
              <div className="lv-empty-tab-text">Loading templates...</div>
            </div>
          )
        )}
      </div>
    </div>
  )
}