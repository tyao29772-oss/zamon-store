import "server-only";
import { dbInsertQuiet, isDbConfigured } from "@/lib/db/supabase";
import { appendJsonLine } from "@/lib/repo/local-jsonl";
import type { AnalyticsEvent } from "@/types";

const FILE_NAME = "events.jsonl";

/** Supabase sozlangan bo‘lsa `events` jadvaliga, aks holda lokal faylga. Xato saytni buzmaydi. */
export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  if (isDbConfigured()) {
    try {
      await dbInsertQuiet("events", {
        name: event.name,
        session_id: event.sessionId,
        payload: event.payload,
        created_at: event.timestamp,
      });
    } catch (error) {
      console.error("[repo/events] bazaga yozib bo‘lmadi:", error);
    }
    return;
  }
  await appendJsonLine(FILE_NAME, event);
}
