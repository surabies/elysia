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
      <Card className="border-border bg-[var(--card)] p-3.5 transition-colors hover:border-border/80">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Total Berkas</span>
            <Images className="size-4 text-[var(--primary)]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[var(--primary-foreground)] font-mono">
              {totalBerkas}
            </span>
            <span className="text-label-11 text-muted-foreground">Foto</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-[var(--primary)]" />
            <span>Terunggah dari HP</span>
          </div>
        </CardContent>
      </Card>

      {/* Foto Stand */}
      <Card className="border-border bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--verif-v2-border)]/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Foto Stand</span>
            <Gauge className="size-4 text-[var(--verif-v2)]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[var(--verif-v2-text)] font-mono">
              {countStand}
            </span>
            <span className="text-label-11 text-muted-foreground">Berkas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v2)]" />
            <span>Angka meter stand</span>
          </div>
        </CardContent>
      </Card>

      {/* Foto Segel */}
      <Card className="border-border bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--verif-v1-border)]/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Foto Segel</span>
            <ShieldCheck className="size-4 text-[var(--verif-v1)]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[var(--verif-v1-text)] font-mono">
              {countSegel}
            </span>
            <span className="text-label-11 text-muted-foreground">Berkas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v1)]" />
            <span>Integritas fisik segel</span>
          </div>
        </CardContent>
      </Card>

      {/* Foto Rumah */}
      <Card className="border-border bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--verif-v2-border)]/30">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Foto Rumah</span>
            <Home className="size-4 text-[var(--verif-v2)]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[var(--verif-v2-text)] font-mono">
              {countRumah}
            </span>
            <span className="text-label-11 text-muted-foreground">Berkas</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-[var(--verif-v2)]" />
            <span>Fasad & koordinat persil</span>
          </div>
        </CardContent>
      </Card>

      {/* Cakupan SL */}
      <Card className="border-border bg-[var(--card)] p-3.5 transition-colors hover:border-[var(--verif-v3-border)]/30 col-span-2 sm:col-span-1">
        <CardContent className="p-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-label-11 font-medium tracking-wide uppercase">Cakupan SL</span>
            <Users className="size-4 text-[var(--verif-v3)]" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[var(--verif-v3-text)] font-mono">
              {totalSL}
            </span>
            <span className="text-label-11 text-muted-foreground">Pelanggan</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-label-11 text-[var(--verif-v3-text)] font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Teridentifikasi</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
