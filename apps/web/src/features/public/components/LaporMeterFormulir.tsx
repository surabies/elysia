"use client"

// features/publik/components/lapor-meter-form.tsx
//
// Alur: ketik nomor langganan (11 digit) -> pratinjau identitas dicari
// otomatis lewat GET /api/public/pelanggan/:nomorLangganan (lookup SATU
// pelanggan exact-match, bukan pencarian sebagian — lihat catatan di
// server/modules/publik/publik.router.ts). Begitu pelanggan ketemu, field
// stand meter/foto/pelapor baru ditampilkan. TIDAK ada field nama pelanggan
// di sini — lihat catatan keputusan produk di server/modules/publik/verifikasi.ts.
import * as React from "react"
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  CalendarClock,
} from "@/components/ui/hugeicons-compat"
import type { JendelaLaporMandiri } from "@/lib/domain/lapor-mandiri"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  ambilJendelaLaporMandiri,
  ambilPeriodeUjiLaporMandiri,
  cariPelanggan,
  laporMeter,
  ApiError,
  type PelangganPratinjau,
  type PeriodeUjiLaporMeter,
} from "../lib/api"
import { formatPeriode } from "../lib/format"
import { PemilihFoto } from "./PemilihFoto"
import { LaporMeterSukses, type HasilLaporanTampilan } from "./LaporMeterSukses"
import { InputNomorLangganan } from "./MasukanNomorLangganan"
import { TombolUtama } from "./TombolUtama"

