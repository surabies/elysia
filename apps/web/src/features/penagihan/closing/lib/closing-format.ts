import type { BadgeProps } from '@/components/ui/badge';
import type {
  ClosingStepEvaluation,
  ClosingWizardStep,
  OperatorFeedback,
  PratinjauData,
  StandAngkatMutasiItem,
  WorkflowStageCategory,
  WorkflowStageItem,
  WorkflowStageStatus,
} from '../types';

export const DEFAULT_CLOSING_PERIODE = '202611';
export const DEFAULT_NEXT_PERIODE = '202612';
export const DEFAULT_DUE_DATE = '2026-12-20';
export const CLOSING_ONBOARDING_STORAGE_KEY = 'cater_closing_onboarding_seen_v1';
export const CLOSING_SESSION_STATE_KEY = 'cater_closing_wizard_session_v2';

const BULAN_NAMA_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

const idNumberFormatter = new Intl.NumberFormat('id-ID');

export function formatPeriodeLabelId(periode: string | null | undefined): string {
  if (!periode || !/^\d{6}$/.test(periode)) return periode ?? '—';
  const year = periode.slice(0, 4);
  const monthIdx = parseInt(periode.slice(4, 6), 10) - 1;
  const bulan = BULAN_NAMA_ID[monthIdx] ?? 'Bulan';
  return `${bulan} ${year}`;
}

export function computeNextPeriode(periode: string): string {
  if (!/^\d{6}$/.test(periode)) return DEFAULT_NEXT_PERIODE;
  const year = parseInt(periode.slice(0, 4), 10);
  const month = parseInt(periode.slice(4, 6), 10);
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return DEFAULT_NEXT_PERIODE;
  }
  if (month === 12) return `${year + 1}01`;
  return `${year}${String(month + 1).padStart(2, '0')}`;
}

export function computeDefaultDueDate(periode: string): string {
  const next = computeNextPeriode(periode);
  if (!/^\d{6}$/.test(next)) return DEFAULT_DUE_DATE;
  return `${next.slice(0, 4)}-${next.slice(4, 6)}-20`;
}

export function formatAngkaId(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return idNumberFormatter.format(value);
}

export function formatRupiahId(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Rp 0';
  return `Rp ${idNumberFormatter.format(value)}`;
}

