import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RouteSummary } from '../types';

function formatNumber(value: number) {
  return value.toLocaleString('id-ID');
}

export function BebanRute({
  routes,
  loading,
}: {
  routes: RouteSummary[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-20">Beban per rute</CardTitle>
        <CardDescription>Jumlah pelanggan dan petugas default tiap rute.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-6 text-center text-copy-14 text-muted-foreground">Memuat rute…</p>
        ) : routes.length === 0 ? (
          <p className="py-6 text-center text-copy-14 text-muted-foreground">
            Data rute belum tersedia.
          </p>
        ) : (
          <div className="max-h-80 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Rute</TableHead>
                  <TableHead>Seksi</TableHead>
                  <TableHead className="text-right">Pelanggan</TableHead>
                  <TableHead>Petugas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.kode}>
                    <TableCell className="font-mono">{route.kode}</TableCell>
                    <TableCell>{route.seksiNama || '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(route.customerCount)}
                    </TableCell>
                    <TableCell>{route.petugasDefault || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
