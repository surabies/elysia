// apps/web/src/components/glide-grid/cells/user-profile-cell.ts
// Custom Cell Renderer untuk Foto Avatar & Profil Pengguna/Petugas di Kanvas
// Diadopsi dari @glideapps/glide-data-grid-cells

import {
  type CustomCell,
  type CustomRenderer,
  GridCellKind,
} from '@glideapps/glide-data-grid';
import { FONT_SANS } from '../theme';

export interface UserProfileCellData {
  kind: 'user-profile-cell';
  readonly name: string;
  readonly role?: string;
  readonly initials?: string;
  readonly avatarBg?: string;
}

export type UserProfileGridCell = CustomCell<UserProfileCellData>;

export function createUserProfileCell(
  name: string,
  options?: { role?: string; initials?: string; avatarBg?: string }
): UserProfileGridCell {
  const inits =
    options?.initials ||
    name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: `${name}${options?.role ? ` (${options.role})` : ''}`,
    data: {
      kind: 'user-profile-cell',
      name,
      role: options?.role,
      initials: inits,
      avatarBg: options?.avatarBg || '#2563eb',
    },
  };
}

export const userProfileCellRenderer: CustomRenderer<UserProfileGridCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is UserProfileGridCell => (c.data as any)?.kind === 'user-profile-cell',

  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { name, role, initials, avatarBg = '#2563eb' } = cell.data;

    const padX = theme.cellHorizontalPadding || 8;
    const cy = Math.round(rect.y + rect.height / 2);
    const avatarRadius = 11;
    const avatarX = rect.x + padX + avatarRadius;

    ctx.save();

    // Gambar Lingkaran Avatar
    ctx.beginPath();
    ctx.arc(avatarX, cy, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = avatarBg;
    ctx.fill();

    // Inisial Teks di Dalam Avatar
    if (initials) {
      ctx.font = `600 10px ${FONT_SANS}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, avatarX, cy);
    }

    // Nama & Role
    const textStartX = avatarX + avatarRadius + 8;
    if (role) {
      // Dua baris (Nama di atas, Role di bawah)
      ctx.font = `500 11.5px ${FONT_SANS}`;
      ctx.fillStyle = theme.textDark || '#ededed';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, textStartX, cy - 6);

      ctx.font = `400 10px ${FONT_SANS}`;
      ctx.fillStyle = theme.textLight || '#a1a1aa';
      ctx.fillText(role, textStartX, cy + 7);
    } else {
      // Satu baris vertikal tengah
      ctx.font = `500 12px ${FONT_SANS}`;
      ctx.fillStyle = theme.textDark || '#ededed';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, textStartX, cy);
    }

    ctx.restore();
    return true;
  },
};
