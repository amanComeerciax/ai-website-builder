import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Sparkles,
    Code2,
    Eye,
    Rocket,
    Zap,
    Layers,
    MessageSquare,
    ArrowRight,
    Github,
    Twitter,
    Wind
} from 'lucide-react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import './LandingPage.css'

// Timeline data for the orbital display
const timelineData = [
    { id: 1, title: "Describe", date: "Step 1", content: "Just describe your website in plain English. Our AI understands context, design preferences, and functionality requirements.", category: "Input", icon: MessageSquare, relatedIds: [2], status: "completed", energy: 100 },
    { id: 2, title: "Generate", date: "Step 2", content: "Get React frontend, Express backend, MongoDB schemas, and all the glue code — production-ready in seconds.", category: "Build", icon: Code2, relatedIds: [1, 3], status: "completed", energy: 90 },
    { id: 3, title: "Preview", date: "Step 3", content: "See your website come to life in real-time. Watch every component render as the AI builds it.", category: "Preview", icon: Eye, relatedIds: [2, 4], status: "in-progress", energy: 75 },
    { id: 4, title: "Edit", date: "Step 4", content: "Full VS Code editing experience in your browser. Syntax highlighting, autocomplete, and file tree navigation.", category: "Editor", icon: Layers, relatedIds: [3, 5], status: "in-progress", energy: 60 },
    { id: 5, title: "Deploy", date: "Step 5", content: "Deploy your generated site to a live URL with a single click. Share it with the world in seconds.", category: "Launch", icon: Rocket, relatedIds: [4, 6], status: "pending", energy: 40 },
    { id: 6, title: "Iterate", date: "Step 6", content: "Chat with the AI to refine your site. Change colors, add features, restructure — all in natural language.", category: "Refine", icon: Zap, relatedIds: [5, 1], status: "pending", energy: 20 },
]

// Rotating placeholder suggestions
const PLACEHOLDER_SUGGESTIONS = [
    "Build me a portfolio website with dark theme...",
    "Create an e-commerce store for handmade jewelry...",
    "Design a SaaS landing page with pricing tiers...",
    "Make a restaurant website with online ordering...",
    "Build a blog platform with a minimalist design...",
    "Create a fitness tracker dashboard with charts...",
]

export default function LandingPage() {
    const [inputValue, setInputValue] = useState('')
    const [placeholder, setPlaceholder] = useState(PLACEHOLDER_SUGGESTIONS[0])
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [navScrolled, setNavScrolled] = useState(false)
    const navigate = useNavigate()

    // Typewriter placeholder
    useEffect(() => {
        const current = PLACEHOLDER_SUGGESTIONS[placeholderIndex]
        let timeout
        if (!isDeleting) {
            if (charIndex < current.length) {
                timeout = setTimeout(() => {
                    setPlaceholder(current.slice(0, charIndex + 1))
                    setCharIndex(c => c + 1)
                }, 45)
            } else {
                timeout = setTimeout(() => setIsDeleting(true), 2800)
            }
        } else {
            if (charIndex > 0) {
                timeout = setTimeout(() => {
                    setPlaceholder(current.slice(0, charIndex - 1))
                    setCharIndex(c => c - 1)
                }, 20)
            } else {
                setIsDeleting(false)
                setPlaceholderIndex(i => (i + 1) % PLACEHOLDER_SUGGESTIONS.length)
            }
        }
        return () => clearTimeout(timeout)
    }, [charIndex, isDeleting, placeholderIndex])

    // Navbar scroll state
    useEffect(() => {
        const handleScroll = () => setNavScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleSend = () => {
        if (inputValue.trim()) {
            navigate(`/editor/new?prompt=${encodeURIComponent(inputValue.trim())}`)
        }
    }

    return (
        <div className="landing">
            {/* ═══ Navbar ═══ */}
            <nav className={`lp-nav ${navScrolled ? 'lp-nav-scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <Link to="/" className="lp-nav-logo">
                        <Wind size={22} />
                        <span>INDI FORGE AI</span>
                    </Link>

                    <div className="lp-nav-center">
                        <Link to="/" className="lp-nav-link lp-nav-link-active">Home</Link>
                        <Link to="/pricing" className="lp-nav-link">Pricing</Link>
                        <a href="#features" className="lp-nav-link">Features</a>
                    </div>

                    <div className="lp-nav-right">
                        <SignedOut>
                            <Link to="/login" className="lp-nav-link">Sign in</Link>
                            <Link to="/signup" className="lp-nav-cta">
                                Get Started
                                <ArrowRight size={14} />
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <Link to="/dashboard" className="lp-nav-cta">
                                Dashboard
                                <ArrowRight size={14} />
                            </Link>
                        </SignedIn>
                    </div>
                </div>
            </nav>

            {/* ═══ Hero ═══ */}
            <section className="hero">
                <div className="hero-content lp-reveal">
                    {/* Badge */}
                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        <span>Now in Public Beta</span>
                    </div>

                    {/* Title */}
                    <div className="hero-title-wrapper">
                        <h1 className="hero-title">What will you</h1>
                        <div className="hero-title-dynamic">
                            <GooeyText
                                texts={["build", "create", "design", "launch"]}
                                morphTime={1}
                                cooldownTime={1.5}
                                className="hero-gooey-wrapper"
                                textClassName="hero-title-gooey"
                            />
                            <span className="hero-title-suffix">today?</span>
                        </div>
                    </div>
                    <p className="hero-description">
                        Describe your website in plain English. StackForge AI generates
                        production-ready code, gives you a live preview,
                        and deploys it — all in under 2 minutes.
                    </p>

                    {/* Prompt Input */}
                    <div className="hero-prompt-wrapper">
                        <div className="hero-prompt-box">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                className="hero-prompt-textarea"
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                            />
                            <div className="hero-prompt-footer">
                                <div className="hero-prompt-left">
                                    <button className="hero-prompt-icon" title="Attach file">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    </button>
                                    <div className="hero-prompt-separator" />
                                    <button className="hero-prompt-model">
                                        <span className="hero-prompt-model-dot" />
                                        Claude Sonnet 4.5
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                    </button>
                                </div>
                                <button className="hero-prompt-send" onClick={handleSend} disabled={!inputValue.trim()}>
                                    Build now
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value">10K+</span>
                            <span className="hero-stat-label">Sites Generated</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                            <span className="hero-stat-value">&lt;2min</span>
                            <span className="hero-stat-label">Avg Build Time</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                            <span className="hero-stat-value">99.9%</span>
                            <span className="hero-stat-label">Uptime</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ Features — Orbital Timeline ═══ */}
            <section id="features" className="features-section">
                <div className="features-header">
                    <h2 className="section-title">
                        Everything you need to go <span className="section-title-accent">from idea to live site</span>
                    </h2>
                    <p className="section-subtitle">
                        Click any node to explore. Our AI pipeline takes you from prompt to production.
                    </p>
                </div>
                <RadialOrbitalTimeline timelineData={timelineData} />
            </section>

            {/* ═══ Footer ═══ */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-left">
                        <div className="lp-footer-brand">
                            <Wind size={18} />
                            <span>StackForge AI</span>
                        </div>
                        <p className="lp-footer-copy">© 2026 StackForge AI. Build the future with AI.</p>
                    </div>
                    <div className="lp-footer-right">
                        <Link to="/pricing" className="lp-footer-link">Pricing</Link>
                        <a href="#features" className="lp-footer-link">Features</a>
                        <div className="lp-footer-sep" />
                        <a href="#" className="lp-footer-social"><Twitter size={14} /></a>
                        <a href="#" className="lp-footer-social"><Github size={14} /></a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
