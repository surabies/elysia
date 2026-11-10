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

export const DEFAULT_CLOSING_PERIODE = '202601';
export const DEFAULT_NEXT_PERIODE = '202602';
export const DEFAULT_DUE_DATE = '2026-02-20';
export const CLOSING_ONBOARDING_STORAGE_KEY = 'cater_closing_onboarding_seen_v1';
export const CLOSING_SESSION_STATE_KEY = 'cater_closing_wizard_session_v1';

const idNumberFormatter = new Intl.NumberFormat('id-ID');

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
    'Periksa kembali syarat pada langkah yang sedang aktif, atau klik tombol "Muat Ulang" di pojok kanan atas lalu coba kembali.';

  if (rawMessage.includes('pergantian meter') || rawMessage.includes('MUTASI')) {
    nextAction =
      'Buka Langkah 1 (Pengecekan Awal) lalu klik "Tinjau Ganti Meter" untuk menyetujui atau menolak pergantian meter yang masih menunggu.';
  } else if (
    rawMessage.includes('belum disahkan') ||
    rawMessage.includes('VERIFIKASI')
  ) {
    nextAction =
      'Buka Langkah 2 (Pengesahan Bacaan Meter) lalu klik tombol "Sahkan Seluruh Bacaan Meter".';
  } else if (rawMessage.includes('AKSES_DITOLAK')) {
    nextAction =
      'Masuk menggunakan akun Supervisor atau Admin Billing yang memiliki izin untuk menjalankan tutup buku.';
  } else if (rawMessage.includes('sudah ditutup') || rawMessage.includes('TERKUNCI')) {
    nextAction =
      'Periode ini sudah selesai ditutup. Anda dapat langsung membuka Langkah 5 untuk menyiapkan jadwal bulan berikutnya.';
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

export function evaluateClosingWizardSteps({
  stages,
  pratinjau,
  standAngkatList,
  reviewConfirmed,
  tanggalJatuhTempo,
}: EvaluateWizardParams): {
  steps: ClosingStepEvaluation[];
  recommendedStep: ClosingWizardStep;
} {
  const isLocked = pratinjau?.status === 'TERKUNCI';

  // Evaluasi Langkah 1: Kelengkapan Data Awal (PBPK, Ganti Meter, Rute)
  const pendingMutasi = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'PENDING',
  ).length;
  const stageZonasi = stages.find((s) => s.id === 'update-zonasi');
  const stagePbpk = stages.find((s) => s.id === 'pbpk');
  const tanpaRuteCount = Number(stageZonasi?.detail?.tanpaRute ?? 0);
  const tanpaTarifCount = Number(stagePbpk?.detail?.tanpaTarif ?? 0);

  const step1Blockers: string[] = [];
  if (pendingMutasi > 0) {
    step1Blockers.push(
      `Masih ada ${formatAngkaId(pendingMutasi)} data pergantian meter air yang belum disetujui.`,
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
  const step1Done = isLocked || step1Blockers.length === 0;

  // Evaluasi Langkah 2: Pengesahan Hasil Baca Meter
  const totalBacaan = pratinjau?.pembacaan.total ?? 0;
  const belumDisahkan = pratinjau?.verifikasi.belumSelesai ?? 0;
  const step2Blockers: string[] = [];
  if (!step1Done) {
    step2Blockers.push('Selesaikan Langkah 1 (Pengecekan Data Awal) terlebih dahulu.');
  }
  if (totalBacaan === 0 && !isLocked) {
    step2Blockers.push('Belum ada data hasil bacaan meter pada periode ini.');
  }
  if (belumDisahkan > 0 && !isLocked) {
    step2Blockers.push(
      `Masih ada ${formatAngkaId(belumDisahkan)} hasil baca meter yang belum disahkan. Klik tombol "Sahkan Seluruh Bacaan Meter".`,
    );
  }
  const step2Done =
    isLocked || (step1Done && totalBacaan > 0 && belumDisahkan === 0);

  // Evaluasi Langkah 3: Tinjau Ringkasan Tagihan & Tanggal Jatuh Tempo
  const isDueDateValid = Boolean(
    tanggalJatuhTempo && !Number.isNaN(new Date(tanggalJatuhTempo).getTime()),
  );
  const step3Blockers: string[] = [];
  if (!step2Done) {
    step3Blockers.push(
      'Selesaikan Langkah 2 (Pengesahan Bacaan Meter) terlebih dahulu.',
    );
  }
  if (!isDueDateValid) {
    step3Blockers.push('Tanggal jatuh tempo pembayaran wajib diisi dengan benar.');
  }
  if (!reviewConfirmed && !isLocked) {
    step3Blockers.push(
      'Centang kotak pernyataan "Saya sudah memeriksa ringkasan angka tagihan" untuk melanjutkan.',
    );
  }
  const step3Done = isLocked || (step2Done && isDueDateValid && reviewConfirmed);

  // Evaluasi Langkah 4: Konfirmasi & Kunci Tutup Buku
  const step4Blockers: string[] = [];
  if (!step3Done) {
    step4Blockers.push(
      'Selesaikan pemeriksaan pada Langkah 3 sebelum mengunci tutup buku.',
    );
  }
  if (!isLocked) {
    step4Blockers.push(
      'Periode belum dikunci. Klik tombol "Mulai Tutup Buku & Terbitkan Tagihan" untuk menyelesaikan.',
    );
  }
  const step4Done = isLocked;

  // Evaluasi Langkah 5: Hasil Tutup Buku & Persiapan Bulan Baru
  const stageBulanBaru = stages.find((s) => s.id === 'create-bulan-baru');
  const hasNextPeriod = Boolean(stageBulanBaru?.detail?.hasNextPeriod);
  const step5Blockers: string[] = [];
  if (!isLocked) {
    step5Blockers.push('Periode berjalan harus dikunci pada Langkah 4 terlebih dahulu.');
  }
  const step5Done = isLocked && hasNextPeriod;

  const steps: ClosingStepEvaluation[] = [
    {
      step: 1,
      title: '1. Pengecekan Kelengkapan Data',
      subtitle:
        'Memastikan data pelanggan baru, pergantian meter rusak, dan pembagian rute baca sudah lengkap.',
      operatorTask:
        'Periksa 3 indikator di bawah. Jika ada yang belum selesai, gunakan tombol perbaikan yang tersedia.',
      isCompleted: step1Done,
      canProceed: step1Done,
      blockerReasons: step1Blockers,
    },
    {
      step: 2,
      title: '2. Pengesahan Hasil Baca Meter',
      subtitle:
        'Mengesahkan seluruh angka meter hasil catat petugas lapangan agar siap dihitung menjadi tagihan.',
      operatorTask:
        'Klik tombol "Sahkan Seluruh Bacaan Meter" apabila masih ada hasil bacaan yang menunggu pengesahan.',
      isCompleted: step2Done,
      canProceed: step2Done,
      blockerReasons: step2Blockers,
    },
    {
      step: 3,
      title: '3. Tinjau Ringkasan Tagihan & Jatuh Tempo',
      subtitle:
        'Memeriksa estimasi total pemakaian air, nilai rupiah tagihan, dan menentukan batas akhir pembayaran.',
      operatorTask:
        'Pilih tanggal jatuh tempo pembayaran, periksa angka estimasi tagihan, lalu centang kotak persetujuan.',
      isCompleted: step3Done,
      canProceed: step3Done,
      blockerReasons: step3Blockers,
    },
    {
      step: 4,
      title: '4. Konfirmasi & Kunci Tutup Buku',
      subtitle:
        'Menerbitkan rekening tagihan air resmi untuk seluruh pelanggan dan mengunci buku periode ini secara permanen.',
      operatorTask:
        'Klik tombol "Mulai Tutup Buku & Terbitkan Tagihan", lalu ketik kata kunci konfirmasi pada jendela yang muncul.',
      isCompleted: step4Done,
      canProceed: step4Done,
      blockerReasons: step4Blockers,
    },
    {
      step: 5,
      title: '5. Hasil Tutup Buku & Jadwal Bulan Baru',
      subtitle:
        'Menampilkan bukti penutupan buku periode ini dan menyiapkan daftar target catat meter untuk bulan depan.',
      operatorTask:
        'Tinjau bukti hasil tutup buku, lalu klik "Siapkan Jadwal Bulan Baru" untuk membuka periode berikutnya.',
      isCompleted: step5Done,
      canProceed: true,
      blockerReasons: step5Blockers,
    },
  ];

  let recommendedStep: ClosingWizardStep = 1;
  if (isLocked) {
    recommendedStep = 5;
  } else if (step3Done) {
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
