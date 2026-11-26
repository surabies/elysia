interface DayRow {
  hari: string;
  tanggal: string;
}

/**
 * Melengkapi deret harian dari tanggal 1 sampai hari terakhir;
 * hari tanpa data tetap muncul lewat `build(undefined, day)`.
 */
export function expandByDay<T extends DayRow, R>(
  rows: readonly T[],
  build: (row: T | undefined, day: DayRow) => R,
): R[] {
  const lastDay = Number(rows.at(-1)?.hari ?? 0);
  const month = rows[0]?.tanggal.slice(0, 7) ?? "";
  const byDay = new Map(rows.map((row) => [Number(row.hari), row] as const));

  return Array.from({ length: lastDay }, (_, index) => {
    const hari = String(index + 1).padStart(2, "0");
    const row = byDay.get(index + 1);
    return build(row, { hari, tanggal: row?.tanggal ?? `${month}-${hari}` });
  });
}
