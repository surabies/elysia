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
 * Membentuk jalur kurva halus SVG (Monotone Cubic) untuk Sparkline Area (Varian B).
 * Menggunakan tangen monoton (Fritsch-Carlson) + clamp agar tidak pernah overshoot
 * pada lonjakan data tajam, serta menyisakan padding kanan agar titik akhir tidak terpotong.
 */
export function generateMonotoneAreaPath(
  data: number[],
  width = 350,
  height = 72,
  minY = 8,
  maxY = 52,
  padRight = 4
): {
  linePath: string
  areaPath: string
  lastPoint: { x: number; y: number }
  points: { x: number; y: number; value: number }[]
} {
  const usableWidth = Math.max(width - padRight, 1)

  if (!data || data.length === 0) {
    return {
      linePath: "",
      areaPath: "",
      lastPoint: { x: usableWidth, y: maxY },
      points: [],
    }
  }

  if (data.length === 1) {
    const y = (minY + maxY) / 2
    const pt = { x: usableWidth, y, value: data[0] ?? 0 }
    return {
      linePath: `M 0,${y} L ${usableWidth},${y}`,
      areaPath: `M 0,${y} L ${usableWidth},${y} L ${usableWidth},${height} L 0,${height} Z`,
      lastPoint: { x: usableWidth, y },
      points: [pt],
    }
  }

  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const valRange = maxVal - minVal

  // Petakan tiap nilai ke titik koordinat (x, y)
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * usableWidth
    const normalized = valRange > 0 ? (val - minVal) / valRange : 0.5
    const y = maxY - normalized * (maxY - minY)
    return {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      value: val,
    }
  })

  const clampY = (y: number) => Math.max(minY, Math.min(maxY, y))

  // Hitung kemiringan antar segmen untuk kurva monoton tanpa overshoot
  const slopes: number[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x || 1
    slopes.push((points[i + 1].y - points[i].y) / dx)
  }

  const tangents: number[] = new Array(points.length).fill(0)
  tangents[0] = slopes[0] ?? 0
  tangents[points.length - 1] = slopes[slopes.length - 1] ?? 0

  for (let i = 1; i < points.length - 1; i++) {
    const prev = slopes[i - 1]
    const next = slopes[i]
    if (prev * next <= 0) {
      // Ekstrem lokal / datar -> tangen 0 agar tidak overshoot
      tangents[i] = 0
    } else {
      tangents[i] = (prev + next) / 2
    }
  }

  let linePath = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const dx = (p2.x - p1.x) / 3

    const cp1x = p1.x + dx
    const cp1y = clampY(p1.y + tangents[i] * dx)
    const cp2x = p2.x - dx
    const cp2y = clampY(p2.y - tangents[i + 1] * dx)

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x},${height} L ${points[0].x},${height} Z`

  return {
    linePath,
    areaPath,
    lastPoint: { x: lastPoint.x, y: lastPoint.y },
    points,
  }
}
