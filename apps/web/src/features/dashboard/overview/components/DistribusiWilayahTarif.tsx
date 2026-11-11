"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, Layers, PieChart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  TarifStat,
  WilayahStat,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka, formatRupiah } from "../lib/format-ringkasan";

interface DistribusiWilayahTarifProps {
  wilayah: WilayahStat[];
  tarif: TarifStat[];
}

type MetrikWilayah = "pelanggan" | "konsumsi" | "rupiah";

export function DistribusiWilayahTarif({
  wilayah,
  tarif,
}: DistribusiWilayahTarifProps) {
  const [metrikPilihan, setMetrikPilihan] = React.useState<MetrikWilayah>("pelanggan");

  // Hitung total untuk menghitung persentase dinamis
  const totalNilai = React.useMemo(() => {
    return {
      pelanggan: wilayah.reduce((acc, curr) => acc + curr.totalPelanggan, 0),
      konsumsi: wilayah.reduce((acc, curr) => acc + curr.totalPakaiM3, 0),
      rupiah: wilayah.reduce((acc, curr) => acc + curr.totalRupiah, 0),
    };
  }, [wilayah]);

  const totalTarifPelanggan = React.useMemo(() => {
    return tarif.reduce((acc, curr) => acc + curr.totalPelanggan, 0);
  }, [tarif]);

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      {/* KARTU 1: Sebaran Wilayah Pelayanan */}
      <Card className="min-w-0 rounded-lg border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle>Sebaran Wilayah Pelayanan</CardTitle>
                <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                  4 Wilayah
                </Badge>
              </div>
              <CardDescription className="mt-0.5">
                Distribusi beban pelanggan, konsumsi air, dan nilai tagihan per wilayah kerja.
              </CardDescription>
            </div>

            {/* Metrik View Switcher (Vercel Tabs) */}
            <div className="inline-flex shrink-0 items-center rounded-md border border-border/60 bg-muted/40 p-0.5 text-label-12">
              <button
                type="button"
                onClick={() => setMetrikPilihan("pelanggan")}
                className={`rounded px-2.5 py-1 font-medium transition-all ${
                  metrikPilihan === "pelanggan"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SL
              </button>
              <button
                type="button"
                onClick={() => setMetrikPilihan("konsumsi")}
                className={`rounded px-2.5 py-1 font-medium transition-all ${
                  metrikPilihan === "konsumsi"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                m³
              </button>
              <button
                type="button"
                onClick={() => setMetrikPilihan("rupiah")}
                className={`rounded px-2.5 py-1 font-medium transition-all ${
                  metrikPilihan === "rupiah"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rp
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5 pt-2">
          {wilayah.map((item) => {
            let nilaiDisplay = `${formatAngka(item.totalPelanggan)} SL`;
            let subDisplay = `Konsumsi: ${formatAngka(item.totalPakaiM3)} m³ • ${formatRupiah(item.totalRupiah)}`;
            let persen = 0;

            if (metrikPilihan === "pelanggan") {
              persen = totalNilai.pelanggan > 0 ? Math.round((item.totalPelanggan / totalNilai.pelanggan) * 100) : 0;
            } else if (metrikPilihan === "konsumsi") {
              persen = totalNilai.konsumsi > 0 ? Math.round((item.totalPakaiM3 / totalNilai.konsumsi) * 100) : 0;
              nilaiDisplay = `${formatAngka(item.totalPakaiM3)} m³`;
              subDisplay = `${formatAngka(item.totalPelanggan)} Pelanggan • ${formatRupiah(item.totalRupiah)}`;
            } else {
              persen = totalNilai.rupiah > 0 ? Math.round((item.totalRupiah / totalNilai.rupiah) * 100) : 0;
              nilaiDisplay = formatRupiah(item.totalRupiah);
              subDisplay = `${formatAngka(item.totalPelanggan)} Pelanggan • ${formatAngka(item.totalPakaiM3)} m³`;
            }

            return (
              <div key={item.kode} className="group space-y-1.5">
                <div className="flex flex-col gap-1 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                      WIL-{item.kode}
                    </span>
                    <span className="text-label-13 font-medium text-foreground">
                      {item.nama}
                    </span>
                  </div>
                  <div className="tabular-nums text-muted-foreground sm:text-right">
                    <span className="font-medium text-foreground">{nilaiDisplay}</span>{" "}
                    <span className="font-mono text-label-12 text-muted-foreground/80">({persen}%)</span>
                  </div>
                </div>

                {/* Progress Bar dengan aksen dinamis */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                  <div
                    className="h-full rounded-full bg-foreground/80 transition-all duration-500 ease-out group-hover:bg-foreground"
                    style={{ width: `${Math.min(persen, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-copy-12 text-muted-foreground">
                  <span className="truncate">{subDisplay}</span>
                  <Link
                    href={`/pelanggan?wilayah=${item.kode}`}
                    className="ml-2 inline-flex items-center gap-0.5 text-label-12 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>Detail</span>
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* KARTU 2: Distribusi Golongan Tarif */}
      <Card className="min-w-0 rounded-lg border-border/80 bg-card shadow-none">
        <CardHeader className="p-5 pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle>Golongan Tarif Pelanggan</CardTitle>
                <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                  {tarif.length} Golongan
                </Badge>
              </div>
              <CardDescription className="mt-0.5">
                Struktur pelanggan & tagihan berdasarkan kategori tarif aktif PDAM STI.
              </CardDescription>
            </div>
            <Layers className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>

        <CardContent className="min-w-0 p-5 pt-2">
          <div className="max-h-[310px] overflow-auto rounded-md border border-border/50">
            <Table className="min-w-[32rem]">
              <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur-xs">
                <TableRow>
                  <TableHead className="py-2.5">Golongan Tarif</TableHead>
                  <TableHead className="py-2.5 text-right">Pelanggan</TableHead>
                  <TableHead className="py-2.5 text-right">Konsumsi Air</TableHead>
                  <TableHead className="py-2.5 text-right">Nilai Tagihan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarif.map((item) => {
                  const sharePct = totalTarifPelanggan > 0
                    ? Math.round((item.totalPelanggan / totalTarifPelanggan) * 100)
                    : 0;

                  return (
                    <TableRow key={item.kode} className="transition-colors hover:bg-muted/40">
                      <TableCell className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-foreground">
                            {item.kode}
                          </span>
                          <span className="text-label-13 text-muted-foreground truncate max-w-[140px]" title={item.nama}>
                            {item.nama}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-right tabular-nums">
                        <span className="font-medium text-foreground">
                          {formatAngka(item.totalPelanggan)}
                        </span>
                        {sharePct > 0 && (
                          <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                            {sharePct}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                        {formatAngka(item.totalPakaiM3)} m³
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono text-[12px] font-medium tabular-nums text-foreground">
                        {formatRupiah(item.totalRupiah)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
