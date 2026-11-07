import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import {
  caterBacaMeter,
  caterMandiriPelanggan,
  caterVerifikasiLog,
  db,
  daftarCatat,
  golonganTarif,
  kecamatan,
  kelurahan,
  pelanggan,
  periodePenagihan,
  petugasCater,
  rekeningDrd,
  ruteCater,
  user,
  waterMeter,
  waterMeterMutasi,
  wilayahAdministrasi,
  zonaDistribusi,
} from "@cater/db";
import { hitungDeviasiPersentase } from "../../domain/cater/cater-anomali.engine";

type GridQuery = {
  id?: string;
  periode?: number | string;
  pageSize?: number;
  page?: number;
  offset?: number;
  q?: string;
  pencatatId?: string;
  ruteId?: string;
  ruteKode?: string;
  statusVerif?: string;
  status?: string;
  tanggalDari?: string;
  tanggalSampai?: string;
  hanyaAnomali?: string;
  kondisi?: string;
  jenisInput?: string;
};

const FINAL_STATUSES = [
  "APPROVED_FINAL",
  "CORRECTED_POST_VERIF",
  "LOCKED_BILLING",
] as const;
const MENUNGGU_V1_STATUSES = [
  "VERIFIED",
  "SUBMITTED",
  "ANOMALY",
  "ANOMALY_NEGATIVE",
  "ANOMALY_HIGH",
  "ANOMALY_LOW",
] as const;
const WAITING_STATUSES = [
  ...MENUNGGU_V1_STATUSES,
  "VERIFIED_L1",
  "VERIFIED_L2",
] as const;

const asNumber = (value: string | number | null | undefined) =>
  value == null ? null : Number(value);

const toIso = (value: Date | null | undefined) => value?.toISOString() ?? null;

function whereStatus(value?: string) {
  switch (value?.toUpperCase()) {
    case "SUBMITTED":
      return inArray(caterBacaMeter.statusVerifikasi, [
        ...MENUNGGU_V1_STATUSES,
      ]);
    case "VERIFIED_L1":
      return eq(caterBacaMeter.statusVerifikasi, "VERIFIED_L1");
    case "VERIFIED_L2":
      return eq(caterBacaMeter.statusVerifikasi, "VERIFIED_L2");
    case "APPROVED_FINAL":
      return inArray(caterBacaMeter.statusVerifikasi, [...FINAL_STATUSES]);
    case "NEED_RESURVEY":
      return eq(caterBacaMeter.statusVerifikasi, "NEED_RESURVEY");
    default:
      return value
        ? eq(caterBacaMeter.statusVerifikasi, value)
        : undefined;
  }
}

function mapStatus(status: string) {
  if (status === "NEED_RESURVEY") return "DITOLAK";
  if (FINAL_STATUSES.includes(status as (typeof FINAL_STATUSES)[number])) {
    return "DIVERIFIKASI";
  }
  return "MENUNGGU";
}

function statsFromCounts(
  counts: Array<{ status: string; count: number }>,
  periodes: number[],
  mandiri = false,
) {
  const total = counts.reduce((sum, row) => sum + row.count, 0);
  const waiting = mandiri
    ? counts
        .filter((row) => row.status === "PENDING")
        .reduce((sum, row) => sum + row.count, 0)
    : counts
        .filter((row) =>
          WAITING_STATUSES.includes(
            row.status as (typeof WAITING_STATUSES)[number],
          ),
        )
        .reduce((sum, row) => sum + row.count, 0);
  const rejected = mandiri
    ? counts
        .filter((row) => row.status === "REJECTED")
        .reduce((sum, row) => sum + row.count, 0)
    : counts
        .filter((row) => row.status === "NEED_RESURVEY")
        .reduce((sum, row) => sum + row.count, 0);
  const verified = mandiri
    ? counts
        .filter((row) => row.status === "APPROVED")
        .reduce((sum, row) => sum + row.count, 0)
    : counts
        .filter((row) =>
          FINAL_STATUSES.includes(
            row.status as (typeof FINAL_STATUSES)[number],
          ),
        )
        .reduce((sum, row) => sum + row.count, 0);

  return {
    total,
    menunggu: waiting,
    diverifikasi: verified,
    ditolak: rejected,
    anomali: mandiri
      ? 0
      : counts.reduce(
          (sum, row) => sum + (row.status === "ANOMALY" ? row.count : 0),
          0,
        ),
    ambangAnomali: 50,
    periodes,
  };
}

