# 💍 Wedding Planner PWA — v0.2

Aplikasi perencanaan pernikahan full-featured, mobile-first, installable sebagai PWA.

## ✨ Fitur v0.2

| Fitur | Status |
|---|---|
| Auth (register / login) | ✅ |
| Dashboard statistik real-time | ✅ |
| Budget Manager + Chart | ✅ |
| Daftar Tamu + RSVP tracking | ✅ |
| Checklist + Template 10 tugas | ✅ |
| **Settings** (nama, tanggal, venue, budget) | ✅ NEW |
| **Mobile responsive + Bottom Nav** | ✅ NEW |
| **Budget Chart** (donut + bar) | ✅ NEW |
| **Landing Page** untuk monetisasi | ✅ NEW |
| **Export PDF** daftar tamu | ✅ NEW |
| **Export Excel** budget & tamu | ✅ NEW |
| PWA installable | ✅ |

## Stack
- **Frontend**: React 18 + Vite
- **Database & Auth**: Supabase
- **Charts**: Recharts
- **State**: Zustand
- **PWA**: vite-plugin-pwa

## Setup (5 menit)

### 1. Install
```bash
npm install
```

### 2. Supabase setup
1. Buat project di https://supabase.com
2. SQL Editor → jalankan `supabase-schema.sql`
3. Salin URL & anon key dari Project Settings → API

### 3. Environment
```bash
cp .env.example .env.local
# Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
```

### 4. Jalankan
```bash
npm run dev
# Buka http://localhost:5173
```

## Routes

| Path | Halaman |
|---|---|
| `/landing` | Landing page publik (untuk monetisasi) |
| `/auth` | Login / Register |
| `/` | Dashboard |
| `/budget` | Budget Manager |
| `/guests` | Daftar Tamu |
| `/checklist` | Checklist |
| `/settings` | Pengaturan |

## Deploy ke Vercel

```bash
npm i -g vercel
vercel --prod
# Set env vars di Vercel dashboard
```

## Monetisasi

Landing page sudah include:
- **Freemium** (gratis, batas 50 tamu)
- **Pro** Rp 99.000/bulan (unlimited + export + AI)
- **WO Plan** Rp 499.000/bulan (white label + multi klien)
- **Waitlist form** siap dihubungkan ke Supabase/email

## Phase 3 Roadmap
- [ ] AI Wedding Assistant (Claude API)
- [ ] Wedding website per pasangan
- [ ] Seating chart drag & drop
- [ ] Notifikasi WhatsApp / email
- [ ] Vendor marketplace
- [ ] Stripe / Midtrans payment
