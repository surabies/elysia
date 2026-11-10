"use client"

import * as React from "react"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useTheme } from "next-themes"
import type { Geometry, Point } from "geojson"
import type {
  FC,
  RingkasanAsetPeta,
  RingkasanLaporanPeta,
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
  const [mapStatus, setMapStatus] = React.useState<
    "loading" | "ready" | "error"
  >("loading")
  const [fokus, setFokus] = React.useState<FokusPeta | null>(null)
  const [visibilitas, setVisibilitas] = React.useState<VisibilitasLayer>({
    kecamatan: true,
    kelurahan: true,
    rute: rute.features.length > 0,
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
      zoom: 11.5,
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
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    )

    let layerSudahDitambahkan = false
    const saatStyleSiap = () => {
      if (layerSudahDitambahkan || !map.isStyleLoaded()) return
      layerSudahDitambahkan = true
      window.clearTimeout(styleLoadTimeout)
      setMapStatus("ready")
      // Layer wilayah dan aset
      tambahLayerPeta({
        map,
        kecamatan,
        kelurahan,
        rute,
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

      // Pas-kan tampilan ke data yang ada
      const semua: number[][] = []
      for (const fc of [
        kelurahan,
        pelanggan,
        potensi,
        eksPelanggan,
        pengaduan,
      ]) {
        for (const feat of fc.features) {
          const g = feat.geometry as Geometry
          if (g && g.type === "Point") semua.push((g as Point).coordinates as number[])
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
          { padding: 48, maxZoom: 14, duration: 0 }
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

  React.useEffect(() => {
    const map = mapRef.current
    if (!map || mapStatus !== "ready") return
    const layerGroups: Record<keyof VisibilitasLayer, string[]> = {
      kecamatan: ["kecamatan-isi", "kecamatan-garis", "kecamatan-nama"],
      kelurahan: ["kelurahan-isi", "kelurahan-garis", "kelurahan-nama"],
      rute: ["rute-garis"],
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
      for (const layer of layerGroups[key]) {
        if (map.getLayer(layer))
          map.setLayoutProperty(
            layer,
            "visibility",
            visible ? "visible" : "none"
          )
      }
    }
  }, [mapStatus, visibilitas])

  React.useEffect(() => {
    if (!fokus || !mapRef.current || mapStatus !== "ready") return
    mapRef.current.flyTo({
      center: [fokus.longitude, fokus.latitude],
      zoom: fokus.zoom ?? 15,
      duration: 700,
    })
  }, [fokus, mapStatus])

  const ubahVisibilitas = React.useCallback(
    (layer: keyof VisibilitasLayer, visible: boolean) => {
      setVisibilitas((sebelumnya) => ({ ...sebelumnya, [layer]: visible }))
    },
    []
  )

  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const w = temaLayerPeta(gelap)

    function terapkan() {
      if (!map || !map.isStyleLoaded()) return
      for (const [prop, nilai] of Object.entries(w.raster)) {
        map.setPaintProperty("osm", prop as "raster-brightness-max", nilai)
      }
      if (map.getLayer("kecamatan-isi")) map.setPaintProperty("kecamatan-isi", "fill-color", w.aksen)
      if (map.getLayer("kecamatan-garis")) map.setPaintProperty("kecamatan-garis", "line-color", w.aksen)
      if (map.getLayer("kecamatan-nama")) {
        map.setPaintProperty("kecamatan-nama", "text-color", w.teksLabel)
        map.setPaintProperty("kecamatan-nama", "text-halo-color", w.tepiLabel)
      }
      if (map.getLayer("kelurahan-isi")) {
        map.setPaintProperty("kelurahan-isi", "fill-color", ekspresiWarnaWilayah(w))
        map.setPaintProperty("kelurahan-isi", "fill-opacity", w.isiWilayah)
      }
      if (map.getLayer("kelurahan-garis")) {
        map.setPaintProperty("kelurahan-garis", "line-color", ekspresiWarnaWilayah(w))
      }
      if (map.getLayer("kelurahan-nama")) {
        map.setPaintProperty("kelurahan-nama", "text-color", w.teksLabel)
        map.setPaintProperty("kelurahan-nama", "text-halo-color", w.tepiLabel)
      }
      if (map.getLayer("pelanggan-cluster")) map.setPaintProperty("pelanggan-cluster", "circle-color", w.aksen)
      if (map.getLayer("pelanggan-cluster-angka")) {
        map.setPaintProperty("pelanggan-cluster-angka", "text-color", w.teksCluster)
      }
      if (map.getLayer("potensi-cluster")) map.setPaintProperty("potensi-cluster", "circle-color", w.potensi)
      if (map.getLayer("potensi-cluster-angka")) {
        map.setPaintProperty("potensi-cluster-angka", "text-color", w.teksCluster)
      }
      if (map.getLayer("eks-pelanggan-cluster")) {
        map.setPaintProperty("eks-pelanggan-cluster", "circle-color", w.eksPelanggan)
      }
      if (map.getLayer("eks-pelanggan-cluster-angka")) {
        map.setPaintProperty("eks-pelanggan-cluster-angka", "text-color", w.teksCluster)
      }
      if (map.getLayer("pengaduan-cluster")) map.setPaintProperty("pengaduan-cluster", "circle-color", w.aduan)
      if (map.getLayer("pengaduan-cluster-angka")) {
        map.setPaintProperty("pengaduan-cluster-angka", "text-color", w.teksCluster)
      }
      if (map.getLayer("pelanggan-titik")) {
        map.setPaintProperty("pelanggan-titik", "circle-color", ekspresiWarnaPelanggan(w))
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
        map.setPaintProperty("eks-pelanggan-titik", "circle-color", w.eksPelanggan)
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

  return (
    <section
      aria-label="Peta jaringan dan panel operasional"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-map-status={mapStatus}
    >
      <h2 className="sr-only">Peta Operasional</h2>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden md:flex-row">
        <div className="relative h-[42dvh] min-h-72 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm md:h-auto md:min-h-0 md:flex-1">
          <div ref={containerRef} className="h-full w-full" />
          {mapStatus === "loading" && (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
              <p
                role="status"
                className="bg-background/95 px-4 py-2 text-sm text-muted-foreground shadow-sm rounded-md border border-border"
              >
                Memuat peta…
              </p>
            </div>
          )}
          {mapStatus === "error" && (
            <div
              role="alert"
              className="absolute inset-x-4 top-4 flex justify-center"
            >
              <p className="border border-destructive/40 bg-background/95 px-4 py-2 text-sm text-destructive shadow-sm rounded-md">
                Peta gagal memuat sebagian data. Muat ulang halaman atau periksa
                koneksi.
              </p>
            </div>
          )}
          {kelurahan.features.length === 0 &&
            kecamatan.features.length === 0 &&
            rute.features.length === 0 &&
            pelanggan.features.length === 0 &&
            potensi.features.length === 0 &&
            eksPelanggan.features.length === 0 &&
            pengaduan.features.length === 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <p className="pointer-events-auto max-w-md border border-border bg-background/95 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground shadow-sm rounded-md">
                  Belum ada data spasial yang tersedia. Peta akan menampilkan
                  layer setelah geometri wilayah atau koordinat aset diimpor.
                </p>
              </div>
            )}
        </div>
        <PanelPeta
          visibilitas={visibilitas}
          onVisibilitasChange={ubahVisibilitas}
          onFokus={setFokus}
          kebocoranAktif={daftarKebocoran}
          ringkasan={ringkasan}
          aset={aset}
          pelangganTanpaKoordinat={statistikPelanggan.tanpaKoordinat}
          jumlahKelurahan={kelurahan.features.length}
          jumlahKecamatan={kecamatan.features.length}
          jumlahPelanggan={pelanggan.features.length}
          jumlahPotensi={potensi.features.length}
          jumlahEksPelanggan={eksPelanggan.features.length}
          jumlahPengaduan={pengaduan.features.length}
          jumlahRute={rute.features.length}
        />
      </div>
    </section>
  )
}