async function periodsFor(
  table: typeof caterBacaMeter | typeof caterMandiriPelanggan,
) {
  const rows = await db
    .selectDistinct({ periode: table.thbl })
    .from(table)
    .orderBy(desc(table.thbl));
  return rows.map((row) => Number(row.periode));
}

export class VerifikasiGridService {
  async getLaporanStats(periode?: number | string) {
    const period = periode ? String(periode) : undefined;
    const counts = await db
      .select({
        status: caterBacaMeter.statusVerifikasi,
        count: sql<number>`count(*)::int`,
      })
      .from(caterBacaMeter)
      .where(period ? eq(caterBacaMeter.thbl, period) : undefined)
      .groupBy(caterBacaMeter.statusVerifikasi);
    return statsFromCounts(
      counts.map((row) => ({ status: row.status, count: row.count })),
      await periodsFor(caterBacaMeter),
    );
  }

  async getMandiriStats(periode?: number | string) {
    const period = periode ? String(periode) : undefined;
    const counts = await db
      .select({
        status: caterMandiriPelanggan.statusVerifikasi,
        count: sql<number>`count(*)::int`,
      })
      .from(caterMandiriPelanggan)
      .where(period ? eq(caterMandiriPelanggan.thbl, period) : undefined)
      .groupBy(caterMandiriPelanggan.statusVerifikasi);
    return statsFromCounts(
      counts.map((row) => ({ status: row.status, count: row.count })),
      await periodsFor(caterMandiriPelanggan),
      true,
    );
  }

