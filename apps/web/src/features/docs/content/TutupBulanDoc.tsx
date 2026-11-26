"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Database,
  ExternalLink,
  FileSpreadsheet,
  GitBranch,
  Lock,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  hitungRincianHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  type HargaBlok,
} from "@/server/domain/tagihan/tagihan.engine";
import { DocsCallout } from "../components/DocsCallout";
import type { DocHeading } from "../types";

export const tutupBulanHeadings: DocHeading[] = [
  { id: "ikhtisar", title: "1. Ikhtisar & Hukum 4 Pilar", level: 2 },
  {
    id: "syarat-pra-closing",
    title: "2. Enam Syarat Wajib Sebelum Tutup Bulan",
    level: 2,
  },
  {
    id: "simulasi-end-to-end",
    title: "3. Simulator Interaktif: Latihan Tutup Bulan (Tahap 1–4)",
    level: 2,
  },
  {
    id: "simulator-tarif-drd",
    title: "4. Simulator Kalkulator Tarif 4 Blok & Ganti Meter",
    level: 2,
  },
  {
    id: "arsitektur-12-modul",
    title: "5. Peta Menu Operasional & 12 Modul Backend",
    level: 2,
  },
  {
    id: "hak-akses-keamanan",
    title: "6. Hak Akses (RBAC) & Keamanan Transaksi Atomik",
    level: 2,
  },
  {
    id: "troubleshooting-faq",
    title: "7. Penyelesaian Kendala & Pertanyaan Umum (FAQ)",
    level: 2,
  },
];

const numberFmt = new Intl.NumberFormat("id-ID");
const formatNum = (n: number) => numberFmt.format(n);
const formatRp = (n: number) => `Rp ${numberFmt.format(n)}`;

