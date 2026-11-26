// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/TabBelumTerpetakan.tsx
// Tab 3: Daftar Kode Kondisi TMSS yang Belum Terpetakan

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import type { UnmappedItem } from './types';

interface TabBelumTerpetakanProps {
  unmappedList: UnmappedItem[];
  canEdit: boolean;
}

export function TabBelumTerpetakan({ unmappedList, canEdit }: TabBelumTerpetakanProps) {
  return (
    <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      <CardHeader className="p-3.5 pb-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-label-14 font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              Kondisi Meter Belum Terpetakan ({unmappedList.length})
            </CardTitle>
            <CardDescription className="text-copy-13 text-muted-foreground">
              Daftar kode kondisi yang ditemukan pada pembacaan meter namun belum memiliki asosiasi aturan evaluasi.
            </CardDescription>
          </div>
          <Badge variant={unmappedList.length === 0 ? 'green-subtle' : 'amber-subtle'} className="text-[11px] font-mono">
            {unmappedList.length === 0 ? '100% Terpetakan' : `${unmappedList.length} Perlu Pemetaan`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 rounded-none">
        {unmappedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-none bg-muted/10">
            <CheckCircle2 className="size-8 text-emerald-600 mb-2" />
            <h4 className="text-label-14 font-semibold text-foreground">Seluruh Kondisi Sudah Terpetakan</h4>
            <p className="text-copy-13 text-muted-foreground max-w-sm mt-1">
              Tidak ada kode TMSS baru yang belum terdaftar di SSOT aturan anomali. Semua data pembacaan terklasifikasi dengan aman.
            </p>
          </div>
        ) : (
          <div className="overflow-auto relative max-h-[600px]">
            <table className="w-full text-left text-copy-13 border-collapse">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border shadow-xs">
                <tr className="text-label-12 font-medium text-muted-foreground">
                  <th className="py-2.5 px-3 w-28">Kode TMSS</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Frekuensi Muncul</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unmappedList.map((item) => (
                  <tr key={item.kodeTmss} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      {item.kodeTmss}
                    </td>
                    <td className="py-2.5 px-3 text-foreground">{item.keterangan || (item as any).nama || '-'}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="gray-subtle">{item.kategori}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground" suppressHydrationWarning>
                      {(item.jumlahMuncul ?? 0).toLocaleString('id-ID')} baris
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="default"
                        disabled={!canEdit}
                        className="h-7 px-2.5 text-label-12 gap-1 text-primary"
                      >
                        <PlusCircle className="size-3" />
                        Petakan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
