# Zamon Store

Toshkentdagi telefon, noutbuk va aksessuar do‘koni uchun zamonaviy, mobilga mos e-commerce
**katalog MVP**'i. To‘lov/checkout yo‘q — buyurtma Telegram orqali qabul qilinadi.

To‘liq mahsulot spetsifikatsiyasi: [`docs/PROJECT_PROMPT.md`](docs/PROJECT_PROMPT.md).

> ⚠️ **Namunaviy ma’lumot**: barcha mahsulot, narx, do‘kon manzili/telefon/ish vaqti hozircha
> **o‘ylab topilgan namuna** — real emas. Haqiqiy do‘kon ma’lumotlari kelganda faqat
> `src/data/` papkasidagi fayllar almashtiriladi (pastga qarang).

## Texnologiyalar

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
MiniSearch (qidiruv) · Zod (validatsiya) · lucide-react.

Backend yo‘q — ma’lumotlar `src/data/*.ts` fayllarida (in-memory), buyurtma/eventlar esa
`.data/*.jsonl` fayllarga lokal yoziladi (2-faza'da haqiqiy DB bilan almashtiriladi).

## Ishga tushirish

Talab: Node.js **20.9+**.

```bash
npm install
cp .env.example .env.local   # kerak bo‘lsa qiymatlarni to‘ldiring (pastga qarang)
npm run dev
```

Brauzerda [http://localhost:3000](http://localhost:3000) ni oching.

### Environment o‘zgaruvchilari (`.env.local`)

| O‘zgaruvchi | Majburiymi? | Tavsif |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yo‘q (standart: `http://localhost:3000`) | Sayt manzili — `sitemap.xml`, JSON-LD va Telegram xabaridagi havolalar shundan quriladi. Productionda haqiqiy domenga o‘zgartiring, oxirida `/` bo‘lmasin. |
| `NEXT_PUBLIC_TELEGRAM_USERNAME` | Yo‘q (standart: demo username) | Buyurtma tugmasi/deep-link shu username'ga ochiladi. `@` belgisisiz. |
| `TELEGRAM_BOT_TOKEN` | Yo‘q | To‘ldirilsa, yangi buyurtmada bot orqali adminga avtomatik xabar boradi. [@BotFather](https://t.me/BotFather) orqali olinadi. |
| `TELEGRAM_ADMIN_CHAT_ID` | Yo‘q | Admin xabari yuboriladigan chat ID. Bir nechta bo‘lsa — vergul bilan (masalan, egasi va sotuvchi yoki xodimlar guruhi). `npm run telegram:setup` botga yozganlarning ID sini topadi, `-- --write` uni `.env.local` ga yozadi, `-- --test` sinov xabari yuboradi. Ikkalasi (token + chat ID) to‘ldirilmasa, bot xabari jimgina o‘tkazib yuboriladi — sayt va buyurtmani saqlash baribir ishlayveradi. |
| `ADMIN_PASSWORD` | Admin panel uchun | `/admin` ga kirish paroli, kamida 12 belgi. Kuchli parol tanlang. |
| `ADMIN_SESSION_SECRET` | Admin panel uchun | Sessiya cookie'sini imzolash kaliti, kamida 32 belgi: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Ikkalasi to‘ldirilmaguncha `/admin` ga kirib bo‘lmaydi. Parol yoki kalit almashtirilsa, barcha admin sessiyalari bekor bo‘ladi. |
| `SUPABASE_URL` | Productionda ha | Supabase loyihasi manzili (`https://<loyiha>.supabase.co`). Bo‘sh bo‘lsa, buyurtma va statistika lokal `.data/` fayllariga yoziladi — Netlify'da ular saqlanmaydi. |
| `SUPABASE_SECRET_KEY` | Productionda ha | Supabase'ning maxfiy server kaliti (`sb_secret_...`). Faqat serverda ishlatiladi; ochiq `publishable`/`anon` kalit emas. |

### Supabase bazasini ulash

1. [supabase.com](https://supabase.com) da loyiha oching.
2. **SQL Editor → New query** da `supabase/migrations/` dagi fayllarni tartib bilan (`0001_…` … `0007_…`) to‘liq joylashtirib, **Run** bosing. `0003` — admin paneldan yuklanadigan mahsulot rasmlari uchun Storage papkasi, `0006` — brendlar va kategoriyalar, `0007` — bosh sahifa sozlamalari.
3. `SUPABASE_URL` va `SUPABASE_SECRET_KEY` ni `.env.local` ga (va Netlify Environment variables'ga) qo‘ying.
4. `npm run db:check` — manzil, kalit va jadvallarni tekshiradi.
5. `npm run db:seed-products` — `src/data/products` dagi mahsulotlarni bazaga ko‘chiradi (faqat yo‘qlarini qo‘shadi, admin tahrirlariga tegmaydi). Shundan keyin sayt mahsulotlarni bazadan o‘qiydi, ularni admin paneldan boshqarasiz. Brend va kategoriyalar admin paneldagi birinchi o‘zgarishda o‘zi bazaga ko‘chadi (qo‘lda: `npm run db:seed-taxonomy`).

⚠️ Supabase sozlangan bo‘lsa, `npm run build` ham mahsulotlarni bazadan oladi — jadval yo‘q yoki bo‘sh bo‘lsa, avval 2- va 5-qadamni bajaring. Testlarni bazaga yozmasdan ishlatish: `SUPABASE_URL= npm run build`.

Jadvallarda RLS yoqilgan va policy yo‘q: ochiq kalit bilan hech narsa o‘qib/yozib bo‘lmaydi, faqat server kaliti ishlaydi.

Hech biri sirli qilib `NEXT_PUBLIC_` bilan boshlanmaydi — token/chat ID faqat serverda o‘qiladi.

## Skriptlar

| Buyruq | Nima qiladi |
|---|---|
| `npm run dev` | Development server (Turbopack, hot-reload) |
| `npm run build` | Production build |
| `npm start` | Production serverni ishga tushiradi (`build`dan keyin) |
| `npm run typecheck` | TypeScript tekshiruvi (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run test:foundation` | Tez unit/integratsiya testlari (repo, filter, qidiruv, SEO, rate-limit va h.k.) |
| `npm run e2e` | Haqiqiy brauzerda (Chrome) to‘liq foydalanuvchi ssenariylari — server oldindan ishlab turishi kerak (`BASE_URL` bilan) |
| `npm run smoke` | Ishlab turgan serverga tezkor tutunlik testi |
| `npm run check:links` | Saytni boshidan yurib, o‘lik ichki havolalarni topadi |
| `npm run check:secrets` | Klient bundle'ida token/parol kabi maxfiy qiymat sizib chiqmaganini tekshiradi |
| `npm run db:check` | Supabase ulanishi, kalit va jadvallarni tekshiradi (kalitni ekranga chiqarmaydi) |
| `npm run db:seed-products` | Kod fayllaridagi mahsulotlarni bazaga ko‘chiradi (mavjudlariga tegmaydi; `-- --force` — ustidan yozadi) |
| `npm run db:seed-taxonomy` | Standart brend va kategoriyalarni bazaga ko‘chiradi (mavjudlariga tegmaydi) |
| `npm run images` | `public/products/` dagi rasmlarni mahsulotlarga bog‘laydi + hisobot |

Yangi kod yuborishdan oldin tavsiya etilgan tartib:

```bash
npm run typecheck && npm run lint && npm run build
npm run test:foundation
npm start &            # yoki: BASE_URL=http://localhost:3100 bilan boshqa portda
BASE_URL=http://localhost:3000 npm run e2e
BASE_URL=http://localhost:3000 npm run check:links
npm run check:secrets
```

## Haqiqiy do‘kon ma’lumotlarini qo‘yish

Barcha namunaviy ma’lumot bitta joyda — `src/data/`:

- `store.ts` — do‘kon nomi, manzil, telefon, ish vaqti, kafolat/yetkazib berish/maxfiylik matnlari.
- `brands.ts`, `categories.ts` — brend va kategoriya ro‘yxati.
- `products/*.ts` — mahsulotlar (kategoriya bo‘yicha bo‘lingan fayllar), har biri variant(lar)i bilan.
- `banners.ts` — bosh sahifadagi bannerlar.

Haqiqiy mahsulot foto: `public/products/<slug>/1.webp` (va h.k.) ga qo‘yiladi, keyin
`npm run images` shu rasmlarni avtomatik mahsulotlarga bog‘laydi. Foto bo‘lmagan mahsulotlar
uchun sayt avtomatik chiroyli SVG illyustratsiya ko‘rsatadi (kamchilik emas — dizayn qarori).

Ma’lumotlarni o‘zgartirgandan keyin `npm run test:foundation` ni qayta ishga tushiring — u
data bilan bog‘liq ko‘plab haqiqiy holatni (chegirma, variant, qidiruv va h.k.) tekshiradi.

## Loyihaning holati (MVP qamrovi)

✅ Katalog, filter/saralash (URL orqali), qidiruv (sinonim va kirill-lotin bilan), mahsulot
sahifasi (variantlar), sevimlilar (localStorage), Telegram orqali buyurtma (modal + deep-link +
bot xabari), event tracking, statik sahifalar, `sitemap.xml`/`robots.txt`, JSON-LD (`Product`,
`BreadcrumbList`).

❌ MVP'ga kirmaydi: haqiqiy to‘lov (Click/Payme), admin panel, real baza, foydalanuvchi hisobi,
buyurtma holatini kuzatish sahifasi.

## 2-faza yo‘l xaritasi

Loyiha real do‘konga aylanganda quyidagilar tavsiya etiladi (muhimlik tartibida emas):

1. **Real baza** — `.data/*.jsonl` va `src/data/*.ts` o‘rniga Postgres/MySQL + ORM (masalan
   Prisma). Repo qatlami (`src/lib/repo/*.ts`) allaqachon shu almashtirishga tayyor — funksiya
   imzolari o‘zgarmaydi, faqat ichki implementatsiya.
2. **Admin panel** — mahsulot/buyurtma/qoldiqni saytdan tashqarida boshqarish (hozir faqat
   kod orqali data fayllarni tahrirlash bilan mumkin).
3. **Haqiqiy to‘lov** — Click, Payme yoki Uzcard/Humo orqali onlayn to‘lov (hozir faqat naqd/
   karta qo‘lda, Telegram orqali kelishiladi).
4. **Buyurtma holati** — mijoz o‘z buyurtmasini kuzatishi mumkin bo‘lgan sahifa (hozir faqat
   admin Telegram orqali qo‘lda javob beradi).
5. **Yetkazib berish integratsiyasi** — kuryer xizmati API'si bilan avtomatik hisoblash
   (hozir `deliveryZones` — statik narxlar).
6. **Ko‘p omborxona / filiallar** — hozir bitta `Store` obyekti bor.
7. **Rasmiy analytics** — GA4/Yandex Metrika yoki Umami ulash (`src/lib/analytics.ts`da
   kengaytirish nuqtasi tayyor).
8. **Foydalanuvchi hisobi** — buyurtma tarixi, saqlangan manzillar (hozir sevimlilar ham
   faqat brauzer xotirasida, hisobsiz).
9. **Haqiqiy mahsulot fotosuratlari** — hozir `images[]` bo‘sh mahsulotlarda SVG illyustratsiya
   ishlatiladi (Wikimedia Commons'da bu mahsulotlar uchun mos litsenziyalangan katalog fotosi
   topilmadi — tekshirilgan). Do‘konning o‘z suratlari `public/products/<slug>/`ga qo‘yiladi.
10. **Ko‘p til** — hozir faqat o‘zbekcha (lotin). `siteConfig.language`/`locale` shu uchun
    ajratib qo‘yilgan.
