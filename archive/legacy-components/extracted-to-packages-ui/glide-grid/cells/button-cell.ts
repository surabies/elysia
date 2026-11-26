// apps/web/src/components/glide-grid/cells/button-cell.ts
// Custom Cell Renderer untuk Tombol Aksi Kanvas Interaktif (Primary / Secondary / Destructive)
// Diadopsi dari @glideapps/glide-data-grid-cells dengan integrasi tema Geist & PDAM

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
  type Rectangle,
} from '@glideapps/glide-data-grid';
import { roundedRect } from '../renderers/canvas-drawers';
import { FONT_SANS } from '../theme';

export interface ButtonCellData {
  kind: 'button-cell';
  readonly title: string;
  readonly onClick?: () => void;
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  readonly borderRadius?: number;
}

export type ButtonGridCell = CustomCell<ButtonCellData> & { readonly: true };

export function createButtonCell(
  title: string,
  onClick?: () => void,
  options?: {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    borderRadius?: number;
  }
): ButtonGridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    readonly: true,
    copyData: title,
    data: {
      kind: 'button-cell',
      title,
      onClick,
      variant: options?.variant ?? 'secondary',
      borderRadius: options?.borderRadius ?? 4,
    },
  };
}

export const buttonCellRenderer: CustomRenderer<ButtonGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ButtonGridCell => (c.data as any)?.kind === 'button-cell',
  needsHover: true,
  needsHoverPosition: true,

  onClick: (args) => {
    const { cell, bounds, posX, posY } = args;
    if (posX !== undefined && posY !== undefined) {
      if (
        posX >= 0 &&
        posX <= bounds.width &&
        posY >= 0 &&
        posY <= bounds.height
      ) {
        cell.data.onClick?.();
      }
    }
    return undefined;
  },

  draw: (args, cell) => {
    const { ctx, theme, rect, hoverAmount } = args;
    const { title, variant = 'secondary', borderRadius = 4 } = cell.data;

    const padX = theme.cellHorizontalPadding || 8;
    const btnHeight = 24;
    const btnWidth = Math.max(48, rect.width - padX * 2);
    const btnX = Math.round(rect.x + (rect.width - btnWidth) / 2);
    const btnY = Math.round(rect.y + (rect.height - btnHeight) / 2);

    ctx.save();

    // Tentukan warna berdasarkan variant
    let bg = 'rgba(255, 255, 255, 0.08)';
    let fg = '#ededed';
    let border = 'rgba(255, 255, 255, 0.15)';

    if (variant === 'primary') {
      bg = '#2563eb';
      fg = '#ffffff';
      border = '#1d4ed8';
    } else if (variant === 'danger') {
      bg = 'rgba(239, 68, 68, 0.15)';
      fg = '#f87171';
      border = 'rgba(239, 68, 68, 0.3)';
    } else if (variant === 'outline') {
      bg = 'transparent';
      fg = theme.textDark || '#ededed';
      border = theme.borderColor || 'rgba(161, 161, 170, 0.3)';
    }

    // Gambar tombol
    ctx.beginPath();
    roundedRect(ctx, btnX, btnY, btnWidth, btnHeight, borderRadius);
    ctx.fillStyle = bg;
    ctx.globalAlpha = 0.9 + 0.1 * hoverAmount;
    ctx.fill();

    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Teks Tombol
    ctx.font = `500 11px ${FONT_SANS}`;
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, btnX + btnWidth / 2, btnY + btnHeight / 2);

    ctx.restore();
    return true;
  },
};
