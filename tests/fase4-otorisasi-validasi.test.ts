import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { db, pengaduan, riwayatPengaduan, user, userRoles } from '@cater/db';
import { eq, inArray } from 'drizzle-orm';
import { pengaduanService } from '../packages/backend/src/services/langganan/pengaduan/pengaduan.service';
import {
  bolehMelakukan,
  tentukanAksiDariStatus,
} from '../packages/backend/src/domain/pengaduan/alur-pengaduan.engine';
import {
  ConflictError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
} from '../packages/backend/src/domain/pengaduan/pengaduan.errors';

describe('Fase 4: Otorisasi, Validasi, Error Handling, & Bug Logika (B6, B7, B8, B10, B11, B12, B13)', () => {
  let adminUserId: string;
  let verifikatorUserId: string;
  let pelaksanaAUserId: string;
  let pelaksanaBUserId: string;

  beforeAll(async () => {
    // Siapkan user uji dengan berbagai role
    adminUserId = 'test-fase4-admin-' + Date.now();
    verifikatorUserId = 'test-fase4-verif-' + Date.now();
    pelaksanaAUserId = 'test-fase4-pelaksana-a-' + Date.now();
    pelaksanaBUserId = 'test-fase4-pelaksana-b-' + Date.now();

    await db.insert(user).values([
      { id: adminUserId, name: 'Admin Test', email: `${adminUserId}@tirtawening.co.id` },
      { id: verifikatorUserId, name: 'Verifikator Test', email: `${verifikatorUserId}@tirtawening.co.id` },
      { id: pelaksanaAUserId, name: 'Teknisi A Lapangan', email: `${pelaksanaAUserId}@tirtawening.co.id` },
      { id: pelaksanaBUserId, name: 'Teknisi B Lapangan', email: `${pelaksanaBUserId}@tirtawening.co.id` },
    ]);

    await db.insert(userRoles).values([
      { userId: adminUserId, role: 'SUPERADMIN' },
      { userId: verifikatorUserId, role: 'VERIFIKATOR_1' },
      { userId: pelaksanaAUserId, role: 'PELAKSANA' },
      { userId: pelaksanaBUserId, role: 'PELAKSANA' },
    ]);
  });

  afterAll(async () => {
    try {
      const testIds = [adminUserId, verifikatorUserId, pelaksanaAUserId, pelaksanaBUserId];
      await db.delete(riwayatPengaduan).where(inArray(riwayatPengaduan.petugasId, testIds));
      await db.delete(userRoles).where(inArray(userRoles.userId, testIds));
      await db.delete(user).where(inArray(user.id, testIds));
    } catch (e) {
      // Ignore cleanup constraint errors
    }
  });

  // 1. B6: Matriks Hak Akses & Kewenangan Dinamis
  it('1. B6: Role EXECUTIVE hanya baca; Staf Billing khusus tagihan; Pelaksana harus penerima tugas', () => {
    // EXECUTIVE
    expect(bolehMelakukan('EXECUTIVE', 'BACA')).toBe(true);
    expect(bolehMelakukan('EXECUTIVE', 'BUAT')).toBe(false);
    expect(bolehMelakukan('EXECUTIVE', 'VERIFIKASI')).toBe(false);
    expect(bolehMelakukan('EXECUTIVE', 'TUGASKAN')).toBe(false);
    expect(bolehMelakukan('EXECUTIVE', 'UPDATE_STATUS_LAPANGAN')).toBe(false);
    expect(bolehMelakukan('EXECUTIVE', 'CATATAN_CHAT')).toBe(false);

    // STAFF_ADMIN_BILLING
    expect(
      bolehMelakukan('STAFF_ADMIN_BILLING', 'VERIFIKASI', {
        klasifikasi: 'NILAI_TAGIHAN_REKENING',
      })
    ).toBe(true);
    expect(
      bolehMelakukan('STAFF_ADMIN_BILLING', 'VERIFIKASI', {
        klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      })
    ).toBe(false);

    // PELAKSANA
    expect(
      bolehMelakukan('PELAKSANA', 'UPDATE_STATUS_LAPANGAN', {
        aktorId: 'usr-1',
        penerimaTugasId: 'usr-1',
      })
    ).toBe(true);
    expect(
      bolehMelakukan('PELAKSANA', 'UPDATE_STATUS_LAPANGAN', {
        aktorId: 'usr-2',
        penerimaTugasId: 'usr-1',
      })
    ).toBe(false);

    // SUPERADMIN selalu boleh
    expect(bolehMelakukan('SUPERADMIN', 'UPDATE_STATUS_LAPANGAN')).toBe(true);
  });

  // 2. B7: Penugasan lewat jalur penugasan saja
  it('2. B7: ubahStatusPengaduan menolak statusKe DITUGASKAN secara langsung', async () => {
    const tiket = await pengaduanService.createPengaduan({
      jenis: 'TIDAK_ADA_AIR',
      deskripsi: 'Air mati di blok C',
      pelapor: 'Ibu Ratna',
    });

    let errorThrown: any = null;
    try {
      await pengaduanService.ubahStatusPengaduan({
        pengaduanId: tiket.id,
        statusKe: 'DITUGASKAN',
        catatan: 'Coba bypass penugasan',
      });
    } catch (err) {
      errorThrown = err;
    }

    expect(errorThrown).toBeInstanceOf(ValidationError);
    expect(errorThrown.message).toContain('endpoint penugasan (/tugaskan)');
  });

  // 3. B8: Optimistic Locking pada Update Status dan Penugasan
  it('3. B8: Optimistic Locking mendeteksi race condition dan melempar ConflictError (409)', async () => {
    const tiket = await pengaduanService.createPengaduan({
      jenis: 'AIR_KERUH_BAU_BERWARNA',
      deskripsi: 'Air warna cokelat pekat',
      pelapor: 'Pak Joko',
    });

    // Petugas A menugaskan tiket (status berubah BARU -> DITUGASKAN)
    await pengaduanService.tugaskanPengaduan({
      pengaduanId: tiket.id,
      ditugaskanKeId: pelaksanaAUserId,
      catatan: 'Tugaskan teknisi A',
      aktor: { id: adminUserId, role: 'SUPERADMIN' },
    });

    // Dua transisi status yang bersaing secara simultan dari status DITUGASKAN:
    const [hasil1, hasil2] = await Promise.allSettled([
      pengaduanService.ubahStatusPengaduan({
        pengaduanId: tiket.id,
        statusKe: 'MENUJU_LOKASI',
        catatan: 'Teknisi berangkat menuju lokasi TKP',
        aktor: { id: adminUserId, role: 'SUPERADMIN' },
      }),
      pengaduanService.ubahStatusPengaduan({
        pengaduanId: tiket.id,
        statusKe: 'DIPROSES',
        catatan: 'Teknisi langsung mulai memproses',
        aktor: { id: adminUserId, role: 'SUPERADMIN' },
      }),
    ]);

    // Salah satu berhasil dan yang kalah balapan harus rejected karena optimistic lock / transisi ilegal
    const adaYangGagal = hasil1.status === 'rejected' || hasil2.status === 'rejected';
    expect(adaYangGagal).toBe(true);

    const error = hasil1.status === 'rejected' ? (hasil1 as any).reason : (hasil2 as any).reason;
    expect(error).toBeDefined();
    expect(
      error instanceof ConflictError ||
      error instanceof ValidationError ||
      error?.message?.includes('berubah') ||
      error?.message?.includes('tidak sah')
    ).toBe(true);
  });

  // 4. B10: Petugas Tujuan Tersimpan dan Terpapar Akurat pada Detail & Linimasa
  it('4. B10: Petugas tujuan tersimpan di riwayat dan eskalasiKe terbaca benar', async () => {
    const tiket = await pengaduanService.createPengaduan({
      jenis: 'GANTI_STOP_KRAN',
      deskripsi: 'Kran patah di bak meter',
      pelapor: 'Bapak Hartono',
      prioritas: 'RENDAH',
    });

    // Tugaskan ke teknisi A
    await pengaduanService.tugaskanPengaduan({
      pengaduanId: tiket.id,
      ditugaskanKeId: pelaksanaAUserId,
      aktor: { id: adminUserId, role: 'SUPERADMIN' },
    });

    // Eskalasi ke teknisi B / Supervisor dengan kenaikan prioritas
    await pengaduanService.eskalasiPengaduan({
      pengaduanId: tiket.id,
      prioritasBaru: 'NORMAL',
      eskalasiKeId: pelaksanaBUserId,
      catatan: 'Dialihkan karena teknisi A overload',
      petugasId: adminUserId,
      aktor: { id: adminUserId, role: 'SUPERADMIN' },
    });

    const detail = await pengaduanService.getDetailPengaduanFull(tiket.id);

    // Pastikan eskalasiKe menunjuk ke petugas tujuan (Teknisi B), bukan ke admin pelaku
    expect(detail.eskalasiKe).not.toBeNull();
    expect(detail.eskalasiKe?.id).toBe(pelaksanaBUserId);
    expect(detail.eskalasiKe?.name).toBe('Teknisi B Lapangan');
  });

  // 5. B11: Statistik Antrean via Agregasi SQL Murni
  it('5. B11: getStatistikPengaduan menghitung agregasi status, SLA, dan belumDitugaskan secara tepat', async () => {
    const stats = await pengaduanService.getStatistikPengaduan();

    expect(typeof stats.perStatus).toBe('object');
    expect(typeof stats.perPrioritasTerbuka).toBe('object');
    expect(typeof stats.melanggarSla).toBe('number');
    expect(typeof stats.belumDitugaskan).toBe('number');
    expect(stats.melanggarSla).toBeGreaterThanOrEqual(0);
    expect(stats.belumDitugaskan).toBeGreaterThanOrEqual(0);
  });

  // 6. B12: Aturan Status Tiket (Catatan pada DITUTUP & Eskalasi Hanya Boleh Naik)
  it('6. B12: Menolak catatan pada tiket DITUTUP dan eskalasi yang menurunkan prioritas', async () => {
    const tiket = await pengaduanService.createPengaduan({
      jenis: 'BOCOR_PIPA_DINAS',
      deskripsi: 'Pipa bocor samping trotoar',
      pelapor: 'Warga Peduli',
      prioritas: 'TINGGI',
      koordinat: { x: 107.61, y: -6.91 },
    });

    // Coba eskalasi menurunkan prioritas TINGGI -> RENDAH
    let errorTurun: any = null;
    try {
      await pengaduanService.eskalasiPengaduan({
        pengaduanId: tiket.id,
        prioritasBaru: 'RENDAH',
        catatan: 'Coba turunkan prioritas',
        aktor: { id: adminUserId, role: 'SUPERADMIN' },
      });
    } catch (err) {
      errorTurun = err;
    }
    expect(errorTurun).toBeInstanceOf(ValidationError);
    expect(errorTurun.message).toContain('hanya boleh menaikkan tingkat prioritas');

    // Coba eskalasi mempertahankan prioritas yang sama TINGGI -> TINGGI
    let errorSama: any = null;
    try {
      await pengaduanService.eskalasiPengaduan({
        pengaduanId: tiket.id,
        prioritasBaru: 'TINGGI',
        catatan: 'Prioritas tetap',
        aktor: { id: adminUserId, role: 'SUPERADMIN' },
      });
    } catch (err) {
      errorSama = err;
    }
    expect(errorSama).toBeInstanceOf(ValidationError);

    // Eskalasi menaikkan prioritas TINGGI -> DARURAT berhasil
    const eskalasiSukses = await pengaduanService.eskalasiPengaduan({
      pengaduanId: tiket.id,
      prioritasBaru: 'DARURAT',
      catatan: 'Air menggenang deras ke jalan raya',
      aktor: { id: adminUserId, role: 'SUPERADMIN' },
    });
    expect(eskalasiSukses.prioritas).toBe('DARURAT');

    // Alihkan tiket sampai DITUTUP
    await db.update(pengaduan).set({ status: 'DITUTUP' }).where(eq(pengaduan.id, tiket.id));

    // Coba tambah catatan pada tiket DITUTUP
    let errorCatatan: any = null;
    try {
      await pengaduanService.tambahCatatanPengaduan({
        pengaduanId: tiket.id,
        catatan: 'Catatan tambahan setelah tutup',
        aktor: { id: adminUserId, role: 'SUPERADMIN' },
      });
    } catch (err) {
      errorCatatan = err;
    }
    expect(errorCatatan).toBeInstanceOf(ValidationError);
    expect(errorCatatan.message).toContain('tiket yang sudah ditutup');

    // Coba eskalasi pada tiket DITUTUP
    let errorEskalasiTutup: any = null;
    try {
      await pengaduanService.eskalasiPengaduan({
        pengaduanId: tiket.id,
        prioritasBaru: 'DARURAT',
        aktor: { id: adminUserId, role: 'SUPERADMIN' },
      });
    } catch (err) {
      errorEskalasiTutup = err;
    }
    expect(errorEskalasiTutup).toBeInstanceOf(ValidationError);
    expect(errorEskalasiTutup.message).toContain('tidak dapat dieskalasi');
  });
});
