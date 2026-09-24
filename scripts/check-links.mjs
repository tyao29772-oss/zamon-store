/**
 * Havola tekshiruvi: `/` dan boshlab barcha ichki havolalarni yuradi va o‘lik havolalarni topadi.
 * Ishga tushirish: `npm run check:links` (BASE_URL=http://localhost:3000 default).
 */

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const MAX_PAGES = 1000;

const SKIP_PREFIXES = ["/_next/", "/api/"];
const ASSET_PATTERN = /\.(?:png|jpe?g|webp|avif|svg|ico|css|js|map|txt|xml|woff2?)$/i;

/** @param {string} html */
function extractHrefs(html) {
  const hrefs = new Set();
  for (const match of html.matchAll(/<a\s[^>]*?href="([^"]*)"/gi)) {
    hrefs.add(match[1].replace(/&amp;/g, "&"));
  }
  return hrefs;
}

/** @param {string} href */
function toInternalPath(href) {
  if (!href || href.startsWith("#")) return null;
  if (/^(?:mailto:|tel:|javascript:)/i.test(href)) return null;
  if (href.startsWith("//")) return null;

  let url;
  try {
    url = new URL(href, `${BASE_URL}/`);
  } catch {
    return null;
  }
  if (url.origin !== new URL(BASE_URL).origin) return null;

  const path = url.pathname + url.search;
  if (SKIP_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return null;
  if (ASSET_PATTERN.test(url.pathname)) return null;
  return path;
}

/** path → sahifalar, ular ustidan topilgan */
const referrers = new Map();
const visited = new Set();
const queue = ["/"];
/** @type {{ path: string; status: number | string; from: string }[]} */
const broken = [];

while (queue.length > 0 && visited.size < MAX_PAGES) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { redirect: "follow" });
  } catch (error) {
    broken.push({ path, status: error instanceof Error ? error.message : "xato", from: referrers.get(path) ?? "-" });
    continue;
  }

  if (response.status !== 200) {
    broken.push({ path, status: response.status, from: referrers.get(path) ?? "-" });
    continue;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) continue;

  const html = await response.text();
  for (const href of extractHrefs(html)) {
    const next = toInternalPath(href);
    if (!next || visited.has(next)) continue;
    if (!referrers.has(next)) referrers.set(next, path);
    queue.push(next);
  }
}

console.log(`${visited.size} ta sahifa tekshirildi.`);
if (broken.length > 0) {
  console.log(`\nO‘lik havolalar (${broken.length}):`);
  for (const item of broken) {
    console.log(`  ${item.status}  ${item.path}   (topilgan joy: ${item.from})`);
  }
  process.exitCode = 1;
} else {
  console.log("O‘lik havola yo‘q.");
}
