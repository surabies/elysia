"use client";

// features/dashboard/pengaduan/components/bersama/PilihPetugas.tsx —
// Dropdown petugas & atasan menggunakan komponen standar shadcn/ui <Select> (tinggi h-8 seragam dengan Button).
// - mode="petugas" (default, dipakai di Tindakan -> Tugaskan): HANYA menampilkan Pelaksana / Anggota lapangan.
// - mode="atasan" (dipakai di Eskalasi ke atasan): HANYA menampilkan Manager & Supervisor.

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PetugasRingkas } from "@/features/dashboard/pengaduan/types/TipePengaduan";

const LEVEL_ATASAN = new Set(["SUPERVISOR", "MANAGER"]);
const LEVEL_PELAKSANA = new Set(["PELAKSANA", "STAFF_PENYELIA"]);

export function PilihPetugas({
  petugas,
  value,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
  mode = "petugas",
}: {
  petugas: PetugasRingkas[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  mode?: "petugas" | "atasan";
}) {
  const daftarTersaring = React.useMemo(() => {
    if (mode === "atasan") {
      const struktural = petugas.filter(
        (p) =>
          (p.level && LEVEL_ATASAN.has(p.level)) ||
          /^(manager|supervisor)\b/i.test(p.jabatan ?? p.role)
      );
      return struktural.length > 0 ? struktural : petugas;
    }

    // mode === "petugas": hanya pelaksana / anggota (bukan manager/supervisor/direksi)
    const anggota = petugas.filter(
      (p) =>
        (p.level && LEVEL_PELAKSANA.has(p.level)) ||
        (!p.level && !/manager|supervisor|direksi/i.test(p.jabatan ?? p.role))
    );
    return anggota.length > 0 ? anggota : petugas;
  }, [petugas, mode]);

  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className="min-w-0 flex-1"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {daftarTersaring.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name ?? p.id} · {p.jabatan || p.role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
