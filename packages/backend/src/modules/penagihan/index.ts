import { Elysia } from "elysia";
import { closingRouter as closingModule } from "./closing/closing.router";
import { drdRouter as drdModule } from "./drd/drd.router";

/**
 * Modul Bagian Penagihan & Rekening (Billing)
 * Menangani: Penerbitan DRD (Daftar Rekening Ditagihkan), closing periode rekening,
 * dan penguncian data tagihan resmi (LOCKED_BILLING).
 */
export const penagihanModule = new Elysia({ name: "dept-penagihan" })
  .use(closingModule)
  .use(drdModule);

export * from "./closing";
export * from "./drd";
