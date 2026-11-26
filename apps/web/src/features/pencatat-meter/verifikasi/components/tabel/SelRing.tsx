"use client";

// features/dashboard/verifikasi/components/tabel/SelRing.tsx — penanda
// progres verifikasi pada kolom Ring: tiga batang V1/V2/V3 (Petugas,
// "berjenjang") atau dua batang (Pelanggan, "tunggal"), dengan tooltip rinci.
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Tahap } from "../../lib/warna-tahap";
import type { BarisVerifikasi, ModeRing } from "../../types";

interface LangkahRing {
  label: string;
  selesai: boolean;
  /** Kelas warna utuh, mis. "bg-(--verif-v1)". */
  warna: string;
  keterangan: string;
}

const KELAS_PEMICU =
  "inline-flex cursor-help flex-row items-center justify-center gap-1 py-1";
const KELAS_BATANG = "h-4 w-1 rounded-xs transition-colors";
const WARNA_KOSONG = "bg-muted-foreground/25 dark:bg-muted";
const WARNA_ERROR = "bg-(--verif-error)";

function keterangan(selesai: boolean, nama: string | null | undefined, kata: string) {
  if (nama) return `${kata} (${nama})`;
  return selesai ? kata : "Belum";
}

function langkahPetugas(row: BarisVerifikasi): LangkahRing[] {
  const v1 = Boolean(row.verif1At);
  const v2 = Boolean(row.verif2At);
  const v3 = Boolean(row.verif3At || row.isVerified);
  return [
    {
      label: "V1 (Supervisor)",
      selesai: v1,
      warna: "bg-(--verif-v1)",
      keterangan: keterangan(v1, row.verif1By?.name, "Tervalidasi"),
    },
    {
      label: "V2 (Manager)",
      selesai: v2,
      warna: "bg-(--verif-v2)",
      keterangan: keterangan(v2, row.verif2By?.name, "Tervalidasi"),
    },
    {
      label: "V3 (Senior Manager)",
      selesai: v3,
      warna: "bg-(--verif-v3)",
      keterangan: keterangan(v3, row.verif3By?.name, "Tervalidasi"),
    },
  ];
}

function langkahMandiri(row: BarisVerifikasi): LangkahRing[] {
  const selesaiLaporan = Boolean(
    row.laporanMandiriTerverifikasi ||
      row.isVerified ||
      row.status === "DIVERIFIKASI" ||
      row.status === "DIGUNAKAN" ||
      row.verif1At,
  );
  const ditolakLaporan = row.status === "DITOLAK";

  const ketLaporan = ditolakLaporan
    ? "Ditolak"
    : keterangan(
        selesaiLaporan,
        row.verif1By?.name ?? row.verifiedBy?.name ?? row.pencatat?.namaLapangan,
        "Diverifikasi",
      );

  const warnaLaporan = ditolakLaporan
    ? WARNA_ERROR
    : selesaiLaporan
      ? "bg-(--verif-info)"
      : WARNA_KOSONG;

  const selesaiPetugas = Boolean(
    row.verif3At || row.status === "DIGUNAKAN" || row.pembacaan != null,
  );
  return [
    {
      label: "Laporan Pelanggan",
      selesai: selesaiLaporan,
      warna: warnaLaporan,
      keterangan: ketLaporan,
    },
    {
      label: "Petugas",
      selesai: selesaiPetugas,
      warna: selesaiPetugas ? "bg-(--verif-v3)" : WARNA_KOSONG,
      keterangan: keterangan(selesaiPetugas, row.verif3By?.name, "Tervalidasi"),
    },
  ];
}

export function SelRing({
  row,
  tahap,
  mode,
}: {
  row: BarisVerifikasi;
  tahap: Tahap;
  mode: ModeRing;
}) {
  const langkah = mode === "tunggal" ? langkahMandiri(row) : langkahPetugas(row);
  const ditolak = tahap === "DITOLAK";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={KELAS_PEMICU}
          aria-label={
            ditolak
              ? "Ditolak"
              : langkah
                  .map((l) => `${l.label}: ${l.keterangan}`)
                  .join(", ")
          }
        >
          {langkah.map((l) => {
            const warna = ditolak
              ? WARNA_ERROR
              : l.selesai
                ? l.warna
                : WARNA_KOSONG;
            return (
              <span
                key={l.label}
                className={cn(KELAS_BATANG, warna)}
                aria-hidden
              />
            );
          })}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1 text-copy-12">
        <p className="font-semibold text-foreground">
          {ditolak ? "Ditolak (Perlu Cek Ulang)" : "Tahap Verifikasi"}
        </p>
        <ul className="space-y-0.5">
          {langkah.map((l) => (
            <li key={l.label} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{l.label}</span>
              <span
                className={cn(
                  "font-medium",
                  ditolak
                    ? "text-(--verif-error)"
                    : l.selesai
                      ? "text-foreground"
                      : "text-muted-foreground/70",
                )}
              >
                {ditolak ? "Ditolak" : l.keterangan}
              </span>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
