import type { MetricSegmentItem } from "../types/MetricCardTypes"

/**
 * Menghitung persentase lebar segmen secara proporsional.
 */
export function calculateSegmentPercentages(
  items: MetricSegmentItem[]
): { item: MetricSegmentItem; percent: number }[] {
  const total = items.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0)
  if (total <= 0) {
    return items.map((item) => ({ item, percent: 0 }))
  }

  return items.map((item) => {
    if (item.value <= 0) return { item, percent: 0 }
    const percent = (item.value / total) * 100
    return { item, percent }
  })
}

/**
 * Menghitung tinggi isi masing-masing dari 14 pil vertikal (Varian C)
 * Trek setinggi 56px, pil bernilai > 0 minimal setinggi 8px.
 */
export function calculatePillHeights(
  values: number[],
  maxTrackHeight = 56,
  minPillHeight = 8
): number[] {
  const maxValue = Math.max(...values, 0)
  if (maxValue <= 0) {
    return values.map(() => 0)
  }

  return values.map((val) => {
    if (val <= 0) return 0
    const ratio = val / maxValue
    const rawHeight = ratio * maxTrackHeight
    return Math.max(rawHeight, minPillHeight)
  })
}

/**
 * Membentuk jalur kurva halus SVG (Monotone Spline) untuk Sparkline Area (Varian B).
 * Sesuai spesifikasi docs/meterik-card.md:
 * Garis hanya menempati sepertiga atas area (kira-kira 3px - 27px dari atas),
 * sisanya adalah isi gradien transparan sampai dasar area (72px).
 */
export function generateMonotoneAreaPath(
  data: number[],
  width = 350,
  height = 72,
  minY = 3,
  maxY = 27
): {
  linePath: string
  areaPath: string
  lastPoint: { x: number; y: number }
} {
  if (!data || data.length === 0) {
    return {
      linePath: "",
      areaPath: "",
      lastPoint: { x: width, y: maxY },
    }
  }

  if (data.length === 1) {
    const y = (minY + maxY) / 2
    return {
      linePath: `M 0,${y} L ${width},${y}`,
      areaPath: `M 0,${y} L ${width},${y} L ${width},${height} L 0,${height} Z`,
      lastPoint: { x: width, y },
    }
  }

  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const valRange = maxVal - minVal || 1

  // Petakan tiap nilai ke titik koordinat (x, y)
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    // Nilai tinggi = y kecil (di atas), nilai rendah = y besar (di batas maxY)
    const normalized = (val - minVal) / valRange
    const y = maxY - normalized * (maxY - minY)
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) }
  })

  // Membentuk kurva Monotone Catmull-Rom / Bezier halus
  let linePath = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`

  return { linePath, areaPath, lastPoint }
}
