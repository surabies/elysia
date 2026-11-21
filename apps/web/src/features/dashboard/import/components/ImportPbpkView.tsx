// features/dashboard/import/components/ImportPbpkView.tsx
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
  FolderSync,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
} from "lucide-react";

import { PERIODE_BERJALAN_AKTIF } from "@/config/periode";

interface PbpkRow {
  nolg: string;
  nama: string;
  alamat: string;
  notelp?: string;
  nometer?: string;
  kd_rute?: string;
  kd_goltarif?: string;
  no_urutrute?: number;
  mutasian: string;
}

export function ImportPbpkView() {
  const [rows, setRows] = React.useState<PbpkRow[]>([]);
  const [csvRaw, setCsvRaw] = React.useState<string>("");
  const [targetPeriode, setTargetPeriode] = React.useState(PERIODE_BERJALAN_AKTIF);
  const [isLoadingSample, setIsLoadingSample] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<{
    total: number;
    pb: number;
    pk: number;
    sukses: number;
    gagal: number;
  } | null>(null);

  // Sample TIDAK dimuat otomatis saat halaman dibuka. Pengguna dapat mengunggah berkas CSV secara mandiri atau menekan tombol muat sample jika diperlukan.
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch("/api/import/sample/pbpk");
      const json = await res.json();
      if (json.success && json.rows && json.rows.length > 0) {
        setRows(json.rows);
        setCsvRaw(json.csvText || "");
        toast.success(
          `Berhasil memuat ${json.rows.length} data contoh dari template PBPK.csv!`,
        );
      }
    } catch {
      toast.error("Gagal membaca sample PBPK.csv dari server.");
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvRaw(text);
        // Quick frontend parse
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const delimiter = lines[0].includes(";") ? ";" : ",";
          const header = lines[0]
            .split(delimiter)
            .map((h) => h.trim().toLowerCase());
          const nolgIdx = header.indexOf("nolg");
          const namaIdx = header.indexOf("nama");
          const alamatIdx = header.indexOf("alamat");
          const tarifIdx = header.indexOf("kd_goltarif");
          const ruteIdx = header.indexOf("kd_rute");
          const mutasiIdx = header.indexOf("mutasian");
          const meterIdx = header.indexOf("nometer");

          const parsed: PbpkRow[] = [];
          for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(delimiter).map((p) => p.trim());
            if (parts.length < 3) continue;
            parsed.push({
              nolg: parts[nolgIdx] || `CUST-${i}`,
              nama: parts[namaIdx] || "Pelanggan Baru",
              alamat: parts[alamatIdx] || "-",
              kd_goltarif: parts[tarifIdx] || "2A2",
              kd_rute: parts[ruteIdx] || "99999",
              nometer: parts[meterIdx] || `MTR-${i}`,
              mutasian: parts[mutasiIdx]?.toUpperCase() === "PK" ? "PK" : "PB",
            });
          }
          setRows(parsed);
          toast.success(
            `Berhasil mengurai ${parsed.length} baris data dari berkas CSV!`,
          );
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (rows.length === 0) {
      toast.error("Tidak ada data PBPK untuk diproses.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/import/pbpk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          periode: targetPeriode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengimpor data PBPK.");
      }

      setResultStats({
        total: json.data?.total ?? rows.length,
        pb: json.data?.pb ?? 0,
        pk: json.data?.pk ?? 0,
        sukses: json.data?.sukses ?? rows.length,
        gagal: json.data?.gagal ?? 0,
      });

      toast.success(
        `Sukses! Berhasil mendaftarkan ${json.data?.pb ?? 0} Pasang Baru (PB) & ${json.data?.pk ?? 0} Pemasangan Kembali (PK) ke Master Pelanggan & DPM!`,
      );
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses data PBPK.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pbCount = rows.filter((r) => r.mutasian === "PB").length;
  const pkCount = rows.filter((r) => r.mutasian === "PK").length;

  return (
    <div className="space-y-4">
      {/* 1. Kartu Statistik / Ringkasan PBPK */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card p-3.5 transition-colors hover:border-border/80">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Total Rekening PBPK</span>
              <FileText className="size-4 text-[var(--primary)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--primary-foreground)] font-mono">
                {rows.length}
              </span>
              <span className="text-label-11 text-muted-foreground">Sambungan</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--primary)]" />
              <span>Dari berkas PBPK.csv</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-[var(--verif-v2-border)]/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Pasang Baru (PB)</span>
              <FolderSync className="size-4 text-[var(--verif-v2)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--verif-v2-text)] font-mono">
                {pbCount}
              </span>
              <span className="text-label-11 text-muted-foreground">Baru</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v2)]" />
              <span>Pelanggan & Water Meter Baru</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-[var(--verif-v3-border)]/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Pemasangan Kembali (PK)</span>
              <CheckCircle2 className="size-4 text-[var(--verif-v3)]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-[var(--verif-v3-text)] font-mono">
                {pkCount}
              </span>
              <span className="text-label-11 text-muted-foreground">Aktif</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v3)]" />
              <span>Aktivasi Sambungan Eksisting</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Bilah Kontrol dan Aksi */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            disabled={isLoadingSample || isSubmitting}
            className="h-8 text-label-12 cursor-pointer"
          >
            <Sparkles className="mr-1.5 size-3.5 text-[var(--verif-v1)]" />
            {isLoadingSample ? "Memuat..." : "Muat PBPK.csv"}
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild className="h-8 text-label-12 cursor-pointer">
              <span>
                <Upload className="mr-1.5 size-3.5" />
                Unggah CSV Lain
              </span>
            </Button>
          </label>
          <Button
            size="sm"
            onClick={handleExecuteImport}
            disabled={isSubmitting || rows.length === 0}
            className="h-8 px-3 text-label-12 font-semibold gap-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 cursor-pointer"
          >
            <FolderSync className="mr-1.5 size-3.5" />
            {isSubmitting ? "Memproses..." : "Eksekusi Import ke DPM"}
          </Button>
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
                  Sinkronisasi PBPK Berhasil
                </span>
                <Badge className="bg-[var(--success)] text-[var(--success-foreground)] font-mono text-[10px]">
                  Batch Selesai
                </Badge>
              </div>
              <p className="text-xs text-[var(--verif-v3-text)]">
                Total {resultStats.total} data ({resultStats.pb} Pasang Baru,{" "}
                {resultStats.pk} Pemasangan Kembali). Seluruhnya siap dicatat
                pada DPM periode {targetPeriode}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Badge className="bg-[var(--success)] text-[var(--success-foreground)]">
              Status: Masuk DPM
            </Badge>
          </div>
        </div>
      )}

      {/* 4. Area Pratinjau Tabel / Empty State */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-label-12">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Daftar pelanggan baru (PB) dan pemasangan kembali (PK) yang siap didaftarkan ke DPM periode {targetPeriode}.
            </span>
            <span>·</span>
            <span className="text-muted-foreground">
              {rows.length} Sambungan
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-2.5 px-3">Tipe Mutasi</th>
                <th className="py-2.5 px-3">No. Langganan</th>
                <th className="py-2.5 px-3">Nama Pelanggan</th>
                <th className="py-2.5 px-3">Alamat Sambungan</th>
                <th className="py-2.5 px-3">Tarif</th>
                <th className="py-2.5 px-3">Rute DPM</th>
                <th className="py-2.5 px-3">No. Meter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="size-8 text-muted-foreground/40" />
                      <p className="font-medium text-[var(--primary-foreground)]">
                        Belum ada data mutasi PBPK yang dimuat.
                      </p>
                      <p className="text-xs">
                        Silakan unggah berkas CSV mutasi PBPK Anda atau gunakan
                        tombol &ldquo;Muat PBPK.csv&rdquo; untuk melihat contoh
                        format template.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.slice(0, 30).map((row, idx) => (
                  <tr
                    key={`${row.nolg}-${idx}`}
                    className="transition-colors hover:bg-[var(--table-hover)] font-mono"
                  >
                    <td className="py-2 px-3">
                      <Badge
                        variant="outline"
                        className={
                          row.mutasian === "PB"
                            ? "border-[var(--verif-v2-border)]/40 bg-[var(--verif-v2-soft)] text-[var(--verif-v2-text)] font-semibold text-[10px]"
                            : "border-[var(--verif-v3-border)]/40 bg-[var(--verif-v3-soft)] text-[var(--verif-v3-text)] font-semibold text-[10px]"
                        }
                      >
                        {row.mutasian === "PB"
                          ? "Pasang Baru (PB)"
                          : "Pasang Kembali (PK)"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-medium text-[var(--primary-foreground)]">
                      {row.nolg}
                    </td>
                    <td className="py-2 px-3 font-medium">{row.nama}</td>
                    <td
                      className="max-w-70 truncate px-3 py-2 text-muted-foreground"
                      title={row.alamat}
                    >
                      {row.alamat}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {row.kd_goltarif || "2A2"}
                    </td>
                    <td className="py-2 px-3 font-mono">
                      {row.kd_rute || "99999"}
                    </td>
                    <td className="py-2 px-3 font-mono text-muted-foreground">
                      {row.nometer || "-"}
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
