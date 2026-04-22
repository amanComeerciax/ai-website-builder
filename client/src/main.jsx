import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

import App from "./App.jsx";
import "./index.css";
import "./bones/registry";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <ClerkProvider
    publishableKey={clerkPubKey}
    signInUrl="/login"
    signUpUrl="/signup"
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/dashboard"
    appearance={{
      baseTheme: dark,
      variables: {
        colorPrimary: '#ffffff',
        colorBackground: '#131316',
        colorInputBackground: 'rgba(255, 255, 255, 0.03)',
        colorInputText: '#ffffff',
        colorTextOnPrimaryBackground: '#050505',
      },
      elements: {
        modalBackdrop: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          margin: 0, // Reset any default clerk margin that might push it off center
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        card: {
          backgroundColor: '#131316',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '1rem',
        },
        headerTitle: {
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '1.5rem',
        },
        headerSubtitle: {
          color: '#a1a1aa',
        },
        socialButtonsBlockButton: {
          backgroundColor: '#1c1c1f',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#27272a',
          },
        },
        socialButtonsBlockButtonText: {
          fontWeight: '500',
        },
        formButtonPrimary: {
          fontWeight: '600',
          marginTop: '1rem',
        },
        dividerLine: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        dividerText: {
          color: '#71717a',
        },
        formFieldInput: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        footerActionText: {
          color: '#a1a1aa',
        },
        footerActionLink: {
          color: '#60a5fa',
          '&:hover': {
            color: '#93c5fd',
          },
        },
      },
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
);