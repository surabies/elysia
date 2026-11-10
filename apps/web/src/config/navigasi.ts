// src/config/navigasi.ts
//
// ============================================================================
//  KONFIGURASI MENU APLIKASI — M2C BACA METER & BILLING TIRTAWENING
// ============================================================================
// Dibaca oleh: navbar, sidebar, pencarian (Ctrl+K), breadcrumb, dan shell layout.
// Disusun berdasarkan docs/SIDEBAR_REFERENCE.md (Aurora Parity) dengan prinsip:
// 1. ZERO DUPLICATES: Setiap href & fungsi bisnis hanya muncul di satu tempat.
// 2. RINGKAS & PRESISI: Label 2-3 kata yang jelas dan langsung ke tujuan.
// 3. SEPARATOR & SUB-FOLDER: Memisahkan modul utama dari utilitas pendukung.
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
// 2. MODUL MANDIRI (ROOT SIDEBAR — ZERO DUPLICATES DENGAN GRUP)
// ----------------------------------------------------------------------------

// A. Puncak: Observasi Eksekutif & Spasial (Aurora Bab 1 & Bab 4)
export const standaloneTopNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Ringkasan eksekutif metrik operasional pembacaan meter harian.",
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
    description:
      "Tren kubikasi air, distribusi pemakaian, dan analitik performa petugas.",
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
    description:
      "Visualisasi GIS titik koordinat pelanggan, rute baca, dan geofence.",
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

