# Zamon Store — yagona loyiha prompt'i (v1.0)

> Bu fayl loyihaning yagona haqiqat manbai (single source of truth). Kod yozishda shu hujjatga amal qilinadi.
> Ziddiyat chiqsa — shu hujjat ustun. O‘zgartirish kerak bo‘lsa, avval shu fayl yangilanadi.

---

## 0. Rol va ish qoidalari

Sen senior full-stack developer, UI/UX designer va e-commerce product manager sifatida ishlaysan.

**Ish qoidalari (buzilmaydi):**
1. Kodni **bosqichma-bosqich** yoz (18-bo‘lim). Bir bosqich tugamasdan keyingisiga o‘tma.
2. Har bosqich oxirida **sifat darvozasi**dan o‘t: `tsc --noEmit`, `lint`, `build`, smoke-test, link-tekshiruv. Birortasi qizil bo‘lsa — tuzat, keyin davom et.
3. Bosqich tugagach foydalanuvchiga qisqa hisobot ber (nima qilindi, nima tekshirildi, nima qoldi) va **tasdiq kut**.
4. Yarim tayyor narsa qoldirma: `TODO`, o‘lik havola (`href="#"`), ishlamaydigan tugma, `any`, `console.log`, `@ts-ignore` bo‘lmasin. Hali ishlamaydigan funksiya UI'da umuman ko‘rsatilmaydi (masalan, savatcha ikonkasi MVP'da yo‘q).
5. Har bir sahifada **loading**, **empty**, **error** holatlari bo‘lsin.
6. Kod toza, component-based, qayta ishlatiladigan bo‘lsin. Mock data komponent ichida yozilmaydi.
7. Mavjud kod uslubiga mos yoz, keraksiz abstraksiya va ortiqcha izoh qo‘shma.
8. Qaror kerak bo‘lsa (masalan, narx, matn, kutubxona tanlovi) — oqilona default tanla, hisobotda ayt. Faqat foydalanuvchining o‘zi hal qiladigan narsani so‘ra.

---

## 1. Loyiha maqsadi

**Zamon Store** — telefon, noutbuk va aksessuar sotadigan bitta jismoniy magazinning onlayn vitrinasi (katalog + Telegram orqali buyurtma). Landing emas, ishlaydigan ko‘p sahifali web-ilova.

- Til: **o‘zbekcha (lotin)**. Belgilar: `o‘`, `g‘` (U+2018). Qidiruv esa `o'`, `o‘`, `oʻ` variantlarini bir xil qabul qiladi.
- Valyuta: **so‘m (UZS)**, butun son sifatida saqlanadi: `14 500 000 so‘m`.
- Auditoriya: O‘zbekiston, ayniqsa Toshkent; asosan mobil foydalanuvchilar.
- Sayt nomi **bitta joyda** (`src/config/site.ts`) turadi, keyinchalik admin/DB'dan o‘zgartiriladi.

## 2. Scope

**MVP'ga KIRADI:** katalog, kategoriya/brend sahifalari, filter va saralash (URL'da), qidiruv, mahsulot sahifasi (variantlar bilan), sevimlilar (localStorage), Telegram buyurtma (modal + deep link + bot xabari), event tracking, SEO, statik sahifalar (magazin haqida, aloqa, kafolat, yetkazib berish, maxfiylik), aksiyalar.

**MVP'ga KIRMAYDI (2-faza):** admin panel va auth, haqiqiy DB (Postgres/Supabase), savatcha, onlayn to‘lov (Click/Payme/Uzum Nasiya), yetkazib berish tizimi, mijoz profili, sharhlar, promo-kod, ko‘p tillilik (ru). **Lekin arxitektura ularni qo‘shishga tayyor bo‘lsin** (repository qatlami, tiplar, env).

## 3. Texnologiya

