// features/dashboard/import/components/ImportRNomorView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImportHeader } from "./ImportHeader";
import {
  UserMinus,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  FileText,
} from "lucide-react";

interface RNomorRow {
  nolg: string;
  nama: string;
  alamat: string;
  tglPutus: string;
  nomorBa: string;
  standCabut: number;
  alasan: string;
}

const SAMPLE_R_NOMOR: RNomorRow[] = [
  {
    nolg: "101900821",
    nama: "YUYUN YUNINGSIH",
    alamat: "JL.PURNAWARMAN NO 4A RT.02/05",
    tglPutus: "2026-01-20",
    nomorBa: "BA-PUTUS/2026/01/014",
    standCabut: 138,
    alasan: "Permintaan Pelanggan (Rumah Kosong / Dijual)",
  },
  {
    nolg: "403100658",
    nama: "WAHYUDIN",
    alamat: "GG.MOCH.RAMDHAN II 47/97 RT.03/09",
    tglPutus: "2026-01-22",
    nomorBa: "BA-PUTUS/2026/01/089",
    standCabut: 62,
    alasan: "Tunggakan Rekening Air > 3 Bulan (Penyegelan Resmi)",
  },
  {
    nolg: "800800844",
    nama: "PAUD TAMAN CERIA",
    alamat: "GG. BANCEUY NO 51 RT.04/07",
    tglPutus: "2026-01-25",
    nomorBa: "BA-PUTUS/2026/01/102",
    standCabut: 94,
    alasan: "Pindah Lokasi Bangunan / Renovasi Total",
  },
];

export function ImportRNomorView() {
  const [items, setItems] = React.useState<RNomorRow[]>(SAMPLE_R_NOMOR);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [resultStats, setResultStats] = React.useState<{
    total: number;
    sukses: number;
    gagal: number;
  } | null>(null);

  const handleImport = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/import/r-nomor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            nolg: i.nolg,
            tglPutus: i.tglPutus,
            nomorBa: i.nomorBa,
            standCabut: i.standCabut,
            alasan: i.alasan,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses pemutusan R-Nomor.");
      }

      setResultStats({
        total: json.data?.total ?? items.length,
        sukses: json.data?.sukses ?? items.length,
        gagal: json.data?.gagal ?? 0,
      });

      toast.success(
        `Berhasil memproses pemutusan untuk ${json.data?.sukses ?? items.length} rekening R-Nomor!`,
      );
    } catch (err: any) {
      toast.error(
        err.message || "Terjadi kesalahan saat memproses pemutusan R-Nomor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setItems(SAMPLE_R_NOMOR);
    setResultStats(null);
    toast.info("Daftar simulasi pemutusan R-Nomor dimuat ulang.");
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Halaman */}
      <ImportHeader
        title="Import R Nomor (Pemutusan Sambungan)"
        badge="Administrasi Rekening Non-aktif"
        description="Pencatatan daftar pelanggan yang telah diputus fisik atau administrasi (R Nomor). Sistem secara otomatis memperbarui status pelanggan menjadi non-aktif, mencatat stand cabut akhir, dan mengeluarkan dari DPM periode mendatang."
        icon={UserMinus}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSubmitting}
              className="h-8 text-label-12 cursor-pointer"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Reset Contoh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleImport}
              disabled={isSubmitting || items.length === 0}
              className="h-8 px-3 text-label-12 font-semibold gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              <ShieldAlert className="mr-1.5 size-4" />
              {isSubmitting ? "Memproses..." : "Eksekusi Pemutusan (R)"}
            </Button>
          </div>
        }
      />

      {/* 2. Notifikasi Hasil Pemrosesan */}
      {resultStats && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-rose-800 dark:text-rose-200">
                  Pemutusan R-Nomor Selesai Diproses
                </span>
                <Badge className="bg-rose-600 text-white font-mono text-[10px]">
                  Batch Selesai
                </Badge>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Total {resultStats.total} pelanggan: {resultStats.sukses}{" "}
                status diubah menjadi NON AKTIF (R), {resultStats.gagal}{" "}
                gagal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Badge className="bg-rose-600 text-white">Status: Diputus</Badge>
          </div>
        </div>
      )}

      {/* 3. Kartu Statistik / Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-border bg-card p-3.5 transition-colors hover:border-border/80">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Total Rekening</span>
              <FileText className="size-4 text-primary" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {items.length.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">Rekening</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              <span>Rekening siap diproses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-border/80">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Status Aktif</span>
              <UserMinus className="size-4 text-primary" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {items.length.toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">Diajukan</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary" />
              <span>Pemutusan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-amber-500/30">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Tanggal Awal</span>
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {items[0]?.tglPutus || "-"}
              </span>
              <span className="text-label-11 text-muted-foreground">Terdekat</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-amber-500" />
              <span>Pemutusan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card p-3.5 transition-colors hover:border-rose-500/30 col-span-2 sm:col-span-1">
          <CardContent className="p-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-label-11 font-medium tracking-wide uppercase">Stand Cabut</span>
              <ShieldAlert className="size-4 text-rose-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
                {items.reduce((sum, i) => sum + i.standCabut, 0).toLocaleString("id-ID")}
              </span>
              <span className="text-label-11 text-muted-foreground">m³</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-rose-500" />
              <span>Total stand akhir pengangkatan</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Area Tabel Daftar Rekening */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-label-12">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              {items.length} Rekening Siap Cabut
            </span>
            <span>·</span>
            <span className="text-muted-foreground">
              Verifikasi nomor Berita Acara (BA)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-rose-500 font-medium">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b font-medium">
              <tr>
                <th className="py-2.5 px-3">No. Langganan</th>
                <th className="py-2.5 px-3">Nama Pelanggan</th>
                <th className="py-2.5 px-3">Alamat Sambungan</th>
                <th className="py-2.5 px-3">Tanggal Putus</th>
                <th className="py-2.5 px-3">Nomor BA</th>
                <th className="py-2.5 px-3">Stand Cabut</th>
                <th className="py-2.5 px-3">Alasan Pemutusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((row) => (
                <tr key={row.nolg} className="transition-colors hover:bg-muted/30 font-mono">
                  <td className="py-2 px-3 font-medium text-foreground">
                    {row.nolg}
                  </td>
                  <td className="py-2 px-3 font-medium">{row.nama}</td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {row.alamat}
                  </td>
                  <td className="py-2 px-3">{row.tglPutus}</td>
                  <td className="py-2 px-3 font-mono text-xs">
                    {row.nomorBa}
                  </td>
                  <td className="py-2 px-3 font-semibold text-rose-600 dark:text-rose-400">
                    {row.standCabut} m³
                  </td>
                  <td
                    className="max-w-65 truncate px-3 py-2 text-muted-foreground"
                    title={row.alasan}
                  >
                    {row.alasan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
