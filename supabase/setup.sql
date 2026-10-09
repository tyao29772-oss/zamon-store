-- Zamon Store — bazani to‘liq tayyorlash (barcha migratsiyalar bitta faylda).
--
-- Supabase → SQL Editor → New query → shu faylni TO‘LIQ joylashtiring → Run.
-- Qayta ishga tushirish xavfsiz: mavjud jadval va ma’lumotlarga tegmaydi.
-- Bu fayl avtomatik yig‘ilgan (8 ta migratsiya) — o‘zgartirmang, `npm run db:setup-sql`.

-- ═══════════════════════════════════════════════════════════════════════
-- 0001_orders_events.sql
-- ═══════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════
-- 0002_products.sql
-- ═══════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════
-- 0003_product_images.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Zamon Store — 3-migratsiya: mahsulot rasmlari uchun Storage papkasi (bucket).
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz.
--
-- Qanday ishlaydi:
--  • Papka ochiq o‘qiladi (public) — saytdagi rasmlar baribir hammaga ko‘rinadi.
--  • YOZISH faqat server bergan bir martalik imzolangan havola orqali (admin panel).
--    storage.objects jadvaliga ochiq kalit uchun hech qanday policy qo‘shilmaydi —
--    begona odam fayl yuklay, o‘chira yoki papkani ro‘yxatlay olmaydi.
--  • Faqat rasm (webp, jpeg, png) va ko‘pi bilan 5 MB. Admin panel rasmni yuklashdan
--    oldin brauzerda siqadi (odatda 150–500 KB).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ═══════════════════════════════════════════════════════════════════════
-- 0004_orders_admin.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Zamon Store — 4-migratsiya: buyurtmalarni admin paneldan boshqarish.
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz (`if not exists`).
--
--  • admin_note      — faqat admin ko‘radigan izoh («ertaga 15:00 da olib ketadi»).
--  • stock_deducted  — «Bajarildi» bo‘lganda qoldiqdan 1 dona ayirilganmi. Ikki marta
--                      ayirilib ketmasligi va bekor qilinganda qaytarish uchun kerak.

alter table public.orders
  add column if not exists admin_note text
    check (admin_note is null or char_length(admin_note) <= 1000);

alter table public.orders
  add column if not exists stock_deducted boolean not null default false;

-- ═══════════════════════════════════════════════════════════════════════
-- 0005_settings.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Zamon Store — 5-migratsiya: do‘kon sozlamalari (admin paneldagi «Sozlamalar»).
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz.
--
-- Bitta qator (id = 'store'): telefon, Telegram, manzil, ish vaqti, yetkazib berish
-- narxlari, kafolat/qaytarish/maxfiylik matnlari. Server zod bilan tekshirib yozadi;
-- to‘ldirilmagan maydonlar uchun saytdagi standart qiymatlar ishlatiladi.

create table if not exists public.settings (
  id          text primary key check (id in ('store')),
  data        jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at  timestamptz not null default now()
);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;
revoke all on table public.settings from anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 0006_taxonomy.sql
-- ═══════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════
-- 0007_home.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Zamon Store — 7-migratsiya: bosh sahifa sozlamalari (admin paneldagi «Bosh sahifa»).
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz.
--
-- Yangi jadval kerak emas: `settings` jadvaliga ikkinchi qator (id = 'home') ruxsat etiladi.
-- Unda asosiy blok, ikki tavsiya kartasi va reklama bannerlari saqlanadi.

alter table public.settings drop constraint if exists settings_id_check;
alter table public.settings add constraint settings_id_check check (id in ('store', 'home'));

-- ═══════════════════════════════════════════════════════════════════════
-- 0008_stats.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Zamon Store — 8-migratsiya: admin paneldagi «Statistika».
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz.
--
-- `admin_stats(dan, gacha, vaqt_mintaqasi)` — buyurtmalar va saytdagi voqealarni bazaning
-- o‘zida sanaydi va bitta JSON qaytaradi. Shunda voqealar yuz minglab bo‘lsa ham sahifa tez
-- ochiladi (serverga xom qatorlar emas, tayyor sonlar keladi).
-- Faqat server kaliti (service_role) chaqira oladi.

create index if not exists events_created_at_idx on public.events (created_at desc);

