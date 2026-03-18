import { useState, useRef, useEffect } from 'react'
import { Plus, Mic, ArrowUp, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
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
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { userData, fetchUserData } = useAuthStore()
  const [promptValue, setPromptValue] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [placeholder, setPlaceholder] = useState('')
  const [charIdx, setCharIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const textareaRef = useRef(null)
  
  const { createProject } = useProjectStore()

  useEffect(() => {
      if (isLoaded && isSignedIn && !userData) {
          fetchUserData(getToken)
      }
  }, [isLoaded, isSignedIn, fetchUserData, getToken, userData])

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

  const userName = userData?.email ? userData.email.split('@')[0] : 'User';

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  const handleSend = () => {
    const trimmed = promptValue.trim()
    if (trimmed) {
      const newProjectId = createProject(trimmed)
      navigate(`/chat/${newProjectId}?prompt=${encodeURIComponent(trimmed)}`)
    }
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

      <div className="lv-bottom-bar">
        <div className="lv-bottom-bar-left">Templates</div>
        <button className="lv-bottom-bar-right" onClick={() => navigate('/templates')}>Browse all →</button>
      </div>
    </div>
  )
}