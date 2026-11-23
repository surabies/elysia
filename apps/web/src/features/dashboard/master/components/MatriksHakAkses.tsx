'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Shield,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Save,
  AlertCircle,
  X,
  UserCheck,
  RotateCcw,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { masterApi } from '../api';
import type { MatriksHakAksesItem } from '@/server/services/master/master-extended.service';
import type { UserEffectivePermission } from '@cater/types';

export interface MatriksHakAksesProps {
  userRole?: string;
  userRoles?: string[];
}

type MainTabMode = 'ROLE_MATRIX' | 'USER_OVERRIDE';
type KategoriFilter =
  | 'SEMUA'
  | 'VERIFIKASI'
  | 'OPERASIONAL'
  | 'BILLING'
  | 'RPM'
  | 'DISTRIBUSI'
  | 'LANGGANAN'
  | 'PENAGIHAN'
  | 'MASTER';

/** Penamaan Modul Singkat & Padat Sesuai Kebutuhan Enterprise Vercel Grid */
const SHORT_MODUL_NAMES: Record<string, string> = {
  monitoring_gis: 'GIS',
  verif_ring1: 'V1',
  verif_ring2: 'V2',
  verif_ring3: 'V3',
  verif_mandiri: 'Mandiri',
  manual_add: 'ADD',
  koreksi_stand: 'Koreksi',
  closing_drd: 'Tutup Bulan',
  laporan_drd: 'Laporan',
  pengaduan_air: 'Pengaduan',
  rpm_ganti_meter: 'GWM',
  rpm_tera_kalibrasi: 'Tera',
  distribusi_gis_pipa: 'Pipa',
  distribusi_dma_tekanan: 'Tekanan',
  langganan_pasang_baru: 'Pasang Baru',
  langganan_mutasi_tarif: 'Mutasi',
  penagihan_piutang_sp: 'SP',
  master_konfigurasi: 'Master Data',
};

interface HierarkiRowDef {
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
  nama: string;
  tingkat: string;
  isRoot?: boolean;
}

