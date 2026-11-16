"use client"

// features/public/components/PemilihFoto.tsx — pemilih + pratinjau SATU foto
// bukti, dipakai bersama oleh form pengaduan DAN lapor-meter supaya keduanya
// identik (dulu markup-nya disalin dua kali dan pelan-pelan menyimpang —
// padding & ukuran ikon beda). Ubah di sini, kedua halaman ikut.
//
// Komponen ini memproses berkas (validasi tipe/ukuran + kompres di browser)
// lalu MENYERAHKAN File terkompres + object-URL pratinjau ke pemanggil lewat
// `onPilih`. Siklus hidup URL (revoke) tetap milik pemanggil karena sebagian
// halaman (lapor-meter sukses) masih memakai URL itu setelah kirim.
import * as React from "react"
import { Camera, X } from "@/components/ui/hugeicons-compat"
import { BingkaiFoto, type RasioFoto } from "@/components/BingkaiFoto"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { compressImage } from "../lib/kompresi-gambar"

/// Batas berkas ASLI sebelum dikompres di browser. Lebih longgar dari batas
/// server (5 MB) karena compressImage() hampir selalu menurunkannya jauh di
/// bawah itu — menolak di sini pada 5 MB akan menolak foto HP normal.
const MAKS_FOTO_ASLI_BYTE = 15 * 1024 * 1024

export function PemilihFoto({
  previewUrl,
  onPilih,
  onHapus,
  onError,
  label,
  deskripsi,
  disabled = false,
  rasio = "16/9",
  mode = "utuh",
}: {
  previewUrl: string | null
  /// Dipanggil dengan File terkompres + object-URL baru. Pemanggil yang
  /// menyimpan keduanya (dan me-revoke URL lama).
  onPilih: (file: File, previewUrl: string) => void
  onHapus: () => void
  onError: (pesan: string | null) => void
  label: string
  deskripsi?: string
  disabled?: boolean
  rasio?: RasioFoto
  mode?: "isi" | "utuh"
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // memilih file yang sama dua kali tetap memicu onChange
    if (!file) return
    if (!file.type.startsWith("image/"))
      return onError("File harus berupa gambar (JPG, PNG, atau WEBP).")
    if (file.size > MAKS_FOTO_ASLI_BYTE)
      return onError("Ukuran foto maksimal 15 MB.")

    onError(null)
    try {
      const kompres = await compressImage(file)
      onPilih(kompres, URL.createObjectURL(kompres))
    } catch {
      onError("Gagal memproses foto. Coba foto lain.")
    }
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {/* TANPA atribut `capture`, dan itu disengaja.
          `capture="environment"` memerintahkan browser HP membuka kamera
          LANGSUNG dan melewati pemilih berkas — galeri jadi tidak bisa
          dijangkau sama sekali. Itu menyakitkan untuk kasus yang wajar:
          warga sudah memotret meternya lebih dulu, atau memotretkan meter
          orang tua di rumah lain lalu mengirimkannya kemudian.
          Tanpa `capture`, browser HP menampilkan pilihan (Kamera / Galeri /
          Berkas) dan pengguna yang memutuskan. Di desktop atribut ini memang
          tidak berpengaruh, jadi tidak ada yang hilang. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={pilih}
        disabled={disabled}
      />
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-md">
          {/* Frame rasio tetap; blob: lokal jadi tanpa dialog zoom. */}
          <BingkaiFoto
            src={previewUrl}
            alt="Pratinjau foto bukti"
            rasio={rasio}
            mode={mode}
            tanpaDialog
          />
          <button
            onClick={onHapus}
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-neutral-950/80 text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
            aria-label="Hapus foto"
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="group relative flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/60 p-6 sm:p-8 text-neutral-700 transition-all hover:border-blue-500 hover:bg-blue-50/30 active:scale-[0.99]"
          type="button"
          disabled={disabled}
        >
          {/* Viewfinder Target Corner Accents */}
          <div className="absolute top-2 left-2 size-3 border-t-2 border-l-2 border-neutral-300 rounded-tl-sm group-hover:border-blue-500 transition-colors" />
          <div className="absolute top-2 right-2 size-3 border-t-2 border-r-2 border-neutral-300 rounded-tr-sm group-hover:border-blue-500 transition-colors" />
          <div className="absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-neutral-300 rounded-bl-sm group-hover:border-blue-500 transition-colors" />
          <div className="absolute bottom-2 right-2 size-3 border-b-2 border-r-2 border-neutral-300 rounded-br-sm group-hover:border-blue-500 transition-colors" />

          {/* Camera Icon Pill */}
          <div className="flex size-13 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-neutral-200/90 transition-transform group-hover:scale-105 group-hover:ring-blue-400">
            <Camera className="size-6 text-blue-600" />
          </div>

          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold text-neutral-900">
              Ambil Foto / Pilih dari Galeri
            </p>
            <p className="mt-0.5 text-[11px] sm:text-xs text-neutral-500">
              Ketuk untuk membuka kamera ponsel Anda
            </p>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 bg-white px-2.5 py-0.5 text-[10px] font-medium text-neutral-600 shadow-2xs">
            JPG, PNG, WEBP · Otomatis Teroptimasi
          </span>
        </button>
      )}
      {deskripsi && <FieldDescription>{deskripsi}</FieldDescription>}
    </Field>
  )
}
