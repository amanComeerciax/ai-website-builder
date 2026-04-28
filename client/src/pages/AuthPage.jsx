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
  variables: {
    colorPrimary: "#ffffff",
    colorBackground: "#0a0a0a",
    colorText: "#ffffff",
    colorTextSecondary: "#71717a",
    colorInputBackground: "rgba(255, 255, 255, 0.03)",
    colorInputText: "#ffffff",
    borderRadius: "0.75rem",
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
  },
  elements: {
    rootBox: {
      width: "100%",
      maxWidth: "380px",
      boxSizing: "border-box",
    },
    card: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: "0",
      overflow: "visible",
    },
    cardBox: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      overflow: "visible",
    },
    main: {
      gap: "1rem",
    },
    headerTitle: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: "1.75rem",
      marginBottom: "0.25rem",
    },
    headerSubtitle: {
      color: "#71717a",
      marginBottom: "0.5rem",
    },
    socialButtonsBlockButton: {
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "0.75rem",
      color: "#ffffff",
      fontWeight: "500",
      padding: "0.75rem 1rem",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.08)",
      },
    },
    socialButtonsProviderIcon__apple: {
      filter: "invert(1)",
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
      padding: "0.75rem 1rem",
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
      marginTop: "0.5rem",
      "&:hover": {
        background: "rgba(255, 255, 255, 0.9)",
      },
    },
    footer: {
      background: "transparent !important",
      borderTop: "none",
      padding: "0.5rem 0 0",
      "& *": {
        background: "transparent !important",
      },
    },
    footerAction: {
      background: "transparent !important",
      padding: "0",
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
    footerPages: {
      background: "transparent !important",
    },
    badge: {
      background: "rgba(255, 255, 255, 0.08)",
      color: "#a1a1aa",
      fontSize: "0.65rem",
      position: "relative",
    },
    identityPreview: {
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "0.75rem",
    },
    internal: {
      background: "transparent !important",
    },
    // Dev mode banner
    impersonationFab: {
      background: "transparent",
    },
  },
  layout: {
    socialButtonsPlacement: "top",
    showOptionalFields: false,
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
            {(() => {
              const params = new URLSearchParams(window.location.search);
              const redirectTo = params.get('redirect');
              const redirectProps = redirectTo 
                ? { forceRedirectUrl: redirectTo } 
                : { fallbackRedirectUrl: "/dashboard" };
              return mode === "sign-up" ? (
                <SignUp
                  routing="path"
                  path="/signup"
                  signInUrl="/login"
                  {...redirectProps}
                  appearance={clerkAppearance}
                />
              ) : (
                <SignIn
                  routing="path"
                  path="/login"
                  signUpUrl="/signup"
                  {...redirectProps}
                  appearance={clerkAppearance}
                />
              );
            })()}
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
