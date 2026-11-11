// features/dashboard/pengaturan/components/PengaturanHeader.tsx
// Header Konsol Pengaturan & Subnavigasi Tab Bergaris Bawah Gaya Vercel

'use client';

import * as React from 'react';
import {
  User,
  Smartphone,
  FileCheck2,
  Receipt,
  LifeBuoy,
  Sliders,
  RotateCcw,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface TabDef {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DAFTAR_TAB_PENGATURAN: TabDef[] = [
  { value: 'profil', label: 'Profil & Akun', icon: User },
  { value: 'cater', label: 'Catat Meter', icon: Smartphone },
  { value: 'verifikasi', label: 'Verifikasi Stand', icon: FileCheck2 },
  { value: 'billing', label: 'Billing & DRD', icon: Receipt },
  { value: 'pengaduan', label: 'GWM & Layanan', icon: LifeBuoy },
  { value: 'sistem', label: 'Sistem & Audit', icon: Sliders },
];

interface PengaturanHeaderProps {
  toastMessage: { title: string; desc: string } | null;
  onResetDefault: () => void;
  onSimpan: (e: React.FormEvent) => void;
}

export function PengaturanHeader({
  toastMessage,
  onResetDefault,
  onSimpan,
}: PengaturanHeaderProps) {
  return (
    <div className="space-y-0">
      {/* 1. Baris Judul & Tombol Aksi Utama */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-heading-20 font-semibold tracking-tight text-foreground">
              Pengaturan Sistem & Parameter Operasional
            </h1>
            <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary bg-primary/5">
              v2.4.2 Enterprise
            </Badge>
          </div>
          <p className="text-copy-13 text-muted-foreground mt-1">
            Konsol sentral konfigurasi modul Catat Meter, Verifikasi Anomali, Billing DRD, GWM, dan Kebijakan Sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetDefault}
            className="cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Muat Ulang Default
          </Button>

          <Button
            size="sm"
            onClick={onSimpan}
            className="cursor-pointer gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            <Save className="size-3.5" />
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* 2. Subnavigasi Tab Bergaris Bawah (Persis Gaya Vercel & Laporan DRD) */}
      <div className="border-b border-border overflow-x-auto no-scrollbar">
        <TabsList
          className="flex h-10 w-full min-w-max justify-start gap-1 sm:gap-2 bg-transparent p-0 border-0 rounded-none -mb-px"
        >
          {DAFTAR_TAB_PENGATURAN.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-3.5 h-10 text-xs sm:text-sm font-medium transition-colors rounded-none bg-transparent shadow-none cursor-pointer select-none",
                "data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold",
                "data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* 3. Feedback Toast Notifikasi */}
      {toastMessage && (
        <div className="pt-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:text-emerald-300 shadow-sm">
            <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{toastMessage.title}</span>
              <span className="text-xs text-muted-foreground">{toastMessage.desc}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
