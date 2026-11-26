import * as React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IThemeSwitcherContract } from "../contracts/component-contracts";

export interface ThemeSwitcherProps
  extends React.HTMLAttributes<HTMLDivElement>,
    IThemeSwitcherContract {}

/**
 * Geist Segmented Theme Switcher (Light / Dark / System)
 * Reference: https://vercel.com/geist/theme-switcher
 */
export function ThemeSwitcher({
  theme = "system",
  onThemeChange,
  className,
  ...props
}: ThemeSwitcherProps) {
  const options: Array<{ id: "light" | "dark" | "system"; icon: React.ReactNode; label: string }> = [
    { id: "light", icon: <Sun className="size-3.5" />, label: "Light" },
    { id: "dark", icon: <Moon className="size-3.5" />, label: "Dark" },
    { id: "system", icon: <Laptop className="size-3.5" />, label: "System" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme switcher"
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs shadow-2xs",
        className
      )}
      {...props}
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onThemeChange?.(opt.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all select-none",
              isActive
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
