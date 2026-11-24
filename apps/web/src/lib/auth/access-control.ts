import type { AppRole } from "@cater/db";
import { navGroups, flattenNavItems } from "@/config/navigasi";

/**
 * Seluruh role internal (petugas/pegawai/manajemen).
 * Role `USER` (pelanggan/warga) TIDAK termasuk di sini dan dilarang mutlak
 * mengakses area `(dashboard)` maupun `(fluid)`.
 */
export const INTERNAL_ROLES: readonly AppRole[] = [
  "SUPERADMIN",
  "EXECUTIVE",
  "DIREKSI",
  "SENIOR_MANAGER",
  "MANAGER",
  "SUPERVISOR",
  "STAFF",
  "VERIFIKATOR_3",
  "VERIFIKATOR_2",
  "VERIFIKATOR_1",
  "STAFF_ADMIN_BILLING",
  "PENCATAT",
  "PELAKSANA",
] as const;

const INTERNAL_ROLE_SET: ReadonlySet<AppRole> = new Set(INTERNAL_ROLES);

export function isInternalUser(
  roles: readonly AppRole[] | undefined | null
): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((role) => INTERNAL_ROLE_SET.has(role));
}

export function isCustomerOnly(
  roles: readonly AppRole[] | undefined | null
): boolean {
  return !isInternalUser(roles);
}

/**
 * Sanitasi `callbackUrl` agar mencegah Open Redirect (CWE-601).
 * Hanya menerima relative path yang dimulai dengan `/` tunggal.
 */
export function sanitizeCallbackUrl(
  rawUrl: string | undefined | null,
  fallback = "/"
): string {
  if (!rawUrl || typeof rawUrl !== "string") return fallback;
  const trimmed = rawUrl.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\") ||
    /[\r\n\0]/.test(trimmed)
  ) {
    return fallback;
  }
  return trimmed;
}

/**
 * Menentukan tujuan redirect pasca-login/daftar sesuai role:
 * - Pelanggan (`USER` murni) SELALU diarahkan ke Beranda Publik (`/`).
 * - Staf internal diarahkan ke `callbackUrl` yang tervalidasi atau `/dashboard`.
 */
export function getPostAuthRedirect(
  roles: readonly AppRole[] | undefined | null,
  rawCallbackUrl?: string | null
): string {
  if (!isInternalUser(roles)) {
    return "/";
  }

  const safeTarget = sanitizeCallbackUrl(rawCallbackUrl, "/dashboard");
  if (
    safeTarget === "/login" ||
    safeTarget === "/daftar" ||
    safeTarget.startsWith("/login?") ||
    safeTarget.startsWith("/daftar?")
  ) {
    return "/dashboard";
  }

  return safeTarget;
}

/**
 * Override & pemetaan eksplisit untuk route internal yang tidak tertulis
 * persis di `navGroups` (mis. sub-halaman dinamis, route `(fluid)`, dan tools).
 */
const EXPLICIT_ROUTE_ROLES: Record<string, readonly AppRole[]> = {
  "/dashboard": INTERNAL_ROLES,
  "/cater": [
    "SUPERADMIN",
    "VERIFIKATOR_1",
    "VERIFIKATOR_2",
    "VERIFIKATOR_3",
    "PENCATAT",
  ],
  "/verifikasi": [
    "SUPERADMIN",
    "VERIFIKATOR_1",
    "VERIFIKATOR_2",
    "VERIFIKATOR_3",
  ],
  "/verifikasi/baca-petugas": [
    "SUPERADMIN",
    "VERIFIKATOR_1",
    "VERIFIKATOR_2",
    "VERIFIKATOR_3",
  ],
  "/verifikasi/baca-pelanggan": [
    "SUPERADMIN",
    "MANAGER",
    "STAFF",
    "PELAKSANA",
    "STAFF_ADMIN_BILLING",
  ],
  "/broadcast": ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING"],
  "/import": ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_3"],
  "/tools": ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
  "/tools-tutup": [
    "SUPERADMIN",
    "EXECUTIVE",
    "STAFF_ADMIN_BILLING",
  ],
  "/sync": ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
  "/setting-landing": ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING"],
  "/master/user": ["SUPERADMIN"],
  "/master/otorisasi": ["SUPERADMIN"],
  "/master": [
    "SUPERADMIN",
    "EXECUTIVE",
    "STAFF_ADMIN_BILLING",
    "VERIFIKATOR_1",
    "VERIFIKATOR_2",
  ],
  "/kpi": ["SUPERADMIN", "EXECUTIVE"],
  "/stand-konsumen": [
    "SUPERADMIN",
    "MANAGER",
    "STAFF",
    "PELAKSANA",
    "STAFF_ADMIN_BILLING",
  ],
};

function buildRouteRoleMap(): Map<string, readonly AppRole[]> {
  const map = new Map<string, readonly AppRole[]>();

  // 1. Turunkan otomatis dari navigasi.ts
  for (const group of navGroups) {
    const groupRoles = group.roles ?? ["SUPERADMIN"];
    for (const item of flattenNavItems(group.items)) {
      const normalizedHref = item.href.split("?")[0].replace(/\/+$/, "") || "/";
      const roles = (item.roles ?? groupRoles).filter((r) =>
        INTERNAL_ROLE_SET.has(r)
      );
      map.set(normalizedHref, roles.length > 0 ? roles : ["SUPERADMIN"]);
    }
  }

  // 2. Gabungkan dengan explicit overrides (jangan menimpa yang lebih spesifik dari navGroups kecuali belum ada)
  for (const [route, roles] of Object.entries(EXPLICIT_ROUTE_ROLES)) {
    if (!map.has(route)) {
      map.set(route, roles);
    }
  }

  return map;
}

const ROUTE_ROLE_MAP = buildRouteRoleMap();

/**
 * Mengembalikan daftar role yang diizinkan untuk suatu path internal.
 * Menerapkan prinsip **Default Deny**: jika path tidak ditemukan pada matriks,
 * hanya `SUPERADMIN` yang diizinkan.
 */
export function getAllowedRolesForPath(pathname: string): readonly AppRole[] {
  const normalized = pathname.split("?")[0].replace(/\/+$/, "") || "/";

  // 1. Exact match
  const exact = ROUTE_ROLE_MAP.get(normalized);
  if (exact) return exact;

  // 2. Longest prefix match (untuk sub-route dinamis seperti /broadcast/[id])
  let bestPrefix = "";
  let bestRoles: readonly AppRole[] | undefined;

  for (const [route, roles] of ROUTE_ROLE_MAP.entries()) {
    if (
      route !== "/" &&
      normalized.startsWith(`${route}/`) &&
      route.length > bestPrefix.length
    ) {
      bestPrefix = route;
      bestRoles = roles;
    }
  }

  if (bestRoles) return bestRoles;

  // 3. Default Deny: hanya SUPERADMIN
  return ["SUPERADMIN"];
}

/**
 * Mengecek apakah sekumpulan role berhak mengakses halaman internal tertentu.
 * Pelanggan (`USER`) SELALU mengembalikan `false`.
 */
export function canAccessInternalRoute(
  roles: readonly AppRole[] | undefined | null,
  pathname: string
): boolean {
  if (!isInternalUser(roles)) return false;
  if (roles!.includes("SUPERADMIN")) return true;

  const allowed = getAllowedRolesForPath(pathname);
  return allowed.some((r) => roles!.includes(r));
}
