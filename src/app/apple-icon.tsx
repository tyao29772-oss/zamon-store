import { connection } from "next/server";
import { renderBrandIcon } from "@/lib/brand/icon-image";
import { getStore } from "@/lib/repo/store";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iPhone «Bosh ekranga qo‘shish» ikonkasi (burchaklarini iOS o‘zi yumaloqlaydi). */
export default async function AppleIcon() {
  await connection();
  const store = await getStore();
  return renderBrandIcon(store.wordmark || store.name, size.width, false);
}