function CodeFormulaBlock({ formula }: { formula: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg border border-border bg-muted/40 p-4 font-mono text-[13px] text-foreground">
      <div className="overflow-x-auto whitespace-pre-wrap pr-10">{formula}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute top-2 right-2 size-7 text-muted-foreground hover:text-foreground"
        title="Salin rumus"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// SIMULATOR 1: SANDBOX END-TO-END TUTUP BULAN (TAHAP 1 S/D TAHAP 4)
// ============================================================================
interface SimState {
  activeStep: 1 | 2 | 3 | 4;
  dpmBelumTercatat: number;
  mutasiPending: number;
  tanpaRute: number;
  anomaliCount: number;
  disahkanV3: boolean;
  jatuhTempo: string;
  reviewChecked: boolean;
  confirmPhrase: string;
  isLocked: boolean;
  lockedAt: string | null;
  nextPeriodOpened: boolean;
  logs: string[];
}

const INITIAL_SIM_STATE: SimState = {
  activeStep: 1,
  dpmBelumTercatat: 18,
  mutasiPending: 2,
  tanpaRute: 3,
  anomaliCount: 4,
  disahkanV3: false,
  jatuhTempo: "2026-12-20",
  reviewChecked: false,
  confirmPhrase: "",
  isLocked: false,
  lockedAt: null,
  nextPeriodOpened: false,
  logs: [
    "Simulasi dimuat: Periode November 2026 (202611) dengan target 1.250 SL aktif.",
  ],
};

function SimulatorAlurTutupBulan() {
  const [sim, setSim] = React.useState<SimState>(INITIAL_SIM_STATE);

  const totalTargetSl = 1250;
  const tercatatSl = totalTargetSl - sim.dpmBelumTercatat;
  const cakupanPersen = Number(((tercatatSl / totalTargetSl) * 100).toFixed(1));

  const step1Done =
    sim.isLocked ||
    (sim.dpmBelumTercatat === 0 &&
      sim.mutasiPending === 0 &&
      sim.tanpaRute === 0);
  const step2Done =
    sim.isLocked || (step1Done && sim.anomaliCount === 0 && sim.disahkanV3);
  const step3Done = sim.isLocked;
  const step4Done = sim.isLocked && sim.nextPeriodOpened;

  const prereqList = [
    { label: "1. DPM 100%", ok: sim.isLocked || sim.dpmBelumTercatat === 0 },
    { label: "2. Stand Angkat", ok: sim.isLocked || sim.mutasiPending === 0 },
    { label: "3. Rute & Tarif", ok: sim.isLocked || sim.tanpaRute === 0 },
    { label: "4. 0 Anomali", ok: sim.isLocked || sim.anomaliCount === 0 },
    { label: "5. Sah V3", ok: sim.isLocked || sim.disahkanV3 },
    {
      label: "6. Konfirmasi DRD",
      ok: sim.isLocked || (Boolean(sim.jatuhTempo) && sim.reviewChecked),
    },
  ];
  const prereqDoneCount = prereqList.filter((p) => p.ok).length;

  const appendLog = (prev: string[], msg: string) => [msg, ...prev].slice(0, 6);

  const handleReset = () => setSim(INITIAL_SIM_STATE);

  const handleFastForwardToStep3 = () => {
    setSim({
      ...INITIAL_SIM_STATE,
      activeStep: 3,
      dpmBelumTercatat: 0,
      mutasiPending: 0,
      tanpaRute: 0,
      anomaliCount: 0,
      disahkanV3: true,
      logs: [
        "Prasyarat Tahap 1 & Tahap 2 diselesaikan otomatis. Silakan uji penguncian buku di Tahap 3.",
        ...INITIAL_SIM_STATE.logs,
      ],
    });
  };

  return (
    <Card className="my-6 overflow-hidden border-border shadow-xs p-0">
      <CardHeader className="border-b border-border bg-muted/35 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Sandbox Simulasi Tutup Bulan · November 2026 (202611)
              </CardTitle>
              <Badge
                variant={sim.isLocked ? "green-subtle" : "blue-subtle"}
                size="sm"
              >
                {sim.isLocked ? "TERKUNCI (Simulasi)" : "Mode Latihan Aman"}
              </Badge>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              Klik tombol penyelesaian di tiap tahap untuk merasakan alur kerja
              nyata dari kondisi banyak kendala hingga periode baru{" "}
              <code className="font-mono">202612</code> terbuka—100% berjalan di
              memori browser tanpa mengubah database produksi.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {!sim.isLocked && !step2Done && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleFastForwardToStep3}
              >
                <Sparkles className="size-3" />
                <span>Lompat Siap Kunci</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleReset}
            >
              <RotateCcw className="size-3" />
              <span>Ulangi dari Awal</span>
            </Button>
          </div>
        </div>

        {/* Bar Progres 6 Syarat */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Progres Kelulusan Syarat Pra-Closing
            </span>
            <span className="font-mono text-muted-foreground tabular-nums">
              {prereqDoneCount}/6 syarat terpenuhi
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                prereqDoneCount === 6 ? "bg-emerald-500" : "bg-foreground",
              )}
              style={{ width: `${Math.round((prereqDoneCount / 6) * 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {prereqList.map((p) => (
              <span
                key={p.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                  p.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {p.ok ? (
                  <Check className="size-3" />
                ) : (
                  <Circle className="size-2.5 text-amber-500" />
                )}
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        {/* Selector 4 Tahap */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { step: 1, title: "1. Cek Kesiapan", done: step1Done },
              { step: 2, title: "2. Sahkan Bacaan", done: step2Done },
              { step: 3, title: "3. Kunci DRD", done: step3Done },
              { step: 4, title: "4. Bulan Baru", done: step4Done },
            ] as const
          ).map((item) => {
            const active = sim.activeStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setSim((s) => ({ ...s, activeStep: item.step }))}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all cursor-pointer",
                  active
                    ? "border-foreground bg-card font-semibold text-foreground shadow-2xs"
                    : item.done
                      ? "border-emerald-500/35 bg-emerald-500/5 text-foreground"
                      : "border-border bg-muted/25 text-muted-foreground hover:bg-card",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px]",
                    item.done
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-foreground text-background"
                        : "border border-border bg-background",
                  )}
                >
                  {item.done ? <Check className="size-3" /> : item.step}
                </span>
                <span className="truncate">{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Konten Tahap 1 */}
        {sim.activeStep === 1 && (
          <div className="space-y-3">
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {/* Item 1: DPM */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      1.1 Cakupan Catat Meter (DPM)
                    </span>
                    <Badge
                      variant={
                        sim.dpmBelumTercatat === 0
                          ? "green-subtle"
                          : "amber-subtle"
                      }
                      size="sm"
                    >
                      {cakupanPersen}% ({formatNum(tercatatSl)}/
                      {formatNum(totalTargetSl)} SL)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sim.dpmBelumTercatat === 0
                      ? "Seluruh pelanggan aktif telah tercatat 100%."
                      : `Masih ada ${sim.dpmBelumTercatat} rumah terkunci yang belum memiliki angka bacaan.`}
                  </p>
                </div>
                {sim.dpmBelumTercatat > 0 ? (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() =>
                      setSim((s) => ({
                        ...s,
                        dpmBelumTercatat: 0,
                        logs: appendLog(
                          s.logs,
                          "✓ 18 pelanggan rumah terkunci diselesaikan via Hitung Rata-Rata 3 Bulan (DPM kini 100%).",
                        ),
                      }))
                    }
                  >
                    <Calculator className="size-3" />
                    <span>Hitung Rata-Rata (18 SL)</span>
                  </Button>
                ) : (
                  <Badge variant="green-subtle" size="sm">
                    Terpenuhi
                  </Badge>
                )}
              </div>

              {/* Item 2: Stand Angkat */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      1.2 Persetujuan Ganti Meter (Stand Angkat)
                    </span>
                    <Badge
                      variant={
                        sim.mutasiPending === 0
                          ? "green-subtle"
                          : "amber-subtle"
                      }
                      size="sm"
                    >
                      {sim.mutasiPending === 0
                        ? "0 Pending"
                        : `${sim.mutasiPending} Menunggu`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sim.mutasiPending === 0
                      ? "Semua berita acara ganti meter telah disetujui."
                      : "2 pergantian meter menunggu verifikasi Stand Angkat & Stand Pasang."}
                  </p>
                </div>
                {sim.mutasiPending > 0 ? (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() =>
                      setSim((s) => ({
                        ...s,
                        mutasiPending: 0,
                        logs: appendLog(
                          s.logs,
                          "✓ 2 mutasi Ganti Water Meter (Stand Angkat) telah disetujui menjadi APPROVED.",
                        ),
                      }))
                    }
                  >
                    <GitBranch className="size-3" />
                    <span>Setujui 2 Ganti Meter</span>
                  </Button>
                ) : (
                  <Badge variant="green-subtle" size="sm">
                    Terpenuhi
                  </Badge>
                )}
              </div>

              {/* Item 3: Rute & Tarif */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      1.3 Kelengkapan Rute Baca &amp; Golongan Tarif
                    </span>
                    <Badge
                      variant={
                        sim.tanpaRute === 0 ? "green-subtle" : "amber-subtle"
                      }
                      size="sm"
                    >
                      {sim.tanpaRute === 0
                        ? "Lengkap"
                        : `${sim.tanpaRute} Tanpa Rute`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sim.tanpaRute === 0
                      ? "Seluruh pelanggan memiliki rute baca dan kode tarif valid."
                      : "3 pelanggan baru PBPK belum dipetakan ke kode rute baca."}
                  </p>
                </div>
                {sim.tanpaRute > 0 ? (
                  <Button
                    type="button"
                    size="xs"
                    onClick={() =>
                      setSim((s) => ({
                        ...s,
                        tanpaRute: 0,
                        logs: appendLog(
                          s.logs,
                          "✓ Sinkronisasi Zonasi memetakan 3 pelanggan baru ke rute baca terdekat.",
                        ),
                      }))
                    }
                  >
                    <span>Sinkronkan Rute (3 SL)</span>
                  </Button>
                ) : (
                  <Badge variant="green-subtle" size="sm">
                    Terpenuhi
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={!step1Done}
                onClick={() => setSim((s) => ({ ...s, activeStep: 2 }))}
              >
                <span>Lanjut ke Tahap 2</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Konten Tahap 2 */}
        {sim.activeStep === 2 && (
          <div className="space-y-3">
            {!step1Done && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                Selesaikan seluruh item pada Tahap 1 terlebih dahulu sebelum
                mengesahkan bacaan meter.
              </div>
            )}

            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      2.1 Penyelesaian Bacaan Anomali / Kubikasi Negatif
                    </span>
                    <Badge
                      variant={
                        sim.anomaliCount === 0 ? "green-subtle" : "red-subtle"
                      }
                      size="sm"
                    >
                      {sim.anomaliCount === 0
                        ? "0 Anomali"
                        : `${sim.anomaliCount} Perlu Koreksi`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sim.anomaliCount === 0
                      ? "Seluruh angka stand bersih dari anomali."
                      : "Terdapat 4 bacaan salah ketik stand yang ditahan oleh sistem proteksi."}
                  </p>
                </div>
                {sim.anomaliCount > 0 ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={!step1Done}
                    onClick={() =>
                      setSim((s) => ({
                        ...s,
                        anomaliCount: 0,
                        logs: appendLog(
                          s.logs,
                          "✓ 4 bacaan anomali berhasil diverifikasi & dikoreksi berdasarkan bukti foto meter.",
                        ),
                      }))
                    }
                  >
                    <span>Koreksi 4 Anomali</span>
                  </Button>
                ) : (
                  <Badge variant="green-subtle" size="sm">
                    Bersih
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      2.2 Pengesahan Massal ke APPROVED_FINAL
                    </span>
                    <Badge
                      variant={sim.disahkanV3 ? "green-subtle" : "blue-subtle"}
                      size="sm"
                    >
                      {sim.disahkanV3 ? "1.250/1.250 Sah" : "Menunggu V3"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {sim.disahkanV3
                      ? "Seluruh 1.250 bacaan meter telah resmi berstatus APPROVED_FINAL."
                      : "Sahkan seluruh bacaan valid setelah 0 anomali terpenuhi."}
                  </p>
                </div>
                {!sim.disahkanV3 ? (
                  <Button
                    type="button"
                    size="xs"
                    disabled={!step1Done || sim.anomaliCount > 0}
                    onClick={() =>
                      setSim((s) => ({
                        ...s,
                        disahkanV3: true,
                        logs: appendLog(
                          s.logs,
                          "✓ Posting Datameter Massal selesai: 1.250 bacaan berstatus APPROVED_FINAL.",
                        ),
                      }))
                    }
                  >
                    <ShieldCheck className="size-3" />
                    <span>Sahkan 1.250 Bacaan</span>
                  </Button>
                ) : (
                  <Badge variant="green-subtle" size="sm">
                    Disahkan
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={!step2Done}
                onClick={() => setSim((s) => ({ ...s, activeStep: 3 }))}
              >
                <span>Lanjut ke Tahap 3</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Konten Tahap 3 */}
        {sim.activeStep === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <span className="text-[11px] text-muted-foreground">
                  Pelanggan Ditagih
                </span>
                <p className="font-mono text-base font-semibold text-foreground">
                  1.250 SL
                </p>
                <span className="text-[11px] text-muted-foreground">
                  Okt 2026: 1.247 SL (+3 PB)
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <span className="text-[11px] text-muted-foreground">
                  Total Pemakaian Air
                </span>
                <p className="font-mono text-base font-semibold text-foreground">
                  28.450 m³
                </p>
                <span className="text-[11px] text-muted-foreground">
                  vs Okt 2026: +1,4%
                </span>
              </div>
              <div className="rounded-lg border border-border bg-muted/25 p-3">
                <span className="text-[11px] text-muted-foreground">
                  Total Tagihan DRD
                </span>
                <p className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400">
                  Rp 198.650.000
                </p>
                <span className="text-[11px] text-muted-foreground">
                  vs Okt 2026: +1,8%
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label htmlFor="sim-due-date" className="text-xs font-semibold">
                  Tanggal Jatuh Tempo Pembayaran
                </Label>
                <Input
                  id="sim-due-date"
                  type="date"
                  size="sm"
                  value={sim.jatuhTempo}
                  disabled={sim.isLocked}
                  onChange={(e) =>
                    setSim((s) => ({ ...s, jatuhTempo: e.target.value }))
                  }
                  className="w-44 font-mono"
                />
              </div>

              <label
                htmlFor="sim-review-check"
                className="flex cursor-pointer items-start gap-2.5 text-xs select-none"
              >
                <Checkbox
                  id="sim-review-check"
                  checked={sim.reviewChecked || sim.isLocked}
                  disabled={sim.isLocked || !step2Done}
                  onCheckedChange={(v) =>
                    setSim((s) => ({ ...s, reviewChecked: Boolean(v) }))
                  }
                  className="mt-0.5"
                />
                <span>
                  Saya telah meninjau proyeksi 1.250 SL senilai{" "}
                  <strong>Rp 198.650.000</strong> dan menyetujui penguncian
                  buku.
                </span>
              </label>

              {!sim.isLocked && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      Konfirmasi Kata Kunci Eksplisit: Ketik{" "}
                      <code className="rounded bg-red-500/15 px-1.5 py-0.5 font-mono">
                        TUTUP 202611
                      </code>
                    </p>
                    <Input
                      size="sm"
                      value={sim.confirmPhrase}
                      disabled={!step2Done || !sim.reviewChecked}
                      onChange={(e) =>
                        setSim((s) => ({ ...s, confirmPhrase: e.target.value }))
                      }
                      placeholder="Ketik TUTUP 202611"
                      className="h-8 w-52 font-mono text-xs uppercase"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={
                      !step2Done ||
                      !sim.reviewChecked ||
                      !sim.jatuhTempo ||
                      sim.confirmPhrase.trim().toUpperCase() !== "TUTUP 202611"
                    }
                    onClick={() =>
                      setSim((s) => ({
                        ...s,
                        isLocked: true,
                        lockedAt: new Date().toLocaleTimeString("id-ID"),
                        activeStep: 4,
                        logs: appendLog(
                          s.logs,
                          "🔒 Buku 202611 resmi TERKUNCI! 1.250 rekening DRD terbit & bacaan dikunci (LOCKED_BILLING).",
                        ),
                      }))
                    }
                  >
                    <Lock className="size-3.5" />
                    <span>Kunci Buku Simulasi</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Konten Tahap 4 */}
        {sim.activeStep === 4 && (
          <div className="space-y-3">
            {sim.isLocked ? (
              <div className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 p-3.5 text-xs">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  ✓ Bukti Tutup Buku 202611 Berhasil Diterbitkan (Pukul{" "}
                  {sim.lockedAt})
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  1.250 rekening resmi senilai Rp 198.650.000 telah terkunci
                  dengan jatuh tempo {sim.jatuhTempo}.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/35 p-3.5 text-xs text-muted-foreground">
                Kunci buku pada Tahap 3 terlebih dahulu sebelum membuka jadwal
                bulan Desember 2026 (<code className="font-mono">202612</code>).
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="max-w-md space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Buka Jadwal Bulan Baru: Desember 2026 (202612)
                </p>
                <p className="text-xs text-muted-foreground">
                  {sim.nextPeriodOpened
                    ? "Sukses! 1.247 DPM aktif diterbitkan dengan stand awal dari stand akhir November (3 pelanggan DICABUT otomatis dilewati)."
                    : "Menyalin stand akhir 202611 menjadi stand awal DPM 202612 dan menormalisasi urutan rute kunjungan."}
                </p>
              </div>

              {sim.nextPeriodOpened ? (
                <Badge variant="green-subtle" size="md">
                  Siklus 202612 Aktif!
                </Badge>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={!sim.isLocked}
                  onClick={() =>
                    setSim((s) => ({
                      ...s,
                      nextPeriodOpened: true,
                      logs: appendLog(
                        s.logs,
                        "🚀 Periode 202612 dibuka! 1.247 DPM siap dibaca petugas lapangan (3 SL DICABUT dilewati).",
                      ),
                    }))
                  }
                >
                  <Sparkles className="size-3.5" />
                  <span>Buka Jadwal 202612</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Log Aktivitas Simulasi */}
        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Log Transaksi Simulasi
          </p>
          <ul className="space-y-1 font-mono text-[11px] text-foreground/85">
            {sim.logs.map((entry, idx) => (
              <li key={`${idx}-${entry}`}>{entry}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SIMULATOR 2: KALKULATOR TARIF PROGRESIF 4 BLOK & STAND ANGKAT (GWM)
// ============================================================================
const PRESET_GOLONGAN: Record<
  string,
  {
    nama: string;
    beaBeban: number;
    beaAdmin: number;
    airKotor: number;
    blok: HargaBlok[];
  }
> = {
  "1A": {
    nama: "1A - Sosial Umum / Rumah Ibadah",
    beaBeban: 10000,
    beaAdmin: 5000,
    airKotor: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 1200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 1800 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 2400 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 3200 },
    ],
  },
  "2A2": {
    nama: "2A2 - Rumah Tangga Menengah",
    beaBeban: 17500,
    beaAdmin: 7500,
    airKotor: 2500,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2800 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 5600 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 8400 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 11200 },
    ],
  },
  "3A": {
    nama: "3A - Niaga Kecil / Ruko",
    beaBeban: 25000,
    beaAdmin: 10000,
    airKotor: 5000,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 6500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 9800 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 13500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 17200 },
    ],
  },
};

function SimulatorKalkulatorDrd() {
  const [golongan, setGolongan] = React.useState<string>("2A2");
  const [modeGantiMeter, setModeGantiMeter] = React.useState<boolean>(false);
  const [stml, setStml] = React.useState<number>(320);
  const [stma, setStma] = React.useState<number>(346);
  const [standAngkat, setStandAngkat] = React.useState<number>(332);
  const [standPasang, setStandPasang] = React.useState<number>(0);
  const [stmaBaru, setStmaBaru] = React.useState<number>(14);

  const cfg = PRESET_GOLONGAN[golongan] ?? PRESET_GOLONGAN["2A2"]!;

  const pakaiM3 = modeGantiMeter
    ? Math.max(0, standAngkat - stml) + Math.max(0, stmaBaru - standPasang)
    : Math.max(0, stma - stml);

  const rincianAir = hitungRincianHargaAir(pakaiM3, cfg.blok);
  const blokTertinggi = tentukanBlok(pakaiM3);
  const totalDrd = hitungTotalTagihan({
    jmlHargaAir: rincianAir.total,
    beaBeban: cfg.beaBeban,
    beaAdmin: cfg.beaAdmin,
    airKotor: cfg.airKotor,
  });

  return (
    <Card className="my-6 border-border shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            Kalkulator Mesin Tagihan DRD 4 Blok (`tagihan.engine.ts`)
          </CardTitle>
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setModeGantiMeter(false)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                !modeGantiMeter
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Bacaan Normal
            </button>
            <button
              type="button"
              onClick={() => setModeGantiMeter(true)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                modeGantiMeter
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Ganti Meter (GWM)
            </button>
          </div>
        </div>
        <CardDescription className="text-xs">
          Uji langsung perhitungan tarif bertingkat yang dijalankan saat Tahap 3
          menerbitkan rekening DRD.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Golongan Tarif</Label>
            <Select value={golongan} onValueChange={setGolongan}>
              <SelectTrigger size="sm" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESET_GOLONGAN).map(([kode, g]) => (
                  <SelectItem key={kode} value={kode}>
                    {g.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!modeGantiMeter ? (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Stand Awal / Lalu (STML)</Label>
                <Input
                  type="number"
                  size="sm"
                  min={0}
                  value={stml}
                  onChange={(e) => setStml(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stand Akhir Bulan Ini (STMA)</Label>
                <Input
                  type="number"
                  size="sm"
                  min={0}
                  value={stma}
                  onChange={(e) => setStma(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">STML Lama</Label>
                  <Input
                    type="number"
                    size="sm"
                    min={0}
                    value={stml}
                    onChange={(e) => setStml(Number(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Stand Angkat</Label>
                  <Input
                    type="number"
                    size="sm"
                    min={0}
                    value={standAngkat}
                    onChange={(e) =>
                      setStandAngkat(Number(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Stand Pasang</Label>
                  <Input
                    type="number"
                    size="sm"
                    min={0}
                    value={standPasang}
                    onChange={(e) =>
                      setStandPasang(Number(e.target.value) || 0)
                    }
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">STMA Baru</Label>
                  <Input
                    type="number"
                    size="sm"
                    min={0}
                    value={stmaBaru}
                    onChange={(e) => setStmaBaru(Number(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/25 p-3.5 text-xs">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="font-semibold text-foreground">
              Volume Tagih: <strong className="font-mono">{pakaiM3} m³</strong>{" "}
              (Mencapai Blok {blokTertinggi})
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Total DRD: {formatRp(totalDrd)}
            </span>
          </div>

          <div className="space-y-1 font-mono text-[12px]">
            {rincianAir.rincian.length === 0 ? (
              <div className="text-muted-foreground">
                Pemakaian 0 m³ → Harga Air Rp 0
              </div>
            ) : (
              rincianAir.rincian.map((b) => (
                <div
                  key={b.blok}
                  className="flex items-center justify-between text-muted-foreground"
                >
                  <span>
                    Blok {b.blok} ({b.dariM3}–{b.sampaiM3} m³): {b.volumeM3} m³ ×{" "}
                    {formatRp(b.hargaPerM3)}
                  </span>
                  <span className="text-foreground">{formatRp(b.subtotal)}</span>
                </div>
              ))
            )}
            <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-muted-foreground">
              <span>
                Biaya Tetap (Beban {formatRp(cfg.beaBeban)} + Admin{" "}
                {formatRp(cfg.beaAdmin)} + Air Kotor {formatRp(cfg.airKotor)})
              </span>
              <span className="text-foreground">
                {formatRp(cfg.beaBeban + cfg.beaAdmin + cfg.airKotor)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// KOMPONEN UTAMA DOKUMENTASI TUTUP BULAN
// ============================================================================
export function TutupBulanDoc() {
  return (
    <div className="space-y-10">
      {/* 1. Ikhtisar */}
      <section id="ikhtisar">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground first:mt-0">
          1. Ikhtisar &amp; Hukum Keseimbangan 4 Pilar
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/90">
          Modul <strong>Konsol Tutup Bulan</strong> (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-foreground">
            /tools-tutup/monitoring-tutup-bulan
          </code>
          ) merupakan gerbang akhir siklus bulanan Meter-to-Cash (M2C) PDAM
          Tirtawening yang mengubah hasil pembacaan meter lapangan menjadi{" "}
          <strong>Daftar Rekening Ditagih (DRD)</strong> resmi, mengunci buku
          periode berjalan secara permanen, dan membuka target baca bulan
          berikutnya (<code className="font-mono">N+1</code>).
        </p>

        <DocsCallout
          type="formula"
          title="Hukum Rekonsiliasi 4 Pilar (Zero Unbilled Discrepancy)"
        >
          <p>
            Sistem menggunakan arsitektur <em>Onboarding Gate</em> agar tidak
            ada satu pun pelanggan aktif yang terlewat dari penagihan maupun
            tertagih dengan angka keliru:
          </p>
          <CodeFormulaBlock
            formula={`Pelanggan_Aktif == Target_DPM(N) == Bacaan_APPROVED_FINAL(N) == Rekening_DRD(N)\nSelisih_Unbilled = Target_DPM(N) - Rekening_DRD(N) = 0`}
          />
        </DocsCallout>

        <div className="pt-1">
          <Button asChild size="sm" variant="default">
            <Link href="/tools-tutup/monitoring-tutup-bulan">
              <span>Buka Konsol Tutup Bulan Sekarang</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 2. Enam Syarat Wajib Pra-Closing */}
      <section id="syarat-pra-closing">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          2. Enam Syarat Wajib Sebelum Tutup Bulan
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/90">
          Konsol Tutup Bulan dirancang seperti <strong>Onboarding Checklist</strong>.
          Tombol eksekusi penguncian buku baru terbuka otomatis apabila ke-6
          syarat berikut seluruhnya berstatus hijau:
        </p>

        <div className="my-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            {
              no: "Syarat 1",
              title: "Cakupan Catat Lapangan (DPM) 100%",
              desc: "Seluruh pelanggan aktif pada daftar_catat periode berjalan harus sudah tercatat (0 BELUM_DICATAT). Rumah terkunci diselesaikan lewat Manual ADD atau Hitung Rata-Rata.",
              href: "/meter/hitung-rata-rata",
              linkLabel: "Menu Hitung Rata-Rata",
            },
            {
              no: "Syarat 2",
              title: "Ganti Meter (Stand Angkat) 0 Pending",
              desc: "Setiap berita acara pergantian meter wajib memiliki No. Meter Baru & Stand Angkat serta disetujui agar kubikasi meter lama + meter baru terhitung utuh.",
              href: "/tools-tutup/stand-angkat",
              linkLabel: "Menu Ganti Meter",
            },
            {
              no: "Syarat 3",
              title: "Rute Baca & Golongan Tarif Lengkap",
              desc: "0 pelanggan aktif tanpa rute_kode atau tarif_kode, termasuk sambungan baru dari mutasi PBPK.",
              href: "/tools-tutup/pbpk",
              linkLabel: "Menu Mutasi PBPK",
            },
            {
              no: "Syarat 4",
              title: "Bebas Bacaan Anomali & Survei Ulang",
              desc: "0 bacaan berstatus ANOMALY, NEED_RESURVEY, DRAFT, atau kubikasi negatif. Seluruh temuan wajib diverifikasi/dikoreksi lebih dulu.",
              href: "/verifikasi/baca-petugas",
              linkLabel: "Verifikasi Petugas",
            },
            {
              no: "Syarat 5",
              title: "100% Bacaan Disahkan (APPROVED_FINAL)",
              desc: "Menjalankan Posting Datameter Massal pada Tahap 2 untuk mengesahkan seluruh bacaan valid menjadi dasar penagihan resmi.",
              href: "/tools-tutup/monitoring-tutup-bulan",
              linkLabel: "Tahap 2 Konsol",
            },
            {
              no: "Syarat 6",
              title: "Tinjau Proyeksi DRD & Jatuh Tempo",
              desc: "Memeriksa kewajaran jumlah SL, m³, dan rupiah dibanding bulan lalu, mengisi tanggal jatuh tempo (standar tgl 20), dan mencentang konfirmasi.",
              href: "/tools-tutup/create-perbandingan",
              linkLabel: "Perbandingan Tagihan",
            },
          ].map((item) => (
            <div
              key={item.no}
              className="flex flex-col justify-between gap-2.5 rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-1">
                <Badge variant="blue-subtle" size="sm">
                  {item.no}
                </Badge>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
              >
                <span>{item.linkLabel}</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Simulator End-to-End */}
      <section id="simulasi-end-to-end">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          3. Simulator Interaktif: Latihan Tutup Bulan dari Awal sampai Akhir
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/90">
          Gunakan simulator di bawah ini untuk mempraktikkan seluruh tahapan
          penutupan buku mulai dari menyelesaikan kendala lapangan pada{" "}
          <strong>Tahap 1</strong>, mengesahkan bacaan pada{" "}
          <strong>Tahap 2</strong>, mengetik konfirmasi{" "}
          <code className="font-mono">TUTUP 202611</code> pada{" "}
          <strong>Tahap 3</strong>, hingga membuka jadwal periode baru pada{" "}
          <strong>Tahap 4</strong>:
        </p>

        <SimulatorAlurTutupBulan />
      </section>

      {/* 4. Simulator Kalkulator Tarif */}
      <section id="simulator-tarif-drd">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          4. Simulator Kalkulator Tarif Progresif 4 Blok &amp; Ganti Meter
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/90">
          Saat penguncian buku dieksekusi, sistem menghitung tagihan setiap
          pelanggan secara presisi menggunakan rumus progresif 4 blok dan
          penjumlahan dua segmen pemakaian khusus pelanggan ganti meter:
        </p>

        <CodeFormulaBlock
          formula={`// Bacaan Normal:\nPakai_m3 = max(0, STMA - STML)\n\n// Pelanggan Ganti Water Meter (Stand Angkat):\nPakai_GWM = max(0, Stand_Angkat - STML_Lama) + max(0, STMA_Baru - Stand_Pasang)\n\n// Total Rekening DRD:\nTotal_DRD = Σ(Volume_Blok_i × Tarif_Blok_i) + Bea_Beban + Bea_Admin + Air_Kotor`}
        />

        <SimulatorKalkulatorDrd />
      </section>

      {/* 5. Peta Menu & 12 Modul Backend */}
      <section id="arsitektur-12-modul">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          5. Peta Menu Operasional &amp; Arsitektur 12 Modul Backend
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/90">
          Di balik antarmuka 4 Tahap Onboarding yang ringkas, sistem
          mengorkestrasi 5 sub-menu operasional dan 12 layanan mikro penutupan
          buku pada PostgreSQL:
        </p>

        <div className="my-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 font-semibold text-foreground">
              <tr>
                <th className="p-3">Tahap Onboarding</th>
                <th className="p-3">Modul &amp; Endpoint Backend</th>
                <th className="p-3">Tabel PostgreSQL</th>
                <th className="p-3">Hasil Akhir (Output)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr>
                <td className="p-3 font-semibold text-foreground">
                  Tahap 1: Cek Kesiapan Data
                </td>
                <td className="p-3 font-mono">
                  #1 PBPK (/pbpk/*)
                  <br />
                  #2 Stand Angkat (/stand-angkat/*)
                  <br />
                  #3 Update Zonasi (/update-zonasi)
                  <br />
                  #8 Validasi Master (/upload-master-pelanggan)
                  <br />
                  #11 Cek Selisih (/cek-selisih/:periode)
                </td>
                <td className="p-3 font-mono">
                  pelanggan, daftar_catat, water_meter_mutasi, rute_cater,
                  golongan_tarif
                </td>
                <td className="p-3 text-foreground/90">
                  Cakupan DPM 100%, mutasi GWM 0 pending, seluruh SL aktif
                  memiliki rute &amp; golongan tarif valid.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-foreground">
                  Tahap 2: Sahkan Bacaan
                </td>
                <td className="p-3 font-mono">
                  #4 Posting Datameter (/posting-datameter)
                </td>
                <td className="p-3 font-mono">cater_baca_meter</td>
                <td className="p-3 text-foreground/90">
                  0 anomali tertahan; seluruh bacaan naik menjadi{" "}
                  <code>APPROVED_FINAL</code>.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-foreground">
                  Tahap 3: Tinjau &amp; Kunci DRD
                </td>
                <td className="p-3 font-mono">
                  #5 Create Closed DRD (/eksekusi)
                  <br />
                  #6 Perbandingan (/perbandingan/:periode)
                  <br />
                  #12 Pratinjau (/pratinjau/:periode)
                </td>
                <td className="p-3 font-mono">
                  rekening_drd, periode_penagihan, cater_baca_meter
                </td>
                <td className="p-3 text-foreground/90">
                  Rekening DRD terbit massal, bacaan dikunci{" "}
                  <code>LOCKED_BILLING</code>, status periode{" "}
                  <code>TERKUNCI</code>.
                </td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-foreground">
                  Tahap 4: Buka Bulan Baru
                </td>
                <td className="p-3 font-mono">
                  #7 Create Bulan Baru (/bulan-baru)
                  <br />
                  #9 Sync PB (/sync-pelanggan-baru)
                  <br />
                  #10 Sequencing Rute (/update-data-pelanggan)
                </td>
                <td className="p-3 font-mono">
                  periode_penagihan, daftar_catat, pelanggan
                </td>
                <td className="p-3 text-foreground/90">
                  Periode N+1 aktif (<code>BERJALAN</code>), urutan rute rapi,
                  stand akhir N menjadi stand awal N+1, SL <code>DICABUT</code>{" "}
                  dilewati.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Hak Akses & Keamanan */}
      <section id="hak-akses-keamanan">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          6. Matriks Hak Akses (RBAC) &amp; Jaminan Transaksi Atomik
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-foreground/90">
          Sistem memisahkan secara ketat hak pantau kesiapan (<em>read-only</em>)
          dengan wewenang eksekusi penguncian buku:
        </p>

        <div className="my-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 font-semibold text-foreground">
              <tr>
                <th className="p-3">Peran Pengguna (Role)</th>
                <th className="p-3">Pantau Kesiapan &amp; Selisih</th>
                <th className="p-3">Eksekusi Pengesahan &amp; Kunci DRD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr>
                <td className="p-3 font-mono font-medium text-foreground">
                  SUPERADMIN &amp; STAFF_ADMIN_BILLING
                </td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400">
                  Diizinkan Penuh
                </td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  Diizinkan Eksekusi Penuh (Tahap 1–4)
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-medium text-foreground">
                  VERIFIKATOR_3 (Supervisor Akhir)
                </td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400">
                  Diizinkan Penuh
                </td>
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                  Diizinkan Pengesahan V3 &amp; Kunci Buku
                </td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-medium text-foreground">
                  EXECUTIVE / MANAGER / VERIFIKATOR_1 &amp; 2
                </td>
                <td className="p-3 text-emerald-600 dark:text-emerald-400">
                  Hanya Baca (Monitoring)
                </td>
                <td className="p-3 text-muted-foreground">
                  Ditolak Otomatis (<code>403 AKSES_DITOLAK</code>)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <DocsCallout
          type="warning"
          title="Jaminan Transaksi Atomik PostgreSQL (Zero Partial State)"
        >
          Seluruh penerbitan ribuan baris <code>rekening_drd</code>, penguncian{" "}
          <code>LOCKED_BILLING</code>, dan snapshot audit{" "}
          <code>periode_penagihan</code> dibungkus dalam satu transaksi atomik
          database serta proteksi <em>in-flight lock</em>. Apabila koneksi
          terputus di tengah jalan, PostgreSQL otomatis melakukan{" "}
          <strong>ROLLBACK 100%</strong> sehingga tidak pernah ada tagihan
          setengah jadi atau duplikat.
        </DocsCallout>
      </section>

      {/* 7. Troubleshooting & FAQ */}
      <section id="troubleshooting-faq">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          7. Penyelesaian Kendala &amp; Pertanyaan Umum (FAQ)
        </h2>

        <div className="mt-5 space-y-3">
          <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Mengapa tabel Mutasi PBPK kosong (0 SL) pada awal periode?
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Hal tersebut normal dan akurat. Halaman{" "}
              <Link
                href="/tools-tutup/pbpk"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Pelanggan Baru (PBPK)
              </Link>{" "}
              hanya menampilkan sambungan baru resmi yang benar-benar terdaftar
              pada DPM periode terpilih (<code>daftar_catat.sumber = PBPK</code>
              ), bukan mengambil pelanggan lama dari master data. Jika ada
              pemasangan baru dari bagian Langganan, gunakan tombol{" "}
              <strong>Input Pasang Baru</strong> atau{" "}
              <strong>Import CSV PBPK</strong>.
            </p>
          </div>

          <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Bagaimana jika ada rumah terkunci sampai hari H tutup bulan?
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Pada <strong>Tahap 1 (Syarat 1.1)</strong>, klik tombol{" "}
              <strong>Hitung Rata-Rata</strong> atau <strong>Manual ADD</strong>.
              Sistem akan menghitung taksasi rata-rata pemakaian 3 bulan
              terakhir secara proporsional sehingga cakupan DPM mencapai 100%
              tanpa menebak angka secara manual.
            </p>
          </div>

          <div className="space-y-1.5 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Apakah proses Buka Jadwal Bulan Baru (Tahap 4) aman diklik lebih
              dari sekali?
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Sangat aman (<em>idempoten</em>). Apabila jadwal bulan depan sudah
              terbuka lalu ada penambahan pelanggan baru susulan, menekan tombol{" "}
              <strong>Perbarui Jadwal</strong> hanya akan menyisipkan pelanggan
              yang belum masuk tanpa menggandakan atau menimpa catatan petugas
              yang sudah berjalan.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
