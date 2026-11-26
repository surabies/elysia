"use client";

import * as React from "react";
import {
  Mountain,
  Search,
  Filter,
  RefreshCw,
  Save,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Footprints,
  Bike,
  ShieldAlert,
  ArrowUpDown,
  Download,
  X,
  Edit3,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { kpiApi } from "../api";
import {
  type RuteFaktorMedanConfig,
  type TopografiKategori,
  type ModaAkses,
  FAKTOR_TOPOGRAFI_STANDAR,
  FAKTOR_MODA_AKSES_STANDAR,
  DAFTAR_HAMBATAN_KHUSUS,
} from "../types/KpiTypes";

const num = (n: number) => n.toLocaleString("id-ID");

export function KpiFaktorMedanTab() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [routes, setRoutes] = React.useState<RuteFaktorMedanConfig[]>([]);
  const [initialRoutes, setInitialRoutes] = React.useState<RuteFaktorMedanConfig[]>([]);
  const [summary, setSummary] = React.useState({
    totalRute: 0,
    totalSL: 0,
    rataFaktorMedan: 1.0,
    countDatar: 0,
    countBergelombang: 0,
    countBerbukit: 0,
    countCuramTangga: 0,
    countEkstrem: 0,
  });

  const [search, setSearch] = React.useState("");
  const [topografiFilter, setTopografiFilter] = React.useState<string>("ALL");
  const [seksiFilter, setSeksiFilter] = React.useState<string>("ALL");
  const [editingRoute, setEditingRoute] = React.useState<RuteFaktorMedanConfig | null>(null);

  // Bulk Apply State
  const [isBulkDialogOpen, setIsBulkDialogOpen] = React.useState(false);
  const [bulkSeksi, setBulkSeksi] = React.useState<string>("ALL");
  const [bulkTopografi, setBulkTopografi] = React.useState<TopografiKategori>("BERGELOMBANG");
  const [bulkModa, setBulkModa] = React.useState<ModaAkses>("CAMPURAN");

  // Deteksi perubahan belum disimpan
  const hasUnsavedChanges = React.useMemo(() => {
    if (routes.length === 0 || initialRoutes.length === 0) return false;
    return JSON.stringify(routes) !== JSON.stringify(initialRoutes);
  }, [routes, initialRoutes]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await kpiApi.getFaktorMedan();
      if (res?.data) {
        setRoutes(res.data.ruteList);
        setInitialRoutes(res.data.ruteList);
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat konfigurasi faktor medan rute");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  // Daftar seksi unik untuk filter
  const seksiList = React.useMemo(() => {
    const set = new Set<string>();
    routes.forEach((r) => {
      if (r.seksiNama) set.add(r.seksiNama);
      else if (r.seksiKode) set.add(r.seksiKode);
    });
    return Array.from(set).sort();
  }, [routes]);

  // Filter rute
  const filteredRoutes = React.useMemo(() => {
    return routes.filter((item) => {
      if (topografiFilter !== "ALL" && item.topografi !== topografiFilter) return false;
      if (seksiFilter !== "ALL") {
        const itemSeksi = item.seksiNama || item.seksiKode || "";
        if (itemSeksi !== seksiFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.ruteKode.toLowerCase().includes(q) ||
          (item.seksiNama && item.seksiNama.toLowerCase().includes(q)) ||
          (item.pencatatNama && item.pencatatNama.toLowerCase().includes(q)) ||
          (item.pencatatDefault && item.pencatatDefault.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [routes, topografiFilter, seksiFilter, search]);

  // Handler update lokal satu rute
  const handleUpdateSingleRoute = (
    ruteKode: string,
    updates: Partial<RuteFaktorMedanConfig>
  ) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.ruteKode !== ruteKode) return r;
        const next = { ...r, ...updates };

        // Kalkulasi ulang faktor medan otomatis bila topografi/moda diubah
        if (updates.topografi || updates.modaAkses) {
          const topoFactor = FAKTOR_TOPOGRAFI_STANDAR[next.topografi] ?? 1.0;
          const modaFactor = FAKTOR_MODA_AKSES_STANDAR[next.modaAkses] ?? 1.0;
          // Hambatan khusus menambah 0.02 per hambatan (maksimal +0.08)
          const bonusHambatan = Math.min(0.08, (next.hambatanKhusus?.length ?? 0) * 0.02);
          next.faktorMedan = Number((topoFactor * modaFactor + bonusHambatan).toFixed(2));
        }

        return next;
      })
    );
  };

  // Handler simpan seluruh perubahan ke server
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await kpiApi.updateFaktorMedan(routes);
      setInitialRoutes(routes);
      toast.success("Konfigurasi faktor medan rute berhasil disimpan ke database!");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan konfigurasi faktor medan");
    } finally {
      setSaving(false);
    }
  };

  // Handler reset ke acuan default
  const handleReset = async () => {
    if (!confirm("Kembalikan seluruh faktor medan rute ke acuan standar regional?")) return;
    setLoading(true);
    try {
      await kpiApi.resetFaktorMedan();
      await loadData();
      toast.success("Faktor medan rute berhasil di-reset ke standar regional.");
    } catch (err: any) {
      toast.error(err.message || "Gagal me-reset faktor medan");
    } finally {
      setLoading(false);
    }
  };

  // Handler Apply Massal
  const handleApplyBulk = () => {
    const topoFactor = FAKTOR_TOPOGRAFI_STANDAR[bulkTopografi] ?? 1.0;
    const modaFactor = FAKTOR_MODA_AKSES_STANDAR[bulkModa] ?? 1.0;
    const computedFactor = Number((topoFactor * modaFactor).toFixed(2));

    setRoutes((prev) =>
      prev.map((r) => {
        const matchSeksi =
          bulkSeksi === "ALL" ||
          (r.seksiNama && r.seksiNama === bulkSeksi) ||
          (r.seksiKode && r.seksiKode === bulkSeksi);

        if (!matchSeksi) return r;

        return {
          ...r,
          topografi: bulkTopografi,
          modaAkses: bulkModa,
          faktorMedan: computedFactor,
        };
      })
    );

    setIsBulkDialogOpen(false);
    toast.success(
      `Faktor medan berhasil diterapkan massal ke ${bulkSeksi === "ALL" ? "semua seksi" : bulkSeksi}`
    );
  };

  const handleExportCsv = () => {
    if (routes.length === 0) return;
    const headers = [
      "Kode Rute",
      "Seksi / Wilayah",
      "Petugas Default",
      "Jumlah Beban SL",
      "Kategori Topografi",
      "Moda Akses",
      "Faktor Medan (x)",
      "Hambatan Khusus",
      "Catatan Lapangan",
    ];
    const rows = routes.map((r) => [
      r.ruteKode,
      `"${r.seksiNama || r.seksiKode || "-"}"`,
      `"${r.pencatatNama || r.pencatatDefault || "-"}"`,
      r.jumlahSL,
      r.topografi,
      r.modaAkses,
      r.faktorMedan,
      `"${r.hambatanKhusus.join("; ")}"`,
      `"${r.catatan || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Faktor_Medan_Rute_M2C_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Master faktor medan berhasil diunduh (.csv)");
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
      {/* 1. Bar Indikator Unsaved Changes */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between rounded-lg border border-(--ds-amber-700)/30 bg-(--ds-amber-500)/10 p-3 text-(--ds-amber-900) dark:text-(--ds-amber-400)">
          <div className="flex items-center gap-2 text-label-12">
            <AlertTriangle className="size-4 shrink-0 text-(--ds-amber-700)" />
            <span>
              Ada perubahan faktor medan yang belum disimpan ke database. Simpan untuk memperbarui perhitungan beban kerja &amp; insentif.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoutes(initialRoutes)}
              className="h-7 text-xs bg-card"
            >
              Batalkan
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSaveAll}
              disabled={saving}
              className="h-7 gap-1.5 text-xs bg-(--ds-amber-800) hover:bg-(--ds-amber-900) text-white"
            >
              <Save className="size-3" />
              <span>{saving ? "Menyimpan..." : "Simpan Permanen"}</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. Kartu Ringkasan 4 Sel Parameter Medan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Rata-rata Faktor Medan Wilayah</span>
            <Mountain className="size-4 text-(--ds-amber-700)" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-bold text-foreground tabular-nums">
              {loading ? "—" : `${summary.rataFaktorMedan.toFixed(2)}x`}
            </span>
            <span className="text-label-12 text-muted-foreground">pengali waktu tempuh</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Rentang baku: 1,00x (Datar) s/d 1,45x (Curam Tangga)
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Distribusi Kontur &amp; Topografi</span>
            <Layers className="size-4 text-(--ds-blue-700)" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <Badge variant="green-subtle" size="sm" className="font-mono">
              Datar: {summary.countDatar}
            </Badge>
            <Badge variant="blue-subtle" size="sm" className="font-mono">
              Gelombang: {summary.countBergelombang}
            </Badge>
            <Badge variant="amber-subtle" size="sm" className="font-mono">
              Bukit: {summary.countBerbukit}
            </Badge>
            <Badge variant="red-subtle" size="sm" className="font-mono">
              Curam/Tangga: {summary.countCuramTangga + summary.countEkstrem}
            </Badge>
          </div>
          <p className="mt-1.5 text-copy-12 text-muted-foreground">
            Total 125 Rute Operasional PDAM
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Total Pelanggan Terpetakan</span>
            <MapPin className="size-4 text-(--ds-purple-700)" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-bold text-foreground tabular-nums">
              {loading ? "—" : num(summary.totalSL)}
            </span>
            <span className="text-label-12 text-muted-foreground">SL aktif</span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Diverifikasi berbasis data rute transaksi riil
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <div className="flex items-center justify-between text-label-12 text-muted-foreground">
            <span>Keadilan Beban Kerja (ABK)</span>
            <Scale className="size-4 text-(--ds-green-700)" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-heading-20 font-semibold text-(--ds-green-800)">
              Tersinkronisasi Otomatis
            </span>
          </div>
          <p className="mt-1 text-copy-12 text-muted-foreground">
            Faktor ini langsung mempengaruhi jam beban di Tab 2
          </p>
        </div>
      </div>

      {/* 3. Panel Landasan Regulasi & Acuan Baku Standar Industri */}
      <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Info className="size-4 text-(--ds-blue-700) shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-label-13 font-semibold text-foreground">
              Dasar Metodologi Analisis Beban Kerja (ABK) &amp; Legalitas Faktor Medan PDAM
            </h2>
            <p className="text-copy-12 text-muted-foreground leading-relaxed">
              Sesuai pedoman <strong>Analisis Beban Kerja (ABK) KepmenPAN-RB / Kemendagri untuk BUMD Air Minum</strong> serta standar teknis <strong>PERPAMSI</strong>, penghitungan kinerja pencatat meter tidak boleh hanya didasarkan pada jumlah sambungan fisik (SL). Kondisi topografi (kontur elevasi, kemiringan lereng), moda akses (sepeda motor vs jalan kaki murni), dan rintangan fisik (pagar terkunci, lorong tangga tebing) wajib diberikan pembobotan pengali waktu agar memenuhi asas keadilan bagi petugas di rute berat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-border text-label-11">
          <div className="p-2 rounded bg-card border border-border">
            <span className="font-semibold text-foreground block">1. Datar / Terbuka (1,00x)</span>
            <span className="text-muted-foreground">Jalan aspal lebar, motor 100%, meter depan pagar</span>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <span className="font-semibold text-foreground block">2. Bergelombang (1,10x - 1,15x)</span>
            <span className="text-muted-foreground">Kontur naik-turun landai, gang pemukiman padat</span>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <span className="font-semibold text-foreground block">3. Berbukit / Tanjakan (1,20x - 1,25x)</span>
            <span className="text-muted-foreground">Jalan sempit tanjakan, motor parkir di jalan utama</span>
          </div>
          <div className="p-2 rounded bg-card border border-border">
            <span className="font-semibold text-foreground block">4. Curam / Tangga (1,30x - 1,45x)</span>
            <span className="text-muted-foreground">Tebing/bantaran sungai, puluhan anak tangga curam</span>
          </div>
        </div>
      </div>

      {/* 4. Toolbar: Filter, Search, Bulk Actions, Save */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Filter Tab Topografi */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "Semua Medan" },
            { id: "DATAR", label: "Datar (1,0x)" },
            { id: "BERGELOMBANG", label: "Bergelombang (1,1x)" },
            { id: "BERBUKIT", label: "Berbukit (1,2x)" },
            { id: "CURAM_TANGGA", label: "Curam/Tangga (1,3x+)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTopografiFilter(tab.id)}
              className={cn(
                "h-8 px-3 rounded-md border text-label-12 font-medium transition-all cursor-pointer shrink-0 bg-card",
                topografiFilter === tab.id
                  ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Seksi */}
          <Select value={seksiFilter} onValueChange={setSeksiFilter}>
            <SelectTrigger className="h-8 w-44 text-xs bg-card">
              <SelectValue placeholder="Pilih Wilayah/Seksi" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="ALL">Semua Seksi Wilayah</SelectItem>
              {seksiList.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari rute atau petugas..."
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

          {/* Tombol Terapkan Massal */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsBulkDialogOpen(true)}
            className="h-8 gap-1.5 text-xs bg-card"
          >
            <SlidersHorizontal className="size-3.5 text-(--ds-blue-700)" />
            <span>Terapkan Massal</span>
          </Button>

          {/* Tombol Export CSV */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={loading || routes.length === 0}
            className="h-8 gap-1.5 text-xs bg-card"
          >
            <Download className="size-3.5" />
            <span>Unduh CSV</span>
          </Button>

          {/* Tombol Simpan Perubahan */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSaveAll}
            disabled={loading || saving || !hasUnsavedChanges}
            className={cn(
              "h-8 gap-1.5 text-xs",
              hasUnsavedChanges && "bg-(--ds-amber-800) hover:bg-(--ds-amber-900) text-white"
            )}
          >
            <Save className="size-3.5" />
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </Button>
        </div>
      </div>

      {/* 5. Tabel Matriks Parameter Faktor Medan per Rute */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-copy-13 whitespace-nowrap tabular-nums">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-label-11 font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-3 w-10 text-center">No.</th>
                <th className="py-2.5 px-3">Kode Rute</th>
                <th className="py-2.5 px-3">Seksi / Wilayah</th>
                <th className="py-2.5 px-3">Petugas Penanggung Jawab</th>
                <th className="py-2.5 px-3 text-right">Beban SL</th>
                <th className="py-2.5 px-3">Kategori Topografi</th>
                <th className="py-2.5 px-3">Moda Akses</th>
                <th className="py-2.5 px-3">Hambatan Khusus</th>
                <th className="py-2.5 px-3 text-center">Faktor Medan (Fm)</th>
                <th className="py-2.5 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    Memuat dan mengkalkulasi matriks topografi rute...
                  </td>
                </tr>
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    Tidak ada rute yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((item, idx) => (
                  <tr key={item.ruteKode} className="hover:bg-muted/30 transition-colors h-10">
                    <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                      {idx + 1}
                    </td>

                    {/* Kode Rute */}
                    <td className="py-2 px-3">
                      <span className="font-mono font-bold text-foreground">
                        {item.ruteKode}
                      </span>
                    </td>

                    {/* Seksi / Wilayah */}
                    <td className="py-2 px-3 text-muted-foreground">
                      {item.seksiNama || item.seksiKode || "—"}
                    </td>

                    {/* Petugas Default */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {item.pencatatNama || item.pencatatDefault || "Belum Ditugaskan"}
                        </span>
                        {item.pencatatDefault && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            ({item.pencatatDefault})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Beban SL */}
                    <td className="py-2 px-3 text-right font-mono font-semibold text-foreground">
                      {num(item.jumlahSL)} SL
                    </td>

                    {/* Selector Topografi Cepat */}
                    <td className="py-2 px-3">
                      <Select
                        value={item.topografi}
                        onValueChange={(val) =>
                          handleUpdateSingleRoute(item.ruteKode, {
                            topografi: val as TopografiKategori,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-36 text-xs bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="DATAR">Datar (1,00x)</SelectItem>
                          <SelectItem value="BERGELOMBANG">Bergelombang (1,10x)</SelectItem>
                          <SelectItem value="BERBUKIT">Berbukit (1,20x)</SelectItem>
                          <SelectItem value="CURAM_TANGGA">Curam/Tangga (1,30x)</SelectItem>
                          <SelectItem value="EKSTREM">Ekstrem (1,40x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Selector Moda Akses */}
                    <td className="py-2 px-3">
                      <Select
                        value={item.modaAkses}
                        onValueChange={(val) =>
                          handleUpdateSingleRoute(item.ruteKode, {
                            modaAkses: val as ModaAkses,
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-32 text-xs bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                          <SelectItem value="MOTOR_PENUH">Motor 100%</SelectItem>
                          <SelectItem value="CAMPURAN">Campuran (Kaki+Motor)</SelectItem>
                          <SelectItem value="JALAN_KAKI_MURNI">Jalan Kaki Lorong</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Hambatan Khusus */}
                    <td className="py-2 px-3">
                      {item.hambatanKhusus && item.hambatanKhusus.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {item.hambatanKhusus.slice(0, 2).map((h) => {
                            const found = DAFTAR_HAMBATAN_KHUSUS.find((d) => d.id === h);
                            return (
                              <Badge
                                key={h}
                                variant="amber-subtle"
                                size="sm"
                                className="text-[10px] font-normal"
                              >
                                {found?.label.split("/")[0] || h}
                              </Badge>
                            );
                          })}
                          {item.hambatanKhusus.length > 2 && (
                            <Badge variant="gray-subtle" size="sm" className="text-[10px]">
                              +{item.hambatanKhusus.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Nilai Faktor Medan Akhir */}
                    <td className="py-2 px-3 text-center font-mono">
                      <Badge
                        variant={
                          item.faktorMedan >= 1.25
                            ? "red-subtle"
                            : item.faktorMedan >= 1.15
                            ? "amber-subtle"
                            : item.faktorMedan >= 1.05
                            ? "blue-subtle"
                            : "gray-subtle"
                        }
                        size="sm"
                        className="font-mono font-bold"
                      >
                        {item.faktorMedan.toFixed(2)}x
                      </Badge>
                    </td>

                    {/* Aksi Edit Detail */}
                    <td className="py-2 px-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingRoute(item)}
                        title="Buka dialog edit detail rute"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Dialog Edit Detail & Hambatan Khusus Rute */}
      <Dialog open={!!editingRoute} onOpenChange={(open) => !open && setEditingRoute(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-heading-16 flex items-center gap-2">
              <Mountain className="size-4 text-(--ds-amber-700)" />
              <span>Konfigurasi Medan Rute: {editingRoute?.ruteKode}</span>
            </DialogTitle>
            <DialogDescription className="text-copy-12">
              Seksi {editingRoute?.seksiNama || editingRoute?.seksiKode} &middot; Petugas:{" "}
              {editingRoute?.pencatatNama || editingRoute?.pencatatDefault || "Belum ada"} &middot;{" "}
              {num(editingRoute?.jumlahSL ?? 0)} SL
            </DialogDescription>
          </DialogHeader>

          {editingRoute && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-label-12">Kategori Topografi</Label>
                  <Select
                    value={editingRoute.topografi}
                    onValueChange={(val: TopografiKategori) =>
                      setEditingRoute({ ...editingRoute, topografi: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="DATAR">Datar (1,00x)</SelectItem>
                      <SelectItem value="BERGELOMBANG">Bergelombang (1,10x)</SelectItem>
                      <SelectItem value="BERBUKIT">Berbukit (1,20x)</SelectItem>
                      <SelectItem value="CURAM_TANGGA">Curam/Tangga (1,30x)</SelectItem>
                      <SelectItem value="EKSTREM">Ekstrem (1,40x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-label-12">Moda Akses</Label>
                  <Select
                    value={editingRoute.modaAkses}
                    onValueChange={(val: ModaAkses) =>
                      setEditingRoute({ ...editingRoute, modaAkses: val })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="MOTOR_PENUH">Motor Penuh (1,00x)</SelectItem>
                      <SelectItem value="CAMPURAN">Campuran (1,06x)</SelectItem>
                      <SelectItem value="JALAN_KAKI_MURNI">Jalan Kaki Lorong (1,12x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hambatan Khusus */}
              <div className="space-y-1.5">
                <Label className="text-label-12">Hambatan Lapangan Khusus</Label>
                <div className="grid grid-cols-2 gap-2 text-label-11">
                  {DAFTAR_HAMBATAN_KHUSUS.map((h) => {
                    const isChecked = editingRoute.hambatanKhusus?.includes(h.id);
                    return (
                      <label
                        key={h.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all",
                          isChecked
                            ? "border-(--ds-amber-700)/50 bg-(--ds-amber-500)/10 text-foreground font-medium"
                            : "border-border text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = editingRoute.hambatanKhusus || [];
                            const next = e.target.checked
                              ? [...cur, h.id]
                              : cur.filter((x) => x !== h.id);
                            setEditingRoute({ ...editingRoute, hambatanKhusus: next });
                          }}
                          className="rounded border-border"
                        />
                        <span>{h.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Faktor Override & Catatan */}
              <div className="space-y-1">
                <Label className="text-label-12">Catatan Verifikasi / Justifikasi Lapangan</Label>
                <Input
                  type="text"
                  placeholder="Contoh: Lereng bukit Cidadap, tangga curam 80 trap..."
                  value={editingRoute.catatan || ""}
                  onChange={(e) =>
                    setEditingRoute({ ...editingRoute, catatan: e.target.value })
                  }
                  className="h-8 text-xs bg-card"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingRoute(null)}
              className="h-8 text-xs"
            >
              Tutup
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                if (editingRoute) {
                  handleUpdateSingleRoute(editingRoute.ruteKode, editingRoute);
                  setEditingRoute(null);
                  toast.success(`Parameter rute ${editingRoute.ruteKode} diperbarui.`);
                }
              }}
              className="h-8 text-xs"
            >
              Terapkan ke Tabel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Dialog Terapkan Massal ke Seluruh Seksi */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-heading-16 flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-(--ds-blue-700)" />
              <span>Terapkan Faktor Medan Massal</span>
            </DialogTitle>
            <DialogDescription className="text-copy-12">
              Ubah kategori topografi dan moda akses sekaligus untuk seluruh rute dalam satu seksi/wilayah operasional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-label-12">Target Seksi / Wilayah</Label>
              <Select value={bulkSeksi} onValueChange={setBulkSeksi}>
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ALL">Semua Seksi (125 Rute)</SelectItem>
                  {seksiList.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-label-12">Kategori Topografi</Label>
                <Select
                  value={bulkTopografi}
                  onValueChange={(val: TopografiKategori) => setBulkTopografi(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="DATAR">Datar (1,00x)</SelectItem>
                    <SelectItem value="BERGELOMBANG">Bergelombang (1,10x)</SelectItem>
                    <SelectItem value="BERBUKIT">Berbukit (1,20x)</SelectItem>
                    <SelectItem value="CURAM_TANGGA">Curam/Tangga (1,30x)</SelectItem>
                    <SelectItem value="EKSTREM">Ekstrem (1,40x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-label-12">Moda Akses</Label>
                <Select
                  value={bulkModa}
                  onValueChange={(val: ModaAkses) => setBulkModa(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="MOTOR_PENUH">Motor 100%</SelectItem>
                    <SelectItem value="CAMPURAN">Campuran (Kaki+Motor)</SelectItem>
                    <SelectItem value="JALAN_KAKI_MURNI">Jalan Kaki Lorong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkDialogOpen(false)}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleApplyBulk}
              className="h-8 text-xs"
            >
              Terapkan Massal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
