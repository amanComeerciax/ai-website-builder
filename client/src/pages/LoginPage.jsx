import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

function LoginPage() {
  return (
    <div style={styles.container}>
      <SignIn
        routing="path"
        path="/login"
        afterSignInUrl="/dashboard"
        appearance={{
          baseTheme: dark,
          elements: {
            card: {
              background: "var(--color-surface-900)",
              border: "1px solid rgba(99, 102, 241, 0.1)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(12px)",
            },
            headerTitle: {
              color: "#e2e8f0",
            },
            headerSubtitle: {
              color: "#94a3b8",
            },
            footerActionText: {
              color: "#94a3b8",
            },
            footerActionLink: {
              color: "var(--color-primary-400)",
              "&:hover": {
                color: "var(--color-primary-300)",
              }
            }
          }
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "var(--color-surface-950)",
  },
};

export default LoginPage;