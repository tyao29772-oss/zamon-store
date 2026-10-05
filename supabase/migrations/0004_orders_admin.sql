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
