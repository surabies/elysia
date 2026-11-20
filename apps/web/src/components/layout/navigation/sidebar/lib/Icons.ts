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
  Target,
  Globe,
  Newspaper,
  Landmark,
  CreditCard,
  UploadCloud,
  UserMinus,
  Image as ImageIcon,
} from "lucide-react";

// ----------------------------------------------------------------------------
// 1. IKON MENU UTAMA (Standalone Sidebar Items)
// ----------------------------------------------------------------------------
export const PRIMARY_ICONS: Record<string, SidebarIconComponent> = {
  "/dashboard": GeistProjects,
  "/analytics": GeistAnalytics,
  "/kpi": Target,
  "/places": Compass,
  "/peta-wilayah": Map,
  "/peta-pengaduan": MapPinned,
  "/broadcast": Radio,
  "/pelanggan": Users,
  "/info-pelanggan": Contact,
  "/cater/ganti-meter": RefreshCw,
  "/progres/koreksi": FilePenLine,
  "/laporan/lap-drd": Receipt,
  "/meter/hitung-rata-rata": Calculator,
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
  ikhtisar: GeistProjects,
  "pencatatan-meter": Gauge,
  tagihan: Receipt,
  langganan: Users,
  "import-data": UploadCloud,
  "setting-landing": Globe,
  pengaturan: Settings,

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
// 3. IKON SUBMENU (Semua Modul Semantik & Ringkas)
// ----------------------------------------------------------------------------
const ITEM_ICONS: Record<string, SidebarIconComponent> = {
  // === 0. IKHTISAR ===
  dashboard: GeistProjects,
  analitik: GeistAnalytics,
  "scorecard kpi": Target,
  kpi: Target,
  "peta spasial": Compass,
  places: Compass,
  "peta wilayah": Map,
  "peta wilayah operasional": Map,

  // === 1. PILAR 1: PENCATATAN METER ===
  "monitoring baca": Gauge,
  "monitoring baca meter": Gauge,
  "simulasi baca": FlaskConical,
  "simulasi baca meter": FlaskConical,
  "verifikasi chn": ClipboardCheck,
  "verifikasi petugas (chn)": ClipboardCheck,
  "foto meter": Camera,
  "cek bukti foto meter": Camera,
  "cek foto": Camera,
  "audit bukti foto meter": Camera,
  "radar anomali": TrendingUp,
  "radar anomali kubikasi": TrendingUp,
  "anomali kubikasi": TrendingUp,
  "pemakaian ekstrim & anomali": TrendingUp,
  "ikhtisar pemakaian ekstrim": TrendingUp,
  "progres petugas": LineChart,
  "progres petugas cater": LineChart,
  "progres cater": LineChart,
  "capaian wilayah": Building2,
  "capaian per wilayah": Building2,
  "progres wilayah": Building2,
  "ganti meter": RefreshCw,
  "ganti water meter": RefreshCw,
  "ganti water meter (gwm)": RefreshCw,
  "kode kelainan": AlertTriangle,
  "kode kelainan meter": AlertTriangle,
  "kelainan meter": AlertTriangle,
  "pemetaan rute": Navigation,
  "pemetaan rute petugas": Navigation,
  "pemetaan petugas": Navigation,

  // === 2. PILAR 2: TAGIHAN ===
  "laporan drd": Receipt,
  "laporan rekening drd": Receipt,
  "koreksi stand": FilePenLine,
  "koreksi rekening & stand": FilePenLine,
  "manual add": PenTool,
  "manual add & taksasi": PenTool,
  "hitung rata-rata": Calculator,
  "konsol tutup bulan": Lock,
  "monitoring tutup bulan": Lock,
  "stand angkat": Scale,
  "stand angkat meter": Scale,
  "perbandingan tagihan": BarChart3,
  "pbpk tagihan": CheckCircle2,
  "pbpk rekening air": CheckCircle2,
  "pbpk (pasang baru & pk)": CheckCircle2,
  pbpk: CheckCircle2,

  // === 3. PILAR 3: LANGGANAN ===
  "info pelanggan": Contact,
  "info detail pelanggan": Contact,
  pelanggan: Contact,
  "lapor mandiri": Smartphone,
  "lapor meter mandiri": Smartphone,
  "verifikasi lapor mandiri warga": Smartphone,
  "verifikasi baca pelanggan": Smartphone,
  "baca meter mandiri": Smartphone,
  "pengaduan layanan": LifeBuoy,
  "pengaduan & tiket layanan": LifeBuoy,
  "pengaduan air": LifeBuoy,
  pengaduan: LifeBuoy,
  "mutasi pelanggan": GitFork,
  "pindah tarif": ArrowLeftRight,
  "pindah golongan tarif": ArrowLeftRight,
  "pindah jenis tarif": ArrowLeftRight,
  "validasi kontak": Phone,
  "validasi no hp & kontak": Phone,
  "no hp pelanggan": Phone,

  // === 4. IMPORT DATA ===
  "import-data": UploadCloud,
  "foto backup": ImageIcon,
  "import foto backup": ImageIcon,
  "import data": UploadCloud,
  "lap data meter": FileSpreadsheet,
  "import lapdatameter": FileSpreadsheet,
  "lapdatameter": FileSpreadsheet,
  "r nomor": UserMinus,
  "import r nomor": UserMinus,
  "import pbpk": FolderSync,

  // === 5. SETTING LANDING PAGE ===
  "setting landing": Globe,
  "setting landing page": Globe,
  "profil & kontak": Landmark,
  "pasang baru": FileText,
  "syarat pasang baru": FileText,
  "cara bayar": CreditCard,
  "cara pembayaran": CreditCard,
  "tarif air": Coins,
  "struktur tarif air": Coins,
  "berita portal": Newspaper,
  "berita & pengumuman": Newspaper,
  "siaran gangguan": Radio,
  "siaran & info gangguan": Radio,
  broadcast: Radio,

  // === 5. PENGATURAN ===
  pengaturan: Settings,
  "pengaturan aplikasi": Settings,
  "profil akun": UserCog,
  "profil akun & operator": UserCog,
  "catat meter": Sliders,
  "parameter catat meter": Sliders,
  "verifikasi & anomali": ShieldCheck,
  "billing & denda": BookOpen,
  "billing & tarif denda": BookOpen,
  "pengaduan & sla": Activity,
  "pengaduan & layanan gwm": Activity,
  "sistem & log": Binary,
  "sistem & audit log": Binary,
  pengguna: Users,
  "manajemen pengguna": Users,
  "manajemen user": Users,
  "hak akses (rbac)": KeyRound,
  "hak akses / rbac": KeyRound,
  "otorisasi menu (rbac)": KeyRound,
  "otorisasi menu": KeyRound,

  // Alias kompatibilitas
  "baca petugas (chn)": ClipboardCheck,
  "baca petugas": ClipboardCheck,
  "verifikasi petugas lapangan": ClipboardCheck,
  "verifikasi baca petugas": ClipboardCheck,
  "baca meter chn": ClipboardCheck,
  "stand konsumen": Smartphone,
  "koreksi kubikasi & reklasifikasi": FilePenLine,
  "koreksi kubikasi": FilePenLine,
  "input stand manual": PenTool,
  "peta pengaduan": MapPinned,
  "peta pengaduan air": MapPinned,
  "create perbandingan": BarChart3,
  "cek selisih pelanggan": Scale,
  "panduan 12 modul": BookOpen,
  "upload master pelanggan": Upload,
  "update zonasi": Navigation,
  "posting datameter": CheckCircle2,
  "create closed drd": Lock,
  "create bulan baru": CalendarPlus,
  "sync pelanggan baru": FolderSync,
  "update data pelanggan": ListOrdered,
  "evaluasi petugas": Award,
  "kinerja petugas": Award,
  kelainan: AlertTriangle,
  "stand awal & akhir": Binary,
  "lap. periode cater": FileText,
  "lap. data meter": Gauge,
  "lap. selisih hari": Clock,
  "lap. mutasi pelanggan": GitFork,
  "lap. perubahan pel": FilePenLine,
  "lap. pelanggan": Users,
  "lap. history": History,
  "petugas cater": UserCheck,
  "urutan rute": ListOrdered,
  "gabung rute": Merge,
  "pindah rute": ArrowLeftRight,
  "monitoring pindah rute": Activity,
  "pemetaan pelanggan": Compass,
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
