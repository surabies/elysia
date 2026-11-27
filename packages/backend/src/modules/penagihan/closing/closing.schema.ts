import { t } from 'elysia';

export const pratinjauParamsSchema = t.Object({
  periode: t.String({ minLength: 6, maxLength: 6, description: 'Periode THBL e.g. 202601' }),
});

export const eksekusiClosingBodySchema = t.Object({
  periode: t.String({ minLength: 6, maxLength: 6, description: 'Periode THBL e.g. 202601' }),
  tanggalJatuhTempo: t.String({ description: 'Format ISO string e.g. 2026-02-20T00:00:00.000Z' }),
});

export const bukaBulanBaruBodySchema = t.Object({
  periodeLalu: t.String({ minLength: 6, maxLength: 6, description: 'Periode bulan penutup e.g. 202601' }),
  periodeBaru: t.String({ minLength: 6, maxLength: 6, description: 'Periode bulan baru e.g. 202602' }),
});

export const postingDatameterBodySchema = t.Object({
  periode: t.String({ minLength: 6, maxLength: 6, description: 'Periode THBL e.g. 202601' }),
});

export const verifikasiStandAngkatBodySchema = t.Object({
  id: t.String(),
  status: t.Union([t.Literal('APPROVED'), t.Literal('REJECTED')]),
  catatan: t.Optional(t.String()),
});

export const inputPasangBaruBodySchema = t.Object({
  nolg: t.String({ minLength: 5 }),
  nama: t.String({ minLength: 2 }),
  alamat: t.String({ minLength: 3 }),
  tarifKode: t.String(),
  ruteKode: t.String(),
  noMeter: t.String(),
  noTelp: t.Optional(t.String()),
  jmlPenghuni: t.Optional(t.Number()),
  standAwal: t.Optional(t.Number()),
  periode: t.Optional(t.String({ minLength: 6, maxLength: 6 })),
});

export const inputPerubahanKategoriBodySchema = t.Object({
  nolg: t.String({ minLength: 5 }),
  tarifKodeBaru: t.String(),
  noMeterBaru: t.Optional(t.String()),
  periode: t.Optional(t.String({ minLength: 6, maxLength: 6 })),
  nomorSk: t.Optional(t.String()),
  alasan: t.Optional(t.String()),
});

export const simpanBacaanPbpkBodySchema = t.Object({
  periode: t.String({ minLength: 6, maxLength: 6 }),
  items: t.Array(
    t.Object({
      nolg: t.String({ minLength: 5 }),
      standAwal: t.Number({ minimum: 0 }),
      standAkhir: t.Number({ minimum: 0 }),
    }),
    { minItems: 1 }
  ),
});

export const pbpkPelangganParamsSchema = t.Object({
  nolg: t.String({ minLength: 3 }),
});
