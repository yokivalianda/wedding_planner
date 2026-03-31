-- ═══════════════════════════════════════════════════════════
-- Wedding Planner - Supabase Schema
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Enable RLS
alter table if exists weddings enable row level security;

-- ─── WEDDINGS ────────────────────────────────────────────────
create table if not exists weddings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null default 'Pernikahan Kami',
  bride_name  text,
  groom_name  text,
  wedding_date date,
  venue       text,
  budget_total bigint default 100000000,
  created_at  timestamptz default now()
);

alter table weddings enable row level security;
create policy "Users own their weddings"
  on weddings for all
  using (auth.uid() = user_id);

-- ─── BUDGET ITEMS ────────────────────────────────────────────
create table if not exists budget_items (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid references weddings(id) on delete cascade not null,
  category    text not null,
  name        text not null,
  estimated   bigint default 0,
  actual      bigint default 0,
  paid        bigint default 0,
  vendor      text,
  notes       text,
  created_at  timestamptz default now()
);

alter table budget_items enable row level security;
create policy "Wedding owner accesses budget"
  on budget_items for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = budget_items.wedding_id
      and weddings.user_id = auth.uid()
    )
  );

-- ─── GUESTS ──────────────────────────────────────────────────
create table if not exists guests (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid references weddings(id) on delete cascade not null,
  name        text not null,
  phone       text,
  email       text,
  category    text default 'Umum',
  side        text default 'Mempelai Wanita',
  rsvp_status text default 'pending',
  table_no    text,
  dietary     text,
  notes       text,
  created_at  timestamptz default now()
);

alter table guests enable row level security;
create policy "Wedding owner accesses guests"
  on guests for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = guests.wedding_id
      and weddings.user_id = auth.uid()
    )
  );

-- ─── CHECKLIST ITEMS ─────────────────────────────────────────
create table if not exists checklist_items (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid references weddings(id) on delete cascade not null,
  category    text not null default 'Umum',
  title       text not null,
  notes       text,
  due_date    date,
  is_done     boolean default false,
  priority    text default 'medium',
  created_at  timestamptz default now()
);

alter table checklist_items enable row level security;
create policy "Wedding owner accesses checklist"
  on checklist_items for all
  using (
    exists (
      select 1 from weddings
      where weddings.id = checklist_items.wedding_id
      and weddings.user_id = auth.uid()
    )
  );
