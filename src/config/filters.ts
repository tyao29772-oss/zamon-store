import type { FilterField } from "@/lib/catalog";

/** Filterlar kategoriyaga bog‘langan — komponentga qattiq yozilmaydi (docs/PROJECT_PROMPT.md §8). */

const STORAGE_ORDER = ["64GB", "128GB", "256GB", "512GB", "1TB"] as const;
const RAM_ORDER = ["4GB", "6GB", "8GB", "12GB", "16GB", "18GB", "32GB", "36GB"] as const;
const POWER_ORDER = ["10", "15", "18", "20", "25", "33", "45", "65", "70", "90", "100"] as const;

export const GENERIC_FILTERS: FilterField[] = [
  { key: "brend", label: "Brend", source: "brand" },
  { key: "holat", label: "Holati", source: "variant.condition" },
];

export const PHONE_FILTERS: FilterField[] = [
  { key: "brend", label: "Brend", source: "brand" },
  { key: "model", label: "Model", source: "model" },
  { key: "xotira", label: "Xotira", source: "variant.storage", order: STORAGE_ORDER },
  { key: "rang", label: "Rang", source: "variant.color" },
  { key: "holat", label: "Holati", source: "variant.condition" },
  { key: "sim", label: "SIM turi", source: "variant.simType" },
  { key: "kafolat", label: "Kafolat", source: "variant.warranty" },
];

export const LAPTOP_FILTERS: FilterField[] = [
  { key: "brend", label: "Brend", source: "brand" },
  { key: "protsessor", label: "Protsessor", source: "attribute.cpu" },
  { key: "ram", label: "Operativ xotira (RAM)", source: "variant.ram", order: RAM_ORDER },
  { key: "xotira", label: "SSD/HDD xotira", source: "variant.storage", order: STORAGE_ORDER },
  { key: "ekran", label: "Ekran o‘lchami", source: "attribute.screenSize" },
  { key: "videokarta", label: "Video karta", source: "attribute.gpu" },
  { key: "holat", label: "Holati", source: "variant.condition" },
];

export const ACCESSORY_FILTERS: FilterField[] = [
  { key: "brend", label: "Brend", source: "brand" },
  { key: "moslik", label: "Telefon modeli bilan mosligi", source: "attribute.compatibility" },
  { key: "rang", label: "Rang", source: "variant.color" },
];

export const CASE_EXTRA_FILTERS: FilterField[] = [
  { key: "material", label: "Materiali", source: "attribute.material" },
];

export const CHARGER_EXTRA_FILTERS: FilterField[] = [
  { key: "quvvat", label: "Quvvat", source: "attribute.power", order: POWER_ORDER },
  { key: "port", label: "Port turi", source: "attribute.port" },
];

/** `rootId` — kategoriya daraxtining ildizi (`telefonlar` / `aksessuarlar` / `laptoplar`). */
export function getFilterFields(rootId: string | null, categoryId: string): FilterField[] {
  if (rootId === "telefonlar") return PHONE_FILTERS;
  if (rootId === "laptoplar") return LAPTOP_FILTERS;
  if (rootId === "aksessuarlar") {
    if (categoryId.includes("chexollar")) return [...ACCESSORY_FILTERS, ...CASE_EXTRA_FILTERS];
    if (categoryId.startsWith("aksessuarlar-zaryadchiklar")) {
      return [...ACCESSORY_FILTERS, ...CHARGER_EXTRA_FILTERS];
    }
    return ACCESSORY_FILTERS;
  }
  return GENERIC_FILTERS;
}
