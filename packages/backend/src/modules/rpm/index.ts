import { Elysia } from "elysia";
import { gwmRouter as gwmModule } from "./gwm/gwm.router";

/**
 * Modul Bagian Rencana & Pengembangan (RPM)
 * Menangani: Groundwater Meter (GWM), meter induk, kalibrasi,
 * dan siklus penggantian aset water meter.
 */
export const rpmModule = new Elysia({ name: "dept-rpm" })
  .use(gwmModule);

export * from "./gwm";
