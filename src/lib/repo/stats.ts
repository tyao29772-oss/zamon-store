import "server-only";
import { dbRpcRead, isDbConfigured } from "@/lib/db/supabase";
import { STATS_TIME_ZONE, type StatsResult } from "@/lib/admin/stats";

/** `admin_stats` SQL funksiyasi (0008_stats.sql): sanash bazaning o‘zida bo‘ladi. */
export async function loadStats(from: Date, to: Date): Promise<StatsResult | null> {
  if (!isDbConfigured()) return null;
  return dbRpcRead<StatsResult>("admin_stats", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_tz: STATS_TIME_ZONE,
  });
}
