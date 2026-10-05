-- Zamon Store — 6-migratsiya: brendlar va kategoriyalar (admin paneldan boshqariladi).
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz (`if not exists`).
-- Keyin mavjud brend va kategoriyalarni ko‘chirish: `npm run db:seed-taxonomy`.
--
-- Jadvallar bo‘sh bo‘lsa, sayt kod ichidagi standart ro‘yxatni ishlatadi — hech narsa buzilmaydi.
-- Xavfsizlik: RLS yoqilgan, policy yo‘q, ochiq kalit ruxsatlari olib tashlangan.

create table if not exists public.brands (
  id           text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 60),
  slug         text not null unique check (slug = id),
  name         text not null check (char_length(name) between 1 and 60),
  description  text not null default '' check (char_length(description) <= 500),
  logo         text check (logo is null or char_length(logo) <= 500),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.categories (
  -- id — ota kategoriya id'si + «-» + slug (masalan, aksessuarlar-zaryadchiklar-adapterlar).
  id           text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 120),
  -- O‘chirishda bolasi bor kategoriya o‘chmaydi (restrict) — avval bolalari.
  parent_id    text references public.categories (id) on delete restrict,
  slug         text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name         text not null check (char_length(name) between 1 and 60),
  description  text not null default '' check (char_length(description) <= 500),
  image        text check (image is null or char_length(image) <= 500),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

-- Bir ota ostida bir xil manzil (slug) ikki marta bo‘lmasin (ildizlar uchun ham).
create unique index if not exists categories_parent_slug_uidx on public.categories (coalesce(parent_id, ''), slug);
create index if not exists categories_parent_idx on public.categories (parent_id);

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at before update on public.brands
  for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.brands enable row level security;
alter table public.categories enable row level security;
revoke all on table public.brands from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