- **Next.js (App Router, oxirgi barqaror)**, **TypeScript (strict)**, **Tailwind CSS**, **lucide-react**.
- Animatsiya: asosan CSS (transition, scroll-snap). Framer Motion faqat haqiqatan kerak bo‘lsa. `prefers-reduced-motion`ga hurmat.
- Validatsiya: **zod**. Qidiruv: **MiniSearch** (yoki Fuse.js) + o‘z normalizatsiya qatlami.
- Ma’lumot: `src/data/*.ts` (mock) → faqat **repository qatlami** (`src/lib/repo/*`) orqali o‘qiladi. Repository funksiyalari `async`, shunda keyin DB'ga almashtirish oson.
- Server Components ustuvor; client component faqat interaktivlik kerak joyda (`"use client"`).
- Rasmlar: `next/image`. Haqiqiy rasm yo‘q bo‘lsa — lokal SVG **placeholder** (tashqi saytdan hotlink yo‘q, mualliflik huquqi xavfi yo‘q).
- Paketlarni versiyasi bilan `package.json`da mahkamla. Keraksiz bog‘liqlik qo‘shma.

## 4. Dizayn tizimi

Minimal, premium, Apple-uslubidagi toza elektronika do‘koni. **Mobile-first**: 360px → tablet → desktop.

| Token | Qiymat |
|---|---|
| Fon | `#F5F6F8` (sahifa), `#FFFFFF` (karta) |
| Matn | `#0B0B0F`, ikkilamchi `#5B6070` |
| Accent (ko‘k) | `#0A64F5` (hover to‘qroq) |
| Chegirma | `#E5382B` (qizil), badge uchun to‘q sariq `#F07A00` ixtiyoriy |
| Muvaffaqiyat/mavjud | yashil `#12A150`, tugagan — kulrang, kam qoldi — to‘q sariq |
| Radius | karta `20px`, tugma `14px`, chip `999px` |
| Soya | juda mayin, ko‘p qatlamli |
| Container | `max-w-[1280px]`, yon padding kamida 16px |
| Shrift | Inter (`latin` + `latin-ext`), `next/font` orqali |

- Tokenlar CSS o‘zgaruvchi (`:root`) sifatida — keyin dark mode qo‘shish oson bo‘lsin.
- Mahsulot grid: **mobil 2**, **tablet 3**, **desktop 4** ustun. Kartalar bir xil o‘lchamda.
- Narx yirik va aniq. Chegirmali narx qizil, eski narx chizilgan.
- Fokus ko‘rinadigan (`focus-visible`), kontrast WCAG AA, tugmalar min 44px teginish maydoni.

## 5. Route xaritasi

Barcha URL o‘zbekcha lotin, kichik harf, defis bilan.

| Route | Vazifa |
|---|---|
| `/` | Bosh sahifa |
| `/katalog` | Barcha mahsulotlar (filter, saralash, pagination) |
| `/katalog/[...slug]` | Kategoriya / subkategoriya: `/katalog/telefonlar`, `/katalog/telefonlar/iphone`, `/katalog/aksessuarlar/chexollar`, `/katalog/laptoplar/macbook` |
| `/brendlar/[slug]` | Brend bo‘yicha barcha mahsulot (Apple, Samsung, Xiaomi, …) |
| `/aksiyalar` | Chegirmadagi mahsulotlar |
| `/mahsulot/[slug]` | Mahsulot sahifasi (`?v=<variantId>` bilan variant ulashiladi) |
| `/qidiruv` | `?q=` natijalari |
| `/sevimlilar` | Sevimlilar |
| `/magazin-haqida` | Magazin haqida |
| `/aloqa` | Aloqa (telefon, Telegram, Instagram, manzil, xarita placeholder) |
| `/kafolat`, `/yetkazib-berish`, `/maxfiylik` | Siyosat sahifalari |
| `/api/orders` (POST) | Buyurtma qabul qilish |
| `/api/events` (POST) | Analytics eventlar |
| `/api/search` (GET) | Tezkor qidiruv takliflari |
| `/api/products` (GET) | `?ids=` bo‘yicha mahsulotlar (sevimlilar uchun) |
| `sitemap.xml`, `robots.txt` | SEO |

