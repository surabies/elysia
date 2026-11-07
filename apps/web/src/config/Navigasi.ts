// src/config/Navigasi.ts
//
// ============================================================================
//  KONFIGURASI MENU APLIKASI — satu-satunya sumber data menu
// ============================================================================
// Dibaca oleh: navbar, sidebar, pencarian (Ctrl+K), breadcrumb, dan halaman
// template <MenuPage />. Menambah / mengubah / menghapus menu CUKUP di file ini.
//
// DAFTAR ISI
//   1. Tipe data ........ bentuk struktur menu
//   2. Data menu ........ `navGroups`  <-- EDIT DI SINI untuk ubah menu
//   3. Data turunan ..... index & daftar datar (dihitung otomatis)
//   4. Fungsi pencarian . findNavItem, findActiveNav, getNavGroupHref, ...
//   5. Konstanta lain ... navbarLinks, mobileMenuLinks, versions
//
// STRUKTUR ORGANISASI (sesuai organisasi.md):
//   Kuasa Pemilik Modal (KPM) & Dewan Pengawas  <- governance eksternal, TIDAK
//                                                  ditampilkan di sidebar
//   ├── Direktorat Utama
//   ├── Direktorat Teknik
//   ├── Direktorat Pelayanan
//   └── Direktorat Umum
//
// ATURAN PENTING (supaya tidak error lagi):
//   - Jangan mendeklarasikan `navGroups` / `allNavItems` lebih dari sekali.
//   - Data turunan (bagian 3) HARUS berada SETELAH `navGroups`, karena `const`
//     tidak bisa dipakai sebelum dideklarasikan.
// ============================================================================

import type { AppRole } from "@cater/db";

// ----------------------------------------------------------------------------
// 1. TIPE DATA
// ----------------------------------------------------------------------------
// Hirarki tiga jenis node. Perbedaannya mudah dikenali dari properti kuncinya:
//
//   NavGroup   punya `items`     -> Direktorat (level paling atas, selalu `id`)
//   NavFolder  punya `children`  -> sub-menu / folder, TIDAK punya `href`.
//                                   Boleh bersarang ke folder lain.
//   NavItem    punya `href`      -> halaman nyata (daun / ujung hirarki)
//
//   NavGroup
//    └─ NavFolder | NavItem
//        └─ NavFolder | NavItem   (dst., rekursif lewat `children`)

/** Halaman menu (daun). Selalu punya `href`. */
export type NavItem = {
  title: string;
  href: string;
  description: string;
  /** Kata kunci tambahan agar halaman ditemukan di pencarian Ctrl+K. */
  keywords?: string[];
  /** Batasan role RBAC yang diizinkan mengakses menu ini. */
  roles?: AppRole[];
};

/** Sub-menu / folder. Hanya menyusun anak, tidak punya `href`. */
export type NavFolder = {
  title: string;
  description?: string;
  keywords?: string[];
  children: NavNode[];
  /** Batasan role RBAC yang diizinkan mengakses sub-folder ini. */
  roles?: AppRole[];
};

/** Anak dari sebuah grup atau folder: bisa halaman, bisa folder lagi. */
export type NavNode = NavItem | NavFolder;

/** Grup puncak = satu Direktorat. */
export type NavGroup = {
  /** Slug unik, dipakai sebagai key & anchor (mis. "teknik"). */
  id: string;
  title: string;
  items: NavNode[];
  /** Batasan role RBAC yang diizinkan mengakses grup ini. */
  roles?: AppRole[];
};

/**
 * Satu baris di index datar: sebuah halaman beserta konteksnya.
 *  - group : Direktorat tempat halaman berada
 *  - item  : halaman itu sendiri
 *  - trail : rantai folder dari atas ke bawah (kosong jika item langsung di
 *            bawah grup). Berguna untuk breadcrumb bertingkat.
 */
export type NavEntry = {
  group: NavGroup;
  item: NavItem;
  trail: NavFolder[];
};

/** Type guard: true jika node adalah folder (punya `children`). */
export function isNavFolder(node: NavNode): node is NavFolder {
  return "children" in node;
}

