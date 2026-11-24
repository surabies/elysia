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
  CheckCircle2,
  Lock,
  Eye,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Building2,
  Layers,
  HelpCircle,
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

type BagianFilter =
  | 'SEMUA'
  | 'PENCATAT_METER'
  | 'LANGGANAN'
  | 'DISTRIBUSI'
  | 'RPM'
  | 'PENAGIHAN'
  | 'UMUM';

interface BagianMeta {
  id: BagianFilter;
  label: string;
  shortLabel: string;
  badgeVariant: 'green-subtle' | 'blue-subtle' | 'purple-subtle' | 'red-subtle' | 'amber-subtle' | 'gray-subtle';
  deskripsi: string;
}

const BAGIAN_METAS: Record<BagianFilter, BagianMeta> = {
  SEMUA: {
    id: 'SEMUA',
    label: 'Semua Bagian & Departemen',
    shortLabel: 'Semua',
    badgeVariant: 'gray-subtle',
    deskripsi: 'Seluruh 18 modul operasional terdaftar lintas departemen',
  },
  PENCATAT_METER: {
    id: 'PENCATAT_METER',
    label: 'Bagian Pencatat Meter',
    shortLabel: 'Pencatat Meter',
    badgeVariant: 'green-subtle',
    deskripsi: 'Monitoring GIS, pembacaan meter mandiri & 3-ring verifikasi lapangan',
  },
  LANGGANAN: {
    id: 'LANGGANAN',
    label: 'Bagian Hubungan Langganan',
    shortLabel: 'Langganan',
    badgeVariant: 'blue-subtle',
    deskripsi: 'Pengaduan & tiket pelanggan, pasang baru, mutasi wilayah & golongan tarif',
  },
  DISTRIBUSI: {
    id: 'DISTRIBUSI',
    label: 'Bagian Distribusi / Sub Zona',
    shortLabel: 'Distribusi',
    badgeVariant: 'purple-subtle',
    deskripsi: 'GIS jaringan pipa, valve, penataan DMA & logger tekanan air',
  },
  RPM: {
    id: 'RPM',
    label: 'Bagian Rehabilitasi & Pemeliharaan Meter (RPM)',
    shortLabel: 'RPM',
    badgeVariant: 'red-subtle',
    deskripsi: 'Penggantian meteran air fisik (GWM), uji akurasi & kalibrasi tera lab',
  },
  PENAGIHAN: {
    id: 'PENAGIHAN',
    label: 'Bagian Penagihan & Rekening',
    shortLabel: 'Penagihan',
    badgeVariant: 'amber-subtle',
    deskripsi: 'Monitoring piutang rekening, penerbitan surat peringatan (SP) & penertiban',
  },
  UMUM: {
    id: 'UMUM',
    label: 'Direksi, Eksekutif & Tata Kelola IT',
    shortLabel: 'Umum & Direksi',
    badgeVariant: 'gray-subtle',
    deskripsi: 'Master data akun pegawai, parameter konfigurasi sistem & pengawasan eksekutif',
  },
};