Mavjud bo‘lmagan slug → `notFound()` → chiroyli 404. Noto‘g‘ri query parametrlar xatoga olib kelmaydi (sanitize + default).

## 6. Navigatsiya

**Header (sticky):** logo `ZAMON` · «Katalog» (desktop: mega-menyu, mobil: drawer) · qidiruv (desktop: input + live takliflar; mobil: full-screen overlay) · sevimlilar (soni bilan badge) · Telegram/aloqa · asosiy havolalar: Bosh sahifa, Telefonlar, Aksessuarlar, Laptoplar, Aksiyalar, Magazin haqida.

**Mobil pastki bar:** Bosh sahifa · Kategoriyalar · Qidiruv · Sevimlilar · Aloqa. Faol sahifa ajratilgan. (Login yo‘q, shuning uchun «Profil» o‘rniga «Aloqa».)

**Breadcrumb** kategoriya, brend va mahsulot sahifalarida.

**Footer:** magazin nomi, telefon, Telegram, Instagram, manzil, ish vaqti, kategoriya havolalari, kafolat / yetkazib berish / maxfiylik, copyright.

## 7. Ma’lumotlar modeli (`src/types`)

Muhim: **variantlar alohida** — narx va qoldiq variantga tegishli (iPhone 256GB va 512GB narxi/qoldig‘i har xil).

```ts
type Money = number;                        // butun so‘m, float emas
type Condition = "new" | "used" | "open-box";

interface Store { id; name; slug; logo?; description; foundedYear; address; latitude?; longitude?;
  phone; telegramUsername; instagramUrl; workingHours; warrantyPolicy; returnPolicy; deliveryPolicy;
  deliveryZones: { name: string; price: Money; note?: string }[]; createdAt; updatedAt }

interface Brand { id; name; slug; logo?; description }

interface Category { id; name; slug; description; image?; parentId: string | null; sortOrder }
// yagona daraxt: telefonlar > iphone, samsung, ...; aksessuarlar > chexollar, ...; laptoplar > macbook, ...

interface ProductVariant {
  id; sku; color?; colorHex?; storage?; ram?; size? /* soat: "41 mm" */; condition: Condition; simType?;
  price: Money; oldPrice?: Money; stock: number; preorder?: boolean; warrantyMonths: number;
  note?: string; // masalan, ishlatilgan telefon: "Batareya 89%"
}

interface SpecGroup { title: string; items: { label: string; value: string }[] }

interface Product {
  id; slug; name; brandId; categoryId /* eng chuqur (leaf) kategoriya */;
  model?: string; shortDescription; description; images: string[];
  variants: ProductVariant[];                // kamida 1 ta
  specs: SpecGroup[];
  attributes: Record<string, string | number | string[]>; // filterlar uchun: cpu, gpu, screenSize, material, power, port, compatibility ...
  keywords: string[]; featured: boolean; popularity: number;  // sotuv ballari
  ratingAvg: number; ratingCount: number;    // MVP'da mock
  relatedIds?: string[]; bundleIds?: string[];
  isPublished: boolean; createdAt; updatedAt; seo?: { title?; description? };
}

interface Banner { id; title; subtitle; ctaLabel; href; image?; theme; sortOrder; active }
interface Order { id /* "QP-000123" */; productId; variantId; customerName; phone; note?;
  status: "new" | "contacted" | "done" | "cancelled"; source: "site"; createdAt }
type EventName = "search" | "search_result_click" | "product_view" | "telegram_order_click" | "order_submit" | "favorite_toggle";
interface AnalyticsEvent { name: EventName; sessionId; timestamp; payload: Record<string, string | number | boolean | null> }
```

**Hisoblanadigan qiymatlar (saqlanmaydi):** `discountPercent = round((oldPrice - price) / oldPrice * 100)`, `stockStatus` (`in_stock` / `low` (≤3) / `preorder` / `out_of_stock`), `priceFrom` (mavjud variantlar ichida eng arzon narx; hech biri mavjud bo‘lmasa — barcha variantlardan).

