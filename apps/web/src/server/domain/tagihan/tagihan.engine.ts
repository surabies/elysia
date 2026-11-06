/**
 * Domain Engine: Perhitungan Tagihan Air Progresif & Komponen Biaya Rekening
 * 100% Pure Business Logic (Bebas dari I/O, Database, dan Framework HTTP)
 *
 * Diturunkan langsung dari formula resmi tarif PDAM Tirtawening.
 */

export interface HargaBlok {
  blok: number;
  batasAwalM3: number; // Inklusif (1, 11, 21, 31)
  batasAkhirM3: number | null; // Inklusif (10, 20, 30, null untuk >30)
  hargaPerM3: number;
}

export interface RincianBlok {
  blok: number;
  dariM3: number;
  sampaiM3: number;
  volumeM3: number;
  hargaPerM3: number;
  subtotal: number;
}

export interface HasilRincianHargaAir {
  total: number;
  rincian: RincianBlok[];
}

export interface KomponenTagihanInput {
  jmlHargaAir: number;
  beaBeban: number;
  beaAdmin: number;
  airKotor: number;
  lainLain?: number;
}

export const PEMAKAIAN_MINIMUM_M3 = 5;

export const BATAS_BLOK_STANDAR: readonly {
  blok: number;
  batasAwalM3: number;
  batasAkhirM3: number | null;
}[] = [
  { blok: 1, batasAwalM3: 1, batasAkhirM3: 10 },
  { blok: 2, batasAwalM3: 11, batasAkhirM3: 20 },
  { blok: 3, batasAwalM3: 21, batasAkhirM3: 30 },
  { blok: 4, batasAwalM3: 31, batasAkhirM3: null },
];

/**
 * Menghitung rincian harga air bertingkat (progresif) berdasarkan blok tarif
 * @param pemakaianM3 Volume pemakaian air (m3)
 * @param blokTarif Daftar harga blok tarif progresif
 */
export function hitungRincianHargaAir(
  pemakaianM3: number,
  blokTarif: readonly HargaBlok[]
): HasilRincianHargaAir {
  const rincian: RincianBlok[] = [];
  if (pemakaianM3 <= 0) return { total: 0, rincian };

  let total = 0;
  let sisa = pemakaianM3;
  const urut = [...blokTarif].sort((a, b) => a.batasAwalM3 - b.batasAwalM3);

  for (const b of urut) {
    if (sisa <= 0) break;
    const terpakaiSebelumnya = b.batasAwalM3 - 1;
    if (pemakaianM3 <= terpakaiSebelumnya) break;
    const lebarBlok =
      b.batasAkhirM3 === null ? Infinity : b.batasAkhirM3 - b.batasAwalM3 + 1;
    const volumeM3 = Math.min(sisa, lebarBlok);
    const subtotal = volumeM3 * b.hargaPerM3;
    total += subtotal;
    rincian.push({
      blok: b.blok,
      dariM3: b.batasAwalM3,
      sampaiM3: terpakaiSebelumnya + volumeM3,
      volumeM3,
      hargaPerM3: b.hargaPerM3,
      subtotal,
    });
    sisa -= volumeM3;
  }

  return { total, rincian };
}

/**
 * Menghitung total harga air progresif murni
 */
export function hitungHargaAir(
  pemakaianM3: number,
  blokTarif: readonly HargaBlok[]
): number {
  return hitungRincianHargaAir(pemakaianM3, blokTarif).total;
}

/**
 * Menentukan blok konsumsi tertinggi yang dicapai pemakaian
 */
export function tentukanBlok(pemakaianM3: number): number {
  if (pemakaianM3 <= 0) return 1;
  for (const b of BATAS_BLOK_STANDAR) {
    if (b.batasAkhirM3 === null || pemakaianM3 <= b.batasAkhirM3) return b.blok;
  }
  return BATAS_BLOK_STANDAR[BATAS_BLOK_STANDAR.length - 1]!.blok;
}

/**
 * Menghitung total nominal rupiah tagihan rekening air (DRD)
 */
export function hitungTotalTagihan(k: KomponenTagihanInput): number {
  return (
    k.jmlHargaAir +
    k.beaBeban +
    k.beaAdmin +
    k.airKotor +
    (k.lainLain ?? 0)
  );
}

export type AlasanTaksir =
  | 'MINIMUM_5M3'
  | 'TAKSIRAN_BULAN_LALU'
  | 'NOL_TIDAK_ADA_AIR'
  | 'OVERRIDE_MANUAL';

const KONDISI_NOL: ReadonlySet<string> = new Set(['TIDAK_ADA_AIR', 'DICABUT', '8', 'D']);
const KONDISI_TAKSIR: ReadonlySet<string> = new Set([
  'TIDAK_DIPAKAI',
  'RUMAH_KOSONG',
  'METER_MATI_ADA_AIR',
  'TTB',
  'MTA',
  'TERHALANG',
  'METER_RUSAK',
  'DK',
  'BMK_BMB',
  '2',
  '3',
  '5',
  '6',
  '7',
  'H',
  'R',
  'O',
  'E',
]);

export interface HasilPemakaianTagih {
  pemakaianTagih: number;
  alasan: AlasanTaksir | null;
}

/**
 * Mengusulkan volume pemakaian tagih berdasarkan kondisi fisik meter & ketentuan Perdir
 */
export function usulkanPemakaianTagih(params: {
  pemakaianRiil: number;
  kondisi: string;
  pemakaianLalu: number | null;
}): HasilPemakaianTagih {
  const { pemakaianRiil, kondisi, pemakaianLalu } = params;

  if (KONDISI_NOL.has(kondisi)) {
    return { pemakaianTagih: 0, alasan: 'NOL_TIDAK_ADA_AIR' };
  }

  if (KONDISI_TAKSIR.has(kondisi) && pemakaianLalu !== null) {
    const taksiran = Math.max(pemakaianLalu, PEMAKAIAN_MINIMUM_M3);
    return { pemakaianTagih: taksiran, alasan: 'TAKSIRAN_BULAN_LALU' };
  }

  if (pemakaianRiil < PEMAKAIAN_MINIMUM_M3) {
    return { pemakaianTagih: PEMAKAIAN_MINIMUM_M3, alasan: 'MINIMUM_5M3' };
  }

  return { pemakaianTagih: pemakaianRiil, alasan: null };
}
