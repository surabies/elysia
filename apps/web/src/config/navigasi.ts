// src/config/navigasi.ts
// ============================================================================
//  KONFIGURASI MENU APLIKASI — M2C BACA METER & BILLING TIRTAWENING
// ============================================================================
// Disusun berdasarkan audit 3 Pilar Inti PDAM + Ikhtisar & Pengaturan (Vercel Style):
// 1. IKHTISAR (Dashboard, Analitik, KPI, Peta Spasial, Peta Wilayah)
// 2. PENCATATAN METER (Monitoring, Simulasi, Verifikasi CHN, Foto Meter, Radar Anomali, Rute)
// 3. TAGIHAN (Laporan DRD, Koreksi Stand, Manual ADD, Tutup Bulan, PBPK)
// 4. LANGGANAN (Info Pelanggan, Lapor Mandiri, Pengaduan, Mutasi, Tarif, Kontak)
// 5. SETTING LANDING (Profil & Kontak, Pasang Baru, Cara Bayar, Tarif Air, Berita, Siaran)
// 6. PENGATURAN (Profil Akun, Catat Meter, Verifikasi, Billing, Pengaduan, Sistem, Pengguna, RBAC)
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
// 2. DATA GRUP MENU UTAMA (Ringkas, Fungsional & Flat Vercel Style)
// ----------------------------------------------------------------------------