  async getLaporanRows(query: GridQuery) {
    const period = query.periode ? String(query.periode) : undefined;
    const pageSize = Math.max(1, Math.min(Number(query.pageSize ?? 100), 5000));
    const offset = Math.max(
      0,
      Number(query.offset ?? Number(query.page ?? 0) * pageSize),
    );
    const conditions = [];

    if (period) conditions.push(eq(caterBacaMeter.thbl, period));
    if (query.id) conditions.push(eq(caterBacaMeter.id, query.id));
    if (query.pencatatId)
      conditions.push(eq(caterBacaMeter.petugasId, query.pencatatId));
    if (query.ruteId || query.ruteKode) {
      conditions.push(
        eq(caterBacaMeter.ruteKode, query.ruteId ?? query.ruteKode!),
      );
    }
    const statusCondition = whereStatus(query.statusVerif);
    if (statusCondition) conditions.push(statusCondition);
    if (query.kondisi)
      conditions.push(eq(caterBacaMeter.ketCatat, query.kondisi));
    if (query.jenisInput) {
      conditions.push(
        query.jenisInput === "KONSUMEN"
          ? inArray(caterBacaMeter.sumberCatat, ["MANDIRI_WEB", "MANDIRI_APP"])
          : eq(caterBacaMeter.sumberCatat, "PETUGAS_ONSITE"),
      );
    }
    if (query.tanggalDari) {
      conditions.push(
        sql`${caterBacaMeter.tglCatat} >= ${new Date(query.tanggalDari)}`,
      );
    }
    if (query.tanggalSampai) {
      const sampai = new Date(query.tanggalSampai);
      sampai.setDate(sampai.getDate() + 1);
      conditions.push(sql`${caterBacaMeter.tglCatat} < ${sampai}`);
    }
    if (query.hanyaAnomali === "true") {
      conditions.push(
        or(
          sql`${caterBacaMeter.ketCatat} <> 'Normal'`,
          sql`${caterBacaMeter.pakaiM3}::numeric > 50`,
        )!,
      );
    }
    if (query.q) {
      const pattern = `%${query.q}%`;
      conditions.push(
        or(
          ilike(pelanggan.nolg, pattern),
          ilike(pelanggan.nama, pattern),
          ilike(pelanggan.alamat, pattern),
          ilike(caterBacaMeter.ruteKode, pattern),
        )!,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const base = db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: caterBacaMeter.ruteKode,
        petugasId: caterBacaMeter.petugasId,
        noMeter: pelanggan.noMeter,
        titikLokasi: pelanggan.titikLokasi,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        stmlRevisi: caterBacaMeter.stmlRevisi,
        stmaRevisi: caterBacaMeter.stmaRevisi,
        pakaiM3Revisi: caterBacaMeter.pakaiM3Revisi,
        ketCatatRevisi: caterBacaMeter.ketCatatRevisi,
        standAngkatRevisi: caterBacaMeter.standAngkatRevisi,
        standMeterBaruRevisi: caterBacaMeter.standMeterBaruRevisi,
        standAngkatLama: waterMeterMutasi.standAngkat,
        standPasang: waterMeterMutasi.standPasang,
        pakaiM3: caterBacaMeter.pakaiM3,
        pakaiTagih: caterBacaMeter.pakaiTagih,
        pakaiLalu: caterBacaMeter.pakaiLalu,
        ketCatat: caterBacaMeter.ketCatat,
        sumberCatat: caterBacaMeter.sumberCatat,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
        tglCatat: caterBacaMeter.tglCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
        catatan: caterBacaMeter.catatan,
        petugasNama: petugasCater.nama,
        tarifNama: golonganTarif.nama,
        ruteSeksi: ruteCater.seksiKode,
      })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .leftJoin(
        waterMeterMutasi,
        eq(caterBacaMeter.waterMeterMutasiId, waterMeterMutasi.id),
      )
      .leftJoin(petugasCater, eq(caterBacaMeter.petugasId, petugasCater.id))
      .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
      .leftJoin(ruteCater, eq(caterBacaMeter.ruteKode, ruteCater.kode));

    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(caterBacaMeter)
      .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
      .where(where);
    const rows = await base
      .where(where)
      .orderBy(desc(caterBacaMeter.tglCatat))
      .limit(query.id ? 1 : pageSize)
      .offset(query.id ? 0 : offset);

    const ids = rows.map((row) => row.id);
    const logs = ids.length
      ? await db
          .select({
            caterId: caterVerifikasiLog.caterId,
            stage: caterVerifikasiLog.stage,
            action: caterVerifikasiLog.action,
            createdAt: caterVerifikasiLog.createdAt,
            userName: user.name,
            alasan: caterVerifikasiLog.alasan,
          })
          .from(caterVerifikasiLog)
          .leftJoin(user, eq(caterVerifikasiLog.userId, user.id))
          .where(inArray(caterVerifikasiLog.caterId, ids))
          .orderBy(desc(caterVerifikasiLog.createdAt))
      : [];
    const logMap = new Map<string, typeof logs>();
    for (const log of logs) {
      const group = logMap.get(log.caterId) ?? [];
      group.push(log);
      logMap.set(log.caterId, group);
    }

    return {
      rows: rows.map((row) => {
        const rowLogs = logMap.get(row.id) ?? [];
        const latestV1 = rowLogs.find((log) => log.stage === "V1");
        const latestV2 = rowLogs.find((log) => log.stage === "V2");
        const latestV3 = rowLogs.find((log) => log.stage === "V3");
        const v1 = latestV1?.action === "APPROVE" ? latestV1 : undefined;
        const v2 = latestV2?.action === "APPROVE" ? latestV2 : undefined;
        const v3 = latestV3?.action === "APPROVE" ? latestV3 : undefined;
        const rejected = row.statusVerifikasi === "NEED_RESURVEY";
        const final = FINAL_STATUSES.includes(
          row.statusVerifikasi as (typeof FINAL_STATUSES)[number],
        );
        const point = row.titikLokasi as { x?: number; y?: number } | null;

        return {
          id: row.id,
          pelangganId: row.nolg,
          nomorLangganan: row.nolg,
          namaPelanggan: row.nama,
          alamatPelanggan: row.alamat,
          periode: Number(row.thbl),
          standAwal: asNumber(row.stml),
          standAkhir: asNumber(row.stma),
          standAwalRevisi: asNumber(row.stmlRevisi),
          standAkhirRevisi: asNumber(row.stmaRevisi),
          standAngkatLama:
            asNumber(row.standAngkatRevisi) ?? asNumber(row.standAngkatLama),
          standMeterBaru:
            asNumber(row.standMeterBaruRevisi) ??
            (row.ketCatatRevisi === "MB" || row.ketCatat === "MB"
              ? asNumber(row.stmaRevisi) ?? asNumber(row.stma)
              : null),
          standPasang: asNumber(row.standPasang),
          pemakaian: asNumber(row.pakaiM3Revisi) ?? asNumber(row.pakaiM3),
          pemakaianTagihVerif: asNumber(row.pakaiTagih),
          kondisiRevisi: row.ketCatatRevisi,
          pemakaianLalu: asNumber(row.pakaiLalu),
          persentase: hitungDeviasiPersentase(
            asNumber(row.pakaiM3Revisi) ?? asNumber(row.pakaiM3),
            asNumber(row.pakaiLalu),
          ),
          kondisi: row.ketCatat,
          jenisInput: row.sumberCatat.startsWith("MANDIRI")
            ? "KONSUMEN"
            : "PETUGAS",
          tanggalCatat: toIso(row.tglCatat),
          status: mapStatus(row.statusVerifikasi),
          isVerified: final,
          isCorrected: rowLogs.some(
            (log) =>
              log.stage === "FORM_CORRECTION" &&
              log.action === "ADJUST_STAND",
          ),
          verifiedAt: rejected ? toIso(latestV1?.createdAt) : null,
          catatanVerif: rejected
            ? (latestV1?.alasan ?? row.catatan)
            : row.catatan,
          pembacaanId: final ? row.id : null,
          verif1At: toIso(v1?.createdAt),
          verif2At: toIso(v2?.createdAt),
          verif3At: toIso(v3?.createdAt),
          verif1By: v1 ? { name: v1.userName } : null,
          verif2By: v2 ? { name: v2.userName } : null,
          verif3By: v3 ? { name: v3.userName } : null,
          verifiedBy: v3 ? { name: v3.userName } : null,
          nomorMeter: row.noMeter,
          fotoStandUrl: row.fotoMeterUrl,
          fotoRumahUrl: row.fotoRumahUrl,
          pencatat: row.petugasId
            ? {
                id: row.petugasId,
                namaLapangan: row.petugasNama ?? row.petugasId,
              }
            : null,
          pelanggan: {
            id: row.nolg,
            nomorLangganan: row.nolg,
            nama: row.nama,
            alamat: row.alamat,
            geoLat: point?.y ?? null,
            geoLong: point?.x ?? null,
            tarifGolongan: row.tarifKode ? { kodeAsli: row.tarifKode } : null,
            rute: row.ruteKode ? { kode: row.ruteKode } : null,
            zona: row.ruteSeksi ? { kode: row.ruteSeksi } : null,
          },
          pembacaan: final
            ? {
                id: row.id,
                standLalu: asNumber(row.stml) ?? 0,
                standAkhir: asNumber(row.stmaRevisi ?? row.stma) ?? 0,
                pemakaianM3:
                  asNumber(row.pakaiTagih) ??
                  asNumber(row.pakaiM3Revisi ?? row.pakaiM3) ??
                  0,
                pemakaianRiil: asNumber(row.pakaiM3Revisi ?? row.pakaiM3),
                pemakaianLalu: asNumber(row.pakaiLalu),
                periode: `${row.thbl.slice(0, 4)}-${row.thbl.slice(4)}-01T00:00:00.000Z`,
                blokTarif: 1,
                kondisi: row.ketCatatRevisi ?? row.ketCatat,
                fotoBukti: row.fotoMeterUrl,
                sumberLaporan: row.sumberCatat.startsWith("MANDIRI")
                  ? "KONSUMEN"
                  : "PETUGAS",
              }
            : null,
        };
      }),
      total: countRow?.total ?? 0,
    };
  }

