"use client"

import * as React from "react"
import { generateMonotoneAreaPath } from "../lib/metric-visual-helpers"

interface MetricVisualSparklineProps {
  data: number[]
  color?: string
}

export function MetricVisualSparkline({
  data,
  color = "#12b76a",
}: MetricVisualSparklineProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = React.useState(350)
  const height = 72

  React.useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth || 350)
      }
    }
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { linePath, areaPath, lastPoint } = React.useMemo(() => {
    return generateMonotoneAreaPath(data, width, height, 4, 27)
  }, [data, width])

  const gradientId = React.useId()

  return (
    <div
      ref={containerRef}
      className="relative flex h-[72px] w-full items-end overflow-hidden select-none"
    >
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area Gradien */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Garis Kurva Halus (1.5px) */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Garis Putus-putus Vertikal di Titik Terakhir */}
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

        {/* Titik Lingkaran Solid 6px di Ujung Kanan */}
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
      </svg>
    </div>
  )
}
