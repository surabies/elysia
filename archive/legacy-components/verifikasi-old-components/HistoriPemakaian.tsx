"use client";

import * as React from "react";
import { formatBulanSingkat } from "@/features/public";
import {
  ambilList,
  ApiError,
} from "@/features/dashboard/shared/api/api-dashboard";
import type {
  PembacaanPanelRingkas,
  PembacaanRingkas,
} from "../types";

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
    <div className="flex w-full min-w-0 flex-col gap-1 overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-copy-13 tabular-nums">
        <thead className="text-muted-foreground">
          <tr>
            <th
              scope="col"
              className="w-16 px-1 py-1 text-left text-label-12 font-medium"
            >
              Periode
            </th>
            <th
              scope="col"
              className="whitespace-normal px-1 py-1 text-center text-label-12 leading-tight font-medium"
            >
              Stand Awal
            </th>
            <th
              scope="col"
              className="whitespace-normal px-1 py-1 text-center text-label-12 leading-tight font-medium"
            >
              Stand Akhir
            </th>
            <th
              scope="col"
              className="w-11 px-1 py-1 text-center text-label-12 font-medium"
            >
              Pakai
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          <tr className="bg-accent/40 font-medium text-foreground">
            <th scope="row" className="px-1 py-1 text-left font-medium truncate">
              {formatPeriodeRingkas(terkini.periode)}
            </th>
            <td className="px-1 py-1 text-center truncate">
              {angka(terkini.standAwal)}
            </td>
            <td className="px-1 py-1 text-center truncate">
              {angka(terkini.standAkhir)}
            </td>
            <td className="px-1 py-1 text-center truncate">{angka(terkini.pakai)}</td>
          </tr>
          {histori.map((row) => {
            const periode = new Date(row.periode);
            const thbl =
              periode.getUTCFullYear() * 100 + periode.getUTCMonth() + 1;
            return (
              <tr key={row.id} className="text-muted-foreground">
                <th scope="row" className="px-1 py-1 text-left font-normal truncate">
                  {formatPeriodeRingkas(thbl)}
                </th>
                <td className="px-1 py-1 text-center truncate">
                  {angka(row.standLalu)}
                </td>
                <td className="px-1 py-1 text-center truncate">
                  {angka(row.standAkhir)}
                </td>
                <td className="px-1 py-1 text-center truncate">
                  {angka(row.pemakaianM3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {catatan && (
        <p className="text-label-11 text-muted-foreground break-words">{catatan}</p>
      )}
      {galat && <p className="text-label-12 text-destructive break-words">{galat}</p>}
    </div>
  );
}

function formatPeriodeRingkas(thbl: number) {
  return `${formatBulanSingkat(thbl)} '${String(Math.floor(thbl / 100)).slice(-2)}`;
}
