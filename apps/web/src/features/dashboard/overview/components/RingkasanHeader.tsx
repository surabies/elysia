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
    <Card className="relative overflow-hidden border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-black sm:px-5">
      {/* Lapisan gradient dasar: terang -> abu sangat halus, gelap -> hitam -> zinc */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black"
      />

      {/* Glow radial di sudut atas, khas hero Vercel */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.06),transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),transparent_70%)]"
      />

      {/* Pola grid tipis yang memudar ke bawah */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]"
      />

      {/* Garis aksen highlight tipis di bagian atas */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent dark:via-zinc-400/40"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
