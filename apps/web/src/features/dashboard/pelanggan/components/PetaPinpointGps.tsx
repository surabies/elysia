'use client';

import * as React from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Plus,
  Minus,
  Layers,
  Crosshair,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Magnet,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

if (
  typeof window !== 'undefined' &&
  typeof (maplibregl as any).setWorkerUrl === 'function'
) {
  (maplibregl as any).setWorkerUrl('/api/maplibre-worker');
}

const DEFAULT_BANDUNG: [number, number] = [107.60981, -6.914744];

// ~0.000018 derajat ≈ 2 meter di ekuator (Bandung ~6.9° LS)
const STEP_2M = 0.000018;

export interface PetaPinpointGpsProps {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  onChange: (
    lat: number,
    lng: number,
    meta?: { isSnapped?: boolean; snapDistance?: number }
  ) => void;
  onRecenterGps?: () => void;
  /** Kelas tinggi kustom untuk kanvas peta (mis. h-full di mode mobile app atau h-[420px] di dialog desktop) */
  mapHeightClassName?: string;
}

/** Proyeksi titik ke ruas garis A-B */
function projectPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return { x: x1, y: y1 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return { x: x1 + t * dx, y: y1 + t * dy };
}

/** Jarak Euclidean dalam satuan meter */
function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const cosLat = Math.cos((lat1 * Math.PI) / 180);
  const dLat = (lat2 - lat1) * 111139;
  const dLng = (lng2 - lng1) * 111139 * cosLat;
  return Math.hypot(dLat, dLng);
}

