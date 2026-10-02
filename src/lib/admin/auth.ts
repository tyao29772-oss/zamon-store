import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin/session";

/**
 * Admin uchun haqiqiy tekshiruv (proxy faqat tezkor, «optimistik» yo‘naltiradi).
 * Har bir admin sahifa va har bir admin server action shu funksiyani chaqiradi.
 */
export const isAdminAuthenticated = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
});

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}
