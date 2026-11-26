// Baris tiga kotak: stand awal, stand akhir (roda angka), dan kartu Pemakaian.
import { Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <Card className="rounded-lg border-border/80 bg-card p-6 text-center shadow-none">
        <p className="text-sm font-semibold text-foreground">
          Belum ada pencatatan untuk periode ini
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Coba periode lain, atau kosongkan periode untuk melihat yang terbaru.
        </p>
      </Card>
    );
  }

  const banding = bandingkan(catat, riwayat);

  return (
    <section
      aria-label="Stand meter dan pemakaian"
      className="grid gap-3 md:grid-cols-[1fr_1fr_1.15fr]"
    >
      <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
        <Odometer label="Stand awal" nilai={catat.standLalu} />
      </Card>
      <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
        <Odometer label="Stand akhir" nilai={catat.standAkhir} />
      </Card>
      <Card className="flex flex-col justify-between rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none text-foreground">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="size-4 shrink-0 text-foreground/80 stroke-[1.5]" />
              <span className="text-[13px] font-medium text-foreground tracking-tight">
                Pemakaian Air
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">(m³)</span>
          </div>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-foreground">
              {fmtAngka(catat.pemakaianM3)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
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
      </Card>
    </section>
  );
}
