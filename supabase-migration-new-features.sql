-- ═══════════════════════════════════════════════════════════
-- Wedding Planner - Migration: Fitur Baru
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── ENGAGEMENT ITEMS ─────────────────────────────────────────────────────────
create table if not exists engagement_items (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid references weddings(id) on delete cascade not null,
  category      text not null default 'Lain-lain',
  name          text not null,
  status        text default 'belum',   -- belum | dp | lunas
  vendor        text,
  price_groom   bigint default 0,
  price_bride   bigint default 0,
  notes         text,
  created_at    timestamptz default now()
);

alter table engagement_items enable row level security;
create policy "Wedding owner accesses engagement"
  on engagement_items for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = engagement_items.wedding_id
      and weddings.user_id = auth.uid()
    )
  );

-- ─── PRE WEDDING ITEMS ────────────────────────────────────────────────────────
create table if not exists prewedding_items (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid references weddings(id) on delete cascade not null,
  name          text not null,
  vendor        text,
  budget        bigint default 0,
  actual        bigint default 0,
  status        text default 'belum',   -- belum | dp | lunas
  notes         text,
  sort_order    int default 0,
  created_at    timestamptz default now()
);

alter table prewedding_items enable row level security;
create policy "Wedding owner accesses prewedding"
  on prewedding_items for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = prewedding_items.wedding_id
      and weddings.user_id = auth.uid()
    )
  );

-- ─── ADMIN DOCUMENTS ──────────────────────────────────────────────────────────
create table if not exists admin_documents (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid references weddings(id) on delete cascade not null,
  name            text not null,
  done_groom      boolean default false,
  done_bride      boolean default false,
  price           bigint default 0,
  notes           text,
  sort_order      int default 0,
  created_at      timestamptz default now()
);

alter table admin_documents enable row level security;
create policy "Wedding owner accesses admin_documents"
  on admin_documents for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = admin_documents.wedding_id
      and weddings.user_id = auth.uid()
    )
  );

-- ─── WEDDING BUDGET ITEMS (extended) ──────────────────────────────────────────
create table if not exists wedding_budget_items (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid references weddings(id) on delete cascade not null,
  category        text not null default 'Lain-lain',
  name            text not null,
  status          text default 'belum',   -- belum | dp | lunas
  budget          bigint default 0,
  realisasi       bigint default 0,
  dp_lunas        bigint default 0,
  payment_date    date,
  vendor          text,
  notes           text,
  created_at      timestamptz default now()
);

alter table wedding_budget_items enable row level security;
create policy "Wedding owner accesses wedding_budget"
  on wedding_budget_items for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = wedding_budget_items.wedding_id
      and weddings.user_id = auth.uid()
    )
  );
