// Kartu rincian pencatatan: periode, kondisi, petugas, waktu, biaya, dan koordinat.
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LABEL_KONDISI_CATAT } from "@/components/tanstacktable/lib/label-pencatatan";
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
    <Card className="rounded-lg border-border/80 bg-card shadow-none">
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 shrink-0 text-foreground/80 stroke-[1.5]" />
          <CardTitle className="text-[15px] sm:text-[16px] font-medium tracking-tight text-foreground">
            Rincian Pencatatan
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5 pt-0">
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
      </CardContent>
    </Card>
  );
}
