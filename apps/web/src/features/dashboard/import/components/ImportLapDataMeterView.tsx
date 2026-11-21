// features/dashboard/import/components/ImportLapDataMeterView.tsx
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
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Database,
  Upload,
  Sparkles,
  Search,
  Layers,
  Gauge,
  Users,
} from "lucide-react";

export interface LapDataMeterRow {
  thbl: string;
  nolg: string;
  nama?: string;
  stml: number;
  stma: number;
  pakaiM3: number;
  pakaiLalu?: number;
  tmss?: string;
  ketCatat: string;
  petugasId?: string;
  namaPetugas?: string;
  ruteKode?: string;
  tglCatat: string;
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
    const thblIdx = findIdx(["periode", "thbl"]);
    const stmlIdx = findIdx(["st awal", "stml", "stand awal"]);
    const stmaIdx = findIdx(["st akhir", "stma", "stand akhir"]);
    const pakaiIdx = findIdx(["pakai", "pakai_m3", "kubikasi"]);
    const pakaiLaluIdx = findIdx(["pakai lau", "pakai lalu", "pakai_lalu"]);
    const tmssIdx = findIdx(["kd_kel", "tmss", "kode_kondisi"]);
    const ketCatatIdx = findIdx(["nm_kel", "kondisi", "ket_catat", "keterangan"]);
    const petugasIdx = findIdx(["kd_petugas", "petugas_id"]);
    const namaPetugasIdx = findIdx(["nama petugas"]);
    const ruteIdx = findIdx(["rute", "rute_kode", "kd_rute"]);
    const tglCatatIdx = findIdx(["tgl_catat", "tanggal catat"]);

    const parsed: LapDataMeterRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
      if (parts.length < 3) continue;

      const rawNolg = (nolgIdx >= 0 ? parts[nolgIdx] : "")?.replace(/[^\w-]/g, "").trim();
      const rawThbl = (thblIdx >= 0 ? parts[thblIdx] : "")?.replace(/[^\w]/g, "").trim();
      if (!rawNolg || !rawThbl) continue;

      const stml = stmlIdx >= 0 && parts[stmlIdx] ? parseFloat(parts[stmlIdx].replace(",", ".")) || 0 : 0;
      const stma = stmaIdx >= 0 && parts[stmaIdx] ? parseFloat(parts[stmaIdx].replace(",", ".")) || 0 : 0;
      const pakaiM3 =
        pakaiIdx >= 0 && parts[pakaiIdx] !== "" && parts[pakaiIdx] !== undefined
          ? parseFloat(parts[pakaiIdx].replace(",", ".")) || 0
          : Math.max(0, stma - stml);
      const pakaiLalu =
        pakaiLaluIdx >= 0 && parts[pakaiLaluIdx] !== "" && parts[pakaiLaluIdx] !== undefined
          ? parseFloat(parts[pakaiLaluIdx].replace(",", ".")) || 0
          : undefined;

      const nama = namaIdx >= 0 ? parts[namaIdx]?.trim() : undefined;
      const tmssRaw = tmssIdx >= 0 ? parts[tmssIdx]?.trim() : "-";
      const tmss = tmssRaw === "" ? "-" : tmssRaw;
      const ketCatat = ketCatatIdx >= 0 && parts[ketCatatIdx]?.trim() ? parts[ketCatatIdx].trim() : "Normal";
      const petugasId =
        (petugasIdx >= 0 && parts[petugasIdx]?.trim()) ||
        (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) ||
        undefined;
      const namaPetugas = (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) || petugasId;
      const ruteKode = ruteIdx >= 0 ? parts[ruteIdx]?.trim() : undefined;
      const tglCatat =
        tglCatatIdx >= 0 && parts[tglCatatIdx]?.trim()
          ? parts[tglCatatIdx].trim()
          : new Date().toISOString();

