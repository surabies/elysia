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
  backgroundColor,
  children,
  className,
  containerHeight,
  containerWidth,
  panelStyle,
  visible,
  x,
  y,
}: TooltipBoxProps) {
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const [boxSize, setBoxSize] = React.useState({ width: 224, height: 96 });

  React.useLayoutEffect(() => {
    if (!visible || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setBoxSize((prev) =>
        Math.abs(prev.width - rect.width) > 1 ||
        Math.abs(prev.height - rect.height) > 1
          ? { width: rect.width, height: rect.height }
          : prev
      );
    }
  }, [visible, children]);

  if (!visible || containerWidth <= 0 || containerHeight <= 0) return null;

  const pad = 12;
  const boxW = boxSize.width;
  const boxH = boxSize.height;

  // 1. Pilih kuadran terbaik (4 arah: kiri/kanan & atas/bawah) berdasarkan ruang kosong terbesar
  const spaceRight = containerWidth - x - pad;
  const spaceLeft = x - pad;
  const placeRight = spaceRight >= spaceLeft;
  const dirX = placeRight ? 1 : -1;

  const spaceAbove = y - pad;
  const spaceBelow = containerHeight - y - pad;
  const placeAbove = spaceAbove >= spaceBelow;
  const dirY = placeAbove ? -1 : 1;

  const availX = placeRight ? spaceRight : spaceLeft;

  let clampedLeft: number;
  let top: number;
  let attachX: number;
  let attachY: number;
  let leaderPath: string;

  if (availX >= boxW + 22) {
    // Mode Utama (4-Kuadran Editorial Callout): garis miring -> lengkung halus -> lengan horizontal
    const totalGap = Math.min(44, availX - boxW);
    const diagX = Math.max(14, Math.round(totalGap * 0.58));
    const diagY = Math.min(26, Math.max(14, Math.round(diagX * 0.95)));

    clampedLeft = placeRight ? x + totalGap : x - totalGap - boxW;
    clampedLeft = Math.max(pad, Math.min(clampedLeft, containerWidth - boxW - pad));

    const idealKneeY = y + dirY * diagY;
    top = Math.max(
      pad,
      Math.min(containerHeight - pad - boxH, idealKneeY - boxH / 2)
    );

    // Kunci kneeY di dalam rentang tepi kartu agar lengan horizontal SELALU 100% datar
    const kneeX = x + dirX * diagX;
    const kneeY = Math.max(top + 16, Math.min(top + boxH - 16, idealKneeY));

    attachX = placeRight ? clampedLeft : clampedLeft + boxW;
    attachY = kneeY;

    // Hitung lengkungan Quadratic Bezier yang tangen-kontinu (C1-smooth) pada sudut siku
    const dx = kneeX - x;
    const dy = kneeY - y;
    const diagLen = Math.hypot(dx, dy) || 1;
    const armLen = Math.abs(attachX - kneeX);
    const r = Math.min(9, diagLen * 0.42, armLen * 0.55);

    const p1x = kneeX - (dx / diagLen) * r;
    const p1y = kneeY - (dy / diagLen) * r;
    const p2x = kneeX + dirX * r;
    const p2y = kneeY;

    leaderPath = `M ${x.toFixed(1)},${y.toFixed(1)} L ${p1x.toFixed(1)},${p1y.toFixed(1)} Q ${kneeX.toFixed(1)},${kneeY.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} L ${attachX.toFixed(1)},${attachY.toFixed(1)}`;
  } else {
    // Fallback Layar Sempit: tampilkan di atas/bawah pin dengan kurva halus agar tidak tumpang tindih
    const stemY = 26;
    clampedLeft = Math.max(
      pad,
      Math.min(x - boxW / 2, containerWidth - boxW - pad)
    );
    top = placeAbove
      ? Math.max(pad, y - stemY - boxH)
      : Math.min(containerHeight - pad - boxH, y + stemY);

    attachX = Math.max(clampedLeft + 18, Math.min(x, clampedLeft + boxW - 18));
    attachY = placeAbove ? top + boxH : top;

    const midY = (y + attachY) / 2;
    leaderPath = `M ${x.toFixed(1)},${y.toFixed(1)} C ${x.toFixed(1)},${midY.toFixed(1)} ${attachX.toFixed(1)},${midY.toFixed(1)} ${attachX.toFixed(1)},${attachY.toFixed(1)}`;
  }

  return (
    <>
      {/* SVG Editorial Callout: Senada dengan border & material kartu tooltip Geist */}
      <svg
        aria-hidden="true"
        width={containerWidth}
        height={containerHeight}
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      >
        {/* Backing halo halus agar garis tetap terbaca bersih di atas poligon warna apa pun */}
        <path
          d={leaderPath}
          fill="none"
          stroke="var(--card)"
          strokeOpacity="0.75"
          strokeWidth="3.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Garis utama senada dengan border kartu tooltip */}
        <path
          d={leaderPath}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity="0.6"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Node sambungan berlubang (hollow node) yang menyatu dengan tepi kartu tooltip */}
        <circle
          cx={attachX}
          cy={attachY}
          r="2.5"
          fill="var(--popover)"
          stroke="var(--muted-foreground)"
          strokeOpacity="0.7"
          strokeWidth="1.25"
        />

        {/* Pin target di pusat poligon peta — senada dengan permukaan popover */}
        <circle
          cx={x}
          cy={y}
          r="6.5"
          fill="var(--popover)"
          fillOpacity="0.45"
          stroke="var(--muted-foreground)"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <circle
          cx={x}
          cy={y}
          r="3"
          fill="var(--popover)"
          stroke="var(--foreground)"
          strokeOpacity="0.85"
          strokeWidth="1.5"
        />
      </svg>

      {/* Kartu Tooltip Mengambang (Glassmorphic Vercel Geist) */}
      <div
        ref={boxRef}
        role="tooltip"
        className={`pointer-events-none absolute z-20 min-w-[208px] max-w-[252px] rounded-xl border border-border/80 bg-popover/95 px-3.5 py-2.5 text-xs text-popover-foreground shadow-[0_8px_28px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[left,top] duration-150 ease-out dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] ${className ?? ""}`}
        style={{
          left: clampedLeft,
          top,
          ...(backgroundColor ? { backgroundColor } : {}),
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </>
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
