"use client"

// features/publik/components/pengaduan-form.tsx
import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Copy,
  MapPin,
  Send,
  TriangleAlert,
  UserPlus,
  BadgeCheck,
  ArrowRight,
  Clock,
} from "@/components/ui/hugeicons-compat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { kirimPengaduan, ApiError, type HasilPengaduan } from "../lib/api"
import {
  LABEL_JENIS_PENGADUAN,
  LABEL_KLASIFIKASI_PENGADUAN,
  formatWaktu,
} from "../lib/format"
import { PemilihFoto } from "./PemilihFoto"
import { PemilihVideo } from "./PemilihVideo"
import { PemilihLokasiPeta } from "./PemilihLokasiPeta"
import { TombolUtama } from "./TombolUtama"
import type { PetaCakupan } from "@/lib/domain/peta-tipe"

type Koordinat = { lat: number; lng: number }

/// Rapikan nomor sebelum divalidasi/dikirim: buang spasi, tanda hubung,
/// titik, dan tanda kurung yang lazim diketik warga.
function normalisasiHp(v: string): string {
  return v.trim().replace(/[\s().-]/g, "")
}

/// Longgar SENGAJA: menerima HP (08…/+62…/62…) MAUPUN telepon rumah berkode
/// area (mis. 022…) — pelapor bisa bukan pemilik ponsel. Yang ditolak hanya
/// yang jelas bukan nomor: huruf, terlalu pendek/panjang. Server tetap
/// menyimpan apa adanya; ini murni penjaga kualitas data di sisi warga.
function hpValid(v: string): boolean {
  return /^(\+?62|0)\d{7,13}$/.test(normalisasiHp(v))
}

