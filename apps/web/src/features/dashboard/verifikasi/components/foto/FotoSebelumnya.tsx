"use client";

// features/dashboard/verifikasi/components/fotoSebelumnya.tsx — foto
// pembanding: foto bukti pembacaan RESMI terakhir SEBELUM periode laporan
// yang sedang diperiksa, ditampilkan di panel detail dengan 3 tab (stand, segel, rumah).
// Mengambil foto riil dari database bila ada; bila tidak ada foto riil, otomatis
// menghasilkan mock SVG on-demand dengan angka stand = standAwal periode berjalan
// dan periode = periode pembanding sehingga data pembanding sinkron dan terasa nyata.
import * as React from "react";
import { formatPeriode } from "@/features/public";
import { ambilList, ApiError } from "@/features/dashboard/shared/api/api-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PembacaanRingkas } from "../../types";
import { TabFoto } from "./TabFoto";
import { resolveFotoUrl } from "@/lib/foto-resolver";

function thblDariIso(iso: string): number {
  const d = new Date(iso);
  return d.getUTCFullYear() * 100 + (d.getUTCMonth() + 1);
}

export function hitungPeriodeSebelum(periode: number | string): number {
  const num = typeof periode === "number" ? periode : parseInt(periode, 10);
  if (isNaN(num)) return 202512;
  const th = Math.floor(num / 100);
  const bl = num % 100;
  if (bl <= 1) {
    return (th - 1) * 100 + 12;
  }
  return th * 100 + (bl - 1);
}

export interface FotoSebelumnyaProps {
  pelangganId?: string | null;
  nomorLangganan?: string | null;
  /** Periode laporan yang sedang diperiksa (thbl, mis. 202601). */
  periode: number;
  /** Stand awal bulan berjalan (yang merupakan stand akhir bulan sebelumnya). */
  standAwal?: number | null;
  nama?: string | null;
  rute?: string | null;
}

export function FotoSebelumnya({
  pelangganId,
  nomorLangganan,
  periode,
  standAwal,
  nama,
  rute,
}: FotoSebelumnyaProps) {
  const [row, setRow] = React.useState<PembacaanRingkas | null | undefined>(
    undefined
  );
  const [galat, setGalat] = React.useState<string | null>(null);

  React.useEffect(() => {
    const idTarget = pelangganId || nomorLangganan;
    if (!idTarget) {
      setRow(null);
      return;
    }
    let batal = false;
    ambilList<PembacaanRingkas>("/pembacaan", {
      pelangganId: idTarget,
      pageSize: 6,
    })
      .then(({ rows }) => {
        if (batal) return;
        setRow(rows.find((r) => thblDariIso(r.periode) < periode) ?? null);
      })
      .catch((err) => {
        if (!batal)
          setGalat(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat foto pembanding."
          );
      });
    return () => {
      batal = true;
    };
  }, [pelangganId, nomorLangganan, periode]);

  if (galat) return <p className="text-copy-13 text-destructive">{galat}</p>;
  if (row === undefined) {
    return (
      <div className="flex flex-col gap-2 p-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Tentukan periode pembanding dan angka stand
  const thbl = row ? thblDariIso(row.periode) : hitungPeriodeSebelum(periode);
  const standLalu = row?.standAkhir ?? standAwal ?? 0;
  const nolgTarget = nomorLangganan || pelangganId || "01020001";
  const periodeStr = String(thbl);

  // Ambil foto dari database; bila null/kosong, resolveFotoUrl otomatis menghasilkan
  // mock SVG interaktif yang selaras dengan data stand awal dan periode pembanding
  const fotoStand = resolveFotoUrl({
    realUrl: row?.fotoBukti,
    nolg: nolgTarget,
    jenis: "stand",
    stand: standLalu,
    periode: periodeStr,
    nama: nama ?? undefined,
    rute: rute ?? undefined,
  });

  const fotoSegel = resolveFotoUrl({
    realUrl: row?.fotoSegelUrl,
    nolg: nolgTarget,
    jenis: "segel",
    stand: standLalu,
    periode: periodeStr,
    nama: nama ?? undefined,
    rute: rute ?? undefined,
  });

  const fotoRumah = resolveFotoUrl({
    realUrl: row?.fotoRumahUrl,
    nolg: nolgTarget,
    jenis: "rumah",
    stand: standLalu,
    periode: periodeStr,
    nama: nama ?? undefined,
    rute: rute ?? undefined,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <TabFoto
        varian="panel"
        item={[
          {
            kunci: "stand",
            label: "Stand meter",
            url: fotoStand,
            keteranganKosong: `Foto meter periode ${formatPeriode(thbl)} tidak tersedia.`,
          },
          {
            kunci: "segel",
            label: "Segel",
            url: fotoSegel,
            keteranganKosong: `Foto segel periode ${formatPeriode(thbl)} tidak tersedia.`,
          },
          {
            kunci: "rumah",
            label: "Rumah",
            url: fotoRumah,
            keteranganKosong: `Foto rumah periode ${formatPeriode(thbl)} tidak tersedia.`,
          },
        ]}
      />
    </div>
  );
}
