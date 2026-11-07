'use client';

import { PageContainer } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { FormulirPembacaan } from './FormulirPembacaan';
import { HasilDanAudit } from './HasilDanAudit';
import { KonteksPengujian } from './KonteksPengujian';
import { PanelVerifikasi } from './PanelVerifikasi';
import { useCaterSimulator } from '../hooks/useCaterSimulator';

export function SimulatorBacaMeter() {
  const state = useCaterSimulator();

  if (state.loadingRoutes) {
    return (
      <PageContainer className="space-y-4">
        <h1 className="text-xl font-semibold">Simulator Baca Meter</h1>
        <p className="text-sm text-muted-foreground">Memuat data rute…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Simulator Baca Meter</h1>
        <p className="text-sm text-muted-foreground">
          Simulasikan pengiriman mobile, anomali, verifikasi, koreksi, dan audit menggunakan endpoint
          operasional.
        </p>
      </header>
      <div className="space-y-4">
        <Alert>
          <AlertTitle>Mode tulis aktif</AlertTitle>
          <AlertDescription>
            Pembacaan simulasi benar-benar disimpan ke database operasional. Catatan diberi tanda
            <strong> [SIMULASI]</strong>. Hindari data produksi, dan konfirmasi eksplisit diperlukan
            saat mengganti bacaan periode yang sudah ada.
          </AlertDescription>
        </Alert>
        {state.pageError && (
          <Alert variant="destructive">
            <AlertDescription>{state.pageError}</AlertDescription>
          </Alert>
        )}
        {!state.routes.length && !state.pageError && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Tidak ada rute yang tersedia untuk akun ini.
            </CardContent>
          </Card>
        )}

        <KonteksPengujian {...state} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <FormulirPembacaan {...state} />
          <div className="space-y-4">
            <PanelVerifikasi {...state} />
            <HasilDanAudit {...state} />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
