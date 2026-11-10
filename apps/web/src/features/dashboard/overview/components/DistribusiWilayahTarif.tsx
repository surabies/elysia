import { Building2, Layers } from "lucide-react";
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
import type {
  TarifStat,
  WilayahStat,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka, formatRupiah } from "../lib/format-ringkasan";

interface DistribusiWilayahTarifProps {
  wilayah: WilayahStat[];
  tarif: TarifStat[];
}

export function DistribusiWilayahTarif({
  wilayah,
  tarif,
}: DistribusiWilayahTarifProps) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader className="p-5 pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Sebaran Wilayah Pelayanan</CardTitle>
              <CardDescription className="mt-0.5">
                Distribusi pelanggan, konsumsi air, dan nilai DRD per wilayah
                kerja.
              </CardDescription>
            </div>
            <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-2">
          {wilayah.map((item) => (
            <div key={item.kode} className="space-y-1.5">
              <div className="flex flex-col gap-1 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 text-label-13 text-foreground">
                  Wilayah {item.kode} &bull; {item.nama}
                </span>
                <span className="tabular-nums text-muted-foreground sm:shrink-0 sm:text-right">
                  <span className="text-label-13 text-foreground">
                    {formatAngka(item.totalPelanggan)} SL
                  </span>{" "}
                  ({item.persentasePelanggan}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--ds-gray-200)">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-300"
                  style={{ width: `${item.persentasePelanggan}%` }}
                />
              </div>
              <div className="flex flex-col gap-0.5 text-copy-12 text-muted-foreground sm:flex-row sm:justify-between">
                <span className="tabular-nums">
                  Konsumsi: {formatAngka(item.totalPakaiM3)} m³
                </span>
                <span className="text-label-12-mono tabular-nums text-foreground sm:text-right">
                  {formatRupiah(item.totalRupiah)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="p-5 pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Golongan Tarif Pelanggan Dominan</CardTitle>
              <CardDescription className="mt-0.5">
                Struktur langganan berdasarkan kategori tarif aktif PDAM STI.
              </CardDescription>
            </div>
            <Layers className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="min-w-0 p-5 pt-2">
          <Table className="min-w-[34rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Golongan</TableHead>
                <TableHead className="text-right">Pelanggan</TableHead>
                <TableHead className="text-right">Pemakaian</TableHead>
                <TableHead className="text-right">Tagihan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarif.map((item) => (
                <TableRow key={item.kode}>
                  <TableCell className="py-2 pr-3">
                    <span className="text-label-13 text-foreground">
                      {item.nama}
                    </span>
                    <span className="ml-2 text-label-12-mono text-muted-foreground">
                      {item.kode}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">
                    {formatAngka(item.totalPelanggan)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatAngka(item.totalPakaiM3)} m³
                  </TableCell>
                  <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                    {formatRupiah(item.totalRupiah)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
