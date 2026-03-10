import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react"
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'
import PricingPage from './pages/PricingPage'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

const ProtectedRoute = ({ children }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut><RedirectToSignIn /></SignedOut>
  </>
)

function App() {
  return (
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

      {/* Editor route */}
      <Route
        path="/editor/:projectId"
        element={<ProtectedRoute><EditorPage /></ProtectedRoute>}
      />

      {/* Authentication routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

  )
}

export default App
