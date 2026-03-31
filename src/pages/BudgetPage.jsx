import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, X, Check, Download, BarChart2 } from 'lucide-react'
import { useAppStore } from '../store'
import BudgetChart from '../components/ui/BudgetChart'
import { exportBudgetExcel } from '../lib/export'
import {
  getBudgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem
} from '../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Venue & Katering', 'Busana', 'Dekorasi & Bunga', 'Dokumentasi',
  'Hiburan', 'Undangan', 'Perhiasan', 'Transport', 'Bulan Madu', 'Lain-lain'
]

function formatRp(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function parseRp(str) {
  return parseInt(str.replace(/\D/g, ''), 10) || 0
}

export default function BudgetPage() {
  const { wedding, budgetItems, setBudgetItems,
          addBudgetItem: addItem, updateBudgetItem: updateItem, removeBudgetItem } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [showChart, setShowChart] = useState(true)
  const [loading, setLoading]     = useState(false)

  const handleExportExcel = () => exportBudgetExcel(budgetItems, wedding).catch(e => toast.error(e.message))

  useEffect(() => {
    if (!wedding?.id) return
    getBudgetItems(wedding.id).then(setBudgetItems)
  }, [wedding?.id])

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = budgetItems.filter(i => i.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})
  const otherItems = budgetItems.filter(i => !CATEGORIES.includes(i.category))
  if (otherItems.length) grouped['Lain-lain'] = [...(grouped['Lain-lain'] || []), ...otherItems]

  const totalBudget   = wedding?.budget_total || 0
  const totalEstimate = budgetItems.reduce((s, i) => s + (i.estimated || 0), 0)
  const totalActual   = budgetItems.reduce((s, i) => s + (i.actual || 0), 0)
  const totalPaid     = budgetItems.reduce((s, i) => s + (i.paid || 0), 0)
  const remaining     = totalBudget - totalActual
  const pct           = totalBudget > 0 ? Math.min((totalActual / totalBudget) * 100, 100) : 0
  const overBudget    = totalActual > totalBudget

  const handleSave = async (formData) => {
    setLoading(true)
    try {
      if (editItem) {
        const updated = await updateBudgetItem(editItem.id, formData)
        updateItem(editItem.id, updated)
        toast.success('Item diperbarui')
      } else {
        const newItem = await addBudgetItem({ ...formData, wedding_id: wedding.id })
        addItem(newItem)
        toast.success('Item ditambahkan')
      }
      setShowModal(false)
      setEditItem(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus item ini?')) return
    try {
      await deleteBudgetItem(id)
      removeBudgetItem(id)
      toast.success('Item dihapus')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const toggleCollapse = (cat) => {
    setCollapsed(s => ({ ...s, [cat]: !s[cat] }))
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>
            Perencanaan
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            Budget
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {budgetItems.length > 0 && (
            <>
              <button className="btn btn-ghost" onClick={() => setShowChart(s => !s)}>
                <BarChart2 size={15} /> {showChart ? 'Sembunyikan Chart' : 'Tampilkan Chart'}
              </button>
              <button className="btn btn-ghost" onClick={handleExportExcel}>
                <Download size={15} /> Export Excel
              </button>
            </>
          )}
          <button className="btn btn-gold" onClick={() => { setEditItem(null); setShowModal(true) }}>
            <Plus size={16} /> Tambah Item
          </button>
        </div>
      </div>

      {/* Chart */}
      {showChart && budgetItems.length > 0 && (
        <BudgetChart budgetItems={budgetItems} totalBudget={totalBudget} />
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Budget', value: formatRp(totalBudget), accent: 'var(--text-primary)' },
          { label: 'Total Estimasi', value: formatRp(totalEstimate), accent: 'var(--gold)' },
          { label: 'Total Aktual', value: formatRp(totalActual), accent: overBudget ? 'var(--rose)' : 'var(--gold)' },
          { label: 'Sudah Dibayar', value: formatRp(totalPaid), accent: 'var(--sage)' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: accent, fontWeight: 500 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Serapan Budget</span>
          <span style={{ fontSize: '0.875rem', color: overBudget ? 'var(--rose)' : 'var(--gold)', fontWeight: 500 }}>
            {Math.round(pct)}% {overBudget && '⚠ Melebihi budget!'}
          </span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className={`progress-fill${overBudget ? ' over-budget' : ''}`} style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Rp 0</span>
          <span style={{ fontSize: '0.75rem', color: remaining < 0 ? 'var(--rose)' : 'var(--text-faint)' }}>
            {remaining < 0 ? `Kelebihan ${formatRp(Math.abs(remaining))}` : `Sisa ${formatRp(remaining)}`}
          </span>
        </div>
      </div>

      {/* Items by category */}
      {Object.keys(grouped).length === 0 ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(grouped).map(([cat, items]) => {
            const catEst    = items.reduce((s, i) => s + (i.estimated || 0), 0)
            const catActual = items.reduce((s, i) => s + (i.actual || 0), 0)
            const catPct    = catEst > 0 ? Math.min((catActual / catEst) * 100, 100) : 0
            const catOver   = catActual > catEst && catEst > 0
            const open      = !collapsed[cat]

            return (
              <div key={cat} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => toggleCollapse(cat)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem' }}>
                        {cat}
                      </span>
                      <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
                        {items.length} item
                      </span>
                      {catOver && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Over budget</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Est: {formatRp(catEst)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: catOver ? 'var(--rose)' : 'var(--gold)' }}>
                        Aktual: {formatRp(catActual)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 80 }}>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className={`progress-fill${catOver ? ' over-budget' : ''}`} style={{ width: `${catPct}%` }} />
                      </div>
                    </div>
                    {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </button>

                {open && (
                  <div>
                    <div style={{ borderTop: '1px solid var(--border-light)' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 140px 140px 140px 90px',
                        padding: '0.5rem 1.5rem',
                        background: 'var(--bg-hover)',
                      }}>
                        {['Nama', 'Estimasi', 'Aktual', 'Dibayar', ''].map(h => (
                          <span key={h} style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)' }}>
                            {h}
                          </span>
                        ))}
                      </div>

                      {items.map((item) => {
                        const itemOver = item.actual > item.estimated && item.estimated > 0
                        return (
                          <div key={item.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 140px 140px 140px 90px',
                            padding: '0.75rem 1.5rem',
                            borderTop: '1px solid var(--border-light)',
                            alignItems: 'center',
                            transition: 'background var(--duration)',
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</p>
                              {item.vendor && (
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{item.vendor}</p>
                              )}
                            </div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {formatRp(item.estimated)}
                            </span>
                            <span style={{ fontSize: '0.875rem', color: itemOver ? 'var(--rose)' : 'var(--text-primary)' }}>
                              {formatRp(item.actual)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.875rem', color: 'var(--sage)' }}>
                                {formatRp(item.paid)}
                              </span>
                              {item.paid > 0 && item.paid >= item.actual && (
                                <Check size={12} color="var(--sage)" />
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                              <button
                                className="btn"
                                onClick={() => { setEditItem(item); setShowModal(true) }}
                                style={{
                                  background: 'none', border: 'none',
                                  padding: '0.25rem 0.5rem',
                                  color: 'var(--text-muted)',
                                  transition: 'color var(--duration)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                className="btn"
                                onClick={() => handleDelete(item.id)}
                                style={{
                                  background: 'none', border: 'none',
                                  padding: '0.25rem 0.5rem',
                                  color: 'var(--text-faint)',
                                  transition: 'color var(--duration)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <BudgetModal
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          loading={loading}
        />
      )}
    </div>
  )
}

function BudgetModal({ item, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    category: item?.category || CATEGORIES[0],
    name: item?.name || '',
    estimated: item?.estimated || '',
    actual: item?.actual || '',
    paid: item?.paid || '',
    vendor: item?.vendor || '',
    notes: item?.notes || '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      estimated: parseRp(String(form.estimated)),
      actual:    parseRp(String(form.actual)),
      paid:      parseRp(String(form.paid)),
    })
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {item ? 'Edit Item' : 'Tambah Item Budget'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Kategori">
              <select className="input" value={form.category} onChange={set('category')} required>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Nama Item">
              <input className="input" placeholder="cth: Gedung resepsi" value={form.name} onChange={set('name')} required />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <FormField label="Estimasi (Rp)">
              <input className="input" placeholder="0" value={form.estimated} onChange={set('estimated')} />
            </FormField>
            <FormField label="Aktual (Rp)">
              <input className="input" placeholder="0" value={form.actual} onChange={set('actual')} />
            </FormField>
            <FormField label="Dibayar (Rp)">
              <input className="input" placeholder="0" value={form.paid} onChange={set('paid')} />
            </FormField>
          </div>

          <FormField label="Vendor / Penyedia">
            <input className="input" placeholder="Nama vendor (opsional)" value={form.vendor} onChange={set('vendor')} />
          </FormField>

          <FormField label="Catatan">
            <textarea
              className="input" rows={2}
              placeholder="Catatan tambahan..."
              value={form.notes} onChange={set('notes')}
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-gold" disabled={loading}>
              {loading ? 'Menyimpan...' : item ? 'Perbarui' : 'Tambah'}
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
      <label style={{
        display: 'block',
        fontSize: '0.75rem', textTransform: 'uppercase',
        letterSpacing: '0.06em', color: 'var(--text-muted)',
        marginBottom: '0.375rem',
      }}>{label}</label>
      {children}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem 2rem',
      border: '1px dashed var(--border)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.5rem', color: 'var(--gold-light)', marginBottom: '0.5rem' }}>
        Belum ada item budget
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', marginBottom: '1.5rem' }}>
        Mulai dengan menambahkan kategori pengeluaran pernikahanmu
      </p>
      <button className="btn btn-gold" onClick={onAdd}>
        <Plus size={16} /> Tambah Item Pertama
      </button>
    </div>
  )
}
