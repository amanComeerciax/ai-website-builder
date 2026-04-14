import { useState, useRef, useEffect } from 'react'
import { Plus, Mic, ArrowUp, MessageSquare } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import WebsiteStylePicker from '../components/editor/WebsiteStylePicker'
import './DashboardPage.css'

// Rotating placeholder
const PROMPTS = [
  "Describe what you want to create...",
  "A minimalist portfolio with dark mode...",
  "An e-commerce store for artisan candles...",
  "A SaaS dashboard with analytics charts...",
  "A restaurant site with online ordering...",
]

// Shared prompt quality check
function isNonActionablePrompt(text) {
    const cleaned = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase().trim()
    const words = cleaned.split(/\s+/).filter(w => w.length > 0)
    if (cleaned.length < 2) return true
    if (/^(.)\1+$/.test(cleaned.replace(/\s/g, ''))) return true
    const noSpaces = cleaned.replace(/\s/g, '')
    const vowelCount = (noSpaces.match(/[aeiou]/gi) || []).length
    const vowelRatio = noSpaces.length > 0 ? vowelCount / noSpaces.length : 0
    if (noSpaces.length > 4 && vowelRatio < 0.12) return true
    const throwawayWords = new Set([
        'this', 'that', 'what', 'yes', 'no', 'ok', 'okay', 'sure', 'test',
        'testing', 'junky', 'junk', 'stuff', 'thing', 'things', 'idk', 'hmm',
        'um', 'uh', 'huh', 'nah', 'nope', 'yep', 'yeah', 'yea', 'lol', 'lmao',
        'haha', 'bruh', 'bro', 'dude', 'cool', 'nice', 'wow', 'meh', 'blah',
        'asdf', 'qwer', 'zxcv', 'sdfg', 'hjkl', 'nothing', 'something',
        'whatever', 'random', 'check', 'see', 'try', 'done', 'thanks', 'thank',
        'bye', 'stop', 'wait', 'go', 'help', 'why', 'how', 'who', 'when',
        'where', 'the', 'a', 'an', 'it', 'is', 'was', 'are', 'do', 'does',
        'can', 'will', 'just', 'only', 'here', 'there', 'now', 'then',
        'please', 'plz', 'pls', 'aaa', 'bbb', 'xxx', 'zzz', 'abc'
    ])
    if (words.length <= 2 && words.every(w => throwawayWords.has(w))) return true
    const actionKeywords = new Set([
        'add', 'create', 'build', 'make', 'change', 'update', 'fix', 'remove',
        'delete', 'move', 'style', 'color', 'font', 'resize', 'align', 'center',
        'navbar', 'footer', 'header', 'hero', 'section', 'page', 'button',
        'form', 'image', 'text', 'link', 'menu', 'sidebar', 'card', 'grid',
        'responsive', 'mobile', 'dark', 'light', 'animate', 'animation',
        'deploy', 'publish', 'portfolio', 'blog', 'ecommerce', 'landing',
        'redesign', 'improve', 'refactor', 'optimize'
    ])
    if (words.length === 1 && !actionKeywords.has(words[0])) return true
    return false
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
  const [styleOptions, setStyleOptions] = useState(null)
  const [warningMsg, setWarningMsg] = useState('')
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

  const userName = userData?.name || clerkUser?.fullName || clerkUser?.username || userData?.email?.split('@')[0] || 'User';

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

    const handleSend = async () => {
        const trimmed = promptValue.trim()
        if (!trimmed) return

        // Check for gibberish/vague prompts BEFORE creating a project
        if (isNonActionablePrompt(trimmed)) {
            setWarningMsg("That doesn't look like a website description. Try something like: \"A portfolio website with dark mode\" or \"An e-commerce store for shoes\"")
            setTimeout(() => setWarningMsg(''), 5000)
            return
        }

        const token = await getToken();
        const folderId = searchParams.get('folder');
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        const newProjectId = await createProject(trimmed, token, folderId || null, null, activeWorkspaceId);
        
        // Redirect to the real project URL — no more style params here!
        const url = `/chat/${newProjectId}?prompt=${encodeURIComponent(trimmed)}`;
        navigate(url);
    }

  if (!isLoaded) {
    return null
  }

  return (
    <div className="lv-dashboard-page">
      <div className="lv-center-content">
        <h1 className="lv-hero-title">Ready to build, {userName}?</h1>
        
        {warningMsg && (
          <div style={{
            maxWidth: '680px', width: '100%', marginBottom: '16px',
            padding: '12px 16px', borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5', fontSize: '13px', lineHeight: '1.5',
            animation: 'slideUpFade 0.2s ease-out',
            textAlign: 'center'
          }}>
            {warningMsg}
          </div>
        )}
        
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