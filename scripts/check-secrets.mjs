/**
 * Build'dan keyin maxfiy qiymatlar brauzerga tushadigan fayllarda yo‘qligini tekshiradi.
 * Tekshiriladi: `.next/static` (klient bundle) va oldindan render qilingan HTML/RSC fayllar.
 * Ishga tushirish: `npm run build && npm run check:secrets`
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/** Klientga chiqmasligi kerak bo‘lgan env nomlari. */
const FORBIDDEN_NAMES = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID"];

function readEnvFile(name) {
  const path = join(ROOT, name);
  if (!existsSync(path)) return {};
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return values;
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local"), ...readEnvFile(".env.production.local") };

/** Haqiqiy maxfiy qiymatlar (bo‘lsa). Juda qisqa qiymatlar tasodifiy moslikni oldini olish uchun o‘tkazib yuboriladi. */
const secretValues = FORBIDDEN_NAMES.map((name) => process.env[name] || fileEnv[name])
  .filter((value) => typeof value === "string" && value.length >= 8);

/** @param {string} dir @param {(file: string) => boolean} accept */
function walk(dir, accept) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) files.push(...walk(full, accept));
    else if (accept(full)) files.push(full);
  }
  return files;
}

const staticFiles = walk(join(ROOT, ".next", "static"), () => true);
const prerendered = walk(join(ROOT, ".next", "server", "app"), (file) => /\.(?:html|rsc|segment\.rsc)$/.test(file));
const targets = [...staticFiles, ...prerendered];

if (!existsSync(join(ROOT, ".next"))) {
  console.log("`.next` papkasi yo‘q — avval `npm run build` ni ishga tushiring.");
  process.exit(1);
}

const leaks = [];
for (const file of targets) {
  const content = readFileSync(file, "utf8");
  for (const name of FORBIDDEN_NAMES) {
    if (content.includes(name)) leaks.push(`${file}: «${name}» nomi topildi`);
  }
  for (const value of secretValues) {
    if (content.includes(value)) leaks.push(`${file}: maxfiy qiymat topildi`);
  }
}

console.log(`${targets.length} ta fayl tekshirildi${secretValues.length > 0 ? " (haqiqiy qiymatlar bilan)" : " (faqat nomlar bo‘yicha)"}.`);
if (leaks.length > 0) {
  console.log("\nXAVFLI: maxfiy ma’lumot klientga tushgan!");
  for (const leak of leaks) console.log(`  ${leak}`);
  process.exit(1);
}
console.log("Maxfiy ma’lumot klient fayllarida yo‘q.");