// B. Tengah: Pencarian Detail Pelanggan (Aurora Bab 3.2)
export const standaloneMidNav: NavItem[] = [
  {
    title: "Info Pelanggan",
    href: "/info-pelanggan",
    description:
      "Pencarian detail pelanggan, sambungan, stand meter, histori 12 bulan, dan foto.",
    keywords: [
      "info pelanggan",
      "pelanggan",
      "cari pelanggan",
      "histori",
      "profil",
    ],
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

// C. Bawah: Pengaturan Sistem
export const standaloneBottomNav: NavItem[] = [
  {
    title: "Pengaturan",
    href: "/pengaturan",
    description:
      "Preferensi sistem, profil operator, jendela lapor mandiri, dan geofence.",
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

// Kompatibilitas export
export const standaloneClosingNav: NavItem[] = [];

export const primaryNav: NavItem[] = [
  ...standaloneTopNav,
  ...standaloneMidNav,
  ...standaloneBottomNav,
];

// ----------------------------------------------------------------------------
// 3. DATA GRUP MENU (5 Kelompok Inti Aurora — Ramping, Tepat, Tanpa Duplikat)
// ----------------------------------------------------------------------------

export const navGroups: NavGroup[] = [
  // ==========================================================================
  // GRUP 1: MONITORING & PROGRES (Aurora Bab 5 + Monitoring Baca Meter)
  // ==========================================================================
  {
    id: "monitoring",
    title: "Monitoring & Progres",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
      "PELAKSANA",
    ],
    items: [
      {
        title: "Monitoring Baca Meter",
        href: "/cater",
        description:
          "Ringkasan baca meter CHN, beban rute, produktivitas petugas, dan bacaan ditinjau.",
        keywords: ["monitoring baca meter", "cater", "beban rute", "chn"],
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
        title: "Simulasi Baca Meter",
        href: "/cater/simulasi",
        description:
          "Simulator pengiriman bacaan meter mobile lapangan dan uji verifikasi.",
        keywords: ["simulasi", "simulator", "baca meter", "mobile", "uji"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PENCATAT",
        ],
      },
      {
        title: "Progres Petugas",
        href: "/progres/cater",
        description:
          "Realisasi harian petugas pencatat meter, target DPM, dan status kerja lapangan.",
        keywords: ["progres", "cater", "harian", "capaian", "petugas"],
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
        title: "Progres Wilayah",
        href: "/progres/wilayah",
        description:
          "Persentase penyelesaian pembacaan meter per kelurahan dan zona distribusi.",
        keywords: ["wilayah", "kelurahan", "zona", "persentase", "capaian"],
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
        title: "Anomali Kubikasi",
        href: "/progres/ekstrim",
        description:
          "Deteksi lonjakan pemakaian ekstrem, penurunan drastis, dan stand 0 m³.",
        keywords: ["ekstrim", "anomali", "lonjakan", "stand nol", "turun"],
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
        title: "Cek Foto",
        href: "/meter/cek-foto",
        description:
          "Validasi visual foto bukti angka meter dan rumah pelanggan dari lapangan.",
        keywords: ["foto", "audit foto", "water meter", "bukti", "cek foto"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Pengaduan Air",
        href: "/pengaduan",
        description:
          "Penanganan tiket keluhan warga (pipa bocor, air keruh, meter rusak).",
        keywords: ["pengaduan", "aduan", "keluhan", "tiket", "gangguan"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "PELAKSANA",
        ],
      },
    ],
  },

  // ==========================================================================
  // GRUP 2: PENGOLAHAN & VERIFIKASI (Aurora Bab 3)
  // ==========================================================================
  {
    id: "verifikasi",
    title: "Pengolahan & Verifikasi",
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
    items: [
      {
        title: "Baca Petugas (CHN)",
        href: "/verifikasi/baca-petugas",
        description:
          "Verifikasi berjenjang Ring 1 (SPV), Ring 2 (MGR), Ring 3 (DIR) atas bacaan petugas.",
        keywords: ["verifikasi", "baca petugas", "chn", "ring 1", "ring 2", "ring 3"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lapor Mandiri",
        href: "/verifikasi/baca-pelanggan",
        description:
          "Validasi angka stand dan foto meter mandiri kiriman pelanggan.",
        keywords: ["verifikasi mandiri", "lapor meter", "warga", "mandiri"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Koreksi Stand",
        href: "/progres/koreksi",
        description:
          "Penyesuaian angka stand dan koreksi kubikasi dengan audit trail.",
        keywords: ["koreksi", "kubikasi", "penyesuaian", "audit trail"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Manual ADD & Taksasi",
        href: "/pelanggan/manual-add",
        description:
          "Input stand manual satuan maupun taksasi massal untuk rumah terkunci/terhalang.",
        keywords: ["manual add", "taksasi", "massal", "rumah terkunci", "stand manual"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Ganti Water Meter",
        href: "/cater/ganti-meter",
        description:
          "Pencatatan pergantian meter air (GWM), stand angkat lama, dan stand pasang.",
        keywords: ["gwm", "ganti meter", "stand angkat", "stand pasang"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
      {
        title: "Mutasi & Kalkulasi",
        children: [
          {
            title: "Hitung Rata-Rata",
            href: "/meter/hitung-rata-rata",
            description:
              "Kalkulasi rata-rata pemakaian air 3 bulan terakhir (pending).",
            keywords: ["hitung rata-rata", "rata-rata", "taksiran"],
          },
          {
            title: "Mutasi Pelanggan",
            href: "/pelanggan/mutasi",
            description:
              "Pembaruan status administrasi dan mutasi pelanggan (pending).",
            keywords: ["mutasi", "perubahan", "pelanggan"],
          },
          {
            title: "Pindah Jenis Tarif",
            href: "/pelanggan/jenis",
            description:
              "Modifikasi kategori golongan tarif pelanggan (pending).",
            keywords: ["pindah jenis", "tarif", "golongan"],
          },
          {
            title: "No HP Pelanggan",
            href: "/pelanggan/no-hp",
            description:
              "Pembaruan nomor telepon/WhatsApp pelanggan (pending).",
            keywords: ["no hp", "whatsapp", "telepon"],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // GRUP 3: TUTUP BULAN / CLOSING (Aurora Bab 7 — 6 Halaman Terpisah)
  // ==========================================================================
  {
    id: "tutup-bulan",
    title: "Tutup Bulan (Closing)",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_3",
    ],
    items: [
      {
        title: "Konsol Tutup Bulan",
        href: "/tools-tutup/monitoring-tutup-bulan",
        description:
          "Wizard 5 langkah dan matriks 12 tahapan eksekusi tutup buku bulanan.",
        keywords: ["konsol tutup bulan", "closing periode", "monitoring tutup bulan"],
      },
      {
        title: "Stand Angkat",
        href: "/tools-tutup/stand-angkat",
        description:
          "Persetujuan stand angkat meter lama dan stand pasang meter baru sebelum closing.",
        keywords: ["stand angkat", "pergantian meter", "tutup bulan"],
      },
      {
        title: "Perbandingan Tagihan",
        href: "/tools-tutup/create-perbandingan",
        description:
          "Komparasi jumlah pelanggan, kubikasi (m³), dan omzet antar periode.",
        keywords: ["perbandingan tagihan", "create perbandingan", "omzet"],
      },
      {
        title: "Cek Selisih Pelanggan",
        href: "/tools-tutup/cek-selisih-pelanggan",
        description:
          "Audit rekonsiliasi 4 pilar: Master Pelanggan, DPM, Bacaan, dan Rekening DRD.",
        keywords: ["cek selisih", "rekonsiliasi", "unbilled", "selisih pelanggan"],
      },
      {
        title: "PBPK (Pasang Baru & PK)",
        href: "/tools-tutup/pbpk",
        description:
          "Finalisasi sambungan baru (PB) dan perubahan kategori golongan tarif (PK).",
        keywords: ["pbpk", "pasang baru", "perubahan kategori", "mutasi tarif"],
      },
      {
        title: "Panduan 12 Modul",
        href: "/tools-tutup/panduan",
        description:
          "Skema alur kerja 4 fase, rumus tarif progresif 4 blok, dan panduan closing.",
        keywords: ["panduan closing", "skema tutup buku", "bantuan closing"],
      },
      {
        title: "Pintasan Tahapan",
        children: [
          {
            title: "Upload Master Pelanggan",
            href: "/tools-tutup/upload-master-pelanggan",
            description: "Langkah 1: Validasi database induk master pelanggan.",
            keywords: ["upload master pelanggan", "langkah 1"],
          },
          {
            title: "Update Zonasi",
            href: "/tools-tutup/update-zonasi",
            description: "Langkah 1: Pembaruan struktur zonasi wilayah dan rute.",
            keywords: ["update zonasi", "langkah 1"],
          },
          {
            title: "Posting Datameter",
            href: "/tools-tutup/posting-datameter",
            description: "Langkah 2: Publikasi bacaan meter terverifikasi ke billing.",
            keywords: ["posting datameter", "langkah 2"],
          },
          {
            title: "Create Closed DRD",
            href: "/tools-tutup/create-closed-drd",
            description: "Langkah 4: Penerbitan DRD terkunci (LOCKED_BILLING).",
            keywords: ["create closed drd", "langkah 4"],
          },
          {
            title: "Create Bulan Baru",
            href: "/tools-tutup/create-bulan-baru",
            description: "Langkah 5: Inisialisasi periode baca bulan berikutnya.",
            keywords: ["create bulan baru", "langkah 5"],
          },
          {
            title: "Sync Pelanggan Baru",
            href: "/tools-tutup/sync-pelanggan-baru",
            description: "Langkah 5: Sinkronisasi pelanggan baru ke rute DPM.",
            keywords: ["sync pelanggan baru", "langkah 5"],
          },
          {
            title: "Update Data Pelanggan",
            href: "/tools-tutup/update-data-pelanggan",
            description: "Langkah 5: Pembaruan massal urutan rute pelanggan.",
            keywords: ["update data pelanggan", "langkah 5"],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // GRUP 4: LAPORAN & AUDIT (Aurora Bab 6)
  // ==========================================================================
  {
    id: "laporan",
    title: "Laporan & Audit",
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
        description:
          "Rekapitulasi Daftar Rekening Ditagih resmi per golongan tarif dan wilayah.",
        keywords: ["drd", "laporan drd", "rekening", "ditagih"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Kubikasi Koreksi",
        href: "/laporan/monitoring-kubikasi-koreksi",
        description:
          "Laporan audit perubahan kubikasi pasca koreksi dan dampak finansial.",
        keywords: ["kubikasi", "koreksi", "audit koreksi", "rekap koreksi"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Kelainan Meter",
        href: "/laporan/lap-kelainan-meter",
        description:
          "Laporan rekapitulasi 17 jenis kelainan fisik water meter.",
        keywords: ["kelainan meter", "meter rusak", "kaca buram", "macet"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
      {
        title: "Evaluasi Petugas",
        href: "/laporan/evaluasi",
        description:
          "Laporan evaluasi kinerja, produktivitas, dan akurasi petugas cater.",
        keywords: ["evaluasi", "produktivitas", "kpi", "kinerja petugas"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Stand Awal & Akhir",
        href: "/laporan/stand-awal-akhir",
        description:
          "Laporan komparasi angka stand meter awal terhadap stand meter akhir.",
        keywords: ["stand awal", "stand akhir", "komparasi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
      {
        title: "Arsip Laporan",
        children: [
          {
            title: "Lap. Periode Cater",
            href: "/laporan/lap-periode",
            description: "Laporan jadwal dan periode pembacaan cater (pending).",
            keywords: ["lap periode", "periode cater"],
          },
          {
            title: "Lap. Data Meter",
            href: "/laporan/lap-data-meter",
            description: "Laporan nomor seri dan spesifikasi meter air (pending).",
            keywords: ["lap data meter", "spesifikasi meter"],
          },
          {
            title: "Lap. Selisih Hari",
            href: "/laporan/selisih-hari",
            description: "Laporan deviasi rentang hari baca antar periode (pending).",
            keywords: ["selisih hari", "rentang baca"],
          },
          {
            title: "Lap. Mutasi Pelanggan",
            href: "/laporan/lap-mutasi-pel",
            description: "Laporan perubahan data induk pelanggan (pending).",
            keywords: ["lap mutasi pel", "mutasi pelanggan"],
          },
          {
            title: "Lap. Perubahan Pel",
            href: "/laporan/perubahan-pelanggan",
            description: "Log audit perubahan atribut pelanggan (pending).",
            keywords: ["perubahan pelanggan", "audit pelanggan"],
          },
          {
            title: "Lap. Pelanggan",
            href: "/laporan/pelanggan",
            description: "Direktori rekapitulasi pelanggan per wilayah (pending).",
            keywords: ["lap pelanggan", "rekap pelanggan"],
          },
          {
            title: "Lap. History",
            href: "/laporan/history",
            description: "Rekapitulasi histori pembacaan jangka panjang (pending).",
            keywords: ["lap history", "riwayat pembacaan"],
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // GRUP 5: MASTER & INTEGRASI (Aurora Bab 2, Bab 8 & Bab 9)
  // ==========================================================================
  {
    id: "master",
    title: "Master & Integrasi",
    roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
    items: [
      {
        title: "Petugas Cater",
        href: "/master/petugas",
        description:
          "Manajemen data profil, kontak, dan penugasan petugas pencatat lapangan.",
        keywords: ["master petugas", "cater", "pencatat", "petugas cater"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pemetaan Petugas",
        href: "/master/pemetaan-petugas",
        description:
          "Penugasan area dan buku Daftar Pembacaan Meter (DPM) per petugas.",
        keywords: ["pemetaan", "rute", "dpm", "wilayah", "penugasan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Urutan Rute",
        href: "/master/urut",
        description:
          "Pengaturan urutan sekuensial rute jalan/gang pelanggan.",
        keywords: ["sekuensial", "urutan", "langkah", "urutan rute"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Kode Kelainan",
        href: "/master/kelainan",
        description:
          "Master 17 kode jenis kelainan fisik water meter dan tindakan lapangan.",
        keywords: ["kelainan", "kode kelainan", "master kelainan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Manajemen User",
        href: "/master/user",
        description:
          "Manajemen akun pengguna aplikasi (CRUD user, role, dan status aktif).",
        keywords: ["user", "pengguna", "akun", "manajemen user"],
        roles: ["SUPERADMIN"],
      },
      {
        title: "Otorisasi Menu",
        href: "/master/otorisasi",
        description:
          "Matriks hak akses (RBAC) per level pengguna dan ring verifikasi.",
        keywords: ["otorisasi", "rbac", "hak akses", "role"],
        roles: ["SUPERADMIN"],
      },
      {
        title: "Utilitas Rute",
        children: [
          {
            title: "Gabung Rute",
            href: "/master/gabung",
            description:
              "Menggabungkan beberapa rute kecil menjadi satu penugasan (pending).",
            keywords: ["gabung rute", "penggabungan rute"],
          },
          {
            title: "Pindah Rute",
            href: "/master/pindah",
            description:
              "Memindahkan pelanggan dari satu rute ke rute petugas lain (pending).",
            keywords: ["pindah rute", "mutasi rute"],
          },
          {
            title: "Monitoring Pindah Rute",
            href: "/master/monitoring",
            description:
              "Memantau riwayat pemindahan rute pelanggan antar petugas (pending).",
            keywords: ["monitoring pindah rute", "log rute"],
          },
        ],
      },
      {
        title: "Sync Mobile (Android)",
        children: [
          {
            title: "Sync (1) Kirim Mutasi",
            href: "/sync/sync-mutasi",
            description:
              "Mengirim data terbaru mutasi pelanggan ke perangkat petugas (pending).",
            keywords: ["sync mutasi", "kirim mutasi"],
          },
          {
            title: "Sync (2) Kirim Datameter",
            href: "/sync/sync-datameter",
            description:
              "Mengirim daftar rute dan target bacaan ke perangkat petugas (pending).",
            keywords: ["sync datameter", "kirim datameter"],
          },
          {
            title: "Sync (3) Import STI",
            href: "/sync/sync-sti",
            description:
              "Menarik hasil bacaan lapangan (Stand, Foto, GPS) ke server (pending).",
            keywords: ["sync sti", "import sti"],
          },
          {
            title: "Sync (4) Bulan Baru",
            href: "/sync/sync-bulan-baru",
            description:
              "Sinkronisasi perpindahan siklus ke bulan operasional baru (pending).",
            keywords: ["sync bulan baru"],
          },
        ],
      },
      {
        title: "Tools & Impor Batch",
        children: [
          {
            title: "Running Text",
            href: "/tools/running-text",
            description:
              "Pengaturan teks pengumuman berjalan di aplikasi mobile petugas (pending).",
            keywords: ["running text", "pengumuman"],
          },
          {
            title: "Import Stand Angkat",
            href: "/tools/import-stand",
            description:
              "Impor data stand angka pengangkatan/penggantian meter (pending).",
            keywords: ["import stand angkat"],
          },
          {
            title: "Import PB-PK",
            href: "/tools/import-pbpk",
            description:
              "Impor data mutasi pasang baru dan perubahan kategori (pending).",
            keywords: ["import pbpk"],
          },
          {
            title: "Import Data GWM",
            href: "/tools/import-data",
            description:
              "Impor data pembacaan Grand Water Meter / Master Meter (pending).",
            keywords: ["import data gwm"],
          },
          {
            title: "Import Foto GWM",
            href: "/tools/import-photo",
            description:
              "Pemulihan cadangan foto Grand Water Meter (pending).",
            keywords: ["import photo", "foto gwm"],
          },
          {
            title: "Import Data SPT",
            href: "/tools/import-spt",
            description:
              "Impor data Surat Perintah Tugas / rute lapangan (pending).",
            keywords: ["import spt"],
          },
          {
            title: "Import Data Anomali",
            href: "/tools/import-anomali",
            description:
              "Impor data penandaan anomali dari sistem eksternal (pending).",
            keywords: ["import anomali"],
          },
          {
            title: "Import Backup",
            href: "/tools/import-backup",
            description:
              "Pemulihan file cadangan data dan foto pembacaan (pending).",
            keywords: ["import backup"],
          },
          {
            title: "Import Tutup Bulan",
            href: "/tools/import-tutup",
            description:
              "Impor file hasil penutupan buku/bulan (pending).",
            keywords: ["import tutup"],
          },
        ],
      },
    ],
  },
];

// Helper kelompok terpisah untuk SidebarNav
export const operasionalGroupIds = ["monitoring", "verifikasi"];
export const billingMasterGroupIds = ["tutup-bulan", "laporan", "master"];

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
  { label: "Baca Meter", href: "/cater" },
  { label: "Simulasi", href: "/cater/simulasi" },
  { label: "Verifikasi", href: "/verifikasi/baca-petugas" },
  { label: "Peta Spasial", href: "/places" },
  { label: "Tutup Bulan", href: "/tools-tutup/monitoring-tutup-bulan" },
];

export const mobileMenuLinks = [
  ...navbarLinks.map((link) => ({ name: link.label, href: link.href })),
];

export const versions = ["v2.4 Enterprise"];