// ----------------------------------------------------------------------------
// 2. DATA MENU
// ----------------------------------------------------------------------------
// CARA MENAMBAH MENU
//   - Halaman baru  : tambahkan objek { title, href, description, keywords? }
//                     ke `items` (grup) atau `children` (folder) yang sesuai.
//   - Folder baru   : tambahkan objek { title, description?, keywords?,
//                     children: [...] } TANPA `href`.
//   - Direktorat    : tambahkan objek { id, title, items: [...] } baru, lalu
//                     (jika perlu) tambahkan link-nya di `navbarLinks`.
//   - Halaman yang belum dibangun: beri description "Belum ada halaman
//     (pending)." supaya mudah dicari saat tahap pengembangan.
// CATATAN: `href` sebaiknya unik di seluruh menu. Cek dengan
//   findDuplicateHrefs() (bagian 4).
//
export const navGroups: NavGroup[] = [
  {
    id: "master",
    title: "Master",
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
    ],
    items: [
      {
        title: "Kelainan",
        href: "/master/kelainan",
        description:
          "Master data kode jenis kelainan meter (meter rusak, kaca buram, rumah kosong, jarum macet).",
        keywords: ["kelainan", "anomali", "kerusakan", "meter"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Otorisasi Menu",
        href: "/master/otorisasi",
        description:
          "Pengaturan hak akses (Role-Based Access Control / RBAC) per level pengguna.",
        keywords: ["otorisasi", "menu", "hak akses", "rbac", "role"],
        roles: ["SUPERADMIN"],
      },
      {
        title: "User",
        href: "/master/user",
        description:
          "Manajemen akun pengguna aplikasi desktop/web backend (CRUD user, password hash, status aktif).",
        keywords: ["user", "pengguna", "akun", "login"],
        roles: ["SUPERADMIN"],
      },
      {
        title: "Petugas",
        href: "/master/petugas",
        description:
          "Manajemen data profil petugas pencatat meter lapangan (cater).",
        keywords: ["petugas", "cater", "pencatat", "profil"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Pemetaan Petugas",
        href: "/master/pemetaan-petugas",
        description:
          "Penugasan area/wilayah kerja spesifik untuk masing-masing petugas.",
        keywords: ["pemetaan", "petugas", "wilayah", "penugasan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Pengurutan Rute Petugas",
        href: "/master/urut",
        description:
          "Pengaturan urutan sekuensial rute jalan/gang pelanggan agar efisien saat pembacaan lapangan.",
        keywords: ["rute", "pengurutan", "sekuensial", "urut"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Penggabungan Rute",
        href: "/master/gabung",
        description:
          "Fitur untuk menggabungkan beberapa rute kecil menjadi satu rute penugasan.",
        keywords: ["rute", "penggabungan", "gabung"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pindah Rute",
        href: "/master/pindah",
        description:
          "Memindahkan data pelanggan dari satu rute ke rute petugas lain.",
        keywords: ["rute", "pindah", "mutasi rute"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Pindah Rute Monitoring",
        href: "/master/monitoring",
        description:
          "Memantau riwayat atau log pemindahan rute pelanggan antar petugas agar tidak ada data yang tercecer.",
        keywords: ["monitoring", "riwayat", "log", "pindah rute"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
    ],
  },
  {
    id: "pengolahan-data",
    title: "Pengolahan Data",
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
    ],
    items: [
      {
        title: "Baca Meter CHN",
        href: "/cater",
        description:
          "Pemrosesan data hasil baca meter format CHN dari perangkat/aplikasi mobile petugas.",
        keywords: ["meter", "baca meter", "cater", "chn", "wilayah"],
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
        title: "Ganti Water Meter",
        href: "/cater/ganti-meter",
        description:
          "Catat berita acara penggantian meter, stand angkat/pasang, dan verifikasi tautannya ke laporan pembacaan.",
        keywords: [
          "ganti meter",
          "gwm",
          "stand angkat",
          "stand pasang",
          "meter lama",
          "meter baru",
          "mutasi meter",
        ],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "PENCATAT",
        ],
      },
      {
        title: "Simulator Baca Meter",
        href: "/cater/simulasi",
        description:
          "Uji alur pencatatan mobile, deteksi anomali, verifikasi berjenjang, koreksi, dan audit dengan menyimpan data simulasi.",
        keywords: ["simulasi", "simulator", "mobile", "cater", "baca meter", "uji"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "EXECUTIVE",
          "PENCATAT",
        ],
      },
      {
        title: "Info Pelanggan",
        href: "/pelanggan",
        description:
          "Pencarian detail data pelanggan (nomor langganan, nama, alamat, golongan, koordinat).",
        keywords: ["pelanggan", "info", "data pelanggan", "nolg"],
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
        title: "Mutasi PB-PK",
        href: "/pelanggan/mutasi",
        description:
          "Pengelolaan mutasi Pasang Baru (PB) atau Perubahan Kategori/Golongan (PK).",
        keywords: ["mutasi", "pb-pk", "pasang baru", "perubahan kategori"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "No HP Pel",
        href: "/pelanggan/no-hp",
        description:
          "Pembaruan nomor telepon/WhatsApp pelanggan untuk keperluan konfirmasi atau layanan mandiri.",
        keywords: ["no hp", "telepon", "whatsapp", "kontak", "pelanggan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_1"],
      },
      {
        title: "Pindah Jenis Pel",
        href: "/pelanggan/jenis",
        description: "Modifikasi kategori tarif/golongan pelanggan.",
        keywords: ["pindah", "jenis", "golongan", "tarif", "pelanggan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Manual ADD",
        href: "/pelanggan/manual-add",
        description:
          "Input data pembacaan meter secara manual oleh admin untuk kasus khusus.",
        keywords: ["manual add", "input manual", "baca meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Manual Add All",
        href: "/pelanggan/manual-add-all",
        description:
          "Input atau penyesuaian data manual secara massal (batch).",
        keywords: ["manual add all", "bulk", "massal", "batch"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Hitung Rata-Rata",
        href: "/meter/hitung-rata-rata",
        description:
          "Kalkulasi otomatis pemakaian rata-rata air pelanggan berdasarkan histori bulan sebelumnya.",
        keywords: ["hitung", "rata-rata", "taksiran", "meter mati"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
      {
        title: "Cek Foto Petugas",
        href: "/meter/cek-foto",
        description:
          "Validasi visual foto bukti fisik yang diunggah petugas di lapangan untuk mencegah kecurangan (fraud).",
        keywords: ["foto", "petugas", "cek foto", "validasi visual", "fraud"],
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
        title: "Baca Meter Mandiri",
        href: "/stand-konsumen",
        description:
          "Validasi data pembacaan mandiri yang dikirimkan oleh pelanggan melalui kanal publik.",
        keywords: [
          "verifikasi",
          "catat mandiri",
          "mandiri",
          "konsumen",
          "stand",
        ],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
      {
        title: "Verifikasi Petugas",
        href: "/verifikasi/baca-petugas",
        description:
          "Grid verifikasi berjenjang pembacaan meter dari petugas lapangan.",
        keywords: ["verifikasi", "petugas", "cater", "V1", "V2", "V3"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "EXECUTIVE",
        ],
      },
      {
        title: "Verifikasi Mandiri",
        href: "/verifikasi/baca-pelanggan",
        description:
          "Grid pemeriksaan laporan pembacaan mandiri yang dikirim pelanggan.",
        keywords: ["verifikasi", "mandiri", "pelanggan", "konsumen"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
    ],
  },
  {
    id: "peta",
    title: "Peta",
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
    ],
    items: [
      {
        title: "Pemetaan Pelanggan",
        href: "/places",
        description:
          "Visualisasi titik koordinat pelanggan (GIS / PostGIS) di atas peta wilayah operasional.",
        keywords: [
          "peta",
          "gis",
          "pemetaan",
          "pelanggan",
          "postgis",
          "spasial",
        ],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PENCATAT",
        ],
      },
    ],
  },
  {
    id: "progres",
    title: "Progress",
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "PENCATAT",
    ],
    items: [
      {
        title: "Grafik Pelanggan",
        href: "/progres/grafik",
        description: "Grafik tren kubikasi pemakaian air pelanggan.",
        keywords: ["grafik", "pelanggan", "tren", "kubikasi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Progress per Wilayah",
        href: "/progres/wilayah",
        description:
          "Laporan persentase penyelesaian pembacaan meter per zona wilayah.",
        keywords: ["progress", "progres", "wilayah", "penyelesaian"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Progress per Cater",
        href: "/progres/cater",
        description:
          "Laporan produktivitas harian masing-masing petugas pencatat meter.",
        keywords: ["progress", "progres", "cater", "petugas", "produktivitas"],
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
        title: "Presentase Koreksi",
        href: "/progres/koreksi",
        description: "Monitoring jumlah data yang dikoreksi oleh supervisor.",
        keywords: ["koreksi", "presentase", "supervisor", "verifikasi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
        ],
      },
      {
        title: "Ikhtisar Pemakaian Ekstrim",
        href: "/progres/ekstrim",
        description:
          "Deteksi lonjakan pemakaian air yang tidak wajar (anomali tinggi).",
        keywords: ["ekstrim", "lonjakan", "anomali", "pemakaian tinggi"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Ikhtisar Pemakaian Turun",
        href: "/progres/turun",
        description: "Analisis penurunan drastis pemakaian air pelanggan.",
        keywords: ["turun", "penurunan", "drastis", "pemakaian"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Ikhtisar Pemakaian 0 (Nol)",
        href: "/progres/nol",
        description:
          "Daftar pelanggan dengan pemakaian air 0 kubik (indikasi meter mati atau tidak ada huni).",
        keywords: ["nol", "0", "pemakaian nol", "meter mati", "kosong"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Hasil Foto Petugas",
        href: "/progres/hasil-foto",
        description: "Rekapitulasi galeri foto bukti pembacaan lapangan.",
        keywords: ["foto", "hasil foto", "petugas", "galeri", "bukti"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
          "PENCATAT",
        ],
      },
    ],
  },
  {
    id: "laporan",
    title: "Laporan (Reports)",
    roles: [
      "SUPERADMIN",
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
          "Rekapitulasi tagihan air bulanan (Daftar Rekening Ditagih).",
        keywords: ["drd", "laporan drd", "tagihan", "rekening"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_3"],
      },
      {
        title: "Lap. Mutasi Pel",
        href: "/laporan/lap-mutasi-pel",
        description: "Laporan perubahan data induk pelanggan.",
        keywords: ["mutasi", "pelanggan", "induk", "perubahan"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Mutasi PB-PK",
        href: "/laporan/lap-mutasi-pbpk",
        description: "Laporan pasang baru dan perubahan kategori.",
        keywords: ["mutasi", "pb-pk", "pasang baru", "kategori"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Periode Cater",
        href: "/laporan/lap-periode",
        description: "Laporan jadwal dan periode pembacaan.",
        keywords: ["periode", "cater", "jadwal", "pembacaan"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Data Meter",
        href: "/laporan/lap-data-meter",
        description: "Laporan nomor seri dan spesifikasi meter air.",
        keywords: ["data meter", "nomor seri", "spesifikasi", "meter"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Kelainan Meter",
        href: "/laporan/lap-kelainan-meter",
        description: "Laporan rekapitulasi gangguan/kerusakan meter.",
        keywords: ["kelainan meter", "gangguan", "kerusakan", "rusak"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Evaluasi",
        href: "/laporan/evaluasi",
        description: "Laporan evaluasi kinerja bulanan.",
        keywords: ["evaluasi", "kinerja", "bulanan"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Pelanggan",
        href: "/laporan/pelanggan",
        description: "Direktori lengkap data pelanggan.",
        keywords: ["pelanggan", "direktori", "data pelanggan"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Selisih Hari",
        href: "/laporan/selisih-hari",
        description: "Laporan deviasi rentang hari pembacaan antar periode.",
        keywords: ["selisih hari", "deviasi", "rentang hari"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Data St. Awal & Akhir",
        href: "/laporan/stand-awal-akhir",
        description: "Laporan stand angka meter awal dan akhir.",
        keywords: ["stand", "awal", "akhir", "stand meter"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Data St. 0 (Nol)",
        href: "/laporan/stand-nol",
        description: "Laporan khusus stand meter nol.",
        keywords: ["stand 0", "stand nol", "meter nol"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. History",
        href: "/laporan/history",
        description: "Rekapitulasi histori pembacaan jangka panjang.",
        keywords: ["history", "histori", "riwayat", "jangka panjang"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Perubahan Pel",
        href: "/laporan/perubahan-pelanggan",
        description: "Log audit perubahan data pelanggan.",
        keywords: ["perubahan", "audit log", "pelanggan"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Data dan Foto",
        href: "/laporan/data-foto",
        description: "Laporan gabungan data teks dan bukti foto.",
        keywords: ["data foto", "bukti foto", "foto meter"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
      {
        title: "Lap. Monitoring Kubikasi Koreksi",
        href: "/laporan/monitoring-kubikasi-koreksi",
        description: "Laporan audit koreksi kubikasi air.",
        keywords: ["monitoring", "kubikasi", "koreksi", "audit air"],
        roles: [
          "SUPERADMIN",
          "STAFF_ADMIN_BILLING",
          "VERIFIKATOR_1",
          "VERIFIKATOR_2",
          "VERIFIKATOR_3",
        ],
      },
    ],
  },
  {
    id: "tool-tutup-bulan",
    title: "Tool Tutup Bulan",
    roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_3"],
    items: [
      {
        title: "PBPK",
        href: "/tools-tutup/pbpk",
        description: "Finalisasi data pasang baru dan perubahan kategori.",
        keywords: ["pbpk", "pasang baru", "kategori", "tutup bulan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Stand Angkat",
        href: "/tools-tutup/stand-angkat",
        description: "Penguncian stand akhir meter.",
        keywords: ["stand angkat", "penguncian", "stand akhir"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Update Zonasi",
        href: "/tools-tutup/update-zonasi",
        description: "Pembaruan data struktur zonasi wilayah.",
        keywords: ["zonasi", "wilayah", "pembaruan zonasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Posting Datameter",
        href: "/tools-tutup/posting-datameter",
        description: "Publikasi data meter final untuk sistem billing utama.",
        keywords: ["posting", "datameter", "billing", "tagihan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Create Closed DRD",
        href: "/tools-tutup/create-closed-drd",
        description: "Pembuatan data DRD terkunci (closing).",
        keywords: ["create closed drd", "closed drd", "closing"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Create Perbandingan",
        href: "/tools-tutup/create-perbandingan",
        description: "Pembuatan data pembandingan antar bulan.",
        keywords: ["create perbandingan", "perbandingan", "antar bulan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Create Bulan Baru",
        href: "/tools-tutup/create-bulan-baru",
        description: "Inisialisasi periode pembacaan bulan berikutnya.",
        keywords: ["create bulan baru", "bulan baru", "inisialisasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Upload Master Pelanggan",
        href: "/tools-tutup/upload-master-pelanggan",
        description: "Sinkronisasi database master pelanggan baru.",
        keywords: ["upload", "master pelanggan", "sinkronisasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Sync Pelanggan Baru",
        href: "/tools-tutup/sync-pelanggan-baru",
        description: "Sinkronisasi data pelanggan dari sistem pendaftaran.",
        keywords: ["sync", "pelanggan baru", "pendaftaran"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Update Data Pelanggan",
        href: "/tools-tutup/update-data-pelanggan",
        description: "Pembaruan massal data pelanggan.",
        keywords: ["update data pelanggan", "pembaruan massal"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Cek Selisih Pelanggan",
        href: "/tools-tutup/cek-selisih-pelanggan",
        description: "Audit rekonsiliasi jumlah pelanggan aktif.",
        keywords: ["cek selisih", "rekonsiliasi", "pelanggan aktif"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Monitoring Ttp Bulan",
        href: "/tools-tutup/monitoring-tutup-bulan",
        description: "Pantauan status proses tutup bulan.",
        keywords: ["monitoring", "tutup bulan", "status closing"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING", "VERIFIKATOR_3"],
      },
    ],
  },
  {
    id: "tools",
    title: "Tools & Integrasi",
    roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
    items: [
      {
        title: "Running Text",
        href: "/tools/running-text",
        description:
          "Pengaturan teks pengumuman berjalan di aplikasi mobile petugas.",
        keywords: ["running text", "pengumuman", "mobile"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import St Angkat",
        href: "/tools/import-stand",
        description: "Impor data stand angka pengangkatan/penggantian meter.",
        keywords: ["import", "st angkat", "stand angkat", "ganti meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import PB PK",
        href: "/tools/import-pbpk",
        description: "Impor data mutasi pasang baru/perubahan kategori.",
        keywords: ["import", "pb pk", "pbpk", "pasang baru"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Proses Pbpk",
        href: "/tools/proses-pbpk",
        description: "Eksekusi pemrosesan data mutasi.",
        keywords: ["proses", "pbpk", "eksekusi mutasi"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Backup Photo",
        href: "/tools/import-backup",
        description: "Pemulihan cadangan file foto pembacaan.",
        keywords: ["import", "backup", "photo", "foto"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Backup Photo GWM",
        href: "/tools/import-photo",
        description:
          "Pemulihan cadangan foto Grand Water Meter (Master Meter).",
        keywords: ["import", "backup", "gwm", "master meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Backup Data",
        href: "/tools/import-backup-data",
        description: "Pemulihan database/file cadangan sistem.",
        keywords: ["import", "backup data", "database", "pemulihan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Data SPT",
        href: "/tools/import-spt",
        description: "Impor data Surat Perintah Tugas / rute.",
        keywords: ["import", "spt", "surat perintah tugas", "rute"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Data Anomali",
        href: "/tools/import-anomali",
        description: "Impor data penandaan anomali dari sistem lain.",
        keywords: ["import", "anomali", "penandaan"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Data GWM",
        href: "/tools/import-data",
        description:
          "Impor data master atau pembacaan Grand Water Meter (Master Meter).",
        keywords: ["import", "gwm", "master meter"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Import Tutup",
        href: "/tools/import-tutup",
        description: "Impor file hasil penutupan buku/bulan.",
        keywords: ["import", "tutup", "penutupan buku"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
    ],
  },
  {
    id: "sync-tutup-bulan",
    title: "SYNC Tutup Bulan",
    roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
    items: [
      {
        title: "Sync (1) Kirim Mutasi",
        href: "/sync/sync-mutasi",
        description:
          "Mengirim data terbaru mutasi pelanggan ke perangkat petugas.",
        keywords: ["sync", "kirim mutasi", "petugas", "mobile"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Sync (2) Kirim Datameter",
        href: "/sync/sync-datameter",
        description:
          "Mengirim daftar rute dan target pembacaan meter ke perangkat petugas.",
        keywords: ["sync", "kirim datameter", "rute", "target"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Sync (3) Import STI",
        href: "/sync/sync-sti",
        description:
          "Menarik data hasil pembacaan lapangan (Stand, Foto, Koordinat, Kelainan) dari perangkat petugas ke server.",
        keywords: ["sync", "import sti", "hasil baca", "stand", "foto"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
      {
        title: "Sync (4) Bulan Baru",
        href: "/sync/sync-bulan-baru",
        description:
          "Sinkronisasi perpindahan siklus ke bulan operasional baru.",
        keywords: ["sync", "bulan baru", "siklus baru"],
        roles: ["SUPERADMIN", "STAFF_ADMIN_BILLING"],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// 3. DATA TURUNAN (dihitung otomatis dari `navGroups` — jangan diisi manual)
// ----------------------------------------------------------------------------

/** Menelusuri node secara rekursif dan mengisi `out` dengan semua halaman. */
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
  for (const group of groups) collectEntries(group, group.items, [], out);
  return out;
}

/**
 * Index datar semua halaman + konteksnya (grup & folder induk).
 * Dasar dari findNavItem, findActiveNav, dan allNavItems.
 */
export const navIndex: NavEntry[] = buildNavIndex(navGroups);

/** Daftar datar semua halaman (dipakai pencarian Ctrl+K). */
export const allNavItems: NavItem[] = navIndex.map((entry) => entry.item);

// ----------------------------------------------------------------------------
// 4. FUNGSI PENCARIAN
// ----------------------------------------------------------------------------

/**
 * Meratakan struktur bersarang menjadi daftar halaman.
 * Menerima daftar grup (`navGroups`) maupun daftar node (`group.items`).
 */
export function flattenNavItems(
  nodes: readonly (NavNode | NavGroup)[],
): NavItem[] {
  return nodes.flatMap((node): NavItem[] => {
    if ("items" in node) return flattenNavItems(node.items);
    if (isNavFolder(node)) return flattenNavItems(node.children);
    return [node];
  });
}

/**
 * Cari halaman berdasarkan `href` PERSIS SAMA.
 * Dipakai <MenuPage /> untuk memuat judul & breadcrumb.
 * Jika ada href ganda, yang pertama di urutan menu yang dikembalikan.
 */
export function findNavItem(href: string): NavEntry | undefined {
  return navIndex.find((entry) => entry.item.href === href);
}

/**
 * Tentukan halaman aktif dari alamat URL (untuk highlight sidebar/navbar).
 * Yang dipilih adalah `href` TERPANJANG yang cocok, sehingga
 * "/pelanggan/mutasi" -> "Mutasi", bukan "Data Pelanggan" ("/pelanggan").
 * Cocok jika pathname sama persis atau diawali `href + "/"`.
 */
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

/**
 * Link tujuan sebuah Direktorat = halaman pertama di dalamnya.
 * Dipakai untuk breadcrumb level grup. Fallback "/" hanya jaga-jaga jika
 * grup kosong (secara data seharusnya tidak terjadi).
 */
export function getNavGroupHref(group: NavGroup): string {
  return flattenNavItems(group.items)[0]?.href ?? "/";
}

/**
 * Utilitas pengecekan data: daftar `href` yang muncul lebih dari sekali.
 * Tidak dipanggil otomatis. Contoh pemakaian di dev:
 *   console.warn("href ganda:", findDuplicateHrefs())
 */
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
// 5. KONSTANTA LAIN
// ----------------------------------------------------------------------------

/**
 * Menu utama di BAGIAN ATAS sidebar, di atas daftar grup/direktorat.
 * Halaman dashboard utama = "/dashboard". Ubah `href` di sini bila rute
 * Analytics / Report berbeda; ikonnya di sidebar/icons.ts (PRIMARY_ICONS).
 */
export const primaryNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Ringkasan utama aplikasi.",
    keywords: ["dashboard", "beranda", "ringkasan", "home"],
    roles: [
      "SUPERADMIN",
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
    title: "Analytics",
    href: "/analytics",
    description: "Analisis dan grafik data.",
    keywords: ["analytics", "analitik", "grafik", "statistik"],
    roles: [
      "SUPERADMIN",
      "STAFF_ADMIN_BILLING",
      "VERIFIKATOR_1",
      "VERIFIKATOR_2",
      "VERIFIKATOR_3",
      "EXECUTIVE",
    ],
  },
];

// ----------------------------------------------------------------------------
// 6. RBAC FILTERING LOGIC
// ----------------------------------------------------------------------------

/**
 * Menentukan apakah sebuah node (item, folder, atau grup) diizinkan untuk daftar roles pengguna.
 * Rules:
 * - Jika roles pengguna mencakup 'SUPERADMIN', selalu izinkan.
 * - Jika node tidak mencantumkan batasan `roles` (undefined / kosong), diizinkan untuk semua role yang terautentikasi.
 * - Jika node mencantumkan batasan `roles`, minimal salah satu role pengguna harus cocok.
 */
export function isNodeAllowed(
  node: NavNode | NavGroup,
  userRoles: readonly string[],
): boolean {
  if (userRoles.includes("SUPERADMIN")) return true;
  const targetRoles = node.roles;
  if (!targetRoles || targetRoles.length === 0) return true;
  return targetRoles.some((r) => userRoles.includes(r));
}

/**
 * Memfilter array NavNode (daun dan folder) secara rekursif berdasarkan roles pengguna.
 * Subfolder yang tidak memiliki anak aktif setelah filter akan otomatis dibuang.
 */
export function filterNavNodes(
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
    .filter((node) => {
      if (isNavFolder(node)) {
        return node.children.length > 0;
      }
      return true;
    });
}

/**
 * Memfilter array NavGroup berdasarkan roles pengguna.
 * Grup yang seluruh itemnya tidak dapat diakses akan otomatis tersembunyi dari sidebar.
 */
export function filterNavGroups(
  groups: readonly NavGroup[],
  userRoles: readonly string[],
): NavGroup[] {
  return groups
    .filter((g) => isNodeAllowed(g, userRoles))
    .map((g) => ({
      ...g,
      items: filterNavNodes(g.items, userRoles),
    }))
    .filter((g) => g.items.length > 0);
}

/**
 * Memfilter primaryNav berdasarkan roles pengguna.
 */
export function filterPrimaryNav(
  items: readonly NavItem[],
  userRoles: readonly string[],
): NavItem[] {
  return items.filter((item) => isNodeAllowed(item, userRoles));
}

/**
 * Link di navbar desktop (teks kecil). Hanya level Direktorat, bukan seluruh
 * hirarki. `href` menunjuk halaman landing tiap Direktorat.
 */
export const navbarLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Baca Meter", href: "/cater" },
  { label: "Pelanggan", href: "/pelanggan" },
  { label: "Peta Spasial", href: "/places" },
  { label: "Laporan", href: "/laporan/lap-drd" },
];

/** Link menu layar penuh di mobile: sama dengan navbar + Bantuan. */
export const mobileMenuLinks = [
  ...navbarLinks.map((link) => ({ name: link.label, href: link.href })),
];

/** Versi menu/aplikasi yang ditampilkan di UI. */
export const versions = ["v1.0"];
