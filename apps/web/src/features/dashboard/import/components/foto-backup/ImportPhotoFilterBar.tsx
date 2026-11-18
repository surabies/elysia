// apps/web/src/features/dashboard/import/components/foto-backup/ImportPhotoFilterBar.tsx
"use client";

import * as React from "react";
import {
  Layers,
  Gauge,
  ShieldCheck,
  Home,
  FolderArchive,
  UploadCloud,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ModeImportFilter } from "../../types/foto-backup.types";

interface ImportPhotoFilterBarProps {
  modeFilter: ModeImportFilter;
  setModeFilter: (m: ModeImportFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalBerkas: number;
  countStand: number;
  countSegel: number;
  countRumah: number;
  selectedNolgsCount: number;
  activeProcessCount: number;
  isSubmitting: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExecuteImport: () => void;
  onClear: () => void;
  hasData: boolean;
}

export function ImportPhotoFilterBar({
  modeFilter,
  setModeFilter,
  searchQuery,
  setSearchQuery,
  totalBerkas,
  countStand,
  countSegel,
  countRumah,
  selectedNolgsCount,
  activeProcessCount,
  isSubmitting,
  onFileSelect,
  onExecuteImport,
  onClear,
  hasData,
}: ImportPhotoFilterBarProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Baris Judul & Aksi Utama */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-title-16 font-semibold tracking-tight text-foreground">
              Import Foto Backup (Mobile Recovery)
            </h2>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono">
              Pola: {"{THBL}_{JENIS}_{NOLG}.jpg"}
            </Badge>
          </div>
          <p className="text-copy-13 text-muted-foreground">
            Pemulihan foto lapangan saat gagal sinkronisasi jaringan mobile. Sistem dinamis memetakan foto ke database secara otomatis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {hasData && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={isSubmitting}
              className="h-8 text-label-12 cursor-pointer"
              title="Kosongkan daftar berkas"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Kosongkan
            </Button>
          )}

          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild className="h-8 text-label-12 cursor-pointer">
              <span>
                <FolderArchive className="mr-1.5 size-3.5 text-primary" />
                Pilih Berkas dari HP
              </span>
            </Button>
          </label>

          <Button
            size="sm"
            onClick={onExecuteImport}
            disabled={isSubmitting || selectedNolgsCount === 0 || activeProcessCount === 0}
            className="h-8 px-3 text-label-12 font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <UploadCloud className="size-3.5" />
            {isSubmitting
              ? "Memproses..."
              : modeFilter === "stand"
              ? `Petakan Foto Stand (${activeProcessCount} Berkas)`
              : modeFilter === "segel"
              ? `Petakan Foto Segel (${activeProcessCount} Berkas)`
              : modeFilter === "rumah"
              ? `Petakan Foto Rumah (${activeProcessCount} Berkas)`
              : `Petakan ke Database (${activeProcessCount} Berkas · ${selectedNolgsCount} SL)`}
          </Button>
        </div>
      </div>

      {/* Segmented Filter Control & Search Input (Hanya jika ada data yang diunggah) */}
      {hasData && (
        <div className="flex flex-col gap-3 pt-2 border-t border-border sm:flex-row sm:items-center sm:justify-between">
          {/* Segmented Control Pengelompokan Foto Aktif */}
          <div className="flex flex-wrap items-center gap-1 rounded-md bg-muted/60 p-1 border border-border/50 select-none">
            {/* Opsi 1: Semua Foto (Sekaligus) */}
            <button
              type="button"
              onClick={() => setModeFilter("all")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-label-12 font-medium transition-all cursor-pointer",
                modeFilter === "all"
                  ? "bg-background text-foreground shadow-xs border border-border/70 font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Layers className="size-3.5 text-primary" />
              <span>Semua Foto (Sekaligus)</span>
              <span className="font-mono text-[10px] text-muted-foreground">({totalBerkas})</span>
            </button>

            {/* Opsi 2: Stand Meter Saja */}
            <button
              type="button"
              onClick={() => setModeFilter("stand")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-label-12 font-medium transition-all cursor-pointer",
                modeFilter === "stand"
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-xs border border-sky-500/50 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Gauge className="size-3.5 text-sky-500" />
              <span>Stand Meter</span>
              <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-semibold">({countStand})</span>
            </button>

            {/* Opsi 3: Segel Meter Saja */}
            <button
              type="button"
              onClick={() => setModeFilter("segel")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-label-12 font-medium transition-all cursor-pointer",
                modeFilter === "segel"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-500/50 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <ShieldCheck className="size-3.5 text-amber-500" />
              <span>Segel Meter</span>
              <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-semibold">({countSegel})</span>
            </button>

            {/* Opsi 4: Fasad Rumah Saja */}
            <button
              type="button"
              onClick={() => setModeFilter("rumah")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-label-12 font-medium transition-all cursor-pointer",
                modeFilter === "rumah"
                  ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-xs border border-indigo-500/50 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Home className="size-3.5 text-indigo-500" />
              <span>Fasad Rumah</span>
              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">({countRumah})</span>
            </button>
          </div>

          {/* Search Input Filter */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Langganan / Berkas..."
              className="h-8 pl-8 text-copy-13"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
