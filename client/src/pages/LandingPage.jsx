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
import { CategoryList } from '@/components/ui/category-list'
import { Accordion05 } from '@/components/ui/accordion-05'
import { GooeyText } from '@/components/ui/gooey-text-morphing'
import { motion } from 'framer-motion'
import Lenis from 'lenis'
import ThemePicker from '../components/ThemePicker'
// import WebsiteStylePicker from '../components/editor/WebsiteStylePicker'
import SeamlessVideoLayer from '../components/SeamlessVideoLayer'
import './LandingPage.css'

// ─── Premium scroll animation variants ───
const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
    })
}

const scaleUp = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    visible: (i = 0) => ({
        opacity: 1, scale: 1, y: 0,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }
    })
}

const slideInLeft = {
    hidden: { opacity: 0, x: -40 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
    })
}

const slideInRight = {
    hidden: { opacity: 0, x: 40 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
    })
}

const staggerParent = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
}

const staggerParentFast = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
}

// Rotating placeholder suggestions
const PLACEHOLDER_SUGGESTIONS = [
    "Ask StackForge to create an internal tool, a landing page, or a custom app...",
    "Ask StackForge to build a SaaS dashboard with real-time charts...",
    "Ask StackForge to design a portfolio for a freelance developer...",
    "Ask StackForge to create a fitness app with nutrition tracking...",
    "Ask StackForge to build an e-commerce platform for artisan coffee...",
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

// Template showcase — premium bento layout
const TEMPLATES = [
    { name: 'SaaS Landing Page', category: 'SaaS', accent: '#f97316', bg: 'linear-gradient(135deg, #1c1008, #2a1a0a)', desc: 'High-converting landing page with pricing, testimonials & CTA', tags: ['React', 'Tailwind'] },
    { name: 'Portfolio Pro', category: 'Portfolio', accent: '#a78bfa', bg: 'linear-gradient(135deg, #1a1030, #241644)', desc: 'Showcase your work with stunning animations', tags: ['Framer Motion'] },
    { name: 'E-Commerce Store', category: 'Commerce', accent: '#34d399', bg: 'linear-gradient(135deg, #0a1a14, #102e20)', desc: 'Complete store with cart, checkout & payments', tags: ['Stripe', 'MongoDB'] },
    { name: 'Blog Platform', category: 'Content', accent: '#f472b6', bg: 'linear-gradient(135deg, #1c0a18, #2d1228)', desc: 'Rich text editor, categories & SEO optimized', tags: ['Markdown'] },
    { name: 'Restaurant Site', category: 'Business', accent: '#fbbf24', bg: 'linear-gradient(135deg, #1a1504, #2c2208)', desc: 'Menu, reservations & location maps', tags: ['Maps API'] },
    { name: 'Event Platform', category: 'Events', accent: '#818cf8', bg: 'linear-gradient(135deg, #121228, #1c1c40)', desc: 'Ticketing, schedules & speaker profiles', tags: ['Calendar'] },
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

const landingFeatures = [
    {
        id: 1,
        title: "AI-Powered Generation",
        subtitle: "Describe your idea in plain English — we generate production-ready code instantly.",
        icon: <Sparkles className="w-8 h-8" />,
        featured: true,
    },
    {
        id: 2,
        title: "Real-Time Preview",
        subtitle: "See your website come alive instantly as AI builds it. Live iterate without refreshing.",
        icon: <Eye className="w-8 h-8" />,
    },
    {
        id: 3,
        title: "One-Click Deploy",
        subtitle: "Go live with a single click. Deploy to a custom URL and share your creation.",
        icon: <Rocket className="w-8 h-8" />,
    },
    {
        id: 4,
        title: "Smart Templates",
        subtitle: "Start from 50+ production-ready templates or let AI create a unique design from scratch.",
        icon: <Code2 className="w-8 h-8" />,
    }
];

// VideoBackground component removed in favor of SeamlessVideoLayer

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

    // Initialize Lenis smooth scroll
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        })

        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
        }
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
            const params = new URLSearchParams({
                prompt: inputValue.trim()
            });

            if (!isSignedIn) {
                clerk.openSignIn({
                    fallbackRedirectUrl: `/chat/new?${params.toString()}`
                });
            } else {
                navigate(`/chat/new?${params.toString()}`)
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
            {/* ═══ Video Background Hero ═══ */}
            <section className="vhero">
                <SeamlessVideoLayer 
                    src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4" 
                    objectPosition="center top"
                    style={{ opacity: 0.8 }}
                />

                {/* ═══ Navbar ═══ */}
                <nav className={`lp-nav ${navScrolled ? 'lp-nav-scrolled' : ''}`}>
                    <div className="lp-nav-inner" style={{ padding: '16px ' }}>
                        <Link to="/" className="lp-nav-logo" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 600, fontSize: '22px', letterSpacing: '-1.2px', gap: '6px' }}>
                            <Wind size={22} />
                            <span>STACKFORGE</span>
                        </Link>

                        <div className="lp-nav-center" style={{ gap: '32px' }}>
                            <Link to="/" className="lp-nav-link" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 500, fontSize: '15px', letterSpacing: '-0.2px' }}>Home</Link>
                            <a href="#features" className="lp-nav-link" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 500, fontSize: '15px', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Features
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </a>
                            <Link to="/pricing" className="lp-nav-link" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 500, fontSize: '15px', letterSpacing: '-0.2px' }}>Pricing</Link>
                            <Link to="/templates" className="lp-nav-link" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 500, fontSize: '15px', letterSpacing: '-0.2px' }}>Templates</Link>
                            <a href="#how-it-works" className="lp-nav-link" style={{ fontFamily: "'Schibsted Grotesk', sans-serif", fontWeight: 500, fontSize: '15px', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>How it Works</a>
                        </div>

                        <div className="lp-nav-right" style={{ gap: '12px' }}>
                            <SignedOut>
                                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                                    <button className="vhero-nav-btn-ghost" style={{ width: '82px' }}>Sign Up</button>
                                </SignUpButton>
                                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                                    <button className="vhero-nav-btn-solid" style={{ width: '101px' }}>Log In</button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <Link to="/dashboard" className="vhero-nav-btn-solid" style={{ width: '120px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                    Dashboard
                                    <ArrowRight size={14} />
                                </Link>
                            </SignedIn>
                        </div>
                    </div>
                </nav>

                {/* ═══ Hero Content ═══ */}
                <div className="vhero-content">
                    {/* Badge */}
                    <motion.div
                        className="vhero-badge"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <span className="vhero-badge-dark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20.58 9l-5 4.27L17.18 20 12 16.77 6.82 20l1.6-6.73L3.42 9l6.49-.74L12 2z" /></svg>
                            New
                        </span>
                        <span className="vhero-badge-light">Now in Public Beta</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        className="vhero-headline"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        Build something
                        <br />
                        <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: '8px' }}>Powerful</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="vhero-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                    >
                        Describe your idea in plain English — StackForge AI generates
                        production-ready code and deploys it in under 2 minutes.
                    </motion.p>

                    {/* Search Input Box */}
                    <motion.div
                        className="vhero-search-box"
                        initial={{ opacity: 0, y: 30, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.55 }}
                    >
                        {/* Credit info row */}
                        <div className="vhero-search-top">
                            <div className="vhero-credits-left">
                                <span className="vhero-credits-text">60/450 credits</span>
                                <button className="vhero-upgrade-btn">Upgrade</button>
                            </div>
                            <div className="vhero-powered-right">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2m0 14v2M5.63 5.63l1.42 1.42m9.9 9.9l1.42 1.42M3 12h2m14 0h2M5.63 18.37l1.42-1.42m9.9-9.9l1.42-1.42" /><circle cx="12" cy="12" r="4" /></svg>
                                <span>Powered by StackForge AI</span>
                            </div>
                        </div>

                        {/* Main input */}
                        <div className="vhero-search-input-row">
                            <input
                                type="text"
                                className="vhero-search-input"
                                placeholder={placeholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSend()
                                    }
                                }}
                            />
                            <button className="vhero-send-btn" onClick={handleSend} disabled={!inputValue.trim()}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                            </button>
                        </div>

                        {/* Bottom action row */}
                        <div className="vhero-search-bottom">
                            <div className="vhero-action-btns">
                                <button className="vhero-action-btn" onClick={() => fileInputRef.current?.click()}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    Attach
                                </button>
                                <button className="vhero-action-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                    Voice
                                </button>
                                <button className="vhero-action-btn">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    Prompts
                                </button>
                            </div>
                            <span className="vhero-char-count">{inputValue.length}/3,000</span>
                        </div>

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </motion.div>
                </div>
            </section>

            {/* ═══ Trusted By — Logo Cloud (Marquee) ═══ */}
            <motion.section
                className="logos-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
                variants={fadeUp}
            >
                <motion.p className="logos-label" variants={fadeUp}>Teams from top companies build with IndiForge</motion.p>
                <motion.div className="marquee-wrapper" variants={fadeUp} custom={1}>
                    <div className="marquee-track">
                        {[...Array(4)].map((_, copy) => (
                            <div key={copy} className="marquee-group" aria-hidden={copy > 0}>
                                {['Google', 'Microsoft', 'Meta', 'Stripe', 'Vercel', 'Figma', 'Shopify', 'Notion', 'Linear', 'Supabase'].map((name) => (
                                    <span key={name} className="logo-text">{name}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.section>

            {/* ═══ Glow Orb ═══ */}
            <div className="glow-orb-wrapper">
                <div className="glow-orb" />
            </div>

            {/* ═══ How It Works ═══ */}
            <section id="how-it-works" className="hiw-section">
                <div className="hiw-inner">
                    <motion.div
                        className="hiw-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                        variants={fadeUp}
                    >
                        <h2 className="section-title">
                            Everything you need to go <span className="section-title-accent">from idea to live site</span>
                        </h2>
                        <p className="section-subtitle">
                            Powered by AI, built for speed. Every tool you need in one place.
                        </p>
                    </motion.div>

                    <motion.div
                        className="hiw-grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.1 }}
                        variants={staggerParent}
                    >
                        {/* Step 1: AI-Powered Code Generation (Span 8) */}
                        <motion.div className="hiw-card span-8" variants={scaleUp} custom={0}>
                            <div className="hiw-card-info">
                                <h3 className="hiw-card-title">AI-Powered Code Generation</h3>
                                <p className="hiw-card-desc">
                                    Describe your website in plain English and watch IndiForge AI generate production-ready React code with modern design in seconds.
                                </p>
                            </div>
                            <div className="hiw-visual-area">
                                <div className="collab-visual">
                                    <div className="collab-orbit" />
                                    <div className="collab-orbit-inner" />
                                    <div className="collab-center">Prompt → Code</div>
                                    <div className="collab-avatar" style={{ top: '15%', left: '15%' }} />
                                    <div className="collab-avatar" style={{ top: '55%', right: '10%' }} />
                                    <div className="collab-avatar" style={{ bottom: '15%', left: '35%' }} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2: Real-Time Preview (Span 4) */}
                        <motion.div className="hiw-card span-4" variants={scaleUp} custom={1}>
                            <div className="hiw-card-info">
                                <h3 className="hiw-card-title">Real-Time Preview</h3>
                                <p className="hiw-card-desc">
                                    See your website come alive instantly as AI builds it. Edit, tweak, and iterate with live preview — no refresh needed.
                                </p>
                            </div>
                            <div className="hiw-visual-area">
                                <div className="role-visual">
                                    {[60, 80, 50].map((w, i) => (
                                        <div key={i} className="role-item">
                                            <div className={`role-checkbox ${i === 1 ? 'checked' : ''}`}>
                                                {i === 1 && <ArrowRight size={12} color="white" />}
                                            </div>
                                            <div className="role-text-placeholder" style={{ width: `${w}%` }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3: One-Click Deploy (Span 4) */}
                        <motion.div className="hiw-card span-4" variants={slideInLeft} custom={2}>
                            <div className="hiw-card-info">
                                <h3 className="hiw-card-title">One-Click Deploy</h3>
                                <p className="hiw-card-desc">
                                    Go live with a single click. Deploy to a custom URL and share your creation with the world instantly.
                                </p>
                            </div>
                            <div className="hiw-visual-area" style={{ flexDirection: 'row', gap: '1.5rem' }}>
                                <div className="admin-badge" style={{ padding: '1rem' }}><Github size={24} /></div>
                                <div className="admin-badge" style={{ padding: '1rem' }}><Rocket size={24} /></div>
                                <div className="admin-badge" style={{ padding: '1rem' }}><Zap size={24} /></div>
                            </div>
                        </motion.div>

                        {/* Step 4: Smart Templates & Customization (Span 8) */}
                        <motion.div className="hiw-card span-8" variants={slideInRight} custom={3}>
                            <div className="hiw-card-info">
                                <h3 className="hiw-card-title">Smart Templates & Customization</h3>
                                <p className="hiw-card-desc">
                                    Start from 50+ production-ready templates or let AI create a unique design. Every site is fully customizable with natural language edits.
                                </p>
                            </div>
                            <div className="hiw-visual-area">
                                <div className="admin-visual">
                                    <div className="admin-header">
                                        <div className="admin-avatar-row">
                                            <div className="admin-avatar" />
                                            <div className="role-text-placeholder" style={{ width: '120px', height: '10px' }} />
                                        </div>
                                        <div className="admin-badge">Your Site</div>
                                    </div>
                                    <div className="role-text-placeholder" style={{ width: '100%', height: '12px', opacity: 0.5 }} />
                                    <div className="role-text-placeholder" style={{ width: '70%', height: '12px', marginTop: '10px', opacity: 0.3 }} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══ Powerful Features ═══ */}
            <section id="features-overview" className="features-section features-v2">
                <div className="features-inner">
                    {/* Header — left aligned */}
                    <motion.div
                        className="features-v2-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                        variants={fadeUp}
                    >
                        <span className="features-v2-badge">Powerful Features</span>
                        <h2 className="features-v2-title">
                            <span className="features-v2-title-accent">Powerful Features</span>
                            <br />to Build & Ship<br />Effortlessly
                        </h2>
                        <p className="features-v2-subtitle">
                            Effortlessly create, optimize, and scale high-converting websites — no coding required.
                        </p>
                    </motion.div>

                    {/* Feature 01 — Hero card (full width) */}
                    <motion.div
                        className="feat-card feat-card-hero"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={scaleUp}
                        custom={0}
                    >
                        <div className="feat-card-text">
                            <span className="feat-num">01</span>
                            <h3 className="feat-card-title">AI-Powered Code Generation</h3>
                            <p className="feat-card-desc">
                                Describe your website in plain English and watch IndiForge AI generate production-ready React, Express, and MongoDB code — in under 2 minutes.
                            </p>
                        </div>
                        <div className="feat-card-visual">
                            <div className="feat-visual-editor">
                                <div className="feat-editor-top">
                                    <div className="feat-editor-dots"><span /><span /><span /></div>
                                    <div className="feat-editor-tab">LandingPage.jsx</div>
                                </div>
                                <div className="feat-editor-body">
                                    <div className="feat-code-line"><span className="c-keyword">const</span> <span className="c-fn">App</span> = () =&gt; {'{'}</div>
                                    <div className="feat-code-line pl-1"><span className="c-keyword">return</span> (</div>
                                    <div className="feat-code-line pl-2"><span className="c-tag">&lt;Hero</span> <span className="c-attr">title</span>=<span className="c-str">"Welcome"</span> /&gt;</div>
                                    <div className="feat-code-line pl-2"><span className="c-tag">&lt;Features</span> /&gt;</div>
                                    <div className="feat-code-line pl-1">)</div>
                                    <div className="feat-code-line">{'}'}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 02 & 03 — Two column */}
                    <div className="feat-row">
                        <motion.div
                            className="feat-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={slideInLeft}
                            custom={0}
                        >
                            <span className="feat-num">02</span>
                            <h3 className="feat-card-title">50+ Smart Templates</h3>
                            <p className="feat-card-desc">
                                Our AI picks from 50+ stunning, high-converting templates tailored for your business — SaaS, e-commerce, portfolios, and more.
                            </p>
                            <div className="feat-card-visual-sm">
                                <div className="feat-templates-visual">
                                    <div className="feat-tmpl-stack">
                                        <div className="feat-tmpl-card" style={{ transform: 'rotate(-8deg)', background: 'linear-gradient(135deg, #1a1030, #2d1b69)' }}><span>Portfolio</span></div>
                                        <div className="feat-tmpl-card" style={{ transform: 'rotate(-3deg)', background: 'linear-gradient(135deg, #1c1008, #3d2506)' }}><span>E-Commerce</span></div>
                                        <div className="feat-tmpl-card" style={{ transform: 'rotate(3deg)', background: 'linear-gradient(135deg, #0a1a14, #0d3320)' }}><span>SaaS</span></div>
                                    </div>
                                    <div className="feat-tmpl-badges">
                                        <span className="feat-tmpl-badge">Handcrafted by AI</span>
                                        <span className="feat-tmpl-badge">Mobile-ready</span>
                                        <span className="feat-tmpl-badge">SEO-optimized</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="feat-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={slideInRight}
                            custom={0}
                        >
                            <span className="feat-num">03</span>
                            <h3 className="feat-card-title">AI-Powered Copy & Design</h3>
                            <p className="feat-card-desc">
                                Stuck on what to write? Our AI generates compelling headlines, descriptions, and layouts in seconds — tailored to your audience.
                            </p>
                            <div className="feat-card-visual-sm">
                                <div className="feat-ai-input">
                                    <input type="text" className="feat-ai-textbox" placeholder="Enter your text here..." readOnly />
                                    <button className="feat-ai-btn">
                                        <Zap size={12} />
                                        Generate
                                    </button>
                                </div>
                                <div className="feat-ai-preview">
                                    <div className="feat-ai-preview-bar" />
                                    <div className="feat-ai-preview-text" />
                                    <div className="feat-ai-preview-text short" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Feature 04 & 05 — Two column */}
                    <div className="feat-row">
                        <motion.div
                            className="feat-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={slideInLeft}
                            custom={0}
                        >
                            <span className="feat-num">04</span>
                            <h3 className="feat-card-title">Optimized for Speed</h3>
                            <p className="feat-card-desc">
                                Every millisecond counts. Our websites load in record time, ensuring better SEO, higher conversions, and a seamless experience.
                            </p>
                            <div className="feat-card-visual-sm">
                                <div className="feat-speed-gauge">
                                    <div className="feat-gauge-bg">
                                        <div className="feat-gauge-fill" />
                                    </div>
                                    <div className="feat-gauge-labels">
                                        <span>SLOW</span>
                                        <span>AVERAGE</span>
                                        <span>FAST</span>
                                    </div>
                                    <div className="feat-gauge-badge">High Performance</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="feat-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={slideInRight}
                            custom={0}
                        >
                            <span className="feat-num">05</span>
                            <h3 className="feat-card-title">Mobile-First & Responsive</h3>
                            <p className="feat-card-desc">
                                Build websites that adapt perfectly to any screen — ensuring a smooth and engaging experience on mobile, tablet, and desktop.
                            </p>
                            <div className="feat-card-visual-sm">
                                <div className="feat-responsive-visual">
                                    <div className="feat-device feat-device-desktop">
                                        <div className="feat-device-screen">
                                            <div className="feat-device-nav" />
                                            <div className="feat-device-hero" />
                                            <div className="feat-device-grid" />
                                        </div>
                                    </div>
                                    <div className="feat-device feat-device-mobile">
                                        <div className="feat-device-screen">
                                            <div className="feat-device-nav" />
                                            <div className="feat-device-hero" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══ Features Showcase (CategoryList) ═══ */}
            <section id="features" style={{ position: 'relative', zIndex: 10, padding: '4rem 0' }}>
                <CategoryList
                    title="Explore Our"
                    subtitle="Core Features"
                    categories={landingFeatures}
                    headerIcon={<Sparkles className="w-8 h-8" />}
                    className="bg-transparent"
                />
            </section>

            {/* ═══ Templates Showcase ═══ */}
            <section className="templates-section tmpl-v2">
                <div className="templates-inner">
                    <motion.div
                        className="tmpl-v2-header"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                        variants={fadeUp}
                    >
                        <span className="tmpl-v2-badge">Templates</span>
                        <h2 className="tmpl-v2-title">
                            Start with a <span className="tmpl-v2-title-accent">Pro Template</span>
                        </h2>
                        <p className="tmpl-v2-subtitle">
                            50+ production-ready templates. Pick one, customize with AI, and ship in minutes.
                        </p>
                    </motion.div>

                    {/* Bento Row 1: Featured (large) + 2 stacked */}
                    <div className="tmpl-bento-row">
                        <motion.div
                            className="tmpl-card tmpl-card-featured"
                            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scaleUp} custom={0}
                            style={{ '--tmpl-bg': TEMPLATES[0].bg }}
                        >
                            <div className="tmpl-card-browser">
                                <div className="tmpl-browser-bar">
                                    <div className="tmpl-browser-dots"><span /><span /><span /></div>
                                    <div className="tmpl-browser-url">{TEMPLATES[0].name.toLowerCase().replace(/\s/g, '-')}.indiforge.app</div>
                                </div>
                                <div className="tmpl-browser-body">
                                    <div className="tmpl-wire-nav" style={{ borderColor: `${TEMPLATES[0].accent}22` }}>
                                        <div className="tmpl-wire-logo" style={{ background: TEMPLATES[0].accent }} />
                                        <div className="tmpl-wire-links"><span /><span /><span /></div>
                                        <div className="tmpl-wire-btn" style={{ background: TEMPLATES[0].accent }}>Get Started</div>
                                    </div>
                                    <div className="tmpl-wire-hero-area">
                                        <div className="tmpl-wire-h1" style={{ background: `${TEMPLATES[0].accent}40` }} />
                                        <div className="tmpl-wire-h2" style={{ background: `${TEMPLATES[0].accent}20` }} />
                                        <div className="tmpl-wire-p"><span /><span /><span style={{ width: '60%' }} /></div>
                                        <div className="tmpl-wire-cta-row">
                                            <div className="tmpl-wire-cta" style={{ background: TEMPLATES[0].accent }} />
                                            <div className="tmpl-wire-cta-ghost" style={{ borderColor: `${TEMPLATES[0].accent}44` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="tmpl-card-info">
                                <div className="tmpl-card-tags">
                                    {TEMPLATES[0].tags.map(t => <span key={t} className="tmpl-tag" style={{ color: TEMPLATES[0].accent, borderColor: `${TEMPLATES[0].accent}33` }}>{t}</span>)}
                                </div>
                                <span className="tmpl-card-cat" style={{ color: TEMPLATES[0].accent }}>{TEMPLATES[0].category}</span>
                                <h3 className="tmpl-card-name">{TEMPLATES[0].name}</h3>
                                <p className="tmpl-card-desc">{TEMPLATES[0].desc}</p>
                            </div>
                        </motion.div>

                        <div className="tmpl-stack">
                            {TEMPLATES.slice(1, 3).map((tmpl, i) => (
                                <motion.div
                                    key={i} className="tmpl-card tmpl-card-small"
                                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={slideInRight} custom={i}
                                    style={{ '--tmpl-bg': tmpl.bg }}
                                >
                                    <div className="tmpl-card-browser tmpl-browser-sm">
                                        <div className="tmpl-browser-bar">
                                            <div className="tmpl-browser-dots"><span /><span /><span /></div>
                                        </div>
                                        <div className="tmpl-browser-body">
                                            <div className="tmpl-wire-nav-sm">
                                                <div className="tmpl-wire-logo" style={{ background: tmpl.accent }} />
                                                <div className="tmpl-wire-links"><span /><span /></div>
                                            </div>
                                            <div className="tmpl-wire-h1 sm" style={{ background: `${tmpl.accent}40` }} />
                                            <div className="tmpl-wire-p sm"><span /><span /></div>
                                        </div>
                                    </div>
                                    <div className="tmpl-card-info">
                                        <span className="tmpl-card-cat" style={{ color: tmpl.accent }}>{tmpl.category}</span>
                                        <h3 className="tmpl-card-name">{tmpl.name}</h3>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Bento Row 2: Three equal cards */}
                    <div className="tmpl-row-3">
                        {TEMPLATES.slice(3).map((tmpl, i) => (
                            <motion.div
                                key={i} className="tmpl-card tmpl-card-equal"
                                initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={scaleUp} custom={i}
                                style={{ '--tmpl-bg': tmpl.bg }}
                            >
                                <div className="tmpl-card-browser tmpl-browser-sm">
                                    <div className="tmpl-browser-bar">
                                        <div className="tmpl-browser-dots"><span /><span /><span /></div>
                                    </div>
                                    <div className="tmpl-browser-body">
                                        <div className="tmpl-wire-nav-sm">
                                            <div className="tmpl-wire-logo" style={{ background: tmpl.accent }} />
                                            <div className="tmpl-wire-links"><span /><span /></div>
                                        </div>
                                        <div className="tmpl-wire-h1 sm" style={{ background: `${tmpl.accent}40` }} />
                                        <div className="tmpl-wire-p sm"><span /><span /></div>
                                    </div>
                                </div>
                                <div className="tmpl-card-info">
                                    <div className="tmpl-card-tags">
                                        {tmpl.tags.map(t => <span key={t} className="tmpl-tag" style={{ color: tmpl.accent, borderColor: `${tmpl.accent}33` }}>{t}</span>)}
                                    </div>
                                    <span className="tmpl-card-cat" style={{ color: tmpl.accent }}>{tmpl.category}</span>
                                    <h3 className="tmpl-card-name">{tmpl.name}</h3>
                                    <p className="tmpl-card-desc">{tmpl.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="tmpl-cta-row"
                        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
                    >
                        <Link to="/templates" className="tmpl-browse-btn">
                            Browse all templates
                            <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ═══ FAQ Section ═══ */}
            <section className="faq-section relative z-10">
                <Accordion05 />
            </section>

            {/* ═══ CTA Section ═══ */}
            <motion.section
                className="cta-section cta-v2"
                initial={{ opacity: 0, y: 50, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="cta-v2-inner">
                    <motion.p
                        className="cta-v2-label"
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >Build with IndiForge AI</motion.p>

                    <motion.h2
                        className="cta-v2-title"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >Ready to build?</motion.h2>

                    <motion.div
                        className="cta-v2-prompt"
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                    >
                        <div className="cta-v2-prompt-box">
                            <textarea
                                className="cta-v2-textarea"
                                placeholder={placeholder}
                                rows={2}
                                readOnly
                            />
                            <div className="cta-v2-prompt-footer">
                                <div className="cta-v2-prompt-left">
                                    <button className="cta-v2-icon-btn" title="Attach file">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                    </button>
                                </div>
                                <div className="cta-v2-prompt-right">
                                    <button className="cta-v2-model-btn">
                                        <span className="cta-v2-model-dot" />
                                        Gemini 3 Flash
                                    </button>
                                    <Link to="/signup" className="cta-v2-send-btn">
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ═══ Footer ═══ */}
            <motion.footer
                className="lp-footer lp-footer-v2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="lp-footer-inner">
                    <div className="footer-v2-grid">
                        <div className="footer-v2-col">
                            <span className="footer-v2-col-title">Company</span>
                            <a href="#" className="footer-v2-link">About</a>
                            <a href="#" className="footer-v2-link">Careers</a>
                            <a href="#" className="footer-v2-link">Press & media</a>
                            <a href="#" className="footer-v2-link">Blog</a>
                            <a href="#" className="footer-v2-link">Contact</a>
                        </div>
                        <div className="footer-v2-col">
                            <span className="footer-v2-col-title">Product</span>
                            <Link to="/pricing" className="footer-v2-link">Pricing</Link>
                            <a href="#features" className="footer-v2-link">Features</a>
                            <a href="#how-it-works" className="footer-v2-link">How it Works</a>
                            <a href="#" className="footer-v2-link">Templates</a>
                            <a href="#" className="footer-v2-link">Changelog</a>
                        </div>
                        <div className="footer-v2-col">
                            <span className="footer-v2-col-title">Resources</span>
                            <a href="#" className="footer-v2-link">Documentation</a>
                            <a href="#" className="footer-v2-link">Guides</a>
                            <a href="#" className="footer-v2-link">Tutorials</a>
                            <a href="#" className="footer-v2-link">Support</a>
                        </div>
                        <div className="footer-v2-col">
                            <span className="footer-v2-col-title">Legal</span>
                            <a href="#" className="footer-v2-link">Privacy Policy</a>
                            <a href="#" className="footer-v2-link">Terms of Service</a>
                            <a href="#" className="footer-v2-link">Cookie Policy</a>
                        </div>
                        <div className="footer-v2-col">
                            <span className="footer-v2-col-title">Community</span>
                            <a href="#" className="footer-v2-link">Discord</a>
                            <a href="#" className="footer-v2-link">X / Twitter</a>
                            <a href="#" className="footer-v2-link">GitHub</a>
                            <a href="#" className="footer-v2-link">YouTube</a>
                            <a href="#" className="footer-v2-link">LinkedIn</a>
                        </div>
                    </div>
                </div>
                <div className="footer-v2-bottom">
                    <div className="footer-v2-bottom-inner">
                        <div className="footer-v2-brand">
                            <Wind size={16} />
                            <span>INDIFORGE AI</span>
                        </div>
                        <span className="footer-v2-copy">© 2026 IndiForge AI. All rights reserved.</span>
                    </div>
                </div>
            </motion.footer>
        </div>
    )
}
