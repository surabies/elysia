// apps/web/src/components/glide-grid/cells/all-cells.ts
// Katalog Komprehensif Sel Enterprise Glide Data Grid
// Menggabungkan seluruh renderer sel kustom dalam satu konfigurasi SSOT

import type { CustomRenderer } from '@glideapps/glide-data-grid';
import { badgeCellRenderer } from './badge-cell';
import { actionButtonCellRenderer } from './action-button-cell';
import { sparklineCellRenderer } from './sparkline-cell';
import { starCellRenderer } from './star-cell';
import { rangeCellRenderer } from './range-cell';
import { datePickerCellRenderer } from './date-picker-cell';
import { dropdownCellRenderer } from './dropdown-cell';
import { buttonCellRenderer } from './button-cell';
import { tagsCellRenderer } from './tags-cell';
import { linksCellRenderer } from './links-cell';
import { spinnerCellRenderer } from './spinner-cell';
import { userProfileCellRenderer } from './user-profile-cell';
import { switchCellRenderer } from './switch-cell';

/**
 * Seluruh koleksi renderer sel enterprise yang siap pakai dan otomatis didaftarkan ke EnterpriseGlideGrid
 */
export const allEnterpriseCellRenderers: CustomRenderer<any>[] = [
  badgeCellRenderer,
  actionButtonCellRenderer,
  sparklineCellRenderer,
  starCellRenderer,
  rangeCellRenderer,
  datePickerCellRenderer,
  dropdownCellRenderer,
  buttonCellRenderer,
  tagsCellRenderer,
  linksCellRenderer,
  spinnerCellRenderer,
  userProfileCellRenderer,
  switchCellRenderer,
];

export * from './badge-cell';
export * from './action-button-cell';
export * from './sparkline-cell';
export * from './star-cell';
export * from './range-cell';
export * from './date-picker-cell';
export * from './dropdown-cell';
export * from './button-cell';
export * from './tags-cell';
export * from './links-cell';
export * from './spinner-cell';
export * from './user-profile-cell';
export * from './switch-cell';
