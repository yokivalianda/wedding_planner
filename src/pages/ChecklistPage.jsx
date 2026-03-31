import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2, X, Check, Calendar } from 'lucide-react'
import { useAppStore } from '../store'
import {
  getChecklistItems, addChecklistItem,
  toggleChecklistItem, deleteChecklistItem
} from '../lib/supabase'
import { format, isPast, differenceInDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import toast from 'react-hot-toast'

const CHECKLIST_CATEGORIES = [
  'Venue & Katering', 'Busana', 'Dekorasi', 'Dokumentasi',
  'Undangan', 'Hiburan', 'Legal & Administratif', 'Persiapan Keluarga', 'Lain-lain'
]

const PRIORITIES = [
  { value: 'high',   label: 'Tinggi', color: 'var(--rose)' },
  { value: 'medium', label: 'Sedang', color: 'var(--gold)' },
  { value: 'low',    label: 'Rendah', color: 'var(--sage)' },
]

const TEMPLATE_ITEMS = [
  { category: 'Venue & Katering', title: 'Survey dan booking gedung', priority: 'high', days_before: 365 },
  { category: 'Venue & Katering', title: 'Taste test menu katering', priority: 'high', days_before: 180 },
  { category: 'Busana', title: 'Survey gaun pengantin', priority: 'high', days_before: 270 },
  { category: 'Busana', title: 'Fitting gaun tahap pertama', priority: 'medium', days_before: 90 },
  { category: 'Dokumentasi', title: 'Book fotografer & videografer', priority: 'high', days_before: 300 },
  { category: 'Dokumentasi', title: 'Sesi foto prewedding', priority: 'medium', days_before: 90 },
  { category: 'Undangan', title: 'Finalisasi desain undangan', priority: 'medium', days_before: 60 },
  { category: 'Undangan', title: 'Kirim undangan', priority: 'high', days_before: 30 },
  { category: 'Legal & Administratif', title: 'Urus surat nikah ke KUA', priority: 'high', days_before: 90 },
  { category: 'Hiburan', title: 'Book band / DJ / hiburan', priority: 'medium', days_before: 120 },
]

export default function ChecklistPage() {
  const { wedding, checklistItems, setChecklistItems,
          addChecklistItem: addItem, toggleChecklistItem: toggleItem, removeChecklistItem } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [filterDone, setFilterDone] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!wedding?.id) return
    getChecklistItems(wedding.id).then(setChecklistItems)
  }, [wedding?.id])

  const filtered = useMemo(() => checklistItems.filter(item => {
    const matchCat  = filterCat  === 'all' || item.category === filterCat
    const matchDone = filterDone === 'all' || (filterDone === 'done' ? item.is_done : !item.is_done)
    return matchCat && matchDone
  }), [checklistItems, filterCat, filterDone])

  const grouped = CHECKLIST_CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(i => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})
  const otherFiltered = filtered.filter(i => !CHECKLIST_CATEGORIES.includes(i.category))
  if (otherFiltered.length) grouped['Lain-lain'] = [...(grouped['Lain-lain'] || []), ...otherFiltered]

  const total = checklistItems.length
  const done  = checklistItems.filter(i => i.is_done).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const handleToggle = async (item) => {
    try {
      await toggleChecklistItem(item.id, !item.is_done)
      toggleItem(item.id, !item.is_done)
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus tugas ini?')) return
    try {
      await deleteChecklistItem(id)
      removeChecklistItem(id)
      toast.success('Tugas dihapus')
    } catch (err) { toast.error(err.message) }
  }

  const handleAdd = async (formData) => {
    setLoading(true)
    try {
      const newItem = await addChecklistItem({ ...formData, wedding_id: wedding.id })
      addItem(newItem)
      toast.success('Tugas ditambahkan')
      setShowModal(false)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const handleLoadTemplate = async () => {
    if (!confirm(`Tambahkan ${TEMPLATE_ITEMS.length} tugas dari template?`)) return
    setLoading(true)
    try {
      const weddingDate = wedding?.wedding_date ? new Date(wedding.wedding_date) : null
      for (const t of TEMPLATE_ITEMS) {
        const due_date = weddingDate
          ? new Date(weddingDate.getTime() - t.days_before * 86400000).toISOString().split('T')[0]
          : null
        const newItem = await addChecklistItem({
          wedding_id: wedding.id, category: t.category, title: t.title, priority: t.priority, due_date,
        })
        addItem(newItem)
      }
      toast.success(`${TEMPLATE_ITEMS.length} tugas dari template berhasil ditambahkan!`)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const usedCategories = [...new Set(checklistItems.map(i => i.category))]

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>Persiapan</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>Checklist</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          {checklistItems.length === 0 && (
            <button className="btn btn-ghost" onClick={handleLoadTemplate} disabled={loading}>✨ Muat Template</button>
          )}
          <button className="btn btn-gold" onClick={() => setShowModal(true)}><Plus size={16} /> Tambah Tugas</button>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--gold-light)' }}>Progress Persiapan</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{done} dari {total} tugas selesai</p>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `conic-gradient(var(--gold) ${pct * 3.6}deg, var(--bg-input) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--gold)' }}>{pct}%</span>
            </div>
          </div>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg, var(--sage), #a0c8a3)' : undefined }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select className="input" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Semua Kategori</option>
          {usedCategories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input" style={{ width: 'auto' }} value={filterDone} onChange={e => setFilterDone(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="todo">Belum Selesai</option>
          <option value="done">Sudah Selesai</option>
        </select>
      </div>

      {/* Items */}
      {checklistItems.length === 0 ? (
        <EmptyState onTemplate={handleLoadTemplate} onAdd={() => setShowModal(true)} loading={loading} />
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)', fontSize: '0.875rem' }}>Tidak ada tugas yang sesuai filter</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([cat, items]) => {
            const catDone = items.filter(i => i.is_done).length
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--gold-light)' }}>{cat}</h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{catDone}/{items.length}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {items.sort((a, b) => {
                    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1
                    const pp = { high: 0, medium: 1, low: 2 }
                    return (pp[a.priority] || 1) - (pp[b.priority] || 1)
                  }).map(item => {
                    const priority = PRIORITIES.find(p => p.value === item.priority) || PRIORITIES[1]
                    const isOverdue = item.due_date && !item.is_done && isPast(new Date(item.due_date))
                    const daysLeft  = item.due_date ? differenceInDays(new Date(item.due_date), new Date()) : null
                    const urgent    = daysLeft !== null && daysLeft <= 7 && !item.is_done

                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '0.875rem 1rem',
                        background: item.is_done ? 'var(--bg-hover)' : 'var(--bg-card)',
                        border: `1px solid ${isOverdue ? 'var(--rose-bg)' : 'var(--border-light)'}`,
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--duration) var(--ease)',
                        opacity: item.is_done ? 0.55 : 1,
                        boxShadow: 'var(--shadow-sm)',
                      }}>
                        <button onClick={() => handleToggle(item)} style={{
                          width: 22, height: 22, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                          border: item.is_done ? '1.5px solid var(--sage)' : `1.5px solid ${priority.color}`,
                          background: item.is_done ? 'var(--sage)' : 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all var(--duration) var(--ease)', opacity: item.is_done ? 1 : 0.6,
                        }}>
                          {item.is_done && <Check size={12} color="white" strokeWidth={2.5} />}
                        </button>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textDecoration: item.is_done ? 'line-through' : 'none' }}>{item.title}</p>
                          {item.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '0.1rem' }}>{item.notes}</p>}
                        </div>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: priority.color, flexShrink: 0, opacity: 0.7 }} title={priority.label} />
                        {item.due_date && (
                          <span style={{ fontSize: '0.72rem', color: isOverdue ? 'var(--rose)' : urgent ? 'var(--gold)' : 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                            <Calendar size={10} />
                            {isOverdue ? 'Terlambat' : daysLeft === 0 ? 'Hari ini' : `${daysLeft}h`}
                          </span>
                        )}
                        <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-faint)', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
                        ><Trash2 size={13} /></button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <ChecklistModal onSave={handleAdd} onClose={() => setShowModal(false)} loading={loading} />}
    </div>
  )
}

