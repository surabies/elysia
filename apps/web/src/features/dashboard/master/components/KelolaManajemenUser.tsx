'use client';

import * as React from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
  Edit2,
  Mail,
  Building,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
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
} from '@/components/ui/dialog';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { cn } from '@/lib/utils';
import type { UserManagementItem } from '@/server/services/master/master-extended.service';

const ALL_ROLES = [
  'SUPERADMIN',
  'EXECUTIVE',
  'VERIFIKATOR_3',
  'VERIFIKATOR_2',
  'VERIFIKATOR_1',
  'STAFF_ADMIN_BILLING',
  'PENCATAT',
  'PELAKSANA',
  'USER',
] as const;

export function KelolaManajemenUser() {
  const [users, setUsers] = React.useState<UserManagementItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('ALL');

  const [editUser, setEditUser] = React.useState<UserManagementItem | null>(null);
  const [selectedRole, setSelectedRole] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master/users');
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const bukaEditRole = (userItem: UserManagementItem) => {
    setEditUser(userItem);
    setSelectedRole(userItem.role);
  };

  const simpanRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    // Simulasikan atau panggil update endpoint jika tersedia
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, role: selectedRole } : u))
      );
      setSaving(false);
      setEditUser(null);
    }, 400);
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search.trim() ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(search.toLowerCase()));

      const matchRole = filterRole === 'ALL' || u.role === filterRole;

      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  return (
    <PageContainer className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-heading-20 text-foreground">
            Manajemen Akun Pengguna & Hak Akses
          </h1>
          <p className="text-copy-13 text-muted-foreground mt-1">
            Pengelolaan akun staf billing, supervisor verifikator, manager cabang, direksi, dan operator.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          className="w-fit"
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Segarkan
        </Button>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-label-12 text-muted-foreground">Filter Peran:</span>
          <NativeSelect
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            size="sm"
          >
            <NativeSelectOption value="ALL">Semua Peran ({users.length})</NativeSelectOption>
            {ALL_ROLES.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {r}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            size="sm"
            placeholder="Cari nama, email, jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
      </div>

      {/* 3. Table Area */}
      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-border text-muted-foreground text-copy-13">
          Tidak ada pengguna yang sesuai pencarian.
        </Card>
      ) : (
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pengguna</TableHead>
                <TableHead>Email Akun</TableHead>
                <TableHead>Peran RBAC</TableHead>
                <TableHead>Jabatan & Unit Kerja</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full border border-border bg-(--ds-gray-100) text-foreground flex items-center justify-center text-label-11 shrink-0">
                        {(userItem.name || userItem.email).slice(0, 2).toUpperCase()}
                      </div>
                      <span>{userItem.name || 'User Tanpa Nama'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-label-12 text-muted-foreground">
                    {userItem.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        userItem.role === 'SUPERADMIN'
                          ? 'default'
                          : userItem.role.startsWith('VERIFIKATOR')
                          ? 'secondary'
                          : 'outline'
                      }
                      className="font-mono"
                    >
                      {userItem.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="text-label-13 text-foreground block">{userItem.jabatan}</span>
                    <span className="text-copy-12">{userItem.unitKerja}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={userItem.status === 'AKTIF' ? 'outline' : 'secondary'}
                      className={cn(
                        userItem.status === 'AKTIF'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400'
                          : 'bg-(--ds-gray-100) text-muted-foreground'
                      )}
                    >
                      {userItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => bukaEditRole(userItem)}
                    >
                      <Key className="size-3" />
                      Ubah Peran
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 4. Edit Role Dialog */}
      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        {editUser && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Ubah Peran Otorisasi Pengguna
              </DialogTitle>
              <DialogDescription>
                Tetapkan tingkatan akses sistem untuk {editUser.name} ({editUser.email}).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={simpanRole} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-label-13 text-foreground block">
                  Pilih Peran Sistem (Role RBAC)
                </label>
                <NativeSelect
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full"
                >
                  {ALL_ROLES.map((r) => (
                    <NativeSelectOption key={r} value={r}>
                      {r}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>

              <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3 text-muted-foreground text-copy-12 space-y-1">
                <p className="text-label-12 text-foreground">Keterangan Tingkat Akses:</p>
                <p>• VERIFIKATOR_1: Supervisor (Screening anomali Ring 1)</p>
                <p>• VERIFIKATOR_2: Manager Cabang (Approval Ring 2)</p>
                <p>• VERIFIKATOR_3: Senior Manager (Pengesahan Ring 3)</p>
                <p>• STAFF_ADMIN_BILLING: Akses penuh closing, koreksi, dan manual ADD</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditUser(null)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                >
                  {saving && <Spinner className="size-3.5" />}
                  Simpan Peran
                </Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </PageContainer>
  );
}
