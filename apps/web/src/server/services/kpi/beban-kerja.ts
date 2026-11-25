import { db, pengaturanKonten, ruteCater, petugasCater, pelanggan } from "@cater/db"
import { sql, eq, asc } from "drizzle-orm"

/**
 * ==============================================================================
 * ANALISIS BEBAN KERJA (ABK) PENCATAT METER — STANDAR INDUSTRI PDAM / PERPAMSI
 * ==============================================================================
 * Beban kerja tidak dihitung dari jumlah SL mentah, melainkan dari
 * WAKTU KERJA EFEKTIF yang dibutuhkan untuk menyelesaikan seluruh SL di rute:
 *
 *   Waktu Standar per SL = (Waktu Baca Dasar × Faktor Kelas × Faktor Kondisi)
 *                          + (Waktu Tempuh antar Meter × Faktor Medan Rute)
 *   Beban Kerja (jam)    = Σ Waktu Standar per SL ÷ 3600
 *   SL Tertimbang        = Beban Kerja (detik) ÷ Waktu Standar SL Acuan (domestik, normal, jarak default)
 *   Indeks Beban         = Clamp(Beban Kerja Petugas ÷ Rata-rata Beban Kerja, 0,70 – 1,40)
 */

export const KUNCI_PENGATURAN_FAKTOR_MEDAN = "kpi_faktor_medan_rute"

import {
  type TopografiKategori,
  type ModaAkses,
  type RuteFaktorMedanConfig,
  FAKTOR_TOPOGRAFI_STANDAR,
  FAKTOR_MODA_AKSES_STANDAR,
  DAFTAR_HAMBATAN_KHUSUS,
} from "@/features/dashboard/kpi/types/KpiTypes"

export {
  type TopografiKategori,
  type ModaAkses,
  type RuteFaktorMedanConfig,
  FAKTOR_TOPOGRAFI_STANDAR,
  FAKTOR_MODA_AKSES_STANDAR,
  DAFTAR_HAMBATAN_KHUSUS,
}

export const PARAMETER_ABK = {
  /** Waktu baca + foto + input per SL bila data durasi riil belum tersedia */
  waktuBacaDasarDetik: 45,
  /** Kecepatan jalan kaki efektif antar meter di dalam rute (m/detik) */
  kecepatanTempuhMps: 1.2,
  /** Jarak rata-rata antar meter bila cakupan GPS rute tidak memadai (meter) */
  jarakDefaultMeter: 25,
  /** Batas bawah & atas jarak antar meter agar outlier GPS tidak merusak hasil */
  jarakMinMeter: 5,
  jarakMaxMeter: 200,
  /** Cakupan GPS minimal per rute agar jarak tempuh riil dipakai */
  minCakupanGpsRute: 0.6,
  minTitikGpsRute: 10,
  /** Faktor kesulitan berdasarkan kelas pelanggan (golongan tarif / ukuran meter) */
  faktorKelas: {
    DOMESTIK: 1.0,
    NIAGA_KECIL: 1.1,
    NIAGA_BESAR: 1.2,
    INDUSTRI: 1.3,
  } as Record<KelasPelanggan, number>,
  /** Faktor kesulitan meter dengan kendala akses / kerusakan fisik pada periode acuan */
  faktorKondisiSulit: 1.2,
  /** Kapasitas kerja efektif */
  jamEfektifPerHari: 6,
  hariKerjaBacaPerPeriode: 15,
  /** Batas indeks beban */
  indeksMin: 0.7,
  indeksMax: 1.4,
} as const

export type KelasPelanggan = "DOMESTIK" | "NIAGA_KECIL" | "NIAGA_BESAR" | "INDUSTRI"

export interface BebanRute {
  ruteKode: string
  jumlahSL: number
  /** Σ (waktu baca × faktor kelas × faktor kondisi) dalam detik */
  detikBaca: number
  /** Σ waktu tempuh antar meter dalam detik (sudah dikali faktor medan) */
  detikTempuh: number
  totalDetik: number
  jarakAntarMeter: number
  sumberJarak: "GPS" | "DEFAULT"
  cakupanGpsPersen: number
  jumlahSulit: number
  jumlahNonDomestik: number
  topografi: TopografiKategori
  modaAkses: ModaAkses
  faktorMedan: number
}

export interface KonteksBebanKerja {
  thblAcuanKondisi: string | null
  waktuBacaDasarDetik: number
  sumberWaktuBaca: "DURASI_RIIL" | "ASUMSI"
  detikAcuanPerSL: number
  rute: Map<string, BebanRute>
}

function baris<T = any>(res: any): T[] {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.rows)) return res.rows
  return []
}

