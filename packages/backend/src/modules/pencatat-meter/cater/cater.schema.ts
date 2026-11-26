import { t } from "elysia";

// 1. Kueri Daftar Rute
export const routesQuerySchema = t.Object({
  limit: t.Optional(t.Numeric({ default: 50, minimum: 1, maximum: 500 })),
  offset: t.Optional(t.Numeric({ default: 0, minimum: 0 })),
});

// 2. Unduh Beban Rute Pelanggan
export const routePelangganParamsSchema = t.Object({
  kode: t.String({ minLength: 1, description: "Kode rute cater e.g. CD104" }),
});

export const routePelangganQuerySchema = t.Object({
  limit: t.Optional(t.Numeric({ default: 500, minimum: 1, maximum: 2000 })),
  thbl: t.Optional(t.String({ pattern: "^\\d{4}(0[1-9]|1[0-2])$" })),
});

// 3. Submit Pembacaan Meter (Mobile Petugas)
export const submitReadingBodySchema = t.Object({
  thbl: t.String({
    pattern: "^\\d{4}(0[1-9]|1[0-2])$",
    description: "Tahun Bulan e.g. 202601",
  }),
  nolg: t.String({ minLength: 1, description: "Nomor Langganan" }),
  ruteKode: t.Optional(t.String()),
  petugasId: t.Optional(t.String()),
  stml: t.Number({ minimum: 0, description: "Stand Meter Lalu" }),
  stma: t.Number({ minimum: 0, description: "Stand Meter Akhir" }),
  pakaiLalu: t.Optional(t.Number({ minimum: 0, description: "Pemakaian periode lalu" })),
  pakaiTaksasiManual: t.Optional(t.Number({ minimum: 0, description: "Nilai taksasi yang ditetapkan operator (menggantikan pakai_lalu)" })),
  alasanTaksasiManual: t.Optional(t.String({ description: "Alasan wajib (min 5 karakter) bila pakaiTaksasiManual diisi" })),
  kondisiCatat: t.Optional(t.String()),
  metodeCatat: t.Optional(t.String()),
  sumberCatat: t.Optional(
    t.Union([
      t.Literal("PETUGAS_ONSITE"),
      t.Literal("PETUGAS_OFFSITE"),
      t.Literal("MANDIRI_WEB"),
      t.Literal("MANDIRI_APP"),
      t.Literal("MANUAL"),
    ]),
  ),
  fotoMeterUrl: t.Optional(t.String()),
  fotoSegelUrl: t.Optional(t.String()),
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
  caterId: t.String({
    minLength: 1,
    description: "ID transaksi pembacaan meter",
  }),
});

// 6. Verifikasi V1 (Supervisor Seksi/Rute)
export const verifyV1BodySchema = t.Object({
  caterId: t.String({ minLength: 1 }),
  action: t.Union([t.Literal("APPROVE"), t.Literal("REQUEST_RESURVEY")]),
  catatan: t.Optional(t.String()),
});

// 7. Verifikasi V2 (Manager Cabang/Wilayah)
export const verifyV2BodySchema = t.Object({
  caterId: t.String({ minLength: 1 }),
  action: t.Union([
    t.Literal("APPROVE"),
    t.Literal("ADJUST_STAND"),
    t.Literal("REQUEST_RESURVEY"),
  ]),
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
  alasan: t.String({
    minLength: 5,
    description: "Wajib mencantumkan alasan koreksi data",
  }),
});

// 10. Manajemen Rute (Menu 2.6, 2.7, 2.8)
export const pindahRuteBodySchema = t.Object({
  nolgList: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
  ruteTujuan: t.String({ minLength: 1 }),
});

export const urutkanRuteBodySchema = t.Object({
  ruteKode: t.String({ minLength: 1 }),
  urutanList: t.Array(
    t.Object({
      nolg: t.String({ minLength: 1 }),
      noUrutRute: t.Number({ minimum: 1 }),
    }),
    { minItems: 1 },
  ),
});

export const gabungRuteBodySchema = t.Object({
  ruteSumber: t.String({ minLength: 1 }),
  ruteTujuan: t.String({ minLength: 1 }),
});

