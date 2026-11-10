import { Elysia, t } from "elysia"
import {
  dapatkanPerspektifScorecard,
  tambahKpiBaru,
  perbaruiNilaiAktualKpi,
  perbaruiBobotKpi,
  perbaruiPemilikKpi,
} from "../../services/kpi/kpi.service"

export const kpiRouter = new Elysia({ prefix: "/kpi" })
  // 1. Ambil Scorecard Tree per Periode
  .get(
    "/",
    async ({ query }) => {
      const periode = query.periode || "Sep 2026"
      const data = await dapatkanPerspektifScorecard(periode)
      return {
        success: true,
        periode,
        data,
      }
    },
    {
      query: t.Object({
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 2. Tambah KPI Baru
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await tambahKpiBaru(
          {
            name: body.name,
            objectiveId: body.objectiveId,
            ownerId: body.ownerId,
            direction: body.direction as any,
            weight: body.weight,
            baseline: body.baseline,
            target: body.target,
            value: body.value,
            format: body.format as any,
          },
          body.periode || "Sep 2026",
          body.ownerDetails
        )
        return {
          success: true,
          id: result.id,
          message: "KPI berhasil ditambahkan",
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal menambahkan KPI",
        }
      }
    },
    {
      body: t.Object({
        name: t.String(),
        objectiveId: t.String(),
        ownerId: t.String(),
        direction: t.String(),
        weight: t.Number(),
        baseline: t.Number(),
        target: t.Number(),
        value: t.Nullable(t.Number()),
        format: t.String(),
        periode: t.Optional(t.String()),
        ownerDetails: t.Optional(
          t.Object({
            name: t.String(),
            initials: t.String(),
          })
        ),
      }),
    }
  )

  // 3. Update Nilai Aktual (Actual)
  .patch(
    "/:id/nilai",
    async ({ params, body, set }) => {
      try {
        await perbaruiNilaiAktualKpi(params.id, body.periode, body.nilai)
        return { success: true, message: "Nilai aktual berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        periode: t.String(),
        nilai: t.Nullable(t.Number()),
      }),
    }
  )

  // 4. Update Bobot (Weight)
  .patch(
    "/:id/bobot",
    async ({ params, body, set }) => {
      try {
        await perbaruiBobotKpi(params.id, body.bobot)
        return { success: true, message: "Bobot berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        bobot: t.Number(),
      }),
    }
  )

  // 5. Update Pemilik (Owner)
  .patch(
    "/:id/pemilik",
    async ({ params, body, set }) => {
      try {
        await perbaruiPemilikKpi(
          params.id,
          body.pemilikId,
          body.pemilikNama,
          body.pemilikInisial
        )
        return { success: true, message: "Pemilik berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        pemilikId: t.String(),
        pemilikNama: t.String(),
        pemilikInisial: t.String(),
      }),
    }
  )