## 8. Kategoriyalar va filterlar

**Daraxt:**
- **Telefonlar:** iPhone, Samsung, Infinix, Honor, Redmi / Xiaomi, Poco, Boshqa telefonlar
- **Aksessuarlar:** Chexollar, Himoya oynalari, Zaryadchiklar (adapter, kabel, wireless, car charger), Powerbanklar, Quloqchinlar, Simsiz quloqchinlar, Smart watch, Telefon stendlari, Boshqa aksessuarlar
- **Laptoplar:** MacBook, HP, Lenovo, Asus, Acer, Boshqa laptoplar

Har mahsulot bitta leaf kategoriyada; ota kategoriya sahifasi bola kategoriyalarning barchasini ko‘rsatadi. Bir xil tovar ikki joyda takrorlanmaydi.

**Filterlar konfiguratsiya orqali** (`src/config/filters.ts`) — kategoriyaga bog‘langan, komponentga qattiq yozilmaydi. Filter qiymatlari mavjud mahsulotlardan hisoblanadi (faceting), soni bilan.

- **Telefonlar:** brend, model, narx oralig‘i, xotira (64GB…1TB), rang, holati (yangi/ishlatilgan/open-box), SIM turi, kafolat bor/yo‘q, faqat mavjudlar, faqat chegirmadagilar
- **Laptoplar:** brend, narx, protsessor, RAM, SSD/HDD, ekran o‘lchami, video karta, holati, mavjudlik
- **Aksessuarlar:** brend, telefon modeli bilan mosligi, tur, rang, narx, mavjudlik; **Chexollar** +material (silikon, teri, shaffof, MagSafe, mustahkam); **Zaryadchiklar** +quvvat (20/25/33/45/65/100W), +port (USB-C, USB-A, Lightning)
- Chexollarda: avval brend, keyin model tanlanadi (iPhone → iPhone 15 Pro Max → mos chexollar).

**Filter holati URL'da** (`?brend=apple&xotira=256GB&narx_min=…&saralash=arzon&sahifa=2`): ulashish, «orqaga» tugmasi, SEO. Noto‘g‘ri qiymatlar e’tiborsiz qoldiriladi.

**Saralash:** Tavsiya etilgan · Arzonidan qimmatiga · Qimmatidan arzoniga · Eng yangilari · Eng ko‘p sotilganlar · Chegirmadagilar.

**UI:** desktop — chap sidebar; mobil — pastdan ochiladigan filter drawer («Filter» tugmasi + faol filter soni + «Tozalash»). Pagination: sahifalash (12 ta/sahifa), server tomonda; natija soni ko‘rsatiladi. Filter natijasi bo‘sh bo‘lsa — empty state («Filterni tozalash» tugmasi bilan).

## 9. Mahsulot kartasi va sahifasi

**Karta:** rasm (bir xil aspekt), sevimlilar yuragi, nom, qisqa xususiyat (`256 GB · Natural Titanium`), narx, eski narx, `-3%` badge, reyting, holat belgisi (Mavjud / Kam qoldi / Oldindan buyurtma / Tugagan), sahifaga havola (butun karta), «Telegram orqali so‘rash» tugmasi. Tugagan mahsulotda tugma o‘rniga «Xabar bering» (Telegram so‘rov).

**Sahifa (`/mahsulot/[slug]`):** rasm galereyasi + thumbnail (klaviatura bilan boshqariladi) · nom · brend va kategoriya (havolalar) · reyting va sharhlar soni (placeholder) · narx / eski narx / chegirma · **variant tanlash** (rang, xotira, RAM, holat — mavjud kombinatsiyalar, mavjud bo‘lmaganlari o‘chirilgan; tanlov narx, qoldiq, kafolat va URL `?v=`ni yangilaydi) · mavjudlik · kafolat muddati · yetkazib berish qisqa ma’lumoti · magazin manzili · to‘liq tavsif · texnik xususiyatlar jadvali · **«Telegram orqali buyurtma berish»** (asosiy CTA, sticky mobil pastki panel) · «Sevimlilarga qo‘shish» · «O‘xshash mahsulotlar» · «Bu mahsulot bilan birga olishadi».

