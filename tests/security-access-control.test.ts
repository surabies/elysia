import { describe, test, expect } from "bun:test";
import {
  isInternalUser,
  isCustomerOnly,
  sanitizeCallbackUrl,
  getPostAuthRedirect,
  getAllowedRolesForPath,
  canAccessInternalRoute,
} from "../apps/web/src/lib/auth/access-control";
import { registerSchema } from "../apps/web/src/features/auth/lib/auth-schema";
import { navGroups, filterNavGroups } from "../apps/web/src/config/navigasi";
import { app } from "@cater/backend";

describe("Security Hardening: Role Isolation & Route-to-Role RBAC (Default Deny)", () => {
  test("1. Role USER (pelanggan) terisolasi penuh dari seluruh area internal", () => {
    expect(isInternalUser(["USER"])).toBe(false);
    expect(isCustomerOnly(["USER"])).toBe(true);
    expect(isInternalUser([])).toBe(false);

    const internalPaths = [
      "/dashboard",
      "/analytics",
      "/kpi",
      "/cater",
      "/master/user",
      "/master/otorisasi",
      "/verifikasi",
      "/verifikasi/baca-petugas",
      "/tools-tutup/monitoring-tutup-bulan",
      "/broadcast",
      "/import/data",
    ];

    for (const p of internalPaths) {
      expect(canAccessInternalRoute(["USER"], p)).toBe(false);
    }

    // Sidebar internal untuk USER harus kosong (0 grup)
    expect(filterNavGroups(navGroups, ["USER"]).length).toBe(0);
  });

  test("2. Pemetaan RBAC antar role internal berjalan ketat", () => {
    // PENCATAT hanya boleh operasional lapangan & dashboard
    expect(canAccessInternalRoute(["PENCATAT"], "/dashboard")).toBe(true);
    expect(canAccessInternalRoute(["PENCATAT"], "/cater")).toBe(true);
    expect(canAccessInternalRoute(["PENCATAT"], "/master/user")).toBe(false);
    expect(canAccessInternalRoute(["PENCATAT"], "/kpi")).toBe(false);
    expect(canAccessInternalRoute(["PENCATAT"], "/verifikasi/baca-petugas")).toBe(false);
    expect(canAccessInternalRoute(["PENCATAT"], "/tools-tutup/monitoring-tutup-bulan")).toBe(false);

    // STAFF_ADMIN_BILLING boleh closing & billing, tapi dilarang ke master/user & kpi
    expect(canAccessInternalRoute(["STAFF_ADMIN_BILLING"], "/tools-tutup/monitoring-tutup-bulan")).toBe(true);
    expect(canAccessInternalRoute(["STAFF_ADMIN_BILLING"], "/master/user")).toBe(false);
    expect(canAccessInternalRoute(["STAFF_ADMIN_BILLING"], "/master/otorisasi")).toBe(false);
    expect(canAccessInternalRoute(["STAFF_ADMIN_BILLING"], "/kpi")).toBe(false);

    // EXECUTIVE boleh KPI, tapi dilarang ke master/user
    expect(canAccessInternalRoute(["EXECUTIVE"], "/kpi")).toBe(true);
    expect(canAccessInternalRoute(["EXECUTIVE"], "/master/user")).toBe(false);

    // SUPERADMIN bebas penuh
    expect(canAccessInternalRoute(["SUPERADMIN"], "/master/user")).toBe(true);
    expect(canAccessInternalRoute(["SUPERADMIN"], "/master/otorisasi")).toBe(true);
    expect(canAccessInternalRoute(["SUPERADMIN"], "/kpi")).toBe(true);
  });

  test("3. Default Deny: route internal yang tidak terdaftar hanya untuk SUPERADMIN", () => {
    expect(getAllowedRolesForPath("/halaman-rahasia-baru")).toEqual(["SUPERADMIN"]);
    expect(canAccessInternalRoute(["EXECUTIVE"], "/halaman-rahasia-baru")).toBe(false);
    expect(canAccessInternalRoute(["STAFF_ADMIN_BILLING"], "/halaman-rahasia-baru")).toBe(false);
    expect(canAccessInternalRoute(["SUPERADMIN"], "/halaman-rahasia-baru")).toBe(true);
  });

  test("4. Anti Open-Redirect (CWE-601) & Post-Auth Redirect sesuai Role", () => {
    expect(sanitizeCallbackUrl("https://evil.com/phish", "/")).toBe("/");
    expect(sanitizeCallbackUrl("//evil.com/phish", "/")).toBe("/");
    expect(sanitizeCallbackUrl("/\\evil.com", "/")).toBe("/");
    expect(sanitizeCallbackUrl("javascript:alert(1)", "/")).toBe("/");
    expect(sanitizeCallbackUrl("/dashboard", "/")).toBe("/dashboard");

    // USER SELALU diarahkan ke Beranda Publik ("/"), bahkan jika callbackUrl=/dashboard
    expect(getPostAuthRedirect(["USER"], "/dashboard")).toBe("/");
    expect(getPostAuthRedirect(["USER"], "/master/user")).toBe("/");

    // Staf internal diarahkan ke callbackUrl yang aman atau /dashboard
    expect(getPostAuthRedirect(["SUPERADMIN"], "/master/user")).toBe("/master/user");
    expect(getPostAuthRedirect(["SUPERADMIN"], "https://evil.com")).toBe("/dashboard");
    expect(getPostAuthRedirect(["PENCATAT"], "/login")).toBe("/dashboard");
  });

  test("5. Validasi Skema Pendaftaran: Wajib Nomor Pelanggan (nolg)", () => {
    const tanpaNolg = registerSchema.safeParse({
      nolg: "",
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "Password123!",
      konfirmasi: "Password123!",
    });
    expect(tanpaNolg.success).toBe(false);

    const nolgInjeksi = registerSchema.safeParse({
      nolg: "' OR 1=1 --",
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "Password123!",
      konfirmasi: "Password123!",
    });
    expect(nolgInjeksi.success).toBe(false);

    const nolgValid = registerSchema.safeParse({
      nolg: "00703600750",
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "Password123!",
      konfirmasi: "Password123!",
    });
    expect(nolgValid.success).toBe(true);
  });
});

describe("Security Hardening: Backend Elysia API Authorization", () => {
  test("6. Endpoint internal sensitif wajib menolak request anonim (401 Unauthorized)", async () => {
    const protectedRequests = [
      new Request("http://localhost/api/kpi"),
      new Request("http://localhost/api/master/users"),
      new Request("http://localhost/api/master/otorisasi"),
      new Request("http://localhost/api/master/petugas"),
      new Request("http://localhost/api/closing/periode-kerja"),
      new Request("http://localhost/api/import/sample/pbpk"),
      new Request("http://localhost/api/broadcast"),
      new Request("http://localhost/api/broadcast/landing-sections", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      new Request("http://localhost/api/pengaduan"),
      new Request("http://localhost/api/pengaduan/statistik"),
      new Request("http://localhost/api/media/status"),
      new Request("http://localhost/api/media/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          file: "data:image/jpeg;base64,/9j/4AAQ",
          modul: "broadcast",
          jenis: "banner",
          identifier: "test-1",
        }),
      }),
    ];

    for (const req of protectedRequests) {
      const res = await app.handle(req);
      expect(res.status).toBe(401);
    }
  });
});
