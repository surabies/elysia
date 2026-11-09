'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Eye,
  RefreshCw,
  Layers,
  ChevronRight,
  ExternalLink,
  Navigation,
  User,
  Gauge,
  Clock,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
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

  const [periode, setPeriode] = React.useState('202601');
  const [filterMode, setFilterMode] = React.useState<'semua' | 'geofence' | 'anomali' | 'tercatat'>('semua');
  const [ruteKode, setRuteKode] = React.useState('');
  const [selectedPoint, setSelectedPoint] = React.useState<GisPointItem | null>(null);
  const [showDeviationLines, setShowDeviationLines] = React.useState(true);

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
      if (typeof window !== 'undefined' && typeof (maplibre as any).setWorkerUrl === 'function') {
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
                tiles: [
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                ],
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

        map.addControl(new maplibre.NavigationControl({ showCompass: true }), 'top-right');
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

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    import('maplibre-gl').then((maplibre) => {
      // Find bounds
      const validPoints = data.filter((d) => d.pelangganCoord);
      if (validPoints.length === 0) return;

      const bounds = new maplibre.LngLatBounds();

      validPoints.forEach((item) => {
        const [lon, lat] = item.pelangganCoord!;
        bounds.extend([lon, lat]);

        // Create Custom HTML Marker Element
        const el = document.createElement('div');
        el.className = 'group cursor-pointer relative';

        const isAlert = item.isGeofenceAlert;
        const isAnomali = item.isAnomali;

        let bgColor = 'bg-emerald-500';
        let borderColor = 'border-white';
        let pulse = '';

        if (isAlert) {
          bgColor = 'bg-rose-600';
          borderColor = 'border-rose-200';
          pulse = 'animate-ping opacity-75';
        } else if (isAnomali) {
          bgColor = 'bg-amber-500';
          borderColor = 'border-amber-200';
        }

        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            ${isAlert ? `<span class="absolute inline-flex h-6 w-6 rounded-full bg-rose-400 ${pulse}"></span>` : ''}
            <div class="w-5 h-5 rounded-full ${bgColor} border-2 ${borderColor} shadow-md flex items-center justify-center text-[9px] text-white font-bold transition-transform hover:scale-125">
              ${isAlert ? '!' : isAnomali ? 'A' : '•'}
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

      // Fit bounds if we have points
      if (validPoints.length > 0 && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }
    });
  }, [data]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Top Header / Control Toolbar */}
      <header className="flex flex-wrap items-center justify-between border-b bg-card/80 backdrop-blur px-4 py-2.5 z-10 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight text-foreground flex items-center gap-2">
              Peta Spasial GIS & Anti-"Nembak Meter"
              <Badge variant="outline" className="text-xs bg-muted/60 font-mono">
                PostGIS SRID:4326
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Deteksi deviasi koordinat pembacaan petugas terhadap titik fisik meter pelanggan
            </p>
          </div>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Rute Filter Input */}
          <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2 py-1 text-xs shadow-sm">
            <span className="text-muted-foreground font-medium">Rute:</span>
            <input
              type="text"
              placeholder="Semua (mis. CC208)"
              value={ruteKode}
              onChange={(e) => setRuteKode(e.target.value.toUpperCase())}
              className="w-24 font-mono font-semibold bg-transparent border-none text-foreground focus:outline-none placeholder:text-muted-foreground/60 text-xs"
            />
            {ruteKode && (
              <button
                onClick={() => setRuteKode('')}
                className="text-muted-foreground hover:text-foreground text-[10px] px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Mode */}
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs">
            <button
              onClick={() => setFilterMode('semua')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                filterMode === 'semua'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semua ({summary.totalTitik})
            </button>
            <button
              onClick={() => setFilterMode('geofence')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors',
                filterMode === 'geofence'
                  ? 'bg-rose-500/10 text-rose-600 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-rose-600'
              )}
            >
              <ShieldAlert className="h-3 w-3 text-rose-500" />
              Nembak &gt;50m ({summary.geofenceAlert})
            </button>
            <button
              onClick={() => setFilterMode('anomali')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors',
                filterMode === 'anomali'
                  ? 'bg-amber-500/10 text-amber-600 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-amber-600'
              )}
            >
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Anomali ({summary.anomali})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Main Map + Inspector Panel Container */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full bg-muted/20" />

        {/* Floating KPI Cards Ribbon (Top Left) */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-card/90 backdrop-blur-md border rounded-xl p-2 shadow-lg text-xs">
            <div className="flex items-center gap-2 px-2 py-1 border-r">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Normal &lt;50m:</span>
              <span className="font-semibold text-foreground">
                {summary.tercatat - summary.geofenceAlert}
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 border-r">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-muted-foreground">Alert Nembak:</span>
              <span className="font-semibold text-rose-600">
                {summary.geofenceAlert}
              </span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Anomali:</span>
              <span className="font-semibold text-amber-600">{summary.anomali}</span>
            </div>
          </div>
        </div>

        {/* Selected Customer Inspector Drawer (Slide-Over from Right) */}
        {selectedPoint && (
          <aside className="absolute top-4 right-4 bottom-4 w-96 z-20 flex flex-col rounded-xl border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all animate-in slide-in-from-right-4 duration-200">
            {/* Inspector Header */}
            <div className="p-4 border-b flex items-start justify-between bg-muted/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {selectedPoint.nolg}
                  </span>
                  {selectedPoint.isGeofenceAlert && (
                    <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0 uppercase">
                      <ShieldAlert className="h-3 w-3" />
                      Nembak Meter
                    </Badge>
                  )}
                  {selectedPoint.isAnomali && (
                    <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-300">
                      Anomali
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground line-clamp-1">
                  {selectedPoint.nama}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {selectedPoint.alamat || 'Alamat tidak tercatat'}
                </p>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 rounded-md hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Inspector Body Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Geofence Deviation Alert Box */}
              <div
                className={cn(
                  'rounded-lg p-3 border flex items-start gap-3',
                  selectedPoint.isGeofenceAlert
                    ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200'
                )}
              >
                {selectedPoint.isGeofenceAlert ? (
                  <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-xs leading-none mb-1">
                    {selectedPoint.isGeofenceAlert
                      ? 'Peringatan Geofence: Jarak Terlalu Jauh'
                      : 'Posisi Catat Valid (Sesuai Titik)'}
                  </p>
                  <p className="text-[11px] opacity-90">
                    Jarak petugas saat mencatat adalah{' '}
                    <strong className="underline">
                      {selectedPoint.jarakMeter?.toFixed(1) ?? '—'} meter
                    </strong>{' '}
                    dari titik meter fisik pelanggan.
                    {selectedPoint.isGeofenceAlert &&
                      ' Rekam dilakukan di luar batas radius wajar 50 meter.'}
                  </p>
                </div>
              </div>

              {/* Data Stand Meter */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                  Hasil Bacaan Lapangan
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-md bg-card p-2 border">
                    <span className="text-[10px] text-muted-foreground block">Stand Lalu</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {selectedPoint.stml ?? '—'}
                    </span>
                  </div>
                  <div className="rounded-md bg-card p-2 border">
                    <span className="text-[10px] text-muted-foreground block">Stand Kini</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {selectedPoint.stma ?? '—'}
                    </span>
                  </div>
                  <div className="rounded-md bg-card p-2 border">
                    <span className="text-[10px] text-muted-foreground block">Pakai (m³)</span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {selectedPoint.pakaiM3 ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t">
                  <span className="text-muted-foreground">Kondisi Fisik:</span>
                  <span className="font-medium text-foreground">{selectedPoint.ketCatat}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Verifikasi:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedPoint.statusVerifikasi}
                  </Badge>
                </div>
              </div>

              {/* Petugas & Metadata Lapangan */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                  Informasi Pencatatan
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {selectedPoint.namaPetugas.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-foreground block text-xs">
                      {selectedPoint.namaPetugas}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Rute: {selectedPoint.ruteKode ?? '—'} · Tarif: {selectedPoint.tarifKode ?? '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Waktu Catat:
                  </span>
                  <span className="font-mono text-foreground">
                    {selectedPoint.tglCatat
                      ? new Date(selectedPoint.tglCatat).toLocaleString('id-ID')
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Koordinat GPS Raw */}
              <div className="rounded-lg border p-2.5 font-mono text-[10px] space-y-1 bg-card">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titik Pelanggan:</span>
                  <span className="text-foreground">
                    {selectedPoint.pelangganCoord?.map((n) => n.toFixed(5)).join(', ') ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPS Petugas:</span>
                  <span className="text-foreground">
                    {selectedPoint.caterCoord?.map((n) => n.toFixed(5)).join(', ') ?? '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Inspector Footer Action */}
            <div className="p-3 border-t bg-muted/20 flex gap-2">
              <Link
                href={`/verifikasi/baca-petugas?q=${selectedPoint.nolg}`}
                className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka di Verifikasi Petugas
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
