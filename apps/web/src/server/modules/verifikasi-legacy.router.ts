import { Elysia, t } from "elysia";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  caterBacaMeter,
  caterMandiriPelanggan,
  caterVerifikasiLog,
  db,
  periodePenagihan,
  rekeningDrd,
  type AppRole,
} from "@cater/db";
import { authPlugin } from "../plugins/auth";
import { caterVerifikasiService } from "../services/cater/cater-verifikasi.service";
import { mandiriService } from "../services/mandiri/mandiri.service";
import { verifikasiGridService } from "../services/cater/verifikasi-grid.service";

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
  pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 500 })),
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

function hasRole(roles: string[], role: string) {
  return roles.includes("SUPERADMIN") || roles.includes(role);
}

function maxRing(roles: string[]): 1 | 2 | 3 | null {
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

export const verifikasiLegacyRouter = new Elysia({ prefix: "/v1" })
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
        nextStatus = "VERIFIED_L2";
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
        nextStatus = "VERIFIED_L1";
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
              : `Tahap ${stage} dibatalkan dari halaman verifikasi.`,
        });
        await tx
          .update(caterBacaMeter)
          .set({ statusVerifikasi: nextStatus, updatedAt: new Date() })
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
      const stml = body.standAwalRevisi ?? Number(row.stml);
      const stma = body.standAkhirRevisi ?? Number(row.stma);
      const pakaiM3 = body.pemakaianTagihVerif ?? Math.max(0, stma - stml);
      if (stml < 0 || stma < 0 || pakaiM3 < 0) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "INVALID_STAND",
            message: "Angka stand dan pemakaian harus bernilai nol atau lebih.",
          },
        };
      }
      await db.transaction(async (tx) => {
        await tx.insert(caterVerifikasiLog).values({
          caterId: row.id,
          userId: user!.id,
          stage: "FORM_CORRECTION",
          action: "ADJUST_STAND",
          stmaSebelum: row.stma,
          stmaSesudah: String(stma),
          pakaiSebelum: row.pakaiM3,
          pakaiSesudah: String(pakaiM3),
          alasan: "Koreksi data pembacaan dari halaman verifikasi.",
        });
        await tx
          .update(caterBacaMeter)
          .set({
            stml: String(stml),
            stma: String(stma),
            pakaiM3: String(pakaiM3),
            pakaiTagih:
              body.pemakaianTagihVerif == null
                ? row.pakaiTagih
                : String(body.pemakaianTagihVerif),
            ketCatat: body.kondisiRevisi ?? row.ketCatat,
            updatedAt: new Date(),
          })
          .where(eq(caterBacaMeter.id, row.id));
      });
      return { success: true, data: { id: row.id, stml, stma, pakaiM3 } };
    },
    {
      requireRole: VERIFY_ROLES,
      params: t.Object({ id: t.String() }),
      body: t.Object({
        standAwalRevisi: t.Optional(t.Union([t.Number(), t.Null()])),
        standAkhirRevisi: t.Optional(t.Union([t.Number(), t.Null()])),
        pemakaianTagihVerif: t.Optional(t.Union([t.Number(), t.Null()])),
        kondisiRevisi: t.Optional(t.Union([t.String(), t.Null()])),
        standAngkatLama: t.Optional(t.Union([t.Number(), t.Null()])),
        standMeterBaru: t.Optional(t.Union([t.Number(), t.Null()])),
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
    async ({ params, set }) => {
      const [row] = await db
        .select({
          status: caterMandiriPelanggan.statusVerifikasi,
          caterId: caterBacaMeter.id,
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
      if (row.caterId) {
        set.status = 409;
        return {
          success: false,
          error: {
            code: "LINKED_READING",
            message:
              "Laporan sudah tersinkron ke pembacaan petugas; batalkan dari alur petugas agar data tidak terhapus.",
          },
        };
      }
      await db
        .update(caterMandiriPelanggan)
        .set({
          statusVerifikasi: "PENDING",
          alasanPenolakan: null,
          verifiedBy: null,
          verifiedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(caterMandiriPelanggan.id, params.id));
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
        const existing = await db
          .select({ id: caterBacaMeter.id })
          .from(caterBacaMeter)
          .where(
            and(
              eq(caterBacaMeter.nolg, body.pelangganId),
              eq(caterBacaMeter.thbl, String(body.periode)),
            ),
          )
          .limit(1);
        if (existing.length) {
          set.status = 409;
          return {
            success: false,
            error: {
              code: "READING_EXISTS",
              message: "Pembacaan periode ini sudah ada; gunakan menu koreksi.",
            },
          };
        }
        const result = await caterVerifikasiService.submitReading({
          thbl: String(body.periode),
          nolg: body.pelangganId,
          stml: body.standAwal,
          stma: body.standAkhir,
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
        alasanManual: t.String({ minLength: 1 }),
      }),
    },
  );
