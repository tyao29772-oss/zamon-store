/**
 * Yangi do‘kon uchun admin paroli va sessiya kalitini yaratadi: `npm run secrets`.
 * Natijani `.env.local` ga va Netlify → Environment variables’ga qo‘ying. Hech qayerga saqlanmaydi.
 */
import { randomBytes, randomInt } from "node:crypto";

// O‘qish va telefonda terish oson: o‘xshash belgilar (0/O, 1/l/I) yo‘q.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function password(groups = 4, size = 5) {
  return Array.from({ length: groups }, () => Array.from({ length: size }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")).join("-");
}

console.log("Quyidagilarni .env.local va Netlify’ga qo‘ying (har do‘kon uchun YANGI qiymat):\n");
console.log(`ADMIN_PASSWORD=${password()}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
console.log("\nParolni do‘kon egasiga xavfsiz yo‘l bilan bering (masalan, yuzma-yuz) va o‘zingizda saqlamang.");
