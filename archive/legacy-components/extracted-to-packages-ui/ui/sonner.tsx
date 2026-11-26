"use client";

import * as React from "react";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Toaster dengan Material Styling Vercel Geist (vercel.com/geist/materials)
 * Floating Material Elevation:
 * - Surface: Pitch black (#000000) pada dark mode, pure white (#ffffff) pada light mode
 * - Stroke: Fine 1px border dengan kontras halus (var(--border))
 * - Radius: 8px (rounded-lg)
 * - Typography: Geist Sans (text-[13px] title, text-[12px] description)
 * - Close button: Minimalist Ghost button di pojok kanan dalam card (bukan circular badge melayang)
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = (mounted && resolvedTheme === "dark") ? "dark" : "light";

  return (
    <Sonner
      theme={activeTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans rounded-lg border text-foreground shadow-lg text-[13px] tracking-tight p-3.5 gap-2.5 bg-background border-border",
          title: "font-medium text-foreground text-[13px] leading-snug",
          description: "text-muted-foreground text-[12px] font-normal leading-relaxed mt-0.5",
          actionButton:
            "bg-foreground text-background text-[12px] font-medium rounded-md px-2.5 py-1 transition-opacity hover:opacity-90",
          cancelButton:
            "border border-border bg-transparent text-muted-foreground hover:text-foreground text-[12px] font-medium rounded-md px-2.5 py-1 transition-colors",
          closeButton:
            "geist-toast-close-btn",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500 shrink-0" />,
        info: <InfoIcon className="size-4 text-blue-500 shrink-0" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500 shrink-0" />,
        error: <OctagonXIcon className="size-4 text-rose-500 shrink-0" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground shrink-0" />,
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "8px",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
