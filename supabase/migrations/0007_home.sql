-- Zamon Store — 7-migratsiya: bosh sahifa sozlamalari (admin paneldagi «Bosh sahifa»).
--
-- Qanday ishga tushiriladi: Supabase → SQL Editor → New query → shu faylni to‘liq
-- joylashtiring → Run. Qayta ishga tushirish xavfsiz.
--
-- Yangi jadval kerak emas: `settings` jadvaliga ikkinchi qator (id = 'home') ruxsat etiladi.
-- Unda asosiy blok, ikki tavsiya kartasi va reklama bannerlari saqlanadi.

alter table public.settings drop constraint if exists settings_id_check;
alter table public.settings add constraint settings_id_check check (id in ('store', 'home'));
