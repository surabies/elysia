import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageSectionHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageSectionHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageSectionHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-heading-20 text-foreground">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-copy-13 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
