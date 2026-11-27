import { Elysia, t } from "elysia";
import { and, desc, eq, inArray, or, isNotNull, ilike, sql } from "drizzle-orm";
import {
  caterBacaMeter,
  caterMandiriPelanggan,
  caterVerifikasiLog,
  daftarCatat,
  db,
  masterKondisiCatat,
  pelanggan,
  periodePenagihan,
  rekeningDrd,
  waterMeter,
  waterMeterMutasi,
  type AppRole,
} from "@cater/db";
import { authPlugin } from "@cater/backend/plugins/auth";
import { caterVerifikasiService } from "@/server/services/cater/cater-verifikasi.service";
import { mandiriService } from "@/server/services/mandiri/mandiri.service";
import {
  verifikasiGridService,
  FINAL_STATUSES,
} from "@/server/services/cater/verifikasi-grid.service";
import { manualAddMasalService } from "@/server/services/cater/manual-add-masal.service";
import {
  hitungKubikasiGantiMeter,
  hitungKubikasiMudaKembali,
} from "@cater/backend/domain/gwm/gwm.engine";
import {
  apakahKondisiTaksasiOtomatis,
  PEMAKAIAN_MINIMUM_PERDIR,
} from "@cater/backend/domain/taksasi/taksasi.engine";
import { evaluasiAnomaliBaris } from "@cater/backend/domain/cater/anomali-evaluator";
import { evaluasiGuardBacaanMeter } from "@cater/backend/domain/cater/guard-bacaan.engine";
import { aturanAnomaliService } from "@/server/services/cater/aturan-anomali.service";

const READ_ROLES: AppRole[] = [
  "STAFF_ADMIN_BILLING",
  "VERIFIKATOR_1",
  "VERIFIKATOR_2",
  "VERIFIKATOR_3",
  "EXECUTIVE",
];
const VERIFY_ROLES: AppRole[] = [
  "STAFF_ADMIN_BILLING",
  "VERIFIKATOR_1",
  "VERIFIKATOR_2",
  "VERIFIKATOR_3",
  "EXECUTIVE",
];

const gridQuerySchema = t.Object({
  id: t.Optional(t.String()),
  periode: t.Optional(t.Numeric()),
  pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 5000 })),
  page: t.Optional(t.Numeric({ minimum: 0 })),
  offset: t.Optional(t.Numeric({ minimum: 0 })),
  q: t.Optional(t.String()),
  pencatatId: t.Optional(t.String()),
  ruteId: t.Optional(t.String()),
  ruteKode: t.Optional(t.String()),
  statusVerif: t.Optional(t.String()),
  status: t.Optional(t.String()),
  tanggalDari: t.Optional(t.String()),
  tanggalSampai: t.Optional(t.String()),
  hanyaAnomali: t.Optional(t.String()),
  filterPemakaian: t.Optional(t.String()),
  kondisi: t.Optional(t.String()),
  jenisInput: t.Optional(t.String()),
  ringkas: t.Optional(t.String()),
  pelangganId: t.Optional(t.String()),
  meterId: t.Optional(t.String()),
  periodeSebelum: t.Optional(t.Numeric()),
});

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Permintaan gagal diproses.";

const sendList = (
  rows: unknown[],
  total: number,
  pageSize?: number,
  page?: number,
) => ({
  success: true,
  data: rows,
  meta: {
    page: Number(page ?? 0),
    pageSize: Number(pageSize ?? rows.length),
    total,
    totalPages: Math.ceil(total / Math.max(1, Number(pageSize ?? rows.length))),
  },
});

function hasRole(roles: readonly string[] | string[], role: string) {
  return roles.includes("SUPERADMIN") || roles.includes(role);
}

function maxRing(roles: readonly string[] | string[]): 1 | 2 | 3 | null {
  if (
    roles.includes("SUPERADMIN") ||
    roles.includes("EXECUTIVE") ||
    roles.includes("VERIFIKATOR_3")
  )
    return 3;
  if (roles.includes("VERIFIKATOR_2")) return 2;
  if (roles.includes("VERIFIKATOR_1")) return 1;
  return null;
}

