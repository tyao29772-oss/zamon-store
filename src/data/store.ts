import { publicEnv } from "@/config/env";
import { siteConfig } from "@/config/site";
import type { Store } from "@/types";

/**
 * NAMUNAVIY MA’LUMOT: telefon, manzil, Instagram va narxlar hozircha to‘ldirilgan namuna.
 * Haqiqiy do‘kon ma’lumotlari kelganda faqat shu fayl yangilanadi.
 */
export const store: Store = {
  id: "store-1",
  name: siteConfig.name,
  slug: "zamon-store",
  description:
    "Zamon Store — Toshkentdagi telefon, noutbuk va aksessuarlar do‘koni. Original va tekshirilgan mahsulotlar, kafolat hamda tezkor javob.",
  aboutLong: [
    "Zamon Store 2019-yilda Toshkentda kichik telefon do‘koni sifatida ish boshlagan. Maqsadimiz oddiy edi: mijozga original mahsulotni halol narxda, kafolat bilan sotish.",
    "Bugun do‘konimizda iPhone, Samsung, Xiaomi, Infinix va Honor telefonlari, MacBook hamda boshqa brend noutbuklari, shuningdek chexol, zaryadchik, quloqchin va smart soat kabi aksessuarlar bor.",
    "Har bir mahsulot sotuvdan oldin tekshiriladi. Ishlatilgan va open-box telefonlarning holati (batareya, korpus, to‘liq to‘plam) alohida yozib qo‘yiladi — hech qanday yashirin holat yo‘q.",
    "Saytdagi narx va qoldiq doimiy yangilab turiladi, lekin buyurtma berishdan oldin Telegram orqali mavjudlik va yakuniy narxni tasdiqlab beramiz.",
  ],
  foundedYear: 2019,
  address: "Toshkent sh., Chilonzor tumani, Bunyodkor ko‘chasi, 12-uy",
  landmark: "Metro «Chilonzor» yaqinida",
  latitude: 41.2856,
  longitude: 69.2036,
  phone: "+998901234567",
  telegramUsername: publicEnv.telegramUsername,
  instagramUrl: "https://instagram.com/zamon.store",
  workingHours: [
    { label: "Dushanba – Shanba", hours: "09:00 – 20:00" },
    { label: "Yakshanba", hours: "10:00 – 18:00" },
  ],
  warrantyPolicy: [
    "Yangi telefon va noutbuklarga 12 oygacha, aksessuarlarga 3–6 oygacha kafolat beriladi (mahsulot sahifasida ko‘rsatilgan).",
    "Kafolat zavod nuqsonlariga tegishli: o‘z-o‘zidan o‘chib qolish, ekran/batareya bilan bog‘liq ishlab chiqarish nuqsonlari.",
    "Suv tushishi, mexanik shikast va o‘zboshimchalik bilan ta’mirlash kafolatga kirmaydi.",
    "Kafolat talon va qutisi bilan ishlaydi. Ishlatilgan mahsulotlarga kafolat muddati alohida kelishiladi.",
  ],
  returnPolicy: [
    "Mahsulotni qabul qilayotganda ko‘rikdan o‘tkazing va ishlashini tekshiring.",
    "Zavod nuqsoni topilsa, 14 kun ichida almashtirib beramiz yoki pulini qaytaramiz.",
    "Qadoqi ochilmagan va ishlatilmagan aksessuarlarni 7 kun ichida almashtirish mumkin.",
    "Qaytarish uchun talon, to‘liq to‘plam va asl qadoq kerak.",
  ],
  deliveryPolicy: [
    "Toshkent bo‘ylab yetkazib berish buyurtma tasdiqlangandan keyin 2–4 soat ichida amalga oshiriladi.",
    "Viloyatlarga pochta/kuryer orqali 1–3 kunda jo‘natamiz.",
    "To‘lov mahsulotni qabul qilganda naqd yoki karta orqali qilinadi.",
    "Yetkazib berish narxi va vaqti buyurtma tasdiqlanayotganda aniqlashtiriladi.",
  ],
  deliveryZones: [
    { name: "Toshkent shahri", price: 30_000, note: "5 000 000 so‘mdan yuqori buyurtmada bepul" },
    { name: "Toshkent viloyati", price: 50_000 },
    { name: "O‘zbekiston viloyatlari", price: 70_000, note: "1–3 kun ichida" },
  ],
  privacyPolicy: [
    "Buyurtma formasida faqat ismingiz, telefon raqamingiz va (ixtiyoriy) manzil/izohingizni so‘raymiz — bu ma’lumot faqat buyurtmangizni tasdiqlash va yetkazib berish uchun ishlatiladi hamda Telegram bot orqali do‘kon adminiga yuboriladi.",
    "Sayt ichidagi harakatlar (qidiruv, mahsulot ko‘rish, sevimlilarga qo‘shish, buyurtma bosish) haqida anonim statistika yig‘amiz — bunda ismingiz yoki telefon raqamingiz hech qachon saqlanmaydi, faqat qurilmangizda tasodifiy yaratiladigan sessiya identifikatori ishlatiladi.",
    "Sevimlilar ro‘yxati faqat brauzeringizning o‘z xotirasida (localStorage) saqlanadi — bu ma’lumot serverga yuborilmaydi va faqat shu qurilma/brauzerda ko‘rinadi.",
    "Ma’lumotlaringiz uchinchi shaxslarga sotilmaydi yoki reklama maqsadida uzatilmaydi. Yagona istisno — buyurtmani amalga oshirish uchun Telegram'ning o‘z xizmati orqali xabar yuborish.",
    "Ma’lumotlaringizni o‘chirishni so‘rash uchun Telegram orqali murojaat qilishingiz mumkin — biz uni imkon qadar tezroq bajaramiz.",
  ],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};