## 10. Qidiruv

- Butun katalog bo‘ylab: nom, brend, model, xotira, kategoriya, kalit so‘zlar.
- **Normalizatsiya:** kichik harf; `o'`/`oʻ`/`o‘` → bir xil; `g'`… ham; probellar/defis; **kirill → lotin** transliteratsiya; sinonimlar lug‘ati (`src/config/synonyms.ts`): `zaryadchik ≈ adapter ≈ зарядка ≈ zaryadka`, `chexol ≈ chehol ≈ чехол ≈ case`, `quloqchin ≈ naushnik ≈ наушники ≈ airpods`, `type c ≈ usb-c ≈ typec`, `noutbuk ≈ laptop ≈ ноутбук`, `redmi ≈ xiaomi`, `telefon ≈ smartfon ≈ phone`.
- Xato yozuvga chidamli (fuzzy), prefiks bo‘yicha ham topadi. Misollar ishlashi shart: `iphone 15`, `samsung s24`, `airpods`, `type c`, `redmi`, `zaryadchik`, `macbook`, `чехол`.
- **Header'da live takliflar** (debounce, `/api/search`), **`/qidiruv?q=`** to‘liq natijalar (rasm, nom, kategoriya, brend, narx, mavjudlik), mobil full-screen overlay (oxirgi qidiruvlar localStorage'da).
- Natija topilmasa: ommabop kategoriyalar va mahsulotlar taklif qilinadi.
- «Eng ko‘p qidirilgan» bloki: MVP'da statik ro‘yxat (keyin analytics'dan).
- Natijaga bosilganda `search_result_click` event.

## 11. Sevimlilar

