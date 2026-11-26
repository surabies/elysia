import { Elysia } from "elysia";
import { corsPlugin } from "./plugins/cors";
import { errorHandler } from "./plugins/error-handler";
import { loggerPlugin } from "./plugins/logger";

// Department Modules
import { pencatatMeterModule } from "./modules/pencatat-meter";
import { penagihanModule } from "./modules/penagihan";
import { langgananModule } from "./modules/langganan";
import { sdmModule } from "./modules/sdm";
import { subZonaModule } from "./modules/sub-zona";
import { rpmModule } from "./modules/rpm";
import { spiModule } from "./modules/spi";
import { coreModule } from "./modules/core";

export const app = new Elysia({ prefix: "/api" })
  .use(corsPlugin)
  .use(loggerPlugin)
  .use(errorHandler)
  .get("/", () => {
    return {
      success: true,
      name: "Perumda Air Minum Backend API Engine",
      version: "2.0.0",
      departments: [
        "Pencatat Meter",
        "Penagihan & Rekening",
        "Hubungan Langganan",
        "SDM & Kepegawaian",
        "Sub Zona & Distribusi",
        "Rencana & Pengembangan (RPM)",
        "Satuan Pengawas Internal (SPI)",
        "Core & Utility",
      ],
    };
  })
  // Department Modules Mounting
  .use(pencatatMeterModule)
  .use(penagihanModule)
  .use(langgananModule)
  .use(sdmModule)
  .use(subZonaModule)
  .use(rpmModule)
  .use(spiModule)
  .use(coreModule);

export type App = typeof app;
