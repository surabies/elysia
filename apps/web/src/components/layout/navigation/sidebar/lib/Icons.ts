// components/layout/navigation/sidebar/lib/Icons.ts
// Sistem ikon sidebar yang konsisten, berorientasi semantik domain PDAM / Billing / Meter.
// 100% konsisten: stroke-width 1.5, size 16x16, geometri presisi.

import type { SidebarIconComponent } from "../NavRow";
import {
  GeistProjects,
  GeistAnalytics,
} from "./GeistIcons";

import {
  // Group Icons
  Activity,
  ShieldCheck,
  Users,
  Calculator,
  FileSpreadsheet,
  Database,

  // Submenu: Monitoring & Cater
  Gauge,
  FlaskConical,
  LineChart,
  MapPinned,
  Map,
  Building2,
  TrendingUp,
  Camera,

  // Submenu: Verifikasi & Mutasi
  ClipboardCheck,
  Smartphone,
  RefreshCw,
  FilePenLine,
  PenTool,
  Phone,
  Layers,

  // Submenu: Pelayanan
  LifeBuoy,
  Contact,
  GitFork,

  // Submenu: Tutup Bulan & Closing
  Lock,
  Scale,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CalendarPlus,
  Upload,
  FolderSync,

  // Submenu: Laporan
  Receipt,
  Coins,
  AlertTriangle,
  Award,
  Binary,
  History,
  FileText,
  Clock,

  // Submenu: Master Data & Tools
  UserCheck,
  Navigation,
  ListOrdered,
  Sliders,
  UserCog,
  KeyRound,
  Merge,
  ArrowLeftRight,
  Radio,

  // Fallbacks & Secondary
  FolderDot,
  Compass,
  Settings,
} from "lucide-react";

// ----------------------------------------------------------------------------
// 1. IKON MENU UTAMA (Standalone Sidebar Items)
// ----------------------------------------------------------------------------
export const PRIMARY_ICONS: Record<string, SidebarIconComponent> = {
  "/dashboard": GeistProjects,
  "/analytics": GeistAnalytics,
  "/places": Compass,
  "/pelanggan": Users,
  "/info-pelanggan": Contact,
  "/tools-tutup/monitoring-tutup-bulan": Lock,
  "/pengaturan": Settings,
};

export function getPrimaryIcon(href: string): SidebarIconComponent {
  return PRIMARY_ICONS[href] ?? GeistProjects;
}

// ----------------------------------------------------------------------------
// 2. IKON GRUP UTAMA (Core Enterprise Groups)
// ----------------------------------------------------------------------------
export const GROUP_ICONS: Record<string, SidebarIconComponent> = {
  monitoring: Activity,
  verifikasi: ShieldCheck,
  pelayanan: Users,
  "tutup-bulan": Calculator,
  laporan: FileSpreadsheet,
  master: Database,

  // Alias kompatibilitas
  progres: Activity,
  billing: Calculator,
  "pengolahan-data": ShieldCheck,
  "tool-tutup-bulan": Calculator,
};

export const FALLBACK_GROUP_ICON: SidebarIconComponent = FolderDot;

export function getGroupIcon(groupId: string): SidebarIconComponent {
  return GROUP_ICONS[groupId] ?? FALLBACK_GROUP_ICON;
}

