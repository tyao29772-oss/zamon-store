import { banners } from "@/data/banners";
import type { Banner } from "@/types";

export async function getActiveBanners(): Promise<Banner[]> {
  return banners.filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder);
}
