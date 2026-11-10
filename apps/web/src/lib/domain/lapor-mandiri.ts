export const TANGGAL_BUKA_LAPOR_MANDIRI = 1
export const TANGGAL_TUTUP_LAPOR_MANDIRI = 25

const OFFSET_WIB_MS = 7 * 60 * 60 * 1000

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const

function keWib(sekarang: Date): Date {
  return new Date(sekarang.getTime() + OFFSET_WIB_MS)
}

export interface JendelaLaporMandiri {
  boleh: boolean
  tanggal: number
  periode: number
  tanggalBuka: number
  tanggalTutup: number
  sisaHari: number | null
  bukaBerikutnya: string | null
  pesan: string
}

function tanggalUji(): number | null {
  const env = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env
  if (!env) return null
  if (env.NODE_ENV === "production") return null
  const mentah =
    env.LAPOR_MANDIRI_TANGGAL_UJI ?? env.NEXT_PUBLIC_LAPOR_MANDIRI_TANGGAL_UJI
  if (!mentah) return null
  const n = Number(mentah)
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null
}

export function jendelaLaporMandiri(
  sekarang: Date = new Date(),
  opsi: {
    tanggalBuka?: number
    tanggalTutup?: number
  } = {}
): JendelaLaporMandiri {
  const tanggalBuka = opsi.tanggalBuka ?? TANGGAL_BUKA_LAPOR_MANDIRI
  const tanggalTutup = opsi.tanggalTutup ?? TANGGAL_TUTUP_LAPOR_MANDIRI
  if (
    !Number.isInteger(tanggalBuka) ||
    !Number.isInteger(tanggalTutup) ||
    tanggalBuka < 1 ||
    tanggalBuka > 28 ||
    tanggalTutup < 1 ||
    tanggalTutup > 28 ||
    tanggalBuka > tanggalTutup
  ) {
    throw new RangeError(
      "Jendela laporan mandiri harus berada pada tanggal 1–28 dan tanggal buka tidak boleh melewati tanggal tutup."
    )
  }

  const wib = keWib(sekarang)
  const geser = tanggalUji()
  if (geser !== null) wib.setUTCDate(geser)
  const tanggal = wib.getUTCDate()
  const bulan = wib.getUTCMonth()
  const tahun = wib.getUTCFullYear()
  const periode = tahun * 100 + (bulan + 1)

  const boleh = tanggal >= tanggalBuka && tanggal <= tanggalTutup

  if (boleh) {
    const sisaHari = tanggalTutup - tanggal
    return {
      boleh: true,
      tanggal,
      periode,
      tanggalBuka,
      tanggalTutup,
      sisaHari,
      bukaBerikutnya: null,
      pesan:
        sisaHari === 0
          ? `Hari ini hari TERAKHIR pelaporan bulan ini (tanggal ${tanggalTutup}). Setelah hari ini pelaporan ditutup sampai jendela berikutnya.`
          : `Pelaporan dibuka tanggal ${tanggalBuka}–${tanggalTutup} — tersisa ${sisaHari} hari lagi.`,
    }
  }

  const bulanBuka = tanggal < tanggalBuka ? bulan : (bulan + 1) % 12
  const tahunBuka = tanggal < tanggalBuka || bulan < 11 ? tahun : tahun + 1
  const bukaBerikutnya = `${tanggalBuka} ${NAMA_BULAN[bulanBuka]} ${tahunBuka}`

  return {
    boleh: false,
    tanggal,
    periode,
    tanggalBuka,
    tanggalTutup,
    sisaHari: null,
    bukaBerikutnya,
    pesan:
      `Pelaporan meter mandiri hanya dilayani tanggal ${tanggalBuka}–${tanggalTutup} setiap bulan. ` +
      `Hari ini sudah tanggal ${tanggal}, jadi pelaporan bulan ini sudah ditutup. ` +
      `Silakan laporkan angka meter Anda mulai ${bukaBerikutnya}. ` +
      `Bila meter Anda belum sempat dicatat bulan ini, petugas akan tetap berkunjung sesuai jadwal rutenya.`,
  }
}
