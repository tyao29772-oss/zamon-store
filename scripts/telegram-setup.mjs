/**
 * Telegram botni sozlash yordamchisi.
 *   npm run telegram:setup            — token to‘g‘rimi, botga kim yozgan (chat ID'lar)
 *   npm run telegram:setup -- --write — topilgan chat ID'ni .env.local ga yozadi (bitta bo‘lsa)
 *   npm run telegram:setup -- --test  — .env.local dagi chat ID'ga sinov xabari yuboradi
 * Token ekranga hech qachon chiqarilmaydi.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ENV_FILE = join(process.cwd(), ".env.local");
const args = new Set(process.argv.slice(2));

function readEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const values = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
  return values;
}

const env = readEnv();
const token = env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log("✗ .env.local da TELEGRAM_BOT_TOKEN yo‘q.");
  console.log("  Telegram'da @BotFather → /newbot → nom va username bering → berilgan tokenni");
  console.log("  .env.local dagi «TELEGRAM_BOT_TOKEN=» qatoriga joylang va qayta ishga tushiring.");
  process.exit(1);
}
if (!/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(token)) {
  console.log("✗ TELEGRAM_BOT_TOKEN ko‘rinishi noto‘g‘ri (123456789:AA... bo‘lishi kerak). Bo‘sh joy yoki qo‘shtirnoq qolmaganini tekshiring.");
  process.exit(1);
}

async function api(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({ ok: false, description: `HTTP ${response.status}` }));
  return data;
}

const me = await api("getMe");
if (!me.ok) {
  console.log(`✗ Token ishlamadi: ${me.description ?? "noma’lum xato"}. @BotFather'dan tokenni qayta nusxalang.`);
  process.exit(1);
}
console.log(`✓ Bot topildi: ${me.result.first_name} (@${me.result.username})`);

if (args.has("--test")) {
  const chatId = env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) {
    console.log("✗ TELEGRAM_ADMIN_CHAT_ID yo‘q. Avval: npm run telegram:setup -- --write");
    process.exit(1);
  }
  const sent = await api("sendMessage", { chat_id: chatId, text: "✅ Zamon Store: bot to‘g‘ri sozlangan. Yangi buyurtmalar shu chatga keladi." });
  console.log(sent.ok ? `✓ Sinov xabari yuborildi (chat ${chatId}) — Telegram'ni tekshiring.` : `✗ Yuborilmadi: ${sent.description}`);
  process.exit(sent.ok ? 0 : 1);
}

const updates = await api("getUpdates");
if (!updates.ok) {
  console.log(`✗ Xabarlarni o‘qib bo‘lmadi: ${updates.description}`);
  process.exit(1);
}

const chats = new Map();
for (const update of updates.result) {
  const message = update.message ?? update.my_chat_member ?? update.edited_message;
  const chat = message?.chat;
  if (!chat) continue;
  const name = chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ");
  chats.set(String(chat.id), { id: String(chat.id), name, username: chat.username, type: chat.type });
}

if (chats.size === 0) {
  console.log("");
  console.log("Botga hali hech kim yozmagan (yoki xabar 24 soatdan eski).");
  console.log(`  1) Telegram'da https://t.me/${me.result.username} ni oching`);
  console.log("  2) «Start» (yoki /start) ni bosing");
  console.log("  3) Shu buyruqni qayta ishga tushiring");
  process.exit(1);
}

console.log("\nBotga yozganlar:");
for (const c of chats.values()) {
  console.log(`  • ${c.name}${c.username ? ` (@${c.username})` : ""} — chat ID: ${c.id}${c.type !== "private" ? ` [${c.type}]` : ""}`);
}

if (args.has("--write")) {
  if (chats.size !== 1) {
    console.log("\n✗ Bir nechta chat bor — qaysi biri sizniki ekanini aniqlab, ID'ni .env.local ga qo‘lda yozing.");
    process.exit(1);
  }
  const [only] = chats.values();
  let content = readFileSync(ENV_FILE, "utf8");
  content = /^TELEGRAM_ADMIN_CHAT_ID=.*$/m.test(content)
    ? content.replace(/^TELEGRAM_ADMIN_CHAT_ID=.*$/m, `TELEGRAM_ADMIN_CHAT_ID=${only.id}`)
    : `${content.trimEnd()}\nTELEGRAM_ADMIN_CHAT_ID=${only.id}\n`;
  writeFileSync(ENV_FILE, content);
  console.log(`\n✓ .env.local ga yozildi: TELEGRAM_ADMIN_CHAT_ID=${only.id}`);
  console.log("  Endi sinab ko‘ring: npm run telegram:setup -- --test");
}
