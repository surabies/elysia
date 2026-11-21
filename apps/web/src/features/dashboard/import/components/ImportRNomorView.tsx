// features/dashboard/import/components/ImportRNomorView.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
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
  Upload,
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
      {/* 1. Header */}
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
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Reset Contoh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleImport}
              disabled={isSubmitting || items.length === 0}
            >
              <ShieldAlert className="mr-1.5 size-4" />
              {isSubmitting ? "Memproses..." : "Eksekusi Pemutusan (R)"}
            </Button>
          </div>
        }
      />

      {/* 2. Notifikasi Hasil Pemrosesan */}
      {resultStats && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-rose-500" />
              <div>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  Pemutusan R-Nomor Selesai Diproses
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {resultStats.total} pelanggan: {resultStats.sukses}{" "}
                  status diubah menjadi NON AKTIF (R), {resultStats.gagal}{" "}
                  gagal.
                </p>
              </div>
            </div>
            <Badge className="bg-rose-600 text-white">Status: Diputus</Badge>
          </CardContent>
        </Card>
      )}

      {/* 3. Kartu Ringkasan */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Rekening</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{items.length.toLocaleString("id-ID")}</div>
            <p className="text-[11px] text-muted-foreground">Rekening siap diproses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Status Aktif</CardTitle>
            <UserMinus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {items.length.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-muted-foreground">Diajukan pemutusan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Tanggal Awal</CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {items[0]?.tglPutus || "-"}
            </div>
            <p className="text-[11px] text-muted-foreground">Pemutusan terdekat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Stand Cabut</CardTitle>
            <ShieldAlert className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {items.reduce((sum, i) => sum + i.standCabut, 0).toLocaleString("id-ID")} m³
            </div>
            <p className="text-[11px] text-muted-foreground">Total stand akhir pengangkatan</p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tabel Daftar Rekening */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">
                Daftar Rekening yang Diajukan Pemutusan (R Nomor)
              </CardTitle>
              <CardDescription>
                Verifikasi nomor Berita Acara (BA) pemutusan dan stand akhir
                pengangkatan water meter.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-rose-500 font-medium">
              <AlertTriangle className="size-4" />
              <span>{items.length} Rekening Siap Cabut</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border/50">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/50 bg-muted/40 font-medium text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">No. Langganan</th>
                  <th className="px-3 py-2.5">Nama Pelanggan</th>
                  <th className="px-3 py-2.5">Alamat Sambungan</th>
                  <th className="px-3 py-2.5">Tanggal Putus</th>
                  <th className="px-3 py-2.5">Nomor BA</th>
                  <th className="px-3 py-2.5">Stand Cabut</th>
                  <th className="px-3 py-2.5">Alasan Pemutusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {items.map((row) => (
                  <tr key={row.nolg} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono font-medium text-foreground">
                      {row.nolg}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.nama}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.alamat}
                    </td>
                    <td className="px-3 py-2">{row.tglPutus}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {row.nomorBa}
                    </td>
                    <td className="px-3 py-2 font-semibold text-rose-600 dark:text-rose-400">
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
        </CardContent>
      </Card>
    </div>
  );
}
