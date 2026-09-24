import { defineProduct, group, variantMatrix, type Color } from "@/data/builders";
import type { Product, SpecGroup } from "@/types";

/** NAMUNAVIY narxlar va qoldiqlar — haqiqiy ro‘yxat kelganda almashtiriladi. */

const NATURAL: Color = { name: "Natural Titanium", hex: "#B7AFA5" };
const BLUE_TI: Color = { name: "Blue Titanium", hex: "#3C4652" };
const WHITE_TI: Color = { name: "White Titanium", hex: "#E5E4DF" };
const BLACK_TI: Color = { name: "Black Titanium", hex: "#2E2E30" };

const SIM = "nano-SIM + eSIM";

function iphoneSpecs(input: {
  screen: string;
  chip: string;
  ram: string;
  camera: string;
  battery: string;
  extra: [string, string][];
}): SpecGroup[] {
  return [
    group("Ekran", [["Diagonal va turi", input.screen]]),
    group("Protsessor va xotira", [
      ["Chip", input.chip],
      ["Operativ xotira", input.ram],
    ]),
    group("Kamera", [["Asosiy kamera", input.camera]]),
    group("Batareya", [["Sig‘im va zaryad", input.battery]]),
    group("Umumiy", [["Operatsion tizim", "iOS"], ["SIM", SIM], ...input.extra]),
  ];
}

