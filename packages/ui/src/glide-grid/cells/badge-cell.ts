// apps/web/src/components/glide-grid/cells/badge-cell.ts
// Custom Cell Renderer untuk Badge/Tag di Glide Data Grid sesuai Standar Vercel Geist (docs/VERCEL_GEIST_GUIDE.md)
// - Ukuran sm: tinggi 20px (h-5), font 500 11px (text-label-11), tepi moderat radius 5px (tidak terlalu bulat & tidak terlalu kotak)
// - Palet warna terikat langsung ke token Vercel Geist (--ds-*-200, --ds-*-300, --ds-*-900)
// - Dilengkapi smart text truncation (...) + inner canvas clip agar teks tidak pernah keluar dari border badge saat kolom disusutkan

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { roundedRect } from '../renderers/canvas-drawers';
import { FONT_SANS } from '../theme';
import { potongTeksDenganEllipsis } from '../utils/measure';

export type BadgeTone = 'red' | 'amber' | 'blue' | 'teal' | 'green' | 'gray' | 'purple';

export interface BadgeCellData {
  kind: 'badge-cell';
  text: string;
  tone?: BadgeTone;
}

export type BadgeGridCell = CustomCell<BadgeCellData>;

export function createBadgeCell(text: string, tone?: BadgeTone): BadgeGridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: text,
    data: {
      kind: 'badge-cell',
      text,
      tone,
    },
  };
}

/**
 * Token warna resmi Vercel Geist Subtle Badge (globals.css --ds-*-200 / --ds-*-300 / --ds-*-900)
 */
const BADGE_COLORS: Record<
  BadgeTone,
  { bg: string; border: string; text: string; bgDark: string; borderDark: string; textDark: string }
> = {
  red: {
    bg: '#ffd6d6', // --ds-red-200
    border: '#ffb8b8', // --ds-red-300
    text: '#990000', // --ds-red-900
    bgDark: '#420000', // --ds-red-200 (dark)
    borderDark: '#5c0000', // --ds-red-300 (dark)
    textDark: '#ff8a8a', // --ds-red-900 (dark)
  },
  amber: {
    bg: '#feefc3', // --ds-amber-200
    border: '#fedb88', // --ds-amber-300
    text: '#7a3e00', // --ds-amber-900
    bgDark: '#3b1c00', // --ds-amber-200 (dark)
    borderDark: '#542900', // --ds-amber-300 (dark)
    textDark: '#f8c266', // --ds-amber-900 (dark)
  },
  blue: {
    bg: '#d1e9ff', // --ds-blue-200
    border: '#b2d7ff', // --ds-blue-300
    text: '#004ecc', // --ds-blue-900
    bgDark: '#002554', // --ds-blue-200 (dark)
    borderDark: '#003778', // --ds-blue-300 (dark)
    textDark: '#52a5ff', // --ds-blue-900 (dark)
  },
  teal: {
    bg: '#d4f9f6', // --ds-teal-200
    border: '#a7f1ec', // --ds-teal-300
    text: '#004a3d', // --ds-teal-900
    bgDark: '#002c26', // --ds-teal-200 (dark)
    borderDark: '#003f37', // --ds-teal-300 (dark)
    textDark: '#3fe0c8', // --ds-teal-900 (dark)
  },
  green: {
    bg: '#d3f9e0', // --ds-green-200
    border: '#a8f1c4', // --ds-green-300
    text: '#00632e', // --ds-green-900
    bgDark: '#002e12', // --ds-green-200 (dark)
    borderDark: '#00451d', // --ds-green-300 (dark)
    textDark: '#70e1a1', // --ds-green-900 (dark)
  },
  gray: {
    bg: '#ebebeb', // --ds-gray-200
    border: '#e5e5e5', // --ds-gray-400
    text: '#171717', // --ds-gray-1000
    bgDark: '#1f1f1f', // --ds-gray-200 (dark)
    borderDark: '#2e2e2e', // --ds-gray-400 (dark)
    textDark: '#ededed', // --ds-gray-1000 (dark)
  },
  purple: {
    bg: '#f3e8ff', // --ds-purple-200
    border: '#e9d5ff', // --ds-purple-300
    text: '#581c87', // --ds-purple-900
    bgDark: '#290a47', // --ds-purple-200 (dark)
    borderDark: '#3d1066', // --ds-purple-300 (dark)
    textDark: '#d8b4fe', // --ds-purple-900 (dark)
  },
};

