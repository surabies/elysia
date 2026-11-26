// features/dashboard/import/components/shared/ImportResultBanner.tsx
import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@cater/ui";
import { cn } from "@/lib/utils";
import { TONE_STYLE, type ImportTone } from "../../lib/import-ui";

interface ImportResultBannerProps {
  tone: Exclude<ImportTone, "neutral">;
  title: string;
  description: React.ReactNode;
  batchLabel?: string;
  /** Badge status / tombol di sisi kanan. */
  actions?: React.ReactNode;
}

export function ImportResultBanner({
  tone,
  title,
  description,
  batchLabel = "Batch Selesai",
  actions,
}: ImportResultBannerProps) {
  const style = TONE_STYLE[tone];

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
        style.soft,
        style.border,
      )}
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          className={cn("geist-icon mt-0.5 shrink-0", style.text)}
          aria-hidden
        />
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-label-14", style.text)}>{title}</span>
            <Badge variant={style.badgeSolid}>{batchLabel}</Badge>
          </div>
          <p className={cn("text-copy-13", style.text)}>{description}</p>
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
