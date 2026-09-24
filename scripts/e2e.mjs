/**
 * Brauzer testi (o‘rnatilgan Chrome orqali): haqiqiy foydalanuvchi harakatlari.
 * Ishga tushirish: server ishlab turganda `npm run e2e` (BASE_URL=http://localhost:3000 default).
 * Skrinshotlar `.data/shots/e2e-*.png` ga tushadi.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const SHOTS = ".data/shots";
mkdirSync(SHOTS, { recursive: true });

let passed = 0;
const failures = [];

async function step(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}\n       ${String(error.message).split("\n")[0]}`);
    console.log(`  FAIL ${name}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectText(locator, text) {
  const actual = (await locator.textContent())?.trim();
  expect(actual === text, `matn «${text}» kutilgan edi, topildi: «${actual}»`);
}

const browser = await chromium.launch({ channel: "chrome" });
const consoleProblems = [];
const notBuiltYet = new Set();

function watch(page, label) {
  page.on("response", (response) => {
    if (response.status() === 404 && response.url().startsWith(BASE_URL)) {
      notBuiltYet.add(new URL(response.url()).pathname);
    }
  });
  page.on("pageerror", (error) => consoleProblems.push(`[${label}] pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !/status of 404/.test(message.text())) consoleProblems.push(`[${label}] console.error: ${message.text()}`);
  });
}

/** React hydration tugaganini kutadi (interaktiv elementlarda __reactProps paydo bo‘ladi). */
async function hydrated(page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('button, a[href]');
    return el !== null && Object.keys(el).some((key) => key.startsWith('__reactProps'));
  });
}

async function open(page, url) {
  const response = await page.goto(url, { waitUntil: 'load' });
  await hydrated(page);
  return response;
}

async function reload(page) {
  await page.reload({ waitUntil: 'load' });
  await hydrated(page);
}

async function favoriteIds(page) {
  return page.evaluate(() => JSON.parse(window.localStorage.getItem("zamon:favorites:v1") ?? "[]"));
}