export function LaporMeterForm() {
  const [jendela, setJendela] = React.useState<JendelaLaporMandiri | null>(null)
  const [jendelaPending, setJendelaPending] = React.useState(true)
  const [jendelaError, setJendelaError] = React.useState<string | null>(null)
  const [periodeUji, setPeriodeUji] =
    React.useState<PeriodeUjiLaporMeter | null>(null)
  const [periodeUjiError, setPeriodeUjiError] = React.useState<string | null>(
    null
  )
  const [pilihanPeriode, setPilihanPeriode] = React.useState("202601")
  const [nomorLangganan, setNomorLangganan] = React.useState("")
  const [pratinjau, setPratinjau] = React.useState<PelangganPratinjau | null>(
    null
  )
  const [cariPending, setCariPending] = React.useState(false)
  const [cariError, setCariError] = React.useState<string | null>(null)
  const pencarianTerbaru = React.useRef(0)

  const [standInput, setStandInput] = React.useState("")
  const [fotoFile, setFotoFile] = React.useState<File | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = React.useState<string | null>(
    null
  )
  const [namaPelapor, setNamaPelapor] = React.useState("")
  const [nomorPelapor, setNomorPelapor] = React.useState("")

  const [kirimError, setKirimError] = React.useState<string | null>(null)
  const [kirimPending, setKirimPending] = React.useState(false)
  const [hasil, setHasil] = React.useState<HasilLaporanTampilan | null>(null)

  const muatJendela = React.useCallback(async () => {
    setJendelaPending(true)
    setJendelaError(null)
    try {
      setJendela(await ambilJendelaLaporMandiri())
    } catch (err) {
      setJendelaError(
        err instanceof ApiError
          ? err.message
          : "Jadwal pelaporan gagal dimuat. Coba lagi."
      )
    } finally {
      setJendelaPending(false)
    }
  }, [])

  React.useEffect(() => {
    void muatJendela()
  }, [muatJendela])

  React.useEffect(() => {
    let batal = false
    ambilPeriodeUjiLaporMandiri()
      .then((data) => {
        if (!batal) {
          setPeriodeUji(data)
          setPeriodeUjiError(null)
          if (data.aktif && data.periodes.length > 0) {
            setPilihanPeriode(String(data.periodes[0]))
          }
        }
      })
      .catch((err) => {
        if (!batal) {
          setPeriodeUjiError(
            err instanceof ApiError
              ? err.message
              : "Pilihan periode uji gagal dimuat."
          )
        }
      })
    return () => {
      batal = true
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    }
  }, [fotoPreviewUrl])

  const periodeOverride = Number(pilihanPeriode) || 202601

  const cari = React.useCallback(async (nomor: string, periode?: number) => {
    const id = ++pencarianTerbaru.current
    setCariError(null)
    setPratinjau(null)
    setCariPending(true)
    try {
      const targetPeriode = periode ?? (Number(pilihanPeriode) || 202601)
      const hasil = await cariPelanggan(nomor, targetPeriode)
      if (id === pencarianTerbaru.current) setPratinjau(hasil)
    } catch (err) {
      if (id === pencarianTerbaru.current)
        setCariError(
          err instanceof ApiError
            ? err.message
            : "Gagal mencari nomor pelanggan."
        )
    } finally {
      if (id === pencarianTerbaru.current) setCariPending(false)
    }
  }, [pilihanPeriode])

  function ubahPeriode(nilai: string) {
    setPilihanPeriode(nilai)
    if (nomorLangganan.length === 11) {
      void cari(nomorLangganan, Number(nilai) || 202601)
    }
  }

  // Auto-cari begitu nomor genap 11 digit — dipicu langsung dari event
  // handler (bukan useEffect yang memantau state): mengikuti pola yang
  // sudah dipakai cek-tagihan-form.tsx, dan menghindari setState sinkron di
  // dalam efek (react-hooks/set-state-in-effect).
  function onNomorChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    setNomorLangganan(digits)
    if (digits.length === 11) {
      cari(digits, Number(pilihanPeriode) || 202601)
    } else {
      pencarianTerbaru.current++ // batalkan pencarian yang sedang berjalan
      setPratinjau(null)
      setCariError(null)
      setCariPending(false)
    }
  }

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

  async function kirim() {
    if (!pratinjau) return
    if (!standInput || Number.isNaN(Number(standInput)))
      return setKirimError("Stand meter harus berupa angka.")
    if (!fotoFile || !fotoPreviewUrl)
      return setKirimError("Foto stand meter wajib dilampirkan sebagai bukti.")
    if (!namaPelapor.trim()) return setKirimError("Nama pelapor wajib diisi.")
    if (!nomorPelapor.trim())
      return setKirimError("Nomor HP pelapor wajib diisi.")

    setKirimError(null)
    setKirimPending(true)
    try {
      const targetPeriode = Number(pilihanPeriode) || 202601
      const form = new FormData()
      form.set("nomorLangganan", pratinjau.nomorLangganan)
      form.set("standDilaporkan", standInput)
      form.set("standMeter", standInput)
      form.set("foto", fotoFile)
      form.set("nomorPelapor", nomorPelapor.trim())
      form.set("namaPelapor", namaPelapor.trim())
      form.set("thbl", String(targetPeriode))
      form.set("periodeUji", String(targetPeriode))

      // Respons server DIPAKAI (bukan dibuang) untuk layar sukses di bawah:
      // status & createdAt di situ adalah konfirmasi SUNGGUHAN dari server,
      // bukan echo dari apa yang baru saja diketik warga sendiri — itulah
      // yang membuat layar sukses terasa seperti tanda terima asli.
      const respons = await laporMeter(form)
      setHasil({
        nomorLangganan: pratinjau.nomorLangganan,
        nama: pratinjau.nama,
        periodeLabel: formatPeriode(respons.periode),
        stand: Number(standInput),
        fotoPreviewUrl,
        status: respons.status,
        createdAt: respons.createdAt,
        pesan: respons.pesan,
      })
    } catch (err) {
      setKirimError(
        err instanceof ApiError ? err.message : "Terjadi kesalahan. Coba lagi."
      )
    } finally {
      setKirimPending(false)
    }
  }

  function reset() {
    setNomorLangganan("")
    setPratinjau(null)
    setStandInput("")
    hapusFoto()
    setNamaPelapor("")
    setNomorPelapor("")
    setKirimError(null)
    setHasil(null)
  }

  if (hasil) return <LaporMeterSukses hasil={hasil} onReset={reset} />

  if (jendelaPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        Memuat jadwal pelaporan…
      </div>
    )
  }

  if (!jendela) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{jendelaError ?? "Jadwal pelaporan tidak tersedia."}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={muatJendela}
          >
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  /**
   * MODUL SEMENTARA (TESTING & UAT ONLY)
   * Catatan Arsitektur: Komponen ini disiapkan sementara agar pengujian formulir lapor meter
   * dapat menyasar data seed database (202601 / Januari 2026) saat kalender berjalan di November.
   * Komponen ini dapat dihapus begitu periode database diperbarui ke periode real-time.
   */
  const pemilihPeriodeUji = periodeUji?.aktif ? (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 p-4 text-xs">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="periode-uji" className="font-semibold text-amber-900 dark:text-amber-200">
            [MODE UJI SEMENTARA] Pilih Periode Target
          </Label>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
            Testing Only
          </span>
        </div>
        <Select value={pilihanPeriode} onValueChange={ubahPeriode}>
          <SelectTrigger id="periode-uji" className="rounded-xl bg-white dark:bg-background border-amber-500/30">
            <SelectValue placeholder="Pilih periode uji..." />
          </SelectTrigger>
          <SelectContent>
            {periodeUji.periodes.map((periode) => (
              <SelectItem key={periode} value={String(periode)}>
                Periode Database: {formatPeriode(periode)} ({periode})
              </SelectItem>
            ))}
            {jendela && !periodeUji.periodes.includes(jendela.periode) && (
              <SelectItem value={String(jendela.periode)}>
                Bulan Berjalan Kalender ({formatPeriode(jendela.periode)})
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <p className="text-muted-foreground leading-relaxed">
        Fitur sementara untuk pengujian: Data seed database saat ini berada di periode <strong>Januari 2026 (202601)</strong>. Modul ini dapat dilepas begitu tahap testing selesai.
      </p>
    </div>
  ) : periodeUjiError ? (
    <Alert variant="destructive">
      <AlertDescription>{periodeUjiError}</AlertDescription>
    </Alert>
  ) : null

  // `bisaKirimUlang` dari server, BUKAN `!sudahLaporBulanIni`: laporan yang
  // DITOLAK tetap "sudah ada" tapi tidak mengunci bulan berjalan — lihat
  // GET /pelanggan/:nomorLangganan di server/modules/publik/publik.router.ts.
  const bisaLapor =
    (periodeOverride !== undefined || jendela.boleh) &&
    !!pratinjau &&
    pratinjau.bisaKirimUlang
  const perluKirimUlang =
    !!pratinjau?.sudahLaporBulanIni && pratinjau.bisaKirimUlang

  if (!jendela.boleh && periodeOverride === undefined) {
    return (
      <div className="space-y-4">
        {pemilihPeriodeUji}
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-medium text-foreground">
              Pelaporan meter mandiri sedang ditutup
            </p>
            <p>{jendela.pesan}</p>
          </AlertDescription>
        </Alert>
        <div className="rounded-xl border border-border bg-muted/50 p-4 text-copy-13 text-muted-foreground">
          <p className="font-medium text-foreground">Jadwal pelaporan</p>
          <p className="mt-1">
            Setiap bulan, tanggal{" "}
            <strong className="text-foreground">
              {jendela.tanggalBuka} sampai {jendela.tanggalTutup}
            </strong>
            . Di luar tanggal itu petugas sedang merampungkan pencatatan dan
            perhitungan rekening, sehingga laporan yang masuk tidak lagi bisa
            diperhitungkan untuk bulan berjalan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {pemilihPeriodeUji}
      {/* Pengingat saat jendela HAMPIR tutup. Sengaja hanya muncul di lima hari
          terakhir: spanduk yang selalu ada akan berhenti dibaca. */}
      {jendela.sisaHari !== null && jendela.sisaHari <= 5 && (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertDescription>{jendela.pesan}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        {/* Ketemu -> kotak nomor & tombol cari disembunyikan otomatis, sama
            seperti cek-laporan-meter-form.tsx — supaya kedua tab berperilaku
            identik begitu pelanggan ditemukan, bukan salah satu tetap
            menampilkan kotak cari dan yang lain tidak. */}
        {pratinjau ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              {pratinjau.nama} · {pratinjau.nomorLangganan}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Ganti nomor
            </Button>
          </div>
        ) : (
          <InputNomorLangganan
            id="nomorLangganan"
            nomor={nomorLangganan}
            onNomorChange={onNomorChange}
            onCari={cari}
            pending={cariPending}
          />
        )}

        {pratinjau && (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {pratinjau.nama}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {pratinjau.nomorLangganan}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                Terverifikasi
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Alamat Sambungan
                </p>
                <p className="mt-0.5 leading-snug font-medium text-foreground">
                  {pratinjau.alamat}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  Golongan Tarif
                </p>
                <p className="mt-0.5 font-mono font-medium text-foreground">
                  {pratinjau.tarifGolongan?.kategori ?? "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {cariError && (
          <div className="mt-4 space-y-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 dark:border-red-900 dark:bg-red-900/20">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <p className="text-sm font-semibold text-destructive">
                {cariError}
              </p>
            </div>
          </div>
        )}

        {/* Laporan lama yang DITOLAK: yang perlu warga lihat bukan "sudah
            lapor", melainkan APA yang salah dan bahwa mereka boleh — dan
            memang diminta — mengirim ulang. */}
        {pratinjau && perluKirimUlang && (
          <div className="mt-4 space-y-1 rounded-lg bg-amber-500/10 px-3 py-2.5">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Laporan periode {formatPeriode(pratinjau.periodeBerjalan)} ditolak
              petugas
              {pratinjau.alasanDitolak ? `: ${pratinjau.alasanDitolak}` : "."}
            </p>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
              Silakan perbaiki dan kirim ulang di bawah — foto lama tetap
              menjadi arsip verifikasi.
            </p>
          </div>
        )}

        {pratinjau?.sudahLaporBulanIni && !perluKirimUlang && (
          <div className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2.5">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Laporan periode {formatPeriode(pratinjau.periodeBerjalan)} sudah
              ada (status: {pratinjau.statusLaporanBulanIni}). Satu laporan per
              bulan.
            </p>
          </div>
        )}
      </div>

      {pratinjau && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="standDilaporkan">Angka stand meter (m³)</Label>
            <div className="relative">
              <Input
                id="standDilaporkan"
                value={standInput}
                onChange={(e) => setStandInput(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="Masukkan angka stand hitam (contoh: 3955)"
                size="lg"
                className="rounded-xl font-mono pr-12"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center font-mono text-xs font-bold text-muted-foreground">
                m³
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Isi sesuai angka hitam yang tertera di meter air, tanpa titik atau
              koma.
            </p>
          </div>

          <PemilihFoto
            previewUrl={fotoPreviewUrl}
            onPilih={pilihFoto}
            onHapus={hapusFoto}
            onError={setKirimError}
            label="Foto stand meter"
            deskripsi="Pastikan angka pada meter terlihat jelas dan tidak buram."
            disabled={kirimPending}
          />

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              Data pelapor
            </Label>
            <div className="space-y-1">
              <Input
                placeholder="Nama lengkap pelapor (sesuai KTP)"
                value={namaPelapor}
                onChange={(e) => setNamaPelapor(e.target.value)}
                size="lg"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Boleh berbeda dari nama pelanggan, mis. anggota keluarga.
              </p>
            </div>
            <div className="space-y-1">
              <Input
                placeholder="08xxxxxxxxxx (Nomor WhatsApp aktif)"
                value={nomorPelapor}
                onChange={(e) =>
                  setNomorPelapor(
                    e.target.value.replace(/\D/g, "").slice(0, 14)
                  )
                }
                inputMode="tel"
                size="lg"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Nomor HP/WhatsApp aktif untuk dihubungi petugas bila diperlukan.
              </p>
            </div>
          </div>
        </>
      )}

      {kirimError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{kirimError}</AlertDescription>
        </Alert>
      )}

      {/* `nonaktif`: status "terkunci" (sudah lapor bulan ini / jendela
          tertutup) sengaja tampil datar tanpa cincin — lihat catatan di
          TombolUtama soal kenapa kilau tidak boleh menyiratkan tombol ini
          bisa ditekan padahal terkunci untuk alasan lain, bukan sekadar
          menunggu input. `kirimPending` BUKAN alasan itu (permintaan sedang
          berjalan, tombolnya akan bisa ditekan lagi) — cincinnya tetap ada,
          cuma isinya berubah jadi spinner. */}
      {pratinjau && (
        <TombolUtama
          onClick={kirim}
          disabled={kirimPending}
          nonaktif={!bisaLapor}
          className="h-12 w-full"
        >
          {kirimPending ? <Spinner className="size-4" /> : <Upload />}
          {kirimPending
            ? "Mengirim…"
            : perluKirimUlang
              ? "Kirim ulang laporan"
              : "Kirim laporan"}
        </TombolUtama>
      )}
    </div>
  )
}
