"use client"

// features/public/components/CekLaporanMeterFormulir.tsx — pantau status
// laporan meter mandiri PERIODE BERJALAN lewat nomor langganan.
//
// Sengaja lewat GET /api/public/pelanggan/:nomorLangganan — endpoint yang
// SAMA PERSIS dengan yang menggerbangi tab "Lapor meter" (cariPelanggan di
// lapor-meter-form.tsx) — bukan endpoint kedua. Itu jugalah kenapa kotak
// nomor langganannya memakai <InputNomorLangganan> yang sama: satu sumber
// kebenaran untuk "cari pelanggan lewat nomor langganan", dipakai kedua tab.
//
// Begitu pelanggan ketemu, kotak cari otomatis disembunyikan dan HANYA
// laporan periode berjalan yang tampil (bukan daftar riwayat) — permintaan
// produk, lihat riwayat percakapan.
import * as React from "react"
import { AlertCircle } from "@/components/ui/hugeicons-compat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  cariPelanggan,
  ambilPeriodeUjiLaporMandiri,
  type PeriodeUjiLaporMeter,
  ApiError,
  type PelangganPratinjau,
} from "../lib/api"
import { formatPeriode } from "../lib/format"
import { InputNomorLangganan } from "./MasukanNomorLangganan"
import { KartuLaporanMeter } from "./KartuLaporanMeter"

export function CekLaporanMeterForm({
  nomorAwal,
}: { nomorAwal?: string } = {}) {
  const [nomor, setNomor] = React.useState(nomorAwal ?? "")
  const [pratinjau, setPratinjau] = React.useState<PelangganPratinjau | null>(
    null
  )
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [periodeUji, setPeriodeUji] =
    React.useState<PeriodeUjiLaporMeter | null>(null)
  const [pilihanPeriode, setPilihanPeriode] = React.useState("202601")
  const pencarianTerbaru = React.useRef(0)

  React.useEffect(() => {
    let batal = false
    ambilPeriodeUjiLaporMandiri()
      .then((data) => {
        if (!batal) {
          setPeriodeUji(data)
          if (data.aktif && data.periodes.length > 0) {
            setPilihanPeriode(String(data.periodes[0]))
          }
        }
      })
      .catch(() => {})
    return () => {
      batal = true
    }
  }, [])

  async function cari(nomorLangganan: string, periode?: number) {
    const id = ++pencarianTerbaru.current
    setError(null)
    setPratinjau(null)
    setPending(true)
    try {
      const targetPeriode = periode ?? (Number(pilihanPeriode) || 202601)
      const hasil = await cariPelanggan(nomorLangganan, targetPeriode)
      if (id === pencarianTerbaru.current) setPratinjau(hasil)
    } catch (err) {
      if (id === pencarianTerbaru.current)
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal mencari nomor pelanggan."
        )
    } finally {
      if (id === pencarianTerbaru.current) setPending(false)
    }
  }

  function ubahPeriode(nilai: string) {
    setPilihanPeriode(nilai)
    if (nomor.length === 11) {
      void cari(nomor, Number(nilai) || 202601)
    }
  }

  // Taut-langsung dari layar sukses lapor-meter (?tab=cek&nomor=...): isi
  // otomatis lalu langsung cari — pola sama dengan onNomorChange di bawah.
  // Sengaja hanya sekali (dependency kosong).
  React.useEffect(() => {
    // Sengaja: mengisi HASIL pencarian dari ?nomor= URL SEKALI saat
    // taut-langsung dibuka, pola sama dengan lacak-tiket-form.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (nomorAwal?.trim()) void cari(nomorAwal.trim(), Number(pilihanPeriode) || 202601)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sama seperti lapor-meter-form.tsx: auto-cari begitu nomor genap 11
  // digit, dipicu dari event handler (bukan efek yang memantau state).
  function onNomorChange(digitBaru: string) {
    setNomor(digitBaru)
    if (digitBaru.length === 11) {
      cari(digitBaru, Number(pilihanPeriode) || 202601)
    } else {
      pencarianTerbaru.current++ // batalkan pencarian yang sedang berjalan
      setPratinjau(null)
      setError(null)
      setPending(false)
    }
  }

  function cekNomorLain() {
    setNomor("")
    setPratinjau(null)
    setError(null)
  }

  /**
   * MODUL SEMENTARA (TESTING & UAT ONLY)
   */
  const pemilihPeriodeUji = periodeUji?.aktif ? (
    <div className="space-y-2 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 p-4 text-xs">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="periode-uji-cek" className="font-semibold text-amber-900 dark:text-amber-200">
            [MODE UJI SEMENTARA] Periode Status Laporan
          </Label>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
            Testing Only
          </span>
        </div>
        <Select value={pilihanPeriode} onValueChange={ubahPeriode}>
          <SelectTrigger id="periode-uji-cek" className="rounded-xl bg-white dark:bg-background border-amber-500/30">
            <SelectValue placeholder="Pilih periode..." />
          </SelectTrigger>
          <SelectContent>
            {periodeUji.periodes.map((periode) => (
              <SelectItem key={periode} value={String(periode)}>
                Periode Database: {formatPeriode(periode)} ({periode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ) : null

  // Ketemu -> kotak nomor & tombol cari disembunyikan otomatis, HANYA foto +
  // detail periode berjalan yang tampil (permintaan produk: riwayat
  // periode-periode lampau tidak perlu ditunjukkan).
  if (pratinjau) {
    return (
      <div className="flex flex-col gap-4">
        {pemilihPeriodeUji}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            {pratinjau.nama} · {pratinjau.nomorLangganan}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cekNomorLain}
          >
            Cek nomor lain
          </Button>
        </div>

        {pratinjau.laporanBulanIni ? (
          <KartuLaporanMeter laporan={pratinjau.laporanBulanIni} />
        ) : (
          <div className="rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
            Belum ada laporan periode {formatPeriode(pratinjau.periodeBerjalan)}{" "}
            atas nama {pratinjau.nama}. Kirim lewat tab{" "}
            <strong>Lapor meter</strong> di sebelah.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {pemilihPeriodeUji}
      <InputNomorLangganan
        id="nomorLanggananCek"
        nomor={nomor}
        onNomorChange={onNomorChange}
        onCari={cari}
        pending={pending}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
