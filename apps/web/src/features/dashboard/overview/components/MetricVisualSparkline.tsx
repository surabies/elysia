"use client"

import * as React from "react"
import { generateMonotoneAreaPath } from "../lib/metric-visual-helpers"

interface MetricVisualSparklineProps {
  data: number[]
  labels?: string[]
  color?: string
  unit?: string
}

export function MetricVisualSparkline({
  data,
  labels,
  color = "#0070f3",
  unit,
}: MetricVisualSparklineProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState(320)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const height = 72

  React.useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth || 320)
      }
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { linePath, areaPath, lastPoint, points } = React.useMemo(() => {
    return generateMonotoneAreaPath(data, width, height, 8, 52, 5)
  }, [data, width])

  const gradientId = React.useId()
  const activePoint =
    hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || points.length === 0) return
    const rect = containerRef.current.getBoundingClientRect()
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const idx = Math.round((relX / Math.max(rect.width, 1)) * (points.length - 1))
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)))
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIdx(null)}
      className="relative flex h-[72px] w-full items-end select-none"
    >
      {/* Tooltip ringkas saat hover (tidak mengubah tampilan diam) */}
      {activePoint ? (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-border bg-popover px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-popover-foreground shadow-xs whitespace-nowrap"
          style={{
            left: `${Math.min(Math.max(activePoint.x - 28, 0), Math.max(width - 76, 0))}px`,
          }}
        >
          {labels && labels[hoverIdx ?? 0] ? labels[hoverIdx ?? 0] : `Tgl ${(hoverIdx ?? 0) + 1}`}: {Math.round(activePoint.value).toLocaleString("id-ID")}
          {unit ? ` ${unit}` : ""}
        </div>
      ) : null}

      <svg
        width={width}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area Gradien Halus */}
        {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}

        {/* Garis Kurva Monotone Halus (1.5px) */}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Garis Panduan Vertikal & Titik Aktif (Hover atau Titik Terakhir) */}
        {activePoint ? (
          <>
            <line
              x1={activePoint.x}
              y1={activePoint.y}
              x2={activePoint.x}
              y2={height}
              stroke={color}
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="3.5"
              fill={color}
              stroke="var(--card)"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <>
            <line
              x1={lastPoint.x}
              y1={lastPoint.y}
              x2={lastPoint.x}
              y2={height}
              stroke={color}
              strokeOpacity="0.25"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="3.5"
              fill={color}
              stroke="var(--card)"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>
    </div>
  )
}
