import {
  Table,
  TableBody,
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
    <div className="overflow-hidden rounded-lg border border-border/80 bg-card/60 backdrop-blur-xs shadow-none">
      <div className="overflow-x-auto">
        <Table className="min-w-[42rem]">
          <TableHeader className="bg-muted/30 border-b border-border/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-14 text-center py-3 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Rank
              </TableHead>
              <TableHead className="py-3 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Petugas Lapangan
              </TableHead>
              <TableHead className="text-right py-3 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Meter Terbaca
              </TableHead>
              <TableHead className="text-right py-3 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Kubikasi
              </TableHead>
              <TableHead className="text-right py-3 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Temuan Anomali
              </TableHead>
              <TableHead className="text-right py-3 font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Porsi Beban Kerja
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {data.map((officer, index) => {
              const isTop3 = index < 3;
              return (
                <TableRow
                  key={officer.kodepetugas}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="text-center py-2.5">
                    {isTop3 ? (
                      <span className="inline-flex size-5.5 items-center justify-center rounded-full bg-muted font-mono text-[11px] font-bold text-foreground border border-border/80">
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-label-12-mono tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-label-13 text-foreground">
                        {officer.nama}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                        {officer.kodepetugas}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right text-label-13-mono tabular-nums text-foreground py-2.5 font-medium">
                    {formatNumber(officer.totalBaca)}{" "}
                    <span className="text-muted-foreground text-[11px]">SL</span>
                  </TableCell>

                  <TableCell className="text-right text-label-13-mono tabular-nums text-muted-foreground py-2.5">
                    {formatNumber(officer.totalKubikasi)}{" "}
                    <span className="text-muted-foreground/70 text-[11px]">m³</span>
                  </TableCell>

                  <TableCell className="text-right py-2.5">
                    {officer.anomaliCount > 0 ? (
                      <Badge
                        variant="outline"
                        size="sm"
                        className="font-mono text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5"
                      >
                        {formatNumber(officer.anomaliCount)} Kasus
                      </Badge>
                    ) : (
                      <span className="text-label-12 text-muted-foreground font-mono">-</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right py-2.5">
                    <div className="flex items-center justify-end gap-2.5">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted/80">
                        <div
                          className="h-full rounded-full bg-foreground/80 transition-all duration-500"
                          style={{
                            width: `${Math.min(officer.persentaseBeban * 5, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-label-12 tabular-nums text-foreground min-w-[3.2rem]">
                        {officer.persentaseBeban}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