export const verifikasiRouter = new Elysia({ prefix: "/v1" })
  .use(authPlugin)

  .get(
    "/laporan-harian/stats",
    async ({ query, set }) => {
      try {
        return {
          success: true,
          data: await verifikasiGridService.getLaporanStats(query.periode),
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "VERIFICATION_STATS", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({ periode: t.Optional(t.Numeric()) }),
    },
  )
  .get(
    "/laporan-harian/belum-dibaca",
    async ({ query, set }) => {
      try {
        const result = await verifikasiGridService.getBelumDibaca(query);
        return sendList(
          result.rows,
          result.total,
          Number(query.pageSize),
          Number(query.page),
        );
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "UNREAD_LIST", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES, query: gridQuerySchema },
  )
  .get(
    "/laporan-harian",
    async ({ query, set }) => {
      try {
        const result = await verifikasiGridService.getLaporanRows(query);
        return sendList(
          result.rows,
          result.total,
          Number(query.pageSize),
          Number(query.page),
        );
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "REPORT_LIST", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES, query: gridQuerySchema },
  )
  .get(
    "/laporan-harian/:id",
    async ({ params, set }) => {
      try {
        const result = await verifikasiGridService.getLaporanRows({
          id: params.id,
          pageSize: 1,
        });
        if (!result.rows[0]) {
          set.status = 404;
          return {
            success: false,
            error: { code: "NOT_FOUND", message: "Laporan tidak ditemukan." },
          };
        }
        return { success: true, data: result.rows[0] };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "REPORT_DETAIL", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES, params: t.Object({ id: t.String() }) },
  )

  .get(
    "/laporan-mandiri/stats",
    async ({ query, set }) => {
      try {
        return {
          success: true,
          data: await verifikasiGridService.getMandiriStats(query.periode),
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "SELF_REPORT_STATS", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({ periode: t.Optional(t.Numeric()) }),
    },
  )
  .get(
    "/laporan-mandiri",
    async ({ query, set }) => {
      try {
        const result = await verifikasiGridService.getMandiriRows(query);
        return sendList(
          result.rows,
          result.total,
          Number(query.pageSize),
          Number(query.page),
        );
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "SELF_REPORT_LIST", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES, query: gridQuerySchema },
  )
  .get(
    "/laporan-mandiri/:id",
    async ({ params, set }) => {
      try {
        const result = await verifikasiGridService.getMandiriRows({
          id: params.id,
          pageSize: 1,
        });
        if (!result.rows[0]) {
          set.status = 404;
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Laporan mandiri tidak ditemukan.",
            },
          };
        }
        return { success: true, data: result.rows[0] };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "SELF_REPORT_DETAIL", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES, params: t.Object({ id: t.String() }) },
  )

  .get(
    "/pencatat",
    async ({ set }) => {
      try {
        const { pencatats } = await verifikasiGridService.getMasterOptions();
        return sendList(pencatats, pencatats.length, pencatats.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/rute",
    async ({ set }) => {
      try {
        const { rutes } = await verifikasiGridService.getMasterOptions();
        const rows = rutes.map((route) => ({
          id: route.kode,
          kode: route.kode,
          seksiCater: { wilayahDistId: route.seksiKode },
        }));
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/wilayah-dist",
    async ({ set }) => {
      try {
        const { wilayah } = await verifikasiGridService.getMasterOptions();
        const rows = wilayah.map((row) => ({
          id: row.kode,
          kode: row.kode,
          nama: row.nama,
        }));
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/zona",
    async ({ set }) => {
      try {
        const { zona } = await verifikasiGridService.getMasterOptions();
        const rows = zona.map((row) => ({
          id: row.kode,
          kode: row.kode,
          nama: row.nama,
          wilayahSeksi: { wilayahDistId: row.wildistKode },
        }));
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/tarif",
    async ({ set }) => {
      try {
        const { tarif } = await verifikasiGridService.getMasterOptions();
        const rows = tarif.map((row) => ({
          id: row.kode,
          kodeAsli: row.kode,
          nama: row.nama,
        }));
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/kecamatan",
    async ({ set }) => {
      try {
        const { kecamatan } = await verifikasiGridService.getMasterOptions();
        const rows = kecamatan.map((row) => ({
          id: row.kode,
          kode: row.kode,
          nama: row.nama,
        }));
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/kelurahan",
    async ({ set }) => {
      try {
        const { kelurahan } = await verifikasiGridService.getMasterOptions();
        const rows = kelurahan.map((row) => ({
          id: row.kode,
          kode: row.kode,
          nama: row.nama,
          kecamatanId: row.kecamatanKode,
        }));
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "LOOKUP", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )
  .get(
    "/penugasan-rute/opsi-filter",
    async ({ query, set }) => {
      try {
        return {
          success: true,
          data: await verifikasiGridService.getAssignments(query.periode),
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "ASSIGNMENT_LOOKUP", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({ periode: t.Optional(t.Numeric()) }),
    },
  )
  .get(
    "/pembacaan",
    async ({ query, set }) => {
      try {
        const rows = await verifikasiGridService.getReadingHistory(query);
        return sendList(rows, rows.length, Number(query.pageSize), 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "READING_HISTORY", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES, query: gridQuerySchema },
  )
  .get(
    "/meter",
    async ({ query, set }) => {
      try {
        const rows = await verifikasiGridService.getMeters(
          query.pelangganId ?? "",
        );
        return sendList(rows, rows.length, rows.length, 0);
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "METER_LOOKUP", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({ pelangganId: t.Optional(t.String()) }),
    },
  )
  .get(
    "/manual-add/cari-pelanggan",
    async ({ query, set }) => {
      try {
        return {
          success: true,
          data: await verifikasiGridService.searchManualCustomers(
            query.nomor,
            query.periode,
          ),
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: "MANUAL_CUSTOMER_SEARCH",
            message: errorMessage(error),
          },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({
        nomor: t.String({ minLength: 1 }),
        periode: t.Numeric(),
      }),
    },
  )
  .get(
    "/manual-add/riwayat",
    async ({ query, set }) => {
      try {
        const thbl = String(query.periode ?? "202611");
        const search = query.q ? `%${query.q.trim()}%` : undefined;

        const baseWhere = and(
          eq(caterBacaMeter.thbl, thbl),
          or(
            eq(caterBacaMeter.sumberCatat, "MANUAL"),
            eq(caterBacaMeter.metodeCatat, "OFFSITE"),
            isNotNull(caterBacaMeter.catatan),
          ),
          search
            ? or(
                ilike(caterBacaMeter.nolg, search),
                ilike(pelanggan.nama, search),
                ilike(caterBacaMeter.catatan, search),
              )
            : undefined,
        );

        const rows = await db
          .select({
            id: caterBacaMeter.id,
            nolg: caterBacaMeter.nolg,
            nama: pelanggan.nama,
            alamat: pelanggan.alamat,
            tarifKode: pelanggan.tarifKode,
            ruteKode: caterBacaMeter.ruteKode,
            stml: caterBacaMeter.stml,
            stma: caterBacaMeter.stma,
            pakaiM3: caterBacaMeter.pakaiM3,
            catatan: caterBacaMeter.catatan,
            sumberCatat: caterBacaMeter.sumberCatat,
            statusVerifikasi: caterBacaMeter.statusVerifikasi,
            tglCatat: caterBacaMeter.tglCatat,
            updatedAt: caterBacaMeter.updatedAt,
          })
          .from(caterBacaMeter)
          .innerJoin(pelanggan, eq(caterBacaMeter.nolg, pelanggan.nolg))
          .where(baseWhere)
          .orderBy(desc(caterBacaMeter.updatedAt))
          .limit(100);

        const totalManual = rows.length;
        const totalM3 = rows.reduce(
          (sum, r) => sum + Number(r.pakaiM3 ?? 0),
          0,
        );
        const rataRataM3 =
          totalManual > 0 ? Number((totalM3 / totalManual).toFixed(1)) : 0;

        return {
          success: true,
          data: {
            periode: thbl,
            kpi: {
              totalManual,
              totalM3,
              rataRataM3,
            },
            items: rows.map((r) => ({
              ...r,
              stml: Number(r.stml ?? 0),
              stma: Number(r.stma ?? 0),
              pakaiM3: Number(r.pakaiM3 ?? 0),
            })),
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: "MANUAL_HISTORY_FAILED",
            message: errorMessage(error),
          },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({
        periode: t.Optional(t.Numeric()),
        q: t.Optional(t.String()),
      }),
    },
  )
  // Options Filter Petugas & Rute untuk Manual ADD Masal
  .get(
    "/manual-add/masal/options",
    async ({ set }) => {
      try {
        const data = await manualAddMasalService.getFilterOptions();
        return { success: true, data };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "OPTIONS_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: READ_ROLES,
    },
  )
  // Pratinjau Taksasi Masal (Petugas Berhalangan / Rute Tertentu)
  .get(
    "/manual-add/masal/preview",
    async ({ query, set }) => {
      try {
        const thbl = String(query.periode ?? "202611");
        const petugasId = query.petugasId
          ? String(query.petugasId)
          : query.pencatatId
            ? String(query.pencatatId)
            : undefined;
        const ruteKode = query.ruteKode ? String(query.ruteKode) : undefined;
        const hanyaBelumBaca = query.hanyaBelumBaca !== "false";
        const limit =
          query.limit !== undefined && Number(query.limit) > 0
            ? Number(query.limit)
            : undefined;

        const data = await manualAddMasalService.getPreviewTaksasi({
          thbl,
          petugasId,
          ruteKode,
          hanyaBelumBaca,
          limit,
        });
        return { success: true, data };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "PREVIEW_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: READ_ROLES,
      query: t.Object({
        periode: t.Optional(t.Numeric()),
        petugasId: t.Optional(t.String()),
        pencatatId: t.Optional(t.String()),
        ruteKode: t.Optional(t.String()),
        hanyaBelumBaca: t.Optional(t.String()),
        limit: t.Optional(t.Numeric()),
      }),
    },
  )
  // Eksekusi Taksasi Masal
  .post(
    "/manual-add/masal/eksekusi",
    async ({ body, set }) => {
      try {
        const result = await manualAddMasalService.eksekusiTaksasiMasal({
          periode: String(body.periode),
          alasanKategori: body.alasanKategori,
          catatanBeritaAcara: body.catatanBeritaAcara,
          items: body.items,
        });
        return { success: true, data: result };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: { code: "EKSEKUSI_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: ["STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2"],
      body: t.Object({
        periode: t.Numeric(),
        alasanKategori: t.String({ minLength: 1 }),
        catatanBeritaAcara: t.String(),
        items: t.Array(
          t.Object({
            nolg: t.String(),
            ruteKode: t.Optional(t.Nullable(t.String())),
            stml: t.Number(),
            stma: t.Number(),
            pakaiM3: t.Number(),
          }),
        ),
      }),
    },
  )
  .get(
    "/closing/periode-kerja",
    async ({ set }) => {
      try {
        return {
          success: true,
          data: await verifikasiGridService.getWorkPeriods(),
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: { code: "WORK_PERIOD", message: errorMessage(error) },
        };
      }
    },
    { requireRole: READ_ROLES },
  )

  .patch(
    "/laporan-harian/:id/verifikasi-langsung",
    async ({ params, user, userRoles, set }) => {
      try {
        const ring = maxRing(userRoles ?? []);
        if (!ring) {
          set.status = 403;
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Akun tidak memiliki akses verifikasi.",
            },
          };
        }
        const result =
          ring === 3
            ? await caterVerifikasiService.verifikasiV3(
                { caterId: params.id },
                user!.id,
              )
            : ring === 2
              ? await caterVerifikasiService.verifikasiV2(
                  { caterId: params.id, action: "APPROVE" },
                  user!.id,
                )
              : await caterVerifikasiService.verifikasiV1(
                  { caterId: params.id, action: "APPROVE" },
                  user!.id,
                );
        return { success: true, data: { ring, laporan: result } };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: { code: "VERIFY_FAILED", message: errorMessage(error) },
        };
      }
    },
    { requireRole: VERIFY_ROLES, params: t.Object({ id: t.String() }) },
  )
  .post(
    "/laporan-harian/verif-massal",
    async ({ body, user, userRoles, set }) => {
      const allowed =
        body.ring === 1
          ? hasRole(userRoles ?? [], "VERIFIKATOR_1") ||
            hasRole(userRoles ?? [], "VERIFIKATOR_2") ||
            hasRole(userRoles ?? [], "VERIFIKATOR_3")
          : body.ring === 2
            ? hasRole(userRoles ?? [], "VERIFIKATOR_2") ||
              hasRole(userRoles ?? [], "VERIFIKATOR_3")
            : hasRole(userRoles ?? [], "VERIFIKATOR_3") ||
              hasRole(userRoles ?? [], "EXECUTIVE");
      if (!allowed) {
        set.status = 403;
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Role tidak memiliki akses ke ring verifikasi tersebut.",
          },
        };
      }

      const result = {
        diproses: body.ids.length,
        berhasil: 0,
        dilewati: 0,
        gagal: 0,
        masalah: [] as { nomorLangganan: string; pesan: string }[],
      };
      for (const id of body.ids) {
        try {
          if (body.ring === 3)
            await caterVerifikasiService.verifikasiV3(
              { caterId: id },
              user!.id,
            );
          else if (body.ring === 2)
            await caterVerifikasiService.verifikasiV2(
              { caterId: id, action: "APPROVE" },
              user!.id,
            );
          else
            await caterVerifikasiService.verifikasiV1(
              { caterId: id, action: "APPROVE" },
              user!.id,
            );
          result.berhasil++;
        } catch (error) {
          result.gagal++;
          result.masalah.push({
            nomorLangganan: id,
            pesan: errorMessage(error),
          });
        }
      }
      return { success: true, data: result };
    },
    {
      requireRole: VERIFY_ROLES,
      body: t.Object({
        ring: t.Union([t.Literal(1), t.Literal(2), t.Literal(3)]),
        ids: t.Array(t.String({ minLength: 1 }), {
          minItems: 1,
          maxItems: 500,
        }),
        sertakanAnomali: t.Optional(t.Boolean()),
      }),
    },
  )
  .patch(
    "/laporan-harian/:id/reject",
    async ({ params, body, user, set }) => {
      try {
        const result = await caterVerifikasiService.verifikasiV1(
          {
            caterId: params.id,
            action: "REQUEST_RESURVEY",
            catatan: body.catatanVerif,
          },
          user!.id,
        );
        return { success: true, data: result };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: { code: "REJECT_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: ["VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      params: t.Object({ id: t.String() }),
      body: t.Object({ catatanVerif: t.Optional(t.String()) }),
    },
  )
  .patch(
    "/laporan-harian/:id/unverify",
    async ({ params, user, userRoles, set }) => {
      const [row] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, params.id));
      if (!row) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Pembacaan tidak ditemukan." },
        };
      }
      if (row.statusVerifikasi === "LOCKED_BILLING") {
        set.status = 409;
        return {
          success: false,
          error: {
            code: "LOCKED",
            message: "Pembacaan sudah terkunci dalam DRD.",
          },
        };
      }

      const roles = userRoles ?? [];
      let stage: string;
      let action: string;
      let nextStatus: string;
      if (row.statusVerifikasi === "APPROVED_FINAL") {
        if (!hasRole(roles, "VERIFIKATOR_3") && !hasRole(roles, "EXECUTIVE")) {
          set.status = 403;
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Pembatalan V3 memerlukan role V3.",
            },
          };
        }
        stage = "V3";
        action = "UNVERIFY";
        nextStatus = "SUBMITTED";
      } else if (row.statusVerifikasi === "VERIFIED_L2") {
        if (!hasRole(roles, "VERIFIKATOR_3") && !hasRole(roles, "EXECUTIVE")) {
          set.status = 403;
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Pembatalan V2 memerlukan role V3.",
            },
          };
        }
        stage = "V2";
        action = "UNVERIFY";
        nextStatus = "SUBMITTED";
      } else if (row.statusVerifikasi === "VERIFIED_L1") {
        if (
          !hasRole(roles, "VERIFIKATOR_2") &&
          !hasRole(roles, "VERIFIKATOR_3") &&
          !hasRole(roles, "EXECUTIVE")
        ) {
          set.status = 403;
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Pembatalan V1 memerlukan role V2 atau lebih tinggi.",
            },
          };
        }
        stage = "V1";
        action = "UNVERIFY";
        nextStatus = "SUBMITTED";
      } else if (row.statusVerifikasi === "NEED_RESURVEY") {
        if (
          !hasRole(roles, "VERIFIKATOR_1") &&
          !hasRole(roles, "VERIFIKATOR_2") &&
          !hasRole(roles, "VERIFIKATOR_3") &&
          !hasRole(roles, "EXECUTIVE")
        ) {
          set.status = 403;
          return {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Role tidak dapat membatalkan cek ulang.",
            },
          };
        }
        stage = "V1";
        action = "REOPEN";
        nextStatus = "SUBMITTED";
      } else {
        set.status = 409;
        return {
          success: false,
          error: {
            code: "NOT_VERIFIED",
            message: "Belum ada tahap yang dapat dibatalkan.",
          },
        };
      }

      await db.transaction(async (tx) => {
        await tx.insert(caterVerifikasiLog).values({
          caterId: row.id,
          userId: user!.id,
          stage,
          action,
          stmaSebelum: row.stma,
          stmaSesudah: row.stma,
          pakaiSebelum: row.pakaiM3,
          pakaiSesudah: row.pakaiM3,
          alasan:
            action === "REOPEN"
              ? "Cek ulang dibatalkan dari halaman verifikasi."
              : `Tahap ${stage} dibatalkan dari halaman verifikasi. Status dikembalikan ke antrean belum diverifikasi.`,
        });
        await tx
          .update(caterBacaMeter)
          .set({
            statusVerifikasi: nextStatus,
            pakaiTagih: null,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, row.id));
      });
      return {
        success: true,
        data: {
          id: row.id,
          ring: Number(stage.slice(1)),
          statusVerifikasi: nextStatus,
        },
      };
    },
    { requireRole: VERIFY_ROLES, params: t.Object({ id: t.String() }) },
  )
  .patch(
    "/laporan-harian/:id/koreksi",
    async ({ params, body, user, set }) => {
      const [row] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, params.id));
      if (!row) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Pembacaan tidak ditemukan." },
        };
      }
      if (row.statusVerifikasi === "LOCKED_BILLING") {
        set.status = 409;
        return {
          success: false,
          error: {
            code: "LOCKED",
            message: "Pembacaan yang sudah masuk DRD tidak dapat dikoreksi.",
          },
        };
      }
      const stmlAsli = Number(row.stml);
      const stmaAsli = Number(row.stma);
      const pakaiAsli = Number(row.pakaiM3);
      const kondisiAsli = (row.ketCatat ?? "Normal").trim();

      const stmlRevisi =
        body.standAwalRevisi != null && body.standAwalRevisi !== stmlAsli
          ? body.standAwalRevisi
          : null;
      const stmaRevisi = body.standAkhirRevisi ?? null;
      const stml = stmlRevisi ?? stmlAsli;
      const stma = stmaRevisi ?? stmaAsli;

      const rawKondisiRevisi = body.kondisiRevisi?.trim() || null;
      const isSamaKondisiAsli =
        rawKondisiRevisi != null &&
        rawKondisiRevisi.replace(/_/g, " ").toUpperCase() ===
          kondisiAsli.replace(/_/g, " ").toUpperCase();
      const kondisiRevisi = isSamaKondisiAsli ? null : rawKondisiRevisi;

      const kondisi = (kondisiRevisi ?? kondisiAsli).trim();
      const kondisiUpper = kondisi.toUpperCase();
      const isKondisiMB =
        kondisiUpper === "MB" ||
        (kondisiRevisi == null && (row.tmss ?? "").trim() === "4");
      const isKondisiMudaKembali =
        kondisiUpper === "MUDA_KEMBALI" ||
        kondisiUpper === "MUDA KEMBALI" ||
        (kondisiRevisi == null && (row.tmss ?? "").trim().toUpperCase() === "U");

      const angkaTidakValid = [stml, stma].some(
        (nilai) => !Number.isInteger(nilai) || nilai < 0,
      );
      const tagihanTidakValid =
        body.pemakaianTagihVerif != null &&
        (!Number.isInteger(body.pemakaianTagihVerif) ||
          body.pemakaianTagihVerif < 0);
      const pemakaianRevisiTidakValid =
        body.pemakaianRevisi != null &&
        (!Number.isInteger(body.pemakaianRevisi) || body.pemakaianRevisi < 0);
      const standPasangTidakValid =
        body.standPasang != null &&
        (!Number.isInteger(body.standPasang) || body.standPasang < 0);
      if (
        angkaTidakValid ||
        tagihanTidakValid ||
        pemakaianRevisiTidakValid ||
        standPasangTidakValid
      ) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "INVALID_STAND",
            message:
              "Angka stand dan tagihan harus bilangan bulat nol atau lebih.",
          },
        };
      }

      const defaultMutasiId = `mutasi-${row.thbl}-${row.nolg}`;
      const [pelInfo, mutasi, semuaKondisi] = await Promise.all([
        db
          .select({
            noMeter: pelanggan.noMeter,
            noMeterAsli: pelanggan.noMeterAsli,
            ukuranMeter: pelanggan.ukuranMeter,
            merkMeter: pelanggan.merkMeter,
            jumlahDigit: waterMeter.jumlahDigit,
          })
          .from(pelanggan)
          .leftJoin(waterMeter, eq(pelanggan.noMeter, waterMeter.noMeter))
          .where(eq(pelanggan.nolg, row.nolg))
          .then((rows) => rows[0]),
        db
          .select({
            id: waterMeterMutasi.id,
            standAngkat: waterMeterMutasi.standAngkat,
            standPasang: waterMeterMutasi.standPasang,
            noMeterBaru: waterMeterMutasi.noMeterBaru,
            noMeterLama: waterMeterMutasi.noMeterLama,
          })
          .from(waterMeterMutasi)
          .where(
            row.waterMeterMutasiId
              ? eq(waterMeterMutasi.id, row.waterMeterMutasiId)
              : eq(waterMeterMutasi.id, defaultMutasiId),
          )
          .then((rows) => rows[0]),
        db
          .select({
            kodeTmss: masterKondisiCatat.kodeTmss,
            nama: masterKondisiCatat.nama,
          })
          .from(masterKondisiCatat),
      ]);

      if (
        body.standAngkatLama != null &&
        (!Number.isInteger(body.standAngkatLama) || body.standAngkatLama < 0)
      ) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "INVALID_STAND_ANGKAT",
            message: "Stand angkat meter lama harus bilangan bulat minimal 0.",
          },
        };
      }

      let pakaiM3 = stma - stml;
      let mbOverrideFinal = false;
      let standAngkatFinal: number | null = null;
      let standMeterBaruFinal: number | null = null;
      let standPasangFinal = 0;
      let digitRolloverFinal: number | null = null;
      const cleanNoMeterBaru =
        body.noMeterBaru && body.noMeterBaru.trim() !== "" && body.noMeterBaru.trim() !== "-"
          ? body.noMeterBaru.trim()
          : null;

      if (isKondisiMB) {
        mbOverrideFinal = Boolean(
          body.mbTanpaStandAngkat ??
            (body.standAngkatLama == null ? row.mbTanpaStandAngkat : false),
        );
        standPasangFinal = body.standPasang ?? mutasi?.standPasang ?? 0;
        standAngkatFinal = mbOverrideFinal
          ? null
          : body.standAngkatLama != null
            ? body.standAngkatLama
            : row.standAngkatRevisi != null
              ? Number(row.standAngkatRevisi)
              : (mutasi?.standAngkat ?? null);
        standMeterBaruFinal =
          body.standMeterBaru ??
          stmaRevisi ??
          (row.standMeterBaruRevisi != null
            ? Number(row.standMeterBaruRevisi)
            : Number(row.stma));

        const hasilGantiMeter = hitungKubikasiGantiMeter({
          standLalu: stml,
          standAngkat: standAngkatFinal,
          standPasang: standPasangFinal,
          standBacaBaru: standMeterBaruFinal,
          tanpaStandAngkat: mbOverrideFinal,
        });

        if (!hasilGantiMeter.isValid) {
          set.status = 400;
          return {
            success: false,
            error: {
              code: hasilGantiMeter.butuhKonfirmasiManusia
                ? "MB_STAND_ANGKAT_REQUIRED"
                : "MB_INVALID",
              message:
                hasilGantiMeter.pesanError ??
                "Data koreksi Meter Baru tidak valid.",
            },
          };
        }

        // Izinkan kustomisasi kolom Pakai (pemakaianRevisi) setelah MB tervalidasi (Stand Angkat / Override)
        pakaiM3 =
          body.pemakaianRevisi != null
            ? body.pemakaianRevisi
            : hasilGantiMeter.totalPemakaianM3;
      } else if (isKondisiMudaKembali) {
        const hasilRollover = hitungKubikasiMudaKembali({
          standAwal: stml,
          standAkhir: stma,
          ukuranMeter: pelInfo?.ukuranMeter ?? null,
          jumlahDigitAset: pelInfo?.jumlahDigit ?? null,
          digitOverride:
            body.digitRollover !== undefined
              ? body.digitRollover
              : (row.digitRollover ?? null),
        });

        if (!hasilRollover.isValid) {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "ROLLOVER_INVALID",
              message:
                hasilRollover.pesanError ??
                "Perhitungan Muda Kembali tidak valid.",
            },
          };
        }

        digitRolloverFinal = hasilRollover.digit;
        pakaiM3 =
          body.pemakaianRevisi != null
            ? body.pemakaianRevisi
            : hasilRollover.totalPemakaianM3;
      } else if (body.pemakaianRevisi != null) {
        if (
          stma < stml &&
          (kondisiUpper === "NORMAL" ||
            kondisiUpper === "" ||
            kondisiUpper === "REV_PENCATAT" ||
            kondisiUpper === "REV.PENCATAT")
        ) {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "STAND_MUNDUR_NORMAL",
              message:
                "Stand akhir lebih kecil dari stand awal pada kondisi Normal. Pilih kondisi Meter Baru (MB), Muda Kembali, atau perbaiki angka stand.",
            },
          };
        }
        pakaiM3 = body.pemakaianRevisi;
      } else if (apakahKondisiTaksasiOtomatis(kondisi) && stma === stml) {
        const pakaiSebelumnya = Number(row.pakaiM3Revisi ?? row.pakaiM3 ?? 0);
        const pakaiLaluNum = Number(row.pakaiLalu ?? 0);
        pakaiM3 =
          pakaiSebelumnya > 0
            ? pakaiSebelumnya
            : pakaiLaluNum > 0
              ? Math.ceil(pakaiLaluNum)
              : PEMAKAIAN_MINIMUM_PERDIR;
      } else if (
        body.pemakaianRevisi === undefined &&
        stmlRevisi == null &&
        stmaRevisi == null &&
        stma === stml
      ) {
        const pakaiSebelumnya = Number(row.pakaiM3Revisi ?? row.pakaiM3 ?? 0);
        if (pakaiSebelumnya > 0) {
          pakaiM3 = pakaiSebelumnya;
        }
      } else if (stma < stml) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "NEGATIVE_USAGE",
            message:
              "Pemakaian menghasilkan nilai negatif (Stand Akhir < Stand Awal). Pilih kondisi Meter Baru (MB), Muda Kembali, atau perbaiki angka stand.",
          },
        };
      }

      const stmaEfektifUntukSimpan = isKondisiMB
        ? (standMeterBaruFinal ?? stma)
        : stma;
      const stmaRevisiSimpan =
        stmaEfektifUntukSimpan === stmaAsli && !isKondisiMB
          ? null
          : stmaEfektifUntukSimpan === stmaAsli && stmaRevisi == null
            ? null
            : String(stmaEfektifUntukSimpan);

      // Normalisasi pakaiM3Revisi: jika bukan MB/Rollover dan seluruh stand, kondisi, & pakai kembali persis ke nilai asli petugas -> NULL
      const kembaliKeAsliMurni =
        !isKondisiMB &&
        !isKondisiMudaKembali &&
        stmlRevisi == null &&
        stmaRevisiSimpan == null &&
        kondisiRevisi == null &&
        pakaiM3 === pakaiAsli;

      const pakaiM3Revisi = kembaliKeAsliMurni
        ? null
        : isKondisiMB || isKondisiMudaKembali
          ? String(pakaiM3)
          : body.pemakaianRevisi !== undefined
            ? body.pemakaianRevisi == null
              ? stmlRevisi != null || stmaRevisiSimpan != null
                ? String(pakaiM3)
                : null
              : String(body.pemakaianRevisi)
            : String(pakaiM3);

      // Resolusi kode TMSS yang akurat agar evaluasiAnomaliBaris mengenali MB ('4') & MUDA KEMBALI ('U')
      const kondisiNormLookup = kondisiUpper.replace(/_/g, " ");
      const matchKondisiMaster = isKondisiMB
        ? semuaKondisi.find((k) => k.kodeTmss.trim() === "4")
        : isKondisiMudaKembali
          ? semuaKondisi.find((k) => k.kodeTmss.trim().toUpperCase() === "U")
          : semuaKondisi.find(
              (k) =>
                k.nama.trim().toUpperCase() === kondisiUpper ||
                k.nama.trim().toUpperCase() === kondisiNormLookup ||
                k.kodeTmss.trim().toUpperCase() === kondisiUpper,
            );
      const kodeTmssEvaluasi =
        matchKondisiMaster?.kodeTmss ??
        (isKondisiMB ? "4" : isKondisiMudaKembali ? "U" : row.tmss);

      await db.transaction(async (tx) => {
        let linkedMutasiId = row.waterMeterMutasiId ?? mutasi?.id ?? null;

        // Auto-Upsert water_meter_mutasi berstatus APPROVED ketika MB disimpan dari Meja Verifikasi
        if (isKondisiMB) {
          const targetMutasiId = linkedMutasiId ?? defaultMutasiId;
          const noMeterLamaVal =
            mutasi?.noMeterLama ??
            pelInfo?.noMeterAsli ??
            pelInfo?.noMeter ??
            "-";
          const noMeterBaruVal = cleanNoMeterBaru ?? mutasi?.noMeterBaru ?? null;
          const catatanMutasi = mbOverrideFinal
            ? "[OVERRIDE OPERATOR: Tanpa Stand Angkat] Disahkan melalui halaman Verifikasi Petugas."
            : `Disahkan melalui halaman Verifikasi Petugas (Stand Angkat: ${standAngkatFinal}).`;

          await tx
            .insert(waterMeterMutasi)
            .values({
              id: targetMutasiId,
              nolg: row.nolg,
              periode: Number(row.thbl),
              alasan: "LAINNYA",
              keterangan: catatanMutasi,
              noMeterLama: noMeterLamaVal,
              standAngkat: standAngkatFinal,
              noMeterBaru: noMeterBaruVal,
              ukuranBaru: pelInfo?.ukuranMeter || "1/2",
              merkBaru: pelInfo?.merkMeter ?? null,
              standPasang: standPasangFinal,
              verifikatorId: user!.id,
              statusVerifikasi: "APPROVED",
              catatanVerifikasi: catatanMutasi,
              tglVerifikasi: new Date(),
            })
            .onConflictDoUpdate({
              target: waterMeterMutasi.id,
              set: {
                standAngkat: standAngkatFinal,
                standPasang: standPasangFinal,
                noMeterBaru: noMeterBaruVal,
                verifikatorId: user!.id,
                statusVerifikasi: "APPROVED",
                catatanVerifikasi: catatanMutasi,
                tglVerifikasi: new Date(),
                updatedAt: new Date(),
              },
            });

          linkedMutasiId = targetMutasiId;

          if (cleanNoMeterBaru) {
            await tx
              .insert(waterMeter)
              .values({
                noMeter: cleanNoMeterBaru,
                merk: pelInfo?.merkMeter ?? null,
                ukuran: pelInfo?.ukuranMeter || "1/2",
                tglPasang: new Date(),
                kondisi: "Normal",
              })
              .onConflictDoNothing({ target: waterMeter.noMeter });

            await tx
              .update(pelanggan)
              .set({
                noMeter: cleanNoMeterBaru,
                tglPasangMeter: new Date(),
                perluVerifikasi: false,
                updatedAt: new Date(),
              })
              .where(eq(pelanggan.nolg, row.nolg));
          } else if (!noMeterBaruVal) {
            // Jujur audit: tidak menyalin palsu no_meter_lama ke no_meter_baru; tandai perlu_verifikasi aset
            await tx
              .update(pelanggan)
              .set({
                perluVerifikasi: true,
                catatanVerifikasi: `Nomor seri meter baru periode ${row.thbl} belum dilaporkan petugas.`,
                updatedAt: new Date(),
              })
              .where(eq(pelanggan.nolg, row.nolg));
          }
        } else if (
          isKondisiMudaKembali &&
          digitRolloverFinal != null &&
          pelInfo?.noMeter
        ) {
          // Simpan jumlah digit terkonfirmasi pada aset meter agar otomatis akurat di siklus mendatang
          await tx
            .update(waterMeter)
            .set({ jumlahDigit: digitRolloverFinal })
            .where(eq(waterMeter.noMeter, pelInfo.noMeter));
        }

        const stmaSblmNum = Number(row.stmaRevisi ?? row.stma);
        const pakaiSblmNum = Number(row.pakaiM3Revisi ?? row.pakaiM3);
        const pakaiRumusMb = isKondisiMB
          ? (mbOverrideFinal ? 0 : (standAngkatFinal ?? stml) - stml) +
            ((standMeterBaruFinal ?? stma) - standPasangFinal)
          : null;

        const alasanLog = isKondisiMB
          ? pakaiRumusMb != null && pakaiM3 !== pakaiRumusMb
            ? `[Koreksi Pakai Kustom MB] Pakai disesuaikan manual: ${pakaiSblmNum} → ${pakaiM3} m³ (${mbOverrideFinal ? "Override Tanpa Stand Angkat" : `Stand Angkat=${standAngkatFinal}`}, Stand Baru=${standMeterBaruFinal}).`
            : mbOverrideFinal
              ? `[OVERRIDE OPERATOR: MB Tanpa Stand Angkat] Stand Meter Baru=${standMeterBaruFinal}, Stand Pasang=${standPasangFinal}, Pakai=${pakaiM3} m³.`
              : `[Koreksi Meter Baru/MB] Stand Angkat=${standAngkatFinal}, Stand Baru=${standMeterBaruFinal}, Stand Pasang=${standPasangFinal}, Pakai=${pakaiM3} m³.`
          : isKondisiMudaKembali
            ? `[Koreksi Muda Kembali/Rollover ${digitRolloverFinal} Digit (${(10 ** (digitRolloverFinal ?? 4)).toLocaleString("id-ID")})] ST Awal=${stml} -> ST Akhir=${stma}, Pakai=${pakaiM3} m³.`
            : kembaliKeAsliMurni
              ? `[Reset ke Bacaan Asli] Dikembalikan ke data asli petugas (ST Akhir=${stmaAsli}, Pakai=${pakaiAsli} m³).`
              : stmaEfektifUntukSimpan !== stmaSblmNum
                ? `[Koreksi Stand] ST Akhir: ${stmaSblmNum} → ${stmaEfektifUntukSimpan}, Pakai: ${pakaiSblmNum} → ${pakaiM3} m³.`
                : pakaiM3 !== pakaiSblmNum
                  ? `[Koreksi Kubikasi] Pemakaian disesuaikan: ${pakaiSblmNum} → ${pakaiM3} m³ (ST Awal=${stml}, ST Akhir=${stmaEfektifUntukSimpan}).`
                  : kondisiRevisi != null
                    ? `[Koreksi Kondisi] Kondisi diubah ke ${kondisiRevisi}, Pakai=${pakaiM3} m³.`
                    : `[Koreksi Verifikasi] ST Akhir=${stmaEfektifUntukSimpan}, Pakai=${pakaiM3} m³.`;

        await tx.insert(caterVerifikasiLog).values({
          caterId: row.id,
          userId: user!.id,
          stage: "FORM_CORRECTION",
          action: "ADJUST_STAND",
          stmaSebelum: row.stmaRevisi ?? row.stma,
          stmaSesudah: String(stmaEfektifUntukSimpan),
          pakaiSebelum: row.pakaiM3Revisi ?? row.pakaiM3,
          pakaiSesudah: String(pakaiM3),
          alasan: alasanLog,
        });

        const { rules, maps, versi } =
          await aturanAnomaliService.getCachedEngineContext();
        const evalRes = evaluasiAnomaliBaris(
          {
            stml: Number(stml),
            stma: Number(stmaEfektifUntukSimpan),
            pakaiM3: Number(pakaiM3),
            pakaiLalu: row.pakaiLalu !== null ? Number(row.pakaiLalu) : null,
            kodeTmss: kodeTmssEvaluasi,
          },
          rules,
          maps,
          versi,
        );

        const guardAfter = evaluasiGuardBacaanMeter({
          stml: row.stml,
          stma: row.stma,
          stmlRevisi: stmlRevisi == null ? null : String(stmlRevisi),
          stmaRevisi: stmaRevisiSimpan,
          pakaiM3: row.pakaiM3,
          pakaiM3Revisi,
          pakaiTagih:
            body.pemakaianTagihVerif !== undefined
              ? body.pemakaianTagihVerif
              : row.pakaiTagih,
          tmss: row.tmss,
          ketCatat: row.ketCatat,
          ketCatatRevisi: kondisiRevisi,
          standAngkatRevisi: isKondisiMB ? standAngkatFinal : null,
          standMeterBaruRevisi: isKondisiMB ? standMeterBaruFinal : null,
          standAngkatMutasi: isKondisiMB ? standAngkatFinal : null,
          mbTanpaStandAngkat: isKondisiMB ? mbOverrideFinal : false,
          digitRollover: isKondisiMudaKembali ? digitRolloverFinal : null,
          ukuranMeter: pelInfo?.ukuranMeter,
          jumlahDigitAset: pelInfo?.jumlahDigit,
          statusVerifikasi: "SUBMITTED",
        });

        const nextStatusVerif =
          guardAfter.lolosDataMurni &&
          (row.statusVerifikasi === "ANOMALY" ||
            row.statusVerifikasi === "ANOMALY_NEGATIVE")
            ? "SUBMITTED"
            : row.statusVerifikasi;

        await tx
          .update(caterBacaMeter)
          .set({
            stmlRevisi: stmlRevisi == null ? null : String(stmlRevisi),
            stmaRevisi: stmaRevisiSimpan,
            pakaiM3Revisi,
            ketCatatRevisi:
              kondisiRevisi ??
              (isKondisiMB && row.ketCatat !== "MB"
                ? "MB"
                : isKondisiMudaKembali &&
                    row.ketCatat !== "MUDA KEMBALI" &&
                    row.ketCatat !== "MUDA_KEMBALI"
                  ? "MUDA_KEMBALI"
                  : null),
            waterMeterMutasiId: linkedMutasiId,
            mbTanpaStandAngkat: isKondisiMB ? mbOverrideFinal : false,
            digitRollover: isKondisiMudaKembali ? digitRolloverFinal : null,
            statusVerifikasi: nextStatusVerif,
            isAnomali: evalRes.isAnomali,
            kodeAnomaliUtama: evalRes.kodeUtama,
            kodeAnomaliList: evalRes.kodeList,
            aturanVersi: versi,
            standAngkatRevisi:
              isKondisiMB && standAngkatFinal != null
                ? String(standAngkatFinal)
                : null,
            standMeterBaruRevisi:
              isKondisiMB && standMeterBaruFinal != null
                ? String(standMeterBaruFinal)
                : null,
            ...(body.pemakaianTagihVerif !== undefined && {
              pakaiTagih:
                body.pemakaianTagihVerif == null
                  ? null
                  : String(body.pemakaianTagihVerif),
            }),
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, row.id));

        await aturanAnomaliService.evaluasiUlangBarisDependen(
          row.nolg,
          row.thbl,
          tx,
        );
      });
      const fresh = await verifikasiGridService.getLaporanRows({
        id: row.id,
        pageSize: 1,
      });
      return {
        success: true,
        data: {
          id: row.id,
          stml,
          stma: stmaEfektifUntukSimpan,
          pakaiM3,
          laporan: fresh.rows[0] ?? null,
        },
      };
    },
    {
      requireRole: VERIFY_ROLES,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        standAwalRevisi: t.Optional(t.Union([t.Number(), t.Null()])),
        standAkhirRevisi: t.Optional(t.Union([t.Number(), t.Null()])),
        pemakaianRevisi: t.Optional(t.Union([t.Number(), t.Null()])),
        pemakaianTagihVerif: t.Optional(t.Union([t.Number(), t.Null()])),
        kondisiRevisi: t.Optional(t.Union([t.String(), t.Null()])),
        standAngkatLama: t.Optional(t.Union([t.Number(), t.Null()])),
        standMeterBaru: t.Optional(t.Union([t.Number(), t.Null()])),
        standPasang: t.Optional(t.Union([t.Number(), t.Null()])),
        noMeterBaru: t.Optional(t.Union([t.String(), t.Null()])),
        mbTanpaStandAngkat: t.Optional(t.Union([t.Boolean(), t.Null()])),
        digitRollover: t.Optional(t.Union([t.Number(), t.Null()])),
      }),
    },
  )
  .post(
    "/laporan-harian/:id/kondisi-foto",
    async ({ params, body, user, set }) => {
      const [row] = await db
        .select()
        .from(caterBacaMeter)
        .where(eq(caterBacaMeter.id, params.id));
      if (!row) {
        set.status = 404;
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Pembacaan tidak ditemukan." },
        };
      }
      await db.insert(caterVerifikasiLog).values({
        caterId: row.id,
        userId: user!.id,
        stage: "PHOTO_REVIEW",
        action: body.sesuai ? "PHOTO_MATCH" : "PHOTO_MISMATCH",
        stmaSebelum: row.stma,
        stmaSesudah: row.stma,
        pakaiSebelum: row.pakaiM3,
        pakaiSesudah: row.pakaiM3,
        alasan:
          body.keterangan ||
          (body.sesuai ? "Foto sesuai." : "Foto tidak sesuai."),
      });
      return { success: true, data: { id: row.id } };
    },
    {
      requireRole: ["VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"],
      params: t.Object({ id: t.String() }),
      body: t.Object({ sesuai: t.Boolean(), keterangan: t.String() }),
    },
  )
  .patch(
    "/laporan-mandiri/:id/verify",
    async ({ params, body, user, set }) => {
      try {
        const result = await mandiriService.verifikasiLaporanMandiri({
          mandiriId: params.id,
          action: "APPROVE",
          standDilaporkan: body.standDilaporkan,
          userId: user!.id,
        });
        return { success: true, data: result };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: { code: "SELF_VERIFY_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: ["VERIFIKATOR_1", "VERIFIKATOR_2", "STAFF_ADMIN_BILLING"],
      params: t.Object({ id: t.String() }),
      body: t.Object({ standDilaporkan: t.Optional(t.Number({ minimum: 0 })) }),
    },
  )
  .patch(
    "/laporan-mandiri/:id/reject",
    async ({ params, body, user, set }) => {
      try {
        const result = await mandiriService.verifikasiLaporanMandiri({
          mandiriId: params.id,
          action: "REJECT",
          alasanPenolakan: body.alasanDitolak,
          userId: user!.id,
        });
        return { success: true, data: result };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: { code: "SELF_REJECT_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: ["VERIFIKATOR_1", "VERIFIKATOR_2", "STAFF_ADMIN_BILLING"],
      params: t.Object({ id: t.String() }),
      body: t.Object({ alasanDitolak: t.String({ minLength: 1 }) }),
    },
  )
  .patch(
    "/laporan-mandiri/:id/unverify",
    async ({ params, set, user }) => {
      const [row] = await db
        .select({
          status: caterMandiriPelanggan.statusVerifikasi,
          caterId: caterBacaMeter.id,
          caterStatus: caterBacaMeter.statusVerifikasi,
        })
        .from(caterMandiriPelanggan)
        .leftJoin(
          caterBacaMeter,
          eq(caterMandiriPelanggan.id, caterBacaMeter.caterMandiriId),
        )
        .where(eq(caterMandiriPelanggan.id, params.id));
      if (!row) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Laporan mandiri tidak ditemukan.",
          },
        };
      }
      if (
        row.caterId &&
        row.caterStatus &&
        FINAL_STATUSES.includes(row.caterStatus as any)
      ) {
        set.status = 409;
        return {
          success: false,
          error: {
            code: "LINKED_READING",
            message:
              "Laporan sudah masuk tahap tagihan resmi (closing DRD); batalkan dari alur billing/petugas terlebih dahulu.",
          },
        };
      }
      await db.transaction(async (tx) => {
        await tx
          .update(caterMandiriPelanggan)
          .set({
            statusVerifikasi: "PENDING",
            alasanPenolakan: null,
            verifiedBy: null,
            verifiedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(caterMandiriPelanggan.id, params.id));

        if (row.caterId) {
          const [caterRow] = await tx
            .select()
            .from(caterBacaMeter)
            .where(eq(caterBacaMeter.id, row.caterId));

          const prevMatch = caterRow?.catatan?.match(
            /\[PREV_PETUGAS:([^:]+):STMA=([^:]+):STML=([^:]+):PAKAI=([^:]+):TMSS=([^\]]*)\]/,
          );

          if (prevMatch) {
            // Pulihkan data petugas yang sebelumnya tersimpan!
            const [, prevSumber, prevStma, prevStml, prevPakai, prevTmss] = prevMatch;
            await tx
              .update(caterBacaMeter)
              .set({
                sumberCatat: prevSumber,
                stma: prevStma,
                stml: prevStml,
                pakaiM3: prevPakai,
                pakaiTagih: prevPakai,
                tmss: prevTmss,
                ketCatat: prevTmss === "4" ? "MB" : "Normal",
                caterMandiriId: null,
                fotoMeterUrl: null,
                fotoRumahUrl: null,
                statusVerifikasi: "SUBMITTED",
                catatan: `[Pemulihan Data Petugas] Verifikasi mandiri dibatalkan, data kembali ke hasil catat ${prevSumber}.`,
                updatedAt: new Date(),
              })
              .where(eq(caterBacaMeter.id, row.caterId));

            // Sisipkan log SYSTEM_RESET agar riwayat persetujuan mandiri di-reset
            await tx.insert(caterVerifikasiLog).values({
              caterId: row.caterId,
              userId: user?.id ?? "system",
              stage: "SYSTEM_RESET",
              action: "ROLLBACK",
              stmaSebelum: caterRow.stma,
              stmaSesudah: prevStma,
              pakaiSebelum: caterRow.pakaiM3,
              pakaiSesudah: prevPakai,
              alasan: "Pemulihan data petugas asli setelah pembatalan verifikasi mandiri.",
            });
          } else if (
            caterRow?.sumberCatat === "MANDIRI_WEB" ||
            caterRow?.sumberCatat === "MANDIRI_APP"
          ) {
            // Murni dari mandiri tanpa data petugas sebelumnya -> Hapus baris transaksi agar kembali ke BELUM_DICATAT
            await tx.delete(caterBacaMeter).where(eq(caterBacaMeter.id, row.caterId));
            await tx
              .update(daftarCatat)
              .set({
                status: "BELUM_DICATAT",
                selesaiAt: null,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(daftarCatat.periode, caterRow.thbl),
                  eq(daftarCatat.nolg, caterRow.nolg),
                ),
              );
          } else {
            await tx
              .update(caterBacaMeter)
              .set({
                caterMandiriId: null,
                fotoMeterUrl: null,
                fotoRumahUrl: null,
                updatedAt: new Date(),
              })
              .where(eq(caterBacaMeter.id, row.caterId));
          }
        }
      });
      return {
        success: true,
        data: { id: params.id, statusVerifikasi: "PENDING" },
      };
    },
    {
      requireRole: ["VERIFIKATOR_1", "VERIFIKATOR_2", "STAFF_ADMIN_BILLING"],
      params: t.Object({ id: t.String() }),
    },
  )
  .post(
    "/manual-add/satuan",
    async ({ body, user, set }) => {
      try {
        const [existing] = await db
          .select({
            id: caterBacaMeter.id,
            statusVerifikasi: caterBacaMeter.statusVerifikasi,
          })
          .from(caterBacaMeter)
          .where(
            and(
              eq(caterBacaMeter.nolg, body.pelangganId),
              eq(caterBacaMeter.thbl, String(body.periode)),
            ),
          )
          .limit(1);
        if (existing?.statusVerifikasi === "LOCKED_BILLING") {
          set.status = 409;
          return {
            success: false,
            error: {
              code: "READING_LOCKED",
              message:
                "Pembacaan periode ini sudah terkunci billing dan tidak dapat ditimpa.",
            },
          };
        }
        const result = await caterVerifikasiService.submitReading({
          thbl: String(body.periode),
          nolg: body.pelangganId,
          stml: body.standAwal,
          stma: body.standAkhir,
          pakaiM3Override: body.pemakaian,
          kondisiCatat: body.kondisiCatat || "NORMAL",
          metodeCatat: "OFFSITE",
          sumberCatat: "MANUAL",
          catatan: body.alasanManual,
        });
        return { success: true, data: result };
      } catch (error) {
        set.status = 400;
        return {
          success: false,
          error: { code: "MANUAL_ADD_FAILED", message: errorMessage(error) },
        };
      }
    },
    {
      requireRole: ["STAFF_ADMIN_BILLING", "VERIFIKATOR_1", "VERIFIKATOR_2"],
      body: t.Object({
        pelangganId: t.String({ minLength: 1 }),
        periode: t.Numeric(),
        standAwal: t.Number({ minimum: 0 }),
        standAkhir: t.Number({ minimum: 0 }),
        pemakaian: t.Number(),
        kondisiCatat: t.Optional(t.String()),
        alasanManual: t.String({ minLength: 1 }),
      }),
    },
  );

export { verifikasiRouter as verifikasiLegacyRouter };
export type VerifikasiRouter = typeof verifikasiRouter;
