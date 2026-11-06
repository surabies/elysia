import { t } from 'elysia';

export const createPengaduanBodySchema = t.Object({
  clientRequestId: t.Optional(t.String()),
  nomorLangganan: t.Optional(t.String({ maxLength: 20 })),
  klasifikasi: t.Optional(
    t.Union([
      t.Literal('NILAI_TAGIHAN_REKENING'),
      t.Literal('BUKAN_NILAI_TAGIHAN_REKENING'),
    ])
  ),
  jenis: t.Union([
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
  ]),
  judul: t.String({ minLength: 3, maxLength: 255 }),
  deskripsi: t.String({ minLength: 5 }),
  koordinat: t.Optional(
    t.Object({
      x: t.Number(),
      y: t.Number(),
    })
  ),
  alamatKejadian: t.Optional(t.String()),
  prioritas: t.Optional(
    t.Union([
      t.Literal('RENDAH'),
      t.Literal('NORMAL'),
      t.Literal('TINGGI'),
      t.Literal('DARURAT'),
    ])
  ),
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
  statusKe: t.Union([
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
  ]),
  catatan: t.Optional(t.String()),
  fotoPenyelesaianUrl: t.Optional(t.String()),
});

export const ratingPengaduanBodySchema = t.Object({
  rating: t.Number({ minimum: 1, maximum: 5 }),
  komentar: t.Optional(t.String()),
});
