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
import { IconTile } from "@/components/reui/icon-tile";
import type {
  TarifStat,
  WilayahStat,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka, formatRupiah } from "./format-ringkasan";

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
        <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="font-semibold tracking-tight">
                Sebaran Wilayah Pelayanan
              </CardTitle>
              <CardDescription className="mt-0.5">
                Distribusi pelanggan, konsumsi air, dan nilai DRD per wilayah
                kerja.
              </CardDescription>
            </div>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Building2 />
            </IconTile>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 p-4 pt-2 sm:p-5 sm:pt-2">
          {wilayah.map((item) => (
            <div key={item.kode} className="space-y-1.5">
              <div className="flex flex-col gap-1 text-copy-13 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 font-medium text-foreground">
                  Wilayah {item.kode} &bull; {item.nama}
                </span>
                <span className="text-muted-foreground sm:shrink-0 sm:text-right">
                  <strong className="text-foreground">
                    {formatAngka(item.totalPelanggan)} SL
                  </strong>{" "}
                  ({item.persentasePelanggan}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-foreground/75 transition-all duration-300"
                  style={{ width: `${item.persentasePelanggan}%` }}
                />
              </div>
              <div className="flex flex-col gap-0.5 text-copy-13 text-muted-foreground sm:flex-row sm:justify-between">
                <span>Konsumsi: {formatAngka(item.totalPakaiM3)} m³</span>
                <span className="font-mono font-medium text-foreground sm:text-right">
                  {formatRupiah(item.totalRupiah)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="font-semibold tracking-tight">
                Golongan Tarif Pelanggan Dominan
              </CardTitle>
              <CardDescription className="mt-0.5">
                Struktur langganan berdasarkan kategori tarif aktif PDAM STI.
              </CardDescription>
            </div>
            <IconTile
              aria-hidden="true"
              size="sm"
              variant="frame"
              className="text-muted-foreground"
            >
              <Layers />
            </IconTile>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 p-4 pt-2 sm:p-5 sm:pt-2">
          <Table className="min-w-[35rem]">
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase tracking-wider text-muted-foreground">
                  Golongan
                </TableHead>
                <TableHead className="text-right uppercase tracking-wider text-muted-foreground">
                  Pelanggan
                </TableHead>
                <TableHead className="text-right uppercase tracking-wider text-muted-foreground">
                  Pemakaian
                </TableHead>
                <TableHead className="text-right uppercase tracking-wider text-muted-foreground">
                  Tagihan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tarif.map((item) => (
                <TableRow key={item.kode}>
                  <TableCell className="py-2 pr-3">
                    <span className="font-medium text-foreground">
                      {item.nama}
                    </span>
                    <span className="ml-1.5 font-mono text-label-11 text-muted-foreground">
                      {item.kode}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">
                    {formatAngka(item.totalPelanggan)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatAngka(item.totalPakaiM3)} m³
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-foreground">
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
