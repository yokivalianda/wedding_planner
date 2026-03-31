import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, X, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useAppStore } from '../store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'MUA', 'Mahar', 'Tempat', 'Katering', 'Dokumentasi',
  'Busana', 'Dekorasi', 'Undangan', 'Hiburan', 'Transport',
  'Cincin', 'Bulan Madu', 'Lain-lain'
]

const STATUS_OPTIONS = [
  { value: 'belum', label: 'Belum',   bg: 'var(--bg-elevated)',       color: 'var(--text-muted)' },
  { value: 'dp',    label: 'DP',      bg: 'rgba(201,169,110,0.18)',    color: 'var(--gold)' },
  { value: 'lunas', label: 'Lunas',   bg: 'var(--sage-bg)',            color: 'var(--sage)' },
]

function formatRp(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
function parseRp(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0 }
function toLocaleRp(val) { return val ? Number(val).toLocaleString('id-ID') : '' }

const getItems   = async (wid) => {
  const { data, error } = await supabase.from('wedding_budget_items').select('*').eq('wedding_id', wid).order('created_at')
  if (error) throw error; return data
}
const addItem    = async (item) => {
  const { data, error } = await supabase.from('wedding_budget_items').insert(item).select().single()
  if (error) throw error; return data
}
const updateItem = async (id, updates) => {
  const { data, error } = await supabase.from('wedding_budget_items').update(updates).eq('id', id).select().single()
  if (error) throw error; return data
}
const deleteItem = async (id) => {
  const { error } = await supabase.from('wedding_budget_items').delete().eq('id', id)
  if (error) throw error
}

export default function WeddingBudgetPage() {
  const { wedding } = useAppStore()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!wedding?.id) return
    getItems(wedding.id).then(setItems).catch(() => {
      toast('Jalankan SQL migration dulu untuk mengaktifkan fitur Budget Wedding.', { icon: '⚠️' })
    })
  }, [wedding?.id])

  const filtered = filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus)

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const its = filtered.filter(i => i.category === cat)
    if (its.length) acc[cat] = its
    return acc
  }, {})
  const others = filtered.filter(i => !CATEGORIES.includes(i.category))
  if (others.length) grouped['Lain-lain'] = [...(grouped['Lain-lain'] || []), ...others]

  const totalBudget    = items.reduce((s, i) => s + (i.budget    || 0), 0)
  const totalRealisasi = items.reduce((s, i) => s + (i.realisasi || 0), 0)
  const totalDpLunas   = items.reduce((s, i) => s + (i.dp_lunas  || 0), 0)
  const totalSisa      = totalRealisasi - totalDpLunas

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

  const handleStatusCycle = async (item) => {
    const cycle = { belum: 'dp', dp: 'lunas', lunas: 'belum' }
    const newStatus = cycle[item.status] || 'belum'
    try {
      const updated = await updateItem(item.id, { status: newStatus })
      setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    } catch (e) { toast.error(e.message) }
  }

  const toggle = (cat) => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))

  const pct = totalBudget > 0 ? Math.min((totalRealisasi / totalBudget) * 100, 100) : 0
  const overBudget = totalRealisasi > totalBudget

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>
            Keuangan
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--text-primary)', fontStyle: 'italic' }}>
            Budget Wedding
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Budget',    value: formatRp(totalBudget),    color: 'var(--text-primary)' },
          { label: 'Realisasi',       value: formatRp(totalRealisasi), color: overBudget ? 'var(--rose)' : 'var(--gold)' },
          { label: 'DP / Lunas',      value: formatRp(totalDpLunas),   color: 'var(--sage)' },
          { label: 'Sisa Pembayaran', value: formatRp(totalSisa),      color: totalSisa > 0 ? 'var(--rose)' : 'var(--text-muted)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>{c.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: c.color, fontStyle: 'italic', wordBreak: 'break-all' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {overBudget ? '⚠️ Melebihi budget!' : 'Penggunaan budget'}
            </span>
            <span style={{ fontSize: '0.82rem', color: overBudget ? 'var(--rose)' : 'var(--gold)' }}>{Math.round(pct)}%</span>
          </div>
          <div className="progress-bar">
            <div className={`progress-fill${overBudget ? ' over-budget' : ''}`} style={{ width: `${pct}%` }} />
          </div>
          {/* Status badges */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => {
              const count = items.filter(i => i.status === s.value).length
              return (
                <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
                  style={{
                    padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)',
                    background: filterStatus === s.value ? s.bg : 'transparent',
                    border: `1px solid ${filterStatus === s.value ? s.color : 'var(--border)'}`,
                    color: s.color, fontSize: '0.72rem', cursor: 'pointer',
                  }}>
                  {s.label}: {count}
                </button>
              )
            })}
            {filterStatus !== 'all' && (
              <button onClick={() => setFilterStatus('all')} style={{ background: 'transparent', border: 'none', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                × Hapus filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>Belum ada item</p>
          <p style={{ fontSize: '0.875rem' }}>Tambahkan item budget pernikahanmu</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(grouped).map(([cat, its]) => {
            const catBudget    = its.reduce((s, i) => s + (i.budget    || 0), 0)
            const catRealisasi = its.reduce((s, i) => s + (i.realisasi || 0), 0)
            const catSisa      = its.reduce((s, i) => s + Math.max((i.realisasi || 0) - (i.dp_lunas || 0), 0), 0)
            const isOpen = !collapsed[cat]

            return (
              <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button onClick={() => toggle(cat)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem 1.25rem', background: 'transparent', border: 'none', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>{cat}</span>
                    <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{its.length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.82rem', color: catRealisasi > catBudget ? 'var(--rose)' : 'var(--gold)', fontWeight: 500 }}>
                        {formatRp(catRealisasi)}
                      </p>
                      {catSisa > 0 && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--rose)' }}>sisa {formatRp(catSisa)}</p>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border-light)' }}>
                    {/* Col headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 100px 100px 80px 100px 100px 36px 36px',
                      gap: '0.4rem', padding: '0.5rem 1.25rem',
                      background: 'var(--bg-elevated)', fontSize: '0.65rem',
                      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                      overflowX: 'auto',
                    }}>
                      <span>Nama</span>
                      <span>Status</span>
                      <span style={{ textAlign: 'right' }}>Budget</span>
                      <span style={{ textAlign: 'right' }}>Realisasi</span>
                      <span style={{ textAlign: 'right' }}>DP/Lunas</span>
                      <span style={{ textAlign: 'right' }}>Sisa</span>
                      <span>Tgl Bayar</span>
                      <span /><span />
                    </div>

                    {its.map((item, idx) => {
                      const st   = STATUS_OPTIONS.find(s => s.value === item.status) || STATUS_OPTIONS[0]
                      const sisa = Math.max((item.realisasi || 0) - (item.dp_lunas || 0), 0)
                      const over = (item.realisasi || 0) > (item.budget || 0) && item.budget > 0
                      return (
                        <div key={item.id} style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 80px 100px 100px 80px 100px 100px 36px 36px',
                          gap: '0.4rem', padding: '0.75rem 1.25rem', alignItems: 'center',
                          borderTop: idx > 0 ? '1px solid var(--border-light)' : undefined,
                          transition: 'background 0.15s',
                          overflowX: 'auto',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</p>
                            {item.vendor && <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.1rem' }}>{item.vendor}</p>}
                          </div>
                          <button onClick={() => handleStatusCycle(item)} style={{
                            padding: '0.22rem 0.45rem', borderRadius: 'var(--radius-sm)',
                            background: st.bg, border: 'none', color: st.color,
                            fontSize: '0.7rem', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
                          }}>{st.label}</button>
                          <p style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{formatRp(item.budget)}</p>
                          <p style={{ textAlign: 'right', fontSize: '0.82rem', color: over ? 'var(--rose)' : 'var(--text-secondary)', fontWeight: over ? 500 : 400 }}>{formatRp(item.realisasi)}</p>
                          <p style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--sage)' }}>{formatRp(item.dp_lunas)}</p>
                          <p style={{ textAlign: 'right', fontSize: '0.82rem', color: sisa > 0 ? 'var(--rose)' : 'var(--text-faint)', fontWeight: sisa > 0 ? 500 : 400 }}>
                            {sisa > 0 ? formatRp(sisa) : '—'}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                            {item.payment_date ? new Date(item.payment_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—'}
                          </p>
                          <button onClick={() => { setEditItem(item); setShowModal(true) }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--rose)', padding: '0.25rem' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    })}

                    {/* Category totals */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 80px 100px 100px 80px 100px 100px 36px 36px',
                      gap: '0.4rem', padding: '0.625rem 1.25rem',
                      background: 'var(--accent-bg)', borderTop: '1px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total</span>
                      <span />
                      <span style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatRp(catBudget)}</span>
                      <span style={{ textAlign: 'right', fontSize: '0.8rem', color: catRealisasi > catBudget ? 'var(--rose)' : 'var(--gold)', fontWeight: 500 }}>{formatRp(catRealisasi)}</span>
                      <span />
                      <span style={{ textAlign: 'right', fontSize: '0.8rem', color: catSisa > 0 ? 'var(--rose)' : 'var(--text-faint)' }}>{catSisa > 0 ? formatRp(catSisa) : '—'}</span>
                      <span /><span /><span />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Grand total */}
          <div className="card" style={{ background: 'var(--accent-bg)' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(4, 1fr)',
              gap: '1rem',
            }}>
              {[
                { label: 'Total Budget',    value: formatRp(totalBudget),    color: 'var(--text-primary)' },
                { label: 'Total Realisasi', value: formatRp(totalRealisasi), color: overBudget ? 'var(--rose)' : 'var(--gold)' },
                { label: 'Total DP/Lunas',  value: formatRp(totalDpLunas),   color: 'var(--sage)' },
                { label: 'Sisa Total',      value: formatRp(totalSisa),      color: totalSisa > 0 ? 'var(--rose)' : 'var(--text-muted)' },
              ].map(c => (
                <div key={c.label} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{c.label}</p>
                  <p style={{ fontSize: '0.95rem', color: c.color, fontWeight: 600, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <WeddingBudgetModal item={editItem} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null) }} loading={loading} />
      )}
    </div>
  )
}

function WeddingBudgetModal({ item, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    category:     item?.category     || CATEGORIES[0],
    name:         item?.name         || '',
    status:       item?.status       || 'belum',
    vendor:       item?.vendor       || '',
    budget:       item?.budget       || 0,
    realisasi:    item?.realisasi    || 0,
    dp_lunas:     item?.dp_lunas     || 0,
    payment_date: item?.payment_date || '',
    notes:        item?.notes        || '',
  })
  const [budgetInput,    setBudgetInput]    = useState(toLocaleRp(form.budget))
  const [realisasiInput, setRealisasiInput] = useState(toLocaleRp(form.realisasi))
  const [dpLunasInput,   setDpLunasInput]   = useState(toLocaleRp(form.dp_lunas))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const rpInput = (val, setter) =>
    val.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nama item wajib diisi'); return }
    onSave({
      ...form,
      budget:    parseRp(budgetInput),
      realisasi: parseRp(realisasiInput),
      dp_lunas:  parseRp(dpLunasInput),
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            {item ? 'Edit Item Budget' : 'Tambah Item Budget'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <FormRow label="Kategori">
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormRow>
            <FormRow label="Status">
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormRow>
          </div>
          <FormRow label="Nama Item">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="cth: Rias pengantin set baju" />
          </FormRow>
          <FormRow label="Vendor / Kontak">
            <input className="input" value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Nama vendor atau no. HP" />
          </FormRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <FormRow label="Budget">
              <input className="input" value={budgetInput} onChange={e => setBudgetInput(rpInput(e.target.value))} placeholder="0" />
            </FormRow>
            <FormRow label="Realisasi">
              <input className="input" value={realisasiInput} onChange={e => setRealisasiInput(rpInput(e.target.value))} placeholder="0" />
            </FormRow>
            <FormRow label="DP / Lunas">
              <input className="input" value={dpLunasInput} onChange={e => setDpLunasInput(rpInput(e.target.value))} placeholder="0" />
            </FormRow>
          </div>
          <FormRow label="Tanggal Pembayaran">
            <input type="date" className="input" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} />
          </FormRow>
          <FormRow label="Keterangan">
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Catatan..." style={{ resize: 'vertical' }} />
          </FormRow>

          {/* Sisa preview */}
          {(parseRp(realisasiInput) > 0 || parseRp(dpLunasInput) > 0) && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-bg)', border: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sisa Pembayaran</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--rose)' }}>
                {formatRp(Math.max(parseRp(realisasiInput) - parseRp(dpLunasInput), 0))}
              </span>
            </div>
          )}
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
