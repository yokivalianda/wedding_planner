import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, X, FileText, CheckSquare, Square } from 'lucide-react'
import { useAppStore } from '../store'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const DEFAULT_DOCS = [
  'Pendaftaran KUA',
  'FC KTP calon pengantin',
  'FC KTP ke dua orangtua',
  'FC KK (Kartu Keluarga)',
  'FC buku nikah orangtua',
  'FC akta kelahiran',
  'FC ijazah terakhir',
  'FC KTP saksi pihak',
  'Materai 10.000',
  'Pas foto ukuran 2x3, 3x4 dan 4x6 background biru',
  'Surat pengantar dari RT/RW',
  'Surat keterangan sehat',
  'Surat izin orang tua (jika diperlukan)',
  'N1 - Surat Pengantar Nikah',
  'N2 - Surat Pernyataan Bujang/Gadis',
  'N4 - Surat Keterangan Orang Tua',
]

function formatRp(val) {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
function parseRp(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0 }
function toLocaleRp(val) { return val ? Number(val).toLocaleString('id-ID') : '' }

const getItems   = async (wid) => {
  const { data, error } = await supabase.from('admin_documents').select('*').eq('wedding_id', wid).order('sort_order').order('created_at')
  if (error) throw error; return data
}
const addItem    = async (item) => {
  const { data, error } = await supabase.from('admin_documents').insert(item).select().single()
  if (error) throw error; return data
}
const updateItem = async (id, updates) => {
  const { data, error } = await supabase.from('admin_documents').update(updates).eq('id', id).select().single()
  if (error) throw error; return data
}
const deleteItem = async (id) => {
  const { error } = await supabase.from('admin_documents').delete().eq('id', id)
  if (error) throw error
}

export default function AdminPage() {
  const { wedding } = useAppStore()
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState(null)

  useEffect(() => {
    if (!wedding?.id) return
    getItems(wedding.id).then(setItems).catch(() => {
      toast('Jalankan SQL migration dulu untuk mengaktifkan fitur Administrasi.', { icon: '⚠️' })
    })
  }, [wedding?.id])

  const groomDone  = items.filter(i => i.done_groom).length
  const brideDone  = items.filter(i => i.done_bride).length
  const bothDone   = items.filter(i => i.done_groom && i.done_bride).length
  const totalCost  = items.reduce((s, i) => s + (i.price || 0), 0)

  const handleToggle = async (item, field) => {
    try {
      const updated = await updateItem(item.id, { [field]: !item[field] })
      setItems(prev => prev.map(i => i.id === item.id ? updated : i))
    } catch (e) { toast.error(e.message) }
  }

  const handleSave = async (form) => {
    if (!wedding?.id) return
    setLoading(true)
    try {
      const payload = { ...form, wedding_id: wedding.id }
      if (editItem) {
        const updated = await updateItem(editItem.id, payload)
        setItems(prev => prev.map(i => i.id === editItem.id ? updated : i))
        toast.success('Dokumen diperbarui')
      } else {
        const created = await addItem({ ...payload, sort_order: items.length })
        setItems(prev => [...prev, created])
        toast.success('Dokumen ditambahkan')
      }
      setShowModal(false); setEditItem(null)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus dokumen ini?')) return
    try {
      await deleteItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Dokumen dihapus')
    } catch (e) { toast.error(e.message) }
  }

  const seedDefaults = async () => {
    if (!wedding?.id) return
    setLoading(true)
    try {
      const toAdd = DEFAULT_DOCS.map((name, idx) => ({
        wedding_id: wedding.id, name, sort_order: idx,
        done_groom: false, done_bride: false, price: 0,
      }))
      const { data, error } = await supabase.from('admin_documents').insert(toAdd).select()
      if (error) throw error
      setItems(prev => [...prev, ...data])
      toast.success('Dokumen default ditambahkan!')
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const groomName = wedding?.groom_name?.split(' ')[0] || 'Pria'
  const brideName = wedding?.bride_name?.split(' ')[0] || 'Wanita'

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>
            Dokumen Resmi
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--text-primary)', fontStyle: 'italic' }}>
            Administrasi Pernikahan
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
          { label: `${groomName}`,         value: `${groomDone}/${items.length}`,  sub: 'dokumen selesai',  color: 'var(--gold)' },
          { label: `${brideName}`,          value: `${brideDone}/${items.length}`,  sub: 'dokumen selesai',  color: 'var(--rose)' },
          { label: 'Selesai Berdua',        value: `${bothDone}/${items.length}`,   sub: 'dokumen lengkap',  color: 'var(--sage)' },
          { label: 'Estimasi Biaya',        value: formatRp(totalCost),             sub: 'total administrasi', color: 'var(--text-primary)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>{c.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: c.color, fontStyle: 'italic' }}>{c.value}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '0.2rem' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      {items.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: groomName, pct: items.length ? (groomDone / items.length) * 100 : 0, color: 'var(--gold)' },
            { label: brideName, pct: items.length ? (brideDone / items.length) * 100 : 0, color: 'var(--rose)' },
          ].map(p => (
            <div key={p.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.label}</span>
                <span style={{ fontSize: '0.8rem', color: p.color }}>{Math.round(p.pct)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}88)` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents table */}
      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>
          <FileText size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            Belum ada dokumen
          </p>
          <p style={{ fontSize: '0.875rem' }}>Klik "Isi Default" untuk template dokumen KUA standar</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Head */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 60px 60px 110px 36px 36px',
            gap: '0.5rem', padding: '0.625rem 1.25rem',
            background: 'var(--bg-elevated)', fontSize: '0.7rem',
            color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>#</span>
            <span>Dokumen</span>
            <span style={{ textAlign: 'center' }}>{groomName}</span>
            <span style={{ textAlign: 'center' }}>{brideName}</span>
            <span style={{ textAlign: 'right' }}>Biaya</span>
            <span /><span />
          </div>

          {items.map((item, idx) => {
            const allDone = item.done_groom && item.done_bride
            return (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 60px 60px 110px 36px 36px',
                gap: '0.5rem', padding: '0.75rem 1.25rem', alignItems: 'center',
                borderTop: '1px solid var(--border-light)',
                background: allDone ? 'var(--sage-bg)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textAlign: 'center' }}>{idx + 1}</span>
                <div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: allDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: allDone ? 'line-through' : 'none',
                  }}>{item.name}</p>
                  {item.notes && <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.1rem', fontStyle: 'italic' }}>{item.notes}</p>}
                </div>

                {/* Groom checkbox */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => handleToggle(item, 'done_groom')} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: item.done_groom ? 'var(--gold)' : 'var(--text-faint)',
                    padding: '0.25rem',
                  }}>
                    {item.done_groom ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </div>

                {/* Bride checkbox */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => handleToggle(item, 'done_bride')} style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: item.done_bride ? 'var(--rose)' : 'var(--text-faint)',
                    padding: '0.25rem',
                  }}>
                    {item.done_bride ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </div>

                <p style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {item.price > 0 ? formatRp(item.price) : '—'}
                </p>
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

          {/* Footer */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 60px 60px 110px 36px 36px',
            gap: '0.5rem', padding: '0.75rem 1.25rem',
            background: 'var(--accent-bg)', borderTop: '1px solid var(--border)',
          }}>
            <span /><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>TOTAL BIAYA</span>
            <span /><span />
            <span style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600 }}>{formatRp(totalCost)}</span>
            <span /><span />
          </div>
        </div>
      )}

      {showModal && (
        <AdminModal item={editItem} onSave={handleSave} onClose={() => { setShowModal(false); setEditItem(null) }} loading={loading} />
      )}
    </div>
  )
}

function AdminModal({ item, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name:       item?.name       || '',
    price:      item?.price      || 0,
    done_groom: item?.done_groom || false,
    done_bride: item?.done_bride || false,
    notes:      item?.notes      || '',
  })
  const [priceInput, setPriceInput] = useState(toLocaleRp(form.price))
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error('Nama dokumen wajib diisi'); return }
    onSave({ ...form, price: parseRp(priceInput) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontStyle: 'italic', color: 'var(--gold-light)' }}>
            {item ? 'Edit Dokumen' : 'Tambah Dokumen'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormRow label="Nama Dokumen">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="cth: FC KTP calon pengantin" />
          </FormRow>
          <FormRow label="Estimasi Biaya">
            <input className="input" value={priceInput}
              onChange={e => setPriceInput(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
              placeholder="0" />
          </FormRow>
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
