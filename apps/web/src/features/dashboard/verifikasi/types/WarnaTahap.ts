// features/dashboard/verifikasi/components/WarnaTahap.ts — SATU tempat yang
// memutuskan warna di layar verifikasi.
//
// PALET DIKUNCI LIMA: abu-abu, amber, biru, hijau, merah. Tidak ada ungu/sky/
// emerald lagi. Setiap warna membawa SATU arti dan tidak dipakai untuk arti lain:
//   abu   = belum disentuh (menunggu, belum dibaca)
//   amber = sedang berjalan, butuh orang berikutnya (V1)
//   biru  = lolos pemeriksaan, tinggal persetujuan (V2)
//   hijau = selesai, resmi (V3)
//   merah = masalah (cek ulang, anomali)
//
// KENAPA TRANSPARAN (…-500/10), BUKAN PASANGAN …-50 + dark:…-950. Satu kelas
// mencampur diri dengan latar kartu di kedua tema, jadi tidak ada warna yang
// hanya benar di satu tema dan tabel tidak berubah jadi papan warna. Teksnya
// satu-satunya yang berganti langkah (700 terang / 400 gelap) demi kontras.

export type Tahap =
  | "MENUNGGU"
  | "V1"
  | "V2"
  | "TERVERIFIKASI"
  | "V3"
  | "DITOLAK";

/// Urutan ring yang sudah dilewati sebuah laporan.
export function tahapDari(row: {
  verif1At?: string | null;
  verif2At?: string | null;
  verif3At?: string | null;
  verifiedAt?: string | null;
  isVerified?: boolean | null;
  laporanMandiriTerverifikasi?: boolean;
}): Tahap {
  if (row.verif3At) return "V3";
  if (row.laporanMandiriTerverifikasi) return "TERVERIFIKASI";
  // DITOLAK = verifiedAt terisi TANPA isVerified. Diperiksa sebelum V1/V2
  // karena penolakan mereset ring dan yang harus terlihat adalah "cek ulang".
  if (row.verifiedAt && !row.isVerified) return "DITOLAK";
  if (row.verif2At) return "V2";
  if (row.verif1At) return "V1";
  return "MENUNGGU";
}

export interface GayaTahap {
  label: string;
  /// Latar baris — 4% saja, cukup untuk dibaca sekilas, tidak mengganggu angka.
  baris: string;
  /// Lapisan tint untuk SEL BEKU. Sel beku harus opak (bg-card) supaya isi
  /// kolom lain tidak menembus saat digulir, jadi tintnya ditumpuk lewat
  /// pseudo-element, bukan lewat background yang akan saling menimpa.
  lapis: string;
  /// Lencana status — pil tipis berbingkai, gaya Geist.
  lencana: string;
  /// Garis kiri baris (penanda kedua bagi yang sulit membedakan warna).
  garis: string;
  /// Titik kecil di samping teks / di ProgresRing.
  titik: string;
  /// Warna teks untuk ikon & nama pada panel detail.
  teks: string;
}

const LAPIS = "after:pointer-events-none after:absolute after:inset-0 ";
const GARIS = "before:absolute before:inset-y-0 before:left-0 before:w-0.5 ";

export const GAYA_TAHAP: Record<Tahap, GayaTahap> = {
  MENUNGGU: {
    label: "Menunggu",
    baris: "bg-card",
    lapis: "",
    lencana: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
    garis: GARIS + "before:bg-border",
    titik: "bg-muted-foreground",
    teks: "text-muted-foreground",
  },
  V1: {
    label: "V1 diperiksa",
    baris: "bg-(--verif-v1-soft)",
    lapis: LAPIS + "after:bg-(--verif-v1-soft)",
    lencana:
      "bg-(--verif-v1-soft) text-(--verif-v1) ring-1 ring-inset ring-(--verif-v1-border)",
    garis: GARIS + "before:bg-(--verif-v1)",
    titik: "bg-(--verif-v1)",
    teks: "text-(--verif-v1)",
  },
  V2: {
    label: "V2 divalidasi",
    baris: "bg-(--verif-v2-soft)",
    lapis: LAPIS + "after:bg-(--verif-v2-soft)",
    lencana:
      "bg-(--verif-v2-soft) text-(--verif-v2) ring-1 ring-inset ring-(--verif-v2-border)",
    garis: GARIS + "before:bg-(--verif-v2)",
    titik: "bg-(--verif-v2)",
    teks: "text-(--verif-v2)",
  },
  TERVERIFIKASI: {
    label: "Terverifikasi Mandiri",
    baris: "bg-(--verif-v2-soft)",
    lapis: LAPIS + "after:bg-(--verif-v2-soft)",
    lencana:
      "bg-(--verif-v2-soft) text-(--verif-v2) ring-1 ring-inset ring-(--verif-v2-border)",
    garis: GARIS + "before:bg-(--verif-v2)",
    titik: "bg-(--verif-v2)",
    teks: "text-(--verif-v2)",
  },
  V3: {
    label: "V3 resmi",
    baris: "bg-(--verif-v3-soft)",
    lapis: LAPIS + "after:bg-(--verif-v3-soft)",
    lencana:
      "bg-(--verif-v3-soft) text-(--verif-v3) ring-1 ring-inset ring-(--verif-v3-border)",
    garis: GARIS + "before:bg-(--verif-v3)",
    titik: "bg-(--verif-v3)",
    teks: "text-(--verif-v3)",
  },
  DITOLAK: {
    label: "Cek ulang",
    baris: "bg-(--verif-error-soft)",
    lapis: LAPIS + "after:bg-(--verif-error-soft)",
    lencana:
      "bg-(--verif-error-soft) text-(--verif-error) ring-1 ring-inset ring-(--verif-error-border)",
    garis: GARIS + "before:bg-(--verif-error)",
    titik: "bg-(--verif-error)",
    teks: "text-(--verif-error)",
  },
};

/// "Belum dibaca" = ketiadaan laporan, bukan tahap verifikasi. Dulu ungu; kini
/// abu-abu BERGARIS PUTUS-PUTUS supaya tidak tertukar dengan "Menunggu"
/// (abu polos) tanpa perlu warna keenam.
export const GAYA_BELUM_DIBACA: GayaTahap = {
  label: "Belum dibaca",
  baris: "bg-transparent",
  lapis: "",
  lencana: "bg-transparent text-muted-foreground ring-1 ring-inset ring-border",
  garis: GARIS + "before:bg-border",
  titik: "bg-muted-foreground",
  teks: "text-muted-foreground",
};

/// Penanda anomali: lencana merah terpisah yang menumpang di atas warna tahap.
export function gayaAnomali(
  persentase: number | null,
  ambang: number,
): string | null {
  if (persentase === null) return null;
  if (persentase > ambang || persentase < -ambang) {
    return "bg-(--verif-error-soft) text-(--verif-error) ring-1 ring-inset ring-(--verif-error-border)";
  }
  return null;
}

/// Titik ring V1/V2/V3 di tabel. Warna TIAP ring tetap: kalau V1 amber di
/// tabel, V1 amber juga di panel detail (ProgresRing) dan di dialog massal.
export const TITIK_RING = {
  1: GAYA_TAHAP.V1.titik,
  2: GAYA_TAHAP.V2.titik,
  3: GAYA_TAHAP.V3.titik,
} as const;

export const TEKS_RING = {
  1: GAYA_TAHAP.V1.teks,
  2: GAYA_TAHAP.V2.teks,
  3: GAYA_TAHAP.V3.teks,
} as const;
