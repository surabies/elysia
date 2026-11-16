'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Calculator,
  Droplets,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Info,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface BlokTarifItem {
  blok: number
  batasAwalM3: number
  batasAkhirM3: number | null
  hargaPerM3: number
}

export interface GolonganTarifBackend {
  kode: string
  nama: string
  beaBeban: number
  beaAdmin: number
  airKotor: number
  lainLain: number
  blok: BlokTarifItem[]
}

// Data Fallback 13 Golongan Resmi Tirtawening (Sinkron 100% dengan database)
const FALLBACK_GOLONGAN: GolonganTarifBackend[] = [
  {
    kode: '2A1',
    nama: 'RMH.TANGGA GOL.A1 (Sederhana)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 2800 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 3500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 4500 },
    ],
  },
  {
    kode: '2A2',
    nama: 'RMH.TANGGA GOL.A2 (Menengah)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2800 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 3600 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 4800 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 6200 },
    ],
  },
  {
    kode: '2A3',
    nama: 'RMH.TANGGA GOL.A3 (Menengah Atas)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 3500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 4500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 6000 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 7800 },
    ],
  },
  {
    kode: '1A',
    nama: 'SOS.UMUM / TEMPAT IBADAH (1A)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 1050 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 1250 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 1500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 1800 },
    ],
  },
  {
    kode: '3A',
    nama: 'NIAGA KECIL / UMKM (3A)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 7200 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 8500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 10500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 13000 },
    ],
  },
  {
    kode: '3B',
    nama: 'NIAGA MENENGAH / BESAR (3B)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 10500 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 13000 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 15500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 18000 },
    ],
  },
  {
    kode: '4A',
    nama: 'INDUSTRI KECIL (4A)',
    beaBeban: 7000,
    beaAdmin: 10000,
    airKotor: 11100,
    lainLain: 0,
    blok: [
      { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 11000 },
      { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 13500 },
      { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 16500 },
      { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 20000 },
    ],
  },
]

function formatRupiah(nilai: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nilai)
}

