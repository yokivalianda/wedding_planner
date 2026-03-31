import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { signIn, signUp } from '../lib/supabase'
import ThemeToggle from '../components/ui/ThemeToggle'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [mode,     setMode]     = useState('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Selamat datang kembali!')
      } else {
        await signUp(email, password, name)
        toast.success('Akun berhasil dibuat! Selamat merencanakan ❤')
      }
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background-color 0.35s',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Decorative blobs ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, var(--rose-bg) 0%, transparent 70%)', opacity: 0.5 }} />
      </div>

      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={15} color="var(--gold)" fill="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            Wedding Planner
          </span>
        </div>
        <ThemeToggle size={15} />
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          animation: 'fadeUp 0.5s var(--ease) both',
        }}>

          {/* ── Hero text (visible on all screens, compact on mobile) ── */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 6vw, 2.75rem)',
              fontWeight: 400,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}>
              {mode === 'login' ? (
                <>Selamat <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Datang</em> Kembali</>
              ) : (
                <>Mulai <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Merencanakan</em></>
              )}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {mode === 'login'
                ? 'Masuk untuk melanjutkan rencana pernikahanmu'
                : 'Buat akun gratis dan mulai perjalanan indahmu'}
            </p>
          </div>

          {/* ── Form card ── */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 5vw, 2.25rem)',
            boxShadow: 'var(--shadow-lg)',
            transition: 'background-color 0.35s, border-color 0.35s',
          }}>

            {/* Mode tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
              marginBottom: '1.75rem',
              gap: '0.25rem',
            }}>
              {[
                { value: 'login', label: 'Masuk' },
                { value: 'register', label: 'Daftar' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    fontWeight: mode === value ? 500 : 400,
                    cursor: 'pointer',
                    background: mode === value ? 'var(--gold)' : 'transparent',
                    color:      mode === value ? '#0F0D0A' : 'var(--text-muted)',
                    transition: 'all var(--duration) var(--ease)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {mode === 'register' && (
                <Field label="Nama Lengkap" icon={<User size={16} />}>
                  <input
                    className="input"
                    type="text"
                    placeholder="Namamu"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ paddingLeft: '2.625rem' }}
                    autoComplete="name"
                  />
                </Field>
              )}

              <Field label="Email" icon={<Mail size={16} />}>
                <input
                  className="input"
                  type="email"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.625rem' }}
                  autoComplete="email"
                  inputMode="email"
                />
              </Field>

              <Field
                label="Password"
                icon={<Lock size={16} />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex', padding: '0.25rem',
                      minWidth: 28, minHeight: 28,
                      alignItems: 'center', justifyContent: 'center',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              >
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingLeft: '2.625rem', paddingRight: '2.75rem' }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </Field>

              <button
                type="submit"
                className="btn btn-gold"
                disabled={loading}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.875rem',
                  fontSize: '1rem',
                  marginTop: '0.5rem',
                  opacity: loading ? 0.75 : 1,
                  minHeight: 52,
                  // Larger touch target on mobile
                }}
              >
                {loading
                  ? 'Memproses...'
                  : mode === 'login' ? 'Masuk' : 'Buat Akun Gratis'}
              </button>
            </form>

            {/* Switch mode link */}
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
              {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gold)', fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem', padding: 0,
                  textDecoration: 'underline',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {mode === 'login' ? 'Daftar sekarang' : 'Masuk'}
              </button>
            </p>
          </div>

          {/* Trust badge */}
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-faint)',
            marginTop: '1.25rem',
            lineHeight: 1.6,
          }}>
            ❤ Gratis selamanya · Tanpa kartu kredit<br />
            Dipercaya 500+ pasangan Indonesia
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, icon, suffix, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: '0.4rem',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '0.75rem', top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--gold)', opacity: 0.6,
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>
        {children}
        {suffix}
      </div>
    </div>
  )
}
