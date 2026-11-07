import { t } from "elysia";

export const coveragePopulationBodySchema = t.Object({
  kelurahanKode: t.String({ minLength: 1, maxLength: 10 }),
  jumlahPenduduk: t.Integer({ minimum: 0, maximum: 2_147_483_647 }),
});
