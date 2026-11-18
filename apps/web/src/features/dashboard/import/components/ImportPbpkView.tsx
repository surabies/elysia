// features/dashboard/import/components/ImportPbpkView.tsx
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
  FolderSync,
  CheckCircle2,
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
} from "lucide-react";

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
  const [targetPeriode, setTargetPeriode] = React.useState("202601");
  const [isLoadingSample, setIsLoadingSample] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<{
    total: number;
    pb: number;
    pk: number;
    sukses: number;
    gagal: number;
  } | null>(null);

  // Ambil sample dari data/jan/PBPK.csv saat pertama kali dibuka
  React.useEffect(() => {
    handleLoadSample();
  }, []);

  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const res = await fetch("/api/import/sample/pbpk");
      const json = await res.json();
      if (json.success && json.rows && json.rows.length > 0) {
        setRows(json.rows);
        setCsvRaw(json.csvText || "");
        toast.success(
          `Berhasil memuat ${json.rows.length} data sample resmi dari PBPK.csv!`,
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
    <div className="space-y-6">
      <ImportHeader
        title="Import PBPK (Pasang Baru & Pemasangan Kembali)"
        badge="DPM Integration"
        description="Pendaftaran massal sambungan baru (PB) dan pengaktifan kembali sambungan langganan (PK) melalui file CSV resmi PDAM (data/jan/PBPK.csv). Data otomatis dibuatkan aset water meter dan didaftarkan ke DPM periode penagihan aktif."
        icon={FolderSync}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              disabled={isLoadingSample || isSubmitting}
            >
              <Sparkles className="mr-1.5 size-3.5 text-amber-500" />
              {isLoadingSample ? "Memuat..." : "Muat PBPK.csv"}
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild>
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
            >
              <FolderSync className="mr-1.5 size-4" />
              {isSubmitting ? "Memproses..." : "Eksekusi Import ke DPM"}
            </Button>
          </div>
        }
      />

      {resultStats && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Sinkronisasi PBPK Berhasil
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {resultStats.total} data ({resultStats.pb} Pasang Baru,{" "}
                  {resultStats.pk} Pemasangan Kembali). Seluruhnya siap dicatat
                  pada DPM periode {targetPeriode}.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white">
              Status: Masuk DPM
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Statistik Ringkas PBPK */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">
            Total Rekening PBPK
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {rows.length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Dari berkas PBPK.csv
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pasang Baru (PB)</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400">
            {pbCount}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Pelanggan & Water Meter Baru
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">
            Pemasangan Kembali (PK)
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {pkCount}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Aktivasi Sambungan Eksisting
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">
                Pratinjau Data PBPK (data/jan/PBPK.csv)
              </CardTitle>
              <CardDescription>
                Daftar pelanggan baru (PB) dan pemasangan kembali (PK) yang siap
                didaftarkan ke DPM periode {targetPeriode}.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-4" />
              <span>{rows.length} Sambungan</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/50 bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">Tipe Mutasi</th>
                  <th className="px-3 py-2.5">No. Langganan</th>
                  <th className="px-3 py-2.5">Nama Pelanggan</th>
                  <th className="px-3 py-2.5">Alamat Sambungan</th>
                  <th className="px-3 py-2.5">Tarif</th>
                  <th className="px-3 py-2.5">Rute DPM</th>
                  <th className="px-3 py-2.5">No. Meter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.slice(0, 30).map((row, idx) => (
                  <tr key={`${row.nolg}-${idx}`} className="hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={
                          row.mutasian === "PB"
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-[10px]"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]"
                        }
                      >
                        {row.mutasian === "PB"
                          ? "Pasang Baru (PB)"
                          : "Pasang Kembali (PK)"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono font-medium text-foreground">
                      {row.nolg}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.nama}</td>
                    <td
                      className="max-w-70 truncate px-3 py-2 text-muted-foreground"
                      title={row.alamat}
                    >
                      {row.alamat}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {row.kd_goltarif || "2A2"}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {row.kd_rute || "99999"}
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {row.nometer || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
