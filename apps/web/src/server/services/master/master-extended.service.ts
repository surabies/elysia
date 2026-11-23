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
  account,
  userRoles,
  pegawai,
  petugasCater,
  daftarCatat,
  rolePermissions,
  userPermissionOverrides,
  getActivePeriode,
  type AppRole,
} from '@cater/db';
import { hashPassword } from 'better-auth/crypto';
import type { UserEffectivePermission } from '@cater/types';

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
  bagian?: string | null;
  wilayahKerja?: string | null;
  level?: string | null;
  nip?: string | null;
  noHp?: string | null;
  status: 'AKTIF' | 'NONAKTIF';
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: AppRole | string;
  roles?: string[];
  nip?: string;
  level?: 'DIREKSI' | 'SENIOR_MANAGER' | 'MANAGER' | 'SUPERVISOR' | 'STAFF_PENYELIA' | 'PELAKSANA';
  bagian?: 'PENCATAT_METER' | 'LANGGANAN' | 'PENAGIHAN' | 'RPM' | 'DISTRIBUSI' | 'UMUM' | string;
  wilayahKerja?: string;
  jabatanNama?: string;
  unitKerja?: string;
  noHp?: string;
  wajibGantiPassword?: boolean;
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
  direksi: boolean;
  seniorManager: boolean;
  manager: boolean;
  supervisor: boolean;
  staff: boolean;
  pelaksana: boolean;
  // Legacy perizinan (backward-compatibility)
  staffBilling?: boolean;
  verifikator1?: boolean;
  verifikator2?: boolean;
  verifikator3?: boolean;
  executive?: boolean;
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
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: true,
  },
  {
    modulKey: 'verif_ring1',
    modulNama: 'Verifikasi Ring 1',
    kategori: 'VERIFIKASI',
    deskripsi: 'Screening anomali & survei ulang',
    urutan: 2,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: false,
  },
  {
    modulKey: 'verif_ring2',
    modulNama: 'Verifikasi Ring 2',
    kategori: 'VERIFIKASI',
    deskripsi: 'Approval deviasi cabang wilayah',
    urutan: 3,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: false,
    staff: false,
    pelaksana: false,
    staffBilling: false,
    verifikator1: false,
    verifikator2: true,
    verifikator3: true,
    executive: false,
  },
  {
    modulKey: 'verif_ring3',
    modulNama: 'Verifikasi Ring 3',
    kategori: 'VERIFIKASI',
    deskripsi: 'Pengesahan final billing DRD',
    urutan: 4,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: false,
    supervisor: false,
    staff: false,
    pelaksana: false,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: true,
    executive: true,
  },
  {
    modulKey: 'verif_mandiri',
    modulNama: 'Verifikasi Mandiri',
    kategori: 'VERIFIKASI',
    deskripsi: 'Validasi lapor meter warga',
    urutan: 5,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: false,
  },
  {
    modulKey: 'manual_add',
    modulNama: 'Manual ADD & Taksasi',
    kategori: 'OPERASIONAL',
    deskripsi: 'Input darurat & taksasi rute',
    urutan: 6,
    superadmin: true,
    direksi: false,
    seniorManager: false,
    manager: false,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: true,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  {
    modulKey: 'koreksi_stand',
    modulNama: 'Koreksi Stand Meter',
    kategori: 'OPERASIONAL',
    deskripsi: 'Revisi angka stand & audit trail',
    urutan: 7,
    superadmin: true,
    direksi: false,
    seniorManager: true,
    manager: true,
    supervisor: false,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: false,
    verifikator2: true,
    verifikator3: true,
    executive: false,
  },
  {
    modulKey: 'closing_drd',
    modulNama: 'Tutup Periode & DRD',
    kategori: 'BILLING',
    deskripsi: 'Kunci periode & buat DRD',
    urutan: 8,
    superadmin: true,
    direksi: false,
    seniorManager: true,
    manager: false,
    supervisor: false,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: false,
    verifikator2: false,
    verifikator3: true,
    executive: false,
  },
  {
    modulKey: 'laporan_drd',
    modulNama: 'Laporan & Analitik',
    kategori: 'BILLING',
    deskripsi: 'Rekapitulasi rekening & analitik',
    urutan: 9,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: true,
  },
  {
    modulKey: 'pengaduan_air',
    modulNama: 'Pengaduan & Tiket',
    kategori: 'OPERASIONAL',
    deskripsi: 'Keluhan pelanggan & tindak lanjut',
    urutan: 10,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: true,
    staffBilling: true,
    verifikator1: true,
    verifikator2: true,
    verifikator3: true,
    executive: true,
  },
  {
    modulKey: 'master_konfigurasi',
    modulNama: 'Master Data & Akun',
    kategori: 'MASTER',
    deskripsi: 'Kelola user, rute & tarif',
    urutan: 11,
    superadmin: true,
    direksi: true,
    seniorManager: false,
    manager: false,
    supervisor: false,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  // --- Modul Bagian RPM (Rekening & Pengendalian Meter) ---
  {
    modulKey: 'rpm_ganti_meter',
    modulNama: 'Penggantian Meter (GWM)',
    kategori: 'RPM',
    deskripsi: 'Input & validasi fisik meter baru/rusak',
    urutan: 12,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: true,
    staffBilling: true,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  {
    modulKey: 'rpm_tera_kalibrasi',
    modulNama: 'Uji Akurasi & Tera Meter',
    kategori: 'RPM',
    deskripsi: 'Pengujian meteran air & kalibrasi lab',
    urutan: 13,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  // --- Modul Bagian Distribusi / Sub Zona ---
  {
    modulKey: 'distribusi_gis_pipa',
    modulNama: 'GIS Jaringan Pipa & Valve',
    kategori: 'DISTRIBUSI',
    deskripsi: 'Pemetaan pipa transmisi & katup distribusi',
    urutan: 14,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: true,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  {
    modulKey: 'distribusi_dma_tekanan',
    modulNama: 'Monitoring DMA & Tekanan Air',
    kategori: 'DISTRIBUSI',
    deskripsi: 'Logger tekanan air sub zona & indikasi bocor',
    urutan: 15,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  // --- Modul Bagian Langganan (Hublang) ---
  {
    modulKey: 'langganan_pasang_baru',
    modulNama: 'Pasang Sambungan Baru (PB)',
    kategori: 'LANGGANAN',
    deskripsi: 'Survei teknis & persetujuan sambungan baru',
    urutan: 16,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  {
    modulKey: 'langganan_mutasi_tarif',
    modulNama: 'Mutasi Golongan & Balik Nama',
    kategori: 'LANGGANAN',
    deskripsi: 'Perubahan tarif pelanggan & status kepemilikan',
    urutan: 17,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: false,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
  // --- Modul Bagian Penagihan ---
  {
    modulKey: 'penagihan_piutang_sp',
    modulNama: 'Piutang & Surat Peringatan (SP)',
    kategori: 'PENAGIHAN',
    deskripsi: 'Monitoring tunggakan & cetak surat segel',
    urutan: 18,
    superadmin: true,
    direksi: true,
    seniorManager: true,
    manager: true,
    supervisor: true,
    staff: true,
    pelaksana: false,
    staffBilling: true,
    verifikator1: false,
    verifikator2: false,
    verifikator3: false,
    executive: false,
  },
];

export class MasterExtendedService {
  /**
   * 1. Mengambil urutan jalan pembacaan meter pelanggan dalam satu rute
   */
  async getUrutanRute(ruteKode: string): Promise<{ ruteKode: string; items: PelangganUrutanItem[] }> {
    const rows = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        noMeter: pelanggan.noMeter,
      })
      .from(pelanggan)
      .where(eq(pelanggan.ruteKode, ruteKode))
      .orderBy(asc(pelanggan.noUrutRute), asc(pelanggan.nolg))
      .limit(500);

    const items: PelangganUrutanItem[] = rows.map((r, idx) => ({
      nolg: r.nolg,
      nama: r.nama,
      alamat: r.alamat,
      tarifKode: r.tarifKode,
      ruteKode: r.ruteKode,
      urutan: r.noUrutRute && r.noUrutRute > 0 ? r.noUrutRute : idx + 1,
      noMeter: r.noMeter,
    }));

    items.sort((a, b) => a.urutan - b.urutan);

    return {
      ruteKode,
      items,
    };
  }

  /**
   * 2. Simpan urutan langkah baru rute secara permanen di master pelanggan & DPM periode berjalan
   */
  async simpanUrutanRute(
    ruteKode: string,
    items: { nolg: string; urutan: number }[],
    periode?: string
  ): Promise<{ success: boolean; totalUpdated: number }> {
    const targetPeriode = periode || (await getActivePeriode());

    await db.transaction(async (tx) => {
      for (const item of items) {
        // 1. Simpan permanen di master pelanggan.no_urut_rute
        await tx
          .update(pelanggan)
          .set({
            noUrutRute: item.urutan,
            ruteKode,
            updatedAt: new Date(),
          })
          .where(eq(pelanggan.nolg, item.nolg));

        // 2. Sinkronkan juga ke daftar_catat periode berjalan jika pelanggan ada di DPM
        await tx
          .update(daftarCatat)
          .set({
            urutan: item.urutan,
            ruteKode,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(daftarCatat.periode, targetPeriode),
              eq(daftarCatat.nolg, item.nolg)
            )
          );
      }
    });

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
      DIREKSI: 90,
      EXECUTIVE: 90,
      SENIOR_MANAGER: 80,
      VERIFIKATOR_3: 80,
      MANAGER: 70,
      VERIFIKATOR_2: 70,
      SUPERVISOR: 60,
      VERIFIKATOR_1: 60,
      STAFF: 50,
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
        bagian: string | null;
        wilayahKerja: string | null;
        level: string | null;
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
          bagian: (p as any).bagian ?? 'UMUM',
          wilayahKerja: (p as any).wilayahKerja ?? 'WILAYAH_5',
          level: p.level,
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
        bagian: p?.bagian ?? 'UMUM',
        wilayahKerja: p?.wilayahKerja ?? 'WILAYAH_5',
        level: p?.level ?? 'STAFF_PENYELIA',
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
    newRole: AppRole | string,
    status?: 'AKTIF' | 'NONAKTIF',
    details?: {
      bagian?: string;
      wilayahKerja?: string;
      jabatanNama?: string;
      unitKerja?: string;
      level?: any;
    }
  ) {
    // 1. Perbarui peran pada user_roles dengan bridging otomatis
    const rolesToAssign = new Set<string>();
    rolesToAssign.add(newRole);

    if (newRole === 'SUPERVISOR') rolesToAssign.add('VERIFIKATOR_1');
    else if (newRole === 'MANAGER') rolesToAssign.add('VERIFIKATOR_2');
    else if (newRole === 'SENIOR_MANAGER') rolesToAssign.add('VERIFIKATOR_3');
    else if (newRole === 'DIREKSI') rolesToAssign.add('EXECUTIVE');
    else if (newRole === 'STAFF') rolesToAssign.add('STAFF_ADMIN_BILLING');
    else if (newRole === 'VERIFIKATOR_1') rolesToAssign.add('SUPERVISOR');
    else if (newRole === 'VERIFIKATOR_2') rolesToAssign.add('MANAGER');
    else if (newRole === 'VERIFIKATOR_3') rolesToAssign.add('SENIOR_MANAGER');
    else if (newRole === 'EXECUTIVE') rolesToAssign.add('DIREKSI');
    else if (newRole === 'STAFF_ADMIN_BILLING') rolesToAssign.add('STAFF');

    await db.delete(userRoles).where(eq(userRoles.userId, userId));
    for (const r of rolesToAssign) {
      await db.insert(userRoles).values({
        userId,
        role: r as any,
        createdAt: new Date(),
      }).onConflictDoNothing();
    }

    // 2. Sinkronkan status dan data pegawai jika akun tertaut profil pegawai
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (status) {
      updatePayload.aktif = status === 'AKTIF';
    }
    if (details?.bagian) updatePayload.bagian = details.bagian;
    if (details?.wilayahKerja) updatePayload.wilayahKerja = details.wilayahKerja;
    if (details?.jabatanNama) updatePayload.jabatanNama = details.jabatanNama;
    if (details?.unitKerja) updatePayload.unitKerja = details.unitKerja;
    if (details?.level) updatePayload.level = details.level;

    await db
      .update(pegawai)
      .set(updatePayload)
      .where(eq(pegawai.userId, userId));

    return {
      success: true,
      userId,
      role: newRole,
      status: status ?? 'AKTIF',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 5c. Pembuatan Akun Baru (User, Credential Account, Role, Profil Pegawai & Wilayah Scope)
   */
  async createUser(input: CreateUserInput) {
    const emailNorm = input.email.toLowerCase().trim();

    // 1. Validasi Keunikan Email
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, emailNorm))
      .limit(1);

    if (existingUser) {
      throw new Error(`Email ${emailNorm} sudah terdaftar dalam sistem.`);
    }

    // 2. Validasi Keunikan NIP jika diisi
    if (input.nip && input.nip.trim()) {
      const [existingPeg] = await db
        .select({ id: pegawai.id })
        .from(pegawai)
        .where(eq(pegawai.nip, input.nip.trim()))
        .limit(1);

      if (existingPeg) {
        throw new Error(`NIP ${input.nip} sudah digunakan oleh pegawai lain.`);
      }
    }

    if (!input.password || input.password.length < 8) {
      throw new Error('Password minimal harus 8 karakter.');
    }

    const passwordHash = await hashPassword(input.password);
    const userId = crypto.randomUUID();
    const now = new Date();

    // 3. Eksekusi Atomic Transaction
    await db.transaction(async (tx) => {
      // a. Insert User
      await tx.insert(user).values({
        id: userId,
        name: input.name.trim(),
        email: emailNorm,
        emailVerified: true,
        wajibGantiPassword: input.wajibGantiPassword ?? true,
        createdAt: now,
        updatedAt: now,
      });

      // b. Insert Credential Account
      await tx.insert(account).values({
        id: `account-${userId}`,
        userId,
        accountId: userId,
        providerId: 'credential',
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });

      // c. Tentukan Roles & Bridging Otomatis
      const rolesToAssign = new Set<string>();
      if (input.role) rolesToAssign.add(input.role);
      if (input.roles && Array.isArray(input.roles)) {
        input.roles.forEach((r) => rolesToAssign.add(r));
      }

      // Bridging otomatis ke role fungsional verifikasi agar tidak 403 di legacy routes
      if (rolesToAssign.has('SUPERVISOR')) rolesToAssign.add('VERIFIKATOR_1');
      if (rolesToAssign.has('MANAGER')) rolesToAssign.add('VERIFIKATOR_2');
      if (rolesToAssign.has('SENIOR_MANAGER')) rolesToAssign.add('VERIFIKATOR_3');
      if (rolesToAssign.has('DIREKSI')) rolesToAssign.add('EXECUTIVE');
      if (rolesToAssign.has('STAFF')) rolesToAssign.add('STAFF_ADMIN_BILLING');

      if (rolesToAssign.has('VERIFIKATOR_1')) rolesToAssign.add('SUPERVISOR');
      if (rolesToAssign.has('VERIFIKATOR_2')) rolesToAssign.add('MANAGER');
      if (rolesToAssign.has('VERIFIKATOR_3')) rolesToAssign.add('SENIOR_MANAGER');
      if (rolesToAssign.has('EXECUTIVE')) rolesToAssign.add('DIREKSI');
      if (rolesToAssign.has('STAFF_ADMIN_BILLING')) rolesToAssign.add('STAFF');

      for (const roleName of rolesToAssign) {
        await tx.insert(userRoles).values({
          userId,
          role: roleName as any,
          createdAt: now,
        }).onConflictDoNothing();
      }

      // d. Tentukan Tingkat Pegawai
      let level: any = input.level;
      if (!level) {
        if (rolesToAssign.has('DIREKSI') || rolesToAssign.has('EXECUTIVE')) level = 'DIREKSI';
        else if (rolesToAssign.has('SENIOR_MANAGER') || rolesToAssign.has('VERIFIKATOR_3')) level = 'SENIOR_MANAGER';
        else if (rolesToAssign.has('MANAGER') || rolesToAssign.has('VERIFIKATOR_2')) level = 'MANAGER';
        else if (rolesToAssign.has('SUPERVISOR') || rolesToAssign.has('VERIFIKATOR_1')) level = 'SUPERVISOR';
        else if (rolesToAssign.has('STAFF') || rolesToAssign.has('STAFF_ADMIN_BILLING')) level = 'STAFF_PENYELIA';
        else level = 'PELAKSANA';
      }

      const bagian = input.bagian || 'UMUM';
      const wilayahKerja = input.wilayahKerja || 'WILAYAH_5';
      const nip = input.nip?.trim() || `PEG-${Date.now().toString().slice(-6)}`;
      const jabatanNama = input.jabatanNama || `${level} Bagian ${bagian} (${wilayahKerja})`;
      const unitKerja = input.unitKerja || `Pelayanan ${wilayahKerja} - Bagian ${bagian}`;

      // e. Insert Profil Pegawai
      await tx.insert(pegawai).values({
        id: crypto.randomUUID(),
        userId,
        nip,
        namaLengkap: input.name.trim(),
        level,
        jabatanNama,
        unitKerja,
        bagian,
        wilayahKerja,
        noHp: input.noHp?.trim() || null,
        aktif: true,
        createdAt: now,
        updatedAt: now,
      });

      // f. Hubungkan ke Petugas Cater jika bertugas sebagai Pencatat Lapangan
      if (rolesToAssign.has('PENCATAT') || level === 'PELAKSANA') {
        const petugasId = input.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 50);
        if (petugasId) {
          await tx
            .insert(petugasCater)
            .values({
              id: petugasId,
              nama: input.name.trim(),
              noHp: input.noHp?.trim() || null,
              aktif: true,
              createdAt: now,
            })
            .onConflictDoNothing();
        }
      }
    });

    return {
      success: true,
      userId,
      email: emailNorm,
      name: input.name.trim(),
      message: 'Pengguna baru dan profil pegawai berhasil dibuat.',
    };
  }

  /**
   * Helper: Pastikan tabel role_permissions & user_permission_overrides tersedia di Postgres
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
        "direksi" boolean NOT NULL DEFAULT false,
        "senior_manager" boolean NOT NULL DEFAULT false,
        "manager" boolean NOT NULL DEFAULT false,
        "supervisor" boolean NOT NULL DEFAULT false,
        "staff" boolean NOT NULL DEFAULT false,
        "pelaksana" boolean NOT NULL DEFAULT false,
        "staff_billing" boolean NOT NULL DEFAULT false,
        "verifikator_1" boolean NOT NULL DEFAULT false,
        "verifikator_2" boolean NOT NULL DEFAULT false,
        "verifikator_3" boolean NOT NULL DEFAULT false,
        "executive" boolean NOT NULL DEFAULT false,
        "updated_by" text,
        "updated_at" timestamp NOT NULL DEFAULT now()
      );

      ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "direksi" boolean NOT NULL DEFAULT false;
      ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "senior_manager" boolean NOT NULL DEFAULT false;
      ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "manager" boolean NOT NULL DEFAULT false;
      ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "supervisor" boolean NOT NULL DEFAULT false;
      ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "staff" boolean NOT NULL DEFAULT false;
      ALTER TABLE "role_permissions" ADD COLUMN IF NOT EXISTS "pelaksana" boolean NOT NULL DEFAULT false;

      -- Sinkronkan data awal dari kolom legacy jika kolom baru masih bernilai false semua
      UPDATE "role_permissions" SET
        "direksi" = "executive",
        "senior_manager" = "verifikator_3",
        "manager" = "verifikator_2",
        "supervisor" = "verifikator_1",
        "staff" = "staff_billing"
      WHERE "direksi" = false AND "senior_manager" = false AND "manager" = false AND "supervisor" = false;

      CREATE TABLE IF NOT EXISTS "user_permission_overrides" (
        "id" text PRIMARY KEY,
        "user_id" text NOT NULL,
        "modul_key" varchar(50) NOT NULL,
        "granted" boolean NOT NULL,
        "catatan" text,
        "updated_by" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "user_permission_overrides_user_id_idx" ON "user_permission_overrides" ("user_id");
      CREATE INDEX IF NOT EXISTS "user_permission_overrides_modul_key_idx" ON "user_permission_overrides" ("modul_key");
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
            direksi: item.direksi,
            seniorManager: item.seniorManager,
            manager: item.manager,
            supervisor: item.supervisor,
            staff: item.staff,
            pelaksana: item.pelaksana,
            staffBilling: item.staffBilling ?? item.staff,
            verifikator1: item.verifikator1 ?? item.supervisor,
            verifikator2: item.verifikator2 ?? item.manager,
            verifikator3: item.verifikator3 ?? item.seniorManager,
            executive: item.executive ?? item.direksi,
          })
          .onConflictDoNothing();
      }

      rows = await db
        .select()
        .from(rolePermissions)
        .orderBy(asc(rolePermissions.urutan));
    }

    return rows.map((r) => {
      const direksi = r.direksi ?? r.executive ?? false;
      const seniorManager = r.seniorManager ?? r.verifikator3 ?? false;
      const manager = r.manager ?? r.verifikator2 ?? false;
      const supervisor = r.supervisor ?? r.verifikator1 ?? false;
      const staff = r.staff ?? r.staffBilling ?? false;
      const pelaksana = r.pelaksana ?? false;

      return {
        id: r.id,
        modulKey: r.modulKey,
        modulNama: r.modulNama,
        modul: r.modulNama,
        kategori: r.kategori,
        deskripsi: r.deskripsi ?? '',
        urutan: Number(r.urutan),
        superadmin: r.superadmin,
        direksi,
        seniorManager,
        manager,
        supervisor,
        staff,
        pelaksana,
        staffBilling: staff,
        verifikator1: supervisor,
        verifikator2: manager,
        verifikator3: seniorManager,
        executive: direksi,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
      };
    });
  }

  /**
   * 7. Simpan Modifikasi Matriks Otorisasi RBAC (6 Tingkatan Jabatan)
   */
  async updateMatriksOtorisasi(
    items: MatriksHakAksesItem[],
    userId?: string
  ): Promise<{ success: boolean; count: number }> {
    await this.ensureRolePermissionsTable();

    // Validasi apakah userId benar-benar ada di tabel user untuk mencegah FK constraint violation
    let validUserId: string | null = null;
    if (userId) {
      const [u] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      if (u) validUserId = u.id;
    }

    for (const item of items) {
      let direksi = item.direksi ?? item.executive ?? false;
      if (item.executive !== undefined && item.direksi !== undefined && item.executive !== item.direksi) {
        direksi = item.executive;
      }

      let seniorManager = item.seniorManager ?? item.verifikator3 ?? false;
      if (item.verifikator3 !== undefined && item.seniorManager !== undefined && item.verifikator3 !== item.seniorManager) {
        seniorManager = item.verifikator3;
      }

      let manager = item.manager ?? item.verifikator2 ?? false;
      if (item.verifikator2 !== undefined && item.manager !== undefined && item.verifikator2 !== item.manager) {
        manager = item.verifikator2;
      }

      let supervisor = item.supervisor ?? item.verifikator1 ?? false;
      if (item.verifikator1 !== undefined && item.supervisor !== undefined && item.verifikator1 !== item.supervisor) {
        supervisor = item.verifikator1;
      }

      let staff = item.staff ?? item.staffBilling ?? false;
      if (item.staffBilling !== undefined && item.staff !== undefined && item.staffBilling !== item.staff) {
        staff = item.staffBilling;
      }

      const pelaksana = item.pelaksana ?? false;

      await db
        .insert(rolePermissions)
        .values({
          id: item.id || `perm-${item.modulKey}`,
          modulKey: item.modulKey,
          modulNama: item.modulNama || item.modul || item.modulKey,
          kategori: item.kategori || 'OPERASIONAL',
          deskripsi: item.deskripsi,
          urutan: String(item.urutan ?? 0),
          superadmin: item.superadmin ?? true,
          direksi,
          seniorManager,
          manager,
          supervisor,
          staff,
          pelaksana,
          staffBilling: staff,
          verifikator1: supervisor,
          verifikator2: manager,
          verifikator3: seniorManager,
          executive: direksi,
          updatedBy: validUserId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: rolePermissions.modulKey,
          set: {
            superadmin: item.superadmin ?? true,
            direksi,
            seniorManager,
            manager,
            supervisor,
            staff,
            pelaksana,
            staffBilling: staff,
            verifikator1: supervisor,
            verifikator2: manager,
            verifikator3: seniorManager,
            executive: direksi,
            updatedBy: validUserId,
            updatedAt: new Date(),
          },
        });
    }

    return { success: true, count: items.length };
  }

  /**
   * 8. Ambil Riwayat Override Izin Khusus Pengguna (Si A)
   */
  async getUserPermissionOverrides(userId: string) {
    await this.ensureRolePermissionsTable();
    return await db
      .select()
      .from(userPermissionOverrides)
      .where(eq(userPermissionOverrides.userId, userId));
  }

  /**
   * 9. Simpan / Perbarui Override Izin Khusus Pengguna (Si A)
   */
  async setUserPermissionOverrides(
    userId: string,
    overrides: { modulKey: string; granted: boolean; catatan?: string }[],
    updatedBy?: string
  ): Promise<{ success: boolean; count: number }> {
    await this.ensureRolePermissionsTable();

    let validUpdatedBy: string | null = null;
    if (updatedBy) {
      const [u] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, updatedBy))
        .limit(1);
      if (u) validUpdatedBy = u.id;
    }

    for (const ov of overrides) {
      // Hapus override lama jika ada untuk pasangan user_id & modul_key
      await db
        .delete(userPermissionOverrides)
        .where(
          and(
            eq(userPermissionOverrides.userId, userId),
            eq(userPermissionOverrides.modulKey, ov.modulKey)
          )
        );

      await db.insert(userPermissionOverrides).values({
        userId,
        modulKey: ov.modulKey,
        granted: ov.granted,
        catatan: ov.catatan ?? null,
        updatedBy: validUpdatedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true, count: overrides.length };
  }

  /**
   * 10. Hapus Override Izin Khusus Pengguna (Kembalikan ke Default Role)
   */
  async resetUserPermissionOverride(userId: string, modulKey: string) {
    await this.ensureRolePermissionsTable();
    await db
      .delete(userPermissionOverrides)
      .where(
        and(
          eq(userPermissionOverrides.userId, userId),
          eq(userPermissionOverrides.modulKey, modulKey)
        )
      );
    return { success: true };
  }

  /**
   * 11. Dapatkan Daftar Izin Efektif Lengkap untuk Pengguna Tertentu (Si A)
   * Menggabungkan wewenang bawaan jabatannya dengan custom override perorangan
   */
  async getUserEffectivePermissions(userId: string): Promise<UserEffectivePermission[]> {
    await this.ensureRolePermissionsTable();

    // 1. Ambil seluruh modul perizinan master
    const matrix = await this.getMatriksOtorisasi();

    // 2. Ambil peran/role user
    const uRoles = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    const roleSet = new Set(uRoles.map((r) => r.role));

    // 3. Ambil profil pegawai untuk level struktural, bagian, dan wilayah kerja
    const [peg] = await db
      .select({
        level: pegawai.level,
        bagian: pegawai.bagian,
        wilayahKerja: pegawai.wilayahKerja,
      })
      .from(pegawai)
      .where(eq(pegawai.userId, userId))
      .limit(1);
    const level = peg?.level;
    const userBagian = (peg?.bagian ?? 'UMUM').toUpperCase();

    const isSuperadmin = roleSet.has('SUPERADMIN');
    const isDireksi = roleSet.has('DIREKSI') || roleSet.has('EXECUTIVE') || level === 'DIREKSI';
    const isSeniorManager =
      roleSet.has('SENIOR_MANAGER') || roleSet.has('VERIFIKATOR_3') || level === 'SENIOR_MANAGER';
    const isManager =
      roleSet.has('MANAGER') || roleSet.has('VERIFIKATOR_2') || level === 'MANAGER';
    const isSupervisor =
      roleSet.has('SUPERVISOR') || roleSet.has('VERIFIKATOR_1') || level === 'SUPERVISOR';
    const isStaff =
      roleSet.has('STAFF') ||
      roleSet.has('STAFF_ADMIN_BILLING') ||
      level === 'STAFF_PENYELIA';
    const isPelaksana =
      roleSet.has('PELAKSANA') || roleSet.has('PENCATAT') || level === 'PELAKSANA';

    // 4. Ambil override izin khusus untuk user ini
    const overrides = await db
      .select()
      .from(userPermissionOverrides)
      .where(eq(userPermissionOverrides.userId, userId));
    const overrideMap = new Map(overrides.map((o) => [o.modulKey, o]));

    return matrix.map((m) => {
      // Deteksi kepemilikan bagian modul (Dapur Departemen)
      let modulBagian = 'UMUM';
      if (m.modulKey.startsWith('rpm_') || m.kategori === 'RPM') modulBagian = 'RPM';
      else if (m.modulKey.startsWith('distribusi_') || m.kategori === 'DISTRIBUSI') modulBagian = 'DISTRIBUSI';
      else if (m.modulKey.startsWith('langganan_') || m.kategori === 'LANGGANAN') modulBagian = 'LANGGANAN';
      else if (m.modulKey.startsWith('penagihan_') || m.kategori === 'PENAGIHAN' || m.kategori === 'BILLING') modulBagian = 'PENAGIHAN';
      else if (m.kategori === 'VERIFIKASI' || m.modulKey.includes('cater') || m.modulKey.includes('stand') || m.modulKey.includes('gis')) {
        modulBagian = 'PENCATAT_METER';
      }

      // Hitung izin default berdasarkan role / level dan batas sekat dapur
      let roleDefault = false;
      if (isSuperadmin) {
        roleDefault = true;
      } else if (isDireksi && m.direksi) {
        roleDefault = true;
      } else if (isSeniorManager && m.seniorManager) {
        // Senior Manager membawahi 5 bagian di pelayanan wilayahnya
        roleDefault = true;
      } else {
        // Manager, Supervisor, Staff, Pelaksana:
        // Cek apakah modul ini sesuai dapur bagiannya atau berstatus UMUM
        const cocokBagian =
          userBagian === 'UMUM' ||
          modulBagian === 'UMUM' ||
          userBagian === modulBagian;

        if (cocokBagian) {
          if (isManager && m.manager) roleDefault = true;
          else if (isSupervisor && m.supervisor) roleDefault = true;
          else if (isStaff && m.staff) roleDefault = true;
          else if (isPelaksana && m.pelaksana) roleDefault = true;
        }
      }

      // Evaluasi apakah ada custom override khusus untuk Si A (Kustomisasi Dinamis Superadmin)
      // Override selalu memenangkan aturan default dapur!
      const override = overrideMap.get(m.modulKey);
      const isOverridden = !!override;
      const effectiveGranted = isSuperadmin ? true : isOverridden ? override.granted : roleDefault;

      return {
        modulKey: m.modulKey,
        modulNama: m.modulNama,
        kategori: m.kategori,
        deskripsi: m.deskripsi,
        urutan: m.urutan ?? 0,
        roleDefault,
        isOverridden,
        effectiveGranted,
        overrideCatatan: override?.catatan ?? null,
      };
    });
  }

  /**
   * 12. Helper Otorisasi Cepat: Cek apakah user punya izin pada modul tertentu
   */
  async hasUserPermission(userId: string, modulKey: string): Promise<boolean> {
    const permissions = await this.getUserEffectivePermissions(userId);
    const target = permissions.find((p) => p.modulKey === modulKey);
    return target?.effectiveGranted ?? false;
  }
}

export const masterExtendedService = new MasterExtendedService();