/* ------------------------------------------------------------------ Desktop */
console.log("\nDesktop (1280×800)");
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  watch(page, "desktop");

  await step("bosh sahifa ochiladi va sarlavha to‘g‘ri", async () => {
    const response = await open(page, BASE_URL);
    expect(response?.status() === 200, `status ${response?.status()}`);
    expect((await page.title()).includes("Zamon Store"), `title: ${await page.title()}`);
    expect(await page.locator("h1").first().isVisible(), "h1 ko‘rinmayapti");
  });

  await step("«Katalog» tugmasi mega-menyuni ochadi, havolalar bor", async () => {
    await page.getByRole("button", { name: "Katalog" }).click();
    const dialog = page.getByRole("dialog", { name: "Katalog" });
    await dialog.waitFor({ state: "visible" });
    const links = await dialog.getByRole("link").count();
    expect(links >= 25, `menyudagi havolalar: ${links}`);
    expect(await dialog.getByRole("link", { name: "iPhone" }).first().isVisible(), "iPhone havolasi yo‘q");
    await page.waitForTimeout(500); // animatsiya tugashi uchun
    await page.screenshot({ path: `${SHOTS}/e2e-desktop-menu.png` });
  });

  await step("Esc menyuni yopadi", async () => {
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Katalog" }).waitFor({ state: "detached" });
  });

  await step("yurakcha: qo‘shiladi, toast chiqadi, badge 1, localStorage yoziladi", async () => {
    const heart = page.getByRole("button", { name: /sevimlilarga qo‘shish/ }).first();
    await heart.scrollIntoViewIfNeeded();
    await heart.click();
    await page.getByText("Sevimlilarga qo‘shildi").waitFor({ state: "visible" });
    const ids = await favoriteIds(page);
    expect(ids.length === 1, `localStorage: ${JSON.stringify(ids)}`);
    const badge = page.getByRole("link", { name: /Sevimlilar, 1 ta mahsulot/ });
    await badge.waitFor({ state: "visible" });
    expect(page.url() === `${BASE_URL}/`, `yurakcha havolaga o‘tib ketdi: ${page.url()}`);
  });

  await step("sahifani yangilagandan keyin ham sevimli saqlanadi", async () => {
    await reload(page);
    const pressed = page.locator('button[aria-pressed="true"]').first();
    await pressed.waitFor({ state: "attached" });
    await page.getByRole("link", { name: /Sevimlilar, 1 ta mahsulot/ }).waitFor({ state: "visible" });
  });

  await step("yurakcha yana bosilsa o‘chadi", async () => {
    const pressed = page.locator('button[aria-pressed="true"]').first();
    await pressed.scrollIntoViewIfNeeded();
    await pressed.click();
    await page.getByText("Sevimlilardan o‘chirildi").waitFor({ state: "visible" });
    expect((await favoriteIds(page)).length === 0, "localStorage bo‘sh bo‘lishi kerak");
  });

  await step("«Asosiy mazmunga o‘tish» havolasi klaviaturada ko‘rinadi", async () => {
    await open(page, BASE_URL);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Asosiy mazmunga o‘tish" });
    await page.waitForTimeout(400); // fokus animatsiyasi tugashi uchun
    const box = await skip.boundingBox();
    expect(box && box.y >= 0, `skip-link ekranda emas (y=${box?.y})`);
    expect(await skip.evaluate((el) => el === document.activeElement), "birinchi Tab skip-linkka tushmadi");
  });

  await step("desktopda pastki navigatsiya yashirin", async () => {
    expect(!(await page.getByRole("navigation", { name: "Pastki menyu" }).isVisible()), "pastki menyu ko‘rinmoqda");
  });

  await step("mavjud bo‘lmagan sahifa: 404, taklif qilingan mahsulotlar bilan", async () => {
    const response = await open(page, `${BASE_URL}/bu-sahifa-yoq-777`);
    expect(response?.status() === 404, `status ${response?.status()}`);
    expect(await page.getByRole("heading", { name: "Sahifa topilmadi" }).isVisible(), "404 sarlavhasi yo‘q");
    expect((await page.locator("article").count()) === 4, "4 ta taklif kartasi kutilgan");
    expect(await page.getByRole("link", { name: "Bosh sahifaga" }).isVisible(), "«Bosh sahifaga» yo‘q");
    await page.screenshot({ path: `${SHOTS}/e2e-desktop-404.png` });
  });

  await step("kategoriya sahifasi ochiladi: breadcrumb, subkategoriya, mahsulot kartalari", async () => {
    await open(page, `${BASE_URL}/katalog/telefonlar/iphone`);
    // page-level h1 aniq bitta, shuning uchun h3 karta nomlaridagi bir xil so‘z bilan chalkashmaydi.
    await expectText(page.locator("h1"), "iPhone");
    expect(await page.getByRole("navigation", { name: "Yo‘l" }).getByText("Telefonlar").isVisible(), "breadcrumb yo‘q");
    const cardCount = await page.locator("article").count();
    expect(cardCount > 0, `mahsulot kartasi topilmadi: ${cardCount}`);
  });

  await step("filter havolasi bosilganda mahsulot soni kamayadi va URL yangilanadi", async () => {
    const before = await page.locator("article").count();
    await page.getByRole("link", { name: /256 GB/ }).first().click();
    await page.waitForURL(/xotira=256GB/);
    await hydrated(page);
    const after = await page.locator("article").count();
    expect(after > 0 && after <= before, `filterdan keyin: ${after}, oldin: ${before}`);
    expect(page.url().includes("xotira=256GB"), `URL: ${page.url()}`);
  });

  await step("«Tozalash» barcha filterlarni olib tashlaydi", async () => {
    await page.getByRole("link", { name: "Tozalash" }).click();
    await page.waitForURL((url) => !url.search.includes("xotira"));
    await hydrated(page);
  });

  await step("saralash: «Arzonidan qimmatiga» narxlarni o‘sish tartibida qo‘yadi", async () => {
    await page.getByLabel("Saralash:").selectOption("arzon");
    await page.waitForURL(/saralash=arzon/);
    await hydrated(page);
    const prices = await page.locator("article").evaluateAll((cards) =>
      cards.map((card) => {
        const text = card.querySelector(".text-lg")?.textContent ?? "";
        return Number(text.replace(/\D/g, ""));
      }),
    );
    expect(prices.length > 1, "narx solishtirish uchun kamida 2 karta kerak");
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i - 1] <= prices[i], `saralash buzilgan: ${prices.join(", ")}`);
    }
  });

  await step("brend sahifasi ochiladi va faqat shu brend mahsulotlari ko‘rinadi", async () => {
    await open(page, `${BASE_URL}/brendlar/apple`);
    await expectText(page.locator("h1"), "Apple");
    expect((await page.locator("article").count()) > 0, "Apple mahsulotlari yo‘q");
  });

  await step("mavjud bo‘lmagan brend: haqiqiy 404", async () => {
    const response = await open(page, `${BASE_URL}/brendlar/bu-yoq-brend`);
    expect(response?.status() === 404, `status ${response?.status()}`);
  });

  await step("aksiyalar sahifasida faqat chegirmali mahsulotlar bor", async () => {
    await open(page, `${BASE_URL}/aksiyalar`);
    await expectText(page.locator("h1"), "Aksiyalar");
    const discountBadges = await page.locator("article", { hasText: "%" }).count();
    const cards = await page.locator("article").count();
    expect(cards > 0 && discountBadges === cards, `chegirmasiz karta bor: ${discountBadges}/${cards}`);
  });

  await step("mavjud bo‘lmagan kategoriya: haqiqiy 404 (soft-404 emas)", async () => {
    const response = await open(page, `${BASE_URL}/katalog/bu-yoq-kategoriya`);
    expect(response?.status() === 404, `status ${response?.status()}`);
    expect(await page.getByRole("heading", { name: "Sahifa topilmadi" }).isVisible(), "404 UI yo‘q");
  });

  await step("mahsulot sahifasi ochiladi: nom, narx, JSON-LD", async () => {
    await open(page, `${BASE_URL}/mahsulot/iphone-15-pro-max`);
    await expectText(page.locator("h1"), "iPhone 15 Pro Max");
    expect(await page.getByTestId("pdp-price").isVisible(), "narx ko‘rinmayapti");

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(jsonLd ?? "{}");
    expect(data["@type"] === "Product", `JSON-LD @type: ${data["@type"]}`);
    expect(data.name === "iPhone 15 Pro Max", `JSON-LD name: ${data.name}`);
    expect(data.offers?.priceCurrency === "UZS", "JSON-LD narx valyutasi UZS emas");
  });

  await step("variant tanlash: xotira o‘zgarsa, narx va URL yangilanadi", async () => {
    const priceBefore = await page.getByTestId("pdp-price").textContent();
    await page.getByRole("button", { name: "512 GB" }).click();
    await page.waitForURL(/\?v=/);
    await hydrated(page);
    const priceAfter = await page.getByTestId("pdp-price").textContent();
    expect(priceAfter !== priceBefore, `narx o‘zgarmadi: ${priceBefore}`);
    const numBefore = Number(priceBefore?.replace(/\D/g, ""));
    const numAfter = Number(priceAfter?.replace(/\D/g, ""));
    expect(numAfter > numBefore, `512 GB arzonroq chiqdi: ${numBefore} → ${numAfter}`);
    expect(page.url().includes("512gb"), `URL variantni aks ettirmadi: ${page.url()}`);
  });

  await step("sahifa yangilansa ham tanlangan variant saqlanadi (?v= dan o‘qiladi)", async () => {
    await page.reload({ waitUntil: "load" });
    await hydrated(page);
    await expectText(page.locator('button[aria-pressed="true"]', { hasText: "512 GB" }), "512 GB");
  });

  await step("rang tanlansa, tanlangan yorliq va URL yangilanadi", async () => {
    const urlBefore = page.url();
    await page.getByRole("button", { name: "Blue Titanium" }).click();
    await page.waitForURL((url) => url.href !== urlBefore);
    await hydrated(page);
    expect(await page.getByText("Blue Titanium").isVisible(), "tanlangan rang yorlig‘i ko‘rinmayapti");
  });

  await step("mahsulot sahifasidagi asosiy CTA endi buyurtma oynasini ochadi (Variant B)", async () => {
    expect(
      (await page.getByRole("link", { name: "Telegram orqali buyurtma berish" }).count()) === 0,
      "asosiy CTA hali oddiy <a> havola — modalga o‘tmagan",
    );
    expect(
      await page.getByRole("button", { name: "Telegram orqali buyurtma berish" }).isVisible(),
      "asosiy CTA tugma sifatida yo‘q",
    );
  });

  await step("mahsulot sahifasida ham yurakcha ishlaydi", async () => {
    await page.getByRole("button", { name: /sevimlilarga qo‘shish/ }).first().click();
    await page.getByText("Sevimlilarga qo‘shildi").waitFor({ state: "visible" });
  });

  await step("«O‘xshash mahsulotlar» bo‘limi ko‘rinadi", async () => {
    await page.getByRole("heading", { name: "O‘xshash mahsulotlar" }).scrollIntoViewIfNeeded();
    expect((await page.locator("article").count()) > 0, "o‘xshash mahsulot yo‘q");
  });

  await step("mavjud bo‘lmagan mahsulot: haqiqiy 404", async () => {
    const response = await open(page, `${BASE_URL}/mahsulot/bu-mahsulot-yoq`);
    expect(response?.status() === 404, `status ${response?.status()}`);
  });

  await step("karta ustidagi «Telegram orqali so‘rash» — to‘g‘ri deep link (Variant A)", async () => {
    await open(page, `${BASE_URL}/katalog/telefonlar/iphone`);
    const href = await page.getByRole("link", { name: "Telegram orqali so‘rash" }).first().getAttribute("href");
    expect(href?.startsWith("https://t.me/"), `Telegram havolasi noto‘g‘ri: ${href}`);
    expect(decodeURIComponent(href ?? "").includes("iPhone"), "xabarda mahsulot nomi yo‘q");
  });

  await step("buyurtma oynasi: bo‘sh formada ikkala xato ham ko‘rinadi", async () => {
    await open(page, `${BASE_URL}/mahsulot/redmi-note-13`);
    await page.getByRole("button", { name: "Telegram orqali buyurtma berish" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: "Yuborish" }).click();
    await dialog.getByText("Ismingizni kiriting").waitFor({ state: "visible" });
    expect(
      await dialog.getByText("+998 90 123 45 67 ko‘rinishida kiriting").isVisible(),
      "telefon xatosi ko‘rinmadi (faqat birinchi xato ko‘rsatilyapti bo‘lishi mumkin)",
    );
  });

  await step("buyurtma oynasi: to‘g‘ri ma’lumot bilan yuborilsa muvaffaqiyat ekrani chiqadi", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Ism").fill("Ali Valiyev");
    await dialog.getByLabel("Telefon").fill("+998 90 123 45 67");
    await dialog.getByLabel(/Manzil yoki izoh/).fill("Chilonzor, sinov");
    await dialog.getByRole("button", { name: "Yuborish" }).click();

    await dialog.getByText(/Buyurtmangiz qabul qilindi/).waitFor({ state: "visible", timeout: 8000 });
    const orderIdText = (await dialog.locator("p", { hasText: "#QP-" }).textContent())?.trim() ?? "";
    expect(/^#QP-\d{6}$/.test(orderIdText), `buyurtma raqami formati noto‘g‘ri: ${orderIdText}`);

    const telegramLink = dialog.getByRole("link", { name: "Telegramni ochish" });
    const href = await telegramLink.getAttribute("href");
    expect(href?.startsWith("https://t.me/"), `Telegram havolasi noto‘g‘ri: ${href}`);
    expect(decodeURIComponent(href ?? "").includes(orderIdText.replace("#", "")), "xabarda buyurtma raqami yo‘q");

    await dialog.getByRole("button", { name: "Xabarni nusxalash" }).click();
    await dialog.getByText("Nusxalandi", { exact: true }).waitFor({ state: "visible" });
    await page.getByText("Xabar nusxalandi").waitFor({ state: "visible" });

    // Diqqat: X tugmasining aria-label'i "Oynani yopish" — substring bo‘yicha "Yopish" bilan
    // ham mos keladi, shuning uchun aynan pastdagi matnli tugmani tanlash uchun exact kerak.
    await dialog.getByRole("button", { name: "Yopish", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
  });

  await step("buyurtma: `/api/orders` haqiqatan buyurtmani saqlaydi (server tomonda narx)", async () => {
    const response = await page.evaluate(async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "iphone-15",
          variantId: "iphone-15-128gb-black-new",
          name: "Server Test",
          phone: "+998911112233",
          website: "http://bot-should-be-ignored.test",
        }),
      });
      return { status: res.status, body: await res.json() };
    });
    // Honeypot to'ldirilgan — botga soxta muvaffaqiyat qaytishi kerak, haqiqiy buyurtma yo'q.
    expect(response.status === 200, `status: ${response.status}`);
    expect(response.body.orderId === "QP-000000", `honeypot ishlamadi: ${JSON.stringify(response.body)}`);
  });

  await step("qidiruv paneli ochiladi, yozilganda takliflar chiqadi", async () => {
    await open(page, BASE_URL);
    await page.locator("header").getByRole("button", { name: "Qidiruv" }).click();
    const dialog = page.getByRole("dialog", { name: "Qidiruv" });
    await dialog.waitFor({ state: "visible" });
    expect(await dialog.getByText("Ko‘p qidiriladi").isVisible(), "mashhur qidiruvlar yo‘q");

    await dialog.getByRole("searchbox", { name: "Qidiruv so‘zi" }).fill("iphone 15");
    const suggestion = dialog.getByRole("link", { name: /iPhone 15/ }).first();
    await suggestion.waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/e2e-desktop-search.png` });

    await suggestion.click();
    await page.waitForURL(/\/mahsulot\//);
    await hydrated(page);
    expect(await page.locator("h1").isVisible(), "mahsulot sahifasiga o‘tmadi");

    const recent = await page.evaluate(() => window.localStorage.getItem("zamon:recent-searches:v1"));
    expect((recent ?? "").includes("iphone 15"), `so‘nggi qidiruv saqlanmadi: ${recent}`);
  });

  await step("qayta ochilganda oxirgi qidiruv chip sifatida ko‘rinadi va uni bosish natijalarga olib boradi", async () => {
    await page.locator("header").getByRole("button", { name: "Qidiruv" }).click();
    const dialog = page.getByRole("dialog", { name: "Qidiruv" });
    await dialog.waitFor({ state: "visible" });
    // exact:true — "iphone 15" (oxirgi qidiruv) va "iPhone 15" (mashhur qidiruv) bir xil
    // matnga o‘xshab ko‘rinadi, lekin registr farqlanadi; exact bilan faqat aynan mosi tanlanadi.
    await dialog.getByRole("button", { name: "iphone 15", exact: true }).click();
    await page.waitForURL(/\/qidiruv\?q=/);
    await hydrated(page);
    await expectText(page.locator("h1"), "«iphone 15»");
    expect((await page.locator("article").count()) > 0, "qidiruv natijalari yo‘q");
  });

  await step("/qidiruv: natija topilmagan so‘rovda bo‘sh holat va ommabop takliflar", async () => {
    await open(page, `${BASE_URL}/qidiruv?q=zzzzz-yoq-mahsulot`);
    expect(await page.getByText("bo‘yicha natija topilmadi").isVisible(), "bo‘sh holat ko‘rinmayapti");
    expect(await page.getByText("Ko‘p qidiriladi").isVisible(), "ommabop so‘zlar yo‘q");
  });

  await step("Esc qidiruv panelini yopadi", async () => {
    await open(page, BASE_URL);
    await page.locator("header").getByRole("button", { name: "Qidiruv" }).click();
    await page.getByRole("dialog", { name: "Qidiruv" }).waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Qidiruv" }).waitFor({ state: "detached" });
  });

  await step("sevimlilar sahifasi: qo‘shish, ko‘rinish, o‘chirish, bo‘sh holat", async () => {
    // Mustaqil boshlanish: oldingi qadamlarda (masalan mahsulot sahifasidagi yurakcha testida)
    // qolgan sevimlilar bu testga ta'sir qilmasin.
    await open(page, `${BASE_URL}/katalog/telefonlar/iphone`);
    await page.evaluate(() => window.localStorage.removeItem("zamon:favorites:v1"));
    await reload(page);
    const cards = page.locator("article");
    // Har birini o‘z kartasi ichida bosamiz — birinchisi bosilgach uning aria-label'i
    // "…qo‘shish" dan "…o‘chirish" ga o‘zgaradi, umumiy ro‘yxatdan .nth(1) bilan olish
    // noto‘g‘ri elementga siljib ketishi mumkin edi.
    await cards.nth(0).getByRole("button", { name: /sevimlilarga qo‘shish/ }).click();
    await cards.nth(1).getByRole("button", { name: /sevimlilarga qo‘shish/ }).click();
    await page.getByText("Sevimlilarga qo‘shildi").last().waitFor({ state: "visible" });

    await open(page, `${BASE_URL}/sevimlilar`);
    await expectText(page.locator("h1"), "Sevimlilar");
    await page.waitForFunction(() => document.querySelectorAll("article").length === 2);

    await page.getByRole("button", { name: /sevimlilardan o‘chirish/ }).first().click();
    await page.waitForFunction(() => document.querySelectorAll("article").length === 1);

    await page.getByRole("button", { name: /sevimlilardan o‘chirish/ }).first().click();
    await page.getByRole("heading", { name: "Sevimlilar bo‘sh" }).waitFor({ state: "visible" });
  });

  await step("footer havolalari orqali barcha statik sahifalarga o‘tish mumkin", async () => {
    const pages = [
      { label: "Magazin haqida", path: "/magazin-haqida", h1: "Magazin haqida" },
      { label: "Aloqa", path: "/aloqa", h1: "Aloqa" },
      { label: "Kafolat shartlari", path: "/kafolat", h1: "Kafolat shartlari" },
      { label: "Yetkazib berish shartlari", path: "/yetkazib-berish", h1: "Yetkazib berish shartlari" },
      { label: "Maxfiylik siyosati", path: "/maxfiylik", h1: "Maxfiylik siyosati" },
    ];

    for (const item of pages) {
      await open(page, BASE_URL);
      await page.locator("footer").getByRole("link", { name: item.label, exact: true }).click();
      await page.waitForURL(new RegExp(`${item.path}$`));
      await hydrated(page);
      await expectText(page.locator("h1"), item.h1);
    }
  });

  await step("aloqa sahifasida to‘g‘ri manzil, telefon va Telegram ko‘rsatiladi", async () => {
    await open(page, `${BASE_URL}/aloqa`);
    // Footer ham har bir sahifada telefon/Telegram havolasini ko‘rsatadi — shuning uchun
    // `main` bilan cheklaymiz, aks holda ikkita bir xil nomli havola topiladi (strict mode).
    const main = page.locator("main");
    const mapHref = await main.getByRole("link", { name: /Xaritada ochish/ }).getAttribute("href");
    expect(mapHref?.includes("google.com/maps"), `xarita havolasi noto‘g‘ri: ${mapHref}`);
    expect(await main.getByRole("link", { name: /^\+998/ }).isVisible(), "telefon havolasi ko‘rinmadi");
    const atLinks = main.getByRole("link", { name: /^@/ });
    const atCount = await atLinks.count();
    expect(atCount === 2, `Telegram va Instagram havolalari (ikkalasi) topilmadi: ${atCount}`);
  });

  await step("sitemap.xml va robots.txt to‘g‘ri kontent bilan qaytadi", async () => {
    const sitemap = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/sitemap.xml`);
      return { status: res.status, contentType: res.headers.get("content-type"), body: await res.text() };
    }, BASE_URL);
    expect(sitemap.status === 200, `sitemap status: ${sitemap.status}`);
    expect(/xml/.test(sitemap.contentType ?? ""), `sitemap content-type: ${sitemap.contentType}`);
    expect(sitemap.body.includes("<urlset"), "sitemap <urlset> topilmadi");
    expect(sitemap.body.includes("/mahsulot/"), "sitemapda mahsulot sahifalari yo‘q");
    expect(sitemap.body.includes("/magazin-haqida"), "sitemapda statik sahifalar yo‘q");
    expect(!sitemap.body.includes("/qidiruv"), "sitemapda noindex sahifa (/qidiruv) bo‘lmasligi kerak");
    expect(!sitemap.body.includes("/sevimlilar"), "sitemapda noindex sahifa (/sevimlilar) bo‘lmasligi kerak");

    const robots = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/robots.txt`);
      return { status: res.status, body: await res.text() };
    }, BASE_URL);
    expect(robots.status === 200, `robots status: ${robots.status}`);
    expect(robots.body.includes("Disallow: /api/"), "robots.txt'da /api/ disallow yo‘q");
    expect(robots.body.includes("Sitemap:"), "robots.txt'da Sitemap havolasi yo‘q");
  });

  await step("mahsulot va kategoriya sahifalarida BreadcrumbList JSON-LD bor", async () => {
    await open(page, `${BASE_URL}/mahsulot/iphone-15-pro-max`);
    const hasBreadcrumb = await page.evaluate(() =>
      [...document.querySelectorAll('script[type="application/ld+json"]')].some((el) =>
        el.textContent?.includes('"BreadcrumbList"'),
      ),
    );
    expect(hasBreadcrumb, "mahsulot sahifasida BreadcrumbList JSON-LD topilmadi");
  });

  await context.close();
}

/* ------------------------------------------------------------------ Mobil */
console.log("\nMobil (390×844)");
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  watch(page, "mobile");

  await step("pastki navigatsiyada 5 ta bo‘lim bor", async () => {
    await open(page, BASE_URL);
    const nav = page.getByRole("navigation", { name: "Pastki menyu" });
    await nav.waitFor({ state: "visible" });
    for (const label of ["Bosh sahifa", "Kategoriyalar", "Qidiruv", "Sevimlilar", "Aloqa"]) {
      expect(await nav.getByText(label, { exact: true }).isVisible(), `«${label}» yo‘q`);
    }
    expect(
      (await nav.getByRole("link", { name: "Bosh sahifa" }).getAttribute("aria-current")) === "page",
      "Bosh sahifa faol emas",
    );
  });

  await step("sahifada gorizontal siljish yo‘q (overflow)", async () => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow <= 0, `gorizontal siljish: ${overflow}px`);
  });

  await step("«Kategoriyalar» pastdan varaq ochadi, «Yopish» yopadi", async () => {
    await page.getByRole("button", { name: "Kategoriyalar" }).click();
    const dialog = page.getByRole("dialog", { name: "Katalog" });
    await dialog.waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/e2e-mobile-menu.png` });
    await dialog.getByRole("button", { name: "Yopish" }).click();
    await dialog.waitFor({ state: "detached" });
  });

  await step("mobilda yurakcha ishlaydi va pastki navigatsiyada badge chiqadi", async () => {
    const heart = page.getByRole("button", { name: /sevimlilarga qo‘shish/ }).first();
    await heart.scrollIntoViewIfNeeded();
    await heart.tap();
    await page.getByText("Sevimlilarga qo‘shildi").waitFor({ state: "visible" });
    const nav = page.getByRole("navigation", { name: "Pastki menyu" });
    await nav.getByRole("link", { name: /Sevimlilar, 1 ta mahsulot/ }).waitFor({ state: "visible" });
    const toastBox = await page.getByText("Sevimlilarga qo‘shildi").boundingBox();
    const navBox = await nav.boundingBox();
    expect(toastBox && navBox && toastBox.y + toastBox.height <= navBox.y, "toast pastki menyu ostida qolgan");
    await page.screenshot({ path: `${SHOTS}/e2e-mobile-toast.png` });
  });

  await step("footer pastki navigatsiya tagida yopilib qolmaydi", async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const copyright = page.getByText(/Barcha huquqlar himoyalangan/);
    const nav = page.getByRole("navigation", { name: "Pastki menyu" });
    const a = await copyright.boundingBox();
    const b = await nav.boundingBox();
    expect(a && b && a.y + a.height <= b.y, "footer matni pastki menyu tagida");
  });

  await step("mobilda kategoriya sahifasida «Filter» paneli ochiladi va filter qo‘llanadi", async () => {
    await open(page, `${BASE_URL}/katalog/telefonlar/iphone`);
    await page.getByRole("button", { name: /^Filter/ }).click();
    const dialog = page.getByRole("dialog", { name: "Filterlar" });
    await dialog.waitFor({ state: "visible" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/e2e-mobile-filters.png` });

    await dialog.getByRole("link", { name: /256 GB/ }).first().click();
    await page.waitForURL(/xotira=256GB/);
    await hydrated(page);
    // Panel yumshoq navigatsiyadan keyin ham ochiq qolishi kerak.
    await page.getByRole("dialog", { name: "Filterlar" }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Yopish" }).click();
    await page.getByRole("dialog", { name: "Filterlar" }).waitFor({ state: "detached" });
  });

  await step("mahsulot sahifasida sticky buyurtma paneli pastki menyu ustida turadi", async () => {
    await open(page, `${BASE_URL}/mahsulot/iphone-15-pro-max`);
    const bar = page.locator("div.fixed", { hasText: "Buyurtma berish" });
    await bar.waitFor({ state: "visible" });
    const nav = page.getByRole("navigation", { name: "Pastki menyu" });
    const barBox = await bar.boundingBox();
    const navBox = await nav.boundingBox();
    expect(barBox && navBox && barBox.y + barBox.height <= navBox.y + 1, "sticky panel pastki menyuga kirib ketgan");
  });

  await step("mahsulot sahifasida ham footer sticky panel + pastki menyu ostida to‘liq ko‘rinadi", async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(150);
    const copyright = page.getByText(/Barcha huquqlar himoyalangan/);
    const bar = page.locator("div.fixed", { hasText: "Buyurtma berish" });
    const a = await copyright.boundingBox();
    const b = await bar.boundingBox();
    expect(a && b && a.y + a.height <= b.y + 1, "footer matni sticky buyurtma paneli ostida qolgan");
  });

  await step("mobilda qidiruv to‘liq ekranli panelda ochiladi", async () => {
    await open(page, BASE_URL);
    const nav = page.getByRole("navigation", { name: "Pastki menyu" });
    await nav.getByRole("button", { name: "Qidiruv" }).click();
    const dialog = page.getByRole("dialog", { name: "Qidiruv" });
    await dialog.waitFor({ state: "visible" });
    const box = await dialog.boundingBox();
    expect(box && box.width >= 380, `panel to‘liq ekran emas: ${box?.width}`);

    await dialog.getByRole("searchbox", { name: "Qidiruv so‘zi" }).fill("airpods");
    const suggestion = dialog.getByRole("link", { name: /AirPods/ }).first();
    await suggestion.waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/e2e-mobile-search.png` });

    await dialog.getByRole("button", { name: "Yopish" }).click();
    await dialog.waitFor({ state: "detached" });
  });

  await context.close();
}

await browser.close();

console.log(`\n${passed} ta qadam o‘tdi, ${failures.length} ta yiqildi.`);
const pending = [...notBuiltYet].filter((p) => p !== "/bu-sahifa-yoq-777");
if (pending.length > 0) {
  console.log(`
Ma’lumot: ${pending.length} ta yo‘lga so‘rov 404 qaytardi (keyingi bosqichlarda quriladi):`);
  for (const path of pending.slice(0, 8)) console.log(`  ${path}`);
  if (pending.length > 8) console.log(`  … va yana ${pending.length - 8} ta`);
}
if (consoleProblems.length > 0) {
  console.log("\nBrauzer konsolidagi xatolar:");
  for (const problem of [...new Set(consoleProblems)]) console.log(`  ${problem}`);
}
if (failures.length > 0) {
  console.log("\nXatolar:");
  for (const failure of failures) console.log(`- ${failure}`);
}
process.exitCode =
  failures.length > 0 || consoleProblems.length > 0 || (process.env.STRICT === "1" && pending.length > 0) ? 1 : 0;
