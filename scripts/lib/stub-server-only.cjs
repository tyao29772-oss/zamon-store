/* eslint-disable @typescript-eslint/no-require-imports -- Node `--require` bilan yuklanadigan CommonJS fayl */
/**
 * Faqat Node skriptlari (tsx) uchun: `server-only` paketi Next'dan tashqarida doim xato
 * beradi. Testlar server kodini to‘g‘ridan-to‘g‘ri chaqirgani uchun uni bo‘sh modulga
 * almashtiramiz. Sayt build'iga ta’sir qilmaydi — u yerda himoya to‘liq ishlaydi.
 */
const Module = require("node:module");
const path = require("node:path");

const empty = path.join(__dirname, "empty.cjs");
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function resolve(request, ...rest) {
  if (request === "server-only") return empty;
  return originalResolve.call(this, request, ...rest);
};
