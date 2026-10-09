# Yangi do‘kon uchun saytni o‘rnatish

Bu yo‘riqnoma saytni **yangi do‘kon egasi uchun noldan ishga tushiradigan odamga** mo‘ljallangan.
Dasturchi bo‘lish shart emas: hamma ish brauzerda bajariladi, faqat 2 ta joyda kompyuterda
buyruq yoziladi. Taxminiy vaqt: **1–1,5 soat**.

Do‘kon egasi uchun alohida qo‘llanma bor: [ADMIN-QOLLANMA.md](ADMIN-QOLLANMA.md). Uni sayt
topshirilganda egasiga bering.

---

## 0. Nima kerak bo‘ladi

| Narsa | Narxi | Nima uchun |
|---|---|---|
| [GitHub](https://github.com) hisobi | Bepul | Sayt kodi shu yerda turadi |
| [Supabase](https://supabase.com) hisobi | Bepul | Ma’lumotlar bazasi: mahsulotlar, buyurtmalar, rasmlar |
| [Netlify](https://netlify.com) hisobi | Bepul | Saytni internetda ochiq qiladi |
| Telegram | Bepul | Yangi buyurtma xabari keladi |
| O‘z domeni (masalan, `dokon.uz`) | Yiliga ~50–100 ming so‘m | Ixtiyoriy, keyin ham ulash mumkin |
| Kompyuterda [Node.js 20+](https://nodejs.org) | Bepul | Faqat 2-va 4-qadamdagi buyruqlar uchun |

> **Muhim qoida:** har bir do‘kon uchun **alohida** Supabase loyihasi, **alohida** Netlify sayti va
> **alohida** Telegram bot oching. Do‘konlarning ma’lumotlari hech qachon aralashmasin.

---

## 1. Kod: qaysi repozitoriyadan

**Tavsiya etilgan yo‘l.** Sizda bitta **private** GitHub repozitoriya bo‘ladi. Har bir do‘kon
uchun Netlify'da shu repozitoriyadan **yangi sayt** ochasiz. Har bir saytning o‘z sozlamalari
bo‘ladi (3–5-qadamlar). Kodni yangilasangiz, hamma do‘konlar o‘zi yangilanadi.

**Agar do‘kon egasi kodni ham sotib olsa.** GitHub'da **Use this template** yoki **Import
repository** orqali uning hisobiga nusxa oching. Keyin quyidagi qadamlarni uning hisoblarida
bajaring.

---

## 2. Supabase: ma’lumotlar bazasi

1. [supabase.com](https://supabase.com) → **New project**.
   - **Name:** do‘kon nomi, masalan `dokon-nomi`.
   - **Database password:** **Generate** tugmasini bosing va parolni xavfsiz joyga saqlang.
   - **Region:** **Central EU (Frankfurt)**. O‘zbekistonga eng yaqin, sayt tez ishlaydi.
2. Loyiha tayyor bo‘lgach (1–2 daqiqa): chapdan **SQL Editor** → **New query**.
3. Kompyuterda `supabase/setup.sql` faylini oching, **hammasini** nusxalab (Ctrl+A, Ctrl+C) SQL
   Editor'ga joylang va **Run** bosing. Pastda **Success. No rows returned** chiqishi kerak.
   - Bu fayl hamma jadvallarni, rasm papkasini, statistika funksiyasini va himoyani yaratadi.
   - Qayta ishga tushirsangiz ham xavfsiz, mavjud ma’lumotga tegmaydi.
4. Ikkita qiymatni yozib oling. Ular 5-qadamda kerak bo‘ladi:
   - **Project Settings → Data API → Project URL**: `https://xxxx.supabase.co` → bu **`SUPABASE_URL`**.
   - **Project Settings → API Keys → Secret keys**: `sb_secret_...` → bu **`SUPABASE_SECRET_KEY`**.

> ⚠️ `SUPABASE_SECRET_KEY` — bazaning **to‘liq kaliti**. Uni hech kimga yubormang, skrinshotga
> tushirmang va hech qachon `NEXT_PUBLIC_` bilan boshlanadigan nom bilan qo‘ymang.
> **Publishable / anon** kalit bu yerda **kerak emas**.

---

## 3. Telegram bot: buyurtma xabarlari

1. Telegram'da [@BotFather](https://t.me/BotFather) → `/newbot`.
   - Nomi: masalan `Dokon Nomi buyurtmalari`.
   - Username: `_bot` bilan tugashi shart, masalan `dokonnomi_orders_bot`.
2. BotFather bergan tokenni saqlang (`1234567890:AA...`) → bu **`TELEGRAM_BOT_TOKEN`**.
3. **Do‘kon egasi** (va buyurtma oladigan har bir xodim) shu botni ochib, **Start** bosishi
   kerak. Busiz bot ularga yoza olmaydi.
4. Chat ID ni topish. Kompyuterda, loyiha papkasida:
   ```bash
   npm install
   # .env.local faylida TELEGRAM_BOT_TOKEN=... ni yozing (.env.example dan nusxa oling)
   npm run telegram:setup
   ```
   Buyruq botga Start bosganlarning ism va ID'larini ko‘rsatadi → bu **`TELEGRAM_ADMIN_CHAT_ID`**.
   - Bir nechta odam bo‘lsa, vergul bilan yozing: `111222333,444555666`.
   - Guruhga yuborish uchun botni guruhga qo‘shing, guruhda biror narsa yozing va buyruqni qayta
     ishga tushiring. Guruh ID'si `-100...` bilan boshlanadi.

---

## 4. Admin paroli va sessiya kaliti

Kompyuterda, loyiha papkasida:

```bash
npm run secrets
```

Buyruq ikki qiymat chiqaradi: **`ADMIN_PASSWORD`** (masalan, `Ab3dE-fGh7k-...`) va
**`ADMIN_SESSION_SECRET`**. Har bir do‘kon uchun **yangisini** yarating.

---

## 5. Netlify: saytni internetga chiqarish

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub**
   → repozitoriyani tanlang.
2. Build sozlamalariga tegmang, Netlify Next.js'ni o‘zi taniydi.
3. **Deploy** bosishdan oldin **Add environment variables** bo‘limiga quyidagilarni kiriting:

| Nomi | Qiymati | Qayerdan |
|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | 2-qadam |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | 2-qadam |
| `TELEGRAM_BOT_TOKEN` | `1234567890:AA...` | 3-qadam |
| `TELEGRAM_ADMIN_CHAT_ID` | `111222333` | 3-qadam |
| `ADMIN_PASSWORD` | yaratilgan parol | 4-qadam |
| `ADMIN_SESSION_SECRET` | yaratilgan kalit | 4-qadam |

   - `NEXT_PUBLIC_SITE_URL` ni yozish **shart emas**: Netlify sayt manzilini o‘zi beradi.
   - Netlify'ning bepul tarifida «Secret» belgisi bo‘lmasligi mumkin, bu normal. Qiymatlar baribir
     faqat serverda ishlatiladi.
4. **Deploy** → 2–4 daqiqa kuting. Sayt `https://<nom>.netlify.app` manzilida ochiladi.
5. Sayt nomini o‘zgartirish: **Site configuration → Change site name** → masalan `dokon-nomi`.

> Environment variable'ni keyinroq o‘zgartirsangiz, **Deploys → Trigger deploy → Deploy site**
> bosing. Aks holda o‘zgarish kuchga kirmaydi.

---

## 6. Birinchi kirish va do‘konni sozlash

1. `https://<sayt>/admin` → 4-qadamdagi parol bilan kiring.
2. **Dashboard**'da uchala qator **yashil** bo‘lishi kerak: Telegram bot, baza va rasmlar papkasi.
   - **Telegram bot** qatoridagi **«Sinov xabarini yuborish»** tugmasini bosing. Xabar Telegram'ga kelishi
     kerak.
3. **Sozlamalar**: do‘kon nomi, logotip yozuvi, shior, telefon, Telegram username, manzil, ish
   vaqti, yetkazib berish narxlari, kafolat va qaytarish matnlari.
   ⚠️ Bu yerda namunaviy telefon (`+998 90 123 45 67`) va manzil turadi. **Albatta** egasining
   haqiqiy ma’lumotlariga almashtiring.
4. **Kategoriyalar** va **Brendlar**: do‘konda yo‘q bo‘limlarni o‘chiring, keraklilarini qo‘shing.
5. **Mahsulotlar → Yangi mahsulot**: haqiqiy mahsulotlarni rasm bilan kiriting.
6. **Bosh sahifa**: tepadagi katta blok uchun mahsulot tanlang, bannerlarni do‘konga moslang.
7. **Zaxira → To‘liq zaxira**: birinchi zaxirani yuklab oling.

> **Namuna ko‘rsatish uchun.** Mijozga avval namuna mahsulotlar bilan ko‘rsatmoqchi bo‘lsangiz:
> `.env.local` ga `SUPABASE_URL` va `SUPABASE_SECRET_KEY` ni yozib, `npm run db:seed-products`
> buyrug‘ini bering. Sayt topshirilishidan oldin ularni **Zaxira → Namunaviy mahsulotlar**
> bo‘limidan bitta tugma bilan o‘chirasiz. Egasi o‘zi qo‘shgan mahsulotlarga tegilmaydi.

---

## 7. O‘z domenini ulash (ixtiyoriy)

1. Domen sotib oling: `.uz` domenlari uchun [cctld.uz](https://cctld.uz) ro‘yxatidagi
   registratorlar, `.com` uchun istalgan registrator.
2. Netlify → **Domain management → Add a domain** → domen nomini yozing.
3. Netlify ko‘rsatgan DNS yozuvlarini domen sotib olingan joyda kiriting (yoki Netlify DNS'ga
   o‘tkazing). HTTPS sertifikati avtomatik beriladi.
4. Domen ishlagach, **Deploys → Trigger deploy** bosing. Shunda sayt havolalari, sitemap va
   Telegram xabarlari yangi domenni ishlatadi.

---

## 8. Topshirishdan oldin tekshiruv ro‘yxati

- [ ] Dashboard'da uchala qator yashil, sinov xabari Telegram'ga keldi
- [ ] Telefondan saytga kirib, **haqiqiy sinov buyurtma** berildi, xabar keldi, keyin buyurtma
      «Bekor qilindi» ga o‘tkazildi
- [ ] Sozlamalar'da namunaviy telefon va manzil qolmadi
- [ ] Namunaviy mahsulotlar o‘chirilgan (agar qo‘shilgan bo‘lsa)
- [ ] Rasm yuklash ishlaydi (📎 bilan bitta mahsulotga rasm qo‘shildi)
- [ ] [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory) skanida **A+**
- [ ] Do‘kon egasiga admin manzili, parol va [ADMIN-QOLLANMA.md](ADMIN-QOLLANMA.md) berildi
- [ ] Parol egasiga **yuzma-yuz** yoki xavfsiz yo‘l bilan berildi va sizda saqlanmaydi
- [ ] Birinchi to‘liq zaxira yuklab olindi

---

## 9. Xavfsizlik bo‘yicha qoidalar

- Har do‘kon uchun **yangi** `ADMIN_PASSWORD` va `ADMIN_SESSION_SECRET`. Bir do‘konnikini
  boshqasida ishlatmang.
- `SUPABASE_SECRET_KEY` va `TELEGRAM_BOT_TOKEN` faqat Netlify'da va sizning `.env.local`
  faylingizda turadi. `.env.local` GitHub'ga **yuborilmaydi**, u `.gitignore` da.
- Supabase, Netlify va GitHub hisoblarida **ikki bosqichli himoya (2FA)** ni yoqing.
- Parolni almashtirish: Netlify'da `ADMIN_PASSWORD` ni o‘zgartiring → **Trigger deploy**. Barcha
  ochiq admin sessiyalari avtomatik yopiladi.
- Sayt himoyasi o‘rnatilgan: qattiq Content-Security-Policy, clickjacking himoyasi, HSTS,
  login urinishlarini cheklash, bazada RLS. Alohida sozlash shart emas.

---

## 10. Muammo bo‘lsa

| Belgi | Sabab va yechim |
|---|---|
| Dashboard: «Baza ulanmagan» | `SUPABASE_URL` yoki `SUPABASE_SECRET_KEY` noto‘g‘ri yoki bo‘sh. Tuzatib, **Trigger deploy** bosing |
| «Jadval yo‘q … SQL ni ishga tushiring» | 2-qadamdagi `setup.sql` ishga tushirilmagan |
| Telegram'ga xabar kelmayapti | Egasi botda **Start** bosmagan yoki chat ID noto‘g‘ri. `npm run telegram:setup -- --test` |
| Admin'ga kirib bo‘lmayapti | `ADMIN_PASSWORD` kamida 12, `ADMIN_SESSION_SECRET` kamida 32 belgi bo‘lishi kerak |
| O‘zgarish saytda ko‘rinmayapti | Admin'da saqlangani darhol chiqadi. Netlify sozlamasi o‘zgargan bo‘lsa — **Trigger deploy** |
| Bazani qayta tiklash kerak | **Zaxira** faylidan: `npm run db:restore -- fayl.json`, avval farqni ko‘rsatadi, `--yes` bilan yozadi |

Kompyuterda ulanishni tekshirish: `.env.local` ni to‘ldirib, `npm run db:check`.
