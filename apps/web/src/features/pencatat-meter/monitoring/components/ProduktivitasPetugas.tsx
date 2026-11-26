import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PetugasProgress } from '../types';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

function formatVolume(value: number | string | null) {
  return `${Number(value ?? 0).toLocaleString('id-ID')} m³`;
}

export function ProduktivitasPetugas({
  month,
  onMonthChange,
  periodLabel,
  items,
  loading,
  error,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  periodLabel: string;
  items: PetugasProgress[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-heading-20">Produktivitas petugas</CardTitle>
          <CardDescription>
            Catatan, pemakaian, dan kelainan pada periode {periodLabel}.
          </CardDescription>
        </div>
        <div className="grid gap-1 text-label-12 text-muted-foreground">
          <label htmlFor="cater-monitoring-period">Periode</label>
          <Input
            id="cater-monitoring-period"
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-6 text-center text-copy-14 text-muted-foreground">
            Memuat produktivitas…
          </p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>Gagal memuat produktivitas: {error}</AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-copy-14 text-muted-foreground">
            Belum ada catatan petugas untuk periode ini.
          </p>
        ) : (
          <Table className="min-w-[640px] text-left">
            <TableHeader>
              <TableRow>
                <TableHead>Petugas</TableHead>
                <TableHead className="text-center">Catatan</TableHead>
                <TableHead className="text-center">Normal</TableHead>
                <TableHead className="text-center">Kelainan</TableHead>
                <TableHead className="text-right">Pemakaian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.petugasId}>
                  <TableCell className="font-medium">{item.petugasNama}</TableCell>
                  <TableCell className="text-center tabular-nums">
                    {formatNumber(item.totalTercatat)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {formatNumber(item.totalNormal)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {formatNumber(item.totalKelainan)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVolume(item.totalPakaiM3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
