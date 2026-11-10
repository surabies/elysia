'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CaterSimulatorState } from '../hooks/use-cater-simulator';

type Props = Pick<
  CaterSimulatorState,
  | 'savedMessage'
  | 'operationError'
  | 'auditError'
  | 'savedReading'
  | 'readingId'
  | 'audit'
>;

export function HasilDanAudit({
  savedMessage,
  operationError,
  auditError,
  savedReading,
  readingId,
  audit,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hasil dan audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedMessage && (
          <Alert>
            <AlertDescription>{savedMessage}</AlertDescription>
          </Alert>
        )}
        {operationError && (
          <Alert variant="destructive">
            <AlertDescription>{operationError}</AlertDescription>
          </Alert>
        )}
        {auditError && (
          <Alert>
            <AlertDescription>
              Riwayat audit tidak dapat dimuat untuk akun ini: {auditError}
            </AlertDescription>
          </Alert>
        )}
        {savedReading && (
          <dl className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Stand awal</dt>
              <dd className="font-medium">{savedReading.stml}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stand akhir</dt>
              <dd className="font-medium">{savedReading.stma}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pakai</dt>
              <dd className="font-medium">{savedReading.pakaiM3} m³</dd>
            </div>
          </dl>
        )}
        {readingId && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Riwayat audit</h3>
            {!audit.length ? (
              <p className="text-sm text-muted-foreground">Belum ada aksi verifikasi.</p>
            ) : (
              audit.map((entry) => (
                <div key={entry.id} className="border-l-2 pl-3 text-sm">
                  <p className="font-medium">{entry.stage} · {entry.action}</p>
                  <p className="text-muted-foreground">{entry.alasan}</p>
                  <time className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString('id-ID')}
                  </time>
                </div>
              ))
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
