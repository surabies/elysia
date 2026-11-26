// features/dashboard/pengaturan/components/PengaturanPageHeader.tsx
// Header Bersih untuk Halaman Mandiri Pengaturan Aplikasi (Zero Tabs)

'use client';

import * as React from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PengaturanPageHeaderProps {
  title: string;
  description: string;
  badge?: string;
  onResetDefault?: () => void;
  onSimpan: () => void;
  sedangMenyimpan?: boolean;
}

export function PengaturanPageHeader({
  title,
  description,
  badge = 'Pengaturan Aplikasi',
  onResetDefault,
  onSimpan,
  sedangMenyimpan = false,
}: PengaturanPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-heading-20 font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <Badge
            variant="outline"
            className="font-mono text-xs border-primary/30 text-primary bg-primary/5"
          >
            {badge}
          </Badge>
        </div>
        <p className="text-copy-13 text-muted-foreground mt-1 max-w-3xl">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onResetDefault && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetDefault}
            className="cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset Default SOP
          </Button>
        )}

        <Button
          size="sm"
          onClick={onSimpan}
          disabled={sedangMenyimpan}
          className="cursor-pointer gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
        >
          <Save className="size-3.5" />
          {sedangMenyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </div>
  );
}
