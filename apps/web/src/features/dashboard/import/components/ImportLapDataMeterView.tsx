// features/dashboard/import/components/ImportLapDataMeterView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportHeader } from "./ImportHeader";
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Database,
  Upload,
  Sparkles,
  AlertCircle,
  Search,
  Layers,
  Gauge,
  Users,
} from "lucide-react";

export interface LapDataMeterRow {
  thbl: string;
  nolg: string;
  nama?: string;
  alamat?: string;
  stml: number;
  stma: number;
  stmaCatat?: number;
  pakaiM3: number;
  pakaiLalu?: number;
  persentase?: number;
  trf?: string;
  tmss?: string;
  ketCatat: string;
  petugasId?: string;
  namaPetugas?: string;
  kdWm?: string;
  wil?: string;
  ruteKode?: string;
  zonaWil?: string;
  kdZonasi?: string;
  namaZonasi?: string;
  kecamatan?: string;
  kelurahan?: string;
  tglCatat: string;
  tglUpload?: string;
  catatan?: string;
}

export function ImportLapDataMeterView() {
  const [items, setItems] = React.useState<LapDataMeterRow[]>([]);
  const [csvRaw, setCsvRaw] = React.useState<string>("");
  const [fileName, setFileName] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isLoadingSample, setIsLoadingSample] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<{
    total: number;
    sukses: number;
    gagal: number;
    created?: number;
    updated?: number;
  } | null>(null);

  // Parse CSV standar RFC-4180
  const parseLapDataMeterText = (text: string): LapDataMeterRow[] => {
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

    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
    const findIdx = (aliases: string[]) =>
      header.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

    const nolgIdx = findIdx(["no pel", "nolg", "nomor pelanggan", "nopel"]);
    const namaIdx = findIdx(["nama", "nama pelanggan"]);
    const alamatIdx = findIdx(["alamat"]);
    const thblIdx = findIdx(["periode", "thbl"]);
    const stmlIdx = findIdx(["st awal", "stml", "stand awal"]);
    const stmaIdx = findIdx(["st akhir", "stma", "stand akhir"]);
    const stmaCatatIdx = findIdx(["st akhir catat"]);
    const pakaiIdx = findIdx(["pakai", "pakai_m3", "kubikasi"]);
    const pakaiLaluIdx = findIdx(["pakai lau", "pakai lalu", "pakai_lalu"]);
    const persenIdx = findIdx(["persentase", "persen"]);
    const trfIdx = findIdx(["trf", "tarif", "kd_goltarif", "golongan"]);
    const tmssIdx = findIdx(["kd_kel", "tmss", "kode_kondisi"]);
    const ketCatatIdx = findIdx(["nm_kel", "kondisi", "ket_catat", "keterangan"]);
    const petugasIdx = findIdx(["kd_petugas", "petugas_id"]);
    const namaPetugasIdx = findIdx(["nama petugas"]);
    const kdWmIdx = findIdx(["kd_wm", "nometer", "no_meter"]);
    const wilIdx = findIdx(["wil", "wilayah"]);
    const ruteIdx = findIdx(["rute", "rute_kode", "kd_rute"]);
    const zonaWilIdx = findIdx(["zona wil", "zona"]);
    const kdZonasiIdx = findIdx(["kd zonasi", "kode zonasi"]);
    const namaZonasiIdx = findIdx(["nama zonasi"]);
    const kecIdx = findIdx(["kecamatan"]);
    const kelIdx = findIdx(["kelurahan"]);
    const tglCatatIdx = findIdx(["tgl_catat", "tanggal catat"]);
    const tglUploadIdx = findIdx(["tgl_upload"]);

    const parsed: LapDataMeterRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
      if (parts.length < 3) continue;

      const rawNolg = (nolgIdx >= 0 ? parts[nolgIdx] : "")?.replace(/[^\w-]/g, "").trim();
      const rawThbl = (thblIdx >= 0 ? parts[thblIdx] : "")?.replace(/[^\w]/g, "").trim();
      if (!rawNolg || !rawThbl) continue;

      const stml = stmlIdx >= 0 && parts[stmlIdx] ? parseFloat(parts[stmlIdx].replace(",", ".")) || 0 : 0;
      const stma = stmaIdx >= 0 && parts[stmaIdx] ? parseFloat(parts[stmaIdx].replace(",", ".")) || 0 : 0;
      const stmaCatat = stmaCatatIdx >= 0 && parts[stmaCatatIdx] ? parseFloat(parts[stmaCatatIdx].replace(",", ".")) : undefined;
      const pakaiM3 =
        pakaiIdx >= 0 && parts[pakaiIdx] !== "" && parts[pakaiIdx] !== undefined
          ? parseFloat(parts[pakaiIdx].replace(",", ".")) || 0
          : Math.max(0, stma - stml);
      const pakaiLalu =
        pakaiLaluIdx >= 0 && parts[pakaiLaluIdx] !== "" && parts[pakaiLaluIdx] !== undefined
          ? parseFloat(parts[pakaiLaluIdx].replace(",", ".")) || 0
          : undefined;
      const persentase =
        persenIdx >= 0 && parts[persenIdx] !== "" && parts[persenIdx] !== undefined
          ? parseFloat(parts[persenIdx].replace(",", "."))
          : undefined;

      const nama = namaIdx >= 0 ? parts[namaIdx]?.trim() : undefined;
      const alamat = alamatIdx >= 0 ? parts[alamatIdx]?.trim() : undefined;
      const trf = trfIdx >= 0 ? parts[trfIdx]?.trim() : undefined;
      const tmssRaw = tmssIdx >= 0 ? parts[tmssIdx]?.trim() : "-";
      const tmss = tmssRaw === "" ? "-" : tmssRaw;
      const ketCatat = ketCatatIdx >= 0 && parts[ketCatatIdx]?.trim() ? parts[ketCatatIdx].trim() : "Normal";
      const petugasId =
        (petugasIdx >= 0 && parts[petugasIdx]?.trim()) ||
        (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) ||
        undefined;
      const namaPetugas = (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) || petugasId;
      const kdWm = kdWmIdx >= 0 ? parts[kdWmIdx]?.trim() : undefined;
      const wil = wilIdx >= 0 ? parts[wilIdx]?.trim() : undefined;
      const ruteKode = ruteIdx >= 0 ? parts[ruteIdx]?.trim() : undefined;
      const zonaWil = zonaWilIdx >= 0 ? parts[zonaWilIdx]?.trim() : undefined;
      const kdZonasi = kdZonasiIdx >= 0 ? parts[kdZonasiIdx]?.trim() : undefined;
      const namaZonasi = namaZonasiIdx >= 0 ? parts[namaZonasiIdx]?.trim() : undefined;
      const kecamatan = kecIdx >= 0 ? parts[kecIdx]?.trim() : undefined;
      const kelurahan = kelIdx >= 0 ? parts[kelIdx]?.trim() : undefined;
      const tglCatat =
        tglCatatIdx >= 0 && parts[tglCatatIdx]?.trim()
          ? parts[tglCatatIdx].trim()
          : new Date().toISOString();
      const tglUpload = tglUploadIdx >= 0 && parts[tglUploadIdx]?.trim() ? parts[tglUploadIdx].trim() : undefined;

      parsed.push({
        thbl: rawThbl,
        nolg: rawNolg,
        nama,
        alamat,
        stml,
        stma,
        stmaCatat,
        pakaiM3,
        pakaiLalu,
        persentase,
        trf,
        tmss,
        ketCatat,
        petugasId,
        namaPetugas,
        kdWm,
        wil,
        ruteKode,
        zonaWil,
        kdZonasi,
        namaZonasi,
        kecamatan,
        kelurahan,
        tglCatat,
        tglUpload,
        catatan: namaZonasi ? `Zonasi: ${namaZonasi} (Rute ${ruteKode || "-"})` : "Import Laporan Data Meter",
      });
    }

    return parsed;
  };

  // Muat sample default dari server
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch("/api/import/sample/lapdatameter");
      const json = await res.json();
      if (json.success && json.rows && json.rows.length > 0) {
        setItems(json.rows);
        setCsvRaw(json.csvText || "");
        setFileName("lapdatametertes.csv (Sample Resmi)");
        setResultStats(null);
        toast.success(`Berhasil memuat ${json.rows.length} baris sample resmi LapDataMeter!`);
      } else {
        toast.info(json.message || "File sample lapdatameter tidak ditemukan.");
      }
    } catch {
      toast.error("Gagal memuat sample LapDataMeter dari server.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvRaw(text);
        const parsed = parseLapDataMeterText(text);
        setItems(parsed);
        setResultStats(null);
        if (parsed.length > 0) {
          toast.success(`Berhasil membaca ${parsed.length} baris data dari ${file.name}!`);
        } else {
          toast.warning("Format CSV tidak dikenali atau tidak ada baris data valid.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (items.length === 0) {
      toast.error("Tidak ada baris data LapDataMeter untuk diproses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/import/lapdatameter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengimpor data LapDataMeter.");
      }

      setResultStats({
        total: items.length,
        sukses: json.sukses ?? items.length,
        gagal: json.gagal ?? 0,
        created: json.created ?? 0,
        updated: json.updated ?? 0,
      });

      toast.success(
        `Sukses! Berhasil memetakan ${json.sukses ?? items.length} baris data meter ke tabel cater_baca_meter.`
      );
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengimpor data LapDataMeter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setItems([]);
    setCsvRaw("");
    setFileName("");
    setResultStats(null);
    setSearchQuery("");
    toast.info("Tampilan data import telah dibersihkan.");
  };

  // Metrik Statistik
  const totalKubikasi = React.useMemo(() => {
    return items.reduce((sum, item) => sum + (item.pakaiM3 || 0), 0);
  }, [items]);

  const terbacaNormalCount = React.useMemo(() => {
    return items.filter((i) => i.ketCatat.toLowerCase().includes("normal") || i.tmss === "-" || i.tmss === " ").length;
  }, [items]);

  const kendalaCount = items.length - terbacaNormalCount;
  const activePeriode = items[0]?.thbl || "-";

  // Filter Baris Preview
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items.slice(0, 50);
    const q = searchQuery.toLowerCase().trim();
    return items
      .filter(
        (i) =>
          i.nolg.toLowerCase().includes(q) ||
          (i.nama && i.nama.toLowerCase().includes(q)) ||
          (i.ruteKode && i.ruteKode.toLowerCase().includes(q)) ||
          (i.petugasId && i.petugasId.toLowerCase().includes(q)) ||
          i.ketCatat.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [items, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <ImportHeader
        title="Import LapDataMeter (Laporan Bulanan PDAM)"
        badge="Tabel cater_baca_meter"
        description="Spesifikasi & modul import resmi berkas laporan pembacaan meter bulanan (lapdatameter). Otomatis memetakan angka stand awal (stml), stand akhir (stma), kubikasi pemakaian, kondisi catat (tmss/ket_catat), rute, dan petugas lapangan ke tabel cater_baca_meter."
        icon={FileSpreadsheet}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              disabled={isSubmitting || isLoadingSample}
            >
              <Sparkles className="mr-1.5 size-3.5 text-amber-500" />
              {isLoadingSample ? "Memuat..." : "Muat Contoh LapDataMeter"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isSubmitting}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Reset
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-1.5 size-3.5 text-primary" />
                  Unggah CSV LapDataMeter
                </span>
              </Button>
            </label>
            <Button size="sm" onClick={handleImport} disabled={isSubmitting || items.length === 0}>
              <Database className="mr-1.5 size-4" />
              {isSubmitting ? "Memproses Ingestion..." : `Import ${items.length} Data ke cater_baca_meter`}
            </Button>
          </div>
        }
      />

      {/* 2. Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Baris Meter</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{items.length.toLocaleString("id-ID")}</div>
            <p className="text-[11px] text-muted-foreground truncate">{fileName || "Belum ada berkas dimuat"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Pemakaian</CardTitle>
            <Gauge className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400">
              {totalKubikasi.toLocaleString("id-ID")} <span className="text-xs font-normal text-muted-foreground">m³</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Akumulasi volume air terbaca</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Status Kondisi</CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {terbacaNormalCount.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Normal terbaca &bull; <span className="text-amber-500 font-medium">{kendalaCount} kendala/akses</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Periode Pembacaan</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{activePeriode}</div>
            <p className="text-[11px] text-muted-foreground">Format baku YYYYMM (THBL)</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Notifikasi Hasil Import */}
      {resultStats && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Proses Import Selesai dengan Sukses!
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {resultStats.total} baris data diproses &bull; {resultStats.sukses} berhasil &bull;{" "}
                  {resultStats.created ?? 0} transaksi baru dibuat &bull; {resultStats.updated ?? 0} data stand
                  diperbarui &bull; {resultStats.gagal} gagal.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 font-mono text-xs w-fit">
              cater_baca_meter: SYNC OK
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* 4. Tabel Preview Pemetaan */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Preview Pemetaan Kolom LapDataMeter &rarr; cater_baca_meter
            </CardTitle>
            <CardDescription className="text-xs">
              Menampilkan {Math.min(filteredItems.length, 50)} dari {items.length} data baris hasil parsing.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari No Pel / Nama / Rute..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b font-medium">
                <tr>
                  <th className="py-2.5 px-3">Periode</th>
                  <th className="py-2.5 px-3">No. Pelanggan (NOLG)</th>
                  <th className="py-2.5 px-3">Nama Pelanggan</th>
                  <th className="py-2.5 px-3">Rute</th>
                  <th className="py-2.5 px-3 text-right">Stand Awal (STML)</th>
                  <th className="py-2.5 px-3 text-right">Stand Akhir (STMA)</th>
                  <th className="py-2.5 px-3 text-right">Pakai (m³)</th>
                  <th className="py-2.5 px-3 text-right">Pakai Lalu</th>
                  <th className="py-2.5 px-3">Kondisi / TMSS</th>
                  <th className="py-2.5 px-3">Petugas</th>
                  <th className="py-2.5 px-3">Tgl Catat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="size-8 text-muted-foreground/40" />
                        <p className="font-medium text-foreground">Belum ada data LapDataMeter yang dimuat</p>
                        <p className="text-xs">
                          Klik <strong>&ldquo;Muat Contoh LapDataMeter&rdquo;</strong> atau unggah berkas CSV Anda.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      Tidak ada data yang sesuai dengan pencarian &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row, idx) => (
                    <tr key={`${row.nolg}-${idx}`} className="hover:bg-muted/30 transition-colors font-mono">
                      <td className="py-2 px-3 text-foreground font-semibold">{row.thbl}</td>
                      <td className="py-2 px-3 text-primary font-semibold">{row.nolg}</td>
                      <td className="py-2 px-3 font-sans truncate max-w-[160px] text-foreground font-medium">
                        {row.nama || "-"}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                          {row.ruteKode || "-"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right">{row.stml.toLocaleString("id-ID")}</td>
                      <td className="py-2 px-3 text-right font-semibold text-foreground">
                        {row.stma.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-sky-600 dark:text-sky-400">
                        {row.pakaiM3.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-3 text-right text-muted-foreground">
                        {row.pakaiLalu !== undefined ? row.pakaiLalu.toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${
                              row.ketCatat.toLowerCase().includes("normal")
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="truncate max-w-[120px] text-[11px]">{row.ketCatat}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans text-[11px] text-muted-foreground">
                        {row.petugasId || row.namaPetugas || "-"}
                      </td>
                      <td className="py-2 px-3 text-[10px] text-muted-foreground truncate max-w-[100px]">
                        {row.tglCatat?.slice(0, 10) || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
