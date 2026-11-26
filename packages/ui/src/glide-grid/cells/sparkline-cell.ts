// apps/web/src/components/glide-grid/cells/sparkline-cell.ts
// Custom Cell Renderer untuk Mini Grafik Garis/Batang/Area (Sparkline) di Kanvas 60 FPS
// Diadopsi dari @glideapps/glide-data-grid-cells dengan integrasi tema Geist & PDAM

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';

export interface SparklineCellData {
  kind: 'sparkline-cell';
  readonly graphKind?: 'line' | 'bar' | 'area';
  readonly values: readonly number[];
  readonly displayValues?: readonly string[];
  readonly yAxis?: readonly [min: number, max: number];
  readonly color?: string;
  readonly hideAxis?: boolean;
}

export type SparklineGridCell = CustomCell<SparklineCellData>;

export function createSparklineCell(
  values: readonly number[],
  options?: Partial<Omit<SparklineCellData, 'kind' | 'values'>>
): SparklineGridCell {
  const min = options?.yAxis ? options.yAxis[0] : Math.min(...values, 0);
  const max = options?.yAxis ? options.yAxis[1] : Math.max(...values, 1);
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: values.join(', '),
    data: {
      kind: 'sparkline-cell',
      values,
      graphKind: options?.graphKind ?? 'area',
      yAxis: options?.yAxis ?? [min, max],
      color: options?.color,
      displayValues: options?.displayValues,
      hideAxis: options?.hideAxis,
    },
  };
}

export const sparklineCellRenderer: CustomRenderer<SparklineGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is SparklineGridCell =>
    (c.data as any)?.kind === 'sparkline-cell',
  needsHover: true,
  needsHoverPosition: true,

  draw: (args, cell) => {
    const { ctx, theme, rect, hoverAmount, hoverX } = args;
    const { values, yAxis, color, graphKind = 'area', displayValues, hideAxis } = cell.data;
    if (!values || values.length === 0) return true;

    const minY = yAxis ? yAxis[0] : Math.min(...values, 0);
    const maxY = yAxis ? yAxis[1] : Math.max(...values, 1);
    const delta = maxY - minY || 1;

    const normalized = values.map((x) => Math.min(1, Math.max(0, (x - minY) / delta)));
    const padX = theme.cellHorizontalPadding || 8;
    const drawX = padX + rect.x;
    const y = rect.y + 4;
    const height = Math.max(rect.height - 8, 4);
    const width = Math.max(rect.width - padX * 2, 4);

    const zeroY = maxY <= 0 ? y : minY >= 0 ? y + height : y + height * (maxY / delta);

    ctx.save();

    // Gambar sumbu dasar (zero line)
    if (!hideAxis && minY <= 0 && maxY >= 0) {
      ctx.beginPath();
      ctx.moveTo(drawX, zeroY);
      ctx.lineTo(drawX + width, zeroY);
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme.textLight;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const strokeColor = color || theme.accentColor || '#3b82f6';

    if (graphKind === 'bar') {
      ctx.beginPath();
      const margin = 2;
      const spacing = (normalized.length - 1) * margin;
      const barWidth = Math.max(1, (width - spacing) / normalized.length);

      let curX = drawX;
      for (const val of normalized) {
        const barY = y + height - val * height;
        ctx.moveTo(curX, zeroY);
        ctx.lineTo(curX + barWidth, zeroY);
        ctx.lineTo(curX + barWidth, barY);
        ctx.lineTo(curX, barY);
        curX += barWidth + margin;
      }
      ctx.fillStyle = strokeColor;
      ctx.fill();
    } else {
      let renderValues = [...normalized];
      if (renderValues.length === 1) {
        renderValues = [renderValues[0]!, renderValues[0]!];
      }

      ctx.beginPath();
      const xStep = width / (renderValues.length - 1);
      const points = renderValues.map((val, ind) => ({
        x: drawX + xStep * ind,
        y: y + height - val * height,
      }));

      ctx.moveTo(points[0]!.x, points[0]!.y);
      if (points.length > 2) {
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i]!.x + points[i + 1]!.x) / 2;
          const yc = (points[i]!.y + points[i + 1]!.y) / 2;
          ctx.quadraticCurveTo(points[i]!.x, points[i]!.y, xc, yc);
        }
      }
      ctx.lineTo(points[points.length - 1]!.x, points[points.length - 1]!.y);

      // Area gradient
      if (graphKind === 'area') {
        const areaGrad = ctx.createLinearGradient(drawX, y, drawX, y + height);
        areaGrad.addColorStop(0, strokeColor);
        areaGrad.addColorStop(1, 'transparent');

        ctx.save();
        const areaPath = new Path2D();
        areaPath.moveTo(points[0]!.x, zeroY);
        areaPath.lineTo(points[0]!.x, points[0]!.y);
        for (let i = 1; i < points.length; i++) {
          areaPath.lineTo(points[i]!.x, points[i]!.y);
        }
        areaPath.lineTo(points[points.length - 1]!.x, zeroY);
        areaPath.closePath();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = areaGrad;
        ctx.fill(areaPath);
        ctx.restore();
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.6 + hoverAmount * 0.4;
      ctx.stroke();

      // Tooltip titik saat hover
      if (hoverAmount > 0.05 && hoverX !== undefined) {
        const relativeHoverX = hoverX - drawX;
        const hoverIndex = Math.min(
          renderValues.length - 1,
          Math.max(0, Math.round(relativeHoverX / xStep))
        );
        const pt = points[hoverIndex];
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();

          if (displayValues && displayValues[hoverIndex]) {
            ctx.save();
            ctx.font = '500 9px monospace';
            ctx.fillStyle = theme.textDark || '#ededed';
            ctx.textAlign = 'center';
            ctx.fillText(displayValues[hoverIndex]!, pt.x, Math.max(rect.y + 10, pt.y - 6));
            ctx.restore();
          }
        }
      }
    }

    ctx.restore();
    return true;
  },
};
