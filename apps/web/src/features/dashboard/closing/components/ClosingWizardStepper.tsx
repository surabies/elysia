'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  HelpCircle,
  Lock,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ActiveClosingDialog } from '../hooks/use-closing-workflow';
import {
  formatAngkaId,
  formatRupiahId,
  formatTanggalWaktuId,
} from '../lib/closing-format';
import type {
  ClosingConsoleTab,
  ClosingStepEvaluation,
  ClosingWizardStep,
  PerbandinganPeriodeData,
  PratinjauData,
  StandAngkatMutasiItem,
  WorkflowStageItem,
} from '../types';

interface ClosingWizardStepperProps {
  periode: string;
  activeStep: ClosingWizardStep;
  onStepChange: (step: ClosingWizardStep) => void;
  steps: ClosingStepEvaluation[];
  pratinjau: PratinjauData | null;
  stages: WorkflowStageItem[];
  standAngkatList: StandAngkatMutasiItem[];
  perbandingan: PerbandinganPeriodeData | null;
  loading: boolean;
  actionLoading: boolean;
  reviewConfirmed: boolean;
  onReviewConfirmedChange: (checked: boolean) => void;
  tanggalJatuhTempo: string;
  onTanggalJatuhTempoChange: (val: string) => void;
  onOpenDialog: (dialog: ActiveClosingDialog) => void;
  onSelectTab: (tab: ClosingConsoleTab) => void;
  onExecuteStageAction: (stageId: string) => void;
}

