# Mahsulot fotolarini qo‘shish

Hozir saytda haqiqiy foto yo‘q, shuning uchun mahsulotlar SVG illyustratsiya bilan ko‘rinadi.
Foto qo‘shilsa, sayt uni **avtomatik** ko‘rsatadi — kodni o‘zgartirish shart emas.

## Qanday qo‘shiladi

1. `public/products/` ichida **mahsulot slug'i** nomli papka yarating (slug — mahsulot sahifasi manzilidagi nom:
   `/mahsulot/iphone-15-pro-max` → papka `iphone-15-pro-max`).
2. Fotolarni shu papkaga tashlang:

```
public/products/iphone-15-pro-max/1.webp     ← asosiy foto (kartada va galereyada birinchi)
public/products/iphone-15-pro-max/2.webp     ← qo‘shimcha burchaklar (2, 3, 4 … tartibda)
public/products/iphone-15-pro-max/hero.png   ← faqat bosh sahifa banneri uchun (shaffof fon)
```

3. `npm run images` — qaysi mahsulotda foto bor/yo‘qligini ko‘rsatadi va papka nomida xato bo‘lsa ogohlantiradi.
   (`npm run dev` va `npm run build` bu ishni o‘zi qiladi.)

Slug'lar ro‘yxati: `npm run images` chiqarishining oxirida, yoki [src/data/products/](../src/data/products/) ichidagi `slug:` maydonlari.

## Foto talablari

| Nima | Tavsiya |
|---|---|
| Format | **WebP** (yoki JPG/PNG/AVIF). WebP eng yengil |
| O‘lcham | Kvadrat, **1200 × 1200 px** (kamida 800 × 800) |
| Fon | **Oq yoki och** fon yaxshi — karta fonida oq rang o‘zi yo‘qoladi |
| Mahsulot | Kadrning 80–85% ini egallasin, atrofida bo‘sh joy qolsin |
| `hero.png` | **Shaffof fon** (PNG yoki WebP), mahsulot qirqib olingan. Qorong‘i banner ustida turadi |
| Hajm | Bittasi 300 KB dan oshmasin (saytni tezlashtiradi) |

Har bir rang varianti uchun alohida foto kerak bo‘lsa, keyingi bosqichda variantga foto biriktirish qo‘shiladi.

## Fotoni qayerdan olish mumkin (mualliflik huquqi)

Apple, Samsung va boshqa brendlarning rasmlari ularning mulki. Tijoriy saytga ruxsatsiz qo‘yish mumkin emas. Ishonchli yo‘llar:

- **O‘z do‘koningizdagi mahsulotni suratga oling** (eng ishonchli va xaridorga eng yoqadigani; oq fon yoki yorug‘ stol).
- **Yetkazib beruvchi (distribyutor)dan** rasm to‘plamini so‘rang — ular odatda tayyor mahsulot rasmlarini beradi.
- Brendning **rasmiy matbuot markazi** (press kit) rasmlari — foydalanish shartlarini albatta o‘qing.

Google/GSMArena kabi saytlardan rasm ko‘chirmang.
