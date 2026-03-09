import { Link } from 'react-router-dom'
import { Check, X, Sparkles, ArrowRight } from 'lucide-react'
import './PricingPage.css'

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: '/month',
        description: 'Perfect to try out StackForge AI',
        cta: 'Get Started',
        highlighted: false,
        features: [
            { text: '1 Project', included: true },
            { text: '3 Generations/month', included: true },
            { text: 'Claude Haiku model', included: true },
            { text: 'Live preview', included: true },
            { text: 'Custom domain', included: false },
            { text: 'Code download', included: false },
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
            { text: '50 Generations/month', included: true },
            { text: 'Claude Sonnet model', included: true },
            { text: 'Live preview', included: true },
            { text: 'Custom domain', included: true },
            { text: 'Code download', included: true },
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
            { text: 'Claude Sonnet model', included: true },
            { text: 'Live preview', included: true },
            { text: 'Custom domain', included: true },
            { text: 'Code download', included: true },
            { text: 'Backend + DB generation', included: true },
            { text: 'Priority support + 5 team members', included: true },
        ],
    },
]

export default function PricingPage() {
    return (
        <div className="pricing-page">
            {/* Nav */}
            <nav className="landing-nav glass">
                <div className="landing-nav-inner">
                    <Link to="/" className="landing-logo">
                        <Sparkles size={24} className="logo-icon" />
                        <span className="logo-text">StackForge <span className="gradient-text">AI</span></span>
                    </Link>
                    <div className="landing-nav-links">
                        <Link to="/dashboard" className="btn btn-primary btn-sm">
                            Dashboard <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Pricing Content */}
            <section className="pricing-section">
                <div className="pricing-header animate-fade-in">
                    <h1 className="section-title">
                        Simple, transparent <span className="gradient-text">pricing</span>
                    </h1>
                    <p className="section-subtitle">
                        Start for free. Upgrade when you need more power.
                    </p>
                </div>

                <div className="pricing-grid">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`pricing-card glass-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
                        >
                            {plan.highlighted && (
                                <div className="pricing-popular-badge badge badge-primary">Most Popular</div>
                            )}
                            <div className="pricing-card-header">
                                <h3 className="pricing-plan-name">{plan.name}</h3>
                                <div className="pricing-price">
                                    <span className="pricing-amount">{plan.price}</span>
                                    <span className="pricing-period">{plan.period}</span>
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
                            <button className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} btn-lg pricing-cta`}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
