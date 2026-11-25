"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  Users,
  Save,
  RefreshCw,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  MapPin,
  Search,
  CheckCircle2,
  Mountain,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
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
import { kpiApi } from "../api";
import type {
  AturanInsentifData,
  AlokasiPetugasItem,
  AlokasiRuteItem,
} from "@/server/services/kpi/kpi.service";

const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const PRESET_FAKTOR_MEDAN = [
  {
    value: 1.0,
    kategori: "NORMAL",
    label: "1.00x — Datar / Normal",
    deskripsi: "Jalan utama aspal, meteran mudah dijangkau di depan pagar",
    color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  {
    value: 1.05,
    kategori: "PADAT_PENDUDUK",
    label: "1.05x — Pemukiman Padat",
    deskripsi: "Area perumahan rapat, parkir terbatas, meteran bervariasi",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  },
  {
    value: 1.1,
    kategori: "PERBUKITAN",
    label: "1.10x — Tanjakan / Perbukitan",
    deskripsi: "Kontur jalan menanjak/curam, jarak antar rumah berjauhan",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  {
    value: 1.15,
    kategori: "GANG_SEMPIT",
    label: "1.15x — Gang Sempit / Berliku",
    deskripsi: "Kendaraan motor tidak bisa masuk, jalan kaki jauh, lorong padat",
    color: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  },
  {
    value: 1.2,
    kategori: "EKSTREM",
    label: "1.20x — Ekstrem / Rawan",
    deskripsi: "Medan terjal, area perbatasan terpencil, akses sangat menantang",
    color: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  },
];

export function KpiPengaturanInsentifTab({
  selectedPeriod,
  onUpdated,
}: {
  selectedPeriod: string;
  onUpdated?: () => void;
}) {
  const [activeSubTab, setActiveSubTab] = React.useState<"rumusan" | "beban">(
    "rumusan"
  );
  const [loading, setLoading] = React.useState(true);
  const [savingRumus, setSavingRumus] = React.useState(false);
  const [savingPetugasId, setSavingPetugasId] = React.useState<string | null>(
    null
  );
  const [savingRouteKode, setSavingRouteKode] = React.useState<string | null>(
    null
  );

  // Form State Aturan Rumusan
  const [aturan, setAturan] = React.useState<AturanInsentifData>({
    periode: selectedPeriod,
    insentifDasar: 500000,
    tarifPerSl: 400,
    bobotCapaianSl: 40,
    bobotAkurasiGps: 25,
    bobotKualitasBaca: 20,
    bobotKecepatan: 15,
    targetDurasiDetik: 45,
    thresholdGradeA: 90,
    thresholdGradeB: 75,
    thresholdGradeC: 60,
    pengaliGradeA: 1.1,
    pengaliGradeB: 1.0,
    pengaliGradeC: 0.65,
    minIndeksBeban: 0.7,
    maxIndeksBeban: 1.4,
    catatan: "Formula Standar Berdasarkan SK Direksi M2C",
  });

  // State Alokasi Beban Petugas & Rute
  const [alokasiList, setAlokasiList] = React.useState<AlokasiPetugasItem[]>([]);
  const [routesList, setRoutesList] = React.useState<AlokasiRuteItem[]>([]);

  // Filter Sub-Tab B
  const [selectedPetugasFilter, setSelectedPetugasFilter] =
    React.useState<string>("ALL");
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] =
    React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"routes" | "petugas">("routes");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [aturanRes, alokasiRes] = await Promise.all([
        kpiApi.getAturanInsentif(selectedPeriod),
        kpiApi.getAlokasiBeban(selectedPeriod),
      ]);
      if (aturanRes) setAturan(aturanRes);
      if (alokasiRes?.items) setAlokasiList(alokasiRes.items);
      if (alokasiRes?.routes) setRoutesList(alokasiRes.routes);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat konfigurasi insentif");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Validasi Total Bobot = 100%
  const totalBobot =
    (Number(aturan.bobotCapaianSl) || 0) +
    (Number(aturan.bobotAkurasiGps) || 0) +
    (Number(aturan.bobotKualitasBaca) || 0) +
    (Number(aturan.bobotKecepatan) || 0);

  const isBobotValid = totalBobot === 100;

  // Handler Simpan Aturan Rumusan
  const handleSaveAturan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBobotValid) {
      toast.error(
        `Total bobot komponen harus tepat 100%! (Saat ini: ${totalBobot}%)`
      );
      return;
    }

    setSavingRumus(true);
    try {
      await kpiApi.updateAturanInsentif({
        ...aturan,
        periode: selectedPeriod,
      });
      toast.success(
        `Konfigurasi rumusan insentif periode ${selectedPeriod} berhasil disimpan!`
      );
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan konfigurasi rumusan");
    } finally {
      setSavingRumus(false);
    }
  };

  // Handler Update Row Rute Lokal
  const handleRouteChange = (
    ruteKode: string,
    field: keyof AlokasiRuteItem,
    value: any
  ) => {
    setRoutesList((prev) =>
      prev.map((r) => {
        if (r.kode === ruteKode) {
          const updated = { ...r, [field]: value };
          if (field === "faktorKesulitanMedan") {
            const foundPreset = PRESET_FAKTOR_MEDAN.find(
              (p) => Math.abs(p.value - Number(value)) < 0.01
            );
            if (foundPreset) {
              updated.kategoriMedan = foundPreset.kategori;
            }
          }
          return updated;
        }
        return r;
      })
    );

    // Otomatis sinkronkan recalculation pada petugas terkait jika ada
    const targetRoute = routesList.find((r) => r.kode === ruteKode);
    if (targetRoute?.petugasId && field === "faktorKesulitanMedan") {
      const newFactor = Number(value);
      setAlokasiList((prevPetugas) =>
        prevPetugas.map((p) => {
          if (p.petugasId === targetRoute.petugasId) {
            const updatedRoutes = p.ruteDetails.map((rd) =>
              rd.kode === ruteKode
                ? { ...rd, faktorKesulitanMedan: newFactor }
                : rd
            );
            let sumSl = 0;
            let sumWeighted = 0;
            updatedRoutes.forEach((rd) => {
              sumSl += rd.targetSl;
              sumWeighted += rd.targetSl * rd.faktorKesulitanMedan;
            });
            const composite =
              sumSl > 0
                ? Number((sumWeighted / sumSl).toFixed(2))
                : p.faktorKesulitanRuteKomposit;
            return {
              ...p,
              ruteDetails: updatedRoutes,
              faktorKesulitanRuteKomposit: composite,
              faktorKesulitanMedan: composite,
            };
          }
          return p;
        })
      );
    }
  };

  // Handler Simpan Faktor Kesulitan Rute ke Database
  const handleSaveRoute = async (route: AlokasiRuteItem) => {
    setSavingRouteKode(route.kode);
    try {
      await kpiApi.updateFaktorRute(route.kode, {
        faktorKesulitanMedan: route.faktorKesulitanMedan,
        kategoriMedan: route.kategoriMedan,
        keterangan: route.keterangan,
      });
      toast.success(
        `Faktor kesulitan medan rute ${route.kode} (${route.faktorKesulitanMedan}x) berhasil disimpan!`
      );
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui kesulitan medan rute");
    } finally {
      setSavingRouteKode(null);
    }
  };

  // Handler Update Row Alokasi Petugas Lokal
  const handleAlokasiChange = (
    petugasId: string,
    field: keyof AlokasiPetugasItem,
    value: any
  ) => {
    setAlokasiList((prev) =>
      prev.map((item) => {
        if (item.petugasId === petugasId) {
          const updated = { ...item, [field]: value };
          if (field === "targetSlPenugasan") {
            updated.targetEfektif =
              value !== null && value > 0 ? value : item.targetRuteStandar;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Handler Simpan 1 Baris Alokasi Petugas ke Database
  const handleSavePetugasRow = async (item: AlokasiPetugasItem) => {
    setSavingPetugasId(item.petugasId);
    try {
      await kpiApi.updateAlokasiPetugas(item.petugasId, {
        periode: selectedPeriod,
        targetSlPenugasan: item.targetSlPenugasan,
        faktorKesulitanMedan: item.faktorKesulitanMedan,
        statusTugas: item.statusTugas,
        catatan: item.catatan,
      });
      toast.success(`Alokasi penugasan untuk ${item.nama} berhasil diperbarui`);
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui alokasi petugas");
    } finally {
      setSavingPetugasId(null);
    }
  };

  // Filter Data Rute
  const filteredRoutes = React.useMemo(() => {
    let list = routesList;

    // 1. Filter Petugas
    if (selectedPetugasFilter !== "ALL") {
      list = list.filter((r) => r.petugasId === selectedPetugasFilter);
    }

    // 2. Filter Difficulty
    if (selectedDifficultyFilter !== "ALL") {
      const targetVal = parseFloat(selectedDifficultyFilter);
      list = list.filter(
        (r) => Math.abs(r.faktorKesulitanMedan - targetVal) < 0.02
      );
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.kode.toLowerCase().includes(q) ||
          (r.seksiNama && r.seksiNama.toLowerCase().includes(q)) ||
          (r.seksiKode && r.seksiKode.toLowerCase().includes(q)) ||
          (r.petugasNama && r.petugasNama.toLowerCase().includes(q)) ||
          (r.keterangan && r.keterangan.toLowerCase().includes(q))
      );
    }

    return list;
  }, [routesList, selectedPetugasFilter, selectedDifficultyFilter, searchQuery]);

  // Filter Data Petugas
  const filteredAlokasi = React.useMemo(() => {
    let list = alokasiList;

    if (selectedPetugasFilter !== "ALL") {
      list = list.filter((i) => i.petugasId === selectedPetugasFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.nama.toLowerCase().includes(q) ||
          i.petugasId.toLowerCase().includes(q) ||
          i.ruteList.some((r) => r.toLowerCase().includes(q))
      );
    }

    return list;
  }, [alokasiList, selectedPetugasFilter, searchQuery]);

  // Petugas Terpilih (jika bukan "ALL")
  const activeOfficer = React.useMemo(() => {
    if (selectedPetugasFilter === "ALL") return null;
    return alokasiList.find((p) => p.petugasId === selectedPetugasFilter) || null;
  }, [alokasiList, selectedPetugasFilter]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-3.5 hide-scrollbar">
      {/* 1. Header Sub-Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab("rumusan")}
            className={`h-8 px-3 rounded-md border text-label-12 font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-card ${
              activeSubTab === "rumusan"
                ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="size-3.5 text-(--ds-blue-700)" />
            <span>A. Parameter &amp; Rumusan Insentif (SK Direksi)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("beban")}
            className={`h-8 px-3 rounded-md border text-label-12 font-medium flex items-center gap-1.5 transition-all cursor-pointer bg-card ${
              activeSubTab === "beban"
                ? "border-foreground/40 text-foreground font-semibold shadow-2xs"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mountain className="size-3.5 text-(--ds-amber-700)" />
            <span>B. Kesulitan Medan per Rute &amp; Alokasi Beban</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="h-8 gap-1.5 text-xs bg-card"
        >
          <RefreshCw className="size-3.5 text-muted-foreground" />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* 2. TAB A: PENGATURAN RUMUSAN INSENTIF */}
      {activeSubTab === "rumusan" && (
        <form onSubmit={handleSaveAturan} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bagian 1: Tarif & Anggaran Dasar */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <FileCheck className="size-4 text-(--ds-blue-700)" />
                <h4 className="text-label-13 font-semibold text-foreground">
                  1. Tarif Dasar &amp; Satuan SL
                </h4>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Nominal Insentif Dasar (Rp / Bulan)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="25000"
                  value={aturan.insentifDasar}
                  onChange={(e) =>
                    setAturan({
                      ...aturan,
                      insentifDasar: Number(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">
                  {idr(aturan.insentifDasar)} (Tunjangan dasar kehadiran/tugas)
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tarif per Lembar SL Terbaca (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  value={aturan.tarifPerSl}
                  onChange={(e) =>
                    setAturan({
                      ...aturan,
                      tarifPerSl: Number(e.target.value) || 0,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">
                  {idr(aturan.tarifPerSl)} / SL valid terbaca
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Target Durasi Baca Ideal (Detik/SL)
                </Label>
                <Input
                  type="number"
                  min="10"
                  max="180"
                  value={aturan.targetDurasiDetik}
                  onChange={(e) =>
                    setAturan({
                      ...aturan,
                      targetDurasiDetik: Number(e.target.value) || 45,
                    })
                  }
                  className="h-8 text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">
                  Standar efisiensi: &le; {aturan.targetDurasiDetik} detik per SL
                </span>
              </div>
            </div>

            {/* Bagian 2: Bobot Komponen KPI (Harus 100%) */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-(--ds-green-700)" />
                  <h4 className="text-label-13 font-semibold text-foreground">
                    2. Bobot Komponen KPI
                  </h4>
                </div>
                <Badge
                  variant={isBobotValid ? "default" : "destructive"}
                  className="text-[11px] font-mono px-2 py-0.5"
                >
                  Total: {totalBobot}%
                </Badge>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>1. Capaian Kuantitas Target SL</span>
                    <span className="font-mono font-semibold">
                      {aturan.bobotCapaianSl}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={aturan.bobotCapaianSl}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        bobotCapaianSl: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>2. Akurasi Lokasi GPS (Geofence &le; 50m)</span>
                    <span className="font-mono font-semibold">
                      {aturan.bobotAkurasiGps}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={aturan.bobotAkurasiGps}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        bobotAkurasiGps: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>3. Kualitas Bacaan &amp; Minimal Anomali</span>
                    <span className="font-mono font-semibold">
                      {aturan.bobotKualitasBaca}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={aturan.bobotKualitasBaca}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        bobotKualitasBaca: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>4. Kecepatan &amp; Disiplin Durasi</span>
                    <span className="font-mono font-semibold">
                      {aturan.bobotKecepatan}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={aturan.bobotKecepatan}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        bobotKecepatan: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {!isBobotValid && (
                <div className="flex items-center gap-1.5 rounded bg-red-500/10 p-2 text-xs text-red-600">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Total bobot harus bernilai 100% agar formula matematis presisi.
                  </span>
                </div>
              )}
            </div>

            {/* Bagian 3: Ambang Batas Grade & Pengali */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <ShieldAlert className="size-4 text-(--ds-amber-700)" />
                <h4 className="text-label-13 font-semibold text-foreground">
                  3. Ambang Grade &amp; Pengali Insentif
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px]">Min. Grade A (Skor)</Label>
                  <Input
                    type="number"
                    value={aturan.thresholdGradeA}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        thresholdGradeA: Number(e.target.value) || 90,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Pengali Grade A</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={aturan.pengaliGradeA}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        pengaliGradeA: Number(e.target.value) || 1.1,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Min. Grade B (Skor)</Label>
                  <Input
                    type="number"
                    value={aturan.thresholdGradeB}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        thresholdGradeB: Number(e.target.value) || 75,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Pengali Grade B</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={aturan.pengaliGradeB}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        pengaliGradeB: Number(e.target.value) || 1.0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px]">Min. Grade C (Skor)</Label>
                  <Input
                    type="number"
                    value={aturan.thresholdGradeC}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        thresholdGradeC: Number(e.target.value) || 60,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Pengali Grade C</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={aturan.pengaliGradeC}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        pengaliGradeC: Number(e.target.value) || 0.65,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-2 space-y-2">
                <Label className="text-xs">
                  Batas Rasio Beban Kerja (Min - Max)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.05"
                    value={aturan.minIndeksBeban}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        minIndeksBeban: Number(e.target.value) || 0.7,
                      })
                    }
                    className="h-8 text-xs font-mono w-24"
                  />
                  <span className="text-xs text-muted-foreground">s/d</span>
                  <Input
                    type="number"
                    step="0.05"
                    value={aturan.maxIndeksBeban}
                    onChange={(e) =>
                      setAturan({
                        ...aturan,
                        maxIndeksBeban: Number(e.target.value) || 1.4,
                      })
                    }
                    className="h-8 text-xs font-mono w-24"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Mencegah diskriminasi ekstrem antara rute ringan dan padat.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">
              Catatan: Perubahan parameter ini langsung memengaruhi perhitungan
              nominal pada Tab 2 untuk periode <strong>{selectedPeriod}</strong>.
            </div>
            <Button
              type="submit"
              disabled={!isBobotValid || savingRumus}
              className="h-8 gap-1.5 text-xs bg-(--ds-blue-700) hover:bg-(--ds-blue-800) text-white"
            >
              <Save className="size-3.5" />
              <span>
                {savingRumus ? "Menyimpan..." : "Simpan Rumusan Insentif"}
              </span>
            </Button>
          </div>
        </form>
      )}

      {/* 3. TAB B: KESULITAN MEDAN PER RUTE & ALOKASI BEBAN KERJA */}
      {activeSubTab === "beban" && (
        <div className="space-y-3 w-full max-w-full min-w-0">
          {/* A. FILTER & CONTROLS TOOLBAR */}
          <div className="rounded-lg border border-border bg-card p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 w-full max-w-full overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {/* Filter 1: Pilih Petugas */}
              <div className="w-52 sm:w-60 max-w-full shrink-0">
                <Select
                  value={selectedPetugasFilter}
                  onValueChange={(val) => setSelectedPetugasFilter(val)}
                >
                  <SelectTrigger className="h-8 w-full text-xs truncate">
                    <SelectValue placeholder="Pilih Petugas..." />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    align="start"
                    className="text-xs max-h-64"
                  >
                    <SelectItem value="ALL">
                      🌟 Semua Petugas ({routesList.length} Rute)
                    </SelectItem>
                    {alokasiList.map((p) => (
                      <SelectItem key={p.petugasId} value={p.petugasId}>
                        👤 {p.nama} ({p.jumlahRute} Rute)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter 2: Tingkat Kesulitan Medan */}
              <div className="w-40 sm:w-44 max-w-full shrink-0">
                <Select
                  value={selectedDifficultyFilter}
                  onValueChange={(val) => setSelectedDifficultyFilter(val)}
                >
                  <SelectTrigger className="h-8 w-full text-xs truncate">
                    <SelectValue placeholder="Tingkat Medan..." />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    align="start"
                    className="text-xs"
                  >
                    <SelectItem value="ALL">Semua Tingkat Medan</SelectItem>
                    {PRESET_FAKTOR_MEDAN.map((ps) => (
                      <SelectItem key={ps.value} value={String(ps.value)}>
                        {ps.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter 3: Pencarian Kode / Nama */}
              <div className="relative flex-1 min-w-[120px] max-w-xs">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari kode rute / seksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full text-xs pl-8 pr-7"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Reset Filter Cepat jika ada filter aktif */}
              {(selectedPetugasFilter !== "ALL" ||
                selectedDifficultyFilter !== "ALL" ||
                searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPetugasFilter("ALL");
                    setSelectedDifficultyFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  Reset Filter
                </Button>
              )}
            </div>

            {/* Toggle Tampilan (Rute vs Petugas) */}
            <div className="flex items-center gap-0.5 border border-border rounded-md p-0.5 bg-muted/20 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("routes")}
                className={`h-7 px-2.5 text-xs rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "routes"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mountain className="size-3 text-(--ds-blue-700)" />
                <span>Rute ({filteredRoutes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("petugas")}
                className={`h-7 px-2.5 text-xs rounded font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "petugas"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-3 text-(--ds-amber-700)" />
                <span>Petugas ({filteredAlokasi.length})</span>
              </button>
            </div>
          </div>

          {/* B. KARTU PROFIL & KOMPOSIT BEBAN (Ketika Petugas Spesifik Dipilih) */}
          {activeOfficer ? (
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-3 w-full max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="size-8 rounded-full bg-(--ds-blue-700)/10 text-(--ds-blue-700) font-semibold flex items-center justify-center text-xs shrink-0">
                    {activeOfficer.nama.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-label-13 font-semibold text-foreground flex items-center gap-2 flex-wrap">
                      <span className="truncate">{activeOfficer.nama}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono shrink-0"
                      >
                        {activeOfficer.petugasId}
                      </Badge>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${
                          activeOfficer.statusTugas === "AKTIF"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        }`}
                        variant="outline"
                      >
                        {activeOfficer.statusTugas}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {activeOfficer.noHp
                        ? `Kontak: ${activeOfficer.noHp} • `
                        : ""}
                      {activeOfficer.jumlahRute} Rute Diampu:{" "}
                      {activeOfficer.ruteList.join(", ") || "Belum ada rute"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSavePetugasRow(activeOfficer)}
                    disabled={savingPetugasId === activeOfficer.petugasId}
                    className="h-7 px-3 text-xs gap-1.5 bg-card hover:bg-muted"
                  >
                    <Save className="size-3.5 text-muted-foreground" />
                    <span>
                      {savingPetugasId === activeOfficer.petugasId
                        ? "Menyimpan..."
                        : "Simpan Petugas"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Indikator Beban & Faktor Medan Terbobot: 4 Kolom Simetris & Responsif */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs w-full">
                {/* 1. Total Target SL */}
                <div className="rounded-md border border-border bg-muted/10 p-2.5 flex flex-col justify-between min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate">
                    Total Target SL Rute
                  </div>
                  <div className="text-label-14 font-mono font-bold text-foreground mt-1 truncate">
                    {activeOfficer.targetRuteStandar.toLocaleString("id-ID")} SL
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Beban standar gabungan rute
                  </div>
                </div>

                {/* 2. Target Khusus Penugasan (Rata Kiri) */}
                <div className="rounded-md border border-border bg-muted/10 p-2.5 flex flex-col justify-between min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate">
                    Target Khusus Penugasan
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      type="number"
                      placeholder={String(activeOfficer.targetRuteStandar)}
                      value={activeOfficer.targetSlPenugasan ?? ""}
                      onChange={(e) =>
                        handleAlokasiChange(
                          activeOfficer.petugasId,
                          "targetSlPenugasan",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="h-7 w-24 text-left px-2 font-mono text-xs"
                    />
                    <span className="text-[11px] text-muted-foreground font-mono">
                      SL
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Override khusus jika ada
                  </div>
                </div>

                {/* 3. Faktor Medan Terbobot */}
                <div className="rounded-md border border-(--ds-blue-700)/30 bg-(--ds-blue-700)/5 p-2.5 flex flex-col justify-between min-w-0">
                  <div className="text-[11px] text-(--ds-blue-700) font-medium flex items-center gap-1 truncate">
                    <Sparkles className="size-3 shrink-0" />
                    <span className="truncate">Faktor Medan Terbobot</span>
                  </div>
                  <div className="text-label-14 font-mono font-bold text-(--ds-blue-700) mt-1 truncate">
                    {activeOfficer.faktorKesulitanRuteKomposit.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    &Sigma;(SL &times; Faktor Rute) &divide; Total SL
                  </div>
                </div>

                {/* 4. Status Dinas */}
                <div className="rounded-md border border-border bg-muted/10 p-2.5 flex flex-col justify-between min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate">
                    Status Dinas Petugas
                  </div>
                  <div className="mt-1">
                    <Select
                      value={activeOfficer.statusTugas}
                      onValueChange={(val) =>
                        handleAlokasiChange(
                          activeOfficer.petugasId,
                          "statusTugas",
                          val
                        )
                      }
                    >
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        align="start"
                        className="text-xs"
                      >
                        <SelectItem value="AKTIF">AKTIF (Berdinas)</SelectItem>
                        <SelectItem value="CUTI">CUTI (Izin Resmi)</SelectItem>
                        <SelectItem value="SAKIT">SAKIT</SelectItem>
                        <SelectItem value="BANTUAN_KHUSUS">BANTUAN KHUSUS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Status penugasan dinas bulan ini
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Ringkasan Global saat "Semua Petugas" terpilih */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground text-[11px]">
                  Total Rute Terdaftar
                </div>
                <div className="text-label-14 font-mono font-bold text-foreground">
                  {routesList.length} Rute
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Seluruh wilayah pencatatan
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground text-[11px]">
                  Total Target Beban SL
                </div>
                <div className="text-label-14 font-mono font-bold text-foreground">
                  {routesList
                    .reduce((acc, r) => acc + r.targetSl, 0)
                    .toLocaleString("id-ID")}{" "}
                  SL
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Pelanggan aktif tercakup
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground text-[11px]">
                  Rata-rata Faktor Medan
                </div>
                <div className="text-label-14 font-mono font-bold text-(--ds-blue-700)">
                  {(
                    routesList.reduce(
                      (acc, r) => acc + r.faktorKesulitanMedan,
                      0
                    ) / Math.max(1, routesList.length)
                  ).toFixed(2)}
                  x
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Faktor kesulitan topografi rata-rata
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-muted-foreground text-[11px]">
                  Rute Medan Tantangan
                </div>
                <div className="text-label-14 font-mono font-bold text-amber-600">
                  {routesList.filter((r) => r.faktorKesulitanMedan > 1.0).length}{" "}
                  Rute
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Faktor pengali &gt; 1.00x
                </div>
              </div>
            </div>
          )}

          {/* C. TABEL DETAIL: 1. VIEW MODE RUTE */}
          {viewMode === "routes" && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3 whitespace-nowrap">Kode Rute &amp; Seksi</th>
                      {selectedPetugasFilter === "ALL" && (
                        <th className="py-2.5 px-3 whitespace-nowrap">Petugas Pengampu</th>
                      )}
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Target Beban</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">
                        Faktor Kesulitan Medan
                      </th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Kategori Medan</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Catatan Topografi / Hambatan</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Beban Terbobot</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRoutes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedPetugasFilter === "ALL" ? 8 : 7}
                          className="py-8 text-center text-muted-foreground italic"
                        >
                          Tidak ada rute yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.map((route) => {
                        const weightedLoad = Math.round(
                          route.targetSl * route.faktorKesulitanMedan
                        );
                        const matchedPreset = PRESET_FAKTOR_MEDAN.find(
                          (p) =>
                            Math.abs(p.value - route.faktorKesulitanMedan) <
                            0.02
                        );

                        return (
                          <tr key={route.kode} className="hover:bg-muted/20">
                            {/* Kode Rute */}
                            <td className="py-2 px-3 whitespace-nowrap">
                              <div className="font-mono font-bold text-foreground flex items-center gap-1.5">
                                <span>{route.kode}</span>
                                {route.seksiKode && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 font-normal"
                                  >
                                    {route.seksiKode}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                                {route.seksiNama || "Wilayah Seksi"}
                              </div>
                            </td>

                            {/* Petugas Pengampu (Hanya jika "Semua Petugas" dipilih) */}
                            {selectedPetugasFilter === "ALL" && (
                              <td className="py-2 px-3 whitespace-nowrap">
                                {route.petugasNama ? (
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {route.petugasNama}
                                    </div>
                                    <div className="font-mono text-[10px] text-muted-foreground">
                                      {route.petugasId}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">
                                    Belum diplot
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Target Beban Standar */}
                            <td className="py-2 px-3 text-right font-mono font-medium whitespace-nowrap">
                              {route.targetSl.toLocaleString("id-ID")} SL
                            </td>

                            {/* Faktor Kesulitan Medan (Dropdown Preset) */}
                            <td className="py-2 px-3 text-center">
                              <Select
                                value={String(route.faktorKesulitanMedan)}
                                onValueChange={(val) =>
                                  handleRouteChange(
                                    route.kode,
                                    "faktorKesulitanMedan",
                                    Number(val)
                                  )
                                }
                              >
                                <SelectTrigger className="h-7 w-38 text-xs mx-auto">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                  {PRESET_FAKTOR_MEDAN.map((ps) => (
                                    <SelectItem
                                      key={ps.value}
                                      value={String(ps.value)}
                                    >
                                      {ps.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>

                            {/* Kategori Badge */}
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <span
                                className={`inline-block text-[10px] px-2 py-0.5 rounded border font-medium ${
                                  matchedPreset?.color ||
                                  "bg-muted text-muted-foreground"
                                }`}
                              >
                                {matchedPreset?.kategori || route.kategoriMedan}
                              </span>
                            </td>

                            {/* Catatan Hambatan */}
                            <td className="py-2 px-3">
                              <Input
                                placeholder="Catatan kondisi medan..."
                                value={route.keterangan ?? ""}
                                onChange={(e) =>
                                  handleRouteChange(
                                    route.kode,
                                    "keterangan",
                                    e.target.value
                                  )
                                }
                                className="h-7 text-xs w-full min-w-[120px] max-w-xs"
                              />
                            </td>

                            {/* Beban Terbobot Ekuivalen */}
                            <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
                              <span className="font-semibold text-foreground">
                                {weightedLoad.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-1">
                                SL-eq
                              </span>
                            </td>

                            {/* Aksi */}
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveRoute(route)}
                                disabled={savingRouteKode === route.kode}
                                className="h-7 px-2.5 text-[11px] gap-1"
                              >
                                <Save className="size-3" />
                                <span>
                                  {savingRouteKode === route.kode
                                    ? "Menyimpan"
                                    : "Simpan"}
                                </span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* D. TABEL DETAIL: 2. VIEW MODE PETUGAS */}
          {viewMode === "petugas" && (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3">Petugas &amp; Kontak</th>
                      <th className="py-2.5 px-3">Rute Diampu</th>
                      <th className="py-2.5 px-3 text-right">Target Standar</th>
                      <th className="py-2.5 px-3 text-center">
                        Target Khusus Penugasan
                      </th>
                      <th className="py-2.5 px-3 text-center">
                        Faktor Komposit Terbobot
                      </th>
                      <th className="py-2.5 px-3 text-center">Status Dinas</th>
                      <th className="py-2.5 px-3">Catatan Supervisor</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAlokasi.map((item) => (
                      <tr key={item.petugasId} className="hover:bg-muted/20">
                        {/* Petugas */}
                        <td className="py-2 px-3">
                          <div className="font-medium text-foreground">
                            {item.nama}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {item.petugasId} {item.noHp ? `• ${item.noHp}` : ""}
                          </div>
                        </td>

                        {/* Rute Diampu */}
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {item.ruteList.length > 0 ? (
                              item.ruteList.map((r) => (
                                <Badge
                                  key={r}
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 font-mono cursor-pointer hover:bg-muted"
                                  onClick={() => {
                                    setSelectedPetugasFilter(item.petugasId);
                                    setViewMode("routes");
                                  }}
                                  title="Klik untuk melihat rute ini"
                                >
                                  {r}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">
                                Belum ada rute
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Target Standar */}
                        <td className="py-2 px-3 text-right font-mono font-medium">
                          {item.targetRuteStandar.toLocaleString("id-ID")} SL
                        </td>

                        {/* Target Khusus (Override) */}
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              placeholder={String(item.targetRuteStandar)}
                              value={item.targetSlPenugasan ?? ""}
                              onChange={(e) =>
                                handleAlokasiChange(
                                  item.petugasId,
                                  "targetSlPenugasan",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-7 w-24 text-center font-mono text-xs"
                            />
                            <span className="text-[10px] text-muted-foreground">
                              SL
                            </span>
                          </div>
                        </td>

                        {/* Faktor Komposit Terbobot */}
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-(--ds-blue-700)/10 text-(--ds-blue-700) font-mono font-bold text-xs px-2 py-0.5 rounded border border-(--ds-blue-700)/20">
                            <span>
                              {item.faktorKesulitanRuteKomposit.toFixed(2)}x
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Dari {item.jumlahRute} rute
                          </div>
                        </td>

                        {/* Status Dinas */}
                        <td className="py-2 px-3 text-center">
                          <Select
                            value={item.statusTugas}
                            onValueChange={(val) =>
                              handleAlokasiChange(
                                item.petugasId,
                                "statusTugas",
                                val
                              )
                            }
                          >
                            <SelectTrigger className="h-7 w-28 text-xs mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="text-xs">
                              <SelectItem value="AKTIF">AKTIF</SelectItem>
                              <SelectItem value="CUTI">CUTI</SelectItem>
                              <SelectItem value="SAKIT">SAKIT</SelectItem>
                              <SelectItem value="BANTUAN_KHUSUS">
                                BANTUAN
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Catatan Supervisor */}
                        <td className="py-2 px-3">
                          <Input
                            placeholder="Catatan penugasan..."
                            value={item.catatan ?? ""}
                            onChange={(e) =>
                              handleAlokasiChange(
                                item.petugasId,
                                "catatan",
                                e.target.value
                              )
                            }
                            className="h-7 text-xs w-36"
                          />
                        </td>

                        {/* Aksi */}
                        <td className="py-2 px-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSavePetugasRow(item)}
                            disabled={savingPetugasId === item.petugasId}
                            className="h-7 px-2.5 text-[11px] gap-1"
                          >
                            <Save className="size-3" />
                            <span>
                              {savingPetugasId === item.petugasId
                                ? "Menyimpan"
                                : "Simpan"}
                            </span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
