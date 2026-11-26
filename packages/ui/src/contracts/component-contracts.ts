import type { ReactNode } from "react";
import type { GeistSize, GeistTone } from "./tokens";

/**
 * Kontrak Standar untuk Komponen Tombol (Button & ButtonGroup)
 */
export interface IButtonContract {
  size?: GeistSize;
  variant?: "default" | "secondary" | "tertiary" | "error" | "warning" | "outline";
  shape?: "default" | "rounded" | "square";
  loading?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/**
 * Kontrak Standar untuk Badge (Geist Badge)
 */
export interface IBadgeContract {
  size?: GeistSize;
  variant?:
    | "gray"
    | "gray-subtle"
    | "blue"
    | "blue-subtle"
    | "purple"
    | "purple-subtle"
    | "amber"
    | "amber-subtle"
    | "red"
    | "red-subtle"
    | "green"
    | "green-subtle"
    | "teal"
    | "teal-subtle"
    | "inverted";
  pill?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

/**
 * Kontrak Standar untuk StatusDot (Indikator status sistem, verifikasi, server)
 */
export interface IStatusDotContract {
  state: "ready" | "building" | "queued" | "error" | "canceled" | "deleted";
  label?: string;
  size?: "sm" | "md";
  showPulse?: boolean;
}

/**
 * Kontrak Standar untuk Input Field (Text, Search, Clearable, Address)
 */
export interface IInputContract {
  size?: GeistSize;
  prefix?: ReactNode;
  suffix?: ReactNode;
  clearable?: boolean;
  error?: string | boolean;
  helperText?: string;
}

/**
 * Kontrak Standar untuk Toolbar Halaman / Tabel Data
 */
export interface IToolbarContract {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterSlot?: ReactNode;
  actionSlot?: ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
}

/**
 * Kontrak Standar untuk Filter Bar & Chips
 */
export interface IFilterChipItem {
  id: string;
  keyLabel: string;
  valueLabel: string;
  onRemove: () => void;
}

export interface IFilterBarContract {
  filters: IFilterChipItem[];
  onClearAll?: () => void;
  triggerSlot?: ReactNode;
}

/**
 * Kontrak Standar Pagination Tabel (Vercel Data Pager)
 */
export interface IPaginationContract {
  pageIndex: number; // 1-based or 0-based
  pageSize: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

/**
 * Kontrak Standar Date Range Picker
 */
export interface IDateRangePreset {
  label: string;
  getValue: () => { from: Date; to: Date };
}

export interface IDateRangePickerContract {
  value?: { from?: Date; to?: Date };
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void;
  placeholder?: string;
  size?: GeistSize;
  presets?: IDateRangePreset[];
  disabled?: boolean;
}

/**
 * Kontrak Standar Dialog / Modal
 */
export interface IDialogContract {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
}
