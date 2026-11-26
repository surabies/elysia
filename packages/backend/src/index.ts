/**
 * @cater/backend - Core Serverless Backend Engine
 * Export Elysia App Instance, Type Contracts, and Shared Domain Services
 */
export { app, type App } from "./app";

// Core Plugins & Config
export { authPlugin } from "./plugins/auth";
export { corsPlugin, allowedOrigins } from "./plugins/cors";
export { errorHandler } from "./plugins/error-handler";
export { env } from "./lib/env";
export { auth } from "./lib/auth";

// Department Modules
export { pencatatMeterModule } from "./modules/pencatat-meter";
export { penagihanModule } from "./modules/penagihan";
export { langgananModule } from "./modules/langganan";
export { sdmModule } from "./modules/sdm";
export { subZonaModule } from "./modules/sub-zona";
export { rpmModule } from "./modules/rpm";
export { spiModule } from "./modules/spi";
export { coreModule } from "./modules/core";

// Domain Services per Department
// 1. Pencatat Meter
export { caterVerifikasiService } from "./services/pencatat-meter/cater/cater-verifikasi.service";
export { caterKueriService } from "./services/pencatat-meter/cater/cater-kueri.service";
export { caterProgressService } from "./services/pencatat-meter/cater/cater-progress.service";
export { aturanAnomaliService } from "./services/pencatat-meter/cater/aturan-anomali.service";
export { verifikasiGridService } from "./services/pencatat-meter/cater/verifikasi-grid.service";

// 2. Penagihan & Rekening
export { closingService } from "./services/penagihan/closing/closing.service";

// 3. Hubungan Langganan
export { mandiriService } from "./services/langganan/mandiri/mandiri.service";
export { pengaduanService } from "./services/langganan/pengaduan/pengaduan.service";

// 4. Core & Dashboard
export { dashboardService } from "./services/core/dashboard/dashboard.service";
export { analyticsService } from "./services/core/dashboard/analytics.service";
export { drdService } from "./services/core/dashboard/drd.service";
