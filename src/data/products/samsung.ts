import { defineProduct, group, variantMatrix, type Color } from "@/data/builders";
import type { Product, SpecGroup } from "@/types";

/** NAMUNAVIY narxlar va qoldiqlar — haqiqiy ro‘yxat kelganda almashtiriladi. */

const SIM = "2 SIM (nano-SIM)";

function samsungSpecs(input: {
  screen: string;
  chip: string;
  ram: string;
  camera: string;
  battery: string;
  extra?: [string, string][];
}): SpecGroup[] {
  return [
    group("Ekran", [["Diagonal va turi", input.screen]]),
    group("Protsessor va xotira", [
      ["Protsessor", input.chip],
      ["Operativ xotira", input.ram],
    ]),
    group("Kamera", [["Asosiy kamera", input.camera]]),
    group("Batareya", [["Sig‘im va zaryad", input.battery]]),
    group("Umumiy", [["Operatsion tizim", "Android (One UI)"], ["SIM", SIM], ...(input.extra ?? [])]),
  ];
}

const S24U_COLORS: Color[] = [
  { name: "Titanium Black", hex: "#2B2B2E" },
  { name: "Titanium Gray", hex: "#8E8F92" },
  { name: "Titanium Violet", hex: "#7B6C8E" },
  { name: "Titanium Yellow", hex: "#D8C48A" },
];

