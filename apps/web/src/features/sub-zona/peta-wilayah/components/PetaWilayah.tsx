"use client"

import * as React from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"
import type { Geometry, Point } from "geojson"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Minus,
  Maximize2,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import type {
  FC,
  RingkasanAsetPeta,
  RingkasanLaporanPeta,
  StatistikPipaJaringan,
  StatistikStatusPelanggan,
} from "../types/TipePetaWilayah"
import { PanelPeta, type FokusPeta, type BarisKebocoran } from "./PanelPeta"
import {
  ekspresiWarnaPelanggan,
  ekspresiWarnaWilayah,
  tambahLayerPeta,
  temaLayerPeta,
  type VisibilitasLayer,
} from "./peta/LapisanPeta"
import { pasangPopupFiturPeta } from "./peta/PopupPeta"

const PUSAT_BANDUNG: [number, number] = [107.6098, -6.9147]

const SUMBER_GLYPH =
  "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf"

function pasangZoomCluster(
  map: maplibregl.Map,
  sourceId: string,
  layerId: string
) {
  map.on("click", layerId, async (event) => {
    const feature = event.features?.[0]
    const clusterId = feature?.properties?.cluster_id
    if (
      typeof clusterId !== "number" ||
      !feature ||
      feature.geometry.type !== "Point"
    )
      return

    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource
    try {
      const zoom = await source.getClusterExpansionZoom(clusterId)
      if (!map.getLayer(layerId)) return
      map.easeTo({
        center: (feature.geometry as Point).coordinates as [number, number],
        zoom,
      })
    } catch (error) {
      console.error(`Gagal memperbesar cluster ${sourceId}:`, error)
    }
  })
}

