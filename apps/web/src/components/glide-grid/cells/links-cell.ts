// apps/web/src/components/glide-grid/cells/links-cell.ts
// Custom Cell Renderer untuk Hyperlink Interaktif di Kanvas
// Diadopsi dari @glideapps/glide-data-grid-cells

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_SANS } from '../theme';

export interface LinksCellData {
  kind: 'links-cell';
  readonly url: string;
  readonly title?: string;
  readonly onClick?: () => void;
}

export type LinksGridCell = CustomCell<LinksCellData>;

export function createLinksCell(
  url: string,
  options?: { title?: string; onClick?: () => void }
): LinksGridCell {
  const displayText = options?.title || url;
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: url,
    data: {
      kind: 'links-cell',
      url,
      title: displayText,
      onClick: options?.onClick,
    },
  };
}

export const linksCellRenderer: CustomRenderer<LinksGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is LinksGridCell => (c.data as any)?.kind === 'links-cell',
  needsHover: true,

  onClick: (args) => {
    const { cell } = args;
    if (cell.data.onClick) {
      cell.data.onClick();
    } else if (cell.data.url) {
      window.open(cell.data.url, '_blank', 'noopener,noreferrer');
    }
    return undefined;
  },

  draw: (args, cell) => {
    const { ctx, theme, rect, hoverAmount } = args;
    const { title, url } = cell.data;
    const text = title || url;

    const padX = theme.cellHorizontalPadding || 8;
    const x = rect.x + padX;
    const cy = Math.round(rect.y + rect.height / 2);

    ctx.save();
    ctx.font = `400 12px ${FONT_SANS}`;
    const linkColor = '#3b82f6'; // Blue-500
    ctx.fillStyle = linkColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, cy);

    // Garis bawah saat hover
    if (hoverAmount > 0.1) {
      const textWidth = ctx.measureText(text).width;
      ctx.beginPath();
      ctx.moveTo(x, cy + 8);
      ctx.lineTo(x + textWidth, cy + 8);
      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
    return true;
  },
};
