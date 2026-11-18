// features/dashboard/setting-landing/components/SettingLandingHeader.tsx
// Header Bersih untuk Halaman Mandiri Setting Landing Page (Zero Tabs)

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SettingLandingHeaderProps {
  title: string;
  description: string;
  badge?: string;
  extraAction?: React.ReactNode;
}

export function SettingLandingHeader({
  title,
  description,
  badge = 'Setting Landing Page',
  extraAction,
}: SettingLandingHeaderProps) {
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
        {extraAction}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Buka Web Publik
          </Link>
        </Button>
      </div>
    </div>
  );
}
