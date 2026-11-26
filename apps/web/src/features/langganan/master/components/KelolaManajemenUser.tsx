'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  Shield,
  Smartphone,
  CheckCircle2,
  Lock,
  X,
  SlidersHorizontal,
  UserCheck,
  UserX,
  MoreHorizontal,
  KeyRound,
  UserPlus,
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { masterApi } from '../api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { IconStack } from '@/components/reui/icon-stack';
import { cn } from '@/lib/utils';
import type { UserManagementItem } from '@/server/services/master/master-extended.service';

export interface KelolaManajemenUserProps {
  userRole?: string;
  userRoles?: string[];
}

interface RoleDefinition {
  id: string;
  nama: string;
  kategori: 'SUPERADMIN' | 'MANAJEMEN' | 'VERIFIKATOR' | 'BILLING' | 'OPERASIONAL' | 'USER';
  ringLabel?: string;
  deskripsi: string;
  ringLevel?: number;
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'SUPERADMIN',
    nama: 'Super Admin',
    kategori: 'SUPERADMIN',
    ringLabel: 'System Root',
    deskripsi: 'Akses penuh sistem, audit trail, kelola master data, dan otorisasi',
  },
  {
    id: 'DIREKSI',
    nama: 'Direksi',
    kategori: 'MANAJEMEN',
    ringLabel: 'Direksi Eksekutif',
    ringLevel: 5,
    deskripsi: 'Executive dashboard, analitik pendapatan, dan hak override tertinggi',
  },
  {
    id: 'SENIOR_MANAGER',
    nama: 'Senior Manager',
    kategori: 'MANAJEMEN',
    ringLabel: 'Senior Manager',
    ringLevel: 4,
    deskripsi: 'Pimpinan divisi, monitoring operasional lintas unit, dan pengesahan',
  },
  {
    id: 'MANAGER',
    nama: 'Manager',
    kategori: 'MANAJEMEN',
    ringLabel: 'Manager Unit/Bagian',
    ringLevel: 3,
    deskripsi: 'Pimpinan bagian teknis (Langganan, Distribusi, RPM, Billing)',
  },
  {
    id: 'SUPERVISOR',
    nama: 'Supervisor',
    kategori: 'MANAJEMEN',
    ringLabel: 'Supervisor Unit',
    ringLevel: 2,
    deskripsi: 'Pengawas operasional lapangan teknis dan unit kerja',
  },
  {
    id: 'VERIFIKATOR_3',
    nama: 'Senior Verifikator (Ring 3)',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Ring 3 Final',
    ringLevel: 3,
    deskripsi: 'Pengesahan final pelepasan data pembacaan meter sebelum masuk ke DRD billing (Pencatat Meter)',
  },
  {
    id: 'VERIFIKATOR_2',
    nama: 'Manager Verifikator (Ring 2)',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Ring 2 Approval',
    ringLevel: 2,
    deskripsi: 'Validasi deviasi pemakaian dan approval anomali pelanggan (Pencatat Meter)',
  },
  {
    id: 'VERIFIKATOR_1',
    nama: 'Supervisor Verifikator (Ring 1)',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Ring 1 Screening',
    ringLevel: 1,
    deskripsi: 'Penyaringan awal bukti foto meter dan koreksi rute jalan (Pencatat Meter)',
  },
  {
    id: 'STAFF_ADMIN_BILLING',
    nama: 'Staf Admin Billing',
    kategori: 'BILLING',
    ringLabel: 'Operasional Billing',
    deskripsi: 'Koreksi stand pasca-verifikasi, input manual ADD, closing periode, dan DRD',
  },
  {
    id: 'STAFF',
    nama: 'Staf Administrasi',
    kategori: 'BILLING',
    ringLabel: 'Staf Kantor',
    deskripsi: 'Staf pelayanan administrasi langganan, billing, dan penagihan',
  },
  {
    id: 'PENCATAT',
    nama: 'Petugas Pencatat Meter',
    kategori: 'OPERASIONAL',
    ringLabel: 'Mobile Cater',
    deskripsi: 'Petugas lapangan pembacaan angka meter air fisik dan dokumentasi foto',
  },
  {
    id: 'PELAKSANA',
    nama: 'Pelaksana / Teknisi Lapangan',
    kategori: 'OPERASIONAL',
    ringLabel: 'Teknisi Lapangan',
    deskripsi: 'Staf pelaksana teknis distribusi pipa, tera meter RPM, dan perbaikan',
  },
  // Alias Legacy untuk kompatibilitas data lama
  {
    id: 'EXECUTIVE',
    nama: 'Direksi Eksekutif',
    kategori: 'MANAJEMEN',
    ringLabel: 'Executive Override',
    ringLevel: 5,
    deskripsi: 'Executive dashboard, analitik pendapatan, dan hak override tertinggi',
  },
  {
    id: 'USER',
    nama: 'Pelanggan Mandiri',
    kategori: 'USER',
    ringLabel: 'Publik Warga',
    deskripsi: 'Pelanggan mandiri untuk pelaporan angka meter bulanan dan pengaduan air',
  },
];

