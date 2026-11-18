// Kartu rincian pencatatan: periode, kondisi, petugas, waktu, biaya, dan koordinat.
import { LABEL_KONDISI_CATAT } from "@/features/dashboard/verifikasi/lib/label-pencatatan";
import { BarisInfo, DaftarInfo } from "./BarisInfo";
import { fmtPeriode, fmtRupiah, fmtTeks, fmtWaktu } from "../lib/format-tampilan";
import type { DataCatat } from "../types";

export function RincianCatat({
  catat,
  lokasi,
}: {
  catat: DataCatat;
  lokasi: { lat: number; lng: number } | null;
}) {
  const kondisi = catat.kondisi
    ? ((LABEL_KONDISI_CATAT as Record<string, string>)[catat.kondisi] ??
      catat.kondisi)
    : null;

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Rincian Pencatatan
      </h3>
      <DaftarInfo>
        <BarisInfo label="Periode">{fmtPeriode(catat.periode)}</BarisInfo>
        {kondisi && <BarisInfo label="Kondisi">{kondisi}</BarisInfo>}
        <BarisInfo label="Petugas">{fmtTeks(catat.petugas)}</BarisInfo>
        {catat.kodeRute && (
          <BarisInfo label="Kode rute">{catat.kodeRute}</BarisInfo>
        )}
        <BarisInfo label="Dicatat">{fmtWaktu(catat.waktuCatat)}</BarisInfo>
        {catat.waktuUpload && (
          <BarisInfo label="Diunggah">{fmtWaktu(catat.waktuUpload)}</BarisInfo>
        )}
        {catat.biaya != null && (
          <BarisInfo label="Biaya">{fmtRupiah(catat.biaya)}</BarisInfo>
        )}
        {lokasi && (
          <BarisInfo label="Koordinat" mono>
            {lokasi.lat.toFixed(6)}, {lokasi.lng.toFixed(6)}
          </BarisInfo>
        )}
      </DaftarInfo>
    </div>
  );
}
