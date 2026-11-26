"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { IconStack } from "@/components/reui/icon-stack";
import { cn } from "@/lib/utils";
import type {
  AturanBreakdownItem,
  AuditPelangganItem,
} from "@/server/services/cater/cater-progress.service";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface AuditSplitExplorerProps {
  breakdown: AturanBreakdownItem[];
  pelanggan: AuditPelangganItem[];
  totalPelangganCount: number;
  selectedKode: string | null;
  onSelectKode: (kode: string | null) => void;
  selectedKategori: "all" | "anomali" | "warning";
  onSelectKategori: (kat: "all" | "anomali" | "warning") => void;
  search: string;
  onSearchChange: (search: string) => void;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
  loading?: boolean;
}

export function AuditSplitExplorer({
  breakdown,
  pelanggan,
  totalPelangganCount,
  selectedKode,
  onSelectKode,
  selectedKategori,
  onSelectKategori,
  search,
  onSearchChange,
  limit,
  offset,
  onPageChange,
  loading = false,
}: AuditSplitExplorerProps) {
  // Filter aturan berdasarkan kategori aktif di panel kiri (Semua | Pilar 1 | Pilar 2)
  const filteredAturan = React.useMemo(() => {
    if (selectedKategori === "anomali") {
      return breakdown.filter((item) => item.dihitungSebagaiAnomali);
    }
    if (selectedKategori === "warning") {
      return breakdown.filter((item) => !item.dihitungSebagaiAnomali);
    }
    return breakdown;
  }, [breakdown, selectedKategori]);

  const countPilar1 = React.useMemo(() => {
    return breakdown.filter((i) => i.dihitungSebagaiAnomali).length;
  }, [breakdown]);

  const countPilar2 = React.useMemo(() => {
    return breakdown.filter((i) => !i.dihitungSebagaiAnomali).length;
  }, [breakdown]);

  const totalsByKategori = React.useMemo(() => {
    let anomali = 0;
    let warning = 0;
    for (const b of breakdown) {
      if (b.dihitungSebagaiAnomali) anomali += b.jumlah;
      else warning += b.jumlah;
    }
    return { anomali, warning, total: totalPelangganCount };
  }, [breakdown, totalPelangganCount]);

  // Cari objek aturan yang sedang aktif/terpilih
  const activeAturanObj = React.useMemo(() => {
    if (!selectedKode) return null;
    return breakdown.find((b) => b.kode === selectedKode) || null;
  }, [breakdown, selectedKode]);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(Math.ceil(totalPelangganCount / limit), 1);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-270px)] min-h-[580px]">
      {/* =========================================================================
          PANEL KIRI: Master Klasifikasi Aturan SSOT (Lebar ~380px, Scroll Mandiri)
          ========================================================================= */}
      <Card className="w-full lg:w-[360px] xl:w-[400px] shrink-0 border-border bg-card flex flex-col overflow-hidden shadow-sm">
        {/* Header Panel Kiri */}
        <div className="p-3.5 border-b border-border bg-muted/20 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-foreground/80" />
              <h2 className="text-label-13 font-semibold text-foreground">
                Klasifikasi Aturan SSOT
              </h2>
            </div>
            <span className="font-mono text-label-11 text-muted-foreground tabular-nums">
              {filteredAturan.length} Aturan
            </span>
          </div>

          {/* Filter Tab Kategori (Pilar 1 vs Pilar 2) */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-muted/40 border border-border text-[11px]">
            <button
              type="button"
              onClick={() => onSelectKategori("all")}
              className={cn(
                "py-1 px-1.5 rounded font-medium text-center transition-colors cursor-pointer truncate",
                selectedKategori === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Semua ({breakdown.length})
            </button>
            <button
              type="button"
              onClick={() => onSelectKategori("anomali")}
              className={cn(
                "py-1 px-1.5 rounded font-medium text-center transition-colors cursor-pointer truncate",
                selectedKategori === "anomali"
                  ? "bg-background text-amber-700 dark:text-amber-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pilar 1 ({countPilar1})
            </button>
            <button
              type="button"
              onClick={() => onSelectKategori("warning")}
              className={cn(
                "py-1 px-1.5 rounded font-medium text-center transition-colors cursor-pointer truncate",
                selectedKategori === "warning"
                  ? "bg-background text-blue-700 dark:text-blue-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pilar 2 ({countPilar2})
            </button>
          </div>
        </div>

        {/* List Aturan (Scroll Mandiri) - Bebas dari kode backend mentah ANOM_ */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {/* Tombol Tampilkan Seluruh Rekening */}
          <div
            onClick={() => onSelectKode(null)}
            className={cn(
              "group p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1",
              selectedKode === null
                ? "bg-muted/30 border-foreground ring-1 ring-foreground/30 shadow-xs"
                : "border-border/60 hover:bg-muted/40 hover:border-foreground/30"
            )}
          >
            <div className="flex items-center justify-between text-label-12">
              <span className="font-semibold text-foreground">
                Tampilkan Seluruh Rekening
              </span>
              <span className="font-mono text-label-11 font-semibold tabular-nums text-foreground">
                {numberFormat.format(
                  selectedKategori === "anomali"
                    ? totalsByKategori.anomali
                    : selectedKategori === "warning"
                    ? totalsByKategori.warning
                    : totalsByKategori.total
                )}{" "}
                SL
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {selectedKategori === "anomali"
                ? `Seluruh ${numberFormat.format(totalsByKategori.anomali)} rekening anomali validasi meter`
                : selectedKategori === "warning"
                ? `Seluruh ${numberFormat.format(totalsByKategori.warning)} rekening catatan kendala akses lapangan`
                : `Seluruh ${numberFormat.format(totalsByKategori.total)} rekening pembacaan periode aktif`}
            </p>
          </div>

          {/* Daftar Kartu Aturan (Menampilkan Nama & Keterangan Ramah Pengguna) */}
          {filteredAturan.map((item) => {
            const isSelected = selectedKode === item.kode;
            const isAnomali = item.dihitungSebagaiAnomali;

            return (
              <div
                key={item.kode}
                onClick={() => onSelectKode(isSelected ? null : item.kode)}
                className={cn(
                  "group p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5",
                  isSelected
                    ? "border-foreground ring-1 ring-foreground/30 bg-muted/30 shadow-xs"
                    : "border-border/60 hover:bg-muted/40 hover:border-foreground/30"
                )}
              >
                {/* Baris 1: Badges Kategori & Tingkat Keparahan */}
                <div className="flex items-center justify-between gap-1.5 text-label-11">
                  <Badge
                    variant={isAnomali ? "amber-subtle" : "blue-subtle"}
                    size="sm"
                    className="text-[9.5px] px-1.5 py-0 font-medium"
                  >
                    {isAnomali ? "Pilar 1: Anomali Validasi" : "Pilar 2: Catatan Lapangan"}
                  </Badge>

                  <div>
                    {item.tingkatKeparahan === "KRITIS" ? (
                      <Badge variant="red-subtle" size="sm" className="text-[9px] px-1 py-0 font-mono">
                        KRITIS
                      </Badge>
                    ) : item.tingkatKeparahan === "TINGGI" ? (
                      <Badge variant="amber-subtle" size="sm" className="text-[9px] px-1 py-0 font-mono">
                        TINGGI
                      </Badge>
                    ) : (
                      <Badge variant="gray-subtle" size="sm" className="text-[9px] px-1 py-0 font-mono">
                        {item.tingkatKeparahan}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Baris 2: Nama Keterangan Aturan (Human-Friendly) */}
                <p className="text-label-12 text-foreground font-semibold leading-snug">
                  {item.nama}
                </p>

                {/* Baris 3: Kasus & Persentase */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/30">
                  <span className="text-[10.5px]">Volume Dampak:</span>
                  <div className="font-mono tabular-nums flex items-center gap-1.5">
                    <span
                      className={cn(
                        "font-bold text-label-12",
                        isAnomali
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-blue-700 dark:text-blue-400"
                      )}
                    >
                      {numberFormat.format(item.jumlah)}
                    </span>
                    <span>kasus ({item.persentase}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* =========================================================================
          PANEL KANAN: Detail Rekening & Alamat Terdampak (Sticky Header & Kolom Ringkas)
          ========================================================================= */}
      <Card className="flex-1 min-w-0 border-border bg-card flex flex-col overflow-hidden shadow-sm">
        {/* Header Panel Kanan: Konteks Aturan & Pencarian dengan IconStack */}
        <div className="p-3.5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* IconStack Style REUI */}
            <IconStack className="h-9 w-8 text-foreground/80 shrink-0">
              <Users className="size-3.5 text-foreground" />
            </IconStack>

            <div className="min-w-0">
              <h2 className="text-label-13 font-semibold text-foreground truncate">
                {activeAturanObj ? activeAturanObj.nama : "Daftar Rekening Terpilih"}
              </h2>
              <p className="text-copy-11 text-muted-foreground truncate">
                {activeAturanObj
                  ? `${activeAturanObj.dihitungSebagaiAnomali ? "Pilar 1: Anomali Validasi" : "Pilar 2: Catatan Lapangan"} • Tingkat: ${activeAturanObj.tingkatKeparahan} • ${numberFormat.format(activeAturanObj.jumlah)} rekening terdampak`
                  : selectedKategori === "anomali"
                  ? "Menampilkan seluruh rekening terklasifikasi Pilar 1: Anomali Validasi Meter"
                  : selectedKategori === "warning"
                  ? "Menampilkan seluruh rekening terklasifikasi Pilar 2: Catatan Kendala Akses Lapangan"
                  : "Menampilkan seluruh rekening pembacaan periode berjalan"}
              </p>
            </div>
          </div>

          {/* Kotak Pencarian Alamat & Pelanggan */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              size="sm"
              placeholder="Cari alamat, nama, NOLG..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-8 text-label-12 bg-background"
            />
          </div>
        </div>

        {/* Tabel Data Rekening & Alamat dengan Sticky Header Sempurna */}
        <div className={cn("flex-1 overflow-y-auto relative transition-opacity duration-150", loading && "opacity-60")}>
          {pelanggan.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <IconStack className="h-16 w-14 mb-3 text-muted-foreground/60">
                <Users className="size-5 text-muted-foreground" />
              </IconStack>
              <p className="text-copy-13 font-medium text-foreground">Tidak Ada Rekening Ditemukan</p>
              <p className="text-copy-11 text-muted-foreground max-w-xs mt-1">
                Tidak ada data rekening yang cocok dengan aturan terpilih atau kata kunci pencarian.
              </p>
            </div>
          ) : (
            <Table containerClassName="h-full overflow-visible">
              <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-md shadow-xs [&_tr]:border-b">
                <TableRow className="text-[11.5px] [&_th]:bg-muted/70 [&_th]:sticky [&_th]:top-0 [&_th]:z-20">
                  <TableHead className="w-28 font-mono">Nolang</TableHead>
                  <TableHead className="w-44">Nama</TableHead>
                  <TableHead className="min-w-[200px]">Alamat</TableHead>
                  <TableHead className="w-20 text-right">Stand Lalu</TableHead>
                  <TableHead className="w-20 text-right">Stand Akhir</TableHead>
                  <TableHead className="w-20 text-right">Pakai</TableHead>
                  <TableHead className="w-20 text-right">Pakai Lalu</TableHead>
                  <TableHead className="w-24 text-right">Selisih</TableHead>
                  <TableHead className="w-32">Ket.Catat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-label-12 font-mono tabular-nums">
                {pelanggan.map((row) => {
                  const selisih = row.pakaiM3 - row.pakaiLalu;

                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      {/* 1. Nolang */}
                      <TableCell className="font-semibold text-foreground font-mono">
                        {row.nolg}
                      </TableCell>

                      {/* 2. Nama */}
                      <TableCell className="font-sans font-medium text-foreground text-label-12">
                        <div className="truncate max-w-[160px]" title={row.nama}>
                          {row.nama}
                        </div>
                      </TableCell>

                      {/* 3. Alamat */}
                      <TableCell className="font-sans text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                          <span className="truncate max-w-[260px] text-foreground/90 font-medium" title={row.alamat}>
                            {row.alamat}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground ml-4">
                          {row.kelurahanNama ?? "-"} • Rute {row.ruteKode ?? "-"}
                        </div>
                      </TableCell>

                      {/* 4. Stand Lalu */}
                      <TableCell className="text-right text-muted-foreground">
                        {numberFormat.format(row.stml)}
                      </TableCell>

                      {/* 5. Stand Akhir */}
                      <TableCell className="text-right font-medium text-foreground">
                        {numberFormat.format(row.stma)}
                      </TableCell>

                      {/* 6. Pakai (Periode Berjalan) */}
                      <TableCell className="text-right font-bold text-foreground">
                        {numberFormat.format(row.pakaiM3)} m³
                      </TableCell>

                      {/* 7. Pakai Lalu (Periode Sebelumnya) */}
                      <TableCell className="text-right text-muted-foreground">
                        {numberFormat.format(row.pakaiLalu)} m³
                      </TableCell>

                      {/* 8. Selisih (Pakai - Pakai Lalu) */}
                      <TableCell className="text-right font-semibold">
                        {selisih > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                            <ArrowUpRight className="size-3" />
                            +{selisih}
                          </span>
                        ) : selisih < 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                            <ArrowDownRight className="size-3" />
                            {selisih}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>

                      {/* 9. Ket.Catat */}
                      <TableCell className="font-sans text-[11px] text-muted-foreground">
                        <div className="truncate max-w-[130px]" title={row.ketCatat || "-"}>
                          {row.ketCatat || "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginasi Kompak di Bawah */}
        <div className="p-2.5 border-t border-border bg-muted/10 flex items-center justify-between text-label-11 text-muted-foreground shrink-0">
          <div>
            Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari{" "}
            <span className="font-semibold text-foreground">{totalPages}</span> (Total{" "}
            <span className="font-semibold text-foreground font-mono">
              {numberFormat.format(totalPelangganCount)}
            </span>{" "}
            rekening)
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              disabled={offset === 0}
              onClick={() => onPageChange(Math.max(offset - limit, 0))}
              className="gap-1 h-6 px-2 text-[11px]"
            >
              <ChevronLeft className="size-3" />
              <span>Sebelumnya</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={offset + limit >= totalPelangganCount}
              onClick={() => onPageChange(offset + limit)}
              className="gap-1 h-6 px-2 text-[11px]"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
