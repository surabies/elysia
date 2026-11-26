import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { AlertTriangle } from "lucide-react";
import type { IDestructiveActionModalContract } from "../contracts/component-contracts";

export interface DestructiveActionModalProps extends IDestructiveActionModalContract {}

/**
 * Geist Destructive Action Modal
 * Modal designed specifically for critical or irreversible operations (e.g. Delete, Drop, Terminate).
 * Reference: https://vercel.com/geist/destructive-action-modal
 */
export function DestructiveActionModal({
  open,
  onOpenChange,
  title,
  description,
  verificationPhrase,
  confirmLabel = "Hapus Permanen",
  cancelLabel = "Batal",
  onConfirm,
  loading = false,
}: DestructiveActionModalProps) {
  const [inputValue, setInputValue] = React.useState("");

  const isMatched = !verificationPhrase || inputValue.trim() === verificationPhrase.trim();

  React.useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-destructive">
            <div className="flex size-8 items-center justify-center rounded-full bg-red-100 text-destructive dark:bg-red-950/60">
              <AlertTriangle className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="pt-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {verificationPhrase && (
          <div className="space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              Ketik <span className="font-mono font-semibold text-foreground">{verificationPhrase}</span> untuk konfirmasi:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={verificationPhrase}
              className="font-mono text-xs"
              autoFocus
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!isMatched || loading}
            onClick={onConfirm}
          >
            {loading ? "Memproses..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
