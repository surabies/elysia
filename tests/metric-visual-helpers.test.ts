import { describe, expect, it } from "bun:test"
import {
  calculatePillHeights,
  calculateSegmentPercentages,
  generateMonotoneAreaPath,
} from "../apps/web/src/features/dashboard/overview/lib/metric-visual-helpers"

describe("Metric Visual Helpers (Pure Math & SVG)", () => {
  it("calculates segment percentages accurately", () => {
    const items = [
      { id: "1", label: "Wilayah 1", value: 6000, color: "#8b5cf6" },
      { id: "2", label: "Wilayah 2", value: 4000, color: "#a78bfa" },
    ]
    const res = calculateSegmentPercentages(items)
    expect(res[0].percent).toBe(60)
    expect(res[1].percent).toBe(40)
  })

  it("handles zero values in segments safely", () => {
    const items = [
      { id: "1", label: "Normal", value: 100, color: "#12b76a" },
      { id: "2", label: "Belum", value: 0, color: "#c9cdd2" },
    ]
    const res = calculateSegmentPercentages(items)
    expect(res[0].percent).toBe(100)
    expect(res[1].percent).toBe(0)
  })

  it("calculates 14 pill heights with minimum clamp for positive values", () => {
    const values = [0, 1, 0, 0, 2, 1, 0, 1, 0, 3, 2, 0, 2, 7]
    const heights = calculatePillHeights(values, 56, 8)
    expect(heights.length).toBe(14)
    expect(heights[0]).toBe(0) // 0 tetap 0
    expect(heights[1]).toBe(8) // 1/7*56 = 8
    expect(heights[13]).toBe(56) // 7/7*56 = 56 (max)
  })

  it("generates monotone area SVG path in upper third of 72px area", () => {
    const data = [24.1, 25.3, 26.4, 26.0, 24.2, 23.1, 23.4, 25.0, 25.4, 24.6, 24.9, 25.2, 25.3, 25.3]
    const { linePath, areaPath, lastPoint } = generateMonotoneAreaPath(data, 350, 72, 3, 27)

    expect(linePath).toContain("M 0,")
    expect(linePath).toContain("C ")
    expect(areaPath).toContain("L 350,72 L 0,72 Z")
    expect(lastPoint.x).toBe(350)
    expect(lastPoint.y).toBeGreaterThanOrEqual(3)
    expect(lastPoint.y).toBeLessThanOrEqual(27)
  })
})
