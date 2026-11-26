"use client"

import * as React from "react"
import {
  Button,
  Checkbox,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cater/ui"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"
import {
  Activity,
  Layers,
  MapPin,
  Search,
  Download,
  AlertTriangle,
  Droplets,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react"
import type {
  FC,
  RingkasanAsetPeta,
  RingkasanLaporanPeta,
  StatistikPipaJaringan,
  StatistikStatusPelanggan,
} from "../types/TipePetaWilayah"
import styles from "./peta-panel.module.css"
import type { VisibilitasLayer } from "./peta/LapisanPeta"

export interface FokusPeta {
  longitude: number
  latitude: number
  zoom?: number
}

export interface BarisKebocoran {
  id: string
  tiket: string
  judul: string
  status: string
  prioritas: string
  alamat: string | null
  kelurahan: string | null
  dibuat: Date
  longitude: number
  latitude: number
}

interface PanelPetaProps {
  visibilitas: VisibilitasLayer
  onVisibilitasChange: (layer: keyof VisibilitasLayer, visible: boolean) => void
  onFokus: (fokus: FokusPeta) => void
  kebocoranAktif: BarisKebocoran[]
  ringkasan: RingkasanLaporanPeta
  aset: RingkasanAsetPeta
  statistikPipa: StatistikPipaJaringan
  statistikStatus: StatistikStatusPelanggan
  pelangganTanpaKoordinat: number
  jumlahKelurahan: number
  jumlahKecamatan: number
  jumlahPelanggan: number
  jumlahPotensi: number
  jumlahEksPelanggan: number
  jumlahPengaduan: number
  jumlahRute: number
  sumberAirFeatures?: FC["features"]
}

const formatAngka = new Intl.NumberFormat("id-ID")

function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight">{value}</p>
      {detail && (
        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{detail}</p>
      )}
    </div>
  )
}

function labelBulan(bulan: string) {
  const [tahun, nomorBulan] = bulan.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(tahun!, nomorBulan! - 1, 1)
  )
}

