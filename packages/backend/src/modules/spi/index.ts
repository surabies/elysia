import { Elysia } from "elysia";

/**
 * Modul Satuan Pengawas Internal (SPI)
 * Wadah resmi pengembangan audit trail, deteksi deviasi mencurigakan,
 * rekonsiliasi pembacaan meter, dan kepatuhan SOP perusahaan.
 */
export const spiModule = new Elysia({ name: "dept-spi" });
