import { useState } from 'react'
import { Save, Heart, Calendar, Wallet, User, MapPin, AlertCircle, Sun, Moon } from 'lucide-react'
import { useAppStore } from '../store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

function parseRp(str) {
  return parseInt(String(str).replace(/\D/g, ''), 10) || 0
}
function formatRpInput(val) {
  if (!val) return ''
  return Number(val).toLocaleString('id-ID')
}

export default function SettingsPage() {
  const { wedding, updateWedding, user, theme, toggleTheme } = useAppStore()

  const [form, setForm] = useState({
    title:        wedding?.title        || '',
    bride_name:   wedding?.bride_name   || '',
    groom_name:   wedding?.groom_name   || '',
    wedding_date: wedding?.wedding_date || '',
    venue:        wedding?.venue        || '',
    budget_total: wedding?.budget_total ? formatRpInput(wedding.budget_total) : '',
  })
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const set = (k) => (e) => { setSaved(false); setForm(f => ({ ...f, [k]: e.target.value })) }

  const handleBudgetInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setForm(f => ({ ...f, budget_total: raw ? Number(raw).toLocaleString('id-ID') : '' }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, budget_total: parseRp(form.budget_total), wedding_date: form.wedding_date || null }
      const { data, error } = await supabase.from('weddings').update(payload).eq('id', wedding.id).select().single()
      if (error) throw error
      updateWedding(data)
      setSaved(true)
      toast.success('Profil pernikahan berhasil disimpan ✨')
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const daysLeft = form.wedding_date ? Math.ceil((new Date(form.wedding_date) - new Date()) / 86400000) : null

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both', maxWidth: 680 }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>Konfigurasi</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>Pengaturan</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Theme Section */}
        <Section title="Tema Tampilan" icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Ganti tampilan sesuai preferensimu
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'var(--accent-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--gold)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                transition: 'all var(--duration) var(--ease)',
              }}
            >
              {theme === 'dark' ? <><Sun size={15} /> Tema Terang</> : <><Moon size={15} /> Tema Gelap</>}
            </button>
          </div>
        </Section>

        {/* Identity */}
        <Section title="Identitas Pernikahan" icon={<Heart size={16} />}>
          <FormField label="Judul / Nama Acara">
            <input className="input" placeholder="cth: Pernikahan Annisa & Rizky" value={form.title} onChange={set('title')} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Nama Mempelai Wanita">
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.5, pointerEvents: 'none' }} />
                <input className="input" placeholder="Nama lengkap" value={form.bride_name} onChange={set('bride_name')} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </FormField>
            <FormField label="Nama Mempelai Pria">
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.5, pointerEvents: 'none' }} />
                <input className="input" placeholder="Nama lengkap" value={form.groom_name} onChange={set('groom_name')} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </FormField>
          </div>
        </Section>

        {/* Date & Venue */}
        <Section title="Tanggal & Lokasi" icon={<Calendar size={16} />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Tanggal Pernikahan">
              <div style={{ position: 'relative' }}>
                <Calendar size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.5, pointerEvents: 'none' }} />
                <input className="input" type="date" value={form.wedding_date} onChange={set('wedding_date')} style={{ paddingLeft: '2.5rem' }} />
              </div>
            </FormField>
            <FormField label="Preview Countdown">
              <div style={{ height: '100%', minHeight: 42, display: 'flex', alignItems: 'center', padding: '0 1rem', background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                {daysLeft === null ? <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>Pilih tanggal dulu</span>
                  : daysLeft < 0 ? <span style={{ fontSize: '0.85rem', color: 'var(--rose)' }}>Sudah berlalu</span>
                  : daysLeft === 0 ? <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>🎉 Hari ini!</span>
                  : <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}><strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>{daysLeft}</strong><span style={{ marginLeft: '0.4rem', color: 'var(--text-muted)' }}>hari lagi</span></span>}
              </div>
            </FormField>
          </div>
          <FormField label="Lokasi / Venue">
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.5, pointerEvents: 'none' }} />
              <input className="input" placeholder="cth: Ballroom Hotel Mulia, Jakarta" value={form.venue} onChange={set('venue')} style={{ paddingLeft: '2.5rem' }} />
            </div>
          </FormField>
        </Section>

        {/* Budget */}
        <Section title="Anggaran Total" icon={<Wallet size={16} />}>
          <FormField label="Total Budget Pernikahan (Rp)">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--gold)', opacity: 0.6, fontFamily: 'var(--font-display)', pointerEvents: 'none' }}>Rp</span>
              <input className="input" placeholder="100.000.000" value={form.budget_total} onChange={handleBudgetInput} style={{ paddingLeft: '2.5rem' }} />
            </div>
            {form.budget_total && <p style={{ fontSize: '0.78rem', color: 'var(--gold)', marginTop: '0.4rem', opacity: 0.8 }}>= Rp {form.budget_total}</p>}
          </FormField>
          <div style={{ padding: '0.875rem 1rem', background: 'var(--accent-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertCircle size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Budget ini digunakan sebagai acuan di halaman Budget. Kamu bisa mengubahnya kapan saja.</p>
          </div>
        </Section>

        {/* Account */}
        <Section title="Akun" icon={<User size={16} />}>
          <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.email}</p>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>Untuk mengubah email atau password, hubungi support atau gunakan fitur reset password.</p>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
          <button type="submit" className="btn btn-gold" disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', gap: '0.625rem' }}>
            {loading ? 'Menyimpan...' : saved ? <><span>✓</span> Tersimpan</> : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
        <span style={{ color: 'var(--gold)' }}>{icon}</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>{title}</h2>
      </div>
      <div className="divider" style={{ margin: '0 0 0.25rem' }} />
      {children}
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}
