import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, X, GripVertical, Camera } from 'lucide-react'
import { useAppStore } from '../store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const DEFAULT_ITEMS = [
  'Make up', 'Hairdo', 'Nail art', 'Baju pria', 'Baju wanita',
  'Aksesoris', 'Fotografer', 'Videografer', 'Transport', 'Lokasi'
]

const STATUS_OPTIONS = [
  { value: 'belum', label: 'Belum',   bg: 'var(--bg-elevated)',  color: 'var(--text-muted)' },
  { value: 'dp',    label: 'DP',      bg: 'rgba(201,169,110,0.15)', color: 'var(--gold)' },
  { value: 'lunas', label: 'Lunas',   bg: 'var(--sage-bg)',      color: 'var(--sage)' },
]

function formatRp(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
function parseRp(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0 }
function toLocaleRp(val) { return val ? Number(val).toLocaleString('id-ID') : '' }

const getItems   = async (wid) => {
  const { data, error } = await supabase.from('prewedding_items').select('*').eq('wedding_id', wid).order('sort_order').order('created_at')
  if (error) throw error; return data
}
const addItem    = async (item) => {
  const { data, error } = await supabase.from('prewedding_items').insert(item).select().single()
  if (error) throw error; return data
}
const updateItem = async (id, updates) => {
  const { data, error } = await supabase.from('prewedding_items').update(updates).eq('id', id).select().single()
  if (error) throw error; return data
}
const deleteItem = async (id) => {
  const { error } = await supabase.from('prewedding_items').delete().eq('id', id)
  if (error) throw error
}

export default function PreWeddingPage() {
  const { wedding } = useAppStore()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)

  useEffect(() => {
    if (!wedding?.id) return
    getItems(wedding.id).then(setItems).catch(() => {
      toast('Jalankan SQL migration dulu untuk mengaktifkan fitur Foto Pre-Wedding.', { icon: '⚠️' })
    })
  }, [wedding?.id])

  const totalBudget  = items.reduce((s, i) => s + (i.budget || 0), 0)
  const totalActual  = items.reduce((s, i) => s + (i.actual || 0), 0)
  const totalDpLunas = items.filter(i => i.status === 'dp' || i.status === 'lunas').length
  const totalLunas   = items.filter(i => i.status === 'lunas').length

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
        const created = await addItem({ ...payload, sort_order: items.length })
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

  const handleStatusCycle = async (item) => {
    const cycle = { belum: 'dp', dp: 'lunas', lunas: 'belum' }
    const newStatus = cycle[item.status] || 'belum'
    try {
      const updated = await updateItem(item.id, { status: newStatus })
      setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    } catch (e) { toast.error(e.message) }
  }

  const seedDefaults = async () => {
    if (!wedding?.id) return
    setLoading(true)
    try {
      const toAdd = DEFAULT_ITEMS.map((name, idx) => ({
        wedding_id: wedding.id, name, sort_order: idx,
        budget: 0, actual: 0, status: 'belum',
      }))
      const { data, error } = await supabase.from('prewedding_items').insert(toAdd).select()
      if (error) throw error
      setItems(prev => [...prev, ...data])
      toast.success('Item default ditambahkan!')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>
            Dokumentasi
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--text-primary)', fontStyle: 'italic' }}>
            Foto Pre-Wedding
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {items.length === 0 && (
            <button className="btn btn-ghost" onClick={seedDefaults} disabled={loading} style={{ fontSize: '0.8rem' }}>
              Isi Default
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Item',  value: `${items.length}`,                   sub: `${totalLunas} lunas`,      color: 'var(--gold)' },
          { label: 'Budget',      value: formatRp(totalBudget),               sub: 'estimasi total',            color: 'var(--text-primary)' },
          { label: 'Realisasi',   value: formatRp(totalActual),               sub: `selisih ${formatRp(totalActual - totalBudget)}`, color: totalActual > totalBudget ? 'var(--rose)' : 'var(--sage)' },
          { label: 'Progres',     value: `${totalDpLunas}/${items.length}`,   sub: 'sudah DP / Lunas',          color: 'var(--sage)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>{c.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: c.color, fontStyle: 'italic' }}>{c.value}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Progres pembayaran</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--gold)' }}>
              {Math.round((totalDpLunas / items.length) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(totalDpLunas / items.length) * 100}%` }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            {STATUS_OPTIONS.map(s => {
              const count = items.filter(i => i.status === s.value).length
              return (
                <span key={s.value} style={{ color: s.color }}>● {s.label}: {count}</span>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
          <Camera size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            Belum ada item
          </p>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Klik "Isi Default" untuk langsung menggunakan template standar pre-wedding
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table head */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 100px 120px 120px 36px 36px',
            gap: '0.5rem', padding: '0.625rem 1.25rem',
            background: 'var(--bg-elevated)', fontSize: '0.7rem',
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Item</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Budget</span>
            <span style={{ textAlign: 'right' }}>Realisasi</span>
            <span /><span />
          </div>

          {items.map((item, idx) => {
            const st = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[0]
            const over = (item.actual || 0) > (item.budget || 0) && item.budget > 0
            return (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 100px 120px 120px 36px 36px',
                gap: '0.5rem', padding: '0.75rem 1.25rem', alignItems: 'center',
                borderTop: '1px solid var(--border-light)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</p>
                  {item.vendor && <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.1rem' }}>{item.vendor}</p>}
                  {item.notes && <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.1rem', fontStyle: 'italic' }}>{item.notes}</p>}
                </div>
                <button onClick={() => handleStatusCycle(item)} style={{
                  padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                  background: st.bg, border: 'none', color: st.color,
                  fontSize: '0.72rem', cursor: 'pointer', fontWeight: 500,
                }}>{st.label}</button>
                <p style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatRp(item.budget)}</p>
                <p style={{ textAlign: 'right', fontSize: '0.85rem', color: over ? 'var(--rose)' : 'var(--text-secondary)', fontWeight: over ? 500 : 400 }}>{formatRp(item.actual)}</p>
                <button onClick={() => { setEditItem(item); setShowModal(true) }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--rose)', padding: '0.25rem' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}

          {/* Footer total */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 100px 120px 120px 36px 36px',
            gap: '0.5rem', padding: '0.75rem 1.25rem',
            background: 'var(--accent-bg)', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>TOTAL</span>
            <span />
            <span style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>{formatRp(totalBudget)}</span>
            <span style={{ textAlign: 'right', fontSize: '0.85rem', color: totalActual > totalBudget ? 'var(--rose)' : 'var(--sage)', fontWeight: 600 }}>{formatRp(totalActual)}</span>
            <span /><span />
          </div>
        </div>
      )}

      {showModal && (
        <PreWeddingModal item={editItem} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null) }} loading={loading} />
      )}
    </div>
  )
}

function PreWeddingModal({ item, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name:   item?.name   || '',
    vendor: item?.vendor || '',
    status: item?.status || 'belum',
    budget: item?.budget || 0,
    actual: item?.actual || 0,
    notes:  item?.notes  || '',
  })
  const [budgetInput, setBudgetInput] = useState(toLocaleRp(form.budget))
  const [actualInput, setActualInput] = useState(toLocaleRp(form.actual))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nama item wajib diisi'); return }
    onSave({ ...form, budget: parseRp(budgetInput), actual: parseRp(actualInput) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            {item ? 'Edit Item' : 'Tambah Item Pre-Wedding'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormRow label="Nama Item">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="cth: Fotografer" />
          </FormRow>
          <FormRow label="Vendor / Kontak">
            <input className="input" value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Nama vendor atau link" />
          </FormRow>
          <FormRow label="Status">
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormRow label="Budget">
              <input className="input" value={budgetInput}
                onChange={e => setBudgetInput(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                placeholder="0" />
            </FormRow>
            <FormRow label="Realisasi">
              <input className="input" value={actualInput}
                onChange={e => setActualInput(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
                placeholder="0" />
            </FormRow>
          </div>
          <FormRow label="Keterangan">
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan..." style={{ resize: 'vertical' }} />
          </FormRow>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Menyimpan...' : item ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormRow({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>{label}</label>
      {children}
    </div>
  )
}
