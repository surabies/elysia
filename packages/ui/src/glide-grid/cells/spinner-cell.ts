// apps/web/src/components/glide-grid/cells/spinner-cell.ts
// Custom Cell Renderer untuk Animasi Loading Spinner di Kanvas
// Diadopsi dari @glideapps/glide-data-grid-cells

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_SANS } from '../theme';

export interface SpinnerCellData {
  kind: 'spinner-cell';
  readonly label?: string;
}

export type SpinnerGridCell = CustomCell<SpinnerCellData>;

export function createSpinnerCell(label?: string): SpinnerGridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: label || 'Memuat...',
    data: {
      kind: 'spinner-cell',
      label,
    },
  };
}

export const spinnerCellRenderer: CustomRenderer<SpinnerGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is SpinnerGridCell => (c.data as any)?.kind === 'spinner-cell',

  draw: (args, cell) => {
    const { ctx, theme, rect, frameTime } = args;
    const { label } = cell.data;

    const padX = theme.cellHorizontalPadding || 8;
    const cy = Math.round(rect.y + rect.height / 2);
    const spinnerRadius = 7;
    const spinnerX = rect.x + padX + spinnerRadius;

    ctx.save();

    // Rotasi berdasarkan frameTime
    const rotation = ((frameTime % 1000) / 1000) * Math.PI * 2;

    ctx.translate(spinnerX, cy);
    ctx.rotate(rotation);

    // Track redup
    ctx.beginPath();
    ctx.arc(0, 0, spinnerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(161, 161, 170, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arc berputar
    ctx.beginPath();
    ctx.arc(0, 0, spinnerRadius, 0, Math.PI * 0.75);
    ctx.strokeStyle = theme.accentColor || '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.restore();

    if (label) {
      ctx.save();
      ctx.font = `400 12px ${FONT_SANS}`;
      ctx.fillStyle = theme.textLight || '#a1a1aa';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, spinnerX + spinnerRadius + 8, cy);
      ctx.restore();
    }

    return true;
  },
};
