import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReadingReviewItem } from '../types';

function formatVolume(value: number | string | null) {
  return `${Number(value ?? 0).toLocaleString('id-ID')} m³`;
}

function ReviewList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ReadingReviewItem[];
  emptyMessage: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-label-13 font-medium">{title}</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-label-12 text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="divide-y">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-copy-13 font-medium">
                  {item.nama}{' '}
                  <span className="font-mono text-muted-foreground">({item.nolg})</span>
                </p>
                <p className="text-label-12 text-muted-foreground">
                  Rute {item.ruteKode || '—'} · Stand {item.stml ?? '—'} → {item.stma ?? '—'}
                </p>
              </div>
              <span className="shrink-0 text-copy-13 font-medium tabular-nums">
                {formatVolume(item.pakaiM3)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PembacaanDitinjau({
  periodLabel,
  extremeReadings,
  zeroReadings,
  loading,
  error,
}: {
  periodLabel: string;
  extremeReadings: ReadingReviewItem[];
  zeroReadings: ReadingReviewItem[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-20">Pembacaan perlu ditinjau</CardTitle>
        <CardDescription>
          Sampel pemakaian di atas 100 m³ dan pembacaan 0 m³ pada {periodLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="py-6 text-center text-copy-14 text-muted-foreground">
            Memuat pemeriksaan…
          </p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>Gagal memuat pemeriksaan: {error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <ReviewList
              title="Pemakaian tinggi"
              items={extremeReadings}
              emptyMessage="Tidak ada pemakaian di atas 100 m³."
            />
            <ReviewList
              title="Pemakaian nol"
              items={zeroReadings}
              emptyMessage="Tidak ada pembacaan 0 m³."
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
