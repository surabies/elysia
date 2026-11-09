"use client";

// ProfilPelanggan menampilkan identitas: nama + alamat di kiri,
// No. Langganan (bisa disalin) + status di kanan, chip ciri teknis di bawah.
import * as React from "react";
import { cn } from "@/lib/Utilitas";
import { PanelDasbor } from "../../shared/PanelDasbor";
import { LABEL_STATUS_PELANGGAN } from "../lib/LabelPelanggan";
import type { DataPelanggan } from "../types/TipeInfoPelanggan";

const NADA_STATUS: Record<string, string> = {
  AKTIF: "bg-success-muted text-success",
  TUTUP_SEMENTARA: "bg-warning-muted text-warning",
  DISEGEL: "bg-destructive/10 text-destructive",
  TUTUP_SPT: "bg-destructive/10 text-destructive",
};

function Chip({ label, nilai }: { label: string; nilai: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{nilai}</span>
    </span>
  );
}

function TombolSalin({ teks }: { teks: string }) {
  const [tersalin, setTersalin] = React.useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 1500);
    } catch {
      /* clipboard tidak tersedia — abaikan */
    }
  }

  return (
    <button
      type="button"
      onClick={salin}
      className="rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {tersalin ? "Tersalin" : "Salin"}
    </button>
  );
}

export function ProfilPelanggan({
  pelanggan: p,
}: {
  pelanggan: DataPelanggan;
}) {
  const labelStatus = p.status
    ? ((LABEL_STATUS_PELANGGAN as Record<string, string>)[p.status] ?? p.status)
    : null;

  return (
    <PanelDasbor label="Profil pelanggan">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {p.nama || "Tanpa nama"}
            </h2>
            {p.alamat && (
              <p className="mt-1 text-sm text-muted-foreground">{p.alamat}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-semibold tabular-nums">
                {p.nomorLangganan}
              </span>
              <TombolSalin teks={p.nomorLangganan} />
            </div>
            {labelStatus && (
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  NADA_STATUS[p.status ?? ""] ??
                    "border-border bg-muted text-foreground"
                )}
              >
                {labelStatus}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/40 pt-3">
          {p.golongan && <Chip label="Golongan" nilai={p.golongan} />}
          {p.nomorMeter && <Chip label="Meter" nilai={p.nomorMeter} />}
          {p.ukuranMeter && <Chip label="Ukuran" nilai={p.ukuranMeter} />}
          {p.noHp && p.noHp !== "0" && <Chip label="Telepon" nilai={p.noHp} />}
        </div>
      </div>
    </PanelDasbor>
  );
}
