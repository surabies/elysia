"use client"

// features/public/components/PemilihLokasiPeta.tsx
// — Pemilih lokasi interaktif berbasis MapLibre GL dengan dukungan:
// 1. Klik di peta & pin yang dapat digeser (draggable marker).
// 2. Tombol shortcut GPS ("Gunakan Lokasi Saya") dengan animasi flyTo.
// 3. Pencarian jalan/tempat otomatis terhubung ke /api/publik/geokode/cari.
// 4. Reverse geocoding otomatis ke /api/publik/geokode/balik untuk auto-fill alamat.

import * as React from "react"
import { useTheme } from "next-themes"
import * as maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import {
  Crosshair,
  MapPin,
  Search,
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buatGayaPeta, PETA } from "@/features/peta-pengaduan/lib/KonstantaPengaduan"

// Set worker maplibre jika di browser
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/api/maplibre-worker")
}

export interface PemilihLokasiPetaProps {
  koordinat: { lat: number; lng: number } | null
  onPilihKoordinat: (koordinat: { lat: number; lng: number }) => void
  onPilihAlamat?: (alamat: string) => void
  alamatAwal?: string
  wajib?: boolean
  error?: string | null
  className?: string
}

interface HasilPencarian {
  lat: number
  lng: number
  label: string
}