export const samsungProducts: Product[] = [
  defineProduct({
    slug: "samsung-galaxy-s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    brandId: "samsung",
    categoryId: "telefonlar-samsung",
    model: "Galaxy S24 Ultra",
    shortDescription: "Titan korpus, S Pen va 200 MP kamera.",
    description:
      "Galaxy S24 Ultra — Samsung'ning eng kuchli flagmani: S Pen, 200 MP kamera, Galaxy AI va yassi Corning Gorilla Armor ekran.",
    variants: variantMatrix({
      slug: "samsung-galaxy-s24-ultra",
      sku: "S24U",
      colors: S24U_COLORS,
      options: [
        { storage: "256GB", ram: "12GB", price: 13_900_000, oldPrice: 14_600_000 },
        { storage: "512GB", ram: "12GB", price: 15_600_000 },
        { storage: "1TB", ram: "12GB", price: 18_400_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [4, 3, 2, 1, 2, 1, 0, 1, 1, 0, 0, 1],
    }),
    specs: samsungSpecs({
      screen: '6.8" Dynamic AMOLED 2X, 120 Hz',
      chip: "Snapdragon 8 Gen 3 for Galaxy",
      ram: "12 GB",
      camera: "200 MP + 50 MP (5x) + 12 MP + 10 MP (3x)",
      battery: "5000 mAh, 45W tez zaryad",
      extra: [["Korpus", "Titan"], ["Himoya", "IP68"], ["S Pen", "Bor"]],
    }),
    keywords: ["s24 ultra", "galaxy", "samsung", "s pen"],
    featured: true,
    popularity: 93,
    rating: [4.8, 198],
    createdAt: "2026-04-08T09:00:00.000Z",
    bundleIds: ["samsung-s24-ultra-himoya-chexol", "baseus-tempered-glass-s24-ultra", "samsung-25w-usb-c-adapter", "samsung-galaxy-buds2-pro"],
  }),
  defineProduct({
    slug: "samsung-galaxy-s24",
    name: "Samsung Galaxy S24",
    brandId: "samsung",
    categoryId: "telefonlar-samsung",
    model: "Galaxy S24",
    shortDescription: "Ixcham flagman: 50 MP kamera va Galaxy AI.",
    description:
      "Galaxy S24 — ixcham korpus, yorqin 120 Hz ekran va Galaxy AI funksiyalari. Bir qo‘lda foydalanish uchun qulay.",
    variants: variantMatrix({
      slug: "samsung-galaxy-s24",
      sku: "S24",
      colors: [
        { name: "Onyx Black", hex: "#1E1E20" },
        { name: "Marble Gray", hex: "#B9B9BC" },
        { name: "Cobalt Violet", hex: "#B4A7D6" },
        { name: "Amber Yellow", hex: "#E9CE85" },
      ],
      options: [
        { storage: "128GB", ram: "8GB", price: 8_900_000 },
        { storage: "256GB", ram: "8GB", price: 9_900_000, oldPrice: 10_500_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [3, 2, 0, 4, 2, 1, 1, 0],
    }),
    specs: samsungSpecs({
      screen: '6.2" Dynamic AMOLED 2X, 120 Hz',
      chip: "Exynos 2400",
      ram: "8 GB",
      camera: "50 MP + 12 MP + 10 MP (3x)",
      battery: "4000 mAh, 25W tez zaryad",
      extra: [["Himoya", "IP68"]],
    }),
    keywords: ["s24", "galaxy", "samsung"],
    featured: true,
    popularity: 85,
    rating: [4.7, 152],
    createdAt: "2026-04-08T09:00:00.000Z",
  }),
  defineProduct({
    slug: "samsung-galaxy-s25-ultra",
    name: "Samsung Galaxy S25 Ultra",
    brandId: "samsung",
    categoryId: "telefonlar-samsung",
    model: "Galaxy S25 Ultra",
    shortDescription: "Yangi avlod flagman: Snapdragon 8 Elite va Galaxy AI.",
    description:
      "Galaxy S25 Ultra — yengilroq titan korpus, Snapdragon 8 Elite chipi va yangilangan Galaxy AI. Yangi kelgan mahsulot.",
    variants: variantMatrix({
      slug: "samsung-galaxy-s25-ultra",
      sku: "S25U",
      colors: [
        { name: "Titanium Silverblue", hex: "#A9B4C2" },
        { name: "Titanium Black", hex: "#2B2B2E" },
        { name: "Titanium Gray", hex: "#8E8F92" },
      ],
      options: [
        { storage: "256GB", ram: "12GB", price: 15_400_000 },
        { storage: "512GB", ram: "12GB", price: 17_100_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [3, 2, 1, 2, 1, 0],
    }),
    specs: samsungSpecs({
      screen: '6.9" Dynamic AMOLED 2X, 120 Hz',
      chip: "Snapdragon 8 Elite for Galaxy",
      ram: "12 GB",
      camera: "200 MP + 50 MP (5x) + 50 MP + 10 MP (3x)",
      battery: "5000 mAh, 45W tez zaryad",
      extra: [["Korpus", "Titan"], ["Himoya", "IP68"], ["S Pen", "Bor"]],
    }),
    keywords: ["s25 ultra", "galaxy", "samsung", "yangi"],
    featured: true,
    popularity: 78,
    rating: [4.8, 41],
    createdAt: "2026-09-15T09:00:00.000Z",
  }),
  defineProduct({
    slug: "samsung-galaxy-a55",
    name: "Samsung Galaxy A55",
    brandId: "samsung",
    categoryId: "telefonlar-samsung",
    model: "Galaxy A55",
    shortDescription: "Metall ramka, IP67 va 5000 mAh batareya.",
    description:
      "Galaxy A55 5G — o‘rta segmentning yaxshi tanlovi: metall ramka, Super AMOLED ekran, IP67 himoya va 4 yil yangilanish.",
    variants: variantMatrix({
      slug: "samsung-galaxy-a55",
      sku: "A55",
      colors: [
        { name: "Awesome Iceblue", hex: "#BFD4E6" },
        { name: "Awesome Navy", hex: "#2A3350" },
        { name: "Awesome Lilac", hex: "#CDB9E5" },
      ],
      options: [
        { storage: "128GB", ram: "8GB", price: 3_900_000 },
        { storage: "256GB", ram: "8GB", price: 4_400_000, oldPrice: 4_700_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [6, 4, 3, 5, 2, 1],
    }),
    specs: samsungSpecs({
      screen: '6.6" Super AMOLED, 120 Hz',
      chip: "Exynos 1480",
      ram: "8 GB",
      camera: "50 MP + 12 MP ultra keng + 5 MP makro",
      battery: "5000 mAh, 25W tez zaryad",
      extra: [["Himoya", "IP67"]],
    }),
    keywords: ["a55", "galaxy", "samsung"],
    popularity: 84,
    rating: [4.6, 224],
    createdAt: "2026-02-18T09:00:00.000Z",
  }),
  defineProduct({
    slug: "samsung-galaxy-a35",
    name: "Samsung Galaxy A35",
    brandId: "samsung",
    categoryId: "telefonlar-samsung",
    model: "Galaxy A35",
    shortDescription: "Super AMOLED ekran va uzoq yangilanish qo‘llovi.",
    description:
      "Galaxy A35 5G — yorqin Super AMOLED ekran, IP67 himoya va ishonchli batareya. Narxi va imkoniyatlari muvozanatlangan.",
    variants: variantMatrix({
      slug: "samsung-galaxy-a35",
      sku: "A35",
      colors: [
        { name: "Awesome Navy", hex: "#2A3350" },
        { name: "Awesome Iceblue", hex: "#BFD4E6" },
        { name: "Awesome Lilac", hex: "#CDB9E5" },
      ],
      options: [
        { storage: "128GB", ram: "6GB", price: 3_300_000 },
        { storage: "256GB", ram: "8GB", price: 3_700_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [5, 3, 2, 4, 0, 2],
    }),
    specs: samsungSpecs({
      screen: '6.6" Super AMOLED, 120 Hz',
      chip: "Exynos 1380",
      ram: "6 / 8 GB",
      camera: "50 MP + 8 MP ultra keng + 5 MP makro",
      battery: "5000 mAh, 25W tez zaryad",
      extra: [["Himoya", "IP67"]],
    }),
    keywords: ["a35", "galaxy", "samsung"],
    popularity: 76,
    rating: [4.5, 167],
    createdAt: "2026-02-18T09:00:00.000Z",
  }),
  defineProduct({
    slug: "samsung-galaxy-a15",
    name: "Samsung Galaxy A15",
    brandId: "samsung",
    categoryId: "telefonlar-samsung",
    model: "Galaxy A15",
    shortDescription: "Byudjetga mos, 90 Hz AMOLED ekranli telefon.",
    description:
      "Galaxy A15 — arzon narxdagi Samsung: Super AMOLED ekran, 5000 mAh batareya va 6 yillik xavfsizlik yangilanishi.",
    variants: variantMatrix({
      slug: "samsung-galaxy-a15",
      sku: "A15",
      colors: [
        { name: "Blue Black", hex: "#1F2530" },
        { name: "Light Blue", hex: "#C1D6EA" },
        { name: "Yellow", hex: "#EAD98A" },
      ],
      options: [
        { storage: "128GB", ram: "4GB", price: 1_900_000, oldPrice: 2_100_000 },
        { storage: "128GB", ram: "6GB", price: 2_100_000 },
      ],
      simType: SIM,
      warrantyMonths: 12,
      stock: [8, 6, 5, 4, 3, 0],
    }),
    specs: samsungSpecs({
      screen: '6.5" Super AMOLED, 90 Hz',
      chip: "MediaTek Helio G99",
      ram: "4 / 6 GB",
      camera: "50 MP + 5 MP + 2 MP",
      battery: "5000 mAh, 25W tez zaryad",
    }),
    keywords: ["a15", "galaxy", "samsung", "arzon"],
    popularity: 89,
    rating: [4.4, 356],
    createdAt: "2025-11-10T09:00:00.000Z",
  }),
];
