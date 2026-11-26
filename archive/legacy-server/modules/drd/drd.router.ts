import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { drdService } from "../../services/dashboard/drd.service";
import { coveragePopulationBodySchema } from "./drd.schema";

export const drdRouter = new Elysia({ prefix: "/v1/drd" })
  .use(authPlugin)
  .patch(
    "/coverage-population",
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Autentikasi diperlukan untuk memperbarui jumlah penduduk.",
          },
        };
      }

      await drdService.setCoveragePopulation({
        ...body,
        updatedBy: user.id,
      });

      return {
        success: true,
        data: {
          kelurahanKode: body.kelurahanKode,
          jumlahPenduduk: body.jumlahPenduduk,
        },
      };
    },
    {
      requireRole: ["SUPERADMIN"],
      body: coveragePopulationBodySchema,
    },
  );
