"use client";

// features/dashboard/pengaduan/components/bersama/PilihPetugas.tsx —
// Dropdown petugas & pejabat struktural berbasis shadcn/ui <Select>.
// Dikelompokkan per Bagian organisasi (Distribusi, RPM, Langganan, Pencatat Meter, Penagihan, Umum)
// dan menampilkan Jabatan resmi dari tabel pegawai (bukan kode enum RBAC).
// - mode="semua" (default): untuk penugasan petugas lapangan / staf
// - mode="atasan": khusus eskalasi ke pejabat struktural (Supervisor, Manager, Senior Manager, Direksi)

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PetugasRingkas } from "@/features/dashboard/pengaduan/types/TipePengaduan";

const LABEL_BAGIAN: Record<string, string> = {
  DISTRIBUSI: "Bagian Distribusi / Sub Zona",
  RPM: "Bagian RPM (Pengendalian Meter)",
  LANGGANAN: "Bagian Hubungan Langganan",
  PENCATAT_METER: "Bagian Pencatat Meter",
  PENAGIHAN: "Bagian Penagihan",
  UMUM: "Manajemen Wilayah & Pimpinan",
};

const URUTAN_BAGIAN = [
  "DISTRIBUSI",
  "RPM",
  "LANGGANAN",
  "PENCATAT_METER",
  "PENAGIHAN",
  "UMUM",
];

const LEVEL_ATASAN = new Set([
  "SUPERVISOR",
  "MANAGER",
  "SENIOR_MANAGER",
  "DIREKSI",
]);

export function PilihPetugas({
  petugas,
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  mode = "semua",
}: {
  petugas: PetugasRingkas[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  mode?: "semua" | "atasan";
}) {
  // Saring daftar berdasarkan konteks (Penugasan Lapangan vs Eskalasi ke Atasan)
  const daftarTersaring = React.useMemo(() => {
    if (mode === "atasan") {
      const struktural = petugas.filter(
        (p) =>
          (p.level && LEVEL_ATASAN.has(p.level)) ||
          /manager|supervisor|direksi/i.test(p.jabatan ?? p.role)
      );
      return struktural.length > 0 ? struktural : petugas;
    }
    return petugas;
  }, [petugas, mode]);

  // Kelompokkan per Bagian organisasi agar operator mudah mencari petugas sesuai bidang keluhan
  const grupPerBagian = React.useMemo(() => {
    const map = new Map<string, PetugasRingkas[]>();
    for (const p of daftarTersaring) {
      const key = p.bagian || "LAINNYA";
      const list = map.get(key) ?? [];
      list.push(p);
      map.set(key, list);
    }

    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      const idxA = URUTAN_BAGIAN.indexOf(a);
      const idxB = URUTAN_BAGIAN.indexOf(b);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    return entries;
  }, [daftarTersaring]);

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className="h-9 w-full min-w-0 flex-1 text-xs bg-background"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="max-h-72 z-50">
        {grupPerBagian.map(([bagianKey, anggota]) => (
          <SelectGroup key={bagianKey}>
            <SelectLabel className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
              {LABEL_BAGIAN[bagianKey] ?? bagianKey}
            </SelectLabel>
            {anggota.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name ?? p.id} · {p.jabatan || p.role}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