export function formatTanggalWaktuId(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function getClosingConfirmPhrase(periode: string): string {
  return `TUTUP ${periode.trim()}`;
}

export function getStageCategoryLabel(kategori: WorkflowStageCategory): string {
  switch (kategori) {
    case 'PRA_CLOSING':
      return 'Persiapan Data';
    case 'EKSEKUSI':
      return 'Kunci & Tagihan';
    case 'PASCA_CLOSING':
      return 'Persiapan Bulan Baru';
    case 'MONITORING':
      return 'Pemeriksaan';
    default:
      return kategori;
  }
}

export function getStageStatusBadgeVariant(
  status: WorkflowStageStatus,
): NonNullable<BadgeProps['variant']> {
  switch (status) {
    case 'SELESAI':
      return 'green-subtle';
    case 'SIAP':
      return 'blue-subtle';
    case 'PERLU_TINDAKAN':
      return 'amber-subtle';
    case 'TERKUNCI':
      return 'secondary';
    case 'MENUNGGU':
    default:
      return 'subtle';
  }
}

export function getStageStatusLabel(status: WorkflowStageStatus): string {
  switch (status) {
    case 'SELESAI':
      return 'Selesai';
    case 'SIAP':
      return 'Siap';
    case 'PERLU_TINDAKAN':
      return 'Perlu Tindakan';
    case 'TERKUNCI':
      return 'Terkunci';
    case 'MENUNGGU':
      return 'Menunggu';
    default:
      return status;
  }
}

export function calculateVerificationRate(
  selesaiV3: number | undefined,
  total: number | undefined,
): number {
  if (!total || total <= 0) return 0;
  return Math.round(((selesaiV3 ?? 0) / total) * 100);
}

export function buildOperatorErrorFeedback(
  rawError: unknown,
  fallbackTitle = 'Proses Tidak Dapat Dilanjutkan',
): OperatorFeedback {
  const rawMessage =
    rawError instanceof Error
      ? rawError.message
      : typeof rawError === 'string'
        ? rawError
        : 'Terjadi gangguan komunikasi dengan server.';

  let nextAction =
    'Periksa kembali syarat pada tahap yang sedang aktif, atau klik tombol "Muat Ulang" di kanan atas lalu coba kembali.';

  if (rawMessage.includes('pergantian meter') || rawMessage.includes('MUTASI')) {
    nextAction =
      'Buka Tahap 1 (Cek Kesiapan Data) lalu setujui pergantian meter yang masih menunggu.';
  } else if (
    rawMessage.includes('Survei Ulang') ||
    rawMessage.includes('Anomali') ||
    rawMessage.includes('Kubikasi Negatif')
  ) {
    nextAction =
      'Buka menu Verifikasi Baca Petugas (/verifikasi/baca-petugas) atau Koreksi Stand (/progres/koreksi) untuk menyelesaikan bacaan anomali sebelum pengesahan massal.';
  } else if (
    rawMessage.includes('BELUM_DICATAT') ||
    rawMessage.includes('belum mencapai 100%')
  ) {
    nextAction =
      'Lengkapi pelanggan yang belum tercatat melalui menu Manual ADD (/pelanggan/manual-add) atau Hitung Rata-Rata (/meter/hitung-rata-rata).';
  } else if (
    rawMessage.includes('belum disahkan') ||
    rawMessage.includes('VERIFIKASI')
  ) {
    nextAction =
      'Buka Tahap 2 (Sahkan Bacaan Meter) lalu klik tombol "Sahkan Bacaan Meter".';
  } else if (rawMessage.includes('AKSES_DITOLAK')) {
    nextAction =
      'Masuk menggunakan akun Admin Billing, Supervisor (V3), atau Superadmin yang memiliki izin mengeksekusi tutup buku.';
  } else if (rawMessage.includes('sudah ditutup') || rawMessage.includes('TERKUNCI')) {
    nextAction =
      'Periode ini sudah selesai ditutup. Anda dapat langsung membuka Tahap 4 untuk menyiapkan jadwal bulan berikutnya.';
  }

  return {
    type: 'error',
    title: fallbackTitle,
    message: rawMessage.replace(/^AKSES_DITOLAK:\s*/i, ''),
    dataImpact:
      'Data tagihan dan catatan meter Anda tetap utuh 100% (tidak ada perubahan setengah jalan karena sistem membatalkan proses secara otomatis).',
    nextAction,
  };
}

export interface EvaluateWizardParams {
  stages: WorkflowStageItem[];
  pratinjau: PratinjauData | null;
  standAngkatList: StandAngkatMutasiItem[];
  reviewConfirmed: boolean;
  tanggalJatuhTempo: string;
}

/**
 * Evaluasi Alur 4 Tahap Inti Tutup Bulan:
 * Tahap 1: Cek Kesiapan Data (Cakupan DPM 100%, Stand Angkat 0 Pending, Rute & Tarif Valid)
 * Tahap 2: Sahkan Bacaan Meter (0 Anomali Menggantung & 100% Bacaan APPROVED_FINAL)
 * Tahap 3: Tinjau DRD & Kunci Buku (Periksa Angka Tagihan, Jatuh Tempo, & Eksekusi Kunci Buku)
 * Tahap 4: Bukti Tutup Buku & Buka Bulan Baru (Inisialisasi DPM N+1 Terpadu)
 */
export function evaluateClosingWizardSteps({
  stages,
  pratinjau,
  standAngkatList,
  reviewConfirmed: _reviewConfirmed,
  tanggalJatuhTempo,
}: EvaluateWizardParams): {
  steps: ClosingStepEvaluation[];
  recommendedStep: ClosingWizardStep;
} {
  const isLocked = pratinjau?.status === 'TERKUNCI';

  // --- TAHAP 1: CEK KESIAPAN DATA ---
  const totalBacaan = pratinjau?.pembacaan.total ?? 0;
  const dpmBelumSelesai = pratinjau?.daftarCatat.belumSelesai ?? 0;
  const pendingMutasi = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'PENDING',
  ).length;
  const stageZonasi = stages.find((s) => s.id === 'update-zonasi');
  const stagePbpk = stages.find((s) => s.id === 'pbpk');
  const tanpaRuteCount = Number(stageZonasi?.detail?.tanpaRute ?? 0);
  const tanpaTarifCount = Number(stagePbpk?.detail?.tanpaTarif ?? 0);

  const step1Blockers: string[] = [];
  if (!isLocked) {
    if (totalBacaan === 0) {
      step1Blockers.push('Belum ada data hasil bacaan meter pada periode ini.');
    }
    if (dpmBelumSelesai > 0) {
      step1Blockers.push(
        `Masih ada ${formatAngkaId(dpmBelumSelesai)} pelanggan aktif yang belum dicatat (${pratinjau?.daftarCatat.readRatePersen ?? 0}%). Lengkapi lewat Manual ADD atau Hitung Rata-Rata.`,
      );
    }
    if (pendingMutasi > 0) {
      step1Blockers.push(
        `Masih ada ${formatAngkaId(pendingMutasi)} pergantian meter air yang menunggu persetujuan.`,
      );
    }
    if (tanpaRuteCount > 0) {
      step1Blockers.push(
        `Terdapat ${formatAngkaId(tanpaRuteCount)} pelanggan yang belum memiliki kode rute baca.`,
      );
    }
    if (tanpaTarifCount > 0) {
      step1Blockers.push(
        `Terdapat ${formatAngkaId(tanpaTarifCount)} pelanggan yang belum memiliki golongan tarif.`,
      );
    }
  }
  const step1Done = isLocked || step1Blockers.length === 0;

  // --- TAHAP 2: SAHKAN BACAAN METER ---
  const butuhKoreksi = pratinjau?.verifikasi.butuhKoreksi ?? 0;
  const belumDisahkan = pratinjau?.verifikasi.belumSelesai ?? 0;
  const siapDisahkan =
    pratinjau?.verifikasi.siapDisahkan ?? Math.max(0, belumDisahkan - butuhKoreksi);

  const step2Blockers: string[] = [];
  if (!step1Done) {
    step2Blockers.push('Selesaikan pemeriksaan kesiapan pada Tahap 1 terlebih dahulu.');
  }
  if (butuhKoreksi > 0 && !isLocked) {
    step2Blockers.push(
      `Terdapat ${formatAngkaId(butuhKoreksi)} bacaan berstatus Anomali / Perlu Survei Ulang yang wajib diselesaikan di Verifikasi Petugas atau Koreksi Stand.`,
    );
  }
  if (siapDisahkan > 0 && !isLocked) {
    step2Blockers.push(
      `Masih ada ${formatAngkaId(siapDisahkan)} hasil baca meter yang menunggu pengesahan. Klik tombol "Sahkan Bacaan Meter".`,
    );
  } else if (belumDisahkan > 0 && butuhKoreksi === 0 && !isLocked) {
    step2Blockers.push(
      `Masih ada ${formatAngkaId(belumDisahkan)} hasil baca meter yang belum disahkan. Klik tombol "Sahkan Bacaan Meter".`,
    );
  }

  const step2Done =
    isLocked || (step1Done && butuhKoreksi === 0 && belumDisahkan === 0);

  // --- TAHAP 3: TINJAU DRD & KUNCI BUKU ---
  const isDueDateValid = Boolean(
    tanggalJatuhTempo && !Number.isNaN(new Date(tanggalJatuhTempo).getTime()),
  );
  const step3Blockers: string[] = [];
  if (!step2Done) {
    step3Blockers.push(
      'Selesaikan pengesahan bacaan meter pada Tahap 2 terlebih dahulu.',
    );
  }
  if (!isDueDateValid && !isLocked) {
    step3Blockers.push('Tanggal jatuh tempo pembayaran wajib diisi dengan benar.');
  }
  if (!isLocked && pratinjau && !pratinjau.bisaDitutup && step2Done) {
    for (const h of pratinjau.hambatan) {
      step3Blockers.push(h.pesan);
    }
  }
  const step3Done = isLocked;

  // --- TAHAP 4: BUKTI TUTUP BUKU & BUKA BULAN BARU ---
  const stageBulanBaru = stages.find((s) => s.id === 'create-bulan-baru');
  const hasNextPeriod = Boolean(stageBulanBaru?.detail?.hasNextPeriod);
  const step4Blockers: string[] = [];
  if (!isLocked) {
    step4Blockers.push('Kunci buku periode berjalan pada Tahap 3 terlebih dahulu.');
  }
  const step4Done = isLocked && hasNextPeriod;

  const steps: ClosingStepEvaluation[] = [
    {
      step: 1,
      title: '1. Cek Kesiapan Data',
      subtitle:
        'Pemeriksaan otomatis cakupan catat lapangan 100%, persetujuan ganti meter, dan kelengkapan data pelanggan.',
      operatorTask: step1Done
        ? 'Seluruh syarat kesiapan terpenuhi. Lanjutkan ke Tahap 2.'
        : 'Selesaikan item bertanda kuning di bawah sebelum melanjutkan.',
      isCompleted: step1Done,
      canProceed: step1Done,
      blockerReasons: step1Blockers,
    },
    {
      step: 2,
      title: '2. Sahkan Bacaan Meter',
      subtitle:
        'Mengesahkan seluruh hasil bacaan meter yang valid menjadi APPROVED_FINAL agar siap dihitung ke rekening DRD.',
      operatorTask: step2Done
        ? 'Seluruh bacaan meter telah disahkan. Lanjutkan ke Tahap 3.'
        : 'Klik tombol "Sahkan Bacaan Meter" untuk mengesahkan bacaan.',
      isCompleted: step2Done,
      canProceed: step2Done,
      blockerReasons: step2Blockers,
    },
    {
      step: 3,
      title: '3. Tinjau DRD & Kunci Buku',
      subtitle:
        'Periksa proyeksi jumlah rekening, pemakaian air (m³), total rupiah tagihan, tentukan jatuh tempo, lalu kunci buku.',
      operatorTask: isLocked
        ? 'Buku periode ini telah dikunci permanen.'
        : 'Centang pernyataan pemeriksaan lalu klik "Kunci Buku & Terbitkan DRD".',
      isCompleted: step3Done,
      canProceed: step3Done,
      blockerReasons: step3Blockers,
    },
    {
      step: 4,
      title: '4. Buka Jadwal Bulan Baru',
      subtitle:
        'Bukti resmi penutupan buku periode ini dan pembukaan daftar target catat meter (DPM) untuk bulan berikutnya.',
      operatorTask: step4Done
        ? 'Siklus bulan baru telah aktif dan siap digunakan.'
        : 'Klik "Buka Jadwal Bulan Baru" untuk menyiapkan target catat bulan depan.',
      isCompleted: step4Done,
      canProceed: true,
      blockerReasons: step4Blockers,
    },
  ];

  let recommendedStep: ClosingWizardStep = 1;
  if (isLocked) {
    recommendedStep = 4;
  } else if (step2Done) {
    recommendedStep = 3;
  } else if (step1Done) {
    recommendedStep = 2;
  } else {
    recommendedStep = 1;
  }

  return { steps, recommendedStep };
}