export const navGroups: NavGroup[] = [
  // ==========================================================================
  // SEKSI 1: IKHTISAR
  // ==========================================================================
  {
    id: "ikhtisar",
    title: "Ikhtisar",
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
        ],
      },
      {
        title: "Analitik",
        href: "/analytics",
        description: "Tren kubikasi air, distribusi pemakaian, dan performa.",
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
        title: "Scorecard KPI",
        href: "/kpi",
        description: "Target kinerja tahunan, metrik finansial, dan retensi tim.",
        keywords: ["kpi", "scorecard", "strategy", "goals", "target", "kinerja"],
        roles: ["SUPERADMIN", "EXECUTIVE"],
      },
      {
        title: "Peta Spasial",
        href: "/places",
        description: "Visualisasi GIS persebaran pelanggan dan jaringan pipa.",
        keywords: ["places", "spasial", "peta", "gis", "lokasi"],
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
        title: "Peta Wilayah",
        href: "/peta-wilayah",
        description: "Batas 7 kecamatan dan 21 kelurahan operasional wilayah pelayanan.",
        keywords: ["peta wilayah", "wilayah 5", "polygon", "kecamatan", "kelurahan"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
    ],
  },

  // ==========================================================================
  // SEKSI 2: PENCATATAN METER (Pilar 1: Pembacaan, Verifikasi Lapangan, Rute)
  // ==========================================================================
  {
    id: "pencatatan-meter",
    title: "Pencatatan Meter",
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
        title: "Monitoring Baca",
        href: "/cater",
        description: "Pantau unggahan stand meter harian dan penyelesaian lapangan.",
        keywords: ["monitoring", "baca meter", "cater", "pencatatan", "target"],
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
      },
      {
        title: "Capaian Pencatatan",
        href: "/cater/capaian",
        description: "Evaluasi target vs realisasi SL, kubikasi M³, LPS, dan tren capaian tahunan.",
        keywords: ["capaian", "target", "realisasi", "lps", "kubikasi", "tahunan"],
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
      },
      {
        title: "Simulasi Baca",
        href: "/cater/simulasi",
        description: "Uji coba pembacaan meter, validasi foto, dan deteksi deviasi.",
        keywords: ["simulasi", "sandbox", "test", "cater"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Verifikasi CHN",
        href: "/verifikasi/baca-petugas",
        description: "Verifikasi pembacaan meter CHN petugas lapangan dan approval.",
        keywords: ["verifikasi", "baca petugas", "chn", "lapangan", "approval"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Foto Meter",
        href: "/meter/cek-foto",
        description: "Audit visual galeri foto bukti fisik meteran air hasil bacaan.",
        keywords: ["cek foto", "foto meter", "bukti fisik", "kamera", "audit foto"],
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
        title: "Radar Anomali",
        href: "/progres/ekstrim",
        description: "Deteksi lonjakan pemakaian, pemakaian 0 m³, dan anomali kubikasi.",
        keywords: ["anomali", "ekstrim", "pemakaian nol", "lonjakan", "kubikasi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Audit Anomali",
        href: "/progres/audit",
        description: "Rekonsiliasi 2 pilar: anomali validasi meter vs kendala akses lapangan.",
        keywords: ["audit", "anomali", "rekonsiliasi", "kategori", "ssot", "konfirmasi"],
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
        title: "Progres Petugas",
        href: "/progres/cater",
        description: "Produktivitas harian, kecepatan baca, dan sisa target per petugas.",
        keywords: ["progres petugas", "produktivitas", "kinerja", "cater", "evaluasi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "PENCATAT",
        ],
      },
      {
        title: "Capaian Wilayah",
        href: "/progres/wilayah",
        description: "Persentase penyelesaian pembacaan meter per zona kelurahan.",
        keywords: ["progres wilayah", "capaian", "zona", "persentase"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
        ],
      },
      {
        title: "Ganti Meter",
        href: "/cater/ganti-meter",
        description: "Pencatatan penggantian water meter fisik dan stand angkat.",
        keywords: ["ganti meter", "gwm", "meter rusak", "meter macet", "stand angkat"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Kode Kelainan",
        href: "/master/kelainan",
        description: "Master 17 kode jenis kelainan fisik water meter dan tindakan.",
        keywords: ["kelainan", "kode kelainan", "meter rusak", "anomali meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pemetaan Rute",
        href: "/master/pemetaan-petugas",
        description: "Penugasan area kerja dan rute Daftar Pembacaan Meter (DPM).",
        keywords: ["pemetaan", "rute", "dpm", "penugasan petugas"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
    ],
  },

  // ==========================================================================
  // SEKSI 3: TAGIHAN (Pilar 2: Billing, Rekening Air, Koreksi & Closing Siklus)
  // ==========================================================================
  {
    id: "tagihan",
    title: "Tagihan",
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
        description: "Rekapitulasi Daftar Rekening Ditagih (DRD) dan pendapatan resmi.",
        keywords: ["drd", "laporan drd", "tagihan", "rekening air", "piutang"],
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
        title: "Koreksi Stand",
        href: "/progres/koreksi",
        description: "Koreksi angka stand meter dan penyesuaian kubikasi rekening berjalan.",
        keywords: ["koreksi", "koreksi stand", "edit stand", "revisi kubikasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Manual ADD",
        href: "/pelanggan/manual-add",
        description: "Input stand meter manual atau taksasi rata-rata untuk rumah terkunci.",
        keywords: ["manual add", "taksasi", "input manual", "meter terkunci"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Hitung Rata-Rata",
        href: "/meter/hitung-rata-rata",
        description: "Kalkulasi otomatis pemakaian air berdasarkan histori 3 bulan terakhir.",
        keywords: ["hitung rata rata", "rata 3 bulan", "kalkulasi taksasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Konsol Tutup Bulan",
        href: "/tools-tutup/monitoring-tutup-bulan",
        description: "5-step wizard konsol tutup buku bulanan dan pembukaan siklus baru.",
        keywords: ["tutup bulan", "closing", "buka bulan baru", "kunci periode"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
    ],
  },

  // ==========================================================================
  // SEKSI 4: LANGGANAN (Pilar 3: Pelanggan, Layanan Mandiri, Pengaduan)
  // ==========================================================================
  {
    id: "langganan",
    title: "Langganan",
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
        title: "Info Pelanggan",
        href: "/info-pelanggan",
        description: "Detail sambungan pipa, stand meter, dan histori rekening 12 bulan.",
        keywords: ["info pelanggan", "pelanggan", "cari pelanggan", "histori", "sambungan"],
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
      },
      {
        title: "Lapor Mandiri",
        href: "/verifikasi/baca-pelanggan",
        description: "Validasi foto dan stand pembacaan mandiri warga.",
        keywords: ["lapor mandiri", "baca pelanggan", "mandiri", "self reading", "stand konsumen"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Pengaduan Layanan",
        href: "/pengaduan",
        description: "Helpdesk terpadu keluhan pipa bocor, air keruh, dan meter mati.",
        keywords: ["pengaduan", "tiket", "keluhan", "layanan pelanggan", "bocor pipa"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PELAKSANA",
          "DIREKSI",
          "SENIOR_MANAGER",
          "MANAGER",
          "SUPERVISOR",
          "STAFF",
        ],
      },
      {
        title: "Peta Pengaduan",
        href: "/peta-pengaduan",
        description: "Peta kendali dan visualisasi spasial sebaran tiket keluhan pelanggan.",
        keywords: ["peta pengaduan", "gis aduan", "sebaran keluhan", "spasial pengaduan"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PELAKSANA",
          "DIREKSI",
          "SENIOR_MANAGER",
          "MANAGER",
          "SUPERVISOR",
          "STAFF",
        ],
      },
      {
        title: "Kebijakan & SOP Pengaduan",
        href: "/pengaturan/pengaduan",
        description: "Tata kelola matriks bobot keluhan, SLA berversi, dan regulasi penanganan tiket.",
        keywords: ["kebijakan pengaduan", "sla", "sop", "regulasi tiket", "matriks bobot"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PELAKSANA",
          "DIREKSI",
          "SENIOR_MANAGER",
          "MANAGER",
          "SUPERVISOR",
          "STAFF",
        ],
      },
      {
        title: "Mutasi Pelanggan",
        href: "/pelanggan/mutasi",
        description: "Pengelolaan mutasi nama kepemilikan, alamat, dan data dinas.",
        keywords: ["mutasi pelanggan", "ubah nama", "balik nama", "administrasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Pindah Tarif",
        href: "/pelanggan/pindah-tarif",
        description: "Reklasifikasi golongan tarif langganan pelanggan.",
        keywords: ["pindah tarif", "reklasifikasi", "golongan langganan", "kategori tarif"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Validasi Kontak",
        href: "/pelanggan/no-hp",
        description: "Pembaruan nomor telepon dan WhatsApp untuk notifikasi rekening.",
        keywords: ["no hp", "kontak pelanggan", "whatsapp", "telepon"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "PENCATAT"],
      },
    ],
  },

  // ==========================================================================
  // SEKSI 5: IMPORT DATA (Pemulihan Backup HP, R-Nomor & PBPK)
  // ==========================================================================
  {
    id: "import-data",
    title: "Import Data",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PELAKSANA",
    ],
    items: [
      {
        title: "Foto Backup",
        href: "/import/foto-backup",
        description: "Pemulihan foto stand meter, segel, dan rumah dari backup HP petugas.",
        keywords: ["foto backup", "backup hp", "foto meter", "segel", "rumah", "recovery"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Import Data",
        href: "/import/data",
        description: "Import file data pencatatan stand meter pemulihan kendala jaringan.",
        keywords: ["import data", "data pencatatan", "bacaan meter", "file backup", "csv"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Lap Data Meter",
        href: "/import/lapdatameter",
        description: "Import laporan data meter bulanan (lapdatameter) PDAM ke tabel cater_baca_meter.",
        keywords: ["lapdatameter", "lap data meter", "laporan meter", "bacaan meter", "csv bulanan", "cater_baca_meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "R Nomor",
        href: "/import/r-nomor",
        description: "Input dan pembaruan data rekening pemutusan pelanggan (R Nomor).",
        keywords: ["r nomor", "pemutusan", "cabut meter", "pelanggan putus", "non aktif"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Import PBPK",
        href: "/import/pbpk",
        description: "Import CSV Pasang Baru (PB) dan Pemasangan Kembali (PK) pelanggan.",
        keywords: ["import pbpk", "pbpk", "pasang baru", "pemasangan kembali", "csv"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
    ],
  },

  // ==========================================================================
  // SEKSI 6: SETTING LANDING PAGE (Sama rata & konsisten tanpa collapse)
  // ==========================================================================
  {
    id: "setting-landing",
    title: "Setting Landing",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
    ],
    items: [
      {
        title: "Profil & Kontak",
        href: "/setting-landing/profil",
        description: "Informasi resmi perusahaan, visi misi, call center, dan kantor cabang.",
        keywords: ["profil", "kontak", "perusahaan", "kantor cabang", "landing page"],
        roles: ["SUPERADMIN", "EXECUTIVE", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Pasang Baru",
        href: "/setting-landing/pasang-baru",
        description: "Persyaratan dokumen, alur pendaftaran teknis, dan informasi RAB.",
        keywords: ["syarat pasang baru", "pasang baru", "sambungan baru"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Cara Bayar",
        href: "/setting-landing/cara-bayar",
        description: "Panduan kanal perbankan mitra, ritel modern, dan kebijakan denda.",
        keywords: ["cara bayar", "pembayaran", "rekening", "mitra"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Tarif Air",
        href: "/setting-landing/tarif-air",
        description: "Tabel tarif golongan pelanggan dan blok konsumsi progresif.",
        keywords: ["tarif air", "harga air", "golongan", "blok progresif"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Berita Portal",
        href: "/setting-landing/berita",
        description: "Publikasi rilis pers resmi, kegiatan humas, dan artikel edukasi.",
        keywords: ["berita", "pengumuman", "artikel", "rilis"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Siaran Gangguan",
        href: "/broadcast",
        description: "Pemberitahuan darurat kebocoran pipa dan banner portal publik.",
        keywords: ["broadcast", "siaran", "gangguan pipa", "banner"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
    ],
  },

  // ==========================================================================
  // SEKSI 6: PENGATURAN (Aplikasi, Sistem, Pengguna & RBAC)
  // ==========================================================================
  {
    id: "pengaturan",
    title: "Pengaturan",
    roles: [
      "SUPERADMIN",
      "EXECUTIVE",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
      "PELAKSANA",
      "DIREKSI",
      "SENIOR_MANAGER",
      "MANAGER",
      "SUPERVISOR",
      "STAFF",
    ],
    items: [
      {
        title: "Profil Akun",
        href: "/pengaturan/profil",
        description: "Identitas dinas petugas, NPP, foto profil, dan kata sandi.",
        keywords: ["profil akun", "password", "kata sandi", "operator"],
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
      },
      {
        title: "Catat Meter",
        href: "/pengaturan/cater",
        description: "Radius toleransi geofence GPS, durasi baca, dan mock GPS.",
        keywords: ["cater", "geofence", "toleransi gps", "foto meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Verifikasi & Anomali",
        href: "/pengaturan/verifikasi",
        description: "Pengaturan terpusat 12 aturan anomali SSOT, deviasi, metode taksasi, dan pemetaan TMSS.",
        keywords: ["verifikasi", "anomali", "aturan anomali", "ssot", "taksasi", "ambang deviasi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Billing & Denda",
        href: "/pengaturan/billing",
        description: "Bea administrasi rekening, biaya pemeliharaan meter, dan denda flat.",
        keywords: ["billing", "bea admin", "pemeliharaan", "denda"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pengaduan & SLA",
        href: "/pengaturan/pengaduan",
        description: "Target SLA pipa bocor, alur SPK meter, dan WhatsApp gateway.",
        keywords: ["pengaduan", "sla", "tiket", "whatsapp gateway"],
        roles: [
          "SUPERADMIN",
          "EXECUTIVE",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PELAKSANA",
          "DIREKSI",
          "SENIOR_MANAGER",
          "MANAGER",
          "SUPERVISOR",
          "STAFF",
        ],
      },
      {
        title: "Sistem & Log",
        href: "/pengaturan/sistem",
        description: "Kepadatan tabel antarmuka, suara alert anomali, dan audit log.",
        keywords: ["sistem", "audit trail", "kepadatan", "preferensi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pengguna",
        href: "/master/user",
        description: "Manajemen akun pengguna aplikasi, penetapan role, dan status aktif.",
        keywords: ["manajemen user", "pengguna", "akun", "tambah user"],
        roles: ["SUPERADMIN"],
      },
      {
        title: "Hak Akses (RBAC)",
        href: "/master/otorisasi",
        description: "Matriks perizinan hak akses per level pengguna dan approval.",
        keywords: ["otorisasi", "rbac", "hak akses", "role matriks"],
        roles: ["SUPERADMIN"],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 3. KOMPATIBILITAS EKSPOR & HELPER
// ----------------------------------------------------------------------------

export const standaloneTopNav: NavItem[] =
  (navGroups.find((g) => g.id === "ikhtisar")?.items as NavItem[]) || [];
export const standaloneMidNav: NavItem[] = [];
export const standaloneBottomNav: NavItem[] = [];
export const standaloneClosingNav: NavItem[] = [];

export const primaryNav: NavItem[] = [...standaloneTopNav];

export const operasionalGroupIds = ["pencatatan-meter"];
export const billingMasterGroupIds = ["tagihan", "langganan"];
export const settingGroupIds = ["setting-landing", "pengaturan"];
export const portalLandingGroupIds = ["setting-landing"];

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
  for (const group of groups) {
    collectEntries(group, group.items, [], out);
  }
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
  return node.roles.some((role) => userRoles.includes(role as AppRole));
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
