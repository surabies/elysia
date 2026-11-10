import type { PeriodeInfo } from "@/server/services/dashboard/dashboard.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
            <Badge variant="subtle" size="sm">
              {role}
            </Badge>
          </div>
          <h1 className="text-heading-20 text-foreground">
            Ringkasan Operasional
          </h1>
          <p className="mt-0.5 text-copy-13 text-muted-foreground">
            Selamat bertugas, <span className="font-medium text-foreground">{name}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-x-4 border-t border-border pt-3 sm:gap-x-6 sm:border-t-0 sm:pt-0">
          <div className="min-w-0">
            <p className="text-label-12 text-muted-foreground">
              Periode Aktif
            </p>
            <p className="mt-0.5 truncate text-label-13 text-foreground">
              {periode.label}
            </p>
          </div>
          <div className="min-w-0 border-l border-border pl-4 sm:pl-6">
            <p className="text-label-12 text-muted-foreground">
              Kode THBL
            </p>
            <p className="mt-0.5 text-label-13-mono tabular-nums text-foreground">
              {periode.thbl}
            </p>
          </div>
          <div className="min-w-0 border-l border-border pl-4 sm:pl-6">
            <p className="text-label-12 text-muted-foreground">
              Tanggal
            </p>
            <p className="mt-0.5 whitespace-nowrap text-label-13 tabular-nums text-foreground">
              {tanggalHariIni}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
