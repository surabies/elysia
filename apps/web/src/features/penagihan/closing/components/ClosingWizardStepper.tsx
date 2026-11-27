'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  Info,
  Lock,
  Minus,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
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
  formatPeriodeLabelId,
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
  targetBulanBaru: string;
  activeStep: ClosingWizardStep;
  onStepChange: (step: ClosingWizardStep) => void;
  onSwitchPeriode?: (periode: string) => void;
  highlightStage?: string;
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

function DeltaPill({ value }: { value: number | undefined }) {
  if (value === undefined || Number.isNaN(value)) return null;
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="size-3" />+{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums text-amber-600 dark:text-amber-400">
        <ArrowDownRight className="size-3" />
        {value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
      <Minus className="size-3" />
      0%
    </span>
  );
}

/**
 * Enterprise Close Control Plane (Numeric / Stripe Billing / Vercel Geist Pattern):
 * Tanpa akordeon berlapis. Seluruh metrik kunci, 5 gerbang kesiapan pra-closing,
 * panel penguncian DRD, dan inisialisasi bulan baru tampil dalam satu layar ringkas.
 */
export function ClosingWizardStepper({
  periode,
  targetBulanBaru,
  onSwitchPeriode,
  highlightStage,
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
  onExecuteStageAction,
}: ClosingWizardStepperProps) {
  const isTerkunci = pratinjau?.status === 'TERKUNCI';

  // --- Data Telemetry & Evaluasi 5 Gerbang Kesiapan ---
  const pendingMutasiCount = standAngkatList.filter(
    (m) => m.statusVerifikasi === 'PENDING',
  ).length;
  const stageZonasi = stages.find((s) => s.id === 'update-zonasi');
  const stagePbpk = stages.find((s) => s.id === 'pbpk');
  const stageBulanBaru = stages.find((s) => s.id === 'create-bulan-baru');
  const tanpaRuteCount = Number(stageZonasi?.detail?.tanpaRute ?? 0);
  const tanpaTarifCount = Number(stagePbpk?.detail?.tanpaTarif ?? 0);
  const hasNextPeriod = Boolean(stageBulanBaru?.detail?.hasNextPeriod);

  const dpmTotal = pratinjau?.daftarCatat.total ?? 0;
  const dpmSelesai = pratinjau?.daftarCatat.selesai ?? 0;
  const dpmBelumCount = pratinjau?.daftarCatat.belumSelesai ?? 0;
  const readRatePersen = pratinjau?.daftarCatat.readRatePersen ?? 0;
  const totalBacaan = pratinjau?.pembacaan.total ?? 0;

  const verifSelesaiV3 = pratinjau?.verifikasi.selesaiV3 ?? 0;
  const verifKoreksiCount = pratinjau?.verifikasi.butuhKoreksi ?? 0;
  const verifBelumCount = pratinjau?.verifikasi.belumSelesai ?? 0;
  const verifSiapCount =
    pratinjau?.verifikasi.siapDisahkan ??
    Math.max(0, verifBelumCount - verifKoreksiCount);

  const hambatanDpm = pratinjau?.hambatan.find(
    (h) => h.kode === 'DPM_BELUM_SELESAI',
  );
  const hambatanKoreksi = pratinjau?.hambatan.find(
    (h) => h.kode === 'BACAAN_BUTUH_KOREKSI',
  );
  const hambatanTarifMeter = pratinjau?.hambatan.find(
    (h) => h.kode === 'DATA_TARIF_METER_TIDAK_VALID',
  );
  const anomaliTarifMeterCount = hambatanTarifMeter?.jumlah ?? 0;
  const peringatanList = pratinjau?.peringatan ?? [];

  // 5 Gerbang Kesiapan Pra-Closing
  const gateMutasiOk = isTerkunci || pendingMutasiCount === 0;
  const gateMasterOk =
    isTerkunci ||
    (tanpaRuteCount === 0 &&
      tanpaTarifCount === 0 &&
      anomaliTarifMeterCount === 0);
  const gateDpmOk =
    isTerkunci || (dpmTotal > 0 && dpmBelumCount === 0 && totalBacaan > 0);
  const gateAnomaliOk =
    isTerkunci || (totalBacaan > 0 && verifKoreksiCount === 0);
  const gateV3Ok =
    isTerkunci ||
    (totalBacaan > 0 && verifKoreksiCount === 0 && verifBelumCount === 0);

  const gatesDoneCount = [
    gateMutasiOk,
    gateMasterOk,
    gateDpmOk,
    gateAnomaliOk,
    gateV3Ok,
  ].filter(Boolean).length;
  const remainingGatesCount = 5 - gatesDoneCount;

  const isDueDateValid = Boolean(
    tanggalJatuhTempo && !Number.isNaN(new Date(tanggalJatuhTempo).getTime()),
  );

  return (
    <div className="space-y-4">
      {/* ================================================================== */}
      {/* BARIS 1: STRIP TELEMETRI FINANSIAL & OPERASIONAL (GEIST HAIRLINE)  */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {/* Sel 1: Cakupan Bacaan DPM */}
        <div className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Cakupan Bacaan DPM
            </span>
            <Badge
              variant={gateDpmOk ? 'green-subtle' : 'amber-subtle'}
              size="sm"
              className="font-mono tabular-nums"
            >
              {loading ? '—' : `${readRatePersen}%`}
            </Badge>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(dpmSelesai)}
            </span>
            <span className="text-xs text-muted-foreground">
              / {loading ? '—' : formatAngkaId(dpmTotal)} SL
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {loading
              ? 'Memuat target DPM...'
              : dpmBelumCount > 0
                ? `${formatAngkaId(dpmBelumCount)} SL belum dilaporkan`
                : 'Seluruh pelanggan aktif tercatat'}
          </p>
        </div>

        {/* Sel 2: Status Pengesahan V3 */}
        <div className="space-y-1 border-border px-4 py-3 sm:border-l lg:border-l-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Pengesahan Bacaan (V3)
            </span>
            <Badge
              variant={
                gateV3Ok
                  ? 'green-subtle'
                  : verifKoreksiCount > 0
                    ? 'red-subtle'
                    : 'blue-subtle'
              }
              size="sm"
              className="font-mono tabular-nums"
            >
              {loading
                ? '—'
                : gateV3Ok
                  ? 'Disahkan'
                  : verifKoreksiCount > 0
                    ? `${formatAngkaId(verifKoreksiCount)} Anomali`
                    : `${formatAngkaId(verifSiapCount)} Siap`}
            </Badge>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(verifSelesaiV3)}
            </span>
            <span className="text-xs text-muted-foreground">
              / {loading ? '—' : formatAngkaId(totalBacaan)} SL
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isTerkunci
              ? 'Terkunci pada LOCKED_BILLING'
              : gateV3Ok
                ? '100% berstatus APPROVED_FINAL'
                : 'Wajib 100% disahkan sebelum kunci'}
          </p>
        </div>

        {/* Sel 3: Kubikasi Air */}
        <div className="space-y-1 border-border px-4 py-3 sm:border-t lg:border-t-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Total Kubikasi Air
            </span>
            {!loading && perbandingan && (
              <DeltaPill value={perbandingan.ringkasan.deltaM3Persen} />
            )}
          </div>
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-base font-semibold text-foreground">
              {loading ? '—' : formatAngkaId(pratinjau?.perkiraan.totalM3)}
            </span>
            <span className="text-xs text-muted-foreground">m³</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {perbandingan && perbandingan.ringkasan.totalM3Lalu > 0
              ? `Lalu (${perbandingan.periodeLalu}): ${formatAngkaId(perbandingan.ringkasan.totalM3Lalu)} m³`
              : 'Akumulasi pemakaian periode ini'}
          </p>
        </div>

        {/* Sel 4: Nilai Tagihan DRD */}
        <div className="space-y-1 border-border px-4 py-3 sm:border-t sm:border-l lg:border-t-0 lg:border-l-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              {isTerkunci ? 'Tagihan DRD Resmi' : 'Proyeksi Tagihan DRD'}
            </span>
            {!loading && perbandingan && (
              <DeltaPill value={perbandingan.ringkasan.deltaRpPersen} />
            )}
          </div>
          <div className="font-mono text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {loading ? '—' : formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {perbandingan && perbandingan.ringkasan.totalRpLalu > 0
              ? `Lalu (${perbandingan.periodeLalu}): ${formatRupiahId(perbandingan.ringkasan.totalRpLalu)}`
              : `${formatAngkaId(pratinjau?.perkiraan.jumlahSl)} rekening ditagih`}
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* BARIS 2: 12-COLUMN CONTROL PLANE (GATES KIRI · KUNCI KANAN)        */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
        {/* ---------------------------------------------------------------- */}
        {/* PANEL KIRI (7 KOLOM): 5 GERBANG KESIAPAN PRA-CLOSING             */}
        {/* ---------------------------------------------------------------- */}
        <Card className="flex h-full flex-col overflow-hidden border-border p-0 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/25 px-4 py-3">
            <div>
              <h2 className="text-xs font-semibold text-foreground sm:text-sm">
                Gerbang Kesiapan Pra-Closing
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Seluruh 5 syarat wajib hijau sebelum buku tagihan dapat dikunci.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    gatesDoneCount === 5 ? 'bg-emerald-500' : 'bg-foreground',
                  )}
                  style={{ width: `${loading ? 15 : (gatesDoneCount / 5) * 100}%` }}
                />
              </div>
              <Badge
                variant={gatesDoneCount === 5 ? 'green-subtle' : 'amber-subtle'}
                size="sm"
                className="font-mono tabular-nums"
              >
                {loading ? '.../5' : `${gatesDoneCount}/5 Siap`}
              </Badge>
            </div>
          </div>

          <div className="flex-1 divide-y divide-border">
            {/* GATE 1: Ganti Meter (Stand Angkat) */}
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-4 py-3',
                highlightStage === 'stand-angkat' && 'bg-muted/40',
              )}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                {gateMutasiOk ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      1. Persetujuan Ganti Meter (Stand Angkat)
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[11px] tabular-nums',
                        gateMutasiOk
                          ? 'text-muted-foreground'
                          : 'font-semibold text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {loading
                        ? '—'
                        : gateMutasiOk
                          ? `${standAngkatList.length} mutasi · 0 pending`
                          : `${pendingMutasiCount} menunggu`}
                    </span>
                  </div>
                  {!gateMutasiOk && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Setujui angka stand angkat &amp; stand pasang agar selisih
                      meter lama + baru terhitung akurat.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {pendingMutasiCount > 0 && !isTerkunci ? (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => onOpenDialog('mutasi')}
                    disabled={loading || actionLoading}
                  >
                    <span>Setujui ({pendingMutasiCount})</span>
                  </Button>
                ) : (
                  <Button asChild variant="ghost" size="xs">
                    <Link href="/tools-tutup/stand-angkat">
                      <span>1. Ganti Meter</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* GATE 2: Integritas Master, Rute & PBPK */}
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-4 py-3',
                (highlightStage === 'update-zonasi' ||
                  highlightStage === 'upload-master-pelanggan') &&
                  'bg-muted/40',
              )}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                {gateMasterOk ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      2. Kelengkapan Rute, Tarif &amp; Mutasi PBPK
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[11px] tabular-nums',
                        gateMasterOk
                          ? 'text-muted-foreground'
                          : 'font-semibold text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {loading
                        ? '—'
                        : gateMasterOk
                          ? '100% valid'
                          : `${tanpaRuteCount + tanpaTarifCount + anomaliTarifMeterCount} belum valid`}
                    </span>
                  </div>
                  {!gateMasterOk && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {tanpaRuteCount > 0 && `${tanpaRuteCount} tanpa rute. `}
                      {(tanpaTarifCount > 0 || anomaliTarifMeterCount > 0) &&
                        `${tanpaTarifCount + anomaliTarifMeterCount} tarif/ukuran meter belum valid.`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {tanpaRuteCount > 0 && !isTerkunci && (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => onExecuteStageAction('update-zonasi')}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Spinner className="size-3" />}
                    <span>Sinkron Rute ({tanpaRuteCount})</span>
                  </Button>
                )}
                {(tanpaTarifCount > 0 || anomaliTarifMeterCount > 0) &&
                  !isTerkunci && (
                    <Button
                      type="button"
                      size="xs"
                      onClick={() =>
                        onExecuteStageAction('upload-master-pelanggan')
                      }
                      disabled={actionLoading}
                    >
                      {actionLoading && <Spinner className="size-3" />}
                      <span>Validasi Tarif</span>
                    </Button>
                  )}
                <Button asChild variant="ghost" size="xs">
                  <Link href="/tools-tutup/pbpk">
                    <span>2. PBPK</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* GATE 3: Cakupan Bacaan DPM 100% */}
            <div className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  {gateDpmOk ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        3. Cakupan Bacaan Lapangan DPM (Wajib 100%)
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[11px] tabular-nums',
                          gateDpmOk
                            ? 'text-muted-foreground'
                            : 'font-semibold text-amber-600 dark:text-amber-400',
                        )}
                      >
                        {loading
                          ? '—'
                          : gateDpmOk
                            ? `${formatAngkaId(dpmSelesai)} / ${formatAngkaId(dpmTotal)} SL`
                            : `Kurang ${formatAngkaId(dpmBelumCount)} SL (${readRatePersen}%)`}
                      </span>
                    </div>
                    {!gateDpmOk && !loading && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Pelanggan belum terbaca wajib diselesaikan lewat laporan
                        petugas, stand PBPK, Hitung Rata-Rata, atau Manual ADD.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {!gateDpmOk && !isTerkunci && (
                    <>
                      <Button asChild variant="outline" size="xs">
                        <Link href="/meter/hitung-rata-rata">
                          <Calculator className="size-3" />
                          <span>Rata-Rata</span>
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="xs">
                        <Link href="/pelanggan/manual-add">
                          <PlusCircle className="size-3" />
                          <span>Manual ADD</span>
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button asChild variant="ghost" size="xs">
                    <Link href="/tools-tutup/cek-selisih-pelanggan">
                      <span>3. Cek Selisih</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {!gateDpmOk && hambatanDpm && hambatanDpm.contoh.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pl-6.5">
                  <span className="text-[11px] text-muted-foreground">
                    Contoh belum baca:
                  </span>
                  {hambatanDpm.contoh.slice(0, 4).map((nolg) => (
                    <Badge
                      key={nolg}
                      variant="outline"
                      size="sm"
                      className="font-mono text-[10px]"
                    >
                      {nolg}
                    </Badge>
                  ))}
                  {hambatanDpm.jumlah > 4 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      +{formatAngkaId(hambatanDpm.jumlah - 4)} lainnya
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* GATE 4: Bebas Anomali & Kubikasi Negatif */}
            <div className="space-y-2 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  {gateAnomaliOk ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        4. Bebas Anomali &amp; Kubikasi Negatif
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[11px] tabular-nums',
                          gateAnomaliOk
                            ? 'text-muted-foreground'
                            : 'font-semibold text-red-600 dark:text-red-400',
                        )}
                      >
                        {loading
                          ? '—'
                          : totalBacaan === 0
                            ? 'Belum ada bacaan'
                            : gateAnomaliOk
                              ? '0 anomali'
                              : `${formatAngkaId(verifKoreksiCount)} perlu koreksi`}
                      </span>
                    </div>
                    {!gateAnomaliOk && verifKoreksiCount > 0 && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Terdapat bacaan berstatus ANOMALY, NEED_RESURVEY, atau
                        pemakaian minus yang menahan pengesahan.
                      </p>
                    )}
                  </div>
                </div>

                {verifKoreksiCount > 0 && !isTerkunci && (
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <Button asChild variant="outline" size="xs">
                      <Link href="/verifikasi/baca-petugas">
                        <span>Verifikasi</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="xs">
                      <Link href="/progres/koreksi">
                        <Edit3 className="size-3" />
                        <span>Koreksi Stand</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {!gateAnomaliOk &&
                hambatanKoreksi &&
                hambatanKoreksi.contoh.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pl-6.5">
                    {hambatanKoreksi.contoh.slice(0, 5).map((nolg) => (
                      <Badge
                        key={nolg}
                        variant="destructive"
                        size="sm"
                        className="font-mono text-[10px]"
                      >
                        {nolg}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>

            {/* GATE 5: Pengesahan Bacaan Akhir (APPROVED_FINAL) */}
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-4 py-3',
                highlightStage === 'posting-datameter' && 'bg-muted/40',
              )}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                {gateV3Ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      5. Pengesahan Akhir Hasil Bacaan (APPROVED_FINAL)
                    </span>
                    <span
                      className={cn(
                        'font-mono text-[11px] tabular-nums',
                        gateV3Ok
                          ? 'text-muted-foreground'
                          : 'font-semibold text-blue-600 dark:text-blue-400',
                      )}
                    >
                      {loading
                        ? '—'
                        : gateV3Ok
                          ? `${formatAngkaId(verifSelesaiV3)} disahkan`
                          : `${formatAngkaId(verifSiapCount)} siap disahkan`}
                    </span>
                  </div>
                  {!gateV3Ok && !loading && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Mengesahkan seluruh bacaan valid menjadi APPROVED_FINAL
                      sebagai dasar penerbitan DRD.
                    </p>
                  )}
                </div>
              </div>

              {!gateV3Ok && !isTerkunci && (
                <Button
                  type="button"
                  size="xs"
                  onClick={() => onOpenDialog('posting')}
                  disabled={
                    loading ||
                    actionLoading ||
                    verifKoreksiCount > 0 ||
                    totalBacaan === 0
                  }
                >
                  <ShieldCheck className="size-3" />
                  <span>Sahkan {formatAngkaId(verifSiapCount)} Bacaan</span>
                </Button>
              )}
            </div>
          </div>

          {/* Catatan Informasi Non-Blocking (mis. MB data meter belum lengkap) */}
          {peringatanList.length > 0 && (
            <div className="border-t border-border bg-blue-50/35 px-4 py-2.5 text-[11px] dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div className="space-y-0.5 text-muted-foreground">
                  {peringatanList.map((p) => (
                    <p key={p.kode}>{p.pesan}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* PANEL KANAN (5 KOLOM): EKSEKUSI KUNCI BUKU & DRD                 */}
        {/* ---------------------------------------------------------------- */}
        <Card
          className={cn(
            'flex h-full flex-col overflow-hidden border p-0 lg:col-span-5',
            isTerkunci
              ? 'border-emerald-500/40'
              : pratinjau?.bisaDitutup
                ? 'border-foreground/50'
                : 'border-border',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/25 px-4 py-3">
            <div className="flex items-center gap-2">
              <Lock
                className={cn(
                  'size-3.5',
                  isTerkunci
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-foreground',
                )}
              />
              <h2 className="text-xs font-semibold text-foreground sm:text-sm">
                {isTerkunci
                  ? 'Bukti Penguncian Buku DRD'
                  : 'Eksekusi Kunci Buku & DRD'}
              </h2>
            </div>

            <Badge
              variant={
                isTerkunci
                  ? 'green-subtle'
                  : pratinjau?.bisaDitutup
                    ? 'blue-subtle'
                    : 'subtle'
              }
              size="sm"
            >
              {isTerkunci
                ? 'LOCKED_BILLING'
                : pratinjau?.bisaDitutup
                  ? 'Siap Kunci'
                  : 'Menunggu Syarat'}
            </Badge>
          </div>

          {isTerkunci ? (
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="divide-y divide-border rounded-md border border-border bg-muted/20 text-xs">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground">Periode</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatPeriodeLabelId(periode)} ({periode})
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground">Ditutup Oleh</span>
                  <span className="font-medium text-foreground">
                    {pratinjau?.audit?.ditutupOlehNama ??
                      pratinjau?.audit?.ditutupById ??
                      'Admin Billing'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground">Waktu Kunci</span>
                  <span className="font-mono text-[11px] tabular-nums text-foreground">
                    {formatTanggalWaktuId(pratinjau?.audit?.ditutupAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground">Jatuh Tempo</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {tanggalJatuhTempo}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground">Rekening DRD</span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatAngkaId(pratinjau?.perkiraan.jumlahSl)} SL ·{' '}
                    {formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/laporan/lap-drd">
                    <FileSpreadsheet className="size-3.5" />
                    <span>Buka Laporan DRD Resmi</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/tools-tutup/create-perbandingan">
                    <span>4. Perbandingan</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="space-y-3.5">
                {/* Ringkasan Angka Buku */}
                <div className="divide-y divide-border rounded-md border border-border bg-muted/20 text-xs">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-muted-foreground">
                      Rekening Akan Terbit
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {loading
                          ? '—'
                          : `${formatAngkaId(pratinjau?.perkiraan.jumlahSl)} SL`}
                      </span>
                      <Link
                        href="/tools-tutup/create-perbandingan"
                        className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      >
                        <span>Rincian</span>
                        <ExternalLink className="size-2.5" />
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-muted-foreground">
                      Total Pemakaian Air
                    </span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {loading
                        ? '—'
                        : `${formatAngkaId(pratinjau?.perkiraan.totalM3)} m³`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-muted-foreground">
                      Nilai Tagihan DRD
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {loading
                        ? '—'
                        : formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <label
                      htmlFor="close-due-date"
                      className="flex items-center gap-1.5 text-muted-foreground"
                    >
                      <Calendar className="size-3.5" />
                      <span>Jatuh Tempo</span>
                    </label>
                    <Input
                      id="close-due-date"
                      type="date"
                      size="sm"
                      value={tanggalJatuhTempo}
                      onChange={(e) =>
                        onTanggalJatuhTempoChange(e.target.value)
                      }
                      className="h-7 w-38 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Controller Sign-Off Checkbox */}
                <label
                  htmlFor="controller-signoff-confirm"
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors duration-150 select-none',
                    reviewConfirmed
                      ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                      : 'border-border bg-muted/15 hover:bg-muted/30',
                  )}
                >
                  <Checkbox
                    id="controller-signoff-confirm"
                    checked={reviewConfirmed}
                    onCheckedChange={(checked) =>
                      onReviewConfirmedChange(Boolean(checked))
                    }
                    className="mt-0.5 transition-transform duration-150"
                  />
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    Saya telah memverifikasi kesesuaian jumlah SL, kubikasi m³,
                    komparasi tarif di{' '}
                    <strong className="text-foreground">4. Perbandingan</strong>
                    , dan tanggal jatuh tempo.
                  </span>
                </label>
              </div>

              <div className="mt-4 space-y-1.5">
                <Button
                  type="button"
                  variant="destructive"
                  size="default"
                  className="w-full transition-all duration-150"
                  onClick={() => onOpenDialog('closing')}
                  disabled={
                    loading ||
                    actionLoading ||
                    !pratinjau?.bisaDitutup ||
                    !isDueDateValid ||
                    !reviewConfirmed
                  }
                >
                  <Lock className="size-4" />
                  <span>Kunci Buku &amp; Terbitkan DRD</span>
                </Button>

                {/* Tinggi baris status dikunci (min-h-4) agar klik checkbox tidak menggeser kartu di bawahnya */}
                <p
                  className={cn(
                    'min-h-4 text-center text-[11px] transition-colors duration-150',
                    !loading &&
                      remainingGatesCount === 0 &&
                      pratinjau?.bisaDitutup &&
                      reviewConfirmed
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : !loading &&
                          remainingGatesCount === 0 &&
                          pratinjau?.bisaDitutup &&
                          !reviewConfirmed
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground',
                  )}
                >
                  {loading ? (
                    'Memeriksa status kesiapan periode...'
                  ) : remainingGatesCount > 0 ? (
                    <>
                      Selesaikan{' '}
                      <strong className="font-mono text-foreground">
                        {remainingGatesCount}
                      </strong>{' '}
                      syarat kesiapan di panel kiri untuk mengaktifkan kunci
                      buku.
                    </>
                  ) : pratinjau?.bisaDitutup && !reviewConfirmed ? (
                    'Centang pernyataan verifikasi di atas untuk melanjutkan.'
                  ) : pratinjau?.bisaDitutup && reviewConfirmed ? (
                    'Seluruh syarat terpenuhi — siap mengunci buku & menerbitkan DRD.'
                  ) : (
                    ''
                  )}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ================================================================== */}
      {/* BARIS 3: INISIALISASI PERIODE BARU (CARRY-FORWARD N+1)             */}
      {/* ================================================================== */}
      <Card
        className={cn(
          'overflow-hidden border p-4',
          isTerkunci ? 'border-border bg-card' : 'border-border bg-muted/20',
          (highlightStage === 'create-bulan-baru' ||
            highlightStage === 'sync-pelanggan-baru' ||
            highlightStage === 'update-data-pelanggan') &&
            'ring-1 ring-foreground/30',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-semibold text-foreground sm:text-sm">
                Siklus Baru · {formatPeriodeLabelId(targetBulanBaru)}
              </h3>
              <Badge
                variant={
                  hasNextPeriod
                    ? 'green-subtle'
                    : isTerkunci
                      ? 'blue-subtle'
                      : 'subtle'
                }
                size="sm"
                className="font-mono"
              >
                {hasNextPeriod
                  ? `${targetBulanBaru} Aktif`
                  : isTerkunci
                    ? 'Siap Dibuka'
                    : 'Terkunci Gate'}
              </Badge>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Carry-forward otomatis stand akhir {periode} menjadi stand awal DPM{' '}
              {targetBulanBaru} (pelanggan DICABUT dilewati).
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={hasNextPeriod ? 'outline' : 'default'}
              size="sm"
              disabled={!isTerkunci || actionLoading}
              onClick={() => onOpenDialog('bulan-baru')}
              className={cn(!hasNextPeriod && 'min-w-44')}
            >
              <Sparkles className="size-3.5" />
              <span>
                {hasNextPeriod
                  ? `Perbarui DPM ${targetBulanBaru}`
                  : `Buka Jadwal ${formatPeriodeLabelId(targetBulanBaru)}`}
              </span>
            </Button>

            {hasNextPeriod && onSwitchPeriode && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onSwitchPeriode(targetBulanBaru)}
              >
                <span>Beralih ke {targetBulanBaru}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {hasNextPeriod && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
            <span className="text-[11px] text-muted-foreground">
              Utilitas DPM {targetBulanBaru}:
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={actionLoading}
                onClick={() => onExecuteStageAction('sync-pelanggan-baru')}
              >
                <Check className="size-3" />
                <span>Sinkron PBPK</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={actionLoading}
                onClick={() =>
                  onExecuteStageAction('update-data-pelanggan')
                }
              >
                <RefreshCw className="size-3" />
                <span>Urutkan Rute</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
