// Baris tiga kotak: stand awal, stand akhir (roda angka), dan kartu Pemakaian.
import { cn } from "@/lib/utils";
import { fmtAngka, fmtBulan } from "../lib/format-tampilan";
import { Odometer } from "./Odometer";
import type { BarisRiwayat, DataCatat } from "../types";

/** Perubahan pemakaian terhadap periode sebelumnya, dalam kalimat. */
export function bandingkan(catat: DataCatat, riwayat: BarisRiwayat[]) {
  const sebelum = riwayat[0];
  const kini = catat.pemakaianM3;
  if (
    !sebelum ||
    kini == null ||
    sebelum.pemakaianM3 == null ||
    sebelum.pemakaianM3 <= 0
  )
    return null;
  const persen = Math.round(
    ((kini - sebelum.pemakaianM3) / sebelum.pemakaianM3) * 100
  );
  const bulan = fmtBulan(sebelum.periode);
  return {
    teks:
      persen === 0
        ? `Sama dengan ${bulan}`
        : `${persen > 0 ? "Naik" : "Turun"} ${Math.abs(persen)}% dari ${bulan}`,
    perhatian: Math.abs(persen) >= 50,
  };
}

export function PanelPembacaan({
  catat,
  riwayat,
}: {
  catat: DataCatat | null;
  riwayat: BarisRiwayat[];
}) {
  if (!catat) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-xs">
        <p className="text-sm font-semibold text-foreground">
          Belum ada pencatatan untuk periode ini
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Coba periode lain, atau kosongkan periode untuk melihat yang terbaru.
        </p>
      </div>
    );
  }

  const banding = bandingkan(catat, riwayat);

  return (
    <section
      aria-label="Stand meter dan pemakaian"
      className="grid gap-3 md:grid-cols-[1fr_1fr_1.15fr]"
    >
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <Odometer label="Stand awal" nilai={catat.standLalu} />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <Odometer label="Stand akhir" nilai={catat.standAkhir} />
      </div>
      <div className="flex flex-col justify-between rounded-xl border border-blue-500/20 bg-linear-to-br from-blue-500/10 via-sky-500/5 to-transparent dark:from-blue-950/40 dark:via-sky-950/20 dark:to-transparent p-5 text-foreground shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pemakaian Air
          </span>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-foreground sm:text-5xl">
              {fmtAngka(catat.pemakaianM3)}
            </span>
            <span className="text-base font-semibold text-blue-600 dark:text-sky-400">
              m³
            </span>
          </p>
        </div>
        {banding && (
          <p
            className={cn(
              "mt-3 text-xs font-medium",
              banding.perhatian
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            )}
            role={banding.perhatian ? "alert" : undefined}
          >
            {banding.teks}
          </p>
        )}
      </div>
    </section>
  );
}