- `FavoritesProvider` (context) + localStorage; SSR/hydration mos kelmasligi bo‘lmasin (`useSyncExternalStore` yoki mount'dan keyin o‘qish).
- Yurak tugmasi kartada va mahsulot sahifasida, toast: «Sevimlilarga qo‘shildi» / «Sevimlilardan o‘chirildi».
- `/sevimlilar`: mahsulotlar `/api/products?ids=` orqali olinadi, o‘chirish mumkin, tugagan mahsulot belgilanadi, empty state.
- Keyin login bo‘lganda DB bilan sinxronlash uchun `FavoritesStore` interfeysi ajratilgan bo‘lsin.
- Tablar orasida sinxron (`storage` eventi).

## 12. Telegram buyurtma (eng muhim funksiya)

**Oqim (Variant B + A birlashgan):**
1. Mahsulot sahifasida/kartada «Telegram orqali buyurtma berish» → **modal** (`<dialog>`, fokus tuzoqi, Esc bilan yopiladi): tanlangan mahsulot va variant (o‘zgartirib bo‘lmaydi, faqat ko‘rsatiladi), **Ism**, **Telefon (+998 formati, validatsiya)**, **Manzil/izoh**, yashirin honeypot maydon.
2. `POST /api/orders`: zod validatsiya → rate-limit (IP bo‘yicha, xotirada) → buyurtma ID (`QP-000123`) yaratiladi → `OrderRepository` orqali saqlanadi → **agar `TELEGRAM_BOT_TOKEN` va `TELEGRAM_ADMIN_CHAT_ID` bor bo‘lsa** bot adminga xabar yuboradi (yo‘q bo‘lsa jimgina o‘tkazib yuboriladi va log yoziladi, sayt buzilmaydi).
3. Javobdan so‘ng mijozga `https://t.me/<NEXT_PUBLIC_TELEGRAM_USERNAME>?text=<tayyor xabar>` ochiladi. Xabarda buyurtma raqami bor, shunda admin bot xabari bilan mijoz xabarini bog‘laydi va ikki marta buyurtma bo‘lib qolmaydi.
4. **Zaxira:** «Xabarni nusxalash» tugmasi (deep link matnni har klientda avto-to‘ldirmasligi mumkin). Muvaffaqiyat ekrani: buyurtma raqami + «Telegramni ochish».
5. Modalsiz tezkor yo‘l: «Telegramda savol berish» (Variant A) — faqat deep link, event bilan.

**Tayyor xabar:**
```
Assalomu alaykum. Men Zamon Store saytidan quyidagi mahsulotga qiziqyapman:

Buyurtma: #QP-000123
Mahsulot: {name}
Variant: {rang} / {xotira}        ← tanlanmagan bo‘lsa «tanlanmagan»
Narx: {formatPrice} 
Havola: {SITE_URL}/mahsulot/{slug}?v={variantId}

Narxi va mavjudligini tasdiqlab bera olasizmi?
```

**Xavfsizlik:** bot token **faqat server**da (`NEXT_PUBLIC_` prefiksisiz, klient bundle'da yo‘q — build'dan keyin tekshiriladi). Foydalanuvchi matni Telegram HTML/Markdown'da escape qilinadi. Narx **serverda** variantdan qayta olinadi (klientdan kelgan narxga ishonilmaydi).

## 13. Analytics

- `trackEvent(name, payload)` (klient) → `navigator.sendBeacon('/api/events')`; `sessionId` — sessionStorage'dagi tasodifiy ID.
- Server `EventRepository` orqali saqlaydi. MVP'da lokal: `.data/events.jsonl`, `.data/orders.jsonl` (serverless muhitda yozish mumkin bo‘lmasa — xato bermaydi, console'ga log; keyin DB bilan almashtiriladi).
- Eventlar: `search` (query, resultCount), `search_result_click` (query, productId), `product_view`, `telegram_order_click` (`productId, productName, price, category, selectedColor, selectedStorage`), `order_submit`, `favorite_toggle`.
- Tashqi analytics (Umami/GA4/Yandex Metrika) ulash uchun `trackEvent` ichida bitta kengaytirish nuqtasi.
- Maxfiylik: shaxsiy ma’lumot (telefon/ism) eventlarga yozilmaydi.

## 14. SEO va tezlik

- Har sahifada `metadata` / `generateMetadata` (title shabloni `%s | Zamon Store`, description, canonical, OpenGraph).
- Mahsulotda **JSON-LD `Product`** (narx UZS, availability), kategoriyalarda `BreadcrumbList`.
- `sitemap.ts` (barcha sahifa + mahsulot + kategoriya + brend), `robots.ts`.
- Filterli/paginatsiyali URL'lar `noindex` yoki canonical bilan boshqariladi.
- `generateStaticParams` mahsulot, kategoriya, brend uchun. Rasmlar `next/image` (o‘lcham, `sizes`, LCP rasmiga `priority`).
- `lang="uz"`. Lighthouse mobil: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 (o‘lchash imkoni bo‘lsa).

## 15. Mock data

