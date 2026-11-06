/**
 * Service: Ganti Water Meter (Mutasi & Stand Angkat) & Grand Water Meter (Neraca Air)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Transaksi, & Domain Engine)
 */

import { eq, and, sql } from 'drizzle-orm';
import {
  db,
  waterMeterMutasi,
  grandWaterMeter,
  gwmBacaMeter,
  caterBacaMeter,
  caterVerifikasiLog,
  pelanggan,
} from '@cater/db';
import type { AlasanGantiMeter } from '@cater/types';
import {
  hitungKubikasiGantiMeter,
  hitungNeracaAir,
  type HasilNeracaAir,
} from '../../domain/gwm/gwm.engine';

export interface CatatMutasiGantiMeterInput {
  nolg: string;
  periode: number; // e.g. 202601
  alasan: AlasanGantiMeter;
  keterangan?: string;
  noMeterLama: string;
  standAngkat: number;
  fotoStandAngkat?: string;
  noMeterBaru: string;
  merkBaru?: string;
  ukuranBaru?: string;
  standPasang?: number;
  noSegelBaru?: string;
  fotoMeterBaru?: string;
  petugasPasang?: string;
}

export interface VerifikasiMutasiInput {
  mutasiId: string;
  action: 'APPROVE' | 'REJECT';
  standBacaBaru?: number; // Pembacaan meter baru bulan berjalan
  catatan?: string;
  userId: string;
}

export interface CatatDebitGwmInput {
  kodeGwm: string;
  periode: number;
  standAwal: number;
  standAkhir: number;
  petugasId?: string;
  fotoStand?: string;
  catatan?: string;
}

