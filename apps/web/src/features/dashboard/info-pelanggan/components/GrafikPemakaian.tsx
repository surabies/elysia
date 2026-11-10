// GrafikPemakaian menampilkan batang per periode (terlama → terbaru). CSS murni.
import { cn } from "@/lib/utils";
import { fmtAngka, fmtPeriode, fmtPeriodeSingkat } from "../lib/format-tampilan";
import type { BarisRiwayat } from "../types";

export function GrafikPemakaian({
  periode,
  pemakaianM3,
  riwayat,
}: {
  periode: string;
  pemakaianM3: number | null;
  riwayat: BarisRiwayat[];
}) {
  const data = [
    ...[...riwayat].reverse().map((r) => ({
      periode: r.periode,
      nilai: r.pemakaianM3,
      aktif: false,
    })),
    { periode, nilai: pemakaianM3, aktif: true },
  ];
  const maks = Math.max(1, ...data.map((d) => d.nilai ?? 0));
  const ringkas = data
    .map((d) => `${fmtPeriode(d.periode)} ${fmtAngka(d.nilai)} meter kubik`)
    .join(", ");

  return (
    <div
      role="img"
      aria-label={`Pemakaian: ${ringkas}`}
      className="flex min-h-44 flex-1 gap-3"
    >
      {data.map((d) => (
        <div key={d.periode} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="relative min-h-0 flex-1">
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 rounded-t-sm transition-all duration-300",
                d.aktif ? "bg-chart-1" : "bg-muted-foreground/30"
              )}
              style={{
                height: `${d.nilai == null ? 0 : Math.max(4, (d.nilai / maks) * 100)}%`,
              }}
            />
          </div>
          <div className="text-center leading-tight">
            <p
              className={cn(
                "text-sm tabular-nums",
                d.aktif ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
              )}
            >
              {fmtAngka(d.nilai)}
            </p>
            <p className="text-xs text-muted-foreground">
              {fmtPeriodeSingkat(d.periode)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
