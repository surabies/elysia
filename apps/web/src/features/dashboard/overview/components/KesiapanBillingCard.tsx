import Link from "next/link";
import { ArrowUpRight, Lock, Unlock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  KesiapanBilling,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka } from "../lib/format-ringkasan";

interface KesiapanBillingCardProps {
  kesiapan: KesiapanBilling;
  periode: PeriodeInfo;
}

const TOTAL_TICKS = 36;

interface StageRow {
  id: string;
  label: string;
  count: number;
  dotClass: string;
  barClass: string;
}

export function KesiapanBillingCard({
  kesiapan,
  periode,
}: KesiapanBillingCardProps) {
  const isLocked = kesiapan.statusPeriode.toUpperCase() === "TERKUNCI";
  const total = kesiapan.totalCater;

  const stages: StageRow[] = [
    {
      id: "locked",
      label: "Terkunci DRD (Locked)",
      count: kesiapan.lockedBilling,
      dotClass: "bg-emerald-600",
      barClass: "bg-emerald-600",
    },
    {
      id: "final",
      label: "Disahkan Final (V3 / Koreksi)",
      count: kesiapan.approvedFinal,
      dotClass: "bg-emerald-500",
      barClass: "bg-emerald-500",
    },
    {
      id: "v2",
      label: "Disetujui Manager (V2)",
      count: kesiapan.verifiedL2,
      dotClass: "bg-blue-500",
      barClass: "bg-blue-500",
    },
    {
      id: "v1",
      label: "Disetujui Supervisor (V1)",
      count: kesiapan.verifiedL1,
      dotClass: "bg-amber-500",
      barClass: "bg-amber-500",
    },
    {
      id: "submitted",
      label: "Menunggu Screening (Submitted)",
      count: kesiapan.submitted,
      dotClass: "bg-slate-400 dark:bg-slate-500",
      barClass: "bg-slate-400 dark:bg-slate-500",
    },
    {
      id: "resurvey",
      label: "Perlu Cek Ulang (Resurvey)",
      count: kesiapan.needResurvey,
      dotClass: "bg-rose-500",
      barClass: "bg-rose-500",
    },
  ];

  // Bangun 36 strip vertikal proporsional sesuai distribusi tahapan verifikasi
  const tickColors: string[] = [];
  if (total > 0) {
    for (const stage of stages) {
      if (stage.count <= 0) continue;
      const ratio = stage.count / total;
      let count = Math.round(ratio * TOTAL_TICKS);
      if (count === 0) count = 1;
      for (let i = 0; i < count && tickColors.length < TOTAL_TICKS; i++) {
        tickColors.push(stage.barClass);
      }
    }
  }
  while (tickColors.length < TOTAL_TICKS) {
    tickColors.push("bg-border/90 dark:bg-muted/70");
  }

  return (
    <Card className="flex flex-col rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[15px] font-semibold tracking-tight">
                Kesiapan Billing &amp; Verifikasi
              </CardTitle>
              <Badge
                variant={isLocked ? "green-subtle" : "gray-subtle"}
                size="sm"
              >
                {isLocked ? (
                  <>
                    <Lock />
                    Terkunci
                  </>
                ) : (
                  <>
                    <Unlock />
                    {kesiapan.statusPeriode}
                  </>
                )}
              </Badge>
            </div>
            <CardDescription className="mt-0.5 text-[12.5px]">
              Alur pengesahan berjenjang V1–V3 periode {periode.label} menuju Tutup Bulan.
            </CardDescription>
          </div>

          <Link
            href="/tools-tutup/monitoring-tutup-bulan"
            className="group inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-muted/60 hover:text-foreground"
          >
            <span>Tutup Bulan</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between p-5 pt-1">
        {/* Ringkasan Siap Closing + Indikator Vertikal ||||| */}
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12.5px] text-muted-foreground">
              Kesiapan Final / DRD
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[18px] font-semibold tabular-nums text-foreground">
                {kesiapan.persenSiapClosing.toLocaleString("id-ID", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                %
              </span>
              <span className="font-mono text-[11.5px] text-muted-foreground tabular-nums">
                ({formatAngka(kesiapan.approvedFinal + kesiapan.lockedBilling)} /{" "}
                {formatAngka(total)})
              </span>
            </div>
          </div>

          <div
            role="img"
            aria-label={`Distribusi tahapan verifikasi: ${kesiapan.persenSiapClosing}% siap closing`}
            className="my-3 flex h-3 w-full items-center gap-[3px]"
          >
            {tickColors.map((colorClass, idx) => (
              <span
                key={idx}
                className={`h-full flex-1 rounded-[1.5px] ${colorClass}`}
              />
            ))}
          </div>
        </div>

        {/* Rincian 6 Tahapan Verifikasi (Key-Value Ledger) */}
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {stages.map((stage) => {
            const pct =
              total > 0 ? Math.round((stage.count / total) * 1000) / 10 : 0;
            return (
              <div
                key={stage.id}
                className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-[12.5px] last:border-b-0 sm:nth-last-2:border-b-0"
              >
                <dt className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 shrink-0 rounded-full ${stage.dotClass}`}
                  />
                  <span className="truncate">{stage.label}</span>
                </dt>
                <dd className="flex shrink-0 items-baseline gap-1.5 font-medium tabular-nums text-foreground">
                  <span>{formatAngka(stage.count)}</span>
                  <span className="font-mono text-[11px] font-normal text-muted-foreground">
                    {pct}%
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
