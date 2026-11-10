'use client';

import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CaterSimulatorState } from '../hooks/use-cater-simulator';

type Props = Pick<
  CaterSimulatorState,
  | 'readingId'
  | 'currentStatus'
  | 'stageNote'
  | 'setStageNote'
  | 'adjustedStand'
  | 'setAdjustedStand'
  | 'correctedStand'
  | 'setCorrectedStand'
  | 'correctionReason'
  | 'setCorrectionReason'
  | 'ticketNumber'
  | 'setTicketNumber'
  | 'busyAction'
  | 'runStage'
  | 'runCorrection'
>;

function statusVariant(status: string): 'destructive' | 'default' | 'secondary' {
  if (status.startsWith('ANOMALY')) return 'destructive';
  if (status.includes('VERIFIED') || status === 'APPROVED_FINAL') return 'default';
  return 'secondary';
}

export function PanelVerifikasi({
  readingId,
  currentStatus,
  stageNote,
  setStageNote,
  adjustedStand,
  setAdjustedStand,
  correctedStand,
  setCorrectedStand,
  correctionReason,
  setCorrectionReason,
  ticketNumber,
  setTicketNumber,
  busyAction,
  runStage,
  runCorrection,
}: Props) {
  const handleCorrection = (event: FormEvent<HTMLFormElement>) => {
    void runCorrection(event);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alur verifikasi dan koreksi</CardTitle>
        <CardDescription>
          Endpoint dan hak akses identik dengan proses produksi. Pilih sesi verifikator yang sesuai.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readingId ? (
          <p className="text-sm text-muted-foreground">Simpan pembacaan simulasi terlebih dahulu.</p>
        ) : (
          <>
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              ID bacaan <code className="break-all">{readingId}</code>
              {currentStatus && (
                <div className="mt-1">
                  Status <Badge variant={statusVariant(currentStatus)}>{currentStatus}</Badge>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="simulation-stage-note">Catatan tahap</Label>
              <Input
                id="simulation-stage-note"
                value={stageNote}
                onChange={(event) => setStageNote(event.target.value)}
                placeholder="Alasan / catatan pengujian"
              />
            </div>
            <section className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-semibold">V1 · Supervisor</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busyAction}
                  onClick={() => void runStage('verify/v1', { action: 'APPROVE', catatan: stageNote })}
                >
                  Setujui V1
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyAction}
                  onClick={() =>
                    void runStage('verify/v1', { action: 'REQUEST_RESURVEY', catatan: stageNote })
                  }
                >
                  Minta survei ulang
                </Button>
              </div>
            </section>
            <section className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-semibold">V2 · Manager</h3>
              <div className="grid gap-2">
                <Label htmlFor="simulation-adjusted-stand">Stand koreksi untuk ADJUST_STAND</Label>
                <Input
                  id="simulation-adjusted-stand"
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustedStand}
                  onChange={(event) => setAdjustedStand(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busyAction}
                  onClick={() => void runStage('verify/v2', { action: 'APPROVE', catatan: stageNote })}
                >
                  Setujui V2
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyAction || adjustedStand === ''}
                  onClick={() =>
                    void runStage('verify/v2', {
                      action: 'ADJUST_STAND',
                      stmaKoreksi: Number(adjustedStand),
                      catatan: stageNote,
                    })
                  }
                >
                  Koreksi stand V2
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyAction}
                  onClick={() =>
                    void runStage('verify/v2', { action: 'REQUEST_RESURVEY', catatan: stageNote })
                  }
                >
                  Minta survei ulang
                </Button>
              </div>
            </section>
            <section className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-semibold">V3 · Persetujuan akhir</h3>
              <Button
                size="sm"
                disabled={busyAction}
                onClick={() => void runStage('verify/v3', { catatan: stageNote })}
              >
                Setujui V3
              </Button>
            </section>
            <form className="space-y-2 border-t pt-3" onSubmit={handleCorrection}>
              <h3 className="text-sm font-semibold">Koreksi staf pascaverifikasi</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  aria-label="Stand baru"
                  placeholder="Stand baru"
                  value={correctedStand}
                  onChange={(event) => setCorrectedStand(event.target.value)}
                />
                <Input
                  aria-label="Nomor tiket komplain"
                  placeholder="No. tiket (opsional)"
                  value={ticketNumber}
                  onChange={(event) => setTicketNumber(event.target.value)}
                />
                <Input
                  required
                  minLength={5}
                  aria-label="Alasan koreksi"
                  className="sm:col-span-2"
                  placeholder="Alasan koreksi (min. 5 karakter)"
                  value={correctionReason}
                  onChange={(event) => setCorrectionReason(event.target.value)}
                />
              </div>
              <Button size="sm" variant="outline" disabled={busyAction}>
                Jalankan koreksi staf
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
