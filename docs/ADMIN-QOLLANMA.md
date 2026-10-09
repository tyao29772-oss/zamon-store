# Admin panel: do‘kon egasi uchun qo‘llanma

Bu qo‘llanma saytingizni boshqarish uchun. Hammasi telefon yoki kompyuter brauzerida qilinadi,
dasturchi kerak emas. Saqlagan har bir o‘zgarishingiz saytda **darhol** ko‘rinadi.

**Kirish:** `https://<saytingiz>/admin` → parolni kiriting → **Kirish**.
Manzilni telefoningiz brauzerida **xatcho‘pga (bookmark)** saqlab qo‘ying.

> Admin sifatida kirgan bo‘lsangiz, saytda **«Admin»** tugmasi, mahsulot sahifalarida esa
> **«Tahrirlash (admin)»** tugmasi ko‘rinadi. Bu tugmalarni faqat siz ko‘rasiz, xaridorlar ko‘rmaydi.

---

## Har kuni qilinadigan ishlar

1. **Telegram'ga buyurtma xabari keladi.** Unda mijozning ismi, telefoni, mahsulot va narx
   bo‘ladi. Xabardagi tugma bilan to‘g‘ridan-to‘g‘ri buyurtmaga o‘tasiz.
2. Mijozga **qo‘ng‘iroq qiling** yoki Telegram'dan yozing. Buyurtma sahifasidagi tugmalar bilan
   bir bosishda bog‘lanasiz.
3. Buyurtma **holatini** o‘zgartiring:
   - **Yangi** — hali hech kim bog‘lanmagan.
   - **Bog‘lanildi** — mijoz bilan gaplashdingiz.
   - **Bajarildi** — mahsulot sotildi. Sayt «qoldiqdan 1 dona ayirilsinmi?» deb so‘raydi,
     **Ha** desangiz, ombordagi soni o‘zi kamayadi.
   - **Bekor qilindi** — mijoz voz kechdi.
4. Kerak bo‘lsa, **Admin izohi**ni yozing, masalan: «ertaga 15:00 da keladi, oldindan to‘ladi».
   Mijoz izohni ko‘rmaydi.

---

## Bo‘limlar

### Dashboard
Do‘kon holati bir qarashda: saytdagi mahsulotlar soni, yangi buyurtmalar, kam qolgan va tugagan
mahsulotlar. Pastdagi uchta qator (Telegram bot, baza, rasmlar) **yashil** bo‘lishi kerak.
Qizil qator bo‘lsa, saytni o‘rnatgan odamga ayting.

### Buyurtmalar
Barcha buyurtmalar, eng yangisi tepada. Holat bo‘yicha saralash (Yangi, Bog‘lanildi va
boshqalar) va mijoz ismi yoki telefoni bo‘yicha qidirish mumkin. Menyudagi qizil son — yangi
buyurtmalar soni.

### Statistika
Bugun, 7, 30 yoki 90 kun uchun:
- saytga nechta odam kirgani, nechta buyurtma tushgani va qancha sotilgani;
- **xaridor yo‘li**: nechta odam kirdi → mahsulot ko‘rdi → «Buyurtma» tugmasini bosdi → buyurtma berdi;
- eng ko‘p ko‘rilgan va eng ko‘p buyurtma qilingan mahsulotlar;
- **«Qidirib, topa olmaganlar»**: xaridorlar izlagan, lekin saytda topa olmagan narsalar.
  Qaysi mahsulotni olib kelish kerakligini aynan shu ro‘yxat ko‘rsatadi.

### Mahsulotlar
- **Yangi mahsulot** tugmasi orqali qo‘shiladi. Nomi, kategoriya, brend va qisqa tavsifni yozing.
- **Rasmlar.** **📎 Rasm qo‘shish** tugmasi bilan galereyadan tanlaysiz, telefonda **Suratga olish**
  tugmasi ham bor. Katta rasmlar o‘zi siqiladi. Birinchi rasm asosiy rasm bo‘ladi, ★ bilan
  almashtirasiz, ‹ › bilan tartiblaysiz. Kompyuterda rasmni nusxalab, **Ctrl+V** bossangiz ham
  qo‘shiladi.
- **Variantlar va narxlar.** Har bir rang va xotira hajmi alohida variant bo‘ladi: o‘z narxi,
  eski narxi (chegirma uchun) va qoldig‘i bilan. Ranglar va xotiralarni belgilasangiz,
  variantlarni sayt o‘zi yasaydi.
- **Saqlash va saytga joylash** — mahsulot darhol saytda paydo bo‘ladi.
  **Saqlash (saytda yashirin)** — saqlanadi, lekin xaridorlar hali ko‘rmaydi.