export function PemilihLokasiPeta({
  koordinat,
  onPilihKoordinat,
  onPilihAlamat,
  alamatAwal,
  wajib = false,
  error = null,
  className,
}: PemilihLokasiPetaProps) {
  const { resolvedTheme } = useTheme()
  const mapContainerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<maplibregl.Map | null>(null)
  const markerRef = React.useRef<maplibregl.Marker | null>(null)

  // State pencarian & geokode
  const [queryCari, setQueryCari] = React.useState("")
  const [mencari, setMencari] = React.useState(false)
  const [daftarHasil, setDaftarHasil] = React.useState<HasilPencarian[]>([])
  const [panelCariTerbuka, setPanelCariTerbuka] = React.useState(false)
  const [sedangGeokode, setSedangGeokode] = React.useState(false)
  const [alamatTerpilih, setAlamatTerpilih] = React.useState(alamatAwal ?? "")
  const [sedangDeteksiGps, setSedangDeteksiGps] = React.useState(false)
  const [pesanGps, setPesanGps] = React.useState<string | null>(null)

  // Ref stabil untuk callback agar tidak re-trigger efek
  const onPilihKoordinatRef = React.useRef(onPilihKoordinat)
  const onPilihAlamatRef = React.useRef(onPilihAlamat)
  React.useEffect(() => {
    onPilihKoordinatRef.current = onPilihKoordinat
    onPilihAlamatRef.current = onPilihAlamat
  }, [onPilihKoordinat, onPilihAlamat])

  // Lakukan reverse geocoding saat koordinat berubah
  const lakukanReverseGeocode = React.useCallback(async (lat: number, lng: number) => {
    setSedangGeokode(true)
    try {
      const res = await fetch(`/api/publik/geokode/balik?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const json = await res.json()
        if (json?.data?.alamat && json.data.alamat !== "Kota Bandung") {
          const alamatBersih = json.data.alamat
          setAlamatTerpilih(alamatBersih)
          onPilihAlamatRef.current?.(alamatBersih)
        }
      }
    } catch (err) {
      console.warn("[REVERSE_GEOCODE_FAIL]", err)
    } finally {
      setSedangGeokode(false)
    }
  }, [])

  // Inisialisasi Peta MapLibre
  React.useEffect(() => {
    if (!mapContainerRef.current) return

    const gelap = resolvedTheme === "dark"
    const pusatAwal: [number, number] = koordinat
      ? [koordinat.lng, koordinat.lat]
      : PETA.pusat

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buatGayaPeta(gelap),
      center: pusatAwal,
      zoom: koordinat ? 15 : 12.5,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: false,
    })

    // Custom HTML Element untuk Marker Pin yang menarik & draggable
    const el = document.createElement("div")
    el.className = "group relative cursor-grab active:cursor-grabbing -translate-x-1/2 -translate-y-full"
    el.innerHTML = `
      <div class="relative flex flex-col items-center">
        <div class="flex items-center justify-center size-8 rounded-full bg-destructive text-destructive-foreground shadow-lg ring-2 ring-white dark:ring-neutral-900 transition-transform duration-150 group-hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="w-1.5 h-1.5 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
      </div>
    `

    const marker = new maplibregl.Marker({
      element: el,
      draggable: true,
      anchor: "bottom",
    })

    if (koordinat) {
      marker.setLngLat([koordinat.lng, koordinat.lat]).addTo(map)
    }

    // Handler drag pin
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat()
      const lat = parseFloat(lngLat.lat.toFixed(6))
      const lng = parseFloat(lngLat.lng.toFixed(6))
      onPilihKoordinatRef.current({ lat, lng })
      void lakukanReverseGeocode(lat, lng)
    })

    // Handler klik pada peta untuk pindahkan pin
    map.on("click", (e) => {
      const lat = parseFloat(e.lngLat.lat.toFixed(6))
      const lng = parseFloat(e.lngLat.lng.toFixed(6))

      marker.setLngLat([lng, lat])
      if (!marker.getElement().parentElement) {
        marker.addTo(map)
      }

      onPilihKoordinatRef.current({ lat, lng })
      void lakukanReverseGeocode(lat, lng)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [resolvedTheme, lakukanReverseGeocode]) // Inisialisasi hanya saat container/tema mount

  // Sinkronkan posisi marker saat koordinat dari luar berubah
  React.useEffect(() => {
    if (!mapRef.current || !markerRef.current || !koordinat) return

    const marker = markerRef.current
    const map = mapRef.current
    const pos = marker.getLngLat()

    // Cek jika berbeda secara signifikan
    if (!pos || Math.abs(pos.lat - koordinat.lat) > 0.00001 || Math.abs(pos.lng - koordinat.lng) > 0.00001) {
      marker.setLngLat([koordinat.lng, koordinat.lat])
      if (!marker.getElement().parentElement) {
        marker.addTo(map)
      }
    }
  }, [koordinat])

  // Pencarian jalan via /api/publik/geokode/cari
  React.useEffect(() => {
    if (!queryCari.trim() || queryCari.trim().length < 3) {
      setDaftarHasil([])
      return
    }

    const timer = setTimeout(async () => {
      setMencari(true)
      try {
        const res = await fetch(`/api/publik/geokode/cari?q=${encodeURIComponent(queryCari.trim())}`)
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json?.data?.hasil)) {
            setDaftarHasil(json.data.hasil)
            setPanelCariTerbuka(true)
          }
        }
      } catch (err) {
        console.warn("[GEOCODE_SEARCH_ERR]", err)
      } finally {
        setMencari(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [queryCari])

  // Pilih hasil pencarian
  const pilihHasil = (item: HasilPencarian) => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const lat = parseFloat(item.lat.toFixed(6))
    const lng = parseFloat(item.lng.toFixed(6))

    map.flyTo({ center: [lng, lat], zoom: 16, essential: true })
    marker.setLngLat([lng, lat])
    if (!marker.getElement().parentElement) {
      marker.addTo(map)
    }

    onPilihKoordinatRef.current({ lat, lng })
    setAlamatTerpilih(item.label)
    onPilihAlamatRef.current?.(item.label)

    setPanelCariTerbuka(false)
    setQueryCari("")
  }

  // Tombol deteksi lokasi GPS saat ini
  const deteksiGps = () => {
    setPesanGps(null)
    if (!navigator.geolocation) {
      setPesanGps("Peramban Anda tidak mendukung deteksi lokasi.")
      return
    }

    setSedangDeteksiGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSedangDeteksiGps(false)
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const lng = parseFloat(pos.coords.longitude.toFixed(6))

        const map = mapRef.current
        const marker = markerRef.current
        if (map && marker) {
          map.flyTo({ center: [lng, lat], zoom: 16, essential: true })
          marker.setLngLat([lng, lat])
          if (!marker.getElement().parentElement) {
            marker.addTo(map)
          }
        }

        onPilihKoordinatRef.current({ lat, lng })
        void lakukanReverseGeocode(lat, lng)
      },
      (err) => {
        setSedangDeteksiGps(false)
        if (err.code === err.PERMISSION_DENIED) {
          setPesanGps("Izin lokasi ditolak. Anda bisa langsung mengklik pada peta.")
        } else {
          setPesanGps("Gagal mendeteksi lokasi. Silakan klik langsung pada peta.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Kontainer Peta Interaktif */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {/* Baris Pencarian Jalan & Landmark di Atas Peta */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex gap-1.5 items-center">
          <div className="relative flex-1 min-w-0 shadow-sm">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              size="sm"
              placeholder="Cari jalan / kelurahan di Bandung..."
              value={queryCari}
              onChange={(e) => setQueryCari(e.target.value)}
              onFocus={() => daftarHasil.length > 0 && setPanelCariTerbuka(true)}
              className="pl-8 pr-7 bg-background/95 backdrop-blur-xs text-xs h-8.5 rounded-lg border-border"
            />
            {mencari && (
              <Loader2 className="absolute right-2.5 top-2.5 size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deteksiGps}
            disabled={sedangDeteksiGps}
            title="Gunakan Lokasi GPS Saya"
            className="h-8.5 px-2.5 bg-background/95 backdrop-blur-xs text-xs gap-1.5 shrink-0 shadow-sm"
          >
            {sedangDeteksiGps ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Crosshair className="size-3.5 text-primary" />
            )}
            <span className="max-sm:hidden">Lokasi Saya</span>
          </Button>
        </div>

        {/* Dropdown Hasil Pencarian */}
        {panelCariTerbuka && daftarHasil.length > 0 && (
          <div className="absolute top-12 left-2.5 right-2.5 z-20 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg text-xs py-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Hasil Pencarian:
            </div>
            {daftarHasil.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => pilihHasil(item)}
                className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors flex items-start gap-2"
              >
                <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Elemen Kanvas Peta MapLibre */}
        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-72 bg-muted transition-opacity duration-200"
          style={{ minHeight: "240px" }}
        />

        {/* Kontrol Zoom di Pojok Kanan Bawah */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-col gap-1 shadow-sm">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 bg-background/90 backdrop-blur-xs rounded-md shadow-xs"
            onClick={() => mapRef.current?.zoomIn()}
            title="Perbesar"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7 bg-background/90 backdrop-blur-xs rounded-md shadow-xs"
            onClick={() => mapRef.current?.zoomOut()}
            title="Perkecil"
          >
            <Minus className="size-3.5" />
          </Button>
        </div>

        {/* Petunjuk Interaksi Melayang di Bawah Peta */}
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-background/90 backdrop-blur-xs border border-border/80 text-foreground shadow-xs">
            <MapPin className="size-3 text-destructive shrink-0" />
            {koordinat ? "Klik atau geser pin untuk menyempurnakan titik" : "Klik di peta untuk menandai titik"}
          </span>
        </div>
      </div>

      {/* Info Status Koordinat & Alamat Terdeteksi */}
      {koordinat ? (
        <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-primary">
              <Check className="size-3.5" />
              Titik lokasi berhasil ditandai
            </span>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
              {koordinat.lat.toFixed(5)}, {koordinat.lng.toFixed(5)}
            </Badge>
          </div>
          {sedangGeokode ? (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <Loader2 className="size-3 animate-spin" /> Mengambil rincian alamat...
            </span>
          ) : alamatTerpilih ? (
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              <strong className="text-foreground">Patokan:</strong> {alamatTerpilih}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="size-3 text-muted-foreground shrink-0" />
          {wajib
            ? "Titik lokasi wajib ditandai untuk mempermudah penanganan teknisi lapangan."
            : "Tandai titik lokasi kejadian agar teknisi dapat langsung menuju sasaran."}
        </p>
      )}

      {/* Pesan Kesalahan / Notifikasi GPS */}
      {pesanGps && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          {pesanGps}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
