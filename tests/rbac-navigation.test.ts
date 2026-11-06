import { describe, test, expect } from "bun:test";
import {
  navGroups,
  primaryNav,
  filterNavGroups,
  filterPrimaryNav,
  isNodeAllowed,
} from "../apps/web/src/config/Navigasi";
import { searchDocs } from "../apps/web/src/lib/DataPencarian";

describe("Sidebar Navigation RBAC & Role-Based Menu Filtering", () => {
  test("1. SUPERADMIN has unconstrained access to all groups and items", () => {
    const userRoles = ["SUPERADMIN"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);
    const filteredPrimary = filterPrimaryNav(primaryNav, userRoles);

    // All 8 groups must be accessible
    expect(filteredGroups.length).toBe(8);
    expect(filteredGroups.map((g) => g.id)).toEqual([
      "master",
      "pengolahan-data",
      "peta",
      "progres",
      "laporan",
      "tool-tutup-bulan",
      "tools",
      "sync-tutup-bulan",
    ]);

    // Master items must include sensitive admin modules
    const masterGroup = filteredGroups.find((g) => g.id === "master")!;
    const masterHrefs = masterGroup.items.map((i) => ("href" in i ? i.href : ""));
    expect(masterHrefs).toContain("/master/user");
    expect(masterHrefs).toContain("/master/otorisasi");

    // Primary nav has both Dashboard and Analytics
    expect(filteredPrimary.length).toBe(2);
    expect(filteredPrimary.map((p) => p.href)).toContain("/dashboard");
    expect(filteredPrimary.map((p) => p.href)).toContain("/analytics");
  });

  test("2. PENCATAT (Petugas Lapangan) is strictly limited to field operations", () => {
    const userRoles = ["PENCATAT"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);
    const filteredPrimary = filterPrimaryNav(primaryNav, userRoles);

    // Only 3 operational groups allowed
    const groupIds = filteredGroups.map((g) => g.id);
    expect(groupIds).toEqual(["pengolahan-data", "peta", "progres"]);

    // Sensitive groups must be completely hidden
    expect(groupIds).not.toContain("master");
    expect(groupIds).not.toContain("laporan");
    expect(groupIds).not.toContain("tool-tutup-bulan");
    expect(groupIds).not.toContain("tools");
    expect(groupIds).not.toContain("sync-tutup-bulan");

    // Pengolahan Data only contains CHN, Pelanggan, and Cek Foto
    const pengolahanGroup = filteredGroups.find((g) => g.id === "pengolahan-data")!;
    const pengolahanHrefs = pengolahanGroup.items.map((i) => ("href" in i ? i.href : ""));
    expect(pengolahanHrefs).toEqual(["/cater", "/pelanggan", "/meter/cek-foto"]);
    expect(pengolahanHrefs).not.toContain("/pelanggan/manual-add");
    expect(pengolahanHrefs).not.toContain("/pelanggan/mutasi");

    // Progress only contains Progress per Cater and Hasil Foto
    const progresGroup = filteredGroups.find((g) => g.id === "progres")!;
    const progresHrefs = progresGroup.items.map((i) => ("href" in i ? i.href : ""));
    expect(progresHrefs).toContain("/progres/cater");
    expect(progresHrefs).toContain("/progres/hasil-foto");
    expect(progresHrefs).not.toContain("/progres/koreksi");

    // Primary nav: Dashboard only, no Analytics
    expect(filteredPrimary.map((p) => p.href)).toEqual(["/dashboard"]);
  });

  test("3. STAFF_ADMIN_BILLING sees closing & billing tools, but NOT admin user management", () => {
    const userRoles = ["STAFF_ADMIN_BILLING"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);
    const filteredPrimary = filterPrimaryNav(primaryNav, userRoles);

    // All operational & closing groups visible
    const groupIds = filteredGroups.map((g) => g.id);
    expect(groupIds).toContain("tool-tutup-bulan");
    expect(groupIds).toContain("tools");
    expect(groupIds).toContain("sync-tutup-bulan");
    expect(groupIds).toContain("laporan");

    // In master: rute management is visible, but user and otorisasi are forbidden
    const masterGroup = filteredGroups.find((g) => g.id === "master")!;
    const masterHrefs = masterGroup.items.map((i) => ("href" in i ? i.href : ""));
    expect(masterHrefs).toContain("/master/pindah");
    expect(masterHrefs).toContain("/master/gabung");
    expect(masterHrefs).not.toContain("/master/user");
    expect(masterHrefs).not.toContain("/master/otorisasi");

    // Primary nav includes Analytics
    expect(filteredPrimary.map((p) => p.href)).toContain("/analytics");
  });

  test("4. VERIFIKATOR_1 (Supervisor) cannot access closing tools or manual billing adjustments", () => {
    const userRoles = ["VERIFIKATOR_1"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);

    const groupIds = filteredGroups.map((g) => g.id);
    // Closing and technical sync tools must be hidden
    expect(groupIds).not.toContain("tool-tutup-bulan");
    expect(groupIds).not.toContain("tools");
    expect(groupIds).not.toContain("sync-tutup-bulan");

    // Supervisor sees correction monitoring in progres
    const progresGroup = filteredGroups.find((g) => g.id === "progres")!;
    const progresHrefs = progresGroup.items.map((i) => ("href" in i ? i.href : ""));
    expect(progresHrefs).toContain("/progres/koreksi");
    expect(progresHrefs).toContain("/progres/ekstrim");

    // Pengolahan data: supervisor can verify stand mandiri, but cannot manual add
    const pengolahanGroup = filteredGroups.find((g) => g.id === "pengolahan-data")!;
    const pengolahanHrefs = pengolahanGroup.items.map((i) => ("href" in i ? i.href : ""));
    expect(pengolahanHrefs).toContain("/stand-konsumen");
    expect(pengolahanHrefs).not.toContain("/pelanggan/manual-add");
  });

  test("5. Multi-role user inherits union of authorized menus", () => {
    // User having both Field Cater and Supervisor roles
    const userRoles = ["PENCATAT", "VERIFIKATOR_1"];
    const filteredGroups = filterNavGroups(navGroups, userRoles);

    const groupIds = filteredGroups.map((g) => g.id);
    // Inherits Supervisor's Laporan group
    expect(groupIds).toContain("laporan");
    expect(groupIds).toContain("master");
    // Still excluded from Staff closing tools
    expect(groupIds).not.toContain("tool-tutup-bulan");
  });

  test("6. Search dialog respects RBAC filtering (prevents unauthorized discovery)", () => {
    // For PENCATAT: searching 'user' returns 0 results
    const pencatatGroups = filterNavGroups(navGroups, ["PENCATAT"]);
    const pencatatSearchResults = searchDocs("user", pencatatGroups);
    expect(pencatatSearchResults.length).toBe(0);

    // For SUPERADMIN: searching 'user' returns Master User
    const adminGroups = filterNavGroups(navGroups, ["SUPERADMIN"]);
    const adminSearchResults = searchDocs("user", adminGroups);
    expect(adminSearchResults.length).toBeGreaterThan(0);
    const foundUserItem = adminSearchResults
      .flatMap((g) => g.results)
      .find((r) => r.href === "/master/user");
    expect(foundUserItem).toBeDefined();
    expect(foundUserItem?.page).toBe("User");
  });
});
