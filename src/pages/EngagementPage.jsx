import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, X, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react'
import { useAppStore } from '../store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Vanue', 'Dokumentasi', 'MUA & Busana', 'Katering',
  'Undangan', 'Dekorasi', 'Hiburan', 'Transport', 'Lain-lain'
]

const STATUS_OPTIONS = [
  { value: 'belum', label: 'Belum', color: 'var(--text-muted)' },
  { value: 'dp',    label: 'DP',    color: 'var(--gold)' },
  { value: 'lunas', label: 'Lunas', color: 'var(--sage)' },
]

function formatRp(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
function parseRp(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0 }
function toLocaleRp(val) { return val ? Number(val).toLocaleString('id-ID') : '' }

// ─── Supabase helpers ──────────────────────────────────────────────────────
const getItems   = async (wid) => {
  const { data, error } = await supabase.from('engagement_items').select('*').eq('wedding_id', wid).order('created_at')
  if (error) throw error; return data
}
const addItem    = async (item) => {
  const { data, error } = await supabase.from('engagement_items').insert(item).select().single()
  if (error) throw error; return data
}
const updateItem = async (id, updates) => {
  const { data, error } = await supabase.from('engagement_items').update(updates).eq('id', id).select().single()
  if (error) throw error; return data
}
const deleteItem = async (id) => {
  const { error } = await supabase.from('engagement_items').delete().eq('id', id)
  if (error) throw error
}

export default function EngagementPage() {
  const { wedding } = useAppStore()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    if (!wedding?.id) return
    getItems(wedding.id).then(setItems).catch(e => {
      toast('Jalankan SQL migration dulu untuk mengaktifkan fitur Engagement.', { icon: '⚠️' })
    })
  }, [wedding?.id])

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const its = items.filter(i => i.category === cat)
    if (its.length) acc[cat] = its
    return acc
  }, {})
  const others = items.filter(i => !CATEGORIES.includes(i.category))
  if (others.length) grouped['Lain-lain'] = [...(grouped['Lain-lain'] || []), ...others]

  const totalGroom = items.reduce((s, i) => s + (i.price_groom || 0), 0)
  const totalBride = items.reduce((s, i) => s + (i.price_bride || 0), 0)
  const totalAll   = totalGroom + totalBride

  const handleSave = async (form) => {
    if (!wedding?.id) return
    setLoading(true)
    try {
      const payload = { ...form, wedding_id: wedding.id }
      if (editItem) {
        const updated = await updateItem(editItem.id, payload)
        setItems(prev => prev.map(i => i.id === editItem.id ? updated : i))
        toast.success('Item diperbarui')
      } else {
        const created = await addItem(payload)
        setItems(prev => [...prev, created])
        toast.success('Item ditambahkan')
      }
      setShowModal(false); setEditItem(null)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus item ini?')) return
    try {
      await deleteItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Item dihapus')
    } catch (e) { toast.error(e.message) }
  }

  const handleStatusToggle = async (item) => {
    const cycle = { belum: 'dp', dp: 'lunas', lunas: 'belum' }
    const newStatus = cycle[item.status] || 'belum'
    try {
      const updated = await updateItem(item.id, { status: newStatus })
      setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    } catch (e) { toast.error(e.message) }
  }

  const toggle = (cat) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>
            Perencanaan
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--text-primary)', fontStyle: 'italic' }}>
            Engagement
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: wedding?.groom_name || 'Mempelai Pria', value: totalGroom, color: 'var(--gold)' },
          { label: wedding?.bride_name || 'Mempelai Wanita', value: totalBride, color: 'var(--rose)' },
          { label: 'Total Engagement', value: totalAll, color: 'var(--sage)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>{c.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: c.color, fontStyle: 'italic' }}>{formatRp(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>Belum ada item</p>
          <p style={{ fontSize: '0.875rem' }}>Tambahkan budget engagement pertama kamu</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(grouped).map(([cat, its]) => {
            const catTotal = its.reduce((s, i) => s + (i.price_groom || 0) + (i.price_bride || 0), 0)
            const isOpen = !collapsed[cat]
            return (
              <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Category header */}
                <button onClick={() => toggle(cat)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-primary)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>{cat}</span>
                    <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{its.length} item</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 500 }}>{formatRp(catTotal)}</span>
                    {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </button>

                {/* Table header */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border-light)' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 36px 36px',
                      gap: '0.5rem', padding: '0.5rem 1.25rem',
                      background: 'var(--bg-elevated)', fontSize: '0.7rem',
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      <span>Detail</span>
                      <span>Status</span>
                      <span style={{ textAlign: 'right' }}>{wedding?.groom_name?.split(' ')[0] || 'Pria'}</span>
                      <span style={{ textAlign: 'right' }}>{wedding?.bride_name?.split(' ')[0] || 'Wanita'}</span>
                      <span />
                      <span />
                    </div>

                    {its.map((item, idx) => {
                      const st = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[0]
                      return (
                        <div key={item.id} style={{
                          display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 36px 36px',
                          gap: '0.5rem', padding: '0.75rem 1.25rem', alignItems: 'center',
                          borderTop: idx > 0 ? '1px solid var(--border-light)' : undefined,
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</p>
                            {item.vendor && (
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.1rem' }}>{item.vendor}</p>
                            )}
                          </div>
                          <button onClick={() => handleStatusToggle(item)} style={{
                            padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                            border: '1px solid currentColor', background: 'transparent',
                            color: st.color, fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500,
                          }}>{st.label}</button>
                          <p style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatRp(item.price_groom)}</p>
                          <p style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatRp(item.price_bride)}</p>
                          <button onClick={() => { setEditItem(item); setShowModal(true) }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--rose)', padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}

                    {/* Category total row */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 90px 110px 110px 36px 36px',
                      gap: '0.5rem', padding: '0.625rem 1.25rem',
                      background: 'var(--accent-bg)', borderTop: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total {cat}</span>
                      <span />
                      <span style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 500 }}>
                        {formatRp(its.reduce((s, i) => s + (i.price_groom || 0), 0))}
                      </span>
                      <span style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--rose)', fontWeight: 500 }}>
                        {formatRp(its.reduce((s, i) => s + (i.price_bride || 0), 0))}
                      </span>
                      <span /><span />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EngagementModal
          item={editItem}
          groomName={wedding?.groom_name}
          brideName={wedding?.bride_name}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          loading={loading}
        />
      )}
    </div>
  )
}

