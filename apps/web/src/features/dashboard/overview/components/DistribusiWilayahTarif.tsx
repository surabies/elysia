"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  TarifStat,
  WilayahStat,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka, formatRupiah } from "../lib/format-ringkasan";

interface DistribusiWilayahTarifProps {
  wilayah: WilayahStat[];
  tarif: TarifStat[];
}

type MetrikPilihan = "pelanggan" | "konsumsi" | "rupiah";

const METRIK_OPTIONS: { id: MetrikPilihan; label: string }[] = [
  { id: "pelanggan", label: "SL" },
  { id: "konsumsi", label: "m³" },
  { id: "rupiah", label: "Rp" },
];

function MetricSegmentedControl({
  value,
  onChange,
  ariaLabel,
}: {
  value: MetrikPilihan;
  onChange: (next: MetrikPilihan) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex h-8 shrink-0 items-center rounded-md border border-border/80 bg-(--ds-gray-100) p-0.5 dark:bg-(--ds-gray-200)/60"
    >
      {METRIK_OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`inline-flex h-full items-center rounded-[4px] px-2.5 text-label-12 font-medium transition-colors cursor-pointer ${
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function formatMetricValue(
  metrik: MetrikPilihan,
  pelanggan: number,
  konsumsi: number,
  rupiah: number
): string {
  if (metrik === "konsumsi") return `${formatAngka(konsumsi)} m³`;
  if (metrik === "rupiah") return formatRupiah(rupiah);
  return `${formatAngka(pelanggan)} SL`;
}

function pickMetricNumber(
  metrik: MetrikPilihan,
  pelanggan: number,
  konsumsi: number,
  rupiah: number
): number {
  if (metrik === "konsumsi") return konsumsi;
  if (metrik === "rupiah") return rupiah;
  return pelanggan;
}

export function DistribusiWilayahTarif({
  wilayah,
  tarif,
}: DistribusiWilayahTarifProps) {
  const [metrikWilayah, setMetrikWilayah] =
    React.useState<MetrikPilihan>("pelanggan");
  const [metrikTarif, setMetrikTarif] =
    React.useState<MetrikPilihan>("pelanggan");

  const totalWilayah = React.useMemo(
    () => ({
      pelanggan: wilayah.reduce((acc, curr) => acc + curr.totalPelanggan, 0),
      konsumsi: wilayah.reduce((acc, curr) => acc + curr.totalPakaiM3, 0),
      rupiah: wilayah.reduce((acc, curr) => acc + curr.totalRupiah, 0),
    }),
    [wilayah]
  );

  const totalTarif = React.useMemo(
    () => ({
      pelanggan: tarif.reduce((acc, curr) => acc + curr.totalPelanggan, 0),
      konsumsi: tarif.reduce((acc, curr) => acc + curr.totalPakaiM3, 0),
      rupiah: tarif.reduce((acc, curr) => acc + curr.totalRupiah, 0),
    }),
    [tarif]
  );

  const maxWilayahValue = React.useMemo(() => {
    return Math.max(
      ...wilayah.map((item) =>
        pickMetricNumber(
          metrikWilayah,
          item.totalPelanggan,
          item.totalPakaiM3,
          item.totalRupiah
        )
      ),
      1
    );
  }, [wilayah, metrikWilayah]);

  const maxTarifValue = React.useMemo(() => {
    return Math.max(
      ...tarif.map((item) =>
        pickMetricNumber(
          metrikTarif,
          item.totalPelanggan,
          item.totalPakaiM3,
          item.totalRupiah
        )
      ),
      1
    );
  }, [tarif, metrikTarif]);

  const activeTotalWilayah = pickMetricNumber(
    metrikWilayah,
    totalWilayah.pelanggan,
    totalWilayah.konsumsi,
    totalWilayah.rupiah
  );

  const activeTotalTarif = pickMetricNumber(
    metrikTarif,
    totalTarif.pelanggan,
    totalTarif.konsumsi,
    totalTarif.rupiah
  );

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      {/* KARTU 1: Sebaran Wilayah Pelayanan (Vercel Breakdown List) */}
      <Card className="flex min-w-0 flex-col rounded-lg border-border/80 bg-card shadow-none">
        <CardHeader className="border-b border-border/60 p-5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-[15px] font-semibold tracking-tight">
                  Sebaran Wilayah Pelayanan
                </CardTitle>
                <Badge variant="gray-subtle" size="sm">
                  {wilayah.length} Kecamatan
                </Badge>
              </div>
              <CardDescription className="mt-0.5 text-[12.5px]">
                Proporsi sambungan, kubikasi, dan tagihan per kecamatan.
              </CardDescription>
            </div>

            <MetricSegmentedControl
              value={metrikWilayah}
              onChange={setMetrikWilayah}
              ariaLabel="Pilih metrik wilayah"
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between p-5 pt-3">
          <div>
            {/* Column Header (sejajar presisi dengan kolom baris & footer) */}
            <div className="mb-2 flex items-center justify-between gap-3 px-2.5 text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
              <span>Kecamatan</span>
              <div className="flex shrink-0 items-center gap-4">
                <span className="min-w-[92px] text-right">Jumlah</span>
                <span className="w-12 text-right">Porsi</span>
              </div>
            </div>

            {/* Vercel Bar-Behind-Row List */}
            <div className="space-y-1.5">
              {wilayah.map((item) => {
                const rawVal = pickMetricNumber(
                  metrikWilayah,
                  item.totalPelanggan,
                  item.totalPakaiM3,
                  item.totalRupiah
                );
                const sharePct =
                  activeTotalWilayah > 0
                    ? Math.round((rawVal / activeTotalWilayah) * 1000) / 10
                    : 0;
                const barWidth =
                  rawVal > 0 ? Math.max((rawVal / maxWilayahValue) * 100, 3) : 0;
                const nilaiDisplay = formatMetricValue(
                  metrikWilayah,
                  item.totalPelanggan,
                  item.totalPakaiM3,
                  item.totalRupiah
                );

                return (
                  <Link
                    key={item.kode}
                    href={`/pelanggan?kecamatan=${item.kode}`}
                    className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-2 transition-colors hover:bg-(--ds-gray-100)/70 dark:hover:bg-(--ds-gray-200)/40"
                  >
                    {/* Proportional Bar Behind Row */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-(--ds-gray-200)/70 transition-all duration-300 dark:bg-(--ds-gray-200)/50"
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />

                    <div className="relative z-10 flex min-w-0 items-center gap-2">
                      <span className="w-10 shrink-0 font-mono text-label-11 font-medium text-muted-foreground">
                        {item.kode}
                      </span>
                      <span className="truncate text-label-13 font-medium text-foreground">
                        {item.nama}
                      </span>
                    </div>

                    <div className="relative z-10 flex shrink-0 items-center gap-4 tabular-nums">
                      <span className="min-w-[92px] text-right text-label-13 font-medium text-foreground">
                        {nilaiDisplay}
                      </span>
                      <span className="w-12 text-right font-mono text-label-12 text-muted-foreground">
                        {sharePct.toLocaleString("id-ID", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer Total (sejajar presisi dengan kolom Jumlah & Porsi) */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 px-2.5 pt-3 text-label-12">
            <span className="text-muted-foreground">
              Total {wilayah.length} Kecamatan
            </span>
            <div className="flex shrink-0 items-center gap-4 tabular-nums">
              <span className="min-w-[92px] text-right font-mono font-semibold text-foreground">
                {formatMetricValue(
                  metrikWilayah,
                  totalWilayah.pelanggan,
                  totalWilayah.konsumsi,
                  totalWilayah.rupiah
                )}
              </span>
              <span className="w-12 text-right font-mono text-muted-foreground">
                {activeTotalWilayah > 0 ? "100%" : "0%"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KARTU 2: Golongan Tarif Pelanggan (Vercel Breakdown List) */}
      <Card className="flex min-w-0 flex-col rounded-lg border-border/80 bg-card shadow-none">
        <CardHeader className="border-b border-border/60 p-5 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-[15px] font-semibold tracking-tight">
                  Golongan Tarif Pelanggan
                </CardTitle>
                <Badge variant="gray-subtle" size="sm">
                  Top {tarif.length}
                </Badge>
              </div>
              <CardDescription className="mt-0.5 text-[12.5px]">
                Komposisi golongan tarif dominan berdasarkan metrik aktif.
              </CardDescription>
            </div>

            <MetricSegmentedControl
              value={metrikTarif}
              onChange={setMetrikTarif}
              ariaLabel="Pilih metrik golongan tarif"
            />
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between p-5 pt-3">
          <div>
            {/* Column Header (sejajar presisi dengan kolom baris & footer) */}
            <div className="mb-2 flex items-center justify-between gap-3 px-2.5 text-label-11 font-medium uppercase tracking-wider text-muted-foreground">
              <span>Golongan</span>
              <div className="flex shrink-0 items-center gap-4">
                <span className="min-w-[92px] text-right">Jumlah</span>
                <span className="w-12 text-right">Porsi</span>
              </div>
            </div>

            {/* Vercel Bar-Behind-Row List */}
            <div className="space-y-1.5">
              {tarif.map((item) => {
                const rawVal = pickMetricNumber(
                  metrikTarif,
                  item.totalPelanggan,
                  item.totalPakaiM3,
                  item.totalRupiah
                );
                const sharePct =
                  activeTotalTarif > 0
                    ? Math.round((rawVal / activeTotalTarif) * 1000) / 10
                    : 0;
                const barWidth =
                  rawVal > 0 ? Math.max((rawVal / maxTarifValue) * 100, 3) : 0;
                const nilaiDisplay = formatMetricValue(
                  metrikTarif,
                  item.totalPelanggan,
                  item.totalPakaiM3,
                  item.totalRupiah
                );

                return (
                  <div
                    key={item.kode}
                    className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-2 transition-colors hover:bg-(--ds-gray-100)/70 dark:hover:bg-(--ds-gray-200)/40"
                  >
                    {/* Proportional Bar Behind Row */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 rounded-md bg-(--ds-gray-200)/70 transition-all duration-300 dark:bg-(--ds-gray-200)/50"
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />

                    <div className="relative z-10 flex min-w-0 items-center gap-2">
                      <span className="w-10 shrink-0 font-mono text-label-11 font-semibold text-foreground">
                        {item.kode}
                      </span>
                      <span
                        title={item.nama}
                        className="truncate text-label-13 text-muted-foreground"
                      >
                        {item.nama}
                      </span>
                    </div>

                    <div className="relative z-10 flex shrink-0 items-center gap-4 tabular-nums">
                      <span className="min-w-[92px] text-right text-label-13 font-medium text-foreground">
                        {nilaiDisplay}
                      </span>
                      <span className="w-12 text-right font-mono text-label-12 text-muted-foreground">
                        {sharePct.toLocaleString("id-ID", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        %
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Total (sejajar presisi dengan kolom Jumlah & Porsi) */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 px-2.5 pt-3 text-label-12">
            <span className="text-muted-foreground">
              Total Top {tarif.length} Golongan
            </span>
            <div className="flex shrink-0 items-center gap-4 tabular-nums">
              <span className="min-w-[92px] text-right font-mono font-semibold text-foreground">
                {formatMetricValue(
                  metrikTarif,
                  totalTarif.pelanggan,
                  totalTarif.konsumsi,
                  totalTarif.rupiah
                )}
              </span>
              <span className="w-12 text-right font-mono text-muted-foreground">
                {activeTotalTarif > 0 ? "100%" : "0%"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
