-- Zamon Store — 1-migratsiya: buyurtmalar va analytics voqealari.
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz (`if not exists`).
--
-- Xavfsizlik: barcha jadvallarda RLS yoqilgan va hech qanday policy yo‘q. Demak
-- brauzerdagi ochiq (anon/publishable) kalit bilan bu jadvallarni o‘qib ham, yozib ham
-- bo‘lmaydi. Faqat serverdagi maxfiy kalit (SUPABASE_SECRET_KEY) kira oladi.

-- ── Buyurtmalar ───────────────────────────────────────────────────────────────
create table if not exists public.orders (
  seq            bigint generated always as identity primary key,
  -- Saytdagi buyurtma raqami: QP-000001, QP-000002 ... (million'dan keyin qisqartirilmaydi).
  id             text generated always as (
                   'QP-' || case when seq < 1000000 then lpad(seq::text, 6, '0') else seq::text end
                 ) stored unique,
  product_id     text   not null check (char_length(product_id) between 1 and 200),
  variant_id     text   not null check (char_length(variant_id) between 1 and 200),
  product_name   text   not null check (char_length(product_name) between 1 and 300),
  variant_label  text   not null check (char_length(variant_label) between 1 and 300),
  -- Butun so‘mda (float emas).
  price          bigint not null check (price >= 0),
  customer_name  text   not null check (char_length(customer_name) between 2 and 80),
  phone          text   not null check (char_length(phone) between 5 and 30),
  note           text            check (note is null or char_length(note) <= 500),
  status         text   not null default 'new'
                   check (status in ('new', 'contacted', 'done', 'cancelled')),
  source         text   not null default 'site' check (source in ('site')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

-- ── Analytics voqealari (qidiruv, Telegram bosilishi, mahsulot ko‘rish ...) ──
-- Shaxsiy ma’lumot (ism, telefon) bu yerga yozilmaydi.
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  name        text  not null check (name in (
                'search', 'search_result_click', 'product_view',
                'telegram_order_click', 'order_submit', 'favorite_toggle'
              )),
  session_id  text  not null check (char_length(session_id) between 1 and 100),
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists events_name_created_at_idx on public.events (name, created_at desc);

-- ── updated_at avtomatik yangilanadi ─────────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ── Xavfsizlik: ochiq kalitga hech narsa ruxsat etilmaydi ─────────────────────
alter table public.orders enable row level security;
alter table public.events enable row level security;

revoke all on table public.orders from anon, authenticated;
revoke all on table public.events from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on function public.set_updated_at() from anon, authenticated, public;
