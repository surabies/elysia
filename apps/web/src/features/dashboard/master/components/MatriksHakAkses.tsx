'use client';

import * as React from 'react';
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

export interface MatriksHakAksesProps {
  userRole?: string;
  userRoles?: string[];
}

type KategoriFilter = 'SEMUA' | 'VERIFIKASI' | 'OPERASIONAL' | 'BILLING' | 'MASTER';

interface RoleCol {
  key: keyof Pick<
    MatriksHakAksesItem,
    | 'superadmin'
    | 'staffBilling'
    | 'verifikator1'
    | 'verifikator2'
    | 'verifikator3'
    | 'executive'
    | 'pelaksana'
  >;
  label: string;
}

const ROLES_COLUMNS: RoleCol[] = [
  { key: 'superadmin', label: 'SUPERADMIN' },
  { key: 'staffBilling', label: 'STAFF BILLING' },
  { key: 'verifikator1', label: 'RING 1' },
  { key: 'verifikator2', label: 'RING 2' },
  { key: 'verifikator3', label: 'RING 3' },
  { key: 'executive', label: 'EXECUTIVE' },
  { key: 'pelaksana', label: 'PELAKSANA' },
];

export function MatriksHakAkses({
  userRole = 'USER',
  userRoles = [],
}: MatriksHakAksesProps) {
  const [matrix, setMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [originalMatrix, setOriginalMatrix] = React.useState<MatriksHakAksesItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedKategori, setSelectedKategori] = React.useState<KategoriFilter>('SEMUA');

  // Menilai apakah user memiliki wewenang untuk mengedit matriks izin (Superadmin, Executive, Verifikator 3)
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

  React.useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // Deteksi Perubahan Data
  const hasChanges = React.useMemo(() => {
    if (originalMatrix.length === 0 || matrix.length === 0) return false;
    return JSON.stringify(matrix) !== JSON.stringify(originalMatrix);
  }, [matrix, originalMatrix]);

  // Daftar item yang berubah
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

  // Handler Toggle Izin Role
  const togglePermission = (
    modulKey: string,
    roleKey: keyof Pick<
      MatriksHakAksesItem,
      | 'superadmin'
      | 'staffBilling'
      | 'verifikator1'
      | 'verifikator2'
      | 'verifikator3'
      | 'executive'
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
        return {
          ...item,
          [roleKey]: !item[roleKey],
        };
      })
    );
  };

  // Batalkan Semua Perubahan
  const discardChanges = () => {
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    toast.info('Perubahan dibatalkan.');
  };

  // Simpan Perubahan ke Database
  const saveChanges = async () => {
    if (!bisaEdit) {
      toast.error('Anda tidak memiliki wewenang untuk menyimpan perubahan otorisasi.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/master/otorisasi', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: changedItems,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Matriks hak akses & ring approval berhasil diperbarui!');
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

  // Filter modul berdasarkan kategori dan pencarian
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

  // Statistik jumlah per kategori
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

  // Nav Tabs Vercel DRD Style
  const navTabs = React.useMemo(
    () => [
      { id: 'SEMUA' as KategoriFilter, label: 'Semua Modul', count: countPerKategori.SEMUA },
      { id: 'VERIFIKASI' as KategoriFilter, label: 'Verifikasi (Ring 1-3)', count: countPerKategori.VERIFIKASI },
      { id: 'OPERASIONAL' as KategoriFilter, label: 'Operasional Lapangan', count: countPerKategori.OPERASIONAL },
      { id: 'BILLING' as KategoriFilter, label: 'Billing & DRD', count: countPerKategori.BILLING },
      { id: 'MASTER' as KategoriFilter, label: 'Master Konfigurasi', count: countPerKategori.MASTER },
    ],
    [countPerKategori]
  );

  // Understated Category Badge Helper: Hanya aksen dot dan teks bersih (Tanpa box/pill)
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
      {/* 1. Header Bar & Vercel DRD Style Underline Nav Tabs sitting at the Border */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-heading-20 text-foreground tracking-tight">
              Matriks Hak Akses & Ring Approval
            </h1>
            <p className="text-copy-13 text-muted-foreground max-w-3xl">
              Pengaturan perizinan modul operasional, alur verifikasi bertingkat (Ring 1 ➔ Ring 2 ➔ Ring 3),
              dan pembagian hak akses berdasarkan prinsip keamanan *Least Privilege*.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-1">
            {/* Badge Otoritas Sesi - Clean & Minimalist */}
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
              onClick={fetchMatrix}
              disabled={loading}
              className="h-8 gap-1.5 font-mono text-label-12 border-border hover:bg-muted"
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* Vercel DRD Style Navigation Tabs at the Border */}
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
      </div>

      {/* 2. Visualisasi Pipeline Ring Approval (Minimalist & Understated SOP Workflow) */}
      <Card className="rounded-lg border border-border bg-card/60 p-4 shadow-2xs">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <h3 className="text-label-12 font-mono uppercase tracking-wider text-foreground font-medium">
                Alur Otorisasi Verifikasi Berjenjang (3-Tier Ring Approval)
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              SOP Standar PDAM Tirtawening
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tahap 1 · Lapangan
                </span>
                <span className="text-[11px] font-mono text-foreground font-medium inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  PENCATAT
                </span>
              </div>
              <p className="text-label-13 font-medium text-foreground">Pencatatan Fisik & Mandiri</p>
              <p className="text-copy-12 text-muted-foreground leading-relaxed">
                Petugas catat meter via Mobile App atau Warga lapor mandiri via web publik.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tahap 2 · Ring 1
                </span>
                <span className="text-[11px] font-mono text-foreground font-medium inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-sky-500" />
                  SUPERVISOR
                </span>
              </div>
              <p className="text-label-13 font-medium text-foreground">Screening Awal & Mandiri</p>
              <p className="text-copy-12 text-muted-foreground leading-relaxed">
                Filter anomali stand ekstrem, verifikasi foto meter warga, atau perintah Re-survey.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tahap 3 · Ring 2
                </span>
                <span className="text-[11px] font-mono text-foreground font-medium inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  MGR. CABANG
                </span>
              </div>
              <p className="text-label-13 font-medium text-foreground">Approval Wilayah & Koreksi</p>
              <p className="text-copy-12 text-muted-foreground leading-relaxed">
                Otorisasi deviasi konsumsi tinggi/rendah dan persetujuan penyesuaian angka bacaan.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Tahap 4 · Ring 3
                </span>
                <span className="text-[11px] font-mono text-foreground font-medium inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  SR. MANAGER
                </span>
              </div>
              <p className="text-label-13 font-medium text-foreground">Pengesahan Final & DRD</p>
              <p className="text-copy-12 text-muted-foreground leading-relaxed">
                Otorisasi final rekening billing resmi dan penguncian tutup buku (DRD Locking).
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Toolbar Pencarian Modul */}
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
          Menampilkan <span className="text-foreground font-semibold">{filteredMatrix.length}</span> dari{' '}
          {matrix.length} modul
        </div>
      </div>

      {/* 4. Tabel Matriks Hak Akses: Dedicated Separated Columns (NO Multi-line Stacking) */}
      <Card className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
            <Spinner className="size-5 text-foreground" />
            <span className="text-label-12 font-mono">Memuat konfigurasi hak akses RBAC...</span>
          </div>
        ) : filteredMatrix.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <AlertCircle className="size-6 text-muted-foreground/60" />
            <p className="text-label-13 font-medium text-foreground">
              Tidak ada modul yang sesuai dengan kriteria pencarian.
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => setSearchQuery('')}
                className="mt-2 font-mono text-label-12"
              >
                Reset Pencarian
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {/* Dedicated Column 1: Modul */}
                  <TableHead className="w-[200px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3 pl-4">
                    Modul Sistem
                  </TableHead>
                  {/* Dedicated Column 2: Kategori */}
                  <TableHead className="w-[120px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                    Kategori
                  </TableHead>
                  {/* Dedicated Column 3: Fungsi Otorisasi */}
                  <TableHead className="min-w-[200px] text-label-11 uppercase font-mono tracking-wider text-muted-foreground py-3">
                    Fungsi Otorisasi
                  </TableHead>
                  {/* Role Columns (Clean single line without stacked sublabels or vertical grid lines) */}
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
                    {/* Dedicated Column 1: Nama Modul (Clean single line) */}
                    <TableCell className="py-3 pl-4 text-label-13 font-medium text-foreground whitespace-nowrap">
                      {item.modulNama}
                    </TableCell>

                    {/* Dedicated Column 2: Kategori (Understated Luxury Badge) */}
                    <TableCell className="py-3 whitespace-nowrap">
                      {renderCategoryBadge(item.kategori)}
                    </TableCell>

                    {/* Dedicated Column 3: Deskripsi Otorisasi (Concise & functional) */}
                    <TableCell className="py-3 text-copy-12 text-muted-foreground whitespace-nowrap">
                      {item.deskripsi}
                    </TableCell>

                    {/* Checkbox / Switch Tiap Role (Clean centered switch without vertical grid borders) */}
                    {ROLES_COLUMNS.map((role) => {
                      const isAllowed = Boolean(item[role.key]);
                      return (
                        <TableCell
                          key={role.key}
                          className="text-center align-middle px-3 py-3"
                        >
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

      {/* 5. Floating Action Dock (Minimalist Vercel Bar Saat Ada Perubahan) */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Card className="rounded-lg border border-border bg-background/95 backdrop-blur-md p-3.5 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 pl-1">
              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              <div className="text-label-12">
                <p className="font-semibold text-foreground">
                  {changedItems.length} modul memiliki perubahan izin
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
    </div>
  );
}
