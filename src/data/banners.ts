import type { Banner } from "@/types";

export const banners: Banner[] = [
  {
    id: "banner-iphone-15-pro-max-accessories",
    title: "iPhone 15 Pro Max uchun aksessuarlar",
    subtitle: "Chexollar, himoya oynalari va MagSafe — telefoningizni birinchi kundan asrang.",
    ctaLabel: "Ko‘rish",
    href: "/katalog/aksessuarlar/chexollar",
    theme: "dark",
    sortOrder: 1,
    active: true,
  },
  {
    id: "banner-sale",
    title: "Kuz chegirmalari",
    subtitle: "Tanlangan telefon, noutbuk va aksessuarlarga chegirmalar. Miqdor cheklangan.",
    ctaLabel: "Aksiyalarni ko‘rish",
    href: "/aksiyalar",
    theme: "blue",
    sortOrder: 2,
    active: true,
  },
  {
    id: "banner-galaxy-s25-ultra",
    title: "Yangi: Samsung Galaxy S25 Ultra",
    subtitle: "Titan korpus, kuchli kamera va Galaxy AI. Do‘konda va Telegram orqali buyurtma.",
    ctaLabel: "Batafsil",
    href: "/mahsulot/samsung-galaxy-s25-ultra",
    theme: "light",
    sortOrder: 3,
    active: false,
  },
  {
    id: "banner-macbook",
    title: "MacBook Air M3 — kun bo‘yi ishlaydi",
    subtitle: "Yengil, sokin va tez. O‘qish va ish uchun eng qulay noutbuk.",
    ctaLabel: "MacBooklarni ko‘rish",
    href: "/katalog/laptoplar/macbook",
    theme: "dark",
    sortOrder: 4,
    active: false,
  },
];
