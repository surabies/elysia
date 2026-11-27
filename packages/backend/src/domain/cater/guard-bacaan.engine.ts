/**
 * Domain Engine: Guard Ketat Pembacaan Meter (Meter Baru, Muda Kembali, & Kubikasi Negatif)
 * Single Source of Truth (SSOT) untuk menahan lolosnya data belum valid pada:
 * - Verifikasi Langsung & Verifikasi Massal (V1, V2, V3)
 * - Posting Datameter Massal
 * - Pratinjau & Eksekusi Closing Tutup Bulan (Gate 4)
 *
 * Prinsip Utama: "Strict Default Guard + Explicit Human Override"
 */

import { hitungKubikasiMudaKembali } from '../gwm/gwm.engine';

export interface GuardBacaanInput {
  stml: string | number | null | undefined;
  stma: string | number | null | undefined;
  stmlRevisi?: string | number | null | undefined;
  stmaRevisi?: string | number | null | undefined;
  pakaiM3?: string | number | null | undefined;
  pakaiM3Revisi?: string | number | null | undefined;
  pakaiTagih?: string | number | null | undefined;
  tmss?: string | null | undefined;
  ketCatat?: string | null | undefined;
  ketCatatRevisi?: string | null | undefined;
  standAngkatRevisi?: string | number | null | undefined;
  standMeterBaruRevisi?: string | number | null | undefined;
  standAngkatMutasi?: string | number | null | undefined;
  mbTanpaStandAngkat?: boolean | null | undefined;
  digitRollover?: number | null | undefined;
  ukuranMeter?: string | null | undefined;
  jumlahDigitAset?: number | null | undefined;
  statusVerifikasi?: string | null | undefined;
}

export type KodeBlokirGuard =
  | 'STATUS_TERTAHAN'
  | 'MB_BUTUH_STAND_ANGKAT'
  | 'MB_STAND_ANGKAT_MUNDUR'
  | 'ROLLOVER_DIGIT_INVALID'
  | 'ROLLOVER_BUTUH_KONFIRMASI'
  | 'KUBIKASI_NEGATIF'
  | 'STAND_MUNDUR_NORMAL'
  | 'STAND_MUNDUR_BUTUH_VERIFIKASI';

export interface HasilEvaluasiGuard {
  lolos: boolean;
  lolosDataMurni: boolean;
  kodeBlokir: KodeBlokirGuard | null;
  pesanBlokir: string | null;
  isMB: boolean;
  isMudaKembali: boolean;
  stmlEfektif: number;
  stmaEfektif: number;
  pakaiEfektif: number;
}

export const BLOCKING_STATUS_SET: ReadonlySet<string> = new Set([
  'NEED_RESURVEY',
  'ANOMALY',
  'ANOMALY_NEGATIVE',
  'DRAFT',
]);

const KONDISI_SELISIH_WAJIB_MAJU: ReadonlySet<string> = new Set([
  '',
  '-',
  'NORMAL',
  'NIHIL',
  'REV.PENCATAT',
  'REV_PENCATAT',
  'REVISI PENCATAT',
  'REV.PENGADUAN',
  'REV_PENGADUAN',
  'STAN CICILAN',
  'STAN_CICILAN',
]);

