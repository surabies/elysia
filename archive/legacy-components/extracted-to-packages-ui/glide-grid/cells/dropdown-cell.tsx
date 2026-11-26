// apps/web/src/components/glide-grid/cells/dropdown-cell.tsx
// Custom Cell Renderer untuk Dropdown / Single Select Pilihan Opsi
// Diadopsi dari @glideapps/glide-data-grid-cells dengan styling Geist & Tailwind

import * as React from 'react';
import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_SANS } from '../theme';
import { roundedRect } from '../renderers/canvas-drawers';

export type DropdownOption =
  | string
  | {
      value: string;
      label: string;
      color?: string;
      bgColor?: string;
    };

export interface DropdownCellData {
  kind: 'dropdown-cell';
  readonly value: string;
  readonly allowedValues: readonly DropdownOption[];
  readonly placeholder?: string;
}

export type DropdownGridCell = CustomCell<DropdownCellData>;

export function createDropdownCell(
  value: string,
  allowedValues: readonly DropdownOption[],
  options?: { placeholder?: string; readonly?: boolean }
): DropdownGridCell {
  const matchingOption = allowedValues.find((opt) =>
    typeof opt === 'string' ? opt === value : opt.value === value
  );
  const displayLabel = matchingOption
    ? typeof matchingOption === 'string'
      ? matchingOption
      : matchingOption.label
    : value || options?.placeholder || '-';

  return {
    kind: GridCellKind.Custom,
    allowOverlay: !options?.readonly,
    readonly: options?.readonly ?? false,
    copyData: displayLabel,
    data: {
      kind: 'dropdown-cell',
      value,
      allowedValues,
      placeholder: options?.placeholder,
    },
  };
}

export const dropdownCellRenderer: CustomRenderer<DropdownGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is DropdownGridCell => (c.data as any)?.kind === 'dropdown-cell',

  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { value, allowedValues, placeholder = '-' } = cell.data;

    const opt = allowedValues.find((o) =>
      typeof o === 'string' ? o === value : o.value === value
    );
    const label = opt ? (typeof opt === 'string' ? opt : opt.label) : value || placeholder;
    const customColor = opt && typeof opt !== 'string' ? opt.color : undefined;
    const customBg = opt && typeof opt !== 'string' ? opt.bgColor : undefined;

    const padX = theme.cellHorizontalPadding || 8;
    const x = rect.x + padX;
    const cy = Math.round(rect.y + rect.height / 2);

    ctx.save();

    // Jika memiliki background warna pill
    if (customBg) {
      ctx.font = `500 11px ${FONT_SANS}`;
      const textWidth = ctx.measureText(label).width;
      const pillWidth = textWidth + 16;
      const pillHeight = 20;
      const pillY = Math.round(cy - pillHeight / 2);

      ctx.beginPath();
      roundedRect(ctx, x, pillY, pillWidth, pillHeight, 4);
      ctx.fillStyle = customBg;
      ctx.fill();

      ctx.fillStyle = customColor || theme.textDark || '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 8, cy);
    } else {
      ctx.font = `400 12px ${FONT_SANS}`;
      ctx.fillStyle = customColor || theme.textDark || '#ededed';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, cy);
    }

    // Icon chevron down kecil di sisi kanan sel
    const chevronX = rect.x + rect.width - padX - 8;
    ctx.strokeStyle = theme.textLight || '#71717a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(chevronX - 3, cy - 1);
    ctx.lineTo(chevronX, cy + 2);
    ctx.lineTo(chevronX + 3, cy - 1);
    ctx.stroke();

    ctx.restore();
    return true;
  },

  provideEditor: () => {
    return function DropdownEditor({ value, onChange, onFinishedEditing }) {
      const { allowedValues, value: curVal } = value.data;

      return (
        <div className="flex h-full w-full items-center px-1 bg-popover">
          <select
            value={curVal}
            autoFocus
            onChange={(e) => {
              const selected = e.target.value;
              onChange({
                ...value,
                data: {
                  ...value.data,
                  value: selected,
                },
              });
              onFinishedEditing?.();
            }}
            className="w-full bg-background text-foreground text-xs rounded border border-border px-2 py-1 outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {allowedValues.map((opt, i) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={i} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
        </div>
      );
    };
  },
};
