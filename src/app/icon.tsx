import { connection } from "next/server";
import { renderBrandIcon } from "@/lib/brand/icon-image";
import { getStore } from "@/lib/repo/store";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Brauzer tabidagi belgi — do‘kon logotip yozuvining birinchi harfi (Sozlamalar’dan). */
export default async function Icon() {
  // Har so‘rovda: do‘kon nomi o‘zgarsa, belgi ham darhol o‘zgaradi (ma’lumot baribir keshda).
  await connection();
  const store = await getStore();
  return renderBrandIcon(store.wordmark || store.name, size.width);
}
