import { useEffect, useState } from 'react'
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
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    // ── Step 1: Restore session on mount ────────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        getOrCreateWedding(session.user.id)
          .then(setWedding)
          .catch(console.error)
          .finally(() => setInitializing(false))
      } else {
        setInitializing(false)
      }
    })

    // ── Step 2: Listen to auth changes ──────────────────────────
    // IMPORTANT: We only act on SIGNED_IN / INITIAL_SESSION / SIGNED_OUT.
    // TOKEN_REFRESHED must be ignored — it fires silently every hour and
    // triggering getOrCreateWedding during it causes unnecessary re-fetches
    // that race with in-flight user operations, making data appear to vanish.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSession(session)
        if (session?.user) {
          getOrCreateWedding(session.user.id).then(setWedding).catch(console.error)
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        clearAll()
      }
      // TOKEN_REFRESHED, USER_UPDATED, etc. → do nothing to avoid disrupting app state
    })

    return () => subscription.unsubscribe()
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
