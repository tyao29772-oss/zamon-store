import { appendJsonLine } from "@/lib/repo/local-jsonl";
import type { AnalyticsEvent } from "@/types";

const FILE_NAME = "events.jsonl";

export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  await appendJsonLine(FILE_NAME, event);
}
