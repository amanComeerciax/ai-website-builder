import { SignUp, SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { Link } from "react-router-dom";
import { Wind, ArrowUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import SeamlessVideoLayer from "../components/SeamlessVideoLayer";

const TYPING_SUGGESTIONS = [
  "Ask StackForge to build your blog.",
  "Create a portfolio with dark mode.",
  "Build a SaaS landing page.",
  "Design a restaurant website.",
];

// Reusable Clerk Appearance Object to guarantee visual consistency between both modes
const clerkAppearance = {
  baseTheme: dark,
  elements: {
    rootBox: {
      width: "100%",
      maxWidth: "380px",
    },
    card: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: "0",
    },
    headerTitle: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: "1.75rem",
    },
    headerSubtitle: {
      color: "#71717a",
    },
    socialButtonsBlockButton: {
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "0.75rem",
      color: "#ffffff",
      fontWeight: "500",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.08)",
      },
    },
    dividerLine: {
      background: "rgba(255, 255, 255, 0.08)",
    },
    dividerText: {
      color: "#71717a",
    },
    formFieldLabel: {
      color: "#a1a1aa",
      fontWeight: "500",
    },
    formFieldInput: {
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "0.75rem",
      color: "#ffffff",
      "&:focus": {
        borderColor: "rgba(255, 255, 255, 0.2)",
        boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.05)",
      },
    },
    formButtonPrimary: {
      background: "#ffffff",
      color: "#050505",
      borderRadius: "0.75rem",
      fontWeight: "600",
      fontSize: "0.875rem",
      padding: "0.75rem 0",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.9)",
      },
    },
    footerActionText: {
      color: "#71717a",
    },
    footerActionLink: {
      color: "#60a5fa",
      "&:hover": {
        color: "#93c5fd",
      },
    },
    footer: {
      "& + div": {
        color: "#52525b",
      },
    },
  },
};

// AuthVideoBackground component removed in favor of SeamlessVideoLayer

export default function AuthPage({ mode = "sign-up" }) {
  const [placeholder, setPlaceholder] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect
  useEffect(() => {
    const current = TYPING_SUGGESTIONS[suggestionIndex];
    let timeout;
    if (!isDeleting) {
      if (charIndex < current.length) {
        timeout = setTimeout(() => {
          setPlaceholder(current.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        }, 50);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2200);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setPlaceholder(current.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        }, 25);
      } else {
        setIsDeleting(false);
        setSuggestionIndex((i) => (i + 1) % TYPING_SUGGESTIONS.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, suggestionIndex]);

  return (
    <div style={styles.wrapper}>
      {/* ─── LEFT PANEL: Dark Auth Form ─── */}
      <div style={styles.leftPanel}>
        <div style={styles.leftInner}>
          {/* Clerk Auth Form */}
          <div style={{ minHeight: "600px" }}>
            {mode === "sign-up" ? (
              <SignUp
                routing="path"
                path="/signup"
                signInUrl="/login"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            ) : (
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                fallbackRedirectUrl="/dashboard"
                appearance={clerkAppearance}
              />
            )}
          </div>

          {/* SSO Note */}
          <p style={styles.ssoNote}>
            🔒 SSO available on{" "}
            <Link to="/pricing" style={styles.ssoLink}>
              Business and Enterprise
            </Link>{" "}
            plans
          </p>
        </div>

        {/* Logo at bottom-left */}
        <Link to="/" style={styles.bottomLogo}>
          <Wind size={20} />
          <span>STACKFORGE</span>
        </Link>
      </div>

      {/* ─── RIGHT PANEL: Video background with floating prompt ─── */}
      <div style={styles.rightPanel}>
        <SeamlessVideoLayer 
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4" 
          style={{ opacity: 0.8 }} // Matching landing/dashboard dimming
        />
        <div style={styles.promptContainer}>
          <div style={styles.promptBar}>
            <span style={styles.promptText}>{placeholder}</span>
            <span style={styles.promptCursor}>|</span>
            <button style={styles.promptButton}>
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
  },
  leftPanel: {
    flex: "0 0 50%",
    maxWidth: "50%",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    position: "relative",
  },
  leftInner: {
    width: "100%",
    maxWidth: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  bottomLogo: {
    position: "absolute",
    bottom: "2rem",
    left: "2.5rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontWeight: "700",
    fontSize: "0.9375rem",
    letterSpacing: "-0.03em",
    color: "rgba(255, 255, 255, 0.4)",
    textDecoration: "none",
    transition: "color 0.3s",
  },
  ssoNote: {
    marginTop: "0.5rem",
    fontSize: "0.8125rem",
    color: "#52525b",
    textAlign: "center",
  },
  ssoLink: {
    color: "#60a5fa",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
  rightPanel: {
    flex: "0 0 50%",
    maxWidth: "50%",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  promptContainer: {
    position: "relative",
    zIndex: 2,
    width: "80%",
    maxWidth: "400px",
  },
  promptBar: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "1rem",
    padding: "0.875rem 1rem",
    boxShadow:
      "0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.08)",
    gap: "0.5rem",
  },
  promptText: {
    flex: 1,
    fontSize: "0.9375rem",
    color: "#18181b",
    fontWeight: "400",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  promptCursor: {
    color: "#18181b",
    fontWeight: "300",
    animation: "blink 1s step-end infinite",
  },
  promptButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#18181b",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
  },
};
