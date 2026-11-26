import { Elysia } from "elysia";
import { caterRouter as caterModule } from "./cater/cater.router";
import { verifikasiRouter as verifikasiModule } from "./verifikasi/verifikasi.router";
import { importRouter as importModule } from "./import/import.router";
import { aturanAnomaliRouter } from "./cater/aturan-anomali.router";
import { ruteModule } from "./rute/rute.router";

/**
 * Modul Bagian Pencatat Meter (Cater & Metering)
 * Menangani: Input bacaan fisik, evaluasi anomali stand meter, verifikasi bertingkat (V1/V2/V3),
 * koreksi stand, impor data lapdatameter bulanan, dan manajemen/mutasi rute baca meter.
 */
export const pencatatMeterModule = new Elysia({ name: "dept-pencatat-meter" })
  .use(caterModule)
  .use(verifikasiModule)
  .use(importModule)
  .use(aturanAnomaliRouter)
  .use(ruteModule);

export * from "./cater";
export * from "./verifikasi";
export * from "./import";
export { ruteModule } from "./rute/rute.router";
