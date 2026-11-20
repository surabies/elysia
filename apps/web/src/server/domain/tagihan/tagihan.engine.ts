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
  | 'REKONSILIASI_TAKSASI_LALU'
  | 'ANOMALI_KREDIT_TAKSASI'
  | 'KREDIT_TAKSASI_KELEBIHAN'
  | 'STAND_TETAP'
  | 'METER_BARU_RESET'
  | 'OVERRIDE_MANUAL';

export type ModeHitungKondisiInput =
  | 'SELISIH_FISIK'
  | 'NOL'
  | 'TAKSASI_HISTORI'
  | 'METER_BARU'
  | 'KREDIT_TAKSASI';

export type TagihanSaatKelebihanMode = 'NOL' | 'MINIMUM';

export interface HitungPemakaianBerbasisModeInput {
  stml: number;
  stma: number;
  modeHitung: ModeHitungKondisiInput;
  pakaiLalu: number | null;
  pemakaianMinimumM3: number; // 0 jika nonaktif, 5 untuk Tirtawening
  akumulasiTaksasiM3?: number; // Kredit kumulatif m3 taksasi sejak bacaan fisik terakhir
  akumulasiPerluVerifikasi?: boolean; // true jika riwayat taksasi sebelum periode awal belum terverifikasi infolang
  tagihanSaatKelebihan?: TagihanSaatKelebihanMode; // 'NOL' | 'MINIMUM' (default 'MINIMUM' dari golongan_tarif)
  standAngkat?: number | null; // Opsional jika berita acara ganti meter sudah mencatat stand angkat meter lama
  standPasang?: number | null; // Opsional stand pasang awal meter baru (default 0)
}

export interface HasilHitungPemakaianBerbasisMode {
  stmlAsli: number;
  stmaEfektif: number;
  selisihFisikM3: number;
  pakaiTagihM3: number;
  akumulasiTaksasiDikurangkan: number;
  akumulasiTaksasiBerikutnya: number;
  isAnomaliKreditTaksasi: boolean;
  isStandTetap: boolean;
  perluReviewVerifikatorAkumulasi: boolean;
  alasanTaksir: AlasanTaksir | null;
  pesanAnomali: string | null;
}

/**
 * Menghitung pemakaian fisik, pemakaian tagih, dan rekonsiliasi akumulasi_taksasi_m3
 * secara generik berdasarkan konfigurasi `mode_hitung` (master_kondisi_catat) dan
 * `pemakaian_minimum_m3` (golongan_tarif).
 *
 * ATURAN URUTAN PENERAPAN MINIMUM vs KREDIT TAKSASI (Wajib Menjaga Invarian: Total Ditagih == Pemakaian Fisik Riil):
 * 1. Jika `modeHitung === 'NOL'` (mis. TIDAK ADA AIR, DICABUT):
 *    - `stmaEfektif = stml`, `pakaiTagihM3 = 0`, `akumulasiTaksasiBerikutnya = akumulasiTaksasiM3`.
 * 2. Jika `modeHitung === 'TAKSASI_HISTORI'` (atau kondisi kendala dengan `stma === stml`):
 *    - `stmaEfektif = stml` (stand meter fisik ditahan),
 *    - `pakaiTagihM3 = Math.max(pakaiLalu ?? 0, pemakaianMinimumM3)`,
 *    - `akumulasiTaksasiBerikutnya = akumulasiTaksasiM3 + pakaiTagihM3` (kumulatif!).
 * 3. Jika `modeHitung === 'SELISIH_FISIK'` (bacaan fisik):
 *    - `selisihFisikM3 = stma - stml`.
 *    - Jika `akumulasiTaksasiM3 > 0` (rekonsiliasi pasca-taksasi):
 *      - `netto = selisihFisikM3 - akumulasiTaksasiM3`.
 *      - Jika `netto < 0` (kredit taksasi > selisih fisik):
 *        -> JANGAN dipotong otomatis! Tandai `isAnomaliKreditTaksasi = true` (status `ANOMALY` untuk koreksi manual).
 *      - Jika `netto >= 0`:
 *        -> `pakaiTagihM3 = netto` (TANPA dikenakan minimum 5 m3 lagi setelah dikurangi kredit taksasi,
 *           karena sepanjang rentang waktu taksasi + bacaan fisik, total pemakaian fisik riil adalah `selisihFisikM3`.
 *           Jika `netto` dipaksa naik ke minimum 5 m3 [mis. taksasi 5, selisih fisik 7 -> netto 2 dipaksa jadi 5],
 *           maka total ditagih menjadi 5 + 5 = 10 m3 != 7 m3 dan MELANGGAR prinsip total ditagih == pemakaian fisik!).
 *        -> `akumulasiTaksasiBerikutnya = 0` (di-reset setelah bacaan fisik terverifikasi).
 *    - Jika `akumulasiTaksasiM3 === 0` (bacaan fisik bulanan normal tanpa kredit taksasi):
 *      - `pakaiTagihM3 = pemakaianMinimumM3 > 0 && selisihFisikM3 < pemakaianMinimumM3 ? pemakaianMinimumM3 : selisihFisikM3`.
 */
