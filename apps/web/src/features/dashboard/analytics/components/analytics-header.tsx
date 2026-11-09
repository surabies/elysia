import { formatDate } from "../lib/format";

interface AnalyticsHeaderProps {
  periodLabel: string;
  periodCode: string;
  generatedAt: Date;
}

const META_LABEL =
  "text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground";

export function AnalyticsHeader({
  periodLabel,
  periodCode,
  generatedAt,
}: AnalyticsHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-zinc-200 bg-card px-4 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:border-zinc-800 dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] sm:px-6">
      {/* Gradient dasar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black"
      />

      {/* Glow radial di atas */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 h-52 w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.07),transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)]"
      />

      {/* Grid tipis yang memudar ke bawah */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]"
      />

      {/* Garis aksen highlight di tepi atas */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent dark:via-zinc-300/30"
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={`mb-1.5 flex items-center gap-2 ${META_LABEL}`}>
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            />
            PDAM Tirtawening
          </p>
          <h1 className="bg-gradient-to-b from-zinc-950 to-zinc-600 bg-clip-text text-2xl font-semibold tracking-tight text-transparent dark:from-white dark:to-zinc-400">
            Analitik Operasional
          </h1>
        </div>

        <dl className="grid grid-cols-3 gap-x-2 border-t border-border/70 pt-4 sm:gap-x-5 sm:border-t-0 sm:pt-0">
          <div className="min-w-0">
            <dt className={META_LABEL}>Periode</dt>
            <dd className="mt-0.5 truncate text-xs font-medium text-foreground">
              {periodLabel}
            </dd>
          </div>
          <div className="min-w-0 border-l border-border/70 pl-2 sm:pl-4">
            <dt className={META_LABEL}>Kode</dt>
            <dd className="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground">
              {periodCode}
            </dd>
          </div>
          <div className="min-w-0 border-l border-border/70 pl-2 sm:pl-4">
            <dt className={META_LABEL}>Hari ini</dt>
            <dd className="mt-0.5 whitespace-nowrap text-xs font-medium tabular-nums text-foreground">
              <time dateTime={generatedAt.toISOString().slice(0, 10)}>
                {formatDate(generatedAt)}
              </time>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
