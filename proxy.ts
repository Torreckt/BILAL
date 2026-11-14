import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIES } from "./lib/session-cookie";

// Runs before every page: issues the Content-Security-Policy with a per-request nonce, keeps the dashboard out of
// search results, and bounces signed-out visitors away from /admin early. The real permission checks run again on
// the server inside every admin page and action (lib/auth.ts).
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const admin = pathname.startsWith("/admin");
  const signedIn = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (admin && !signedIn && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  if (admin || process.env.SITE_NOINDEX === "1") res.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (admin) res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = {
  // Pages only: skip static assets, images, uploaded media and the API.
  matcher: [{ source: "/((?!api|_next/static|_next/image|media|work/|brand/|.*\\.(?:png|jpg|svg|ico|mp4|webp|txt|xml)$).*)" }],
};