/**
 * Heuristik bawaan untuk menentukan medan awal berdasarkan prefix & seksi rute
 * jika belum pernah dikonfigurasi secara manual oleh supervisor/manajer.
 */
export function tentukanFaktorMedanDefault(
  ruteKode: string,
  seksiKode?: string | null
): { topografi: TopografiKategori; modaAkses: ModaAkses; faktorMedan: number } {
  const code = (ruteKode || "").toUpperCase()
  const seksi = (seksiKode || "").toUpperCase()

  // Wilayah Bandung Utara / Cibeunying perbukitan / Cidadap / Coblong (CC, C4)
  if (code.startsWith("CC") || seksi.includes("C4") || code.includes("CD11")) {
    return {
      topografi: "BERBUKIT",
      modaAkses: "CAMPURAN",
      faktorMedan: 1.2,
    }
  }

  // Wilayah perbukitan timur / lereng (BD5, dsb)
  if (code.startsWith("BD5") || code.startsWith("KD7")) {
    return {
      topografi: "BERGELOMBANG",
      modaAkses: "CAMPURAN",
      faktorMedan: 1.15,
    }
  }

  // Wilayah gang padat / bantaran sungai di pusat kota (KD, KC, CD)
  if (code.startsWith("KC") || code.startsWith("CD")) {
    return {
      topografi: "BERGELOMBANG",
      modaAkses: "CAMPURAN",
      faktorMedan: 1.1,
    }
  }

  // Wilayah datar / jalan aspal teratur (TA, TC, BD datar)
  return {
    topografi: "DATAR",
    modaAkses: "MOTOR_PENUH",
    faktorMedan: 1.0,
  }
}

/**
 * Mengambil konfigurasi faktor medan seluruh rute yang tersimpan di database.
 */
export async function dapatkanMapFaktorMedan(): Promise<Map<string, RuteFaktorMedanConfig>> {
  const map = new Map<string, RuteFaktorMedanConfig>()
  try {
    const rows = await db
      .select()
      .from(pengaturanKonten)
      .where(eq(pengaturanKonten.kunci, KUNCI_PENGATURAN_FAKTOR_MEDAN))
      .limit(1)

    if (rows.length > 0 && Array.isArray(rows[0].nilai)) {
      const list = rows[0].nilai as RuteFaktorMedanConfig[]
      for (const item of list) {
        if (item?.ruteKode) {
          map.set(item.ruteKode, item)
        }
      }
    }
  } catch (err) {
    console.warn("[FAKTOR_MEDAN] Gagal memuat pengaturan tersimpan, gunakan default:", err)
  }
  return map
}

/**
 * Menyimpan konfigurasi faktor medan rute ke tabel pengaturan_konten.
 */
export async function simpanMapFaktorMedan(
  items: RuteFaktorMedanConfig[],
  updatedBy = "SUPERADMIN"
): Promise<boolean> {
  try {
    await db
      .insert(pengaturanKonten)
      .values({
        kunci: KUNCI_PENGATURAN_FAKTOR_MEDAN,
        nilai: items as any,
        kategori: "kpi",
        keterangan: "Parameter Faktor Medan & Aksesibilitas Rute Catat Meter (ABK)",
        updatedAt: new Date(),
        updatedBy,
      })
      .onConflictDoUpdate({
        target: pengaturanKonten.kunci,
        set: {
          nilai: items as any,
          kategori: "kpi",
          keterangan: "Parameter Faktor Medan & Aksesibilitas Rute Catat Meter (ABK)",
          updatedAt: new Date(),
          updatedBy,
        },
      })
    return true
  } catch (err) {
    console.error("[FAKTOR_MEDAN] Gagal menyimpan konfigurasi faktor medan:", err)
    return false
  }
}

/**
 * Mengambil daftar lengkap seluruh 125 rute beserta status faktor medannya,
 * jumlah pelanggan, nama seksi, dan petugas pencatat default.
 */
