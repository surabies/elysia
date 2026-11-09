import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "../lib/format";
import type { OfficerProductivity } from "@/server/services/dashboard/analytics.service";

const HEAD = "h-7 px-1 py-1 text-[10px] uppercase tracking-wide text-muted-foreground";
const NUM = "px-1 py-1.5 text-right font-mono tabular-nums";

export function OfficerProductivityTable({
  data,
}: {
  data: OfficerProductivity[];
}) {
  return (
    <section
      aria-labelledby="officer-productivity-title"
      className="w-full rounded-[10px] border border-border bg-card p-4"
    >
      <h2
        id="officer-productivity-title"
        className="pb-3 text-sm font-semibold tracking-tight text-foreground"
      >
        Produktivitas & Ranking Petugas Lapangan
      </h2>

      <Table className="min-w-95 text-xs">
        <TableCaption className="sr-only">
          Peringkat petugas lapangan berdasarkan jumlah meter terbaca
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={HEAD}>Petugas</TableHead>
            <TableHead className={`${HEAD} text-right`}>Terbaca</TableHead>
            <TableHead className={`${HEAD} text-right`}>Kubikasi</TableHead>
            <TableHead className={`${HEAD} text-right`}>Beban</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((officer) => (
            <TableRow key={officer.kodepetugas} className="hover:bg-muted/30">
              <TableCell className="max-w-0 px-1 py-1.5 font-medium text-foreground">
                <span className="block truncate">{officer.nama}</span>
              </TableCell>
              <TableCell className={`${NUM} font-semibold text-foreground`}>
                {formatNumber(officer.totalBaca)} SL
              </TableCell>
              <TableCell className={`${NUM} text-muted-foreground`}>
                {formatNumber(officer.totalKubikasi)} m³
              </TableCell>
              <TableCell className={`${NUM} text-muted-foreground`}>
                {officer.persentaseBeban}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