  async getBelumDibaca(query: GridQuery) {
    const period = query.periode ? String(query.periode) : undefined;
    const pageSize = Math.max(1, Math.min(Number(query.pageSize ?? 100), 5000));
    const offset = Math.max(0, Number(query.offset ?? 0));
    const conditions = [eq(daftarCatat.status, "BELUM_DICATAT")];
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM cater_baca_meter c
        WHERE c.nolg = ${daftarCatat.nolg}
          AND c.thbl = ${daftarCatat.periode}
      )`,
    );
    if (period) conditions.push(eq(daftarCatat.periode, period));
    if (query.pencatatId)
      conditions.push(eq(daftarCatat.petugasId, query.pencatatId));
    if (query.ruteId) conditions.push(eq(daftarCatat.ruteKode, query.ruteId));
    if (query.q) {
      const pattern = `%${query.q}%`;
      conditions.push(
        or(ilike(pelanggan.nolg, pattern), ilike(pelanggan.nama, pattern))!,
      );
    }
    const where = and(...conditions);
    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(daftarCatat)
      .innerJoin(pelanggan, eq(daftarCatat.nolg, pelanggan.nolg))
      .where(where);
    const rows = await db
      .select({
        id: daftarCatat.id,
        thbl: daftarCatat.periode,
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        ruteKode: daftarCatat.ruteKode,
        petugasId: daftarCatat.petugasId,
        petugasNama: petugasCater.nama,
        noMeter: pelanggan.noMeter,
        tarifKode: pelanggan.tarifKode,
        urutan: daftarCatat.urutan,
      })
      .from(daftarCatat)
      .innerJoin(pelanggan, eq(daftarCatat.nolg, pelanggan.nolg))
      .leftJoin(petugasCater, eq(daftarCatat.petugasId, petugasCater.id))
      .where(where)
      .orderBy(daftarCatat.urutan, pelanggan.nolg)
      .limit(pageSize)
      .offset(offset);

    return {
      rows: rows.map((row) => ({
        id: row.id,
        pelangganId: row.nolg,
        nomorLangganan: row.nolg,
        namaPelanggan: row.nama,
        alamatPelanggan: row.alamat,
        periode: Number(row.thbl),
        standAwal: null,
        standAkhir: null,
        pemakaian: null,
        kondisi: "BELUM_DICATAT",
        status: "BELUM_DIBACA",
        nomorMeter: row.noMeter,
        pencatat: row.petugasId
          ? {
              id: row.petugasId,
              namaLapangan: row.petugasNama ?? row.petugasId,
            }
          : null,
        pelanggan: {
          id: row.nolg,
          nomorLangganan: row.nolg,
          nama: row.nama,
          alamat: row.alamat,
          tarifGolongan: row.tarifKode ? { kodeAsli: row.tarifKode } : null,
          rute: row.ruteKode ? { kode: row.ruteKode } : null,
        },
      })),
      total: countRow?.total ?? 0,
    };
  }

  async getMandiriRows(query: GridQuery) {
    const period = query.periode ? String(query.periode) : undefined;
    const pageSize = Math.max(1, Math.min(Number(query.pageSize ?? 100), 5000));
    const offset = Math.max(
      0,
      Number(query.offset ?? Number(query.page ?? 0) * pageSize),
    );
    const conditions = [];
    if (period) conditions.push(eq(caterMandiriPelanggan.thbl, period));
    if (query.id) conditions.push(eq(caterMandiriPelanggan.id, query.id));
    if (query.status) {
      const statusMap: Record<string, string> = {
        MENUNGGU: "PENDING",
        DIVERIFIKASI: "APPROVED",
        DIGUNAKAN: "APPROVED",
        DITOLAK: "REJECTED",
      };
      conditions.push(
        eq(
          caterMandiriPelanggan.statusVerifikasi,
          statusMap[query.status] ?? query.status,
        ),
      );
    }
    if (query.q) {
      const pattern = `%${query.q}%`;
      conditions.push(
        or(ilike(pelanggan.nolg, pattern), ilike(pelanggan.nama, pattern))!,
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(caterMandiriPelanggan)
      .innerJoin(pelanggan, eq(caterMandiriPelanggan.nolg, pelanggan.nolg))
      .where(where);
    const rows = await db
      .select({
        id: caterMandiriPelanggan.id,
        thbl: caterMandiriPelanggan.thbl,
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        titikLokasi: pelanggan.titikLokasi,
        stml: caterBacaMeter.stml,
        stma: caterMandiriPelanggan.stma,
        pakaiM3: caterMandiriPelanggan.pakaiM3,
        fotoMeterUrl: caterMandiriPelanggan.fotoMeterUrl,
        fotoRumahUrl: caterMandiriPelanggan.fotoRumahUrl,
        status: caterMandiriPelanggan.statusVerifikasi,
        alasanPenolakan: caterMandiriPelanggan.alasanPenolakan,
        createdAt: caterMandiriPelanggan.createdAt,
        verifiedAt: caterMandiriPelanggan.verifiedAt,
        verifiedBy: caterMandiriPelanggan.verifiedBy,
        caterId: caterBacaMeter.id,
        caterStatus: caterBacaMeter.statusVerifikasi,
        caterStma: caterBacaMeter.stma,
        caterPakai: caterBacaMeter.pakaiM3,
        caterPakaiLalu: caterBacaMeter.pakaiLalu,
        caterKondisi: caterBacaMeter.ketCatat,
      })
      .from(caterMandiriPelanggan)
      .innerJoin(pelanggan, eq(caterMandiriPelanggan.nolg, pelanggan.nolg))
      .leftJoin(
        caterBacaMeter,
        eq(caterMandiriPelanggan.id, caterBacaMeter.caterMandiriId),
      )
      .where(where)
      .orderBy(desc(caterMandiriPelanggan.createdAt))
      .limit(query.id ? 1 : pageSize)
      .offset(query.id ? 0 : offset);

    return {
      rows: rows.map((row) => {
        const final = Boolean(
          row.caterId &&
          FINAL_STATUSES.includes(
            row.caterStatus as (typeof FINAL_STATUSES)[number],
          ),
        );
        const point = row.titikLokasi as { x?: number; y?: number } | null;
        const status =
          row.status === "PENDING"
            ? "MENUNGGU"
            : row.status === "REJECTED"
              ? "DITOLAK"
              : final
                ? "DIGUNAKAN"
                : "DIVERIFIKASI";
        return {
          id: row.id,
          status,
          pelangganId: row.nolg,
          nomorLangganan: row.nolg,
          namaPelanggan: row.nama,
          standAwal: asNumber(row.stml),
          standAkhir: asNumber(row.stma),
          standDilaporkan: asNumber(row.stma),
          pemakaian: asNumber(row.pakaiM3),
          pemakaianLalu: asNumber(row.caterPakaiLalu),
          kondisi: row.caterKondisi ?? "STAND_KONSUMEN",
          tanggalCatat: toIso(row.createdAt),
          verifiedAt: toIso(row.verifiedAt),
          verifiedBy: row.verifiedBy ? { name: null } : null,
          verifiedByRole: null,
          sudahTahapPetugas: Boolean(row.caterId),
          sudahDitagih: final,
          isVerified: row.status === "APPROVED",
          pembacaanId: final ? row.caterId : null,
          alasanDitolak: row.alasanPenolakan,
          fotoUrl: row.fotoMeterUrl,
          namaPelapor: row.nama,
          nomorPelapor: null,
          pelanggan: {
            id: row.nolg,
            nomorLangganan: row.nolg,
            nama: row.nama,
            alamat: row.alamat,
            geoLat: point?.y ?? null,
            geoLong: point?.x ?? null,
          },
          pembacaan: row.caterId
            ? {
                id: row.caterId,
                standLalu: asNumber(row.stml) ?? 0,
                standAkhir: asNumber(row.caterStma) ?? 0,
                pemakaianRiil: asNumber(row.caterPakai),
                pemakaianM3: asNumber(row.caterPakai) ?? 0,
                pemakaianLalu: asNumber(row.caterPakaiLalu),
                kondisi: row.caterKondisi,
              }
            : null,
        };
      }),
      total: countRow?.total ?? 0,
    };
  }

  async getMasterOptions() {
    const [
      pencatats,
      rutes,
      wilayah,
      zona,
      tarif,
      kecamatanRows,
      kelurahanRows,
    ] = await Promise.all([
      db
        .select({ id: petugasCater.id, namaLapangan: petugasCater.nama })
        .from(petugasCater)
        .where(eq(petugasCater.aktif, true)),
      db.select().from(ruteCater),
      db.select().from(wilayahAdministrasi),
      db.select().from(zonaDistribusi),
      db.select().from(golonganTarif),
      db.select().from(kecamatan),
      db.select().from(kelurahan),
    ]);
    return {
      pencatats,
      rutes,
      wilayah,
      zona,
      tarif,
      kecamatan: kecamatanRows,
      kelurahan: kelurahanRows,
    };
  }

  async getAssignments(periode?: number | string) {
    const conditions = [
      sql`${daftarCatat.petugasId} IS NOT NULL`,
      sql`${daftarCatat.ruteKode} IS NOT NULL`,
    ];
    if (periode) conditions.push(eq(daftarCatat.periode, String(periode)));
    const rows = await db
      .selectDistinct({
        petugasId: daftarCatat.petugasId,
        ruteId: daftarCatat.ruteKode,
      })
      .from(daftarCatat)
      .where(and(...conditions));
    return rows.flatMap((row) =>
      row.petugasId && row.ruteId
        ? [{ pencatatId: row.petugasId, ruteId: row.ruteId }]
        : [],
    );
  }

  async getReadingHistory(
    query: GridQuery & {
      pelangganId?: string;
      meterId?: string;
      periodeSebelum?: number;
    },
  ) {
    const conditions = [];
    if (query.pelangganId) {
      conditions.push(eq(caterBacaMeter.nolg, query.pelangganId));
    } else if (query.meterId) {
      conditions.push(
        sql`${caterBacaMeter.nolg} IN (
          SELECT nolg FROM pelanggan WHERE no_meter = ${query.meterId}
        )`,
      );
    }
    if (query.periodeSebelum)
      conditions.push(
        sql`${caterBacaMeter.thbl} < ${String(query.periodeSebelum)}`,
      );
    const rows = await db
      .select({
        id: caterBacaMeter.id,
        thbl: caterBacaMeter.thbl,
        stml: caterBacaMeter.stml,
        stma: caterBacaMeter.stma,
        pakaiM3: caterBacaMeter.pakaiM3,
        ketCatat: caterBacaMeter.ketCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        metodeCatat: caterBacaMeter.metodeCatat,
      })
      .from(caterBacaMeter)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(caterBacaMeter.thbl))
      .limit(Math.max(1, Math.min(Number(query.pageSize ?? 6), 100)));
    return rows.map((row) => ({
      id: row.id,
      periode: `${row.thbl.slice(0, 4)}-${row.thbl.slice(4)}-01T00:00:00.000Z`,
      standLalu: Number(row.stml),
      standAkhir: Number(row.stma),
      pemakaianM3: Number(row.pakaiM3),
      pemakaianRiil: Number(row.pakaiM3),
      pemakaianLalu: null,
      blokTarif: 1,
      kondisi: row.ketCatat,
      fotoBukti: row.fotoMeterUrl,
      sumberLaporan: row.metodeCatat === "OFFSITE" ? "KONSUMEN" : "PETUGAS",
    }));
  }

  async getWorkPeriods() {
    const rows = await db
      .select({
        periode: periodePenagihan.periode,
        status: periodePenagihan.status,
      })
      .from(periodePenagihan)
      .orderBy(desc(periodePenagihan.periode));
    const open = rows.find((row) => row.status === "BERJALAN");
    return {
      periodeKerja: open ? Number(open.periode) : null,
      periode: rows.map((row) => ({
        periode: Number(row.periode),
        terkunci: row.status !== "BERJALAN",
      })),
      saran: null,
    };
  }

  async getMeters(pelangganId: string) {
    const [customer] = await db
      .select({ noMeter: pelanggan.noMeter })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, pelangganId));
    if (!customer?.noMeter) return [];

    const [meter] = await db
      .select({
        noMeter: waterMeter.noMeter,
        merk: waterMeter.merk,
      })
      .from(waterMeter)
      .where(eq(waterMeter.noMeter, customer.noMeter));
    return meter
      ? [
          {
            id: meter.noMeter,
            nomorMeter: meter.noMeter,
            merkKode: meter.merk,
            isAktif: true,
          },
        ]
      : [];
  }

  async searchManualCustomers(nomor: string, periode: number | string) {
    const pattern = `%${nomor}%`;
    const rows = await db
      .select({
        id: pelanggan.nolg,
        nomorLangganan: pelanggan.nolg,
        nama: pelanggan.nama,
        nolg: pelanggan.nolg,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        tarifNama: golonganTarif.nama,
        noMeter: pelanggan.noMeter,
        standTerakhir: sql<number | null>`(
          select c.stma::numeric
          from cater_baca_meter c
          where c.nolg = ${pelanggan.nolg}
          order by c.thbl desc
          limit 1
        )`,
        laporanId: caterBacaMeter.id,
      })
      .from(pelanggan)
      .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
      .leftJoin(
        caterBacaMeter,
        and(
          eq(caterBacaMeter.nolg, pelanggan.nolg),
          eq(caterBacaMeter.thbl, String(periode)),
        ),
      )
      .where(
        and(
          or(ilike(pelanggan.nolg, pattern), ilike(pelanggan.nama, pattern)),
          eq(pelanggan.status, "PELANGGAN AKTIF"),
        ),
      )
      .limit(30);

    return rows.map((row) => ({
      id: row.id,
      nomorLangganan: row.nomorLangganan,
      nama: row.nama,
      tarifGolongan: row.tarifKode
        ? { kodeAsli: row.tarifKode, nama: row.tarifNama }
        : null,
      nomorMeter: row.noMeter,
      meterAktif: Boolean(row.noMeter),
      meterAmbigu: false,
      standTerakhir: asNumber(row.standTerakhir),
      sudahAdaLaporan: Boolean(row.laporanId),
      bolehTimpaLaporan: false,
    }));
  }
}

export const verifikasiGridService = new VerifikasiGridService();
