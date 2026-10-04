import "server-only";
import { unstable_rethrow } from "next/navigation";
import { getSupabaseEnv, type SupabaseEnv } from "@/config/env";

/**
 * Supabase (PostgREST) bilan to‘g‘ridan-to‘g‘ri `fetch` orqali ishlash — qo‘shimcha
 * kutubxonasiz. Maxfiy kalit ishlatiladi, shuning uchun bu fayl faqat serverda
 * (`server-only` — klient kodiga import qilinsa build xato beradi).
 */

const TIMEOUT_MS = 8000;

export class DbError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "DbError";
  }
}

export function isDbConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

function requireEnv(): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) throw new DbError("Supabase sozlanmagan");
  return env;
}

function authHeaders(env: SupabaseEnv): Record<string, string> {
  const headers: Record<string, string> = { apikey: env.secretKey };
  // Eski `service_role` kaliti JWT — u `Authorization` da ham yuboriladi.
  // Yangi `sb_secret_...` kaliti esa faqat `apikey` sarlavhasida bo‘ladi.
  if (env.secretKey.startsWith("eyJ")) headers.Authorization = `Bearer ${env.secretKey}`;
  return headers;
}

async function request(path: string, init: RequestInit & { headers?: Record<string, string> }): Promise<Response> {
  const env = requireEnv();
  let response: Response;
  try {
    response = await fetch(`${env.url}/rest/v1/${path}`, {
      ...init,
      headers: { ...authHeaders(env), ...init.headers },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    // Next'ning ichki signallari (masalan, prerender paytida dinamik so‘rov) xato emas — uzatiladi.
    unstable_rethrow(error);
    throw new DbError(`Supabase'ga ulanib bo‘lmadi: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) {
    // Javob matni log uchun — kalit unda bo‘lmaydi.
    const detail = await response.text().catch(() => "");
    throw new DbError(`Supabase ${response.status}: ${detail.slice(0, 300)}`, response.status);
  }
  return response;
}

/** Bitta qator qo‘shadi va bazadagi to‘liq qatorni (masalan, yaratilgan `id` bilan) qaytaradi. */
export async function dbInsert<Row>(table: string, row: Record<string, unknown>): Promise<Row> {
  const response = await request(table, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  const rows = (await response.json()) as Row[];
  if (!rows[0]) throw new DbError(`"${table}" ga yozildi, lekin qator qaytmadi`);
  return rows[0];
}

/** Qo‘shadi, lekin javobni kutmaydi (analytics kabi yuqori hajmli yozuvlar uchun yengilroq). */
export async function dbInsertQuiet(table: string, row: Record<string, unknown>): Promise<void> {
  await request(table, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
}

/** Supabase bitta javobda ko‘pi bilan shuncha qator beradi (Data API `max_rows`). */
const PAGE_SIZE = 1000;

/**
 * Barcha mos qatorlarni sahifalab o‘qiydi. `query` — PostgREST parametrlari,
 * masalan `select=*&order=created_at.desc`.
 */
export async function dbSelectAll<Row>(table: string, query: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const response = await request(`${table}?${query}`, {
      method: "GET",
      headers: { Range: `${from}-${from + PAGE_SIZE - 1}`, "Range-Unit": "items" },
    });
    const page = (await response.json()) as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/**
 * Bir nechta qatorni qo‘shadi. Birlamchi kalit bo‘yicha mavjud qator: `merge` — yangilanadi,
 * `ignore` — tegilmaydi (masalan, seed admin tahrirlarini bosib ketmasligi uchun).
 */
export async function dbUpsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: "merge" | "ignore" = "merge",
): Promise<void> {
  if (rows.length === 0) return;
  const resolution = onConflict === "merge" ? "merge-duplicates" : "ignore-duplicates";
  await request(table, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: `resolution=${resolution},return=minimal` },
    body: JSON.stringify(rows),
  });
}

/**
 * Filtrga mos qatorlarni yangilaydi va yangilangan qatorlarni qaytaradi (bo‘sh ro‘yxat —
 * hech narsa mos kelmadi). `query` — PostgREST filtri, masalan `id=eq.abc`.
 */
export async function dbUpdate<Row>(table: string, query: string, patch: Record<string, unknown>): Promise<Row[]> {
  const response = await request(`${table}?${query}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  return (await response.json()) as Row[];
}

/** Jadvaldagi qatorlar soni. `query` — PostgREST filtri, masalan `status=eq.new`. */
export async function dbCount(table: string, query = ""): Promise<number> {
  const response = await request(`${table}?select=*${query ? `&${query}` : ""}`, {
    method: "HEAD",
    headers: { Prefer: "count=exact" },
  });
  // `Content-Range: */42` yoki `0-9/42`
  const total = response.headers.get("content-range")?.split("/")[1];
  const count = Number(total);
  if (!Number.isFinite(count)) throw new DbError("Supabase qatorlar sonini qaytarmadi");
  return count;
}

export type DbHealth =
  | { state: "not_configured" }
  | { state: "ok" }
  | { state: "error"; message: string };

/** Admin dashboard uchun: baza sozlanganmi va kerakli jadvallar bormi. */
export async function checkDbHealth(): Promise<DbHealth> {
  if (!isDbConfigured()) return { state: "not_configured" };
  try {
    await Promise.all([dbCount("orders"), dbCount("events"), dbCount("products")]);
    return { state: "ok" };
  } catch (error) {
    const status = error instanceof DbError ? error.status : undefined;
    const message =
      status === 401 || status === 403
        ? "Kalit noto‘g‘ri yoki ruxsat yo‘q (SUPABASE_SECRET_KEY ni tekshiring)"
        : status === 404
          ? "Jadvallar topilmadi — supabase/migrations dagi SQL ishga tushirilmagan"
          : "Supabase'ga ulanib bo‘lmadi (SUPABASE_URL ni tekshiring)";
    console.error("[db] health:", error);
    return { state: "error", message };
  }
}
