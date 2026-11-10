// features/public/lib/kompresi-gambar.ts — kecilkan foto di browser sebelum diunggah.

const SISI_MAKS = 1600
const ANGGARAN_BYTE = 120 * 1024
const KUALITAS_MAKS = 0.92
const KUALITAS_MIN = 0.45
const LANGKAH_CARI = 6
const TANGGA_SISI = [1600, 1280, 1024, 800]

function dukungWebp(): boolean {
  try {
    const c = document.createElement("canvas")
    c.width = 1
    c.height = 1
    return c.toDataURL("image/webp").startsWith("data:image/webp")
  } catch {
    return false
  }
}

function gambarBertahap(
  sumber: ImageBitmap,
  lebarAkhir: number,
  tinggiAkhir: number
): HTMLCanvasElement | null {
  let lebar = sumber.width
  let tinggi = sumber.height

  let kanvas = document.createElement("canvas")
  kanvas.width = lebar
  kanvas.height = tinggi
  let ctx = kanvas.getContext("2d")
  if (!ctx) return null
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(sumber, 0, 0)

  while (lebar > lebarAkhir * 2) {
    const lebarBaru = Math.max(lebarAkhir, Math.round(lebar / 2))
    const tinggiBaru = Math.max(tinggiAkhir, Math.round(tinggi / 2))
    const berikut = document.createElement("canvas")
    berikut.width = lebarBaru
    berikut.height = tinggiBaru
    const c = berikut.getContext("2d")
    if (!c) return null
    c.imageSmoothingEnabled = true
    c.imageSmoothingQuality = "high"
    c.drawImage(kanvas, 0, 0, lebarBaru, tinggiBaru)
    kanvas = berikut
    ctx = c
    lebar = lebarBaru
    tinggi = tinggiBaru
  }

  if (lebar !== lebarAkhir || tinggi !== tinggiAkhir) {
    const akhir = document.createElement("canvas")
    akhir.width = lebarAkhir
    akhir.height = tinggiAkhir
    const c = akhir.getContext("2d")
    if (!c) return null
    c.imageSmoothingEnabled = true
    c.imageSmoothingQuality = "high"
    c.drawImage(kanvas, 0, 0, lebarAkhir, tinggiAkhir)
    return akhir
  }
  return kanvas
}

function keBlob(
  kanvas: HTMLCanvasElement,
  tipe: string,
  kualitas: number
): Promise<Blob | null> {
  return new Promise((resolve) => kanvas.toBlob(resolve, tipe, kualitas))
}

async function cariKualitasTerbaik(
  kanvas: HTMLCanvasElement,
  tipe: string
): Promise<{ blob: Blob; muat: boolean } | null> {
  let bawah = KUALITAS_MIN
  let atas = KUALITAS_MAKS
  let terbaik: Blob | null = null
  let terkecil: Blob | null = null

  for (let i = 0; i < LANGKAH_CARI; i++) {
    const kualitas = i === 0 ? atas : (bawah + atas) / 2
    const blob = await keBlob(kanvas, tipe, kualitas)
    if (!blob) break

    if (terkecil == null || blob.size < terkecil.size) terkecil = blob

    if (blob.size <= ANGGARAN_BYTE) {
      terbaik = blob
      bawah = kualitas
    } else {
      atas = kualitas
    }
    if (atas - bawah < 0.03) break
  }

  if (terbaik) return { blob: terbaik, muat: true }
  if (terkecil) return { blob: terkecil, muat: false }
  return null
}

export async function compressImage(file: File): Promise<File> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return file
  }

  const tipe = dukungWebp() ? "image/webp" : "image/jpeg"
  const ekstensi = tipe === "image/webp" ? "webp" : "jpg"

  try {
    let hasilTerkecil: Blob | null = null

    for (const sisi of TANGGA_SISI) {
      const skala = Math.min(1, sisi / Math.max(bitmap.width, bitmap.height))
      const lebar = Math.max(1, Math.round(bitmap.width * skala))
      const tinggi = Math.max(1, Math.round(bitmap.height * skala))

      const kanvas = gambarBertahap(bitmap, lebar, tinggi)
      if (!kanvas) return file

      const hasil = await cariKualitasTerbaik(kanvas, tipe)
      if (!hasil) return file

      if (hasil.muat) {
        return new File([hasil.blob], `foto-meter.${ekstensi}`, { type: tipe })
      }
      if (hasilTerkecil == null || hasil.blob.size < hasilTerkecil.size) {
        hasilTerkecil = hasil.blob
      }
    }

    if (hasilTerkecil) {
      return new File([hasilTerkecil], `foto-meter.${ekstensi}`, { type: tipe })
    }
    return file
  } finally {
    bitmap.close()
  }
}
