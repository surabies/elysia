// apps/web/src/components/glide-grid/theme.ts
// Single Source of Truth: Tema Glide Data Grid Enterprise Bergaya Vercel Geist
// Sesuai 100% dengan CanvasTabelVerifikasi.tsx & globals.css

import * as React from 'react';
import { useTheme } from 'next-themes';
import type { Theme } from '@glideapps/glide-data-grid';

/**
 * Font families yang valid untuk HTML5 Canvas 2D API
 * Canvas 2D TIDAK meresolusi CSS var(), sehingga harus menggunakan nama font murni dengan fallbacks.
 */
export const FONT_SANS =
  '"Geist Sans", Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const FONT_MONO =
  '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

/**
 * Token Warna Geist Light Mode untuk Glide Data Grid Kanvas
 * Dikalibrasi 100% dari CanvasTabelVerifikasi.tsx & Vercel Geist Design System
 */
export const GEIST_LIGHT_GLIDE_THEME: Partial<Theme> = {
  // Aksen Vercel (Focus & Active Selection)
  accentColor: '#2563eb',
  accentLight: 'rgba(37, 99, 235, 0.12)',

  // Tipografi & Teks
  textDark: 'rgb(9, 9, 11)',
  textMedium: 'rgb(113, 113, 122)',
  textLight: 'rgb(161, 161, 170)',
  textHeader: 'rgb(9, 9, 11)',
  textHeaderSelected: 'rgb(9, 9, 11)',
  textGroupHeader: 'rgb(113, 113, 122)',
  textBubble: 'rgb(9, 9, 11)',

  // Latar Sel & Header
  bgCell: '#ffffff',
  bgCellMedium: '#fafafa',
  bgHeader: '#f4f4f5',
  bgHeaderHasFocus: '#e4e4e7',
  bgHeaderHovered: '#e4e4e7',
  bgBubble: '#f4f4f5',
  bgBubbleSelected: '#e4e4e7',
  bgSearchResult: '#fff9e6',

  // Garis Batas & Hairline Borders
  borderColor: '#e4e4e7',
  horizontalBorderColor: 'rgba(228, 228, 231, 0.85)',
  headerBottomBorderColor: '#d4d4d8',
  drilldownBorder: '#e4e4e7',

  // Ukuran & Spacing Geist Standar (Persis CanvasTabelVerifikasi.tsx)
  cellHorizontalPadding: 12,
  cellVerticalPadding: 6,
  fontFamily: FONT_SANS,
  baseFontStyle: '14px',
  headerFontStyle: '600 13px',
  editorFontSize: '14px',
  lineHeight: 1.4,
};

/**
 * Token Warna Geist Dark Mode untuk Glide Data Grid Kanvas
 * Dikalibrasi 100% dari CanvasTabelVerifikasi.tsx & Vercel Geist Design System
 */
export const GEIST_DARK_GLIDE_THEME: Partial<Theme> = {
  // Aksen Vercel (Focus & Active Selection)
  accentColor: '#3b82f6',
  accentLight: 'rgba(59, 130, 246, 0.2)',

  // Tipografi & Teks
  textDark: 'rgb(244, 244, 245)',
  textMedium: 'rgb(161, 161, 170)',
  textLight: 'rgb(113, 113, 122)',
  textHeader: 'rgb(244, 244, 245)',
  textHeaderSelected: 'rgb(255, 255, 255)',
  textGroupHeader: 'rgb(161, 161, 170)',
  textBubble: 'rgb(244, 244, 245)',

  // Latar Sel & Header
  bgCell: '#18181b',
  bgCellMedium: '#1f1f23',
  bgHeader: '#18181b',
  bgHeaderHasFocus: '#27272a',
  bgHeaderHovered: '#27272a',
  bgBubble: '#18181b',
  bgBubbleSelected: '#27272a',
  bgSearchResult: '#332900',

  // Garis Batas & Hairline Borders
  borderColor: '#27272a',
  horizontalBorderColor: 'rgba(39, 39, 42, 0.85)',
  headerBottomBorderColor: '#3f3f46',
  drilldownBorder: '#27272a',

  // Ukuran & Spacing Geist Standar (Persis CanvasTabelVerifikasi.tsx)
  cellHorizontalPadding: 12,
  cellVerticalPadding: 6,
  fontFamily: FONT_SANS,
  baseFontStyle: '14px',
  headerFontStyle: '600 13px',
  editorFontSize: '14px',
  lineHeight: 1.4,
};

/**
 * Hook untuk mendapatkan tema Glide Data Grid yang reaktif terhadap pergantian Light / Dark mode
 */
export function useGeistGlideTheme(): Partial<Theme> {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return React.useMemo(() => {
    return isDark ? GEIST_DARK_GLIDE_THEME : GEIST_LIGHT_GLIDE_THEME;
  }, [isDark]);
}

/**
 * Helper theme overrides untuk sel data tabel (100% selaras dengan CanvasTabelVerifikasi.tsx)
 */
export function getThemeOverrides(isDark: boolean, rowBg?: string) {
  const bg = rowBg || (isDark ? '#18181b' : '#ffffff');
  return {
    regular: {
      bgCell: bg,
      fontFamily: FONT_SANS,
      baseFontStyle: '14px',
    } as Partial<Theme>,
    bold: {
      bgCell: bg,
      fontFamily: FONT_SANS,
      baseFontStyle: '600 14px',
    } as Partial<Theme>,
    mono: {
      bgCell: bg,
      fontFamily: FONT_MONO,
      baseFontStyle: '500 14px',
    } as Partial<Theme>,
    monoBold: {
      bgCell: bg,
      fontFamily: FONT_MONO,
      baseFontStyle: '600 14px',
      textDark: isDark ? '#93c5fd' : '#1d4ed8',
    } as Partial<Theme>,
    muted: {
      bgCell: bg,
      textDark: isDark ? '#a1a1aa' : '#71717a',
      fontFamily: FONT_SANS,
      baseFontStyle: '14px',
    } as Partial<Theme>,
    monoMuted: {
      bgCell: bg,
      textDark: isDark ? '#a1a1aa' : '#71717a',
      fontFamily: FONT_MONO,
      baseFontStyle: '14px',
    } as Partial<Theme>,
  };
}
