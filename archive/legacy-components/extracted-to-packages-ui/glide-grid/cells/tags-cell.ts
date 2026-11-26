// apps/web/src/components/glide-grid/cells/tags-cell.ts
// Custom Cell Renderer untuk Multi Tag / Label Warna-warni di Kanvas
// Diadopsi dari @glideapps/glide-data-grid-cells dengan integrasi tema Geist & PDAM

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { roundedRect } from '../renderers/canvas-drawers';
import { FONT_SANS } from '../theme';

export interface TagsCellData {
  kind: 'tags-cell';
  readonly tags: readonly string[];
  readonly colors?: Record<string, { bg: string; text: string }>;
}

export type TagsGridCell = CustomCell<TagsCellData>;

export function createTagsCell(
  tags: readonly string[],
  colors?: Record<string, { bg: string; text: string }>
): TagsGridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: tags.join(', '),
    data: {
      kind: 'tags-cell',
      tags,
      colors,
    },
  };
}

export const tagsCellRenderer: CustomRenderer<TagsGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is TagsGridCell => (c.data as any)?.kind === 'tags-cell',

  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { tags, colors = {} } = cell.data;
    if (!tags || tags.length === 0) return true;

    const padX = theme.cellHorizontalPadding || 8;
    const cy = Math.round(rect.y + rect.height / 2);
    let curX = rect.x + padX;
    const tagHeight = 18;
    const tagY = Math.round(cy - tagHeight / 2);

    ctx.save();
    ctx.font = `500 10.5px ${FONT_SANS}`;

    for (const tag of tags) {
      const textWidth = ctx.measureText(tag).width;
      const tagWidth = textWidth + 12;

      // Hentikan jika melebihi batas sel
      if (curX + tagWidth > rect.x + rect.width - padX) {
        // Gambar indikator '+' jika masih ada tag tersisa
        ctx.fillStyle = theme.textLight || '#a1a1aa';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('…', curX, cy);
        break;
      }

      const style = colors[tag] || {
        bg: theme.bgBubble || 'rgba(161, 161, 170, 0.15)',
        text: theme.textDark || '#ededed',
      };

      ctx.beginPath();
      roundedRect(ctx, curX, tagY, tagWidth, tagHeight, 3);
      ctx.fillStyle = style.bg;
      ctx.fill();

      ctx.fillStyle = style.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, curX + tagWidth / 2, cy);

      curX += tagWidth + 4;
    }

    ctx.restore();
    return true;
  },
};