create or replace function public.admin_stats(p_from timestamptz, p_to timestamptz, p_tz text default 'Asia/Tashkent')
returns jsonb
language sql
stable
set search_path = ''
as $$
with
o as (
  select product_id, product_name, price, status, created_at
  from public.orders
  where created_at >= p_from and created_at < p_to
),
e as (
  select name, session_id, payload, created_at
  from public.events
  where created_at >= p_from and created_at < p_to
),
-- Qidiruvlar: harf terilayotganda yozilgan oraliq so‘zlar («ip», «iph» → «iphone») tashlab yuboriladi.
s as (
  select
    session_id,
    lower(btrim(payload->>'query')) as q,
    case when payload->>'resultCount' ~ '^[0-9]{1,9}$' then (payload->>'resultCount')::int else 0 end as results,
    created_at
  from e
  where name = 'search' and btrim(coalesce(payload->>'query', '')) <> ''
),
s_final as (
  select session_id, q, results, created_at
  from (
    select s.*, lead(q) over w as next_q, lead(created_at) over w as next_t
    from s
    window w as (partition by session_id order by created_at)
  ) x
  where not (
    next_q is not null and next_q <> q and starts_with(next_q, q)
    and next_t - created_at < interval '30 seconds'
  )
),
searches as (
  select
    q,
    count(distinct session_id) as people,
    (array_agg(results order by created_at desc))[1] as last_results
  from s_final
  group by q
),
product_events as (
  select
    payload->>'productId' as product_id,
    count(*) filter (where name = 'product_view') as views,
    count(distinct session_id) filter (where name = 'product_view') as viewers,
    count(*) filter (where name = 'telegram_order_click') as order_clicks
  from e
  where name in ('product_view', 'telegram_order_click') and coalesce(payload->>'productId', '') <> ''
  group by 1
)
select jsonb_build_object(
  'orders', (
    select jsonb_build_object(
      'total', count(*) filter (where status <> 'cancelled'),
      'done', count(*) filter (where status = 'done'),
      'open', count(*) filter (where status in ('new', 'contacted')),
      'cancelled', count(*) filter (where status = 'cancelled'),
      'revenueDone', coalesce(sum(price) filter (where status = 'done'), 0),
      'revenueOpen', coalesce(sum(price) filter (where status in ('new', 'contacted')), 0)
    )
    from o
  ),
  'traffic', (
    select jsonb_build_object(
      'visitors', count(distinct session_id),
      'views', count(*) filter (where name = 'product_view'),
      'orderClicks', count(*) filter (where name = 'telegram_order_click'),
      'searches', (select count(*) from s_final),
      'favorites', count(*) filter (where name = 'favorite_toggle' and payload->>'added' = 'true')
    )
    from e
  ),
  'days', coalesce((
    select jsonb_agg(jsonb_build_object('day', day, 'visitors', visitors, 'views', views, 'orders', orders, 'revenue', revenue) order by day)
    from (
      select
        day,
        coalesce(max(visitors), 0) as visitors,
        coalesce(max(views), 0) as views,
        coalesce(max(orders), 0) as orders,
        coalesce(max(revenue), 0) as revenue
      from (
        select (created_at at time zone p_tz)::date as day,
               count(distinct session_id) as visitors,
               count(*) filter (where name = 'product_view') as views,
               null::bigint as orders, null::bigint as revenue
        from e group by 1
        union all
        select (created_at at time zone p_tz)::date,
               null, null,
               count(*) filter (where status <> 'cancelled'),
               coalesce(sum(price) filter (where status = 'done'), 0)
        from o group by 1
      ) u
      group by day
    ) d
  ), '[]'::jsonb),
  'topViewed', coalesce((
    select jsonb_agg(jsonb_build_object('productId', product_id, 'views', views, 'viewers', viewers, 'orderClicks', order_clicks) order by views desc, product_id)
    from (select * from product_events where views > 0 order by views desc, product_id limit 10) t
  ), '[]'::jsonb),
  'topOrdered', coalesce((
    select jsonb_agg(jsonb_build_object('productId', product_id, 'productName', product_name, 'orders', orders, 'revenue', revenue) order by orders desc, revenue desc)
    from (
      select product_id, max(product_name) as product_name, count(*) as orders,
             coalesce(sum(price) filter (where status = 'done'), 0) as revenue
      from o where status <> 'cancelled'
      group by product_id
      order by orders desc, revenue desc
      limit 10
    ) t
  ), '[]'::jsonb),
  'topSearches', coalesce((
    select jsonb_agg(jsonb_build_object('query', q, 'people', people, 'results', last_results) order by people desc, q)
    from (select * from searches order by people desc, q limit 20) t
  ), '[]'::jsonb),
  'missedSearches', coalesce((
    select jsonb_agg(jsonb_build_object('query', q, 'people', people) order by people desc, q)
    from (select * from searches where last_results = 0 order by people desc, q limit 20) t
  ), '[]'::jsonb)
);
$$;

revoke all on function public.admin_stats(timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.admin_stats(timestamptz, timestamptz, text) to service_role;
