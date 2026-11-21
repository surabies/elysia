// features/dashboard/import/components/ImportDataPencatatanView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportHeader } from "./ImportHeader";
import {
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  Database,
  Upload,
  Info,
  AlertCircle,
} from "lucide-react";

interface PencatatanRow {
  thbl: string;
  nolg: string;
  stml: number;
  stma: number;
  pakaiM3: number;
  tglCatat: string;
  petugasId: string;
  ruteKode: string;
  ketCatat: string;
  latitude?: number;
  longitude?: number;
  catatan?: string;
}

const SAMPLE_CSV_TEXT = `thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
202601;00703600750;120;138;18;2026-01-19 07:39:00;PETUGAS01;CD305;Normal;-6.917464;107.619123;Meter normal terbaca jelas
202601;101900821;45;62;17;2026-01-19 07:36:00;PETUGAS02;KD309;Normal;-6.918512;107.618451;Sinyal terputus saat kirim
202601;403100658;210;235;25;2026-01-19 07:29:00;PETUGAS03;KC302;Normal;-6.920145;107.617892;Pulih dari backup HP`;

export function ImportDataPencatatanView() {
  const [csvText, setCsvText] = React.useState(SAMPLE_CSV_TEXT);
  const [items, setItems] = React.useState<PencatatanRow[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<{ total: number; sukses: number; gagal: number } | null>(null);

  // Parse CSV awal
  React.useEffect(() => {
    parseCsv(SAMPLE_CSV_TEXT);
  }, []);

  const parseCsv = (text: string) => {
    // Robust CSV tokenizer
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (!insideQuotes && (char === "," || char === ";")) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (!insideQuotes && (char === "\r" || char === "\n")) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) {
      setItems([]);
      return;
    }

    const header = rows[0].map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    const findIdx = (aliases: string[]) =>
      header.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

    const thblIdx = findIdx(["thbl", "periode"]);
    const nolgIdx = findIdx(["nolg", "no pel", "nomor pelanggan"]);
    const stmlIdx = findIdx(["stml", "st awal", "stand awal"]);
    const stmaIdx = findIdx(["stma", "st akhir", "stand akhir"]);
    const pakaiIdx = findIdx(["pakai_m3", "pakai", "kubikasi"]);
    const tglIdx = findIdx(["tgl_catat", "tanggal catat"]);
    const petugasIdx = findIdx(["petugas_id", "kd_petugas", "nama petugas"]);
    const ruteIdx = findIdx(["rute_kode", "rute", "kd_rute"]);
    const kondisiIdx = findIdx(["kondisi", "nm_kel", "ket_catat", "kd_kel"]);
    const latIdx = findIdx(["latitude", "lat"]);
    const lngIdx = findIdx(["longitude", "lng", "long"]);
    const catatanIdx = findIdx(["catatan", "nama zonasi"]);

    const parsed: PencatatanRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
      if (parts.length < 3) continue;

      const rawNolg = (nolgIdx >= 0 ? parts[nolgIdx] : "")?.replace(/[^\w-]/g, "").trim();
      const rawThbl = (thblIdx >= 0 ? parts[thblIdx] : "")?.replace(/[^\w]/g, "").trim();
      if (!rawNolg) continue;

      const stml = stmlIdx >= 0 && parts[stmlIdx] ? parseFloat(parts[stmlIdx].replace(",", ".")) || 0 : 0;
      const stma = stmaIdx >= 0 && parts[stmaIdx] ? parseFloat(parts[stmaIdx].replace(",", ".")) || 0 : 0;
      const pakaiM3 =
        pakaiIdx >= 0 && parts[pakaiIdx] !== "" && parts[pakaiIdx] !== undefined
          ? parseFloat(parts[pakaiIdx].replace(",", ".")) || 0
          : Math.max(0, stma - stml);

      parsed.push({
        thbl: rawThbl || "202601",
        nolg: rawNolg,
        stml,
        stma,
        pakaiM3,
        tglCatat: (tglIdx >= 0 && parts[tglIdx]?.trim()) || new Date().toISOString(),
        petugasId: (petugasIdx >= 0 && parts[petugasIdx]?.trim()) || "PETUGAS_LAPANGAN",
        ruteKode: (ruteIdx >= 0 && parts[ruteIdx]?.trim()) || "-",
        ketCatat: (kondisiIdx >= 0 && parts[kondisiIdx]?.trim()) || "Normal",
        latitude: latIdx >= 0 && parts[latIdx] ? parseFloat(parts[latIdx]) : undefined,
        longitude: lngIdx >= 0 && parts[lngIdx] ? parseFloat(parts[lngIdx]) : undefined,
        catatan: (catatanIdx >= 0 && parts[catatanIdx]?.trim()) || "Import Stand Meter",
      });
    }

    setItems(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        parseCsv(text);
        toast.success(`Berhasil membaca file ${file.name}!`);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Tidak ada baris data pencatatan untuk diproses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/import/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengimpor data pencatatan.");
      }

      setResultStats({
        total: items.length,
        sukses: json.data?.sukses ?? items.length,
        gagal: json.data?.gagal ?? 0,
      });

      toast.success(
        `Sukses! Berhasil menyerap ${json.data?.sukses ?? items.length} baris data bacaan meter ke database cater_baca_meter!`
      );
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengimpor data pencatatan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCsvText(SAMPLE_CSV_TEXT);
    parseCsv(SAMPLE_CSV_TEXT);
    setResultStats(null);
    toast.info("Format contoh data pencatatan mobile dimuat ulang.");
  };

  // Statistik
  const totalKubikasi = React.useMemo(() => {
    return items.reduce((sum, item) => sum + (item.pakaiM3 || 0), 0);
  }, [items]);

  const normalCount = React.useMemo(() => {
    return items.filter((i) => i.ketCatat.toLowerCase().includes("normal")).length;
  }, [items]);

  const kendalaCount = items.length - normalCount;

  return (
    <div className="space-y-4">
      {/* 1. Header Halaman */}
      <ImportHeader
        title="Import Data Pencatatan (Stand Recovery)"
        badge="Batch Ingestion"
        description="Spesifikasi baku & modul impor data transaksi angka stand meter pembacaan mobile. Otomatis terintegrasi dengan foto backup (stand, segel, rumah) berdasarkan kombinasi THBL & Nomor Langganan."
        icon={UploadCloud}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isSubmitting} className="h-8 text-label-12 cursor-pointer">
              <RefreshCw className="mr-1.5 size-3.5" />
              Reset Contoh
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.txt,.json" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" asChild className="h-8 text-label-12 cursor-pointer">
                <span>
                  <Upload className="mr-1.5 size-3.5 text-primary" />
                  Unggah CSV Mobile
                </span>
              </Button>
            </label>
            <Button size="sm" onClick={handleImport} disabled={isSubmitting || items.length === 0} className="h-8 px-3 text-label-12 font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Database className="mr-1.5 size-3.5" />
              {isSubmitting ? "Memproses..." : "Import Data Meter"}
            </Button>
          </div>
        }
      />

      {/* 2. Kartu Statistik / Ringkasan Eksekutif */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-border bg-card p-3.5 transition-colors hover:border-border/80">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Total Baris Data</span>
              <FileSpreadsheet className="size-4 text-primary" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {items.length.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">Baris</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              <span>Baris transaksi siap diproses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-sky-500/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Total Pemakaian</span>
              <Info className="size-4 text-sky-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400 font-mono">
                {totalKubikasi.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">m³</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-sky-500" />
              <span>Akumulasi volume air terbaca</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-emerald-500/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Kondisi Normal</span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {normalCount.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">Normal</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              <span>{kendalaCount} kendala</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-indigo-500/30 col-span-2 sm:col-span-1">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Periode Aktif</span>
              <AlertCircle className="size-4 text-indigo-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-mono">
                {items[0]?.thbl || "-"}
              </span>
              <span className="text-label-11 text-muted-foreground">THBL</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-indigo-500" />
              <span>Format baku YYYYMM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Notifikasi Hasil Import */}
      {resultStats && (
        <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Import Data Pencatatan Sukses
                </span>
                <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                  Batch Selesai
                </Badge>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Total {resultStats.total} baris: {resultStats.sukses} terserap ke database cater_baca_meter, {resultStats.gagal} gagal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Badge className="bg-emerald-600 text-white">Status: Terverifikasi</Badge>
          </div>
        </div>
      )}

      {/* 4. Area Pratinjau Tabel / Empty State */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-label-12">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Data angka stand meter lalu (STML) dan akhir (STMA) yang siap dipetakan ke database cater_baca_meter.
            </span>
            <span>·</span>
            <span className="text-muted-foreground">
              {items.length} Baris Transaksi
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-4" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-2.5 px-3">No. Langganan</th>
                <th className="py-2.5 px-3">Periode</th>
                <th className="py-2.5 px-3">Stand Lalu</th>
                <th className="py-2.5 px-3">Stand Akhir</th>
                <th className="py-2.5 px-3">Kubikasi</th>
                <th className="py-2.5 px-3">Waktu Catat</th>
                <th className="py-2.5 px-3">Petugas</th>
                <th className="py-2.5 px-3">Rute</th>
                <th className="py-2.5 px-3">Kondisi</th>
                <th className="py-2.5 px-3">Koordinat GPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="size-8 text-muted-foreground/40" />
                      <p className="font-medium text-foreground">Belum ada data pencatatan yang dimuat</p>
                      <p className="text-xs">
                        Klik <strong>&ldquo;Reset Contoh&rdquo;</strong> atau unggah berkas CSV Anda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={`${row.nolg}-${idx}`} className="transition-colors hover:bg-muted/30 font-mono">
                    <td className="py-2 px-3 font-medium text-foreground">{row.nolg}</td>
                    <td className="py-2 px-3 font-mono">{row.thbl}</td>
                    <td className="py-2 px-2 text-muted-foreground">{row.stml} m³</td>
                    <td className="py-2 px-2 font-semibold text-foreground">{row.stma} m³</td>
                    <td className="py-2 px-2 font-semibold text-primary">{row.pakaiM3} m³</td>
                    <td className="py-2 px-2 text-muted-foreground">{row.tglCatat}</td>
                    <td className="py-2 px-2 font-mono">{row.petugasId}</td>
                    <td className="py-2 px-2 font-mono">{row.ruteKode}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-[10px]">
                        {row.ketCatat}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-muted-foreground">
                      {row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
