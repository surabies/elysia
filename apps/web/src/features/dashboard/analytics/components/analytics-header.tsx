import { Card } from "@/components/ui/card";
import { formatDate } from "../lib/format";

interface AnalyticsHeaderProps {
  periodLabel: string;
  periodCode: string;
  generatedAt: Date;
}

export function AnalyticsHeader({
  periodLabel,
  periodCode,
  generatedAt,
}: AnalyticsHeaderProps) {
  return (
    <Card className="px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-(--ds-green-600)"
            />
            <span className="text-label-12 text-muted-foreground">
              PDAM Tirtawening
            </span>
          </div>
          <h1 className="text-heading-20 text-foreground">
            Analitik &amp; Observabilitas Operasional
          </h1>
          <p className="mt-0.5 text-copy-13 text-muted-foreground">
            Metrik performa pencatatan meter, tren harian, peta risiko kelurahan, dan distribusi kubikasi.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-x-4 border-t border-border pt-3 sm:gap-x-6 sm:border-t-0 sm:pt-0">
          <div className="min-w-0">
            <dt className="text-label-12 text-muted-foreground">
              Periode Aktif
            </dt>
            <dd className="mt-0.5 truncate text-label-13 text-foreground">
              {periodLabel}
            </dd>
          </div>
          <div className="min-w-0 border-l border-border pl-4 sm:pl-6">
            <dt className="text-label-12 text-muted-foreground">
              Kode THBL
            </dt>
            <dd className="mt-0.5 text-label-13-mono tabular-nums text-foreground">
              {periodCode}
            </dd>
          </div>
          <div className="min-w-0 border-l border-border pl-4 sm:pl-6">
            <dt className="text-label-12 text-muted-foreground">
              Diperbarui
            </dt>
            <dd className="mt-0.5 whitespace-nowrap text-label-13 tabular-nums text-foreground">
              <time dateTime={generatedAt.toISOString().slice(0, 10)}>
                {formatDate(generatedAt)}
              </time>
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
