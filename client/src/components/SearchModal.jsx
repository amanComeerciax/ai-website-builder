import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutTemplate,
  Home,
  Settings,
  Star,
  Grid,
  Users,
  Zap,
  ArrowRight,
  Clock,
  Hash,
} from 'lucide-react'
import { useProjectStore } from '../stores/projectStore'
import './SearchModal.css'

// ── Static quick-action commands ────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: 'home',      label: 'Go to Dashboard',      icon: Home,          path: '/dashboard',      group: 'Navigate' },
  { id: 'projects',  label: 'All Projects',          icon: Grid,          path: '/projects/all',   group: 'Navigate' },
  { id: 'starred',   label: 'Starred Projects',      icon: Star,          path: '/projects/starred', group: 'Navigate' },
  { id: 'shared',    label: 'Shared with me',        icon: Users,         path: '/projects/shared', group: 'Navigate' },
  { id: 'settings',  label: 'Settings',              icon: Settings,      path: '/settings',       group: 'Navigate' },
  { id: 'pricing',   label: 'Upgrade to Pro',        icon: Zap,           path: '/pricing',        group: 'Navigate' },
]

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { projects } = useProjectStore()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // ── Build filtered result list ────────────────────────────────────────────
  const results = useCallback(() => {
    const q = query.trim().toLowerCase()

    if (!q) {
      // No query → show recents + all quick actions
      const recents = projects.slice(0, 5).map(p => ({
        id: p._id || p.id,
        label: p.name,
        icon: LayoutTemplate,
        group: 'Recent Projects',
        path: `/chat/${p._id || p.id}`,
        isProject: true,
      }))
      return [...recents, ...QUICK_ACTIONS.map(a => ({ ...a }))]
    }

    // Filter projects
    const matchedProjects = projects
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map(p => ({
        id: p._id || p.id,
        label: p.name,
        icon: LayoutTemplate,
        group: 'Projects',
        path: `/chat/${p._id || p.id}`,
        isProject: true,
      }))

    // Filter quick actions
    const matchedActions = QUICK_ACTIONS.filter(a =>
      a.label.toLowerCase().includes(q)
    )

    return [...matchedProjects, ...matchedActions]
  }, [query, projects])()

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[activeIndex]
        if (item) { navigate(item.path); onClose() }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, results, activeIndex, navigate, onClose])

  // ── Auto-scroll active item into view ────────────────────────────────────
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // ── Reset active index on query change ───────────────────────────────────
  useEffect(() => { setActiveIndex(0) }, [query])

  if (!isOpen) return null

  // Group consecutive items
  const groups = []
  let lastGroup = null
  results.forEach((item, idx) => {
    if (item.group !== lastGroup) {
      groups.push({ label: item.group, startIdx: idx })
      lastGroup = item.group
    }
  })

  return (
    <div className="sp-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sp-modal" role="dialog" aria-modal="true" aria-label="Search">

        {/* ── Search input ── */}
        <div className="sp-input-row">
          <Search size={16} className="sp-input-icon" />
          <input
            ref={inputRef}
            className="sp-input"
            placeholder="Search projects, navigate..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button className="sp-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }}>
              ✕
            </button>
          )}
          <kbd className="sp-esc-hint">Esc</kbd>
        </div>

        <div className="sp-divider" />

        {/* ── Results list ── */}
        <div className="sp-list" ref={listRef}>
          {results.length === 0 ? (
            <div className="sp-empty">
              <Hash size={28} />
              <span>No results for "<strong>{query}</strong>"</span>
            </div>
          ) : (
            results.map((item, idx) => {
              const groupInfo = groups.find(g => g.startIdx === idx)
              const Icon = item.icon
              return (
                <div key={item.id || idx}>
                  {groupInfo && (
                    <div className="sp-group-label">
                      {item.group === 'Recent Projects' && <Clock size={11} />}
                      {item.group}
                    </div>
                  )}
                  <button
                    className={`sp-item ${idx === activeIndex ? 'sp-item-active' : ''}`}
                    data-idx={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => { navigate(item.path); onClose() }}
                  >
                    <span className="sp-item-icon">
                      <Icon size={14} />
                    </span>
                    <span className="sp-item-label">{item.label}</span>
                    {idx === activeIndex && (
                      <span className="sp-item-enter">
                        <ArrowRight size={12} /> Enter
                      </span>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer hints ── */}
        <div className="sp-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
