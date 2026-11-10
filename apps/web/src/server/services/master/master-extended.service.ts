/**
 * Service: Master Data Lanjutan (Urutan Rute, Kode Kelainan, User Management, Matriks Otorisasi)
 * Lapisan: 2. Service Layer (Drizzle ORM)
 */

import { eq, and, sql, asc, desc } from 'drizzle-orm';
import {
  db,
  pelanggan,
  ruteCater,
  masterKondisiCatat,
  user,
  userRoles,
  pegawai,
  daftarCatat,
  rolePermissions,
  type AppRole,
} from '@cater/db';

export interface PelangganUrutanItem {
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  urutan: number;
  noMeter: string | null;
}

export interface KelainanMasterItem {
  kodeTmss: string;
  nama: string;
  kategori: string;
  isKendalaAkses: boolean;
  triggerBacaMandiri: boolean;
  deskripsi: string | null;
  aktif: boolean;
}

export interface UserManagementItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  roles?: string[];
  jabatan: string | null;
  unitKerja: string | null;
  nip?: string | null;
  noHp?: string | null;
  status: 'AKTIF' | 'NONAKTIF';
  createdAt: string;
}

export interface MatriksHakAksesItem {
  id?: string;
  modulKey: string;
  modulNama: string;
  modul?: string; // kompatibilitas label
  kategori: string;
  deskripsi: string;
  urutan?: number;
  superadmin: boolean;
  staffBilling: boolean;
  verifikator1: boolean;
  verifikator2: boolean;
  verifikator3: boolean;
  executive: boolean;
  pelaksana: boolean;
  updatedAt?: string | null;
}

const DEFAULT_MATRIKS_RBAC: Omit<MatriksHakAksesItem, 'id' | 'updatedAt'>[] = [
  {
    modulKey: 'monitoring_gis',
    modulNama: 'GIS & Monitoring Cater',
    kategori: 'OPERASIONAL',
    deskripsi: 'Live tracking & progres rute',
    urutan: 1,
    superadmin: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: true,
    pelaksana: true,
  },
  {
    modulKey: 'verif_ring1',
    modulNama: 'Verifikasi Ring 1',
    kategori: 'VERIFIKASI',
    deskripsi: 'Screening anomali & survei ulang',
    urutan: 2,
    superadmin: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: false,
    pelaksana: false,
  },
  {
    modulKey: 'verif_ring2',
    modulNama: 'Verifikasi Ring 2',
    kategori: 'VERIFIKASI',
    deskripsi: 'Approval deviasi cabang wilayah',
    urutan: 3,
    superadmin: true,
    staffBilling: false,
    verifikator1: false,
    verifikator2: true,
    verifikator3: true,
    executive: false,
    pelaksana: false,
  },
  {
    modulKey: 'verif_ring3',
    modulNama: 'Verifikasi Ring 3',
    kategori: 'VERIFIKASI',
    deskripsi: 'Pengesahan final billing DRD',
    urutan: 4,
    superadmin: true,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: true,
    executive: true,
    pelaksana: false,
  },
  {
    modulKey: 'verif_mandiri',
    modulNama: 'Verifikasi Mandiri',
    kategori: 'VERIFIKASI',
    deskripsi: 'Validasi lapor meter warga',
    urutan: 5,
    superadmin: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: false,
    pelaksana: false,
  },
  {
    modulKey: 'manual_add',
    modulNama: 'Manual ADD & Taksasi',
    kategori: 'OPERASIONAL',
    deskripsi: 'Input darurat & taksasi rute',
    urutan: 6,
    superadmin: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: false,
    verifikator3: false,
    executive: false,
    pelaksana: false,
  },
  {
    modulKey: 'koreksi_stand',
    modulNama: 'Koreksi Stand Meter',
    kategori: 'OPERASIONAL',
    deskripsi: 'Revisi angka stand & audit trail',
    urutan: 7,
    superadmin: true,
    staffBilling: true,
    verifikator1: false,
    verifikator2: true,
    verifikator3: true,
    executive: false,
    pelaksana: false,
  },
  {
    modulKey: 'closing_drd',
    modulNama: 'Tutup Periode & DRD',
    kategori: 'BILLING',
    deskripsi: 'Kunci periode & buat DRD',
    urutan: 8,
    superadmin: true,
    staffBilling: true,
    verifikator1: false,
    verifikator2: false,
    verifikator3: true,
    executive: false,
    pelaksana: false,
  },
  {
    modulKey: 'laporan_drd',
    modulNama: 'Laporan & Analitik',
    kategori: 'BILLING',
    deskripsi: 'Rekapitulasi rekening & analitik',
    urutan: 9,
    superadmin: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: true,
    pelaksana: false,
  },
  {
    modulKey: 'pengaduan_air',
    modulNama: 'Pengaduan & Tiket',
    kategori: 'OPERASIONAL',
    deskripsi: 'Keluhan pelanggan & tindak lanjut',
    urutan: 10,
    superadmin: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: true,
    pelaksana: true,
  },
  {
    modulKey: 'master_konfigurasi',
    modulNama: 'Master Data & Akun',
    kategori: 'MASTER',
    deskripsi: 'Kelola user, rute & tarif',
    urutan: 11,
    superadmin: true,
    staffBilling: true,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
    pelaksana: false,
  },
];

