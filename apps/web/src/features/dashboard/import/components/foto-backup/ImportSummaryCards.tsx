// apps/web/src/features/dashboard/import/components/foto-backup/ImportSummaryCards.tsx
"use client";

import * as React from "react";
import { Images, Gauge, ShieldCheck, Home, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ImportSummaryCardsProps {
  totalBerkas: number;
  countStand: number;
  countSegel: number;
  countRumah: number;
  totalSL: number;
}

export function ImportSummaryCards({
  totalBerkas,
  countStand,
  countSegel,
  countRumah,
  totalSL,
}: ImportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* Total Berkas */}
      <Card className="border-border bg-card p-3.5 transition-colors hover:border-border/80">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Total Berkas</span>
            <Images className="size-4 text-primary" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {totalBerkas}
            </span>
            <span className="text-label-11 text-muted-foreground">Foto</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            <span>Terunggah dari HP</span>
          </div>
        </CardContent>
      </Card>

      {/* Foto Stand */}
      <Card className="border-border bg-card p-3.5 transition-colors hover:border-sky-500/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Foto Stand</span>
            <Gauge className="size-4 text-sky-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400 font-mono">
              {countStand}
            </span>
            <span className="text-label-11 text-muted-foreground">Berkas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-sky-500" />
            <span>Angka meter stand</span>
          </div>
        </CardContent>
      </Card>

      {/* Foto Segel */}
      <Card className="border-border bg-card p-3.5 transition-colors hover:border-amber-500/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Foto Segel</span>
            <ShieldCheck className="size-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              {countSegel}
            </span>
            <span className="text-label-11 text-muted-foreground">Berkas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
            <span>Integritas fisik segel</span>
          </div>
        </CardContent>
      </Card>

      {/* Foto Rumah */}
      <Card className="border-border bg-card p-3.5 transition-colors hover:border-indigo-500/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Foto Rumah</span>
            <Home className="size-4 text-indigo-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 font-mono">
              {countRumah}
            </span>
            <span className="text-label-11 text-muted-foreground">Berkas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-indigo-500" />
            <span>Fasad & koordinat persil</span>
          </div>
        </CardContent>
      </Card>

      {/* Cakupan SL */}
      <Card className="border-border bg-card p-3.5 transition-colors hover:border-emerald-500/30 col-span-2 sm:col-span-1">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Cakupan SL</span>
            <Users className="size-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {totalSL}
            </span>
            <span className="text-label-11 text-muted-foreground">Pelanggan</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Teridentifikasi</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