export function PetaPinpointGps({
  lat,
  lng,
  accuracy,
  onChange,
  onRecenterGps,
  mapHeightClassName = 'h-72 sm:h-[380px]',
}: PetaPinpointGpsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const isInternalMoveRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [basemap, setBasemap] = React.useState<'satellite' | 'street'>('satellite');
  const [showParcels, setShowParcels] = React.useState(true);
  const [isSnapped, setIsSnapped] = React.useState(false);
  const [snapDist, setSnapDist] = React.useState<number | null>(null);
  const [loadingParcels, setLoadingParcels] = React.useState(false);
  const parcelsRef = React.useRef<any>(null);

  const validCoord =
    lat !== null &&
    lng !== null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const initialCenter: [number, number] = validCoord
    ? [lng!, lat!]
    : DEFAULT_BANDUNG;

  // Fungsi memuat poligon persil kadaster di sekitar koordinat
  const loadParcels = React.useCallback(async (cLat: number, cLng: number) => {
    try {
      setLoadingParcels(true);
      const res = await fetch(`/api/places/cadastral-parcels?lat=${cLat}&lng=${cLng}&radius=160`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.features) {
        parcelsRef.current = data;
        const map = mapRef.current;
        if (map && map.isStyleLoaded()) {
          const src = map.getSource('parcels') as maplibregl.GeoJSONSource;
          if (src) {
            src.setData(data);
          }
        }
      }
    } catch {
      // Abaikan bila network timeout
    } finally {
      setLoadingParcels(false);
    }
  }, []);

  // Inisialisasi MapLibre
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: initialCenter,
      zoom: validCoord ? 18.5 : 13.5,
      maxZoom: 20,
      minZoom: 10,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          'satellite-labels': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          osm: {
            type: 'raster',
            tiles: [
              'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          parcels: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          },
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            layout: { visibility: 'visible' },
          },
          {
            id: 'satellite-labels-layer',
            type: 'raster',
            source: 'satellite-labels',
            layout: { visibility: 'visible' },
          },
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            layout: { visibility: 'none' },
          },
          {
            id: 'parcels-fill',
            type: 'fill',
            source: 'parcels',
            paint: {
              'fill-color': '#06b6d4',
              'fill-opacity': 0.16,
            },
            layout: { visibility: 'visible' },
          },
          {
            id: 'parcels-line',
            type: 'line',
            source: 'parcels',
            paint: {
              'line-color': '#0891b2',
              'line-width': 1.6,
              'line-opacity': 0.85,
            },
            layout: { visibility: 'visible' },
          },
          {
            id: 'parcels-frontage',
            type: 'line',
            source: 'parcels',
            paint: {
              'line-color': '#2563eb',
              'line-width': 2.8,
            },
            layout: { visibility: 'visible' },
          },
        ],
      },
    });

    mapRef.current = map;

    map.on('load', () => {
      loadParcels(initialCenter[1], initialCenter[0]);
    });

    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(containerRef.current);

    // Saat peta digeser oleh pengguna, ambil koordinat titik tengah (Center Reticle)
    map.on('moveend', () => {
      if (isInternalMoveRef.current) {
        isInternalMoveRef.current = false;
        return;
      }
      setIsSnapped(false);
      const center = map.getCenter();
      onChangeRef.current(
        Number(center.lat.toFixed(7)),
        Number(center.lng.toFixed(7)),
        { isSnapped: false }
      );
    });

    // Klik di titik mana pun pada peta akan memindahkan sasaran ke titik tersebut
    map.on('click', (e) => {
      map.easeTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        duration: 250,
      });
    });

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronisasi ketika koordinat berubah dari luar (misal: hasil GPS averaging / input teks / nudge / paste)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !validCoord) return;

    const current = map.getCenter();
    const diffLat = Math.abs(current.lat - lat!);
    const diffLng = Math.abs(current.lng - lng!);

    // Hanya pindahkan kamera jika selisih > ~0.3 meter
    if (diffLat > 0.000003 || diffLng > 0.000003) {
      isInternalMoveRef.current = true;
      map.easeTo({
        center: [lng!, lat!],
        zoom: Math.max(map.getZoom(), 18.5),
        duration: 350,
      });

      // Jika perpindahan cukup jauh (> ~60 meter), refresh poligon persil kadaster di lokasi baru
      if (diffLat > 0.0005 || diffLng > 0.0005) {
        loadParcels(lat!, lng!);
      }
    }
  }, [lat, lng, validCoord, loadParcels]);

  // Ganti basemap Satelit vs Jalan (OSM) dan Layer Persil
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const isSat = basemap === 'satellite';
    if (map.getLayer('satellite-layer')) {
      map.setLayoutProperty('satellite-layer', 'visibility', isSat ? 'visible' : 'none');
    }
    if (map.getLayer('satellite-labels-layer')) {
      map.setLayoutProperty('satellite-labels-layer', 'visibility', isSat ? 'visible' : 'none');
    }
    if (map.getLayer('osm-layer')) {
      map.setLayoutProperty('osm-layer', 'visibility', !isSat ? 'visible' : 'none');
    }
    const pVis = showParcels ? 'visible' : 'none';
    if (map.getLayer('parcels-fill')) {
      map.setLayoutProperty('parcels-fill', 'visibility', pVis);
    }
    if (map.getLayer('parcels-line')) {
      map.setLayoutProperty('parcels-line', 'visibility', pVis);
    }
    if (map.getLayer('parcels-frontage')) {
      map.setLayoutProperty('parcels-frontage', 'visibility', pVis);
    }
  }, [basemap, showParcels]);

  // Geser mikro (Micro-Nudge ±2 meter)
  const handleNudge = (dLat: number, dLng: number) => {
    setIsSnapped(false);
    const baseLat = validCoord ? lat! : DEFAULT_BANDUNG[1];
    const baseLng = validCoord ? lng! : DEFAULT_BANDUNG[0];
    const nextLat = Number((baseLat + dLat).toFixed(7));
    const nextLng = Number((baseLng + dLng).toFixed(7));
    onChange(nextLat, nextLng, { isSnapped: false });
  };

  // Algoritma Snapping ke garis muka dinding/pagar persil terdekat
  const handleSnapToParcel = () => {
    const curLat = validCoord ? lat! : DEFAULT_BANDUNG[1];
    const curLng = validCoord ? lng! : DEFAULT_BANDUNG[0];
    const features = parcelsRef.current?.features || [];

    if (features.length === 0) {
      toast.info('Memuat data persil, silakan klik kembali dalam 1 detik...');
      loadParcels(curLat, curLng);
      return;
    }

    let closestDist = Infinity;
    let closestPoint: { lat: number; lng: number } | null = null;

    for (const feat of features) {
      const frontage = feat.properties?.frontageLine;
      const ring = feat.geometry?.coordinates?.[0];
      const segments: Array<[number[], number[]]> = [];

      if (frontage && frontage.length >= 2) {
        segments.push([frontage[0], frontage[1]]);
      } else if (ring && ring.length >= 2) {
        for (let i = 0; i < ring.length - 1; i++) {
          segments.push([ring[i], ring[i + 1]]);
        }
      }

      for (const [pA, pB] of segments) {
        const proj = projectPointToSegment(curLng, curLat, pA[0], pA[1], pB[0], pB[1]);
        const dist = calculateDistanceMeters(curLat, curLng, proj.y, proj.x);
        if (dist < closestDist) {
          closestDist = dist;
          closestPoint = { lat: Number(proj.y.toFixed(7)), lng: Number(proj.x.toFixed(7)) };
        }
      }
    }

    if (closestPoint && closestDist <= 20) {
      setIsSnapped(true);
      setSnapDist(closestDist);
      isInternalMoveRef.current = true;
      mapRef.current?.easeTo({
        center: [closestPoint.lng, closestPoint.lat],
        zoom: Math.max(mapRef.current.getZoom(), 18.5),
        duration: 300,
      });
      onChange(closestPoint.lat, closestPoint.lng, { isSnapped: true, snapDistance: closestDist });
      toast.success(`🧲 Terkunci ke batas muka dinding persil (Koreksi: ${closestDist.toFixed(1)}m)`);
    } else {
      toast.error('Tidak ada batas persil dalam radius 20 meter. Geser peta lebih dekat ke bangunan.');
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Kanvas Peta dengan Target Crosshair di Tengah */}
      <div
        className={cn(
          'relative w-full rounded-lg border border-border overflow-hidden bg-(--ds-gray-100)',
          mapHeightClassName
        )}
      >
        <div ref={containerRef} className="h-full w-full" />

        {/* Center Crosshair / Pin Reticle Tetap di Tengah Layar */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
          {/* Lingkaran estimasi radius akurasi */}
          <div
            className={cn(
              'rounded-full border transition-all duration-300 flex items-center justify-center',
              isSnapped
                ? 'size-12 border-emerald-500/80 bg-emerald-500/20'
                : accuracy && accuracy <= 8
                ? 'size-12 border-(--ds-green-600)/70 bg-(--ds-green-500)/15'
                : accuracy && accuracy <= 20
                ? 'size-16 border-(--ds-amber-600)/70 bg-(--ds-amber-500)/15'
                : 'size-14 border-(--ds-blue-600)/70 bg-(--ds-blue-500)/15'
            )}
          />
          {/* Pin & Titik Sasaran */}
          <div className="absolute flex flex-col items-center -translate-y-3">
            <div
              className={cn(
                'px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold shadow-sm whitespace-nowrap mb-0.5 flex items-center gap-1',
                isSnapped
                  ? 'bg-emerald-600 text-white'
                  : 'bg-foreground text-background'
              )}
            >
              {isSnapped && <Magnet className="size-2.5 text-white" />}
              <span>{isSnapped ? `Terkunci Muka Persil (±${snapDist?.toFixed(1)}m)` : 'Titik Meter'}</span>
            </div>
            <div
              className={cn(
                'size-3.5 rounded-full border-2 border-white shadow-md',
                isSnapped ? 'bg-emerald-600' : 'bg-(--ds-blue-700)'
              )}
            />
            <div className="w-0.5 h-2 bg-white shadow-xs" />
          </div>
          {/* Titik pusat persis di koordinat */}
          <div
            className={cn(
              'absolute size-1.5 rounded-full bg-white ring-2',
              isSnapped ? 'ring-emerald-600' : 'ring-(--ds-blue-700)'
            )}
          />
        </div>

        {/* Toggle Basemap (Satelit / Peta Jalan / Persil) di Kiri Atas */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 rounded-md border border-border bg-card/95 p-0.5 shadow-sm backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={cn(
              'px-2.5 py-1 rounded text-label-11 font-medium transition-colors cursor-pointer flex items-center gap-1',
              basemap === 'satellite'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="size-3" />
            <span>Satelit</span>
          </button>
          <button
            type="button"
            onClick={() => setBasemap('street')}
            className={cn(
              'px-2.5 py-1 rounded text-label-11 font-medium transition-colors cursor-pointer',
              basemap === 'street'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>Peta Jalan</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            type="button"
            onClick={() => setShowParcels(!showParcels)}
            className={cn(
              'px-2 py-1 rounded text-label-11 font-medium transition-colors cursor-pointer flex items-center gap-1',
              showParcels
                ? 'bg-(--ds-blue-600) text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Tampilkan / Sembunyikan Layer Garis Poligon Persil & Bangunan"
          >
            <span>Persil</span>
          </button>
        </div>

        {/* Tombol Zoom & Tengah di Kanan Atas */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm backdrop-blur-xs">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn({ duration: 200 })}
            className="size-7 rounded flex items-center justify-center text-foreground hover:bg-(--ds-gray-100) cursor-pointer"
            title="Perbesar Peta"
          >
            <Plus className="size-3.5" />
          </button>
          <div className="h-px w-full bg-border" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut({ duration: 200 })}
            className="size-7 rounded flex items-center justify-center text-foreground hover:bg-(--ds-gray-100) cursor-pointer"
            title="Perkecil Peta"
          >
            <Minus className="size-3.5" />
          </button>
          {onRecenterGps && (
            <>
              <div className="h-px w-full bg-border" />
              <button
                type="button"
                onClick={onRecenterGps}
                className="size-7 rounded flex items-center justify-center text-(--ds-blue-700) hover:bg-(--ds-blue-100) cursor-pointer"
                title="Pusatkan ke GPS Perangkat"
              >
                <Crosshair className="size-3.5" />
              </button>
            </>
          )}
          <div className="h-px w-full bg-border" />
          <button
            type="button"
            onClick={() => {
              isInternalMoveRef.current = true;
              mapRef.current?.easeTo({
                center: DEFAULT_BANDUNG,
                zoom: 18.5,
                duration: 350,
              });
              onChangeRef.current(DEFAULT_BANDUNG[1], DEFAULT_BANDUNG[0], { isSnapped: false });
              loadParcels(DEFAULT_BANDUNG[1], DEFAULT_BANDUNG[0]);
              toast.info('Peta dipusatkan kembali ke Bandung (Jawa Barat)');
            }}
            className="size-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-(--ds-gray-100) cursor-pointer"
            title="Reset Peta ke Bandung"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {/* Peringatan jika koordinat jatuh di samudra/laut di luar batas Indonesia */}
        {validCoord && (lat! > 12 || lat! < -12 || lng! < 94 || lng! > 142) && (
          <div className="absolute top-12 inset-x-2 z-20 flex justify-center">
            <div className="rounded-md border border-amber-500/40 bg-amber-500/90 text-amber-950 px-3 py-1.5 text-[11px] font-medium shadow-md backdrop-blur-xs flex items-center gap-2">
              <span>⚠️ Titik koordinat ({lat?.toFixed(4)}, {lng?.toFixed(4)}) berada di luar wilayah Indonesia (samudra).</span>
              <button
                type="button"
                onClick={() => {
                  isInternalMoveRef.current = true;
                  mapRef.current?.easeTo({
                    center: DEFAULT_BANDUNG,
                    zoom: 18.5,
                    duration: 350,
                  });
                  onChangeRef.current(DEFAULT_BANDUNG[1], DEFAULT_BANDUNG[0], { isSnapped: false });
                  loadParcels(DEFAULT_BANDUNG[1], DEFAULT_BANDUNG[0]);
                }}
                className="underline font-semibold cursor-pointer hover:text-black"
              >
                Kembali ke Bandung
              </button>
            </div>
          </div>
        )}

        {/* Info Koordinat Aktif di Kiri Bawah */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 hidden sm:flex items-center gap-1.5 rounded bg-black/75 px-2 py-0.5 text-[10px] font-mono text-white backdrop-blur-xs">
          <span>{validCoord ? `${lat?.toFixed(6)}, ${lng?.toFixed(6)}` : `${DEFAULT_BANDUNG[1]}, ${DEFAULT_BANDUNG[0]}`}</span>
        </div>

        {/* Petunjuk Geser Peta di Bawah */}
        <div className="pointer-events-none absolute bottom-2 inset-x-2 z-10 flex justify-center">
          <div className="rounded-full bg-black/75 text-white px-3 py-1 text-[11px] backdrop-blur-xs shadow-xs text-center">
            Geser peta atau ketuk atap rumah untuk mengunci titik meter
          </div>
        </div>
      </div>

      {/* Panel Geser Mikro & Magnetic Snapping Persil */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-(--ds-gray-100) px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isSnapped ? 'secondary' : 'default'}
            size="xs"
            onClick={handleSnapToParcel}
            className={cn(
              'h-7 px-2.5 font-medium gap-1.5 shadow-xs transition-colors',
              isSnapped
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-(--ds-blue-700) hover:bg-(--ds-blue-800) text-white'
            )}
            title="Kunci otomatis ke batas muka dinding/pagar persil bangunan terdekat"
          >
            <Magnet className="size-3.5" />
            <span>{isSnapped ? `Terkunci (±${snapDist?.toFixed(1)}m)` : 'Snap Muka Persil'}</span>
          </Button>

          <div className="text-copy-12 text-muted-foreground hidden sm:block">
            <span className="text-foreground font-medium">Geser Mikro (±2m):</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleNudge(0, -STEP_2M)}
            title="Geser Barat 2 meter"
            className="h-7 px-2 bg-card justify-center"
          >
            <ChevronLeft className="size-3.5" />
            <span>Barat</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleNudge(STEP_2M, 0)}
            title="Geser Utara 2 meter"
            className="h-7 px-2 bg-card justify-center"
          >
            <ChevronUp className="size-3.5" />
            <span>Utara</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleNudge(-STEP_2M, 0)}
            title="Geser Selatan 2 meter"
            className="h-7 px-2 bg-card justify-center"
          >
            <ChevronDown className="size-3.5" />
            <span>Selatan</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleNudge(0, STEP_2M)}
            title="Geser Timur 2 meter"
            className="h-7 px-2 bg-card justify-center"
          >
            <span>Timur</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
