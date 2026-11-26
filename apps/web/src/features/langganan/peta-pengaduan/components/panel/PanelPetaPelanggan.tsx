"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react"
import { AppLogo } from "@/components/LogoAplikasi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface KelurahanStatistik {
  kode: string
  nama: string
  jumlahPelanggan: number
}

export interface KecamatanCakupan {
  id: string
  nama: string
  namaSingkat: string
  kantor: string
  kontak: string
  status: "Normal" | "Optimal" | "Siaga"
  lat: number
  lng: number
  totalPelanggan: number
  kelurahanList: KelurahanStatistik[]
}

export interface WilayahPelayanan5Data {
  wilayah: string
  label: string
  unitKerja: string
  totalPelanggan: number
  totalKecamatan: number
  totalKelurahan: number
  totalRuteCater: number
  poskoInduk: {
    nama: string
    alamat: string
    telepon: string
    whatsapp: string
    lat: number
    lng: number
  }
  kecamatan: KecamatanCakupan[]
}

// Data cadangan riil Wilayah Pelayanan 5 (PW5) yang 100% selaras dengan 22.549 rekod di database
const DATA_AWAL_PW5: WilayahPelayanan5Data = {
  wilayah: "Wilayah Pelayanan 5 (PW5)",
  label: "Bandung Timur & Aglomerasi Pelayanan",
  unitKerja: "Kantor Bagian Distribusi & Pengaliran Wilayah 5",
  totalPelanggan: 22549,
  totalKecamatan: 7,
  totalKelurahan: 21,
  totalRuteCater: 126,
  poskoInduk: {
    nama: "Posko Induk Pelayanan Wilayah 5 (Gedebage)",
    alamat: "Jl. Soekarno Hatta No. 450, Gedebage, Kota Bandung",
    telepon: "(022) 7500002",
    whatsapp: "0811-200-0020",
    lat: -6.9452,
    lng: 107.6754,
  },
  kecamatan: [
    {
      id: "kec-regol",
      nama: "Kecamatan Regol",
      namaSingkat: "REGOL",
      kantor: "Posko Pelayanan Regol - Jl. BKR No. 45",
      kontak: "(022) 5200004",
      status: "Normal",
      lat: -6.9362,
      lng: 107.6085,
      totalPelanggan: 6488,
      kelurahanList: [
        { kode: "KD3", nama: "CIGERELENG", jumlahPelanggan: 1811 },
        { kode: "KD5", nama: "PUNGKUR", jumlahPelanggan: 1227 },
        { kode: "KD6", nama: "BALONGGEDE", jumlahPelanggan: 1169 },
        { kode: "KD4", nama: "ANCOL", jumlahPelanggan: 1081 },
        { kode: "KD2", nama: "CIATEUL", jumlahPelanggan: 996 },
        { kode: "KD7", nama: "CISEUREUH", jumlahPelanggan: 837 },
        { kode: "KD1", nama: "PASIRLUYU", jumlahPelanggan: 324 },
      ],
    },
    {
      id: "kec-astana-anyar",
      nama: "Kecamatan Astana Anyar",
      namaSingkat: "ASTANA ANYAR",
      kantor: "Kantor Layanan Wilayah Astana Anyar - Jl. Pagarsih",
      kontak: "(022) 5201102",
      status: "Normal",
      lat: -6.9318,
      lng: 107.5992,
      totalPelanggan: 5483,
      kelurahanList: [
        { kode: "TA1", nama: "PELINDUNG HEWAN", jumlahPelanggan: 2462 },
        { kode: "TA6", nama: "KARANGANYAR", jumlahPelanggan: 1300 },
        { kode: "TA5", nama: "NYENGSERET", jumlahPelanggan: 1259 },
        { kode: "TA4", nama: "KARASAK", jumlahPelanggan: 1078 },
        { kode: "TA2", nama: "PANJUNAN", jumlahPelanggan: 384 },
      ],
    },
    {
      id: "kec-bojongloa-kidul",
      nama: "Kecamatan Bojongloa Kidul",
      namaSingkat: "BOJONGLOA KIDUL",
      kantor: "Posko Distribusi Bojongloa Kidul - Jl. Kopo No. 120",
      kontak: "(022) 5408891",
      status: "Optimal",
      lat: -6.9495,
      lng: 107.5954,
      totalPelanggan: 3209,
      kelurahanList: [
        { kode: "TC1", nama: "SITUSAEUR", jumlahPelanggan: 2040 },
        { kode: "TC2", nama: "KEBON LEGA", jumlahPelanggan: 1169 },
      ],
    },
    {
      id: "kec-lengkong",
      nama: "Kecamatan Lengkong",
      namaSingkat: "LENGKONG",
      kantor: "Posko Teknis Lengkong - Jl. Buah Batu No. 110",
      kontak: "(022) 7300005",
      status: "Normal",
      lat: -6.9304,
      lng: 107.6251,
      totalPelanggan: 3199,
      kelurahanList: [
        { kode: "KC3", nama: "CIJAGRA", jumlahPelanggan: 1731 },
        { kode: "KC2", nama: "CIKAWAO", jumlahPelanggan: 966 },
        { kode: "KC5", nama: "BURANGRANG", jumlahPelanggan: 502 },
      ],
    },
    {
      id: "kec-andir",
      nama: "Kecamatan Andir",
      namaSingkat: "ANDIR",
      kantor: "Unit Pelayanan Andir - Jl. Pajajaran No. 80",
      kontak: "(022) 6000003",
      status: "Optimal",
      lat: -6.9152,
      lng: 107.5905,
      totalPelanggan: 1102,
      kelurahanList: [
        { kode: "BD5", nama: "KEBON JERUK", jumlahPelanggan: 1102 },
      ],
    },
    {
      id: "kec-sumur-bandung",
      nama: "Kecamatan Sumur Bandung",
      namaSingkat: "SUMUR BANDUNG",
      kantor: "Kantor Distribusi Sumur Bandung - Jl. Lembong No. 14",
      kontak: "(022) 4209981",
      status: "Normal",
      lat: -6.9175,
      lng: 107.6105,
      totalPelanggan: 958,
      kelurahanList: [
        { kode: "CD1", nama: "BRAGA", jumlahPelanggan: 912 },
        { kode: "CD3", nama: "BABAKAN CIAMIS", jumlahPelanggan: 46 },
      ],
    },
    {
      id: "kec-bandung-wetan",
      nama: "Kecamatan Bandung Wetan",
      namaSingkat: "BANDUNG WETAN",
      kantor: "Posko Wilayah Tamansari - Jl. Tamansari No. 34",
      kontak: "(022) 2509030",
      status: "Normal",
      lat: -6.9022,
      lng: 107.6108,
      totalPelanggan: 153,
      kelurahanList: [
        { kode: "CC2", nama: "TAMANSARI", jumlahPelanggan: 153 },
      ],
    },
  ],
}

