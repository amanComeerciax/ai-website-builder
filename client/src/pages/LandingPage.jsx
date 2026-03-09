import { Link } from 'react-router-dom'
import {
    Sparkles,
    ArrowRight,
    Code2,
    Eye,
    Rocket,
    Zap,
    Layers,
    MessageSquare
} from 'lucide-react'
import './LandingPage.css'

export default function LandingPage() {
    return (
        <div className="landing">
            {/* Navigation */}
            <nav className="landing-nav glass">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-logo">
                        <Sparkles size={24} className="logo-icon" />
                        <span className="logo-text">StackForge <span className="gradient-text">AI</span></span>
                    </Link>
                    <div className="landing-nav-links">
                        <Link to="/pricing" className="nav-link">Pricing</Link>
                        <Link to="/dashboard" className="btn btn-primary btn-sm">
                            Get Started <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-glow" />
                <div className="hero-content animate-fade-in">
                    <div className="hero-badge badge badge-primary">
                        <Zap size={14} />
                        AI-Powered Website Generation
                    </div>
                    <h1 className="hero-title">
                        Build Full-Stack Websites
                        <br />
                        <span className="gradient-text">With Just a Prompt</span>
                    </h1>
                    <p className="hero-description">
                        Describe your website in plain English. StackForge AI generates
                        production-ready React + Express code, gives you a live preview,
                        and deploys it — all in under 2 minutes.
                    </p>
                    <div className="hero-actions">
                        <Link to="/dashboard" className="btn btn-primary btn-lg">
                            <Sparkles size={18} />
                            Start Building — It's Free
                        </Link>
                        <a href="#features" className="btn btn-secondary btn-lg">
                            See How It Works
                        </a>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-number">10K+</span>
                            <span className="hero-stat-label">Sites Generated</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <span className="hero-stat-number">&lt;2min</span>
                            <span className="hero-stat-label">Avg Generation</span>
                        </div>
                        <div className="hero-stat-divider" />
                        <div className="hero-stat">
                            <span className="hero-stat-number">99.9%</span>
                            <span className="hero-stat-label">Uptime</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="features-header">
                    <h2 className="section-title">
                        Everything you need to go <span className="gradient-text">from idea to live site</span>
                    </h2>
                    <p className="section-subtitle">
                        No more boilerplate. No more configuration. Just describe what you want.
                    </p>
                </div>
                <div className="features-grid">
                    <FeatureCard
                        icon={<MessageSquare />}
                        title="Natural Language Input"
                        description="Just describe your website. Our AI understands context, design preferences, and functionality requirements."
                    />
                    <FeatureCard
                        icon={<Code2 />}
                        title="Full-Stack Generation"
                        description="Get React frontend, Express backend, MongoDB schemas, and all the glue code — production-ready."
                    />
                    <FeatureCard
                        icon={<Eye />}
                        title="Live Preview"
                        description="See your website come to life in real-time. Edit code in our built-in VS Code editor and watch changes instantly."
                    />
                    <FeatureCard
                        icon={<Layers />}
                        title="Monaco Code Editor"
                        description="Full VS Code editing experience in your browser. Syntax highlighting, autocomplete, and file tree navigation."
                    />
                    <FeatureCard
                        icon={<Rocket />}
                        title="One-Click Deploy"
                        description="Deploy your generated site to a live URL with a single click. Share it with the world in seconds."
                    />
                    <FeatureCard
                        icon={<Zap />}
                        title="AI Iteration"
                        description="Not quite right? Chat with the AI to refine your site. Change colors, add features, restructure — all in natural language."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <Sparkles size={20} className="logo-icon" />
                        <span className="logo-text">StackForge AI</span>
                    </div>
                    <p className="footer-text">© 2026 StackForge AI. Build the future with AI.</p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }) {
    return (
        <div className="feature-card glass-card">
            <div className="feature-icon">{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
        </div>
    )
}
