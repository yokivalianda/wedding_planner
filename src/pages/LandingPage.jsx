import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Check, ChevronRight, Wallet, Users, CheckSquare, Star, Sparkles } from 'lucide-react'
import ThemeToggle from '../components/ui/ThemeToggle'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: <Wallet size={20} />, title: 'Budget Manager', desc: 'Lacak setiap rupiah — estimasi, aktual, dan yang sudah dibayar. Visualisasi chart per kategori.' },
  { icon: <Users size={20} />, title: 'Daftar Tamu & RSVP', desc: 'Kelola ratusan undangan, konfirmasi kehadiran, nomor meja, dan pantangan makanan.' },
  { icon: <CheckSquare size={20} />, title: 'Checklist Persiapan', desc: 'Template checklist 10+ tugas bawaan, tenggat waktu, dan prioritas otomatis.' },
  { icon: <Sparkles size={20} />, title: 'AI Wedding Assistant', desc: 'Dapatkan saran vendor lokal, estimasi biaya, dan inspirasi tema. (Segera hadir)' },
]

const PLANS = [
  {
    name: 'Gratis',
    price: 'Rp 0',
    period: 'selamanya',
    accent: false,
    features: ['Hingga 50 tamu', 'Budget manager dasar', 'Checklist persiapan', '1 pengguna'],
    cta: 'Mulai Gratis',
    ctaTo: '/auth',
  },
  {
    name: 'Pro',
    price: 'Rp 99.000',
    period: 'per bulan',
    accent: true,
    badge: 'Paling Populer',
    features: ['Tamu tanpa batas', 'Budget chart & laporan', 'Export PDF & Excel', 'Wedding website pribadi', 'Kolaborasi 3 pengguna', 'AI Assistant', 'Prioritas support'],
    cta: 'Coba 14 Hari Gratis',
    ctaTo: '/auth?plan=pro',
  },
  {
    name: 'Wedding Organizer',
    price: 'Rp 499.000',
    period: 'per bulan',
    accent: false,
    features: ['Semua fitur Pro', 'Kelola 20+ klien sekaligus', 'White label (logo sendiri)', 'Pengguna tanpa batas', 'API access', 'Dedicated account manager'],
    cta: 'Hubungi Kami',
    ctaTo: 'mailto:hello@weddingplanner.id',
  },
]

