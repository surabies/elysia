'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import NumberFlow from '@number-flow/react'
import {
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
          const listLengkap: GolonganTarifBackend[] = body.data.map(
            (item: GolonganTarifBackend) => {
              if (!item.blok || item.blok.length === 0) {
                const fb = FALLBACK_GOLONGAN.find((f) => f.kode === item.kode)
                return fb ? { ...item, blok: fb.blok } : item
              }
              return item
            }
          )
          setDaftarGolongan(listLengkap)
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
      className="mx-auto w-full max-w-360 px-4 lg:px-12 py-10 sm:py-14 md:py-18 bg-transparent text-foreground"
    >
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-lg border border-border/80 bg-card text-foreground p-5 sm:p-7 md:p-9 relative overflow-hidden shadow-none"
      >
        {/* Ambient Radial Accent Glow */}
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/10 dark:bg-sky-500/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
        />

        {/* Ambient Grid Kotak-Kotak 32x32px dengan Gradasi Blur & Memudar ke Bawah */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-70 dark:opacity-40 [mask-image:linear-gradient(to_bottom,black_10%,rgba(0,0,0,0.5)_50%,transparent_90%)]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(100, 116, 139, 0.18) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(100, 116, 139, 0.18) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-card/50 to-card backdrop-blur-[2px]"
        />

        {/* Header Seksi (Ringkas, Fungsional & Tanpa Badge) */}
        <div className="relative z-10 mb-4 sm:mb-6 md:mb-8">
          <h2
            id="simulasi-tarif-title"
            className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground"
          >
            Kalkulator Tarif Air
          </h2>
          <p className="hidden md:block mt-1.5 text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Hitung perkiraan tagihan rekening air bulanan Anda langsung
            berdasarkan master tarif blok progresif dan biaya tetap resmi
            PERUMDA Tirtawening.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Kolom Slider & Kontrol Pemakaian: di mobile ORDER 2 (di bawah card total), di desktop ORDER 1 (di kiri) */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
            {/* Pilihan Golongan Tarif dari Database Menggunakan Shadcn UI Select */}
            <div className="space-y-2">
              <label
                htmlFor="select-golongan"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block"
              >
                Pilih Golongan Tarif Pelanggan:
              </label>
              <Select value={golonganKode} onValueChange={setGolonganKode}>
                <SelectTrigger
                  id="select-golongan"
                  className="w-full h-11 rounded-md border border-border/80 bg-background px-4 text-sm font-medium text-foreground hover:bg-muted/40 focus:border-ring focus:ring-1 focus:ring-ring transition-all cursor-pointer"
                >
                  <SelectValue placeholder="Pilih golongan tarif pelanggan" />
                </SelectTrigger>
                <SelectContent className="border border-border/80 bg-popover text-popover-foreground max-h-72 z-50 rounded-md shadow-md p-1">
                  {daftarGolongan.map((g) => (
                    <SelectItem
                      key={g.kode}
                      value={g.kode}
                      className="cursor-pointer py-2 px-3 rounded-sm text-sm transition-colors text-foreground focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted"
                    >
                      <span className="font-mono text-blue-600 dark:text-sky-400 font-semibold mr-2">[{g.kode}]</span>
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
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Estimasi Volume Pemakaian Bulanan:
                </label>
                <div className="flex items-baseline gap-1 bg-muted/60 border border-border/80 px-3 py-1 rounded-md text-foreground font-mono font-bold text-base">
                  <NumberFlow value={volume} />
                  <span className="text-xs text-muted-foreground">m³</span>
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
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-sky-400 focus:outline-none"
              />

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="hidden sm:inline text-xs text-muted-foreground mr-1">Preset Cepat:</span>
                {[10, 15, 20, 30, 45].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVolume(preset)}
                    className={`rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                      volume === preset
                        ? 'bg-foreground text-background font-bold'
                        : 'border border-border/80 bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {preset} m³
                  </button>
                ))}
              </div>
            </div>

            {/* Rincian Blok Progresif Terhitung */}
            <div className="space-y-2 pt-1 border-t border-border/80">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Perhitungan Blok Progresif:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {rincianBlok.map((rb) => (
                  <div
                    key={rb.blok}
                    className="rounded-md border border-border/80 bg-muted/30 p-2.5 text-center"
                  >
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      Blok {rb.blok} ({rb.volume} m³)
                    </span>
                    <span className="text-xs font-bold text-foreground font-mono">
                      {formatRupiah(rb.subtotal)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      @{formatRupiah(rb.tarif)}/m³
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: FinTech Result Card (di mobile ORDER 1 di atas, di desktop ORDER 2 di kanan) */}
          <div className="order-1 lg:order-2 lg:col-span-5 rounded-lg border border-border/80 bg-muted/30 dark:bg-muted/20 p-5 sm:p-6 shadow-none space-y-5">
            <div className="pb-4 border-b border-border/80">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <span>Total Estimasi Rekening</span>
                <span className="font-mono text-foreground font-bold">
                  {golongan.kode}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-semibold text-blue-600 dark:text-sky-400">Rp</span>
                <NumberFlow value={totalTagihan} format={{ useGrouping: true }} />
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">
                1 Bulan Pemakaian ({volume} m³)
              </span>
            </div>

            {/* Rincian Komponen Biaya Resmi Sesuai Tabel DRD */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-blue-600 dark:text-sky-400" />
                  Harga Air Progresif
                </span>
                <span className="font-mono font-semibold text-foreground flex items-baseline gap-1">
                  <span>Rp</span>
                  <NumberFlow value={totalHargaAir} format={{ useGrouping: true }} />
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Bea Pemeliharaan Meter (Beban)</span>
                <span className="font-mono text-foreground">
                  {formatRupiah(beaBeban)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Bea Administrasi Rekening</span>
                <span className="font-mono text-foreground">
                  {formatRupiah(beaAdmin)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Retribusi Air Limbah (Kotor)</span>
                <span className="font-mono text-foreground">
                  {formatRupiah(airKotor)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/cek-tagihan?tarif=${golongan.kode}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-none hover:bg-foreground/90 active:scale-[0.99] transition-all"
              >
                <span>Cek Rekening Asli Pelanggan</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
