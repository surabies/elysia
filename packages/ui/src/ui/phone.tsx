import * as React from "react";
import { cn } from "@/lib/utils";
import type { IPhoneContract } from "../contracts/component-contracts";

export interface PhoneProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    IPhoneContract {}

/**
 * Geist Phone Device Mockup Frame
 * Reference: https://vercel.com/geist/phone
 */
export function Phone({
  notch = true,
  children,
  className,
  ...props
}: PhoneProps) {
  return (
    <div
      className={cn(
        "relative mx-auto flex w-[280px] flex-col overflow-hidden rounded-[38px] border-4 border-zinc-800 bg-background shadow-xl dark:border-zinc-700",
        className
      )}
      {...props}
    >
      {/* Top Island / Notch */}
      {notch && (
        <div className="absolute top-2 left-1/2 z-20 h-4 w-24 -translate-x-1/2 rounded-full bg-zinc-800 dark:bg-zinc-700" />
      )}

      {/* Phone Screen */}
      <div className="min-h-[460px] flex-1 overflow-auto p-4 pt-8">
        {children}
      </div>

      {/* Bottom Bar indicator */}
      <div className="flex h-5 items-center justify-center pb-1">
        <span className="h-1 w-20 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  );
}
