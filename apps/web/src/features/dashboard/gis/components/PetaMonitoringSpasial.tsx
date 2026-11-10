'use client';

import * as React from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface GisPointItem {
  nolg: string;
  nama: string;
  alamat: string | null;
  tarifKode: string | null;
  ruteKode: string | null;
  pelangganCoord: [number, number] | null;
  caterCoord: [number, number] | null;
  jarakMeter: number | null;
  isGeofenceAlert: boolean;
  isTercatat: boolean;
  isAnomali: boolean;
  stml: number | null;
  stma: number | null;
  pakaiM3: number | null;
  ketCatat: string;
  statusVerifikasi: string;
  fotoMeterUrl: string | null;
  petugasId: string | null;
  namaPetugas: string;
  tglCatat: string | null;
}

export interface GisSummary {
  totalTitik: number;
  tercatat: number;
  belumTercatat: number;
  anomali: number;
  geofenceAlert: number;
}

type FilterMode = 'semua' | 'geofence' | 'anomali';

export function PetaMonitoringSpasial() {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<GisPointItem[]>([]);
  const [summary, setSummary] = React.useState<GisSummary>({
    totalTitik: 0,
    tercatat: 0,
    belumTercatat: 0,
    anomali: 0,
    geofenceAlert: 0,
  });

  const [periode] = React.useState('202601');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('semua');
  const [ruteKode, setRuteKode] = React.useState('');
  const [selectedPoint, setSelectedPoint] = React.useState<GisPointItem | null>(
    null,
  );

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ thbl: periode });
      if (filterMode === 'geofence') params.set('hanyaGeofenceAlert', 'true');
      if (filterMode === 'anomali') params.set('hanyaAnomali', 'true');
      if (ruteKode.trim()) params.set('ruteKode', ruteKode.trim());

      const res = await fetch(`/api/places/gis-monitoring?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data.items);
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.error('Failed to load GIS data:', err);
    } finally {
      setLoading(false);
    }
  }, [periode, filterMode, ruteKode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize MapLibre
  React.useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const maplibre = await import('maplibre-gl');
      if (
        typeof window !== 'undefined' &&
        typeof (maplibre as any).setWorkerUrl === 'function'
      ) {
        (maplibre as any).setWorkerUrl('/maplibre-gl-worker.js');
      }

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapRef.current) {
        const map = new maplibre.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap Contributors',
              },
            },
            layers: [
              {
                id: 'osm-tiles-layer',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: [107.6191, -6.9175],
          zoom: 13,
        });

        map.addControl(
          new maplibre.NavigationControl({ showCompass: true }),
          'bottom-right',
        );
        mapRef.current = map;
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Markers on Data change
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import('maplibre-gl').then((maplibre) => {
      const validPoints = data.filter((d) => d.pelangganCoord);
      if (validPoints.length === 0) return;

      const bounds = new maplibre.LngLatBounds();

      validPoints.forEach((item) => {
        const [lon, lat] = item.pelangganCoord!;
        bounds.extend([lon, lat]);

        const el = document.createElement('div');
        el.className = 'group cursor-pointer relative';

        const isAlert = item.isGeofenceAlert;
        const isAnomali = item.isAnomali;

        let dotFill = 'var(--ds-green-600)';
        let ringFill = 'rgba(30, 184, 112, 0.25)';

        if (isAlert) {
          dotFill = 'var(--ds-red-700)';
          ringFill = 'rgba(224, 0, 0, 0.35)';
        } else if (isAnomali) {
          dotFill = 'var(--ds-amber-600)';
          ringFill = 'rgba(224, 138, 0, 0.28)';
        }

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            ${isAlert ? `<span class="absolute inline-flex size-6 rounded-full animate-ping" style="background-color: ${ringFill}"></span>` : ''}
            <div class="size-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[9px] text-white font-semibold transition-transform duration-150 hover:scale-125" style="background-color: ${dotFill}">
              ${isAlert ? '!' : isAnomali ? 'A' : ''}
            </div>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedPoint(item);
          map.flyTo({ center: [lon, lat], zoom: 16, essential: true });
        });

        const marker = new maplibre.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      if (validPoints.length > 0 && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    });
  }, [data]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden bg-background">
      {/* Top Header / Control Toolbar (Geist Flat Surface + 1px Border) */}
      <header className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading-16 text-foreground">
              Pemetaan Spasial &amp; Evaluasi Geofence
            </h1>
            <Badge variant="subtle" size="sm" className="font-mono">
              PostGIS SRID:4326
            </Badge>
          </div>
          <p className="mt-0.5 text-copy-13 text-muted-foreground">
            Deteksi deviasi koordinat GPS pencatatan petugas terhadap titik fisik meter pelanggan.
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rute Filter Input */}
          <div className="relative flex items-center">
            <Input
              type="text"
              size="sm"
              placeholder="Filter rute (mis. CC208)"
              value={ruteKode}
              onChange={(e) => setRuteKode(e.target.value.toUpperCase())}
              className="w-44 pr-7 font-mono text-label-12"
            />
            {ruteKode && (
              <button
                type="button"
                aria-label="Hapus filter rute"
                onClick={() => setRuteKode('')}
                className="absolute right-2 inline-flex size-4 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Filter Mode Segmented Tabs */}
          <Tabs
            value={filterMode}
            onValueChange={(val) => setFilterMode(val as FilterMode)}
          >
            <TabsList>
              <TabsTrigger value="semua" className="tabular-nums">
                Semua ({summary.totalTitik.toLocaleString('id-ID')})
              </TabsTrigger>
              <TabsTrigger value="geofence" className="tabular-nums">
                <ShieldAlert className="size-3.5 text-(--ds-red-700)" />
                <span>Deviasi &gt;50m ({summary.geofenceAlert.toLocaleString('id-ID')})</span>
              </TabsTrigger>
              <TabsTrigger value="anomali" className="tabular-nums">
                <AlertTriangle className="size-3.5 text-(--ds-amber-700)" />
                <span>Anomali ({summary.anomali.toLocaleString('id-ID')})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="default"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            <span>Muat Ulang</span>
          </Button>
        </div>
      </header>

      {/* Main Map + Inspector Panel Container */}
      <div className="relative h-full w-full flex-1 overflow-hidden">
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="h-full w-full bg-(--ds-gray-100)" />

        {/* Floating KPI Legend Pill (Top Left - Geist Material Menu Surface) */}
        <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="material-menu pointer-events-auto flex flex-wrap items-center divide-x divide-border rounded-lg px-1 py-1.5 text-label-12">
            <div className="flex items-center gap-2 px-3 py-0.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-(--ds-green-600)"
              />
              <span className="text-muted-foreground">Normal &lt;50m</span>
              <span className="text-label-12-mono tabular-nums text-foreground">
                {(summary.tercatat - summary.geofenceAlert).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-0.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-(--ds-red-700)"
              />
              <span className="text-muted-foreground">Deviasi &gt;50m</span>
              <span className="text-label-12-mono tabular-nums text-(--ds-red-700) dark:text-(--ds-red-800)">
                {summary.geofenceAlert.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-0.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-(--ds-amber-600)"
              />
              <span className="text-muted-foreground">Anomali</span>
              <span className="text-label-12-mono tabular-nums text-(--ds-amber-800)">
                {summary.anomali.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Customer Inspector Drawer (Slide-Over from Right - Geist Material Modal) */}
        {selectedPoint && (
          <aside className="material-modal absolute top-4 right-4 bottom-4 z-20 flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl transition-all duration-150 animate-in slide-in-from-right-4">
            {/* Inspector Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border bg-card p-4">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" size="sm" className="font-mono">
                    {selectedPoint.nolg}
                  </Badge>
                  {selectedPoint.isGeofenceAlert && (
                    <Badge variant="red-subtle" size="sm">
                      <ShieldAlert className="size-3" />
                      <span>Deviasi Geofence</span>
                    </Badge>
                  )}
                  {selectedPoint.isAnomali && (
                    <Badge variant="amber-subtle" size="sm">
                      Anomali
                    </Badge>
                  )}
                </div>
                <h3 className="truncate text-heading-16 text-foreground">
                  {selectedPoint.nama}
                </h3>
                <p className="mt-0.5 truncate text-copy-12 text-muted-foreground">
                  {selectedPoint.alamat || 'Alamat tidak tercatat'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Tutup panel detail"
                onClick={() => setSelectedPoint(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Inspector Body Details */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Geofence Deviation Alert Box */}
              <div
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border p-3',
                  selectedPoint.isGeofenceAlert
                    ? 'border-(--ds-red-300) bg-(--ds-red-100) text-(--ds-red-900) dark:border-(--ds-red-400) dark:bg-(--ds-red-200)'
                    : 'border-(--ds-green-300) bg-(--ds-green-100) text-(--ds-green-900) dark:border-(--ds-green-400) dark:bg-(--ds-green-200)',
                )}
              >
                {selectedPoint.isGeofenceAlert ? (
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-(--ds-red-700)" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--ds-green-700)" />
                )}
                <div className="min-w-0">
                  <p className="text-label-13">
                    {selectedPoint.isGeofenceAlert
                      ? 'Peringatan Geofence: Jarak Terlalu Jauh'
                      : 'Posisi Catat Valid (Sesuai Titik)'}
                  </p>
                  <p className="mt-0.5 text-copy-12 opacity-90">
                    Jarak petugas saat mencatat adalah{' '}
                    <span className="font-mono font-medium underline">
                      {selectedPoint.jarakMeter?.toFixed(1) ?? '—'} meter
                    </span>{' '}
                    dari titik meter fisik pelanggan.
                    {selectedPoint.isGeofenceAlert &&
                      ' Rekam dilakukan di luar batas radius wajar 50 meter.'}
                  </p>
                </div>
              </div>

              {/* Data Stand Meter */}
              <div className="space-y-2.5 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
                <p className="text-label-12 text-muted-foreground">
                  Hasil Bacaan Lapangan
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-border bg-card p-2.5">
                    <span className="block text-label-11 text-muted-foreground">
                      Stand Lalu
                    </span>
                    <span className="mt-0.5 block text-label-14-mono tabular-nums text-foreground">
                      {selectedPoint.stml ?? '—'}
                    </span>
                  </div>
                  <div className="rounded-md border border-border bg-card p-2.5">
                    <span className="block text-label-11 text-muted-foreground">
                      Stand Kini
                    </span>
                    <span className="mt-0.5 block text-label-14-mono tabular-nums text-foreground">
                      {selectedPoint.stma ?? '—'}
                    </span>
                  </div>
                  <div className="rounded-md border border-border bg-card p-2.5">
                    <span className="block text-label-11 text-muted-foreground">
                      Pakai (m³)
                    </span>
                    <span className="mt-0.5 block text-label-14-mono tabular-nums text-(--ds-blue-700) dark:text-(--ds-blue-800)">
                      {selectedPoint.pakaiM3 ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2.5 text-copy-12">
                  <span className="text-muted-foreground">Kondisi Fisik</span>
                  <span className="text-label-12 text-foreground">
                    {selectedPoint.ketCatat}
                  </span>
                </div>
                <div className="flex items-center justify-between text-copy-12">
                  <span className="text-muted-foreground">Status Verifikasi</span>
                  <Badge variant="subtle" size="sm">
                    {selectedPoint.statusVerifikasi}
                  </Badge>
                </div>
              </div>

              {/* Petugas & Metadata Lapangan */}
              <div className="space-y-2.5 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
                <p className="text-label-12 text-muted-foreground">
                  Informasi Pencatatan
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-label-12 text-foreground">
                    {selectedPoint.namaPetugas.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-label-13 text-foreground">
                      {selectedPoint.namaPetugas}
                    </span>
                    <span className="block truncate text-label-11-mono text-muted-foreground">
                      Rute: {selectedPoint.ruteKode ?? '—'} &bull; Tarif:{' '}
                      {selectedPoint.tarifKode ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2.5 text-copy-12 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>Waktu Catat</span>
                  </span>
                  <span className="text-label-12-mono tabular-nums text-foreground">
                    {selectedPoint.tglCatat
                      ? new Date(selectedPoint.tglCatat).toLocaleString('id-ID')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Koordinat GPS Raw */}
              <div className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-label-12-mono">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-copy-12 text-muted-foreground">
                    Titik Pelanggan
                  </span>
                  <span className="tabular-nums text-foreground">
                    {selectedPoint.pelangganCoord
                      ?.map((n) => n.toFixed(5))
                      .join(', ') ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-copy-12 text-muted-foreground">
                    GPS Petugas
                  </span>
                  <span className="tabular-nums text-foreground">
                    {selectedPoint.caterCoord
                      ?.map((n) => n.toFixed(5))
                      .join(', ') ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inspector Footer Action */}
            <div className="border-t border-border bg-(--ds-gray-100) p-3">
              <Button asChild variant="default" size="default" className="w-full">
                <Link href={`/verifikasi/baca-petugas?q=${selectedPoint.nolg}`}>
                  <span>Buka di Verifikasi Petugas</span>
                  <ExternalLink className="size-3.5 opacity-80" />
                </Link>
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
