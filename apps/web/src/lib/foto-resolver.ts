// apps/web/src/lib/foto-resolver.ts
// Helper untuk menyelesaikan URL foto: mengutamakan foto nyata dari database/Cloudinary,
// dan secara otomatis fallback ke generator on-demand SVG dinamis jika foto nyata belum tersedia.

export type JenisFoto = "stand" | "segel" | "rumah";

export interface ResolveFotoOptions {
  realUrl?: string | null;
  nolg?: string | null;
  jenis?: JenisFoto;
  stand?: string | number | null;
  periode?: string | null;
  rute?: string | null;
  petugas?: string | null;
  nama?: string | null;
}

/**
 * Mengembalikan URL foto yang valid.
 * Jika `realUrl` tersedia (Cloudinary / server storage lokal), gunakan `realUrl`.
 * Jika kosong / null, arahkan ke endpoint SVG virtual on-demand `/api/mock/foto`.
 */
export function resolveFotoUrl(opts: ResolveFotoOptions): string {
  const {
    realUrl,
    nolg = "01020001",
    jenis = "stand",
    stand,
    periode = "202611",
    rute,
    petugas,
    nama,
  } = opts;

  // 1. Jika ada foto nyata di Cloudinary atau server publik lokal, utamakan foto nyata
  if (realUrl && typeof realUrl === "string" && realUrl.trim().length > 0) {
    return realUrl.trim();
  }

  // 2. Fallback otomatis ke generator SVG dinamis on-demand (tanpa storage / 0 KB database)
  const params = new URLSearchParams();
  if (nolg) params.set("nolg", nolg);
  params.set("jenis", jenis);
  if (stand !== undefined && stand !== null) params.set("stand", String(stand));
  if (periode) params.set("periode", periode);
  if (rute) params.set("rute", rute);
  if (petugas) params.set("petugas", petugas);
  if (nama) params.set("nama", nama);

  return `/api/mock/foto?${params.toString()}`;
}
