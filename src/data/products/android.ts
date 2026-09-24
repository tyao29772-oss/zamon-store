import { defineProduct, group, variantMatrix } from "@/data/builders";
import type { Product, SpecGroup } from "@/types";

/** NAMUNAVIY narxlar va qoldiqlar — haqiqiy ro‘yxat kelganda almashtiriladi. */

const SIM = "2 SIM (nano-SIM)";

function androidSpecs(input: {
  screen: string;
  chip: string;
  ram: string;
  camera: string;
  battery: string;
  os: string;
}): SpecGroup[] {
  return [
    group("Ekran", [["Diagonal va turi", input.screen]]),
    group("Protsessor va xotira", [
      ["Protsessor", input.chip],
      ["Operativ xotira", input.ram],
    ]),
    group("Kamera", [["Asosiy kamera", input.camera]]),
    group("Batareya", [["Sig‘im va zaryad", input.battery]]),
    group("Umumiy", [["Operatsion tizim", input.os], ["SIM", SIM]]),
  ];
}

export const infinixProducts: Product[] = [
  defineProduct({
    slug: "infinix-note-40-pro",
    name: "Infinix Note 40 Pro",
    brandId: "infinix",
    categoryId: "telefonlar-infinix",
    model: "Note 40 Pro",
    shortDescription: "AMOLED ekran va 70W tez zaryad.",
    description:
      "Infinix Note 40 Pro — 120 Hz AMOLED ekran, 108 MP kamera, 70W tez zaryad va simsiz zaryadlash qo‘llovi.",
    variants: variantMatrix({
      slug: "infinix-note-40-pro",
      sku: "IN40P",
      colors: [
        { name: "Vintage Green", hex: "#7E9A82" },
        { name: "Titan Gold", hex: "#D5B98E" },
        { name: "Obsidian Black", hex: "#1D1D20" },
      ],
      options: [
        { storage: "256GB", ram: "8GB", price: 2_900_000 },
        { storage: "256GB", ram: "12GB", price: 3_300_000, oldPrice: 3_500_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [5, 4, 2, 3, 1, 0],
    }),
    specs: androidSpecs({
      screen: '6.78" AMOLED, 120 Hz',
      chip: "MediaTek Helio G99 Ultimate",
      ram: "8 / 12 GB",
      camera: "108 MP + 2 MP + 2 MP",
      battery: "5000 mAh, 70W tez zaryad",
      os: "Android (XOS)",
    }),
    keywords: ["note 40", "infinix"],
    popularity: 72,
    rating: [4.5, 96],
    createdAt: "2026-05-20T09:00:00.000Z",
  }),
  defineProduct({
    slug: "infinix-hot-40",
    name: "Infinix Hot 40",
    brandId: "infinix",
    categoryId: "telefonlar-infinix",
    model: "Hot 40",
    shortDescription: "Katta ekran, 90 Hz va 5000 mAh batareya.",
    description:
      "Infinix Hot 40 — kundalik ish uchun hamyonbop telefon: 6.78 dyuymli 90 Hz ekran, katta batareya va 256 GB gacha xotira.",
    variants: variantMatrix({
      slug: "infinix-hot-40",
      sku: "IH40",
      colors: [
        { name: "Horizon Blue", hex: "#5C86B8" },
        { name: "Palm Blue", hex: "#3E6E7A" },
        { name: "Starlit Black", hex: "#1B1B1F" },
      ],
      options: [
        { storage: "128GB", ram: "8GB", price: 1_500_000, oldPrice: 1_650_000 },
        { storage: "256GB", ram: "8GB", price: 1_750_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [9, 7, 5, 6, 3, 2],
    }),
    specs: androidSpecs({
      screen: '6.78" IPS LCD, 90 Hz',
      chip: "MediaTek Helio G88",
      ram: "8 GB",
      camera: "50 MP + QVGA",
      battery: "5000 mAh, 18W tez zaryad",
      os: "Android (XOS)",
    }),
    keywords: ["hot 40", "infinix", "arzon"],
    popularity: 74,
    rating: [4.3, 188],
    createdAt: "2025-12-18T09:00:00.000Z",
  }),
  defineProduct({
    slug: "infinix-gt-20-pro",
    name: "Infinix GT 20 Pro",
    brandId: "infinix",
    categoryId: "telefonlar-infinix",
    model: "GT 20 Pro",
    shortDescription: "O‘yin uchun: Dimensity 8200 va 144 Hz ekran.",
    description:
      "Infinix GT 20 Pro — o‘yin telefoni: Dimensity 8200 Ultimate, 144 Hz AMOLED ekran, RGB yoritish va 45W zaryad.",
    variants: variantMatrix({
      slug: "infinix-gt-20-pro",
      sku: "IGT20P",
      colors: [
        { name: "Mecha Blue", hex: "#5B7CBF" },
        { name: "Mecha Silver", hex: "#C9CDD3" },
      ],
      options: [
        { storage: "256GB", ram: "8GB", price: 3_800_000 },
        { storage: "256GB", ram: "12GB", price: 4_200_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [2, 1, 3, 0],
    }),
    specs: androidSpecs({
      screen: '6.78" AMOLED, 144 Hz',
      chip: "MediaTek Dimensity 8200 Ultimate",
      ram: "8 / 12 GB",
      camera: "108 MP + 2 MP + 2 MP",
      battery: "5000 mAh, 45W tez zaryad",
      os: "Android (XOS)",
    }),
    keywords: ["gt 20", "infinix", "gaming", "o‘yin"],
    popularity: 60,
    rating: [4.4, 52],
    createdAt: "2026-08-25T09:00:00.000Z",
  }),
];

export const honorProducts: Product[] = [
  defineProduct({
    slug: "honor-200",
    name: "Honor 200",
    brandId: "honor",
    categoryId: "telefonlar-honor",
    model: "Honor 200",
    shortDescription: "Portret kamerasi va 100W tez zaryad.",
    description:
      "Honor 200 — portret suratga olishga mo‘ljallangan 50 MP kamera, ixcham dizayn va 100W tez zaryadlash.",
    variants: variantMatrix({
      slug: "honor-200",
      sku: "H200",
      colors: [
        { name: "Moonlight White", hex: "#EDEDED" },
        { name: "Black", hex: "#1C1C1E" },
        { name: "Emerald Green", hex: "#3B6E5A" },
      ],
      options: [
        { storage: "256GB", ram: "8GB", price: 4_300_000 },
        { storage: "512GB", ram: "12GB", price: 5_100_000, oldPrice: 5_400_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [4, 3, 2, 1, 2, 0],
    }),
    specs: androidSpecs({
      screen: '6.7" OLED, 120 Hz',
      chip: "Snapdragon 7 Gen 3",
      ram: "8 / 12 GB",
      camera: "50 MP + 50 MP telefoto + 12 MP ultra keng",
      battery: "5200 mAh, 100W tez zaryad",
      os: "Android (MagicOS)",
    }),
    keywords: ["honor 200", "honor"],
    popularity: 65,
    rating: [4.6, 74],
    createdAt: "2026-06-30T09:00:00.000Z",
  }),
  defineProduct({
    slug: "honor-x8b",
    name: "Honor X8b",
    brandId: "honor",
    categoryId: "telefonlar-honor",
    model: "Honor X8b",
    shortDescription: "Yupqa korpus (7.5 mm) va 108 MP kamera.",
    description:
      "Honor X8b — 7.5 mm yupqa korpusli, 108 MP kamerali va AMOLED ekranli o‘rta segment telefon.",
    variants: variantMatrix({
      slug: "honor-x8b",
      sku: "HX8B",
      colors: [
        { name: "Titanium Silver", hex: "#C7C9CE" },
        { name: "Midnight Black", hex: "#1B1C21" },
        { name: "Glamorous Green", hex: "#5E8A73" },
      ],
      options: [{ storage: "256GB", ram: "8GB", price: 2_650_000, oldPrice: 2_850_000 }],
      simType: SIM,
      warrantyMonths: 12,
      stock: [4, 2, 3],
    }),
    specs: androidSpecs({
      screen: '6.7" AMOLED, 90 Hz',
      chip: "Snapdragon 680",
      ram: "8 GB",
      camera: "108 MP + 5 MP ultra keng + 2 MP",
      battery: "4500 mAh, 35W tez zaryad",
      os: "Android (MagicOS)",
    }),
    keywords: ["x8b", "honor"],
    popularity: 58,
    rating: [4.4, 63],
    createdAt: "2026-03-22T09:00:00.000Z",
  }),
  defineProduct({
    slug: "honor-x7b",
    name: "Honor X7b",
    brandId: "honor",
    categoryId: "telefonlar-honor",
    model: "Honor X7b",
    shortDescription: "6000 mAh batareya — bir necha kunga yetadi.",
    description:
      "Honor X7b — katta 6000 mAh batareyali, 90 Hz ekranli va 108 MP kamerali hamyonbop telefon.",
    variants: variantMatrix({
      slug: "honor-x7b",
      sku: "HX7B",
      colors: [
        { name: "Flowing Silver", hex: "#CDD0D6" },
        { name: "Emerald Green", hex: "#3B6E5A" },
      ],
      options: [
        { storage: "128GB", ram: "8GB", price: 2_050_000 },
        { storage: "256GB", ram: "8GB", price: 2_300_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [5, 3, 0, 2],
    }),
    specs: androidSpecs({
      screen: '6.8" LCD, 90 Hz',
      chip: "Snapdragon 680",
      ram: "8 GB",
      camera: "108 MP + 5 MP",
      battery: "6000 mAh, 35W tez zaryad",
      os: "Android (MagicOS)",
    }),
    keywords: ["x7b", "honor", "batareya"],
    popularity: 54,
    rating: [4.3, 81],
    createdAt: "2026-01-12T09:00:00.000Z",
  }),
];

export const xiaomiProducts: Product[] = [
  defineProduct({
    slug: "redmi-note-13-pro",
    name: "Redmi Note 13 Pro",
    brandId: "xiaomi",
    categoryId: "telefonlar-redmi-xiaomi",
    model: "Redmi Note 13 Pro",
    shortDescription: "200 MP kamera va 120 Hz AMOLED ekran.",
    description:
      "Redmi Note 13 Pro — 200 MP asosiy kamera, 1.5K AMOLED ekran va 67W tez zaryad. Narxiga nisbatan eng yaxshi tanlovlardan biri.",
    variants: variantMatrix({
      slug: "redmi-note-13-pro",
      sku: "RN13P",
      colors: [
        { name: "Midnight Black", hex: "#1B1B1F" },
        { name: "Aurora Purple", hex: "#8F7FB8" },
        { name: "Ocean Teal", hex: "#3F8A8C" },
      ],
      options: [
        { storage: "256GB", ram: "8GB", price: 3_400_000, oldPrice: 3_650_000 },
        { storage: "256GB", ram: "12GB", price: 3_750_000 },
        { storage: "512GB", ram: "12GB", price: 4_150_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [7, 5, 4, 3, 2, 1, 2, 0, 1],
    }),
    specs: androidSpecs({
      screen: '6.67" AMOLED, 120 Hz',
      chip: "Snapdragon 7s Gen 2",
      ram: "8 / 12 GB",
      camera: "200 MP + 8 MP ultra keng + 2 MP makro",
      battery: "5100 mAh, 67W tez zaryad",
      os: "Android (HyperOS)",
    }),
    keywords: ["redmi", "note 13 pro", "xiaomi"],
    featured: true,
    popularity: 96,
    rating: [4.7, 372],
    createdAt: "2026-03-05T09:00:00.000Z",
    bundleIds: ["redmi-note-13-silikon-chexol", "xiaomi-33w-usb-c-adapter", "xiaomi-power-bank-10000"],
  }),
  defineProduct({
    slug: "redmi-note-13",
    name: "Redmi Note 13",
    brandId: "xiaomi",
    categoryId: "telefonlar-redmi-xiaomi",
    model: "Redmi Note 13",
    shortDescription: "108 MP kamera va AMOLED ekran hamyonbop narxda.",
    description:
      "Redmi Note 13 — 108 MP kamera, 120 Hz AMOLED ekran va 33W zaryad. Kundalik foydalanish uchun ishonchli variant.",
    variants: variantMatrix({
      slug: "redmi-note-13",
      sku: "RN13",
      colors: [
        { name: "Graphite Black", hex: "#25262A" },
        { name: "Mint Green", hex: "#A8D4C2" },
        { name: "Ice Blue", hex: "#B9D3E8" },
      ],
      options: [
        { storage: "128GB", ram: "6GB", price: 2_200_000 },
        { storage: "128GB", ram: "8GB", price: 2_400_000 },
        { storage: "256GB", ram: "8GB", price: 2_650_000, oldPrice: 2_800_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [8, 6, 5, 4, 3, 2, 3, 1, 0],
    }),
    specs: androidSpecs({
      screen: '6.67" AMOLED, 120 Hz',
      chip: "Snapdragon 685",
      ram: "6 / 8 GB",
      camera: "108 MP + 8 MP ultra keng + 2 MP",
      battery: "5000 mAh, 33W tez zaryad",
      os: "Android (HyperOS)",
    }),
    keywords: ["redmi", "note 13", "xiaomi"],
    popularity: 91,
    rating: [4.6, 421],
    createdAt: "2026-03-05T09:00:00.000Z",
  }),
  defineProduct({
    slug: "redmi-13c",
    name: "Redmi 13C",
    brandId: "xiaomi",
    categoryId: "telefonlar-redmi-xiaomi",
    model: "Redmi 13C",
    shortDescription: "Eng arzon Redmi: 90 Hz ekran, 50 MP kamera.",
    description:
      "Redmi 13C — oddiy vazifalar va yosh foydalanuvchilar uchun arzon telefon: 90 Hz ekran, 50 MP kamera, 5000 mAh batareya.",
    variants: variantMatrix({
      slug: "redmi-13c",
      sku: "R13C",
      colors: [
        { name: "Midnight Black", hex: "#1B1B1F" },
        { name: "Navy Blue", hex: "#2F4A7A" },
        { name: "Clover Green", hex: "#6E9E7A" },
      ],
      options: [
        { storage: "128GB", ram: "4GB", price: 1_300_000 },
        { storage: "128GB", ram: "6GB", price: 1_450_000, oldPrice: 1_550_000 },
        { storage: "256GB", ram: "8GB", price: 1_650_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [12, 9, 8, 6, 5, 4, 3, 2, 1],
    }),
    specs: androidSpecs({
      screen: '6.74" IPS LCD, 90 Hz',
      chip: "MediaTek Helio G85",
      ram: "4 / 6 / 8 GB",
      camera: "50 MP + 2 MP",
      battery: "5000 mAh, 18W zaryad",
      os: "Android (MIUI)",
    }),
    keywords: ["redmi", "13c", "xiaomi", "arzon"],
    popularity: 87,
    rating: [4.3, 502],
    createdAt: "2025-10-08T09:00:00.000Z",
  }),
  defineProduct({
    slug: "xiaomi-14",
    name: "Xiaomi 14",
    brandId: "xiaomi",
    categoryId: "telefonlar-redmi-xiaomi",
    model: "Xiaomi 14",
    shortDescription: "Leica kamera, Snapdragon 8 Gen 3 va ixcham flagman.",
    description:
      "Xiaomi 14 — Leica optikali kamera, Snapdragon 8 Gen 3 chipi va 90W tez zaryad. Ixcham flagman telefon.",
    variants: variantMatrix({
      slug: "xiaomi-14",
      sku: "X14",
      colors: [
        { name: "Black", hex: "#1D1D1F" },
        { name: "White", hex: "#F1F1EF" },
        { name: "Jade Green", hex: "#7FA895" },
      ],
      options: [
        { storage: "256GB", ram: "12GB", price: 8_900_000 },
        { storage: "512GB", ram: "12GB", price: 9_900_000, oldPrice: 10_400_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [2, 1, 1, 1, 0, 1],
    }),
    specs: androidSpecs({
      screen: '6.36" LTPO AMOLED, 120 Hz',
      chip: "Snapdragon 8 Gen 3",
      ram: "12 GB",
      camera: "50 MP Leica + 50 MP telefoto + 50 MP ultra keng",
      battery: "4610 mAh, 90W tez zaryad",
      os: "Android (HyperOS)",
    }),
    keywords: ["xiaomi", "14", "leica"],
    popularity: 62,
    rating: [4.7, 58],
    createdAt: "2026-04-25T09:00:00.000Z",
  }),
];

export const pocoProducts: Product[] = [
  defineProduct({
    slug: "poco-x6-pro",
    name: "Poco X6 Pro",
    brandId: "poco",
    categoryId: "telefonlar-poco",
    model: "Poco X6 Pro",
    shortDescription: "Dimensity 8300 Ultra — narxiga nisbatan eng tez.",
    description:
      "Poco X6 Pro — Dimensity 8300 Ultra chipi, 120 Hz AMOLED ekran va 67W zaryad. O‘yin va kundalik foydalanish uchun kuchli telefon.",
    variants: variantMatrix({
      slug: "poco-x6-pro",
      sku: "PX6P",
      colors: [
        { name: "Racing Grey", hex: "#5B5E66" },
        { name: "Yellow", hex: "#E8C440" },
        { name: "Black", hex: "#1C1C1E" },
      ],
      options: [
        { storage: "256GB", ram: "8GB", price: 3_900_000 },
        { storage: "512GB", ram: "12GB", price: 4_500_000, oldPrice: 4_750_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [5, 3, 2, 3, 1, 0],
    }),
    specs: androidSpecs({
      screen: '6.67" AMOLED, 120 Hz',
      chip: "MediaTek Dimensity 8300 Ultra",
      ram: "8 / 12 GB",
      camera: "64 MP OIS + 8 MP ultra keng + 2 MP makro",
      battery: "5000 mAh, 67W tez zaryad",
      os: "Android (HyperOS)",
    }),
    keywords: ["poco", "x6 pro", "xiaomi", "gaming"],
    popularity: 79,
    rating: [4.7, 133],
    createdAt: "2026-04-02T09:00:00.000Z",
  }),
];

export const otherPhoneProducts: Product[] = [
  defineProduct({
    slug: "tecno-spark-20-pro",
    name: "Tecno Spark 20 Pro",
    brandId: "tecno",
    categoryId: "telefonlar-boshqa",
    model: "Spark 20 Pro",
    shortDescription: "120 Hz ekran va 256 GB xotira arzon narxda.",
    description:
      "Tecno Spark 20 Pro — 6.78 dyuymli 120 Hz ekran, 108 MP kamera va 256 GB xotirali byudjet telefon.",
    variants: variantMatrix({
      slug: "tecno-spark-20-pro",
      sku: "TS20P",
      colors: [
        { name: "Magic Skin Green", hex: "#6F9C82" },
        { name: "Moonlit Black", hex: "#1F1F23" },
        { name: "Glacier Blue", hex: "#A9C7E0" },
      ],
      options: [{ storage: "256GB", ram: "8GB", price: 1_900_000 }],
      simType: SIM,
      warrantyMonths: 12,
      stock: [4, 2, 0],
    }),
    specs: androidSpecs({
      screen: '6.78" IPS LCD, 120 Hz',
      chip: "MediaTek Helio G99",
      ram: "8 GB",
      camera: "108 MP + QVGA",
      battery: "5000 mAh, 33W tez zaryad",
      os: "Android (HiOS)",
    }),
    keywords: ["tecno", "spark 20"],
    popularity: 45,
    rating: [4.2, 39],
    createdAt: "2026-02-02T09:00:00.000Z",
  }),
];