export async function dapatkanDaftarFaktorMedanLengkap(): Promise<{
  ruteList: RuteFaktorMedanConfig[]
  summary: {
    totalRute: number
    totalSL: number
    rataFaktorMedan: number
    countDatar: number
    countBergelombang: number
    countBerbukit: number
    countCuramTangga: number
    countEkstrem: number
  }
}> {
  const [routes, listPetugas, countPerRute, savedMap] = await Promise.all([
    db.select().from(ruteCater).orderBy(asc(ruteCater.kode)),
    db.select().from(petugasCater),
    db
      .select({
        ruteKode: pelanggan.ruteKode,
        total: sql<number>`count(*)::int`,
      })
      .from(pelanggan)
      .groupBy(pelanggan.ruteKode),
    dapatkanMapFaktorMedan(),
  ])

  const petugasMap = new Map(listPetugas.map((p) => [p.id, p.nama]))
  const slMap = new Map(countPerRute.map((c) => [c.ruteKode, c.total]))

  const ruteList: RuteFaktorMedanConfig[] = routes.map((r) => {
    const saved = savedMap.get(r.kode)
    const sl = slMap.get(r.kode) ?? 0
    const def = tentukanFaktorMedanDefault(r.kode, r.seksiKode)

    return {
      ruteKode: r.kode,
      seksiKode: r.seksiKode ?? undefined,
      seksiNama: r.seksiNama ?? undefined,
      pencatatDefault: r.pencatatDefault ?? undefined,
      pencatatNama: r.pencatatDefault ? petugasMap.get(r.pencatatDefault) : undefined,
      jumlahSL: sl,
      topografi: saved?.topografi ?? def.topografi,
      modaAkses: saved?.modaAkses ?? def.modaAkses,
      faktorMedan: saved?.faktorMedan ?? def.faktorMedan,
      hambatanKhusus: saved?.hambatanKhusus ?? [],
      catatan: saved?.catatan,
      updatedAt: saved?.updatedAt,
      updatedBy: saved?.updatedBy,
    }
  })

  const totalRute = ruteList.length
  const totalSL = ruteList.reduce((acc, r) => acc + r.jumlahSL, 0)
  const rataFaktorMedan =
    totalRute > 0
      ? Number(
          (
            ruteList.reduce((acc, r) => acc + r.faktorMedan, 0) / totalRute
          ).toFixed(2)
        )
      : 1.0

  return {
    ruteList,
    summary: {
      totalRute,
      totalSL,
      rataFaktorMedan,
      countDatar: ruteList.filter((r) => r.topografi === "DATAR").length,
      countBergelombang: ruteList.filter((r) => r.topografi === "BERGELOMBANG").length,
      countBerbukit: ruteList.filter((r) => r.topografi === "BERBUKIT").length,
      countCuramTangga: ruteList.filter((r) => r.topografi === "CURAM_TANGGA").length,
      countEkstrem: ruteList.filter((r) => r.topografi === "EKSTREM").length,
    },
  }
}

/**
 * Menghitung beban kerja (detik) per rute untuk periode THBL dengan mempertimbangkan:
 * - Kelas pelanggan (golongan tarif & ukuran meter).
 * - Kondisi sulit (kendala akses / kerusakan fisik).
 * - Jarak tempuh antar meter (dari GPS atau default).
 * - FAKTOR MEDAN RUTE (topografi, moda akses, tanjakan/tangga).
 */
