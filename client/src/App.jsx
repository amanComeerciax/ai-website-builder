import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, ClerkLoaded, ClerkLoading, useUser } from "@clerk/clerk-react"
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import PricingPage from './pages/PricingPage'
import DashboardLayout from './layouts/DashboardLayout'
import ProjectsPage from './pages/ProjectsPage'
import AuthPage from './pages/AuthPage'

const ProtectedRoute = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><Navigate to="/login" replace /></SignedOut>
  </>
)

const PublicRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      {/* Fallback full-screen dark loading spinner before Clerk calculates session payload. 
          Stops FOUC (flash of unauthenticated content) on deep links */}
      <ClerkLoading>
        <div style={{
          height: '100vh', width: '100vw', background: '#050505',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#3b82f6', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </ClerkLoading>

      <ClerkLoaded>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<DashboardPage />} />
          </Route>

          {/* Project Grid routes */}
          <Route
            path="/projects/:type"
            element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
          >
            <Route index element={<ProjectsPage />} />
          </Route>

          {/* Editor route */}
          <Route
            path="/chat/:projectId"
            element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
          />

          {/* Authentication routes powered by unified Lovable Layout */}
          <Route path="/login/*" element={<PublicRoute><AuthPage mode="sign-in" /></PublicRoute>} />
          <Route path="/signup/*" element={<PublicRoute><AuthPage mode="sign-up" /></PublicRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ClerkLoaded>
    </>

  )
}

export default App
