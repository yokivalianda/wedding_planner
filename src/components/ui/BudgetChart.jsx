import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const COLORS = [
  '#C9A96E', '#7A9E7E', '#C17F7F', '#8B9EC9', '#C9A06E',
  '#7ABCB8', '#C9B06E', '#A07AC9', '#7AC990', '#C97A8B',
]

function formatRpShort(val) {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000)     return `${(val / 1_000_000).toFixed(0)}jt`
  if (val >= 1_000)         return `${(val / 1_000).toFixed(0)}rb`
  return String(val)
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 10, padding: '0.625rem 0.875rem',
      fontSize: '0.8rem', color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '0.25rem' }}>
        {d.name || d.category}
      </p>
      {d.estimated !== undefined && (
        <p style={{ color: 'var(--text-muted)' }}>Est: Rp {Number(d.estimated).toLocaleString('id-ID')}</p>
      )}
      {d.actual !== undefined && (
        <p>Aktual: Rp {Number(d.actual || d.value).toLocaleString('id-ID')}</p>
      )}
      {d.pct !== undefined && (
        <p style={{ color: 'var(--gold)', marginTop: '0.2rem' }}>{d.pct}% dari total</p>
      )}
    </div>
  )
}

export default function BudgetChart({ budgetItems, totalBudget }) {
  const donutData = useMemo(() => {
    const grouped = {}
    budgetItems.forEach(item => {
      const cat = item.category || 'Lain-lain'
      grouped[cat] = (grouped[cat] || 0) + (item.actual || 0)
    })
    const total = Object.values(grouped).reduce((s, v) => s + v, 0) || 1
    return Object.entries(grouped)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value, pct: Math.round((value / total) * 100) }))
  }, [budgetItems])

  const barData = useMemo(() => {
    const grouped = {}
    budgetItems.forEach(item => {
      const cat = item.category || 'Lain-lain'
      if (!grouped[cat]) grouped[cat] = { category: cat, estimated: 0, actual: 0 }
      grouped[cat].estimated += item.estimated || 0
      grouped[cat].actual    += item.actual    || 0
    })
    return Object.values(grouped)
      .filter(d => d.estimated > 0 || d.actual > 0)
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 8)
      .map(d => ({ ...d, category: d.category.length > 14 ? d.category.slice(0, 13) + '…' : d.category }))
  }, [budgetItems])

  const totalActual = budgetItems.reduce((s, i) => s + (i.actual || 0), 0)

  if (budgetItems.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', marginBottom: '2rem' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--gold-light)', marginBottom: '1rem' }}>Komposisi Pengeluaran</p>
        <div style={{ position: 'relative', flex: 1, minHeight: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {donutData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', fontWeight: 500 }}>{formatRpShort(totalActual)}</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>total aktual</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.75rem' }}>
          {donutData.slice(0, 5).map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 500 }}>{d.pct}%</span>
            </div>
          ))}
          {donutData.length > 5 && <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>+{donutData.length - 5} kategori lainnya</p>}
        </div>
      </div>

      <div className="card">
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--gold-light)', marginBottom: '1rem' }}>Estimasi vs Aktual per Kategori</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={48} />
            <YAxis tickFormatter={formatRpShort} tick={{ fill: 'var(--text-faint)', fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
            <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem' }} formatter={(val) => val === 'estimated' ? 'Estimasi' : 'Aktual'} />
            <Bar dataKey="estimated" fill="var(--accent-bg)" radius={[3, 3, 0, 0]} name="estimated" />
            <Bar dataKey="actual"    fill="var(--gold)"       radius={[3, 3, 0, 0]} name="actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
