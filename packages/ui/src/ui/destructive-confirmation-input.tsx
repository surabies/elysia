"use client";

import * as React from "react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface DestructiveConfirmationInputProps {
  phrase: string;
  onConfirm: () => void;
  confirmLabel?: string;
  placeholder?: string;
  promptText?: string;
  loading?: boolean;
  className?: string;
}

/**
 * Vercel Geist Destructive Confirmation Input
 * Reference: https://vercel.com/geist/destructive-confirmation-input
 */
export function DestructiveConfirmationInput({
  phrase,
  onConfirm,
  confirmLabel = "Konfirmasi Hapus",
  placeholder,
  promptText,
  loading = false,
  className,
}: DestructiveConfirmationInputProps) {
  const [typedValue, setTypedValue] = React.useState("");

  const isMatched = typedValue.trim() === phrase.trim();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isMatched && !loading) {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <div className={cn("space-y-3 select-none", className)}>
      <p className="text-xs text-muted-foreground leading-normal">
        {promptText ?? (
          <>
            Untuk mengonfirmasi, ketik kalimat verifikasi:{" "}
            <strong className="font-mono text-foreground font-semibold">
              “{phrase}”
            </strong>{" "}
            di bawah ini.
          </>
        )}
      </p>

      <Input
        value={typedValue}
        onChange={(e) => setTypedValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? phrase}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        disabled={loading}
        className="font-mono text-xs"
      />

      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={!isMatched || loading}
        onClick={onConfirm}
        className="w-full text-xs font-semibold"
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
