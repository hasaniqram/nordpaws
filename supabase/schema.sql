-- NORDPAWS initial schema. Apply only to a dedicated NORDPAWS Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  subtitle text not null default '',
  description text not null default '',
  category text not null,
  price integer not null check (price >= 0),
  compare_at integer check (compare_at is null or compare_at >= price),
  badge text,
  emoji text not null default '🐾',
  gradient text not null default 'linear-gradient(135deg,#ece8df,#d8d3c8)',
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  stripe_checkout_session_id text unique not null,
  email text,
  amount_total integer not null default 0,
  currency text not null default 'sek',
  payment_status text,
  status text not null default 'paid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (active = true);

grant select on public.products to anon, authenticated;
revoke all on public.orders from anon, authenticated;
