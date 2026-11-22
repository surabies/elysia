// apps/web/src/components/glide-grid/cells/star-cell.tsx
// Custom Cell Renderer untuk Rating Bintang Interaktif (1-5 Bintang)
// Diadopsi dari @glideapps/glide-data-grid-cells dengan integrasi tema Vercel Geist

import * as React from 'react';
import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { pathStar } from '../renderers/canvas-drawers';

export interface StarCellData {
  kind: 'star-cell';
  readonly rating: number;
  readonly maxRating?: number;
  readonly color?: string;
}

export type StarGridCell = CustomCell<StarCellData>;

export function createStarCell(
  rating: number,
  options?: { maxRating?: number; color?: string; readonly?: boolean }
): StarGridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: !options?.readonly,
    readonly: options?.readonly ?? false,
    copyData: `${rating} / ${options?.maxRating ?? 5}`,
    data: {
      kind: 'star-cell',
      rating,
      maxRating: options?.maxRating ?? 5,
      color: options?.color,
    },
  };
}

export const starCellRenderer: CustomRenderer<StarGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is StarGridCell => (c.data as any)?.kind === 'star-cell',
  needsHover: true,

  draw: (args, cell) => {
    const { ctx, theme, rect, hoverAmount } = args;
    const { rating, maxRating = 5, color } = cell.data;
    const padX = theme.cellHorizontalPadding || 8;
    const starSize = 14;
    const spacing = 4;
    const starColor = color || '#f59e0b'; // Amber-500
    const emptyColor = theme.textLight ? 'rgba(161, 161, 170, 0.35)' : '#d4d4d8';

    ctx.save();
    let curX = rect.x + padX + starSize / 2;
    const cy = rect.y + rect.height / 2;

    for (let i = 1; i <= maxRating; i++) {
      ctx.beginPath();
      pathStar(ctx, curX, cy, starSize);

      if (i <= Math.floor(rating)) {
        ctx.fillStyle = starColor;
        ctx.globalAlpha = 0.85 + 0.15 * hoverAmount;
        ctx.fill();
      } else if (i - 0.5 <= rating) {
        // Separuh bintang
        ctx.fillStyle = starColor;
        ctx.fill();
      } else {
        ctx.fillStyle = emptyColor;
        ctx.globalAlpha = 0.5;
        ctx.fill();
      }

      curX += starSize + spacing;
    }

    ctx.restore();
    return true;
  },

  provideEditor: () => {
    return function StarEditor({ value, onChange }) {
      const { rating = 0, maxRating = 5 } = value.data;
      const [hoverRating, setHoverRating] = React.useState<number | null>(null);

      const activeRating = hoverRating !== null ? hoverRating : rating;

      return (
        <div className="flex h-full w-full items-center gap-1.5 px-3 bg-popover text-popover-foreground">
          {Array.from({ length: maxRating }).map((_, idx) => {
            const starValue = idx + 1;
            const isFilled = starValue <= activeRating;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange({
                    ...value,
                    data: {
                      ...value.data,
                      rating: starValue,
                    },
                  });
                }}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-0.5 focus:outline-none transition-transform hover:scale-125"
              >
                <svg
                  className={`size-4 ${isFilled ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            );
          })}
        </div>
      );
    };
  },
};