export async function hitungBebanKerjaRute(thbl: string): Promise<KonteksBebanKerja> {
  const P = PARAMETER_ABK

  const [refRes, durasiRes, faktorMedanMap] = await Promise.all([
    db.execute(sql`select max(thbl) as t from cater_baca_meter where thbl <= ${thbl}`),
    db.execute(sql`
      select
        count(*)::int as total,
        count(case when durasi_detik > 0 then 1 end)::int as ada,
        coalesce(percentile_cont(0.5) within group (order by durasi_detik) filter (where durasi_detik > 0), 0)::float as median
      from cater_baca_meter where thbl = ${thbl}
    `),
    dapatkanMapFaktorMedan(),
  ])

  const thblAcuan: string | null = baris(refRes)[0]?.t ?? null
  const durasi = baris(durasiRes)[0] ?? { total: 0, ada: 0, median: 0 }
  // Durasi riil dipakai bila minimal 30% bacaan memiliki durasi > 0
  const pakaiDurasiRiil =
    Number(durasi.total) > 0 &&
    Number(durasi.ada) / Number(durasi.total) >= 0.3 &&
    Number(durasi.median) > 0
  const waktuBaca = pakaiDurasiRiil
    ? Math.min(180, Math.max(15, Number(durasi.median)))
    : P.waktuBacaDasarDetik

  const [komposisiRes, jalurRes] = await Promise.all([
    db.execute(sql`
      with kond as (
        select b.nolg,
          bool_or(coalesce(mk.is_kendala_akses, false) or mk.kategori in ('KENDALA_AKSES', 'KERUSAKAN_FISIK')) as sulit
        from cater_baca_meter b
        left join master_kondisi_catat mk on mk.kode_tmss = b.tmss
        where b.thbl = ${thblAcuan ?? ""}
        group by b.nolg
      )
      select
        p.rute_kode as rute,
        case
          when p.tarif_kode like '4%' or p.ukuran_meter not in ('1/2') then 'INDUSTRI'
          when p.tarif_kode in ('3B', '3C', '2B') then 'NIAGA_BESAR'
          when p.tarif_kode = '3A' then 'NIAGA_KECIL'
          else 'DOMESTIK'
        end as kelas,
        coalesce(k.sulit, false) as sulit,
        count(*)::int as n,
        count(p.titik_lokasi)::int as gps
      from pelanggan p
      left join kond k on k.nolg = p.nolg
      where p.rute_kode is not null
      group by 1, 2, 3
    `),
    db.execute(sql`
      with titik as (
        select rute_kode, titik_lokasi as g,
          lag(titik_lokasi) over (partition by rute_kode order by no_urut_rute, nolg) as pg
        from pelanggan
        where titik_lokasi is not null and rute_kode is not null
      )
      select rute_kode as rute,
        count(*)::int as segmen,
        coalesce(percentile_cont(0.5) within group (order by st_distance(g::geography, pg::geography)), 0)::float as median_m
      from titik where pg is not null
      group by rute_kode
    `),
  ])

  const jalurMap = new Map(
    baris<{ rute: string; segmen: number; median_m: number }>(jalurRes).map((r) => [r.rute, r])
  )

  const rute = new Map<string, BebanRute>()
  for (const r of baris<{ rute: string; kelas: KelasPelanggan; sulit: boolean; n: number; gps: number }>(
    komposisiRes
  )) {
    const medanConfig = faktorMedanMap.get(r.rute)
    const defMedan = tentukanFaktorMedanDefault(r.rute)
    const topografi = medanConfig?.topografi ?? defMedan.topografi
    const modaAkses = medanConfig?.modaAkses ?? defMedan.modaAkses
    const faktorMedan = medanConfig?.faktorMedan ?? defMedan.faktorMedan

    const cur =
      rute.get(r.rute) ??
      ({
        ruteKode: r.rute,
        jumlahSL: 0,
        detikBaca: 0,
        detikTempuh: 0,
        totalDetik: 0,
        jarakAntarMeter: P.jarakDefaultMeter,
        sumberJarak: "DEFAULT",
        cakupanGpsPersen: 0,
        jumlahSulit: 0,
        jumlahNonDomestik: 0,
        topografi,
        modaAkses,
        faktorMedan,
        _gps: 0,
      } as BebanRute & { _gps: number })

    const n = Number(r.n)
    const faktor = (P.faktorKelas[r.kelas] ?? 1) * (r.sulit ? P.faktorKondisiSulit : 1)
    cur.jumlahSL += n
    cur.detikBaca += n * waktuBaca * faktor
    if (r.sulit) cur.jumlahSulit += n
    if (r.kelas !== "DOMESTIK") cur.jumlahNonDomestik += n
    ;(cur as any)._gps += Number(r.gps)
    rute.set(r.rute, cur)
  }

  for (const cur of rute.values()) {
    const gps = (cur as any)._gps as number
    delete (cur as any)._gps
    const cakupan = cur.jumlahSL > 0 ? gps / cur.jumlahSL : 0
    cur.cakupanGpsPersen = Number((cakupan * 100).toFixed(1))
    const jalur = jalurMap.get(cur.ruteKode)
    if (jalur && cakupan >= P.minCakupanGpsRute && gps >= P.minTitikGpsRute && jalur.median_m > 0) {
      cur.jarakAntarMeter = Number(
        Math.min(P.jarakMaxMeter, Math.max(P.jarakMinMeter, jalur.median_m)).toFixed(1)
      )
      cur.sumberJarak = "GPS"
    }

    // Waktu tempuh per meter diperhitungkan dengan FAKTOR MEDAN:
    // Medan berbukit/curam/tangga memperlambat mobilitas jalan kaki dan kendaraan
    cur.detikTempuh =
      cur.jumlahSL * (cur.jarakAntarMeter / P.kecepatanTempuhMps) * cur.faktorMedan

    // Waktu manuver di titik meter juga terdampak jika medan curam/tangga (kenaikan 50% dari selisih faktor medan)
    const faktorManuverBaca = 1 + (cur.faktorMedan - 1) * 0.5
    cur.detikBaca = cur.detikBaca * faktorManuverBaca

    cur.totalDetik = cur.detikBaca + cur.detikTempuh
  }

  return {
    thblAcuanKondisi: thblAcuan,
    waktuBacaDasarDetik: Number(waktuBaca.toFixed(1)),
    sumberWaktuBaca: pakaiDurasiRiil ? "DURASI_RIIL" : "ASUMSI",
    detikAcuanPerSL: waktuBaca + P.jarakDefaultMeter / P.kecepatanTempuhMps,
    rute,
  }
}
