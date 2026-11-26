import { Elysia } from "elysia";
import { mandiriRouter as mandiriModule } from "./mandiri/mandiri.router";
import { pengaduanRouter as pengaduanModule, pengaduanV1Router as pengaduanV1Module } from "./pengaduan/pengaduan.router";
import { publikRouter as publikModule, publicRouter as publicModule } from "./publik/publik.router";
import { masterRouter } from "./master/master.router";

/**
 * Modul Bagian Hubungan Langganan (Hublang / Customer Care)
 * Menangani: Verifikasi lapor mandiri konsumen, pengaduan keluhan air/meter,
 * portal cek tagihan publik, dan data master pelanggan & tarif.
 */
export const langgananModule = new Elysia({ name: "dept-langganan" })
  .use(mandiriModule)
  .use(pengaduanModule)
  .use(pengaduanV1Module)
  .use(publikModule)
  .use(publicModule)
  .use(masterRouter);

export * from "./mandiri";
export * from "./pengaduan";
export * from "./publik";
export { masterRouter } from "./master/master.router";
