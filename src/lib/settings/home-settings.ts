import { z } from "zod";
import { banners as defaultBanners } from "@/data/banners";
import type { BannerTheme } from "@/types";

/**
 * Admin paneldagi «Bosh sahifa»: eng tepadagi katta blok, ikki tavsiya kartasi va reklama
 * bannerlari. Bazada (`settings`, id = 'home') saqlanadi; yo‘q yoki buzilgan qismlar uchun
 * pastdagi standart qiymatlar ishlatiladi. Brauzer ham, server ham ishlatadi (sof funksiyalar).
 */

export const MAX_BANNERS = 6;
export const BANNER_THEMES = ["dark", "blue", "light"] as const satisfies readonly BannerTheme[];
export const FEATURE_TONES = ["sand", "dark"] as const;

export interface HomeHero {
  productSlug: string;
  /** Sarlavha ustidagi kichik yozuv: «Haftaning tanlovi». */
  eyebrow: string;
  /** Bo‘sh — mahsulot nomi. */
  title: string;
  /** Bo‘sh — mahsulotning qisqa tavsifi. */
  text: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface HomeFeature {
  productSlug: string;
  eyebrow: string;
  title: string;
  /** Bo‘sh — mahsulotning qisqa tavsifi. */
  text: string;
  tone: (typeof FEATURE_TONES)[number];
}

export interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  theme: BannerTheme;
  /** Admin yuklagan rasm (ixtiyoriy). */
  image: string;
  active: boolean;
}

export interface HomeSettings {
  hero: HomeHero;
  featuresEnabled: boolean;
  features: HomeFeature[];
  banners: HomeBanner[];
}

export const DEFAULT_HOME: HomeSettings = {
  hero: {
    productSlug: "iphone-15-pro-max",
    eyebrow: "Haftaning tanlovi",
    title: "",
    text: "",
    secondaryLabel: "Barcha telefonlar",
    secondaryHref: "/katalog/telefonlar",
  },
  featuresEnabled: true,
  features: [
    {
      productSlug: "macbook-air-m3",
      eyebrow: "Laptoplar",
      title: "Kun bo‘yi ishlaydigan noutbuk",
      text: "MacBook Air M3: yengil, sokin va tez. O‘qish va ish uchun.",
      tone: "sand",
    },
    {
      productSlug: "apple-airpods-pro-2",
      eyebrow: "Quloqchinlar",
      title: "Shovqinsiz toza ovoz",
      text: "AirPods Pro 2: faol shovqin bekor qilish va premium ovoz.",
      tone: "dark",
    },
  ],
  banners: [...defaultBanners]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel, href: b.href, theme: b.theme, image: b.image ?? "", active: b.active })),
};

/** Ichki yo‘l (`/aksiyalar`) yoki to‘liq https havola (masalan, Telegram kanal). */
export function isSafeHref(value: string): boolean {
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !/\s/.test(value);
  } catch {
    return false;
  }
}

const href = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}: havolani yozing (masalan, /aksiyalar)`)
    .max(300, `${label}: havola juda uzun`)
    .refine(isSafeHref, `${label}: «/» bilan boshlanadigan sahifa yoki https:// havola yozing`);

const slug = z.string().trim().min(1, "Mahsulotni tanlang").max(120);

export const heroSchema = z.object({
  productSlug: slug,
  eyebrow: z.string().trim().max(40, "Ko‘pi bilan 40 belgi"),
  title: z.string().trim().max(60, "Sarlavha ko‘pi bilan 60 belgi"),
  text: z.string().trim().max(300, "Matn ko‘pi bilan 300 belgi"),
  secondaryLabel: z.string().trim().max(30, "Ko‘pi bilan 30 belgi"),
  secondaryHref: z.string().trim().max(300),
}).superRefine((hero, ctx) => {
  // Ikkinchi tugma ixtiyoriy: yozuvi bo‘lsa, havolasi ham to‘g‘ri bo‘lsin.
  if (hero.secondaryLabel && !isSafeHref(hero.secondaryHref)) {
    ctx.addIssue({ code: "custom", path: ["secondaryHref"], message: "«/» bilan boshlanadigan sahifa yoki https:// havola yozing" });
  }
});

export const featureSchema = z.object({
  productSlug: slug,
  eyebrow: z.string().trim().max(30, "Ko‘pi bilan 30 belgi"),
  title: z.string().trim().min(1, "Sarlavhani yozing").max(50, "Sarlavha ko‘pi bilan 50 belgi"),
  text: z.string().trim().max(200, "Matn ko‘pi bilan 200 belgi"),
  tone: z.enum(FEATURE_TONES),
});

export const bannerSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/),
  title: z.string().trim().min(1, "Sarlavhani yozing").max(70, "Sarlavha ko‘pi bilan 70 belgi"),
  subtitle: z.string().trim().max(200, "Matn ko‘pi bilan 200 belgi"),
  ctaLabel: z.string().trim().min(1, "Tugma yozuvini yozing").max(30, "Ko‘pi bilan 30 belgi"),
  href: href("Tugma"),
  theme: z.enum(BANNER_THEMES),
  image: z.string().max(500),
  active: z.boolean(),
});

export const homeSettingsSchema = z.object({
  hero: heroSchema,
  featuresEnabled: z.boolean(),
  features: z.array(featureSchema).length(2),
  banners: z
    .array(bannerSchema)
    .max(MAX_BANNERS, `Ko‘pi bilan ${MAX_BANNERS} ta banner`)
    .refine((list) => new Set(list.map((b) => b.id)).size === list.length, "Bannerlar takrorlanmasin"),
});

/**
 * Bazadagi qiymat + standartlar. Har bo‘lim alohida tekshiriladi: biri buzilgan bo‘lsa,
 * faqat o‘sha bo‘lim standartga qaytadi, qolganlari saqlanadi.
 */
export function mergeHomeSettings(saved: unknown): HomeSettings {
  const data = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
  const pick = <T>(schema: z.ZodType<T>, value: unknown, fallback: T): T => {
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : fallback;
  };
  return {
    hero: pick(heroSchema, data.hero, DEFAULT_HOME.hero),
    featuresEnabled: pick(z.boolean(), data.featuresEnabled, DEFAULT_HOME.featuresEnabled),
    features: pick(homeSettingsSchema.shape.features, data.features, DEFAULT_HOME.features),
    banners: pick(homeSettingsSchema.shape.banners, data.banners, DEFAULT_HOME.banners),
  };
}

export function newBannerId(): string {
  return `banner-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
