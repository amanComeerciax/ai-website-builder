import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    ArrowRight,
    Github,
    Twitter,
    Wind,
    Sparkles,
    Eye,
    Rocket,
    Zap,
    Globe,
    Code2,
    Palette,
    Shield,
    Clock,
    Users,
    Star,
    ChevronRight,
    Calendar,
    FileText,
    User,
    ChevronUp,
    Check
} from 'lucide-react'
import { SignedIn, SignedOut, useAuth, useClerk, SignInButton, SignUpButton } from '@clerk/clerk-react'
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import './LandingPage.css'

// Rotating placeholder suggestions
const PLACEHOLDER_SUGGESTIONS = [
    "A SaaS dashboard with real-time charts...",
    "An e-commerce store for artisan candles...",
    "A portfolio website with dark theme...",
    "A restaurant site with online ordering...",
    "A fitness tracker with analytics...",
]

// How it works steps
const HOW_IT_WORKS = [
    {
        step: '01',
        title: 'Start with an idea',
        description: 'Describe the app or website you want to create, or drop in screenshots and docs. Our AI understands context, design, and functionality.',
        icon: Sparkles,
    },
    {
        step: '02',
        title: 'Watch it come to life',
        description: 'See your vision transform into a working prototype in real-time as AI generates production-ready React, backend, and database code.',
        icon: Eye,
    },
    {
        step: '03',
        title: 'Refine and ship',
        description: 'Iterate with simple feedback, refine the design, and deploy to the world with one click. Go from idea to live URL in minutes.',
        icon: Rocket,
    },
]

// Feature cards
const FEATURES = [
    { icon: Code2, title: 'Full-Stack Generation', description: 'React frontend, Express backend, MongoDB schemas — production-ready in seconds.' },
    { icon: Eye, title: 'Live Preview', description: 'Watch your components render in real-time as the AI builds your application.' },
    { icon: Palette, title: 'Design System', description: 'Beautiful, responsive designs with modern typography and glassmorphism effects.' },
    { icon: Zap, title: 'AI-Powered Iteration', description: 'Chat with AI to refine your site. Change colors, add features, restructure naturally.' },
    { icon: Globe, title: 'One-Click Deploy', description: 'Deploy to a live URL instantly. Share your creation with the world in seconds.' },
    { icon: Shield, title: 'Production Ready', description: 'Clean, maintainable code with best practices. Authentication, API routes, and more.' },
]

// Template showcase — with realistic mini-mockup style
const TEMPLATES = [
    { name: 'Personal Portfolio', category: 'Portfolio', accent: '#a78bfa', bg: '#1a1030' },
    { name: 'E-Commerce Store', category: 'Commerce', accent: '#f97316', bg: '#1c1008' },
    { name: 'SaaS Dashboard', category: 'SaaS', accent: '#34d399', bg: '#0a1a14' },
    { name: 'Blog Platform', category: 'Content', accent: '#f472b6', bg: '#1c0a18' },
    { name: 'Restaurant Site', category: 'Business', accent: '#fbbf24', bg: '#1a1504' },
    { name: 'Event Platform', category: 'Events', accent: '#818cf8', bg: '#121228' },
]

// Stats
const STATS = [
    { value: '10K+', label: 'Projects Built' },
    { value: '5K+', label: 'Happy Builders' },
    { value: '<2min', label: 'Avg Build Time' },
    { value: '99.9%', label: 'Uptime' },
]

