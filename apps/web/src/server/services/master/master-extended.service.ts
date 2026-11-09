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
  jabatan: string | null;
  unitKerja: string | null;
  status: 'AKTIF' | 'NONAKTIF';
  createdAt: string;
}

export interface MatriksHakAksesItem {
  modul: string;
  deskripsi: string;
  superadmin: boolean;
  staffBilling: boolean;
  verifikator1: boolean;
  verifikator2: boolean;
  verifikator3: boolean;
  executive: boolean;
  pelaksana: boolean;
}

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

    const rolesList = await db.select().from(userRoles);
    const pegawaiList = await db.select().from(pegawai);

    const roleMap = new Map<string, string>();
    for (const r of rolesList) {
      roleMap.set(r.userId, r.role);
    }

    const pegMap = new Map<string, { jabatan: string | null; unit: string | null; aktif: boolean }>();
    for (const p of pegawaiList) {
      if (p.userId) {
        pegMap.set(p.userId, {
          jabatan: p.jabatanNama,
          unit: p.unitKerja,
          aktif: p.aktif,
        });
      }
    }

    return userList.map((u) => {
      const p = pegMap.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: roleMap.get(u.id) ?? 'USER',
        jabatan: p?.jabatan ?? 'Staf Operasional',
        unitKerja: p?.unit ?? 'Divisi Hubungan Langganan',
        status: p?.aktif === false ? 'NONAKTIF' : 'AKTIF',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  /**
   * 6. Matriks Otorisasi RBAC Resmi PDAM
   */
  getMatriksOtorisasi(): MatriksHakAksesItem[] {
    return [
      {
        modul: 'Monitoring Cater & Peta GIS',
        deskripsi: 'Melihat progres harian petugas, tracking live di peta GIS, dan statistik wilayah.',
        superadmin: true,
        staffBilling: true,
        verifikator1: true,
        verifikator2: true,
        verifikator3: true,
        executive: true,
        pelaksana: true,
      },
      {
        modul: 'Verifikasi Ring 1 (Supervisor)',
        deskripsi: 'Screening anomali stand, foto buram, dan penugasan survei ulang (Need Resurvey).',
        superadmin: true,
        staffBilling: true,
        verifikator1: true,
        verifikator2: true,
        verifikator3: true,
        executive: false,
        pelaksana: false,
      },
      {
        modul: 'Verifikasi Ring 2 (Manager Cabang)',
        deskripsi: 'Approval hasil bacaan meter tingkat cabang wilayah sebelum diterbitkan rekening.',
        superadmin: true,
        staffBilling: false,
        verifikator1: false,
        verifikator2: true,
        verifikator3: true,
        executive: false,
        pelaksana: false,
      },
      {
        modul: 'Verifikasi Ring 3 (Senior Manager)',
        deskripsi: 'Pengesahan final batch pembacaan meter dan otorisasi data billing resmi.',
        superadmin: true,
        staffBilling: false,
        verifikator1: false,
        verifikator2: false,
        verifikator3: true,
        executive: true,
        pelaksana: false,
      },
      {
        modul: 'Manual ADD & Taksasi Perdir',
        deskripsi: 'Input pembacaan darurat perorangan atau taksasi masal saat petugas berhalangan.',
        superadmin: true,
        staffBilling: true,
        verifikator1: true,
        verifikator2: false,
        verifikator3: false,
        executive: false,
        pelaksana: false,
      },
      {
        modul: 'Koreksi Stand & Reklasifikasi',
        deskripsi: 'Penyesuaian angka stand dan revisi kubikasi pasca-verifikasi dengan audit trail.',
        superadmin: true,
        staffBilling: true,
        verifikator1: false,
        verifikator2: true,
        verifikator3: true,
        executive: false,
        pelaksana: false,
      },
      {
        modul: 'Tutup Bulan & DRD Locking',
        deskripsi: 'Closing periode kerja rekening, kalkulasi denda, dan penguncian data DRD.',
        superadmin: true,
        staffBilling: true,
        verifikator1: false,
        verifikator2: false,
        verifikator3: true,
        executive: false,
        pelaksana: false,
      },
      {
        modul: 'Master Data & Konfigurasi User',
        deskripsi: 'Manajemen akun pegawai, penetapan rute petugas, dan master kode kelainan.',
        superadmin: true,
        staffBilling: true,
        verifikator1: false,
        verifikator2: false,
        verifikator3: false,
        executive: false,
        pelaksana: false,
      },
    ];
  }
}

export const masterExtendedService = new MasterExtendedService();
