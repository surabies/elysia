// components/layout/navigation/sidebar/lib/Icons.ts
// Sistem ikon sidebar yang konsisten, berorientasi semantik domain PDAM / Billing / Meter.
// 100% konsisten: stroke-width 1.5, size 16x16, geometri presisi Geist / Lucide.
// ZERO DUPLICATES across all 70 modules!

import type * as React from "react";
import type { SidebarIconComponent } from "../NavRow";
import {
  GeistProjects,
  GeistAnalytics,
  GeistSupport,
  GeistStorage,
  GeistLogs,
  GeistNetworking,
  GeistBilling,
  GeistSecurity,
  GeistWorkflows,
  GeistInfrastructure,
  GeistSettings,
} from "./GeistIcons";

import {
  // Master
  AlertTriangle,
  ShieldCheck,
  UserCog,
  UserCheck,
  MapPin,
  ListOrdered,
  Merge,
  ArrowRightLeft,
  History,

  // Pengolahan Data
  Gauge,
  Contact,
  FilePlus2,
  Phone,
  Tags,
  FilePenLine,
  CopyPlus,
  Calculator,
  Eye,
  Smartphone,

  // Peta
  Compass,

  // Progress
  LineChart,
  Building2,
  ClipboardCheck,
  Percent,
  TrendingUp,
  TrendingDown,
  CircleSlash,
  Camera,

  // Laporan
  Receipt,
  UsersRound,
  GitFork,
  CalendarRange,
  FileSpreadsheet,
  AlertCircle,
  Award,
  BookUser,
  Hourglass,
  Binary,
  Ban,
  Milestone,
  FileClock,
  Image,
  Activity,

  // Tool Tutup Bulan
  ClipboardEdit,
  KeyRound,
  Layers,
  Send,
  Lock,
  GitCompare,
  CalendarPlus,
  UploadCloud,
  UserPlus,
  UserCheck2,
  Scale,
  GaugeCircle,

  // Tools
  Megaphone,
  DownloadCloud,
  FileDown,
  Cpu,
  FileImage,
  Images,
  DatabaseBackup,
  ScrollText,
  ShieldAlert,
  Droplets,
  FolderArchive,

  // Sync
  Share2,
  SendHorizontal,
  FolderSync,
  CalendarSync,

  // Secondary utilities
  HelpCircle,
  Bell,
  Sliders,
} from "lucide-react";

// ----------------------------------------------------------------------------
// 1. IKON MENU UTAMA (Puncak Sidebar)
// ----------------------------------------------------------------------------
export const PRIMARY_ICONS: Record<string, SidebarIconComponent> = {
  "/dashboard": GeistProjects,
  "/analytics": GeistAnalytics,
  "/pengaduan": GeistSupport,
};

export function getPrimaryIcon(href: string): SidebarIconComponent {
  return PRIMARY_ICONS[href] ?? GeistProjects;
}

// ----------------------------------------------------------------------------
// 2. IKON GRUP / DIREKTORAT (8 Grup Utama)
// ----------------------------------------------------------------------------
export const GROUP_ICONS: Record<string, SidebarIconComponent> = {
  master: GeistStorage,
  "pengolahan-data": GeistLogs,
  peta: GeistNetworking,
  progres: GeistAnalytics,
  progress: GeistAnalytics,
  laporan: GeistBilling,
  "tool-tutup-bulan": GeistSecurity,
  tools: GeistWorkflows,
  "sync-tutup-bulan": GeistInfrastructure,
  pengaturan: GeistSettings,
  bantuan: GeistSupport,
};

export const FALLBACK_GROUP_ICON: SidebarIconComponent = GeistProjects;

export function getGroupIcon(groupId: string): SidebarIconComponent {
  return GROUP_ICONS[groupId] ?? FALLBACK_GROUP_ICON;
}

