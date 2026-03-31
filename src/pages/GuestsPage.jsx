import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, Trash2, Edit3, X, Phone, Download, FileText } from 'lucide-react'
import { exportGuestsPDF, exportGuestsExcel } from '../lib/export'
import { useAppStore } from '../store'
import { getGuests, addGuest, updateGuest, deleteGuest } from '../lib/supabase'
import toast from 'react-hot-toast'

const RSVP_OPTIONS = [
  { value: 'pending',  label: 'Menunggu', color: 'var(--gold)' },
  { value: 'hadir',    label: 'Hadir',    color: 'var(--sage)' },
  { value: 'tidak',    label: 'Tidak Hadir', color: 'var(--rose)' },
]
const SIDES    = ['Mempelai Wanita', 'Mempelai Pria', 'Keduanya']
const CATEGORIES = ['Keluarga', 'Sahabat', 'Rekan Kerja', 'Umum', 'VIP']

export default function GuestsPage() {
  const { wedding, guests, setGuests,
          addGuest: addG, updateGuest: updateG, removeGuest } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [editGuest, setEditGuest] = useState(null)
  const [search,    setSearch]    = useState('')
  const [filterRsvp, setFilterRsvp] = useState('all')
  const [filterSide, setFilterSide] = useState('all')
  const [loading, setLoading]    = useState(false)

  useEffect(() => {
    if (!wedding?.id) return
    getGuests(wedding.id).then(setGuests)
  }, [wedding?.id])

  const filtered = useMemo(() => guests.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone || '').includes(search) || (g.email || '').toLowerCase().includes(search)
    const matchRsvp = filterRsvp === 'all' || g.rsvp_status === filterRsvp
    const matchSide = filterSide === 'all' || g.side === filterSide
    return matchSearch && matchRsvp && matchSide
  }), [guests, search, filterRsvp, filterSide])

  const stats = {
    total:    guests.length,
    hadir:    guests.filter(g => g.rsvp_status === 'hadir').length,
    tidak:    guests.filter(g => g.rsvp_status === 'tidak').length,
    pending:  guests.filter(g => g.rsvp_status === 'pending').length,
  }

  const handleSave = async (formData) => {
    setLoading(true)
    try {
      if (editGuest) {
        const updated = await updateGuest(editGuest.id, formData)
        updateG(editGuest.id, updated)
        toast.success('Data tamu diperbarui')
      } else {
        const newGuest = await addGuest({ ...formData, wedding_id: wedding.id })
        addG(newGuest)
        toast.success('Tamu ditambahkan')
      }
      setShowModal(false); setEditGuest(null)
    } catch (err) {
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus tamu ini?')) return
    try {
      await deleteGuest(id)
      removeGuest(id)
      toast.success('Tamu dihapus')
    } catch (err) { toast.error(err.message) }
  }

  const handleRsvpQuick = async (guest, status) => {
    try {
      const updated = await updateGuest(guest.id, { rsvp_status: status })
      updateG(guest.id, updated)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>Manajemen</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--ivory)' }}>
            Daftar Tamu
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          {guests.length > 0 && (
            <>
              <button className="btn btn-ghost" onClick={() => exportGuestsPDF(guests, wedding)}>
                <FileText size={15} /> Export PDF
              </button>
              <button className="btn btn-ghost" onClick={() => exportGuestsExcel(guests, wedding).catch(e => toast.error(e.message))}>
                <Download size={15} /> Export Excel
              </button>
            </>
          )}
          <button className="btn btn-gold" onClick={() => { setEditGuest(null); setShowModal(true) }}>
            <Plus size={16} /> Tambah Tamu
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Undangan', val: stats.total, color: 'var(--ivory)' },
          { label: 'Hadir', val: stats.hadir, color: 'var(--sage)' },
          { label: 'Tidak Hadir', val: stats.tidak, color: 'var(--rose)' },
          { label: 'Menunggu Konfirmasi', val: stats.pending, color: 'var(--gold)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', color, fontWeight: 500 }}>{val}</p>
            <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(250,247,242,0.4)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(201,169,110,0.5)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Cari nama, telepon, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 'auto' }} value={filterRsvp} onChange={e => setFilterRsvp(e.target.value)}>
          <option value="all">Semua RSVP</option>
          {RSVP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterSide} onChange={e => setFilterSide(e.target.value)}>
          <option value="all">Semua Pihak</option>
          {SIDES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Guest list */}
      {filtered.length === 0 ? (
        <EmptyState hasGuests={guests.length > 0} onAdd={() => setShowModal(true)} />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 140px 130px 90px',
            padding: '0.625rem 1.5rem',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(201,169,110,0.1)',
          }}>
            {['Nama', 'Pihak', 'Kategori', 'RSVP', ''].map(h => (
              <span key={h} style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(250,247,242,0.3)' }}>{h}</span>
            ))}
          </div>

          {filtered.map((guest) => {
            const rsvp = RSVP_OPTIONS.find(r => r.value === guest.rsvp_status) || RSVP_OPTIONS[0]
            return (
              <div key={guest.id} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 140px 130px 90px',
                padding: '0.875rem 1.5rem',
                borderBottom: '1px solid rgba(201,169,110,0.06)',
                alignItems: 'center',
                transition: 'background var(--duration)',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--ivory)', fontWeight: 400 }}>{guest.name}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                    {guest.phone && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(250,247,242,0.35)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={10} /> {guest.phone}
                      </span>
                    )}
                    {guest.table_no && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(201,169,110,0.5)' }}>
                        Meja {guest.table_no}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'rgba(250,247,242,0.5)' }}>{guest.side}</span>
                <span className="badge badge-muted" style={{ fontSize: '0.72rem', width: 'fit-content' }}>
                  {guest.category}
                </span>
                {/* RSVP Quick toggle */}
                <select
                  value={guest.rsvp_status}
                  onChange={e => handleRsvpQuick(guest, e.target.value)}
                  style={{
                    background: 'none',
                    border: `1px solid ${rsvp.color}40`,
                    borderRadius: 'var(--radius-sm)',
                    color: rsvp.color,
                    fontSize: '0.78rem',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {RSVP_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: 'var(--ink-muted)', color: 'var(--ivory)' }}>{o.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                  <button
                    className="btn"
                    onClick={() => { setEditGuest(guest); setShowModal(true) }}
                    style={{ background: 'none', border: 'none', padding: '0.25rem 0.5rem', color: 'rgba(250,247,242,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(250,247,242,0.4)'}
                  ><Edit3 size={14} /></button>
                  <button
                    className="btn"
                    onClick={() => handleDelete(guest.id)}
                    style={{ background: 'none', border: 'none', padding: '0.25rem 0.5rem', color: 'rgba(250,247,242,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(250,247,242,0.3)'}
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            )
          })}

          {/* Footer count */}
          <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(201,169,110,0.08)' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(250,247,242,0.3)' }}>
              Menampilkan {filtered.length} dari {guests.length} tamu
            </span>
          </div>
        </div>
      )}

      {showModal && (
        <GuestModal
          guest={editGuest}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditGuest(null) }}
          loading={loading}
        />
      )}
    </div>
  )
}

