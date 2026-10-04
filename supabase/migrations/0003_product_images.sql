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
