"use client";

import {
  animate,
  useMotionValue,
  type MotionValue,
  type Transition,
} from "motion/react";
import * as React from "react";

export const CHART_SCALE_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const chartScaleCssVars = {
  scale01: "var(--chart-1)",
  scale02: "var(--chart-2)",
  scale03: "var(--chart-3)",
  scale04: "var(--chart-4)",
  scale05: "var(--chart-5)",
  patternColor: "var(--muted-foreground)",
};

export function ParentSize({
  children,
  debounceTime = 0,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode;
  debounceTime?: number;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const updateSize = () => {
      const { width, height } = element.getBoundingClientRect();
      const applySize = () => setSize({ width, height });
      if (debounceTime > 0) {
        clearTimeout(timeout);
        timeout = setTimeout(applySize, debounceTime);
      } else {
        applySize();
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [debounceTime]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {children(size)}
    </div>
  );
}

export function useMountProgress(
  transition: Transition | undefined,
  initialValue: number,
  key: string,
): MotionValue<number> {
  const progress = useMotionValue(initialValue);

  React.useEffect(() => {
    progress.set(initialValue);
    const controls = animate(
      progress,
      1,
      transition ?? { duration: 0.8, ease: "easeOut" },
    );
    return () => controls.stop();
  }, [initialValue, key, progress, transition]);

  return progress;
}

export function useEnterComplete(progress: MotionValue<number>): boolean {
  const [complete, setComplete] = React.useState(progress.get() >= 1);

  React.useEffect(
    () =>
      progress.on("change", (value) => {
        setComplete(value >= 1);
      }),
    [progress],
  );

  return complete;
}

export function intFmt(value: number): string {
  return value.toLocaleString("id-ID");
}

interface TooltipBoxProps {
  backgroundColor?: string;
  children: React.ReactNode;
  className?: string;
  containerHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  containerWidth: number;
  panelStyle?: React.CSSProperties;
  visible: boolean;
  x: number;
  y: number;
}

export function TooltipBox({
  backgroundColor = "var(--popover)",
  children,
  className,
  containerHeight,
  containerWidth,
  panelStyle,
  visible,
  x,
  y,
}: TooltipBoxProps) {
  if (!visible) return null;

  const left = Math.max(8, Math.min(x + 12, containerWidth - 220));
  const top = Math.max(8, Math.min(y + 12, containerHeight - 100));

  return (
    <div
      role="tooltip"
      className={`pointer-events-none absolute z-10 max-w-[220px] rounded-md border border-border/70 px-3 py-2 text-xs text-popover-foreground shadow-lg backdrop-blur-sm ${className ?? ""}`}
      style={{
        left,
        top,
        backgroundColor,
        ...panelStyle,
      }}
    >
      {children}
    </div>
  );
}

export interface TooltipRow {
  color: string;
  label: string;
  value: string;
}

export function TooltipContent({
  rows,
  title,
}: {
  rows: TooltipRow[];
  title: string;
}) {
  return (
    <div className="grid gap-1">
      <p className="font-semibold">{title}</p>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            {row.label}
          </span>
          <span className="font-mono tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
