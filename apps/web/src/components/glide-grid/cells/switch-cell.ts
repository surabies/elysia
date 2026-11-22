// apps/web/src/components/glide-grid/cells/switch-cell.ts
// Custom Cell Renderer untuk Toggle Switch Interaktif pada Kanvas Glide Data Grid
// Mengadopsi visual switch modern iOS / Radix UI dengan dukungan animasi loading & tema dark/light

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { roundedRect } from '../renderers/canvas-drawers';
import { FONT_SANS } from '../theme';

export interface SwitchCellData {
  kind: 'switch-cell';
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly isLoading?: boolean;
  readonly label?: string;
  readonly onToggle?: (newChecked: boolean) => void;
}

export type SwitchGridCell = CustomCell<SwitchCellData> & { readonly: true };

export function createSwitchCell(options: {
  checked: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
  onToggle?: (newChecked: boolean) => void;
}): SwitchGridCell {
  const { checked, disabled = false, isLoading = false, label, onToggle } = options;
  const copyText = label ?? (checked ? 'Aktif' : 'Nonaktif');

  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    readonly: true,
    copyData: copyText,
    data: {
      kind: 'switch-cell',
      checked,
      disabled,
      isLoading,
      label: copyText,
      onToggle,
    },
  };
}

export const switchCellRenderer: CustomRenderer<SwitchGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is SwitchGridCell => (c.data as any)?.kind === 'switch-cell',
  needsHover: true,
  needsHoverPosition: true,

  onClick: (args) => {
    const { cell, bounds, posX, posY } = args;
    if (cell.data.disabled || cell.data.isLoading) return undefined;

    if (posX !== undefined && posY !== undefined) {
      if (
        posX >= 0 &&
        posX <= bounds.width &&
        posY >= 0 &&
        posY <= bounds.height
      ) {
        cell.data.onToggle?.(!cell.data.checked);
      }
    }
    return undefined;
  },

  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { checked, disabled = false, isLoading = false, label } = cell.data;

    const isDark =
      theme.bgCell === '#09090b' ||
      theme.bgCell === '#18181b' ||
      (theme.bgCell && theme.bgCell.includes('15, 23, 42')) ||
      (theme.textDark && (theme.textDark.startsWith('#eded') || theme.textDark.startsWith('#f')));

    ctx.save();

    // Dimensi track switch
    const trackWidth = 34;
    const trackHeight = 18;
    const trackRadius = 9;
    const thumbRadius = 6.5;

    // Hitung posisi horizontal
    const padX = theme.cellHorizontalPadding || 8;
    const hasLabel = Boolean(label) && rect.width >= 85;

    let trackX = rect.x + padX;
    if (!hasLabel) {
      // Pusatkan switch jika tidak ada label
      trackX = Math.round(rect.x + (rect.width - trackWidth) / 2);
    }
    const trackY = Math.round(rect.y + (rect.height - trackHeight) / 2);

    // 1. Gambar Track Latar Switch
    let trackBg: string;
    let trackBorder: string;

    if (disabled && !isLoading) {
      trackBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
      trackBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
    } else if (checked) {
      // Emerald Aktif
      trackBg = '#10b981';
      trackBorder = '#059669';
    } else {
      // Gray Nonaktif
      trackBg = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.18)';
      trackBorder = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
    }

    ctx.fillStyle = trackBg;
    ctx.strokeStyle = trackBorder;
    ctx.lineWidth = 1;

    ctx.beginPath();
    roundedRect(ctx, trackX, trackY, trackWidth, trackHeight, trackRadius);
    ctx.fill();
    ctx.stroke();

    // 2. Gambar Thumb (Knob Bulat)
    const thumbY = trackY + trackHeight / 2;
    let thumbX: number;

    if (checked) {
      thumbX = trackX + trackWidth - trackRadius - 0.5;
    } else {
      thumbX = trackX + trackRadius + 0.5;
    }

    // Efek Thumb
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, thumbRadius, 0, Math.PI * 2);
    ctx.fillStyle = disabled && !isLoading ? '#9ca3af' : '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 3. Animasi Indikator Loading Spinner jika sedang proses simpan
    if (isLoading) {
      const angle = (Date.now() / 200) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(thumbX, thumbY, thumbRadius - 1.5, angle, angle + Math.PI * 1.3);
      ctx.strokeStyle = checked ? '#10b981' : '#6b7280';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Label Teks Pendamping (Aktif / Nonaktif)
    if (hasLabel) {
      const textX = trackX + trackWidth + 8;
      const textY = Math.round(rect.y + rect.height / 2);

      ctx.font = `500 12px ${FONT_SANS}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      if (disabled && !isLoading) {
        ctx.fillStyle = isDark ? '#71717a' : '#a1a1aa';
      } else if (checked) {
        ctx.fillStyle = isDark ? '#34d399' : '#059669';
      } else {
        ctx.fillStyle = isDark ? '#a1a1aa' : '#71717a';
      }

      ctx.fillText(label!, textX, textY);
    }

    ctx.restore();
  },
};