- Ro‘yxatda har bir mahsulot yonida tez amallar bor:
  - **Narx va qoldiqni tez o‘zgartirish** — formani ochmasdan;
  - **Nusxa olish** — o‘xshash mahsulotni tez qo‘shish uchun;
  - **O‘chirish** — tasdiq so‘raladi. Eski buyurtmalardagi ma’lumot buzilmaydi.
- Qoldiq **0** bo‘lsa, saytda «Tugagan» deb ko‘rinadi.

### Kategoriyalar
Saytdagi «Katalog» menyusi. Bo‘lim qo‘shish, nomini o‘zgartirish va ↑↓ bilan tartiblash mumkin.
Ichida mahsulot yoki boshqa bo‘lim bor bo‘limni o‘chirib bo‘lmaydi. Bu tasodifan o‘chirib
yuborishdan himoya.

### Brendlar
Brend qo‘shish, tahrirlash va tartiblash. Mahsulotlari bor brendni o‘chirib bo‘lmaydi.

### Bosh sahifa
Saytga kirgan odam birinchi ko‘radigan joy:
- **Asosiy blok:** tepadagi katta blok. Mahsulotni, yozuvlarni va ikkinchi tugmani tanlaysiz.
- **Reklama bannerlari** (6 tagacha): sarlavha, matn, tugma, havola, rang, rasm va yoqish/o‘chirish.
  Har bir banner ostida saytda qanday ko‘rinishi chiqib turadi.
- **Tavsiya kartalari:** sahifa o‘rtasidagi ikki katta karta.

### Sozlamalar
Do‘kon nomi, logotip yozuvi, shior, telefon, Telegram username, Instagram, manzil, ish vaqti,
yetkazib berish narxlari va kafolat, qaytarish, maxfiylik matnlari. Shu yerda o‘zgartirsangiz,
saytning hamma sahifasida o‘zgaradi. Brauzer tabidagi belgi ham logotip yozuviga qarab o‘zgaradi.

### Zaxira
- **Mahsulotlar (Excel)** va **Buyurtmalar (Excel)** — Excel'da ochish, hisoblash va chop etish uchun.
- **To‘liq zaxira** — butun do‘kon bitta faylda. **Haftada bir marta** yuklab, Google Drive yoki
  kompyuterda saqlang. Biror narsa o‘chib ketsa, shu fayldan tiklanadi.
- **Namunaviy mahsulotlar** — sayt sizga namuna mahsulotlar bilan topshirilgan bo‘lsa, ularni
  shu yerdan bitta tugma bilan o‘chirasiz. Siz qo‘shgan mahsulotlarga tegilmaydi.

---

## Xavfsizlik

- Parolni **hech kimga aytmang**, Telegram yoki SMS orqali yubormang.
- Begona kompyuterdan kirgan bo‘lsangiz, oxirida **Chiqish** tugmasini bosing.
- Parolni almashtirmoqchi bo‘lsangiz yoki parolingiz begonaga ma’lum bo‘lib qolgan deb
  o‘ylasangiz, **darhol** saytni o‘rnatgan odamga ayting. U 5 daqiqada almashtiradi, barcha
  ochiq sessiyalar avtomatik yopiladi.
- Zaxira faylida mijozlarning telefon raqamlari bor. Uni begonalarga bermang.

---

## Tez-tez beriladigan savollar

**Buyurtma Telegram'ga kelmadi.**
Botni ochib **Start** bosganmisiz? Dashboard'dagi **«Sinov xabarini yuborish»** tugmasini
bosing. Sinov xabari kelmasa, saytni o‘rnatgan odamga ayting. Buyurtmalar baribir
**Buyurtmalar** bo‘limida saqlanadi, birortasi ham yo‘qolmaydi.

**Mahsulotni vaqtincha olib qo‘ymoqchiman, lekin o‘chirmoqchi emasman.**
Mahsulotni oching, **Saytda ko‘rsatish** tugmasini o‘chiring va saqlang. Mahsulot yashiriladi,
istalgan payt qaytarasiz.

**Narxni tez o‘zgartirmoqchiman.**
**Mahsulotlar** → mahsulot yonidagi **Narx va qoldiqni tez o‘zgartirish** tugmasi.

**Saytda o‘zgarish ko‘rinmayapti.**
Sahifani yangilang (telefonda pastga torting). Admin'da saqlangan o‘zgarish darhol chiqadi.

**Telefonda ishlaydimi?**
Ha, admin panel ham, sayt ham telefonga moslangan. Rasmni to‘g‘ridan-to‘g‘ri kameradan
qo‘shish mumkin.
