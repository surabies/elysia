import { describe, test, expect } from "bun:test";
import {
  navGroups,
  standaloneTopNav,
  settingGroupIds,
} from "../apps/web/src/config/navigasi";

describe("Audit Pengelompokan & Pemisahan Setting (Model Konsisten, Flat, Zero Collapse)", () => {
  test("1. Memiliki 7 seksi menu: Ikhtisar, 3 Pilar PDAM (Pencatatan Meter, Tagihan, Langganan), Import Data, Setting Landing, dan Pengaturan", () => {
    const groupIds = navGroups.map((g) => g.id);
    expect(groupIds).toEqual([
      "ikhtisar",
      "pencatatan-meter",
      "tagihan",
      "langganan",
      "import-data",
      "setting-landing",
      "pengaturan",
    ]);
  });

  test("2. Seksi 'setting-landing' memiliki 6 rute halaman mandiri tanpa menu tab dan tanpa collapse/expand", () => {
    const landingGroup = navGroups.find((g) => g.id === "setting-landing");
    expect(landingGroup).toBeDefined();

    const hrefs = landingGroup?.items.map((i) => ("href" in i ? i.href : ""));
    expect(hrefs).toEqual([
      "/setting-landing/profil",
      "/setting-landing/pasang-baru",
      "/setting-landing/cara-bayar",
      "/setting-landing/tarif-air",
      "/setting-landing/berita",
      "/broadcast",
    ]);
  });

  test("3. Seksi 'pengaturan' memuat 6 rute aplikasi + Pengguna & Hak Akses (RBAC)", () => {
    const pengaturanGroup = navGroups.find((g) => g.id === "pengaturan");
    expect(pengaturanGroup).toBeDefined();

    const hrefs = pengaturanGroup?.items.map((i) => ("href" in i ? i.href : ""));
    expect(hrefs).toEqual([
      "/pengaturan/profil",
      "/pengaturan/cater",
      "/pengaturan/verifikasi",
      "/pengaturan/billing",
      "/pengaturan/pengaduan",
      "/pengaturan/sistem",
      "/master/user",
      "/master/otorisasi",
    ]);
  });

  test("4. Siaran Gangguan (/broadcast) ada di Setting Landing dan tidak diduplikasi di top nav", () => {
    const topHrefs = standaloneTopNav.map((i) => i.href);
    expect(topHrefs).not.toContain("/broadcast");
    expect(topHrefs).toContain("/dashboard");
    expect(topHrefs).toContain("/analytics");
  });

  test("5. Pilar 1 (Pencatatan Meter) memuat 10 modul dengan nama ringkas", () => {
    const caterGroup = navGroups.find((g) => g.id === "pencatatan-meter");
    expect(caterGroup).toBeDefined();
    expect(caterGroup?.items.length).toBe(10);
    expect(caterGroup?.items[0].title).toBe("Monitoring Baca");
  });

  test("6. Pilar 2 (Tagihan) memuat 8 modul billing & closing dengan nama ringkas", () => {
    const billingGroup = navGroups.find((g) => g.id === "tagihan");
    expect(billingGroup).toBeDefined();
    expect(billingGroup?.items.length).toBe(8);
    expect(billingGroup?.items[0].title).toBe("Laporan DRD");
  });

  test("7. Pilar 3 (Langganan) memuat 6 modul pelayanan dengan nama ringkas", () => {
    const langgananGroup = navGroups.find((g) => g.id === "langganan");
    expect(langgananGroup).toBeDefined();
    expect(langgananGroup?.items.length).toBe(6);
    expect(langgananGroup?.items[0].title).toBe("Info Pelanggan");
  });
});
