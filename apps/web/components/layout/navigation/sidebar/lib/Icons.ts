// components/layout/navigation/sidebar/lib/Icons.ts
// Sistem ikon hybrid: Geist UI + GitHub Octicons + Lucide.
// Menjamin keselarasan visual Swiss minimalist geometry (Geist)
// dipadukan dengan semantik enterprise (Octicons) dan utilitas domain (Lucide).

import type * as React from "react"
import type { SidebarIconComponent } from "../NavRow"

// 1. GEIST ICONS (Minimalis, Swiss geometry, presisi Vercel)
import {
  Grid,
  Activity,
  FileText,
  Database,
  MapPin,
  Tool,
  Settings,
  HelpCircle,
  RefreshCw,
  Sliders,
  User,
  Users,
  Map,
  Camera,
  Clock,
  Layers,
  Calendar,
  AlertTriangle,
  AlertCircle,
  UploadCloud,
  DownloadCloud,
  Bell,
  Sliders as SlidersIcon,
} from "@geist-ui/icons"

// 2. OCTICONS (Semantik Git, Branch, Merge, Otorisasi, Audit)
import {
  GitMergeIcon,
  GitPullRequestIcon,
  RepoIcon,
  SortDescIcon,
  ArrowSwitchIcon,
  ShieldLockIcon,
  GraphIcon,
  ChecklistIcon,
  HistoryIcon,
  OrganizationIcon,
  MegaphoneIcon,
  EyeIcon,
  TableIcon,
  SyncIcon,
  GitCompareIcon,
} from "@primer/octicons-react"

// 3. LUCIDE ICONS (Domain utilities, alat ukur air & meter)
import {
  Gauge,
  Receipt,
  Ticket,
  Calculator,
  TrendingUp,
  TrendingDown,
  CircleSlash,
  FileSpreadsheet,
  PhoneCall,
  FilePlus,
  Files,
  Lock,
  Compass,
  Workflow,
  Percent,
  BarChart3,
  UserCheck,
  Diff,
  UserPlus,
  Droplets,
  Building2,
  FolderOpen,
} from "lucide-react"

// ----------------------------------------------------------------------------
// IKON MENU UTAMA (Puncak Sidebar: Dashboard / Analytics / Pengaduan)
// ----------------------------------------------------------------------------
export const PRIMARY_ICONS: Record<string, SidebarIconComponent> = {
  "/dashboard": Grid,
  "/analytics": GraphIcon,
  "/pengaduan": Ticket,
}

export function getPrimaryIcon(href: string): SidebarIconComponent {
  return PRIMARY_ICONS[href] ?? Grid
}

// ----------------------------------------------------------------------------
// IKON GRUP / DIREKTORAT (Sesuai docs/SIDEBAR_REFERENCE.md)
// ----------------------------------------------------------------------------
export const GROUP_ICONS: Record<string, SidebarIconComponent> = {
  master: Database,
  "pengolahan-data": Gauge,
  peta: Map,
  progres: BarChart3,
  progress: BarChart3,
  laporan: FileText,
  "tool-tutup-bulan": Lock,
  tools: Tool,
  "sync-tutup-bulan": RefreshCw,
  pengaturan: Settings,
  bantuan: HelpCircle,
}

export const FALLBACK_GROUP_ICON: SidebarIconComponent = Layers

export function getGroupIcon(groupId: string): SidebarIconComponent {
  return GROUP_ICONS[groupId] ?? FALLBACK_GROUP_ICON
}

