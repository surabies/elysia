'use client';

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CaterPage() {
  const [stats, setStats] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('CD104');
  const [routeCustomers, setRouteCustomers] = useState<any[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Form reading
  const [nolg, setNolg] = useState('00302600011');
  const [stml, setStml] = useState(4830);
  const [stma, setStma] = useState(4860);
  const [kondisi, setKondisi] = useState('Normal');
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch Stats
    fetch('/api/cater/stats')
      .then((res) => res.json())
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err));

    // 2. Fetch Routes
    fetch('/api/cater/routes?limit=20')
      .then((res) => res.json())
      .then((res) => setRoutes(res.data || []))
      .catch((err) => console.error(err));

    // 3. Fetch default route customers
    loadRouteCustomers('CD104');
  }, []);

  const loadRouteCustomers = (kode: string) => {
    setSelectedRoute(kode);
    setLoadingRoute(true);
    fetch(`/api/cater/routes/${kode}/pelanggan?limit=10`)
      .then((res) => res.json())
      .then((res) => {
        setRouteCustomers(res.data || []);
        if (res.data?.[0]) {
          setNolg(res.data[0].nolg);
          setStml(Number(res.data[0].stml || 0));
          setStma(Number(res.data[0].stmaTerakhir || 0) + 10);
        }
      })
      .finally(() => setLoadingRoute(false));
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await fetch('/api/cater/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thbl: '202602',
          nolg,
          ruteKode: selectedRoute,
          stml: Number(stml),
          stma: Number(stma),
          kondisiCatat: kondisi,
          metodeCatat: 'ONSITE',
          durasiDetik: 30,
        }),
      });
      const data = await res.json();
      setSubmitResult(data);
      // Refresh stats
      fetch('/api/cater/stats')
        .then((r) => r.json())
        .then((r) => setStats(r.data));
    } catch (err: any) {
      setSubmitResult({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase bg-ds-gray-200 dark:bg-ds-gray-300 px-2 py-0.5 rounded text-ds-gray-900 font-semibold">
              STI PDAM Dataset
            </span>
            <Badge variant="outline" className="text-xs">
              22,549 Records Matang
            </Badge>
          </div>
          <h1 className="text-heading-32 tracking-tight">Sistem Monitoring Baca Meter (Cater)</h1>
          <p className="text-copy-16 text-muted-foreground">
            Backend API terintegrasi untuk Web Dashboard & Mobile Apps Petugas Lapangan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-ds-blue-700 text-white px-3 py-1 text-label-12">
            Status: Live Sync Active
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="material-base p-5 space-y-1">
          <span className="text-label-13 text-muted-foreground block">Total Pelanggan</span>
          <div className="text-heading-24 font-bold text-ds-gray-1000">
            {stats ? stats.totalPelanggan.toLocaleString() : '...'}
          </div>
          <span className="text-xs text-muted-foreground">Tercatat di Master STI</span>
        </div>

        <div className="material-base p-5 space-y-1">
          <span className="text-label-13 text-muted-foreground block">Rute Cater & Petugas</span>
          <div className="text-heading-24 font-bold text-ds-gray-1000">
            {stats ? `${stats.totalRute} Rute / ${stats.totalPetugas} Petugas` : '...'}
          </div>
          <span className="text-xs text-muted-foreground">Wilayah Cibeunying & Karees</span>
        </div>

        <div className="material-base p-5 space-y-1">
          <span className="text-label-13 text-muted-foreground block">Total Volume Air</span>
          <div className="text-heading-24 font-bold text-ds-blue-700">
            {stats ? `${stats.totalPakaiM3.toLocaleString()} m³` : '...'}
          </div>
          <span className="text-xs text-muted-foreground">Periode Rekening 202601</span>
        </div>

        <div className="material-base p-5 space-y-1">
          <span className="text-label-13 text-muted-foreground block">Total Tagihan DRD</span>
          <div className="text-heading-24 font-bold text-ds-green-700">
            {stats ? `Rp ${Math.round(stats.totalTagihan).toLocaleString()}` : '...'}
          </div>
          <span className="text-xs text-muted-foreground">
            Tunggakan: Rp {stats ? Math.round(stats.totalTunggakan).toLocaleString() : '0'}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Route Inspector & Customer Task List for Mobile */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-heading-20">Daftar Rute & Tugas Lapangan</CardTitle>
                  <CardDescription>
                    Pilih rute untuk simulasi download offline package bagi aplikasi mobile petugas
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  Rute Aktif: {selectedRoute}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route chips */}
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1 border rounded-md">
                {routes.map((r) => (
                  <button
                    key={r.kode}
                    onClick={() => loadRouteCustomers(r.kode)}
                    className={`text-xs px-2.5 py-1 rounded-md font-mono transition-colors ${
                      selectedRoute === r.kode
                        ? 'bg-ds-gray-1000 text-white font-bold'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    {r.kode} ({r.customerCount})
                  </button>
                ))}
              </div>

              {/* Customers under selected route */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold flex justify-between">
                  <span>Pelanggan pada Rute {selectedRoute}</span>
                  <span>{loadingRoute ? 'Memuat...' : `${routeCustomers.length} Sampel Tampil`}</span>
                </div>
                <div className="divide-y max-h-80 overflow-y-auto">
                  {routeCustomers.map((c) => (
                    <div
                      key={c.nolg}
                      onClick={() => {
                        setNolg(c.nolg);
                        setStml(Number(c.stml || 0));
                        setStma(Number(c.stmaTerakhir || 0) + 15);
                      }}
                      className="p-3 text-xs flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <span>{c.nama}</span>
                          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.2 rounded">
                            {c.nolg}
                          </span>
                        </div>
                        <p className="text-muted-foreground truncate max-w-sm">{c.alamat}</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="font-mono font-medium">
                          Stand: {c.stml ?? 0} ➔ {c.stmaTerakhir ?? 0}
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          Tarif: {c.tarifKode}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mobile Field Simulation Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-20">Simulasi Mobile Baca Meter</CardTitle>
              <CardDescription>
                Kirim data catat meter persis seperti kiriman dari HP Android petugas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTestSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-label-12 font-medium block mb-1">Nomor Langganan (NoLg)</label>
                  <Input
                    value={nolg}
                    onChange={(e) => setNolg(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-label-12 font-medium block mb-1">Stand Lalu (m³)</label>
                    <Input
                      type="number"
                      value={stml}
                      onChange={(e) => setStml(Number(e.target.value))}
                      required
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-label-12 font-medium block mb-1">Stand Akhir (m³)</label>
                    <Input
                      type="number"
                      value={stma}
                      onChange={(e) => setStma(Number(e.target.value))}
                      required
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label-12 font-medium block mb-1">Kondisi Fisik Meter</label>
                  <select
                    value={kondisi}
                    onChange={(e) => setKondisi(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Terhalang">Terhalang</option>
                    <option value="Rumah Kosong">Rumah Kosong</option>
                    <option value="Meter Rusak">Meter Rusak</option>
                    <option value="Meter Buram">Meter Buram</option>
                    <option value="Terkunci">Terkunci</option>
                  </select>
                </div>

                <div className="p-3 bg-muted/60 rounded-md space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pemakaian Terhitung:</span>
                    <span className="font-bold font-mono">
                      {stma - stml} m³
                    </span>
                  </div>
                  {stma - stml < 0 && (
                    <span className="text-[11px] text-destructive block">
                      ⚠️ Peringatan: Stand Akhir lebih kecil dari Stand Lalu!
                    </span>
                  )}
                  {stma - stml > 100 && (
                    <span className="text-[11px] text-amber-600 block">
                      ⚠️ Anomali: Lonjakan pemakaian &gt; 100 m³!
                    </span>
                  )}
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Mengirim...' : 'Simulasi Simpan Hasil Baca'}
                </Button>
              </form>

              {submitResult && (
                <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-48">
                  <pre>{JSON.stringify(submitResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
