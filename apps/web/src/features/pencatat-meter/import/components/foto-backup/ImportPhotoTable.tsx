// features/dashboard/import/components/foto-backup/ImportPhotoTable.tsx
"use client";

import * as React from "react";
import { Check, CheckCircle2, Eye } from "lucide-react";
import { Badge, Button, Checkbox } from "@cater/ui";
import { cn } from "@/lib/utils";
import {
  FOTO_JENIS,
  FOTO_JENIS_LIST,
  getFoto,
  shortenFotoName,
  type FotoJenis,
  type FotoJenisMeta,
} from "../../lib/foto-backup";
import { TONE_STYLE } from "../../lib/import-ui";
import type {
  CustomerPhotoGroup,
  ModeImportFilter,
} from "../../types/foto-backup.types";
import { ImportDataTable, type ImportColumn } from "../shared/ImportDataTable";
import { ImportTablePanel } from "../shared/ImportPanels";

type OpenPreview = (group: CustomerPhotoGroup, tab: FotoJenis) => void;

interface ImportPhotoTableProps {
  filteredCustomers: CustomerPhotoGroup[];
  selectedNolgs: Set<string>;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleSelectAll: () => void;
  toggleRowSelect: (nolg: string) => void;
  modeFilter: ModeImportFilter;
  activeProcessCount: number;
  onOpenPreview: OpenPreview;
}

interface PhotoCellProps {
  group: CustomerPhotoGroup;
  meta: FotoJenisMeta;
  compact: boolean;
  onOpenPreview: OpenPreview;
}