export function ClosingWizardStepper({
  periode,
  activeStep,
  onStepChange,
  steps,
  pratinjau,
  stages,
  standAngkatList,
  perbandingan,
  loading,
  actionLoading,
  reviewConfirmed,
  onReviewConfirmedChange,
  tanggalJatuhTempo,
  onTanggalJatuhTempoChange,
  onOpenDialog,
  onSelectTab,
  onExecuteStageAction,
}: ClosingWizardStepperProps) {
  const currentStepEval =
    steps.find((s) => s.step === activeStep) ?? steps[0]!;
  const isTerkunci = pratinjau?.status === 'TERKUNCI';

  const pendingMutasiCount = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'PENDING',
  ).length;
  const stageZonasi = stages.find((s) => s.id === 'update-zonasi');
  const stagePbpk = stages.find((s) => s.id === 'pbpk');
  const stageBulanBaru = stages.find((s) => s.id === 'create-bulan-baru');
  const tanpaRuteCount = Number(stageZonasi?.detail?.tanpaRute ?? 0);
  const tanpaTarifCount = Number(stagePbpk?.detail?.tanpaTarif ?? 0);
  const hasNextPeriod = Boolean(stageBulanBaru?.detail?.hasNextPeriod);

  const completedStepsCount = steps.filter((s) => s.isCompleted).length;

  return (
    <Card className="overflow-hidden border-border p-0">
      {/* 1. Header Bar Indikator Progres Wizard */}
      <div className="border-b border-border bg-(--ds-gray-100) px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Badge variant="blue-subtle" size="md" className="tabular-nums">
              Langkah {activeStep} dari 5
            </Badge>
            <h2 className="text-heading-16 text-foreground">
              Panduan Langkah demi Langkah Tutup Buku ({periode})
            </h2>
          </div>

          <div className="flex items-center gap-2 text-label-12 text-muted-foreground">
            <span className="tabular-nums">
              {completedStepsCount} dari 5 tahap selesai
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onOpenDialog('onboarding')}
            >
              <HelpCircle className="size-3.5" />
              <span>Cara Kerja Halaman Ini</span>
            </Button>
          </div>
        </div>

        {/* Navigasi 5 Langkah (Stepper Pills) */}
        <nav
          aria-label="Tahapan Tutup Buku"
          className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5"
        >
          {steps.map((item) => {
            const isActive = item.step === activeStep;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => onStepChange(item.step)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md border p-2.5 text-left transition-colors duration-150',
                  isActive
                    ? 'border-foreground bg-card text-foreground shadow-2xs'
                    : item.isCompleted
                      ? 'border-(--ds-green-300) bg-(--ds-green-100)/60 text-foreground hover:border-(--ds-green-500)'
                      : 'border-border bg-card/60 text-muted-foreground hover:border-(--ds-gray-500) hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-label-12-mono tabular-nums',
                    item.isCompleted
                      ? 'bg-(--ds-green-700) text-white'
                      : isActive
                        ? 'bg-foreground text-background'
                        : 'border border-border bg-(--ds-gray-100) text-muted-foreground',
                  )}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    item.step
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label-12 text-foreground">
                    {item.title.replace(/^\d+\.\s*/, '')}
                  </p>
                  <p className="truncate text-label-11 text-muted-foreground">
                    {item.isCompleted
                      ? 'Syarat Terpenuhi'
                      : isActive
                        ? 'Sedang Dikerjakan'
                        : 'Menunggu'}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Konten Aktif Sesuai Langkah (Satu Tahap = Satu Tujuan) */}
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-heading-20 text-foreground">
                {currentStepEval.title}
              </h3>
              <Badge
                variant={
                  currentStepEval.isCompleted ? 'green-subtle' : 'amber-subtle'
                }
                size="sm"
              >
                {currentStepEval.isCompleted
                  ? 'Siap Lanjut'
                  : 'Perlu Diselesaikan'}
              </Badge>
            </div>
            <p className="text-copy-13 text-muted-foreground">
              {currentStepEval.subtitle}
            </p>
          </div>

          <div className="rounded-md border border-border bg-(--ds-gray-100) px-3 py-2 text-copy-12 text-foreground">
            <span className="text-muted-foreground">Tugas Operator: </span>
            <span>{currentStepEval.operatorTask}</span>
          </div>
        </div>

        {/* ISI LANGKAH 1: PENGECEKAN KELENGKAPAN DATA AWAL */}
        {activeStep === 1 && (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {/* Pemeriksaan 1A: Ganti Meter */}
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-label-13 text-foreground">
                    1A. Data Pergantian Meter Air
                  </span>
                  <Badge
                    variant={
                      pendingMutasiCount === 0 ? 'green-subtle' : 'amber-subtle'
                    }
                    size="sm"
                  >
                    {pendingMutasiCount === 0
                      ? 'Lengkap'
                      : `${pendingMutasiCount} Menunggu`}
                  </Badge>
                </div>
                <p className="text-copy-12 text-muted-foreground">
                  Memastikan angka meter lama yang dicabut dan meter baru yang
                  dipasang sudah disetujui.
                </p>
                <p className="pt-1 text-label-13-mono tabular-nums text-foreground">
                  Total Ganti Meter: {formatAngkaId(standAngkatList.length)}{' '}
                  data ({formatAngkaId(pendingMutasiCount)} belum disetujui)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={pendingMutasiCount > 0 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onOpenDialog('mutasi')}
                  disabled={loading || actionLoading}
                >
                  <ClipboardCheck className="size-3.5" />
                  <span>
                    {pendingMutasiCount > 0
                      ? `Setujui (${pendingMutasiCount})`
                      : 'Cek Cepat'}
                  </span>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/tools-tutup/stand-angkat">Halaman Penuh</Link>
                </Button>
              </div>
            </div>

            {/* Pemeriksaan 1B: Rute & Wilayah */}
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-label-13 text-foreground">
                    1B. Pembagian Rute Baca
                  </span>
                  <Badge
                    variant={
                      tanpaRuteCount === 0 ? 'green-subtle' : 'amber-subtle'
                    }
                    size="sm"
                  >
                    {tanpaRuteCount === 0
                      ? '100% Terpetakan'
                      : `${tanpaRuteCount} Tanpa Rute`}
                  </Badge>
                </div>
                <p className="text-copy-12 text-muted-foreground">
                  Memastikan setiap pelanggan aktif sudah memiliki kode rute dan
                  kelurahan agar tidak terlewat.
                </p>
                <p className="pt-1 text-label-13-mono tabular-nums text-foreground">
                  {tanpaRuteCount === 0
                    ? 'Seluruh pelanggan sudah masuk rute'
                    : `${formatAngkaId(tanpaRuteCount)} pelanggan belum punya rute`}
                </p>
              </div>
              <Button
                type="button"
                variant={tanpaRuteCount > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => onExecuteStageAction('update-zonasi')}
                disabled={loading || actionLoading}
              >
                {actionLoading ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
                <span>
                  {tanpaRuteCount > 0
                    ? 'Perbaiki Rute Otomatis'
                    : 'Cek Ulang Pemetaan Rute'}
                </span>
              </Button>
            </div>

            {/* Pemeriksaan 1C: Golongan Tarif & Pelanggan Baru */}
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-label-13 text-foreground">
                    1C. Golongan Tarif Pelanggan
                  </span>
                  <Badge
                    variant={
                      tanpaTarifCount === 0 ? 'green-subtle' : 'amber-subtle'
                    }
                    size="sm"
                  >
                    {tanpaTarifCount === 0
                      ? 'Lengkap'
                      : `${tanpaTarifCount} Belum Ada Tarif`}
                  </Badge>
                </div>
                <p className="text-copy-12 text-muted-foreground">
                  Memastikan setiap pelanggan memiliki kode golongan tarif untuk
                  perhitungan harga air.
                </p>
                <p className="pt-1 text-label-13-mono tabular-nums text-foreground">
                  {tanpaTarifCount === 0
                    ? 'Semua pelanggan memiliki kode tarif'
                    : `${formatAngkaId(tanpaTarifCount)} pelanggan tanpa tarif`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={tanpaTarifCount > 0 ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    onExecuteStageAction('upload-master-pelanggan')
                  }
                  disabled={loading || actionLoading}
                >
                  <UserCheck className="size-3.5" />
                  <span>Validasi Data Pelanggan</span>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/tools-tutup/pbpk">Menu PBPK</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ISI LANGKAH 2: PENGESAHAN HASIL BACA METER */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-(--ds-gray-100) p-4">
                <span className="text-label-12 text-muted-foreground">
                  Total Pelanggan Tercatat
                </span>
                <p className="mt-1 text-heading-24 tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.pembacaan.total ?? 0)}{' '}
                  <span className="text-copy-13 text-muted-foreground">
                    Pelanggan
                  </span>
                </p>
                <p className="mt-1 text-copy-12 text-muted-foreground">
                  Cakupan baca lapangan:{' '}
                  {pratinjau?.daftarCatat.readRatePersen ?? 0}%
                </p>
              </div>

              <div className="rounded-lg border border-border bg-(--ds-gray-100) p-4">
                <span className="text-label-12 text-muted-foreground">
                  Sudah Disahkan (Siap Tagih)
                </span>
                <p className="mt-1 text-heading-24 tabular-nums text-(--ds-green-700)">
                  {formatAngkaId(pratinjau?.verifikasi.selesaiV3 ?? 0)}{' '}
                  <span className="text-copy-13 text-muted-foreground">
                    Pelanggan
                  </span>
                </p>
                <p className="mt-1 text-copy-12 text-muted-foreground">
                  Berstatus disahkan final
                </p>
              </div>

              <div className="rounded-lg border border-border bg-(--ds-gray-100) p-4">
                <span className="text-label-12 text-muted-foreground">
                  Belum Disahkan
                </span>
                <p
                  className={cn(
                    'mt-1 text-heading-24 tabular-nums',
                    (pratinjau?.verifikasi.belumSelesai ?? 0) > 0
                      ? 'text-(--ds-amber-700)'
                      : 'text-foreground',
                  )}
                >
                  {formatAngkaId(pratinjau?.verifikasi.belumSelesai ?? 0)}{' '}
                  <span className="text-copy-13 text-muted-foreground">
                    Pelanggan
                  </span>
                </p>
                <p className="mt-1 text-copy-12 text-muted-foreground">
                  {(pratinjau?.verifikasi.belumSelesai ?? 0) === 0
                    ? 'Seluruh bacaan sudah disahkan'
                    : 'Wajib disahkan sebelum lanjut ke Langkah 3'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <p className="text-label-14 text-foreground">
                  Pengesahan Massal Hasil Baca Meter
                </p>
                <p className="text-copy-12 text-muted-foreground">
                  Tindakan ini akan menyetujui seluruh angka hasil baca meter
                  petugas lapangan pada periode {periode} agar siap dihitung
                  menjadi tagihan air.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="default">
                  <Link href="/tools-tutup/cek-selisih-pelanggan">
                    <Scale className="size-3.5" />
                    <span>Cek Selisih per Rute</span>
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={() => onOpenDialog('posting')}
                  disabled={loading || actionLoading || isTerkunci}
                >
                  <ShieldCheck className="size-3.5" />
                  <span>Sahkan Seluruh Bacaan Meter</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ISI LANGKAH 3: TINJAU RINGKASAN TAGIHAN & JATUH TEMPO */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Kotak Ringkasan Dampak Tagihan */}
              <div className="space-y-3 rounded-lg border border-border bg-(--ds-gray-100) p-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-label-14 text-foreground">
                    Ringkasan Dampak Tagihan Periode {periode}
                  </span>
                  <Button asChild variant="ghost" size="xs">
                    <Link href="/tools-tutup/create-perbandingan">
                      <FileSpreadsheet className="size-3.5" />
                      <span>Buka Halaman Perbandingan Bulan Lalu</span>
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-card p-3">
                    <span className="text-label-11 text-muted-foreground">
                      Pelanggan Ditagih
                    </span>
                    <p className="mt-1 text-heading-20 tabular-nums text-foreground">
                      {formatAngkaId(pratinjau?.perkiraan.jumlahSl)} SL
                    </p>
                    {perbandingan && (
                      <p className="mt-0.5 text-copy-11 text-muted-foreground">
                        Bulan lalu:{' '}
                        {formatAngkaId(perbandingan.ringkasan.totalSlLalu)} SL
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-border bg-card p-3">
                    <span className="text-label-11 text-muted-foreground">
                      Total Pemakaian Air
                    </span>
                    <p className="mt-1 text-heading-20 tabular-nums text-foreground">
                      {formatAngkaId(pratinjau?.perkiraan.totalM3)} m³
                    </p>
                    {perbandingan && (
                      <p className="mt-0.5 text-copy-11 text-muted-foreground">
                        Selisih vs bulan lalu:{' '}
                        {perbandingan.ringkasan.deltaM3Persen >= 0 ? '+' : ''}
                        {perbandingan.ringkasan.deltaM3Persen}%
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-border bg-card p-3">
                    <span className="text-label-11 text-muted-foreground">
                      Total Nilai Tagihan (DRD)
                    </span>
                    <p className="mt-1 text-heading-20 tabular-nums text-(--ds-green-700)">
                      {formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                    </p>
                    {perbandingan && (
                      <p className="mt-0.5 text-copy-11 text-muted-foreground">
                        Selisih vs bulan lalu:{' '}
                        {perbandingan.ringkasan.deltaRpPersen >= 0 ? '+' : ''}
                        {perbandingan.ringkasan.deltaRpPersen}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pengaturan Tanggal Jatuh Tempo */}
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="wizard-due-date"
                    className="flex items-center gap-1.5 text-label-13 text-foreground"
                  >
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>Tanggal Jatuh Tempo Tagihan</span>
                  </label>
                  <p className="text-copy-12 text-muted-foreground">
                    Batas akhir pembayaran tagihan air pelanggan untuk periode{' '}
                    {periode} (standar tanggal 20 bulan berikutnya).
                  </p>
                  <Input
                    id="wizard-due-date"
                    type="date"
                    value={tanggalJatuhTempo}
                    onChange={(e) => onTanggalJatuhTempoChange(e.target.value)}
                    disabled={isTerkunci}
                    className="mt-2 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Kotak Centang Pernyataan Pemeriksaan Operator */}
            <label
              htmlFor="operator-review-confirm"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-(--ds-gray-500)"
            >
              <Checkbox
                id="operator-review-confirm"
                checked={reviewConfirmed || isTerkunci}
                disabled={isTerkunci}
                onCheckedChange={(checked) =>
                  onReviewConfirmedChange(Boolean(checked))
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <p className="text-label-13 text-foreground">
                  Saya telah memeriksa kebenaran jumlah pelanggan, pemakaian air
                  (m³), total rupiah tagihan, dan tanggal jatuh tempo di atas.
                </p>
                <p className="text-copy-12 text-muted-foreground">
                  Centang kotak ini untuk membuka Langkah 4 (Kunci Tutup Buku).
                </p>
              </div>
            </label>
          </div>
        )}

        {/* ISI LANGKAH 4: KONFIRMASI & KUNCI TUTUP BUKU (AKSI DESTRUKTIF) */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-(--ds-amber-300) bg-(--ds-amber-100) p-4 text-(--ds-amber-900) dark:border-(--ds-amber-400) dark:bg-(--ds-amber-200)">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-(--ds-amber-700)" />
                <div className="space-y-1.5">
                  <p className="text-label-14">
                    Perhatian: Tindakan Ini Bersifat Permanen dan Mengunci Data
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-copy-12">
                    <li>
                      Menerbitkan{' '}
                      <strong>
                        {formatAngkaId(pratinjau?.perkiraan.jumlahSl)} rekening
                        tagihan air resmi (DRD)
                      </strong>{' '}
                      senilai{' '}
                      <strong>
                        {formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                      </strong>
                      .
                    </li>
                    <li>
                      Mengunci seluruh catatan bacaan meter periode{' '}
                      <strong>{periode}</strong> sehingga tidak dapat diubah
                      kembali oleh petugas.
                    </li>
                    <li>
                      <strong>Jaminan Keamanan Data (Transaksi Atomik):</strong>{' '}
                      Apabila terjadi gangguan listrik atau jaringan di tengah
                      proses, sistem otomatis membatalkan seluruh perubahan
                      sehingga data tidak akan pernah rusak atau setengah jadi.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <p className="text-label-14 text-foreground">
                  Eksekusi Penutupan Buku Periode {periode}
                </p>
                <p className="text-copy-12 text-muted-foreground">
                  Jatuh tempo ditetapkan pada{' '}
                  <span className="font-mono text-foreground">
                    {tanggalJatuhTempo}
                  </span>
                  . Pada jendela berikutnya Anda akan diminta mengetik kata
                  kunci konfirmasi.
                </p>
              </div>

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={() => onOpenDialog('closing')}
                disabled={
                  loading ||
                  actionLoading ||
                  isTerkunci ||
                  !pratinjau?.bisaDitutup ||
                  !reviewConfirmed
                }
              >
                <Lock className="size-4" />
                <span>Mulai Tutup Buku &amp; Terbitkan Tagihan</span>
              </Button>
            </div>
          </div>
        )}

        {/* ISI LANGKAH 5: HASIL TUTUP BUKU & PERSIAPAN BULAN BARU */}
        {activeStep === 5 && (
          <div className="space-y-4">
            {isTerkunci ? (
              <div className="rounded-lg border border-(--ds-green-300) bg-(--ds-green-100) p-4 text-(--ds-green-900) dark:border-(--ds-green-400) dark:bg-(--ds-green-200)">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-(--ds-green-700)" />
                    <div className="space-y-1">
                      <p className="text-label-14">
                        Buku Periode {periode} Telah Resmi Ditutup &amp; Terkunci
                      </p>
                      <p className="text-copy-12">
                        Ditutup oleh{' '}
                        <strong className="font-mono">
                          {pratinjau?.audit?.ditutupById ?? 'ADMIN_BILLING'}
                        </strong>{' '}
                        pada{' '}
                        <strong>
                          {formatTanggalWaktuId(pratinjau?.audit?.ditutupAt)}
                        </strong>
                        . Total{' '}
                        <strong>
                          {formatAngkaId(pratinjau?.perkiraan.jumlahSl)} SL
                        </strong>{' '}
                        ({formatAngkaId(pratinjau?.perkiraan.totalM3)} m³)
                        senilai{' '}
                        <strong>
                          {formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                  <Badge variant="green-subtle" size="md">
                    Terkunci Permanen
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-(--ds-gray-100) p-4 text-copy-13 text-muted-foreground">
                Periode {periode} belum dikunci. Selesaikan Langkah 4 terlebih
                dahulu untuk melihat bukti hasil tutup buku dan membuka jadwal
                bulan baru.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-label-13 text-foreground">
                      5A. Buka Jadwal Bulan Baru
                    </span>
                    <Badge
                      variant={hasNextPeriod ? 'green-subtle' : 'blue-subtle'}
                      size="sm"
                    >
                      {hasNextPeriod ? 'Sudah Aktif' : 'Siap Dibuka'}
                    </Badge>
                  </div>
                  <p className="text-copy-12 text-muted-foreground">
                    Menyiapkan daftar target baca meter (DPM) untuk bulan
                    berikutnya dari pelanggan yang aktif.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={hasNextPeriod ? 'outline' : 'default'}
                  size="sm"
                  disabled={!isTerkunci || actionLoading}
                  onClick={() => onOpenDialog('bulan-baru')}
                >
                  <Sparkles className="size-3.5" />
                  <span>
                    {hasNextPeriod
                      ? 'Perbarui Jadwal Bulan Baru'
                      : 'Siapkan Jadwal Bulan Baru'}
                  </span>
                </Button>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <span className="text-label-13 text-foreground">
                    5B. Masukkan Pelanggan Baru ke Rute
                  </span>
                  <p className="text-copy-12 text-muted-foreground">
                    Menambahkan pelanggan pasang baru agar ikut tercatat pada
                    jadwal rute bulan depan.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => onExecuteStageAction('sync-pelanggan-baru')}
                >
                  <Play className="size-3.5" />
                  <span>Sinkronkan Pelanggan Baru</span>
                </Button>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <span className="text-label-13 text-foreground">
                    5C. Rapikan Nomor Urut Baca
                  </span>
                  <p className="text-copy-12 text-muted-foreground">
                    Menyusun ulang nomor urut kunjungan pelanggan di tiap rute
                    agar berurutan rapi bagi petugas.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => onExecuteStageAction('update-data-pelanggan')}
                >
                  <Play className="size-3.5" />
                  <span>Rapikan Urutan Rute</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Kotak Alasan Jika Syarat Tahap Belum Terpenuhi */}
        {currentStepEval.blockerReasons.length > 0 && (
          <div
            role="status"
            className="rounded-lg border border-(--ds-amber-300) bg-(--ds-amber-100)/70 p-3.5 text-(--ds-amber-900) dark:border-(--ds-amber-400) dark:bg-(--ds-amber-200)"
          >
            <p className="text-label-12">
              Syarat untuk melanjutkan dari langkah ini belum terpenuhi:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-copy-12">
              {currentStepEval.blockerReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Bar Navigasi Bawah Wizard (Sebelumnya / Lanjut) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={activeStep === 1 || actionLoading}
            onClick={() =>
              onStepChange(Math.max(1, activeStep - 1) as ClosingWizardStep)
            }
          >
            <ArrowLeft className="size-3.5" />
            <span>Langkah Sebelumnya</span>
          </Button>

          <div className="flex items-center gap-2">
            {activeStep < 5 && (
              <Button
                type="button"
                variant="default"
                size="default"
                disabled={!currentStepEval.canProceed || actionLoading}
                onClick={() =>
                  onStepChange(Math.min(5, activeStep + 1) as ClosingWizardStep)
                }
              >
                <span>Lanjut ke Langkah {activeStep + 1}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
