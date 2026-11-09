// src/config/Navigasi.ts
//
// ============================================================================
//  KONFIGURASI MENU APLIKASI — M2C BACA METER & BILLING TIRTAWENING
// ============================================================================
// Dibaca oleh: navbar, sidebar, pencarian (Ctrl+K), breadcrumb, dan shell layout.
// Mengadopsi hierarki bervariasi Vercel Dashboard: Modul mandiri terdistribusi
// (Puncak, Tengah, Penutup Siklus, dan Footer) dipadukan dengan kelompok tematik.
// ============================================================================

import type { AppRole } from "@cater/db";

// ----------------------------------------------------------------------------
// 1. TIPE DATA
// ----------------------------------------------------------------------------

export type NavItem = {
  title: string;
  href: string;
  description: string;
  keywords?: string[];
  roles?: AppRole[];
};

export type NavFolder = {
  title: string;
  description?: string;
  keywords?: string[];
  children: NavNode[];
  roles?: AppRole[];
};

export type NavNode = NavItem | NavFolder;

export type NavGroup = {
  id: string;
  title: string;
  items: NavNode[];
  roles?: AppRole[];
};

export type NavEntry = {
  group: NavGroup;
  item: NavItem;
  trail: NavFolder[];
};

export function isNavFolder(node: NavNode): node is NavFolder {
  return "children" in node;
}

// ----------------------------------------------------------------------------
// 2. MODUL MANDIRI TERDISTRIBUSI (BERVARIATIF ALA VERCEL DASHBOARD)
// ----------------------------------------------------------------------------