export function hitungPemakaianDanRekonsiliasiTaksasi(
  input: HitungPemakaianBerbasisModeInput
): HasilHitungPemakaianBerbasisMode {
  const {
    stml,
    stma,
    modeHitung,
    pakaiLalu,
    pemakaianMinimumM3,
    akumulasiTaksasiM3 = 0,
    akumulasiPerluVerifikasi = false,
    tagihanSaatKelebihan = 'MINIMUM',
    standAngkat = null,
    standPasang = 0,
  } = input;

  // 1. Mode NOL (TIDAK ADA AIR / DICABUT)
  if (modeHitung === 'NOL') {
    return {
      stmlAsli: stml,
      stmaEfektif: stml,
      selisihFisikM3: 0,
      pakaiTagihM3: 0,
      akumulasiTaksasiDikurangkan: 0,
      akumulasiTaksasiBerikutnya: akumulasiTaksasiM3,
      isAnomaliKreditTaksasi: false,
      isStandTetap: false,
      perluReviewVerifikatorAkumulasi: false,
      alasanTaksir: 'NOL_TIDAK_ADA_AIR',
      pesanAnomali: null,
    };
  }

  // 2. Mode METER_BARU (4 | MB - Pergantian Water Meter Baru)
  // Pada meter baru, stml di DPM masih angka meter lama (mis. 1452), sedangkan stma adalah angka meter baru yang mulai dari standPasang (default 0, mis. 7).
  // - Jika ada standAngkat meter lama: pemakaian fisik = max(0, standAngkat - stml) + max(0, stma - standPasang).
  // - Jika belum ada standAngkat: pemakaian fisik dihitung dari meter baru = max(0, stma - standPasang).
  // - Diterapkan pemakaianMinimumM3 (mis. 5 m3) jika pemakaian fisik < pemakaianMinimumM3.
  // - Tidak pernah menghasilkan kubikasi negatif meskipun stma < stml, dan me-reset akumulasi_taksasi_m3 meter lama ke 0.
  if (modeHitung === 'METER_BARU') {
    const awalMeterBaru = standPasang !== null && standPasang >= 0 ? standPasang : 0;
    const pakaiMeterLama =
      standAngkat !== null && standAngkat >= stml ? standAngkat - stml : 0;
    const pakaiMeterBaru = Math.max(0, stma - awalMeterBaru);
    const selisihFisikMb = pakaiMeterLama + pakaiMeterBaru;
    const pakaiTagihMb =
      pemakaianMinimumM3 > 0 && selisihFisikMb < pemakaianMinimumM3
        ? pemakaianMinimumM3
        : selisihFisikMb;

    return {
      stmlAsli: stml,
      stmaEfektif: stma,
      selisihFisikM3: selisihFisikMb,
      pakaiTagihM3: pakaiTagihMb,
      akumulasiTaksasiDikurangkan: akumulasiTaksasiM3,
      akumulasiTaksasiBerikutnya: 0,
      isAnomaliKreditTaksasi: false,
      isStandTetap: false,
      perluReviewVerifikatorAkumulasi: false,
      alasanTaksir:
        pemakaianMinimumM3 > 0 && selisihFisikMb < pemakaianMinimumM3
          ? 'MINIMUM_5M3'
          : 'METER_BARU_RESET',
      pesanAnomali: null,
    };
  }

  // 3. Mode KREDIT_TAKSASI (M | KELEBIHAN - Stand sistem/kredit taksasi masih lebih tinggi dari pemakaian fisik)
  // - Stand fisik disimpan apa adanya (stmaEfektif = stma; stml tidak digeser/dimundurkan).
  // - akumulasi_taksasi_m3 dikurangi sebesar selisih fisik yang terpakai (max(0, stma - stml)), sisa kredit dibawa ke bulan berikutnya.
  // - Jika selisih fisik sudah melampaui sisa kredit (selisihFisik > akumulasiTaksasiM3), kredit habis (0) dan kelebihannya ditagihkan.
  // - Jika kredit masih tersisa (selisihFisik <= akumulasiTaksasiM3), tagihan bulan berjalan mengikuti tagihanSaatKelebihan ('NOL' | 'MINIMUM').
  if (modeHitung === 'KREDIT_TAKSASI') {
    const selisihFisikKredit = Math.max(0, stma - stml);
    if (selisihFisikKredit > akumulasiTaksasiM3 && akumulasiTaksasiM3 > 0) {
      const nettoHabis = selisihFisikKredit - akumulasiTaksasiM3;
      return {
        stmlAsli: stml,
        stmaEfektif: stma,
        selisihFisikM3: selisihFisikKredit,
        pakaiTagihM3: nettoHabis,
        akumulasiTaksasiDikurangkan: akumulasiTaksasiM3,
        akumulasiTaksasiBerikutnya: 0,
        isAnomaliKreditTaksasi: false,
        isStandTetap: false,
        perluReviewVerifikatorAkumulasi: akumulasiPerluVerifikasi,
        alasanTaksir: 'REKONSILIASI_TAKSASI_LALU',
        pesanAnomali: null,
      };
    }

    const kreditTerserap = Math.min(akumulasiTaksasiM3, selisihFisikKredit);
    const sisaKredit = Math.max(0, akumulasiTaksasiM3 - selisihFisikKredit);
    const pakaiTagihKelebihan =
      tagihanSaatKelebihan === 'MINIMUM' ? pemakaianMinimumM3 : 0;

    return {
      stmlAsli: stml,
      stmaEfektif: stma,
      selisihFisikM3: selisihFisikKredit,
      pakaiTagihM3: pakaiTagihKelebihan,
      akumulasiTaksasiDikurangkan: kreditTerserap,
      akumulasiTaksasiBerikutnya: sisaKredit,
      isAnomaliKreditTaksasi: false,
      isStandTetap: false,
      perluReviewVerifikatorAkumulasi: akumulasiPerluVerifikasi,
      alasanTaksir: 'KREDIT_TAKSASI_KELEBIHAN',
      pesanAnomali: null,
    };
  }

  // 4. Mode TAKSASI_HISTORI (Ketika meter tidak terbaca fisik / stma == stml)
  if (modeHitung === 'TAKSASI_HISTORI' && stma === stml) {
    const basisLalu = pakaiLalu !== null && pakaiLalu > 0 ? pakaiLalu : 0;
    const pakaiTaksir = Math.max(basisLalu, pemakaianMinimumM3);
    return {
      stmlAsli: stml,
      stmaEfektif: stml,
      selisihFisikM3: 0,
      pakaiTagihM3: pakaiTaksir,
      akumulasiTaksasiDikurangkan: 0,
      akumulasiTaksasiBerikutnya: akumulasiTaksasiM3 + pakaiTaksir,
      isAnomaliKreditTaksasi: false,
      isStandTetap: false,
      perluReviewVerifikatorAkumulasi: akumulasiPerluVerifikasi,
      alasanTaksir: 'TAKSIRAN_BULAN_LALU',
      pesanAnomali: null,
    };
  }

  // 5. Bacaan Fisik (SELISIH_FISIK, atau kondisi kendala yang ternyata stma > stml)
  const selisihFisikM3 = stma - stml;
  const isStandTetapNormal = modeHitung === 'SELISIH_FISIK' && stma === stml;

  if (akumulasiTaksasiM3 > 0) {
    // Jika kondisi Normal namun stma == stml sementara punya akumulasi taksasi,
    // tandai STAND_TETAP agar verifikator memutuskan apakah ditaksir atau klaim kredit taksasi.
    if (isStandTetapNormal) {
      const pakaiMin = pemakaianMinimumM3 > 0 ? pemakaianMinimumM3 : 0;
      return {
        stmlAsli: stml,
        stmaEfektif: stma,
        selisihFisikM3: 0,
        pakaiTagihM3: pakaiMin,
        akumulasiTaksasiDikurangkan: 0,
        akumulasiTaksasiBerikutnya: akumulasiTaksasiM3,
        isAnomaliKreditTaksasi: false,
        isStandTetap: true,
        perluReviewVerifikatorAkumulasi: akumulasiPerluVerifikasi,
        alasanTaksir: 'STAND_TETAP',
        pesanAnomali: null,
      };
    }

    const netto = selisihFisikM3 - akumulasiTaksasiM3;
    if (netto < 0) {
      return {
        stmlAsli: stml,
        stmaEfektif: stma,
        selisihFisikM3,
        pakaiTagihM3: netto,
        akumulasiTaksasiDikurangkan: akumulasiTaksasiM3,
        akumulasiTaksasiBerikutnya: akumulasiTaksasiM3,
        isAnomaliKreditTaksasi: true,
        isStandTetap: false,
        perluReviewVerifikatorAkumulasi: akumulasiPerluVerifikasi,
        alasanTaksir: 'ANOMALI_KREDIT_TAKSASI',
        pesanAnomali: `Kredit akumulasi taksasi (${akumulasiTaksasiM3} m³) lebih besar dari selisih fisik meter (${selisihFisikM3} m³), menghasilkan selisih negatif (${netto} m³). Wajib dilakukan verifikasi/penetapan kondisi M (KELEBIHAN) atau koreksi manual.`,
      };
    }

    return {
      stmlAsli: stml,
      stmaEfektif: stma,
      selisihFisikM3,
      pakaiTagihM3: netto,
      akumulasiTaksasiDikurangkan: akumulasiTaksasiM3,
      akumulasiTaksasiBerikutnya: 0,
      isAnomaliKreditTaksasi: false,
      isStandTetap: false,
      perluReviewVerifikatorAkumulasi: akumulasiPerluVerifikasi,
      alasanTaksir: 'REKONSILIASI_TAKSASI_LALU',
      pesanAnomali: null,
    };
  }

  // Bacaan fisik normal dengan stma == stml (STAND_TETAP): tetap SELISIH_FISIK (dikenai minimum),
  // namun ditandai isStandTetap = true dan alasanTaksir = 'STAND_TETAP' agar verifikator memutuskan.
  if (isStandTetapNormal) {
    const pakaiMin = pemakaianMinimumM3 > 0 ? pemakaianMinimumM3 : 0;
    return {
      stmlAsli: stml,
      stmaEfektif: stma,
      selisihFisikM3: 0,
      pakaiTagihM3: pakaiMin,
      akumulasiTaksasiDikurangkan: 0,
      akumulasiTaksasiBerikutnya: 0,
      isAnomaliKreditTaksasi: false,
      isStandTetap: true,
      perluReviewVerifikatorAkumulasi: false,
      alasanTaksir: 'STAND_TETAP',
      pesanAnomali: null,
    };
  }

  // Bacaan fisik normal tanpa akumulasi taksasi sebelumnya
  if (pemakaianMinimumM3 > 0 && selisihFisikM3 >= 0 && selisihFisikM3 < pemakaianMinimumM3) {
    return {
      stmlAsli: stml,
      stmaEfektif: stma,
      selisihFisikM3,
      pakaiTagihM3: pemakaianMinimumM3,
      akumulasiTaksasiDikurangkan: 0,
      akumulasiTaksasiBerikutnya: 0,
      isAnomaliKreditTaksasi: false,
      isStandTetap: false,
      perluReviewVerifikatorAkumulasi: false,
      alasanTaksir: 'MINIMUM_5M3',
      pesanAnomali: null,
    };
  }

  return {
    stmlAsli: stml,
    stmaEfektif: stma,
    selisihFisikM3,
    pakaiTagihM3: selisihFisikM3,
    akumulasiTaksasiDikurangkan: 0,
    akumulasiTaksasiBerikutnya: 0,
    isAnomaliKreditTaksasi: false,
    isStandTetap: false,
    perluReviewVerifikatorAkumulasi: false,
    alasanTaksir: null,
    pesanAnomali: null,
  };
}

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
