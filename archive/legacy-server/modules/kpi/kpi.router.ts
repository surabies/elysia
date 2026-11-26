import { Elysia, t } from "elysia"
import { authPlugin } from "../../plugins/auth"
import {
  dapatkanPerspektifScorecard,
  tambahKpiBaru,
  perbaruiNilaiAktualKpi,
  perbaruiBobotKpi,
  perbaruiPemilikKpi,
  perbaruiKpiDetail,
  sinkronisasiKpiDariDatabaseRiil,
  dapatkanEvaluasiInsentifPetugas,
  dapatkanAturanInsentif,
  simpanAturanInsentif,
  dapatkanAlokasiBebanPetugas,
  simpanAlokasiBebanPetugas,
  simpanFaktorKesulitanRute,
  dapatkanDaftarPemilikKpi,
} from "../../services/kpi/kpi.service"
import {
  dapatkanDaftarFaktorMedanLengkap,
  simpanMapFaktorMedan,
  type RuteFaktorMedanConfig,
  FAKTOR_TOPOGRAFI_STANDAR,
  FAKTOR_MODA_AKSES_STANDAR,
  DAFTAR_HAMBATAN_KHUSUS,
} from "../../services/kpi/beban-kerja"

export const kpiRouter = new Elysia({ prefix: "/kpi" })
  .use(authPlugin)
  .guard({
    requireRole: ["SUPERADMIN", "EXECUTIVE", "SENIOR_MANAGER", "MANAGER"],
  })
  // 1. Ambil Scorecard Tree per Periode
  .get(
    "/",
    async ({ query }) => {
      const periode = query.periode || "Nov 2026"
      const data = await dapatkanPerspektifScorecard(periode)
      return {
        success: true,
        periode,
        data,
      }
    },
    {
      query: t.Object({
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 1b. Ambil Daftar Seluruh Pemilik (Owner) Nyata dari Database
  .get("/owners", async () => {
    const data = await dapatkanDaftarPemilikKpi()
    return {
      success: true,
      data,
    }
  })

  // 1c. Sinkronisasi Realisasi KPI Otomatis dari Laporan Transaksi Database Riil
  .post(
    "/sync-realisasi",
    async ({ body, set }) => {
      try {
        const result = await sinkronisasiKpiDariDatabaseRiil(
          body.periode || "Nov 2026",
          body.thbl
        )
        return {
          success: true,
          message:
            "Realisasi KPI berhasil disinkronkan dari laporan database riil",
          ...result,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal menyinkronkan realisasi dari database",
        }
      }
    },
    {
      body: t.Object({
        periode: t.Optional(t.String()),
        thbl: t.Optional(t.String()),
      }),
    }
  )

  // 1d. Ambil Matriks Evaluasi Beban Kerja & Parameter Insentif Petugas
  .get(
    "/evaluasi-insentif",
    async ({ query, set }) => {
      try {
        const result = await dapatkanEvaluasiInsentifPetugas(
          query.periode || "202611"
        )
        return {
          success: true,
          data: result,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal memuat matriks evaluasi insentif",
        }
      }
    },
    {
      query: t.Object({
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 1d. Ambil Daftar & Konfigurasi Faktor Medan Seluruh Rute (ABK)
  .get(
    "/faktor-medan",
    async ({ set }) => {
      try {
        const result = await dapatkanDaftarFaktorMedanLengkap()
        return {
          success: true,
          data: result,
          standarAcuan: {
            topografi: FAKTOR_TOPOGRAFI_STANDAR,
            modaAkses: FAKTOR_MODA_AKSES_STANDAR,
            hambatanKhusus: DAFTAR_HAMBATAN_KHUSUS,
          },
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal memuat konfigurasi faktor medan rute",
        }
      }
    }
  )

  // 1e. Simpan Pembaruan Faktor Medan Rute (Individual / Bulk)
  .put(
    "/faktor-medan",
    async ({ body, user, set }) => {
      try {
        const ok = await simpanMapFaktorMedan(
          body.ruteList as RuteFaktorMedanConfig[],
          user?.name || user?.email || "SUPERADMIN"
        )
        if (!ok) throw new Error("Gagal menyimpan ke database")
        return {
          success: true,
          message: "Konfigurasi faktor medan rute berhasil diperbarui",
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal menyimpan faktor medan",
        }
      }
    },
    {
      body: t.Object({
        ruteList: t.Array(
          t.Object({
            ruteKode: t.String(),
            seksiKode: t.Optional(t.String()),
            seksiNama: t.Optional(t.String()),
            pencatatDefault: t.Optional(t.String()),
            pencatatNama: t.Optional(t.String()),
            jumlahSL: t.Number(),
            topografi: t.String(),
            modaAkses: t.String(),
            faktorMedan: t.Number(),
            hambatanKhusus: t.Array(t.String()),
            catatan: t.Optional(t.String()),
          })
        ),
      }),
    }
  )

  // 1f. Reset Faktor Medan Rute ke Default Heuristik Regional
  .post(
    "/faktor-medan/reset",
    async ({ user, set }) => {
      try {
        const res = await dapatkanDaftarFaktorMedanLengkap()
        const ok = await simpanMapFaktorMedan(
          res.ruteList,
          user?.name || user?.email || "SUPERADMIN"
        )
        return {
          success: ok,
          message: "Faktor medan berhasil di-reset ke acuan standar regional",
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal me-reset faktor medan",
        }
      }
    }
  )

  // 1g. CRUD: Ambil Konfigurasi Aturan Rumusan Insentif Perusahaan
  .get(
    "/aturan-insentif",
    async ({ query, set }) => {
      try {
        const data = await dapatkanAturanInsentif(query.periode || "202611")
        return {
          success: true,
          data,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal memuat aturan insentif",
        }
      }
    },
    {
      query: t.Object({
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 1h. CRUD: Simpan / Perbarui Aturan Rumusan Insentif Perusahaan
  .put(
    "/aturan-insentif",
    async ({ body, user, set }) => {
      try {
        const result = await simpanAturanInsentif(
          body.periode || "202611",
          body,
          user?.name || "admin"
        )
        return {
          success: true,
          message: "Konfigurasi aturan insentif berhasil disimpan",
          data: result,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal menyimpan aturan insentif",
        }
      }
    },
    {
      body: t.Object({
        periode: t.String(),
        insentifDasar: t.Optional(t.Number()),
        tarifPerSl: t.Optional(t.Number()),
        bobotCapaianSl: t.Optional(t.Number()),
        bobotAkurasiGps: t.Optional(t.Number()),
        bobotKualitasBaca: t.Optional(t.Number()),
        bobotKecepatan: t.Optional(t.Number()),
        targetDurasiDetik: t.Optional(t.Number()),
        thresholdGradeA: t.Optional(t.Number()),
        thresholdGradeB: t.Optional(t.Number()),
        thresholdGradeC: t.Optional(t.Number()),
        pengaliGradeA: t.Optional(t.Number()),
        pengaliGradeB: t.Optional(t.Number()),
        pengaliGradeC: t.Optional(t.Number()),
        minIndeksBeban: t.Optional(t.Number()),
        maxIndeksBeban: t.Optional(t.Number()),
        catatan: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // 1i. CRUD: Ambil Alokasi Beban Kerja & Target Personel Lapangan
  .get(
    "/alokasi-beban",
    async ({ query, set }) => {
      try {
        const result = await dapatkanAlokasiBebanPetugas(
          query.periode || "202611"
        )
        return {
          success: true,
          data: result,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal memuat alokasi beban kerja",
        }
      }
    },
    {
      query: t.Object({
        periode: t.Optional(t.String()),
      }),
    }
  )

  // 1j. CRUD: Simpan / Perbarui Alokasi Beban Kerja Personel Tertentu
  .put(
    "/alokasi-beban/:petugasId",
    async ({ params, body, set }) => {
      try {
        const result = await simpanAlokasiBebanPetugas(
          body.periode || "202611",
          params.petugasId,
          {
            targetSlPenugasan: body.targetSlPenugasan,
            faktorKesulitanMedan: body.faktorKesulitanMedan,
            statusTugas: body.statusTugas,
            catatan: body.catatan,
          }
        )
        return {
          message: "Alokasi beban kerja personel berhasil diperbarui",
          ...result,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal memperbarui alokasi beban personel",
        }
      }
    },
    {
      params: t.Object({
        petugasId: t.String(),
      }),
      body: t.Object({
        periode: t.String(),
        targetSlPenugasan: t.Optional(t.Nullable(t.Number())),
        faktorKesulitanMedan: t.Optional(t.Number()),
        statusTugas: t.Optional(t.String()),
        catatan: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // 1k. CRUD: Simpan / Perbarui Faktor Kesulitan Medan per Kode Rute
  .put(
    "/alokasi-beban/rute/:ruteKode",
    async ({ params, body, set }) => {
      try {
        const result = await simpanFaktorKesulitanRute(params.ruteKode, {
          faktorKesulitanMedan: body.faktorKesulitanMedan,
          kategoriMedan: body.kategoriMedan,
          keterangan: body.keterangan,
        })
        return {
          message: `Faktor kesulitan medan rute ${params.ruteKode} berhasil diperbarui`,
          ...result,
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal memperbarui faktor kesulitan rute",
        }
      }
    },
    {
      params: t.Object({
        ruteKode: t.String(),
      }),
      body: t.Object({
        faktorKesulitanMedan: t.Number(),
        kategoriMedan: t.Optional(t.String()),
        keterangan: t.Optional(t.Nullable(t.String())),
      }),
    }
  )

  // 2. Tambah KPI Baru
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await tambahKpiBaru(
          {
            name: body.name,
            objectiveId: body.objectiveId,
            ownerId: body.ownerId,
            direction: body.direction as any,
            weight: body.weight,
            baseline: body.baseline,
            target: body.target,
            value: body.value,
            format: body.format as any,
          },
          body.periode || "Sep 2026",
          body.ownerDetails
        )
        return {
          success: true,
          id: result.id,
          message: "KPI berhasil ditambahkan",
        }
      } catch (err: any) {
        set.status = 500
        return {
          success: false,
          error: err.message || "Gagal menambahkan KPI",
        }
      }
    },
    {
      body: t.Object({
        name: t.String(),
        objectiveId: t.String(),
        ownerId: t.String(),
        direction: t.String(),
        weight: t.Number(),
        baseline: t.Number(),
        target: t.Number(),
        value: t.Nullable(t.Number()),
        format: t.String(),
        periode: t.Optional(t.String()),
        ownerDetails: t.Optional(
          t.Object({
            name: t.String(),
            initials: t.String(),
          })
        ),
      }),
    }
  )

  // 3. Update Nilai Aktual (Actual)
  .patch(
    "/:id/nilai",
    async ({ params, body, set }) => {
      try {
        await perbaruiNilaiAktualKpi(params.id, body.periode, body.nilai)
        return { success: true, message: "Nilai aktual berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        periode: t.String(),
        nilai: t.Nullable(t.Number()),
      }),
    }
  )

  // 4. Update Bobot (Weight)
  .patch(
    "/:id/bobot",
    async ({ params, body, set }) => {
      try {
        await perbaruiBobotKpi(params.id, body.bobot)
        return { success: true, message: "Bobot berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        bobot: t.Number(),
      }),
    }
  )

  // 5. Update Pemilik (Owner)
  .patch(
    "/:id/pemilik",
    async ({ params, body, set }) => {
      try {
        await perbaruiPemilikKpi(
          params.id,
          body.pemilikId,
          body.pemilikNama,
          body.pemilikInisial
        )
        return { success: true, message: "Pemilik berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        pemilikId: t.String(),
        pemilikNama: t.String(),
        pemilikInisial: t.String(),
      }),
    }
  )

  // 6. Update Detail Atribut KPI (nama, bobot, baseline, target, arah) secara Inline
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      try {
        await perbaruiKpiDetail(params.id, body as any)
        return { success: true, message: "Detail KPI berhasil diperbarui" }
      } catch (err: any) {
        set.status = 500
        return { success: false, error: err.message }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        nama: t.Optional(t.String()),
        bobot: t.Optional(t.Number()),
        baseline: t.Optional(t.Number()),
        target: t.Optional(t.Number()),
        arah: t.Optional(t.String()),
      }),
    }
  )