function GuestModal({ guest, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name:        guest?.name || '',
    phone:       guest?.phone || '',
    email:       guest?.email || '',
    category:    guest?.category || CATEGORIES[0],
    side:        guest?.side || SIDES[0],
    rsvp_status: guest?.rsvp_status || 'pending',
    table_no:    guest?.table_no || '',
    dietary:     guest?.dietary || '',
    notes:       guest?.notes || '',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {guest ? 'Edit Data Tamu' : 'Tambah Tamu'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(250,247,242,0.4)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Nama Lengkap" colSpan={2}>
              <input className="input" placeholder="Nama tamu" value={form.name} onChange={set('name')} required style={{ gridColumn: 'span 2' }} />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="No. Telepon">
              <input className="input" placeholder="+62..." value={form.phone} onChange={set('phone')} />
            </FormField>
            <FormField label="Email">
              <input className="input" type="email" placeholder="email@..." value={form.email} onChange={set('email')} />
            </FormField>
            <FormField label="Pihak">
              <select className="input" value={form.side} onChange={set('side')}>
                {SIDES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Kategori">
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Status RSVP">
              <select className="input" value={form.rsvp_status} onChange={set('rsvp_status')}>
                {RSVP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="No. Meja">
              <input className="input" placeholder="cth: A3" value={form.table_no} onChange={set('table_no')} />
            </FormField>
          </div>

          <FormField label="Pantangan Makanan">
            <input className="input" placeholder="cth: Vegetarian, Halal, Alergi kacang" value={form.dietary} onChange={set('dietary')} />
          </FormField>
          <FormField label="Catatan">
            <textarea className="input" rows={2} placeholder="Catatan..." value={form.notes} onChange={set('notes')} style={{ resize: 'vertical' }} />
          </FormField>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-gold" disabled={loading}>
              {loading ? 'Menyimpan...' : guest ? 'Perbarui' : 'Tambah Tamu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(250,247,242,0.45)', marginBottom: '0.375rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function EmptyState({ hasGuests, onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(201,169,110,0.2)', borderRadius: 'var(--radius-lg)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--gold-light)', marginBottom: '0.5rem' }}>
        {hasGuests ? 'Tidak ada tamu yang sesuai filter' : 'Belum ada daftar tamu'}
      </p>
      <p style={{ fontSize: '0.875rem', color: 'rgba(250,247,242,0.35)', marginBottom: '1.5rem' }}>
        {hasGuests ? 'Coba ubah filter pencarianmu' : 'Mulai tambahkan nama-nama tamu spesialmu'}
      </p>
      {!hasGuests && (
        <button className="btn btn-gold" onClick={onAdd}>
          <Plus size={16} /> Tambah Tamu Pertama
        </button>
      )}
    </div>
  )
}
