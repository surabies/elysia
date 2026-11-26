// apps/web/src/features/dashboard/pengaturan/components/aturan-anomali/TabVersiAuditLog.tsx
// Tab 4: Snapshot Versi & Audit Trail Log Immutable

'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, History } from 'lucide-react';
import type { VersionItem, AuditLogItem } from './types';

interface TabVersiAuditLogProps {
  versionList: VersionItem[];
  auditLogs: AuditLogItem[];
}

export function TabVersiAuditLog({ versionList, auditLogs }: TabVersiAuditLogProps) {
  return (
    <div className="space-y-4">
      {/* 1. Riwayat Versi Snapshot */}
      <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 pb-2.5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-label-14 font-semibold text-foreground flex items-center gap-2">
                <GitBranch className="size-4 text-primary" />
                Riwayat Snapshot Versi Aturan
              </CardTitle>
              <CardDescription className="text-copy-13 text-muted-foreground">
                Setiap kali aturan dimodifikasi, sistem menyimpan snapshot versi lengkap untuk audit masa depan.
              </CardDescription>
            </div>
            <Badge variant="teal-subtle" className="text-[11px] font-mono">
              {versionList.length} Versi Tersimpan
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-auto relative max-h-[360px]">
          <table className="w-full text-left text-copy-13 border-collapse">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border shadow-xs">
              <tr className="text-label-12 font-medium text-muted-foreground">
                <th className="py-2.5 px-3 w-20">Versi</th>
                <th className="py-2.5 px-3">Tanggal Dibuat</th>
                <th className="py-2.5 px-3">Alasan Rilis Versi</th>
                <th className="py-2.5 px-3">Diterbitkan Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {versionList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    Belum ada riwayat snapshot versi.
                  </td>
                </tr>
              ) : (
                versionList.map((v) => (
                  <tr key={v.versi ?? v.id} className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono font-semibold text-foreground">
                      v{v.versi}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground" suppressHydrationWarning>
                      {v.createdAt ? new Date(v.createdAt).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {v.alasan ?? v.alasanPerubahan ?? '-'}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {v.diterbitkanOleh ?? v.diubahOleh ?? '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 2. Log Audit Perubahan Parameter */}
      <Card className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 pb-2.5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-label-14 font-semibold text-foreground flex items-center gap-2">
                <History className="size-4 text-primary" />
                Log Audit Perubahan Parameter (Immutable)
              </CardTitle>
              <CardDescription className="text-copy-13 text-muted-foreground">
                Catatan jejak audit tak terhapus atas setiap modifikasi parameter aturan anomali oleh operator.
              </CardDescription>
            </div>
            <Badge variant="gray-subtle" className="text-[11px] font-mono">
              {auditLogs.length} Catatan Log
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-auto relative max-h-[360px]">
          <table className="w-full text-left text-copy-13 border-collapse">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border shadow-xs">
              <tr className="text-label-12 font-medium text-muted-foreground">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Aturan</th>
                <th className="py-2.5 px-3">Aksi</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Alasan Perubahan</th>
                <th className="py-2.5 px-3 text-right">Baris Terdampak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada catatan log perubahan parameter.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const kode = log.aturanKode ?? log.nilaiBaru?.kode ?? log.nilaiLama?.kode ?? log.aturanId ?? '-';
                  const waktuStr = log.waktu ?? log.createdAt;
                  const waktu = waktuStr ? new Date(waktuStr).toLocaleString('id-ID') : '-';
                  const operator = log.diubahOleh ?? log.operatorNama ?? '-';
                  const barisNum = typeof log.barisTerdampak === 'number'
                    ? log.barisTerdampak
                    : log.nilaiBaru?.barisTerdampak != null
                      ? Number(log.nilaiBaru.barisTerdampak)
                      : null;
                  const barisDisplay = barisNum != null && !isNaN(barisNum)
                    ? barisNum.toLocaleString('id-ID')
                    : '-';

                  return (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 text-muted-foreground text-label-12" suppressHydrationWarning>
                        {waktu}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                        {kode}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {log.aksi ?? (log.versiSebelum ? `v${log.versiSebelum} \u2192 v${log.versiSesudah}` : 'UPDATE')}
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-medium">{operator}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{log.alasan ?? '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                        {barisDisplay}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
