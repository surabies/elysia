/**
 * Domain Engine: Taksasi Manual & Estimasi Pemakaian Air
 * 100% Pure Business Logic (Bebas dari I/O, Database, dan Framework HTTP)
 *
 * Menerapkan metode RATA-12B, 3-Tertinggi, Taksasi Standar,
 * serta penanganan rollover angka meter (mis. 9999 -> 0015).
 */

export interface RiwayatTagihanTaksasi {
  id: string;
  periode: Date | string;
  pemakaianM3: number;
}

export interface StandTerakhirTaksasi {
  id: string;
  periode: Date | string;
  standAkhir: number;
}

export interface HasilTaksasi {
  pemakaian: number | null;
  standAwalTerakhir: number | null;
  bolehDitambahkan: boolean;
  alasanPeninjauan: string | null;
  pemakaianTerakhir: number | null;
  standSumber: { id: string; periode: string; standAwal: number } | null;
  sumberTagihan: { id: string; periode: string; pemakaianM3: number }[];
  metode:
    | 'RATA_RATA_12_BULAN'
    | 'TIGA_TERTINGGI'
    | 'RIWAYAT_TERSEDIA'
    | 'TANPA_HISTORI';
}

const BULAN_DALAM_TAHUN = 12;
export const PEMAKAIAN_MINIMUM_PERDIR = 5;

function parseDate(d: Date | string): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

function bulanSebelumnya(periode: Date): Date {
  return new Date(
    Date.UTC(
      periode.getUTCFullYear(),
      periode.getUTCMonth() - BULAN_DALAM_TAHUN,
      1
    )
  );
}

/**
 * Menghitung taksasi kubikasi pemakaian air berdasarkan riwayat konsumsi lalu
 * @param riwayat Riwayat pemakaian tagihan bulan-bulan sebelumnya
 * @param periodeTarget Periode tagihan yang sedang dihitung
 * @param standTerakhir Informasi stand pembacaan resmi terakhir
 */
export function hitungTaksasi(
  riwayat: RiwayatTagihanTaksasi[],
  periodeTarget: Date | string,
  standTerakhir: StandTerakhirTaksasi | null = null
): HasilTaksasi {
  const targetDate = parseDate(periodeTarget);

  const standParsed = standTerakhir
    ? {
        id: standTerakhir.id,
        periode: parseDate(standTerakhir.periode),
        standAkhir: standTerakhir.standAkhir,
      }
    : null;

  const sumberStandValid =
    standParsed &&
    standParsed.periode.getTime() < targetDate.getTime() &&
    Number.isSafeInteger(standParsed.standAkhir) &&
    standParsed.standAkhir >= 0
      ? standParsed
      : null;

  const standAwalTerakhir = sumberStandValid?.standAkhir ?? null;

  const pemakaianValid = riwayat
    .map((r) => ({
      id: r.id,
      periode: parseDate(r.periode),
      pemakaianM3: r.pemakaianM3,
    }))
    .filter(
      (row) =>
        Number.isSafeInteger(row.pemakaianM3) &&
        row.pemakaianM3 >= 0 &&
        row.periode.getTime() < targetDate.getTime()
    )
    .sort((a, b) => b.periode.getTime() - a.periode.getTime());

  if (pemakaianValid.length === 0) {
    const bolehDitambahkan = sumberStandValid !== null;
    return {
      pemakaian: bolehDitambahkan ? PEMAKAIAN_MINIMUM_PERDIR : null,
      standAwalTerakhir,
      bolehDitambahkan,
      alasanPeninjauan: bolehDitambahkan
        ? null
        : 'Stand resmi periode sebelumnya atau meter aktif belum tersedia.',
      pemakaianTerakhir: null,
      standSumber: sumberStandValid
        ? {
            id: sumberStandValid.id,
            periode: sumberStandValid.periode.toISOString(),
            standAwal: sumberStandValid.standAkhir,
          }
        : null,
      sumberTagihan: [],
      metode: 'TANPA_HISTORI',
    };
  }

  const mulai12Bulan = bulanSebelumnya(targetDate);
  const riwayat12Bulan = pemakaianValid.filter(
    (row) => row.periode >= mulai12Bulan
  );

  let dipakai: typeof pemakaianValid;
  let metode: HasilTaksasi['metode'];

  if (riwayat12Bulan.length >= BULAN_DALAM_TAHUN) {
    dipakai = riwayat12Bulan.slice(0, BULAN_DALAM_TAHUN);
    metode = 'RATA_RATA_12_BULAN';
  } else if (pemakaianValid.length >= 3) {
    dipakai = [...pemakaianValid]
      .sort((a, b) => b.pemakaianM3 - a.pemakaianM3)
      .slice(0, 3);
    metode = 'TIGA_TERTINGGI';
  } else {
    dipakai = pemakaianValid;
    metode = 'RIWAYAT_TERSEDIA';
  }

  const jumlah = dipakai.reduce((total, row) => total + row.pemakaianM3, 0);
  return {
    pemakaian: Math.ceil(jumlah / dipakai.length),
    standAwalTerakhir,
    bolehDitambahkan: sumberStandValid !== null,
    alasanPeninjauan:
      sumberStandValid === null
        ? 'Stand resmi periode sebelumnya atau meter aktif belum tersedia.'
        : null,
    pemakaianTerakhir: pemakaianValid[0]!.pemakaianM3,
    standSumber: sumberStandValid
      ? {
          id: sumberStandValid.id,
          periode: sumberStandValid.periode.toISOString(),
          standAwal: sumberStandValid.standAkhir,
        }
      : null,
    sumberTagihan: dipakai.map((row) => ({
      id: row.id,
      periode: row.periode.toISOString(),
      pemakaianM3: row.pemakaianM3,
    })),
    metode,
  };
}

/**
 * Menghitung pemakaian air jika terjadi roll-over meter (misal meter 4 digit: 9990 -> 0015 = 25 m3)
 * @param stml Stand Meter Lalu
 * @param stma Stand Meter Akhir
 * @param jumlahDigit Jumlah digit meter (bawaan: 4 atau 5 digit)
 */
export function hitungRollover(
  stml: number,
  stma: number,
  jumlahDigit: number = 4
): { pemakaianM3: number; isRollover: boolean } {
  if (stma >= stml) {
    return {
      pemakaianM3: stma - stml,
      isRollover: false,
    };
  }

  // Jika stma < stml, kemungkinan terjadi roll-over (angka meter melewati batas kapasitas fisik)
  const maxKapasitas = Math.pow(10, jumlahDigit); // e.g. 10000 untuk 4 digit
  const pemakaianRollover = maxKapasitas - stml + stma;

  return {
    pemakaianM3: pemakaianRollover,
    isRollover: true,
  };
}