`src/data/` ichida: `store.ts`, `brands.ts`, `categories.ts`, `products/*.ts` (kategoriya bo‘yicha), `banners.ts`, `synonyms` (config'da). Kamida **45+ mahsulot**, kamida 25 tasi bir nechta variantli. **Namunaviy narxlar** — real emas; README'da va data faylida aniq yozib qo‘yiladi. Do‘konning haqiqiy ro‘yxati kelganda faqat data fayllar almashtiriladi.

- **iPhone:** 15 Pro Max, 15 Pro, 15, 14 Pro Max, 13, 12 (+ yangi avlodlardan 1–2 ta namunaviy)
- **Samsung:** Galaxy S24 Ultra, S24, A55, A35, A15 (+ S25 Ultra)
- **Infinix:** Note 40 Pro, Hot 40, GT 20 Pro · **Honor:** 200, X8b, X7b
- **Redmi/Xiaomi:** Redmi Note 13 Pro, Note 13, 13C, Xiaomi 14 · **Poco:** X6 Pro
- **Aksessuarlar:** AirPods Pro, AirPods 3, Galaxy Buds, Type-C 20W va 33W adapter, USB-C kabel, Lightning kabel, 10 000 mAh powerbank, MagSafe charger, Apple Watch, Galaxy Watch, telefon stendi, car charger, himoya oynasi
- **Chexollar:** iPhone 15 Pro Max silikon va MagSafe, S24 Ultra himoya, Redmi Note 13 silikon (`attributes.compatibility` bilan)
- **Laptoplar:** MacBook Air M3, MacBook Pro M3 Pro, HP Pavilion, Lenovo IdeaPad, Asus VivoBook (+ Acer 1 ta)
- Mahsulotlar orasida tugagan, kam qolgan, oldindan buyurtma, ishlatilgan va open-box holatlar ham bo‘lsin (UI holatlarini sinash uchun).
- Namuna: **iPhone 15 Pro Max 256 GB**, Natural Titanium, yangi, 12 oy kafolat, 14 500 000 so‘m (eski 15 000 000), mavjud.

**Rasmlar:** `ProductImage` komponenti — `images[]` bo‘lsa `next/image`, bo‘lmasa turkumga mos (telefon/noutbuk/aksessuar) chiroyli SVG placeholder (brend rangi, model nomi). Real rasm: `public/products/<slug>/1.webp` ga qo‘yilib, data'da yo‘l ko‘rsatiladi.

## 16. Papka tuzilmasi

```
docs/PROJECT_PROMPT.md
src/
  app/
    layout.tsx, page.tsx, loading.tsx, error.tsx, not-found.tsx, globals.css
    katalog/page.tsx, katalog/[...slug]/page.tsx
    brendlar/[slug]/page.tsx
    aksiyalar/page.tsx
    mahsulot/[slug]/page.tsx
    qidiruv/page.tsx
    sevimlilar/page.tsx
    magazin-haqida/ aloqa/ kafolat/ yetkazib-berish/ maxfiylik/
    api/{orders,events,search,products}/route.ts
    sitemap.ts, robots.ts
  components/
    layout/  Header, MegaMenu, MobileNav, Footer, Container, Breadcrumbs
    product/ ProductCard, ProductGrid, ProductImage, ProductGallery, VariantSelector, PriceBlock, StockBadge, SpecsTable, RatingStars
    catalog/ ProductFilters, FilterDrawer, SortSelect, Pagination, SubcategoryChips
    home/    HeroBanner, QuickCategories, BrandsStrip, WhyUs, ProductRail
    search/  SearchBar, SearchOverlay, SearchResults
    telegram/ TelegramOrderButton, OrderModal, OrderSuccess
    favorites/ FavoriteButton
    ui/      Button, Badge, Chip, Toast(+Provider), Skeleton, EmptyState, Modal
  config/    site.ts, filters.ts, synonyms.ts
  data/      store.ts, brands.ts, categories.ts, banners.ts, products/*.ts
  lib/
    repo/    products.ts, categories.ts, brands.ts, orders.ts, events.ts, store.ts
    search/  normalize.ts, index.ts
    format.ts (formatPrice, formatDate), telegram.ts (createTelegramOrderLink, buildOrderMessage, sendAdminMessage),
    analytics.ts (trackEvent), catalog.ts (parseFilters, applyFilters, sortProducts, facets), rate-limit.ts, seo.ts
  providers/ FavoritesProvider, ToastProvider, OrderModalProvider
  types/     store.ts, catalog.ts, product.ts, order.ts, events.ts
scripts/     smoke.mjs, check-links.mjs, check-secrets.mjs
public/      placeholders/, favicon, og-image
```

## 17. Environment

`.env.example` (repo'ga kiradi) va `.env.local` (kirmaydi):
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_TELEGRAM_USERNAME=zamon_store_demo
TELEGRAM_BOT_TOKEN=            # faqat server
TELEGRAM_ADMIN_CHAT_ID=        # faqat server
```
Env'lar bitta joyda (`src/config/env.ts`) o‘qiladi va tekshiriladi; yetishmasa dev'da aniq ogohlantirish, prod'da xavfsiz fallback.

## 18. Bosqichlar va sifat darvozalari

Har bosqich tugagach: **tsc → lint → build → smoke → link-tekshiruv → (imkon bo‘lsa) brauzerda mobil 390px + desktop 1280px ko‘rish, console xatosiz** → hisobot → **tasdiq**.

| # | Bosqich | Natija |
|---|---|---|
| 1 | **Poydevor** | Next.js loyiha, tokenlar, tiplar, mock data, repository qatlami, format/telegram/normalize util'lari, tekshiruv skriptlari. Repo funksiyalari script bilan sinaladi. |
| 2 | **Umumiy qobiq + Bosh sahifa** | Header (mega-menyu, qidiruv tugmasi), MobileNav, Footer, Toast, Favorites, ProductCard/Grid/Image, skeleton, EmptyState, error/404. **Bosh sahifa to‘liq.** |
| 3 | **Katalog** | `/katalog`, kategoriya/subkategoriya, `/brendlar/[slug]`, `/aksiyalar`, breadcrumb, filterlar (URL), saralash, pagination, mobil filter drawer. |
| 4 | **Mahsulot sahifasi** | Galereya, variantlar, narx/qoldiq/kafolat, specs, o‘xshash va birga olinadigan, JSON-LD. |
| 5 | **Qidiruv + Sevimlilar** | Normalizatsiya, live takliflar, overlay, `/qidiruv`, `/sevimlilar`, search eventlar. |
| 6 | **Telegram buyurtma** | Modal, `/api/orders`, bot xabari, deep link, nusxalash, rate-limit, event tracking. |
| 7 | **Statik sahifalar + SEO + sayqal** | Magazin haqida, aloqa, kafolat, yetkazib berish, maxfiylik, sitemap/robots, a11y va performance o‘tish, README (ishga tushirish + 2-faza yo‘l xaritasi). |

**Sifat darvozasi tafsiloti:**
- `npx tsc --noEmit`, `npm run lint`, `npm run build` — xato ham, ogohlantirish ham qoldirilmaydi.
- `scripts/smoke.mjs` — barcha route'lar 200 (yoki kutilgan 404) qaytaradi va kutilgan matn bor.
- `scripts/check-links.mjs` — `/` dan boshlab barcha ichki havolalarni yuradi: o‘lik havola = 0.
- `scripts/check-secrets.mjs` — build'dan keyin `.next/static` ichida `TELEGRAM_BOT_TOKEN` qiymati/nomi yo‘qligini tekshiradi.
- Foydalanuvchi stsenariylari qo‘lda/skript bilan: Bosh sahifa → kategoriya → filter → mahsulot → variant → buyurtma modal → Telegram link; qidiruv; sevimlilar qo‘shish/o‘chirish.

## 19. 2-faza yo‘l xaritasi (hozir yozilmaydi, faqat tayyorgarlik)

1. **DB:** Supabase/PostgreSQL — `src/lib/repo/*` ichidagi implementatsiyani almashtirish; jadvallar tiplardan kelib chiqadi. (Shaxsiy ma’lumot saqlash bo‘yicha O‘zbekiston talablarini tekshirib, server joylashuvini tanlash.)
2. **Admin:** tayyor CMS (Payload/Supabase Studio) yoki yengil o‘z admin: mahsulot CRUD, rasm yuklash, «Mavjud/Tugagan» bir bosishda, narx yangilash, bannerlar, buyurtmalar, qidiruv statistikasi, Telegram bosilishlari, dashboard.
3. **Telegram bot:** buyurtma holatini bot orqali boshqarish, `/start ORDER_ID`.
4. **Keyingi:** nasiya/bo‘lib to‘lash ko‘rsatkichi, savatcha, Click/Payme, yetkazib berish, ru tili, sharhlar, promo-kod.
