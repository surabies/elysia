'use client';

import * as React from 'react';
import {
  Search,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat('id-ID');

export interface RiwayatManualItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string;
  tarifKode: string | null;
  ruteKode: string | null;
  stml: number;
  stma: number;
  pakaiM3: number;
  catatan: string | null;
  sumberCatat: string | null;
  statusVerifikasi: string;
  tglCatat: string | null;
  updatedAt: string;
}

export interface RiwayatResponse {
  periode: string;
  kpi: {
    totalManual: number;
    totalM3: number;
    rataRataM3: number;
  };
  items: RiwayatManualItem[];
}

interface ManualAddRiwayatTableProps {
  periode: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export function ManualAddRiwayatTable({
  periode,
  refreshTrigger = 0,
  onRefresh,
}: ManualAddRiwayatTableProps) {
  const [data, setData] = React.useState<RiwayatResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchRiwayat = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = searchQuery.trim() ? `&q=${encodeURIComponent(searchQuery.trim())}` : '';
      const res = await fetch(`/api/v1/manual-add/riwayat?periode=${periode}${q}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch riwayat manual add:', err);
    } finally {
      setLoading(false);
    }
  }, [periode, searchQuery]);

  React.useEffect(() => {
    fetchRiwayat();
  }, [fetchRiwayat, refreshTrigger]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-label-14 font-semibold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Daftar Riwayat Rekaman Manual ADD & Taksasi
            </CardTitle>
            <CardDescription className="text-copy-13 mt-0.5">
              Seluruh rekam jejak input manual periode {periode} tersimpan aman dengan audit trail.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari NOLG atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchRiwayat();
                if (onRefresh) onRefresh();
              }}
              disabled={loading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              Segarkan
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 p-6 text-center text-copy-13 text-muted-foreground">
            <FileText className="size-8 text-muted-foreground/60 mb-2" />
            <p className="font-medium text-foreground">Tidak ada riwayat pembacaan manual</p>
            <p className="text-label-12 mt-0.5">Belum ada catatan manual add yang terdata pada periode ini.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-28">Waktu Catat</TableHead>
                <TableHead>No. Langganan</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Alamat & Rute</TableHead>
                <TableHead className="text-right">STML</TableHead>
                <TableHead className="text-right">STMA</TableHead>
                <TableHead className="text-right">Volume (m³)</TableHead>
                <TableHead>Alasan / Berita Acara</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-label-11 text-muted-foreground font-mono whitespace-nowrap">
                    {row.tglCatat
                      ? new Date(row.tglCatat).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-foreground">
                    {row.nolg}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {row.nama}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-label-11">
                    <span className="truncate max-w-[180px] block">{row.alamat}</span>
                    <span className="font-mono text-primary text-[10px]">Rute: {row.ruteKode ?? '-'}</span>
                  </TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground">
                    {numberFormat.format(row.stml)}
                  </TableCell>
                  <TableCell className="font-mono text-right font-bold text-foreground">
                    {numberFormat.format(row.stma)}
                  </TableCell>
                  <TableCell className="font-mono text-right font-bold text-teal-600 dark:text-teal-400">
                    {numberFormat.format(row.pakaiM3)} m³
                  </TableCell>
                  <TableCell className="text-label-11 max-w-[240px]">
                    <span className="truncate block text-muted-foreground italic" title={row.catatan ?? ''}>
                      {row.catatan ?? '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        row.statusVerifikasi === 'VERIFIED'
                          ? 'secondary'
                          : row.statusVerifikasi === 'LOCKED_BILLING'
                          ? 'default'
                          : 'outline'
                      }
                      className="text-[10px] font-mono"
                    >
                      {row.statusVerifikasi}
                    </Badge>
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
