"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  ImageIcon,
} from "@/components/ui/hugeicons-compat";
import { BingkaiFoto } from "@/components/BingkaiFoto";
import { Button } from "@/components/ui/button";
import { TombolUtama } from "./TombolUtama";
import { statusLaporanMandiriWarga, formatWaktu } from "../lib/format";
import { cn } from "@/lib/utils";

export interface HasilLaporanTampilan {
  nomorLangganan: string;
  nama: string;
  periodeLabel: string;
  stand: number;
  fotoPreviewUrl: string;
  status: string;
  createdAt: string;
  pesan: string;
}

export function LaporMeterSukses({
  hasil,
  onReset,
}: {
  hasil: HasilLaporanTampilan;
  onReset: () => void;
}) {
  const status = statusLaporanMandiriWarga(hasil.status);

  return (
    <div className="space-y-6">
      {/* Radiant Success Badge Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative flex size-16 sm:size-20 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"
          />
          <span className="relative flex size-16 sm:size-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md">
            <BadgeCheck className="size-8 sm:size-10" />
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Laporan Berhasil Terkirim
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
            {hasil.pesan}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold shadow-2xs",
            status.badgeClass,
          )}
        >
          <span className={cn("size-2 rounded-full", status.dotClass)} />
          {status.label}
        </span>
      </div>

      {/* Digital Receipt Items (Tanpa nested card) */}
      <div className="space-y-3 border-y border-border py-4">
        <div className="flex items-center justify-between pb-1 text-[10px] sm:text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
          <span>Rincian Konfirmasi Server</span>
          <span>{formatWaktu(hasil.createdAt)} WIB</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {[
            { label: "Nama Pelanggan", value: hasil.nama, mono: false },
            { label: "No. Langganan", value: hasil.nomorLangganan, mono: true },
            {
              label: "Periode Tagihan",
              value: hasil.periodeLabel,
              mono: false,
            },
            {
              label: "Stand Dilaporkan",
              value: `${hasil.stand.toLocaleString("id-ID")} m³`,
              mono: true,
              highlight: true,
            },
          ].map(({ label, value, mono, highlight }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-dashed border-border pb-2 last:border-b-0 last:pb-0"
            >
              <span className="text-muted-foreground font-medium">{label}</span>
              <span
                className={cn(
                  "text-foreground text-right font-medium",
                  mono && "font-mono",
                  highlight &&
                    "text-base sm:text-lg font-bold text-blue-600 dark:text-sky-400 font-mono",
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Foto Terkirim */}
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ImageIcon className="size-4 text-blue-600 dark:text-sky-400" />
          Bukti Foto yang Diterima Server
        </p>
        <div className="overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-xs">
          <BingkaiFoto
            src={hasil.fotoPreviewUrl}
            alt="Foto stand meter terkirim"
            mode="utuh"
            rasio="16/9"
            tanpaDialog
          />
        </div>
      </div>

      {/* SLA Note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
        <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          Petugas verifikator akan memeriksa foto sebelum angka ini disahkan
          menjadi dasar rekening tagihan. Anda dapat memantau statusnya kapan
          saja lewat tab{" "}
          <strong className="text-foreground">Cek Status Laporan</strong>.
        </p>
      </div>

      {/* Mobile-Friendly CTAs */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="min-w-0 flex-1">
          <TombolUtama
            asChild
            size="lg"
            className="w-full font-semibold rounded-xl min-h-[44px]"
          >
            <Link href={`/lapor-meter?tab=cek&nomor=${hasil.nomorLangganan}`}>
              <span>Cek Status Laporan Saya</span>
              <ArrowRight className="size-4" />
            </Link>
          </TombolUtama>
        </div>

        <div className="min-w-0 flex-1">
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm font-medium"
          >
            Lapor Sambungan Lain
          </Button>
        </div>
      </div>
    </div>
  );
}
