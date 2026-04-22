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

import "./AuthPage.css";

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
    <div className="ap-wrapper">
      {/* ─── LEFT PANEL: Dark Auth Form ─── */}
      <div className="ap-left-panel">
        <div className="ap-left-inner">
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
          <p className="ap-sso-note">
            🔒 SSO available on{" "}
            <Link to="/pricing" className="ap-sso-link">
              Business and Enterprise
            </Link>{" "}
            plans
          </p>
        </div>

        {/* Logo at bottom-left */}
        <Link to="/" className="ap-bottom-logo">
          <Wind size={20} />
          <span>STACKFORGE</span>
        </Link>
      </div>

      {/* ─── RIGHT PANEL: Video background with floating prompt ─── */}
      <div className="ap-right-panel">
        <SeamlessVideoLayer
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4"
          style={{ opacity: 0.8 }} // Matching landing/dashboard dimming
        />
        <div className="ap-prompt-container">
          <div className="ap-prompt-bar">
            <span className="ap-prompt-text">{placeholder}</span>
            <span className="ap-prompt-cursor">|</span>
            <button className="ap-prompt-button">
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