// ----------------------------------------------------------------------------
// 3. IKON SUBMENU (Semua Modul Semantik)
// ----------------------------------------------------------------------------
const ITEM_ICONS: Record<string, SidebarIconComponent> = {
  // === 1. MONITORING & CATER ===
  "monitoring baca meter": Gauge,
  "simulasi baca meter": FlaskConical,
  "progres petugas": LineChart,
  "progres cater": LineChart,
  "progres pembacaan harian": LineChart,
  "peta spasial": MapPinned,
  "peta monitoring spasial": MapPinned,
  places: MapPinned,
  "peta pengaduan": Map,
  "peta pengaduan air": Map,
  "progres wilayah": Building2,
  "capaian per wilayah": Building2,
  "anomali kubikasi": TrendingUp,
  "pemakaian ekstrim & anomali": TrendingUp,
  "ikhtisar pemakaian ekstrim": TrendingUp,
  "cek foto": Camera,
  "audit bukti foto meter": Camera,
  "cek foto petugas": Camera,
  "hitung rata-rata": Calculator,

  // === 2. VERIFIKASI & MUTASI ===
  "baca petugas (chn)": ClipboardCheck,
  "baca petugas": ClipboardCheck,
  "verifikasi petugas lapangan": ClipboardCheck,
  "verifikasi baca petugas": ClipboardCheck,
  "baca meter chn": ClipboardCheck,
  "lapor mandiri": Smartphone,
  "verifikasi lapor mandiri warga": Smartphone,
  "verifikasi baca pelanggan": Smartphone,
  "baca meter mandiri": Smartphone,
  "stand konsumen": Smartphone,
  "ganti water meter": RefreshCw,
  "ganti meter": RefreshCw,
  "penggantian meter air (gwm)": RefreshCw,
  "koreksi stand": FilePenLine,
  "koreksi kubikasi & reklasifikasi": FilePenLine,
  "koreksi kubikasi": FilePenLine,
  "manual add & taksasi": PenTool,
  "manual add": PenTool,
  "input stand manual": PenTool,
  "mutasi pelanggan": GitFork,
  "pindah jenis tarif": ArrowLeftRight,
  "no hp pelanggan": Phone,

  // === 3. PELAYANAN ===
  "pengaduan air": LifeBuoy,
  "monitoring pengaduan air": LifeBuoy,
  pengaduan: LifeBuoy,
  "info pelanggan": Contact,
  pelanggan: Contact,

  // === 4. CLOSING & TUTUP BULAN ===
  "konsol tutup bulan": Lock,
  "monitoring tutup bulan": Lock,
  "stand angkat": RefreshCw,
  "perbandingan tagihan": BarChart3,
  "create perbandingan": BarChart3,
  "cek selisih pelanggan": Scale,
  "pbpk (pasang baru & pk)": GitFork,
  pbpk: GitFork,
  "panduan 12 modul": BookOpen,
  "upload master pelanggan": Upload,
  "update zonasi": Navigation,
  "posting datameter": CheckCircle2,
  "create closed drd": Lock,
  "create bulan baru": CalendarPlus,
  "sync pelanggan baru": FolderSync,
  "update data pelanggan": ListOrdered,

  // === 5. BILLING & LAPORAN ===
  "laporan drd": Receipt,
  "evaluasi petugas": Award,
  "kinerja petugas": Award,
  "kelainan meter": AlertTriangle,
  "stand awal & akhir": Binary,
  "lap. periode cater": FileText,
  "lap. data meter": Gauge,
  "lap. selisih hari": Clock,
  "lap. mutasi pelanggan": GitFork,
  "lap. perubahan pel": FilePenLine,
  "lap. pelanggan": Users,
  "lap. history": History,

  // === 6. MASTER DATA & TOOLS ===
  "petugas cater": UserCheck,
  "pemetaan petugas": Navigation,
  "urutan rute": ListOrdered,
  "kode kelainan": Sliders,
  "manajemen user": UserCog,
  "otorisasi menu": KeyRound,
  "gabung rute": Merge,
  "pindah rute": ArrowLeftRight,
  "monitoring pindah rute": Activity,
  "sync (1) kirim mutasi": FolderSync,
  "sync (2) kirim datameter": FolderSync,
  "sync (3) import sti": FolderSync,
  "sync (4) bulan baru": FolderSync,
  "running text": Radio,
  "import stand angkat": Upload,
  "import pb-pk": Upload,
  "import data gwm": Upload,
  "import foto gwm": Upload,
  "import data spt": Upload,
  "import data anomali": Upload,
  "import backup": Upload,
  "import tutup bulan": Upload,
};

export function getItemIcon(
  title: string,
  fallback: SidebarIconComponent
): SidebarIconComponent {
  const key = title.trim().toLowerCase();
  return ITEM_ICONS[key] ?? fallback;
}