      parsed.push({
        thbl: rawThbl,
        nolg: rawNolg,
        nama,
        stml,
        stma,
        pakaiM3,
        pakaiLalu,
        tmss,
        ketCatat,
        petugasId,
        namaPetugas,
        ruteKode,
        tglCatat,
        catatan: "Import Laporan Data Meter",
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

    // Pre-validasi duplikat NOLG dalam periode yang sama
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.thbl}|${item.nolg}`;
      if (seen.has(key)) {
        toast.error(
          `Duplikat NOLG ${item.nolg} pada periode ${item.thbl}. Hapus baris duplikat sebelum mengimpor.`
        );
        return;
      }
      seen.add(key);

      if (item.stma < item.stml) {
        toast.error(
          `STMA (${item.stma}) lebih kecil dari STML (${item.stml}) pada NOLG ${item.nolg}.`
        );
        return;
      }

      const pakaiM3 = item.pakaiM3 ?? Math.max(0, item.stma - item.stml);
      if (pakaiM3 < 0) {
        toast.error(
          `Kubikasi pemakaian tidak boleh negatif pada NOLG ${item.nolg}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch("/api/import/lapdatameter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        toast.error("Impor dibatalkan karena melebihi batas waktu 120 detik.");
      } else {
        toast.error(err.message || "Terjadi kesalahan saat mengimpor data LapDataMeter.");
      }
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
      {/* 1. Kartu Statistik / Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-border bg-card p-3.5 transition-colors hover:border-border/80">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Total Baris Meter</span>
              <Layers className="size-4 text-[var(--primary)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--primary-foreground)] font-mono">
                {items.length.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">Baris</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--primary)]" />
              <span>{fileName || "Belum ada berkas dimuat"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-[var(--verif-v2-border)]/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Total Pemakaian</span>
              <Gauge className="size-4 text-[var(--verif-v2)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--verif-v2-text)] font-mono">
                {totalKubikasi.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">m³</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v2)]" />
              <span>Akumulasi volume air terbaca</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-[var(--verif-v3-border)]/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Status Kondisi</span>
              <CheckCircle2 className="size-4 text-[var(--verif-v3)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--verif-v3-text)] font-mono">
                {terbacaNormalCount.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">Normal</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v3)]" />
              <span>{kendalaCount} kendala/akses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-[var(--verif-v2-border)]/30 col-span-2 sm:col-span-1">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Periode Pembacaan</span>
              <Users className="size-4 text-[var(--verif-v2)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--verif-v2-text)] font-mono">
                {activePeriode}
              </span>
              <span className="text-label-11 text-muted-foreground">THBL</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v2)]" />
              <span>Format baku YYYYMM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Bilah Kontrol, Filter, dan Aksi */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            disabled={isSubmitting || isLoadingSample}
            className="h-8 text-label-12 cursor-pointer"
          >
            <Sparkles className="mr-1.5 size-3.5 text-[var(--verif-v1)]" />
            {isLoadingSample ? "Memuat..." : "Muat Contoh LapDataMeter"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={isSubmitting} className="h-8 text-label-12 cursor-pointer">
            <RefreshCw className="mr-1.5 size-3.5" />
            Reset
          </Button>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            <Button variant="outline" size="sm" asChild className="h-8 text-label-12 cursor-pointer">
              <span>
                <Upload className="mr-1.5 size-3.5 text-[var(--primary)]" />
                Unggah CSV LapDataMeter
              </span>
            </Button>
          </label>
          <Button size="sm" onClick={handleImport} disabled={isSubmitting || items.length === 0} className="h-8 px-3 text-label-12 font-semibold gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 cursor-pointer">
            <Database className="mr-1.5 size-3.5" />
            {isSubmitting ? "Memproses..." : `Import ${items.length} Data ke cater_baca_meter`}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari No Pel / Nama / Rute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-copy-13"
            />
          </div>
        </div>
      </div>

      {/* 3. Notifikasi Hasil Import */}
      {resultStats && (
        <div className="flex flex-col gap-3 rounded-lg border-[var(--verif-v3-border)]/30 bg-[var(--verif-v3-soft)] p-4 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-[var(--verif-v3-text)] mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--verif-v3-text)]">
                  Proses Import Selesai dengan Sukses!
                </span>
                <Badge className="bg-[var(--success)] text-[var(--success-foreground)] font-mono text-[10px]">
                  Batch Selesai
                </Badge>
              </div>
              <p className="text-xs text-[var(--verif-v3-text)]">
                Total {resultStats.total} baris data diproses &bull; {resultStats.sukses} berhasil &bull;{" "}
                {resultStats.created ?? 0} transaksi baru dibuat &bull; {resultStats.updated ?? 0} data stand
                diperbarui &bull; {resultStats.gagal} gagal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Badge variant="outline" className="border-[var(--verif-v3-border)] text-[var(--verif-v3-text)] font-mono text-xs w-fit">
              cater_baca_meter: SYNC OK
            </Badge>
          </div>
        </div>
      )}

      {/* 4. Area Pratinjau Tabel / Empty State */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-label-12">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Menampilkan{" "}
              <strong className="font-mono text-[var(--primary-foreground)] font-semibold">
                {Math.min(filteredItems.length, 50)}
              </strong>{" "}
              / {items.length} baris
            </span>
            <span>·</span>
            <span className="text-muted-foreground">
              Hasil parsing CSV
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
                      <p className="font-medium text-[var(--primary-foreground)]">Belum ada data LapDataMeter yang dimuat</p>
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
                  <tr key={`${row.nolg}-${idx}`} className="transition-colors hover:bg-[var(--table-hover)] font-mono">
                    <td className="py-2 px-3 text-[var(--primary-foreground)] font-semibold">{row.thbl}</td>
                    <td className="py-2 px-3 text-[var(--primary)] font-semibold">{row.nolg}</td>
                    <td className="py-2 px-3 font-sans truncate max-w-[160px] text-[var(--primary-foreground)] font-medium">
                      {row.nama || "-"}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                        {row.ruteKode || "-"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right">{row.stml.toLocaleString("id-ID")}</td>
                    <td className="py-2 px-3 text-right font-semibold text-[var(--primary-foreground)]">
                      {row.stma.toLocaleString("id-ID")}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-[var(--verif-v2-text)]">
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
                              ? "bg-[var(--verif-v3)]"
                              : "bg-[var(--verif-v1)]"
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
      </div>
    </div>
  );
}
