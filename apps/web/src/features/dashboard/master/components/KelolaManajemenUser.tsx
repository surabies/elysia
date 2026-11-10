'use client';

import * as React from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
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
import { cn } from '@/lib/utils';
import type { UserManagementItem } from '@/server/services/master/master-extended.service';

export interface KelolaManajemenUserProps {
  userRole?: string;
  userRoles?: string[];
}

interface RoleDefinition {
  id: string;
  nama: string;
  kategori: 'SUPERADMIN' | 'VERIFIKATOR' | 'BILLING' | 'OPERASIONAL' | 'USER';
  ringLabel?: string;
  deskripsi: string;
  ringLevel?: number;
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'SUPERADMIN',
    nama: 'Super Administrator',
    kategori: 'SUPERADMIN',
    ringLabel: 'System Root',
    deskripsi: 'Akses tanpa batas, audit trail, kelola master data, & konfigurasi RBAC',
  },
  {
    id: 'EXECUTIVE',
    nama: 'Direksi (Executive)',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Executive Override',
    ringLevel: 4,
    deskripsi: 'Executive dashboard, analitik pendapatan, & hak override verifikasi Ring 3',
  },
  {
    id: 'VERIFIKATOR_3',
    nama: 'Senior Manager / Head of Billing',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Ring 3 Final',
    ringLevel: 3,
    deskripsi: 'Pengesahan final pelepasan data pembacaan meter sebelum masuk ke DRD billing',
  },
  {
    id: 'VERIFIKATOR_2',
    nama: 'Manager Cabang / Area',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Ring 2 Approval',
    ringLevel: 2,
    deskripsi: 'Validasi deviasi pemakaian & approval anomali pelanggan tingkat cabang',
  },
  {
    id: 'VERIFIKATOR_1',
    nama: 'Supervisor Cater',
    kategori: 'VERIFIKATOR',
    ringLabel: 'Ring 1 Screening',
    ringLevel: 1,
    deskripsi: 'Penyaringan awal bukti foto meter, koreksi rute jalan, & instruksi cek ulang',
  },
  {
    id: 'STAFF_ADMIN_BILLING',
    nama: 'Staff Administrasi Billing',
    kategori: 'BILLING',
    ringLabel: 'Operasional Billing',
    deskripsi: 'Koreksi stand pasca-verifikasi, input manual ADD, closing periode, & DRD',
  },
  {
    id: 'PENCATAT',
    nama: 'Petugas Pembaca Meter (Cater)',
    kategori: 'OPERASIONAL',
    ringLabel: 'Lapangan Mobile',
    deskripsi: 'Pelaksana pembacaan meter mandiri/keliling dengan aplikasi mobile Android',
  },
  {
    id: 'PELAKSANA',
    nama: 'Pelaksana Operasional Non-Cater',
    kategori: 'OPERASIONAL',
    ringLabel: 'Teknis Lapangan',
    deskripsi: 'Staf teknis lapangan untuk survei fisik meter, ganti meter, & tiket gangguan',
  },
  {
    id: 'USER',
    nama: 'Warga / Pelanggan Mandiri',
    kategori: 'USER',
    ringLabel: 'Publik Warga',
    deskripsi: 'Pelanggan mandiri untuk pelaporan angka meter bulanan & pengaduan air',
  },
];

type FilterCategory = 'ALL' | 'SUPERADMIN' | 'VERIFIKATOR' | 'BILLING' | 'OPERASIONAL' | 'USER';
type StatusFilter = 'ALL' | 'AKTIF' | 'NONAKTIF';

