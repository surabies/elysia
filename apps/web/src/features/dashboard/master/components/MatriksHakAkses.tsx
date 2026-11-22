'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Shield,
  RefreshCw,
  Search,
  CheckCircle2,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Save,
  AlertCircle,
  HelpCircle,
  X,
  UserCheck,
  Users,
  User,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { MatriksHakAksesItem } from '@/server/services/master/master-extended.service';
import type { UserEffectivePermission } from '@cater/types';

export interface MatriksHakAksesProps {
  userRole?: string;
  userRoles?: string[];
}

type MainTabMode = 'ROLE_MATRIX' | 'USER_OVERRIDE';
type KategoriFilter = 'SEMUA' | 'VERIFIKASI' | 'OPERASIONAL' | 'BILLING' | 'MASTER';

interface RoleCol {
  key: keyof Pick<
    MatriksHakAksesItem,
    | 'superadmin'
    | 'direksi'
    | 'seniorManager'
    | 'manager'
    | 'supervisor'
    | 'staff'
    | 'pelaksana'
  >;
  label: string;
}

const ROLES_COLUMNS: RoleCol[] = [
  { key: 'superadmin', label: 'SUPERADMIN' },
  { key: 'direksi', label: 'DIREKSI' },
  { key: 'seniorManager', label: 'SR. MANAGER' },
  { key: 'manager', label: 'MANAGER' },
  { key: 'supervisor', label: 'SUPERVISOR' },
  { key: 'staff', label: 'STAFF' },
  { key: 'pelaksana', label: 'PELAKSANA' },
];

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  jabatan: string | null;
  unitKerja: string | null;
  nip?: string | null;
  status: 'AKTIF' | 'NONAKTIF';
}

