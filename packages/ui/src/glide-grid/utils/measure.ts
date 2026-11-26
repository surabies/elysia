// apps/web/src/components/glide-grid/utils/measure.ts
// Utility pengukuran teks kanvas dan kalkulasi lebar kolom adaptif
// Diadopsi dari CanvasTabelVerifikasi.tsx untuk efisiensi rendering 60 FPS

import { FONT_SANS, FONT_MONO } from '../theme';

/**
 * Memotong teks secara presisi dengan akhiran ellipsis ("...") saat lebar teks melebihi lebar sel.
 * Meniru secara sempurna perilaku CSS `truncate` (text-overflow: ellipsis) dari tabel HTML.
 */
export function potongTeksDenganEllipsis(
  ctx: CanvasRenderingContext2D,
  teks: string,
  lebarMaksimal: number
): string {
  if (!teks || lebarMaksimal <= 0) return '';
  const lebarAsli = ctx.measureText(teks).width;
  if (lebarAsli <= lebarMaksimal) return teks;

  const ellipsis = '...';
  const lebarEllipsis = ctx.measureText(ellipsis).width;
  if (lebarEllipsis >= lebarMaksimal) return '...';

  const sisaLebar = lebarMaksimal - lebarEllipsis;
  let rendah = 0;
  let tinggi = teks.length;
  let hasil = '';

  while (rendah <= tinggi) {
    const tengah = Math.floor((rendah + tinggi) / 2);
    const potong = teks.slice(0, tengah);
    const lebarPotong = ctx.measureText(potong).width;

    if (lebarPotong <= sisaLebar) {
      hasil = potong;
      rendah = tengah + 1;
    } else {
      tinggi = tengah - 1;
    }
  }

  return hasil ? `${hasil}...` : '...';
}

export interface UkurKolomItem {
  id: string;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  isMono?: boolean;
}

/**
 * Menghitung lebar kolom secara otomatis berdasarkan panjang teks header dan sampel baris data
 * Menggunakan kanvas 2D off-screen untuk mencegah layout shift.
 */
export function hitungLebarKolomAdaptif<T>(
  columns: UkurKolomItem[],
  sampleRows: T[],
  extractText: (row: T, colId: string) => string,
  minLimits: Record<string, number> = {}
): Record<string, number> {
  const result: Record<string, number> = {};
  if (typeof window === 'undefined' || !columns.length) {
    for (const col of columns) {
      result[col.id] = minLimits[col.id] ?? col.minWidth ?? 120;
    }
    return result;
  }

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return result;

    const sample = sampleRows.slice(0, 50);

    for (const col of columns) {
      const colId = col.id;

      // 1. Ukur teks header (font semibold 13px Geist Sans)
      ctx.font = `600 13px ${FONT_SANS}`;
      const titleWidth = ctx.measureText(col.label).width;
      // Icon (18px) + gap (6px) + menu dots (24px) + sort arrow buffer (16px) + padding kiri-kanan (24px)
      const headerWidth = Math.ceil(titleWidth + 18 + 6 + 24 + 16 + 24);

      // 2. Ukur teks isi sel dari sampel baris
      ctx.font = col.isMono
        ? `500 13px ${FONT_MONO}`
        : `400 13px ${FONT_SANS}`;

      let maxCellWidth = 0;
      for (const row of sample) {
        const text = extractText(row, colId);
        if (text) {
          const w = ctx.measureText(text).width + 24; // padding kiri-kanan 12px
          if (w > maxCellWidth) {
            maxCellWidth = w;
          }
        }
      }

      const fallbackMin = minLimits[colId] ?? col.minWidth ?? 80;
      const finalWidth = Math.min(
        col.maxWidth ?? 600,
        Math.max(fallbackMin, headerWidth, Math.ceil(maxCellWidth + 16))
      );
      result[colId] = finalWidth;
    }
  } catch {
    // Fallback jika konteks canvas gagal dimuat
    for (const col of columns) {
      result[col.id] = minLimits[col.id] ?? col.minWidth ?? 120;
    }
  }

  return result;
}
