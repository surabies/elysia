"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck2,
  Users,
  Eye,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  Calculator,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Copy,
  ChevronRight,
  Sliders,
  Keyboard,
  Camera,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  CheckSquare,
  CornerDownRight,
  Flame,
} from "lucide-react";
import { DocsCallout } from "../components/DocsCallout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DocHeading } from "../types";
import {
  KONDISI_TAKSASI_OTOMATIS,
  PEMAKAIAN_MINIMUM_PERDIR,
  hitungTaksasi,
  hitungRollover,
} from "@/server/domain/taksasi/taksasi.engine";
import { hitungPemakaianGantiMeter } from "@/lib/domain/perhitungan-meter";
import { LABEL_KONDISI_CATAT } from "@/features/dashboard/verifikasi/lib/label-pencatatan";

export const verifikasiLapanganHeadings: DocHeading[] = [
  { id: "ikhtisar", title: "1. Ikhtisar & Nilai Strategis Halaman", level: 2 },
  { id: "simulator-taksasi", title: "2. Simulator Interaktif: Engine Taksasi Otomatis", level: 2 },
  { id: "simulator-mb-rollover", title: "3. Simulator Interaktif: Ganti Meter (MB) & Rollover", level: 2 },
  { id: "logika-taksasi", title: "4. Logika Bisnis & Hirarki Metode Taksasi (14 Kondisi)", level: 2 },
  { id: "palet-warna-tabel", title: "5. Sistem Pewarnaan Tabel & Indikator Baris", level: 2 },
  { id: "alur-tiga-cincin", title: "6. Arsitektur Tiga Cincin (V1, V2, V3) & Rollback", level: 2 },
  { id: "edit-inline-koreksi", title: "7. Fitur Koreksi Data & Edit Inline Pembacaan", level: 2 },
  { id: "aksi-massal-batch", title: "8. Aksi Massal (Bulk Actions) & Protokol Batch 500", level: 2 },
  { id: "drawer-pemeriksaan", title: "9. Panel Pemeriksaan Detail: Foto, GPS & Konsumsi", level: 2 },
  { id: "pintasan-keyboard", title: "10. Panduan Pintasan Papan Ketik (Keyboard-First)", level: 2 },
  { id: "sop-hak-akses", title: "11. SOP Operasional, Matriks Wewenang & Konflik Mandiri", level: 2 },
  { id: "faq", title: "12. Pertanyaan Umum (FAQ) & Penyelesaian Masalah", level: 2 },
];

