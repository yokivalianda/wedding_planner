import { useState } from 'react'
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
import { useEffect } from 'react'

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
    // Use ONLY onAuthStateChange as the single source of truth for auth state.
    // It fires INITIAL_SESSION immediately on registration (from cached storage),
    // then SIGNED_IN when user logs in, and SIGNED_OUT when logged out.
    // TOKEN_REFRESHED is intentionally ignored — it does not change user identity
    // and calling getOrCreateWedding on it caused race conditions with user writes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        setSession(session)
        if (session?.user) {
          try {
            const wedding = await getOrCreateWedding(session.user.id)
            setWedding(wedding)
          } catch (err) {
            console.error('Failed to load wedding:', err)
          }
        }
        // Mark initialization complete after INITIAL_SESSION resolves
        if (event === 'INITIAL_SESSION') {
          setInitializing(false)
        }
      } else if (event === 'SIGNED_OUT') {
        clearAll()
        setInitializing(false)
      }
      // TOKEN_REFRESHED, USER_UPDATED → do nothing
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
