'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Lock,
  Layers,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { MatriksHakAksesItem } from '@/server/services/master/master-extended.service';

export function MatriksHakAkses() {
  const [matrix, setMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchMatrix = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/otorisasi');
      const json = await res.json();
      if (json.success && json.data) {
        setMatrix(json.data);
      }
    } catch (err) {
      console.error('Failed to load matrix otorisasi:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  const renderCheck = (allowed: boolean) => {
    if (allowed) {
      return (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
          <Check className="size-3.5" />
        </span>
      );
    }
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground/40">
        <X className="size-3" />
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="size-6 text-primary" />
            Matriks Hak Akses & Ring Approval (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Matriks izin akses modul, pengamanan endpoint API berjenjang, dan ring otorisasi verifikasi PDAM Tirtawening.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMatrix}
          disabled={loading}
          className="h-8 gap-1.5 text-xs w-fit"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Segarkan
        </Button>
      </div>

      {/* 2. Security Notice Card */}
      <Card className="p-4 border-border bg-primary/5 flex items-start gap-3">
        <Info className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-semibold text-foreground">
            Penegakan Keamanan Berlapis (Role-Based Access Control)
          </h4>
          <p className="text-muted-foreground leading-relaxed">
            Setiap endpoint backend diproteksi langsung oleh <code>authPlugin</code> dan guard <code>requireRole</code>. Permintaan tanpa izin otomatis ditolak dengan kode respon <strong>403 Forbidden</strong> untuk menjamin integritas data penagihan air.
          </p>
        </div>
      </Card>

      {/* 3. Matrix Table */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-56">Modul & Fitur Sistem</TableHead>
                <TableHead className="w-72">Deskripsi Cakupan</TableHead>
                <TableHead className="text-center w-24">SUPERADMIN</TableHead>
                <TableHead className="text-center w-28">STAFF BILLING</TableHead>
                <TableHead className="text-center w-28">VERIFIKATOR 1 (Supervisor)</TableHead>
                <TableHead className="text-center w-28">VERIFIKATOR 2 (Manager)</TableHead>
                <TableHead className="text-center w-28">VERIFIKATOR 3 (Sr. Manager)</TableHead>
                <TableHead className="text-center w-24">EXECUTIVE (Direksi)</TableHead>
                <TableHead className="text-center w-24">PELAKSANA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map((row) => (
                <TableRow key={row.modul}>
                  <TableCell className="font-semibold text-foreground">
                    {row.modul}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs leading-relaxed">
                    {row.deskripsi}
                  </TableCell>
                  <TableCell className="text-center">{renderCheck(row.superadmin)}</TableCell>
                  <TableCell className="text-center">{renderCheck(row.staffBilling)}</TableCell>
                  <TableCell className="text-center">{renderCheck(row.verifikator1)}</TableCell>
                  <TableCell className="text-center">{renderCheck(row.verifikator2)}</TableCell>
                  <TableCell className="text-center">{renderCheck(row.verifikator3)}</TableCell>
                  <TableCell className="text-center">{renderCheck(row.executive)}</TableCell>
                  <TableCell className="text-center">{renderCheck(row.pelaksana)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
