import * as React from "react"
import type { ColDef } from "ag-grid-community"
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer"
import { ArrowUpDownIcon } from "@/features/dashboard/shared/icons/IkonLucide"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NILAI_KOSONG } from "../lib/KonstantaDataGrid"

/** Urutan di mode kartu — menggantikan kepala kolom yang tidak ada di ponsel. */
export function PemilihUrut({
  kolom,
  nilai,
  onUbah,
}: {
  kolom: ColDef[]
  nilai: string
  onUbah: (nilai: string) => void
}) {
  return (
    <Select
      value={nilai || NILAI_KOSONG}
      onValueChange={(value) => onUbah(value === NILAI_KOSONG ? "" : value)}
    >
      <SelectTrigger
        aria-label="Urutkan"
        size="sm"
        className="max-w-48"
      >
        <HugeiconsIcon
          icon={ArrowUpDownIcon}
          strokeWidth={2}
          className="size-3.5 text-muted-foreground"
          aria-hidden
        />
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        <SelectItem value={NILAI_KOSONG}>Urutan bawaan</SelectItem>
        {kolom.map((c) => {
          const kunci = c.colId ?? c.field ?? ""
          return (
            <React.Fragment key={kunci}>
              <SelectItem value={`${kunci}:asc`}>{c.headerName} ↑</SelectItem>
              <SelectItem value={`${kunci}:desc`}>{c.headerName} ↓</SelectItem>
            </React.Fragment>
          )
        })}
      </SelectContent>
    </Select>
  )
}
