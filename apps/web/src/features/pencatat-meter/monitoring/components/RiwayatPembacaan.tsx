"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Filter,
  MoreVertical,
  RotateCw,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  ItemRuteBaca,
  SesiBacaRute,
  StatusSesi,
} from "../types/RiwayatPembacaanTypes";
import {
  formatDurasiJamMenit,
  hitungRingkasanRute,
  hitungTinggiPilPerBaris,
  hitungTuntasRute,
} from "../lib/perhitungan-riwayat-rute";

interface RiwayatPembacaanProps {
  judul?: string;
  subjudul?: string;
  ruteList?: ItemRuteBaca[];
  month?: string;
  onMonthChange?: (month: string) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onPilihSesi?: (sesi: SesiBacaRute, rute: ItemRuteBaca) => void;
}

export function RiwayatPembacaan({
  judul = "Riwayat Pembacaan Petugas",
  subjudul,
  ruteList,
  month,
  loading = false,
  error = null,
  onRefresh,
  onPilihSesi,
}: RiwayatPembacaanProps) {
  const [filterRute, setFilterRute] = React.useState<string>("Semua rute");
  const [rentangSesiFilter, setRentangSesiFilter] = React.useState<"all" | "14" | "7">("all");
  const [urutanMode, setUrutanMode] = React.useState<"default" | "beban" | "nama" | "capaian">("default");
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [selectedSesiModal, setSelectedSesiModal] = React.useState<{
    sesi: SesiBacaRute;
    rute: ItemRuteBaca;
  } | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // Hanya gunakan data rute riil dari backend
  const activeList = React.useMemo(() => {
    return ruteList ?? [];
  }, [ruteList]);

  // Kalkulasi 4 angka ringkasan riil operasional PDAM
  const ringkasan = React.useMemo(() => {
    return hitungRingkasanRute(activeList);
  }, [activeList]);

  // Filter & Urutan baris tabel
  const sortedAndFilteredRoutes = React.useMemo(() => {
    let filtered = activeList.map((r) => {
      let sesiList = r.sesiList;
      if (rentangSesiFilter === "14") {
        sesiList = sesiList.slice(-14);
      } else if (rentangSesiFilter === "7") {
        sesiList = sesiList.slice(-7);
      }
      return { ...r, sesiList };
    });

    if (filterRute === "Anomali") {
      filtered = filtered.filter((r) => {
        return r.sesiList.some((s) => s.status === "Anomali Tinggi" || (s.anomaliCount && s.anomaliCount > 0));
      });
    } else if (filterRute === "Nonaktif") {
      filtered = filtered.filter((r) => r.isNonaktif);
    }

    return filtered.sort((a, b) => {
      if (a.isNonaktif && !b.isNonaktif) return 1;
      if (!a.isNonaktif && b.isNonaktif) return -1;

      const totalA = a.totalTerbaca ?? a.sesiList.reduce((acc, s) => acc + (s.meterTerbaca || 0), 0);
      const totalB = b.totalTerbaca ?? b.sesiList.reduce((acc, s) => acc + (s.meterTerbaca || 0), 0);
      const capaianA = a.jumlahPelanggan > 0 ? (totalA / a.jumlahPelanggan) * 100 : 100;
      const capaianB = b.jumlahPelanggan > 0 ? (totalB / b.jumlahPelanggan) * 100 : 100;

      if (urutanMode === "beban") {
        return b.jumlahPelanggan - a.jumlahPelanggan;
      }
      if (urutanMode === "nama") {
        return a.nama.localeCompare(b.nama);
      }
      if (urutanMode === "capaian") {
        return capaianA - capaianB;
      }

      // Default: Petugas dengan capaian tertinggi atau urutan nama
      return capaianB - capaianA;
    });
  }, [activeList, filterRute, rentangSesiFilter, urutanMode]);

  // Helper varian Badge Vercel Geist resmi
  const getStatusBadgeVariant = (status: StatusSesi) => {
    switch (status) {
      case "Tercatat":
      case "Tuntas":
        return "blue-subtle" as const;
      case "Anomali Tinggi":
      case "Terlambat":
        return "amber-subtle" as const;
      case "Gagal":
        return "red-subtle" as const;
      case "Libur":
      case "Dilewati":
      default:
        return "gray-subtle" as const;
    }
  };

  // Helper label status operasional PDAM
  const getStatusLabel = (status: StatusSesi) => {
    switch (status) {
      case "Tercatat":
      case "Tuntas":
        return "Tercatat";
      case "Anomali Tinggi":
      case "Terlambat":
        return "Anomali Tinggi";
      case "Gagal":
        return "Gagal Catat";
      case "Libur":
      case "Dilewati":
      default:
        return "Libur";
    }
  };

  // Helper warna indikator capaian persentase operasional PDAM (Vercel Geist System)
  const getCapaianColorClass = (persen: number) => {
    if (persen >= 85) {
      return "text-emerald-600 dark:text-emerald-400"; // Hijau Rajin / Capaian Unggul
    }
    if (persen >= 60) {
      return "text-[#0070f3] dark:text-[#3291ff]"; // Biru Vercel Berprogres Baik
    }
    if (persen >= 40) {
      return "text-amber-600 dark:text-amber-400"; // Amber Perlu Dorongan
    }
    return "text-rose-600 dark:text-rose-400"; // Merah Tertinggal / Kurang Rajin
  };

  const getCapaianDotBg = (persen: number) => {
    if (persen >= 85) return "bg-emerald-500";
    if (persen >= 60) return "bg-[#0070f3]";
    if (persen >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Helper warna pil sesi berbasis paten visual Vercel Geist
  const getPilFillClass = (status: StatusSesi, meterTerbaca: number) => {
    if (meterTerbaca <= 0 || status === "Libur" || status === "Dilewati") {
      return "bg-muted-foreground/20 hover:bg-muted-foreground/30";
    }
    if (status === "Anomali Tinggi" || status === "Terlambat") {
      return "bg-[#f5a623] hover:bg-[#d98218]"; // Vercel Amber
    }
    if (status === "Gagal") {
      return "bg-red-500 hover:bg-red-400";
    }
    return "bg-[#0070f3] hover:bg-[#0060df]"; // Vercel Blue Signature
  };

  // Informasi siklus hari kerja kalender
  const sampleOfficer = sortedAndFilteredRoutes[0];
  const jumlahSesi = sampleOfficer?.sesiList.length ?? 20;
  const tglAwal = sampleOfficer?.sesiList[0]?.tanggal;
  const tglAkhir = sampleOfficer?.sesiList[jumlahSesi - 1]?.tanggal;
  const rentangSiklusTeks = tglAwal && tglAkhir ? ` · Siklus ${tglAwal} – ${tglAkhir}` : "";

  // Subjudul header dinamis
  const headerSubtitle =
    subjudul ||
    `${activeList.length} pencatat · ${ringkasan.totalMeterTerbaca.toLocaleString("id-ID")} SL terbaca${rentangSiklusTeks}`;

  // Fungsi Ekspor CSV Riwayat Sesi
  const handleExportCsv = () => {
    let csv = "Petugas,Keterangan Rute,Tanggal,Status,SL Terbaca,Volume Air (m3),Anomali,Durasi Menit\n";
    for (const r of activeList) {
      for (const s of r.sesiList) {
        csv += `"${r.nama}","${r.seksiWilayah}","${s.tanggal}","${getStatusLabel(s.status)}",${s.meterTerbaca},${s.kubikasiM3 || 0},${s.anomaliCount || 0},${s.durasiMenit}\n`;
      }
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `riwayat-pembacaan-petugas-${month || "202611"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fungsi Salin Ringkasan
  const handleCopyRingkasan = () => {
    const text = `Ringkasan Riwayat Pembacaan (${month || "November 2026"}):\n• Total SL Tercatat: ${ringkasan.totalMeterTerbaca.toLocaleString("id-ID")} SL (${ringkasan.capaianKotaPersen}%)\n• Laju Harian: ${ringkasan.rataRataLajuHarian.toLocaleString("id-ID")} SL/hari\n• Hari Kerja Siklus: ${ringkasan.hariKerjaAktif} hari aktif dari ${ringkasan.totalHariSiklus} hari\n• Hari Puncak: ${ringkasan.puncakPembacaanSL.toLocaleString("id-ID")} SL (${ringkasan.puncakTanggalTeks})`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full rounded-lg border border-border bg-card text-card-foreground overflow-hidden select-none">
        {/* ========================================================= */}
        {/* A. HEADER KARTU                                           */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-card">
          <div>
            <h2 className="text-heading-16 font-semibold text-[var(--ds-gray-1000)] tracking-tight">
              {judul}
            </h2>
            <p className="text-copy-13 text-muted-foreground mt-0.5">
              {headerSubtitle}
            </p>
          </div>

          {/* Kontrol Kanan: Filter dropdown, Refresh, Settings, More */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-copy-12 font-medium">
                  <Filter className="size-3.5 text-muted-foreground" />
                  <span>{filterRute}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-copy-13 font-sans">
                <DropdownMenuItem onClick={() => setFilterRute("Semua rute")}>
                  Semua rute ({activeList.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRute("Anomali")}>
                  Ada Anomali
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRute("Nonaktif")}>
                  Nonaktif
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Muat ulang data database"
                onClick={onRefresh}
              >
                <RotateCw className="size-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title="Pengaturan rentang sesi dan urutan"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  title="Menu aksi lainnya"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-copy-13 font-sans w-52">
                <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer">
                  <Download className="size-4 text-muted-foreground" />
                  <span>Ekspor Riwayat (.CSV)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyRingkasan} className="gap-2 cursor-pointer">
                  {isCopied ? <Check className="size-4 text-[var(--ds-green-700)]" /> : <Copy className="size-4 text-muted-foreground" />}
                  <span>{isCopied ? "Tersalin ke Clipboard" : "Salin Ringkasan Teks"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onRefresh} className="gap-2 cursor-pointer">
                  <RotateCw className="size-4 text-muted-foreground" />
                  <span>Sinkronkan Ulang Database</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ========================================================= */}
        {/* B. STRIP 4 RINGKASAN (Metrik Riil Operasional PDAM)       */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border bg-muted/20">
          {/* Sel 1: Total SL Tercatat */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Total SL Tercatat
            </span>
            <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
              {ringkasan.totalMeterTerbaca.toLocaleString("id-ID")} SL
            </span>
            <span className="text-copy-12 font-medium text-muted-foreground block mt-0.5 truncate">
              {ringkasan.capaianKotaPersen}% dari {ringkasan.targetKotaTotal.toLocaleString("id-ID")} target kota
            </span>
          </div>

          {/* Sel 2: Rata-rata Laju Harian */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Rata-rata Laju Harian
            </span>
            <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
              {ringkasan.rataRataLajuHarian.toLocaleString("id-ID")} SL/hari
            </span>
            <span className="text-copy-12 font-medium text-muted-foreground block mt-0.5 truncate">
              Produktivitas per hari kerja aktif
            </span>
          </div>

          {/* Sel 3: Hari Kerja Siklus (dengan bar proporsi Geist) */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Hari Kerja Siklus
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums">
                {ringkasan.hariKerjaAktif} Hari
              </span>
              <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-muted max-w-[90px]">
                <div
                  className="h-full bg-[#0070f3] rounded-l-full"
                  style={{
                    width: `${ringkasan.totalHariSiklus > 0 ? (ringkasan.hariKerjaAktif / ringkasan.totalHariSiklus) * 100 : 0}%`,
                  }}
                />
                <div className="h-full bg-muted-foreground/30 flex-1 rounded-r-full" />
              </div>
            </div>
            <span className="text-copy-12 font-medium text-muted-foreground block mt-0.5 truncate">
              {ringkasan.totalHariSiklus - ringkasan.hariKerjaAktif} hari libur / istirahat rute
            </span>
          </div>

          {/* Sel 4: Hari Puncak Lapangan */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Hari Puncak Lapangan
            </span>
            <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
              {ringkasan.puncakPembacaanSL.toLocaleString("id-ID")} SL
            </span>
            <span className="text-copy-12 font-medium text-muted-foreground block truncate mt-0.5">
              Tercatat tertinggi pada {ringkasan.puncakTanggalTeks}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* C. TABEL PETUGAS & STRIP SESI PIL (Distribusi Harian Riil)*/}
        {/* ========================================================= */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-copy-13 animate-pulse">
            Memuat riwayat pembacaan sesi harian…
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-500 text-copy-13 flex flex-col items-center gap-2">
            <AlertCircle className="size-5" />
            <span>Gagal memuat data: {error}</span>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Coba Lagi
              </Button>
            )}
          </div>
        ) : sortedAndFilteredRoutes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-copy-13">
            Belum ada riwayat pembacaan pada filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              {/* Header Kolom Kecil Abu-Abu */}
              <thead>
                <tr className="border-b border-border bg-muted/10 text-label-12 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4 w-[28%]">Petugas &amp; Rute Binaan</th>
                  <th className="py-2.5 px-4 w-[20%] hidden md:table-cell">Status Terkini</th>
                  <th className="py-2.5 px-4 w-[38%]">
                    <div className="flex items-center justify-between">
                      <span>
                        {jumlahSesi > 0
                          ? `Siklus Harian (${jumlahSesi} Hari)`
                          : "Siklus Harian"}
                      </span>
                      <span className="text-[11px] text-muted-foreground/80 font-normal">
                        {tglAwal && tglAkhir
                          ? `${tglAwal} – ${tglAkhir}`
                          : "Tgl 1 s.d. 20"}
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-4 w-[14%] text-right">Capaian SL</th>
                </tr>
              </thead>

              {/* Baris Petugas / Rute */}
              <tbody className="divide-y divide-border text-copy-13">
                {sortedAndFilteredRoutes.map((rute) => {
                  const heights = hitungTinggiPilPerBaris(rute.sesiList, 6, 34);
                  const totalTerbaca = rute.totalTerbaca ?? rute.sesiList.reduce(
                    (acc, s) => acc + (s.meterTerbaca || 0),
                    0
                  );
                  const targetBeban = rute.jumlahPelanggan > 0 ? rute.jumlahPelanggan : totalTerbaca;
                  const capaianPersen = targetBeban > 0
                    ? Number(((totalTerbaca / targetBeban) * 100).toFixed(1))
                    : 100;

                  // Ambil sesi aktif terakhir
                  const sesiAktifList = rute.sesiList.filter((s) => s.meterTerbaca > 0);
                  const sesiTerakhir = sesiAktifList[sesiAktifList.length - 1] || rute.sesiList[rute.sesiList.length - 1];

                  return (
                    <tr
                      key={rute.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        rute.isNonaktif ? "opacity-45" : ""
                      }`}
                    >
                      {/* Kolom 1: Nama Petugas & Keterangan Rute */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground tracking-tight">
                            {rute.nama}
                          </span>
                          {rute.isNonaktif && (
                            <Badge variant="pill" size="sm">
                              Nonaktif
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-label-12 text-muted-foreground truncate max-w-[260px] mt-0.5">
                          {rute.seksiWilayah} · Target {targetBeban.toLocaleString("id-ID")} SL
                        </p>
                      </td>

                      {/* Kolom 2: Status Terkini (Badge Geist Resmi) */}
                      <td className="py-3 px-4 align-middle hidden md:table-cell">
                        {sesiTerakhir ? (
                          <div>
                            <Badge
                              variant={getStatusBadgeVariant(sesiTerakhir.status)}
                              size="sm"
                              className="gap-1 font-medium"
                            >
                              {sesiTerakhir.status === "Anomali Tinggi" ? (
                                <AlertCircle className="size-3" />
                              ) : sesiTerakhir.meterTerbaca > 0 ? (
                                <CheckCircle2 className="size-3" />
                              ) : (
                                <Clock className="size-3" />
                              )}
                              <span>{getStatusLabel(sesiTerakhir.status)}</span>
                            </Badge>
                            <p className="text-label-12 text-muted-foreground mt-0.5">
                              {sesiTerakhir.tanggal} • {sesiTerakhir.meterTerbaca.toLocaleString("id-ID")} SL
                            </p>
                          </div>
                        ) : (
                          <span className="text-label-12 text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Kolom 3: Strip Pil Sejajar Tegak (Tinggi = Volume SL Harian) */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-end gap-[3px] h-[36px] w-full justify-between select-none">
                          {rute.sesiList.map((sesi, idx) => {
                            const pilHeight = heights[idx] ?? 6;
                            const fillClass = getPilFillClass(sesi.status, sesi.meterTerbaca);

                            return (
                              <Tooltip key={sesi.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSesiModal({ sesi, rute });
                                      onPilihSesi?.(sesi, rute);
                                    }}
                                    className="group/pil flex-1 h-[36px] flex flex-col justify-end items-center cursor-pointer focus:outline-none"
                                    aria-label={`Sesi ${sesi.tanggal}: ${getStatusLabel(sesi.status)}, tercatat ${sesi.meterTerbaca} SL`}
                                  >
                                    <div
                                      className={`w-full max-w-[10px] rounded-full transition-all duration-200 group-hover/pil:scale-x-125 ${fillClass}`}
                                      style={{ height: `${pilHeight}px` }}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="bg-popover text-popover-foreground border border-border shadow-lg p-3 rounded-lg min-w-[200px] select-none z-50 font-sans"
                                >
                                  <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-1.5 mb-2">
                                    <span className="font-semibold text-foreground font-mono text-copy-13">
                                      {sesi.tanggal}
                                    </span>
                                    <Badge
                                      variant={getStatusBadgeVariant(sesi.status)}
                                      size="sm"
                                      className="font-medium"
                                    >
                                      {getStatusLabel(sesi.status)}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1.5 text-copy-12">
                                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                      <span>SL Terbaca:</span>
                                      <span className="font-mono text-foreground font-semibold">
                                        {sesi.meterTerbaca > 0
                                          ? `${sesi.meterTerbaca.toLocaleString("id-ID")} SL`
                                          : "0 SL (Libur)"}
                                      </span>
                                    </div>
                                    {sesi.kubikasiM3 !== undefined && sesi.kubikasiM3 > 0 && (
                                      <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                        <span>Volume Air:</span>
                                        <span className="font-mono text-foreground font-medium">
                                          {sesi.kubikasiM3.toLocaleString("id-ID")} m³
                                        </span>
                                      </div>
                                    )}
                                    {sesi.anomaliCount !== undefined && sesi.anomaliCount > 0 && (
                                      <div className="flex items-center justify-between gap-4 text-amber-600 dark:text-amber-400">
                                        <span>Temuan Anomali:</span>
                                        <span className="font-mono font-semibold">
                                          {sesi.anomaliCount} kasus
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                      <span>Petugas:</span>
                                      <span className="text-foreground font-medium truncate max-w-[120px]">
                                        {sesi.petugasNama}
                                      </span>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </td>

                      {/* Kolom 4: Capaian SL & Realisasi Akumulatif */}
                      <td className="py-3 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`size-1.5 rounded-full inline-block shrink-0 ${getCapaianDotBg(
                              capaianPersen
                            )}`}
                          />
                          <span
                            className={`font-bold text-copy-14 tabular-nums block ${getCapaianColorClass(
                              capaianPersen
                            )}`}
                          >
                            {capaianPersen.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-label-12 text-muted-foreground font-mono tabular-nums block mt-0.5">
                          {totalTerbaca.toLocaleString("id-ID")} / {targetBeban.toLocaleString("id-ID")} SL
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* D. LEGENDA KARTU                                          */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-border bg-muted/10 text-copy-12 text-muted-foreground">
          {/* Kiri: Titik Berwarna Status Sesi (Paten Vercel) */}
          <div className="flex items-center gap-4 flex-wrap font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#0070f3] inline-block" />
              <span>Tercatat Aktif</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#f5a623] inline-block" />
              <span>Anomali Lapangan (&gt;30%)</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/30 inline-block" />
              <span>Libur / Tidak Bertugas</span>
            </span>
          </div>

          {/* Kanan: Penjelasan Skala Pil */}
          <span className="text-muted-foreground font-normal">
            Tinggi pil menunjukkan volume sambungan langganan (SL) yang dibaca per hari
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DIALOG DETAIL SESI HARIAN                           */}
      {/* ========================================================= */}
      {selectedSesiModal && (
        <Dialog open={Boolean(selectedSesiModal)} onOpenChange={(open) => !open && setSelectedSesiModal(null)}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-heading-18 font-bold flex items-center justify-between">
                <span>Detail Sesi Harian</span>
                <Badge variant={getStatusBadgeVariant(selectedSesiModal.sesi.status)} size="md">
                  {getStatusLabel(selectedSesiModal.sesi.status)}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Pemeriksaan data pembacaan meter sesi {selectedSesiModal.sesi.tanggal}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-copy-13">
              <div className="rounded-md bg-muted/40 p-3 border border-border/70">
                <p className="font-semibold text-foreground text-copy-14">
                  {selectedSesiModal.rute.nama}
                </p>
                <p className="text-muted-foreground text-label-12 mt-0.5">
                  {selectedSesiModal.rute.seksiWilayah}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-md border border-border p-3">
                  <span className="text-label-12 text-muted-foreground block">Volume SL Terbaca</span>
                  <span className="font-bold text-foreground text-copy-16 block mt-0.5 font-mono">
                    {selectedSesiModal.sesi.meterTerbaca.toLocaleString("id-ID")} SL
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedSesiModal.sesi.meterTerbaca > 0 ? "Hari kerja dinas" : "Hari libur operasional"}
                  </span>
                </div>

                <div className="rounded-md border border-border p-3">
                  <span className="text-label-12 text-muted-foreground block">Kubikasi Air</span>
                  <span className="font-bold text-foreground text-copy-16 block mt-0.5 font-mono">
                    {(selectedSesiModal.sesi.kubikasiM3 || 0).toLocaleString("id-ID")} m³
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Total pemakaian pelanggan
                  </span>
                </div>
              </div>

              <div className="rounded-md border border-border p-3 space-y-2">
                <div className="flex justify-between items-center text-label-12">
                  <span className="text-muted-foreground">Petugas Pelaksana:</span>
                  <span className="font-semibold text-foreground">
                    {selectedSesiModal.sesi.petugasNama}
                  </span>
                </div>
                <div className="flex justify-between items-center text-label-12">
                  <span className="text-muted-foreground">Status Operasional:</span>
                  <Badge variant={getStatusBadgeVariant(selectedSesiModal.sesi.status)} size="sm">
                    {getStatusLabel(selectedSesiModal.sesi.status)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-label-12">
                  <span className="text-muted-foreground">Temuan Anomali:</span>
                  <span className="font-mono text-foreground font-medium">
                    {selectedSesiModal.sesi.anomaliCount ?? 0} kasus
                  </span>
                </div>
                {selectedSesiModal.sesi.durasiMenit > 0 && (
                  <div className="flex justify-between items-center text-label-12">
                    <span className="text-muted-foreground">Durasi Pembacaan:</span>
                    <span className="font-mono text-foreground font-medium">
                      {formatDurasiJamMenit(selectedSesiModal.sesi.durasiMenit)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedSesiModal(null)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================= */}
      {/* MODAL PENGATURAN                                          */}
      {/* ========================================================= */}
      {isSettingsOpen && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-heading-18 font-bold">
                Pengaturan Tampilan Riwayat
              </DialogTitle>
              <DialogDescription>
                Sesuaikan rentang sesi dan kriteria pengurutan tabel pembacaan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-copy-13">
              <div>
                <label className="text-label-12 font-medium text-foreground block mb-1.5">
                  Rentang Sesi Kalender:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={rentangSesiFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRentangSesiFilter("all")}
                    className="text-copy-12"
                  >
                    Semua ({jumlahSesi} Hari)
                  </Button>
                  <Button
                    type="button"
                    variant={rentangSesiFilter === "14" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRentangSesiFilter("14")}
                    className="text-copy-12"
                  >
                    14 Hari Terakhir
                  </Button>
                  <Button
                    type="button"
                    variant={rentangSesiFilter === "7" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRentangSesiFilter("7")}
                    className="text-copy-12"
                  >
                    7 Hari Terakhir
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-label-12 font-medium text-foreground block mb-1.5">
                  Urutan Baris:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={urutanMode === "default" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrutanMode("default")}
                    className="text-copy-12 justify-start"
                  >
                    Capaian Tertinggi
                  </Button>
                  <Button
                    type="button"
                    variant={urutanMode === "beban" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrutanMode("beban")}
                    className="text-copy-12 justify-start"
                  >
                    Target SL Terbanyak
                  </Button>
                  <Button
                    type="button"
                    variant={urutanMode === "nama" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrutanMode("nama")}
                    className="text-copy-12 justify-start"
                  >
                    Nama Petugas (A-Z)
                  </Button>
                  <Button
                    type="button"
                    variant={urutanMode === "capaian" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUrutanMode("capaian")}
                    className="text-copy-12 justify-start"
                  >
                    Capaian Terendah
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setIsSettingsOpen(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
