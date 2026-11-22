"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import type { AuditPelangganItem } from "@/server/services/cater/cater-progress.service";

const numberFormat = new Intl.NumberFormat("id-ID");

export interface AuditPelangganTableProps {
  pelanggan: AuditPelangganItem[];
  totalCount: number;
  search: string;
  onSearchChange: (search: string) => void;
  selectedKode: string | null;
  selectedKategori: "all" | "anomali" | "warning" | "normal";
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

export function AuditPelangganTable({
  pelanggan,
  totalCount,
  search,
  onSearchChange,
  selectedKode,
  selectedKategori,
  limit,
  offset,
  onPageChange,
}: AuditPelangganTableProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

  return (
    <Card className="border-border bg-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <IconStack className="h-9 w-8 text-foreground/80 shrink-0">
            <Users className="size-3.5 text-foreground" />
          </IconStack>
          <div>
            <h2 className="text-label-14 font-semibold text-foreground">
              Daftar Rekening Terdampak (Drill-Down)
            </h2>
            <p className="text-copy-12 text-muted-foreground">
              {selectedKode
                ? `Menampilkan rekening dengan filter aturan terpilih`
                : selectedKategori === "anomali"
                ? "Menampilkan seluruh rekening Pilar 1: Anomali Validasi"
                : selectedKategori === "warning"
                ? "Menampilkan seluruh rekening Pilar 2: Catatan Kendala Lapangan"
                : selectedKategori === "normal"
                ? "Menampilkan rekening Stand Wajar (Normal)"
                : "Menampilkan seluruh rekening pembacaan periode"}
              {" • "}
              <span className="font-semibold text-foreground font-mono">
                {numberFormat.format(totalCount)} rekening
              </span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
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

      <div className="max-h-[500px] overflow-y-auto relative">
        {pelanggan.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center p-8 text-center">
            <IconStack className="h-14 w-12 mb-2.5 text-muted-foreground/60">
              <Users className="size-4.5 text-muted-foreground" />
            </IconStack>
            <p className="text-copy-13 font-medium text-foreground">Tidak Ada Rekening Ditemukan</p>
            <p className="text-copy-11 text-muted-foreground max-w-xs mt-1">
              Tidak ada data rekening yang cocok dengan kriteria filter ini.
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

                    {/* 6. Pakai */}
                    <TableCell className="text-right font-bold text-foreground">
                      {numberFormat.format(row.pakaiM3)} m³
                    </TableCell>

                    {/* 7. Pakai Lalu */}
                    <TableCell className="text-right text-muted-foreground">
                      {numberFormat.format(row.pakaiLalu)} m³
                    </TableCell>

                    {/* 8. Selisih */}
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

      {/* Pagination Bar */}
      <div className="flex items-center justify-between p-3 border-t border-border bg-muted/10 text-label-12 text-muted-foreground">
        <div>
          Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari{" "}
          <span className="font-semibold text-foreground">{totalPages}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(offset - limit, 0))}
            className="gap-1 h-7 text-[11px]"
          >
            <ChevronLeft className="size-3.5" />
            <span>Sebelumnya</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={offset + limit >= totalCount}
            onClick={() => onPageChange(offset + limit)}
            className="gap-1 h-7 text-[11px]"
          >
            <span>Selanjutnya</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