export class MasterExtendedService {
  /**
   * 1. Mengambil urutan jalan pembacaan meter pelanggan dalam satu rute
   */
  async getUrutanRute(ruteKode: string): Promise<{ ruteKode: string; items: PelangganUrutanItem[] }> {
    // Ambil pelanggan pada rute tersebut
    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noMeter: pelanggan.noMeter,
      })
      .from(pelanggan)
      .where(eq(pelanggan.ruteKode, ruteKode))
      .orderBy(asc(pelanggan.nolg))
      .limit(200);

    // Ambil urutan dari daftarCatat jika ada
    const dpmRows = await db
      .select({
        nolg: daftarCatat.nolg,
        urutan: daftarCatat.urutan,
      })
      .from(daftarCatat)
      .where(eq(daftarCatat.ruteKode, ruteKode));

    const urutanMap = new Map(dpmRows.map((d) => [d.nolg, d.urutan]));

    const items: PelangganUrutanItem[] = rows.map((r, idx) => ({
      nolg: r.nolg,
      nama: r.nama,
      alamat: r.alamat,
      tarifKode: r.tarifKode,
      ruteKode: r.ruteKode,
      urutan: urutanMap.get(r.nolg) ?? idx + 1,
      noMeter: r.noMeter,
    }));

    // Urutkan berdasarkan nomor langkah
    items.sort((a, b) => a.urutan - b.urutan);

    return {
      ruteKode,
      items,
    };
  }

  /**
   * 2. Simpan urutan langkah baru rute
   */
  async simpanUrutanRute(
    ruteKode: string,
    items: { nolg: string; urutan: number }[],
    periode: string = '202601'
  ): Promise<{ success: boolean; totalUpdated: number }> {
    for (const item of items) {
      const dpmId = `dpm-${periode}-${item.nolg}`;
      await db
        .insert(daftarCatat)
        .values({
          id: dpmId,
          periode,
          nolg: item.nolg,
          ruteKode,
          urutan: item.urutan,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [daftarCatat.periode, daftarCatat.nolg],
          set: {
            urutan: item.urutan,
            ruteKode,
            updatedAt: new Date(),
          },
        });
    }

    return {
      success: true,
      totalUpdated: items.length,
    };
  }

  /**
   * 3. Ambil seluruh master kode kelainan
   */
  async getDaftarKelainan(): Promise<KelainanMasterItem[]> {
    const list = await db
      .select()
      .from(masterKondisiCatat)
      .orderBy(masterKondisiCatat.kodeTmss);

    return list.map((k) => ({
      kodeTmss: k.kodeTmss,
      nama: k.nama,
      kategori: k.kategori,
      isKendalaAkses: k.isKendalaAkses,
      triggerBacaMandiri: k.triggerBacaMandiri,
      deskripsi: k.deskripsi,
      aktif: k.aktif,
    }));
  }

  /**
   * 4. Update status atau data kelainan
   */
  async updateKelainan(
    kodeTmss: string,
    input: Partial<Omit<KelainanMasterItem, 'kodeTmss'>>
  ): Promise<{ success: boolean }> {
    await db
      .update(masterKondisiCatat)
      .set({
        ...input,
      })
      .where(eq(masterKondisiCatat.kodeTmss, kodeTmss));

    return { success: true };
  }

  /**
   * 5. Ambil daftar users & pegawai
   */
  async getDaftarUsers(): Promise<UserManagementItem[]> {
    const userList = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.name);

    const ROLE_PRIORITY: Record<string, number> = {
      SUPERADMIN: 100,
      EXECUTIVE: 90,
      VERIFIKATOR_3: 80,
      VERIFIKATOR_2: 70,
      VERIFIKATOR_1: 60,
      STAFF_ADMIN_BILLING: 50,
      PENCATAT: 40,
      PELAKSANA: 30,
      USER: 10,
    };

    const rolesList = await db.select().from(userRoles);
    const pegawaiList = await db.select().from(pegawai);

    const userRolesMap = new Map<string, string[]>();
    for (const r of rolesList) {
      const list = userRolesMap.get(r.userId) ?? [];
      list.push(r.role);
      userRolesMap.set(r.userId, list);
    }

    const roleMap = new Map<string, string>();
    for (const [userId, uRoles] of userRolesMap.entries()) {
      const sorted = [...uRoles].sort(
        (a, b) => (ROLE_PRIORITY[b] ?? 0) - (ROLE_PRIORITY[a] ?? 0)
      );
      roleMap.set(userId, sorted[0] ?? 'USER');
    }

    const pegMap = new Map<
      string,
      {
        jabatan: string | null;
        unit: string | null;
        aktif: boolean;
        nip: string | null;
        noHp: string | null;
      }
    >();
    for (const p of pegawaiList) {
      if (p.userId) {
        pegMap.set(p.userId, {
          jabatan: p.jabatanNama,
          unit: p.unitKerja,
          aktif: p.aktif,
          nip: p.nip,
          noHp: p.noHp,
        });
      }
    }

    return userList.map((u) => {
      const p = pegMap.get(u.id);
      const assignedRoles = userRolesMap.get(u.id) ?? ['USER'];
      const primaryRole = roleMap.get(u.id) ?? 'USER';
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: primaryRole,
        roles: assignedRoles,
        jabatan: p?.jabatan ?? 'Staf Operasional',
        unitKerja: p?.unit ?? 'Divisi Hubungan Langganan',
        nip: p?.nip ?? null,
        noHp: p?.noHp ?? null,
        status: p?.aktif === false ? 'NONAKTIF' : 'AKTIF',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  /**
   * 5b. Perbarui Peran Sistem (Role RBAC) dan Status Akun Pengguna
   */
  async updateUserRoleAndStatus(
    userId: string,
    newRole: AppRole,
    status?: 'AKTIF' | 'NONAKTIF'
  ) {
    // 1. Perbarui peran pada user_roles (hapus peranan lama, set peranan baru)
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    await db.insert(userRoles).values({
      userId,
      role: newRole,
      createdAt: new Date(),
    });

    // 2. Sinkronkan status ke tabel pegawai jika akun tertaut profil pegawai
    if (status) {
      const isAktif = status === 'AKTIF';
      await db
        .update(pegawai)
        .set({ aktif: isAktif, updatedAt: new Date() })
        .where(eq(pegawai.userId, userId));
    }

    return {
      success: true,
      userId,
      role: newRole,
      status: status ?? 'AKTIF',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper: Pastikan tabel role_permissions tersedia di Postgres
   */
  private async ensureRolePermissionsTable() {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" text PRIMARY KEY,
        "modul_key" varchar(50) NOT NULL UNIQUE,
        "modul_nama" varchar(100) NOT NULL,
        "kategori" varchar(50) NOT NULL DEFAULT 'OPERASIONAL',
        "deskripsi" text,
        "urutan" numeric(4, 0) NOT NULL DEFAULT '0',
        "superadmin" boolean NOT NULL DEFAULT true,
        "staff_billing" boolean NOT NULL DEFAULT false,
        "verifikator_1" boolean NOT NULL DEFAULT false,
        "verifikator_2" boolean NOT NULL DEFAULT false,
        "verifikator_3" boolean NOT NULL DEFAULT false,
        "executive" boolean NOT NULL DEFAULT false,
        "pelaksana" boolean NOT NULL DEFAULT false,
        "updated_by" text,
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
    `);
  }

  /**
   * 6. Matriks Otorisasi RBAC Resmi PDAM (Persisten Database)
   */
  async getMatriksOtorisasi(): Promise<MatriksHakAksesItem[]> {
    await this.ensureRolePermissionsTable();

    let rows = await db
      .select()
      .from(rolePermissions)
      .orderBy(asc(rolePermissions.urutan));

    if (rows.length === 0) {
      // Inisialisasi default items jika tabel masih kosong
      for (const item of DEFAULT_MATRIKS_RBAC) {
        await db
          .insert(rolePermissions)
          .values({
            id: `perm-${item.modulKey}`,
            modulKey: item.modulKey,
            modulNama: item.modulNama,
            kategori: item.kategori,
            deskripsi: item.deskripsi,
            urutan: String(item.urutan),
            superadmin: item.superadmin,
            staffBilling: item.staffBilling,
            verifikator1: item.verifikator1,
            verifikator2: item.verifikator2,
            verifikator3: item.verifikator3,
            executive: item.executive,
            pelaksana: item.pelaksana,
          })
          .onConflictDoNothing();
      }

      rows = await db
        .select()
        .from(rolePermissions)
        .orderBy(asc(rolePermissions.urutan));
    }

    return rows.map((r) => ({
      id: r.id,
      modulKey: r.modulKey,
      modulNama: r.modulNama,
      modul: r.modulNama,
      kategori: r.kategori,
      deskripsi: r.deskripsi ?? '',
      urutan: Number(r.urutan),
      superadmin: r.superadmin,
      staffBilling: r.staffBilling,
      verifikator1: r.verifikator1,
      verifikator2: r.verifikator2,
      verifikator3: r.verifikator3,
      executive: r.executive,
      pelaksana: r.pelaksana,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
    }));
  }

  /**
   * 7. Simpan Modifikasi Matriks Otorisasi RBAC
   */
  async updateMatriksOtorisasi(
    items: MatriksHakAksesItem[],
    userId?: string
  ): Promise<{ success: boolean; count: number }> {
    await this.ensureRolePermissionsTable();

    for (const item of items) {
      await db
        .insert(rolePermissions)
        .values({
          id: item.id || `perm-${item.modulKey}`,
          modulKey: item.modulKey,
          modulNama: item.modulNama || item.modul || item.modulKey,
          kategori: item.kategori || 'OPERASIONAL',
          deskripsi: item.deskripsi,
          urutan: String(item.urutan ?? 0),
          superadmin: item.superadmin,
          staffBilling: item.staffBilling,
          verifikator1: item.verifikator1,
          verifikator2: item.verifikator2,
          verifikator3: item.verifikator3,
          executive: item.executive,
          pelaksana: item.pelaksana,
          updatedBy: userId ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: rolePermissions.modulKey,
          set: {
            superadmin: item.superadmin,
            staffBilling: item.staffBilling,
            verifikator1: item.verifikator1,
            verifikator2: item.verifikator2,
            verifikator3: item.verifikator3,
            executive: item.executive,
            pelaksana: item.pelaksana,
            updatedBy: userId ?? null,
            updatedAt: new Date(),
          },
        });
    }

    return { success: true, count: items.length };
  }
}

export const masterExtendedService = new MasterExtendedService();
