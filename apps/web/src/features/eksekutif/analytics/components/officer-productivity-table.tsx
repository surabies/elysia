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
import { formatNumber } from "../lib/format";
import type { OfficerProductivity } from "@/server/services/dashboard/analytics.service";

export function OfficerProductivityTable({
  data,
}: {
  data: OfficerProductivity[];
}) {
  const maxBeban = Math.max(...data.map((d) => d.persentaseBeban), 1);

  return (
    <Card className="overflow-hidden rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="border-b border-border p-5 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                Performa Personel Petugas Cater
              </CardTitle>
              <Badge variant="gray-subtle" size="sm">
                {data.length} Petugas
              </Badge>
            </div>
            <CardDescription className="mt-0.5 text-[12.5px]">
              Peringkat volume pembacaan meter, kubikasi tercatat, temuan anomali, dan porsi beban kerja.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[42rem]">
            <TableHeader className="bg-(--ds-gray-100)/60 border-b border-border dark:bg-(--ds-gray-200)/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 py-2.5 text-center text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
                  Rank
                </TableHead>
                <TableHead className="py-2.5 text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
                  Petugas Lapangan
                </TableHead>
                <TableHead className="py-2.5 text-right text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
                  Meter Terbaca
                </TableHead>
                <TableHead className="py-2.5 text-right text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
                  Total Kubikasi
                </TableHead>
                <TableHead className="py-2.5 text-right text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
                  Temuan Anomali
                </TableHead>
                <TableHead className="py-2.5 pr-5 text-right text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
                  Porsi Beban Kerja
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-copy-13 text-muted-foreground"
                  >
                    Belum ada data pembacaan petugas pada periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((officer, index) => {
                  const anomaliRatio =
                    officer.totalBaca > 0
                      ? (officer.anomaliCount / officer.totalBaca) * 100
                      : 0;
                  const anomaliVariant =
                    officer.anomaliCount === 0
                      ? "green-subtle"
                      : anomaliRatio >= 5
                        ? "red-subtle"
                        : "amber-subtle";
                  const barWidth = Math.max(
                    (officer.persentaseBeban / maxBeban) * 100,
                    officer.persentaseBeban > 0 ? 4 : 0
                  );

                  return (
                    <TableRow
                      key={officer.kodepetugas}
                      className="transition-colors hover:bg-(--ds-gray-100)/60 dark:hover:bg-(--ds-gray-200)/30"
                    >
                      <TableCell className="py-2.5 text-center">
                        {index === 0 ? (
                          <Badge variant="inverted" size="sm" className="min-w-6 font-mono">
                            1
                          </Badge>
                        ) : index < 3 ? (
                          <Badge variant="gray-subtle" size="sm" className="min-w-6 font-mono">
                            {index + 1}
                          </Badge>
                        ) : (
                          <span className="font-mono text-label-12 tabular-nums text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-2.5">
                        <span className="text-label-13 font-medium text-foreground">
                          {officer.nama || officer.kodepetugas}
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 text-right font-mono text-label-13 font-medium tabular-nums text-foreground">
                        {formatNumber(officer.totalBaca)}{" "}
                        <span className="font-sans text-label-11 font-normal text-muted-foreground">
                          SL
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 text-right font-mono text-label-13 tabular-nums text-muted-foreground">
                        {formatNumber(officer.totalKubikasi)}{" "}
                        <span className="font-sans text-label-11 text-muted-foreground/75">
                          m³
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 text-right">
                        <Badge variant={anomaliVariant} size="sm">
                          {officer.anomaliCount > 0
                            ? `${formatNumber(officer.anomaliCount)} Kasus`
                            : "Bersih"}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-2.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-(--ds-gray-200)">
                            <div
                              className="h-full rounded-full bg-(--ds-blue-700) transition-all duration-300"
                              style={{ width: `${Math.min(barWidth, 100)}%` }}
                            />
                          </div>
                          <span className="min-w-[3.25rem] text-right font-mono text-label-12 font-medium tabular-nums text-foreground">
                            {officer.persentaseBeban.toLocaleString("id-ID", {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })}
                            %
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
