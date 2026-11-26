import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Daftar prefix route internal (dashboard & fluid verifikasi).
 * Proxy bertindak sebagai gerbang awal (optimistic check); otorisasi penuh
 * tetap diverifikasi di Server Layout (DAL) dan Backend API Elysia.
 */
const PROTECTED_INTERNAL_PREFIXES = [
  "/dashboard",
  "/ganti-password",
  "/analytics",
  "/broadcast",
  "/cater",
  "/import",
  "/kpi",
  "/laporan",
  "/master",
  "/meter",
  "/pelanggan",
  "/pengaduan",
  "/pengaturan",
  "/peta-wilayah",
  "/peta-spasial",
  "/progres",
  "/setting-landing",
  "/stand-konsumen",
  "/sync",
  "/tools",
  "/tools-tutup",
  "/verifikasi",
] as const;

function isProtectedInternalPath(pathname: string): boolean {
  return PROTECTED_INTERNAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token")
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Optimistic gatekeeper untuk route internal tanpa cookie sesi
  if (isProtectedInternalPath(pathname) && !hasSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Teruskan pathname aktual via request header agar Server Layout dapat
  // memverifikasi pemetaan Role-to-Route (Default Deny).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Jalankan pada semua halaman kecuali static assets, image optimization,
     * dan API routes (API diamankan langsung oleh Better Auth & Elysia authPlugin).
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
