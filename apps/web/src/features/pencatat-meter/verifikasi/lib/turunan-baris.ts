// features/dashboard/verifikasi/lib/turunan-baris.ts — mengubah baris API
// menjadi bentuk yang siap ditampilkan tabel. Semua turunan (stand aktif,
// flag koreksi, tagihan) dihitung SATU kali per pemuatan data, bukan tiap
// render sel — kolom, sortir, dan gaya baris hanya membaca hasilnya.
import type { BarisVerifikasi } from "../types"
import { tentukanHasilPembacaan } from "./hasil-pembacaan"
import { LABEL_KONDISI_CATAT } from "./label-pencatatan"
import { tahapDari, type Tahap } from "./warna-tahap"

export interface BarisTurunan {
  id: string
  /** Baris asli — dikembalikan ke induk lewat onKlikBaris / onKlikKanan. */
  row: BarisVerifikasi
  tahap: Tahap

  nomor: string | null
  nama: string | null
  alamat: string | null

  standAwal: number | null
  standAkhir: number | null
  standAwalRevisi: number | null
  standResmi: number | null
  pemakaian: number | null
  pemakaianLalu: number | null
  /** Penetapan tagihan V3; null bila V3 belum memproses. */
  pemakaianTagih: number | null
  hasilTagihan: number | null
  persentase: number | null
  isAnomali: boolean
  kodeAnomaliUtama: string | null
  kodeAnomaliList: string[]

  rute: string | null
  kondisiLabel: string | null
  petugas: string | null
  tanggalCatat: string | null
  waktuCatat: number | null

  isMB: boolean
  isMudaKembali: boolean
  butuhKonfirmasiGuard: boolean
  pesanBlokirGuard: string | null
  standAkhirDikoreksi: boolean
  kondisiDikoreksi: boolean
  pemakaianDikoreksi: boolean
  /** Ada koreksi apa pun pada baris ini. */
  dikoreksi: boolean
}

export function turunkanBaris(row: BarisVerifikasi): BarisTurunan {
  const { standAwal, standAkhir, pemakaian } = tentukanHasilPembacaan(row)

  const v3Memproses = row.verif3At != null || row.pembacaan != null
  const pemakaianTagih = row.pemakaianTagihVerif ?? null
  const hasilTagihan =
    pemakaianTagih ??
    (v3Memproses ? (row.pembacaan?.pemakaianM3 ?? null) : null)

  const standAwalDikoreksi =
    row.standAwalRevisi != null && row.standAwalRevisi !== row.standAwal
  const standAkhirDikoreksi =
    row.standAkhirRevisi != null && row.standAkhirRevisi !== row.standAkhir
  const kondisiDikoreksi =
    row.kondisiRevisi != null && row.kondisiRevisi !== row.kondisi
  const gantiMeter =
    row.standAngkatRevisi != null ||
    row.standMeterBaruRevisi != null ||
    Boolean(row.mbTanpaStandAngkat) ||
    row.digitRollover != null
  const pemakaianDikoreksi =
    standAwalDikoreksi ||
    standAkhirDikoreksi ||
    gantiMeter ||
    row.pemakaianRevisi != null ||
    pemakaianTagih != null

  const kondisiAktif = row.kondisiRevisi ?? row.kondisi ?? null
  const kondisiNorm = (kondisiAktif ?? "").trim().toUpperCase()
  const waktu = row.tanggalCatat ? new Date(row.tanggalCatat).getTime() : NaN

  return {
    id: row.id,
    row,
    tahap: tahapDari(row),

    nomor: row.nomorLangganan ?? row.pelanggan?.nomorLangganan ?? null,
    nama: row.pelanggan?.nama ?? row.namaPelanggan ?? null,
    alamat: row.pelanggan?.alamat ?? row.alamatPelanggan ?? null,

    standAwal: standAwal ?? null,
    standAkhir: standAkhir ?? null,
    standAwalRevisi: row.standAwalRevisi ?? null,
    standResmi: row.pembacaan?.standAkhir ?? null,
    pemakaian: pemakaian ?? null,
    pemakaianLalu: row.pemakaianLalu ?? null,
    pemakaianTagih,
    hasilTagihan,
    persentase: row.persentase ?? null,
    isAnomali: Boolean(row.isAnomali),
    kodeAnomaliUtama: row.kodeAnomaliUtama ?? null,
    kodeAnomaliList: row.kodeAnomaliList ?? [],

    rute: row.pelanggan?.rute?.kode ?? null,
    kondisiLabel: kondisiAktif
      ? (LABEL_KONDISI_CATAT[kondisiAktif] ?? kondisiAktif)
      : null,
    petugas: row.pencatat?.namaLapangan ?? null,
    tanggalCatat: row.tanggalCatat ?? null,
    waktuCatat: Number.isNaN(waktu) ? null : waktu,

    isMB: kondisiNorm === "MB",
    isMudaKembali:
      kondisiNorm === "MUDA_KEMBALI" || kondisiNorm === "MUDA KEMBALI",
    butuhKonfirmasiGuard: Boolean(row.butuhKonfirmasiGuard),
    pesanBlokirGuard: row.pesanBlokirGuard ?? null,
    standAkhirDikoreksi,
    kondisiDikoreksi,
    pemakaianDikoreksi,
    dikoreksi:
      row.isCorrected === true ||
      pemakaianDikoreksi ||
      kondisiDikoreksi ||
      row.pemakaianTagihVerif != null,
  }
}
