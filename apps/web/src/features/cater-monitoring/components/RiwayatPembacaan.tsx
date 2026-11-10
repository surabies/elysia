"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowDown,
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
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  hitungP95Durasi,
  hitungRingkasanRute,
  hitungTinggiPilPerBaris,
  hitungTuntasRute,
} from "../lib/perhitungan-riwayat-rute";
import { contoh8RuteBaca } from "../lib/data-contoh-rute";

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
  onMonthChange,
  loading = false,
  error = null,
  onRefresh,
  onPilihSesi,
}: RiwayatPembacaanProps) {
  const [filterRute, setFilterRute] = React.useState<string>("Semua rute");
  const [rentangSesiFilter, setRentangSesiFilter] = React.useState<"all" | "14" | "7">("all");
  const [urutanMode, setUrutanMode] = React.useState<"default" | "beban" | "nama" | "tuntas">("default");
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [selectedSesiModal, setSelectedSesiModal] = React.useState<{
    sesi: SesiBacaRute;
    rute: ItemRuteBaca;
  } | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  // Jika ruteList tidak disediakan atau kosong, gunakan data contoh
  const activeList = React.useMemo(() => {
    if (ruteList && ruteList.length > 0) return ruteList;
    return contoh8RuteBaca;
  }, [ruteList]);

  // Kalkulasi 4 angka ringkasan
  const ringkasan = React.useMemo(() => {
    return hitungRingkasanRute(activeList);
  }, [activeList]);

  // Filter & Urutan baris:
  const sortedAndFilteredRoutes = React.useMemo(() => {
    let filtered = activeList.map((r) => {
      // Potong rentang sesi jika diatur di Settings
      let sesiList = r.sesiList;
      if (rentangSesiFilter === "14") {
        sesiList = sesiList.slice(-14);
      } else if (rentangSesiFilter === "7") {
        sesiList = sesiList.slice(-7);
      }
      return { ...r, sesiList };
    });

    if (filterRute === "Bermasalah") {
      filtered = filtered.filter((r) => {
        const last = r.sesiList[r.sesiList.length - 1];
        return last && last.status !== "Tuntas";
      });
    } else if (filterRute === "Nonaktif") {
      filtered = filtered.filter((r) => r.isNonaktif);
    }

    return filtered.sort((a, b) => {
      // Nonaktif selalu di paling bawah
      if (a.isNonaktif && !b.isNonaktif) return 1;
      if (!a.isNonaktif && b.isNonaktif) return -1;

      if (urutanMode === "beban") {
        return b.jumlahPelanggan - a.jumlahPelanggan;
      }
      if (urutanMode === "nama") {
        return a.nama.localeCompare(b.nama);
      }
      if (urutanMode === "tuntas") {
        return hitungTuntasRute(a.sesiList) - hitungTuntasRute(b.sesiList);
      }

      // Default: Bermasalah di sesi terakhir ditaruh di atas
      const aLast = a.sesiList[a.sesiList.length - 1];
      const bLast = b.sesiList[b.sesiList.length - 1];
      const aBermasalah = aLast && aLast.status !== "Tuntas";
      const bBermasalah = bLast && bLast.status !== "Tuntas";

      if (aBermasalah && !bBermasalah) return -1;
      if (!aBermasalah && bBermasalah) return 1;

      return 0;
    });
  }, [activeList, filterRute, rentangSesiFilter, urutanMode]);

  // Helper warna badge status sesi terakhir
  const getBadgeStyle = (status: StatusSesi) => {
    switch (status) {
      case "Tuntas":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "Terlambat":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "Gagal":
        return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
      case "Dilewati":
      default:
        return "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30";
    }
  };

  // Helper warna pil sesi
  const getPilFillClass = (status: StatusSesi) => {
    switch (status) {
      case "Tuntas":
        return "bg-teal-500 hover:bg-teal-400";
      case "Terlambat":
        return "bg-amber-500 hover:bg-amber-400";
      case "Gagal":
        return "bg-red-500 hover:bg-red-400";
      case "Dilewati":
      default:
        return "bg-purple-400 hover:bg-purple-300";
    }
  };

  // Informasi siklus hari kerja dinamis
  const jumlahSesi = sortedAndFilteredRoutes[0]?.sesiList.length ?? 0;
  const tglAwal = sortedAndFilteredRoutes[0]?.sesiList[0]?.tanggal;
  const tglAkhir = sortedAndFilteredRoutes[0]?.sesiList[jumlahSesi - 1]?.tanggal;
  const rentangSiklusTeks = tglAwal && tglAkhir ? ` · Siklus ${tglAwal} – ${tglAkhir}` : "";

  // Subjudul header dinamis
  const headerSubtitle =
    subjudul ||
    `${activeList.length} pencatat · ${ringkasan.totalSesi} sesi harian${rentangSiklusTeks}`;

  // Fungsi Ekspor CSV Riwayat Sesi
  const handleExportCsv = () => {
    let csv = "Petugas,Keterangan Rute,Tanggal,Status,Durasi Menit,Terbaca SL,Target SL\n";
    for (const r of activeList) {
      for (const s of r.sesiList) {
        csv += `"${r.nama}","${r.seksiWilayah}","${s.tanggal}","${s.status}",${s.durasiMenit},${s.meterTerbaca},${s.totalMeter}\n`;
      }
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `riwayat-pembacaan-${month || "2026-01"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fungsi Salin Ringkasan
  const handleCopyRingkasan = () => {
    const text = `Ringkasan Riwayat Pembacaan (${month || "Januari 2026"}):\n• Sesi Tuntas: ${ringkasan.sesiTuntasPersen}%\n• Total Sesi: ${ringkasan.totalSesi} (${ringkasan.totalBermasalah} bermasalah)\n• Petugas Bermasalah: ${ringkasan.ruteBermasalahCount} dari ${ringkasan.totalRuteCount}\n• Sesi Terlama (p95): ${ringkasan.sesiTerlamaP95Teks} (${ringkasan.sesiTerlamaRuteNama})`;
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

          {/* Kontrol Kanan: Pemilih Periode Bulan, Filter dropdown, Refresh, Settings, More */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {month !== undefined && onMonthChange && (
              <div className="flex items-center gap-1.5">
                <Input
                  id="cater-riwayat-period"
                  type="month"
                  value={month}
                  onChange={(e) => onMonthChange(e.target.value)}
                  className="h-8 text-copy-12 font-medium w-36"
                />
              </div>
            )}

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
                  Semua rute
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRute("Bermasalah")}>
                  Bermasalah ({ringkasan.ruteBermasalahCount})
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
                  {isCopied ? <Check className="size-4 text-teal-500" /> : <Copy className="size-4 text-muted-foreground" />}
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
        {/* B. STRIP 4 RINGKASAN                                      */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border bg-muted/20">
          {/* Sel 1: Sesi Tuntas */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Sesi Tuntas
            </span>
            <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
              {ringkasan.sesiTuntasPersen.toFixed(1)}%
            </span>
            <span className="inline-flex items-center gap-0.5 text-copy-12 font-medium text-red-500 dark:text-rose-400 mt-0.5">
              <ArrowDown className="size-3" />
              <span>{Math.abs(ringkasan.selisihVsSebelumnyaPts).toFixed(1)} pts vs sesi sebelumnya</span>
            </span>
          </div>

          {/* Sel 2: Total Sesi (dengan bar proporsi teal + titik merah/kuning) */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Total Sesi
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums">
                {ringkasan.totalSesi}
              </span>
              <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-muted max-w-[90px]">
                <div
                  className="h-full bg-teal-500 rounded-l-full"
                  style={{ width: `${ringkasan.sesiTuntasPersen}%` }}
                />
                <div className="h-full bg-amber-400 w-1.5 shrink-0" />
                <div className="h-full bg-red-500 w-1.5 shrink-0 rounded-r-full" />
              </div>
            </div>
            <span className="text-copy-12 font-medium text-muted-foreground block mt-0.5">
              {ringkasan.totalBermasalah} bermasalah
            </span>
          </div>

          {/* Sel 3: Petugas / Rute Bermasalah */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Petugas Bermasalah
            </span>
            <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
              {ringkasan.ruteBermasalahCount} dari {ringkasan.totalRuteCount}
            </span>
            <span className="text-copy-12 font-medium text-muted-foreground block mt-0.5">
              Rangkaian terpanjang {ringkasan.rangkaianTerpanjangBermasalah} sesi
            </span>
          </div>

          {/* Sel 4: Sesi Terlama (p95) */}
          <div className="p-4 min-w-0">
            <span className="text-label-12 font-normal text-muted-foreground block truncate">
              Sesi Terlama (p95)
            </span>
            <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
              {ringkasan.sesiTerlamaP95Teks}
            </span>
            <span className="text-copy-12 font-medium text-muted-foreground block truncate mt-0.5">
              {ringkasan.sesiTerlamaRuteNama}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* C. TABEL RUTE & STRIP SESI PIL                            */}
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
                  <th className="py-2.5 px-4 w-[28%]">Petugas & Rute Binaan</th>
                  <th className="py-2.5 px-4 w-[22%] hidden md:table-cell">Sesi Terakhir</th>
                  <th className="py-2.5 px-4 w-[36%]">
                    <div className="flex items-center justify-between">
                      <span>
                        {jumlahSesi > 0
                          ? `Siklus Harian (${jumlahSesi} Hari)`
                          : "Siklus Harian"}
                      </span>
                      <span className="text-[11px] text-muted-foreground/80 font-normal">
                        {tglAwal && tglAkhir
                          ? `${tglAwal} – ${tglAkhir}`
                          : "Terlama ke terbaru"}
                      </span>
                    </div>
                  </th>
                  <th className="py-2.5 px-4 w-[14%] text-right">Tuntas</th>
                </tr>
              </thead>

              {/* Baris Petugas / Rute */}
              <tbody className="divide-y divide-border text-copy-13">
                {sortedAndFilteredRoutes.map((rute) => {
                  const tuntasPersen = hitungTuntasRute(rute.sesiList);
                  const p95Durasi = hitungP95Durasi(rute.sesiList.map((s) => s.durasiMenit));
                  const p95Teks = formatDurasiJamMenit(p95Durasi);
                  const sesiTerakhir = rute.sesiList[rute.sesiList.length - 1];
                  const heights = hitungTinggiPilPerBaris(rute.sesiList, 6, 34);

                  return (
                    <tr
                      key={rute.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        rute.isNonaktif ? "opacity-45" : ""
                      }`}
                    >
                      {/* Kolom 1: Nama Petugas / Rute & Subjudul Monospace */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground tracking-tight">
                            {rute.nama}
                          </span>
                          {rute.isNonaktif && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 bg-muted">
                              Nonaktif
                            </Badge>
                          )}
                        </div>
                        <p className="font-mono text-label-12 text-muted-foreground truncate max-w-[240px] mt-0.5">
                          {rute.seksiWilayah} · {rute.jumlahPelanggan.toLocaleString("id-ID")} SL
                        </p>
                      </td>

                      {/* Kolom 2: Sesi Terakhir (Badge + Waktu Durasinya) */}
                      <td className="py-3 px-4 align-middle hidden md:table-cell">
                        {sesiTerakhir && (
                          <div>
                            <Badge
                              variant="outline"
                              className={`gap-1 px-2 py-0 text-label-12 font-medium ${getBadgeStyle(
                                sesiTerakhir.status
                              )}`}
                            >
                              {sesiTerakhir.status === "Tuntas" && (
                                <CheckCircle2 className="size-3" />
                              )}
                              {sesiTerakhir.status === "Gagal" && <XCircle className="size-3" />}
                              {sesiTerakhir.status === "Terlambat" && (
                                <Clock className="size-3" />
                              )}
                              <span>{sesiTerakhir.status}</span>
                            </Badge>
                            <p className="text-label-12 text-muted-foreground mt-0.5">
                              {sesiTerakhir.waktuSelesaiTeks} •{" "}
                              {formatDurasiJamMenit(sesiTerakhir.durasiMenit)}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Kolom 3: Strip Pil Sejajar Tegak */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-end gap-[3px] h-[36px] w-full justify-between select-none">
                          {rute.sesiList.map((sesi, idx) => {
                            const pilHeight = heights[idx] ?? 6;
                            const fillClass = getPilFillClass(sesi.status);

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
                                    aria-label={`Sesi ${sesi.tanggal}: ${sesi.status}, durasi ${formatDurasiJamMenit(
                                      sesi.durasiMenit
                                    )}`}
                                  >
                                    <div
                                      className={`w-full max-w-[10px] rounded-full transition-all duration-200 group-hover/pil:scale-x-125 ${fillClass}`}
                                      style={{ height: `${pilHeight}px` }}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="bg-popover text-popover-foreground border border-border shadow-lg p-3 rounded-lg min-w-[190px] select-none z-50 font-sans"
                                >
                                  <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-1.5 mb-2">
                                    <span className="font-semibold text-foreground font-mono text-copy-13">
                                      {sesi.tanggal}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 font-medium ${getBadgeStyle(
                                        sesi.status
                                      )}`}
                                    >
                                      {sesi.status}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1.5 text-copy-12">
                                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                      <span>Durasi:</span>
                                      <span className="font-medium text-foreground">
                                        {formatDurasiJamMenit(sesi.durasiMenit)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                      <span>Terbaca:</span>
                                      <span className="font-mono text-foreground font-medium">
                                        {sesi.meterTerbaca} / {sesi.totalMeter} SL
                                      </span>
                                    </div>
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

                      {/* Kolom 4: Persen Tuntas & p95 Durasi */}
                      <td className="py-3 px-4 align-middle text-right">
                        <span className="font-bold text-foreground text-copy-14 tabular-nums block">
                          {tuntasPersen.toFixed(0)}%
                        </span>
                        <span className="text-label-12 text-muted-foreground font-mono tabular-nums block">
                          p95 {p95Teks}
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
        {/* E. LEGENDA KARTU                                          */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-border bg-muted/10 text-copy-12 text-muted-foreground">
          {/* Kiri: Titik Berwarna Status Sesi */}
          <div className="flex items-center gap-4 flex-wrap font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-teal-500 inline-block" />
              <span>Tuntas</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500 inline-block" />
              <span>Gagal</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500 inline-block" />
              <span>Terlambat</span>
            </span>

            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-purple-400 inline-block" />
              <span>Dilewati</span>
            </span>
          </div>

          {/* Kanan: Penjelasan Skala Pil */}
          <span className="text-muted-foreground font-normal">
            Tinggi pil merepresentasikan durasi jam kerja sesi
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DIALOG MODAL PENGATURAN (SETTINGS)                        */}
      {/* ========================================================= */}
      {isSettingsOpen && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-heading-18 font-bold flex items-center gap-2">
                <Settings className="size-4" />
                <span>Pengaturan Tampilan Riwayat</span>
              </DialogTitle>
              <DialogDescription>
                Sesuaikan rentang tanggal siklus sesi dan urutan petugas di dasbor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-copy-13">
              {/* Opsi 1: Rentang Sesi */}
              <div>
                <label className="text-copy-13 font-semibold text-foreground block mb-1.5">
                  Rentang Sesi Harian:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={rentangSesiFilter === "all" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12"
                    onClick={() => setRentangSesiFilter("all")}
                  >
                    Seluruh Siklus
                  </Button>
                  <Button
                    type="button"
                    variant={rentangSesiFilter === "14" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12"
                    onClick={() => setRentangSesiFilter("14")}
                  >
                    14 Hari Terakhir
                  </Button>
                  <Button
                    type="button"
                    variant={rentangSesiFilter === "7" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12"
                    onClick={() => setRentangSesiFilter("7")}
                  >
                    7 Hari Terakhir
                  </Button>
                </div>
              </div>

              {/* Opsi 2: Urutan Tampilan */}
              <div>
                <label className="text-copy-13 font-semibold text-foreground block mb-1.5">
                  Urutan Baris Petugas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={urutanMode === "default" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12 justify-start"
                    onClick={() => setUrutanMode("default")}
                  >
                    Bermasalah di Atas
                  </Button>
                  <Button
                    type="button"
                    variant={urutanMode === "beban" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12 justify-start"
                    onClick={() => setUrutanMode("beban")}
                  >
                    Beban SL Terbanyak
                  </Button>
                  <Button
                    type="button"
                    variant={urutanMode === "tuntas" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12 justify-start"
                    onClick={() => setUrutanMode("tuntas")}
                  >
                    Ketuntasan Terendah
                  </Button>
                  <Button
                    type="button"
                    variant={urutanMode === "nama" ? "default" : "outline"}
                    size="sm"
                    className="text-copy-12 justify-start"
                    onClick={() => setUrutanMode("nama")}
                  >
                    Nama Petugas (A-Z)
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

      {/* ========================================================= */}
      {/* DIALOG MODAL DETAIL SESI HARIAN PETUGAS (KLIK PIL)        */}
      {/* ========================================================= */}
      {selectedSesiModal && (
        <Dialog open={Boolean(selectedSesiModal)} onOpenChange={(open) => !open && setSelectedSesiModal(null)}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-heading-18 font-bold flex items-center justify-between">
                <span>Detail Sesi Harian</span>
                <Badge variant="outline" className={`text-label-12 ${getBadgeStyle(selectedSesiModal.sesi.status)}`}>
                  {selectedSesiModal.sesi.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Pemeriksaan pembacaan meter sesi {selectedSesiModal.sesi.tanggal}
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
                  <span className="text-label-12 text-muted-foreground block">Durasi Kerja Lapangan</span>
                  <span className="font-bold text-foreground text-copy-16 block mt-0.5">
                    {formatDurasiJamMenit(selectedSesiModal.sesi.durasiMenit)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    ({selectedSesiModal.sesi.durasiMenit} menit)
                  </span>
                </div>

                <div className="rounded-md border border-border p-3">
                  <span className="text-label-12 text-muted-foreground block">Realisasi Sambungan</span>
                  <span className="font-bold text-foreground font-mono text-copy-16 block mt-0.5">
                    {selectedSesiModal.sesi.meterTerbaca} / {selectedSesiModal.sesi.totalMeter}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    SL terbaca vs target
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-muted/20 border border-border/60 p-3 text-label-12 text-muted-foreground">
                <p className="font-medium text-foreground">Status Catatan:</p>
                <p className="mt-0.5">
                  {selectedSesiModal.sesi.waktuSelesaiTeks} · Terdaftar pada siklus database operasional
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setSelectedSesiModal(null)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
