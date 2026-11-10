import { Elysia } from "elysia";
import { corsPlugin } from "./plugins/cors";
import { errorHandler } from "./plugins/error-handler";
import { healthModule } from "./modules/health";
import { echoModule } from "./modules/echo";
import { authModule } from "./modules/auth";
import { geoModule } from "./modules/geo";
import { caterModule } from "./modules/cater";
import { closingModule } from "./modules/closing";
import { mandiriModule } from "./modules/mandiri";
import { gwmModule } from "./modules/gwm";
import { pengaduanModule, pengaduanV1Module } from "./modules/pengaduan";
import { publikModule, publicModule } from "./modules/publik";
import { verifikasiLegacyRouter } from "./modules/verifikasi-legacy.router";
import { drdModule } from "./modules/drd";
import { masterRouter } from "./modules/master/master.router";
import { kpiModule } from "./modules/kpi";

export const app = new Elysia({ prefix: "/api" })
  .use(corsPlugin)
  .use(errorHandler)
  .get("/", () => {
    return {
      success: true,
      name: "Elysia Backend API",
      version: "1.0.0",
    };
  })
  .use(healthModule)
  .use(echoModule)
  .use(authModule)
  .use(geoModule)
  .use(caterModule)
  .use(closingModule)
  .use(mandiriModule)
  .use(gwmModule)
  .use(pengaduanModule)
  .use(pengaduanV1Module)
  .use(publikModule)
  .use(publicModule)
  .use(drdModule)
  .use(masterRouter)
  .use(kpiModule)
  .use(verifikasiLegacyRouter);

export type App = typeof app;