function CodeFormulaBlock({ formula }: { formula: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-lg border border-border bg-muted/40 p-4 font-mono text-[13px] text-foreground">
      <div className="overflow-x-auto pr-10">{formula}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute right-2 top-2 size-7 text-muted-foreground hover:text-foreground"
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

// ----------------------------------------------------------------------------
// SIMULATOR 1: KALKULATOR ENGINE TAKSASI INTERAKTIF
// ----------------------------------------------------------------------------
function SimulatorTaksasi() {
  const [kondisi, setKondisi] = React.useState<string>("METER_RUSAK");
  const [historiCount, setHistoriCount] = React.useState<number>(12);
  const [standAwal, setStandAwal] = React.useState<number>(450);
  const [sampleUsage, setSampleUsage] = React.useState<number[]>([
    24, 28, 30, 22, 26, 25, 31, 29, 27, 23, 26, 28,
  ]);

  const presetHistori = (count: number) => {
    setHistoriCount(count);
    if (count === 12) {
      setSampleUsage([24, 28, 30, 22, 26, 25, 31, 29, 27, 23, 26, 28]);
    } else if (count === 5) {
      setSampleUsage([35, 18, 42, 29, 25]);
    } else if (count === 2) {
      setSampleUsage([22, 24]);
    } else {
      setSampleUsage([]);
    }
  };

  // Kalkulasi engine
  const riwayatObjects = sampleUsage.slice(0, historiCount).map((val, idx) => ({
    id: `hist-${idx}`,
    periode: new Date(2026, 10 - idx, 1).toISOString(),
    pemakaianM3: val,
  }));

  const hasil = hitungTaksasi(riwayatObjects, "2026-11-01T00:00:00Z", {
    id: "stand-prev",
    periode: "2026-10-01T00:00:00Z",
    standAkhir: standAwal,
  });

  const isTaksasiOtomatis = KONDISI_TAKSASI_OTOMATIS.has(kondisi);

  return (
    <Card className="my-6 border-border shadow-sm">
      <CardHeader className="border-b border-border bg-muted/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
              <Calculator className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Simulator Kalkulator Engine Taksasi Otomatis
              </CardTitle>
              <CardDescription className="text-xs">
                Uji coba langsung bagaimana sistem menentukan metode (12B, 3-Tertinggi, atau Perdir) berdasarkan kondisi meter dan histori.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              isTaksasiOtomatis
                ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
            }
          >
            {isTaksasiOtomatis
              ? "⚡ Memicu Taksasi Otomatis"
              : "ℹ️ Bukan Kondisi Taksasi (Normal/Manual)"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Input 1: Kondisi Meter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Pilih Kondisi Meter</Label>
            <Select value={kondisi} onValueChange={setKondisi}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih kondisi" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(KONDISI_TAKSASI_OTOMATIS).map((kod) => (
                  <SelectItem key={kod} value={kod} className="text-xs">
                    {LABEL_KONDISI_CATAT[kod] ?? kod} ({kod})
                  </SelectItem>
                ))}
                <SelectItem value="NORMAL" className="text-xs">
                  Normal (NORMAL)
                </SelectItem>
                <SelectItem value="STAND_TEMPEL" className="text-xs">
                  Stand Tempel (STAND_TEMPEL)
                </SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground">
              {isTaksasiOtomatis
                ? "Kondisi ini masuk dalam 14 kode pemicu taksasi otomatis."
                : "Kondisi ini memerlukan input angka fisik oleh petugas."}
            </span>
          </div>

          {/* Input 2: Stand Awal Terakhir */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Stand Bulan Lalu (STML)</Label>
            <Input
              type="number"
              value={standAwal}
              onChange={(e) => setStandAwal(Number(e.target.value) || 0)}
              className="h-9 text-xs font-mono"
            />
            <span className="text-[11px] text-muted-foreground">
              Stand resmi yang tercatat di sistem pada periode sebelumnya.
            </span>
          </div>

          {/* Input 3: Jumlah Bulan Histori Konsumsi */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Skenario Histori Tagihan</Label>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={historiCount === 12 ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => presetHistori(12)}
              >
                12 Bulan (Penuh)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={historiCount === 5 ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => presetHistori(5)}
              >
                5 Bulan
              </Button>
              <Button
                type="button"
                size="sm"
                variant={historiCount === 2 ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => presetHistori(2)}
              >
                2 Bulan
              </Button>
              <Button
                type="button"
                size="sm"
                variant={historiCount === 0 ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => presetHistori(0)}
              >
                0 (Baru)
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Pilih jumlah riwayat untuk menguji seleksi metode taksasi.
            </span>
          </div>
        </div>

        {/* Visualisasi Data Histori yang Digunakan */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <span>Riwayat Pemakaian ({historiCount} Bulan Tersedia):</span>
            <span className="text-muted-foreground font-mono">
              Satuan: Meter Kubik (m³)
            </span>
          </div>
          {historiCount === 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              Tidak ada data riwayat pemakaian masa lalu (Pelanggan Sambungan Baru / Data Nol).
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sampleUsage.slice(0, historiCount).map((val, i) => {
                const isSelectedInTop3 =
                  hasil.metode === "TIGA_TERTINGGI" &&
                  hasil.sumberTagihan.some((s) => s.pemakaianM3 === val);
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center rounded border px-2.5 py-1 text-xs ${
                      isSelectedInTop3
                        ? "border-amber-500 bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400"
                        : "border-border bg-muted/30 text-foreground"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground">B-{i + 1}</span>
                    <span className="font-mono">{val} m³</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hasil Komputasi Engine */}
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/10 p-4 md:grid-cols-4">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">
              Metode Yang Terpilih
            </div>
            <div className="mt-1 font-semibold text-foreground text-sm flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              {hasil.metode === "RATA_RATA_12_BULAN"
                ? "Rata-rata 12 Bulan"
                : hasil.metode === "TIGA_TERTINGGI"
                ? "3 Pemakaian Tertinggi"
                : hasil.metode === "RIWAYAT_TERSEDIA"
                ? "Rata-rata Riwayat Ada"
                : "Tanpa Histori (Perdir)"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Kode: {hasil.metode}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-muted-foreground">
              Stand Akhir (STMA)
            </div>
            <div className="mt-1 font-mono text-base font-bold text-foreground">
              {isTaksasiOtomatis ? standAwal : "Diisi Petugas"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isTaksasiOtomatis
                ? "STMA = STML (Meter tidak berputar/mati)"
                : "Berdasarkan angka fisik"}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-muted-foreground">
              Taksasi Pemakaian (Pakai m³)
            </div>
            <div className="mt-1 font-mono text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {hasil.pemakaian ?? PEMAKAIAN_MINIMUM_PERDIR} m³
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Math.ceil pembulatan ke atas
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-muted-foreground">
              Kelayakan Validasi
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              Siap Diverifikasi
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Stand meter aktif valid
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// SIMULATOR 2: KALKULATOR GANTI METER (MB) & ROLLOVER
// ----------------------------------------------------------------------------
function SimulatorMBdanRollover() {
  const [tabMode, setTabMode] = React.useState<"MB" | "ROLLOVER">("MB");

  // State Ganti Meter (MB)
  const [standAwalLama, setStandAwalLama] = React.useState<number>(1850);
  const [standAngkatLama, setStandAngkatLama] = React.useState<number>(1865);
  const [standPasangBaru, setStandPasangBaru] = React.useState<number>(0);
  const [standMeterBaru, setStandMeterBaru] = React.useState<number>(14);

  // State Rollover
  const [stmlRollover, setStmlRollover] = React.useState<number>(9985);
  const [stmaRollover, setStmaRollover] = React.useState<number>(18);
  const [digitCount, setDigitCount] = React.useState<number>(4);

  // Kalkulasi MB
  const pakaiLama = standAngkatLama - standAwalLama;
  const pakaiBaru = standMeterBaru - standPasangBaru;
  const totalPakaiMB = hitungPemakaianGantiMeter({
    standAwalLama,
    standAngkatLama,
    standMeterBaru,
    standPasang: standPasangBaru,
  });

  // Kalkulasi Rollover
  const hasilRollover = hitungRollover(stmlRollover, stmaRollover, digitCount);

  return (
    <Card className="my-6 border-border shadow-sm">
      <CardHeader className="border-b border-border bg-muted/20 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
              <Sliders className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Simulator Kalkulator Ganti Meter (MB) &amp; Rollover
              </CardTitle>
              <CardDescription className="text-xs">
                Kalkulasi matematis untuk kasus pergantian fisik meteran air di tengah periode atau angka register meter yang melewati kapasitas maksimum (9999 → 0015).
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center rounded-md border border-border bg-card p-0.5">
            <Button
              type="button"
              size="sm"
              variant={tabMode === "MB" ? "default" : "ghost"}
              className="h-7 text-xs px-2.5"
              onClick={() => setTabMode("MB")}
            >
              Ganti Meter (MB)
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tabMode === "ROLLOVER" ? "default" : "ghost"}
              className="h-7 text-xs px-2.5"
              onClick={() => setTabMode("ROLLOVER")}
            >
              Rollover (Meter Lewat Batas)
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {tabMode === "MB" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">1. Stand Awal Meter Lama</Label>
                <Input
                  type="number"
                  value={standAwalLama}
                  onChange={(e) => setStandAwalLama(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Stand tercatat awal periode.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">2. Stand Angkat Meter Lama</Label>
                <Input
                  type="number"
                  value={standAngkatLama}
                  onChange={(e) => setStandAngkatLama(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Angka saat meter lama dicabut fisik.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">3. Stand Pasang Meter Baru</Label>
                <Input
                  type="number"
                  value={standPasangBaru}
                  onChange={(e) => setStandPasangBaru(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Bawaan meter baru (umumnya 0).
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">4. Stand Catat Meter Baru</Label>
                <Input
                  type="number"
                  value={standMeterBaru}
                  onChange={(e) => setStandMeterBaru(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Angka meter baru saat dicatat petugas.
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs font-semibold text-foreground mb-2">
                Rincian Dekomposisi Perhitungan Ganti Meter:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded border border-border bg-card p-3">
                  <div className="text-muted-foreground">Konsumsi Meter Lama:</div>
                  <div className="font-mono text-sm font-semibold text-foreground mt-1">
                    {standAngkatLama} - {standAwalLama} ={" "}
                    <span className="text-blue-500 font-bold">{pakaiLama} m³</span>
                  </div>
                </div>

                <div className="rounded border border-border bg-card p-3">
                  <div className="text-muted-foreground">Konsumsi Meter Baru:</div>
                  <div className="font-mono text-sm font-semibold text-foreground mt-1">
                    {standMeterBaru} - {standPasangBaru} ={" "}
                    <span className="text-blue-500 font-bold">{pakaiBaru} m³</span>
                  </div>
                </div>

                <div className="rounded border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    Total Pemakaian Tagihan:
                  </div>
                  <div className="font-mono text-base font-extrabold text-blue-700 dark:text-blue-300 mt-1">
                    {pakaiLama} + {pakaiBaru} = {totalPakaiMB} m³
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Stand Meter Lalu (STML)</Label>
                <Input
                  type="number"
                  value={stmlRollover}
                  onChange={(e) => setStmlRollover(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Mendekati batas register (misal 9985).
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Stand Meter Akhir (STMA)</Label>
                <Input
                  type="number"
                  value={stmaRollover}
                  onChange={(e) => setStmaRollover(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">
                  Angka baru yang tampak lebih kecil (misal 18).
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Kapasitas Register Digit Fisik</Label>
                <Select
                  value={String(digitCount)}
                  onValueChange={(v) => setDigitCount(Number(v))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4" className="text-xs">
                      4 Digit (Kapasitas 10.000 m³)
                    </SelectItem>
                    <SelectItem value="5" className="text-xs">
                      5 Digit (Kapasitas 100.000 m³)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground">
                  Jumlah roda angka register odometer meter.
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs font-semibold text-foreground mb-2">
                Analisis Deteksi Rollover:
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-muted-foreground">
                    Rumus: 10^{digitCount} - {stmlRollover} + {stmaRollover}
                  </div>
                  <div className="font-mono text-sm text-foreground">
                    = {Math.pow(10, digitCount)} - {stmlRollover} + {stmaRollover}
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Hasil Pemakaian Rollover Riil
                  </div>
                  <div className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {hasilRollover.pemakaianM3} m³
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------------
// KOMPONEN DOKUMENTASI UTAMA: VERIFIKASI LAPANGAN
// ----------------------------------------------------------------------------
export function VerifikasiLapanganDoc() {
  return (
    <div className="space-y-12">
      {/* 1. Ikhtisar & Nilai Strategis */}
      <section id="ikhtisar" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight first:mt-0 text-foreground">
          1. Ikhtisar &amp; Nilai Strategis Halaman
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Halaman <strong>Verifikasi Pembacaan Petugas</strong> (
          <code className="relative rounded bg-muted px-[0.35rem] py-[0.15rem] font-mono text-[13px] font-semibold text-foreground">
            /verifikasi/baca-petugas
          </code>
          ) merupakan ruang kendali operasional (*mission control*) tertinggi dalam rantai bisnis penagihan air PDAM. Halaman ini berfungsi sebagai <strong>Gatekeeper Tunggal Jaminan Pendapatan (*Revenue Assurance*)</strong> sebelum tagihan diterbitkan menjadi Daftar Rekening Ditagih (DRD).
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <FileCheck2 className="size-4 text-emerald-500" />
                Tab 1: Laporan Masuk
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Memuat seluruh data pembacaan yang telah berhasil disetor oleh petugas lapangan melalui aplikasi mobile (Android), laporan mandiri pelanggan yang telah disetujui, maupun impor berkas LapDataMeter. Verifikator memeriksa kecocokan angka, foto fisik meter, dan persentase deviasi pemakaian.
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                <Eye className="size-4 text-amber-500" />
                Tab 2: Belum Dibaca
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Menampilkan daftar sambungan aktif pada Daftar Catat periode berjalan yang <em>belum memiliki setoran angka</em> sama sekali. Tab ini digunakan oleh manajemen dan supervisor untuk menagih sisa pekerjaan kepada petugas pencatat sebelum batas akhir periode (*closing date*).
            </CardContent>
          </Card>
        </div>

        <DocsCallout type="info" title="Prinsip Single Source of Truth (SSOT)">
          Data pembacaan yang telah disahkan hingga tahap akhir (V3) akan secara otomatis menjadi dasar penagihan rekening resmi. Sebelum status V3 tercapai, data meter berstatus terkunci dari perubahan sembarangan dan dilindungi oleh pencatatan audit (*audit trail*).
        </DocsCallout>
      </section>

      {/* 2. Simulator Taksasi */}
      <section id="simulator-taksasi" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          2. Simulator Interaktif: Engine Taksasi Otomatis
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Uji coba secara langsung kalkulasi matematis yang dijalankan oleh mesin taksasi Elysia di server ketika mendeteksi kondisi meter khusus:
        </p>
        <SimulatorTaksasi />
      </section>

      {/* 3. Simulator MB & Rollover */}
      <section id="simulator-mb-rollover" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          3. Simulator Interaktif: Ganti Meter (MB) &amp; Rollover
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Uji coba mekanisme pergantian meter di tengah periode serta penanganan register meter yang melewati angka maksimum:
        </p>
        <SimulatorMBdanRollover />
      </section>

      {/* 4. Logika Bisnis & Hirarki Taksasi */}
      <section id="logika-taksasi" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          4. Logika Bisnis &amp; Hirarki Metode Taksasi (14 Kondisi)
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Sesuai Peraturan Direksi (Perdir) dan standar industri meter air, jika meter pelanggan tidak dapat dibaca secara riil karena kendala teknis atau fisik, sistem menerapkan taksasi otomatis. Stand meter akhir (<code className="font-mono text-xs">STMA</code>) dipertahankan sama dengan stand bulan lalu (<code className="font-mono text-xs">STML</code>), sedangkan volume pemakaian dihitung dari riwayat pelanggan:
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 border-b border-border text-foreground font-semibold">
              <tr>
                <th className="p-3">Prioritas</th>
                <th className="p-3">Ketersediaan Histori</th>
                <th className="p-3">Metode Taksasi</th>
                <th className="p-3">Formula Komputasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Tingkat 1</td>
                <td className="p-3 font-mono">≥ 12 Bulan</td>
                <td className="p-3 font-medium">Rata-rata 12 Bulan (RATA_RATA_12_BULAN)</td>
                <td className="p-3 font-mono text-[11px]">Math.ceil( Σ(Pakai_12B) / 12 )</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">Tingkat 2</td>
                <td className="p-3 font-mono">3 s/d 11 Bulan</td>
                <td className="p-3 font-medium">3 Pemakaian Tertinggi (TIGA_TERTINGGI)</td>
                <td className="p-3 font-mono text-[11px]">Math.ceil( Σ(Top_3_Pakai) / 3 )</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">Tingkat 3</td>
                <td className="p-3 font-mono">1 s/d 2 Bulan</td>
                <td className="p-3 font-medium">Rata-rata Riwayat Tersedia (RIWAYAT_TERSEDIA)</td>
                <td className="p-3 font-mono text-[11px]">Math.ceil( Σ(Pakai_Ada) / N )</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-semibold text-rose-600 dark:text-rose-400">Tingkat 4</td>
                <td className="p-3 font-mono">0 Bulan (Data Baru)</td>
                <td className="p-3 font-medium">Batas Minimum Perdir (TANPA_HISTORI)</td>
                <td className="p-3 font-mono text-[11px]">Tetap 5 m³ (PEMAKAIAN_MINIMUM_PERDIR)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-heading text-base font-semibold text-foreground pt-3">
          Daftar 14 Kode Kondisi Catat Pemicu Taksasi Otomatis:
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 text-xs font-mono">
          {Array.from(KONDISI_TAKSASI_OTOMATIS).map((kod) => (
            <div
              key={kod}
              className="flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1.5"
            >
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span className="font-medium text-foreground">{kod}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Sistem Pewarnaan Tabel */}
      <section id="palet-warna-tabel" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          5. Sistem Pewarnaan Tabel &amp; Indikator Baris
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Grid verifikasi menerapkan <strong>Palet 5 Warna Terkunci</strong> dengan tingkat opasitas lembut (<em>4% transparent tint</em>) yang nyaman di mata pada tema terang maupun gelap, tanpa mengubah tabel menjadi papan warna yang menyilaukan:
        </p>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full bg-muted-foreground/30 border border-border" />
              <div>
                <div className="text-xs font-bold text-foreground">Abu-abu (Menunggu / Belum Dibaca)</div>
                <div className="text-[11px] text-muted-foreground">
                  Data pembacaan baru masuk dari lapangan dan belum diverifikasi oleh siapapun.
                </div>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">MENUNGGU</Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full bg-amber-500" />
              <div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Amber / Kuning Lembut (V1 Diperiksa)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Telah diperiksa oleh Supervisor Lapangan. Siap divalidasi ke tingkat berikutnya.
                </div>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono text-xs">
              V1
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full bg-blue-500" />
              <div>
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  Biru Lembut (V2 Divalidasi / Terverifikasi Mandiri)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Lolos pemeriksaan tingkat manajemen / koordinator, tinggal menunggu persetujuan akhir.
                </div>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-mono text-xs">
              V2
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full bg-emerald-500" />
              <div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Hijau Lembut (V3 Resmi)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Persetujuan final selesai. Data resmi diterbitkan dan siap ditagihkan ke billing.
                </div>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs">
              V3
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <div className="flex items-center gap-3">
              <span className="size-4 rounded-full bg-rose-500" />
              <div>
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Merah Lembut (Anomali Deviasi / Ditolak)
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Pemakaian melompat tinggi melampaui ambang batas deviasi (misal &gt;50%) atau dikembalikan untuk cek ulang.
                </div>
              </div>
            </div>
            <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 font-mono text-xs">
              ANOMALI / DITOLAK
            </Badge>
          </div>
        </div>

        <h3 className="font-heading text-base font-semibold text-foreground pt-2">
          Indikator Khusus pada Sel Tabel:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded border border-border bg-card p-3">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <span className="size-3 text-blue-500 font-bold">▲</span>
              Segitiga Biru di Sudut Sel
            </div>
            <p className="text-muted-foreground">
              Menandakan kondisi <strong>Meter Baru (MB)</strong>. Memuat metadata stand angkat meter lama dan stand catat meter baru.
            </p>
          </div>

          <div className="rounded border border-border bg-card p-3">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <Users className="size-3.5 text-blue-500" />
              Ikon User Bulat
            </div>
            <p className="text-muted-foreground">
              Menandakan baris berasal dari <strong>Laporan Mandiri Pelanggan</strong> yang telah disetujui verifikator.
            </p>
          </div>

          <div className="rounded border border-border bg-card p-3">
            <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
              <Sliders className="size-3.5 text-amber-500" />
              Ikon Pensil / Manual
            </div>
            <p className="text-muted-foreground">
              Menandakan baris diinput secara manual melalui menu <strong>Manual Add</strong> oleh verifikator kantor.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Arsitektur Tiga Cincin */}
      <section id="alur-tiga-cincin" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          6. Arsitektur Tiga Cincin (V1, V2, V3) &amp; Rollback
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Proses verifikasi mengadopsi prinsip <em>Segregation of Duties</em> dengan 3 benteng persetujuan (Cincin V1, V2, V3):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">Ring 1</Badge>
                <span className="text-xs font-mono text-muted-foreground">Pintasan: F1</span>
              </div>
              <CardTitle className="text-sm font-semibold text-foreground mt-1">
                V1: Pemeriksaan Lapangan
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Mencocokkan foto meteran fisik dengan angka stand akhir (<code className="font-mono text-[11px]">STMA</code>).</p>
              <p>Memeriksa kondisi fisik meter (segel, kejernihan kaca, putaran angka).</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">Ring 2</Badge>
                <span className="text-xs font-mono text-muted-foreground">Pintasan: F2</span>
              </div>
              <CardTitle className="text-sm font-semibold text-foreground mt-1">
                V2: Validasi Manajemen
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Hanya dapat dieksekusi pada data yang telah lulus V1.</p>
              <p>Memvalidasi anomali deviasi persentase pemakaian air terhadap riwayat 3 bulan lalu.</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">Ring 3</Badge>
                <span className="text-xs font-mono text-muted-foreground">Pintasan: F3</span>
              </div>
              <CardTitle className="text-sm font-semibold text-foreground mt-1">
                V3: Persetujuan Resmi Final
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>Hanya dapat dieksekusi pada data yang telah lulus V1 dan V2.</p>
              <p>Menerbitkan baris resmi ke tabel pembacaan dan mengunci nilai pemakaian tagihan.</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="font-heading text-base font-semibold text-foreground pt-2">
          Mekanisme Pembatalan / Rollback Berjenjang:
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Jika terjadi kekeliruan, pembatalan dilakukan secara mundur bertahap:
          <br />
          <code className="font-mono text-xs font-semibold text-foreground">
            V3 (Resmi) → Batal ke V2 → Batal ke V1 → Reset ke SUBMITTED / MENUNGGU
          </code>
          . Khusus status V3 yang telah terkunci billing (<code className="font-mono text-[11px]">LOCKED_BILLING</code>), pembatalan wajib melalui izin otorisasi Administrator Billing.
        </p>
      </section>

      {/* 7. Fitur Edit Inline & Koreksi */}
      <section id="edit-inline-koreksi" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          7. Fitur Koreksi Data &amp; Edit Inline Pembacaan
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Verifikator dapat mengoreksi data pembacaan langsung melalui klik kanan pada baris tabel atau membuka menu Koreksi:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="font-semibold text-xs text-foreground flex items-center gap-2">
              <Sliders className="size-4 text-amber-500" />
              1. Koreksi Stand &amp; Pemakaian Tagihan
            </div>
            <p className="text-xs text-muted-foreground">
              Verifikator dapat mengisi <code className="font-mono text-[11px]">Stand Akhir Revisi</code> atau langsung menetapkan <code className="font-mono text-[11px]">Pemakaian Tagih Verifikasi (m³)</code> jika angka meter buram atau terjadi kesalahan input oleh petugas lapangan.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="font-semibold text-xs text-foreground flex items-center gap-2">
              <RotateCcw className="size-4 text-blue-500" />
              2. Koreksi Kondisi Catat Meter
            </div>
            <p className="text-xs text-muted-foreground">
              Mengubah kode kondisi catat dari 21 pilihan resmi (misal dari <code className="font-mono text-[11px]">NORMAL</code> menjadi <code className="font-mono text-[11px]">METER_RUSAK</code>). Mengubah kondisi ke salah satu dari 14 kode pemicu akan otomatis mengaktifkan engine taksasi.
            </p>
          </div>
        </div>

        <DocsCallout type="warning" title="Audit Trail Terjamin">
          Setiap tindakan koreksi tidak menghapus angka asli setoran petugas lapangan. Sistem menyimpan angka catat awal, nama verifikator yang mengubah, waktu koreksi, serta alasan perubahan untuk keperluan audit BPKP/Inspektorat.
        </DocsCallout>
      </section>

      {/* 8. Aksi Massal */}
      <section id="aksi-massal-batch" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          8. Aksi Massal (Bulk Actions) &amp; Protokol Batch 500
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Untuk memproses ribuan data secara cepat, tersedia bilah aksi massal di bagian bawah tabel yang muncul otomatis ketika satu atau lebih baris dipilih:
        </p>

        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <div className="text-xs font-semibold text-foreground">
            Fitur Proteksi Operasional Aksi Massal:
          </div>
          <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
            <li>
              <strong>Batas Transaksi Maksimal 500 Baris:</strong> Setiap permintaan verifikasi massal dibatasi maksimal 500 baris per kiriman ke server untuk mencegah timeout jaringan dan menjaga integritas database ACID.
            </li>
            <li>
              <strong>Penyaring Keamanan Anomali:</strong> Secara bawaan (<em>default</em>), baris yang mengandung anomali deviasi <strong>dilewati secara otomatis</strong> dari eksekusi massal, kecuali verifikator secara sadar mencentang opsi <em>"Sertakan data anomali"</em>.
            </li>
            <li>
              <strong>Dialog Konfirmasi Ganda:</strong> Menampilkan ringkasan jumlah baris yang berhasil, dilewati, atau gagal sebelum dan sesudah eksekusi.
            </li>
          </ul>
        </div>
      </section>

      {/* 9. Drawer Panel Pemeriksaan Detail */}
      <section id="drawer-pemeriksaan" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          9. Panel Pemeriksaan Detail: Foto, GPS &amp; Konsumsi
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Saat sebuah baris diklik, panel detail sisi kanan (*side drawer*) akan menampilkan informasi komprehensif pelanggan:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Camera className="size-4 text-blue-500" />
              Tab Foto Multi-Bukti
            </div>
            <p className="text-xs text-muted-foreground">
              Menampilkan Foto Meter Resolusi Tinggi, Foto Rumah/Pagar, dan Foto Segel. Dilengkapi fitur zoom perbesaran, rotasi 90°, dan komparasi foto bulan lalu berdampingan (*side-by-side*).
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <MapPin className="size-4 text-emerald-500" />
              Peta Lokasi Geotagging
            </div>
            <p className="text-xs text-muted-foreground">
              Peta interaktif Leaflet/OpenStreetMap yang membandingkan koordinat GPS saat petugas menekan tombol simpan di HP terhadap koordinat master pelanggan, lengkap dengan kalkulasi deviasi jarak (meter).
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <TrendingUp className="size-4 text-amber-500" />
              Grafik Histori Konsumsi
            </div>
            <p className="text-xs text-muted-foreground">
              Grafik batang pemakaian air 3 sampai 12 bulan terakhir untuk memvalidasi tren kenaikan atau penurunan konsumsi air pelanggan secara visual.
            </p>
          </div>
        </div>
      </section>

      {/* 10. Pintasan Keyboard */}
      <section id="pintasan-keyboard" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          10. Panduan Pintasan Papan Ketik (Keyboard-First)
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Seluruh alur kerja verifikasi dirancang untuk efisiensi tinggi tanpa perlu sering menggerakkan tetikus (*mouse*):
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 border-b border-border text-foreground font-semibold">
              <tr>
                <th className="p-3">Tombol Pintasan</th>
                <th className="p-3">Fungsi Operasional</th>
                <th className="p-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">F1</td>
                <td className="p-3">Verifikasi Cincin V1 (Periksa)</td>
                <td className="p-3 text-muted-foreground">Membuka konfirmasi V1 untuk baris terpilih</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">F2</td>
                <td className="p-3">Verifikasi Cincin V2 (Validasi)</td>
                <td className="p-3 text-muted-foreground">Membuka konfirmasi V2 untuk baris terpilih</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">F3</td>
                <td className="p-3">Verifikasi Cincin V3 (Resmi)</td>
                <td className="p-3 text-muted-foreground">Membuka konfirmasi penerbitan resmi V3</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono">↑ / ↓ (Panah)</td>
                <td className="p-3">Navigasi Antar Baris Tabel</td>
                <td className="p-3 text-muted-foreground">Berpindah baris aktif dan otomatis memuat panel detail</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono">Space (Spasi)</td>
                <td className="p-3">Centang / Lepas Baris Aktif</td>
                <td className="p-3 text-muted-foreground">Menambah atau menghapus baris dari seleksi aksi massal</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono">Shift + Klik</td>
                <td className="p-3">Pilih Rentang Baris</td>
                <td className="p-3 text-muted-foreground">Memilih puluhan baris sekaligus dari baris A ke baris B</td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="p-3 font-mono">Esc</td>
                <td className="p-3">Batal Pilih / Tutup Modal</td>
                <td className="p-3 text-muted-foreground">Mengosongkan semua baris terpilih atau menutup dialog</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 11. SOP Operasional & Konflik Mandiri */}
      <section id="sop-hak-akses" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          11. SOP Operasional, Matriks Wewenang &amp; Konflik Mandiri
        </h2>
        <p className="leading-7 text-[15px] text-foreground/90">
          Penanganan skenario pelaporan ganda (Konsumen lapor mandiri vs Petugas lapor lapangan):
        </p>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500" />
              Skenario A: Mandiri Disetujui Tanggal 4, Petugas Catat Angka Beda Tanggal 6
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Jika laporan mandiri konsumen telah disahkan oleh verifikator, setoran mobile petugas lapangan <strong>TIDAK langsung menimpa data</strong>. Sistem mendeteksi diskrepansi (<code className="font-mono text-[11px]">BEDA_STAND_MANDIRI_PETUGAS</code>), menandai status menjadi <code className="font-mono text-[11px]">ANOMALY</code>, dan menyimpan riwayat kedua angka untuk diputuskan oleh Supervisor.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="text-xs font-semibold text-foreground flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              Skenario B: Petugas Catat Lebih Dahulu, Lalu Mandiri Disetujui
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Saat verifikator menyetujui laporan mandiri di atas data petugas yang sudah ada, sistem secara otomatis mengambil cadangan snapshot: <code className="font-mono text-[11px]">[PREV_PETUGAS:...]</code>. Jika di kemudian hari laporan mandiri tersebut dibatalkan (*unverify*), sistem secara otomatis memulihkan (*rollback*) data petugas semula.
            </p>
          </div>
        </div>
      </section>

      {/* 12. FAQ */}
      <section id="faq" className="space-y-4">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          12. Pertanyaan Umum (FAQ) &amp; Penyelesaian Masalah
        </h2>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-bold text-foreground">
              Q: Mengapa tombol V3 tidak dapat ditekan atau berwarna abu-abu redup?
            </div>
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
              A: Tombol V3 memiliki prasyarat ketat: baris harus telah disetujui pada tahap V1 dan V2 terlebih dahulu. Selain itu, pastikan akun Anda memiliki peran otorisasi Manajer atau Senior Manager/Admin.
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-bold text-foreground">
              Q: Apakah data LapDataMeter yang diimpor akan menampilkan foto mandiri lama?
            </div>
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
              A: Tidak. Sistem Elysia kini menerapkan isolasi sumber catat ketat. Setiap penimpaan LapDataMeter secara otomatis mereset URL foto meteran lama menjadi kosong (<code className="font-mono text-[11px]">NULL</code>) guna mencegah foto mandiri usang tertinggal di panel verifikasi.
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-bold text-foreground">
              Q: Bagaimana jika pelanggan baru tidak memiliki histori pemakaian sama sekali saat meter rusak?
            </div>
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
              A: Mesin taksasi secara otomatis mengaktifkan Tingkat 4 (<code className="font-mono text-[11px]">TANPA_HISTORI</code>) dan membebankan pemakaian minimum sesuai Peraturan Direksi sebesar 5 m³.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