export class GwmService {
  /**
   * Mencatat data berita acara penggantian meter air pelanggan (Ganti Water Meter)
   */
  async catatMutasiGantiMeter(input: CatatMutasiGantiMeterInput) {
    const {
      nolg,
      periode,
      alasan,
      keterangan,
      noMeterLama,
      standAngkat,
      fotoStandAngkat,
      noMeterBaru,
      merkBaru,
      ukuranBaru = '1/2',
      standPasang = 0,
      noSegelBaru,
      fotoMeterBaru,
      petugasPasang,
    } = input;

    const [cust] = await db
      .select({ nolg: pelanggan.nolg })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan ${nolg} tidak ditemukan.`);
    }

    const id = `mutasi-${periode}-${nolg}`;

    await db
      .insert(waterMeterMutasi)
      .values({
        id,
        nolg,
        periode,
        alasan,
        keterangan,
        noMeterLama,
        standAngkat,
        fotoStandAngkat,
        noMeterBaru,
        merkBaru,
        ukuranBaru,
        standPasang,
        noSegelBaru,
        fotoMeterBaru,
        petugasPasang,
        statusVerifikasi: 'PENDING',
      })
      .onConflictDoUpdate({
        target: waterMeterMutasi.id,
        set: {
          alasan,
          keterangan,
          noMeterLama,
          standAngkat,
          fotoStandAngkat,
          noMeterBaru,
          merkBaru,
          ukuranBaru,
          standPasang,
          noSegelBaru,
          fotoMeterBaru,
          petugasPasang,
          statusVerifikasi: 'PENDING',
          updatedAt: new Date(),
        },
      });

    return {
      id,
      nolg,
      periode,
      standAngkat,
      standPasang,
      statusVerifikasi: 'PENDING',
      pesan: 'Data mutasi ganti meter berhasil dicatat dan menunggu verifikasi supervisor.',
    };
  }

  /**
   * Verifikasi Penggantian Water Meter oleh Supervisor
   * APPROVE: Menghitung kubikasi gabungan (Stand Angkat - Stand Lalu) + (Stand Baru - Stand Pasang)
   * dan mencatatnya ke cater_baca_meter dengan kode MB (4)
   */
  async verifikasiMutasiGantiMeter(input: VerifikasiMutasiInput) {
    const { mutasiId, action, standBacaBaru, catatan, userId } = input;

    const [mutasi] = await db
      .select()
      .from(waterMeterMutasi)
      .where(eq(waterMeterMutasi.id, mutasiId));

    if (!mutasi) {
      throw new Error(`Data mutasi ganti meter ${mutasiId} tidak ditemukan.`);
    }

    if (action === 'REJECT') {
      await db
        .update(waterMeterMutasi)
        .set({
          statusVerifikasi: 'REJECTED',
          catatanVerifikasi: catatan || 'Ditolak oleh supervisor',
          verifikatorId: userId,
          tglVerifikasi: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(waterMeterMutasi.id, mutasiId));

      return {
        mutasiId,
        statusVerifikasi: 'REJECTED',
        message: 'Pengajuan ganti water meter ditolak.',
      };
    }

    // Aksi: APPROVE
    const periodeStr = String(mutasi.periode);
    const caterId = `cater-${periodeStr}-${mutasi.nolg}`;

    const [existingCater] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterId));

    const standLalu = Number(existingCater?.stml ?? 0);
    const bacaBaru = standBacaBaru !== undefined ? standBacaBaru : mutasi.standPasang;

    const kalkulasi = hitungKubikasiGantiMeter({
      standLalu,
      standAngkat: mutasi.standAngkat,
      standPasang: mutasi.standPasang,
      standBacaBaru: bacaBaru,
    });

    if (!kalkulasi.isValid) {
      throw new Error(kalkulasi.pesanError);
    }

    await db.transaction(async (tx) => {
      // 1. Update status dokumen mutasi ganti meter
      await tx
        .update(waterMeterMutasi)
        .set({
          statusVerifikasi: 'APPROVED',
          verifikatorId: userId,
          catatanVerifikasi: catatan || 'Disetujui oleh Supervisor',
          tglVerifikasi: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(waterMeterMutasi.id, mutasiId));

      // 2. Simpan / Perbarui transaksi pembacaan meter utama
      await tx
        .insert(caterBacaMeter)
        .values({
          id: caterId,
          thbl: periodeStr,
          nolg: mutasi.nolg,
          stml: String(mutasi.standPasang), // Referensi stand awal meter baru
          stma: String(bacaBaru),
          pakaiM3: String(kalkulasi.totalPemakaianM3),
          pakaiTagih: String(kalkulasi.totalPemakaianM3),
          tmss: '4',                        // Kode STI '4 - MB'
          ketCatat: 'MB',
          waterMeterMutasiId: mutasi.id,
          statusVerifikasi: 'VERIFIED_L1',
          catatan: `[Ganti Meter/MB] Stand Angkat: ${mutasi.standAngkat} | Stand Pasang: ${mutasi.standPasang}`,
        })
        .onConflictDoUpdate({
          target: caterBacaMeter.id,
          set: {
            stml: String(mutasi.standPasang),
            stma: String(bacaBaru),
            pakaiM3: String(kalkulasi.totalPemakaianM3),
            pakaiTagih: String(kalkulasi.totalPemakaianM3),
            tmss: '4',
            ketCatat: 'MB',
            waterMeterMutasiId: mutasi.id,
            statusVerifikasi: 'VERIFIED_L1',
            catatan: `[Ganti Meter/MB] Stand Angkat: ${mutasi.standAngkat} | Stand Pasang: ${mutasi.standPasang}`,
            updatedAt: new Date(),
          },
        });

      // 3. Catat di audit log verifikasi
      await tx.insert(caterVerifikasiLog).values({
        caterId,
        userId,
        stage: 'V1',
        action: 'APPROVE',
        stmaSebelum: existingCater?.stma ?? null,
        stmaSesudah: String(bacaBaru),
        pakaiSebelum: existingCater?.pakaiM3 ?? null,
        pakaiSesudah: String(kalkulasi.totalPemakaianM3),
        alasan: `Pengesahan Berita Acara Ganti Water Meter (${mutasi.alasan}). Total tagihan: ${kalkulasi.totalPemakaianM3} m3`,
      });
    });

    return {
      mutasiId,
      caterId,
      statusVerifikasi: 'APPROVED',
      pakaiMeterLama: kalkulasi.pakaiMeterLama,
      pakaiMeterBaru: kalkulasi.pakaiMeterBaru,
      totalPemakaianM3: kalkulasi.totalPemakaianM3,
      message: 'Ganti water meter berhasil disahkan dan tagihan dihitung presisi.',
    };
  }

  /**
   * Mencatat debit rutin Grand Water Meter (Meter Induk Zona DMA)
   */
  async catatDebitGwm(input: CatatDebitGwmInput) {
    const { kodeGwm, periode, standAwal, standAkhir, petugasId, fotoStand, catatan } = input;

    const [gwm] = await db
      .select({ id: grandWaterMeter.id, zonaKode: grandWaterMeter.zonaKode })
      .from(grandWaterMeter)
      .where(eq(grandWaterMeter.kodeGwm, kodeGwm));

    if (!gwm) {
      throw new Error(`Grand Water Meter dengan kode ${kodeGwm} tidak ditemukan.`);
    }

    const totalDebitM3 = Math.max(0, standAkhir - standAwal);
    const id = `gwm-baca-${periode}-${kodeGwm}`;

    await db
      .insert(gwmBacaMeter)
      .values({
        id,
        gwmId: gwm.id,
        periode,
        standAwal,
        standAkhir,
        totalDebitM3,
        petugasId,
        fotoStand,
        catatan,
      })
      .onConflictDoNothing();

    return {
      id,
      kodeGwm,
      periode,
      totalDebitM3,
      message: 'Pencatatan debit Grand Water Meter berhasil disimpan.',
    };
  }

  /**
   * Menghitung Neraca Air (Water Balance) & Tingkat Kehilangan Air (NRW) untuk Zona Tertentu
   */
  async hitungNeracaAirZona(zonaKode: string, periode: number): Promise<HasilNeracaAir> {
    const periodeStr = String(periode);

    // 1. Akumulasi debit masuk seluruh GWM induk di zona ini
    const debitGwmRows = await db
      .select({ totalDebit: sql<number>`COALESCE(SUM(${gwmBacaMeter.totalDebitM3}), 0)::int` })
      .from(gwmBacaMeter)
      .innerJoin(grandWaterMeter, eq(gwmBacaMeter.gwmId, grandWaterMeter.id))
      .where(and(eq(grandWaterMeter.zonaKode, zonaKode), eq(gwmBacaMeter.periode, periode)));

    const totalDebitGwmM3 = debitGwmRows[0]?.totalDebit ?? 0;

    // 2. Akumulasi pemakaian air pelanggan yang terjual di rute yang masuk zona ini
    const pemakaianPelangganRows = await db
      .select({
        totalPakai: sql<number>`COALESCE(SUM(${caterBacaMeter.pakaiTagih}::float), SUM(${caterBacaMeter.pakaiM3}::float), 0)::float`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, periodeStr));

    const totalPemakaianPelangganM3 = Math.round(pemakaianPelangganRows[0]?.totalPakai ?? 0);

    return hitungNeracaAir({
      totalDebitGwmM3,
      totalPemakaianPelangganM3,
    });
  }
}

export const gwmService = new GwmService();
