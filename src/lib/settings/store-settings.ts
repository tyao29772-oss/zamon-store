import { z } from "zod";
import { normalizeUzPhone } from "@/lib/phone";
import type { Store } from "@/types";

/**
 * Admin paneldagi «Sozlamalar»: do‘kon egasi kodsiz o‘zgartira oladigan ma’lumotlar.
 * Bazada faqat o‘zgartirilganlari saqlanadi; qolganlari `src/data/store.ts` dagi standart
 * qiymatlardan olinadi. Brauzer ham, server ham ishlatadi (sof funksiyalar).
 */

export const EDITABLE_STORE_KEYS = [
  "name",
  "wordmark",
  "tagline",
  "phone",
  "telegramUsername",
  "instagramUrl",
  "address",
  "landmark",
  "workingHours",
  "deliveryZones",
  "description",
  "aboutLong",
  "warrantyPolicy",
  "returnPolicy",
  "deliveryPolicy",
  "privacyPolicy",
] as const satisfies readonly (keyof Store)[];

export type StoreSettings = Pick<Store, (typeof EDITABLE_STORE_KEYS)[number]>;

const paragraphs = (label: string) =>
  z
    .array(z.string().trim().min(1).max(1000, `${label}: har bir xatboshi ko‘pi bilan 1000 belgi`))
    .min(1, `${label}: kamida bitta xatboshi yozing`)
    .max(20, `${label}: ko‘pi bilan 20 ta xatboshi`);

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2, "Do‘kon nomini yozing (kamida 2 belgi)").max(40, "Nom ko‘pi bilan 40 belgi"),
  // Logotipdagi qisqa yozuv: katta harflarda, lotin harf/raqam/bo‘shliq.
  wordmark: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(1, "Logotip yozuvini kiriting")
        .max(12, "Logotip yozuvi ko‘pi bilan 12 belgi")
        // O‘zbekcha O‘/G‘ apostroflari (‘ ʻ ’ ') ham ruxsat etiladi.
        .regex(/^[A-Z0-9][A-Z0-9 &'’‘ʻ.-]*$/, "Faqat lotin harflari, raqam, bo‘shliq va & ' . -"),
    ),
  tagline: z.string().trim().min(3, "Shiorni yozing").max(80, "Shior ko‘pi bilan 80 belgi"),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = normalizeUzPhone(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "Telefon raqami noto‘g‘ri — +998 90 123 45 67 ko‘rinishida yozing" });
        return z.NEVER;
      }
      return normalized;
    }),
  telegramUsername: z
    .string()
    .trim()
    .transform((value) => value.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, ""))
    .pipe(
      z
        .string()
        .regex(/^[A-Za-z][A-Za-z0-9_]{4,31}$/, "Telegram username 5–32 belgi: lotin harf, raqam va «_» (masalan, zamon_store)")
        .refine((u) => !/bot$/i.test(u), "Bu bot username'i. Bu yerga xaridorlar yozadigan oddiy akkaunt kerak, bot emas"),
    ),
  instagramUrl: z
    .string()
    .trim()
    .max(200)
    .refine((u) => u === "" || /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/.test(u), "Instagram havolasi: https://instagram.com/sahifa_nomi (yoki bo‘sh qoldiring)"),
  address: z.string().trim().min(5, "Manzilni yozing").max(300),
  landmark: z.string().trim().max(200).optional().transform((v) => v || undefined),
  workingHours: z
    .array(z.object({ label: z.string().trim().min(1, "Kunlarni yozing").max(60), hours: z.string().trim().min(1, "Soatni yozing").max(60) }))
    .min(1, "Kamida bitta ish vaqti qatori kerak")
    .max(10),
  deliveryZones: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Hudud nomini yozing").max(80),
        price: z.number().int().min(0, "Narx manfiy bo‘lmaydi").max(10_000_000),
        note: z.string().trim().max(150).optional().transform((v) => v || undefined),
      }),
    )
    .max(20),
  description: z.string().trim().min(10, "Qisqa tavsif kamida 10 belgi").max(400),
  aboutLong: paragraphs("Do‘kon haqida"),
  warrantyPolicy: paragraphs("Kafolat"),
  returnPolicy: paragraphs("Qaytarish"),
  deliveryPolicy: paragraphs("Yetkazib berish"),
  privacyPolicy: paragraphs("Maxfiylik"),
});

/** Bazadagi (qisman bo‘lishi mumkin) qiymatlarni standartlar ustiga qo‘yadi. Buzilgan maydon e’tiborsiz qoldiriladi. */
export function mergeStoreSettings(defaults: Store, saved: unknown): Store {
  if (!saved || typeof saved !== "object") return defaults;
  const result: Store = { ...defaults };
  const shape = storeSettingsSchema.shape;
  for (const key of EDITABLE_STORE_KEYS) {
    if (!(key in (saved as Record<string, unknown>))) continue;
    const parsed = shape[key].safeParse((saved as Record<string, unknown>)[key]);
    if (parsed.success) (result as unknown as Record<string, unknown>)[key] = parsed.data;
  }
  // Manzil o‘zgargan bo‘lsa, eski koordinatalar boshqa joyni ko‘rsatardi — xarita manzil bo‘yicha qidiradi.
  if (result.address !== defaults.address) {
    result.latitude = undefined;
    result.longitude = undefined;
  }
  return result;
}

export function pickStoreSettings(store: Store): StoreSettings {
  return Object.fromEntries(EDITABLE_STORE_KEYS.map((key) => [key, store[key]])) as StoreSettings;
}

/** Formadagi matn maydoni: xatboshilar bo‘sh qator bilan ajratiladi. */
export function paragraphsToText(list: string[]): string {
  return list.join("\n\n");
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}
