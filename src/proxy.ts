import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_HINT_COOKIE, verifySessionToken } from "@/lib/admin/session";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

const LOGIN_PATH = "/admin/login";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Har bir sahifa so‘rovi:
 *  1. Yangi tasodifiy `nonce` bilan qattiq Content-Security-Policy — sahifaga faqat o‘zimizning
 *     skriptlarimiz yuklanadi (begona yoki «ichiga suqilgan» skript ishlamaydi, XSS’dan himoya).
 *     Next.js nonce’ni so‘rov sarlavhasidan o‘qib, o‘z skriptlariga o‘zi qo‘yadi.
 *  2. Admin yo‘llari uchun tezkor tekshiruv: sessiyasiz foydalanuvchi login sahifasiga,
 *     kirgan admin esa login sahifasidan panelga yo‘naltiriladi. Haqiqiy himoya — sahifa va
 *     server action ichidagi `requireAdmin()` da.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const admin = isAdminPath(pathname);

  const nonce = btoa(crypto.randomUUID());
  const csp = buildContentSecurityPolicy({
    nonce,
    supabaseUrl: process.env.SUPABASE_URL,
    dev: process.env.NODE_ENV === "development",
    https: request.nextUrl.protocol === "https:",
    frameAncestors: admin ? "'none'" : "'self'",
  });

  let response: NextResponse;
  if (admin) {
    const authenticated = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
    const isLogin = pathname === LOGIN_PATH;
    if (!authenticated && !isLogin) {
      const url = new URL(LOGIN_PATH, request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      response = NextResponse.redirect(url);
    } else if (authenticated && isLogin) {
      response = NextResponse.redirect(new URL("/admin", request.url));
    } else {
      response = forward(request, nonce, csp);
    }

    // Sessiya tugagan bo‘lsa — saytdagi «Admin» tugmasi belgisi ham tozalanadi.
    if (!authenticated && request.cookies.has(ADMIN_HINT_COOKIE)) {
      response.cookies.delete({ name: ADMIN_HINT_COOKIE, path: "/" });
    }

    // Admin sahifalari qidiruv tizimlariga chiqmasin, keshlanmasin, iframe’ga joylanmasin.
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "no-referrer");
  } else {
    response = forward(request, nonce, csp);
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** So‘rovni sahifaga uzatadi; Next.js nonce’ni so‘rovdagi CSP sarlavhasidan oladi. */
function forward(request: NextRequest, nonce: string, csp: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    {
      /*
       * Sahifalar. Quyidagilar o‘tkazib yuboriladi: API (JSON qaytaradi, sarlavhasi next.config’da),
       * Next.js statik fayllari va rasm optimizatori, nuqtali fayllar (favicon.ico, robots.txt,
       * sitemap.xml, rasmlar, .well-known/security.txt).
       */
      source: "/((?!api/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)",
      // Havolalarning oldindan yuklanishi (prefetch) — sahifa emas, CSP kerak emas.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
