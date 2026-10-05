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
