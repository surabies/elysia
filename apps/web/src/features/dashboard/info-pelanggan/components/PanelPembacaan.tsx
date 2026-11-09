// Baris tiga kotak: stand awal, stand akhir (roda angka), dan kartu Pemakaian.
import { PanelDasbor } from "../../shared/PanelDasbor";
import { fmtAngka, fmtBulan } from "../lib/FormatTampilan";
import { Odometer } from "./Odometer";
import type { BarisRiwayat, DataCatat } from "../types/TipeInfoPelanggan";

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
      <PanelDasbor label="Pencatatan meter">
        <div className="py-6 text-center">
          <p className="text-sm font-medium">
            Belum ada pencatatan untuk periode ini
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba periode lain, atau kosongkan periode untuk melihat yang terbaru.
          </p>
        </div>
      </PanelDasbor>
    );
  }

  const banding = bandingkan(catat, riwayat);

  return (
    <PanelDasbor label="Stand meter dan pemakaian">
      <section
        aria-label="Stand meter dan pemakaian"
        className="grid gap-3 md:grid-cols-[1fr_1fr_1.15fr]"
      >
        <div className="rounded-lg border border-border bg-card p-4">
          <Odometer label="Stand awal" nilai={catat.standLalu} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Odometer label="Stand akhir" nilai={catat.standAkhir} />
        </div>
        <div className="flex flex-col justify-between rounded-lg bg-info p-5 text-info-foreground shadow-panel">
          <div>
            <span className="text-xs text-info-foreground/80">Pemakaian</span>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {fmtAngka(catat.pemakaianM3)}
              </span>
              <span className="text-base text-info-foreground/80">m³</span>
            </p>
          </div>
          {banding && (
            <p
              className="mt-3 text-xs text-info-foreground/90"
              role={banding.perhatian ? "alert" : undefined}
            >
              {banding.teks}
            </p>
          )}
        </div>
      </section>
    </PanelDasbor>
  );
}
