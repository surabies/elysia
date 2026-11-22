import { t } from 'elysia';

export const fotoUploadFileItemSchema = t.Object({
  fileName: t.String({ description: 'Format: {THBL}_{JENIS}_{NOLG}.jpg' }),
  fileData: t.String({ description: 'Base64 data URL atau base64 payload' }),
});

export const importFotoBackupBodySchema = t.Object({
  files: t.Optional(t.Array(fotoUploadFileItemSchema)),
  items: t.Optional(
    t.Array(
      t.Object({
        nolg: t.String(),
        thbl: t.String(),
        stma: t.Number(),
        stml: t.Optional(t.Number()),
        fotoMeterUrl: t.String(),
        fotoSegelUrl: t.Optional(t.String()),
        fotoRumahUrl: t.Optional(t.String()),
        keterangan: t.Optional(t.String()),
      })
    )
  ),
});

export const dataPencatatanItemSchema = t.Object({
  thbl: t.String(),
  nolg: t.String({ minLength: 1 }),
  stml: t.Number(),
  stma: t.Number(),
  pakaiM3: t.Optional(t.Number()),
  tglCatat: t.Optional(t.String()),
  petugasId: t.Optional(t.String()),
  ruteKode: t.Optional(t.String()),
  ketCatat: t.Optional(t.String()),
  metodeCatat: t.Optional(t.String()),
  latitude: t.Optional(t.Number()),
  longitude: t.Optional(t.Number()),
  catatan: t.Optional(t.String()),
});

export const importDataBodySchema = t.Object({
  csvText: t.Optional(t.String()),
  items: t.Optional(t.Array(dataPencatatanItemSchema)),
});

export const rNomorItemSchema = t.Object({
  nolg: t.String({ minLength: 1 }),
  tglPutus: t.Optional(t.String()),
  nomorBa: t.Optional(t.String()),
  standCabut: t.Optional(t.Number()),
  alasan: t.Optional(t.String()),
});

export const importRNomorBodySchema = t.Object({
  items: t.Array(rNomorItemSchema),
});

export const importPbpkBodySchema = t.Object({
  csvText: t.Optional(t.String()),
  periode: t.Optional(t.String({ minLength: 6, maxLength: 6 })),
  rows: t.Optional(
    t.Array(
      t.Object({
        nolg: t.String(),
        nama: t.String(),
        alamat: t.String(),
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        notelp: t.Optional(t.String()),
        jmlpenghuni: t.Optional(t.Number()),
        nometer: t.Optional(t.String()),
        kd_merkmeter: t.Optional(t.String()),
        kd_ukmeter: t.Optional(t.String()),
        tglaktif: t.Optional(t.String()),
        kd_kelurahan: t.Optional(t.String()),
        kd_kecamatan: t.Optional(t.String()),
        kode_wilayah: t.Optional(t.String()),
        kd_rute: t.Optional(t.String()),
        kd_goltarif: t.Optional(t.String()),
        no_urutrute: t.Optional(t.Number()),
        mutasian: t.String(),
      })
    )
  ),
});

export const lapDataMeterItemSchema = t.Object({
  thbl: t.String(),
  nolg: t.String({ minLength: 1 }),
  nama: t.Optional(t.String()),
  alamat: t.Optional(t.String()),
  stml: t.Number(),
  stma: t.Number(),
  stmaCatat: t.Optional(t.Number()),
  pakaiM3: t.Optional(t.Number()),
  pakaiLalu: t.Optional(t.Number()),
  persentase: t.Optional(t.Number()),
  trf: t.Optional(t.String()),
  tmss: t.Optional(t.String()),
  ketCatat: t.Optional(t.String()),
  petugasId: t.Optional(t.String()),
  namaPetugas: t.Optional(t.String()),
  kdWm: t.Optional(t.String()),
  wil: t.Optional(t.String()),
  ruteKode: t.Optional(t.String()),
  zonaWil: t.Optional(t.String()),
  kdZonasi: t.Optional(t.String()),
  namaZonasi: t.Optional(t.String()),
  kecamatan: t.Optional(t.String()),
  kelurahan: t.Optional(t.String()),
  tglCatat: t.Optional(t.String()),
  tglUpload: t.Optional(t.String()),
  catatan: t.Optional(t.String()),
});

export const importLapDataMeterBodySchema = t.Object({
  csvText: t.Optional(t.String()),
  items: t.Optional(t.Array(lapDataMeterItemSchema)),
});