function ChecklistModal({ onSave, onClose, loading }) {
  const [form, setForm] = useState({ category: CHECKLIST_CATEGORIES[0], title: '', notes: '', due_date: '', priority: 'medium' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Tambah Tugas</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormField label="Judul Tugas"><input className="input" placeholder="cth: Book gedung resepsi" value={form.title} onChange={set('title')} required autoFocus /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Kategori"><select className="input" value={form.category} onChange={set('category')}>{CHECKLIST_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="Prioritas"><select className="input" value={form.priority} onChange={set('priority')}>{PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></FormField>
          </div>
          <FormField label="Tenggat Waktu"><input className="input" type="date" value={form.due_date} onChange={set('due_date')} /></FormField>
          <FormField label="Catatan"><textarea className="input" rows={2} placeholder="Catatan..." value={form.notes} onChange={set('notes')} style={{ resize: 'vertical' }} /></FormField>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-gold" disabled={loading}>{loading ? 'Menyimpan...' : 'Tambah Tugas'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (<div><label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{label}</label>{children}</div>)
}

function EmptyState({ onTemplate, onAdd, loading }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.75rem', color: 'var(--gold-light)', marginBottom: '0.5rem' }}>Mulai dari template?</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', marginBottom: '2rem', maxWidth: 360, margin: '0 auto 2rem' }}>Kami punya checklist pernikahan standar yang bisa langsung kamu gunakan.</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn btn-gold" onClick={onTemplate} disabled={loading}>✨ Muat Template ({TEMPLATE_ITEMS.length} tugas)</button>
        <button className="btn btn-ghost" onClick={onAdd}><Plus size={14} /> Buat Sendiri</button>
      </div>
    </div>
  )
}
