"use client";

import * as React from "react";
import { formatBulanSingkat } from "@/features/public/lib/Format";
import { ambilList, ApiError } from "@/features/dashboard/shared/api/ApiDashboard";
import type {
  PembacaanPanelRingkas,
  PembacaanRingkas,
} from "../types/TipeVerifikasi";

function angka(nilai: number | null | undefined) {
  return nilai == null ? "—" : nilai.toLocaleString("id-ID");
}

export function HistoriPemakaian({
  pelangganId,
  terkini,
  catatan,
}: {
  pelangganId: string | null | undefined;
  terkini: PembacaanPanelRingkas;
  catatan?: string;
}) {
  const [rows, setRows] = React.useState<PembacaanRingkas[] | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pelangganId) return;
    let batal = false;
    ambilList<PembacaanRingkas>("/pembacaan", {
      pelangganId,
      periodeSebelum: terkini.periode,
      pageSize: 3,
    })
      .then(({ rows }) => {
        if (!batal) setRows(rows);
      })
      .catch((err) => {
        if (!batal) {
          setGalat(
            err instanceof ApiError ? err.message : "Gagal memuat histori.",
          );
        }
      });
    return () => {
      batal = true;
    };
  }, [pelangganId, terkini.periode]);

  const histori = rows ? [...rows].reverse() : [];

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <table className="w-full table-fixed border-collapse text-copy-13 tabular-nums">
          <thead className="text-muted-foreground">
            <tr>
              <th scope="col" className="w-[4.25rem] px-1.5 py-1 text-left text-label-12 font-medium">
                Periode
              </th>
              <th scope="col" className="whitespace-normal px-1 py-1 text-center text-label-12 leading-tight font-medium">
                Stand Awal
              </th>
              <th scope="col" className="whitespace-normal px-1 py-1 text-center text-label-12 leading-tight font-medium">
                Stand Akhir
              </th>
              <th scope="col" className="w-12 px-1 py-1 text-center text-label-12 font-medium">
                Pakai
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr className="bg-accent/40 font-medium text-foreground">
              <th scope="row" className="px-1.5 py-1 text-left font-medium">
                {formatPeriodeRingkas(terkini.periode)}
              </th>
              <td className="px-1 py-1 text-center">
                {angka(terkini.standAwal)}
              </td>
              <td className="px-1 py-1 text-center">
                {angka(terkini.standAkhir)}
              </td>
              <td className="px-1 py-1 text-center">{angka(terkini.pakai)}</td>
            </tr>
            {histori.map((row) => {
              const periode = new Date(row.periode);
              const thbl =
                periode.getUTCFullYear() * 100 + periode.getUTCMonth() + 1;
              return (
                <tr key={row.id} className="text-muted-foreground">
                  <th scope="row" className="px-1.5 py-1 text-left font-normal">
                    {formatPeriodeRingkas(thbl)}
                  </th>
                  <td className="px-1 py-1 text-center">{angka(row.standLalu)}</td>
                  <td className="px-1 py-1 text-center">
                    {angka(row.standAkhir)}
                  </td>
                  <td className="px-1 py-1 text-center">
                    {angka(row.pemakaianM3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
      </table>
      {catatan && (
        <p className="text-label-11 text-muted-foreground">{catatan}</p>
      )}
      {!pelangganId && (
        <p className="text-label-12 text-muted-foreground">
          Belum ada histori pembacaan resmi.
        </p>
      )}
      {pelangganId && rows === null && !galat && (
        <p className="text-label-12 text-muted-foreground">
          Memuat histori pembacaan…
        </p>
      )}
      {galat && <p className="text-label-12 text-destructive">{galat}</p>}
      {pelangganId && rows?.length === 0 && (
        <p className="text-label-12 text-muted-foreground">
          Belum ada histori pembacaan resmi.
        </p>
      )}
    </div>
  );
}

function formatPeriodeRingkas(thbl: number) {
  return `${formatBulanSingkat(thbl)} '${String(Math.floor(thbl / 100)).slice(-2)}`;
}
