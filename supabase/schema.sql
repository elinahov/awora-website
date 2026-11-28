-- Awora catalog schema (MVP: public read-only catalog, no orders or auth yet).
-- Run in the Supabase SQL editor, then run seed.sql (generate it with `npm run seed:sql`).

create table if not exists public.colors (
  id text primary key,
  hex text not null,
  name jsonb not null,              -- {"en": "...", "hy": "..."}
  sort int not null default 0
);

create table if not exists public.combos (
  id text primary key,
  name jsonb not null,
  base text not null references public.colors(id),
  pattern text not null references public.colors(id),
  accent text not null references public.colors(id),
  sort int not null default 0
);

create table if not exists public.collections (
  id text primary key,
  name jsonb not null,
  color text references public.colors(id),
  sort int not null default 0
);

create table if not exists public.products (
  slug text primary key,
  category text not null check (category in ('cover', 'outline', 'decor')),
  kind text not null check (kind in ('cover', 'outline', 'tray', 'frame', 'mirror')),
  collection text references public.collections(id),
  name jsonb not null,
  blurb jsonb not null,
  defaults jsonb not null,          -- starting configuration, see src/lib/config.js
  published boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Public read access for the storefront; writes only through the dashboard / service role.
alter table public.colors enable row level security;
alter table public.combos enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;

drop policy if exists "public read colors" on public.colors;
drop policy if exists "public read combos" on public.combos;
drop policy if exists "public read collections" on public.collections;
drop policy if exists "public read products" on public.products;
create policy "public read colors" on public.colors for select using (true);
create policy "public read combos" on public.combos for select using (true);
create policy "public read collections" on public.collections for select using (true);
create policy "public read products" on public.products for select using (published);

-- ─────────────────────────────────────────────────────────────────────────────
-- Accounts, admin, pricing and orders
-- Auth: Supabase Auth, email + password (Authentication → Providers → Email).
-- Promote an admin after they sign up:
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com'
--   on conflict do nothing;

create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- no client policies: admins are managed with SQL only

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, phone text, city text, address text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Key/value settings. 'pricing' = { coverFirst, coverExtra, lever, shapes:{id:n}, patterns:{id:n}, sizes:{kind:{id:n}}, outline:{first, extra, shapes:{id:n}} } in AMD.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "public read settings" on public.settings;
drop policy if exists "admin write settings" on public.settings;
create policy "public read settings" on public.settings for select using (true);
create policy "admin write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigserial unique,
  user_id uuid references auth.users on delete set null,
  name text not null,
  phone text not null,
  email text not null,
  city text not null,
  address text not null,
  note text,
  lang text not null default 'hy',
  items jsonb not null,             -- [{ slug, name, config, code, qty, price }]
  total int not null,
  status text not null default 'new' check (status in ('new', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled')),
  admin_note text,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_user_idx on public.orders (user_id);
alter table public.orders enable row level security;
drop policy if exists "own or admin read orders" on public.orders;
drop policy if exists "admin update orders" on public.orders;
drop policy if exists "admin delete orders" on public.orders;
-- No insert policy: orders are created only by /api/order with the service role (prices are recomputed there).
create policy "own or admin read orders" on public.orders for select using (user_id = auth.uid() or public.is_admin());
create policy "admin update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());
create policy "admin delete orders" on public.orders for delete using (public.is_admin());

-- Admins edit the catalog from /admin.
drop policy if exists "admin write colors" on public.colors;
drop policy if exists "admin write combos" on public.combos;
drop policy if exists "admin write collections" on public.collections;
drop policy if exists "admin write products" on public.products;
create policy "admin write colors" on public.colors for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write combos" on public.combos for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write collections" on public.collections for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- Migration (safe to re-run): allow outline frames on databases created before they existed.
alter table public.products drop constraint if exists products_category_check;
alter table public.products add constraint products_category_check check (category in ('cover', 'outline', 'decor'));
alter table public.products drop constraint if exists products_kind_check;
alter table public.products add constraint products_kind_check check (kind in ('cover', 'outline', 'tray', 'frame', 'mirror'));
