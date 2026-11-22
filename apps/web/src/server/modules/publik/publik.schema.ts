import { t } from 'elysia';
import {
  jenisPengaduanSchema,
  klasifikasiPengaduanSchema,
  prioritasPengaduanSchema,
  detailPengaduanParamsSchema,
} from '../pengaduan/pengaduan.schema';

export const inquiryTagihanParamsSchema = t.Object({
  nolg: t.String({ minLength: 1, maxLength: 20, description: 'Nomor Langganan PDAM' }),
});

/**
 * Pembuatan Tiket oleh Pelapor Publik:
 * clientRequestId wajib untuk menjamin idempotensi (Fase 5)
 */
export const publicCreatePengaduanBodySchema = t.Object({
  clientRequestId: t.String({ minLength: 8, description: 'ID unik idempotensi dari klien' }),
  nomorLangganan: t.Optional(t.String({ maxLength: 20 })),
  klasifikasi: t.Optional(klasifikasiPengaduanSchema),
  jenis: jenisPengaduanSchema,
  judul: t.Optional(t.String({ maxLength: 255 })),
  deskripsi: t.String({ minLength: 5 }),
  koordinat: t.Optional(
    t.Object({
      x: t.Number(),
      y: t.Number(),
    })
  ),
  alamatKejadian: t.Optional(t.String()),
  prioritas: t.Optional(prioritasPengaduanSchema),
  pelapor: t.String({ minLength: 2, maxLength: 150 }),
  kontakPelapor: t.Optional(t.String({ maxLength: 50 })),
  fotoUrl: t.Optional(t.String()),
  videoUrl: t.Optional(t.String()),
});

export const publicRatingPengaduanBodySchema = t.Object({
  empatDigitKontak: t.String({ minLength: 4, maxLength: 4 }),
  rating: t.Number({ minimum: 1, maximum: 5 }),
  komentar: t.Optional(t.String()),
});

export const publicKonfirmasiPengaduanBodySchema = t.Object({
  empatDigitKontak: t.String({ minLength: 4, maxLength: 4 }),
  catatan: t.Optional(t.String()),
});

export const publicBukaKembaliPengaduanBodySchema = t.Object({
  empatDigitKontak: t.String({ minLength: 4, maxLength: 4 }),
  alasan: t.String({ minLength: 5 }),
});

export { detailPengaduanParamsSchema as publicDetailPengaduanParamsSchema };
