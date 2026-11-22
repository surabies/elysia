// apps/web/src/components/glide-grid/cells/action-button-cell.ts
// Custom Cell Renderer untuk Tombol Aksi Kanvas Enterprise (Edit / Lihat)
// Bergaya Vercel Geist Secondary Outline Button (h-6, rounded-md, hairline border)

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_SANS } from '../theme';

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
      bgThemeLower === '#09090b' ||
      bgThemeLower === '#0a0a0a' ||
      bgThemeLower === '#000000' ||
      bgThemeLower === '#18181b';

    ctx.save();

    // Ukuran tombol
    const btnHeight = 24;
    const btnWidth = Math.min(rect.width - 16, 68);
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
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 5);
    } else {
      ctx.rect(btnX, btnY, btnWidth, btnHeight);
    }
    ctx.fillStyle = btnBg;
    ctx.fill();

    ctx.strokeStyle = btnBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gambar Ikon Vektor Presisi
    const iconCenterX = btnX + 13;
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

    // Gambar Teks Label
    ctx.fillStyle = btnFg;
    ctx.font = `500 11.5px ${FONT_SANS}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, btnX + 25, btnY + btnHeight / 2 + 0.5);

    ctx.restore();
    return true;
  },

  measure: () => 72,
};
