/**
 * Formatter angka berbahasa Indonesia (titik sebagai ribuan, koma sebagai desimal)
 * dengan fallback '-' untuk nilai null / kosong.
 */

export function formatRibuan(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatDesimal(
  val: number | null | undefined,
  digit: number = 2
): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  }).format(val);
}

export function formatPersen(
  val: number | null | undefined,
  digit: number = 1
): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  }).format(val)}%`;
}

export function formatDelta(
  val: number | null | undefined,
  digit: number = 0
): { text: string; status: 'positif' | 'negatif' | 'netral' } {
  if (val === null || val === undefined || isNaN(val)) {
    return { text: '-', status: 'netral' };
  }
  if (val === 0) {
    return { text: '0', status: 'netral' };
  }
  const prefix = val > 0 ? '+' : '';
  const formatted =
    digit > 0
      ? formatDesimal(val, digit)
      : formatRibuan(val);
  return {
    text: `${prefix}${formatted}`,
    status: val > 0 ? 'positif' : 'negatif',
  };
}
