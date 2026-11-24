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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onChange: (lat: number, lng: number) => void;
  onRecenterGps?: () => void;
  /** Kelas tinggi kustom untuk kanvas peta (mis. h-full di mode mobile app atau h-[420px] di dialog desktop) */
  mapHeightClassName?: string;
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
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
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
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
            layout: { visibility: 'none' },
          },
        ],
      },
    });

    mapRef.current = map;

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
      const center = map.getCenter();
      onChangeRef.current(
        Number(center.lat.toFixed(7)),
        Number(center.lng.toFixed(7))
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

  // Sinkronisasi ketika koordinat berubah dari luar (misal: hasil GPS averaging / input teks / nudge)
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
    }
  }, [lat, lng, validCoord]);

  // Ganti basemap Satelit vs Jalan (OSM)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('satellite-layer')) {
      map.setLayoutProperty(
        'satellite-layer',
        'visibility',
        basemap === 'satellite' ? 'visible' : 'none'
      );
    }
    if (map.getLayer('osm-layer')) {
      map.setLayoutProperty(
        'osm-layer',
        'visibility',
        basemap === 'street' ? 'visible' : 'none'
      );
    }
  }, [basemap]);

  // Geser mikro (Micro-Nudge ±2 meter)
  const handleNudge = (dLat: number, dLng: number) => {
    const baseLat = validCoord ? lat! : DEFAULT_BANDUNG[1];
    const baseLng = validCoord ? lng! : DEFAULT_BANDUNG[0];
    const nextLat = Number((baseLat + dLat).toFixed(7));
    const nextLng = Number((baseLng + dLng).toFixed(7));
    onChange(nextLat, nextLng);
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
              accuracy && accuracy <= 8
                ? 'size-12 border-(--ds-green-600)/70 bg-(--ds-green-500)/15'
                : accuracy && accuracy <= 20
                ? 'size-16 border-(--ds-amber-600)/70 bg-(--ds-amber-500)/15'
                : 'size-14 border-(--ds-blue-600)/70 bg-(--ds-blue-500)/15'
            )}
          />
          {/* Pin & Titik Sasaran */}
          <div className="absolute flex flex-col items-center -translate-y-3">
            <div className="px-1.5 py-0.5 rounded bg-foreground text-background font-mono text-[10px] font-semibold shadow-sm whitespace-nowrap mb-0.5">
              Titik Meter
            </div>
            <div className="size-3.5 rounded-full bg-(--ds-blue-700) border-2 border-white shadow-md" />
            <div className="w-0.5 h-2 bg-white shadow-xs" />
          </div>
          {/* Titik pusat persis di koordinat */}
          <div className="absolute size-1.5 rounded-full bg-white ring-2 ring-(--ds-blue-700)" />
        </div>

        {/* Toggle Basemap (Satelit / Peta Jalan) di Kiri Atas */}
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
        </div>

        {/* Petunjuk Geser Peta di Bawah */}
        <div className="pointer-events-none absolute bottom-2 inset-x-2 z-10 flex justify-center">
          <div className="rounded-full bg-black/75 text-white px-3 py-1 text-[11px] backdrop-blur-xs shadow-xs text-center">
            Geser peta atau ketuk atap rumah untuk mengunci titik meter
          </div>
        </div>
      </div>

      {/* Panel Geser Mikro (Micro-Nudge ±2 Meter) untuk Koreksi Drift GPS */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-(--ds-gray-100) px-3 py-2 shrink-0">
        <div className="text-copy-12 text-muted-foreground">
          <strong className="text-foreground font-medium">Geser Halus (±2m):</strong>{' '}
          <span className="hidden sm:inline">Koreksi jika titik GPS loncat</span>
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