export const iphoneProducts: Product[] = [
  defineProduct({
    slug: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 15 Pro Max",
    shortDescription: "Titan korpus, A17 Pro chip va 5x optik zoom.",
    description:
      "iPhone 15 Pro Max — Apple'ning katta ekranli flagmani. Yengil titan korpus, A17 Pro chipi, USB-C port va 5x optik zoomli telefoto kamera. Original, kafolat bilan.",
    variants: [
      ...variantMatrix({
        slug: "iphone-15-pro-max",
        sku: "IP15PM",
        colors: [NATURAL, BLUE_TI, WHITE_TI, BLACK_TI],
        options: [
          { storage: "256GB", price: 14_500_000, oldPrice: 15_000_000 },
          { storage: "512GB", price: 16_900_000 },
          { storage: "1TB", price: 19_500_000 },
        ],
        simType: SIM,
        warrantyMonths: 12,
        stock: [5, 3, 2, 0, 4, 1, 0, 2, 1, 0, 0, 1],
      }),
      ...variantMatrix({
        slug: "iphone-15-pro-max",
        sku: "IP15PM",
        colors: [BLUE_TI],
        options: [{ storage: "256GB", price: 13_900_000, oldPrice: 15_000_000 }],
        condition: "open-box",
        simType: SIM,
        warrantyMonths: 6,
        stock: 1,
        note: "Qutisi ochilgan, ishlatilmagan, to‘liq to‘plam",
      }),
    ],
    specs: iphoneSpecs({
      screen: '6.7" Super Retina XDR OLED, 120 Hz',
      chip: "Apple A17 Pro",
      ram: "8 GB",
      camera: "48 MP + 12 MP (5x zoom) + 12 MP ultra keng",
      battery: "4441 mAh, USB-C, MagSafe",
      extra: [["Korpus", "Titan"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "15 pro max", "apple", "titanium"],
    featured: true,
    popularity: 98,
    rating: [4.9, 214],
    createdAt: "2026-06-10T09:00:00.000Z",
    bundleIds: [
      "iphone-15-pro-max-silikon-chexol",
      "iphone-15-pro-max-magsafe-chexol",
      "spigen-glas-tr-iphone-15-pro-max",
      "apple-20w-usb-c-adapter",
      "apple-airpods-pro-2",
      "apple-magsafe-charger",
    ],
  }),
  defineProduct({
    slug: "iphone-15-pro",
    name: "iPhone 15 Pro",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 15 Pro",
    shortDescription: "Ixcham titan flagman: A17 Pro va Action tugmasi.",
    description:
      "iPhone 15 Pro — 6.1 dyuymli ixcham ekran, A17 Pro chipi va titan korpus. Bir qo‘lda qulay, kuchli va yengil.",
    variants: variantMatrix({
      slug: "iphone-15-pro",
      sku: "IP15P",
      colors: [NATURAL, BLUE_TI, WHITE_TI, BLACK_TI],
      options: [
        { storage: "128GB", price: 12_400_000 },
        { storage: "256GB", price: 13_600_000, oldPrice: 14_100_000 },
        { storage: "512GB", price: 15_900_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [4, 2, 0, 3, 5, 1, 2, 0, 1, 2, 0, 0],
    }),
    specs: iphoneSpecs({
      screen: '6.1" Super Retina XDR OLED, 120 Hz',
      chip: "Apple A17 Pro",
      ram: "8 GB",
      camera: "48 MP + 12 MP (3x zoom) + 12 MP ultra keng",
      battery: "3274 mAh, USB-C, MagSafe",
      extra: [["Korpus", "Titan"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "15 pro", "apple"],
    featured: true,
    popularity: 90,
    rating: [4.8, 143],
    createdAt: "2026-06-12T09:00:00.000Z",
  }),
  defineProduct({
    slug: "iphone-15",
    name: "iPhone 15",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 15",
    shortDescription: "Dynamic Island, 48 MP kamera va USB-C.",
    description:
      "iPhone 15 — Dynamic Island, 48 MP asosiy kamera va USB-C portli kundalik flagman. Rang tanlovi keng.",
    variants: variantMatrix({
      slug: "iphone-15",
      sku: "IP15",
      colors: [
        { name: "Black", hex: "#2B2B2D" },
        { name: "Blue", hex: "#B7C9D6" },
        { name: "Green", hex: "#C5D6C1" },
        { name: "Yellow", hex: "#EFE3A6" },
        { name: "Pink", hex: "#EBCFD0" },
      ],
      options: [
        { storage: "128GB", price: 9_700_000, oldPrice: 10_200_000 },
        { storage: "256GB", price: 11_200_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [6, 4, 3, 0, 2, 3, 1, 0, 2, 1],
    }),
    specs: iphoneSpecs({
      screen: '6.1" Super Retina XDR OLED',
      chip: "Apple A16 Bionic",
      ram: "6 GB",
      camera: "48 MP + 12 MP ultra keng",
      battery: "3349 mAh, USB-C, MagSafe",
      extra: [["Korpus", "Alyuminiy + shisha"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "15", "apple"],
    featured: true,
    popularity: 95,
    rating: [4.8, 305],
    createdAt: "2026-05-02T09:00:00.000Z",
    bundleIds: ["apple-20w-usb-c-adapter", "apple-airpods-3", "apple-magsafe-charger"],
  }),
  defineProduct({
    slug: "iphone-14-pro-max",
    name: "iPhone 14 Pro Max",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 14 Pro Max",
    shortDescription: "Always-On ekran va 48 MP kamerali katta iPhone.",
    description:
      "iPhone 14 Pro Max — Dynamic Island, doimiy yonib turadigan ekran va 48 MP kamera. Yangi va tekshirilgan ishlatilgan variantlari mavjud.",
    variants: [
      ...variantMatrix({
        slug: "iphone-14-pro-max",
        sku: "IP14PM",
        colors: [
          { name: "Deep Purple", hex: "#4F4A5C" },
          { name: "Space Black", hex: "#2D2D30" },
          { name: "Gold", hex: "#E3CBA8" },
          { name: "Silver", hex: "#E5E5E3" },
        ],
        options: [
          { storage: "128GB", price: 11_900_000 },
          { storage: "256GB", price: 13_000_000, oldPrice: 13_700_000 },
        ],
        simType: SIM,
        warrantyMonths: 12,
        stock: [2, 0, 3, 1, 0, 2, 1, 0],
      }),
      ...variantMatrix({
        slug: "iphone-14-pro-max",
        sku: "IP14PM",
        colors: [{ name: "Deep Purple", hex: "#4F4A5C" }],
        options: [{ storage: "256GB", price: 9_800_000 }],
        condition: "used",
        simType: SIM,
        warrantyMonths: 3,
        stock: 1,
        note: "Batareya 89%, korpusda mayda izlar yo‘q",
      }),
    ],
    specs: iphoneSpecs({
      screen: '6.7" Super Retina XDR OLED, 120 Hz, Always-On',
      chip: "Apple A16 Bionic",
      ram: "6 GB",
      camera: "48 MP + 12 MP (3x zoom) + 12 MP ultra keng",
      battery: "4323 mAh, Lightning, MagSafe",
      extra: [["Korpus", "Zanglamaydigan po‘lat"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "14 pro max", "apple"],
    popularity: 80,
    rating: [4.8, 176],
    createdAt: "2026-03-14T09:00:00.000Z",
  }),
  defineProduct({
    slug: "iphone-13",
    name: "iPhone 13",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 13",
    shortDescription: "Hamyonbop iPhone: A15 Bionic va ikki kamera.",
    description:
      "iPhone 13 — hozir ham tez ishlaydigan, kamerasi yaxshi telefon. Yangi va tekshirilgan ishlatilgan variantlari bor; ishlatilganlarida batareya holati alohida yozilgan.",
    variants: [
      ...variantMatrix({
        slug: "iphone-13",
        sku: "IP13",
        colors: [
          { name: "Midnight", hex: "#232A31" },
          { name: "Starlight", hex: "#F0E9DF" },
          { name: "Blue", hex: "#A9C2D5" },
          { name: "Pink", hex: "#F4D6D5" },
        ],
        options: [
          { storage: "128GB", price: 7_300_000 },
          { storage: "256GB", price: 8_400_000 },
        ],
        simType: SIM,
        warrantyMonths: 12,
        stock: [4, 2, 1, 0, 3, 0, 2, 1],
      }),
      ...variantMatrix({
        slug: "iphone-13",
        sku: "IP13",
        colors: [{ name: "Midnight", hex: "#232A31" }],
        options: [{ storage: "128GB", price: 5_900_000 }],
        condition: "used",
        simType: SIM,
        warrantyMonths: 3,
        stock: 2,
        note: "Batareya 87%",
      }),
      ...variantMatrix({
        slug: "iphone-13",
        sku: "IP13",
        colors: [{ name: "Blue", hex: "#A9C2D5" }],
        options: [{ storage: "128GB", price: 6_100_000 }],
        condition: "used",
        simType: SIM,
        warrantyMonths: 3,
        stock: 1,
        note: "Batareya 91%",
      }),
    ],
    specs: iphoneSpecs({
      screen: '6.1" Super Retina XDR OLED',
      chip: "Apple A15 Bionic",
      ram: "4 GB",
      camera: "12 MP + 12 MP ultra keng",
      battery: "3240 mAh, Lightning, MagSafe",
      extra: [["Korpus", "Alyuminiy + shisha"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "13", "apple"],
    popularity: 88,
    rating: [4.7, 410],
    createdAt: "2026-01-20T09:00:00.000Z",
  }),
  defineProduct({
    slug: "iphone-12",
    name: "iPhone 12",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 12",
    shortDescription: "OLED ekranli, 5G qo‘llaydigan arzon iPhone.",
    description:
      "iPhone 12 — OLED ekran, 5G va MagSafe qo‘llovi. Byudjetga mos iPhone tanlayotganlar uchun. Yangi, open-box va ishlatilgan variantlari bor.",
    variants: [
      ...variantMatrix({
        slug: "iphone-12",
        sku: "IP12",
        colors: [
          { name: "Black", hex: "#2A2A2C" },
          { name: "White", hex: "#F4F4F2" },
          { name: "Blue", hex: "#2F5C86" },
        ],
        options: [
          { storage: "64GB", price: 5_200_000, oldPrice: 5_600_000 },
          { storage: "128GB", price: 5_900_000 },
        ],
        simType: SIM,
        warrantyMonths: 12,
        stock: [0, 2, 1, 0, 0, 3],
      }),
      ...variantMatrix({
        slug: "iphone-12",
        sku: "IP12",
        colors: [{ name: "White", hex: "#F4F4F2" }],
        options: [{ storage: "128GB", price: 5_300_000 }],
        condition: "open-box",
        simType: SIM,
        warrantyMonths: 6,
        stock: 1,
        note: "Vitrina namunasi, to‘liq to‘plam",
      }),
      ...variantMatrix({
        slug: "iphone-12",
        sku: "IP12",
        colors: [{ name: "Black", hex: "#2A2A2C" }],
        options: [{ storage: "64GB", price: 3_900_000 }],
        condition: "used",
        simType: SIM,
        warrantyMonths: 3,
        stock: 2,
        note: "Batareya 84%",
      }),
    ],
    specs: iphoneSpecs({
      screen: '6.1" Super Retina XDR OLED',
      chip: "Apple A14 Bionic",
      ram: "4 GB",
      camera: "12 MP + 12 MP ultra keng",
      battery: "2815 mAh, Lightning, MagSafe",
      extra: [["Korpus", "Alyuminiy + shisha"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "12", "apple"],
    popularity: 70,
    rating: [4.6, 268],
    createdAt: "2025-12-05T09:00:00.000Z",
  }),
  defineProduct({
    slug: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    brandId: "apple",
    categoryId: "telefonlar-iphone",
    model: "iPhone 16 Pro Max",
    shortDescription: "A18 Pro chip, 6.9 dyuymli ekran va Camera Control.",
    description:
      "iPhone 16 Pro Max — eng katta ekranli va eng kuchli iPhone. A18 Pro chipi, Camera Control tugmasi va uzoq ishlaydigan batareya. 1 TB variantiga oldindan buyurtma qabul qilinadi.",
    variants: [
      ...variantMatrix({
        slug: "iphone-16-pro-max",
        sku: "IP16PM",
        colors: [
          { name: "Desert Titanium", hex: "#C9A98B" },
          NATURAL,
          WHITE_TI,
          BLACK_TI,
        ],
        options: [
          { storage: "256GB", price: 16_900_000 },
          { storage: "512GB", price: 19_300_000 },
        ],
        simType: SIM,
        warrantyMonths: 12,
        stock: [3, 2, 4, 1, 2, 0, 1, 1],
      }),
      ...variantMatrix({
        slug: "iphone-16-pro-max",
        sku: "IP16PM",
        colors: [NATURAL, BLACK_TI],
        options: [{ storage: "1TB", price: 21_900_000 }],
        simType: SIM,
        warrantyMonths: 12,
        stock: 0,
        preorder: true,
        note: "Oldindan buyurtma, 3–5 kunda yetkaziladi",
      }),
    ],
    specs: iphoneSpecs({
      screen: '6.9" Super Retina XDR OLED, 120 Hz, Always-On',
      chip: "Apple A18 Pro",
      ram: "8 GB",
      camera: "48 MP + 48 MP ultra keng + 12 MP (5x zoom)",
      battery: "4685 mAh, USB-C, MagSafe",
      extra: [["Korpus", "Titan"], ["Himoya", "IP68"]],
    }),
    keywords: ["ayfon", "16 pro max", "apple", "yangi"],
    featured: true,
    popularity: 92,
    rating: [4.9, 87],
    createdAt: "2026-09-12T09:00:00.000Z",
  }),
];
