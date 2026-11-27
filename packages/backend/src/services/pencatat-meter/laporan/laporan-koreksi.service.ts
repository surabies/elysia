/**
 * Service: Laporan Monitoring Kubikasi Koreksi & Audit Trail Stand Meter
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM)
 */

import { eq, and, sql, isNotNull, or, desc, inArray } from 'drizzle-orm';
import {
  db,
  caterBacaMeter,
  caterVerifikasiLog,
  pelanggan,
  petugasCater,
  user,
  waterMeterMutasi,
} from '@cater/db';

export type JenisKoreksiStand =
  | 'METER_BARU'
  | 'MUDA_KEMBALI'
  | 'TAKSASI'
  | 'STAND_METER';

export interface KoreksiItem {
  id: string;
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  petugasId: string | null;
  namaPetugas: string;
  thbl: string;
  stml: number;
  stmlRevisi: number | null;
  stmaAwal: number;
  stmaRevisi: number;
  standAngkat: number | null;
  standPasang: number | null;
  mbTanpaStandAngkat: boolean;
  digitRollover: number | null;
  pakaiM3Awal: number;
  pakaiM3Revisi: number;
  selisihM3: number;
  jenisKoreksi: JenisKoreksiStand;
  kondisiAwal: string | null;
  alasanKoreksi: string | null;
  catatanAudit: string | null;
  namaVerifikator: string | null;
  statusVerifikasi: string;
  tglCatat: string | null;
  updatedAt: string;
}

export interface LaporanKoreksiResult {
  periode: string;
  summary: {
    totalKoreksi: number;
    totalM3Tambah: number;
    totalM3Kurang: number;
    nettoM3: number;
    totalMeterBaru: number;
    totalRollover: number;
  };
  items: KoreksiItem[];
}