const BAGIAN_ORDER: BagianFilter[] = [
  'PENCATAT_METER',
  'LANGGANAN',
  'DISTRIBUSI',
  'RPM',
  'PENAGIHAN',
  'UMUM',
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
  const [selectedBagian, setSelectedBagian] = React.useState<BagianFilter>('SEMUA');

  // --- STATE KUSTOMISASI PENGGUNA (USER OVERRIDE) ---
  const [userList, setUserList] = React.useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string>(initialUserId || '');
  const [userPerms, setUserPerms] = React.useState<UserEffectivePermission[]>([]);
  const [originalUserPerms, setOriginalUserPerms] = React.useState<UserEffectivePermission[]>([]);
  const [loadingUserPerms, setLoadingUserPerms] = React.useState(false);
  const [savingUserPerms, setSavingUserPerms] = React.useState(false);

  // In-Memory Permissions Cache untuk Menghindari Lag saat Ganti Pegawai
  const userPermsCacheRef = React.useRef<Map<string, UserEffectivePermission[]>>(new Map());
  const [isPendingTransition, startTransition] = React.useTransition();

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

  // Load Hak Akses Efektif Pengguna Terpilih (dengan Cache Memori)
  const fetchUserPermissions = React.useCallback(
    async (targetUserId: string, silentRevalidate = false) => {
      if (!targetUserId) return;

      // Cek apakah data sudah ada di cache untuk tampilan instan tanpa lag
      const cached = userPermsCacheRef.current.get(targetUserId);
      if (cached && !silentRevalidate) {
        setUserPerms(cached);
        setOriginalUserPerms(JSON.parse(JSON.stringify(cached)));
        // Lakukan silent revalidasi di background
      }

      if (!cached) {
        setLoadingUserPerms(true);
      }

      try {
        const data = await masterApi.otorisasi.getUserOverrides(targetUserId);
        userPermsCacheRef.current.set(targetUserId, data);
        setUserPerms(data);
        setOriginalUserPerms(JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.error('Failed to load user permissions:', err);
        if (!cached) toast.error('Gagal memuat hak akses pengguna.');
      } finally {
        setLoadingUserPerms(false);
      }
    },
    []
  );

  React.useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Pilihan Pengguna Berubah: gunakan startTransition untuk kelancaran rendering
  const handleSelectUser = (newUserId: string) => {
    startTransition(() => {
      setSelectedUserId(newUserId);
    });
  };

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
      toast.error('Akses Dibatasi: Anda tidak memiliki wewenang menyimpan perubahan.');
      return;
    }

    setSaving(true);
    try {
      const json = await masterApi.otorisasi.saveMatrix(changedItems);
      if (json.success) {
        toast.success(`Berhasil menyimpan ${changedItems.length} modul perizinan!`);
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

  // Toggle Aksi Granular Pengguna Tertentu (canRead, canCreate, canUpdate, canDelete, canPost)
  const toggleUserAction = (
    modulKey: string,
    action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' | 'canPost'
  ) => {
    if (!bisaEdit) {
      toast.error('Akses Dibatasi: Hanya Superadmin atau pimpinan yang dapat memodifikasi hak akses.');
      return;
    }

    setUserPerms((prev) => {
      const nextList = prev.map((item) => {
        if (item.modulKey !== modulKey) return item;
        const nextVal = !item[action];
        const nextItem = {
          ...item,
          [action]: nextVal,
          isOverridden: true,
          overrideCatatan: 'Kustom aksi oleh Admin',
        };
        nextItem.effectiveGranted =
          nextItem.canRead ||
          nextItem.canCreate ||
          nextItem.canUpdate ||
          nextItem.canDelete ||
          nextItem.canPost;
        return nextItem;
      });
      // Update cache lokal
      if (selectedUserId) {
        userPermsCacheRef.current.set(selectedUserId, nextList);
      }
      return nextList;
    });
  };

  // Beri Semua Aksi untuk 1 Modul
  const grantAllActionsForModule = (modulKey: string) => {
    if (!bisaEdit) return;
    setUserPerms((prev) => {
      const nextList = prev.map((item) => {
        if (item.modulKey !== modulKey) return item;
        return {
          ...item,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canPost: true,
          isOverridden: true,
          effectiveGranted: true,
          overrideCatatan: 'Akses penuh modul oleh Admin',
        };
      });
      if (selectedUserId) userPermsCacheRef.current.set(selectedUserId, nextList);
      return nextList;
    });
    toast.success('Semua wewenang modul diaktifkan.');
  };

  // Kembalikan Izin Modul Pengguna ke Default Jabatan
  const resetSingleUserPermission = (modulKey: string) => {
    if (!bisaEdit) return;
    const orig = originalUserPerms.find((p) => p.modulKey === modulKey);
    setUserPerms((prev) => {
      const nextList = prev.map((item) => {
        if (item.modulKey !== modulKey) return item;
        return {
          ...item,
          isOverridden: false,
          canRead: orig ? orig.canRead : item.roleDefault,
          canCreate: orig ? orig.canCreate : false,
          canUpdate: orig ? orig.canUpdate : false,
          canDelete: orig ? orig.canDelete : false,
          canPost: orig ? orig.canPost : false,
          effectiveGranted: item.roleDefault,
          overrideCatatan: null,
        };
      });
      if (selectedUserId) userPermsCacheRef.current.set(selectedUserId, nextList);
      return nextList;
    });
    toast.info('Modul dikembalikan ke wewenang bawaan jabatan.');
  };

  // Beri Semua Hak Akses Lintas Bagian (Super User Override)
  const grantAllModules = () => {
    if (!bisaEdit) return;
    setUserPerms((prev) => {
      const nextList = prev.map((item) => ({
        ...item,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canPost: true,
        isOverridden: true,
        effectiveGranted: true,
        overrideCatatan: 'Akses penuh seluruh modul (Super User)',
      }));
      if (selectedUserId) userPermsCacheRef.current.set(selectedUserId, nextList);
      return nextList;
    });
    toast.success('Seluruh 18 modul berhasil diberikan wewenang penuh!');
  };

  // Reset Semua Modul ke Default Bawaan Jabatan
  const resetAllToDefault = () => {
    if (!bisaEdit) return;
    setUserPerms((prev) => {
      const nextList = prev.map((item) => {
        const orig = originalUserPerms.find((p) => p.modulKey === item.modulKey);
        return {
          ...item,
          isOverridden: false,
          canRead: orig ? orig.canRead : item.roleDefault,
          canCreate: orig ? orig.canCreate : false,
          canUpdate: orig ? orig.canUpdate : false,
          canDelete: orig ? orig.canDelete : false,
          canPost: orig ? orig.canPost : false,
          effectiveGranted: item.roleDefault,
          overrideCatatan: null,
        };
      });
      if (selectedUserId) userPermsCacheRef.current.set(selectedUserId, nextList);
      return nextList;
    });
    toast.info('Seluruh modul dikembalikan ke wewenang bawaan jabatan.');
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
          canRead: p.canRead,
          canCreate: p.canCreate,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
          canPost: p.canPost,
          granted: p.effectiveGranted,
          catatan: p.overrideCatatan || 'Kustom khusus pengguna',
        }));

      const json = await masterApi.otorisasi.saveUserOverrides(selectedUserId, overridesToSave);
      if (json.success) {
        toast.success('Hak akses kustom pengguna berhasil disimpan ke database!');
        setOriginalUserPerms(JSON.parse(JSON.stringify(userPerms)));
        userPermsCacheRef.current.set(selectedUserId, JSON.parse(JSON.stringify(userPerms)));
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

  // Filter Modul Berdasarkan Bagian dan Search Query (Role Matrix)
  const filteredMatrix = React.useMemo(() => {
    return matrix.filter((item) => {
      const b = item.bagian || 'UMUM';
      const matchesBagian = selectedBagian === 'SEMUA' || b === selectedBagian;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        item.modulKey.toLowerCase().includes(q) ||
        item.modulNama.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q));
      return matchesBagian && matchesSearch;
    });
  }, [matrix, selectedBagian, searchQuery]);

  // Filter Hak Akses Pengguna Berdasarkan Bagian dan Search Query (User Override)
  const filteredUserPerms = React.useMemo(() => {
    return userPerms.filter((p) => {
      const b = p.bagian || 'UMUM';
      const matchesBagian = selectedBagian === 'SEMUA' || b === selectedBagian;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        p.modulKey.toLowerCase().includes(q) ||
        p.modulNama.toLowerCase().includes(q) ||
        (p.deskripsi && p.deskripsi.toLowerCase().includes(q));
      return matchesBagian && matchesSearch;
    });
  }, [userPerms, selectedBagian, searchQuery]);

  const selectedUserObj = React.useMemo(() => {
    return userList.find((u) => u.id === selectedUserId);
  }, [userList, selectedUserId]);

  // Hitung jumlah modul per bagian
  const countPerBagian = React.useMemo(() => {
    const counts: Record<string, number> = {
      SEMUA: matrix.length,
      PENCATAT_METER: 0,
      LANGGANAN: 0,
      DISTRIBUSI: 0,
      RPM: 0,
      PENAGIHAN: 0,
      UMUM: 0,
    };
    for (const item of matrix) {
      const b = item.bagian || 'UMUM';
      if (b in counts) {
        counts[b]++;
      }
    }
    return counts;
  }, [matrix]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full pb-28">
      {/* 1. Header Toolbar Dashboard */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4.5 text-foreground" />
            <h1 className="text-heading-18 text-foreground tracking-tight font-semibold">
              Matriks Hak Akses & Otorisasi RBAC
            </h1>
            <Badge variant="pill" size="sm" className="font-mono text-label-11">
              Enterprise 3-Lapisan
            </Badge>
          </div>
          <p className="text-copy-13 text-muted-foreground">
            Struktur wewenang hierarkis berbasis Bagian/Departemen, jabatan struktural resmi, serta override granular 5 aksi perorangan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={bisaEdit ? 'green-subtle' : 'gray-subtle'}
            size="sm"
            className="font-mono font-medium"
          >
            <span
              className={cn(
                'size-1.5 rounded-full mr-1.5',
                bisaEdit ? 'bg-(--ds-green-700) animate-pulse' : 'bg-muted-foreground'
              )}
            />
            <span>{bisaEdit ? 'Mode Otorisasi Aktif' : 'Hanya Baca'}</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              userPermsCacheRef.current.clear();
              fetchMatrix();
              if (selectedUserId) fetchUserPermissions(selectedUserId);
            }}
            disabled={loading || loadingUserPerms}
            className="h-8 gap-1.5 text-label-12 border-border"
          >
            <RefreshCw className={cn('size-3.5', (loading || loadingUserPerms) && 'animate-spin')} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* 2. Unified Toolbar Panel: View Switcher, Search, & Bagian Tabs */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Switcher: Segmented Control */}
          <div className="inline-flex p-0.5 rounded-md border border-border bg-muted/40 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTabMode('USER_OVERRIDE')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-label-12 font-medium transition-all cursor-pointer',
                activeTabMode === 'USER_OVERRIDE'
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Kustomisasi Pengguna (Granular 5 Aksi)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTabMode('ROLE_MATRIX')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-label-12 font-medium transition-all cursor-pointer',
                activeTabMode === 'ROLE_MATRIX'
                  ? 'bg-card text-foreground font-semibold shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield className="size-3.5" />
              <span>Bawaan Jabatan (Hierarki Role)</span>
            </button>
          </div>

          {/* Search Box Modul */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau kunci modul..."
              className="pl-8 pr-7 h-8 text-copy-12 bg-background border-border"
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

        {/* Filter Bagian (Departemen Scope) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 border-t border-border/60">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers className="size-3" />
            <span>Bagian:</span>
          </span>
          {(['SEMUA', ...BAGIAN_ORDER] as BagianFilter[]).map((tabId) => {
            const meta = BAGIAN_METAS[tabId];
            const isActive = selectedBagian === tabId;
            const count = countPerBagian[tabId] ?? 0;
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => setSelectedBagian(tabId)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-label-12 transition-colors shrink-0 cursor-pointer',
                  isActive
                    ? 'bg-foreground text-background font-medium'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span>{meta.shortLabel}</span>
                <span className={cn('text-label-11 px-1 rounded', isActive ? 'text-background bg-foreground/20' : 'text-muted-foreground')}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Panel Khusus Mode Kustomisasi Pengguna (User Override) */}
      {activeTabMode === 'USER_OVERRIDE' && (
        <Card className="rounded-lg border border-border bg-card p-3.5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-(--ds-green-700) shrink-0" />
              <div className="space-y-0.5">
                <span className="text-label-13 font-semibold text-foreground block">
                  Pilih Akun Pegawai untuk Dikonfigurasi
                </span>
                <span className="text-copy-12 text-muted-foreground block">
                  Wewenang kustom perorangan akan meng-override hak akses bawaan jabatannya secara instan.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-80 shrink-0">
                <Select
                  value={selectedUserId}
                  onValueChange={handleSelectUser}
                >
                  <SelectTrigger className="h-8 w-full bg-background border-border text-copy-12">
                    <SelectValue placeholder="Pilih akun pegawai..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {userList.map((u) => {
                      const userBag = (u.bagian ?? 'UMUM').toUpperCase() as BagianFilter;
                      const badge = BAGIAN_METAS[userBag] ?? BAGIAN_METAS.UMUM;
                      return (
                        <SelectItem key={u.id} value={u.id} className="text-copy-12">
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="font-medium text-foreground">{u.name || u.email}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">({badge.shortLabel})</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {bisaEdit && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={grantAllModules}
                    className="h-8 text-label-12 gap-1 border-border text-foreground hover:bg-muted"
                    title="Beri akses penuh ke seluruh 18 modul lintas bagian"
                  >
                    <Sparkles className="size-3 text-(--ds-amber-700)" />
                    <span>Akses Penuh Semua</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAllToDefault}
                    className="h-8 text-label-12 gap-1 border-border text-muted-foreground hover:text-foreground"
                    title="Kembalikan seluruh modul ke wewenang bawaan jabatan"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset Bawaan</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {selectedUserObj && (
            <div className="flex flex-wrap items-center gap-3 rounded border border-border/60 bg-muted/20 px-3 py-1.5 text-copy-12">
              <div>
                <span className="text-muted-foreground">Pegawai:</span>{' '}
                <strong className="text-foreground">{selectedUserObj.name || '-'}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Bagian:</span>{' '}
                <Badge
                  variant={
                    BAGIAN_METAS[(selectedUserObj.bagian?.toUpperCase() as BagianFilter) || 'UMUM']?.badgeVariant ||
                    'gray-subtle'
                  }
                  size="sm"
                >
                  {selectedUserObj.bagian ? selectedUserObj.bagian.replace(/_/g, ' ') : 'Umum'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Jabatan:</span>{' '}
                <span className="text-foreground font-mono">{selectedUserObj.jabatan || selectedUserObj.role}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Wilayah:</span>{' '}
                <span className="text-foreground font-mono">{selectedUserObj.wilayahKerja?.replace(/_/g, ' ') || 'Pusat'}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Indikator Loading Transisi Tipis yang Halus (Zero Layout Shift) */}
      {(loadingUserPerms || isPendingTransition) && (
        <div className="h-0.5 w-full bg-primary/20 overflow-hidden rounded-full">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}

      {/* 4. Tabel Matriks Otorisasi Sesuai Mode */}
      <Card className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
            <Spinner className="size-5 text-foreground" />
            <span className="text-label-12 font-mono">Memuat wewenang modul dari database...</span>
          </div>
        ) : (activeTabMode === 'USER_OVERRIDE' ? filteredUserPerms.length === 0 : filteredMatrix.length === 0) ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <AlertCircle className="size-6 text-muted-foreground/60" />
            <p className="text-label-13 font-medium text-foreground">
              Tidak ada modul yang cocok pada bagian & pencarian ini.
            </p>
          </div>
        ) : activeTabMode === 'USER_OVERRIDE' ? (
          /* TAMPILAN TABEL KUSTOMISASI PENGGUNA (KOLOM BADGE BAGIAN & STICKY HEADER) */
          <div className="overflow-x-auto max-h-[680px] relative">
            <Table className={cn('w-full border-collapse', (loadingUserPerms || isPendingTransition) && 'opacity-65 transition-opacity')}>
              <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm border-b border-border shadow-xs">
                <TableRow className="border-b border-border hover:bg-transparent h-9.5">
                  <TableHead className="w-[260px] text-label-11 uppercase font-mono tracking-wider text-foreground font-semibold py-2 pl-4">
                    Modul Sistem
                  </TableHead>
                  <TableHead className="w-[140px] text-label-11 uppercase font-mono tracking-wider text-foreground font-semibold py-2">
                    Bagian
                  </TableHead>
                  <TableHead className="w-[240px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2">
                    Deskripsi Operasional
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3 text-muted-foreground" />
                      <span>Lihat</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    <span className="inline-flex items-center gap-1">
                      <Plus className="size-3 text-muted-foreground" />
                      <span>Buat</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    <span className="inline-flex items-center gap-1">
                      <Edit className="size-3 text-muted-foreground" />
                      <span>Edit</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    <span className="inline-flex items-center gap-1">
                      <Trash2 className="size-3 text-muted-foreground" />
                      <span>Hapus</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-[95px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    <span className="inline-flex items-center gap-1 text-(--ds-amber-700)">
                      <Lock className="size-3" />
                      <span>Posting</span>
                    </span>
                  </TableHead>
                  <TableHead className="w-[110px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Status
                  </TableHead>
                  <TableHead className="w-[130px] text-right text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 pr-4">
                    Aksi Cepat
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserPerms.map((perm) => {
                  const bagMeta = BAGIAN_METAS[(perm.bagian as BagianFilter) || 'UMUM'] ?? BAGIAN_METAS.UMUM;
                  return (
                    <TableRow
                      key={perm.modulKey}
                      className="border-b border-border/70 hover:bg-muted/20 transition-colors h-10"
                    >
                      {/* 1. Modul Info */}
                      <TableCell className="py-2 pl-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-label-13 font-semibold text-foreground">
                            {perm.modulNama}
                          </span>
                          <span className="font-mono text-label-11 text-muted-foreground">
                            {perm.modulKey}
                          </span>
                        </div>
                      </TableCell>

                      {/* 2. Kolom Badge Bagian Terpisah */}
                      <TableCell className="py-2">
                        <Badge variant={bagMeta.badgeVariant} size="sm" className="font-medium">
                          {bagMeta.shortLabel}
                        </Badge>
                      </TableCell>

                      {/* 3. Deskripsi */}
                      <TableCell className="py-2 text-copy-12 text-muted-foreground">
                        {perm.deskripsi}
                      </TableCell>

                      {/* 4. Aksi: Lihat (canRead) */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={perm.canRead}
                            onCheckedChange={() => toggleUserAction(perm.modulKey, 'canRead')}
                            disabled={!bisaEdit || savingUserPerms}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                            aria-label={`Izin lihat ${perm.modulNama}`}
                          />
                        </div>
                      </TableCell>

                      {/* 5. Aksi: Buat (canCreate) */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={perm.canCreate}
                            onCheckedChange={() => toggleUserAction(perm.modulKey, 'canCreate')}
                            disabled={!bisaEdit || savingUserPerms}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                            aria-label={`Izin buat ${perm.modulNama}`}
                          />
                        </div>
                      </TableCell>

                      {/* 6. Aksi: Edit (canUpdate) */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={perm.canUpdate}
                            onCheckedChange={() => toggleUserAction(perm.modulKey, 'canUpdate')}
                            disabled={!bisaEdit || savingUserPerms}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                            aria-label={`Izin edit ${perm.modulNama}`}
                          />
                        </div>
                      </TableCell>

                      {/* 7. Aksi: Hapus (canDelete) */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={perm.canDelete}
                            onCheckedChange={() => toggleUserAction(perm.modulKey, 'canDelete')}
                            disabled={!bisaEdit || savingUserPerms}
                            className="size-4 cursor-pointer data-[state=checked]:bg-(--ds-red-700) data-[state=checked]:border-(--ds-red-700)"
                            aria-label={`Izin hapus ${perm.modulNama}`}
                          />
                        </div>
                      </TableCell>

                      {/* 8. Aksi: Posting (canPost) */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={perm.canPost}
                            onCheckedChange={() => toggleUserAction(perm.modulKey, 'canPost')}
                            disabled={!bisaEdit || savingUserPerms}
                            className="size-4 cursor-pointer data-[state=checked]:bg-(--ds-amber-700) data-[state=checked]:border-(--ds-amber-700)"
                            aria-label={`Izin posting ${perm.modulNama}`}
                          />
                        </div>
                      </TableCell>

                      {/* 9. Status Otoritas (Geist Badge) */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        {perm.isOverridden ? (
                          <Badge variant="amber-subtle" size="sm" className="font-mono font-semibold">
                            Kustom
                          </Badge>
                        ) : (
                          <Badge variant="gray-subtle" size="sm" className="font-mono">
                            Bawaan
                          </Badge>
                        )}
                      </TableCell>

                      {/* 10. Aksi Cepat Baris */}
                      <TableCell className="py-2 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => grantAllActionsForModule(perm.modulKey)}
                            disabled={!bisaEdit || savingUserPerms}
                            className="h-6 px-1.5 text-label-11 font-mono text-muted-foreground hover:text-foreground"
                          >
                            Penuh
                          </Button>
                          {perm.isOverridden && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => resetSingleUserPermission(perm.modulKey)}
                              disabled={!bisaEdit || savingUserPerms}
                              className="h-6 px-1.5 text-label-11 font-mono text-(--ds-amber-700) hover:text-(--ds-amber-800)"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* TAMPILAN TABEL MATRIKS ROLE BAWAAN JABATAN (KOLOM BADGE BAGIAN & STICKY HEADER) */
          <div className="overflow-x-auto max-h-[680px] relative">
            <Table className="w-full border-collapse">
              <TableHeader className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm border-b border-border shadow-xs">
                <TableRow className="border-b border-border hover:bg-transparent h-9.5">
                  <TableHead className="w-[260px] text-label-11 uppercase font-mono tracking-wider text-foreground font-semibold py-2 pl-4">
                    Modul Sistem
                  </TableHead>
                  <TableHead className="w-[140px] text-label-11 uppercase font-mono tracking-wider text-foreground font-semibold py-2">
                    Bagian
                  </TableHead>
                  <TableHead className="w-[240px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2">
                    Deskripsi Operasional
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Superadmin
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Direksi
                  </TableHead>
                  <TableHead className="w-[100px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Senior Mgr
                  </TableHead>
                  <TableHead className="w-[90px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Manager
                  </TableHead>
                  <TableHead className="w-[90px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Supervisor
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40">
                    Staf
                  </TableHead>
                  <TableHead className="w-[85px] text-center text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-2 border-l border-border/40 pr-4">
                    Pelaksana
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatrix.map((item) => {
                  const bagMeta = BAGIAN_METAS[(item.bagian as BagianFilter) || 'UMUM'] ?? BAGIAN_METAS.UMUM;
                  return (
                    <TableRow
                      key={item.modulKey}
                      className="border-b border-border/70 hover:bg-muted/20 transition-colors h-10"
                    >
                      {/* 1. Modul Info */}
                      <TableCell className="py-2 pl-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-label-13 font-semibold text-foreground">
                            {item.modulNama}
                          </span>
                          <span className="font-mono text-label-11 text-muted-foreground">
                            {item.modulKey}
                          </span>
                        </div>
                      </TableCell>

                      {/* 2. Kolom Badge Bagian Terpisah */}
                      <TableCell className="py-2">
                        <Badge variant={bagMeta.badgeVariant} size="sm" className="font-medium">
                          {bagMeta.shortLabel}
                        </Badge>
                      </TableCell>

                      {/* 3. Deskripsi */}
                      <TableCell className="py-2 text-copy-12 text-muted-foreground">
                        {item.deskripsi}
                      </TableCell>

                      {/* 4. Superadmin */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.superadmin}
                            onCheckedChange={() => togglePermission(item.modulKey, 'superadmin')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>

                      {/* 5. Direksi */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.direksi}
                            onCheckedChange={() => togglePermission(item.modulKey, 'direksi')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>

                      {/* 6. Senior Manager */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.seniorManager}
                            onCheckedChange={() => togglePermission(item.modulKey, 'seniorManager')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>

                      {/* 7. Manager */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.manager}
                            onCheckedChange={() => togglePermission(item.modulKey, 'manager')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>

                      {/* 8. Supervisor */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.supervisor}
                            onCheckedChange={() => togglePermission(item.modulKey, 'supervisor')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>

                      {/* 9. Staff */}
                      <TableCell className="py-2 text-center border-l border-border/40">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.staff}
                            onCheckedChange={() => togglePermission(item.modulKey, 'staff')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>

                      {/* 10. Pelaksana */}
                      <TableCell className="py-2 text-center border-l border-border/40 pr-4">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={item.pelaksana}
                            onCheckedChange={() => togglePermission(item.modulKey, 'pelaksana')}
                            disabled={!bisaEdit || saving}
                            className="size-4 cursor-pointer data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 5. Floating Bottom Save Bar (Geist Toast Dock) */}
      {(hasChanges || hasUserPermChanges) && bisaEdit && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border px-4 py-2.5 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-(--ds-amber-700) animate-pulse" />
            <span className="text-label-13 font-semibold text-foreground">
              {activeTabMode === 'USER_OVERRIDE'
                ? 'Terdapat modifikasi hak akses pengguna belum tersimpan'
                : `${changedItems.length} modul matriks jabatan telah diubah`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={activeTabMode === 'USER_OVERRIDE' ? resetAllToDefault : discardChanges}
              disabled={saving || savingUserPerms}
              className="h-8 text-label-12"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={activeTabMode === 'USER_OVERRIDE' ? saveUserPermissions : saveChanges}
              disabled={saving || savingUserPerms}
              className="h-8 gap-1.5 text-label-12 bg-(--ds-green-700) hover:bg-(--ds-green-800) text-white font-medium"
            >
              {saving || savingUserPerms ? (
                <>
                  <Spinner className="size-3.5 text-white" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Simpan Perubahan ke Database</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
