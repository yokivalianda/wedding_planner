import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Wallet, Users, CheckSquare, Settings, LogOut, Heart, Menu, X, Gift } from 'lucide-react'
import { signOut } from '../../lib/supabase'
import { useAppStore } from '../../store'
import ThemeToggle from '../ui/ThemeToggle'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/budget',     icon: Wallet,          label: 'Budget' },
  { to: '/guests',     icon: Users,           label: 'Tamu' },
  { to: '/checklist',  icon: CheckSquare,     label: 'Checklist' },
  { to: '/seserahan',  icon: Gift,            label: 'Seserahan' },
  { to: '/settings',   icon: Settings,        label: 'Pengaturan' },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function AppLayout() {
  const navigate   = useNavigate()
  const wedding    = useAppStore(s => s.wedding)
  const user       = useAppStore(s => s.user)
  const isMobile   = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Sampai jumpa!')
    navigate('/auth')
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'

  const daysLeft = wedding?.wedding_date
    ? Math.ceil((new Date(wedding.wedding_date) - new Date()) / 86400000)
    : null

  if (isMobile) return <MobileLayout navItems={navItems} wedding={wedding} user={user} initials={initials} daysLeft={daysLeft} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} handleSignOut={handleSignOut} />

  return <DesktopLayout navItems={navItems} wedding={wedding} user={user} initials={initials} daysLeft={daysLeft} handleSignOut={handleSignOut} />
}

function DesktopLayout({ navItems, wedding, user, initials, daysLeft, handleSignOut }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <aside style={{
        width: 256, minWidth: 256,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.75rem 1.25rem',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
        transition: 'background-color 0.35s, border-color 0.35s',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Heart size={14} color="var(--gold)" fill="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>Wedding</span>
          </div>
          {wedding?.bride_name && wedding?.groom_name
            ? <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{wedding.bride_name} & {wedding.groom_name}</p>
            : <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{user?.email}</p>
          }
        </div>

        <div className="divider" style={{ margin: '0 0 0.75rem' }} />

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.875rem', borderRadius: 'var(--radius-md)',
              textDecoration: 'none', fontSize: '0.875rem',
              fontWeight: isActive ? '500' : '400',
              color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              transition: 'all var(--duration) var(--ease)',
            })}>
              {({ isActive }) => <><Icon size={16} strokeWidth={isActive ? 2 : 1.5} />{label}</>}
            </NavLink>
          ))}
        </nav>

        {/* Countdown */}
        {daysLeft !== null && daysLeft >= 0 && (
          <div style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem', textAlign: 'center',
            margin: '0.75rem 0',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1 }}>{daysLeft}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>hari menuju hari-H</p>
          </div>
        )}

        <div className="divider" style={{ margin: '0.5rem 0' }} />

        {/* Footer: theme + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center' }}>
          <ThemeToggle size={15} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: '0.875rem',
            color: 'var(--gold)', flexShrink: 0,
          }}>{initials}</div>
          <p style={{
            flex: 1, fontSize: '0.8rem', color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</p>
          <button onClick={handleSignOut} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex',
            transition: 'color var(--duration)',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          ><LogOut size={15} /></button>
        </div>
      </aside>

      <main style={{
        flex: 1, marginLeft: 256,
        padding: '2.5rem',
        minHeight: '100vh',
        maxWidth: 'calc(100vw - 256px)',
        overflowX: 'hidden',
        transition: 'background-color 0.35s',
      }}>
        <Outlet />
      </main>
    </div>
  )
}

function MobileLayout({ navItems, wedding, user, initials, daysLeft, drawerOpen, setDrawerOpen, handleSignOut }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', transition: 'background-color 0.35s' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.875rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background-color 0.35s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={13} color="var(--gold)" fill="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            {wedding?.bride_name && wedding?.groom_name ? `${wedding.bride_name} & ${wedding.groom_name}` : 'Wedding Planner'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {daysLeft !== null && daysLeft >= 0 && (
            <span style={{
              fontSize: '0.7rem', color: 'var(--gold)',
              background: 'var(--accent-bg)',
              padding: '0.2rem 0.6rem', borderRadius: 999,
              border: '1px solid var(--border)',
            }}>{daysLeft}h lagi</span>
          )}
          <ThemeToggle size={14} style={{ width: 32, height: 32 }} />
          <button onClick={() => setDrawerOpen(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-primary)', display: 'flex',
          }}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Drawer overlay */}
      {drawerOpen && <>
        <div onClick={() => setDrawerOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 30,
          background: 'var(--bg-overlay)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }} />
        <aside style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 260, zIndex: 40,
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          padding: '1.5rem 1.25rem',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInRight 0.25s var(--ease)',
          transition: 'background-color 0.35s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--gold-light)', fontSize: '1.1rem' }}>Menu</span>
            <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setDrawerOpen(false)} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 0.875rem', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', fontSize: '0.9rem',
                color: isActive ? 'var(--gold)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              })}>
                {({ isActive }) => <><Icon size={17} strokeWidth={isActive ? 2 : 1.5} />{label}</>}
              </NavLink>
            ))}
          </nav>
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', color: 'var(--gold)', flexShrink: 0,
            }}>{initials}</div>
            <p style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            <button onClick={handleSignOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)' }}><LogOut size={15} /></button>
          </div>
        </aside>
      </>}

      {/* Page content */}
      <main style={{ flex: 1, padding: '1.5rem 1rem', paddingBottom: '5.5rem', overflowX: 'hidden' }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transition: 'background-color 0.35s',
      }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.2rem', padding: '0.75rem 0', textDecoration: 'none',
            color: isActive ? 'var(--gold)' : 'var(--text-faint)',
            fontSize: '0.62rem', letterSpacing: '0.03em', position: 'relative',
            transition: 'color var(--duration)',
          })}>
            {({ isActive }) => <>
              {isActive && <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, background: 'var(--gold)', borderRadius: '0 0 2px 2px',
              }} />}
              <Icon size={19} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </>}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