export class LaporanKoreksiService {
  async getLaporanKoreksi(thbl: string = '202611'): Promise<LaporanKoreksiResult> {
    const rows = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: caterBacaMeter.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
        namaPetugas: petugasCater.nama,
        stml: caterBacaMeter.stml,
        stmlRevisi: caterBacaMeter.stmlRevisi,
        stma: caterBacaMeter.stma,
        stmaRevisi: caterBacaMeter.stmaRevisi,
        standAngkatRevisi: caterBacaMeter.standAngkatRevisi,
        standMeterBaruRevisi: caterBacaMeter.standMeterBaruRevisi,
        mbTanpaStandAngkat: caterBacaMeter.mbTanpaStandAngkat,
        digitRollover: caterBacaMeter.digitRollover,
        standAngkatMutasi: waterMeterMutasi.standAngkat,
        standPasangMutasi: waterMeterMutasi.standPasang,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        tmss: caterBacaMeter.tmss,
        ketCatat: caterBacaMeter.ketCatat,
        ketCatatRevisi: caterBacaMeter.ketCatatRevisi,
        catatan: caterBacaMeter.catatan,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
        updatedAt: caterBacaMeter.updatedAt,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .leftJoin(
        waterMeterMutasi,
        sql`${waterMeterMutasi.id} = COALESCE(${caterBacaMeter.waterMeterMutasiId}, 'mutasi-' || ${caterBacaMeter.thbl} || '-' || ${caterBacaMeter.nolg})`,
      )
      .where(
        and(
          eq(caterBacaMeter.thbl, thbl),
          or(
            isNotNull(caterBacaMeter.stmlRevisi),
            isNotNull(caterBacaMeter.stmaRevisi),
            isNotNull(caterBacaMeter.standAngkatRevisi),
            isNotNull(caterBacaMeter.standMeterBaruRevisi),
            isNotNull(caterBacaMeter.pakaiM3Revisi),
            isNotNull(caterBacaMeter.ketCatatRevisi),
            eq(caterBacaMeter.mbTanpaStandAngkat, true),
            isNotNull(caterBacaMeter.digitRollover),
          ),
        ),
      )
      .orderBy(desc(caterBacaMeter.updatedAt));

    const ids = rows.map((r) => r.id);
    const auditLogs = ids.length
      ? await db
          .select({
            caterId: caterVerifikasiLog.caterId,
            stage: caterVerifikasiLog.stage,
            action: caterVerifikasiLog.action,
            alasan: caterVerifikasiLog.alasan,
            createdAt: caterVerifikasiLog.createdAt,
            userName: user.name,
          })
          .from(caterVerifikasiLog)
          .leftJoin(user, eq(caterVerifikasiLog.userId, user.id))
          .where(inArray(caterVerifikasiLog.caterId, ids))
          .orderBy(desc(caterVerifikasiLog.createdAt))
      : [];

    const latestAuditByCater = new Map<
      string,
      { alasan: string | null; userName: string | null; createdAt: Date }
    >();
    for (const log of auditLogs) {
      if (log.stage === 'SYSTEM_RESET') continue;
      if (!latestAuditByCater.has(log.caterId)) {
        if (log.stage === 'FORM_CORRECTION' || log.alasan) {
          latestAuditByCater.set(log.caterId, {
            alasan: log.alasan,
            userName: log.userName,
            createdAt: log.createdAt,
          });
        }
      }
    }

    let totalM3Tambah = 0;
    let totalM3Kurang = 0;
    let totalMeterBaru = 0;
    let totalRollover = 0;

    const items: KoreksiItem[] = rows.map((r) => {
      const stml = Number(r.stml ?? 0);
      const stmlRevisi = r.stmlRevisi != null ? Number(r.stmlRevisi) : null;
      const stmaAwal = Number(r.stma ?? 0);
      const stmaRevisi = Number(
        r.standMeterBaruRevisi ?? r.stmaRevisi ?? r.stma ?? 0,
      );
      const pakaiM3Awal = Number(r.pakaiM3 ?? 0);
      const pakaiM3Revisi = Number(
        r.pakaiTagih ?? r.pakaiM3Revisi ?? r.pakaiM3 ?? 0,
      );

      const kondisiEfektif = String(r.ketCatatRevisi ?? r.ketCatat ?? '')
        .trim()
        .toUpperCase();
      const tmssNorm = String(r.tmss ?? '').trim().toUpperCase();

      const isMB =
        kondisiEfektif === 'MB' ||
        (r.ketCatatRevisi == null && tmssNorm === '4') ||
        r.standAngkatRevisi != null ||
        Boolean(r.mbTanpaStandAngkat);
      const isRollover =
        kondisiEfektif === 'MUDA KEMBALI' ||
        kondisiEfektif === 'MUDA_KEMBALI' ||
        (r.ketCatatRevisi == null && tmssNorm === 'U') ||
        r.digitRollover != null;

      let jenisKoreksi: JenisKoreksiStand = 'STAND_METER';
      if (isMB) {
        jenisKoreksi = 'METER_BARU';
        totalMeterBaru += 1;
      } else if (isRollover) {
        jenisKoreksi = 'MUDA_KEMBALI';
        totalRollover += 1;
      } else if (
        r.stmaRevisi == null &&
        r.stmlRevisi == null &&
        r.pakaiM3Revisi != null
      ) {
        jenisKoreksi = 'TAKSASI';
      }

      // Bila pakaiM3Awal bernilai negatif (mis. selisih mentah MB 30 - 3555 = -3525 sebelum verifikasi),
      // basis pemakaian tagih pra-koreksi adalah 0 m³ agar dampak kubikasi ke DRD akurat (+30 m³, bukan +3555 m³).
      const basisTagihAwal = pakaiM3Awal < 0 ? 0 : pakaiM3Awal;
      const selisihM3 = Number((pakaiM3Revisi - basisTagihAwal).toFixed(2));

      if (selisihM3 > 0) totalM3Tambah += selisihM3;
      if (selisihM3 < 0) totalM3Kurang += Math.abs(selisihM3);

      const logInfo = latestAuditByCater.get(r.id);
      const catatanDariRow =
        r.catatan && r.catatan !== 'Import Laporan Data Meter'
          ? r.catatan
          : null;

      return {
        id: r.id,
        nolg: r.nolg,
        nama: r.nama,
        alamat: r.alamat,
        tarifKode: r.tarifKode,
        ruteKode: r.ruteKode,
        petugasId: r.petugasId,
        namaPetugas: r.namaPetugas ?? r.petugasId ?? '—',
        thbl: r.thbl,
        stml,
        stmlRevisi,
        stmaAwal,
        stmaRevisi,
        standAngkat:
          r.standAngkatRevisi != null
            ? Number(r.standAngkatRevisi)
            : r.standAngkatMutasi != null
              ? Number(r.standAngkatMutasi)
              : null,
        standPasang:
          r.standPasangMutasi != null ? Number(r.standPasangMutasi) : null,
        mbTanpaStandAngkat: Boolean(r.mbTanpaStandAngkat),
        digitRollover: r.digitRollover ?? null,
        pakaiM3Awal,
        pakaiM3Revisi,
        selisihM3,
        jenisKoreksi,
        kondisiAwal: r.ketCatat,
        alasanKoreksi: r.ketCatatRevisi ?? r.ketCatat,
        catatanAudit: logInfo?.alasan ?? catatanDariRow,
        namaVerifikator: logInfo?.userName ?? null,
        statusVerifikasi: r.statusVerifikasi,
        tglCatat: r.tglCatat ? new Date(r.tglCatat).toISOString() : null,
        updatedAt: (logInfo?.createdAt ?? new Date(r.updatedAt)).toISOString(),
      };
    });

    return {
      periode: thbl,
      summary: {
        totalKoreksi: items.length,
        totalM3Tambah: Number(totalM3Tambah.toFixed(2)),
        totalM3Kurang: Number(totalM3Kurang.toFixed(2)),
        nettoM3: Number((totalM3Tambah - totalM3Kurang).toFixed(2)),
        totalMeterBaru,
        totalRollover,
      },
      items,
    };
  }
}

export const laporanKoreksiService = new LaporanKoreksiService();
