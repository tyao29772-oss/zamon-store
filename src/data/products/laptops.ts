import { defineProduct, group, variantMatrix, type Color } from "@/data/builders";
import type { Product, SpecGroup } from "@/types";

/** NAMUNAVIY narxlar va qoldiqlar — haqiqiy ro‘yxat kelganda almashtiriladi. */

function laptopSpecs(input: {
  screen: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  battery: string;
  weight: string;
  os: string;
}): SpecGroup[] {
  return [
    group("Ekran", [["Diagonal va turi", input.screen]]),
    group("Protsessor va grafika", [
      ["Protsessor", input.cpu],
      ["Video karta", input.gpu],
    ]),
    group("Xotira", [
      ["Operativ xotira", input.ram],
      ["Doimiy xotira", input.storage],
    ]),
    group("Umumiy", [
      ["Batareya", input.battery],
      ["Vazni", input.weight],
      ["Operatsion tizim", input.os],
    ]),
  ];
}

const MIDNIGHT: Color = { name: "Midnight", hex: "#2E3642" };
const STARLIGHT: Color = { name: "Starlight", hex: "#F0E9DF" };
const SPACE_GRAY: Color = { name: "Space Gray", hex: "#7D7E80" };
const SILVER: Color = { name: "Silver", hex: "#D5D7DB" };

