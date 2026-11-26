import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { MessageSquare, Smile, Meh, Frown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IFeedbackContract } from "../contracts/component-contracts";

export interface FeedbackProps extends IFeedbackContract {
  triggerLabel?: string;
  className?: string;
}

/**
 * Geist Feedback Dialog / Popover
 * Reference: https://vercel.com/geist/feedback
 */
export function Feedback({
  title = "Apakah halaman ini membantu?",
  onSubmit,
  onClose,
  triggerLabel = "Feedback",
  className,
}: FeedbackProps) {
  const [open, setOpen] = React.useState(false);
  const [score, setScore] = React.useState<number | undefined>(undefined);
  const [message, setMessage] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && score === undefined) return;
    setLoading(true);
    try {
      await onSubmit({ score, message });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setScore(undefined);
        setMessage("");
        onClose?.();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", className)}>
          <MessageSquare className="size-3.5" />
          <span>{triggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 text-xs">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60">
              <Check className="size-4" />
            </div>
            <p className="font-semibold text-foreground">Terima kasih atas tanggapan Anda!</p>
            <p className="text-[11px] text-muted-foreground">Masukan Anda membantu kami mengembangkan sistem.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <h4 className="font-medium text-foreground text-xs">{title}</h4>

            {/* Score Selector */}
            <div className="flex items-center justify-around rounded-md border border-border p-1 bg-muted/20">
              <button
                type="button"
                onClick={() => setScore(1)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                  score === 1 ? "bg-red-100 text-red-600 dark:bg-red-950" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Frown className="size-4" />
                <span className="text-[11px]">Kurang</span>
              </button>
              <button
                type="button"
                onClick={() => setScore(2)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                  score === 2 ? "bg-amber-100 text-amber-600 dark:bg-amber-950" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Meh className="size-4" />
                <span className="text-[11px]">Cukup</span>
              </button>
              <button
                type="button"
                onClick={() => setScore(3)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 transition-colors",
                  score === 3 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Smile className="size-4" />
                <span className="text-[11px]">Puas</span>
              </button>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Berikan saran atau laporan kendala..."
              className="h-20 resize-none text-xs"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="xs" disabled={loading}>
                {loading ? "Mengirim..." : "Kirim"}
              </Button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
