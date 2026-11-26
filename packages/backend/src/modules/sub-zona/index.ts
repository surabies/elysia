import { Elysia } from "elysia";
import { geoModule } from "./geo";

/**
 * Modul Bagian Sub-Zona, Distribusi & NRW
 * Menangani: Geotagging pelanggan, pemetaan GIS jaringan pipa air,
 * dan monitoring kehilangan air pada District Meter Area (DMA).
 */
export const subZonaModule = new Elysia({ name: "dept-sub-zona" })
  .use(geoModule);

export * from "./geo";
