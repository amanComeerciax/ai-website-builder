import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function SuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [status, setStatus] = useState('verifying'); // 'verifying' | 'verified' | 'failed'
    const [planName, setPlanName] = useState('');

    useEffect(() => {
        if (!sessionId) {
            setStatus('failed');
            return;
        }

        const verifyPayment = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/payment/verify-session/${sessionId}`
                );
                const data = await response.json();

                if (data.paid) {
                    setStatus('verified');
                    setPlanName(data.planName);
                } else {
                    setStatus('failed');
                }
            } catch (err) {
                console.error('Verification error:', err);
                setStatus('failed');
            }
        };

        verifyPayment();
    }, [sessionId]);

    // Auto-redirect to dashboard after 5 seconds on success
    useEffect(() => {
        if (status === 'verified') {
            const timer = setTimeout(() => navigate('/dashboard'), 5000);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    return (
        <div style={{
            minHeight: "100vh",
            background: "#000",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            padding: "24px"
        }}>
            <div style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(16px)",
                padding: "48px",
                borderRadius: "32px",
                border: "1px solid rgba(255,255,255,0.1)",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 0 80px rgba(34,211,238,0.2)"
            }}>
                {status === 'verifying' && (
                    <>
                        <Loader2 size={64} color="#22d3ee" style={{ marginBottom: "24px", animation: "spin 1s linear infinite" }} />
                        <h1 style={{ fontSize: "2rem", fontWeight: 200, marginBottom: "16px" }}>Verifying Payment...</h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem" }}>
                            Please wait while we confirm your payment with Stripe.
                        </p>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </>
                )}

                {status === 'verified' && (
                    <>
                        <CheckCircle size={64} color="#22d3ee" style={{ marginBottom: "24px" }} />
                        <h1 style={{ fontSize: "2.5rem", fontWeight: 200, marginBottom: "16px" }}>Payment Successful!</h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "8px" }}>
                            You've been upgraded to the <strong style={{ color: "#22d3ee" }}>{planName}</strong> plan.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", marginBottom: "32px" }}>
                            Redirecting to dashboard in 5 seconds...
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                padding: "12px 32px",
                                background: "#22d3ee",
                                color: "#000",
                                borderRadius: "12px",
                                border: "none",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                margin: "0 auto"
                            }}
                        >
                            <Sparkles size={18} />
                            Go to Dashboard
                        </button>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: "24px" }} />
                        <h1 style={{ fontSize: "2rem", fontWeight: 200, marginBottom: "16px" }}>Verification Failed</h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "32px" }}>
                            We couldn't verify your payment. If you were charged, please contact support.
                        </p>
                        <button
                            onClick={() => navigate('/pricing')}
                            style={{
                                padding: "12px 32px",
                                background: "rgba(255,255,255,0.1)",
                                color: "#fff",
                                borderRadius: "12px",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontWeight: 600,
                                cursor: "pointer",
                                margin: "0 auto"
                            }}
                        >
                            Back to Pricing
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
