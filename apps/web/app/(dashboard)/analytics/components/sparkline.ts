/**
 * Utility: Unicode Sparkline Generator
 * Replicates Vercel Observability data-md Trend representation:
 * Characters: ' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'
 */

export function generateUnicodeSparkline(numbers: number[]): string {
  if (!numbers || numbers.length === 0) return " ";
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  if (min === max) {
    return "▄".repeat(Math.min(numbers.length, 30));
  }

  const bars = [" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const range = max - min;

  return numbers
    .map((val) => {
      const normalized = (val - min) / range;
      const idx = Math.min(bars.length - 1, Math.floor(normalized * (bars.length - 1)));
      return bars[idx];
    })
    .join("");
}