export function evaluasiGuardBacaanMeter(row: GuardBacaanInput): HasilEvaluasiGuard {
  const stmlEfektif = Number(row.stmlRevisi ?? row.stml ?? 0);
  const stmaEfektif = Number(
    row.standMeterBaruRevisi ?? row.stmaRevisi ?? row.stma ?? 0,
  );
  const pakaiEfektif = Number(
    row.pakaiTagih ?? row.pakaiM3Revisi ?? row.pakaiM3 ?? 0,
  );

  const hasKondisiRevisi =
    row.ketCatatRevisi != null && String(row.ketCatatRevisi).trim() !== '';
  const kondisiUpper = String(row.ketCatatRevisi ?? row.ketCatat ?? '')
    .trim()
    .toUpperCase();
  const tmssUpper = String(row.tmss ?? '')
    .trim()
    .toUpperCase();

  const isMB =
    kondisiUpper === 'MB' || (!hasKondisiRevisi && tmssUpper === '4');
  const isMudaKembali =
    kondisiUpper === 'MUDA KEMBALI' ||
    kondisiUpper === 'MUDA_KEMBALI' ||
    (!hasKondisiRevisi && tmssUpper === 'U');
  const isKreditTaksasi =
    kondisiUpper === 'KELEBIHAN' || (!hasKondisiRevisi && tmssUpper === 'M');

  const standAngkatEfektif =
    row.standAngkatRevisi != null
      ? Number(row.standAngkatRevisi)
      : row.standAngkatMutasi != null
        ? Number(row.standAngkatMutasi)
        : null;
  const mbOverride = Boolean(row.mbTanpaStandAngkat);

  let kodeData: KodeBlokirGuard | null = null;
  let pesanData: string | null = null;

  // 1. Guard Meter Baru (MB): Wajib ada Stand Angkat >= Stand Awal ATAU Override Manusia Eksplisit
  if (isMB) {
    if (standAngkatEfektif === null && !mbOverride) {
      kodeData = 'MB_BUTUH_STAND_ANGKAT';
      pesanData =
        'Laporan Meter Baru (MB) belum memiliki Stand Angkat meter lama. Isi Stand Angkat atau aktifkan Override Tanpa Stand Angkat pada form Koreksi.';
    } else if (
      standAngkatEfektif !== null &&
      standAngkatEfektif < stmlEfektif &&
      !mbOverride
    ) {
      kodeData = 'MB_STAND_ANGKAT_MUNDUR';
      pesanData = `Stand Angkat (${standAngkatEfektif.toLocaleString('id-ID')}) lebih kecil dari Stand Awal (${stmlEfektif.toLocaleString('id-ID')}). Periksa kembali atau gunakan Override bila meter lama rusak.`;
    }
  }

  // 2. Guard Muda Kembali (Rollover): Validasi kapasitas digit & zona ambang atas
  if (!kodeData && isMudaKembali && stmaEfektif < stmlEfektif) {
    const hasilRollover = hitungKubikasiMudaKembali({
      standAwal: stmlEfektif,
      standAkhir: stmaEfektif,
      ukuranMeter: row.ukuranMeter ?? null,
      jumlahDigitAset: row.jumlahDigitAset ?? null,
      digitOverride: row.digitRollover ?? null,
    });
    if (!hasilRollover.isValid) {
      kodeData = 'ROLLOVER_DIGIT_INVALID';
      pesanData =
        hasilRollover.pesanError ??
        'Kapasitas digit Muda Kembali tidak sesuai dengan angka stand.';
    } else if (
      !hasilRollover.isNearRolloverZone &&
      row.digitRollover == null
    ) {
      kodeData = 'ROLLOVER_BUTUH_KONFIRMASI';
      pesanData =
        hasilRollover.peringatanPlausibilitas ??
        'Stand awal Muda Kembali masih jauh dari batas maksimum register; wajib dikonfirmasi kapasitas digitnya oleh verifikator.';
    }
  }

  // 3. Guard Kubikasi Negatif (Minus)
  if (!kodeData && pakaiEfektif < 0) {
    kodeData = 'KUBIKASI_NEGATIF';
    pesanData = `Pemakaian bernilai minus (${pakaiEfektif.toLocaleString('id-ID')} m³). Wajib dikoreksi sebagai Meter Baru (MB), Muda Kembali, atau perbaikan stand.`;
  }

  // 4. Guard Stand Mundur yang Belum Terselesaikan (stmaEfektif < stmlEfektif di luar MB, Muda Kembali, & Kelebihan)
  if (
    !kodeData &&
    stmaEfektif < stmlEfektif &&
    !isMB &&
    !isMudaKembali &&
    !isKreditTaksasi
  ) {
    const adaKoreksiManusia =
      row.stmaRevisi != null ||
      row.pakaiM3Revisi != null ||
      row.pakaiTagih != null;

    if (KONDISI_SELISIH_WAJIB_MAJU.has(kondisiUpper)) {
      kodeData = 'STAND_MUNDUR_NORMAL';
      pesanData = `Stand akhir (${stmaEfektif.toLocaleString('id-ID')}) lebih kecil dari stand awal (${stmlEfektif.toLocaleString('id-ID')}) pada kondisi ${kondisiUpper || 'Normal'}. Pilih kondisi Meter Baru (MB), Muda Kembali, atau koreksi stand.`;
    } else if (!adaKoreksiManusia) {
      kodeData = 'STAND_MUNDUR_BUTUH_VERIFIKASI';
      pesanData = `Stand akhir (${stmaEfektif.toLocaleString('id-ID')}) lebih kecil dari stand awal (${stmlEfektif.toLocaleString('id-ID')}) dan belum dikonfirmasi verifikator.`;
    }
  }

  const lolosDataMurni = kodeData === null;
  const statusStr = String(row.statusVerifikasi ?? '').trim().toUpperCase();
  const statusTertahan = BLOCKING_STATUS_SET.has(statusStr);

  if (!lolosDataMurni) {
    return {
      lolos: false,
      lolosDataMurni: false,
      kodeBlokir: kodeData,
      pesanBlokir: pesanData,
      isMB,
      isMudaKembali,
      stmlEfektif,
      stmaEfektif,
      pakaiEfektif,
    };
  }

  if (statusTertahan) {
    return {
      lolos: false,
      lolosDataMurni: true,
      kodeBlokir: 'STATUS_TERTAHAN',
      pesanBlokir:
        statusStr === 'NEED_RESURVEY'
          ? 'Laporan sedang dalam status Cek Ulang Lapangan (NEED_RESURVEY).'
          : `Laporan berstatus ${statusStr} dan memerlukan peninjauan koreksi terlebih dahulu.`,
      isMB,
      isMudaKembali,
      stmlEfektif,
      stmaEfektif,
      pakaiEfektif,
    };
  }

  return {
    lolos: true,
    lolosDataMurni: true,
    kodeBlokir: null,
    pesanBlokir: null,
    isMB,
    isMudaKembali,
    stmlEfektif,
    stmaEfektif,
    pakaiEfektif,
  };
}
