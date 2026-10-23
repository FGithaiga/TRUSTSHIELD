import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LogoMark } from '@/components/brand/Logo'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Dashboard from '@/pages/app/Dashboard'
import MpesaChecker from '@/pages/app/MpesaChecker'
import LinkChecker from '@/pages/app/LinkChecker'
import OfferChecker from '@/pages/app/OfferChecker'
import BeforeYouPay from '@/pages/app/BeforeYouPay'
import Incidents from '@/pages/app/Incidents'
import History from '@/pages/app/History'
import ScanDetail from '@/pages/app/ScanDetail'
import ThreatFeed from '@/pages/app/ThreatFeed'
import Settings from '@/pages/app/Settings'
import Trainer from '@/pages/app/Trainer'
import NotFound from '@/pages/NotFound'

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <LogoMark className="size-14 animate-shimmer" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function GuestOnly({ children }) {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'authenticated') return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      {/* Reset links must work whether or not the person is signed in. */}
      <Route element={<AuthLayout />}>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="mpesa" element={<MpesaChecker />} />
        <Route path="links" element={<LinkChecker />} />
        <Route path="offers" element={<OfferChecker />} />
        <Route path="before-you-pay" element={<BeforeYouPay />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="trainer" element={<Trainer />} />
        <Route path="history" element={<History />} />
        <Route path="history/:id" element={<ScanDetail />} />
        <Route path="threat-feed" element={<ThreatFeed />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