export const laptopProducts: Product[] = [
  defineProduct({
    slug: "macbook-air-m3",
    name: "MacBook Air M3 13.6\"",
    brandId: "apple",
    categoryId: "laptoplar-macbook",
    model: "MacBook Air M3",
    shortDescription: "M3 chipi, 13.6 dyuym Liquid Retina, 18 soatgacha ishlaydi.",
    description:
      "MacBook Air M3 — sovutish shovqinisiz ishlaydigan, 1.24 kg yengil noutbuk. O‘qish, ofis ishi va dasturlash uchun ideal. 18 soatgacha batareya.",
    variants: variantMatrix({
      slug: "macbook-air-m3",
      sku: "MBA13M3",
      colors: [MIDNIGHT, STARLIGHT, SPACE_GRAY, SILVER],
      options: [
        { ram: "8GB", storage: "256GB", price: 13_900_000 },
        { ram: "16GB", storage: "512GB", price: 17_800_000, oldPrice: 18_400_000 },
      ],
      warrantyMonths: 12,
      stock: [3, 2, 1, 2, 2, 1, 0, 1],
    }),
    specs: laptopSpecs({
      screen: '13.6" Liquid Retina, 2560×1664',
      cpu: "Apple M3 (8 yadro)",
      gpu: "Integratsiyalashgan (8 yadroli GPU)",
      ram: "8 / 16 GB",
      storage: "256 / 512 GB SSD",
      battery: "18 soatgacha",
      weight: "1.24 kg",
      os: "macOS",
    }),
    attributes: { cpu: "Apple M3", gpu: "Integratsiyalashgan", screenSize: "13.6" },
    keywords: ["macbook", "makbuk", "air", "m3", "apple", "noutbuk"],
    featured: true,
    popularity: 91,
    rating: [4.9, 132],
    createdAt: "2026-07-05T09:00:00.000Z",
    bundleIds: ["apple-20w-usb-c-adapter", "baseus-gan5-65w-adapter", "ugreen-telefon-stendi"],
  }),
  defineProduct({
    slug: "macbook-pro-m3-pro",
    name: "MacBook Pro M3 Pro 14.2\"",
    brandId: "apple",
    categoryId: "laptoplar-macbook",
    model: "MacBook Pro M3 Pro",
    shortDescription: "M3 Pro chipi, 14.2 dyuym Liquid Retina XDR, professional ish uchun.",
    description:
      "MacBook Pro M3 Pro — video montaj, dasturlash va dizayn uchun kuchli noutbuk. Liquid Retina XDR ekran, HDMI va SD karta uyasi bor.",
    variants: variantMatrix({
      slug: "macbook-pro-m3-pro",
      sku: "MBP14M3P",
      colors: [{ name: "Space Black", hex: "#2B2C2E" }, SILVER],
      options: [
        { ram: "18GB", storage: "512GB", price: 28_900_000 },
        { ram: "18GB", storage: "1TB", price: 32_500_000, oldPrice: 33_900_000 },
        { ram: "36GB", storage: "1TB", price: 39_800_000 },
      ],
      warrantyMonths: 12,
      stock: [2, 1, 1, 1, 0, 1],
    }),
    specs: laptopSpecs({
      screen: '14.2" Liquid Retina XDR, 120 Hz',
      cpu: "Apple M3 Pro (11 yadro)",
      gpu: "Integratsiyalashgan (14 yadroli GPU)",
      ram: "18 / 36 GB",
      storage: "512 GB / 1 TB SSD",
      battery: "17 soatgacha",
      weight: "1.61 kg",
      os: "macOS",
    }),
    attributes: { cpu: "Apple M3 Pro", gpu: "Integratsiyalashgan", screenSize: "14.2" },
    keywords: ["macbook", "makbuk", "pro", "m3 pro", "apple", "noutbuk"],
    popularity: 70,
    rating: [4.9, 58],
    createdAt: "2026-06-20T09:00:00.000Z",
  }),
  defineProduct({
    slug: "macbook-air-m1-ishlatilgan",
    name: "MacBook Air M1 13.3\" (ishlatilgan)",
    brandId: "apple",
    categoryId: "laptoplar-macbook",
    model: "MacBook Air M1",
    shortDescription: "Tekshirilgan ishlatilgan MacBook Air M1, batareya 92%.",
    description:
      "MacBook Air M1 — tekshirilgan, ishlatilgan holatda. Korpusda sezilarli izlar yo‘q, batareya holati 92%. Zaryadchik to‘plamda.",
    variants: variantMatrix({
      slug: "macbook-air-m1-ishlatilgan",
      sku: "MBA13M1",
      colors: [SPACE_GRAY, SILVER],
      options: [{ ram: "8GB", storage: "256GB", price: 8_300_000 }],
      condition: "used",
      warrantyMonths: 3,
      stock: [1, 1],
      note: "Batareya 92%, sikllar soni 180",
    }),
    specs: laptopSpecs({
      screen: '13.3" Retina, 2560×1600',
      cpu: "Apple M1 (8 yadro)",
      gpu: "Integratsiyalashgan (7 yadroli GPU)",
      ram: "8 GB",
      storage: "256 GB SSD",
      battery: "15 soatgacha",
      weight: "1.29 kg",
      os: "macOS",
    }),
    attributes: { cpu: "Apple M1", gpu: "Integratsiyalashgan", screenSize: "13.3" },
    keywords: ["macbook", "makbuk", "air", "m1", "apple", "noutbuk", "ishlatilgan"],
    popularity: 55,
    rating: [4.7, 26],
    createdAt: "2026-08-10T09:00:00.000Z",
  }),
  defineProduct({
    slug: "hp-pavilion-15",
    name: "HP Pavilion 15.6\"",
    brandId: "hp",
    categoryId: "laptoplar-hp",
    model: "HP Pavilion 15",
    shortDescription: "Intel Core i5, 15.6 dyuym Full HD, kundalik ish uchun.",
    description:
      "HP Pavilion 15 — o‘qish va ofis ishi uchun ishonchli noutbuk: Full HD IPS ekran, tez SSD va qulay klaviatura.",
    variants: variantMatrix({
      slug: "hp-pavilion-15",
      sku: "HPP15",
      colors: [{ name: "Natural Silver", hex: "#C9CBD0" }],
      options: [
        { ram: "8GB", storage: "512GB", price: 7_400_000 },
        { ram: "16GB", storage: "512GB", price: 8_300_000, oldPrice: 8_700_000 },
      ],
      warrantyMonths: 12,
      stock: [4, 3],
    }),
    specs: laptopSpecs({
      screen: '15.6" IPS Full HD, 60 Hz',
      cpu: "Intel Core i5-1335U",
      gpu: "Intel Iris Xe (integratsiyalashgan)",
      ram: "8 / 16 GB",
      storage: "512 GB SSD",
      battery: "41 Wh",
      weight: "1.75 kg",
      os: "Windows 11",
    }),
    attributes: { cpu: "Intel Core i5", gpu: "Integratsiyalashgan", screenSize: "15.6" },
    keywords: ["hp", "pavilion", "noutbuk", "laptop", "i5"],
    popularity: 66,
    rating: [4.5, 71],
    createdAt: "2026-02-14T09:00:00.000Z",
  }),
  defineProduct({
    slug: "lenovo-ideapad-slim-3",
    name: "Lenovo IdeaPad Slim 3 15.6\"",
    brandId: "lenovo",
    categoryId: "laptoplar-lenovo",
    model: "IdeaPad Slim 3",
    shortDescription: "AMD Ryzen 5, 15.6 dyuym Full HD, yengil korpus.",
    description:
      "Lenovo IdeaPad Slim 3 — Ryzen 5 protsessorli, arzon va tez noutbuk. Talabalar va ofis xodimlari uchun mos.",
    variants: variantMatrix({
      slug: "lenovo-ideapad-slim-3",
      sku: "LIS3",
      colors: [{ name: "Arctic Grey", hex: "#B7BBC2" }],
      options: [
        { ram: "8GB", storage: "512GB", price: 6_600_000 },
        { ram: "16GB", storage: "512GB", price: 7_400_000 },
      ],
      warrantyMonths: 12,
      stock: [5, 2],
    }),
    specs: laptopSpecs({
      screen: '15.6" IPS Full HD',
      cpu: "AMD Ryzen 5 7520U",
      gpu: "AMD Radeon 610M (integratsiyalashgan)",
      ram: "8 / 16 GB",
      storage: "512 GB SSD",
      battery: "50 Wh",
      weight: "1.62 kg",
      os: "Windows 11",
    }),
    attributes: { cpu: "AMD Ryzen", gpu: "Integratsiyalashgan", screenSize: "15.6" },
    keywords: ["lenovo", "ideapad", "noutbuk", "laptop", "ryzen"],
    popularity: 68,
    rating: [4.4, 84],
    createdAt: "2026-03-18T09:00:00.000Z",
  }),
  defineProduct({
    slug: "asus-vivobook-15",
    name: "Asus VivoBook 15\"",
    brandId: "asus",
    categoryId: "laptoplar-asus",
    model: "VivoBook 15",
    shortDescription: "Intel Core i7, 16 GB RAM, 15.6 dyuym Full HD.",
    description:
      "Asus VivoBook 15 — Core i7 protsessori va 16 GB operativ xotirali, ish va ko‘p vazifali foydalanish uchun kuchli noutbuk.",
    variants: variantMatrix({
      slug: "asus-vivobook-15",
      sku: "AVB15",
      colors: [{ name: "Quiet Blue", hex: "#5C7594" }],
      options: [
        { ram: "16GB", storage: "512GB", price: 9_600_000 },
        { ram: "16GB", storage: "1TB", price: 10_700_000 },
      ],
      warrantyMonths: 12,
      stock: [3, 0],
    }),
    specs: laptopSpecs({
      screen: '15.6" IPS Full HD, 60 Hz',
      cpu: "Intel Core i7-1255U",
      gpu: "Intel Iris Xe (integratsiyalashgan)",
      ram: "16 GB",
      storage: "512 GB / 1 TB SSD",
      battery: "42 Wh",
      weight: "1.7 kg",
      os: "Windows 11",
    }),
    attributes: { cpu: "Intel Core i7", gpu: "Integratsiyalashgan", screenSize: "15.6" },
    keywords: ["asus", "vivobook", "noutbuk", "laptop", "i7"],
    popularity: 60,
    rating: [4.5, 49],
    createdAt: "2026-04-28T09:00:00.000Z",
  }),
  defineProduct({
    slug: "acer-aspire-5",
    name: "Acer Aspire 5 15.6\"",
    brandId: "acer",
    categoryId: "laptoplar-acer",
    model: "Aspire 5",
    shortDescription: "Intel Core i5 va alohida NVIDIA MX550 video karta.",
    description:
      "Acer Aspire 5 — Core i5 protsessori va alohida MX550 video kartali noutbuk. Ish va yengil grafik vazifalar uchun.",
    variants: variantMatrix({
      slug: "acer-aspire-5",
      sku: "AA5",
      colors: [{ name: "Steel Gray", hex: "#8E9299" }],
      options: [
        { ram: "8GB", storage: "512GB", price: 6_900_000 },
        { ram: "16GB", storage: "512GB", price: 7_700_000, oldPrice: 8_100_000 },
      ],
      warrantyMonths: 12,
      stock: [2, 3],
    }),
    specs: laptopSpecs({
      screen: '15.6" IPS Full HD',
      cpu: "Intel Core i5-1235U",
      gpu: "NVIDIA GeForce MX550, 2 GB",
      ram: "8 / 16 GB",
      storage: "512 GB SSD",
      battery: "50 Wh",
      weight: "1.8 kg",
      os: "Windows 11",
    }),
    attributes: { cpu: "Intel Core i5", gpu: "NVIDIA GeForce MX550", screenSize: "15.6" },
    keywords: ["acer", "aspire", "noutbuk", "laptop", "i5"],
    popularity: 57,
    rating: [4.4, 44],
    createdAt: "2026-05-16T09:00:00.000Z",
  }),
  defineProduct({
    slug: "msi-thin-gf63",
    name: "MSI Thin GF63 15.6\"",
    brandId: "msi",
    categoryId: "laptoplar-boshqa",
    model: "MSI Thin GF63",
    shortDescription: "O‘yin noutbuki: Core i5 va NVIDIA RTX 3050.",
    description:
      "MSI Thin GF63 — RTX 3050 video kartali, 144 Hz ekranli o‘yin noutbuki. O‘yin va grafik dasturlar uchun.",
    variants: variantMatrix({
      slug: "msi-thin-gf63",
      sku: "MTGF63",
      colors: [{ name: "Black", hex: "#1E1E20" }],
      options: [{ ram: "16GB", storage: "512GB", price: 11_800_000, oldPrice: 12_500_000 }],
      warrantyMonths: 12,
      stock: 2,
    }),
    specs: laptopSpecs({
      screen: '15.6" IPS Full HD, 144 Hz',
      cpu: "Intel Core i5-12450H",
      gpu: "NVIDIA GeForce RTX 3050, 4 GB",
      ram: "16 GB",
      storage: "512 GB SSD",
      battery: "51 Wh",
      weight: "1.86 kg",
      os: "Windows 11",
    }),
    attributes: { cpu: "Intel Core i5", gpu: "NVIDIA GeForce RTX 3050", screenSize: "15.6" },
    keywords: ["msi", "gaming", "o‘yin", "noutbuk", "laptop", "rtx"],
    popularity: 52,
    rating: [4.6, 37],
    createdAt: "2026-07-30T09:00:00.000Z",
  }),
];