// A. Bagian Puncak: Observasi, Metrik & Visualisasi Spasial
export const standaloneTopNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Pusat komando dan ringkasan metrik utama operasional harian.",
    keywords: ["dashboard", "beranda", "ringkasan", "home"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
      "PELAKSANA",
      "USER",
    ],
  },
  {
    title: "Analitik",
    href: "/analytics",
    description: "Analitik tren kubikasi air, histori pendapatan, dan performa petugas.",
    keywords: ["analytics", "analitik", "grafik", "statistik", "tren"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
  },
  {
    title: "Peta Spasial",
    href: "/places",
    description: "Peta GIS persebaran titik koordinat water meter dan geofence pembacaan.",
    keywords: ["peta", "gis", "spasial", "gps", "radius", "geofence", "map"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
  },
];

// B. Bagian Tengah: Pusat Data Pelanggan (Jembatan Operasional & Finansial)
export const standaloneMidNav: NavItem[] = [
  {
    title: "Data Pelanggan",
    href: "/pelanggan",
    description: "Direktori lengkap 22.549 pelanggan, status sambungan, golongan tarif, dan lokasi.",
    keywords: ["pelanggan", "direktori", "sambungan", "tarif", "data pelanggan"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
    ],
  },
  {
    title: "Info Pelanggan",
    href: "/info-pelanggan",
    description: "Data pelanggan, sambungan, stand meter, riwayat kubikasi, dan foto lapangan.",
    keywords: ["info pelanggan", "pelanggan", "info", "data pelanggan", "profil"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
      "PELAKSANA",
      "USER",
    ],
  },
];

// C. Bagian Penutup Siklus: Milestone Closing Periode
export const standaloneClosingNav: NavItem[] = [
  {
    title: "Closing Periode",
    href: "/tools-tutup/monitoring-tutup-bulan",
    description: "Konsol tutup buku bulanan, penguncian billing, dan monitoring 12 tahapan penagihan.",
    keywords: ["tutup bulan", "closing", "drd", "locking", "tagihan", "unbilled", "closing periode"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_3",
    ],
  },
];

// D. Bagian Paling Bawah (Footer): Pengaturan & Preferensi Sistem
export const standaloneBottomNav: NavItem[] = [
  {
    title: "Pengaturan",
    href: "/pengaturan",
    description: "Preferensi sistem, profil operator, toleransi geofence, dan konfigurasi tema.",
    keywords: ["pengaturan", "setting", "konfigurasi", "profil", "preferensi"],
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
  },
];

// Gabungan seluruh modul mandiri untuk kompatibilitas RBAC & pencarian
export const primaryNav: NavItem[] = [
  ...standaloneTopNav,
  ...standaloneMidNav,
  ...standaloneClosingNav,
  ...standaloneBottomNav,
];

// ----------------------------------------------------------------------------
// 3. DATA GRUP MENU (Kelompok Tematik Ramping & Relevan)
// ----------------------------------------------------------------------------

export const navGroups: NavGroup[] = [
  {
    id: "monitoring",
    title: "Operasional & Monitoring",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
    items: [
      {
        title: "Progres Cater",
        href: "/progres/cater",
        description: "Realisasi harian 9 petugas cater, rute DPM, dan status pembacaan meter.",
        keywords: ["progres", "cater", "harian", "capaian", "petugas", "monitoring"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Progres Wilayah",
        href: "/progres/wilayah",
        description: "Persentase pembacaan meter per kelurahan dan zona distribusi.",
        keywords: ["wilayah", "kelurahan", "zona", "persentase", "capaian"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Anomali Kubikasi",
        href: "/progres/ekstrim",
        description: "Deteksi lonjakan ekstrem, pemakaian turun, dan stand 0 m³.",
        keywords: ["ekstrim", "anomali", "lonjakan", "stand nol", "pemakaian turun", "kubikasi"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Cek Foto",
        href: "/meter/cek-foto",
        description: "Galeri foto angka meter dan rumah pelanggan dari petugas lapangan.",
        keywords: ["foto", "audit foto", "water meter", "bukti", "angka meter", "cek foto"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Pengaduan Air",
        href: "/pengaduan",
        description: "Penanganan tiket keluhan warga dari portal publik (pipa bocor, air keruh, meter rusak).",
        keywords: ["pengaduan", "aduan", "keluhan", "tiket", "komplain", "gangguan"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "PELAKSANA"],
      },
    ],
  },
  {
    id: "verifikasi",
    title: "Verifikasi & Mutasi",
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
    items: [
      {
        title: "Baca Petugas",
        href: "/verifikasi/baca-petugas",
        description: "Persetujuan berjenjang Ring 1 (Supervisor), Ring 2 (Manager), Ring 3 (Senior Manager).",
        keywords: ["verifikasi", "baca petugas", "ring 1", "ring 2", "ring 3", "approval"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Lapor Mandiri",
        href: "/verifikasi/baca-pelanggan",
        description: "Verifikasi angka stand dan foto meter kiriman warga dari portal publik.",
        keywords: ["verifikasi mandiri", "lapor meter", "warga", "mandiri", "publik", "pelanggan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Koreksi Stand",
        href: "/progres/koreksi",
        description: "Penyesuaian angka stand dan koreksi kubikasi dengan audit trail resmi.",
        keywords: ["koreksi", "kubikasi", "reklasifikasi", "penyesuaian", "audit trail", "koreksi stand"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Manual Add",
        href: "/pelanggan/manual-add",
        description: "Input stand meter darurat untuk pelanggan rumah terkunci atau terhalang.",
        keywords: ["manual", "add", "rumah terkunci", "darurat", "stand manual", "manual add"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Ganti Water Meter",
        href: "/cater/ganti-meter",
        description: "Pencatatan meter ganti baru, stand angkat meter lama, dan stand pasang.",
        keywords: ["gwm", "ganti meter", "stand angkat", "stand pasang", "meter rusak"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2"],
      },
    ],
  },
  {
    id: "laporan",
    title: "Billing & Laporan",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
    items: [
      {
        title: "Laporan DRD",
        href: "/laporan/lap-drd",
        description: "Rekap Daftar Rekening Ditagih resmi per golongan tarif dan wilayah kelurahan.",
        keywords: ["drd", "laporan drd", "rekening", "ditagih", "rekapitulasi"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Cek Selisih",
        href: "/tools-tutup/cek-selisih-pelanggan",
        description: "Deteksi pelanggan belum terbaca atau belum terbit rekening sebelum closing.",
        keywords: ["rekonsiliasi", "unbilled", "selisih", "audit", "cek unbilled", "cek selisih"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_3"],
      },
      {
        title: "PBPK (Pasang Baru & PK)",
        href: "/tools-tutup/pbpk",
        description: "Pendaftaran sambungan baru (PB) dan mutasi golongan tarif (PK) untuk periode berikutnya.",
        keywords: ["pbpk", "pasang baru", "mutasi tarif", "perubahan kategori", "sl baru"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_3"],
      },
      {
        title: "Rekap Koreksi",
        href: "/laporan/monitoring-kubikasi-koreksi",
        description: "Audit perubahan kubikasi pasca koreksi dan estimasi dampak rupiah penagihan.",
        keywords: ["kubikasi", "koreksi", "audit koreksi", "finansial", "rekap koreksi"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Kelainan Meter",
        href: "/laporan/lap-kelainan-meter",
        description: "Rekap 17 jenis kelainan fisik water meter (kaca buram, macet, tertimbun).",
        keywords: ["kelainan", "meter rusak", "kaca buram", "jarum macet", "anomali fisik", "kelainan meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2"],
      },
      {
        title: "Kinerja Petugas",
        href: "/laporan/evaluasi",
        description: "Evaluasi produktivitas, ketepatan waktu, dan akurasi 9 petugas cater.",
        keywords: ["evaluasi", "produktivitas", "kpi", "kinerja", "petugas", "kinerja petugas"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      },
      {
        title: "Stand Awal & Akhir",
        href: "/laporan/stand-awal-akhir",
        description: "Rekap komparasi stand meter awal terhadap stand meter akhir periode.",
        keywords: ["stand awal", "stand akhir", "komparasi", "rekap stand"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2"],
      },
    ],
  },
  {
    id: "master",
    title: "Master Data",
    roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
    items: [
      {
        title: "Petugas Cater",
        href: "/master/petugas",
        description: "Data profil, kontak, dan penugasan 9 petugas pencatat meter lapangan.",
        keywords: ["master petugas", "cater", "pencatat", "profil petugas", "petugas cater"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pemetaan Rute",
        href: "/master/pemetaan-petugas",
        description: "Alokasi rute dan buku Daftar Pembacaan Meter (DPM) ke petugas cater.",
        keywords: ["pemetaan", "rute", "dpm", "wilayah", "penugasan", "pemetaan rute"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Urutan Rute",
        href: "/master/urut",
        description: "Pengaturan urutan langkah gang/jalan pembacaan pelanggan agar rute efisien.",
        keywords: ["sekuensial", "urutan", "langkah", "rute jalan", "optimasi", "urutan rute"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Kode Kelainan",
        href: "/master/kelainan",
        description: "Master 17 kode jenis kelainan fisik water meter dan tindakan lapangan.",
        keywords: ["kelainan", "kode kelainan", "standar", "master kelainan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Manajemen User",
        href: "/master/user",
        description: "Manajemen akun operator, supervisor, verifikator, dan administrator.",
        keywords: ["user", "pengguna", "akun", "login", "manajemen user"],
        roles: ["SUPERADMIN"],
      },
      {
        title: "Hak Akses",
        href: "/master/otorisasi",
        description: "Matriks perizinan modul dan ring approval verifikasi berdasarkan role (RBAC).",
        keywords: ["otorisasi", "rbac", "hak akses", "role", "permission"],
        roles: ["SUPERADMIN"],
      },
    ],
  },
];

// Helper kelompok terpisah
export const operasionalGroupIds = ["monitoring", "verifikasi"];
export const billingMasterGroupIds = ["laporan", "master"];

// ----------------------------------------------------------------------------
// 4. DATA TURUNAN (Index Datar & Pencarian)
// ----------------------------------------------------------------------------

function collectEntries(
  group: NavGroup,
  nodes: readonly NavNode[],
  trail: NavFolder[],
  out: NavEntry[],
): void {
  for (const node of nodes) {
    if (isNavFolder(node)) {
      collectEntries(group, node.children, [...trail, node], out);
    } else {
      out.push({ group, item: node, trail });
    }
  }
}

function buildNavIndex(groups: readonly NavGroup[]): NavEntry[] {
  const out: NavEntry[] = [];
  // 1. Indeks kelompok tematik
  for (const group of groups) collectEntries(group, group.items, [], out);

  // 2. Indeks modul mandiri (Primary Nav) dengan virtual group "primary"
  const primaryGroup: NavGroup = {
    id: "primary",
    title: "Menu Utama",
    items: primaryNav,
  };
  collectEntries(primaryGroup, primaryNav, [], out);

  return out;
}

export const navIndex: NavEntry[] = buildNavIndex(navGroups);
export const allNavItems: NavItem[] = navIndex.map((entry) => entry.item);

// ----------------------------------------------------------------------------
// 5. FUNGSI PENCARIAN & NAVIGASI
// ----------------------------------------------------------------------------

export function flattenNavItems(
  nodes: readonly (NavNode | NavGroup)[],
): NavItem[] {
  return nodes.flatMap((node): NavItem[] => {
    if ("items" in node) return flattenNavItems(node.items);
    if (isNavFolder(node)) return flattenNavItems(node.children);
    return [node];
  });
}

export function findNavItem(href: string): NavEntry | undefined {
  return navIndex.find((entry) => entry.item.href === href);
}

export function findActiveNav(pathname: string): NavEntry | undefined {
  let best: NavEntry | undefined;

  for (const entry of navIndex) {
    const { href } = entry.item;
    const isMatch = pathname === href || pathname.startsWith(`${href}/`);
    if (isMatch && (!best || href.length > best.item.href.length)) {
      best = entry;
    }
  }

  return best;
}

export function getNavGroupHref(group: NavGroup): string {
  return flattenNavItems(group.items)[0]?.href ?? "/";
}

export function findDuplicateHrefs(): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const { item } of navIndex) {
    if (seen.has(item.href)) duplicates.add(item.href);
    seen.add(item.href);
  }
  return Array.from(duplicates);
}

// ----------------------------------------------------------------------------
// 6. RBAC FILTERING LOGIC
// ----------------------------------------------------------------------------

export function isNodeAllowed(
  node: NavNode | NavGroup,
  userRoles: readonly string[],
): boolean {
  if (userRoles.includes("SUPERADMIN")) return true;
  if (!node.roles || node.roles.length === 0) return true;
  return node.roles.some((role) => userRoles.includes(role));
}

export function filterNavGroups(
  groups: readonly NavGroup[],
  userRoles: readonly string[],
): NavGroup[] {
  if (userRoles.includes("SUPERADMIN")) return [...groups];

  return groups
    .filter((group) => isNodeAllowed(group, userRoles))
    .map((group) => {
      const filteredItems = filterNavNodes(group.items, userRoles);
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
}

function filterNavNodes(
  nodes: readonly NavNode[],
  userRoles: readonly string[],
): NavNode[] {
  return nodes
    .filter((node) => isNodeAllowed(node, userRoles))
    .map((node) => {
      if (isNavFolder(node)) {
        const filteredChildren = filterNavNodes(node.children, userRoles);
        return { ...node, children: filteredChildren };
      }
      return node;
    })
    .filter((node) => !isNavFolder(node) || node.children.length > 0);
}

export function filterPrimaryNav(
  items: readonly NavItem[],
  userRoles: readonly string[],
): NavItem[] {
  return items.filter((item) => isNodeAllowed(item, userRoles));
}

// ----------------------------------------------------------------------------
// 7. NAVBAR & LINK EXTERNAL
// ----------------------------------------------------------------------------

export const navbarLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Progres Cater", href: "/progres/cater" },
  { label: "Baca Petugas", href: "/verifikasi/baca-petugas" },
  { label: "Peta Spasial", href: "/places" },
  { label: "Laporan DRD", href: "/laporan/lap-drd" },
];

export const mobileMenuLinks = [
  ...navbarLinks.map((link) => ({ name: link.label, href: link.href })),
];

export const versions = ["v2.4 Enterprise"];
