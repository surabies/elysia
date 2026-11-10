import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MetricStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: LucideIcon;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'subtle';
  className?: string;
}

const VALUE_TONES: Record<NonNullable<MetricStatCardProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-(--ds-green-700) dark:text-(--ds-green-800)',
  warning: 'text-(--ds-amber-700) dark:text-(--ds-amber-800)',
  danger: 'text-(--ds-red-700) dark:text-(--ds-red-800)',
  info: 'text-(--ds-blue-700) dark:text-(--ds-blue-800)',
  subtle: 'text-foreground',
};

export function MetricStatCard({
  label,
  value,
  unit,
  description,
  icon: Icon,
  tone = 'default',
  className,
}: MetricStatCardProps) {
  return (
    <Card
      className={cn(
        'min-w-0 p-4 sm:p-5',
        tone === 'subtle' && 'bg-(--ds-gray-100)',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-label-12 text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={cn(
            'text-heading-20 tabular-nums sm:text-heading-24',
            VALUE_TONES[tone],
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-label-12 font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-copy-12 text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}