// Orbital timeline data – How It Works
const TIMELINE_DATA = [
    {
        id: 1,
        title: 'Planning',
        date: 'Step 1',
        content: 'Describe your app idea in plain English. Our AI understands context, design, and functionality.',
        category: 'Planning',
        icon: Calendar,
        relatedIds: [2],
        status: 'completed',
        energy: 100,
    },
    {
        id: 2,
        title: 'Design',
        date: 'Step 2',
        content: 'AI generates beautiful, responsive UI designs with modern typography and glassmorphism effects.',
        category: 'Design',
        icon: FileText,
        relatedIds: [1, 3],
        status: 'completed',
        energy: 90,
    },
    {
        id: 3,
        title: 'Development',
        date: 'Step 3',
        content: 'Production-ready React frontend, Express backend, and MongoDB schemas — built in seconds.',
        category: 'Development',
        icon: Code2,
        relatedIds: [2, 4],
        status: 'in-progress',
        energy: 60,
    },
    {
        id: 4,
        title: 'Testing',
        date: 'Step 4',
        content: 'Live preview lets you test and iterate with simple feedback. Refine until perfect.',
        category: 'Testing',
        icon: User,
        relatedIds: [3, 5],
        status: 'pending',
        energy: 30,
    },
    {
        id: 5,
        title: 'Release',
        date: 'Step 5',
        content: 'One-click deploy to a live URL. Share your creation with the world in seconds.',
        category: 'Release',
        icon: Clock,
        relatedIds: [4],
        status: 'pending',
        energy: 10,
    },
]

