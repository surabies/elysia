// features/dashboard/verifikasi/components/WarnaTahap.ts — SATU tempat yang
// memutuskan warna di layar verifikasi berdasarkan Vercel Geist Color System.
//
// PALET RESMI GEIST (10-step scale 100–1000):
//   Gray   = belum disentuh (menunggu, belum dibaca)
//   Amber  = diperiksa supervisor, butuh tahap berikutnya (V1)
//   Blue   = divalidasi manajemen, siap persetujuan final (V2)
//   Green  = selesai, pembacaan resmi (V3)
//   Purple = ada koreksi / edit angka stand
//   Red    = masalah (cek ulang, anomali)

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
  /// Latar baris — tint lembut Geist, cukup untuk penanda tanpa mengganggu keterbacaan angka.
  baris: string;
  /// Lapisan tint untuk SEL BEKU.
  lapis: string;
  /// Lencana status — pil Geist (Step 100 bg, Step 400 border, Step 900 text).
  lencana: string;
  /// Garis kiri baris 3px (penanda utama tahap di tepi kiri tabel).
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
    lencana:
      "bg-(--ds-gray-100) text-(--ds-gray-900) ring-1 ring-inset ring-(--ds-gray-400)",
    garis: GARIS + "before:bg-transparent",
    titik: "bg-(--ds-gray-600)",
    teks: "text-muted-foreground",
  },
  V1: {
    label: "V1 diperiksa",
    baris: "bg-(--verif-v1-row)",
    lapis: LAPIS + "after:bg-(--verif-v1-row)",
    lencana:
      "bg-(--verif-v1-soft) text-(--verif-v1-text) ring-1 ring-inset ring-(--verif-v1-border)",
    garis: GARIS + "before:bg-(--verif-v1)",
    titik: "bg-(--verif-v1)",
    teks: "text-(--verif-v1-text)",
  },
  V2: {
    label: "V2 divalidasi",
    baris: "bg-(--verif-v2-row)",
    lapis: LAPIS + "after:bg-(--verif-v2-row)",
    lencana:
      "bg-(--verif-v2-soft) text-(--verif-v2-text) ring-1 ring-inset ring-(--verif-v2-border)",
    garis: GARIS + "before:bg-(--verif-v2)",
    titik: "bg-(--verif-v2)",
    teks: "text-(--verif-v2-text)",
  },
  TERVERIFIKASI: {
    label: "Terverifikasi Mandiri",
    baris: "bg-(--verif-v2-row)",
    lapis: LAPIS + "after:bg-(--verif-v2-row)",
    lencana:
      "bg-(--verif-v2-soft) text-(--verif-v2-text) ring-1 ring-inset ring-(--verif-v2-border)",
    garis: GARIS + "before:bg-(--verif-v2)",
    titik: "bg-(--verif-v2)",
    teks: "text-(--verif-v2-text)",
  },
  V3: {
    label: "V3 resmi",
    baris: "bg-(--verif-v3-row)",
    lapis: LAPIS + "after:bg-(--verif-v3-row)",
    lencana:
      "bg-(--verif-v3-soft) text-(--verif-v3-text) ring-1 ring-inset ring-(--verif-v3-border)",
    garis: GARIS + "before:bg-(--verif-v3)",
    titik: "bg-(--verif-v3)",
    teks: "text-(--verif-v3-text)",
  },
  DITOLAK: {
    label: "Cek ulang",
    baris: "bg-(--verif-error-row)",
    lapis: LAPIS + "after:bg-(--verif-error-row)",
    lencana:
      "bg-(--verif-error-soft) text-(--verif-error-text) ring-1 ring-inset ring-(--verif-error-border)",
    garis: GARIS + "before:bg-(--verif-error)",
    titik: "bg-(--verif-error)",
    teks: "text-(--verif-error-text)",
  },
};

export const GAYA_BELUM_DIBACA: GayaTahap = {
  label: "Belum dibaca",
  baris: "bg-transparent",
  lapis: "",
  lencana:
    "bg-transparent text-muted-foreground ring-1 ring-inset ring-border",
  garis: GARIS + "before:bg-transparent",
  titik: "bg-muted-foreground",
  teks: "text-muted-foreground",
};

/// Penanda anomali: lencana merah Geist (Step 100 bg, Step 400 border, Step 900 text).
export function gayaAnomali(
  persentase: number | null,
  ambang: number,
): string | null {
  if (persentase === null) return null;
  if (persentase > ambang || persentase < -ambang) {
    return "bg-(--verif-error-soft) text-(--verif-error-text) ring-1 ring-inset ring-(--verif-error-border)";
  }
  return null;
}

/// Titik ring V1/V2/V3 di tabel & panel detail.
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