// 11. Administrasi Pelanggan (Menu 3.2, 3.3, 3.4, 3.5)
export const cariPelangganQuerySchema = t.Object({
  q: t.String({
    minLength: 1,
    description: "Kata kunci pencarian (NOLG, NPRS, Nama, Alamat)",
  }),
  limit: t.Optional(t.Numeric({ default: 30, minimum: 1, maximum: 100 })),
});

export const daftarKontakQuerySchema = t.Object({
  q: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal('ALL'),
      t.Literal('VALID'),
      t.Literal('EMPTY'),
      t.Literal('INVALID'),
    ])
  ),
  ruteKode: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
  limit: t.Optional(t.Numeric({ default: 20, minimum: 5, maximum: 100 })),
});

export const detailPelangganParamsSchema = t.Object({
  nolg: t.String({ minLength: 1 }),
});

export const updateKontakPelangganBodySchema = t.Object({
  noTelp: t.String({ maxLength: 25 }),
});

export const updateTarifPelangganBodySchema = t.Object({
  tarifKode: t.String({ minLength: 1 }),
  alasan: t.Optional(t.String()),
  noSuratPermohonan: t.Optional(t.String()),
  nikPemohon: t.Optional(t.String()),
  namaPemohon: t.Optional(t.String()),
  noHpPemohon: t.Optional(t.String()),
  tahapPindahTarif: t.Optional(t.String()),
  petugasSurvei: t.Optional(t.String()),
  tglSurvei: t.Optional(t.String()),
  kesimpulanSurvei: t.Optional(t.String()),
  fotoSurveiUrl: t.Optional(t.String()),
  catatan: t.Optional(t.String()),
});

export const mutasiPelangganBodySchema = t.Object({
  nama: t.Optional(t.String({ minLength: 1 })),
  alamat: t.Optional(t.String({ minLength: 1 })),
  rt: t.Optional(t.String()),
  rw: t.Optional(t.String()),
  status: t.Optional(t.String()),
  lat: t.Optional(t.Number()),
  lng: t.Optional(t.Number()),
  catatan: t.Optional(t.String()),
  // Data Mutasi Wilayah & Rute Pelayanan Lain
  ruteKodeBaru: t.Optional(t.String()),
  noUrutRuteBaru: t.Optional(t.Number()),
  alasanMutasiWilayah: t.Optional(t.String()),
  noSuratMutasiWilayah: t.Optional(t.String()),
  // Data Syarat Berkas & Balik Nama
  nikKtp: t.Optional(t.String()),
  noHp: t.Optional(t.String()),
  jenisDokumen: t.Optional(t.String()),
  noDokumen: t.Optional(t.String()),
  lampiranUrl: t.Optional(t.String()),
  // Data Alur Pemutusan 3-Pihak
  tipePemutusan: t.Optional(t.String()),
  alasanPemutusan: t.Optional(t.String()),
  tahapPemutusan: t.Optional(t.String()),
  standAngkat: t.Optional(t.Number()),
  noSegel: t.Optional(t.String()),
  petugasEksekusi: t.Optional(t.String()),
  tglEksekusi: t.Optional(t.String()),
  fotoBuktiUrl: t.Optional(t.String()),
});

// 11b. Validasi Titik Koordinat GPS / Geotagging Pelanggan
export const daftarGpsQuerySchema = t.Object({
  q: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal('ALL'),
      t.Literal('BER_GPS'),
      t.Literal('TANPA_GPS'),
    ])
  ),
  ruteKode: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
  limit: t.Optional(t.Numeric({ default: 20, minimum: 5, maximum: 100 })),
});

export const updateGpsBodySchema = t.Object({
  lat: t.Number({ minimum: -90, maximum: 90 }),
  lng: t.Number({ minimum: -180, maximum: 180 }),
  catatan: t.Optional(t.String()),
});

// 12. Monitoring Progress & Analitik Cater (Menu 5.2, 5.3, 5.5, 5.7)
export const thblParamsSchema = t.Object({
  thbl: t.String({ minLength: 6, maxLength: 6 }),
});

export const ikhtisarQuerySchema = t.Object({
  limit: t.Optional(t.Numeric({ default: 50, minimum: 1, maximum: 1000 })),
});

// 13. Visualisasi Spasial (Menu 6.1)
export const mapGeoJsonQuerySchema = t.Object({
  ruteKode: t.Optional(t.String()),
  thbl: t.Optional(t.String({ minLength: 6, maxLength: 6 })),
});