export function PetaWilayah({
  kecamatan,
  kelurahan,
  rute,
  pipa,
  sumberAir,
  statistikPipa,
  statistikStatus,
  pelanggan,
  statistikPelanggan,
  potensi,
  eksPelanggan,
  pengaduan,
  daftarKebocoran,
  ringkasan,
  aset,
}: {
  kecamatan: FC
  kelurahan: FC
  rute: FC
  pipa: FC
  sumberAir: FC
  statistikPipa: StatistikPipaJaringan
  statistikStatus: StatistikStatusPelanggan
  pelanggan: FC
  statistikPelanggan: {
    total: number
    berkoordinat: number
    tanpaKoordinat: number
  }
  potensi: FC
  eksPelanggan: FC
  pengaduan: FC
  daftarKebocoran: BarisKebocoran[]
  ringkasan: RingkasanLaporanPeta
  aset: RingkasanAsetPeta
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<maplibregl.Map | null>(null)
  const [panelTerbuka, setPanelTerbuka] = React.useState(true)
  const [mapStatus, setMapStatus] = React.useState<
    "loading" | "ready" | "error"
  >("loading")
  const [fokus, setFokus] = React.useState<FokusPeta | null>(null)
  const [visibilitas, setVisibilitas] = React.useState<VisibilitasLayer>({
    kecamatan: true,
    kelurahan: true,
    rute: rute.features.length > 0,
    pipa: true,
    sumberAir: true,
    pelanggan: true,
    potensi: true,
    eksPelanggan: true,
    pengaduan: true,
  })
  const { resolvedTheme } = useTheme()
  const gelap = resolvedTheme === "dark"

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const w = temaLayerPeta(gelap)

    maplibregl.setWorkerUrl("/api/maplibre-worker")

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: PUSAT_BANDUNG,
      zoom: 11.8,
      maxZoom: 19,
      style: {
        version: 8,
        glyphs: SUMBER_GLYPH,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          { id: "osm", type: "raster", source: "osm", paint: { ...w.raster } },
        ],
      },
    })
    mapRef.current = map
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)

    const styleLoadTimeout = window.setTimeout(() => {
      setMapStatus((status) => (status === "loading" ? "error" : status))
    }, 20000)

    map.on("error", (event) => {
      console.error("MapLibre map error:", event.error)
    })

    let layerSudahDitambahkan = false
    const saatStyleSiap = () => {
      if (layerSudahDitambahkan || !map.isStyleLoaded()) return
      layerSudahDitambahkan = true
      window.clearTimeout(styleLoadTimeout)
      setMapStatus("ready")

      // Layer wilayah, pipa jaringan, sumber air, dan pelanggan
      tambahLayerPeta({
        map,
        kecamatan,
        kelurahan,
        rute,
        pipa,
        sumberAir,
        pelanggan,
        potensi,
        eksPelanggan,
        pengaduan,
        visibilitas,
        tema: w,
      })
      pasangPopupFiturPeta(map)

      pasangZoomCluster(map, "pelanggan", "pelanggan-cluster")
      pasangZoomCluster(map, "potensi", "potensi-cluster")
      pasangZoomCluster(map, "eks-pelanggan", "eks-pelanggan-cluster")
      pasangZoomCluster(map, "pengaduan", "pengaduan-cluster")

      // Pas-kan tampilan ke data yang ada jika tersedia
      const semua: number[][] = []
      for (const fc of [
        kelurahan,
        sumberAir,
        pelanggan,
        potensi,
        eksPelanggan,
        pengaduan,
      ]) {
        for (const feat of fc.features) {
          const g = feat.geometry as Geometry
          if (g && g.type === "Point") {
            semua.push((g as Point).coordinates as number[])
          }
        }
      }
      if (semua.length > 0) {
        const lngs = semua.map((c) => c[0]!)
        const lats = semua.map((c) => c[1]!)
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 40, maxZoom: 14, duration: 0 }
        )
      }
    }

    map.on("style.load", saatStyleSiap)
    map.on("load", saatStyleSiap)
    saatStyleSiap()

    return () => {
      window.clearTimeout(styleLoadTimeout)
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sinkronisasi visibilitas layer
  React.useEffect(() => {
    const map = mapRef.current
    if (!map || mapStatus !== "ready") return
    const layerGroups: Record<keyof VisibilitasLayer, string[]> = {
      kecamatan: ["kecamatan-isi", "kecamatan-garis", "kecamatan-nama"],
      kelurahan: ["kelurahan-isi", "kelurahan-garis", "kelurahan-nama"],
      rute: ["rute-garis"],
      pipa: ["pipa-casing", "pipa-garis"],
      sumberAir: [
        "sumber-air-lingkaran-luar",
        "sumber-air-titik",
        "sumber-air-nama",
      ],
      pelanggan: [
        "pelanggan-cluster",
        "pelanggan-cluster-angka",
        "pelanggan-titik",
      ],
      potensi: ["potensi-cluster", "potensi-cluster-angka", "potensi-titik"],
      eksPelanggan: [
        "eks-pelanggan-cluster",
        "eks-pelanggan-cluster-angka",
        "eks-pelanggan-titik",
      ],
      pengaduan: [
        "pengaduan-cluster",
        "pengaduan-cluster-angka",
        "pengaduan-titik",
      ],
    }
    for (const [key, visible] of Object.entries(visibilitas) as Array<
      [keyof VisibilitasLayer, boolean]
    >) {
      for (const layer of layerGroups[key] || []) {
        if (map.getLayer(layer))
          map.setLayoutProperty(
            layer,
            "visibility",
            visible ? "visible" : "none"
          )
      }
    }
  }, [mapStatus, visibilitas])

  // FlyTo saat ada fokus dari panel
  React.useEffect(() => {
    if (!fokus || !mapRef.current || mapStatus !== "ready") return
    mapRef.current.flyTo({
      center: [fokus.longitude, fokus.latitude],
      zoom: fokus.zoom ?? 16,
      duration: 800,
      essential: true,
    })
  }, [fokus, mapStatus])

  const ubahVisibilitas = React.useCallback(
    (layer: keyof VisibilitasLayer, visible: boolean) => {
      setVisibilitas((sebelumnya) => ({ ...sebelumnya, [layer]: visible }))
    },
    []
  )

  // Tema Gelap/Terang
  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const w = temaLayerPeta(gelap)

    function terapkan() {
      if (!map || !map.isStyleLoaded()) return
      for (const [prop, nilai] of Object.entries(w.raster)) {
        map.setPaintProperty("osm", prop as "raster-brightness-max", nilai)
      }
      if (map.getLayer("kecamatan-isi"))
        map.setPaintProperty("kecamatan-isi", "fill-color", w.aksen)
      if (map.getLayer("kecamatan-garis"))
        map.setPaintProperty("kecamatan-garis", "line-color", w.aksen)
      if (map.getLayer("kecamatan-nama")) {
        map.setPaintProperty("kecamatan-nama", "text-color", w.teksLabel)
        map.setPaintProperty("kecamatan-nama", "text-halo-color", w.tepiLabel)
      }
      if (map.getLayer("kelurahan-isi")) {
        map.setPaintProperty(
          "kelurahan-isi",
          "fill-color",
          ekspresiWarnaWilayah(w)
        )
        map.setPaintProperty("kelurahan-isi", "fill-opacity", w.isiWilayah)
      }
      if (map.getLayer("kelurahan-garis")) {
        map.setPaintProperty(
          "kelurahan-garis",
          "line-color",
          ekspresiWarnaWilayah(w)
        )
      }
      if (map.getLayer("kelurahan-nama")) {
        map.setPaintProperty("kelurahan-nama", "text-color", w.teksLabel)
        map.setPaintProperty("kelurahan-nama", "text-halo-color", w.tepiLabel)
      }
      if (map.getLayer("pelanggan-cluster"))
        map.setPaintProperty("pelanggan-cluster", "circle-color", w.aksen)
      if (map.getLayer("pelanggan-cluster-angka")) {
        map.setPaintProperty(
          "pelanggan-cluster-angka",
          "text-color",
          w.teksCluster
        )
      }
      if (map.getLayer("potensi-cluster"))
        map.setPaintProperty("potensi-cluster", "circle-color", w.potensi)
      if (map.getLayer("potensi-cluster-angka")) {
        map.setPaintProperty(
          "potensi-cluster-angka",
          "text-color",
          w.teksCluster
        )
      }
      if (map.getLayer("eks-pelanggan-cluster")) {
        map.setPaintProperty("eks-pelanggan-cluster", "circle-color", "#f43f5e")
      }
      if (map.getLayer("eks-pelanggan-cluster-angka")) {
        map.setPaintProperty(
          "eks-pelanggan-cluster-angka",
          "text-color",
          w.teksCluster
        )
      }
      if (map.getLayer("pengaduan-cluster"))
        map.setPaintProperty("pengaduan-cluster", "circle-color", w.aduan)
      if (map.getLayer("pengaduan-cluster-angka")) {
        map.setPaintProperty(
          "pengaduan-cluster-angka",
          "text-color",
          w.teksCluster
        )
      }
      if (map.getLayer("pelanggan-titik")) {
        map.setPaintProperty(
          "pelanggan-titik",
          "circle-color",
          ekspresiWarnaPelanggan(w)
        )
        map.setPaintProperty("pelanggan-titik", "circle-stroke-color", w.tepiTitik)
      }
      if (map.getLayer("pengaduan-titik")) {
        map.setPaintProperty("pengaduan-titik", "circle-color", [
          "case",
          [
            "in",
            ["get", "status"],
            ["literal", ["SELESAI", "DITOLAK", "DITUTUP"]],
          ],
          w.aduanSelesai,
          w.aduan,
        ])
        map.setPaintProperty("pengaduan-titik", "circle-stroke-color", w.tepiTitik)
      }
      if (map.getLayer("eks-pelanggan-titik")) {
        map.setPaintProperty("eks-pelanggan-titik", "circle-color", "#f43f5e")
        map.setPaintProperty("eks-pelanggan-titik", "circle-stroke-color", w.tepiTitik)
      }
      if (map.getLayer("potensi-titik")) {
        map.setPaintProperty("potensi-titik", "circle-color", w.potensi)
        map.setPaintProperty("potensi-titik", "circle-stroke-color", w.tepiTitik)
      }
    }

    if (map.isStyleLoaded()) terapkan()
    else map.once("load", terapkan)
  }, [gelap])

  // Navigasi cepat peta
  const zoomIn = () => mapRef.current?.zoomIn({ duration: 300 })
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 300 })
  const resetTampilan = () => {
    mapRef.current?.flyTo({
      center: PUSAT_BANDUNG,
      zoom: 11.8,
      pitch: 0,
      bearing: 0,
      duration: 600,
    })
  }

  return (
    <div className="relative flex h-full w-full min-w-0 overflow-hidden bg-background">
      {/* 1. Panel Kendali di Sebelah KIRI (Fluid & Responsive) */}
      <div
        className={`h-full shrink-0 border-r border-border bg-background transition-all duration-300 ease-in-out z-20 ${
          panelTerbuka
            ? "w-full md:w-96 lg:w-[420px]"
            : "w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none"
        }`}
      >
        <PanelPeta
          visibilitas={visibilitas}
          onVisibilitasChange={ubahVisibilitas}
          onFokus={setFokus}
          kebocoranAktif={daftarKebocoran}
          ringkasan={ringkasan}
          aset={aset}
          statistikPipa={statistikPipa}
          statistikStatus={statistikStatus}
          pelangganTanpaKoordinat={statistikPelanggan.tanpaKoordinat}
          jumlahKelurahan={kelurahan.features.length}
          jumlahKecamatan={kecamatan.features.length}
          jumlahPelanggan={pelanggan.features.length}
          jumlahPotensi={potensi.features.length}
          jumlahEksPelanggan={eksPelanggan.features.length}
          jumlahPengaduan={pengaduan.features.length}
          jumlahRute={rute.features.length}
          sumberAirFeatures={sumberAir.features}
        />
      </div>

      {/* 2. Area Peta di Sebelah KANAN (Fluid Full Canvas) */}
      <main className="relative min-w-0 flex-1 h-full w-full overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        {/* Tombol Toggle Panel Kiri */}
        <div className="absolute left-3 top-3 z-10">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setPanelTerbuka((prev) => !prev)}
            className="size-9 rounded-lg bg-background/95 backdrop-blur shadow-md hover:bg-background border-border"
            title={panelTerbuka ? "Sembunyikan Panel" : "Buka Panel Kendali"}
          >
            {panelTerbuka ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
        </div>

        {/* Kontrol Navigasi Vertikal Peta di Kanan */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={zoomIn}
            className="size-8 rounded-md text-foreground hover:bg-muted"
            title="Perbesar Peta"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={zoomOut}
            className="size-8 rounded-md text-foreground hover:bg-muted"
            title="Perkecil Peta"
          >
            <Minus className="size-4" />
          </Button>
          <div className="h-px w-full bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetTampilan}
            className="size-8 rounded-md text-foreground hover:bg-muted"
            title="Pusat Kota Bandung"
          >
            <Compass className="size-4" />
          </Button>
        </div>

        {/* Status Loading / Error */}
        {mapStatus === "loading" && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center z-10">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background/95 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur">
              <span className="size-2 rounded-full bg-primary animate-ping" />
              Memuat data spasial &amp; jaringan pipa…
            </div>
          </div>
        )}

        {mapStatus === "error" && (
          <div
            role="alert"
            className="absolute inset-x-4 top-4 flex justify-center z-10"
          >
            <p className="border border-destructive/40 bg-background/95 px-4 py-2 text-xs text-destructive shadow-md rounded-lg">
              Peta gagal memuat sebagian layer. Muat ulang halaman atau periksa koneksi.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
