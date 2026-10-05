import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_HINT_COOKIE, verifySessionToken } from "@/lib/admin/session";

const LOGIN_PATH = "/admin/login";

/**
 * Admin yo‘llari uchun tezkor tekshiruv: sessiyasiz foydalanuvchi login sahifasiga,
 * kirgan admin esa login sahifasidan panelga yo‘naltiriladi. Bu faqat qulaylik —
 * haqiqiy himoya sahifa va server action ichidagi `requireAdmin()` da.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === LOGIN_PATH;

  let response: NextResponse;
  if (!authenticated && !isLogin) {
    const url = new URL(LOGIN_PATH, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(url);
  } else if (authenticated && isLogin) {
    response = NextResponse.redirect(new URL("/admin", request.url));
  } else {
    response = NextResponse.next();
  }

  // Sessiya tugagan bo‘lsa — saytdagi «Admin» tugmasi belgisi ham tozalanadi.
  if (!authenticated && request.cookies.has(ADMIN_HINT_COOKIE)) {
    response.cookies.delete({ name: ADMIN_HINT_COOKIE, path: "/" });
  }

  // Admin sahifalari qidiruv tizimlariga chiqmasin va keshlanmasin.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  // Admin sahifani begona sayt iframe'iga joylab, tugmalarni aldab bostirib bo‘lmasin (clickjacking).
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