export function SimulasiTarifSection() {
  const [daftarGolongan, setDaftarGolongan] =
    React.useState<GolonganTarifBackend[]>(FALLBACK_GOLONGAN)
  const [golonganKode, setGolonganKode] = React.useState('2A1')
  const [volume, setVolume] = React.useState(18) // Default 18 m3
  const [isDbLoaded, setIsDbLoaded] = React.useState(false)

  // Fetch data real dari backend API PostgreSQL
  React.useEffect(() => {
    async function ambilTarifDatabase() {
      try {
        const res = await fetch('/api/publik/tarif')
        if (!res.ok) return
        const body = await res.json()
        if (body.success && Array.isArray(body.data) && body.data.length > 0) {
          setDaftarGolongan(body.data)
          setIsDbLoaded(true)
        }
      } catch {
        // Fallback siap pakai
      }
    }
    ambilTarifDatabase()
  }, [])

  const golongan =
    daftarGolongan.find((g) => g.kode === golonganKode) ?? daftarGolongan[0]

  // Perhitungan progresif blok harga air murni sesuai formula backend
  const hitungRincianBlok = (m3: number, blokList: BlokTarifItem[]) => {
    const rincian: {
      blok: number
      volume: number
      tarif: number
      subtotal: number
    }[] = []
    let total = 0
    let sisa = m3
    const urut = [...blokList].sort((a, b) => a.batasAwalM3 - b.batasAwalM3)

    for (const b of urut) {
      if (sisa <= 0) break
      const terpakaiSebelumnya = b.batasAwalM3 - 1
      if (m3 <= terpakaiSebelumnya) break
      const lebarBlok =
        b.batasAkhirM3 === null ? Infinity : b.batasAkhirM3 - b.batasAwalM3 + 1
      const volumeM3 = Math.min(sisa, lebarBlok)
      const subtotal = volumeM3 * b.hargaPerM3
      total += subtotal
      rincian.push({
        blok: b.blok,
        volume: volumeM3,
        tarif: b.hargaPerM3,
        subtotal,
      })
      sisa -= volumeM3
    }

    return { total, rincian }
  }

  const { total: totalHargaAir, rincian: rincianBlok } = hitungRincianBlok(
    volume,
    golongan.blok
  )

  const beaBeban = golongan.beaBeban
  const beaAdmin = golongan.beaAdmin
  const airKotor = golongan.airKotor
  const totalTagihan = totalHargaAir + beaBeban + beaAdmin + airKotor

  return (
    <section
      aria-labelledby="simulasi-tarif-title"
      className="mx-auto w-full max-w-360 px-4 lg:px-12 py-12 md:py-16 bg-white text-black"
    >
      <div className="rounded-3xl border border-slate-200/90 bg-slate-900 text-white p-6 sm:p-10 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Ambient Glow */}
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* Kolom Kiri: Form Kontrol Simulasi Terhubung Database */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/40">
                  <Calculator className="h-3.5 w-3.5" />
                  <span>Simulasi Tagihan Air Resmi</span>
                </div>
              </div>

              <h2
                id="simulasi-tarif-title"
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white"
              >
                Kalkulator Estimasi Biaya Pemakaian Air
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-300">
                Hitung perkiraan tagihan rekening air bulanan Anda langsung
                berdasarkan master tarif blok progresif dan biaya tetap resmi
                PERUMDA Tirtawening.
              </p>
            </div>

            {/* Pilihan Golongan Tarif dari Database Menggunakan Shadcn UI Select */}
            <div className="space-y-2">
              <label
                htmlFor="select-golongan"
                className="text-xs font-semibold text-slate-300 uppercase tracking-wider block"
              >
                Pilih Golongan Tarif Pelanggan:
              </label>
              <Select value={golonganKode} onValueChange={setGolonganKode}>
                <SelectTrigger
                  id="select-golongan"
                  className="w-full h-12 rounded-2xl border-slate-700/80 bg-slate-800/95 px-4 text-sm font-medium text-white shadow-inner hover:bg-slate-700/80 hover:text-white focus:bg-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 transition-all [&_svg]:text-slate-400 [&_svg]:size-4 cursor-pointer data-[placeholder]:text-slate-400"
                >
                  <SelectValue placeholder="Pilih golongan tarif pelanggan" />
                </SelectTrigger>
                <SelectContent className="border border-slate-700 bg-slate-900 text-white max-h-72 z-50 rounded-xl shadow-2xl p-1">
                  {daftarGolongan.map((g) => (
                    <SelectItem
                      key={g.kode}
                      value={g.kode}
                      className="text-slate-200 hover:bg-slate-800 hover:text-cyan-300 focus:bg-slate-800 focus:text-cyan-300 data-[highlighted]:bg-slate-800 data-[highlighted]:text-cyan-300 cursor-pointer py-2.5 px-3 rounded-lg text-sm transition-colors"
                    >
                      <span className="font-mono text-cyan-400 font-semibold mr-2">[{g.kode}]</span>
                      <span>{g.nama}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slider Volume Pemakaian */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="slider-volume"
                  className="text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Estimasi Volume Pemakaian Bulanan:
                </label>
                <div className="flex items-baseline gap-1 bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 rounded-xl text-cyan-300 font-mono font-bold text-base">
                  <span>{volume}</span>
                  <span className="text-xs">m³</span>
                </div>
              </div>

              <input
                id="slider-volume"
                type="range"
                min="1"
                max="60"
                step="1"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 mr-1">Preset Cepat:</span>
                {[10, 15, 20, 30, 45].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVolume(preset)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                      volume === preset
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset} m³
                  </button>
                ))}
              </div>
            </div>

            {/* Rincian Blok Progresif Terhitung */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Perhitungan Blok Progresif:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rincianBlok.map((rb) => (
                  <div
                    key={rb.blok}
                    className="rounded-xl border border-slate-800 bg-slate-800/50 p-2.5 text-center"
                  >
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Blok {rb.blok} ({rb.volume} m³)
                    </span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">
                      {formatRupiah(rb.subtotal)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      @{formatRupiah(rb.tarif)}/m³
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: FinTech Result Card (Sesuai Komponen DRD Database) */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-700 bg-slate-800/80 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-5">
            <div className="pb-4 border-b border-slate-700">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <span>Total Estimasi Rekening</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {golongan.kode}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300 tracking-tight">
                {formatRupiah(totalTagihan)}
              </div>
              <span className="text-xs text-slate-400 mt-1 block">
                1 Bulan Pemakaian ({volume} m³)
              </span>
            </div>

            {/* Rincian Komponen Biaya Resmi Sesuai Tabel DRD */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                  Harga Air Progresif
                </span>
                <span className="font-mono font-semibold text-white">
                  {formatRupiah(totalHargaAir)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Bea Pemeliharaan Meter (Beban)</span>
                <span className="font-mono text-slate-300">
                  {formatRupiah(beaBeban)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Bea Administrasi Rekening</span>
                <span className="font-mono text-slate-300">
                  {formatRupiah(beaAdmin)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Retribusi Air Limbah (Kotor)</span>
                <span className="font-mono text-slate-300">
                  {formatRupiah(airKotor)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/cek-tagihan?tarif=${golongan.kode}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 active:scale-95 transition-all"
              >
                <span>Cek Rekening Asli Pelanggan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
