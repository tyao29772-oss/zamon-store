/**
 * `public/products/<slug>/` papkalaridagi fotolarni topib, `src/data/image-manifest.json` ga yozadi.
 *
 *   public/products/iphone-15-pro-max/1.webp   ← asosiy foto (kartada va galereyada birinchi)
 *   public/products/iphone-15-pro-max/2.webp   ← qo‘shimcha fotolar (tartib raqami bo‘yicha)
 *   public/products/iphone-15-pro-max/hero.png ← bosh sahifa banneri uchun (shaffof fon)
 *
 * `npm run dev` va `npm run build` oldidan avtomatik ishlaydi.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const PRODUCTS_DIR = join(ROOT, "public", "products");
const MANIFEST_PATH = join(ROOT, "src", "data", "image-manifest.json");
const IMAGE_EXT = /\.(?:webp|avif|jpe?g|png)$/i;
const HERO_NAME = /^hero\.[a-z0-9]+$/i;

const naturalSort = (a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });

/** @type {Record<string, { images: string[]; hero?: string }>} */
const manifest = {};

if (existsSync(PRODUCTS_DIR)) {
  for (const slug of readdirSync(PRODUCTS_DIR).sort(naturalSort)) {
    const dir = join(PRODUCTS_DIR, slug);
    if (!statSync(dir).isDirectory()) continue;

    const files = readdirSync(dir).filter((file) => IMAGE_EXT.test(file));
    const hero = files.find((file) => HERO_NAME.test(file));
    const images = files
      .filter((file) => file !== hero)
      .sort(naturalSort)
      .map((file) => `/products/${slug}/${file}`);

    if (images.length === 0 && !hero) continue;
    manifest[slug] = { images, ...(hero ? { hero: `/products/${slug}/${hero}` } : {}) };
  }
}

const next = `${JSON.stringify(manifest, null, 2)}\n`;
const current = existsSync(MANIFEST_PATH) ? readFileSync(MANIFEST_PATH, "utf8") : null;

// Fayl o‘zgarmagan bo‘lsa qayta yozilmaydi (dev serverni ortiqcha qayta yuklamaslik uchun).
if (current !== next) {
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, next);
}

const count = Object.keys(manifest).length;
console.log(`Rasm manifesti: ${count} ta mahsulotda foto topildi.`);
