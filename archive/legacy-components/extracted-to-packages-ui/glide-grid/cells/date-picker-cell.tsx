// apps/web/src/components/glide-grid/cells/date-picker-cell.tsx
// Custom Cell Renderer untuk Pemilihan Tanggal / Waktu Interaktif (DatePicker)
// Diadopsi dari @glideapps/glide-data-grid-cells dengan styling Geist & Tailwind

import * as React from 'react';
import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_MONO } from '../theme';

export interface DatePickerCellData {
  kind: 'date-picker-cell';
  readonly date: Date | null | undefined;
  readonly displayDate: string;
  readonly format?: 'date' | 'time' | 'datetime-local';
}

export type DatePickerGridCell = CustomCell<DatePickerCellData>;

export function createDatePickerCell(
  date: Date | string | null | undefined,
  options?: {
    format?: 'date' | 'time' | 'datetime-local';
    readonly?: boolean;
    customDisplay?: string;
  }
): DatePickerGridCell {
  const parsedDate = typeof date === 'string' ? new Date(date) : date ?? null;
  const isValid = parsedDate && !isNaN(parsedDate.getTime());

  let display = options?.customDisplay;
  if (!display) {
    if (!isValid || !parsedDate) {
      display = '-';
    } else if (options?.format === 'time') {
      display = parsedDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } else if (options?.format === 'datetime-local') {
      display = `${parsedDate.toLocaleDateString('id-ID')} ${parsedDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      display = parsedDate.toLocaleDateString('id-ID');
    }
  }

  return {
    kind: GridCellKind.Custom,
    allowOverlay: !options?.readonly,
    readonly: options?.readonly ?? false,
    copyData: display,
    data: {
      kind: 'date-picker-cell',
      date: isValid ? parsedDate : null,
      displayDate: display,
      format: options?.format ?? 'date',
    },
  };
}

export const datePickerCellRenderer: CustomRenderer<DatePickerGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is DatePickerGridCell => (c.data as any)?.kind === 'date-picker-cell',

  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { displayDate } = cell.data;

    const padX = theme.cellHorizontalPadding || 8;
    const x = rect.x + padX;
    const cy = Math.round(rect.y + rect.height / 2);

    ctx.save();
    // Gambar icon kalender mini (14x14)
    const iconSize = 13;
    const iconY = Math.round(cy - iconSize / 2);

    ctx.strokeStyle = theme.textLight || '#a1a1aa';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, iconY, iconSize, iconSize);
    ctx.beginPath();
    ctx.moveTo(x, iconY + 4);
    ctx.lineTo(x + iconSize, iconY + 4);
    ctx.stroke();

    // Gambar titik pin kalender
    ctx.fillStyle = theme.accentColor || '#3b82f6';
    ctx.fillRect(x + 2, iconY - 2, 2, 2);
    ctx.fillRect(x + iconSize - 4, iconY - 2, 2, 2);

    // Teks Tanggal
    ctx.font = `400 12px ${FONT_MONO}`;
    ctx.fillStyle = theme.textDark || '#ededed';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayDate, x + iconSize + 8, cy);

    ctx.restore();
    return true;
  },

  provideEditor: () => {
    return function DatePickerEditor({ value, onChange }) {
      const { date, format = 'date' } = value.data;
      const isoValue = React.useMemo(() => {
        if (!date) return '';
        try {
          const iso = date.toISOString();
          if (format === 'date') return iso.split('T')[0] || '';
          if (format === 'time') return iso.split('T')[1]?.slice(0, 5) || '';
          return iso.slice(0, 16);
        } catch {
          return '';
        }
      }, [date, format]);

      return (
        <div className="flex h-full w-full items-center px-2 bg-popover">
          <input
            type={format}
            value={isoValue}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onChange({
                  ...value,
                  data: {
                    ...value.data,
                    date: null,
                    displayDate: '-',
                  },
                });
                return;
              }
              const newDate = new Date(val);
              onChange({
                ...value,
                data: {
                  ...value.data,
                  date: newDate,
                  displayDate: newDate.toLocaleDateString('id-ID'),
                },
              });
            }}
            className="w-full bg-background text-foreground text-xs font-mono rounded border border-border px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      );
    };
  },
};