export function KelolaManajemenUser({
  userRole = 'USER',
  userRoles = [],
}: KelolaManajemenUserProps) {
  const [users, setUsers] = React.useState<UserManagementItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<FilterCategory>('ALL');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');

  // Modal State
  const [editUser, setEditUser] = React.useState<UserManagementItem | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('USER');
  const [selectedStatus, setSelectedStatus] = React.useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [saving, setSaving] = React.useState(false);
  const [togglingUserId, setTogglingUserId] = React.useState<string | null>(null);

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
      const res = await fetch('/api/master/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      } else {
        toast.error('Gagal mengambil daftar pengguna.');
      }
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
      const res = await fetch(`/api/master/users/${encodeURIComponent(editUser.id)}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          status: selectedStatus,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Peran ${editUser.name || editUser.email} berhasil diperbarui menjadi ${selectedRole}.`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editUser.id
              ? { ...u, role: selectedRole, status: selectedStatus }
              : u
          )
        );
        setEditUser(null);
      } else {
        toast.error(json.error || 'Gagal menyimpan pembaruan peran.');
      }
    } catch (err: any) {
      console.error('Error updating role:', err);
      toast.error('Terjadi kesalahan koneksi saat menyimpan perubahan.');
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
      const res = await fetch(`/api/master/users/${encodeURIComponent(userItem.id)}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userItem.role,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Status akun ${userItem.name || userItem.email} diubah menjadi ${nextStatus}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userItem.id ? { ...u, status: nextStatus } : u))
        );
      } else {
        toast.error(json.error || 'Gagal mengubah status akun.');
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setTogglingUserId(null);
    }
  };

  // Ringkasan Statistik
  const stats = React.useMemo(() => {
    const total = users.length;
    const superadminCount = users.filter((u) => u.role === 'SUPERADMIN' || u.roles?.includes('SUPERADMIN')).length;
    const verifikatorCount = users.filter((u) =>
      ['EXECUTIVE', 'VERIFIKATOR_3', 'VERIFIKATOR_2', 'VERIFIKATOR_1'].includes(u.role)
    ).length;
    const billingCount = users.filter((u) => u.role === 'STAFF_ADMIN_BILLING').length;
    const lapanganCount = users.filter((u) => ['PENCATAT', 'PELAKSANA'].includes(u.role)).length;
    const userCount = users.filter((u) => u.role === 'USER').length;
    const aktifCount = users.filter((u) => u.status === 'AKTIF').length;

    return {
      total,
      superadminCount,
      verifikatorCount,
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
      { id: 'SUPERADMIN' as FilterCategory, label: 'Superadmin', count: stats.superadminCount },
      { id: 'VERIFIKATOR' as FilterCategory, label: 'Verifikator (Ring 1-3)', count: stats.verifikatorCount },
      { id: 'BILLING' as FilterCategory, label: 'Staff Billing', count: stats.billingCount },
      { id: 'OPERASIONAL' as FilterCategory, label: 'Petugas Lapangan', count: stats.lapanganCount },
      { id: 'USER' as FilterCategory, label: 'Warga / Pelanggan', count: stats.userCount },
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
        matchCat = ['EXECUTIVE', 'VERIFIKATOR_3', 'VERIFIKATOR_2', 'VERIFIKATOR_1'].includes(u.role);
      } else if (categoryFilter === 'BILLING') {
        matchCat = u.role === 'STAFF_ADMIN_BILLING';
      } else if (categoryFilter === 'OPERASIONAL') {
        matchCat = ['PENCATAT', 'PELAKSANA'].includes(u.role);
      } else if (categoryFilter === 'USER') {
        matchCat = u.role === 'USER';
      }

      // 3. Status
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = u.status === statusFilter;
      }

      return matchSearch && matchCat && matchStatus;
    });
  }, [users, search, categoryFilter, statusFilter]);

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

  // Helper Badge Peran: Hanya aksen dot dan teks bersih (Tanpa box / pill)
  const renderRoleBadge = (role: string) => {
    let dotColor = 'bg-muted-foreground/60';
    let label = role;

    switch (role) {
      case 'SUPERADMIN':
        dotColor = 'bg-foreground';
        label = 'SUPERADMIN';
        break;
      case 'EXECUTIVE':
        dotColor = 'bg-purple-500';
        label = 'EXECUTIVE';
        break;
      case 'VERIFIKATOR_3':
        dotColor = 'bg-amber-500';
        label = 'RING 3 (FINAL)';
        break;
      case 'VERIFIKATOR_2':
        dotColor = 'bg-blue-500';
        label = 'RING 2 (CABANG)';
        break;
      case 'VERIFIKATOR_1':
        dotColor = 'bg-sky-500';
        label = 'RING 1 (SUPERVISOR)';
        break;
      case 'STAFF_ADMIN_BILLING':
        dotColor = 'bg-indigo-500';
        label = 'STAFF BILLING';
        break;
      case 'PENCATAT':
        dotColor = 'bg-emerald-500';
        label = 'PENCATAT LAPANGAN';
        break;
      case 'PELAKSANA':
        dotColor = 'bg-zinc-400';
        label = 'PELAKSANA TEKNIS';
        break;
      default:
        dotColor = 'bg-muted-foreground/40';
        label = role;
    }

    return (
      <span className="inline-flex items-center gap-2 text-[12px] font-mono text-foreground font-medium whitespace-nowrap">
        <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
        <span>{label}</span>
      </span>
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
              Konfigurasi otorisasi akun pegawai, penetapan peran sistem (RBAC 3-Tier Ring Approval), dan pemantauan status operasional petugas.
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
              <span>{isAuthorized ? 'Mode Otoritas Aktif' : 'Mode Pratinjau (Hanya Baca)'}</span>
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
            <span className="text-copy-12 text-muted-foreground">pembaca meter</span>
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
              aktif ({stats.persenAktif}%)
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

        <div className="flex items-center gap-2">
          <span className="text-label-12 text-muted-foreground font-mono">Status Akun:</span>
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
          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
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
                    Unit Kerja
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
                      {renderRoleBadge(userItem.role)}
                    </TableCell>

                    {/* 4. Jabatan (Dedicated Separate Column) */}
                    <TableCell className="py-3 text-label-13 text-foreground font-medium">
                      {userItem.jabatan || 'Staf Operasional'}
                    </TableCell>

                    {/* 5. Unit Kerja (Dedicated Separate Column) */}
                    <TableCell className="py-3 text-copy-12 text-muted-foreground">
                      {userItem.unitKerja || 'Divisi Hubungan Langganan'}
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
                            <DropdownMenuContent align="end" className="w-48 font-mono text-[12px]">
                              <DropdownMenuItem
                                onClick={() => bukaEditRole(userItem)}
                                className="cursor-pointer gap-2"
                              >
                                <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                                <span>Ubah Peran</span>
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
              <DialogFooter className="pt-2 border-t border-border gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditUser(null)}
                  disabled={saving}
                  className="font-mono text-label-12 border-border"
                >
                  Batalkan
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="font-mono text-label-12 bg-foreground text-background hover:bg-foreground/90 gap-1.5"
                >
                  {saving && <Spinner className="size-3.5" />}
                  Simpan Perubahan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </PageContainer>
  );
}
