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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "../lib/format";
import type { OfficerProductivity } from "@/server/services/dashboard/analytics.service";

export function OfficerProductivityTable({
  data,
}: {
  data: OfficerProductivity[];
}) {
  return (
    <Card aria-labelledby="officer-productivity-title">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle id="officer-productivity-title">
              Produktivitas &amp; Peringkat Petugas Lapangan
            </CardTitle>
            <CardDescription className="mt-0.5">
              Performa pencatatan meter petugas lapangan berdasarkan jumlah sambungan terbaca dan porsi beban kerja.
            </CardDescription>
          </div>
          <Badge variant="subtle" size="md" className="tabular-nums">
            {data.length} Petugas
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        <Table className="min-w-105">
          <TableCaption className="sr-only">
            Peringkat petugas lapangan berdasarkan jumlah meter terbaca
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Petugas Lapangan</TableHead>
              <TableHead className="text-right">Meter Terbaca</TableHead>
              <TableHead className="text-right">Total Kubikasi</TableHead>
              <TableHead className="text-right">Porsi Beban</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((officer, index) => (
              <TableRow key={officer.kodepetugas}>
                <TableCell className="text-center text-label-12-mono tabular-nums text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="max-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-label-13 text-foreground">
                      {officer.nama}
                    </span>
                    <span className="shrink-0 text-label-12-mono text-muted-foreground">
                      {officer.kodepetugas}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                  {formatNumber(officer.totalBaca)} SL
                </TableCell>
                <TableCell className="text-right text-label-13-mono tabular-nums text-muted-foreground">
                  {formatNumber(officer.totalKubikasi)} m³
                </TableCell>
                <TableCell className="text-right text-label-13-mono tabular-nums text-foreground">
                  {officer.persentaseBeban}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
