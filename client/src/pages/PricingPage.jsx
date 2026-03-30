import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const plans = [
    {
        name: "Free",
        desc: "Perfect for personal projects and hobbyists.",
        price: "0",
        features: ["1 Project", "Basic Generation", "Community Support"],
        btn: "Get Started",
        popular: false,
        primary: false,
    },
    {
        name: "Pro",
        desc: "Best for power users and small teams.",
        price: "29",
        features: ["10 Projects", "GPT-4 Access", "Premium Support", "Priority Queue"],
        btn: "Choose Pro Plan",
        popular: true,
        primary: true,
    },
    {
        name: "Agency",
        desc: "Infinite scaling for agencies and shops.",
        price: "99",
        features: ["Unlimited Projects", "Custom Branding", "Dedicated Account Manager", "API Access"],
        btn: "Scale Now",
        popular: false,
        primary: true,
    },
];

const ShaderCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const gl = canvas.getContext("webgl");
        if (!gl) return;

        const vert = `attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
        const frag = `
      precision highp float;
      uniform float t;
      uniform vec2 res;
      mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
      float vary(vec2 v1,vec2 v2,float str,float spd){return sin(dot(normalize(v1),normalize(v2))*str+t*spd)/100.0;}
      vec3 circle(vec2 uv,vec2 c,float r,float w){
        vec2 d=c-uv;float l=length(d);
        l+=vary(d,vec2(0,1),5.,2.);
        l-=vary(d,vec2(1,0),5.,2.);
        float s=smoothstep(r-w,r,l)-smoothstep(r,r+w,l);
        return vec3(s);
      }
      void main(){
        vec2 uv=gl_FragCoord.xy/res;
        uv.x*=1.5;uv.x-=0.25;
        float mask=0.;
        vec2 ctr=vec2(.5);
        float r=.35;
        mask+=circle(uv,ctr,r,.035).r;
        mask+=circle(uv,ctr,r-.018,.01).r;
        mask+=circle(uv,ctr,r+.018,.005).r;
        vec2 v=rot(t)*uv;
        vec3 fg=vec3(v.x,v.y,.7-v.y*v.x);
        vec3 col=mix(vec3(0),fg,mask);
        col=mix(col,vec3(1),circle(uv,ctr,r,.003).r);
        gl_FragColor=vec4(col,1.);
      }`;

        const mkShader = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        };
        const prog = gl.createProgram();
        gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vert));
        gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const a = gl.getAttribLocation(prog, "a");
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

        const tLoc = gl.getUniformLocation(prog, "t");
        const rLoc = gl.getUniformLocation(prog, "res");

        let raf;
        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();
        window.addEventListener("resize", resize);

        const render = (time) => {
            gl.uniform1f(tLoc, time * 0.001);
            gl.uniform2f(rLoc, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);
        return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
    }, []);

    return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />;
};

export default function PricingPage() {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const [loadingPlan, setLoadingPlan] = useState(null);

    const handlePlanClick = async (plan) => {
        if (!isSignedIn) {
            navigate("/signup");
            return;
        }

        if (plan.name === 'Free') {
            navigate('/dashboard');
            return;
        }

        setLoadingPlan(plan.name);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planName: plan.name,
                    userId: user.id,
                    userEmail: user.primaryEmailAddress?.emailAddress
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Failed to create checkout session.");
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert("Payment system is currently unavailable.");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
            {/* Entrance animation keyframes */}
            <style>{`
                @keyframes priceFadeUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes priceScaleIn {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes priceScaleInPopular {
                    from { opacity: 0; transform: translateY(40px) scale(1.0); }
                    to { opacity: 1; transform: translateY(0) scale(1.05); }
                }
            `}</style>
            <ShaderCanvas />
            <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
                {/* Header */}
                <div style={{
                    textAlign: "center", marginBottom: "56px", maxWidth: "900px",
                    opacity: 0, animation: "priceFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards"
                }}>
                    <h1 style={{ fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 200, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
                        Find the{" "}
                        <span style={{ background: "linear-gradient(90deg, #22d3ee, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Perfect Plan for Your Business
                        </span>
                    </h1>
                    <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.65)", margin: 0 }}>
                        Start for free, then grow with us. Flexible plans for projects of all sizes.
                    </p>
                </div>

                {/* Cards */}
                <div style={{ display: "flex", gap: "24px", alignItems: "center", justifyContent: "center", flexWrap: "wrap", width: "100%", maxWidth: "1100px" }}>
                    {plans.map((plan, i) => (
                        <div key={plan.name} style={{
                            position: "relative",
                            flex: "1 1 280px",
                            maxWidth: "340px",
                            background: plan.popular ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            border: plan.popular ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "20px",
                            padding: "32px 28px",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: plan.popular ? "0 0 60px rgba(139,92,246,0.3), 0 25px 50px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.4)",
                            opacity: 0,
                            animation: `${plan.popular ? 'priceScaleInPopular' : 'priceScaleIn'} 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.15}s forwards`,
                        }}>
                            {plan.popular && (
                                <div style={{
                                    position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                                    background: "#22d3ee", color: "#000", fontSize: "12px", fontWeight: 700,
                                    padding: "4px 16px", borderRadius: "9999px", whiteSpace: "nowrap"
                                }}>Most Popular</div>
                            )}
                            <h2 style={{ fontSize: "2.5rem", fontWeight: 200, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{plan.name}</h2>
                            <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", margin: "0 0 24px", lineHeight: 1.5 }}>{plan.desc}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "24px" }}>
                                <span style={{ fontSize: "3rem", fontWeight: 200, letterSpacing: "-0.02em" }}>${plan.price}</span>
                                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>/mo</span>
                            </div>
                            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent)", marginBottom: "20px" }} />
                            <ul style={{ listStyle: "none", margin: "0 0 32px", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                                {plan.features.map((f) => (
                                    <li key={f} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "rgba(255,255,255,0.85)" }}>
                                        <CheckIcon /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button style={{
                                marginTop: "auto", width: "100%", padding: "12px",
                                borderRadius: "12px", border: plan.primary ? "none" : "1px solid rgba(255,255,255,0.2)",
                                background: plan.primary ? "#22d3ee" : "rgba(255,255,255,0.08)",
                                color: plan.primary ? "#000" : "#fff",
                                fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                                onMouseEnter={e => e.target.style.opacity = "0.85"}
                                onMouseLeave={e => e.target.style.opacity = "1"}
                                onClick={() => handlePlanClick(plan)}
                                disabled={loadingPlan === plan.name}
                            >
                                {loadingPlan === plan.name ? "Processing..." : plan.btn}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