export const badgeCellRenderer: CustomRenderer<BadgeGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is BadgeGridCell => (c.data as any)?.kind === 'badge-cell',

  draw: (args, cell) => {
    const { ctx, rect, theme } = args;
    const { text, tone = 'gray' } = cell.data;
    if (!text) return true;

    const cellPadX = 8;
    const maxBadgeWidth = rect.width - cellPadX * 2;
    if (maxBadgeWidth <= 10) return true;

    // Deteksi dark mode secara akurat (termasuk saat baris aktif memiliki bgCell rgba override)
    const bgThemeLower = (theme.bgCell || '').toLowerCase();
    const isDark =
      (typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')) ||
      bgThemeLower === '#09090b' ||
      bgThemeLower === '#0a0a0a' ||
      bgThemeLower === '#000000' ||
      bgThemeLower === '#18181b' ||
      (theme.borderColor || '').toLowerCase() === '#27272a';

    const colors = BADGE_COLORS[tone] || BADGE_COLORS.gray;
    const bg = isDark ? colors.bgDark : colors.bg;
    const border = isDark ? colors.borderDark : colors.border;
    const fg = isDark ? colors.textDark : colors.text;

    ctx.save();
    // Font Geist text-label-11 (500 11px)
    ctx.font = `500 11px ${FONT_SANS}`;

    const innerPadX = 7;
    const fullTextWidth = ctx.measureText(text).width;
    const idealBadgeWidth = Math.ceil(fullTextWidth + innerPadX * 2);

    // Tinggi badge ringkas 20px (h-5 Geist sm) dan tidak pernah melebihi tinggi sel
    const badgeHeight = Math.min(20, Math.max(14, rect.height - 12));
    const badgeWidth = Math.max(16, Math.min(maxBadgeWidth, idealBadgeWidth));
    const badgeX = Math.round(rect.x + (rect.width - badgeWidth) / 2);
    const badgeY = Math.round(rect.y + (rect.height - badgeHeight) / 2);

    // Radius 5px: gaya Vercel Geist compact control/tag (tidak terlalu bulat pill & tidak terlalu kotak tajam)
    const badgeRadius = 5;

    ctx.beginPath();
    roundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Clip ke area dalam badge agar teks tidak pernah bisa bocor keluar dari border badge
    const availableTextWidth = Math.max(0, badgeWidth - innerPadX * 2);
    if (availableTextWidth > 2) {
      ctx.beginPath();
      ctx.rect(
        badgeX + innerPadX - 1,
        badgeY + 1,
        availableTextWidth + 2,
        Math.max(0, badgeHeight - 2)
      );
      ctx.clip();

      const displayText =
        fullTextWidth > availableTextWidth
          ? potongTeksDenganEllipsis(ctx, text, availableTextWidth)
          : text;

      if (displayText) {
        ctx.fillStyle = fg;
        ctx.textBaseline = 'middle';
        if (fullTextWidth > availableTextWidth) {
          ctx.textAlign = 'left';
          ctx.fillText(
            displayText,
            badgeX + innerPadX,
            Math.round(badgeY + badgeHeight / 2 + 0.5)
          );
        } else {
          ctx.textAlign = 'center';
          ctx.fillText(
            displayText,
            Math.round(badgeX + badgeWidth / 2),
            Math.round(badgeY + badgeHeight / 2 + 0.5)
          );
        }
      }
    }

    ctx.restore();
    return true;
  },

  measure: (ctx, cell) => {
    const text = cell.data?.text || '';
    ctx.font = `500 11px ${FONT_SANS}`;
    return Math.ceil(ctx.measureText(text).width + 30);
  },
};
