import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export default function SuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // 'success' | 'error'

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }

        const verifySession = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/verify-session/${sessionId}`);
                const data = await res.json();
                
                if (data.paid) {
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Verification failed:', error);
                setStatus('error');
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, [sessionId, navigate]);

    return (
        <div style={{
            minHeight: "100vh",
            background: "#09090b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "Inter, sans-serif"
        }}>
            <div style={{
                maxWidth: "480px",
                width: "100%",
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "24px",
                padding: "48px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
            }}>
                {loading ? (
                    <>
                        <Loader2 size={48} color="#3b82f6" className="animate-spin" style={{ margin: "0 auto" }} />
                        <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 700 }}>Verifying Payment...</h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: 1.6 }}>
                            Please wait while we confirm your subscription details.
                        </p>
                    </>
                ) : status === 'success' ? (
                    <>
                        <CheckCircle size={64} color="#22c55e" style={{ margin: "0 auto" }} />
                        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 700 }}>Welcome to Pro!</h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "17px", lineHeight: 1.6 }}>
                            Your payment was successful. Your account has been upgraded and you now have full access to all premium features.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                padding: "16px 32px",
                                background: "#3b82f6",
                                color: "#fff",
                                borderRadius: "12px",
                                border: "none",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                fontSize: "16px",
                                margin: "12px auto 0"
                            }}
                        >
                            Go to Dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <XCircle size={64} color="#ef4444" style={{ margin: "0 auto" }} />
                        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 700 }}>Verification Failed</h1>
                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "17px", lineHeight: 1.6 }}>
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
