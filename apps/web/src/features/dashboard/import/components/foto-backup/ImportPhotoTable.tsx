// apps/web/src/features/dashboard/import/components/foto-backup/ImportPhotoTable.tsx
"use client";

import * as React from "react";
import { Eye, CheckCircle2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CustomerPhotoGroup, ModeImportFilter } from "../../types/foto-backup.types";

interface ImportPhotoTableProps {
  filteredCustomers: CustomerPhotoGroup[];
  selectedNolgs: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleSelectAll: () => void;
  toggleRowSelect: (nolg: string) => void;
  modeFilter: ModeImportFilter;
  activeProcessCount: number;
  onOpenPreview: (group: CustomerPhotoGroup, tab: "stand" | "segel" | "rumah") => void;
}

export function ImportPhotoTable({
  filteredCustomers,
  selectedNolgs,
  isAllSelected,
  isIndeterminate,
  toggleSelectAll,
  toggleRowSelect,
  modeFilter,
  activeProcessCount,
  onOpenPreview,
}: ImportPhotoTableProps) {
  return (
    <div className="rounded-lg border border-border bg-[var(--card)] overflow-hidden">
      {/* Status Bar Selection di Atas Tabel */}
      <div className="flex items-center justify-between border-b border-border bg-[var(--table-head)] px-4 py-2 text-label-12">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            Terpilih:{" "}
            <strong className="font-mono text-[var(--primary-foreground)] font-semibold">
              {selectedNolgs.size}
            </strong>{" "}
            / {filteredCustomers.length} SL
          </span>
          <span>·</span>
          <span className="text-muted-foreground">
            Total Berkas:{" "}
            <strong className="font-mono text-[var(--primary)] font-semibold">
              {activeProcessCount} Foto
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {filteredCustomers.length} Pelanggan Terpetakan
          </span>
        </div>
      </div>

      {/* Tabel dengan Scroll Kontainer Mandiri (Pola TanStack) */}
      <Table containerClassName="max-h-[calc(100vh-320px)] overflow-y-auto">
        <TableHeader className="sticky top-0 z-10 bg-[var(--table-head)] shadow-[0_1px_0_0_var(--border)]">
          <TableRow>
            {/* Checkbox Select All */}
            <TableHead className="w-10 text-center bg-[var(--table-head)]">
              <Checkbox
                checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
                aria-label="Pilih semua baris"
              />
            </TableHead>
            <TableHead className="w-10 text-center bg-[var(--table-head)]">No</TableHead>

            {/* Kolom Terpisah: No Langganan, Nama, Alamat */}
            <TableHead className="min-w-[130px] bg-[var(--table-head)]">No. Langganan</TableHead>
            <TableHead className="min-w-[170px] bg-[var(--table-head)]">Nama Pelanggan</TableHead>
            <TableHead className="min-w-[200px] bg-[var(--table-head)]">Alamat</TableHead>
            <TableHead className="w-20 text-center bg-[var(--table-head)]">Rute</TableHead>

            {/* Kolom Dinamis Berdasarkan Mode Filter Pengelompokan */}
            {modeFilter === "all" ? (
              <>
                <TableHead className="min-w-[150px] bg-[var(--table-head)]">Foto Stand Meter</TableHead>
                <TableHead className="min-w-[150px] bg-[var(--table-head)]">Foto Segel Meter</TableHead>
                <TableHead className="min-w-[150px] bg-[var(--table-head)]">Foto Rumah / Fasad</TableHead>
                <TableHead className="min-w-[110px] text-center bg-[var(--table-head)]">Kelengkapan</TableHead>
              </>
            ) : modeFilter === "stand" ? (
              <>
                <TableHead className="min-w-[220px] bg-[var(--table-head)]">Berkas Foto Stand Meter</TableHead>
                <TableHead className="min-w-[130px] text-center bg-[var(--table-head)]">Status Validasi</TableHead>
              </>
            ) : modeFilter === "segel" ? (
              <>
                <TableHead className="min-w-[220px] bg-[var(--table-head)]">Berkas Foto Segel Meter</TableHead>
                <TableHead className="min-w-[130px] text-center bg-[var(--table-head)]">Status Validasi</TableHead>
              </>
            ) : (
              <>
                <TableHead className="min-w-[220px] bg-[var(--table-head)]">Berkas Foto Fasad Rumah</TableHead>
                <TableHead className="min-w-[130px] text-center bg-[var(--table-head)]">Status Validasi</TableHead>
              </>
            )}

            <TableHead className="w-16 text-center bg-[var(--table-head)]">Aksi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredCustomers.map((c, idx) => {
            const isSelected = selectedNolgs.has(c.nolg);
            return (
              <TableRow
                key={c.nolg}
                className={cn(
                  "transition-colors",
                  isSelected && "bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10"
                )}
              >
                {/* Checkbox */}
                <TableCell className="text-center">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRowSelect(c.nolg)}
                    aria-label={`Pilih ${c.nolg}`}
                  />
                </TableCell>

                {/* No */}
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {idx + 1}
                </TableCell>

                {/* 1. Kolom Terpisah: No. Langganan (NOLG) */}
                <TableCell>
                  <span className="font-mono font-semibold text-[var(--primary)] text-xs">
                    {c.nolg}
                  </span>
                </TableCell>

                {/* 2. Kolom Terpisah: Nama Pelanggan (Dari Database) */}
                <TableCell>
                  <span className="font-medium text-[var(--primary-foreground)] text-xs uppercase">
                    {c.nama || <span className="text-muted-foreground font-normal italic">Memuat dari database...</span>}
                  </span>
                </TableCell>

                {/* 3. Kolom Terpisah: Alamat (Dari Database) */}
                <TableCell>
                  <span className="text-muted-foreground text-xs line-clamp-1" title={c.alamat}>
                    {c.alamat || <span className="text-muted-foreground/50 italic">-</span>}
                  </span>
                </TableCell>

                {/* Rute */}
                <TableCell className="text-center">
                  {c.ruteKode ? (
                    <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                      {c.ruteKode}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">-</span>
                  )}
                </TableCell>

                {/* KONTEN KOLOM FOTO DINAMIS */}
                {modeFilter === "all" ? (
                  <>
                    {/* Foto Stand */}
                    <TableCell>
                      {c.fotoStand ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPreview(c, "stand")}
                            className="group relative size-11 shrink-0 overflow-hidden rounded-md border border-[var(--verif-v2)]/30 bg-[var(--muted)] transition-transform hover:scale-105 cursor-pointer"
                            title="Klik untuk membuka foto stand"
                          >
                            <img
                              src={c.fotoStand.url}
                              alt="Stand Meter"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-3.5 text-[var(--invert-foreground)]" />
                            </div>
                          </button>
                          <div className="flex flex-col text-[10px]">
                            <span className="font-mono font-medium text-[var(--verif-v2-text)] truncate max-w-[110px]" title={c.fotoStand.fileName}>
                              {c.fotoStand.fileName.replace(`${c.nolg}.jpg`, "...")}
                            </span>
                            <span className="text-muted-foreground font-mono">{c.fotoStand.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs italic">-</span>
                      )}
                    </TableCell>

                    {/* Foto Segel */}
                    <TableCell>
                      {c.fotoSegel ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPreview(c, "segel")}
                            className="group relative size-11 shrink-0 overflow-hidden rounded-md border border-[var(--verif-v1)]/30 bg-[var(--muted)] transition-transform hover:scale-105 cursor-pointer"
                            title="Klik untuk membuka foto segel"
                          >
                            <img
                              src={c.fotoSegel.url}
                              alt="Segel Meter"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-3.5 text-[var(--invert-foreground)]" />
                            </div>
                          </button>
                          <div className="flex flex-col text-[10px]">
                            <span className="font-mono font-medium text-[var(--verif-v1-text)] truncate max-w-[110px]" title={c.fotoSegel.fileName}>
                              {c.fotoSegel.fileName.replace(`${c.nolg}.jpg`, "...")}
                            </span>
                            <span className="text-muted-foreground font-mono">{c.fotoSegel.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs italic">-</span>
                      )}
                    </TableCell>

                    {/* Foto Rumah */}
                    <TableCell>
                      {c.fotoRumah ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPreview(c, "rumah")}
                            className="group relative size-11 shrink-0 overflow-hidden rounded-md border border-[var(--verif-v2)]/30 bg-[var(--muted)] transition-transform hover:scale-105 cursor-pointer"
                            title="Klik untuk membuka foto rumah"
                          >
                            <img
                              src={c.fotoRumah.url}
                              alt="Fasad Rumah"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-3.5 text-[var(--invert-foreground)]" />
                            </div>
                          </button>
                          <div className="flex flex-col text-[10px]">
                            <span className="font-mono font-medium text-[var(--verif-v2-text)] truncate max-w-[110px]" title={c.fotoRumah.fileName}>
                              {c.fotoRumah.fileName.replace(`${c.nolg}.jpg`, "...")}
                            </span>
                            <span className="text-muted-foreground font-mono">{c.fotoRumah.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs italic">-</span>
                      )}
                    </TableCell>

                    {/* Status Kelengkapan */}
                    <TableCell className="text-center">
                      {c.countLengkap === 3 ? (
                        <Badge className="bg-[var(--verif-v3-soft)] text-[var(--verif-v3-text)] border-[var(--verif-v3-border)]/30 text-[10px] font-semibold">
                          <CheckCircle2 className="mr-1 size-3 text-[var(--verif-v3)]" />
                          3/3 Lengkap
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-[var(--verif-v1-text)] border-[var(--verif-v1-border)]/30">
                          {c.countLengkap}/3 Berkas
                        </Badge>
                      )}
                    </TableCell>
                  </>
                ) : modeFilter === "stand" ? (
                  <>
                    <TableCell>
                      {c.fotoStand ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenPreview(c, "stand")}
                            className="group relative size-12 shrink-0 overflow-hidden rounded-md border border-[var(--verif-v2)]/40 bg-[var(--muted)] transition-transform hover:scale-105 cursor-pointer"
                          >
                            <img
                              src={c.fotoStand.url}
                              alt="Foto Stand Meter"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-4 text-[var(--invert-foreground)]" />
                            </div>
                          </button>
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-mono font-medium text-[var(--primary-foreground)]">{c.fotoStand.fileName}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{c.fotoStand.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-[var(--verif-v2-soft)] text-[var(--verif-v2-text)] border-[var(--verif-v2-border)]/30 text-[10px] font-semibold">
                        <Check className="mr-1 size-3 text-[var(--verif-v2)]" />
                        Stand Valid
                      </Badge>
                    </TableCell>
                  </>
                ) : modeFilter === "segel" ? (
                  <>
                    <TableCell>
                      {c.fotoSegel ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenPreview(c, "segel")}
                            className="group relative size-12 shrink-0 overflow-hidden rounded-md border border-[var(--verif-v1)]/40 bg-[var(--muted)] transition-transform hover:scale-105 cursor-pointer"
                          >
                            <img
                              src={c.fotoSegel.url}
                              alt="Foto Segel Meter"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-4 text-[var(--invert-foreground)]" />
                            </div>
                          </button>
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-mono font-medium text-[var(--primary-foreground)]">{c.fotoSegel.fileName}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{c.fotoSegel.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-[var(--verif-v1-soft)] text-[var(--verif-v1-text)] border-[var(--verif-v1-border)]/30 text-[10px] font-semibold">
                        <Check className="mr-1 size-3 text-[var(--verif-v1)]" />
                        Segel Valid
                      </Badge>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      {c.fotoRumah ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenPreview(c, "rumah")}
                            className="group relative size-12 shrink-0 overflow-hidden rounded-md border border-[var(--verif-v2)]/40 bg-[var(--muted)] transition-transform hover:scale-105 cursor-pointer"
                          >
                            <img
                              src={c.fotoRumah.url}
                              alt="Foto Fasad Rumah"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="size-4 text-[var(--invert-foreground)]" />
                            </div>
                          </button>
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-mono font-medium text-[var(--primary-foreground)]">{c.fotoRumah.fileName}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{c.fotoRumah.size}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-xs italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-[var(--verif-v2-soft)] text-[var(--verif-v2-text)] border-[var(--verif-v2-border)]/30 text-[10px] font-semibold">
                        <Check className="mr-1 size-3 text-[var(--verif-v2)]" />
                        Rumah Valid
                      </Badge>
                    </TableCell>
                  </>
                )}

                {/* Aksi Button */}
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onOpenPreview(
                        c,
                        modeFilter === "all"
                          ? c.fotoStand
                            ? "stand"
                            : c.fotoSegel
                            ? "segel"
                            : "rumah"
                          : modeFilter
                      )
                    }
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-[var(--primary-foreground)] cursor-pointer"
                    title="Buka Pratinjau Foto"
                  >
                    <Eye className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
