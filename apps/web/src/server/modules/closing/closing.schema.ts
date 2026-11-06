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