type FilterCategory = 'ALL' | 'VERIFIKATOR' | 'MANAJEMEN' | 'OPERASIONAL' | 'BILLING' | 'SUPERADMIN' | 'USER';
type StatusFilter = 'ALL' | 'AKTIF' | 'NONAKTIF';
type BagianFilterUser = 'ALL' | 'PENCATAT_METER' | 'LANGGANAN' | 'DISTRIBUSI' | 'RPM' | 'PENAGIHAN' | 'UMUM';

export function KelolaManajemenUser({
  userRole = 'USER',
  userRoles = [],
}: KelolaManajemenUserProps) {
  const [users, setUsers] = React.useState<UserManagementItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<FilterCategory>('ALL');
  const [bagianFilter, setBagianFilter] = React.useState<BagianFilterUser>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');

  // Modal State
  const [editUser, setEditUser] = React.useState<UserManagementItem | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('USER');
  const [selectedStatus, setSelectedStatus] = React.useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [saving, setSaving] = React.useState(false);
  const [togglingUserId, setTogglingUserId] = React.useState<string | null>(null);

  // Modal Tambah User State
  const [openTambahUser, setOpenTambahUser] = React.useState(false);
  const [tambahLoading, setTambahLoading] = React.useState(false);
  const [formTambah, setFormTambah] = React.useState({
    name: '',
    email: '',
    password: '',
    nip: '',
    wilayahKerja: 'WILAYAH_5',
    bagian: 'PENCATAT_METER',
    level: 'SUPERVISOR',
    jabatanNama: 'Supervisor Pencatat Meter Wilayah 5',
    role: 'SUPERVISOR',
    noHp: '',
    wajibGantiPassword: true,
  });

  const generatePassword = React.useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormTambah((prev) => ({ ...prev, password: pwd }));
  }, []);

  const handleTambahUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTambah.name.trim() || !formTambah.email.trim() || !formTambah.password.trim()) {
      toast.error('Mohon lengkapi Nama, Email, dan Password.');
      return;
    }

    const payload = {
      ...formTambah,
      roles:
        formTambah.role === 'PELAKSANA' && formTambah.bagian === 'PENCATAT_METER'
          ? ['PELAKSANA', 'PENCATAT']
          : [formTambah.role],
    };

    setTambahLoading(true);
    try {
      await masterApi.users.create(payload);
      toast.success(`Pengguna ${formTambah.name} berhasil dibuat!`);
      setOpenTambahUser(false);
      fetchUsers();
      // Reset form
      setFormTambah({
        name: '',
        email: '',
        password: '',
        nip: '',
        wilayahKerja: 'WILAYAH_5',
        bagian: 'PENCATAT_METER',
        level: 'SUPERVISOR',
        jabatanNama: 'Supervisor Pencatat Meter Wilayah 5',
        role: 'SUPERVISOR',
        noHp: '',
        wajibGantiPassword: true,
      });
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan koneksi saat membuat pengguna.');
    } finally {
      setTambahLoading(false);
    }
  };

  // Otoritas Pengguna
  const isAuthorized = React.useMemo(() => {
    const authorizedRoles = [
      'SUPERADMIN',
      'SUPER_ADMIN',
      'EXECUTIVE',
      'DIREKSI',
      'VERIFIKATOR_3',
      'SENIOR_MANAGER',
    ];
    return (
      authorizedRoles.includes(userRole) ||
      userRoles.some((r) => authorizedRoles.includes(r))
    );
  }, [userRole, userRoles]);

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const usersData = await masterApi.users.getAll();
      setUsers(usersData);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      toast.error('Koneksi server gagal saat mengambil data pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Edit Modal
  const bukaEditRole = (userItem: UserManagementItem) => {
    if (!isAuthorized) {
      toast.error('Akses Terbatas: Hanya Superadmin dan otoritas pimpinan yang dapat memodifikasi peranan.');
      return;
    }
    setEditUser(userItem);
    setSelectedRole(userItem.role);
    setSelectedStatus(userItem.status);
  };

  // Simpan Perubahan Peran & Status via API
  const simpanRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (!isAuthorized) {
      toast.error('Anda tidak memiliki otoritas untuk menyimpan perubahan.');
      return;
    }

    setSaving(true);
    try {
      await masterApi.users.updateRole(editUser.id, {
        role: selectedRole,
        status: selectedStatus,
      });

      toast.success(`Peran ${editUser.name || editUser.email} berhasil diperbarui menjadi ${selectedRole}.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? { ...u, role: selectedRole, status: selectedStatus }
            : u
        )
      );
      setEditUser(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
      toast.error(err.message || 'Terjadi kesalahan koneksi saat menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Status Aktif/Nonaktif
  const handleQuickToggleStatus = async (userItem: UserManagementItem) => {
    if (!isAuthorized) {
      toast.error('Hanya Superadmin yang dapat mengubah status akun.');
      return;
    }

    const nextStatus = userItem.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    setTogglingUserId(userItem.id);

    try {
      await masterApi.users.updateRole(userItem.id, {
        role: userItem.role,
        status: nextStatus,
      });

      toast.success(`Status akun ${userItem.name || userItem.email} diubah menjadi ${nextStatus}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status akun.');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Ringkasan Statistik
  const stats = React.useMemo(() => {
    const total = users.length;
    const superadminCount = users.filter((u) => u.role === 'SUPERADMIN' || Boolean(u.roles?.includes('SUPERADMIN'))).length;
    // Verifikator Ring: HANYA untuk Wiska (V3), Deni (V2), Mamat (V1) di Bagian Pencatat Meter
    const verifikatorCount = users.filter((u) =>
      u.role.startsWith('VERIFIKATOR_') || Boolean(u.roles?.some((r) => r.startsWith('VERIFIKATOR_')))
    ).length;
    // Manajemen & Pimpinan: Direksi, Senior Manager, Manager Bagian, Supervisor non-verifikator
    const manajemenCount = users.filter((u) =>
      ['DIREKSI', 'SENIOR_MANAGER', 'MANAGER', 'SUPERVISOR', 'EXECUTIVE'].includes(u.role) &&
      !u.role.startsWith('VERIFIKATOR_') &&
      !u.roles?.some((r) => r.startsWith('VERIFIKATOR_'))
    ).length;
    const billingCount = users.filter((u) =>
      ['STAFF_ADMIN_BILLING', 'STAFF'].includes(u.role) &&
      !u.roles?.some((r) => r.startsWith('VERIFIKATOR_'))
    ).length;
    const lapanganCount = users.filter((u) =>
      ['PENCATAT', 'PELAKSANA'].includes(u.role) &&
      !u.roles?.some((r) => r.startsWith('VERIFIKATOR_'))
    ).length;
    const userCount = users.filter((u) => u.role === 'USER').length;
    const aktifCount = users.filter((u) => u.status === 'AKTIF').length;

    return {
      total,
      superadminCount,
      verifikatorCount,
      manajemenCount,
      billingCount,
      lapanganCount,
      userCount,
      aktifCount,
      persenAktif: total > 0 ? Math.round((aktifCount / total) * 100) : 0,
    };
  }, [users]);

  // Tab definitions (Vercel DRD Style Navigation)
  const navTabs = React.useMemo(
    () => [
      { id: 'ALL' as FilterCategory, label: 'Semua Akun', count: stats.total },
      { id: 'VERIFIKATOR' as FilterCategory, label: 'Verifikator Ring', count: stats.verifikatorCount },
      { id: 'MANAJEMEN' as FilterCategory, label: 'Pimpinan & Manager', count: stats.manajemenCount },
      { id: 'OPERASIONAL' as FilterCategory, label: 'Staf Lapangan', count: stats.lapanganCount },
      { id: 'BILLING' as FilterCategory, label: 'Staf Administrasi', count: stats.billingCount },
      { id: 'SUPERADMIN' as FilterCategory, label: 'Super Admin', count: stats.superadminCount },
      { id: 'USER' as FilterCategory, label: 'Pelanggan Mandiri', count: stats.userCount },
    ],
    [stats]
  );

  // Filter Data
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      // 1. Text Search
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
        (u.unitKerja && u.unitKerja.toLowerCase().includes(q));

      // 2. Kategori Peran
      let matchCat = true;
      if (categoryFilter === 'SUPERADMIN') {
        matchCat = u.role === 'SUPERADMIN' || Boolean(u.roles?.includes('SUPERADMIN'));
      } else if (categoryFilter === 'VERIFIKATOR') {
        matchCat = u.role.startsWith('VERIFIKATOR_') || Boolean(u.roles?.some((r) => r.startsWith('VERIFIKATOR_')));
      } else if (categoryFilter === 'MANAJEMEN') {
        matchCat =
          ['DIREKSI', 'SENIOR_MANAGER', 'MANAGER', 'SUPERVISOR', 'EXECUTIVE'].includes(u.role) &&
          !u.role.startsWith('VERIFIKATOR_') &&
          !u.roles?.some((r) => r.startsWith('VERIFIKATOR_'));
      } else if (categoryFilter === 'BILLING') {
        matchCat =
          ['STAFF_ADMIN_BILLING', 'STAFF'].includes(u.role) &&
          !u.roles?.some((r) => r.startsWith('VERIFIKATOR_'));
      } else if (categoryFilter === 'OPERASIONAL') {
        matchCat =
          ['PENCATAT', 'PELAKSANA'].includes(u.role) &&
          !u.roles?.some((r) => r.startsWith('VERIFIKATOR_'));
      } else if (categoryFilter === 'USER') {
        matchCat = u.role === 'USER';
      }

      // 3. Filter Bagian
      let matchBagian = true;
      if (bagianFilter !== 'ALL') {
        matchBagian = u.bagian === bagianFilter;
      }

      // 4. Status
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = u.status === statusFilter;
      }

      return matchSearch && matchCat && matchBagian && matchStatus;
    });
  }, [users, search, categoryFilter, bagianFilter, statusFilter]);

  // Helper Initials Avatar
  const getInitials = (nama?: string | null, email?: string) => {
    if (nama && nama.trim()) {
      const parts = nama.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return nama.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Helper Badge Peran: Aksen dot, teks bersih, dan indikator Ring verifikator
  const renderRoleBadge = (userItem: UserManagementItem) => {
    const role = userItem.role;
    let dotColor = 'bg-muted-foreground/60';
    let label = role;

    switch (role) {
      case 'SUPERADMIN':
        dotColor = 'bg-foreground';
        label = 'SUPERADMIN';
        break;
      case 'DIREKSI':
      case 'EXECUTIVE':
        dotColor = 'bg-purple-500';
        label = 'DIREKSI';
        break;
      case 'SENIOR_MANAGER':
        dotColor = 'bg-rose-500';
        label = 'SENIOR MANAGER';
        break;
      case 'MANAGER':
        dotColor = 'bg-blue-600';
        label = 'MANAGER';
        break;
      case 'SUPERVISOR':
        dotColor = 'bg-sky-500';
        label = 'SUPERVISOR';
        break;
      case 'VERIFIKATOR_3':
        dotColor = 'bg-amber-500';
        label = 'RING 3 FINAL';
        break;
      case 'VERIFIKATOR_2':
        dotColor = 'bg-blue-500';
        label = 'RING 2 CABANG';
        break;
      case 'VERIFIKATOR_1':
        dotColor = 'bg-sky-500';
        label = 'RING 1 SUPERVISOR';
        break;
      case 'STAFF_ADMIN_BILLING':
        dotColor = 'bg-indigo-500';
        label = 'STAF BILLING';
        break;
      case 'STAFF':
        dotColor = 'bg-indigo-400';
        label = 'STAF ADMIN';
        break;
      case 'PENCATAT':
        dotColor = 'bg-emerald-500';
        label = 'PENCATAT METER';
        break;
      case 'PELAKSANA':
        dotColor = 'bg-teal-500';
        label = 'PELAKSANA';
        break;
      default:
        dotColor = 'bg-muted-foreground/40';
        label = role;
    }

    const hasV3 = userItem.roles?.includes('VERIFIKATOR_3');
    const hasV2 = userItem.roles?.includes('VERIFIKATOR_2');
    const hasV1 = userItem.roles?.includes('VERIFIKATOR_1');

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-2 text-[12px] font-mono text-foreground font-medium whitespace-nowrap">
          <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
          <span>{label}</span>
        </span>
        {hasV3 && role !== 'VERIFIKATOR_3' && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Ring 3
          </span>
        )}
        {hasV2 && role !== 'VERIFIKATOR_2' && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Ring 2
          </span>
        )}
        {hasV1 && role !== 'VERIFIKATOR_1' && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-500/10 text-sky-600 border border-sky-500/20">
            Ring 1
          </span>
        )}
      </div>
    );
  };

  return (
    <PageContainer className="space-y-6 pb-16">
      {/* 1. Header Toolbar & Vercel DRD-Style Navigation Tabs at the Border */}
      <div className="space-y-4">
        {/* Title & Authority Badge */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-heading-20 text-foreground tracking-tight">
              Manajemen Akun Pengguna & Hak Akses
            </h1>
            <p className="text-copy-13 text-muted-foreground max-w-3xl">
              Konfigurasi otorisasi akun pegawai, penetapan peran sistem, dan pemantauan status operasional petugas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-1">
            {/* Badge Otoritas Sesi - Clean & Minimalist */}
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono border shadow-2xs transition-colors',
                isAuthorized
                  ? 'border-border bg-card text-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  isAuthorized ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
                )}
              />
              <span>{isAuthorized ? 'Mode Otoritas Aktif' : 'Mode Pratinjau'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
              className="h-8 gap-1.5 font-mono text-label-12 border-border hover:bg-muted"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              Segarkan
            </Button>

            {isAuthorized && (
              <Button
                size="sm"
                onClick={() => {
                  generatePassword();
                  setOpenTambahUser(true);
                }}
                className="h-8 gap-1.5 font-mono text-label-12 bg-foreground text-background hover:bg-foreground/90 shadow-2xs"
              >
                <UserPlus className="size-3.5" />
                Tambah Pengguna
              </Button>
            )}
          </div>
        </div>

        {/* Vercel DRD Style Underline Nav Tabs sitting directly at the border line */}
        <div className="border-b border-border">
          <nav className="flex space-x-6 overflow-x-auto -mb-px" aria-label="Kategori Pengguna">
            {navTabs.map((tab) => {
              const isActive = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 border-b-2 py-2.5 px-0.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer -mb-px',
                    isActive
                      ? 'border-foreground text-foreground font-semibold'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'font-mono text-[11px] px-1.5 py-0.2 rounded-full border',
                      isActive
                        ? 'border-border bg-muted text-foreground'
                        : 'border-border/50 bg-muted/40 text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 2. Vercel Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Akun */}
        <Card className="p-4 border-border bg-card/60 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground font-medium">Total Akun</span>
            <Users className="size-4 text-muted-foreground/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-semibold text-foreground">
              {stats.total}
            </span>
            <span className="text-copy-12 text-muted-foreground">terdaftar</span>
          </div>
        </Card>

        {/* Verifikator Berjenjang */}
        <Card className="p-4 border-border bg-card/60 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground font-medium">Verifikator Ring</span>
            <ShieldCheck className="size-4 text-amber-500/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-semibold text-foreground">
              {stats.verifikatorCount}
            </span>
            <span className="text-copy-12 text-muted-foreground">Ring 1, 2, & 3</span>
          </div>
        </Card>

        {/* Pimpinan & Manager */}
        <Card className="p-4 border-border bg-card/60 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground font-medium">Pimpinan & Manager</span>
            <Users className="size-4 text-blue-500/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-semibold text-foreground">
              {stats.manajemenCount}
            </span>
            <span className="text-copy-12 text-muted-foreground">direksi & unit</span>
          </div>
        </Card>

        {/* Petugas Lapangan */}
        <Card className="p-4 border-border bg-card/60 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground font-medium">Petugas Lapangan</span>
            <Smartphone className="size-4 text-emerald-500/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-semibold text-foreground">
              {stats.lapanganCount}
            </span>
            <span className="text-copy-12 text-muted-foreground">cater & teknisi</span>
          </div>
        </Card>

        {/* Akun Aktif */}
        <Card className="p-4 border-border bg-card/60 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-label-12 text-muted-foreground font-medium">Status Operasional</span>
            <CheckCircle2 className="size-4 text-emerald-500/70" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-heading-24 font-mono font-semibold text-foreground">
              {stats.aktifCount}
            </span>
            <span className="text-copy-12 text-muted-foreground">
              aktif {stats.persenAktif}%
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Search Bar & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            size="sm"
            placeholder="Cari nama, email, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 bg-card border-border h-9 font-sans text-copy-13"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Bagian (Departemen Scope) */}
          <div className="flex items-center gap-1.5">
            <span className="text-label-12 text-muted-foreground font-mono">Bagian:</span>
            <Select
              value={bagianFilter}
              onValueChange={(val: any) => setBagianFilter(val)}
            >
              <SelectTrigger className="h-8 w-44 bg-card border-border font-sans text-copy-12">
                <SelectValue placeholder="Semua Bagian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Bagian</SelectItem>
                <SelectItem value="PENCATAT_METER">Pencatat Meter</SelectItem>
                <SelectItem value="LANGGANAN">Hubungan Langganan</SelectItem>
                <SelectItem value="DISTRIBUSI">Distribusi</SelectItem>
                <SelectItem value="RPM">RPM</SelectItem>
                <SelectItem value="PENAGIHAN">Penagihan</SelectItem>
                <SelectItem value="UMUM">Direksi & Umum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-label-12 text-muted-foreground font-mono">Status:</span>
            <div className="flex items-center rounded-md border border-border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 text-label-11 font-mono rounded transition-colors',
                  statusFilter === 'ALL'
                    ? 'bg-card text-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('AKTIF')}
                className={cn(
                  'px-2.5 py-1 text-label-11 font-mono rounded transition-colors',
                  statusFilter === 'AKTIF'
                    ? 'bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('NONAKTIF')}
                className={cn(
                  'px-2.5 py-1 text-label-11 font-mono rounded transition-colors',
                  statusFilter === 'NONAKTIF'
                    ? 'bg-card text-rose-600 dark:text-rose-400 font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Nonaktif
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Vercel Clean Table: Strictly Separated Dedicated Columns (NO Multi-line Stacking) */}
      {loading ? (
        <Card className="flex flex-col h-64 w-full items-center justify-center border-border bg-card gap-2">
          <Spinner className="size-5 text-foreground" />
          <span className="text-label-12 text-muted-foreground font-mono">
            Memuat direktori pengguna & hak akses...
          </span>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card/40 text-muted-foreground space-y-2">
          <Users className="size-8 mx-auto text-muted-foreground/50" />
          <p className="text-label-14 text-foreground font-medium">Tidak ada pengguna yang cocok</p>
          <p className="text-copy-13 text-muted-foreground max-w-sm mx-auto">
            Coba gunakan kata kunci pencarian lain atau ubah filter peranan dan status.
          </p>
          {(search || categoryFilter !== 'ALL' || bagianFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                setBagianFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="mt-2 font-mono text-label-12"
            >
              Reset Filter
            </Button>
          )}
        </Card>
      ) : (
        <Card className="border-border bg-card rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[230px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground pl-4">
                    Nama Pengguna
                  </TableHead>
                  <TableHead className="w-[230px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground">
                    Email Akun
                  </TableHead>
                  <TableHead className="w-[190px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground">
                    Peran RBAC
                  </TableHead>
                  <TableHead className="w-[190px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground">
                    Jabatan
                  </TableHead>
                  <TableHead className="w-[200px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground">
                    Bagian & Wilayah
                  </TableHead>
                  <TableHead className="w-[110px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="w-[70px] text-right text-label-11 uppercase font-mono tracking-wider text-muted-foreground pr-4">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userItem) => (
                  <TableRow
                    key={userItem.id}
                    className="border-b border-border/60 hover:bg-muted/20 transition-colors"
                  >
                    {/* 1. Nama Pengguna (Clean Single Line: Avatar + Nama Saja Tanpa NIP) */}
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full border border-border bg-muted/60 text-foreground flex items-center justify-center text-label-11 font-mono font-semibold shrink-0">
                          {getInitials(userItem.name, userItem.email)}
                        </div>
                        <span className="text-label-13 font-medium text-foreground truncate">
                          {userItem.name || 'User Pengguna'}
                        </span>
                      </div>
                    </TableCell>

                    {/* 2. Email Akun (Dedicated Separate Column) */}
                    <TableCell className="py-3 font-mono text-[12px] text-muted-foreground">
                      {userItem.email}
                    </TableCell>

                    {/* 3. Peran RBAC (Hanya Aksen Dot & Text) */}
                    <TableCell className="py-3">
                      {renderRoleBadge(userItem)}
                    </TableCell>

                    {/* 4. Jabatan (Dedicated Separate Column) */}
                    <TableCell className="py-3 text-label-13 text-foreground font-medium">
                      {userItem.jabatan || 'Staf Operasional'}
                    </TableCell>

                    {/* 5. Bagian & Wilayah Kerja */}
                    <TableCell className="py-3 text-copy-12 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground font-medium text-label-12">
                          {userItem.bagian ? userItem.bagian.replace(/_/g, ' ') : 'Umum'}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground truncate">
                          {userItem.wilayahKerja ? userItem.wilayahKerja.replace(/_/g, ' ') : userItem.unitKerja || 'Pelayanan Wilayah'}
                        </span>
                      </div>
                    </TableCell>

                    {/* 6. Status (Hanya Aksen Dot & Text) */}
                    <TableCell className="py-3 text-center">
                      <span className="inline-flex items-center gap-2 text-[12px] font-mono font-medium whitespace-nowrap">
                        <span
                          className={cn(
                            'size-1.5 rounded-full shrink-0',
                            userItem.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                          )}
                        />
                        <span className={userItem.status === 'AKTIF' ? 'text-foreground' : 'text-muted-foreground'}>
                          {userItem.status === 'AKTIF' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </span>
                    </TableCell>

                    {/* 7. Aksi (Cukup ... yang mewakili Ubah Peran & Status) */}
                    <TableCell className="py-3 text-right pr-4">
                      {isAuthorized ? (
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                title="Aksi Akun"
                              >
                                {togglingUserId === userItem.id ? (
                                  <Spinner className="size-3" />
                                ) : (
                                  <MoreHorizontal className="size-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 font-mono text-[12px]">
                              <DropdownMenuItem
                                onClick={() => bukaEditRole(userItem)}
                                className="cursor-pointer gap-2"
                              >
                                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                                <span>Ubah Peran</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                <Link href={`/master/otorisasi?userId=${userItem.id}&tab=kustom`}>
                                  <KeyRound className="size-3.5 text-muted-foreground" />
                                  <span>Kustom Hak Akses (Si A)</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleQuickToggleStatus(userItem)}
                                className="cursor-pointer gap-2"
                              >
                                {userItem.status === 'AKTIF' ? (
                                  <>
                                    <UserX className="size-3.5 text-rose-500" />
                                    <span>Nonaktifkan Akun</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="size-3.5 text-emerald-500" />
                                    <span>Aktifkan Akun</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-muted-foreground/40 pr-2">
                          -
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/10 text-label-12 text-muted-foreground">
            <span>
              Menampilkan {filteredUsers.length} dari {users.length} akun pengguna
            </span>
            <span className="font-mono text-label-11">
              Direktori Terhubung: PostgreSQL RBAC
            </span>
          </div>
        </Card>
      )}

      {/* 5. Vercel Style Modal Dialog: Ubah Hak Akses & Status */}
      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        {editUser && (
          <DialogContent className="max-w-xl p-0 overflow-hidden border-border bg-card">
            {/* Modal Header */}
            <div className="p-6 border-b border-border bg-muted/20">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-label-11 uppercase tracking-wider text-muted-foreground">
                    Modifikasi Otorisasi Akun
                  </span>
                </div>
                <DialogTitle className="text-heading-18 text-foreground tracking-tight">
                  Perbarui Peran Sistem & Status
                </DialogTitle>
                <DialogDescription className="text-copy-13 text-muted-foreground mt-1">
                  Pilih hak akses operasional dan tingkatan ring approval untuk pegawai ini.
                </DialogDescription>
              </DialogHeader>

              {/* User Identity Preview Card (Tanpa NIP agar Bersih) */}
              <div className="mt-4 p-3 rounded-lg border border-border bg-card flex items-center gap-3">
                <div className="size-10 rounded-full border border-border bg-muted text-foreground flex items-center justify-center text-label-13 font-mono font-semibold">
                  {getInitials(editUser.name, editUser.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-label-14 font-medium text-foreground truncate block">
                    {editUser.name || 'User Pengguna'}
                  </span>
                  <span className="text-copy-12 font-mono text-muted-foreground block truncate">
                    {editUser.email}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-label-11 font-mono text-muted-foreground block">
                    Peran Saat Ini:
                  </span>
                  <span className="text-label-12 font-mono font-medium text-foreground">
                    {editUser.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={simpanRole} className="p-6 space-y-5">
              {/* Role Selection List */}
              <div className="space-y-2">
                <label className="text-label-13 font-medium text-foreground block">
                  Pilih Tingkat Akses (Role RBAC):
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                  {ROLE_DEFINITIONS.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRole(r.id)}
                        className={cn(
                          'p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3',
                          isSelected
                            ? 'border-foreground bg-muted/30 shadow-2xs'
                            : 'border-border hover:border-muted-foreground/40 bg-card'
                        )}
                      >
                        <div className="mt-0.5">
                          <input
                            type="radio"
                            name="selectedRole"
                            checked={isSelected}
                            onChange={() => setSelectedRole(r.id)}
                            className="size-4 accent-foreground cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-label-13 font-semibold text-foreground">
                              {r.nama}
                            </span>
                            {r.ringLabel && (
                              <span className="font-mono text-label-11 text-muted-foreground">
                                • {r.ringLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-copy-12 text-muted-foreground mt-0.5 leading-relaxed">
                            {r.deskripsi}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-label-13 font-medium text-foreground block">
                    Status Akun Pengguna
                  </span>
                  <span className="text-copy-12 text-muted-foreground block">
                    {selectedStatus === 'AKTIF'
                      ? 'Akun aktif dan diizinkan mengakses modul operasional sesuai peran.'
                      : 'Akun dinonaktifkan sementara. Pengguna tidak dapat login ke sistem.'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-label-12 text-muted-foreground">
                    {selectedStatus === 'AKTIF' ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <Switch
                    checked={selectedStatus === 'AKTIF'}
                    onCheckedChange={(checked) =>
                      setSelectedStatus(checked ? 'AKTIF' : 'NONAKTIF')
                    }
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="pt-2 border-t border-border flex items-center justify-end gap-3 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditUser(null)}
                  disabled={saving}
                  className="font-mono text-label-12 border-border px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="font-mono text-label-12 bg-foreground text-background hover:bg-foreground/90 gap-1.5 px-4"
                >
                  {saving && <Spinner className="size-3.5" />}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* 6. Modal Dialog: Tambah Pengguna Baru (Wide & Full Shadcn UI) */}
      <Dialog open={openTambahUser} onOpenChange={setOpenTambahUser}>
        <DialogContent className="max-w-4xl sm:max-w-4xl lg:max-w-4xl p-0 overflow-hidden border-border bg-card shadow-xl">
          <div className="p-6 border-b border-border bg-muted/20">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconStack className="w-9 h-10 shrink-0">
                    <UserPlus className="size-4" />
                  </IconStack>
                  <div className="space-y-0.5">
                    <DialogTitle className="text-heading-18 text-foreground tracking-tight">
                      Tambah Akun Pegawai
                    </DialogTitle>
                    <DialogDescription className="text-copy-13 text-muted-foreground">
                      Registrasi akun pengguna, struktur penempatan departemen, dan tingkat hak akses.
                    </DialogDescription>
                  </div>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex font-mono text-[11px] px-2.5 py-1 border-border bg-card">
                  Unit Pelayanan Wilayah
                </Badge>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleTambahUserSubmit}>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KOLOM KIRI: Kredensial & Profil Akun */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    <h4 className="text-label-12 font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      1. Kredensial dan Profil Akun
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tambah-nama" className="text-label-12 font-medium text-foreground">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tambah-nama"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={formTambah.name}
                      onChange={(e) => setFormTambah((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-9 font-sans text-copy-13 bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tambah-email" className="text-label-12 font-medium text-foreground">
                      Email Kantor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tambah-email"
                      required
                      type="email"
                      placeholder="budi.santoso@pdam.co.id"
                      value={formTambah.email}
                      onChange={(e) => setFormTambah((prev) => ({ ...prev, email: e.target.value }))}
                      className="h-9 font-mono text-copy-13 bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tambah-nip" className="text-label-12 font-medium text-foreground">
                      NIP Pegawai
                    </Label>
                    <Input
                      id="tambah-nip"
                      placeholder="Contoh: 198503152010011002"
                      value={formTambah.nip}
                      onChange={(e) => setFormTambah((prev) => ({ ...prev, nip: e.target.value }))}
                      className="h-9 font-mono text-copy-13 bg-card border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tambah-password" className="text-label-12 font-medium text-foreground">
                        Password Sementara <span className="text-red-500">*</span>
                      </Label>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="text-label-11 font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Sparkles className="size-3 text-amber-500" />
                        Acak Sandi Kuat
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        id="tambah-password"
                        required
                        type="text"
                        value={formTambah.password}
                        onChange={(e) => setFormTambah((prev) => ({ ...prev, password: e.target.value }))}
                        className="h-9 font-mono text-copy-13 bg-card border-border pr-20"
                        placeholder="Minimal 8 karakter"
                      />
                      {formTambah.password && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(formTambah.password);
                            toast.success('Password sementara disalin ke clipboard.');
                          }}
                          className="absolute right-2 top-2 text-[11px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/40 cursor-pointer"
                        >
                          <Copy className="size-3" />
                          Salin
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Pengguna diwajibkan mengganti password pada saat login pertama kali.
                    </p>
                  </div>
                </div>

                {/* KOLOM KANAN: Struktur Organisasi & Peran Sistem */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/70 pb-2">
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <h4 className="text-label-12 font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      2. Struktur Organisasi dan Hak Akses
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-label-12 font-medium text-foreground">
                        Pelayanan Wilayah <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formTambah.wilayahKerja}
                        onValueChange={(w) => {
                          const lvlLabel = formTambah.level.replace(/_/g, ' ');
                          const bLabel = formTambah.bagian.replace(/_/g, ' ');
                          const wLabel = w.replace(/_/g, ' ');
                          setFormTambah((prev) => ({
                            ...prev,
                            wilayahKerja: w,
                            jabatanNama: `${lvlLabel} ${bLabel} ${wLabel}`,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full h-9 bg-card border-border font-sans text-copy-13">
                          <SelectValue placeholder="Pilih wilayah..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WILAYAH_1">Pelayanan Wilayah 1</SelectItem>
                          <SelectItem value="WILAYAH_2">Pelayanan Wilayah 2</SelectItem>
                          <SelectItem value="WILAYAH_3">Pelayanan Wilayah 3</SelectItem>
                          <SelectItem value="WILAYAH_4">Pelayanan Wilayah 4</SelectItem>
                          <SelectItem value="WILAYAH_5">Pelayanan Wilayah 5</SelectItem>
                          <SelectItem value="WILAYAH_6">Pelayanan Wilayah 6</SelectItem>
                          <SelectItem value="KANTOR_PUSAT">Kantor Pusat dan Direksi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-label-12 font-medium text-foreground">
                        Bagian Departemen <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formTambah.bagian}
                        onValueChange={(b) => {
                          const lvlLabel = formTambah.level.replace(/_/g, ' ');
                          const bLabel = b.replace(/_/g, ' ');
                          const wLabel = formTambah.wilayahKerja.replace(/_/g, ' ');
                          setFormTambah((prev) => ({
                            ...prev,
                            bagian: b,
                            jabatanNama: `${lvlLabel} ${bLabel} ${wLabel}`,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full h-9 bg-card border-border font-sans text-copy-13">
                          <SelectValue placeholder="Pilih bagian..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENCATAT_METER">Pencatat Meter</SelectItem>
                          <SelectItem value="LANGGANAN">Langganan</SelectItem>
                          <SelectItem value="PENAGIHAN">Penagihan</SelectItem>
                          <SelectItem value="RPM">RPM</SelectItem>
                          <SelectItem value="DISTRIBUSI">Distribusi Sub Zona</SelectItem>
                          <SelectItem value="UMUM">Umum dan IT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-label-12 font-medium text-foreground">
                        Tingkat Jabatan <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formTambah.level}
                        onValueChange={(lvl) => {
                          let suggestedRole = lvl;
                          if (lvl === 'STAFF_PENYELIA') suggestedRole = 'STAFF';
                          const lvlLabel = lvl.replace(/_/g, ' ');
                          const bLabel = formTambah.bagian.replace(/_/g, ' ');
                          const wLabel = formTambah.wilayahKerja.replace(/_/g, ' ');
                          setFormTambah((prev) => ({
                            ...prev,
                            level: lvl,
                            role: suggestedRole,
                            jabatanNama: `${lvlLabel} ${bLabel} ${wLabel}`,
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full h-9 bg-card border-border font-sans text-copy-13">
                          <SelectValue placeholder="Pilih jabatan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIREKSI">Direksi</SelectItem>
                          <SelectItem value="SENIOR_MANAGER">Senior Manager</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="STAFF_PENYELIA">Staf</SelectItem>
                          <SelectItem value="PELAKSANA">Pelaksana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-label-12 font-medium text-foreground">
                        Peran Utama Sistem <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formTambah.role}
                        onValueChange={(r) => setFormTambah((prev) => ({ ...prev, role: r }))}
                      >
                        <SelectTrigger className="w-full h-9 bg-card border-border font-sans text-copy-13">
                          <SelectValue placeholder="Pilih peran..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="SENIOR_MANAGER">Senior Manager</SelectItem>
                          <SelectItem value="STAFF">Staf</SelectItem>
                          <SelectItem value="PELAKSANA">Pelaksana</SelectItem>
                          <SelectItem value="DIREKSI">Direksi</SelectItem>
                          <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tambah-jabatan" className="text-label-12 font-medium text-foreground">
                      Nama Jabatan Resmi di Kantor
                    </Label>
                    <Input
                      id="tambah-jabatan"
                      value={formTambah.jabatanNama}
                      onChange={(e) => setFormTambah((prev) => ({ ...prev, jabatanNama: e.target.value }))}
                      className="h-9 font-sans text-copy-13 bg-card border-border"
                    />
                  </div>

                  {/* Card Info Proteksi Dapur */}
                  <div className="p-3 rounded-lg border border-border bg-muted/20 text-copy-12 text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-emerald-500" />
                      Proteksi Dapur Bagian dan Sinkronisasi Otomatis:
                    </p>
                    <p>
                      Pengguna secara otomatis hanya mengakses modul Bagian {formTambah.bagian.replace(/_/g, ' ')}. Untuk anggota Bagian Pencatat Meter dengan peran Pelaksana, integrasi rute buku catat meter mobile cater otomatis terhubung.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="p-4 sm:p-6 pt-3 border-t border-border bg-muted/10 flex items-center justify-end gap-3 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenTambahUser(false)}
                disabled={tambahLoading}
                className="font-mono text-label-12 border-border px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={tambahLoading}
                className="font-mono text-label-12 bg-foreground text-background hover:bg-foreground/90 gap-1.5 px-4"
              >
                {tambahLoading && <Spinner className="size-3.5" />}
                Buat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
