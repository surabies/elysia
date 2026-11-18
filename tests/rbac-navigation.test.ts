import { describe, test, expect } from "bun:test";
import {
  navGroups,
  primaryNav,
  filterNavGroups,
  filterPrimaryNav,
  flattenNavItems,
} from "../apps/web/src/config/navigasi";
import { searchDocs } from "../apps/web/src/lib/data-pencarian";

describe("Sidebar Navigation RBAC & Role-Based Menu Filtering (Flat & Clean)", () => {
  test("1. SUPERADMIN has unconstrained access to all 7 groups and admin items", () => {
    const userRoles = ["SUPERADMIN"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);
    const filteredPrimary = filterPrimaryNav(primaryNav, userRoles);

    // All 7 groups must be accessible
    expect(filteredGroups.length).toBe(7);
    expect(filteredGroups.map((g) => g.id)).toEqual([
      "ikhtisar",
      "pencatatan-meter",
      "tagihan",
      "langganan",
      "import-data",
      "setting-landing",
      "pengaturan",
    ]);

    // Pengaturan items must include sensitive admin modules (Pengguna & RBAC)
    const pengaturanGroup = filteredGroups.find((g) => g.id === "pengaturan")!;
    const pengaturanHrefs = flattenNavItems(pengaturanGroup.items).map((i) => i.href);
    expect(pengaturanHrefs).toContain("/master/user");
    expect(pengaturanHrefs).toContain("/master/otorisasi");

    // Primary nav has Dashboard
    expect(filteredPrimary.map((p) => p.href)).toContain("/dashboard");
  });

  test("2. PENCATAT (Petugas Lapangan) is limited to operational cater, customer info, and dashboard", () => {
    const userRoles = ["PENCATAT"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);

    const groupIds = filteredGroups.map((g) => g.id);
    expect(groupIds).toContain("ikhtisar");
    expect(groupIds).toContain("pencatatan-meter");
    expect(groupIds).toContain("langganan");

    // Tagihan & Setting Landing must be hidden
    expect(groupIds).not.toContain("tagihan");
    expect(groupIds).not.toContain("setting-landing");

    // Pencatatan meter only contains allowed operational modules
    const caterGroup = filteredGroups.find((g) => g.id === "pencatatan-meter")!;
    const caterHrefs = flattenNavItems(caterGroup.items).map((i) => i.href);
    expect(caterHrefs).toContain("/cater");
    expect(caterHrefs).toContain("/meter/cek-foto");
    expect(caterHrefs).toContain("/progres/cater");
    expect(caterHrefs).not.toContain("/cater/simulasi");
    expect(caterHrefs).not.toContain("/progres/ekstrim");
  });

  test("3. STAFF_ADMIN_BILLING sees closing & billing tools, but NOT admin user management", () => {
    const userRoles = ["STAFF_ADMIN_BILLING"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);

    const groupIds = filteredGroups.map((g) => g.id);
    expect(groupIds).toContain("tagihan");
    expect(groupIds).toContain("pencatatan-meter");

    // In pengaturan: user and otorisasi are forbidden
    const pengaturanGroup = filteredGroups.find((g) => g.id === "pengaturan")!;
    const pengaturanHrefs = flattenNavItems(pengaturanGroup.items).map((i) => i.href);
    expect(pengaturanHrefs).not.toContain("/master/user");
    expect(pengaturanHrefs).not.toContain("/master/otorisasi");

    // Tagihan includes DRD and closing wizards
    const tagihanGroup = filteredGroups.find((g) => g.id === "tagihan")!;
    const tagihanHrefs = flattenNavItems(tagihanGroup.items).map((i) => i.href);
    expect(tagihanHrefs).toContain("/laporan/lap-drd");
    expect(tagihanHrefs).toContain("/tools-tutup/monitoring-tutup-bulan");
  });

  test("4. VERIFIKATOR_1 (Supervisor) cannot access closing tools or manual billing adjustments", () => {
    const userRoles = ["VERIFIKATOR_1"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);

    // Supervisor cannot access closing tools
    const tagihanGroup = filteredGroups.find((g) => g.id === "tagihan")!;
    const tagihanHrefs = flattenNavItems(tagihanGroup.items).map((i) => i.href);
    expect(tagihanHrefs).not.toContain("/tools-tutup/monitoring-tutup-bulan");
    expect(tagihanHrefs).not.toContain("/tools-tutup/stand-angkat");

    // Supervisor sees verification CHN and anomaly radar
    const caterGroup = filteredGroups.find((g) => g.id === "pencatatan-meter")!;
    const caterHrefs = flattenNavItems(caterGroup.items).map((i) => i.href);
    expect(caterHrefs).toContain("/verifikasi/baca-petugas");
    expect(caterHrefs).toContain("/progres/ekstrim");
  });

  test("5. Multi-role user inherits union of authorized menus", () => {
    const userRoles = ["PENCATAT", "STAFF_ADMIN_BILLING"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);

    const groupIds = filteredGroups.map((g) => g.id);
    expect(groupIds).toContain("pencatatan-meter");
    expect(groupIds).toContain("tagihan");
    expect(groupIds).toContain("langganan");
  });

  test("6. Search dialog respects RBAC filtering (prevents unauthorized discovery)", () => {
    // For PENCATAT: searching 'user' returns 0 results
    const pencatatGroups = filterNavGroups(navGroups, ["PENCATAT"]);
    const pencatatSearchResults = searchDocs("user", pencatatGroups);
    const foundAdminItem = pencatatSearchResults
      .flatMap((g: any) => g.results)
      .find((r: any) => r.href === "/master/user");
    expect(foundAdminItem).toBeUndefined();

    // For SUPERADMIN: searching 'user' returns Pengguna
    const adminGroups = filterNavGroups(navGroups, ["SUPERADMIN"]);
    const adminSearchResults = searchDocs("user", adminGroups);
    expect(adminSearchResults.length).toBeGreaterThan(0);
    const foundUserItem = adminSearchResults
      .flatMap((g: any) => g.results)
      .find((r: any) => r.href === "/master/user");
    expect(foundUserItem).toBeDefined();
    expect(foundUserItem?.page).toBe("Pengguna");
  });
});