const TESTIMONIALS = [
  { name: 'Annisa & Rizky', city: 'Jakarta', text: 'Dalam 2 minggu pakai ini, kami bisa lacak budget dengan sangat detail. Nggak ada yang kelewat!', rating: 5 },
  { name: 'Sari & Budi', city: 'Surabaya', text: 'Daftar tamu 300 orang jadi super mudah dikelola. RSVP online bikin prosesnya jauh lebih efisien.', rating: 5 },
  { name: 'Rina & Dimas', city: 'Bandung', text: 'Checklist templatenya sangat membantu. Nggak kepikiran kalau ada yang perlu disiapkan jauh-jauh hari.', rating: 5 },
]

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleWaitlist = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    toast.success('Terima kasih! Kamu masuk daftar tunggu.')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      transition: 'background-color 0.35s, color 0.35s',
    }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 60,
        transition: 'background-color 0.35s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={16} color="var(--gold)" fill="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            Wedding Planner
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="#fitur" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Fitur</a>
          <a href="#harga" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Harga</a>
          <Link to="/auth" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Masuk</Link>
          <ThemeToggle size={14} />
          <Link to="/auth" className="btn btn-gold" style={{ padding: '0.5rem 1.125rem', fontSize: '0.85rem' }}>
            Mulai Gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 860, margin: '0 auto',
        padding: '6rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, var(--gold-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: 999, fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '2rem' }}>
          <Sparkles size={12} /> Gratis untuk selalu · Tanpa kartu kredit
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 400, lineHeight: 1.1,
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
        }}>
          Rencanakan Pernikahanmu<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>dengan Tenang & Teratur</em>
        </h1>

        <p style={{
          fontSize: '1.1rem', color: 'var(--text-secondary)',
          maxWidth: 580, margin: '0 auto 2.5rem',
          lineHeight: 1.8,
        }}>
          Dari anggaran hingga daftar tamu — semua yang kamu butuhkan dalam satu aplikasi cantik yang bisa diinstall di HP.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/auth" className="btn btn-gold" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Mulai Gratis Sekarang <ChevronRight size={16} />
          </Link>
          <a href="#fitur" className="btn btn-ghost" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Lihat Fitur
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '2.5rem' }}>
          <div style={{ display: 'flex' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${30 + i * 15}, 40%, 45%)`, border: '2px solid var(--bg-primary)', marginLeft: i ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'white' }}>
                {['AN', 'SR', 'RD', 'BT', 'KW'][i]}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={12} color="var(--gold)" fill="var(--gold)" />)}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Dipercaya <strong style={{ color: 'var(--text-primary)' }}>500+</strong> pasangan Indonesia
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="fitur" style={{ maxWidth: 1000, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.75rem' }}>Fitur Lengkap</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            Semua yang Kamu Butuhkan
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ transition: 'all var(--duration) var(--ease)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', marginBottom: '1rem' }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.15rem', color: 'var(--gold-light)', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: 'var(--accent-bg)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '4rem 2rem', transition: 'background-color 0.35s' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontStyle: 'italic', textAlign: 'center', color: 'var(--text-primary)', marginBottom: '2.5rem' }}>
            Kata Mereka
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card" style={{ borderLeft: '3px solid var(--gold)' }}>
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.875rem' }}>
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={13} color="var(--gold)" fill="var(--gold)" />)}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                  "{t.text}"
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>
                  — {t.name}, <span style={{ opacity: 0.6 }}>{t.city}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="harga" style={{ maxWidth: 1000, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.75rem' }}>Harga</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            Pilih Paket yang Tepat
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
          {PLANS.map((plan, i) => (
            <div key={i} className="card" style={{
              border: plan.accent ? '1.5px solid var(--gold)' : undefined,
              position: 'relative',
              transform: plan.accent ? 'scale(1.03)' : undefined,
            }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: '#0F0D0A', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.875rem', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  {plan.badge}
                </div>
              )}
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--gold-light)', marginBottom: '0.5rem' }}>{plan.name}</p>
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-primary)' }}>{plan.price}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>/ {plan.period}</span>
              </div>
              <div className="divider" />
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', margin: '1rem 0 1.5rem' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: '0.625rem', fontSize: '0.875rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                    <Check size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.ctaTo.startsWith('mailto') ? (
                <a href={plan.ctaTo} className={`btn ${plan.accent ? 'btn-gold' : 'btn-ghost'}`} style={{ width: '100%', justifyContent: 'center' }}>
                  {plan.cta}
                </a>
              ) : (
                <Link to={plan.ctaTo} className={`btn ${plan.accent ? 'btn-gold' : 'btn-ghost'}`} style={{ width: '100%', justifyContent: 'center' }}>
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Waitlist / CTA ── */}
      <section style={{ background: 'var(--accent-bg)', borderTop: '1px solid var(--border-light)', padding: '5rem 2rem', textAlign: 'center', transition: 'background-color 0.35s' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <Heart size={32} color="var(--gold)" fill="var(--gold)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Mulai Perjalananmu Hari Ini
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.8 }}>
            Bergabunglah dengan ratusan pasangan yang sudah mempercayakan persiapan hari istimewa mereka kepada kami.
          </p>
          {!submitted ? (
            <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: '0.75rem', maxWidth: 420, margin: '0 auto' }}>
              <input
                type="email"
                className="input"
                placeholder="email@kamu.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-gold" style={{ flexShrink: 0 }}>
                Daftar Gratis
              </button>
            </form>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1.5rem', background: 'var(--sage-bg)', border: '1px solid var(--sage-bg)', borderRadius: 'var(--radius-md)', color: 'var(--sage)' }}>
              <Check size={16} /> Berhasil! Kami akan menghubungimu segera.
            </div>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '1rem' }}>
            Gratis selamanya · Tidak perlu kartu kredit · Bisa cancel kapan saja
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '2rem', textAlign: 'center', transition: 'border-color 0.35s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Heart size={12} color="var(--gold)" fill="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--gold-light)', fontSize: '1rem' }}>Wedding Planner</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
          © 2025 · Dibuat dengan ❤ untuk pasangan Indonesia
        </p>
      </footer>
    </div>
  )
}
