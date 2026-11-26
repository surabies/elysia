// apps/web/src/components/glide-grid/renderers/canvas-drawers.ts
// Kumpulan fungsi rendering kanvas 2D GPU presisi tinggi
// Diadopsi langsung dari CanvasTabelVerifikasi.tsx untuk standarisasi di seluruh aplikasi

import type { Rectangle } from '@glideapps/glide-data-grid';
import { FONT_SANS, FONT_MONO } from '../theme';
import { potongTeksDenganEllipsis } from '../utils/measure';

/**
 * Menggambar Kotak Centang (Checkbox) pada Sel Data (18x18px)
 */
export function drawCheckboxCell(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  isChecked: boolean,
  isDark: boolean
): void {
  const boxSize = 18;
  const boxX = Math.round(rect.x + (rect.width - boxSize) / 2);
  const boxY = Math.round(rect.y + (rect.height - boxSize) / 2);

  ctx.save();
  if (isChecked) {
    ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
    } else {
      ctx.rect(boxX, boxY, boxSize, boxSize);
    }
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(boxX + 3.8, boxY + 9);
    ctx.lineTo(boxX + 7.2, boxY + 13);
    ctx.lineTo(boxX + 14.2, boxY + 5);
    ctx.stroke();
  } else {
    ctx.fillStyle = isDark ? '#18181b' : '#ffffff';
    ctx.strokeStyle = isDark
      ? 'rgba(161, 161, 170, 0.45)'
      : 'rgba(161, 161, 170, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
    } else {
      ctx.rect(boxX, boxY, boxSize, boxSize);
    }
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Menggambar Kotak Centang (Checkbox) pada Header Kolom (Pilih Semua / Indeterminate)
 */
export function drawCheckboxHeader(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  semuaTerpilih: boolean,
  sebagianTerpilih: boolean,
  isDark: boolean
): void {
  const boxSize = 18;
  const boxX = Math.round(rect.x + (rect.width - boxSize) / 2);
  const boxY = Math.round(rect.y + (rect.height - boxSize) / 2);

  ctx.save();
  if (semuaTerpilih) {
    ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
    } else {
      ctx.rect(boxX, boxY, boxSize, boxSize);
    }
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(boxX + 3.8, boxY + 9);
    ctx.lineTo(boxX + 7.2, boxY + 13);
    ctx.lineTo(boxX + 14.2, boxY + 5);
    ctx.stroke();
  } else if (sebagianTerpilih) {
    ctx.fillStyle = isDark ? '#3b82f6' : '#2563eb';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
    } else {
      ctx.rect(boxX, boxY, boxSize, boxSize);
    }
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(boxX + 4.5, boxY + 9);
    ctx.lineTo(boxX + 13.5, boxY + 9);
    ctx.stroke();
  } else {
    ctx.fillStyle = isDark ? '#1f1f23' : '#f4f4f5';
    ctx.strokeStyle = isDark
      ? 'rgba(161, 161, 170, 0.45)'
      : 'rgba(161, 161, 170, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 4);
    } else {
      ctx.rect(boxX, boxY, boxSize, boxSize);
    }
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Menggambar Garis Indikator Stripe di Sisi Kiri Baris (Lebar 3.5px)
 */
export function drawRowStripe(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  stripeColor: string
): void {
  ctx.save();
  ctx.fillStyle = stripeColor;
  ctx.fillRect(rect.x, rect.y, 3.5, rect.height);
  ctx.restore();
}

/**
 * Menggambar Indikator Panah Pengurutan Kolom (▲ / ▼) pada Header Kanvas
 */
export function drawSortIndicator(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  dir: 'asc' | 'desc',
  isDark: boolean
): void {
  ctx.save();
  ctx.fillStyle = isDark ? '#60a5fa' : '#2563eb';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const arrow = dir === 'asc' ? '▲' : '▼';
  // Posisikan panah di sebelah kiri menu dots
  const arrowX = rect.x + rect.width - 24;
  const arrowY = rect.y + rect.height / 2;
  ctx.fillText(arrow, arrowX, arrowY);
  ctx.restore();
}

/**
 * Menggambar Teks dengan Truncation Ellipsis Otomatis saat Lebar Sel Menyusut
 */
export function drawTruncatedTextCell(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  text: string,
  font: string,
  textColor: string,
  bgColor: string,
  paddingX = 10
): void {
  const availableWidth = rect.width - paddingX * 2;
  ctx.save();
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;

  if (textWidth > availableWidth) {
    // Timpa latar belakang sel agar teks terpotong kasar tertutup rapi
    ctx.fillStyle = bgColor;
    ctx.fillRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);

    const truncated = potongTeksDenganEllipsis(ctx, text, availableWidth);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncated, rect.x + paddingX, Math.round(rect.y + rect.height / 2));
  }
  ctx.restore();
}

export interface CornerRadius {
  tl: number;
  tr: number;
  bl: number;
  br: number;
}

/**
 * Menggambar Persegi Panjang Sudut Melengkung (Rounded Rectangle) Portabel
 */
export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | CornerRadius
): void {
  if (width <= 0 || height <= 0) return;
  if (typeof radius === 'number' && radius <= 0) {
    ctx.rect(x, y, width, height);
    return;
  }
  let r: CornerRadius;
  if (typeof radius === 'number') {
    r = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    r = radius;
  }

  r = {
    tl: Math.min(r.tl, height / 2, width / 2),
    tr: Math.min(r.tr, height / 2, width / 2),
    bl: Math.min(r.bl, height / 2, width / 2),
    br: Math.min(r.br, height / 2, width / 2),
  };

  r.tl = Math.max(0, r.tl);
  r.tr = Math.max(0, r.tr);
  r.br = Math.max(0, r.br);
  r.bl = Math.max(0, r.bl);

  ctx.moveTo(x + r.tl, y);
  ctx.arcTo(x + width, y, x + width, y + r.tr, r.tr);
  ctx.arcTo(x + width, y + height, x + width - r.br, y + height, r.br);
  ctx.arcTo(x, y + height, x, y + height - r.bl, r.bl);
  ctx.arcTo(x, y, x + r.tl, y, r.tl);
}

const STAR_POINTS = [
  [50, 5],
  [61.23, 39.55],
  [97.55, 39.55],
  [68.16, 60.9],
  [79.39, 95.45],
  [50, 74.1],
  [20.61, 95.45],
  [31.84, 60.9],
  [2.45, 39.55],
  [38.77, 39.55],
];

/**
 * Menggambar Bentuk Bintang (Star) pada Kanvas
 */
export function pathStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
): void {
  let moved = false;
  for (const p of STAR_POINTS) {
    const x = ((p[0]! - 50) * size) / 100 + cx;
    const y = ((p[1]! - 50) * size) / 100 + cy;

    if (moved) {
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      moved = true;
    }
  }
  ctx.closePath();
}

