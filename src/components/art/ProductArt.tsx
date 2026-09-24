import { getDefaultVariant } from "@/lib/product";
import type { Product, ProductVariant } from "@/types";
import {
  AdapterArt,
  CableArt,
  CaseArt,
  DEFAULT_WALLPAPER,
  EarbudsArt,
  GlassArt,
  LaptopArt,
  PhonePair,
  PowerbankArt,
  PuckArt,
  SpeakerArt,
  StandArt,
  WatchArt,
  type Wallpaper,
} from "./devices";

export type ArtKind =
  | "phone"
  | "laptop"
  | "case"
  | "glass"
  | "cable"
  | "adapter"
  | "puck"
  | "powerbank"
  | "earbuds"
  | "watch"
  | "stand"
  | "speaker";

const KIND_BY_CATEGORY: Record<string, ArtKind> = {
  "aksessuarlar-chexollar": "case",
  "aksessuarlar-himoya-oynalari": "glass",
  "aksessuarlar-zaryadchiklar-adapterlar": "adapter",
  "aksessuarlar-zaryadchiklar-kabellar": "cable",
  "aksessuarlar-zaryadchiklar-simsiz": "puck",
  "aksessuarlar-zaryadchiklar-car": "adapter",
  "aksessuarlar-powerbanklar": "powerbank",
  "aksessuarlar-quloqchinlar": "earbuds",
  "aksessuarlar-simsiz-quloqchinlar": "earbuds",
  "aksessuarlar-smart-watch": "watch",
  "aksessuarlar-telefon-stendlari": "stand",
  "aksessuarlar-boshqa": "speaker",
};

export function getArtKind(categoryId: string): ArtKind {
  if (categoryId.startsWith("telefonlar")) return "phone";
  if (categoryId.startsWith("laptoplar")) return "laptop";
  return KIND_BY_CATEGORY[categoryId] ?? "adapter";
}

/** Brendga mos «ekran fon rasmi» ranglari. */
const WALLPAPER_BY_BRAND: Record<string, Wallpaper> = {
  apple: ["#0f2f3a", "#22b39a", "#0a1a2c"],
  samsung: ["#241650", "#8a4fd6", "#f28f3b"],
  xiaomi: ["#0d2a33", "#31b8a4", "#f0a24a"],
  poco: ["#2a2320", "#f2c230", "#3a3f46"],
  infinix: ["#14283f", "#4d8fe0", "#6de0c6"],
  honor: ["#1b2340", "#5b79e8", "#e58fb8"],
  tecno: ["#10302a", "#3fbf8a", "#14213a"],
  lenovo: ["#1a2438", "#5077c8", "#d99a6c"],
  hp: ["#14263d", "#3f7fd0", "#9ad0e8"],
  asus: ["#11243a", "#3a86c8", "#e0a060"],
  acer: ["#12262c", "#3aa88f", "#c8d8e0"],
  msi: ["#1e1216", "#d0342c", "#20242c"],
};

export function getWallpaper(brandId: string): Wallpaper {
  return WALLPAPER_BY_BRAND[brandId] ?? DEFAULT_WALLPAPER;
}

interface ProductArtProps {
  product: Product;
  variant?: ProductVariant;
  className?: string;
}

export function ProductArt({ product, variant, className }: ProductArtProps) {
  const chosen = variant ?? getDefaultVariant(product);
  const kind = getArtKind(product.categoryId);
  const color = chosen.colorHex;
  const wall = getWallpaper(product.brandId);

  switch (kind) {
    case "phone":
      return <PhonePair color={color} wall={wall} className={className} />;
    case "laptop":
      return <LaptopArt color={color} wall={wall} className={className} />;
    case "case":
      return <CaseArt color={color} className={className} />;
    case "glass":
      return <GlassArt className={className} />;
    case "cable":
      return <CableArt color={color} className={className} />;
    case "adapter":
      return <AdapterArt color={color} className={className} />;
    case "puck":
      return <PuckArt color={color} className={className} />;
    case "powerbank":
      return <PowerbankArt color={color} className={className} />;
    case "earbuds":
      return <EarbudsArt color={color} className={className} />;
    case "watch":
      return <WatchArt color={color} className={className} />;
    case "stand":
      return <StandArt color={color} className={className} />;
    case "speaker":
      return <SpeakerArt color={color} className={className} />;
  }
}
