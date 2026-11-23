import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  not,
  notIlike,
  or,
  sql,
} from "drizzle-orm";
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
import { hitungDeviasiPersentase } from "../../domain/cater/anomali-evaluator";

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

export const FINAL_STATUSES = [
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

function whereKondisi(value: string) {
  const norm = value.toUpperCase().trim();
  switch (norm) {
    case "NORMAL":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('NORMAL', 'NIHIL')`;
    case "TIDAK_DIPAKAI":
    case "TIDAK DIPAKAI":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('TIDAK DIPAKAI', 'TIDAK_DIPAKAI')`;
    case "RUMAH_KOSONG":
    case "RUMAH KOSONG":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('RUMAH KOSONG', 'RUMAH_KOSONG', 'RMH/TANAH KSG', 'TANAH KOSONG')`;
    case "STAND_TEMPEL":
    case "STAND TEMPEL":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('STAND TEMPEL', 'STAND_TEMPEL')`;
    case "STAND_KONSUMEN":
    case "STAND-KONSUMEN":
    case "STAND KONSUMEN":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('STAND-KONSUMEN', 'STAND KONSUMEN', 'STAND_KONSUMEN')`;
    case "METER_RUSAK":
    case "METER RUSAK":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('METER RUSAK', 'METER_RUSAK', 'RUSAK')`;
    case "METER_MATI_ADA_AIR":
    case "MATI ADA AIR":
    case "METER MATI AIR ADA":
    case "METER MATI":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('MATI ADA AIR', 'METER MATI AIR ADA', 'METER_MATI_ADA_AIR', 'METER MATI')`;
    case "METER_MUNDUR":
    case "METER MUNDUR":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('METER MUNDUR', 'METER_MUNDUR')`;
    case "METER_TERBALIK":
    case "METER TERBALIK":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('METER TERBALIK', 'METER_TERBALIK')`;
    case "METER_DALAM_AIR":
    case "METER DALAM AIR":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('METER DALAM AIR', 'METER_DALAM_AIR')`;
    case "LOS_METER":
    case "LOS METER":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('LOS METER', 'LOS_METER')`;
    case "BMK_BMB":
    case "BMK/BMB":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('BMK/BMB', 'BMK_BMB', 'BMK', 'BMB')`;
    case "TTB":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) = 'TTB'`;
    case "MTA":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) = 'MTA'`;
    case "TERHALANG":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('TERHALANG', 'TERHALANG ')`;
    case "TIDAK_ADA_AIR":
    case "TIDAK ADA AIR":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('TIDAK ADA AIR', 'TIDAK_ADA_AIR')`;
    case "ADA_ANJING":
    case "ADA ANJING":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('ADA ANJING', 'ADA_ANJING')`;
    case "DK":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) = 'DK'`;
    case "MB":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) = 'MB'`;
    case "MUDA_KEMBALI":
    case "MUDA KEMBALI":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('MUDA KEMBALI', 'MUDA_KEMBALI')`;
    case "REV_PENCATAT":
    case "REV.PENCATAT":
    case "REVISI PENCATAT":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('REV.PENCATAT', 'REV_PENCATAT', 'REVISI PENCATAT')`;
    case "DICABUT":
    case "DI CABUT":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('DICABUT', 'DI CABUT')`;
    case "TAKSASI_PERDIR":
    case "TAKSASI PERDIR":
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN ('TAKSASI PERDIR', 'TAKSASI_PERDIR')`;
    default: {
      const spaceVal = norm.replace(/_/g, " ");
      return sql`upper(trim(${caterBacaMeter.ketCatat})) IN (${norm}, ${spaceVal})`;
    }
  }
}

function whereStatus(value?: string) {
  switch (value?.toUpperCase()) {
    case "SUBMITTED":
    case "MENUNGGU":
    case "WAITING":
      return inArray(caterBacaMeter.statusVerifikasi, [
        ...WAITING_STATUSES,
      ]);
    case "SUBMITTED_ONLY":
      return inArray(caterBacaMeter.statusVerifikasi, [
        ...MENUNGGU_V1_STATUSES,
      ]);
    case "VERIFIED_L1":
    case "V1":
      return eq(caterBacaMeter.statusVerifikasi, "VERIFIED_L1");
    case "VERIFIED_L2":
    case "V2":
      return eq(caterBacaMeter.statusVerifikasi, "VERIFIED_L2");
    case "APPROVED_FINAL":
    case "DIVERIFIKASI":
    case "V3":
      return inArray(caterBacaMeter.statusVerifikasi, [...FINAL_STATUSES]);
    case "NEED_RESURVEY":
    case "DITOLAK":
    case "CEK_ULANG":
      return eq(caterBacaMeter.statusVerifikasi, "NEED_RESURVEY");
    default:
      return value ? eq(caterBacaMeter.statusVerifikasi, value) : undefined;
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
  const [fromPeriode, fromTable] = await Promise.all([
    db
      .select({ periode: periodePenagihan.periode })
      .from(periodePenagihan)
      .orderBy(desc(periodePenagihan.periode)),
    db
      .selectDistinct({ periode: table.thbl })
      .from(table)
      .orderBy(desc(table.thbl)),
  ]);
  const set = new Set<number>();
  for (const r of fromPeriode) set.add(Number(r.periode));
  for (const r of fromTable) set.add(Number(r.periode));
  return Array.from(set).sort((a, b) => b - a);
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

    const [anomaliCountRow] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(caterBacaMeter)
      .where(
        and(
          period ? eq(caterBacaMeter.thbl, period) : undefined,
          eq(caterBacaMeter.isAnomali, true)
        ),
      );

    const stats = statsFromCounts(
      counts.map((row) => ({ status: row.status, count: row.count })),
      await periodsFor(caterBacaMeter),
    );
    if (anomaliCountRow?.count !== undefined) {
      stats.anomali = anomaliCountRow.count;
    }
    return stats;
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
    if (query.pencatatId) {
      conditions.push(
        sql`upper(trim(${caterBacaMeter.petugasId})) = upper(trim(${query.pencatatId}))`,
      );
    }
    if (query.ruteId || query.ruteKode) {
      const ruteVal = (query.ruteId ?? query.ruteKode!).trim();
      conditions.push(
        sql`upper(trim(${caterBacaMeter.ruteKode})) = upper(trim(${ruteVal}))`,
      );
    }
    const statusCondition = whereStatus(query.statusVerif);
    if (statusCondition) conditions.push(statusCondition);
    if (query.kondisi) {
      const kondisiCondition = whereKondisi(query.kondisi);
      if (kondisiCondition) conditions.push(kondisiCondition);
    }
    if (query.jenisInput) {
      if (query.jenisInput === "KONSUMEN") {
        conditions.push(
          or(
            inArray(caterBacaMeter.sumberCatat, ["MANDIRI_WEB", "MANDIRI_APP"]),
            isNotNull(caterBacaMeter.caterMandiriId),
          )!,
        );
      } else if (query.jenisInput === "MANUAL_MASSAL") {
        conditions.push(
          and(
            or(
              eq(caterBacaMeter.sumberCatat, "MANUAL"),
              eq(caterBacaMeter.sumberCatat, "MANUAL_MASSAL"),
            ),
            ilike(caterBacaMeter.catatan, "%Masal%"),
          )!,
        );
      } else if (query.jenisInput === "MANUAL_SATUAN") {
        conditions.push(
          and(
            or(
              eq(caterBacaMeter.sumberCatat, "MANUAL"),
              eq(caterBacaMeter.sumberCatat, "MANUAL_SATUAN"),
            ),
            notIlike(caterBacaMeter.catatan, "%Masal%"),
          )!,
        );
      } else if (query.jenisInput === "MANUAL") {
        conditions.push(
          or(
            eq(caterBacaMeter.sumberCatat, "MANUAL"),
            eq(caterBacaMeter.sumberCatat, "MANUAL_SATUAN"),
            eq(caterBacaMeter.sumberCatat, "MANUAL_MASSAL"),
          )!,
        );
      } else if (query.jenisInput === "PETUGAS") {
        conditions.push(
          and(
            not(inArray(caterBacaMeter.sumberCatat, ["MANDIRI_WEB", "MANDIRI_APP"])),
            not(inArray(caterBacaMeter.sumberCatat, ["MANUAL", "MANUAL_SATUAN", "MANUAL_MASSAL"])),
            isNull(caterBacaMeter.caterMandiriId),
          )!,
        );
      }
    }
    if (query.tanggalDari) {
      const tglDariStr = query.tanggalDari.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(tglDariStr)) {
        conditions.push(sql`${caterBacaMeter.tglCatat} >= ${tglDariStr}::date`);
      }
    }
    if (query.tanggalSampai) {
      const tglSampaiStr = query.tanggalSampai.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(tglSampaiStr)) {
        conditions.push(
          sql`${caterBacaMeter.tglCatat} < (${tglSampaiStr}::date + interval '1 day')`,
        );
      }
    }
    if (query.hanyaAnomali === "true") {
      conditions.push(eq(caterBacaMeter.isAnomali, true));
    } else if (query.hanyaAnomali === "false") {
      conditions.push(eq(caterBacaMeter.isAnomali, false));
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
        isAnomali: caterBacaMeter.isAnomali,
        kodeAnomaliUtama: caterBacaMeter.kodeAnomaliUtama,
        kodeAnomaliList: caterBacaMeter.kodeAnomaliList,
        tglCatat: caterBacaMeter.tglCatat,
        fotoMeterUrl: caterBacaMeter.fotoMeterUrl,
        fotoSegelUrl: caterBacaMeter.fotoSegelUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
        catatan: caterBacaMeter.catatan,
        caterMandiriId: caterBacaMeter.caterMandiriId,
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
        // Abaikan histori log sebelum SYSTEM_RESET terakhir karena data baca meter telah di-reset
        const resetIndex = rowLogs.findIndex((log) => log.stage === "SYSTEM_RESET");
        const activeLogs = resetIndex >= 0 ? rowLogs.slice(0, resetIndex) : rowLogs;

        const latestV1 = activeLogs.find((log) => log.stage === "V1");
        const latestV2 = activeLogs.find((log) => log.stage === "V2");
        const latestV3 = activeLogs.find((log) => log.stage === "V3");
        const v1 = latestV1?.action === "APPROVE" ? latestV1 : undefined;
        const v2 = latestV2?.action === "APPROVE" ? latestV2 : undefined;
        const v3 = latestV3?.action === "APPROVE" ? latestV3 : undefined;
        const rejected = row.statusVerifikasi === "NEED_RESURVEY";
        const final = FINAL_STATUSES.includes(
          row.statusVerifikasi as (typeof FINAL_STATUSES)[number],
        );
        const point = row.titikLokasi as { x?: number; y?: number } | null;

        // Status-aware verification stages:
        // verif3At HANYA aktif jika statusVerifikasi merupakan final (APPROVED_FINAL, CORRECTED_POST_VERIF, LOCKED_BILLING).
        // Jangan pernah menampilkan V3 jika statusVerifikasi adalah SUBMITTED / DRAFT / ANOMALY!
        const hasV3 = final && Boolean(v3);
        const hasV2 = (final || row.statusVerifikasi === "VERIFIED_L2") && Boolean(v2 || v3);
        const hasV1 =
          (final ||
            row.statusVerifikasi === "VERIFIED_L2" ||
            row.statusVerifikasi === "VERIFIED_L1") &&
          Boolean(v1 || v2 || v3);

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
          standAngkatRevisi: asNumber(row.standAngkatRevisi),
          standMeterBaruRevisi: asNumber(row.standMeterBaruRevisi),
          standAngkatLama:
            asNumber(row.standAngkatRevisi) ?? asNumber(row.standAngkatLama),
          standMeterBaru:
            asNumber(row.standMeterBaruRevisi) ??
            (row.ketCatatRevisi === "MB" || row.ketCatat === "MB"
              ? (asNumber(row.stmaRevisi) ?? asNumber(row.stma))
              : null),
          standPasang: asNumber(row.standPasang),
          pemakaian: asNumber(row.pakaiM3Revisi) ?? asNumber(row.pakaiM3),
          pemakaianRevisi: asNumber(row.pakaiM3Revisi),
          pemakaianTagihVerif: asNumber(row.pakaiTagih),
          kondisiRevisi: row.ketCatatRevisi,
          pemakaianLalu: asNumber(row.pakaiLalu),
          persentase: hitungDeviasiPersentase(
            asNumber(row.pakaiM3Revisi) ?? asNumber(row.pakaiM3),
            asNumber(row.pakaiLalu),
          ),
          kondisi: row.ketCatat,
          isAnomali: Boolean(row.isAnomali),
          kodeAnomaliUtama: row.kodeAnomaliUtama ?? null,
          kodeAnomaliList: (row.kodeAnomaliList as string[]) ?? [],
          jenisInput:
            row.sumberCatat.startsWith("MANDIRI") || Boolean(row.caterMandiriId)
              ? "KONSUMEN"
              : row.sumberCatat === "MANUAL" || row.sumberCatat.includes("MANUAL")
                ? row.catatan?.includes("Masal") || row.sumberCatat === "MANUAL_MASSAL"
                  ? "MANUAL_MASSAL"
                  : "MANUAL_SATUAN"
                : "PETUGAS",
          tanggalCatat: toIso(row.tglCatat),
          status: mapStatus(row.statusVerifikasi),
          isVerified: final,
          isCorrected:
            activeLogs.some(
              (log) =>
                log.stage === "FORM_CORRECTION" && log.action === "ADJUST_STAND",
            ) ||
            Boolean(
              row.stmlRevisi ||
                row.stmaRevisi ||
                row.standAngkatRevisi ||
                row.standMeterBaruRevisi ||
                row.pakaiM3Revisi ||
                row.ketCatatRevisi,
            ),
          verifiedAt: rejected ? toIso(latestV1?.createdAt) : null,
          catatanVerif: rejected
            ? (latestV1?.alasan ?? row.catatan)
            : row.catatan,
          pembacaanId: final ? row.id : null,
          verif1At: hasV1 ? toIso(v1?.createdAt ?? v2?.createdAt ?? v3?.createdAt) : null,
          verif2At: hasV2 ? toIso(v2?.createdAt ?? v3?.createdAt) : null,
          verif3At: hasV3 ? toIso(v3?.createdAt) : null,
          verif1By: hasV1 && v1 ? { name: v1.userName } : null,
          verif2By: hasV2 && v2 ? { name: v2.userName } : null,
          verif3By: hasV3 && v3 ? { name: v3.userName } : null,
          verifiedBy: hasV3 && v3 ? { name: v3.userName } : null,
          nomorMeter: row.noMeter,
          fotoStandUrl: row.fotoMeterUrl,
          fotoSegelUrl: row.fotoSegelUrl,
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
                sumberLaporan:
                  row.sumberCatat.startsWith("MANDIRI") || Boolean(row.caterMandiriId)
                    ? "KONSUMEN"
                    : row.sumberCatat.includes("MANUAL")
                      ? "MANUAL"
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

    if (!countRow || countRow.total === 0) {
      // Fallback robust: Jika daftarCatat periode ini belum dibuat/kosong,
      // tampilkan seluruh pelanggan aktif yang belum tercatat di cater_baca_meter pada periode ini.
      const targetPeriod = period ?? "202611";
      const pConditions = [
        or(
          eq(pelanggan.status, "PELANGGAN AKTIF"),
          eq(pelanggan.status, "ONSITE"),
          eq(pelanggan.status, "OFFSITE"),
        ),
        sql`NOT EXISTS (
          SELECT 1 FROM cater_baca_meter c
          WHERE c.nolg = ${pelanggan.nolg}
            AND c.thbl = ${targetPeriod}
        )`,
      ];
      if (query.pencatatId) {
        pConditions.push(
          sql`EXISTS (
            SELECT 1 FROM rute_cater rc
            WHERE rc.kode = ${pelanggan.ruteKode}
              AND rc.pencatat_default = ${query.pencatatId}
          )`,
        );
      }
      if (query.ruteId) {
        pConditions.push(eq(pelanggan.ruteKode, query.ruteId));
      }
      if (query.q) {
        const pattern = `%${query.q}%`;
        pConditions.push(
          or(ilike(pelanggan.nolg, pattern), ilike(pelanggan.nama, pattern))!,
        );
      }
      const pWhere = and(...pConditions);
      const [fallbackCount] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(pelanggan)
        .where(pWhere);

      const fallbackRows = await db
        .select({
          id: sql<string>`concat('dpm-', ${targetPeriod}::text, '-', ${pelanggan.nolg})`,
          thbl: sql<string>`${targetPeriod}::text`,
          nolg: pelanggan.nolg,
          nama: pelanggan.nama,
          alamat: pelanggan.alamat,
          ruteKode: pelanggan.ruteKode,
          petugasId: ruteCater.pencatatDefault,
          petugasNama: petugasCater.nama,
          noMeter: pelanggan.noMeter,
          tarifKode: pelanggan.tarifKode,
          urutan: pelanggan.noUrutRute,
          standAwal: sql<string | null>`(
            SELECT c.stma::text FROM cater_baca_meter c
            WHERE c.nolg = ${pelanggan.nolg}
            ORDER BY c.thbl DESC
            LIMIT 1
          )`,
        })
        .from(pelanggan)
        .leftJoin(ruteCater, eq(pelanggan.ruteKode, ruteCater.kode))
        .leftJoin(petugasCater, eq(ruteCater.pencatatDefault, petugasCater.id))
        .where(pWhere)
        .orderBy(pelanggan.noUrutRute, pelanggan.nolg)
        .limit(pageSize)
        .offset(offset);

      return {
        rows: fallbackRows.map((row) => ({
          id: row.id,
          pelangganId: row.nolg,
          nomorLangganan: row.nolg,
          namaPelanggan: row.nama,
          alamatPelanggan: row.alamat,
          periode: Number(row.thbl),
          standAwal: asNumber(row.standAwal),
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
        total: fallbackCount?.total ?? 0,
      };
    }

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
        standAwal: daftarCatat.standAwal,
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
        standAwal: asNumber(row.standAwal),
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
        stml: sql<string | null>`COALESCE(
          ${caterBacaMeter.stml}::text,
          (SELECT c2.stma::text FROM cater_baca_meter c2 WHERE c2.nolg = ${caterMandiriPelanggan.nolg} AND c2.thbl < ${caterMandiriPelanggan.thbl} ORDER BY c2.thbl DESC LIMIT 1),
          (SELECT m.stand_pasang::text FROM water_meter_mutasi m WHERE m.nolg = ${caterMandiriPelanggan.nolg} ORDER BY m.created_at DESC LIMIT 1)
        )`,
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
        caterMandiriId: caterBacaMeter.caterMandiriId,
      })
      .from(caterMandiriPelanggan)
      .innerJoin(pelanggan, eq(caterMandiriPelanggan.nolg, pelanggan.nolg))
      .leftJoin(
        caterBacaMeter,
        and(
          eq(caterMandiriPelanggan.nolg, caterBacaMeter.nolg),
          eq(caterMandiriPelanggan.thbl, caterBacaMeter.thbl),
        ),
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
        const stAwal = asNumber(row.stml);
        const stAkhir = asNumber(row.stma);
        const pemakaian =
          stAwal != null && stAkhir != null && stAkhir >= stAwal
            ? stAkhir - stAwal
            : asNumber(row.pakaiM3);
        return {
          id: row.id,
          status,
          periode: Number(row.thbl),
          pelangganId: row.nolg,
          nomorLangganan: row.nolg,
          namaPelanggan: row.nama,
          standAwal: stAwal,
          standAkhir: stAkhir,
          standDilaporkan: stAkhir,
          pemakaian,
          pemakaianLalu: asNumber(row.caterPakaiLalu),
          kondisi: row.caterKondisi ?? "STAND_KONSUMEN",
          jenisInput: "KONSUMEN",
          sumberLaporan: "KONSUMEN",
          tanggalCatat: toIso(row.createdAt),
          createdAt: toIso(row.createdAt),
          verifiedAt: toIso(row.verifiedAt),
          verifiedBy: row.verifiedBy ? { name: null } : null,
          verifiedByRole: null,
          sudahTahapPetugas: Boolean(
            row.caterMandiriId && row.caterMandiriId === row.id,
          ),
          sudahDitagih: final,
          isVerified: row.status === "APPROVED",
          pembacaanId: final ? row.caterId : null,
          alasanDitolak: row.alasanPenolakan,
          fotoUrl: row.fotoMeterUrl,
          fotoRumahUrl: row.fotoRumahUrl,
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
                standLalu: stAwal ?? 0,
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
        fotoSegelUrl: caterBacaMeter.fotoSegelUrl,
        fotoRumahUrl: caterBacaMeter.fotoRumahUrl,
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
      fotoSegelUrl: row.fotoSegelUrl,
      fotoRumahUrl: row.fotoRumahUrl,
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
    const firstPeriode = rows[0]?.periode ? Number(rows[0].periode) : 0;
    return {
      periodeKerja: open ? Number(open.periode) : firstPeriode,
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
    const periodeStr = String(periode);
    const rows = await db
      .select({
        id: pelanggan.nolg,
        nomorLangganan: pelanggan.nolg,
        nama: pelanggan.nama,
        nolg: pelanggan.nolg,
        alamat: pelanggan.alamat,
        ruteKode: pelanggan.ruteKode,
        tarifKode: pelanggan.tarifKode,
        tarifNama: golonganTarif.nama,
        noMeter: pelanggan.noMeter,
        standTerakhir: sql<number | null>`coalesce(
          ${caterBacaMeter.stml}::numeric,
          (
            select coalesce(c.stma_revisi, c.stma)::numeric
            from cater_baca_meter c
            where c.nolg = ${pelanggan.nolg}
              and c.thbl < ${periodeStr}
            order by c.thbl desc
            limit 1
          ),
          (
            select c.stml::numeric
            from cater_baca_meter c
            where c.nolg = ${pelanggan.nolg}
            order by c.thbl desc
            limit 1
          )
        )`,
        pakaiTerakhir: sql<number | null>`coalesce(
          ${caterBacaMeter.pakaiLalu}::numeric,
          (
            select coalesce(c.pakai_m3_revisi, c.pakai_m3)::numeric
            from cater_baca_meter c
            where c.nolg = ${pelanggan.nolg}
              and c.thbl < ${periodeStr}
            order by c.thbl desc
            limit 1
          ),
          (
            select coalesce(c.pakai_lalu, c.pakai_m3)::numeric
            from cater_baca_meter c
            where c.nolg = ${pelanggan.nolg}
            order by c.thbl desc
            limit 1
          )
        )`,
        standAkhirSaatIni: sql<
          number | null
        >`coalesce(${caterBacaMeter.stmaRevisi}, ${caterBacaMeter.stma})::numeric`,
        pakaiSaatIni: sql<
          number | null
        >`coalesce(${caterBacaMeter.pakaiM3Revisi}, ${caterBacaMeter.pakaiM3})::numeric`,
        ketCatatSaatIni: sql<
          string | null
        >`coalesce(${caterBacaMeter.ketCatatRevisi}, ${caterBacaMeter.ketCatat})`,
        laporanId: caterBacaMeter.id,
        statusVerifikasi: caterBacaMeter.statusVerifikasi,
      })
      .from(pelanggan)
      .leftJoin(golonganTarif, eq(pelanggan.tarifKode, golonganTarif.kode))
      .leftJoin(
        caterBacaMeter,
        and(
          eq(caterBacaMeter.nolg, pelanggan.nolg),
          eq(caterBacaMeter.thbl, periodeStr),
        ),
      )
      .where(
        and(
          or(ilike(pelanggan.nolg, pattern), ilike(pelanggan.nama, pattern)),
          or(
            inArray(pelanggan.status, [
              "ONSITE",
              "OFFSITE",
              "PELANGGAN AKTIF",
              "AKTIF",
            ]),
            sql`${pelanggan.status} NOT IN ('TUTUP', 'CABUT', 'NONAKTIF', 'NON_AKTIF')`,
          ),
        ),
      )
      .limit(30);

    return rows.map((row) => ({
      id: row.id,
      nolg: row.nolg,
      nomorLangganan: row.nomorLangganan,
      nama: row.nama,
      alamat: row.alamat,
      ruteKode: row.ruteKode,
      tarifKode: row.tarifKode,
      tarifNama: row.tarifNama,
      tarifGolongan: row.tarifKode
        ? { kodeAsli: row.tarifKode, nama: row.tarifNama }
        : null,
      noMeter: row.noMeter ?? "MTR-AKTIF",
      nomorMeter: row.noMeter ?? "MTR-AKTIF",
      meterAktif: true,
      meterAmbigu: false,
      standTerakhir: asNumber(row.standTerakhir) ?? 0,
      pakaiTerakhir: asNumber(row.pakaiTerakhir) ?? 0,
      standAkhirSaatIni: asNumber(row.standAkhirSaatIni),
      pakaiSaatIni: asNumber(row.pakaiSaatIni),
      ketCatatSaatIni: row.ketCatatSaatIni ?? null,
      laporanId: row.laporanId,
      statusVerifikasi: row.statusVerifikasi,
      sudahAdaLaporan: Boolean(row.laporanId),
      bolehTimpaLaporan: row.statusVerifikasi !== "LOCKED_BILLING",
    }));
  }
}

export const verifikasiGridService = new VerifikasiGridService();
