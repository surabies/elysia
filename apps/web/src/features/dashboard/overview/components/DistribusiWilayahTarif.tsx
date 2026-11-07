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
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-semibold tracking-tight">
                Sebaran Wilayah Pelayanan
              </CardTitle>
              <CardDescription className="mt-0.5">
                Distribusi pelanggan, konsumsi air, dan nilai DRD per wilayah
                kerja.
              </CardDescription>
            </div>
            <Building2 className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5 p-5 pt-2">
          {wilayah.map((item) => (
            <div key={item.kode} className="space-y-1.5">
              <div className="flex items-center justify-between text-copy-13">
                <span className="font-medium text-foreground">
                  Wilayah {item.kode} &bull; {item.nama}
                </span>
                <span className="text-muted-foreground">
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
              <div className="flex justify-between text-copy-13 text-muted-foreground">
                <span>Konsumsi: {formatAngka(item.totalPakaiM3)} m³</span>
                <span className="font-mono font-medium text-foreground">
                  {formatRupiah(item.totalRupiah)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-semibold tracking-tight">
                Golongan Tarif Pelanggan Dominan
              </CardTitle>
              <CardDescription className="mt-0.5">
                Struktur langganan berdasarkan kategori tarif aktif PDAM STI.
              </CardDescription>
            </div>
            <Layers className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <Table>
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
