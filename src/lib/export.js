// ─── Export Utilities ────────────────────────────────────────────────────────
// Menggunakan browser native untuk PDF, dan SheetJS untuk Excel

// ── PDF: Guest List ──────────────────────────────────────────────────────────
export function exportGuestsPDF(guests, wedding) {
  const title = wedding?.title || 'Pernikahan'
  const date  = wedding?.wedding_date
    ? new Date(wedding.wedding_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const rsvpLabel = { hadir: 'Hadir', tidak: 'Tidak Hadir', pending: 'Menunggu' }

  const rows = guests.map((g, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#faf7f2'}">
      <td>${i + 1}</td>
      <td><strong>${g.name}</strong></td>
      <td>${g.phone || '—'}</td>
      <td>${g.side || '—'}</td>
      <td>${g.category || '—'}</td>
      <td style="color:${g.rsvp_status === 'hadir' ? '#3d7a40' : g.rsvp_status === 'tidak' ? '#a03030' : '#7a6a30'}; font-weight:500">
        ${rsvpLabel[g.rsvp_status] || '—'}
      </td>
      <td>${g.table_no || '—'}</td>
    </tr>
  `).join('')

  const stats = {
    total:   guests.length,
    hadir:   guests.filter(g => g.rsvp_status === 'hadir').length,
    tidak:   guests.filter(g => g.rsvp_status === 'tidak').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length,
  }

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Daftar Tamu — ${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; color: #1a1714; background: #fff; padding: 2.5rem; }
        .header { text-align: center; border-bottom: 1px solid #c9a96e; padding-bottom: 1.5rem; margin-bottom: 2rem; }
        .header h1 { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 2.5rem; color: #c9a96e; font-weight: 400; }
        .header p { color: #888; font-size: 0.85rem; margin-top: 0.25rem; }
        .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .stat { flex: 1; background: #faf7f2; border: 1px solid #e8d5b0; border-radius: 8px; padding: 0.75rem 1rem; text-align: center; }
        .stat .val { font-family: 'Cormorant Garamond', serif; font-size: 1.75rem; color: #c9a96e; }
        .stat .lbl { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
        table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        th { background: #1a1714; color: #c9a96e; padding: 0.625rem 0.75rem; text-align: left; font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
        td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f0ece4; }
        .footer { margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #aaa; border-top: 1px solid #e8d5b0; padding-top: 1rem; }
        @media print { body { padding: 1rem; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${date ? `<p>📅 ${date}${wedding?.venue ? ' · ' + wedding.venue : ''}</p>` : ''}
        <p style="margin-top:0.5rem; font-size:0.78rem; color:#aaa">Dicetak ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div class="stats">
        <div class="stat"><div class="val">${stats.total}</div><div class="lbl">Total</div></div>
        <div class="stat"><div class="val" style="color:#3d7a40">${stats.hadir}</div><div class="lbl">Hadir</div></div>
        <div class="stat"><div class="val" style="color:#a03030">${stats.tidak}</div><div class="lbl">Tidak Hadir</div></div>
        <div class="stat"><div class="val" style="color:#7a6a30">${stats.pending}</div><div class="lbl">Menunggu</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th><th>Nama</th><th>Telepon</th><th>Pihak</th><th>Kategori</th><th>RSVP</th><th>Meja</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="footer">Wedding Planner · Total ${stats.total} tamu undangan</div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.addEventListener('load', () => {
    setTimeout(() => {
      win.print()
    }, 500)
  })
}

// ── Excel: Budget Report ─────────────────────────────────────────────────────
export async function exportBudgetExcel(budgetItems, wedding) {
  // Dynamically import SheetJS
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')

  const title = wedding?.title || 'Pernikahan'

  const formatRp = (val) => val ? `Rp ${Number(val).toLocaleString('id-ID')}` : 'Rp 0'

  // Main sheet data
  const rows = [
    ['Kategori', 'Nama Item', 'Vendor', 'Estimasi', 'Aktual', 'Sudah Dibayar', 'Selisih', 'Catatan'],
    ...budgetItems.map(item => [
      item.category,
      item.name,
      item.vendor || '',
      item.estimated || 0,
      item.actual || 0,
      item.paid || 0,
      (item.actual || 0) - (item.estimated || 0),
      item.notes || '',
    ]),
    [],
    ['TOTAL', '', '',
      budgetItems.reduce((s, i) => s + (i.estimated || 0), 0),
      budgetItems.reduce((s, i) => s + (i.actual || 0), 0),
      budgetItems.reduce((s, i) => s + (i.paid || 0), 0),
      '', '',
    ],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 22 }, { wch: 28 }, { wch: 20 },
    { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 16 }, { wch: 30 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Budget')

  // Summary sheet
  const categories = [...new Set(budgetItems.map(i => i.category))]
  const summaryRows = [
    ['Kategori', 'Total Estimasi', 'Total Aktual', 'Selisih', 'Status'],
    ...categories.map(cat => {
      const items = budgetItems.filter(i => i.category === cat)
      const est    = items.reduce((s, i) => s + (i.estimated || 0), 0)
      const actual = items.reduce((s, i) => s + (i.actual || 0), 0)
      const diff   = actual - est
      return [cat, est, actual, diff, diff > 0 ? 'Over Budget' : diff < 0 ? 'Under Budget' : 'On Track']
    }),
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows)
  ws2['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan')

  XLSX.writeFile(wb, `Budget_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// ── Excel: Guest List ─────────────────────────────────────────────────────────
export async function exportGuestsExcel(guests, wedding) {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')

  const title = wedding?.title || 'Pernikahan'
  const rsvpLabel = { hadir: 'Hadir', tidak: 'Tidak Hadir', pending: 'Menunggu' }

  const rows = [
    ['No', 'Nama', 'Telepon', 'Email', 'Pihak', 'Kategori', 'RSVP', 'No. Meja', 'Pantangan Makanan', 'Catatan'],
    ...guests.map((g, i) => [
      i + 1, g.name, g.phone || '', g.email || '',
      g.side || '', g.category || '',
      rsvpLabel[g.rsvp_status] || g.rsvp_status,
      g.table_no || '', g.dietary || '', g.notes || '',
    ]),
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 4 }, { wch: 28 }, { wch: 16 }, { wch: 28 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 24 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar Tamu')

  XLSX.writeFile(wb, `TamuUndangan_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
}