// ----------------------------------------------------------------------------
// IKON SUBMENU (Pemetaan presisi dari 3 library)
// ----------------------------------------------------------------------------
const ITEM_ICONS: Record<string, SidebarIconComponent> = {
  // === 2. MASTER ===
  kelainan: AlertTriangle,
  "otorisasi menu": ShieldLockIcon,
  user: User,
  pengguna: User,
  petugas: Users,
  "pemetaan petugas": Compass,
  "pemetaan rute": Compass,
  "pengurutan rute petugas": SortDescIcon,
  "pengurutan rute": SortDescIcon,
  "penggabungan rute": GitMergeIcon,
  "pindah rute": ArrowSwitchIcon,
  "pindah rute monitoring": Activity,
  "struktur organisasi": OrganizationIcon,
  "wilayah administratif": Map,
  "tarif & harga air": Receipt,

  // === 3. PENGOLAHAN DATA ===
  "baca meter chn": Gauge,
  "daftar pencatatan meter": RepoIcon,
  "info pelanggan": User,
  "mutasi pb-pk": GitPullRequestIcon,
  "mutasi pbpk": GitPullRequestIcon,
  "no hp pel": PhoneCall,
  "no hp pelanggan": PhoneCall,
  "pindah jenis pel": ArrowSwitchIcon,
  "pindah jenis pelanggan": ArrowSwitchIcon,
  "manual add": FilePlus,
  "manual add all": Files,
  "hitung rata-rata": Calculator,
  "cek foto petugas": EyeIcon,
  "verifikasi catat mandiri": ChecklistIcon,
  "baca meter pelanggan": ChecklistIcon,
  "cek stand konsumen": ChecklistIcon,

  // === 4. PETA (MAPPING) ===
  "pemetaan pelanggan": MapPin,
  "peta wilayah": Map,
  "peta pengaduan air": Ticket,
  "peta pengaduan": Ticket,

  // === 5. PROGRESS ===
  "grafik pelanggan": GraphIcon,
  "progress per wilayah": BarChart3,
  "progress per cater": UserCheck,
  "progres pencatat": UserCheck,
  "presentase koreksi": Percent,
  "ikhtisar pemakaian ekstrim": TrendingUp,
  "ikhtisar pemakaian turun": TrendingDown,
  "ikhtisar pemakaian 0": CircleSlash,
  "ikhtisar pemakaian 0 (nol)": CircleSlash,
  "hasil foto petugas": Camera,

  // === 6. LAPORAN (REPORTS) ===
  "laporan drd": Receipt,
  "lap. mutasi pel": SyncIcon,
  "lap. mutasi pb-pk": GitPullRequestIcon,
  "lap. periode cater": Clock,
  "lap data meter": FileSpreadsheet,
  "lap. data meter": FileSpreadsheet,
  "lap kelainan meter": AlertCircle,
  "lap. kelainan meter": AlertCircle,
  "lap evaluasi": FileText,
  "lap. evaluasi": FileText,
  "lap pelanggan": Users,
  "lap. pelanggan": Users,
  "lap. selisih hari": Diff,
  "lap data st. awal & akhir": TableIcon,
  "lap. data st. awal & akhir": TableIcon,
  "lap data st. 0 (nol)": CircleSlash,
  "lap. data st. 0 (nol)": CircleSlash,
  "lap history": HistoryIcon,
  "lap. history": HistoryIcon,
  "lap perubahan pel": ArrowSwitchIcon,
  "lap. perubahan pel": ArrowSwitchIcon,
  "lap. data dan foto": Camera,
  "lap. monitoring kubikasi koreksi": Activity,

  // === 7. TOOL TUTUP BULAN ===
  pbpk: GitPullRequestIcon,
  "stand angkat": ChecklistIcon,
  "update zonasi": Map,
  "posting datameter": TableIcon,
  "create closed drd": Lock,
  "create perbandingan": GitCompareIcon,
  "create bulan baru": Calendar,
  "upload master pelanggan": UploadCloud,
  "sync pelanggan baru": UserPlus,
  "update data pelanggan": SyncIcon,
  "cek selisih pelanggan": Diff,
  "monitoring ttp bulan": Activity,
  "monitoring tutup bulan": Activity,

  // === 8. TOOLS & INTEGRASI ===
  "running text": MegaphoneIcon,
  "import st angkat": DownloadCloud,
  "import stand angkat": DownloadCloud,
  "import pb pk": GitPullRequestIcon,
  "import pbpk": GitPullRequestIcon,
  "proses pbpk": Workflow,
  "import backup photo": Camera,
  "import backup photo gwm": Droplets,
  "import backup data": Database,
  "import data spt": FileText,
  "import data anomali": AlertTriangle,
  "import data gwm": Droplets,
  "import tutup": Lock,

  // === 9. SYNC TUTUP BULAN ===
  "sync (1) kirim mutasi": SyncIcon,
  "sync (2) kirim datameter": RepoIcon,
  "sync (3) import sti": FileSpreadsheet,
  "sync (4) bulan baru": Calendar,

  // === 10. PENGATURAN & BANTUAN ===
  "jendela laporan mandiri": Calendar,
  notifikasi: Bell,
  "panduan pengguna": HelpCircle,
}

export function getItemIcon(
  title: string,
  fallback: SidebarIconComponent
): SidebarIconComponent {
  const key = title.trim().toLowerCase()
  return ITEM_ICONS[key] ?? fallback
}