const HIERARKI_ROWS: HierarkiRowDef[] = [
  { key: 'superadmin', nama: 'Super Admin', tingkat: 'Pusat', isRoot: true },
  { key: 'direksi', nama: 'Direksi', tingkat: 'Tingkat 1' },
  { key: 'seniorManager', nama: 'Senior Manager', tingkat: 'Tingkat 2' },
  { key: 'manager', nama: 'Manager', tingkat: 'Tingkat 3' },
  { key: 'supervisor', nama: 'Supervisor', tingkat: 'Tingkat 4' },
  { key: 'staff', nama: 'Staf', tingkat: 'Tingkat 5' },
  { key: 'pelaksana', nama: 'Pelaksana', tingkat: 'Tingkat 6' },
];

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  jabatan: string | null;
  unitKerja: string | null;
  bagian?: string | null;
  wilayahKerja?: string | null;
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

  // --- STATE MATRIKS JABATAN (ROLE MATRIX) ---
  const [matrix, setMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [originalMatrix, setOriginalMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedKategori, setSelectedKategori] = React.useState<KategoriFilter>('SEMUA');

  // --- STATE KUSTOMISASI PENGGUNA (USER OVERRIDE) ---
  const [userList, setUserList] = React.useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string>(initialUserId || '');
  const [userPerms, setUserPerms] = React.useState<UserEffectivePermission[]>([]);
  const [originalUserPerms, setOriginalUserPerms] = React.useState<UserEffectivePermission[]>([]);
  const [loadingUserPerms, setLoadingUserPerms] = React.useState(false);
  const [savingUserPerms, setSavingUserPerms] = React.useState(false);

  // Wewenang edit: Superadmin atau pimpinan
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
      const data = await masterApi.otorisasi.getMatrix();
      if (Array.isArray(data)) {
        setMatrix(data);
        setOriginalMatrix(JSON.parse(JSON.stringify(data)));
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

  // Load Daftar Users untuk Kustomisasi Pengguna
  const fetchUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const users = await masterApi.users.getAll();
      setUserList(users);
      if (!selectedUserId && users.length > 0 && !initialUserId) {
        setSelectedUserId(users[0].id);
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
      const data = await masterApi.otorisasi.getUserOverrides(targetUserId);
      setUserPerms(data);
      setOriginalUserPerms(JSON.parse(JSON.stringify(data)));
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
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    }
  }, [selectedUserId, fetchUserPermissions]);

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
      toast.error('Akses Dibatasi: Hanya Superadmin atau pimpinan yang dapat memodifikasi hak akses.');
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
      const json = await masterApi.otorisasi.saveMatrix(changedItems);
      if (json.success) {
        toast.success('Matriks hak akses berhasil diperbarui!');
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
      toast.error('Akses Dibatasi: Hanya Superadmin atau pimpinan yang dapat memodifikasi hak akses.');
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
    toast.info(`Modul ${SHORT_MODUL_NAMES[modulKey] || modulKey} dikembalikan ke aturan bawaan.`);
  };

  // Simpan Kustomisasi Pengguna (User Overrides)
  const saveUserPermissions = async () => {
    if (!selectedUserId || !bisaEdit) return;

    setSavingUserPerms(true);
    try {
      const overridesToSave = userPerms
        .filter((p) => p.isOverridden)
        .map((p) => ({
          modulKey: p.modulKey,
          granted: p.effectiveGranted,
          catatan: p.overrideCatatan || 'Kustom khusus pengguna',
        }));

      const json = await masterApi.otorisasi.saveUserOverrides(selectedUserId, overridesToSave);
      if (json.success) {
        toast.success('Hak akses kustom pengguna berhasil disimpan!');
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

  // Filter modul berdasarkan kategori dan search query
  const filteredMatrix = React.useMemo(() => {
    return matrix.filter((item) => {
      const matchesKategori =
        selectedKategori === 'SEMUA' || item.kategori === selectedKategori;
      const shortName = SHORT_MODUL_NAMES[item.modulKey] || item.modulNama;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        shortName.toLowerCase().includes(q) ||
        item.modulNama.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q));
      return matchesKategori && matchesSearch;
    });
  }, [matrix, selectedKategori, searchQuery]);

  const selectedUserObj = React.useMemo(() => {
    return userList.find((u) => u.id === selectedUserId);
  }, [userList, selectedUserId]);

  const countPerKategori = React.useMemo(() => {
    const counts: Record<string, number> = {
      SEMUA: matrix.length,
      VERIFIKASI: 0,
      OPERASIONAL: 0,
      BILLING: 0,
      RPM: 0,
      DISTRIBUSI: 0,
      LANGGANAN: 0,
      PENAGIHAN: 0,
      MASTER: 0,
    };
    for (const item of matrix) {
      if (item.kategori in counts) {
        counts[item.kategori]++;
      }
    }
    return counts;
  }, [matrix]);

  const navCategories = React.useMemo(
    () => [
      { id: 'SEMUA' as KategoriFilter, label: 'Semua', count: countPerKategori.SEMUA },
      { id: 'VERIFIKASI' as KategoriFilter, label: 'Verifikasi', count: countPerKategori.VERIFIKASI },
      { id: 'OPERASIONAL' as KategoriFilter, label: 'Operasional', count: countPerKategori.OPERASIONAL },
      { id: 'BILLING' as KategoriFilter, label: 'Billing', count: countPerKategori.BILLING },
      { id: 'RPM' as KategoriFilter, label: 'RPM', count: countPerKategori.RPM },
      { id: 'DISTRIBUSI' as KategoriFilter, label: 'Distribusi', count: countPerKategori.DISTRIBUSI },
      { id: 'LANGGANAN' as KategoriFilter, label: 'Langganan', count: countPerKategori.LANGGANAN },
      { id: 'PENAGIHAN' as KategoriFilter, label: 'Penagihan', count: countPerKategori.PENAGIHAN },
      { id: 'MASTER' as KategoriFilter, label: 'Master', count: countPerKategori.MASTER },
    ],
    [countPerKategori]
  );

  const getCategoryDot = (kategori: string) => {
    switch (kategori) {
      case 'VERIFIKASI':
        return 'bg-amber-500';
      case 'BILLING':
        return 'bg-blue-500';
      case 'MASTER':
        return 'bg-purple-500';
      case 'OPERASIONAL':
        return 'bg-emerald-500';
      case 'RPM':
        return 'bg-rose-500';
      case 'DISTRIBUSI':
        return 'bg-cyan-500';
      case 'LANGGANAN':
        return 'bg-orange-500';
      case 'PENAGIHAN':
        return 'bg-indigo-500';
      default:
        return 'bg-foreground/50';
    }
  };

  // Map user permissions untuk lookup cepat per modulKey
  const userPermsMap = React.useMemo(() => {
    const map = new Map<string, UserEffectivePermission>();
    for (const p of userPerms) {
      map.set(p.modulKey, p);
    }
    return map;
  }, [userPerms]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full pb-28">
      {/* 1. Header Toolbar Dashboard */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-foreground" />
            <h1 className="text-heading-18 text-foreground tracking-tight font-semibold">
              Hak Akses Dinamis RBAC
            </h1>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-border">
              Enterprise
            </Badge>
          </div>
          <p className="text-copy-12 text-muted-foreground">
            Matriks otorisasi modul per tingkatan jabatan resmi dan kustomisasi wewenang akun perorangan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border border-border bg-muted/20 text-muted-foreground">
            <span
              className={cn(
                'size-1.5 rounded-full',
                bisaEdit ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
              )}
            />
            <span>{bisaEdit ? 'Mode Edit' : 'Hanya Baca'}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchMatrix();
              if (selectedUserId) fetchUserPermissions(selectedUserId);
            }}
            disabled={loading || loadingUserPerms}
            className="h-8 gap-1.5 font-mono text-label-12 border-border"
          >
            <RefreshCw className={cn('size-3.5', (loading || loadingUserPerms) && 'animate-spin')} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* 2. Unified Toolbar Panel: View Switcher, Search, & Categories Filter */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Switcher: Segmented Control */}
          <div className="inline-flex p-0.5 rounded-md border border-border bg-muted/30 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTabMode('ROLE_MATRIX')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-mono font-medium transition-all cursor-pointer',
                activeTabMode === 'ROLE_MATRIX'
                  ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield className="size-3.5" />
              <span>Berdasarkan Jabatan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabMode('USER_OVERRIDE')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-mono font-medium transition-all cursor-pointer',
                activeTabMode === 'USER_OVERRIDE'
                  ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Kustomisasi Perorangan</span>
            </button>
          </div>

          {/* Search Box Modul */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari modul..."
              className="pl-8 pr-7 h-8 font-sans text-copy-12 bg-background border-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Kategori Modul Horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/60 -mb-0.5">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
            Modul:
          </span>
          {navCategories.map((cat) => {
            const isActive = selectedKategori === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedKategori(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono transition-colors shrink-0 cursor-pointer',
                  isActive
                    ? 'bg-foreground text-background font-medium'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>{cat.label}</span>
                <span className={cn('text-[10px] opacity-75', isActive ? 'text-background' : 'text-muted-foreground')}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Panel Khusus Mode Kustomisasi Perorangan */}
      {activeTabMode === 'USER_OVERRIDE' && (
        <Card className="rounded-lg border border-border bg-card p-3 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-emerald-500 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-label-13 font-semibold text-foreground block">
                  Pilih Akun Pegawai
                </span>
                <span className="text-copy-11 text-muted-foreground block">
                  Ceklis pada baris Kustomisasi Efektif akan menimpa aturan default jabatan pegawai bersangkutan.
                </span>
              </div>
            </div>

            <div className="w-full sm:w-80 shrink-0">
              <Select
                value={selectedUserId}
                onValueChange={(val) => setSelectedUserId(val)}
              >
                <SelectTrigger className="h-8 w-full bg-background border-border font-sans text-copy-12">
                  <SelectValue placeholder="Pilih akun pegawai..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {userList.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-copy-12 font-sans">
                      {u.name || u.email} · {u.role} · {u.bagian?.replace(/_/g, ' ') || 'Umum'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedUserObj && (
            <div className="flex flex-wrap items-center gap-3 rounded border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-mono">
              <div>
                <span className="text-muted-foreground">Nama:</span>{' '}
                <span className="font-semibold text-foreground">{selectedUserObj.name || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{' '}
                <span className="text-foreground">{selectedUserObj.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Peran:</span>{' '}
                <Badge variant="outline" className="font-mono text-[10px] ml-1">
                  {selectedUserObj.role}
                </Badge>
              </div>
              {selectedUserObj.bagian && (
                <div>
                  <span className="text-muted-foreground">Bagian:</span>{' '}
                  <span className="text-foreground">{selectedUserObj.bagian.replace(/_/g, ' ')}</span>
                </div>
              )}
              {selectedUserObj.wilayahKerja && (
                <div>
                  <span className="text-muted-foreground">Wilayah:</span>{' '}
                  <span className="text-foreground">{selectedUserObj.wilayahKerja.replace(/_/g, ' ')}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Jabatan:</span>{' '}
                <span className="text-foreground">{selectedUserObj.jabatan || 'Staf Operasional'}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 4. Panel Tabel TanStack Enterprise: 1 Baris per Row/Kolom Gaya Vercel */}
      <Card className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        {loading || (activeTabMode === 'USER_OVERRIDE' && loadingUserPerms) ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
            <Spinner className="size-5 text-foreground" />
            <span className="text-label-12 font-mono">Memuat matriks otorisasi...</span>
          </div>
        ) : filteredMatrix.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <AlertCircle className="size-6 text-muted-foreground/60" />
            <p className="text-label-13 font-medium text-foreground">Tidak ada modul yang cocok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse">
              {/* Header Tabel: Modul Pendek & Ringkas (1 Baris) */}
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40 h-9">
                  <TableHead className="w-[200px] min-w-[200px] max-w-[200px] text-label-11 uppercase font-mono tracking-wider text-foreground font-semibold py-2 pl-3 sticky left-0 z-20 bg-muted/95 backdrop-blur-xs border-r border-border">
                    Akun
                  </TableHead>
                  {filteredMatrix.map((item) => {
                    const shortName = SHORT_MODUL_NAMES[item.modulKey] || item.modulNama;
                    return (
                      <TableHead
                        key={item.modulKey}
                        className="text-center px-2 min-w-[95px] max-w-[125px] py-2 text-label-11 font-mono uppercase tracking-wider text-muted-foreground font-semibold border-l border-border/40 whitespace-nowrap"
                        title={`${item.modulNama} · ${item.kategori}`}
                      >
                        <div className="inline-flex items-center justify-center gap-1.5 w-full">
                          <span className={cn('size-1.5 rounded-full shrink-0', getCategoryDot(item.kategori))} />
                          <span className="font-semibold text-foreground truncate">{shortName}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              {/* Body Tabel: 1 Baris per Row */}
              <TableBody>
                {/* A. TAMPILAN BERDASARKAN JABATAN */}
                {activeTabMode === 'ROLE_MATRIX' &&
                  HIERARKI_ROWS.map((role) => (
                    <TableRow
                      key={role.key}
                      className="border-b border-border/70 hover:bg-muted/20 transition-colors h-9"
                    >
                      <TableCell className="py-1.5 pl-3 sticky left-0 z-10 bg-card border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                        <div className="flex items-center justify-between pr-2">
                          <span className="text-label-12 font-medium text-foreground truncate">
                            {role.nama}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            {role.tingkat}
                          </span>
                        </div>
                      </TableCell>
                      {filteredMatrix.map((item) => {
                        const isAllowed = role.isRoot ? true : Boolean(item[role.key]);
                        return (
                          <TableCell
                            key={item.modulKey}
                            className="text-center align-middle px-2 py-1.5 border-l border-border/40 whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={isAllowed}
                                onCheckedChange={() =>
                                  !role.isRoot && togglePermission(item.modulKey, role.key)
                                }
                                disabled={!bisaEdit || role.isRoot || saving}
                                className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                                aria-label={`Izin ${role.nama} modul ${item.modulNama}`}
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}

                {/* B. TAMPILAN KUSTOMISASI PERORANGAN (PEGAWAI TERPILIH) */}
                {activeTabMode === 'USER_OVERRIDE' && (
                  <>
                    {/* Baris 1: Bawaan Jabatan (Readonly Default) */}
                    <TableRow className="border-b border-border/60 bg-muted/15 h-9">
                      <TableCell className="py-1.5 pl-3 sticky left-0 z-10 bg-muted/30 border-r border-border whitespace-nowrap">
                        <div className="flex items-center justify-between pr-2">
                          <span className="text-label-12 font-medium text-muted-foreground">
                            Bawaan Jabatan
                          </span>
                          <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                            Default
                          </Badge>
                        </div>
                      </TableCell>
                      {filteredMatrix.map((item) => {
                        const perm = userPermsMap.get(item.modulKey);
                        const isAllowed = perm ? perm.roleDefault : false;
                        return (
                          <TableCell
                            key={item.modulKey}
                            className="text-center align-middle px-2 py-1.5 border-l border-border/40 whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center">
                              {isAllowed ? (
                                <Check className="size-3.5 text-emerald-500" />
                              ) : (
                                <span className="text-[11px] font-mono text-muted-foreground/40">-</span>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Baris 2: Kustomisasi Efektif (Interactive Checkbox) */}
                    <TableRow className="border-b border-border hover:bg-muted/20 transition-colors h-9">
                      <TableCell className="py-1.5 pl-3 sticky left-0 z-10 bg-card border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                        <div className="flex items-center justify-between pr-2">
                          <span className="text-label-12 font-semibold text-foreground">
                            Izin Kustom
                          </span>
                          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Aktif
                          </span>
                        </div>
                      </TableCell>
                      {filteredMatrix.map((item) => {
                        const perm = userPermsMap.get(item.modulKey);
                        const isAllowed = perm ? perm.effectiveGranted : false;
                        const isOverridden = perm ? perm.isOverridden : false;
                        return (
                          <TableCell
                            key={item.modulKey}
                            className="text-center align-middle px-2 py-1.5 border-l border-border/40 whitespace-nowrap relative"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Checkbox
                                checked={isAllowed}
                                onCheckedChange={() => toggleUserPermission(item.modulKey)}
                                disabled={!bisaEdit || savingUserPerms}
                                className={cn(
                                  'size-4 cursor-pointer',
                                  isOverridden
                                    ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600'
                                    : 'data-[state=checked]:bg-foreground data-[state=checked]:border-foreground'
                                )}
                                aria-label={`Toggle kustom modul ${item.modulNama}`}
                              />
                              {isOverridden && (
                                <span
                                  className="size-1 rounded-full bg-amber-500 absolute top-1 right-1"
                                  title="Izin kustom menimpa wewenang default"
                                />
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Baris 3: Status / Aksi Reset */}
                    <TableRow className="border-b border-border/40 bg-muted/5 h-8">
                      <TableCell className="py-1 pl-3 sticky left-0 z-10 bg-card border-r border-border whitespace-nowrap">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Status Modul
                        </span>
                      </TableCell>
                      {filteredMatrix.map((item) => {
                        const perm = userPermsMap.get(item.modulKey);
                        const isOverridden = perm ? perm.isOverridden : false;
                        return (
                          <TableCell
                            key={item.modulKey}
                            className="text-center align-middle px-1 py-1 border-l border-border/40 whitespace-nowrap"
                          >
                            {isOverridden ? (
                              <button
                                type="button"
                                onClick={() => resetSingleUserPermission(item.modulKey)}
                                className="text-[10px] font-mono text-amber-500 hover:text-amber-600 underline cursor-pointer"
                                title="Kembalikan ke aturan bawaan jabatan"
                              >
                                Reset
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono text-muted-foreground/50">Bawaan</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 5. Floating Action Docks: Simpan Perubahan */}
      {/* Dock Simpan Matriks Role Jabatan */}
      {activeTabMode === 'ROLE_MATRIX' && hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <Card className="rounded-lg border border-border bg-background/95 backdrop-blur-md p-3 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 pl-1">
              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              <div className="text-label-12">
                <p className="font-semibold text-foreground">
                  {changedItems.length} modul mengalami perubahan izin
                </p>
                <p className="text-muted-foreground text-copy-11">
                  Tekan simpan untuk memperbarui otorisasi ke database.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={discardChanges}
                disabled={saving}
                className="h-7 px-2.5 font-mono text-label-11 border-border"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={saving}
                className="h-7 px-3 gap-1.5 font-mono text-label-11 bg-foreground text-background hover:bg-foreground/90 font-medium"
              >
                {saving ? (
                  <>
                    <Spinner className="size-3" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="size-3" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Dock Simpan Kustomisasi Izin Pegawai */}
      {activeTabMode === 'USER_OVERRIDE' && hasUserPermChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <Card className="rounded-lg border border-border bg-background/95 backdrop-blur-md p-3 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 pl-1">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-label-12">
                <p className="font-semibold text-foreground">
                  Perubahan izin untuk {selectedUserObj?.name || 'Pegawai'}
                </p>
                <p className="text-muted-foreground text-copy-11">
                  Izin kustom akan langsung aktif bagi akun ini.
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
                className="h-7 px-2.5 font-mono text-label-11 border-border"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={saveUserPermissions}
                disabled={savingUserPerms}
                className="h-7 px-3 gap-1.5 font-mono text-label-11 bg-emerald-600 text-white hover:bg-emerald-500 font-medium"
              >
                {savingUserPerms ? (
                  <>
                    <Spinner className="size-3" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="size-3" />
                    Simpan
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
