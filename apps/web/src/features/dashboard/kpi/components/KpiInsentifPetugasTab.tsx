"use client";

import * as React from "react";
import {
  Search,
  RefreshCw,
  Calculator,
  Award,
  Users,
  Wallet,
  Scale,
  Download,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { kpiApi } from "../api";
import type {
  EvaluasiInsentifResult,
  InsentifPetugasItem,
} from "@/server/services/kpi/kpi.service";

const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const num = (n: number) => n.toLocaleString("id-ID");

export function KpiInsentifPetugasTab({
  selectedPeriod,
}: {
  selectedPeriod: string;
}) {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<EvaluasiInsentifResult | null>(null);
  const [search, setSearch] = React.useState("");
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL");

  // Parameter Simulasi Insentif Perusahaan (Dapat disesuaikan langsung oleh Direksi / Manager)
  const [insentifDasar, setInsentifDasar] = React.useState<number>(500000);
  const [tarifPerSl, setTarifPerSl] = React.useState<number>(400);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await kpiApi.getEvaluasiInsentif(selectedPeriod);
      if (res) {
        setData(res);
        if (res.aturan) {
          setInsentifDasar(res.aturan.insentifDasar);
          setTarifPerSl(res.aturan.tarifPerSl);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat matriks evaluasi insentif");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Kalkulasi Nominal Insentif per Petugas
  const calculatedItems = React.useMemo(() => {
    if (!data?.items) return [];
    return data.items.map((item) => {
      const basisInsentif = insentifDasar + item.realisasiSL * tarifPerSl;
      const nominalAkhir =
        item.pengaliGrade > 0
          ? Math.round(
              basisInsentif * item.indeksBebanKerja * item.pengaliGrade
            )
          : 0;
      return {
        ...item,
        basisInsentif,
        nominalAkhir,
      };
    });
  }, [data, insentifDasar, tarifPerSl]);

  const filteredItems = React.useMemo(() => {
    return calculatedItems.filter((item) => {
      if (gradeFilter !== "ALL" && item.grade !== gradeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.nama.toLowerCase().includes(q) ||
          item.petugasId.toLowerCase().includes(q) ||
          item.ruteList.some((r) => r.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [calculatedItems, gradeFilter, search]);

  const totalAnggaranInsentif = React.useMemo(() => {
    return calculatedItems.reduce((acc, i) => acc + i.nominalAkhir, 0);
  }, [calculatedItems]);

  const handleExportCsv = () => {
    if (filteredItems.length === 0) return;
    const headers = [
      "Peringkat",
      "ID Petugas",
      "Nama Petugas",
      "Jumlah Rute",
      "Target Beban SL",
      "Realisasi SL",
      "Indeks Beban Kerja",
      "Capaian SL (%)",
      "Akurasi GPS (%)",
      "Kualitas Tanpa Revisi (%)",
      "Skor Kecepatan (%)",
      "Skor KPI Akhir",
      "Grade",
      "Pengali Grade",
      "Total Insentif (Rp)",
    ];
    const rows = filteredItems.map((i) => [
      i.peringkat,
      i.petugasId,
      `"${i.nama}"`,
      i.jumlahRute,
      i.targetSL,
      i.realisasiSL,
      i.indeksBebanKerja,
      i.capaianSlPersen,
      i.akurasiGpsPersen,
      i.kualitasBacaPersen,
      i.skorKecepatanPersen,
      i.skorKpiAkhir,
      i.grade,
      `${Math.round(i.pengaliGrade * 100)}%`,
      i.nominalAkhir,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Matriks_KPI_Insentif_Petugas_${data?.thbl || selectedPeriod}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Matriks evaluasi KPI & Insentif berhasil diunduh (.csv)");
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
      {/* 1. Ringkasan 4 Kartu KPI & Anggaran Insentif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Rata-rata Skor KPI Tim</span>
            <Award className="size-4 text-(--ds-blue-700)" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-bold text-foreground tabular-nums">
              {loading ? "—" : `${data?.summary.rataSkorKpi ?? 0}`}
            </span>
            <span className="text-label-12 text-muted-foreground">/ 100 poin</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Gabungan Kuantitas, GPS, Kualitas &amp; Durasi
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Acuan Rata-rata Beban Kerja</span>
            <Scale className="size-4 text-(--ds-purple-700)" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-bold text-foreground tabular-nums">
              {loading ? "—" : num(data?.summary.rataTargetSL ?? 0)}
            </span>
            <span className="text-label-12 text-muted-foreground">
              SL / Petugas (1,00x)
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Total beban: {num(data?.summary.totalTargetSL ?? 0)} SL aktif
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Distribusi Grade Kelayakan</span>
            <Users className="size-4 text-(--ds-green-700)" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <Badge variant="green-subtle" size="sm" className="font-mono">
              A: {data?.summary.countGradeA ?? 0}
            </Badge>
            <Badge variant="blue-subtle" size="sm" className="font-mono">
              B: {data?.summary.countGradeB ?? 0}
            </Badge>
            <Badge variant="amber-subtle" size="sm" className="font-mono">
              C: {data?.summary.countGradeC ?? 0}
            </Badge>
            <Badge variant="red-subtle" size="sm" className="font-mono">
              D: {data?.summary.countGradeD ?? 0}
            </Badge>
          </div>
          <p className="mt-1.5 text-copy-12 text-muted-foreground">
            Dari total {data?.summary.totalPetugas ?? 0} petugas dievaluasi
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Estimasi Total Insentif</span>
            <Wallet className="size-4 text-(--ds-green-700)" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 font-mono font-bold text-(--ds-green-800) tabular-nums truncate">
              {loading ? "—" : idr(totalAnggaranInsentif)}
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Simulasi periode {data?.thbl ?? selectedPeriod}
          </p>
        </div>
      </div>

      {/* 2. Panel Parameter Rumus & Kalkulator Insentif */}
      <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-(--ds-blue-700)" />
              <h2 className="text-label-13 font-semibold text-foreground">
                Parameter Formulasi Insentif (Beban Kerja × Skor Capaian KPI)
              </h2>
            </div>
            <p className="text-copy-12 text-muted-foreground">
              Rumus:{" "}
              <code className="font-mono text-[11px] bg-card px-1.5 py-0.5 rounded border border-border text-foreground">
                Insentif = (Pagu Dasar + [SL Terbaca × Tarif/SL]) × Indeks Beban × Pengali Grade
              </code>
            </p>
          </div>

          {/* Input Simulasi Pagu Dasar & Tarif per SL */}
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="pagu-dasar" className="text-label-11 text-muted-foreground">
                Pagu Insentif Dasar (Rp)
              </Label>
              <Input
                id="pagu-dasar"
                type="number"
                step={50000}
                min={0}
                value={insentifDasar}
                onChange={(e) => setInsentifDasar(Math.max(0, Number(e.target.value)))}
                className="h-8 w-36 font-mono text-xs bg-card"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tarif-sl" className="text-label-11 text-muted-foreground">
                Tarif Variabel / SL (Rp)
              </Label>
              <Input
                id="tarif-sl"
                type="number"
                step={50}
                min={0}
                value={tarifPerSl}
                onChange={(e) => setTarifPerSl(Math.max(0, Number(e.target.value)))}
                className="h-8 w-28 font-mono text-xs bg-card"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="h-8 bg-card"
            >
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              <span>Hitung Ulang DB</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleExportCsv}
              disabled={loading || filteredItems.length === 0}
              className="h-8"
            >
              <Download className="size-3.5" />
              <span>Unduh CSV</span>
            </Button>
          </div>
        </div>

        {/* Keterangan Bobot 4 Pilar Skor Kinerja */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-border text-label-11 text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Info className="size-3.5 text-(--ds-blue-700)" />
            Komposisi Skor KPI Individu:
          </span>
          <span>• <strong>40%</strong> Capaian Target SL</span>
          <span>• <strong>25%</strong> Kepatuhan Titik GPS (&le;50m)</span>
          <span>• <strong>20%</strong> Kualitas Bacaan (Bebas Koreksi/Anomali)</span>
          <span>• <strong>15%</strong> Disiplin Kecepatan Baca</span>
          <span className="ml-auto font-mono">
            Grade A (&ge;90): <strong>110%</strong> | Grade B (75-89): <strong>100%</strong> | Grade C (60-74): <strong>65%</strong> | Grade D (&lt;60): <strong>0%</strong>
          </span>
        </div>
      </div>

      {/* 3. Filter & Pencarian Petugas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "Semua Grade" },
            { id: "A", label: "Grade A (≥90)" },
            { id: "B", label: "Grade B (75-89)" },
            { id: "C", label: "Grade C (60-74)" },
            { id: "D", label: "Grade D (<60)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setGradeFilter(tab.id)}
              className={cn(
                "h-8 px-3 rounded-md border text-label-12 font-medium transition-all cursor-pointer shrink-0 bg-card",
                gradeFilter === tab.id
                  ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari nama petugas, ID, atau rute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs bg-card"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Tabel Matriks KPI & Insentif Petugas (Satu Baris Rapi) */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-copy-13 whitespace-nowrap tabular-nums">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-label-11 font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-3 w-12 text-center">No.</th>
                <th className="py-2.5 px-3.5">Petugas Pencatat</th>
                <th className="py-2.5 px-3 text-center">Rute</th>
                <th className="py-2.5 px-3 text-right">Beban &amp; Realisasi SL</th>
                <th className="py-2.5 px-3 text-center">Indeks Beban</th>
                <th className="py-2.5 px-3 text-right">Capaian (40%)</th>
                <th className="py-2.5 px-3 text-right">GPS &le;50m (25%)</th>
                <th className="py-2.5 px-3 text-right">Kualitas (20%)</th>
                <th className="py-2.5 px-3 text-right">Durasi (15%)</th>
                <th className="py-2.5 px-3 text-center">Skor KPI</th>
                <th className="py-2.5 px-3 text-center">Grade</th>
                <th className="py-2.5 px-3.5 text-right">Insentif Diterima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-muted-foreground">
                    Memuat dan mengkalkulasi data beban kerja &amp; capaian petugas dari laporan...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-muted-foreground">
                    Tidak ada data petugas yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.petugasId}
                    className="hover:bg-muted/30 transition-colors h-10"
                  >
                    {/* 1. Peringkat */}
                    <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                      {item.peringkat}
                    </td>

                    {/* 2. Nama & ID Petugas */}
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {item.nama}
                        </span>
                        <span className="font-mono text-label-11 text-muted-foreground">
                          ({item.petugasId})
                        </span>
                      </div>
                    </td>

                    {/* 3. Rute */}
                    <td
                      className="py-2 px-3 text-center font-mono"
                      title={item.ruteList.join(", ")}
                    >
                      <Badge variant="gray-subtle" size="sm" className="font-mono">
                        {item.jumlahRute} Rute
                      </Badge>
                    </td>

                    {/* 4. Realisasi / Target SL */}
                    <td className="py-2 px-3 text-right font-mono">
                      <span className="font-semibold text-foreground">
                        {num(item.realisasiSL)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {num(item.targetSL)} SL
                      </span>
                    </td>

                    {/* 5. Indeks Beban Kerja */}
                    <td className="py-2 px-3 text-center font-mono">
                      <Badge
                        variant={
                          item.indeksBebanKerja >= 1.1
                            ? "purple-subtle"
                            : item.indeksBebanKerja >= 0.95
                            ? "blue-subtle"
                            : "gray-subtle"
                        }
                        size="sm"
                        className="font-mono"
                      >
                        {item.indeksBebanKerja.toFixed(2)}x
                      </Badge>
                    </td>

                    {/* 6. Capaian SL (40%) */}
                    <td className="py-2 px-3 text-right font-mono">
                      {item.capaianSlPersen.toFixed(1)}%
                    </td>

                    {/* 7. Akurasi GPS (25%) */}
                    <td className="py-2 px-3 text-right font-mono">
                      {item.akurasiGpsPersen.toFixed(1)}%
                    </td>

                    {/* 8. Kualitas Baca (20%) */}
                    <td className="py-2 px-3 text-right font-mono">
                      {item.kualitasBacaPersen.toFixed(1)}%
                    </td>

                    {/* 9. Durasi / Kecepatan (15%) */}
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {item.skorKecepatanPersen}% ({item.rataDurasiDetik}d)
                    </td>

                    {/* 10. Skor KPI Akhir */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-foreground">
                      {item.skorKpiAkhir.toFixed(1)}
                    </td>

                    {/* 11. Grade & Pengali */}
                    <td className="py-2 px-3 text-center">
                      <Badge
                        variant={
                          item.grade === "A"
                            ? "green-subtle"
                            : item.grade === "B"
                            ? "blue-subtle"
                            : item.grade === "C"
                            ? "amber-subtle"
                            : "red-subtle"
                        }
                        size="sm"
                        className="font-mono"
                      >
                        Grade {item.grade} ({Math.round(item.pengaliGrade * 100)}%)
                      </Badge>
                    </td>

                    {/* 12. Nominal Insentif */}
                    <td className="py-2 px-3.5 text-right font-mono font-bold text-(--ds-green-800)">
                      {idr(item.nominalAkhir)}
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
