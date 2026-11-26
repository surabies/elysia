// apps/web/src/components/glide-grid/cells/range-cell.tsx
// Custom Cell Renderer untuk Nilai Slider / Rentang Progres di Kanvas
// Diadopsi dari @glideapps/glide-data-grid-cells dengan integrasi tema Geist

import * as React from 'react';
import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { roundedRect } from '../renderers/canvas-drawers';
import { FONT_MONO } from '../theme';

export interface RangeCellData {
  kind: 'range-cell';
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly label?: string;
  readonly unit?: string;
  readonly color?: string;
}

export type RangeGridCell = CustomCell<RangeCellData>;

export function createRangeCell(
  value: number,
  options?: {
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    unit?: string;
    color?: string;
    readonly?: boolean;
  }
): RangeGridCell {
  const min = options?.min ?? 0;
  const max = options?.max ?? 100;
  return {
    kind: GridCellKind.Custom,
    allowOverlay: !options?.readonly,
    readonly: options?.readonly ?? false,
    copyData: `${value}${options?.unit ? ' ' + options.unit : ''}`,
    data: {
      kind: 'range-cell',
      value,
      min,
      max,
      step: options?.step ?? 1,
      label: options?.label,
      unit: options?.unit,
      color: options?.color,
    },
  };
}

export const rangeCellRenderer: CustomRenderer<RangeGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is RangeGridCell => (c.data as any)?.kind === 'range-cell',

  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { min, max, value, label, unit, color } = cell.data;

    const padX = theme.cellHorizontalPadding || 8;
    const x = rect.x + padX;
    const cy = rect.y + rect.height / 2;

    const range = max - min || 1;
    const fillRatio = Math.min(1, Math.max(0, (value - min) / range));

    const textToDraw = label ?? `${Math.round(value)}${unit ? ' ' + unit : ''}`;
    ctx.save();
    ctx.font = `500 11px ${FONT_MONO}`;
    const textWidth = ctx.measureText(textToDraw).width;
    const labelSpacing = 10;
    const trackWidth = Math.max(20, rect.width - padX * 2 - textWidth - labelSpacing);
    const trackHeight = 6;

    // Track background
    ctx.beginPath();
    roundedRect(ctx, x, cy - trackHeight / 2, trackWidth, trackHeight, 3);
    ctx.fillStyle = theme.bgBubble || 'rgba(161, 161, 170, 0.2)';
    ctx.fill();

    // Filled bar
    if (fillRatio > 0) {
      const fillWidth = Math.max(trackHeight, trackWidth * fillRatio);
      ctx.beginPath();
      roundedRect(ctx, x, cy - trackHeight / 2, fillWidth, trackHeight, 3);
      ctx.fillStyle = color || theme.accentColor || '#3b82f6';
      ctx.fill();
    }

    // Teks Label
    ctx.fillStyle = theme.textDark || '#ededed';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(textToDraw, x + trackWidth + labelSpacing, cy);

    ctx.restore();
    return true;
  },

  provideEditor: () => {
    return function RangeEditor({ value, onChange }) {
      const { min, max, step = 1, value: curVal } = value.data;
      return (
        <div className="flex h-full w-full items-center gap-2 px-3 bg-popover">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={curVal}
            onChange={(e) => {
              const newVal = Number(e.target.value);
              onChange({
                ...value,
                data: {
                  ...value.data,
                  value: newVal,
                },
              });
            }}
            className="w-full accent-primary h-1.5 bg-muted rounded cursor-pointer"
          />
          <span className="text-xs font-mono font-medium text-foreground min-w-8 text-right">
            {curVal}
          </span>
        </div>
      );
    };
  },
};
