import { t } from 'elysia';

// 1. Kueri Daftar Rute
export const routesQuerySchema = t.Object({
  limit: t.Optional(t.Numeric({ default: 50, minimum: 1, maximum: 500 })),
  offset: t.Optional(t.Numeric({ default: 0, minimum: 0 })),
});

// 2. Unduh Beban Rute Pelanggan
export const routePelangganParamsSchema = t.Object({
  kode: t.String({ minLength: 1, description: 'Kode rute cater e.g. CD104' }),
});

export const routePelangganQuerySchema = t.Object({
  limit: t.Optional(t.Numeric({ default: 500, minimum: 1, maximum: 2000 })),
});

// 3. Submit Pembacaan Meter (Mobile Petugas)
export const submitReadingBodySchema = t.Object({
  thbl: t.String({ minLength: 6, maxLength: 6, description: 'Tahun Bulan e.g. 202601' }),
  nolg: t.String({ minLength: 1, description: 'Nomor Langganan' }),
  ruteKode: t.Optional(t.String()),
  petugasId: t.Optional(t.String()),
  stml: t.Number({ minimum: 0, description: 'Stand Meter Lalu' }),
  stma: t.Number({ minimum: 0, description: 'Stand Meter Akhir' }),
  kondisiCatat: t.Optional(t.String()),
  metodeCatat: t.Optional(t.String()),
  fotoMeterUrl: t.Optional(t.String()),
  fotoRumahUrl: t.Optional(t.String()),
  durasiDetik: t.Optional(t.Number({ minimum: 0 })),
  catatan: t.Optional(t.String()),
  longitude: t.Optional(t.Number()),
  latitude: t.Optional(t.Number()),
});

// 4. Kueri Daftar Anomali
export const anomaliesQuerySchema = t.Object({
  limit: t.Optional(t.Numeric({ default: 50, minimum: 1, maximum: 200 })),
});

// 5. Parameter Riwayat Audit
export const historyParamsSchema = t.Object({
  caterId: t.String({ minLength: 1, description: 'ID transaksi pembacaan meter' }),
});

// 6. Verifikasi V1 (Supervisor Seksi/Rute)
export const verifyV1BodySchema = t.Object({
  caterId: t.String({ minLength: 1 }),
  action: t.Union([t.Literal('APPROVE'), t.Literal('REQUEST_RESURVEY')]),
  catatan: t.Optional(t.String()),
});

// 7. Verifikasi V2 (Manager Cabang/Wilayah)
export const verifyV2BodySchema = t.Object({
  caterId: t.String({ minLength: 1 }),
  action: t.Union([t.Literal('APPROVE'), t.Literal('ADJUST_STAND'), t.Literal('REQUEST_RESURVEY')]),
  stmaKoreksi: t.Optional(t.Number({ minimum: 0 })),
  catatan: t.Optional(t.String()),
});

// 8. Verifikasi V3 (Senior Manager / Direksi - Final Release)
export const verifyV3BodySchema = t.Object({
  caterId: t.String({ minLength: 1 }),
  catatan: t.Optional(t.String()),
});

// 9. Koreksi Administratif Pasca-Verifikasi oleh Staff
export const staffCorrectionBodySchema = t.Object({
  caterId: t.String({ minLength: 1 }),
  stmaBaru: t.Number({ minimum: 0 }),
  pakaiM3Baru: t.Number({ minimum: 0 }),
  nomorTiketKomplain: t.Optional(t.String()),
  alasan: t.String({ minLength: 5, description: 'Wajib mencantumkan alasan koreksi data' }),
});
