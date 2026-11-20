// features/dashboard/import/components/ImportDataPencatatanView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Code2,
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

  return (
    <div className="space-y-6">
      <ImportHeader
        title="Import Data Pencatatan (Stand Recovery)"
        badge="Batch Ingestion"
        description="Spesifikasi baku & modul impor data transaksi angka stand meter pembacaan mobile. Otomatis terintegrasi dengan foto backup (stand, segel, rumah) berdasarkan kombinasi THBL & Nomor Langganan."
        icon={UploadCloud}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isSubmitting}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Reset Contoh
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".csv,.txt,.json" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="mr-1.5 size-3.5 text-primary" />
                  Unggah CSV Mobile
                </span>
              </Button>
            </label>
            <Button size="sm" onClick={handleImport} disabled={isSubmitting || items.length === 0}>
              <Database className="mr-1.5 size-4" />
              {isSubmitting ? "Memproses..." : "Import Data Meter"}
            </Button>
          </div>
        }
      />

      {/* Kontrak Format Data Mobile */}
      <Card className="border-sky-500/20 bg-sky-500/5">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Code2 className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Format Standar CSV Ekspor Mobile App (Aturan Baku Developer Mobile):
              </p>
              <div className="overflow-x-auto">
                <code className="font-mono text-xs text-sky-600 dark:text-sky-400 bg-background/80 px-2 py-1 rounded border border-border/50 block whitespace-nowrap">
                  thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Kunci relasi database: <strong className="text-foreground">THBL + NOLG</strong> langsung menyatu dengan foto backup yang tersimpan.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-sky-500/30 text-sky-600 dark:text-sky-400 self-start sm:self-auto text-[10px]">
            Spesifikasi Baku
          </Badge>
        </CardContent>
      </Card>

      {resultStats && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Import Data Pencatatan Sukses
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {resultStats.total} baris: {resultStats.sukses} terserap ke database cater_baca_meter, {resultStats.gagal} gagal.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white">Status: Terverifikasi</Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Pratinjau Data Angka Stan Meter Mobile</CardTitle>
              <CardDescription>
                Data angka stand meter lalu (STML) dan akhir (STMA) yang siap dipetakan ke database cater_baca_meter.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="size-4" />
              <span>{items.length} Baris Transaksi</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/50 bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">No. Langganan</th>
                  <th className="px-3 py-2.5">Periode</th>
                  <th className="px-3 py-2.5">Stand Lalu</th>
                  <th className="px-3 py-2.5">Stand Akhir</th>
                  <th className="px-3 py-2.5">Kubikasi</th>
                  <th className="px-3 py-2.5">Waktu Catat</th>
                  <th className="px-3 py-2.5">Petugas</th>
                  <th className="px-3 py-2.5">Rute</th>
                  <th className="px-3 py-2.5">Kondisi</th>
                  <th className="px-3 py-2.5">Koordinat GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((row, idx) => (
                  <tr key={`${row.nolg}-${idx}`} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono font-medium text-foreground">{row.nolg}</td>
                    <td className="px-3 py-2 font-mono">{row.thbl}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.stml} m³</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{row.stma} m³</td>
                    <td className="px-3 py-2 font-semibold text-primary">{row.pakaiM3} m³</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.tglCatat}</td>
                    <td className="px-3 py-2 font-mono">{row.petugasId}</td>
                    <td className="px-3 py-2 font-mono">{row.ruteKode}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {row.ketCatat}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {row.latitude && row.longitude ? `${row.latitude}, ${row.longitude}` : "-"}
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
