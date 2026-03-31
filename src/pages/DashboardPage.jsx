import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Users, CheckSquare, ChevronRight, Calendar, Edit3 } from 'lucide-react'
import { useAppStore } from '../store'
import BudgetChart from '../components/ui/BudgetChart'
import { getBudgetItems, getGuests, getChecklistItems } from '../lib/supabase'
import { format, differenceInDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export default function DashboardPage() {
  const { wedding, budgetItems, guests, checklistItems,
          setBudgetItems, setGuests, setChecklistItems } = useAppStore()

  useEffect(() => {
    if (!wedding?.id) return
    // Only fetch if we don't already have data in the store.
    // This prevents re-fetching (and overwriting) data the user just added
    // when navigating back to the Dashboard.
    if (budgetItems.length === 0)
      getBudgetItems(wedding.id).then(setBudgetItems).catch(console.error)
    if (guests.length === 0)
      getGuests(wedding.id).then(setGuests).catch(console.error)
    if (checklistItems.length === 0)
      getChecklistItems(wedding.id).then(setChecklistItems).catch(console.error)
  }, [wedding?.id])

  // Stats
  const totalBudget   = wedding?.budget_total || 0
  const totalSpent    = budgetItems.reduce((s, i) => s + (i.actual || 0), 0)
  const totalPaid     = budgetItems.reduce((s, i) => s + (i.paid || 0), 0)
  const budgetPct     = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  const totalGuests   = guests.length
  const confirmedGuests = guests.filter(g => g.rsvp_status === 'hadir').length
  const pendingGuests = guests.filter(g => g.rsvp_status === 'pending').length

  const totalTasks    = checklistItems.length
  const doneTasks     = checklistItems.filter(c => c.is_done).length
  const checkPct      = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const daysLeft = wedding?.wedding_date
    ? differenceInDays(new Date(wedding.wedding_date), new Date())
    : null

  const upcomingTasks = checklistItems
    .filter(c => !c.is_done && c.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4)

  const overBudgetItems = budgetItems.filter(i => i.actual > i.estimated && i.estimated > 0)

  return (
    <div style={{ animation: 'fadeUp 0.5s var(--ease) both' }}>

      {/* ─── Header ─────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--gold)',
          marginBottom: '0.5rem',
        }}>Selamat datang</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.75rem',
          fontWeight: '400',
          color: 'var(--text-primary)',
        }}>
          {wedding?.bride_name && wedding?.groom_name
            ? <><em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>
                {wedding.bride_name}
              </em> & <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>
                {wedding.groom_name}
              </em></>
            : <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>
                {wedding?.title || 'Pernikahan Kami'}
              </em>
          }
        </h1>
        {wedding?.wedding_date && (
          <p style={{
            marginTop: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Calendar size={14} color="var(--gold)" />
            {format(new Date(wedding.wedding_date), "EEEE, d MMMM yyyy", { locale: localeId })}
            {daysLeft !== null && daysLeft >= 0 && (
              <span className="badge badge-gold">{daysLeft} hari lagi</span>
            )}
          </p>
        )}
      </div>

      {/* ─── Stat Cards ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <StatCard
          to="/budget"
          icon={<Wallet size={18} />}
          label="Budget"
          primary={`${pct(budgetPct)}% terpakai`}
          sub={`${formatRp(totalSpent)} dari ${formatRp(totalBudget)}`}
          accent={budgetPct > 90 ? 'rose' : 'gold'}
          progress={budgetPct}
        />
        <StatCard
          to="/guests"
          icon={<Users size={18} />}
          label="Tamu"
          primary={`${totalGuests} undangan`}
          sub={`${confirmedGuests} konfirmasi · ${pendingGuests} pending`}
          accent="gold"
        />
        <StatCard
          to="/checklist"
          icon={<CheckSquare size={18} />}
          label="Checklist"
          primary={`${checkPct}% selesai`}
          sub={`${doneTasks} dari ${totalTasks} tugas`}
          accent={checkPct === 100 ? 'sage' : 'gold'}
          progress={checkPct}
        />
      </div>

      {/* ─── Two Columns ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* Upcoming tasks */}
        <div className="card" style={{ minHeight: 240 }}>
          <SectionHeader title="Tugas Mendatang" to="/checklist" />
          {upcomingTasks.length === 0 ? (
            <Empty text="Semua tugas sudah selesai ✨" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingTasks.map(task => {
                const daysToTask = differenceInDays(new Date(task.due_date), new Date())
                const urgent = daysToTask <= 7
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.625rem 0',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      background: urgent ? 'var(--rose)' : 'var(--gold)',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{task.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.category}
                      </p>
                    </div>
                    <span className={`badge ${urgent ? 'badge-danger' : 'badge-muted'}`}
                      style={{ fontSize: '0.7rem' }}>
                      {daysToTask === 0 ? 'Hari ini' : daysToTask < 0 ? 'Terlambat' : `${daysToTask}h`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Budget alerts */}
        <div className="card" style={{ minHeight: 240 }}>
          <SectionHeader title="Peringatan Budget" to="/budget" />
          {overBudgetItems.length === 0 ? (
            <Empty text="Budget masih dalam batas aman 👍" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {overBudgetItems.map(item => {
                const over = item.actual - item.estimated
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.625rem 0.75rem',
                    background: 'var(--rose-bg)',
                    border: '1px solid var(--rose-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.category}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 500 }}>
                        +{formatRp(over)}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>melebihi estimasi</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick setup CTA if no wedding date */}
      {!wedding?.wedding_date && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.5rem 2rem',
          background: 'var(--accent-bg)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', gap: '1.5rem',
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontStyle: 'italic',
              color: 'var(--gold-light)',
            }}>Lengkapi profil pernikahanmu</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Tambahkan nama mempelai dan tanggal hari-H untuk fitur countdown
            </p>
          </div>
          <Link to="/settings" className="btn btn-ghost" style={{ gap: '0.5rem', flexShrink: 0 }}>
            <Edit3 size={14} /> Lengkapi Sekarang
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ to, icon, label, primary, sub, accent, progress }) {
  const accentColor = accent === 'rose' ? 'var(--rose)' : accent === 'sage' ? 'var(--sage)' : 'var(--gold)'
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        transition: 'all var(--duration) var(--ease)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accentColor,
          }}>
            {icon}
          </div>
          <ChevronRight size={14} color="var(--text-faint)" />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)', color: accentColor, fontWeight: 500 }}>
          {primary}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</p>

        {progress !== undefined && (
          <div className="progress-bar" style={{ marginTop: '1rem' }}>
            <div
              className={`progress-fill${accent === 'rose' ? ' over-budget' : ''}`}
              style={{
                width: `${progress}%`,
                background: accent === 'rose'
                  ? 'linear-gradient(90deg, var(--rose), #e09090)'
                  : accent === 'sage'
                  ? 'linear-gradient(90deg, var(--sage), #a0c8a3)'
                  : undefined
              }}
            />
          </div>
        )}
      </div>
    </Link>
  )
}

function SectionHeader({ title, to }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.15rem',
        fontStyle: 'italic',
        color: 'var(--gold-light)',
      }}>{title}</h3>
      <Link to={to} style={{
        fontSize: '0.75rem',
        color: 'var(--gold)',
        textDecoration: 'none',
        opacity: 0.7,
      }}>Lihat semua →</Link>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div style={{
      textAlign: 'center', padding: '2rem 0',
      color: 'var(--text-faint)', fontSize: '0.875rem',
    }}>{text}</div>
  )
}

function formatRp(val) {
  if (!val) return 'Rp 0'
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`
  return `Rp ${val}`
}

function pct(n) { return Math.round(n) }
