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
    | "inverted"
    | "pill";
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
  pageIndex: number;
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

/**
 * Kontrak Standar Browser Mockup (Geist Browser)
 */
export interface IBrowserContract {
  url?: string;
  title?: string;
  addressBar?: boolean;
  children: ReactNode;
}

/**
 * Kontrak Standar Phone Mockup (Geist Phone)
 */
export interface IPhoneContract {
  notch?: boolean;
  children: ReactNode;
}

/**
 * Kontrak Standar Book Mockup (Geist Book)
 */
export interface IBookContract {
  title: string;
  author?: string;
  coverUrl?: string;
  color?: string;
}

/**
 * Kontrak Standar Code Block (Geist Code & CodeBlock)
 */
export interface ICodeBlockContract {
  code: string;
  language?: string;
  filename?: string;
  copyable?: boolean;
  lineNumbers?: boolean;
}

/**
 * Kontrak Standar Context Card
 */
export interface IContextCardContract {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  avatar?: ReactNode;
  action?: ReactNode;
  href?: string;
}

/**
 * Kontrak Standar Destructive Action Modal
 */
export interface IDestructiveActionModalContract {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  verificationPhrase?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

/**
 * Kontrak Standar Dots Menu
 */
export interface IDotsMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface IDotsMenuContract {
  items: IDotsMenuItem[];
  align?: "start" | "center" | "end";
  size?: GeistSize;
}

/**
 * Kontrak Standar Feedback (Geist Feedback Popover)
 */
export interface IFeedbackContract {
  title?: string;
  onSubmit: (feedback: { score?: number; message: string }) => void | Promise<void>;
  onClose?: () => void;
}

/**
 * Kontrak Standar File Tree
 */
export interface IFileTreeItem {
  name: string;
  type: "file" | "directory";
  children?: IFileTreeItem[];
  defaultOpen?: boolean;
}

export interface IFileTreeContract {
  items: IFileTreeItem[];
  onSelect?: (item: IFileTreeItem, fullPath: string) => void;
  selectedPath?: string;
}

/**
 * Kontrak Standar JSON View (Geist JsonView)
 */
export interface IJsonViewContract {
  data: unknown;
  collapsed?: boolean;
  maxDepth?: number;
}

/**
 * Kontrak Standar Load More Button
 */
export interface ILoadMoreButtonContract {
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore: () => void;
  label?: string;
  loadingLabel?: string;
}

/**
 * Kontrak Standar MultiSelect
 */
export interface IMultiSelectOption {
  label: string;
  value: string;
}

export interface IMultiSelectContract {
  options: IMultiSelectOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Kontrak Standar Pie Gauge
 */
export interface IPieGaugeContract {
  value: number; // 0 - 100
  size?: number;
  label?: string;
  sublabel?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

/**
 * Kontrak Standar Pill
 */
export interface IPillContract {
  label: ReactNode;
  tone?: GeistTone;
  onRemove?: () => void;
  prefix?: ReactNode;
}

/**
 * Kontrak Standar Project Banner (Vercel Project Card / Deployment Banner)
 */
export interface IProjectBannerContract {
  name: string;
  url?: string;
  gitBranch?: string;
  gitCommit?: string;
  status?: "ready" | "building" | "queued" | "error";
  timeAgo?: string;
  framework?: string;
}

/**
 * Kontrak Standar Text With Copy Button
 */
export interface ITextWithCopyContract {
  text: string;
  label?: string;
  truncate?: boolean;
  copyTooltip?: string;
}

/**
 * Kontrak Standar Theme Switcher
 */
export interface IThemeSwitcherContract {
  theme?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

/**
 * Kontrak Standar Video Player (Geist Video Frame)
 */
export interface IVideoContract {
  src: string;
  poster?: string;
  title?: string;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  autoPlay?: boolean;
  loop?: boolean;
}