export function MatriksHakAkses({
  userRole = 'USER',
  userRoles = [],
}: MatriksHakAksesProps) {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const initialTab = searchParams.get('tab');

  const [activeTabMode, setActiveTabMode] = React.useState<MainTabMode>(
    initialTab === 'kustom' || initialUserId ? 'USER_OVERRIDE' : 'ROLE_MATRIX'
  );

  // --- STATE TAB 1: MATRIKS JABATAN (ROLE MATRIX) ---
  const [matrix, setMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [originalMatrix, setOriginalMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedKategori, setSelectedKategori] = React.useState<KategoriFilter>('SEMUA');

  // --- STATE TAB 2: KUSTOMISASI PENGGUNA (USER OVERRIDE) ---
  const [userList, setUserList] = React.useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string>(initialUserId || '');
  const [userSearchQuery, setUserSearchQuery] = React.useState('');
  const [userPerms, setUserPerms] = React.useState<UserEffectivePermission[]>([]);
  const [originalUserPerms, setOriginalUserPerms] = React.useState<UserEffectivePermission[]>([]);
  const [loadingUserPerms, setLoadingUserPerms] = React.useState(false);
  const [savingUserPerms, setSavingUserPerms] = React.useState(false);

  // Menilai apakah user memiliki wewenang untuk mengedit matriks izin (Superadmin, Executive, Verifikator 3, Direksi, Senior Manager)
  const bisaEdit = React.useMemo(() => {
    const authorized = [
      'SUPERADMIN',
      'SUPER_ADMIN',
      'EXECUTIVE',
      'DIREKSI',
      'SENIOR_MANAGER',
      'VERIFIKATOR_3',
    ];
    return authorized.includes(userRole) || userRoles.some((r) => authorized.includes(r));
  }, [userRole, userRoles]);

  // Load Matriks Otorisasi dari API
  const fetchMatrix = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/otorisasi');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMatrix(json.data);
        setOriginalMatrix(JSON.parse(JSON.stringify(json.data)));
      } else {
        toast.error('Gagal memuat matriks otorisasi.');
      }
    } catch (err: any) {
      console.error('Failed to load matrix:', err);
      toast.error('Koneksi server gagal saat mengambil data matriks.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load Daftar Users untuk Tab Kustomisasi Pengguna
  const fetchUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/master/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserList(json.data);
        if (!selectedUserId && json.data.length > 0 && !initialUserId) {
          setSelectedUserId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedUserId, initialUserId]);

  // Load Hak Akses Efektif Pengguna Terpilih
  const fetchUserPermissions = React.useCallback(async (targetUserId: string) => {
    if (!targetUserId) return;
    setLoadingUserPerms(true);
    try {
      const res = await fetch(`/api/master/users/${targetUserId}/hak-akses`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserPerms(json.data);
        setOriginalUserPerms(JSON.parse(JSON.stringify(json.data)));
      } else {
        toast.error('Gagal mengambil izin pengguna.');
      }
    } catch (err) {
      console.error('Failed to load user permissions:', err);
      toast.error('Gagal memuat hak akses pengguna.');
    } finally {
      setLoadingUserPerms(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  React.useEffect(() => {
    if (activeTabMode === 'USER_OVERRIDE') {
      fetchUsers();
    }
  }, [activeTabMode, fetchUsers]);

  React.useEffect(() => {
    if (selectedUserId && activeTabMode === 'USER_OVERRIDE') {
      fetchUserPermissions(selectedUserId);
    }
  }, [selectedUserId, activeTabMode, fetchUserPermissions]);

  // Deteksi Perubahan Data Matriks Jabatan
  const hasChanges = React.useMemo(() => {
    if (originalMatrix.length === 0 || matrix.length === 0) return false;
    return JSON.stringify(matrix) !== JSON.stringify(originalMatrix);
  }, [matrix, originalMatrix]);

  const changedItems = React.useMemo(() => {
    const list: MatriksHakAksesItem[] = [];
    const origMap = new Map(originalMatrix.map((item) => [item.modulKey, item]));
    for (const cur of matrix) {
      const orig = origMap.get(cur.modulKey);
      if (orig && JSON.stringify(cur) !== JSON.stringify(orig)) {
        list.push(cur);
      }
    }
    return list;
  }, [matrix, originalMatrix]);

  // Deteksi Perubahan Data Kustomisasi Pengguna
  const hasUserPermChanges = React.useMemo(() => {
    if (originalUserPerms.length === 0 || userPerms.length === 0) return false;
    return JSON.stringify(userPerms) !== JSON.stringify(originalUserPerms);
  }, [userPerms, originalUserPerms]);

  // Handler Toggle Izin Role Jabatan
  const togglePermission = (
    modulKey: string,
    roleKey: keyof Pick<
      MatriksHakAksesItem,
      | 'superadmin'
      | 'direksi'
      | 'seniorManager'
      | 'manager'
      | 'supervisor'
      | 'staff'
      | 'pelaksana'
    >
  ) => {
    if (!bisaEdit) {
      toast.error('Akses Dibatasi: Hanya Superadmin atau pimpinan yang dapat memodifikasi matriks hak akses.');
      return;
    }

    setMatrix((prev) =>
      prev.map((item) => {
        if (item.modulKey !== modulKey) return item;
        const nextVal = !item[roleKey];
        const updated: MatriksHakAksesItem = {
          ...item,
          [roleKey]: nextVal,
        };
        // Sinkronisasi kolom legacy
        if (roleKey === 'direksi') updated.executive = nextVal;
        if (roleKey === 'seniorManager') updated.verifikator3 = nextVal;
        if (roleKey === 'manager') updated.verifikator2 = nextVal;
        if (roleKey === 'supervisor') updated.verifikator1 = nextVal;
        if (roleKey === 'staff') updated.staffBilling = nextVal;
        return updated;
      })
    );
  };

  // Batalkan Perubahan Matriks Role
  const discardChanges = () => {
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    toast.info('Perubahan matriks dibatalkan.');
  };

  // Simpan Perubahan Matriks Role ke Database
  const saveChanges = async () => {
    if (!bisaEdit) {
      toast.error('Anda tidak memiliki wewenang untuk menyimpan perubahan otorisasi.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/master/otorisasi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: changedItems }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Matriks hak akses 6 tingkatan jabatan berhasil diperbarui!');
        setOriginalMatrix(JSON.parse(JSON.stringify(matrix)));
      } else {
        toast.error(json.error ?? 'Gagal menyimpan perubahan matriks.');
      }
    } catch (err: any) {
      console.error('Error saving matrix:', err);
      toast.error('Terjadi kesalahan saat menyimpan ke database.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Override Hak Akses Pengguna Tertentu
  const toggleUserPermission = (modulKey: string) => {
    if (!bisaEdit) {
      toast.error('Akses Dibatasi: Hanya Superadmin atau pimpinan yang dapat memodifikasi hak akses pengguna.');
      return;
    }

    setUserPerms((prev) =>
      prev.map((item) => {
        if (item.modulKey !== modulKey) return item;
        const nextEffective = !item.effectiveGranted;
        return {
          ...item,
          isOverridden: true,
          effectiveGranted: nextEffective,
          overrideCatatan: 'Kustom khusus oleh Admin',
        };
      })
    );
  };

  // Kembalikan Izin Modul Pengguna ke Default Jabatan
  const resetSingleUserPermission = (modulKey: string) => {
    if (!bisaEdit) return;
    setUserPerms((prev) =>
      prev.map((item) => {
        if (item.modulKey !== modulKey) return item;
        return {
          ...item,
          isOverridden: false,
          effectiveGranted: item.roleDefault,
          overrideCatatan: null,
        };
      })
    );
    toast.info(`Modul ${modulKey} dikembalikan ke aturan bawaan jabatannya.`);
  };

  // Simpan Kustomisasi Pengguna (User Overrides)
  const saveUserPermissions = async () => {
    if (!selectedUserId || !bisaEdit) return;

    setSavingUserPerms(true);
    try {
      // Kumpulkan seluruh item yang statusnya isOverridden
      const overridesToSave = userPerms
        .filter((p) => p.isOverridden)
        .map((p) => ({
          modulKey: p.modulKey,
          granted: p.effectiveGranted,
          catatan: p.overrideCatatan || 'Kustom khusus pengguna',
        }));

      const res = await fetch(`/api/master/users/${selectedUserId}/hak-akses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: overridesToSave }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Hak akses kustom pengguna berhasil disimpan secara persisten!');
        setOriginalUserPerms(JSON.parse(JSON.stringify(userPerms)));
      } else {
        toast.error(json.error ?? 'Gagal menyimpan hak akses pengguna.');
      }
    } catch (err: any) {
      console.error('Error saving user permissions:', err);
      toast.error('Terjadi kesalahan saat menyimpan hak akses pengguna.');
    } finally {
      setSavingUserPerms(false);
    }
  };

  // Filter modul
  const filteredMatrix = React.useMemo(() => {
    return matrix.filter((item) => {
      const matchesKategori =
        selectedKategori === 'SEMUA' || item.kategori === selectedKategori;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.modulNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesKategori && matchesSearch;
    });
  }, [matrix, selectedKategori, searchQuery]);

  // Filter izin kustom pengguna
  const filteredUserPerms = React.useMemo(() => {
    return userPerms.filter((item) => {
      const matchesSearch =
        userSearchQuery.trim() === '' ||
        item.modulNama.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(userSearchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [userPerms, userSearchQuery]);

  const selectedUserObj = React.useMemo(() => {
    return userList.find((u) => u.id === selectedUserId);
  }, [userList, selectedUserId]);

  const countPerKategori = React.useMemo(() => {
    const counts = {
      SEMUA: matrix.length,
      VERIFIKASI: 0,
      OPERASIONAL: 0,
      BILLING: 0,
      MASTER: 0,
    };
    for (const item of matrix) {
      if (item.kategori in counts) {
        counts[item.kategori as keyof typeof counts]++;
      }
    }
    return counts;
  }, [matrix]);

  const navTabs = React.useMemo(
    () => [
      { id: 'SEMUA' as KategoriFilter, label: 'Semua Modul', count: countPerKategori.SEMUA },
      { id: 'VERIFIKASI' as KategoriFilter, label: 'Verifikasi & Approval', count: countPerKategori.VERIFIKASI },
      { id: 'OPERASIONAL' as KategoriFilter, label: 'Operasional Lapangan & Pengaduan', count: countPerKategori.OPERASIONAL },
      { id: 'BILLING' as KategoriFilter, label: 'Billing & DRD', count: countPerKategori.BILLING },
      { id: 'MASTER' as KategoriFilter, label: 'Master Konfigurasi', count: countPerKategori.MASTER },
    ],
    [countPerKategori]
  );

  const renderCategoryBadge = (kategori: string) => {
    let dotColor = 'bg-foreground/50';
    if (kategori === 'VERIFIKASI') dotColor = 'bg-amber-500';
    else if (kategori === 'BILLING') dotColor = 'bg-blue-500';
    else if (kategori === 'MASTER') dotColor = 'bg-purple-500';
    else if (kategori === 'OPERASIONAL') dotColor = 'bg-emerald-500';

    return (
      <span className="inline-flex items-center gap-2 text-[12px] font-mono text-foreground font-medium whitespace-nowrap">
        <span className={cn('size-1.5 rounded-full shrink-0', dotColor)} />
        <span>{kategori}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full pb-28">
      {/* 1. Header Bar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-heading-20 text-foreground tracking-tight">
                Hak Akses Dinamis (RBAC & Izin Kustom)
              </h1>
              <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-border">
                6 Tingkatan Akun
              </Badge>
            </div>
            <p className="text-copy-13 text-muted-foreground max-w-3xl">
              Atur hak akses operasional untuk 6 tingkatan jabatan resmi (Direksi, Senior Manager, Manager, Supervisor, Staff, Pelaksana) serta kustomisasi wewenang khusus perorangan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-1">
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-mono border shadow-2xs transition-colors',
                bisaEdit
                  ? 'border-border bg-card text-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  bisaEdit ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
                )}
              />
              <span>{bisaEdit ? 'Mode Edit Aktif' : 'Mode Pratinjau (Hanya Baca)'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchMatrix();
                if (selectedUserId) fetchUserPermissions(selectedUserId);
              }}
              disabled={loading || loadingUserPerms}
              className="h-8 gap-1.5 font-mono text-label-12 border-border hover:bg-muted"
            >
              <RefreshCw className={cn('size-3.5', (loading || loadingUserPerms) && 'animate-spin')} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* PRIMARY VIEW MODE SWITCHER */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveTabMode('ROLE_MATRIX')}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer',
              activeTabMode === 'ROLE_MATRIX'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <ShieldCheck className="size-3.5" />
            <span>Matriks Jabatan (6 Level)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabMode('USER_OVERRIDE')}
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer',
              activeTabMode === 'USER_OVERRIDE'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Kustom Hak Akses Perorangan (Si A)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: MATRIKS HAK AKSES JABATAN (ROLE MATRIX 6 TINGKATAN)               */}
      {/* ========================================================================= */}
      {activeTabMode === 'ROLE_MATRIX' && (
        <div className="space-y-6">
          {/* Sub Navigation Kategori */}
          <div className="border-b border-border">
            <nav className="flex space-x-6 overflow-x-auto -mb-px" aria-label="Kategori Modul">
              {navTabs.map((tab) => {
                const isActive = selectedKategori === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedKategori(tab.id)}
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

          {/* SOP Pipeline Card: 6 Tingkatan Jabatan */}
          <Card className="rounded-lg border border-border bg-card/60 p-4 shadow-2xs">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-muted-foreground" />
                  <h3 className="text-label-12 font-mono uppercase tracking-wider text-foreground font-medium">
                    Hirarki Jabatan & Tanggung Jawab Operasional
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Prinsip Least Privilege & Separation of Duty
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Tingkat 1</span>
                  <p className="text-label-12 font-semibold text-foreground">Direksi</p>
                  <p className="text-[11px] text-muted-foreground">Analitik global & eksekutif override</p>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Tingkat 2</span>
                  <p className="text-label-12 font-semibold text-foreground">Senior Manager</p>
                  <p className="text-[11px] text-muted-foreground">Pengesahan final & rilis DRD billing</p>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Tingkat 3</span>
                  <p className="text-label-12 font-semibold text-foreground">Manager</p>
                  <p className="text-[11px] text-muted-foreground">Approval anomali tingkat cabang</p>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Tingkat 4</span>
                  <p className="text-label-12 font-semibold text-foreground">Supervisor</p>
                  <p className="text-[11px] text-muted-foreground">Screening awal & penugasan teknis</p>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Tingkat 5</span>
                  <p className="text-label-12 font-semibold text-foreground">Staff</p>
                  <p className="text-[11px] text-muted-foreground">Koreksi data, closing, & admin rute</p>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-2.5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Tingkat 6</span>
                  <p className="text-label-12 font-semibold text-foreground">Pelaksana</p>
                  <p className="text-[11px] text-muted-foreground">Pencatatan lapangan & survei fisik</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari modul atau cakupan izin..."
                className="pl-9 pr-8 bg-card border-border h-9 font-sans text-copy-13"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="text-label-12 font-mono text-muted-foreground">
              Menampilkan <span className="text-foreground font-semibold">{filteredMatrix.length}</span> dari {matrix.length} modul
            </div>
          </div>

          {/* Tabel Matriks */}
          <Card className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                <Spinner className="size-5 text-foreground" />
                <span className="text-label-12 font-mono">Memuat konfigurasi hak akses RBAC...</span>
              </div>
            ) : filteredMatrix.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <AlertCircle className="size-6 text-muted-foreground/60" />
                <p className="text-label-13 font-medium text-foreground">Tidak ada modul yang sesuai.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[200px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3 pl-4">
                        Modul Sistem
                      </TableHead>
                      <TableHead className="w-[120px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                        Kategori
                      </TableHead>
                      <TableHead className="min-w-[200px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                        Fungsi Otorisasi
                      </TableHead>
                      {ROLES_COLUMNS.map((role) => (
                        <TableHead
                          key={role.key}
                          className="text-center px-3 min-w-[85px] py-3 text-label-11 font-mono uppercase tracking-wider text-muted-foreground font-semibold"
                        >
                          {role.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatrix.map((item) => (
                      <TableRow
                        key={item.modulKey}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="py-3 pl-4 text-label-13 font-medium text-foreground whitespace-nowrap">
                          {item.modulNama}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          {renderCategoryBadge(item.kategori)}
                        </TableCell>
                        <TableCell className="py-3 text-copy-12 text-muted-foreground whitespace-nowrap">
                          {item.deskripsi}
                        </TableCell>
                        {ROLES_COLUMNS.map((role) => {
                          const isAllowed = Boolean(item[role.key]);
                          return (
                            <TableCell key={role.key} className="text-center align-middle px-3 py-3">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={isAllowed}
                                  onCheckedChange={() => togglePermission(item.modulKey, role.key)}
                                  disabled={!bisaEdit || saving}
                                  size="sm"
                                  aria-label={`Izin ${role.label} untuk modul ${item.modulNama}`}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: KUSTOMISASI HAK AKSES PERORANGAN (SI A)                           */}
      {/* ========================================================================= */}
      {activeTabMode === 'USER_OVERRIDE' && (
        <div className="space-y-6">
          {/* User Selector Card */}
          <Card className="rounded-lg border border-border bg-card p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-emerald-500" />
                  <h3 className="text-label-14 font-semibold text-foreground">
                    Pilih Pengguna yang Ingin Diberikan Izin Kustom (Si A)
                  </h3>
                </div>
                <p className="text-copy-12 text-muted-foreground">
                  Izin kustom ini menimpa wewenang default jabatannya. Si A bisa diberikan wewenang tambahan atau dicabut izin tertentu.
                </p>
              </div>

              {/* Selector User */}
              <div className="flex items-center gap-2 min-w-[280px]">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 py-1 font-mono text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="" disabled>Pilih Akun Pengguna...</option>
                  {userList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role}) {u.jabatan ? `· ${u.jabatan}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profile Summary Badge Bar */}
            {selectedUserObj && (
              <div className="flex flex-wrap items-center gap-4 rounded-md border border-border/70 bg-muted/20 p-3 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground">Nama:</span>{' '}
                  <span className="font-semibold text-foreground">{selectedUserObj.name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="text-foreground">{selectedUserObj.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Peran Dasar:</span>{' '}
                  <Badge variant="outline" className="border-border font-mono text-[10px] ml-1">
                    {selectedUserObj.role}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Jabatan:</span>{' '}
                  <span className="text-foreground">{selectedUserObj.jabatan || 'Staf Operasional'}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Search bar modul user */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Cari izin modul untuk pengguna ini..."
                className="pl-9 pr-8 bg-card border-border h-9 font-sans text-copy-13"
              />
              {userSearchQuery && (
                <button
                  type="button"
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="text-label-12 font-mono text-muted-foreground">
              Total {filteredUserPerms.length} izin modul
            </div>
          </div>

          {/* User Permissions Table */}
          <Card className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
            {loadingUserPerms ? (
              <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
                <Spinner className="size-5 text-foreground" />
                <span className="text-label-12 font-mono">Memuat hak akses pengguna...</span>
              </div>
            ) : filteredUserPerms.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <AlertCircle className="size-6 text-muted-foreground/60" />
                <p className="text-label-13 font-medium text-foreground">Pilih pengguna terlebih dahulu.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[220px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3 pl-4">
                        Modul Sistem
                      </TableHead>
                      <TableHead className="w-[120px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                        Kategori
                      </TableHead>
                      <TableHead className="min-w-[200px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                        Fungsi Otorisasi
                      </TableHead>
                      <TableHead className="w-[140px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                        Bawaan Jabatan
                      </TableHead>
                      <TableHead className="w-[160px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                        Wewenang Kustom (Si A)
                      </TableHead>
                      <TableHead className="w-[130px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3 pr-4">
                        Status Efektif
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUserPerms.map((item) => (
                      <TableRow
                        key={item.modulKey}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="py-3 pl-4 text-label-13 font-medium text-foreground whitespace-nowrap">
                          {item.modulNama}
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          {renderCategoryBadge(item.kategori)}
                        </TableCell>
                        <TableCell className="py-3 text-copy-12 text-muted-foreground whitespace-nowrap">
                          {item.deskripsi}
                        </TableCell>
                        <TableCell className="py-3 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono',
                              item.roleDefault
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {item.roleDefault ? 'Diizinkan' : 'Ditolak'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={item.effectiveGranted}
                              onCheckedChange={() => toggleUserPermission(item.modulKey)}
                              disabled={!bisaEdit || savingUserPerms}
                              size="sm"
                              aria-label={`Toggle izin kustom modul ${item.modulNama}`}
                            />
                            {item.isOverridden && (
                              <button
                                type="button"
                                onClick={() => resetSingleUserPermission(item.modulKey)}
                                title="Kembalikan ke aturan bawaan jabatan"
                                className="text-[11px] text-muted-foreground hover:text-foreground underline font-mono cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center pr-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium',
                              item.effectiveGranted
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-muted/60 text-muted-foreground border border-border/50'
                            )}
                          >
                            <span
                              className={cn(
                                'size-1.5 rounded-full',
                                item.effectiveGranted ? 'bg-emerald-500' : 'bg-muted-foreground/50'
                              )}
                            />
                            {item.effectiveGranted ? 'Aktif' : 'Nonaktif'}
                            {item.isOverridden && (
                              <span className="text-[9px] text-amber-500 font-bold uppercase">(Kustom)</span>
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FLOATING ACTION DOCKS                                                  */}
      {/* ========================================================================= */}

      {/* Dock Simpan Matriks Role */}
      {activeTabMode === 'ROLE_MATRIX' && hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Card className="rounded-lg border border-border bg-background/95 backdrop-blur-md p-3.5 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 pl-1">
              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              <div className="text-label-12">
                <p className="font-semibold text-foreground">
                  {changedItems.length} modul memiliki perubahan izin jabatan
                </p>
                <p className="text-muted-foreground text-copy-12">
                  Tekan simpan untuk memperbarui hak akses ke database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={discardChanges}
                disabled={saving}
                className="h-8 font-mono text-label-12 border-border"
              >
                Batalkan
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={saving}
                className="h-8 gap-1.5 font-mono text-label-12 bg-foreground text-background hover:bg-foreground/90 font-medium px-4"
              >
                {saving ? (
                  <>
                    <Spinner className="size-3.5" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Dock Simpan Kustomisasi Izin Si A */}
      {activeTabMode === 'USER_OVERRIDE' && hasUserPermChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Card className="rounded-lg border border-border bg-background/95 backdrop-blur-md p-3.5 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 pl-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-label-12">
                <p className="font-semibold text-foreground">
                  Perubahan hak akses untuk {selectedUserObj?.name || 'Pengguna'}
                </p>
                <p className="text-muted-foreground text-copy-12">
                  Izin kustom ini akan langsung aktif bagi akun ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserPerms(JSON.parse(JSON.stringify(originalUserPerms)));
                  toast.info('Perubahan kustom dibatalkan.');
                }}
                disabled={savingUserPerms}
                className="h-8 font-mono text-label-12 border-border"
              >
                Batalkan
              </Button>
              <Button
                size="sm"
                onClick={saveUserPermissions}
                disabled={savingUserPerms}
                className="h-8 gap-1.5 font-mono text-label-12 bg-emerald-600 text-white hover:bg-emerald-500 font-medium px-4"
              >
                {savingUserPerms ? (
                  <>
                    <Spinner className="size-3.5" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    Simpan Hak Akses Pengguna
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
