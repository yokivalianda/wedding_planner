import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase, getOrCreateWedding } from './lib/supabase'
import { useAppStore } from './store'
import { Heart } from 'lucide-react'

import LandingPage    from './pages/LandingPage'
import AuthPage       from './pages/AuthPage'
import DashboardPage  from './pages/DashboardPage'
import BudgetPage     from './pages/BudgetPage'
import GuestsPage     from './pages/GuestsPage'
import ChecklistPage  from './pages/ChecklistPage'
import SettingsPage   from './pages/SettingsPage'
import SeserahanPage  from './pages/SeserahanPage'
import AppLayout      from './components/layout/AppLayout'

function ProtectedRoute({ children, initializing }) {
  const user = useAppStore(s => s.user)
  if (initializing) return <AuthLoader />
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function AuthLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      gap: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
        <Heart size={18} color="var(--gold)" fill="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
          Wedding Planner
        </span>
      </div>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--gold)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

export default function App() {
  const { setSession, setWedding, clearAll } = useAppStore()
  // initializing = true until we know whether the user has a session or not
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let mounted = true

    // ── Fast path: read session from localStorage (no network round-trip) ──
    // setInitializing(false) happens here so the loader is never blocked
    // by a slow network call to getOrCreateWedding.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setInitializing(false)               // ← done, we know logged-in status
      if (session?.user) {
        getOrCreateWedding(session.user.id) // loads in background
          .then(w => { if (mounted) setWedding(w) })
          .catch(console.error)
      }
    })

    // ── Auth event listener ──────────────────────────────────────────────
    // SIGNED_IN  → new login (form submit)
    // SIGNED_OUT → logout button, expired session
    // TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED → ignored to prevent
    //   getOrCreateWedding being called repeatedly and racing with user writes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_IN') {
        setSession(session)
        if (session?.user) {
          getOrCreateWedding(session.user.id)
            .then(w => { if (mounted) setWedding(w) })
            .catch(console.error)
        }
      } else if (event === 'SIGNED_OUT') {
        clearAll()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/auth"    element={<AuthPage />} />
      <Route path="/" element={
        <ProtectedRoute initializing={initializing}>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index           element={<DashboardPage />} />
        <Route path="budget"     element={<BudgetPage />} />
        <Route path="guests"     element={<GuestsPage />} />
        <Route path="checklist"  element={<ChecklistPage />} />
        <Route path="seserahan"  element={<SeserahanPage />} />
        <Route path="settings"   element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
