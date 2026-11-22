// apps/web/src/components/glide-grid/cells/badge-cell.ts
// Custom Cell Renderer untuk Badge/Tag di Glide Data Grid sesuai CanvasTabelVerifikasi.tsx
// Tinggi 24px, pill rounded radius 12px, font 600 12px, rata tengah sempurna

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_SANS } from '../theme';

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

const BADGE_COLORS: Record<
  BadgeTone,
  { bg: string; border: string; text: string; bgDark: string; borderDark: string; textDark: string }
> = {
  red: {
    bg: 'rgba(254, 226, 226, 0.95)',
    border: 'rgba(248, 113, 113, 0.65)',
    text: '#991b1b',
    bgDark: 'rgba(239, 68, 68, 0.18)',
    borderDark: 'rgba(239, 68, 68, 0.45)',
    textDark: '#fca5a5',
  },
  amber: {
    bg: 'rgba(254, 243, 199, 0.95)',
    border: 'rgba(251, 191, 36, 0.65)',
    text: '#92400e',
    bgDark: 'rgba(245, 158, 11, 0.18)',
    borderDark: 'rgba(245, 158, 11, 0.45)',
    textDark: '#fcd34d',
  },
  blue: {
    bg: 'rgba(219, 234, 254, 0.95)',
    border: 'rgba(96, 165, 250, 0.65)',
    text: '#1e40af',
    bgDark: 'rgba(59, 130, 246, 0.18)',
    borderDark: 'rgba(59, 130, 246, 0.45)',
    textDark: '#93c5fd',
  },
  teal: {
    bg: 'rgba(204, 251, 241, 0.95)',
    border: 'rgba(45, 212, 191, 0.65)',
    text: '#115e59',
    bgDark: 'rgba(20, 184, 166, 0.18)',
    borderDark: 'rgba(20, 184, 166, 0.45)',
    textDark: '#5eead4',
  },
  green: {
    bg: 'rgba(209, 250, 229, 0.95)',
    border: 'rgba(52, 211, 153, 0.65)',
    text: '#065f46',
    bgDark: 'rgba(16, 185, 129, 0.18)',
    borderDark: 'rgba(16, 185, 129, 0.45)',
    textDark: '#6ee7b7',
  },
  gray: {
    bg: 'rgba(228, 228, 231, 0.85)',
    border: 'rgba(161, 161, 170, 0.45)',
    text: '#3f3f46',
    bgDark: 'rgba(113, 113, 122, 0.2)',
    borderDark: 'rgba(161, 161, 170, 0.3)',
    textDark: '#e4e4e7',
  },
  purple: {
    bg: 'rgba(243, 232, 255, 0.95)',
    border: 'rgba(192, 132, 252, 0.65)',
    text: '#6b21a8',
    bgDark: 'rgba(168, 85, 247, 0.18)',
    borderDark: 'rgba(168, 85, 247, 0.45)',
    textDark: '#d8b4fe',
  },
};

export const badgeCellRenderer: CustomRenderer<BadgeGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is BadgeGridCell => (c.data as any)?.kind === 'badge-cell',

  draw: (args, cell) => {
    const { ctx, rect, theme } = args;
    const { text, tone = 'gray' } = cell.data;
    if (!text) return true;

    // Deteksi dark mode dari background theme
    const bgThemeLower = (theme.bgCell || '').toLowerCase();
    const isDark =
      bgThemeLower === '#09090b' ||
      bgThemeLower === '#0a0a0a' ||
      bgThemeLower === '#000000' ||
      bgThemeLower === '#18181b';

    const colors = BADGE_COLORS[tone] || BADGE_COLORS.gray;

    const bg = isDark ? colors.bgDark : colors.bg;
    const border = isDark ? colors.borderDark : colors.border;
    const fg = isDark ? colors.textDark : colors.text;

    ctx.save();
    ctx.font = `600 12px ${FONT_SANS}`;
    const textMetrics = ctx.measureText(text);
    const pillHeight = 24;
    const pillWidth = Math.min(rect.width - 12, textMetrics.width + 18);
    const pillX = Math.round(rect.x + (rect.width - pillWidth) / 2);
    const pillY = Math.round(rect.y + (rect.height - pillHeight) / 2);

    // Draw pill rounded rectangle (radius 12px)
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 12);
    } else {
      ctx.rect(pillX, pillY, pillWidth, pillHeight);
    }
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text centered
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pillX + pillWidth / 2, pillY + pillHeight / 2);

    ctx.restore();
    return true;
  },

  measure: (ctx, cell) => {
    const text = cell.data?.text || '';
    ctx.font = `600 12px ${FONT_SANS}`;
    return ctx.measureText(text).width + 24;
  },
};
