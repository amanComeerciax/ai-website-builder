import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Wind, ArrowRight, Zap } from 'lucide-react'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import './PricingPage.css'

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: '/month',
        description: 'Perfect to explore IndiForge AI',
        cta: 'Get Started',
        highlighted: false,
        features: [
            { text: '1 Project', included: true },
            { text: '3 Generations / month', included: true },
            { text: 'Gemini Flash model', included: true },
            { text: 'Live preview', included: true },
            { text: 'Custom domain', included: false },
            { text: 'Code export', included: false },
            { text: 'Backend generation', included: false },
            { text: 'Priority support', included: false },
        ],
    },
    {
        name: 'Pro',
        price: '$19',
        period: '/month',
        description: 'For developers and freelancers',
        cta: 'Upgrade to Pro',
        highlighted: true,
        features: [
            { text: '10 Projects', included: true },
            { text: '50 Generations / month', included: true },
            { text: 'Gemini Pro model', included: true },
            { text: 'Live preview', included: true },
            { text: 'Custom domain', included: true },
            { text: 'Code export', included: true },
            { text: 'Backend generation', included: true },
            { text: 'Email support', included: true },
        ],
    },
    {
        name: 'Business',
        price: '$49',
        period: '/month',
        description: 'For teams and agencies',
        cta: 'Start Business',
        highlighted: false,
        features: [
            { text: 'Unlimited Projects', included: true },
            { text: 'Unlimited Generations', included: true },
            { text: 'Gemini Ultra model', included: true },
            { text: 'Live preview', included: true },
            { text: 'Custom domain', included: true },
            { text: 'Code export', included: true },
            { text: 'Backend + DB generation', included: true },
            { text: 'Priority support + 5 seats', included: true },
        ],
    },
]

const faqs = [
    { q: 'Can I switch plans anytime?', a: 'Yes! Upgrade or downgrade at any time. Changes take effect on your next billing cycle.' },
    { q: 'Is there a free trial for Pro?', a: 'The Free plan lets you explore all core features. You can upgrade to Pro when you need more power.' },
    { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, Google Pay, and Apple Pay through Stripe.' },
    { q: 'Can I cancel my subscription?', a: 'Absolutely. Cancel anytime from your dashboard — no questions asked.' },
]

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState('monthly')
    const [navScrolled, setNavScrolled] = useState(false)
    const [openFaq, setOpenFaq] = useState(null)

    useEffect(() => {
        const handleScroll = () => setNavScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const getPrice = (plan) => {
        if (plan.price === '$0') return '$0'
        const monthly = parseInt(plan.price.replace('$', ''))
        if (billingCycle === 'yearly') {
            return `$${Math.round(monthly * 0.8)}`
        }
        return plan.price
    }

    return (
        <div className="pricing-page">
            {/* ═══ Navbar (same as landing) ═══ */}
            <nav className={`lp-nav ${navScrolled ? 'lp-nav-scrolled' : ''}`}>
                <div className="lp-nav-inner">
                    <Link to="/" className="lp-nav-logo">
                        <Wind size={22} />
                        <span>INDIFORGE AI</span>
                    </Link>

                    <div className="lp-nav-center">
                        <Link to="/" className="lp-nav-link">Home</Link>
                        <Link to="/pricing" className="lp-nav-link lp-nav-link-active">Pricing</Link>
                        <a href="/#features" className="lp-nav-link">Features</a>
                        <a href="/#how-it-works" className="lp-nav-link">How it Works</a>
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

            {/* ═══ Hero Header ═══ */}
            <section className="pricing-hero">
                <div className="pricing-hero-content">
                    <div className="pricing-badge">
                        <Zap size={12} />
                        <span>Simple Pricing</span>
                    </div>
                    <h1 className="pricing-hero-title">
                        Plans that scale<br />
                        <span className="pricing-hero-accent">with you</span>
                    </h1>
                    <p className="pricing-hero-subtitle">
                        Start for free. Upgrade when you need more power. No hidden fees.
                    </p>

                    {/* Billing Toggle */}
                    <div className="billing-toggle">
                        <button
                            className={`billing-btn ${billingCycle === 'monthly' ? 'billing-btn-active' : ''}`}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`billing-btn ${billingCycle === 'yearly' ? 'billing-btn-active' : ''}`}
                            onClick={() => setBillingCycle('yearly')}
                        >
                            Yearly
                            <span className="billing-save">Save 20%</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══ Pricing Cards ═══ */}
            <section className="pricing-cards-section">
                <div className="pricing-grid">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`pricing-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
                        >
                            {plan.highlighted && (
                                <div className="pricing-popular-badge">Most Popular</div>
                            )}
                            <div className="pricing-card-header">
                                <h3 className="pricing-plan-name">{plan.name}</h3>
                                <div className="pricing-price">
                                    <span className="pricing-amount">{getPrice(plan)}</span>
                                    <span className="pricing-period">
                                        {plan.price !== '$0' ? (billingCycle === 'yearly' ? '/year' : '/month') : '/month'}
                                    </span>
                                </div>
                                <p className="pricing-description">{plan.description}</p>
                            </div>
                            <ul className="pricing-features">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className={`pricing-feature ${!feature.included ? 'pricing-feature-disabled' : ''}`}>
                                        {feature.included ? (
                                            <Check size={16} className="feature-check" />
                                        ) : (
                                            <X size={16} className="feature-x" />
                                        )}
                                        {feature.text}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to="/signup"
                                className={`pricing-cta-btn ${plan.highlighted ? 'pricing-cta-primary' : 'pricing-cta-secondary'}`}
                            >
                                {plan.cta}
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ FAQ Section ═══ */}
            <section className="pricing-faq-section">
                <h2 className="pricing-faq-title">Frequently Asked Questions</h2>
                <div className="pricing-faq-list">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`pricing-faq-item ${openFaq === i ? 'pricing-faq-open' : ''}`}
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        >
                            <div className="pricing-faq-question">
                                <span>{faq.q}</span>
                                <span className="pricing-faq-chevron">{openFaq === i ? '−' : '+'}</span>
                            </div>
                            {openFaq === i && (
                                <p className="pricing-faq-answer">{faq.a}</p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Bottom CTA ═══ */}
            <section className="pricing-bottom-cta">
                <h2 className="pricing-bottom-title">Ready to build something incredible?</h2>
                <p className="pricing-bottom-subtitle">Join thousands of builders creating with AI.</p>
                <SignedOut>
                    <Link to="/signup" className="pricing-bottom-btn">
                        Start building for free
                        <ArrowRight size={16} />
                    </Link>
                </SignedOut>
                <SignedIn>
                    <Link to="/dashboard" className="pricing-bottom-btn">
                        Go to Dashboard
                        <ArrowRight size={16} />
                    </Link>
                </SignedIn>
            </section>

            {/* ═══ Footer ═══ */}
            <footer className="pricing-footer">
                <span>© 2026 INDIFORGE AI. All rights reserved.</span>
            </footer>
        </div>
    )
}