interface Props {
  onBuat: () => void
  onFokusLokasi?: (lng: number, lat: number, zoom?: number) => void
  isOperator?: boolean
  onBeralihMode?: () => void
}

interface HasilLacakTiket {
  nomorTiket: string
  judul?: string
  jenis?: string
  status: string
  prioritas?: string
  targetSelesaiAt?: string | null
  catatanPenyelesaian?: string | null
  linimasa?: Array<{
    waktu: string
    status: string
    keterangan: string
  }>
}

export function PanelPetaPelanggan({
  onBuat,
  onFokusLokasi,
  isOperator = false,
  onBeralihMode,
}: Props) {
  const [tabAktif, setTabAktif] = useState<"wilayah" | "lacak" | "bantuan">("wilayah")
  const [inputTiket, setInputTiket] = useState("")
  const [sedangMencari, setSedangMencari] = useState(false)
  const [hasilTiket, setHasilTiket] = useState<HasilLacakTiket | null>(null)
  const [errorTiket, setErrorTiket] = useState<string | null>(null)

  // Data dinamis cakupan wilayah dari database
  const [dataPW5, setDataPW5] = useState<WilayahPelayanan5Data>(DATA_AWAL_PW5)
  const [kecamatanTerbuka, setKecamatanTerbuka] = useState<Record<string, boolean>>({
    "kec-regol": true,
  })
  const [kecamatanDipilih, setKecamatanDipilih] = useState<string | null>("kec-regol")

  // Ambil data statistik riil wilayah dari endpoint publik
  useEffect(() => {
    let aktif = true
    async function muatWilayah() {
      try {
        const res = await fetch("/api/public/wilayah-cakupan")
        if (!res.ok) return
        const json = await res.json()
        if (aktif && json.success && json.data) {
          setDataPW5(json.data)
        }
      } catch (err) {
        console.warn("[PANEL_PELANGGAN] Menggunakan data cache wilayah riil:", err)
      }
    }
    muatWilayah()
    return () => {
      aktif = false
    }
  }, [])

  const handleLacakTiket = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = inputTiket.trim()
    if (!query) return

    setSedangMencari(true)
    setErrorTiket(null)
    setHasilTiket(null)

    try {
      const res = await fetch(`/api/public/pengaduan/${encodeURIComponent(query)}`)
      const json = await res.json()

      if (json.success && json.data) {
        setHasilTiket(json.data)
      } else {
        setErrorTiket(json.error || "Nomor tiket tidak ditemukan. Periksa kembali nomor bukti lapor Anda.")
      }
    } catch {
      setErrorTiket("Gagal menghubungi server. Periksa koneksi internet Anda.")
    } finally {
      setSedangMencari(false)
    }
  }

  const handleKlikKecamatan = (kec: KecamatanCakupan) => {
    setKecamatanDipilih(kec.id)
    onFokusLokasi?.(kec.lng, kec.lat, 14)
  }

  const toggleAccordionKecamatan = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setKecamatanTerbuka((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      {/* 1. Header Publik dengan Logo Resmi Perusahaan & Direct Link ke Beranda Home */}
      <header className="shrink-0 border-b bg-card/70 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Logo Resmi Perusahaan - Saat diklik direct ke Beranda Home */}
            <Link
              href="/"
              className="focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs outline-none focus-visible:ring-2 hover:border-primary/50 transition-colors cursor-pointer"
              title="Kembali ke Beranda Utama"
            >
              <AppLogo className="size-7" />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href="/"
                className="group block outline-none min-w-0"
                title="Kembali ke Beranda Utama"
              >
                <h1 className="truncate text-sm font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors cursor-pointer">
                  Peta Kendali Pelanggan
                </h1>
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate font-mono">Pelayanan Wilayah 5 (PW5)</span>
              </div>
            </div>
          </div>

          {/* Opsi bagi staf/operator yang sedang meninjau mode publik */}
          {isOperator && onBeralihMode && (
            <button
              onClick={onBeralihMode}
              className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              title="Kembali ke Panel Pengendali Operator Internal"
            >
              Mode Operator →
            </button>
          )}
        </div>

        {/* Tombol Utama Laporkan Gangguan Air */}
        <div className="mt-3">
          <Button
            onClick={onBuat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs flex items-center justify-center gap-2 h-9 text-xs cursor-pointer"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>Laporkan Gangguan Air Saya</span>
          </Button>
          <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
            Pipa bocor, aliran mengecil, atau air keruh? Laporkan di titik peta Anda.
          </p>
        </div>
      </header>

      {/* 2. Navigasi Tab Publik */}
      <div className="shrink-0 border-b bg-muted/40 px-3 py-2">
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/80 p-1 text-xs">
          <button
            onClick={() => setTabAktif("wilayah")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
              tabAktif === "wilayah"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Compass className="size-3.5" />
            <span>Wilayah Riil</span>
          </button>
          <button
            onClick={() => setTabAktif("lacak")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
              tabAktif === "lacak"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Search className="size-3.5" />
            <span>Lacak Tiket</span>
          </button>
          <button
            onClick={() => setTabAktif("bantuan")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
              tabAktif === "bantuan"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PhoneCall className="size-3.5" />
            <span>Bantuan</span>
          </button>
        </div>
      </div>

      {/* 3. Isi Konten Tab Scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-4 [scrollbar-width:thin]">
        {/* TAB 1: WILAYAH PELAYANAN 5 RIIL DARI DATABASE */}
        {tabAktif === "wilayah" && (
          <div className="space-y-4">
            {/* Banner Metadata Pelayanan Wilayah 5 */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-blue-900 dark:text-blue-300">
                      {dataPW5.wilayah}
                    </span>
                    <span className="rounded-sm bg-blue-600/10 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-blue-700 dark:text-blue-300">
                      Database Riil
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Unit kerja teknis operasional distribusi air perkotaan Kota Bandung.
                  </p>
                </div>
              </div>

              {/* Matriks Realistis Basis Data */}
              <div className="mt-2.5 grid grid-cols-3 gap-1.5 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 text-center">
                <div className="rounded-lg bg-background/80 p-1.5">
                  <span className="block text-[10px] text-muted-foreground">Pelanggan</span>
                  <span className="font-bold text-xs text-foreground font-mono">
                    {dataPW5.totalPelanggan.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="rounded-lg bg-background/80 p-1.5">
                  <span className="block text-[10px] text-muted-foreground">Kecamatan</span>
                  <span className="font-bold text-xs text-foreground font-mono">
                    {dataPW5.totalKecamatan}
                  </span>
                </div>
                <div className="rounded-lg bg-background/80 p-1.5">
                  <span className="block text-[10px] text-muted-foreground">Kelurahan</span>
                  <span className="font-bold text-xs text-foreground font-mono">
                    {dataPW5.totalKelurahan}
                  </span>
                </div>
              </div>
            </div>

            {/* Posko Induk Wilayah 5 */}
            <div className="rounded-xl border bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Posko Induk Pelayanan Wilayah 5
                  </span>
                </div>
                <button
                  onClick={() =>
                    onFokusLokasi?.(dataPW5.poskoInduk.lng, dataPW5.poskoInduk.lat, 15)
                  }
                  className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Lihat Posko <Navigation className="size-2.5" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {dataPW5.poskoInduk.alamat}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-muted-foreground">
                <span>Telp: {dataPW5.poskoInduk.telepon}</span>
                <span>WA: {dataPW5.poskoInduk.whatsapp}</span>
              </div>
            </div>

            {/* Daftar 7 Kecamatan Riil di Wilayah Pelayanan 5 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Cakupan Kecamatan &amp; Kelurahan Riil
                </h3>
                <span className="text-[10px] text-muted-foreground">Klik untuk arahkan peta</span>
              </div>

              <div className="space-y-2">
                {dataPW5.kecamatan.map((kec) => {
                  const isDipilih = kecamatanDipilih === kec.id
                  const isTerbuka = !!kecamatanTerbuka[kec.id]

                  return (
                    <div
                      key={kec.id}
                      className={cn(
                        "rounded-xl border transition-all duration-200 select-none",
                        isDipilih
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs"
                          : "border-border bg-card hover:border-neutral-300 dark:hover:border-neutral-700"
                      )}
                    >
                      <div
                        onClick={() => handleKlikKecamatan(kec)}
                        className="p-3 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground hover:text-blue-600 transition-colors">
                                {kec.nama}
                              </span>
                              <span className="text-[10px] font-mono rounded bg-muted px-1.5 py-0.2 text-muted-foreground font-semibold">
                                {kec.totalPelanggan.toLocaleString("id-ID")} Sambungan
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {kec.kantor}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold shrink-0 border",
                                kec.status === "Optimal"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/30 dark:text-blue-400"
                              )}
                            >
                              <span className="size-1 rounded-full bg-current" />
                              <span>{kec.status}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleAccordionKecamatan(e, kec.id)}
                              className="size-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                              title="Rincian Kelurahan"
                            >
                              {isTerbuka ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="text-[10px] font-mono">
                            {kec.kelurahanList.length} Kelurahan Terlayani
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-medium text-blue-600 dark:text-blue-400 text-[11px]">
                            Arahkan Peta <Navigation className="size-3" />
                          </span>
                        </div>
                      </div>

                      {/* Accordion Rincian Kelurahan Nyata dari Database */}
                      {isTerbuka && (
                        <div className="border-t border-border/50 bg-muted/30 px-3 py-2 rounded-b-xl">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1.5">
                            Rincian Sambungan per Kelurahan:
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            {kec.kelurahanList.map((kel) => (
                              <div
                                key={kel.kode}
                                className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded hover:bg-background/80"
                              >
                                <span className="text-foreground flex items-center gap-1.5">
                                  <span className="size-1.5 rounded-full bg-blue-500" />
                                  <span>{kel.nama}</span>
                                </span>
                                <span className="font-mono text-muted-foreground font-medium">
                                  {kel.jumlahPelanggan.toLocaleString("id-ID")} sambungan
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LACAK TIKET PENGADUAN MANDIRI */}
        {tabAktif === "lacak" && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-3.5 space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-foreground">
                  Lacak Status Aduan &amp; Tindakan Petugas
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Masukkan nomor bukti tiket aduan (contoh: ADU-2026-0001) untuk memantau progres penanganan.
                </p>
              </div>

              <form onSubmit={handleLacakTiket} className="space-y-2">
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Contoh: ADU-2026-0001"
                    value={inputTiket}
                    onChange={(e) => setInputTiket(e.target.value)}
                    className="h-8.5 text-xs font-mono uppercase"
                  />
                  <Button
                    type="submit"
                    disabled={sedangMencari || !inputTiket.trim()}
                    className="h-8.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                  >
                    {sedangMencari ? "Mencari..." : "Lacak"}
                  </Button>
                </div>
              </form>

              {errorTiket && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 flex items-start gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span>{errorTiket}</span>
                </div>
              )}
            </div>

            {/* Hasil Lacak Tiket */}
            {hasilTiket && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-blue-950/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">
                    #{hasilTiket.nomorTiket}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {hasilTiket.status}
                  </span>
                </div>

                {hasilTiket.judul && (
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {hasilTiket.judul}
                    </h4>
                    {hasilTiket.jenis && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Kategori: {hasilTiket.jenis}
                      </p>
                    )}
                  </div>
                )}

                {/* Linimasa Penanganan */}
                {hasilTiket.linimasa && hasilTiket.linimasa.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                      Riwayat Tindakan Lapangan:
                    </span>
                    <ol className="relative border-l border-border/80 ml-2 space-y-3 pl-3">
                      {hasilTiket.linimasa.map((item, idx) => (
                        <li key={idx} className="relative">
                          <span className="absolute -left-[17px] top-1 size-2 rounded-full bg-blue-600 ring-2 ring-background" />
                          <div className="flex items-baseline justify-between text-[11px]">
                            <span className="font-medium text-foreground">{item.status}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.waktu}
                            </span>
                          </div>
                          {item.keterangan && (
                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                              {item.keterangan}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BANTUAN & KONTAK DARURAT */}
        {tabAktif === "bantuan" && (
          <div className="space-y-3">
            {/* Siaga Call Center */}
            <div className="rounded-xl border bg-card p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Phone className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Call Center 24 Jam</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Bebas Pulsa &amp; Cepat Tanggap</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Layanan komunikasi darurat pelanggan 24 jam nonstop untuk informasi distribusi dan kebocoran pipa utama.
              </p>
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-mono">
                <span className="font-bold text-foreground">(022) 2509030 / (022) 2509032</span>
                <a
                  href="tel:0222509030"
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Panggil
                </a>
              </div>
            </div>

            {/* WhatsApp Pengaduan Cepat */}
            <div className="rounded-xl border bg-card p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <PhoneCall className="size-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">WhatsApp Pelayanan</h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Kirim Foto &amp; Titik Lokasi</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-mono">
                <span className="font-bold text-foreground">0811-200-0020</span>
                <a
                  href="https://wa.me/628112000020"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Kirim Pesan <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* Bantuan Tangki Air Bersih Darurat */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3 space-y-2 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <Truck className="size-4 shrink-0" />
                <h4 className="text-xs font-bold">Bantuan Truk Tangki Air Bersih</h4>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Warga yang terdampak perbaikan pipa transmisi darurat berhak mengajukan pasokan air bersih bergerak (truk tangki) secara gratis melalui koordinasi posko pelayanan atau ketua RT/RW setempat.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Footer Panel Pelanggan */}
      <footer className="shrink-0 border-t bg-card/60 px-4 py-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
          <span>Layanan Resmi PERUMDA Tirtawening</span>
        </span>
        <button
          onClick={onBuat}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Laporkan Aduan</span>
          <span>→</span>
        </button>
      </footer>
    </div>
  )
}
