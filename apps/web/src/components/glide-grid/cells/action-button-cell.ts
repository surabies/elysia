// apps/web/src/components/glide-grid/cells/action-button-cell.ts
// Custom Cell Renderer untuk Tombol Aksi Kanvas Enterprise (Edit / Lihat)
// Bergaya Vercel Geist Secondary Outline Button (h-6, rounded-md, hairline border)

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { roundedRect } from '../renderers/canvas-drawers';
import { FONT_SANS } from '../theme';
import { potongTeksDenganEllipsis } from '../utils/measure';

export type ActionKind = 'edit' | 'view';

export interface ActionButtonCellData {
  kind: 'action-button-cell';
  action: ActionKind;
  label?: string;
}

export type ActionButtonGridCell = CustomCell<ActionButtonCellData>;

export const actionButtonCellRenderer: CustomRenderer<ActionButtonGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ActionButtonGridCell =>
    (c.data as any)?.kind === 'action-button-cell',

  draw: (args, cell) => {
    const { ctx, rect, theme } = args;
    const { action, label } = cell.data;
    const isEdit = action === 'edit';
    const text = label || (isEdit ? 'Ubah' : 'Detail');

    // Deteksi dark mode
    const bgThemeLower = (theme.bgCell || '').toLowerCase();
    const isDark =
      (typeof document !== 'undefined' &&
        document.documentElement.classList.contains('dark')) ||
      bgThemeLower === '#09090b' ||
      bgThemeLower === '#0a0a0a' ||
      bgThemeLower === '#000000' ||
      bgThemeLower === '#18181b' ||
      (theme.borderColor || '').toLowerCase() === '#27272a';

    const maxBtnWidth = rect.width - 14;
    if (maxBtnWidth <= 14) return true;

    ctx.save();

    // Ukuran tombol ringkas selaras badge Vercel Geist (21px, radius 5px)
    const btnHeight = Math.min(21, Math.max(15, rect.height - 12));
    const btnWidth = Math.min(maxBtnWidth, 64);
    const btnX = Math.round(rect.x + (rect.width - btnWidth) / 2);
    const btnY = Math.round(rect.y + (rect.height - btnHeight) / 2);

    // Background & Border Vercel Geist Secondary Button
    const btnBg = isDark ? '#18181B' : '#FFFFFF';
    const btnBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
    const btnFg = isDark ? '#EDEDED' : '#171717';
    const iconColor = isEdit
      ? isDark
        ? '#60A5FA'
        : '#2563EB'
      : isDark
        ? '#A1A1AA'
        : '#71717A';

    // Gambar Rounded Box Tombol
    ctx.beginPath();
    roundedRect(ctx, btnX, btnY, btnWidth, btnHeight, 5);
    ctx.fillStyle = btnBg;
    ctx.fill();

    ctx.strokeStyle = btnBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Clip isi tombol agar ikon & teks tidak pernah bocor keluar border tombol saat kolom disusutkan
    ctx.beginPath();
    ctx.rect(btnX + 2, btnY + 1, Math.max(0, btnWidth - 4), Math.max(0, btnHeight - 2));
    ctx.clip();

    // Gambar Ikon Vektor Presisi
    const iconCenterX = btnWidth < 36 ? Math.round(btnX + btnWidth / 2) : btnX + 12;
    const iconCenterY = btnY + btnHeight / 2;

    if (isEdit) {
      // Ikon Pensil Edit yang rapi
      ctx.save();
      ctx.translate(iconCenterX, iconCenterY);
      ctx.rotate((-45 * Math.PI) / 180);

      ctx.fillStyle = iconColor;
      ctx.strokeStyle = iconColor;
      ctx.lineWidth = 1;

      // Batang pensil
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-1.5, -4.5, 3, 6, 0.5);
      } else {
        ctx.rect(-1.5, -4.5, 3, 6);
      }
      ctx.fill();

      // Ujung mata pensil
      ctx.beginPath();
      ctx.moveTo(-1.5, 1.5);
      ctx.lineTo(1.5, 1.5);
      ctx.lineTo(0, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else {
      // Ikon Mata (Eye) untuk View
      ctx.save();
      ctx.strokeStyle = iconColor;
      ctx.fillStyle = iconColor;
      ctx.lineWidth = 1.2;

      // Lingkaran luar mata
      ctx.beginPath();
      ctx.ellipse(iconCenterX, iconCenterY, 4.5, 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pupil mata
      ctx.beginPath();
      ctx.arc(iconCenterX, iconCenterY, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Gambar Teks Label (dengan truncation bila ruang menyempit)
    const textStartX = btnX + 22;
    const availableTextWidth = Math.max(0, btnX + btnWidth - 5 - textStartX);
    if (btnWidth >= 36 && availableTextWidth > 4) {
      ctx.fillStyle = btnFg;
      ctx.font = `500 11px ${FONT_SANS}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const displayText = potongTeksDenganEllipsis(ctx, text, availableTextWidth);
      if (displayText) {
        ctx.fillText(displayText, textStartX, Math.round(btnY + btnHeight / 2 + 0.5));
      }
    }

    ctx.restore();
    return true;
  },

  measure: () => 72,
};
