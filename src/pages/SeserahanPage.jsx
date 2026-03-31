import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Edit3, X, ExternalLink, ShoppingCart, Check,
         Gift, PiggyBank, Camera, ImageOff, AlertCircle, Search } from 'lucide-react'
import { useAppStore } from '../store'
import {
  getSeserahanItems, addSeserahanItem, updateSeserahanItem,
  deleteSeserahanItem, uploadSeserahanImage, deleteSeserahanImage
} from '../lib/supabase'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Perhiasan', 'Pakaian', 'Perlengkapan Sholat',
  'Kosmetik & Perawatan', 'Makanan & Minuman',
  'Perlengkapan Rumah', 'Elektronik', 'Uang', 'Lain-lain'
]

function formatRp(val) {
  if (!val) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(val)
}
function parseRp(str) { return parseInt(String(str).replace(/\D/g, ''), 10) || 0 }
function toLocaleRp(val) { return val ? Number(val).toLocaleString('id-ID') : '' }

export default function SeserahanPage() {
  const {
    wedding, updateWedding,
    seserahanItems, setSeserahanItems,
    addSeserahanItem: addItem, updateSeserahanItem: updateItem, removeSeserahanItem
  } = useAppStore()

  const [showModal, setShowModal]     = useState(false)
  const [editItem,  setEditItem]      = useState(null)
  const [filterCat, setFilterCat]     = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search,    setSearch]        = useState('')
  const [loading,   setLoading]       = useState(false)
  const [savingFund, setSavingFund]   = useState(false)
  const [fundInput, setFundInput]     = useState(toLocaleRp(wedding?.seserahan_fund || 0))

  /* ---------- fetch items ---------- */
  useEffect(() => {
    if (!wedding?.id) return
    getSeserahanItems(wedding.id)
      .then(setSeserahanItems)
      .catch(() => {
        // Table may not exist yet — silently ignore
        toast('Jalankan SQL migration dulu di Supabase untuk mengaktifkan fitur ini.', {
          icon: '⚠️', duration: 6000,
        })
      })
  }, [wedding?.id])

  /* ---------- derived stats ---------- */
  const totalEstimate  = seserahanItems.reduce((s, i) => s + (i.estimated_price || 0), 0)
  const purchasedCount = seserahanItems.filter(i => i.is_purchased).length
  const purchasedTotal = seserahanItems.filter(i => i.is_purchased).reduce((s, i) => s + (i.estimated_price || 0), 0)
  const fund           = wedding?.seserahan_fund || 0
  const fundPct        = totalEstimate > 0 ? Math.min((fund / totalEstimate) * 100, 100) : 0

  /* ---------- filtered list ---------- */
  const filtered = seserahanItems.filter(item => {
    const matchCat    = filterCat    === 'all' || item.category === filterCat
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'done'    &&  item.is_purchased)
      || (filterStatus === 'pending' && !item.is_purchased)
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchStatus && matchSearch
  })

  /* ---------- grouped by category ---------- */
  const groupedItems = {}
  filtered.forEach(item => {
    const cat = item.category || 'Lain-lain'
    if (!groupedItems[cat]) groupedItems[cat] = []
    groupedItems[cat].push(item)
  })

  /* ---------- handlers ---------- */
  const handleSaveFund = async () => {
    setSavingFund(true)
    try {
      const val = parseRp(fundInput)
      const { data, error } = await supabase
        .from('weddings')
        .update({ seserahan_fund: val })
        .eq('id', wedding.id)
        .select()
        .single()
      if (error) throw error
      updateWedding(data)
      toast.success('Dana tabungan diperbarui')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingFund(false)
    }
  }

  const handleFundInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setFundInput(raw ? Number(raw).toLocaleString('id-ID') : '')
  }

  const handleTogglePurchased = async (item) => {
    try {
      const updated = await updateSeserahanItem(item.id, { is_purchased: !item.is_purchased })
      updateItem(item.id, updated)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm(`Hapus "${item.name}" dari daftar?`)) return
    try {
      if (item.image_url) await deleteSeserahanImage(item.image_url).catch(() => {})
      await deleteSeserahanItem(item.id)
      removeSeserahanItem(item.id)
      toast.success('Item dihapus')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSave = async (formData, imageFile) => {
    setLoading(true)
    try {
      let image_url = formData.image_url || null
      // Upload new image if selected
      if (imageFile) {
        if (editItem?.image_url) await deleteSeserahanImage(editItem.image_url).catch(() => {})
        image_url = await uploadSeserahanImage(imageFile, wedding.id)
      }
      const payload = { ...formData, image_url, wedding_id: wedding.id }

      if (editItem) {
        const updated = await updateSeserahanItem(editItem.id, payload)
        updateItem(editItem.id, updated)
        toast.success('Item diperbarui')
      } else {
        const newItem = await addSeserahanItem(payload)
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

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', marginBottom: '0.4rem' }}>
            Persiapan
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            Seserahan
          </h1>
        </div>
        <button
          className="btn btn-gold"
          onClick={() => { setEditItem(null); setShowModal(true) }}
          style={{ marginTop: '0.5rem' }}
        >
          <Plus size={16} /> Tambah Seserahan
        </button>
      </div>

      {/* ── DANA TABUNGAN CARD ── */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--accent-bg)', borderColor: 'var(--border-hover)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
            <PiggyBank size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.25rem', color: 'var(--gold-light)' }}>
              Dana Tabungan Seserahan
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total yang sudah disiapkan untuk membeli seserahan</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
              Dana Tersedia (Rp)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--gold)', opacity: 0.65, pointerEvents: 'none' }}>Rp</span>
              <input
                className="input"
                value={fundInput}
                onChange={handleFundInput}
                placeholder="0"
                style={{ paddingLeft: '2.5rem' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFund()}
              />
            </div>
          </div>
          <button
            className="btn btn-gold"
            onClick={handleSaveFund}
            disabled={savingFund}
            style={{ flexShrink: 0, height: 42 }}
          >
            {savingFund ? 'Menyimpan...' : <><Check size={14} /> Simpan</>}
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {formatRp(fund)} dari {formatRp(totalEstimate)} estimasi
            </span>
            <span style={{ fontSize: '0.78rem', color: fund >= totalEstimate ? 'var(--sage)' : 'var(--gold)', fontWeight: 500 }}>
              {Math.round(fundPct)}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div
              className="progress-fill"
              style={{
                width: `${fundPct}%`,
                background: fund >= totalEstimate
                  ? 'linear-gradient(90deg, var(--sage), #a0c8a3)'
                  : undefined
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Estimasi',  val: formatRp(totalEstimate), color: 'var(--text-primary)' },
              { label: 'Sudah Dibeli',    val: `${purchasedCount} item · ${formatRp(purchasedTotal)}`, color: 'var(--sage)' },
              { label: 'Sisa Dana',       val: formatRp(Math.max(fund - purchasedTotal, 0)), color: fund - purchasedTotal < 0 ? 'var(--rose)' : 'var(--gold)' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: '0.2rem' }}>{label}</p>
                <p style={{ fontSize: '0.9rem', color, fontWeight: 500 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SQL WARNING (if no items and no wedding) ── */}
      {!wedding?.id && (
        <div style={{ padding: '1rem 1.25rem', background: 'var(--rose-bg)', border: '1px solid var(--rose-bg)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <AlertCircle size={16} color="var(--rose)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Lengkapi pengaturan profil pernikahan terlebih dahulu agar bisa menyimpan data.
          </p>
        </div>
      )}

      {/* ── FILTER BAR ── */}
      {seserahanItems.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.5, pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Cari nama item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">Semua Kategori</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="pending">Belum Dibeli</option>
            <option value="done">Sudah Dibeli</option>
          </select>
        </div>
      )}

      {/* ── SUMMARY BADGES ── */}
      {seserahanItems.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span className="badge badge-muted">{seserahanItems.length} total item</span>
          <span className="badge badge-sage">{purchasedCount} sudah dibeli</span>
          <span className="badge badge-warn">{seserahanItems.length - purchasedCount} belum dibeli</span>
        </div>
      )}

      {/* ── ITEMS GRID ── */}
      {seserahanItems.length === 0 ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)', fontSize: '0.875rem' }}>
          Tidak ada item yang sesuai filter
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedItems).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--gold-light)' }}>
                  {cat}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                  {items.filter(i => i.is_purchased).length}/{items.length} dibeli
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem',
              }}>
                {items.map(item => (
                  <SeserahanCard
                    key={item.id}
                    item={item}
                    onToggle={() => handleTogglePurchased(item)}
                    onEdit={() => { setEditItem(item); setShowModal(true) }}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <SeserahanModal
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          loading={loading}
        />
      )}
    </div>
  )
}

/* ── SESERAHAN CARD ───────────────────────────────────────── */
function SeserahanCard({ item, onToggle, onEdit, onDelete }) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div className="card" style={{
      padding: 0,
      overflow: 'hidden',
      opacity: item.is_purchased ? 0.75 : 1,
      transition: 'all var(--duration) var(--ease)',
      position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      {/* Purchased overlay badge */}
      {item.is_purchased && (
        <div style={{
          position: 'absolute', top: '0.65rem', right: '0.65rem', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          background: 'var(--sage)', color: 'white',
          padding: '0.2rem 0.6rem', borderRadius: 999,
          fontSize: '0.7rem', fontWeight: 600,
        }}>
          <Check size={10} strokeWidth={2.5} /> Dibeli
        </div>
      )}

      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '16/9',
        background: 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-light)',
        position: 'relative',
      }}>
        {item.image_url && !imgErr ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-faint)' }}>
            <ImageOff size={28} />
            <span style={{ fontSize: '0.72rem' }}>Belum ada foto</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.95rem', fontWeight: 500,
              color: 'var(--text-primary)',
              textDecoration: item.is_purchased ? 'line-through' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{item.name}</p>
            <span className="badge badge-muted" style={{ fontSize: '0.68rem', marginTop: '0.25rem' }}>
              {item.category}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {formatRp(item.estimated_price)}
          </p>
        </div>

        {item.notes && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.notes}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
          {/* Purchased toggle */}
          <button
            onClick={onToggle}
            className="btn"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '0.45rem 0.75rem',
              background: item.is_purchased ? 'var(--sage-bg)' : 'var(--accent-bg)',
              border: `1px solid ${item.is_purchased ? 'var(--sage-bg)' : 'var(--border)'}`,
              color: item.is_purchased ? 'var(--sage)' : 'var(--text-muted)',
              fontSize: '0.78rem',
              gap: '0.35rem',
            }}
          >
            <Check size={12} />
            {item.is_purchased ? 'Sudah Dibeli' : 'Tandai Dibeli'}
          </button>

          {/* Shop link */}
          {item.shop_url && (
            <a
              href={item.shop_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                padding: '0.45rem 0.625rem',
                background: 'var(--accent-bg)',
                border: '1px solid var(--border)',
                color: 'var(--gold)',
                flexShrink: 0,
              }}
              title="Buka di toko"
            >
              <ShoppingCart size={13} />
            </a>
          )}

          <button
            onClick={onEdit}
            className="btn"
            style={{ padding: '0.45rem 0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Edit3 size={13} />
          </button>
          <button
            onClick={onDelete}
            className="btn"
            style={{ padding: '0.45rem 0.5rem', background: 'none', border: 'none', color: 'var(--text-faint)', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--rose)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── MODAL FORM ───────────────────────────────────────────── */
function SeserahanModal({ item, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name:            item?.name            || '',
    category:        item?.category        || CATEGORIES[0],
    estimated_price: item?.estimated_price ? toLocaleRp(item.estimated_price) : '',
    shop_url:        item?.shop_url        || '',
    image_url:       item?.image_url       || '',
    notes:           item?.notes           || '',
    is_purchased:    item?.is_purchased    || false,
  })
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(item?.image_url || null)
  const [shopDomain, setShopDomain]   = useState('')
  const fileRef = useRef()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Detect shop domain for badge display
  useEffect(() => {
    if (!form.shop_url) { setShopDomain(''); return }
    try {
      const url = new URL(form.shop_url.startsWith('http') ? form.shop_url : 'https://' + form.shop_url)
      const host = url.hostname.replace('www.', '')
      if (host.includes('tokopedia'))  setShopDomain('Tokopedia')
      else if (host.includes('shopee')) setShopDomain('Shopee')
      else if (host.includes('lazada')) setShopDomain('Lazada')
      else if (host.includes('bukalapak')) setShopDomain('Bukalapak')
      else if (host.includes('blibli')) setShopDomain('Blibli')
      else setShopDomain(host)
    } catch { setShopDomain('') }
  }, [form.shop_url])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 3MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setForm(f => ({ ...f, image_url: '' }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(
      { ...form, estimated_price: parseRp(form.estimated_price) },
      imageFile
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Gift size={18} color="var(--gold)" />
            <h2 className="modal-title" style={{ margin: 0 }}>
              {item ? 'Edit Seserahan' : 'Tambah Seserahan'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Image upload ── */}
          <div>
            <label style={labelStyle}>Foto Produk</label>
            <div
              style={{
                width: '100%', aspectRatio: '16/7',
                borderRadius: 'var(--radius-md)',
                border: `2px dashed ${imagePreview ? 'var(--border)' : 'var(--border-hover)'}`,
                background: 'var(--bg-input)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
                cursor: 'pointer',
                transition: 'border-color var(--duration)',
              }}
              onClick={() => !imagePreview && fileRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.75rem',
                    opacity: 0, transition: 'opacity var(--duration)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <button type="button" className="btn btn-ghost" onClick={e => { e.stopPropagation(); fileRef.current?.click() }} style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                      <Camera size={13} /> Ganti
                    </button>
                    <button type="button" className="btn btn-danger" onClick={e => { e.stopPropagation(); handleRemoveImage() }} style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}>
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '1rem' }}>
                  <Camera size={28} style={{ marginBottom: '0.5rem', color: 'var(--gold)', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.85rem' }}>Klik untuk upload foto</p>
                  <p style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>JPG, PNG, WebP · Maks. 3MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
          </div>

          {/* Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Nama Seserahan">
              <input className="input" placeholder="cth: Gelang emas 10gr" value={form.name} onChange={set('name')} required autoFocus />
            </FormField>
            <FormField label="Kategori">
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
          </div>

          {/* Price */}
          <FormField label="Estimasi Harga (Rp)">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--gold)', opacity: 0.6, pointerEvents: 'none' }}>Rp</span>
              <input
                className="input"
                placeholder="0"
                value={form.estimated_price}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm(f => ({ ...f, estimated_price: raw ? Number(raw).toLocaleString('id-ID') : '' }))
                }}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </FormField>

          {/* Shop URL */}
          <FormField label={<>Link E-Commerce {shopDomain && <span className="badge badge-gold" style={{ fontSize: '0.65rem', marginLeft: '0.5rem' }}>{shopDomain}</span>}</>}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.5, pointerEvents: 'none' }} />
              <input
                className="input"
                placeholder="https://tokopedia.com/..."
                value={form.shop_url}
                onChange={set('shop_url')}
                style={{ paddingLeft: '2.5rem', paddingRight: form.shop_url ? '2.5rem' : '0.875rem' }}
              />
              {form.shop_url && (
                <a href={form.shop_url.startsWith('http') ? form.shop_url : `https://${form.shop_url}`} target="_blank" rel="noopener noreferrer"
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', opacity: 0.6 }}>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: '0.3rem' }}>
              Tokopedia, Shopee, Lazada, dll
            </p>
          </FormField>

          {/* Notes */}
          <FormField label="Catatan">
            <textarea
              className="input" rows={2}
              placeholder="Ukuran, spesifikasi, atau warna yang diinginkan..."
              value={form.notes}
              onChange={set('notes')}
              style={{ resize: 'vertical' }}
            />
          </FormField>

          {/* Purchased toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.625rem 0.875rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <input type="checkbox" checked={form.is_purchased} onChange={e => setForm(f => ({ ...f, is_purchased: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>Sudah dibeli</span>
          </label>

          {/* Footer */}
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

/* ── HELPERS ──────────────────────────────────────────────── */
const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  marginBottom: '0.375rem',
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--gold)' }}>
        <Gift size={26} />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.6rem', color: 'var(--gold-light)', marginBottom: '0.5rem' }}>
        Belum ada daftar seserahan
      </p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-faint)', marginBottom: '1.75rem', maxWidth: 360, margin: '0 auto 1.75rem' }}>
        Tambahkan barang-barang seserahan beserta estimasi harga, foto produk, dan link toko online
      </p>
      <button className="btn btn-gold" onClick={onAdd}>
        <Plus size={16} /> Tambah Seserahan Pertama
      </button>
    </div>
  )
}
