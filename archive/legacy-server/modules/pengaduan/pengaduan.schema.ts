import { t } from 'elysia';

/**
 * Skema Literal Union Terstandar untuk Status, Prioritas, Jenis, dan Klasifikasi Pengaduan (B13)
 */
export const statusPengaduanSchema = t.Union([
  t.Literal('BARU'),
  t.Literal('TERVERIFIKASI'),
  t.Literal('DITUGASKAN'),
  t.Literal('MENUJU_LOKASI'),
  t.Literal('DIPROSES'),
  t.Literal('MENUNGGU_PELANGGAN'),
  t.Literal('SELESAI'),
  t.Literal('DITUTUP'),
  t.Literal('DITOLAK'),
  t.Literal('DIBUKA_KEMBALI'),
]);

export const prioritasPengaduanSchema = t.Union([
  t.Literal('RENDAH'),
  t.Literal('NORMAL'),
  t.Literal('TINGGI'),
  t.Literal('DARURAT'),
]);

export const jenisPengaduanSchema = t.Union([
  t.Literal('LAPOR_STAND_METER'),
  t.Literal('MUTASI_GOLONGAN_TARIF'),
  t.Literal('TIDAK_MAMPU_BAYAR'),
  t.Literal('PENCATATAN_METER_TIDAK_SESUAI'),
  t.Literal('LONJAKAN_PEMAKAIAN_AIR'),
  t.Literal('GANTI_STOP_KRAN'),
  t.Literal('BOCOR_PIPA_DINAS'),
  t.Literal('PASANGAN_LIAR'),
  t.Literal('TIDAK_ADA_AIR'),
  t.Literal('AIR_KERUH_BAU_BERWARNA'),
  t.Literal('PINDAH_JARINGAN'),
  t.Literal('LAINNYA'),
]);

export const klasifikasiPengaduanSchema = t.Union([
  t.Literal('NILAI_TAGIHAN_REKENING'),
  t.Literal('BUKAN_NILAI_TAGIHAN_REKENING'),
]);

export const createPengaduanBodySchema = t.Object({
  clientRequestId: t.Optional(t.String()),
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

export const detailPengaduanParamsSchema = t.Object({
  nomorTiket: t.String({ minLength: 5 }),
});

export const tugaskanPengaduanBodySchema = t.Object({
  pengaduanId: t.String({ minLength: 1 }),
  ditugaskanKeId: t.String({ minLength: 1 }),
  catatan: t.Optional(t.String()),
});

export const ubahStatusPengaduanBodySchema = t.Object({
  pengaduanId: t.String({ minLength: 1 }),
  statusKe: statusPengaduanSchema,
  catatan: t.Optional(t.String()),
  fotoPenyelesaianUrl: t.Optional(t.String()),
});

export const eskalasiPengaduanBodySchema = t.Object({
  prioritasBaru: t.Optional(prioritasPengaduanSchema),
  eskalasiKeId: t.Optional(t.String()),
  catatan: t.Optional(t.String()),
});

export const tambahCatatanPengaduanBodySchema = t.Object({
  catatan: t.String({ minLength: 1 }),
  isPublik: t.Optional(t.Boolean()),
});

export const kirimChatPengaduanBodySchema = t.Object({
  pesan: t.Optional(t.String({ minLength: 1 })),
  catatan: t.Optional(t.String({ minLength: 1 })),
  isPublik: t.Optional(t.Boolean()),
});

export const listPengaduanQuerySchema = t.Object({
  page: t.Optional(t.Numeric()),
  pageSize: t.Optional(t.Numeric()),
  q: t.Optional(t.String()),
  status: t.Optional(statusPengaduanSchema),
  prioritas: t.Optional(prioritasPengaduanSchema),
  jenis: t.Optional(jenisPengaduanSchema),
  periode: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortDir: t.Optional(t.String()),
  ditugaskanKeId: t.Optional(t.String()),
  melanggarSla: t.Optional(t.Union([t.Boolean(), t.String()])),
});

export const ratingPengaduanBodySchema = t.Object({
  rating: t.Number({ minimum: 1, maximum: 5 }),
  komentar: t.Optional(t.String()),
});
