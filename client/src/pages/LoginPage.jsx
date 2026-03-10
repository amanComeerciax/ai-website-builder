import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { Link } from "react-router-dom";
import { Wind } from "lucide-react";

function LoginPage() {
  return (
    <div style={styles.container}>
      <Link to="/" style={styles.logo}>
        <Wind size={20} />
        <span>INDIFORGE AI</span>
      </Link>
      <SignIn
        routing="path"
        path="/login"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          baseTheme: dark,
          elements: {
            rootBox: {
              width: "100%",
              maxWidth: "420px",
            },
            card: {
              background: "rgba(14, 14, 15, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(20px)",
              borderRadius: "1.75rem",
            },
            headerTitle: {
              color: "#ffffff",
              fontWeight: "600",
            },
            headerSubtitle: {
              color: "#94a3b8",
            },
            formFieldInput: {
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "0.75rem",
              color: "#ffffff",
            },
            formButtonPrimary: {
              background: "#ffffff",
              color: "#050505",
              borderRadius: "9999px",
              fontWeight: "600",
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
          },
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    gap: "2rem",
    background:
      "radial-gradient(125% 125% at 50% 101%, rgba(245, 87, 2, 1) 10.5%, rgba(245, 120, 2, 1) 16%, rgba(245, 140, 2, 1) 17.5%, rgba(245, 170, 100, 1) 25%, rgba(238, 174, 202, 1) 40%, rgba(202, 179, 214, 1) 65%, rgba(148, 201, 233, 1) 100%)",
    padding: "2rem",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    fontWeight: "600",
    fontSize: "1.25rem",
    letterSpacing: "-0.03em",
    color: "#1a1a2e",
    textDecoration: "none",
  },
};

export default LoginPage;