export default function LandingPage() {
    const [inputValue, setInputValue] = useState('')
    const [placeholder, setPlaceholder] = useState(PLACEHOLDER_SUGGESTIONS[0])
    const [placeholderIndex, setPlaceholderIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [navScrolled, setNavScrolled] = useState(false)
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState('Gemini 3 Flash')
    const fileInputRef = useRef(null)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()
    const { isSignedIn } = useAuth()
    const clerk = useClerk()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsModelDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

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
            if (!isSignedIn) {
                // Open modal instead of redirecting to /login page
                clerk.openSignIn({
                    fallbackRedirectUrl: `/editor/new?prompt=${encodeURIComponent(inputValue.trim())}&model=${encodeURIComponent(selectedModel)}`
                });
            } else {
                navigate(`/editor/new?prompt=${encodeURIComponent(inputValue.trim())}&model=${encodeURIComponent(selectedModel)}`)
            }
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            // Future logic to process the attached file
            console.log(`Attached file: ${e.target.files[0].name}`)
        }
    }

    return (
        <div className="landing">
            {/* ═══ Navbar ═══ */}
            <nav className={`lp-nav ${navScrolled ? 'lp-nav-scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <Link to="/" className="lp-nav-logo">
                        <Wind size={22} />
                        <span>INDIFORGE AI</span>
                    </Link>

                    <div className="lp-nav-center">
                        <Link to="/" className="lp-nav-link lp-nav-link-active">Home</Link>
                        <Link to="/pricing" className="lp-nav-link">Pricing</Link>
                        <a href="#features" className="lp-nav-link">Features</a>
                        <a href="#how-it-works" className="lp-nav-link">How it Works</a>
                    </div>

                    <div className="lp-nav-right">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="lp-nav-link mb-0" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign in</button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="lp-nav-cta mb-0" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Get Started
                                    <ArrowRight size={14} />
                                </button>
                            </SignUpButton>
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
                    <h1 className="hero-title">
                        Build something
                    </h1>
                    <div className="hero-gooey-wrapper">
                        <GooeyText
                            texts={["Incredible", "Beautiful", "Powerful", "Stunning", "Amazing"]}
                            morphTime={1.5}
                            cooldownTime={0.5}
                            className="hero-gooey-container"
                            textClassName="hero-gooey-text"
                        />
                    </div>
                    <p className="hero-description">
                        Create apps and websites by chatting with AI. Describe your idea in plain English — IndiForge AI generates production-ready code and deploys it in under 2 minutes.
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
                                <div className="hero-prompt-left relative">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        style={{ display: 'none' }}
                                        onChange={handleFileChange}
                                    />
                                    <button
                                        className="hero-prompt-icon"
                                        title="Attach file"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    </button>
                                    <div className="hero-prompt-separator" />

                                    <div className="relative" ref={dropdownRef}>
                                        <button
                                            className="hero-prompt-model"
                                            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                        >
                                            <span className="hero-prompt-model-dot" />
                                            {selectedModel}
                                            <ChevronUp size={14} className={`transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isModelDropdownOpen && (
                                            <div className="absolute bottom-full left-0 mb-3 w-56 rounded-2xl border border-white/10 bg-[#050505]/60 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                {['Gemini 3 Flash', 'Claude 3.5 Sonnet', 'GPT-4o'].map(model => (
                                                    <button
                                                        key={model}
                                                        onClick={() => {
                                                            setSelectedModel(model);
                                                            setIsModelDropdownOpen(false);
                                                        }}
                                                        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm text-left text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                                    >
                                                        <span>{model}</span>
                                                        {selectedModel === model && <Check size={14} className="text-blue-400" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button className="hero-prompt-send" onClick={handleSend} disabled={!inputValue.trim()}>
                                    Build site
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="hero-stats">
                        {STATS.map((stat, i) => (
                            <div key={i} className="hero-stat-group">
                                {i > 0 && <div className="hero-stat-sep" />}
                                <div className="hero-stat">
                                    <span className="hero-stat-value">{stat.value}</span>
                                    <span className="hero-stat-label">{stat.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Trusted By — Logo Cloud (Marquee) ═══ */}
            <section className="logos-section">
                <p className="logos-label">Teams from top companies build with IndiForge</p>
                <div className="marquee-wrapper">
                    <div className="marquee-track">
                        {[...Array(2)].map((_, copy) => (
                            <div key={copy} className="marquee-group" aria-hidden={copy > 0}>
                                {['Google', 'Microsoft', 'Meta', 'Stripe', 'Vercel', 'Figma', 'Shopify', 'Notion', 'Linear', 'Supabase'].map((name) => (
                                    <span key={name} className="logo-text">{name}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* ═══ Glow Orb ═══ */}
            <div className="glow-orb-wrapper">
                <div className="glow-orb" />
            </div>

            {/* ═══ How It Works ═══ */}
            <section id="how-it-works" className="hiw-section">
                <div className="hiw-inner">
                    <div className="hiw-header lp-reveal">
                        <h2 className="section-title">
                            Meet <span className="section-title-accent">IndiForge AI</span>
                        </h2>
                        <p className="section-subtitle">
                            From idea to production in three simple steps
                        </p>
                    </div>

                    {/* Orbital Timeline */}
                    <div className="lp-reveal" style={{ marginBottom: '4rem' }}>
                        <RadialOrbitalTimeline timelineData={TIMELINE_DATA} />
                    </div>

                    <div className="hiw-grid">
                        {HOW_IT_WORKS.map((item, i) => (
                            <div key={i} className="hiw-card lp-reveal" style={{ animationDelay: `${i * 0.15}s` }}>
                                <div className="hiw-step-number">{item.step}</div>
                                <div className="hiw-icon-wrapper">
                                    <item.icon size={24} />
                                </div>
                                <h3 className="hiw-title">{item.title}</h3>
                                <p className="hiw-description">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Features Grid ═══ */}
            <section id="features" className="features-section">
                <div className="features-inner">
                    <div className="features-header lp-reveal">
                        <h2 className="section-title">
                            Everything you need to go <span className="section-title-accent">from idea to live site</span>
                        </h2>
                        <p className="section-subtitle">
                            Powered by AI, built for speed. Every tool you need in one place.
                        </p>
                    </div>

                    <div className="features-grid">
                        {FEATURES.map((feat, i) => (
                            <div key={i} className="feature-card lp-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="feature-icon-wrapper">
                                    <feat.icon size={22} />
                                </div>
                                <h3 className="feature-title">{feat.title}</h3>
                                <p className="feature-description">{feat.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Templates Showcase ═══ */}
            <section className="templates-section">
                <div className="templates-inner">
                    <div className="templates-header lp-reveal">
                        <h2 className="section-title">
                            Discover <span className="section-title-accent">Templates</span>
                        </h2>
                        <p className="section-subtitle">
                            Start your next project with a beautiful, production-ready template
                        </p>
                    </div>

                    <div className="templates-grid">
                        {TEMPLATES.map((tmpl, i) => (
                            <div key={i} className="template-card lp-reveal" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="template-preview" style={{ background: tmpl.bg }}>
                                    {/* Mini browser mockup */}
                                    <div className="tmock">
                                        <div className="tmock-top">
                                            <div className="tmock-dots">
                                                <span /><span /><span />
                                            </div>
                                            <div className="tmock-url" />
                                        </div>
                                        <div className="tmock-body">
                                            <div className="tmock-nav">
                                                <div className="tmock-nav-logo" style={{ background: tmpl.accent }} />
                                                <div className="tmock-nav-links">
                                                    <span /><span /><span />
                                                </div>
                                            </div>
                                            <div className="tmock-hero">
                                                <div className="tmock-heading" style={{ background: tmpl.accent, opacity: 0.3 }} />
                                                <div className="tmock-heading-sm" style={{ background: tmpl.accent, opacity: 0.15, width: '60%' }} />
                                                <div className="tmock-text-lines">
                                                    <span /><span /><span style={{ width: '70%' }} />
                                                </div>
                                                <div className="tmock-btn" style={{ background: tmpl.accent }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="template-info">
                                    <span className="template-category" style={{ color: tmpl.accent }}>{tmpl.category}</span>
                                    <h4 className="template-name">{tmpl.name}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="templates-cta-row lp-reveal" style={{ animationDelay: '0.5s' }}>
                        <Link to="/pricing" className="templates-view-all">
                            View all templates
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══ CTA Section ═══ */}
            <section className="cta-section">
                <div className="cta-inner lp-reveal">
                    <h2 className="cta-title">Ready to build?</h2>
                    <p className="cta-subtitle">
                        Join thousands of builders turning ideas into reality with AI.
                    </p>
                    <div className="cta-buttons">
                        <SignedOut>
                            <SignUpButton mode="modal">
                                <button className="cta-primary" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Get Started Free
                                    <ArrowRight size={16} />
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <Link to="/dashboard" className="cta-primary">
                                Go to Dashboard
                                <ArrowRight size={16} />
                            </Link>
                        </SignedIn>
                        <Link to="/pricing" className="cta-secondary">
                            View pricing
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══ Footer ═══ */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <div className="lp-footer-left">
                        <div className="lp-footer-brand">
                            <Wind size={18} />
                            <span>INDIFORGE AI</span>
                        </div>
                        <p className="lp-footer-copy">Build the future with AI. From idea to production in minutes.</p>
                    </div>
                    <div className="lp-footer-right">
                        <div className="footer-nav">
                            <span className="footer-nav-title">Product</span>
                            <a href="#features" className="lp-footer-link">Features</a>
                            <Link to="/pricing" className="lp-footer-link">Pricing</Link>
                            <a href="#how-it-works" className="lp-footer-link">How it Works</a>
                        </div>
                        <div className="footer-nav">
                            <span className="footer-nav-title">Company</span>
                            <a href="#" className="lp-footer-link">About</a>
                            <a href="#" className="lp-footer-link">Blog</a>
                            <a href="#" className="lp-footer-link">Careers</a>
                        </div>
                        <div className="footer-nav">
                            <span className="footer-nav-title">Legal</span>
                            <a href="#" className="lp-footer-link">Privacy</a>
                            <a href="#" className="lp-footer-link">Terms</a>
                            <div className="lp-footer-social-wrapper" style={{ marginTop: '0.5rem' }}>
                                <a href="#" className="lp-footer-social"><Twitter size={14} /></a>
                                <a href="#" className="lp-footer-social"><Github size={14} /></a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lp-footer-bottom">
                    <span>© 2026 INDIFORGE AI. All rights reserved.</span>
                </div>
            </footer>
        </div>
    )
}
