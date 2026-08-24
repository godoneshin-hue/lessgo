import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import AuthLayout from './components/AuthLayout'
import PageTurnOverlay from './components/PageTurnOverlay'
import { useStore } from './state/store'
import Landing from './pages/Landing'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Verify from './pages/Verify'
import Challenges from './pages/Challenges'
import ChallengeNew from './pages/ChallengeNew'
import ChallengeDetail from './pages/ChallengeDetail'
import Stats from './pages/Stats'
import Me from './pages/Me'
import Feedback from './pages/Feedback'
import Premium from './pages/Premium'
import { PremiumFail, PremiumSuccess } from './pages/PremiumResult'
import Admin from './pages/Admin'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useStore()
  if (!isAuthenticated) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useStore()
  if (isAuthenticated) return <Navigate to="/home" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated } = useStore()

  return (
    <>
      <PageTurnOverlay />
      <Routes>
        <Route index element={<Navigate to={isAuthenticated ? '/home' : '/landing'} replace />} />
        <Route path="/landing" element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />} />

        <Route element={<AuthLayout />}>
          <Route
            path="/welcome"
            element={
              <RequireGuest>
                <Welcome />
              </RequireGuest>
            }
          />
          <Route
            path="/login"
            element={
              <RequireGuest>
                <Login />
              </RequireGuest>
            }
          />
          <Route
            path="/signup"
            element={
              <RequireGuest>
                <Signup />
              </RequireGuest>
            }
          />
        </Route>

        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/new" element={<ChallengeNew />} />
          <Route path="/challenges/:id" element={<ChallengeDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/me" element={<Me />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/premium/success" element={<PremiumSuccess />} />
          <Route path="/premium/fail" element={<PremiumFail />} />
        </Route>

        <Route path="/admin" element={<Admin />} />

        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/welcome'} replace />} />
      </Routes>
    </>
  )
}
