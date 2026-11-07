import type { PeriodeInfo } from "@/server/services/dashboard/dashboard.service";
import { Card } from "@/components/ui/card";

interface RingkasanHeaderProps {
  name: string;
  role: string;
  periode: PeriodeInfo;
  tanggalHariIni: string;
}

export function RingkasanHeader({
  name,
  role,
  periode,
  tanggalHariIni,
}: RingkasanHeaderProps) {
  return (
    <Card className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-label-11 font-medium uppercase tracking-wide text-muted-foreground">
            PDAM Tirtawening
          </p>
          <h1 className="text-heading-20 text-foreground">
            Ringkasan Operasional
          </h1>
          <p className="mt-1 text-copy-13 text-muted-foreground">
            {name} <span className="px-1 text-border">/</span>
            {role}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-2 border-t border-border pt-3 sm:gap-x-4 sm:border-t-0 sm:pt-0">
          <div className="min-w-0">
            <p className="text-label-11 font-medium uppercase tracking-wide text-muted-foreground">
              Periode
            </p>
            <p className="truncate text-label-12 font-medium text-foreground">
              {periode.label}
            </p>
          </div>
          <div className="min-w-0 border-l border-border pl-2 sm:pl-3">
            <p className="text-label-11 font-medium uppercase tracking-wide text-muted-foreground">
              Kode
            </p>
            <p className="font-mono text-label-12 font-medium text-foreground">
              {periode.thbl}
            </p>
          </div>
          <div className="min-w-0 border-l border-border pl-2 sm:pl-3">
            <p className="text-label-11 font-medium uppercase tracking-wide text-muted-foreground">
              Hari ini
            </p>
            <p className="whitespace-nowrap text-label-12 font-medium text-foreground">
              {tanggalHariIni}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
