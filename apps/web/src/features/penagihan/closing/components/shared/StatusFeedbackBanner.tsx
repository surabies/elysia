'use client';

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FeedbackNotice {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface StatusFeedbackBannerProps {
  feedback: FeedbackNotice | null;
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<FeedbackNotice['type'], string> = {
  success:
    'border-(--ds-green-300) bg-(--ds-green-100) text-(--ds-green-900) dark:border-(--ds-green-400) dark:bg-(--ds-green-200)',
  error:
    'border-(--ds-red-300) bg-(--ds-red-100) text-(--ds-red-900) dark:border-(--ds-red-400) dark:bg-(--ds-red-200)',
  warning:
    'border-(--ds-amber-300) bg-(--ds-amber-100) text-(--ds-amber-900) dark:border-(--ds-amber-400) dark:bg-(--ds-amber-200)',
  info:
    'border-(--ds-blue-300) bg-(--ds-blue-100) text-(--ds-blue-900) dark:border-(--ds-blue-400) dark:bg-(--ds-blue-200)',
};

export function StatusFeedbackBanner({
  feedback,
  onDismiss,
  className,
}: StatusFeedbackBannerProps) {
  if (!feedback) return null;

  const Icon =
    feedback.type === 'success'
      ? CheckCircle2
      : feedback.type === 'info'
        ? Info
        : AlertTriangle;

  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-copy-13',
        VARIANT_STYLES[feedback.type],
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 shrink-0" />
        <span className="text-label-13">{feedback.message}</span>
      </div>
      {onDismiss && (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Tutup pesan"
          onClick={onDismiss}
          className="shrink-0 text-current hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
