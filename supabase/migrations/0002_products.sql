-- Zamon Store — 2-migratsiya: mahsulotlar katalogi.
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz (`if not exists`).
--
-- Mahsulot bitta qator: asosiy maydonlar alohida ustunlarda, variantlar (rang/xotira/narx/
-- qoldiq), xususiyatlar va filtr atributlari JSONB'da — sayt tiplari (src/types/product.ts)
-- bilan bir xil tuzilma. Ma’lumotni yozishdan oldin server zod bilan tekshiradi.
--
-- Xavfsizlik: RLS yoqilgan, policy yo‘q, ochiq kalit ruxsatlari olib tashlangan —
-- faqat serverdagi maxfiy kalit o‘qiy/yoza oladi.

create table if not exists public.products (
  -- id = slug (URL'dagi nom): faqat kichik lotin harflari, raqam va chiziqcha.
  id                 text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 120),
  slug               text not null unique check (slug = id),
  name               text not null check (char_length(name) between 2 and 200),
  brand_id           text not null check (char_length(brand_id) between 1 and 60),
  category_id        text not null check (char_length(category_id) between 1 and 120),
  model              text          check (model is null or char_length(model) <= 120),
  short_description  text not null default '' check (char_length(short_description) <= 300),
  description        text not null default '' check (char_length(description) <= 5000),
  images             text[] not null default '{}' check (cardinality(images) <= 20),
  hero_image         text,
  variants           jsonb not null check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) between 1 and 200),
  specs              jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  attributes         jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  keywords           text[] not null default '{}',
  featured           boolean not null default false,
  popularity         integer not null default 0 check (popularity between 0 and 1000000),
  rating_avg         numeric(2, 1) not null default 0 check (rating_avg between 0 and 5),
  rating_count       integer not null default 0 check (rating_count >= 0),
  related_ids        text[],
  bundle_ids         text[],
  is_published       boolean not null default true,
  seo                jsonb check (seo is null or jsonb_typeof(seo) = 'object'),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists products_updated_at_idx on public.products (updated_at desc);

-- updated_at avtomatik (funksiya 0001-migratsiyada yaratilgan).
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
revoke all on table public.products from anon, authenticated;
