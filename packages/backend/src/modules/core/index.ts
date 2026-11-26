import { Elysia } from "elysia";
import { healthModule } from "./health";
import { echoModule } from "./echo";
import { mediaRouter } from "./media/media.router";
import { broadcastRouter as broadcastModule } from "./broadcast/broadcast.router";

/**
 * Modul Layanan Inti & Utilitas Sistem (Core Engine)
 * Menangani: Health check, echo, upload media cloudinary, dan broadcast siaran.
 */
export const coreModule = new Elysia({ name: "dept-core" })
  .use(healthModule)
  .use(echoModule)
  .use(mediaRouter)
  .use(broadcastModule);

export * from "./health";
export * from "./echo";
export * from "./media";
export * from "./broadcast";