async function eksporLaporan(
  ringkasan: RingkasanLaporanPeta,
  statistikPipa: StatistikPipaJaringan,
  statistikStatus: StatistikStatusPelanggan
) {
  if (typeof window === "undefined") return
  const XLSX = await import("xlsx")
  const buku = XLSX.utils.book_new()

  // Sheet 1: Status Pelanggan 3 Kategori Utama
  const ringkasStatus = [
    { Kategori: "Pelanggan Aktif", Jumlah: statistikStatus.pelangganAktif, Keterangan: "Sambungan aktif berjalan" },
    { Kategori: "Dicabut (Nonaktif)", Jumlah: statistikStatus.pelangganDicabut, Keterangan: "Total sambungan berhenti/putus" },
    { Kategori: "Potensial", Jumlah: statistikStatus.pelangganPotensial, Keterangan: "Calon sambungan baru survei lapangan" },
    { Kategori: "- Kriteria Tutup Sementara", Jumlah: statistikStatus.kriteriaDicabut.tutupSementara, Keterangan: "Permohonan pelanggan / tunggakan sementara" },
    { Kategori: "- Kriteria Tutup SPT", Jumlah: statistikStatus.kriteriaDicabut.tutupSpt, Keterangan: "Surat Perintah Tutup dinas" },
    { Kategori: "- Kriteria Disegel", Jumlah: statistikStatus.kriteriaDicabut.disegel, Keterangan: "Segel meteran air" },
    { Kategori: "- Kriteria Dicabut Dinas", Jumlah: statistikStatus.kriteriaDicabut.dicabut, Keterangan: "Pencabutan permanen instalasi" },
    { Kategori: "- Kriteria Eks Pelanggan", Jumlah: statistikStatus.kriteriaDicabut.eksPelanggan, Keterangan: "Verifikasi lapangan mWater" },
  ]
  XLSX.utils.book_append_sheet(buku, XLSX.utils.json_to_sheet(ringkasStatus), "Status Pelanggan")

  // Sheet 2: Jaringan Pipa & Aset
  const ringkasPipa = [
    { Parameter: "Total Panjang Pipa (km)", Nilai: statistikPipa.totalPanjangKm },
    { Parameter: "Total Segmen GIS", Nilai: statistikPipa.totalSegmen },
    { Parameter: "Instalasi Sumber Air & Booster", Nilai: statistikPipa.totalSumberAir },
    ...statistikPipa.panjangPerMaterial.map((m) => ({
      Parameter: `Panjang Material ${m.material} (km)`,
      Nilai: m.panjangKm,
    })),
  ]
  XLSX.utils.book_append_sheet(buku, XLSX.utils.json_to_sheet(ringkasPipa), "Jaringan Pipa")

  // Sheet 3: Aduan Kebocoran
  const ringkasAduan = [
    { Metrik: "Aduan kebocoran aktif", Nilai: ringkasan.aktif },
    { Metrik: "Aduan 30 hari terakhir", Nilai: ringkasan.laporan30Hari },
    { Metrik: "Rata-rata respons (jam)", Nilai: ringkasan.rataRataResponsJam ?? "Belum ada" },
    { Metrik: "Rata-rata penyelesaian (jam)", Nilai: ringkasan.rataRataPenyelesaianJam ?? "Belum ada" },
  ]
  XLSX.utils.book_append_sheet(buku, XLSX.utils.json_to_sheet(ringkasAduan), "Kinerja Aduan")

  XLSX.writeFile(buku, `peta-kendali-wilayah-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function PanelPeta({
  visibilitas,
  onVisibilitasChange,
  onFokus,
  kebocoranAktif,
  ringkasan,
  aset: _aset,
  statistikPipa,
  statistikStatus,
  pelangganTanpaKoordinat,
  jumlahKelurahan,
  jumlahKecamatan,
  jumlahPelanggan,
  jumlahPotensi,
  jumlahEksPelanggan,
  jumlahPengaduan,
  jumlahRute,
  sumberAirFeatures = [],
}: PanelPetaProps) {
  const [tabAktif, setTabAktif] = React.useState("layer")
  const [cariKebocoran, setCariKebocoran] = React.useState("")
  const [sedangEkspor, setSedangEkspor] = React.useState(false)

  const hasilKebocoran = React.useMemo(() => {
    const kata = cariKebocoran.trim().toLocaleLowerCase("id-ID")
    if (!kata) return kebocoranAktif
    return kebocoranAktif.filter((row) =>
      [row.tiket, row.judul, row.alamat, row.kelurahan].some((nilai) =>
        nilai?.toLocaleLowerCase("id-ID").includes(kata)
      )
    )
  }, [cariKebocoran, kebocoranAktif])

  async function unduhLaporan() {
    setSedangEkspor(true)
    try {
      await eksporLaporan(ringkasan, statistikPipa, statistikStatus)
      toast.success("Laporan berhasil diekspor ke Excel")
    } catch (error) {
      console.error("Gagal mengekspor laporan peta:", error)
      toast.error("Laporan gagal diekspor. Silakan coba lagi.")
    } finally {
      setSedangEkspor(false)
    }
  }

  return (
    <aside
      aria-label="Panel kendali peta operasional"
      className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-background border-r border-border"
    >
      {/* 1. Header Panel Peta Kendali */}
      <div className="shrink-0 border-b border-border p-3.5 bg-card/60 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none text-foreground">
                Peta Kendali Wilayah
              </h1>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Distribusi &amp; Status Sambungan
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live GIS
          </span>
        </div>

        {/* 3 Status Utama Pelanggan PDAM (Aktif, Dicabut, Potensial) */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-teal-700 dark:text-teal-300">
              <CheckCircle2 className="size-3 text-teal-600 dark:text-teal-400" />
              <span>Aktif</span>
            </div>
            <p className="mt-0.5 text-base font-bold text-teal-900 dark:text-teal-100 tabular-nums">
              {formatAngka.format(statistikStatus.pelangganAktif)}
            </p>
          </div>

          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-rose-700 dark:text-rose-300">
              <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
              <span>Dicabut</span>
            </div>
            <p className="mt-0.5 text-base font-bold text-rose-900 dark:text-rose-100 tabular-nums">
              {formatAngka.format(statistikStatus.pelangganDicabut)}
            </p>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300">
              <HelpCircle className="size-3 text-blue-600 dark:text-blue-400" />
              <span>Potensial</span>
            </div>
            <p className="mt-0.5 text-base font-bold text-blue-900 dark:text-blue-100 tabular-nums">
              {formatAngka.format(statistikStatus.pelangganPotensial)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Navigasi Tab */}
      <Tabs
        value={tabAktif}
        onValueChange={setTabAktif}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-border px-3 py-2 bg-muted/20">
          <TabsList className="grid w-full grid-cols-4 h-8 p-0.5">
            <TabsTrigger value="layer" className="text-[11px] px-1 py-1 gap-1">
              <Layers className="size-3" />
              <span>Layer</span>
            </TabsTrigger>
            <TabsTrigger value="pipa" className="text-[11px] px-1 py-1 gap-1">
              <Droplets className="size-3" />
              <span>Pipa</span>
            </TabsTrigger>
            <TabsTrigger value="kebocoran" className="text-[11px] px-1 py-1 gap-1">
              <AlertTriangle className="size-3" />
              <span>Aduan</span>
            </TabsTrigger>
            <TabsTrigger value="laporan" className="text-[11px] px-1 py-1 gap-1">
              <Filter className="size-3" />
              <span>Kinerja</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ================= TAB 1: KONTROL LAYER & LEGENDA ================= */}
        <TabsContent
          value="layer"
          className="min-h-0 flex-1 overflow-y-auto p-3 m-0 space-y-3.5"
        >
          <Accordion
            type="multiple"
            defaultValue={["status-pelanggan", "jaringan-aset", "wilayah-administrasi"]}
            className="space-y-2.5"
          >
            {/* Accordion 1: Status Pelanggan Utama (3 Kategori) */}
            <AccordionItem
              value="status-pelanggan"
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  Status Pelanggan PDAM
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-1 space-y-2">
                <div className="space-y-1.5 divide-y divide-border/40">
                  {/* Pelanggan Aktif */}
                  <label className="flex items-center justify-between gap-2 pt-1.5 cursor-pointer text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.pelanggan}
                        onCheckedChange={(c) => onVisibilitasChange("pelanggan", c === true)}
                      />
                      <span className="size-2.5 rounded-full bg-teal-600" />
                      <span className="font-medium text-foreground">Pelanggan Aktif</span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {formatAngka.format(jumlahPelanggan)}
                    </span>
                  </label>

                  {/* Pelanggan Dicabut */}
                  <div className="pt-2">
                    <label className="flex items-center justify-between gap-2 cursor-pointer text-xs">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={visibilitas.eksPelanggan}
                          onCheckedChange={(c) => onVisibilitasChange("eksPelanggan", c === true)}
                        />
                        <span className="size-2.5 rounded-full bg-rose-600" />
                        <span className="font-medium text-foreground">Pelanggan Dicabut</span>
                      </div>
                      <span className="text-[11px] font-semibold text-rose-600 tabular-nums">
                        {formatAngka.format(statistikStatus.pelangganDicabut)}
                      </span>
                    </label>

                    {/* Kriteria Subkategori Dicabut */}
                    <div className="mt-1.5 ml-6 space-y-1 rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">
                      <p className="font-medium text-foreground text-[10px] uppercase tracking-wider mb-1">
                        Kriteria Pencabutan / Nonaktif:
                      </p>
                      <div className="flex justify-between items-center">
                        <span>• Tutup Sementara</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatAngka.format(statistikStatus.kriteriaDicabut.tutupSementara)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Tutup SPT</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatAngka.format(statistikStatus.kriteriaDicabut.tutupSpt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Disegel</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatAngka.format(statistikStatus.kriteriaDicabut.disegel)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Dicabut Permanen / Hapus</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatAngka.format(statistikStatus.kriteriaDicabut.dicabut)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Eks Pelanggan (Survei)</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {formatAngka.format(jumlahEksPelanggan)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pelanggan Potensial */}
                  <label className="flex items-center justify-between gap-2 pt-2 cursor-pointer text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.potensi}
                        onCheckedChange={(c) => onVisibilitasChange("potensi", c === true)}
                      />
                      <span className="size-2.5 rounded-full bg-blue-600" />
                      <span className="font-medium text-foreground">Pelanggan Potensial</span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {formatAngka.format(jumlahPotensi)}
                    </span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Accordion 2: Jaringan Pipa & Sumber Air */}
            <AccordionItem
              value="jaringan-aset"
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <Droplets className="size-3.5 text-sky-500" />
                  Jaringan Pipa &amp; Fasilitas
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-1 space-y-2">
                <div className="space-y-1.5 divide-y divide-border/40 text-xs">
                  {/* Layer Pipa Jaringan */}
                  <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.pipa}
                        onCheckedChange={(c) => onVisibilitasChange("pipa", c === true)}
                      />
                      <span className="h-1 w-3 rounded-full bg-sky-500" />
                      <span className="font-medium text-foreground">Pipa Distribusi &amp; Transmisi</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {statistikPipa.totalPanjangKm} km
                    </span>
                  </label>

                  {/* Layer Sumber Air & Booster */}
                  <label className="flex items-center justify-between gap-2 pt-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.sumberAir}
                        onCheckedChange={(c) => onVisibilitasChange("sumberAir", c === true)}
                      />
                      <span className="size-2.5 rounded-full bg-blue-600" />
                      <span className="font-medium text-foreground">IPA &amp; Pompa Booster (BSP)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {statistikPipa.totalSumberAir} unit
                    </span>
                  </label>

                  {/* Layer Rute Cater */}
                  <label className="flex items-center justify-between gap-2 pt-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.rute}
                        onCheckedChange={(c) => onVisibilitasChange("rute", c === true)}
                      />
                      <span className="h-0.5 w-3 rounded-full bg-purple-500" />
                      <span className="font-medium text-foreground">Rute Catat Meter</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {jumlahRute}
                    </span>
                  </label>

                  {/* Layer Pengaduan & Gangguan */}
                  <label className="flex items-center justify-between gap-2 pt-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.pengaduan}
                        onCheckedChange={(c) => onVisibilitasChange("pengaduan", c === true)}
                      />
                      <span className="size-2.5 rounded-full bg-destructive" />
                      <span className="font-medium text-foreground">Titik Gangguan / Aduan</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {jumlahPengaduan}
                    </span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Accordion 3: Batas Administrasi */}
            <AccordionItem
              value="wilayah-administrasi"
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-emerald-500" />
                  Batas Administrasi Wilayah
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 pt-1 space-y-2">
                <div className="space-y-1.5 divide-y divide-border/40 text-xs">
                  <label className="flex items-center justify-between gap-2 pt-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.kelurahan}
                        onCheckedChange={(c) => onVisibilitasChange("kelurahan", c === true)}
                      />
                      <span className="size-2.5 rounded-sm bg-blue-500" />
                      <span className="font-medium text-foreground">Batas Kelurahan (21 Operasional)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {jumlahKelurahan}
                    </span>
                  </label>

                  <label className="flex items-center justify-between gap-2 pt-2 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={visibilitas.kecamatan}
                        onCheckedChange={(c) => onVisibilitasChange("kecamatan", c === true)}
                      />
                      <span className="size-2.5 rounded-sm bg-teal-600" />
                      <span className="font-medium text-foreground">Batas Kecamatan (7 Utama)</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {jumlahKecamatan}
                    </span>
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {pelangganTanpaKoordinat > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
              <p className="font-semibold">Info Geocoding Pelanggan</p>
              <p className="mt-0.5 leading-relaxed">
                {formatAngka.format(pelangganTanpaKoordinat)} pelanggan aktif dalam database belum memiliki titik koordinat GPS.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ================= TAB 2: PIPA & DISTRIBUSI ================= */}
        <TabsContent
          value="pipa"
          className="min-h-0 flex-1 overflow-y-auto p-3 m-0 space-y-4"
        >
          {/* Ringkasan Jaringan */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Statistik Jaringan Air Bersih
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Metric
                label="Panjang Jaringan"
                value={`${statistikPipa.totalPanjangKm} km`}
                detail={`${formatAngka.format(statistikPipa.totalSegmen)} segmen GIS`}
              />
              <Metric
                label="Fasilitas Air"
                value={`${statistikPipa.totalSumberAir} Unit`}
                detail="3 IPA + 4 BSP + 1 MA"
              />
            </div>
          </div>

          {/* Rincian Material Pipa */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Distribusi Material Pipa
            </h3>
            <div className="mt-2 space-y-2">
              {statistikPipa.panjangPerMaterial.map((m) => {
                const persen = Math.round((m.panjangKm / (statistikPipa.totalPanjangKm || 1)) * 100)
                return (
                  <div key={m.material} className="rounded-lg border border-border p-2 bg-card">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-sky-500" />
                        {m.material}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {m.panjangKm} km ({persen}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${Math.min(100, Math.max(4, persen))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daftar Master Sumber Air & Pompa Booster Interaktif */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instalasi &amp; Pompa Booster (BSP)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Klik instalasi untuk memfokuskan kamera peta
            </p>
            <div className="mt-2 space-y-1.5">
              {(sumberAirFeatures.length > 0
                ? sumberAirFeatures
                : [
                    {
                      properties: {
                        id: "IPA_BADAK_SINGA",
                        nama: "IPA Badak Singa (Pusat)",
                        tipe: "IPA",
                        kapasitasLps: 1800,
                        latitude: -6.8992,
                        longitude: 107.6105,
                      },
                    },
                    {
                      properties: {
                        id: "IPA_CIKALONG",
                        nama: "IPA Cikalong",
                        tipe: "IPA",
                        kapasitasLps: 600,
                        latitude: -7.0251,
                        longitude: 107.5682,
                      },
                    },
                    {
                      properties: {
                        id: "BSP01",
                        nama: "Booster Pump BSP 01",
                        tipe: "BOOSTER_PUMP",
                        kapasitasLps: 150,
                        latitude: -6.9245,
                        longitude: 107.6189,
                      },
                    },
                    {
                      properties: {
                        id: "BSP03",
                        nama: "Booster Pump BSP 03 (Lengkong)",
                        tipe: "BOOSTER_PUMP",
                        kapasitasLps: 120,
                        latitude: -6.9312,
                        longitude: 107.6251,
                      },
                    },
                    {
                      properties: {
                        id: "BSP05",
                        nama: "Booster Pump BSP 05 (Cigereleng)",
                        tipe: "BOOSTER_PUMP",
                        kapasitasLps: 100,
                        latitude: -6.9450,
                        longitude: 107.6120,
                      },
                    },
                    {
                      properties: {
                        id: "BSP06",
                        nama: "Booster Pump BSP 06 (Astana Anyar)",
                        tipe: "BOOSTER_PUMP",
                        kapasitasLps: 110,
                        latitude: -6.9295,
                        longitude: 107.5998,
                      },
                    },
                    {
                      properties: {
                        id: "MA_CISURUPAN",
                        nama: "Mata Air Cisurupan",
                        tipe: "MATA_AIR",
                        kapasitasLps: 50,
                        latitude: -6.9150,
                        longitude: 107.6890,
                      },
                    },
                  ]
              ).map((feat: any) => {
                const p = feat.properties || {}
                const isIpa = p.tipe === "IPA"
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.longitude && p.latitude) {
                        onFokus({
                          longitude: Number(p.longitude),
                          latitude: Number(p.latitude),
                          zoom: 16,
                        })
                      }
                    }}
                    className="w-full text-left rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/60 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full ${isIpa ? "bg-blue-600" : "bg-amber-500"}`}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {p.nama}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                        Kapasitas: {p.kapasitasLps ? `${p.kapasitasLps} L/detik` : "-"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Fokus
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 3: ANTREAN KEBOCORAN ================= */}
        <TabsContent
          value="kebocoran"
          className="min-h-0 flex-1 overflow-y-auto p-3 m-0 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Antrean Kebocoran Pipa
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Laporan gangguan pipa dinas aktif
              </p>
            </div>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive tabular-nums">
              {formatAngka.format(ringkasan.aktif)} Aktif
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={cariKebocoran}
              onChange={(e) => setCariKebocoran(e.target.value)}
              placeholder="Cari tiket, lokasi, kelurahan…"
              className="pl-8 text-xs h-9"
            />
          </div>

          <ul className="space-y-1.5">
            {hasilKebocoran.slice(0, 30).map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() =>
                    onFokus({
                      longitude: row.longitude,
                      latitude: row.latitude,
                      zoom: 17,
                    })
                  }
                  className="w-full rounded-lg border border-border/70 p-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {row.tiket}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        row.prioritas === "DARURAT"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {row.prioritas || "NORMAL"}
                    </span>
                  </div>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {row.alamat || row.kelurahan || row.judul}
                  </span>
                </button>
              </li>
            ))}

            {hasilKebocoran.length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                {cariKebocoran
                  ? "Tidak ditemukan aduan dengan kata kunci tersebut."
                  : "Tidak ada antrean kebocoran pipa dinas aktif saat ini."}
              </li>
            )}
          </ul>
        </TabsContent>

        {/* ================= TAB 4: KINERJA & EKSPOR ================= */}
        <TabsContent
          value="laporan"
          className="min-h-0 flex-1 overflow-y-auto p-3 m-0 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Kinerja &amp; Laporan</h3>
              <p className="text-xs text-muted-foreground">
                Ringkasan respons dan rekapitulasi data
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={sedangEkspor}
              onClick={unduhLaporan}
              className="gap-1.5 h-8 text-xs"
            >
              <Download className="size-3.5" />
              {sedangEkspor ? "Menyiapkan…" : "Ekspor Excel"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric
              label="Aduan Sedang Aktif"
              value={formatAngka.format(ringkasan.aktif)}
            />
            <Metric
              label="30 Hari Terakhir"
              value={formatAngka.format(ringkasan.laporan30Hari)}
            />
            <Metric
              label="Rata-rata Respons"
              value={
                ringkasan.rataRataResponsJam === null
                  ? "—"
                  : `${ringkasan.rataRataResponsJam.toFixed(1)} jam`
              }
              detail="Dari tiket masuk ke respon awal"
            />
            <Metric
              label="Rata-rata Selesai"
              value={
                ringkasan.rataRataPenyelesaianJam === null
                  ? "—"
                  : `${ringkasan.rataRataPenyelesaianJam.toFixed(1)} jam`
              }
              detail="Waktu tuntas penanganan"
            />
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tren 6 Bulan Terakhir
            </h4>
            <div className="mt-2 space-y-1.5">
              {ringkasan.trenBulanan.map((row) => (
                <div
                  key={row.bulan}
                  className="flex items-center justify-between text-xs py-1 border-b border-border/40"
                >
                  <span className="text-muted-foreground">{labelBulan(row.bulan)}</span>
                  <span className="font-semibold tabular-nums">{row.jumlah} aduan</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