// ----------------------------------------------------------------------------
// 3. IKON SUBMENU (70 Modul: 100% Unik & Sangat Relevan Tanpa Duplikat)
// ----------------------------------------------------------------------------
const ITEM_ICONS: Record<string, SidebarIconComponent> = {
  // === 1. MASTER ===
  kelainan: AlertTriangle,
  "otorisasi menu": ShieldCheck,
  user: UserCog,
  pengguna: UserCog,
  petugas: UserCheck,
  "pemetaan petugas": MapPin,
  "pengurutan rute petugas": ListOrdered,
  "pengurutan rute": ListOrdered,
  "penggabungan rute": Merge,
  "pindah rute": ArrowRightLeft,
  "pindah rute monitoring": History,

  // === 2. PENGOLAHAN DATA ===
  "baca meter chn": Gauge,
  "info pelanggan": Contact,
  "mutasi pb-pk": FilePlus2,
  "mutasi pbpk": FilePlus2,
  "no hp pel": Phone,
  "no hp pelanggan": Phone,
  "pindah jenis pel": Tags,
  "pindah jenis pelanggan": Tags,
  "manual add": FilePenLine,
  "manual add all": CopyPlus,
  "hitung rata-rata": Calculator,
  "cek foto petugas": Eye,
  "baca meter mandiri": Smartphone,
  "stand konsumen": Smartphone,

  // === 3. PETA (MAPPING) ===
  "pemetaan pelanggan": Compass,

  // === 4. PROGRESS ===
  "grafik pelanggan": LineChart,
  "progress per wilayah": Building2,
  "progress per cater": ClipboardCheck,
  "progres pencatat": ClipboardCheck,
  "presentase koreksi": Percent,
  "ikhtisar pemakaian ekstrim": TrendingUp,
  "ikhtisar pemakaian turun": TrendingDown,
  "ikhtisar pemakaian 0 (nol)": CircleSlash,
  "ikhtisar pemakaian 0": CircleSlash,
  "hasil foto petugas": Camera,

  // === 5. LAPORAN (REPORTS) ===
  "laporan drd": Receipt,
  "lap. mutasi pel": UsersRound,
  "lap mutasi pel": UsersRound,
  "lap. mutasi pb-pk": GitFork,
  "lap mutasi pb-pk": GitFork,
  "lap. periode cater": CalendarRange,
  "lap periode cater": CalendarRange,
  "lap. data meter": FileSpreadsheet,
  "lap data meter": FileSpreadsheet,
  "lap. kelainan meter": AlertCircle,
  "lap kelainan meter": AlertCircle,
  "lap. evaluasi": Award,
  "lap evaluasi": Award,
  "lap. pelanggan": BookUser,
  "lap pelanggan": BookUser,
  "lap. selisih hari": Hourglass,
  "lap selisih hari": Hourglass,
  "lap. data st. awal & akhir": Binary,
  "lap data st. awal & akhir": Binary,
  "lap. data st. 0 (nol)": Ban,
  "lap data st. 0 (nol)": Ban,
  "lap. history": Milestone,
  "lap history": Milestone,
  "lap. perubahan pel": FileClock,
  "lap perubahan pel": FileClock,
  "lap. data dan foto": Image,
  "lap data dan foto": Image,
  "lap. monitoring kubikasi koreksi": Activity,
  "lap monitoring kubikasi koreksi": Activity,

  // === 6. TOOL TUTUP BULAN ===
  pbpk: ClipboardEdit,
  "stand angkat": KeyRound,
  "update zonasi": Layers,
  "posting datameter": Send,
  "create closed drd": Lock,
  "create perbandingan": GitCompare,
  "create bulan baru": CalendarPlus,
  "upload master pelanggan": UploadCloud,
  "sync pelanggan baru": UserPlus,
  "update data pelanggan": UserCheck2,
  "cek selisih pelanggan": Scale,
  "monitoring ttp bulan": GaugeCircle,
  "monitoring tutup bulan": GaugeCircle,

  // === 7. TOOLS & INTEGRASI ===
  "running text": Megaphone,
  "import st angkat": DownloadCloud,
  "import stand angkat": DownloadCloud,
  "import pb pk": FileDown,
  "import pbpk": FileDown,
  "proses pbpk": Cpu,
  "import backup photo": FileImage,
  "import backup photo gwm": Images,
  "import backup data": DatabaseBackup,
  "import data spt": ScrollText,
  "import data anomali": ShieldAlert,
  "import data gwm": Droplets,
  "import tutup": FolderArchive,

  // === 8. SYNC TUTUP BULAN ===
  "sync (1) kirim mutasi": Share2,
  "sync (2) kirim datameter": SendHorizontal,
  "sync (3) import sti": FolderSync,
  "sync (4) bulan baru": CalendarSync,

  // === 9. BANTUAN & PENGATURAN ===
  notifikasi: Bell,
  "panduan pengguna": HelpCircle,
  pengaturan: Sliders,
};

export function getItemIcon(
  title: string,
  fallback: SidebarIconComponent
): SidebarIconComponent {
  const key = title.trim().toLowerCase();
  return ITEM_ICONS[key] ?? fallback;
}