export function PengaduanForm({
  sudahLogin,
  peta = null,
}: {
  sudahLogin: boolean
  peta?: PetaCakupan | null
}) {
  // Kunci idempotensi: SATU nilai untuk seluruh umur form ini. Dibuat lazy
  // sekali (bukan tiap render) supaya retry / tap-ganda / gagal-lalu-kirim-
  // ulang memakai kunci yang sama — server memulangkan tiket yang sama alih-
  // alih membuat kembar. Reload halaman = laporan baru = kunci baru.
  const [clientRequestId] = React.useState(() => crypto.randomUUID())
  const [pending, setPending] = React.useState(false)
  const [pesanError, setPesanError] = React.useState<string | null>(null)
  const [hasil, setHasil] = React.useState<HasilPengaduan | null>(null)
  const [klasifikasi, setKlasifikasi] = React.useState(
    "BUKAN_NILAI_TAGIHAN_REKENING"
  )
  const [jenis, setJenis] = React.useState("LAPOR_STAND_METER")
  const [koordinat, setKoordinat] = React.useState<Koordinat | null>(null)
  const [alamatKejadian, setAlamatKejadian] = React.useState("")
  const [fotoFile, setFotoFile] = React.useState<File | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = React.useState<string | null>(
    null
  )
  const [videoFile, setVideoFile] = React.useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = React.useState<string | null>(
    null
  )
  const [disalin, setDisalin] = React.useState(false)

  function salinTiket(nomor: string) {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(nomor)
      setDisalin(true)
      setTimeout(() => setDisalin(false), 2000)
    }
  }

  function resetForm() {
    setHasil(null)
    setKlasifikasi("BUKAN_NILAI_TAGIHAN_REKENING")
    setJenis("LAPOR_STAND_METER")
    setKoordinat(null)
    setAlamatKejadian("")
    hapusFoto()
    hapusVideo()
    setPesanError(null)
  }

  // Blob URL adalah alokasi memori yang bertahan sampai dicabut — tanpa ini
  // media yang diganti berkali-kali menumpuk sampai tab ditutup.
  React.useEffect(() => {
    return () => {
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    }
  }, [fotoPreviewUrl])
  React.useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    }
  }, [videoPreviewUrl])

  function pilihFoto(file: File, url: string) {
    setFotoFile(file)
    setFotoPreviewUrl((lama) => {
      if (lama) URL.revokeObjectURL(lama)
      return url
    })
  }
  function hapusFoto() {
    setFotoFile(null)
    setFotoPreviewUrl((lama) => {
      if (lama) URL.revokeObjectURL(lama)
      return null
    })
  }
  function pilihVideo(file: File, url: string) {
    setVideoFile(file)
    setVideoPreviewUrl((lama) => {
      if (lama) URL.revokeObjectURL(lama)
      return url
    })
  }
  function hapusVideo() {
    setVideoFile(null)
    setVideoPreviewUrl((lama) => {
      if (lama) URL.revokeObjectURL(lama)
      return null
    })
  }

  // Backend menolak BOCOR_PIPA_DINAS tanpa koordinat (422). Ditampilkan
  // sebagai syarat di UI supaya pengguna tahu sebelum menekan kirim, bukan
  // sesudah.
  const butuhLokasi = jenis === "BOCOR_PIPA_DINAS"

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (butuhLokasi && !koordinat) {
      setPesanError(
        "Untuk laporan bocor pipa dinas, silakan tandai titik lokasi pada peta agar regu teknisi dapat menemukan lokasinya."
      )
      return
    }

    const nomorLangganan = String(fd.get("nomorLangganan") ?? "").trim()
    const kontakPelapor = String(fd.get("kontakPelapor") ?? "").trim()
    if (!hpValid(kontakPelapor)) {
      setPesanError(
        "Nomor HP/telepon tidak valid. Contoh: 081234567890 atau 022xxxxxxx."
      )
      return
    }

    setPesanError(null)
    setPending(true)
    try {
      setHasil(
        await kirimPengaduan({
          klasifikasi,
          jenis,
          deskripsi: String(fd.get("deskripsi") ?? "").trim(),
          pelapor: String(fd.get("pelapor") ?? "").trim(),
          kontakPelapor: normalisasiHp(kontakPelapor),
          alamatKejadian: alamatKejadian.trim() || undefined,
          nomorLangganan: nomorLangganan || undefined,
          koordinat: koordinat ?? undefined,
          foto: fotoFile,
          video: videoFile,
          clientRequestId,
        })
      )
    } catch (err) {
      setPesanError(
        err instanceof ApiError ? err.message : "Terjadi kesalahan. Coba lagi."
      )
    } finally {
      setPending(false)
    }
  }

  if (hasil) {
    return (
      <div className="space-y-6">
        {/* Radiant Success Badge Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex size-16 sm:size-20 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"
            />
            <span className="relative flex size-16 sm:size-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-md">
              <BadgeCheck className="size-8 sm:size-10" />
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pengaduan Berhasil Terkirim
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              {hasil.pesan}
            </p>
          </div>
        </div>

        {/* Digital Ticket Key Section (Tanpa nested card) */}
        <div className="space-y-3 border-y border-border py-4">
          <div className="flex items-center justify-between pb-1 text-[10px] sm:text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            <span>Nomor Tiket Pengaduan</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Kunci Pelacakan
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/50 p-3.5 rounded-2xl border border-border">
            <code className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-blue-600 dark:text-sky-400">
              {hasil.nomorTiket}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold self-start sm:self-auto gap-1.5 min-h-[38px] bg-card"
              onClick={() => salinTiket(hasil.nomorTiket)}
            >
              {disalin ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Salin Tiket</span>
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2 text-xs pt-1">
            {hasil.targetSelesaiAt && (
              <div className="flex items-center justify-between border-b border-dashed border-border pb-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5 text-blue-600 dark:text-sky-400" />
                  Target Penanganan (SLA)
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatWaktu(hasil.targetSelesaiAt)} WIB
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              {sudahLogin
                ? "Laporan ini otomatis tersimpan di riwayat akun Anda."
                : "Simpan nomor tiket ini untuk memantau progres tindakan teknisi lapangan kapan saja."}
            </p>
          </div>
        </div>

        {/* Akun Helper Note */}
        {sudahLogin ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p>
              Laporan otomatis terarsip di akun Anda.{" "}
              <Link href="/akun" className="font-semibold underline underline-offset-2">
                Lihat semua laporan saya
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-800 dark:text-sky-300">
            <UserPlus className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-sky-400" />
            <p>
              Punya beberapa aduan?{" "}
              <Link href="/daftar?callbackUrl=/akun" className="font-semibold underline underline-offset-2">
                Daftar akun warga
              </Link>{" "}
              agar seluruh riwayat tersimpan otomatis tanpa perlu mencatat nomor tiket satu per satu.
            </p>
          </div>
        )}

        {/* Mobile-Friendly CTAs */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="min-w-0 flex-1">
            <TombolUtama asChild size="lg" className="w-full font-semibold rounded-xl min-h-[44px]">
              <Link href={`/pengaduan-air?tab=lacak&nomor=${hasil.nomorTiket}`}>
                <span>Lacak Tiket Ini Sekarang</span>
                <ArrowRight className="size-4" />
              </Link>
            </TombolUtama>
          </div>

          <div className="min-w-0 flex-1">
            <Button
              onClick={resetForm}
              variant="outline"
              size="lg"
              className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm font-medium"
            >
              Buat Laporan Baru
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="klasifikasi">Klasifikasi pengaduan</FieldLabel>
          <Select
            value={klasifikasi}
            onValueChange={setKlasifikasi}
            disabled={pending}
          >
            <SelectTrigger id="klasifikasi" className="w-full">
              <SelectValue placeholder="Pilih klasifikasi pengaduan..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LABEL_KLASIFIKASI_PENGADUAN).map(
                ([nilai, label]) => (
                  <SelectItem key={nilai} value={nilai}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          <FieldDescription>
            Menentukan unit mana yang menindaklanjuti laporan Anda.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="jenis">Jenis pengaduan</FieldLabel>
          <Select
            value={jenis}
            onValueChange={setJenis}
            disabled={pending}
          >
            <SelectTrigger id="jenis" className="w-full">
              <SelectValue placeholder="Pilih jenis pengaduan..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LABEL_JENIS_PENGADUAN).map(([nilai, label]) => (
                <SelectItem key={nilai} value={nilai}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="deskripsi">Keterangan / Detail Laporan</FieldLabel>
          <Textarea
            id="deskripsi"
            name="deskripsi"
            rows={4}
            placeholder="Jelaskan detail kendala, sejak kapan terjadi, patokan lokasi terdekat..."
            disabled={pending}
            required
          />
          <FieldDescription>
            Tuliskan kronologi singkat atau patokan agar petugas mudah menemukan lokasi.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="alamatKejadian">Alamat kejadian</FieldLabel>
          <Input
            id="alamatKejadian"
            name="alamatKejadian"
            placeholder="Contoh: Jl. Asia Afrika No. 12, RT 02/05"
            value={alamatKejadian}
            onChange={(e) => setAlamatKejadian(e.target.value)}
            disabled={pending}
          />
          <FieldDescription>
            Patokan nomor rumah, gang, atau ruko. Otomatis terisi saat Anda menandai peta di bawah.
          </FieldDescription>
        </Field>

        <Field data-invalid={butuhLokasi && !koordinat && !!pesanError}>
          <FieldLabel htmlFor="lokasi">
            Titik Lokasi Kejadian{" "}
            {butuhLokasi ? (
              <span className="text-destructive font-medium">* (Wajib untuk bocor pipa)</span>
            ) : (
              <span className="text-muted-foreground font-normal">(opsional)</span>
            )}
          </FieldLabel>
          <FieldDescription>
            {butuhLokasi
              ? "Wajib untuk laporan bocor pipa dinas — klik pada peta, cari nama jalan, atau gunakan GPS."
              : "Klik pada peta atau gunakan tombol GPS untuk menandai titik kejadian agar teknisi cepat menuju lokasi."}
          </FieldDescription>

          <PemilihLokasiPeta
            koordinat={koordinat}
            onPilihKoordinat={setKoordinat}
            onPilihAlamat={(alamat) => {
              setAlamatKejadian(alamat)
            }}
            wajib={butuhLokasi}
          />
        </Field>

        <PemilihFoto
          previewUrl={fotoPreviewUrl}
          onPilih={pilihFoto}
          onHapus={hapusFoto}
          onError={setPesanError}
          label="Foto bukti (opsional)"
          deskripsi="Satu foto kondisi di lapangan sangat membantu petugas menyiapkan alat sebelum berangkat."
          disabled={pending}
        />

        <PemilihVideo
          previewUrl={videoPreviewUrl}
          onPilih={pilihVideo}
          onHapus={hapusVideo}
          onError={setPesanError}
          label="Video bukti (opsional)"
          deskripsi="Klip pendek 30–60 detik (maksimal 60) — mis. aliran air bocor. Ditampilkan dalam kualitas teroptimasi."
          disabled={pending}
        />

        <Field>
          <FieldLabel htmlFor="nomorLangganan">
            Nomor langganan (opsional)
          </FieldLabel>
          <Input
            id="nomorLangganan"
            name="nomorLangganan"
            inputMode="numeric"
            maxLength={11}
            placeholder="Kosongkan bila Anda bukan pelanggan"
            disabled={pending}
          />
          <FieldDescription>
            Warga yang bukan pelanggan tetap boleh melapor — mis. melihat pipa
            bocor di jalan.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="pelapor">Nama Anda</FieldLabel>
          <Input
            id="pelapor"
            name="pelapor"
            autoComplete="name"
            disabled={pending}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="kontakPelapor">
            Nomor HP yang bisa dihubungi
          </FieldLabel>
          <Input
            id="kontakPelapor"
            name="kontakPelapor"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0812…"
            disabled={pending}
            required
          />
          <FieldDescription>
            Dipakai petugas untuk menghubungi Anda soal laporan ini.
          </FieldDescription>
        </Field>

        {pesanError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{pesanError}</AlertDescription>
          </Alert>
        )}

        <TombolUtama
          type="submit"
          size="lg"
          className="h-12 w-full rounded-xl font-semibold shadow-sm transition-all"
          disabled={pending}
        >
          {pending ? <Spinner className="size-4" /> : <Send />}
          {pending ? "Mengirim…" : "Kirim pengaduan"}
        </TombolUtama>
      </FieldGroup>
    </form>
  )
}