function EngagementModal({ item, groomName, brideName, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    category:    item?.category    || CATEGORIES[0],
    name:        item?.name        || '',
    status:      item?.status      || 'belum',
    vendor:      item?.vendor      || '',
    price_groom: item?.price_groom || 0,
    price_bride: item?.price_bride || 0,
    notes:       item?.notes       || '',
  })
  const [groomInput, setGroomInput] = useState(toLocaleRp(form.price_groom))
  const [brideInput, setBrideInput] = useState(toLocaleRp(form.price_bride))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nama item wajib diisi'); return }
    onSave({ ...form, price_groom: parseRp(groomInput), price_bride: parseRp(brideInput) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            {item ? 'Edit Item' : 'Tambah Item Engagement'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormRow label="Kategori">
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormRow>
          <FormRow label="Nama Item">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="cth: Dekor pelaminan" />
          </FormRow>
          <FormRow label="Vendor / Link">
            <input className="input" value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Nama vendor atau link" />
          </FormRow>
          <FormRow label="Status">
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormRow label={`Biaya ${groomName?.split(' ')[0] || 'Pria'}`}>
              <input className="input" value={groomInput}
                onChange={e => setGroomInput(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                placeholder="0" />
            </FormRow>
            <FormRow label={`Biaya ${brideName?.split(' ')[0] || 'Wanita'}`}>
              <input className="input" value={brideInput}
                onChange={e => setBrideInput(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                placeholder="0" />
            </FormRow>
          </div>
          <FormRow label="Keterangan">
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan tambahan..." style={{ resize: 'vertical' }} />
          </FormRow>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : item ? 'Simpan Perubahan' : 'Tambah Item'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormRow({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
