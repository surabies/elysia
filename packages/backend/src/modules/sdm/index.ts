import { Elysia } from "elysia";
import { kpiRouter as kpiModule } from "./kpi/kpi.router";
import { authModule } from "./auth";

/**
 * Modul Bagian SDM & Kepegawaian
 * Menangani: Evaluasi kinerja/KPI petugas, insentif capaian,
 * serta manajemen pengguna & autentikasi sistem.
 */
export const sdmModule = new Elysia({ name: "dept-sdm" })
  .use(kpiModule)
  .use(authModule);

export * from "./kpi";
export * from "./auth";