function PhotoCell({ group, meta, compact, onOpenPreview }: PhotoCellProps) {
  const foto = getFoto(group, meta.key);
  if (!foto)
    return <span className="text-copy-13 text-muted-foreground">-</span>;

  const tone = TONE_STYLE[meta.tone];
  const displayName = compact
    ? shortenFotoName(foto.fileName, group.nolg)
    : foto.fileName;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onOpenPreview(group, meta.key)}
        title={`Klik untuk membuka ${meta.altText.toLowerCase()}`}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-md border bg-muted transition-transform hover:scale-105",
          compact ? "size-11" : "size-12",
          tone.border,
        )}
      >
        <img
          src={foto.url}
          alt={meta.altText}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Eye className="size-4 text-background" aria-hidden />
        </span>
      </button>

      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate text-label-12-mono",
            compact ? "max-w-28" : "text-foreground",
            compact && tone.text,
          )}
          title={foto.fileName}
        >
          {displayName}
        </span>
        <span className="text-copy-12 text-muted-foreground">{foto.size}</span>
      </div>
    </div>
  );
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
  const photoColumns: ImportColumn<CustomerPhotoGroup>[] =
    modeFilter === "all"
      ? [
          ...FOTO_JENIS_LIST.map((meta) => ({
            id: meta.key,
            header: meta.columnAll,
            className: "min-w-40",
            cell: (group: CustomerPhotoGroup) => (
              <PhotoCell
                group={group}
                meta={meta}
                compact
                onOpenPreview={onOpenPreview}
              />
            ),
          })),
          {
            id: "kelengkapan",
            header: "Kelengkapan",
            className: "min-w-28 text-center",
            cell: (group: CustomerPhotoGroup) =>
              group.countLengkap === FOTO_JENIS_LIST.length ? (
                <Badge variant="secondary" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 />
                  {group.countLengkap}/{FOTO_JENIS_LIST.length} Lengkap
                </Badge>
              ) : (
                <Badge variant="secondary" className="border-amber-500/30 text-amber-700 bg-amber-500/10 dark:text-amber-400">
                  {group.countLengkap}/{FOTO_JENIS_LIST.length} Berkas
                </Badge>
              ),
          },
        ]
      : [
          {
            id: modeFilter,
            header: FOTO_JENIS[modeFilter].columnSingle,
            className: "min-w-56",
            cell: (group: CustomerPhotoGroup) => (
              <PhotoCell
                group={group}
                meta={FOTO_JENIS[modeFilter]}
                compact={false}
                onOpenPreview={onOpenPreview}
              />
            ),
          },
          {
            id: "validasi",
            header: "Status Validasi",
            className: "min-w-32 text-center",
            cell: () => (
              <Badge variant={TONE_STYLE[FOTO_JENIS[modeFilter].tone].badge}>
                <Check />
                {FOTO_JENIS[modeFilter].validLabel}
              </Badge>
            ),
          },
        ];

  const columns: ImportColumn<CustomerPhotoGroup>[] = [
    {
      id: "select",
      header: (
        <Checkbox
          checked={
            isAllSelected ? true : isIndeterminate ? "indeterminate" : false
          }
          onCheckedChange={toggleSelectAll}
          aria-label="Pilih semua baris"
        />
      ),
      className: "w-10 text-center",
      cell: (group) => (
        <Checkbox
          checked={selectedNolgs.has(group.nolg)}
          onCheckedChange={() => toggleRowSelect(group.nolg)}
          aria-label={`Pilih ${group.nolg}`}
        />
      ),
    },
    {
      id: "no",
      header: "No",
      className: "w-10 text-center",
      cell: (_group, index) => index + 1,
      cellClassName: "text-copy-13-mono text-muted-foreground",
    },
    {
      id: "nolg",
      header: "No. Langganan",
      className: "min-w-32",
      cell: (group) => group.nolg,
      cellClassName: "text-label-13-mono text-foreground",
    },
    {
      id: "nama",
      header: "Nama Pelanggan",
      className: "min-w-44",
      cell: (group) =>
        group.nama ?? (
          <span className="text-muted-foreground">Memuat dari database...</span>
        ),
      cellClassName: "text-label-13 uppercase",
    },
    {
      id: "alamat",
      header: "Alamat",
      className: "min-w-50",
      cell: (group) => (
        <span className="line-clamp-1" title={group.alamat}>
          {group.alamat || "-"}
        </span>
      ),
      cellClassName: "text-copy-13 text-muted-foreground",
    },
    {
      id: "rute",
      header: "Rute",
      className: "w-20 text-center",
      cell: (group) =>
        group.ruteKode ? (
          <Badge variant="secondary" className="font-mono text-label-11">
            {group.ruteKode}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    ...photoColumns,
    {
      id: "aksi",
      header: "Aksi",
      className: "w-16 text-center",
      cell: (group) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Buka pratinjau foto"
          title="Buka Pratinjau Foto"
          onClick={() =>
            onOpenPreview(
              group,
              modeFilter === "all"
                ? (FOTO_JENIS_LIST.find((meta) => getFoto(group, meta.key))
                    ?.key ?? FOTO_JENIS_LIST[0].key)
                : modeFilter,
            )
          }
        >
          <Eye />
        </Button>
      ),
    },
  ];

  return (
    <ImportTablePanel
      summary={[
        <>
          Terpilih:{" "}
          <strong className="text-label-12-mono text-foreground">
            {selectedNolgs.size}
          </strong>{" "}
          / {filteredCustomers.length} SL
        </>,
        <>
          Total Berkas:{" "}
          <strong className="text-label-12-mono text-foreground">
            {activeProcessCount} Foto
          </strong>
        </>,
      ]}
      aside={
        <span className="text-label-12-mono">
          {filteredCustomers.length} Pelanggan Terpetakan
        </span>
      }
    >
      <ImportDataTable
        columns={columns}
        rows={filteredCustomers}
        getRowKey={(group) => group.nolg}
        rowClassName={(group) =>
          selectedNolgs.has(group.nolg)
            ? "bg-table-selected hover:bg-table-selected-hover"
            : undefined
        }
        empty={{
          icon: Eye,
          title: "Tidak ada hasil",
          description:
            "Tidak ada pelanggan yang sesuai dengan filter dan pencarian saat ini.",
        }}
      />
    </ImportTablePanel>
  );
}
