"use client";

import * as React from "react";
import {
  SlidersHorizontal,
  Users,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Mountain,
  FileCheck,
  ShieldAlert,
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
} from "@/server/services/kpi/kpi.service";

const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

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

  // State Alokasi Beban Petugas
  const [alokasiList, setAlokasiList] = React.useState<AlokasiPetugasItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [aturanRes, alokasiRes] = await Promise.all([
        kpiApi.getAturanInsentif(selectedPeriod),
        kpiApi.getAlokasiBeban(selectedPeriod),
      ]);
      if (aturanRes) setAturan(aturanRes);
      if (alokasiRes?.items) setAlokasiList(alokasiRes.items);
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
      toast.error(`Total bobot komponen harus tepat 100%! (Saat ini: ${totalBobot}%)`);
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
      toast.success(`Alokasi untuk ${item.nama} berhasil diperbarui`);
      onUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui alokasi petugas");
    } finally {
      setSavingPetugasId(null);
    }
  };

  const filteredAlokasi = React.useMemo(() => {
    if (!searchQuery.trim()) return alokasiList;
    const q = searchQuery.toLowerCase();
    return alokasiList.filter(
      (i) =>
        i.nama.toLowerCase().includes(q) ||
        i.petugasId.toLowerCase().includes(q) ||
        i.ruteList.some((r) => r.toLowerCase().includes(q))
    );
  }, [alokasiList, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
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
            <Users className="size-3.5 text-(--ds-amber-700)" />
            <span>B. Alokasi Beban Kerja &amp; Faktor Kesulitan Medan</span>
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
                <Label className="text-xs">Nominal Insentif Dasar (Rp / Bulan)</Label>
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
                <Label className="text-xs">Target Durasi Baca Ideal (Detik/SL)</Label>
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
                  Batas waktu standar pencatatan 1 persil pelanggan
                </span>
              </div>
            </div>

            {/* Bagian 2: Bobot Komponen Penilaian KPI Individu */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-(--ds-green-700)" />
                  <h4 className="text-label-13 font-semibold text-foreground">
                    2. Bobot Komponen KPI (Total 100%)
                  </h4>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isBobotValid
                      ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[11px]"
                      : "border-red-500/40 text-red-600 bg-red-500/10 text-[11px]"
                  }
                >
                  Total: {totalBobot}%
                </Badge>
              </div>

              <div className="space-y-2">
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
                    <span>2. Akurasi Radius GPS (&le; 50m)</span>
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
                    <span>3. Kualitas Bebas Revisi / Salah Stand</span>
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
                <Label className="text-xs">Batas Rasio Beban Kerja (Min - Max)</Label>
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
              Catatan: Perubahan parameter ini langsung memengaruhi perhitungan nominal
              pada Tab 2 untuk periode <strong>{selectedPeriod}</strong>.
            </div>
            <Button
              type="submit"
              disabled={!isBobotValid || savingRumus}
              className="h-8 gap-1.5 text-xs bg-(--ds-blue-700) hover:bg-(--ds-blue-800) text-white"
            >
              <Save className="size-3.5" />
              <span>{savingRumus ? "Menyimpan..." : "Simpan Rumusan Insentif"}</span>
            </Button>
          </div>
        </form>
      )}

      {/* 3. TAB B: ALOKASI BEBAN KERJA & FAKTOR KESULITAN MEDAN */}
      {activeSubTab === "beban" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Cari nama, ID, atau kode rute..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs pl-8"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Menampilkan {filteredAlokasi.length} dari {alokasiList.length} petugas
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="py-2.5 px-3">Petugas &amp; Kontak</th>
                    <th className="py-2.5 px-3">Rute Diampu</th>
                    <th className="py-2.5 px-3 text-right">Target Rute Standar</th>
                    <th className="py-2.5 px-3 text-center">
                      Target Khusus Penugasan
                    </th>
                    <th className="py-2.5 px-3 text-center">
                      Faktor Kesulitan Medan
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

                      {/* Rute */}
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {item.ruteList.length > 0 ? (
                            item.ruteList.map((r) => (
                              <Badge
                                key={r}
                                variant="outline"
                                className="text-[10px] px-1 py-0"
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

                      {/* Target Rute Standar */}
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

                      {/* Faktor Kesulitan Medan */}
                      <td className="py-2 px-3 text-center">
                        <Select
                          value={String(item.faktorKesulitanMedan)}
                          onValueChange={(val) =>
                            handleAlokasiChange(
                              item.petugasId,
                              "faktorKesulitanMedan",
                              Number(val)
                            )
                          }
                        >
                          <SelectTrigger className="h-7 w-32 text-xs mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="1">1.0x (Normal/Datar)</SelectItem>
                            <SelectItem value="1.05">1.05x (Padat Penduduk)</SelectItem>
                            <SelectItem value="1.1">1.10x (Perbukitan/Tanjakan)</SelectItem>
                            <SelectItem value="1.15">1.15x (Gang Sempit/Extrem)</SelectItem>
                            <SelectItem value="1.2">1.20x (Area Khusus/Terpencil)</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Status Tugas */}
                      <td className="py-2 px-3 text-center">
                        <Select
                          value={item.statusTugas}
                          onValueChange={(val) =>
                            handleAlokasiChange(item.petugasId, "statusTugas", val)
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-xs mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="AKTIF">AKTIF</SelectItem>
                            <SelectItem value="CUTI">CUTI</SelectItem>
                            <SelectItem value="SAKIT">SAKIT</SelectItem>
                            <SelectItem value="BANTUAN_KHUSUS">BANTUAN</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Catatan */}
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
        </div>
      )}
    </div>
  );
}
