import { t } from 'elysia';

export const catatMutasiGantiMeterBodySchema = t.Object({
  nolg: t.String({ minLength: 1 }),
  periode: t.Number({ description: 'THBL e.g. 202601' }),
  alasan: t.Union([
    t.Literal('RUSAK'),
    t.Literal('MATI'),
    t.Literal('BURAM'),
    t.Literal('HILANG'),
    t.Literal('TERA_ULANG'),
    t.Literal('UKURAN_BERUBAH'),
    t.Literal('LAINNYA'),
  ]),
  keterangan: t.Optional(t.String()),
  noMeterLama: t.String({ minLength: 1 }),
  standAngkat: t.Number({ minimum: 0 }),
  fotoStandAngkat: t.Optional(t.String()),
  noMeterBaru: t.String({ minLength: 1 }),
  merkBaru: t.Optional(t.String()),
  ukuranBaru: t.Optional(t.String()),
  standPasang: t.Optional(t.Number({ minimum: 0 })),
  noSegelBaru: t.Optional(t.String()),
  fotoMeterBaru: t.Optional(t.String()),
  petugasPasang: t.Optional(t.String()),
});

export const verifikasiMutasiBodySchema = t.Object({
  mutasiId: t.String({ minLength: 1 }),
  action: t.Union([t.Literal('APPROVE'), t.Literal('REJECT')]),
  standBacaBaru: t.Optional(t.Number({ minimum: 0 })),
  catatan: t.Optional(t.String()),
});

export const catatDebitGwmBodySchema = t.Object({
  kodeGwm: t.String({ minLength: 1 }),
  periode: t.Number(),
  standAwal: t.Number({ minimum: 0 }),
  standAkhir: t.Number({ minimum: 0 }),
  petugasId: t.Optional(t.String()),
  fotoStand: t.Optional(t.String()),
  catatan: t.Optional(t.String()),
});

export const neracaAirParamsSchema = t.Object({
  zonaKode: t.String({ minLength: 1 }),
  periode: t.Numeric({ description: 'THBL e.g. 202601' }),
});
