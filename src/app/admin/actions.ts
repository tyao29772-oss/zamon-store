"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminEnv } from "@/config/env";
import {
  ADMIN_COOKIE,
  ADMIN_HINT_COOKIE,
  ADMIN_COOKIE_PATH,
  ADMIN_SESSION_MAX_AGE_S,
  createSessionToken,
  isAdminPassword,
  safeAdminRedirect,
} from "@/lib/admin/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60_000;

export interface LoginState {
  error: string | null;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!getAdminEnv().enabled) {
    return { error: "Admin panel sozlanmagan: ADMIN_PASSWORD va ADMIN_SESSION_SECRET kerak." };
  }

  const ip = getClientIp(await headers());
  const rate = checkRateLimit(`admin-login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!rate.allowed) {
    const minutes = Math.ceil((rate.retryAfterMs ?? 0) / 60_000);
    return { error: `Juda ko‘p urinish. ${minutes} daqiqadan so‘ng qayta urinib ko‘ring.` };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !(await isAdminPassword(password))) {
    return { error: "Parol noto‘g‘ri." };
  }

  const token = await createSessionToken();
  if (!token) return { error: "Sessiya yaratib bo‘lmadi." };

  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: ADMIN_COOKIE_PATH,
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });

  // Saytda «Admin» tugmasini ko‘rsatish uchun belgi (ruxsat bermaydi).
  (await cookies()).set(ADMIN_HINT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });

  redirect(safeAdminRedirect(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete({ name: ADMIN_COOKIE, path: ADMIN_COOKIE_PATH });
  store.delete({ name: ADMIN_HINT_COOKIE, path: "/" });
  redirect("/admin/login");
}
