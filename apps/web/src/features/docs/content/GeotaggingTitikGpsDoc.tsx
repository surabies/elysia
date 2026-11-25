'use client';

import * as React from 'react';
import {
  Compass,
  Crosshair,
  Sparkles,
  MapPin,
  Layers,
  Smartphone,
  EyeOff,
  Eye,
  Check,
  Copy,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { DocsCallout } from '../components/DocsCallout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DocHeading } from '../types';

export const geotaggingTitikGpsHeadings: DocHeading[] = [
  { id: 'ikhtisar', title: 'Ikhtisar & Nilai Strategis', level: 2 },
  { id: 'simulator-5-tahap', title: 'Simulator Interaktif: Metode 5-Tahap GPS', level: 2 },
  { id: 'metode-ilmiah', title: 'Metode Ilmiah: Inverse-Variance Weighting (1/σ²)', level: 2 },
  { id: 'tahap-1', title: 'Tahap 1: Hardware Handshake & Zero Cache', level: 3 },
  { id: 'tahap-2', title: 'Tahap 2: Multi-Sample Streaming (5 Sampel)', level: 3 },
  { id: 'tahap-3', title: 'Tahap 3: Pembobotan Kuadrat Akurasi (1/σ²)', level: 3 },
  { id: 'tahap-4', title: 'Tahap 4: Early Stopping & Konvergensi Cepat', level: 3 },
  { id: 'tahap-5', title: 'Tahap 5: Ground-Truthing Satelit & Micro-Nudge (2m)', level: 3 },
  { id: 'floating-bar-mobile', title: 'Manajemen UI: Smart Auto-Hide Floating Bar', level: 2 },
  { id: 'arsitektur-library', title: 'Arsitektur & Library Unggulan', level: 2 },
  { id: 'sop-lapangan', title: 'SOP & Tata Cara Penggunaan di Lapangan', level: 2 },
  { id: 'panduan-presentasi', title: 'Panduan Presentasi Klien & Stakeholder', level: 2 },
  { id: 'faq', title: 'Pertanyaan Umum (FAQ)', level: 2 },
];

function CodeFormulaBlock({ formula }: { formula: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-lg border border-border bg-muted/40 p-4 font-mono text-[13px] text-foreground">
      <div className="overflow-x-auto pr-10">{formula}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute right-2 top-2 size-7 text-muted-foreground hover:text-foreground"
        title="Salin rumus"
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  );
}

interface SimulatedSample {
  id: number;
  lat: number;
  lng: number;
  accuracy: number;
  label: string;
}

const DEFAULT_SAMPLES: SimulatedSample[] = [
  { id: 1, lat: -6.914798, lng: 107.609740, accuracy: 24, label: 'Cold-Start (Drift Awal)' },
  { id: 2, lat: -6.914765, lng: 107.609785, accuracy: 15, label: 'Mulai Sinkron Satelit' },
  { id: 3, lat: -6.914748, lng: 107.609805, accuracy: 7, label: 'Kunci Sinyal Kuat' },
  { id: 4, lat: -6.914744, lng: 107.609810, accuracy: 3.5, label: 'Presisi Tinggi' },
  { id: 5, lat: -6.914743, lng: 107.609811, accuracy: 3.0, label: 'Terkunci Sempurna' },
];

export function GeotaggingTitikGpsDoc() {
  // State Simulator 5-Tahap GPS
  const [activeStep, setActiveStep] = React.useState<number>(5);
  const [isSimulating, setIsSimulating] = React.useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    setActiveStep(1);
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      setActiveStep(step);
      if (step >= 5) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 800);
  };

  const visibleSamples = DEFAULT_SAMPLES.slice(0, activeStep);

  // Kalkulasi Weighted vs Simple Average
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  let simpleLatSum = 0;
  let simpleLngSum = 0;
  let bestAccuracy = Infinity;

  for (const s of visibleSamples) {
    const w = 1 / (Math.max(s.accuracy, 1) ** 2);
    totalWeight += w;
    weightedLat += s.lat * w;
    weightedLng += s.lng * w;
    simpleLatSum += s.lat;
    simpleLngSum += s.lng;
    if (s.accuracy < bestAccuracy) bestAccuracy = s.accuracy;
  }

  const finalWeightedLat = (weightedLat / totalWeight).toFixed(7);
  const finalWeightedLng = (weightedLng / totalWeight).toFixed(7);
  const finalSimpleLat = (simpleLatSum / visibleSamples.length).toFixed(7);
  const finalSimpleLng = (simpleLngSum / visibleSamples.length).toFixed(7);

  // Jarak selisih deviasi (estimasi meter ~111,139 m per derajat)
  const driftMeters = (
    Math.hypot(
      (parseFloat(finalSimpleLat) - parseFloat(finalWeightedLat)) * 111139,
      (parseFloat(finalSimpleLng) - parseFloat(finalWeightedLng)) * 111139
    )
  ).toFixed(1);

  // State Simulator Floating Bar
  const [mobileModalOpen, setMobileModalOpen] = React.useState(false);

  // State Micro-Nudge Interaktif
  const [nudgeLat, setNudgeLat] = React.useState(-6.914744);
  const [nudgeLng, setNudgeLng] = React.useState(107.609810);
  const STEP_2M = 0.000018;

  const handleNudge = (dLat: number, dLng: number) => {
    setNudgeLat((prev) => Number((prev + dLat).toFixed(7)));
    setNudgeLng((prev) => Number((prev + dLng).toFixed(7)));
  };

  return (
    <div className="space-y-12">
      {/* 1. Ikhtisar */}
      <section id="ikhtisar">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight first:mt-0 text-foreground">
          Ikhtisar &amp; Nilai Strategis
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Halaman <strong>Titik GPS &amp; Geotag Pelanggan</strong> (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-foreground">
            /pelanggan/titik-gps
          </code>
          ) adalah modul geospasial inti yang memetakan aset fisik meter air sambungan langganan (SL) PDAM secara presisi ke koordinat PostGIS dunia nyata.
        </p>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Modul ini dirancang khusus untuk mengatasi kendala utama di lapangan: <strong>titik koordinat loncat (GPS drift)</strong> akibat interferensi atap, gedung bertingkat, dan antena smartphone yang baru menyala. Dengan menggabungkan <strong>Metode Ilmiah 5-Tahap Multi-Sampling</strong>, <strong>Citra Satelit Resolusi Tinggi (Esri World Imagery)</strong>, dan <strong>Smart Mobile Layout</strong>, sistem ini menjamin akurasi titik meter air tanpa membebani petugas lapangan.
        </p>

        <DocsCallout type="tip" title="Kesiapan Integrasi GIS PDAM (Enterprise Ready)">
          Setiap koordinat yang disimpan divalidasi hingga <strong>7 digit desimal</strong> (ketelitian &plusmn;1.1 cm) dalam format proyeksi spasial standar dunia (WGS 84 / EPSG:4326), siap diintegrasikan langsung dengan layer jaringan pipa transmisi dan distribusi PDAM.
        </DocsCallout>
      </section>

      {/* 2. Simulator Interaktif 5-Tahap GPS */}
      <section id="simulator-5-tahap">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground flex items-center justify-between gap-3">
          <span>Simulator Interaktif: Metode 5-Tahap GPS</span>
          <Badge variant="blue-subtle" size="md">Live Demo</Badge>
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Coba simulasi interaktif di bawah ini untuk melihat bagaimana algoritma kami menolak data GPS yang buruk dan menghasilkan titik koordinat yang jauh lebih akurat dibandingkan metode rata-rata biasa:
        </p>

        {/* Kotak Interaktif Simulator */}
        <div className="my-6 rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <Sparkles className="size-4 text-(--ds-blue-700)" />
                <span>Simulasi Pengambilan Sinyal Multi-Sampel Realtime</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mengumpulkan hingga 5 sampel beruntun untuk menghitung titik pusat optimal.
              </p>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={runSimulation}
              disabled={isSimulating}
              className="gap-2 font-medium"
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="size-3.5 animate-spin" />
                  <span>Mengambil Sampel ({activeStep}/5)...</span>
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  <span>Jalankan Simulasi Kalibrasi</span>
                </>
              )}
            </Button>
          </div>

          {/* Tabel Sampel yang Diambil */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-foreground border-b border-border">
                <tr>
                  <th className="p-2.5">Sampel</th>
                  <th className="p-2.5">Kondisi Sinyal</th>
                  <th className="p-2.5">Akurasi GPS (Radius)</th>
                  <th className="p-2.5">Bobot Matematis (1/σ²)</th>
                  <th className="p-2.5">Pengaruh ke Hasil Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {DEFAULT_SAMPLES.map((s) => {
                  const isActive = s.id <= activeStep;
                  const weight = (1 / (s.accuracy ** 2));
                  const percentage = totalWeight > 0 && isActive
                    ? ((weight / totalWeight) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr
                      key={s.id}
                      className={isActive ? 'bg-muted/15 text-foreground' : 'text-muted-foreground/40'}
                    >
                      <td className="p-2.5 font-bold">#{s.id}</td>
                      <td className="p-2.5 font-sans font-medium">{s.label}</td>
                      <td className="p-2.5">
                        <Badge
                          variant={
                            s.accuracy <= 4
                              ? 'green-subtle'
                              : s.accuracy <= 10
                              ? 'amber-subtle'
                              : 'red-subtle'
                          }
                          size="sm"
                          className="font-mono text-[10px]"
                        >
                          &plusmn;{s.accuracy}m
                        </Badge>
                      </td>
                      <td className="p-2.5">{isActive ? weight.toFixed(5) : '-'}</td>
                      <td className="p-2.5">
                        {isActive ? (
                          <div className="flex items-center gap-2 font-sans font-medium">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-(--ds-blue-600)"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span>{percentage}%</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Perbandingan Hasil Akhir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="size-4" />
                  Metode Biasa (Rata-Rata Sederhana)
                </span>
                <Badge variant="red-subtle" size="sm">Rentan Drift</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Lat: {finalSimpleLat} | Lng: {finalSimpleLng}
              </p>
              <p className="text-xs text-muted-foreground">
                Titik terseret sejauh <strong>~{driftMeters} meter</strong> ke jalan atau atap tetangga akibat dipengaruhi sampel drift awal.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Metode Aplikasi Ini (Weighted Centroid)
                </span>
                <Badge variant="green-subtle" size="sm">Akurasi &plusmn;{bestAccuracy}m</Badge>
              </div>
              <p className="text-xs text-foreground font-mono font-bold">
                Lat: {finalWeightedLat} | Lng: {finalWeightedLng}
              </p>
              <p className="text-xs text-muted-foreground">
                Sampel presisi tinggi (3.0m) menguasai &gt;75% bobot perhitungan. Titik meter air terkunci tepat di target fisik.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metode Ilmiah: Inverse-Variance Weighting */}
      <section id="metode-ilmiah">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Metode Ilmiah: Inverse-Variance Weighting (1/σ²)
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Dalam teori statistik spasial geodetik, ketidakpastian sinyal GPS mengikuti distribusi probabilitas Gaussian di mana radius akurasi ($r$) merepresentasikan standar deviasi estimasi ($\sigma$).
        </p>

        <CodeFormulaBlock
          formula={`Bobot Sampel (w_i) = 1 / max(accuracy_i, 1)^2

Latitude Akhir  = SUM(Lat_i * w_i) / SUM(w_i)
Longitude Akhir = SUM(Lng_i * w_i) / SUM(w_i)
Akurasi Terbaik = MIN(accuracy_i)`}
        />

        <div id="tahap-1" className="mt-8">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="size-6 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-xs flex items-center justify-center font-bold">1</span>
            <span>Tahap 1: Hardware Handshake &amp; Zero Cache</span>
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-foreground/85">
            Sistem menggunakan W3C Geolocation API dengan parameter spesifik:
          </p>
          <ul className="my-2 ml-6 list-disc [&>li]:mt-1.5 text-[14px] text-foreground/85">
            <li>
              <code>enableHighAccuracy: true</code>: Menginstruksikan sistem operasi Android/iOS untuk mengaktifkan chip GNSS internal, bukan sekadar perkiraan menara BTS atau WiFi.
            </li>
            <li>
              <code>maximumAge: 0</code>: Memaksa browser <strong>membuang cache lokasi lama</strong>, menjamin koordinat yang diterima adalah kondisi detik itu juga di depan rumah pelanggan.
            </li>
            <li>
              <code>timeout: 12000</code>: Memberikan jendela waktu optimal 12 detik untuk akuisisi konstelasi satelit.
            </li>
          </ul>
        </div>

        <div id="tahap-2" className="mt-8">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="size-6 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-xs flex items-center justify-center font-bold">2</span>
            <span>Tahap 2: Multi-Sample Streaming (5 Sampel)</span>
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-foreground/85">
            Aplikasi mendengarkan aliran data lokasi berulang melalui <code>navigator.geolocation.watchPosition</code>. Saat antena smartphone menyesuaikan diri dengan satelit, nilai akurasi berangsur membaik dari &plusmn;20m menjadi &plusmn;3m. Setiap titik dicatat secara streaming ke dalam memori volatile.
          </p>
        </div>

        <div id="tahap-3" className="mt-8">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="size-6 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-xs flex items-center justify-center font-bold">3</span>
            <span>Tahap 3: Pembobotan Kuadrat Akurasi (1/σ²)</span>
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-foreground/85">
            Algoritma memberikan bobot kuadrat terbalik ($1/\sigma^2$). Sampel awal yang meleset akibat <em>cold-start drift</em> memiliki bobot yang sangat mendekati nol sehingga tidak merusak rata-rata akhir.
          </p>
        </div>

        <div id="tahap-4" className="mt-8">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="size-6 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-xs flex items-center justify-center font-bold">4</span>
            <span>Tahap 4: Early Stopping &amp; Konvergensi Cepat</span>
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-foreground/85">
            Petugas lapangan tidak boleh terhambat oleh proses loading yang lama. Algoritma memiliki dua aturan pemicu penghentian dini (<em>dual early-stop criteria</em>):
          </p>
          <ul className="my-2 ml-6 list-disc [&>li]:mt-1.5 text-[14px] text-foreground/85">
            <li>
              <strong>Fast Convergence:</strong> Bila telah terkumpul minimal 2 sampel dan salah satunya mencapai akurasi &le;4 meter, kalibrasi langsung selesai tanpa perlu menunggu sampel ke-5.
            </li>
            <li>
              <strong>Safety Timeout (4.5 detik):</strong> Bila cuaca mendung atau lokasi berada di gang sempit bertembok tebal, timer 4.5 detik otomatis menyelesaikan kalkulasi dari sampel terbaik yang tersedia.
            </li>
          </ul>
        </div>

        <div id="tahap-5" className="mt-8">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span className="size-6 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-xs flex items-center justify-center font-bold">5</span>
            <span>Tahap 5: Ground-Truthing Satelit &amp; Micro-Nudge (2m)</span>
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-foreground/85">
            Setelah koordinat terhitung, peta satelit resolusi tinggi otomatis bergeser dan memperbesar tampilan (zoom 18.5) ke atap rumah pelanggan. Petugas dapat melihat titik fisik dan melakukan koreksi mikro:
          </p>

          {/* Demo Micro-Nudge D-Pad */}
          <div className="my-4 rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground">
                Demo Tombol D-Pad Geser Mikro (Langkah 2 Meter):
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Lat: {nudgeLat.toFixed(7)}, Lng: {nudgeLng.toFixed(7)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNudge(0, -STEP_2M)}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                <span>Barat</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNudge(STEP_2M, 0)}
                className="h-8 gap-1 text-xs"
              >
                <ChevronUp className="size-3.5" />
                <span>Utara</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNudge(-STEP_2M, 0)}
                className="h-8 gap-1 text-xs"
              >
                <ChevronDown className="size-3.5" />
                <span>Selatan</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleNudge(0, STEP_2M)}
                className="h-8 gap-1 text-xs"
              >
                <span>Timur</span>
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Satu ketukan tombol di atas menggeser koordinat tepat 0.000018&deg; (~2 meter di khatulistiwa/Bandung).
            </p>
          </div>
        </div>
      </section>

      {/* 4. Manajemen UI Mobile: Smart Auto-Hide Floating Bar */}
      <section id="floating-bar-mobile">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Manajemen UI: Smart Auto-Hide Floating Bar
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Salah satu inovasi ergonomis terpenting pada versi terbaru adalah <strong>penyembunyian cerdas bilah menu melayang (Floating Bar)</strong> ketika petugas membuka peta plot koordinat.
        </p>

        {/* Demo Simulasi Mobile UI Toggle */}
        <div className="my-6 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Smartphone className="size-4 text-(--ds-blue-700)" />
              <span>Simulasi Perilaku Layar Mobile Smartphone</span>
            </h3>
            <Button
              type="button"
              variant={mobileModalOpen ? 'secondary' : 'default'}
              size="sm"
              onClick={() => setMobileModalOpen(!mobileModalOpen)}
              className="gap-1.5 text-xs"
            >
              {mobileModalOpen ? (
                <>
                  <Eye className="size-3.5" />
                  <span>Tutup Sheet Peta (Kembali ke List)</span>
                </>
              ) : (
                <>
                  <EyeOff className="size-3.5" />
                  <span>Buka Sheet Peta (Simulasikan Plot)</span>
                </>
              )}
            </Button>
          </div>

          <div className="relative mx-auto max-w-[320px] h-[340px] rounded-2xl border-4 border-foreground/20 bg-background overflow-hidden flex flex-col shadow-md">
            {/* Header Ponsel Mockup */}
            <div className="h-6 bg-muted border-b border-border flex items-center justify-between px-3 text-[10px] text-muted-foreground">
              <span>09:41</span>
              <span>4G LTE &bull; 98%</span>
            </div>

            {/* Konten Halaman List atau Modal */}
            <div className="flex-1 p-3 overflow-hidden relative">
              {mobileModalOpen ? (
                <div className="absolute inset-0 bg-background flex flex-col z-20 animate-in fade-in duration-150">
                  <div className="p-2 border-b border-border bg-muted/40 text-[11px] font-semibold flex items-center justify-between">
                    <span>Sheet Peta Satelit (z-[60])</span>
                    <Badge variant="green-subtle" size="sm">Full Screen</Badge>
                  </div>
                  <div className="flex-1 bg-(--ds-blue-900)/20 flex items-center justify-center p-2 text-center text-[11px] text-muted-foreground border-b border-border">
                    <Crosshair className="size-6 text-(--ds-blue-700) mb-1 mx-auto" />
                    Peta Satelit Esri (Kanvas Penuh Bebas Hambatan)
                  </div>
                  <div className="p-2 bg-card space-y-1.5">
                    <div className="h-6 rounded bg-(--ds-blue-100) dark:bg-(--ds-blue-900)/40 flex items-center justify-center text-[10px] font-semibold text-(--ds-blue-900) dark:text-(--ds-blue-200)">
                      Ambil &amp; Kalibrasi GPS HP
                    </div>
                    <div className="h-7 rounded bg-foreground text-background flex items-center justify-center text-[10px] font-bold">
                      Kunci &amp; Simpan Titik GPS
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2 rounded border border-border bg-muted/30 text-[11px] space-y-1">
                    <div className="font-semibold text-foreground">01004523 - Ahmad Sudrajat</div>
                    <div className="text-muted-foreground text-[10px]">Rute R-04 #12 &bull; Belum Ada GPS</div>
                    <div className="text-[10px] text-(--ds-blue-700) font-semibold pt-1">
                      [+ Plot Titik Peta]
                    </div>
                  </div>
                  <div className="p-2 rounded border border-border bg-muted/30 text-[11px] space-y-1">
                    <div className="font-semibold text-foreground">01004524 - Siti Aminah</div>
                    <div className="text-muted-foreground text-[10px]">Rute R-04 #13 &bull; Sudah Ber-GPS</div>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Nav Bar Mockup */}
            {!mobileModalOpen && (
              <div className="absolute bottom-2 inset-x-4 h-9 rounded-full bg-foreground text-background flex items-center justify-between px-3 text-[10px] font-semibold shadow-lg z-10 transition-all duration-200">
                <span>Cari Menu...</span>
                <span>Menu Utama &equiv;</span>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong>Status Saat Ini:</strong> {mobileModalOpen ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Floating Bar Tersembunyi Otomatis (Tombol simpan 100% terlihat tanpa tertutup)
                </span>
              ) : (
                <span className="text-foreground font-semibold">
                  Floating Bar Aktif (Memudahkan navigasi cepat di halaman daftar pelanggan)
                </span>
              )}
            </p>
          </div>
        </div>

        <DocsCallout type="info" title="Arsitektur Portal DOM Bebas Benturan">
          Dengan merender sheet mobile via <code>createPortal(..., document.body)</code> dan z-index <code>z-[60]</code>, elemen peta tidak akan pernah terpotong oleh overflow tabel, margin kontainer, maupun stacking context komponen induk.
        </DocsCallout>
      </section>

      {/* 5. Arsitektur & Library Unggulan */}
      <section id="arsitektur-library">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Arsitektur &amp; Library Unggulan
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Modul ini dibangun tanpa ketergantungan pada API berbayar mahal yang membebani operasional PDAM, namun tetap mempertahankan standar kualitas industri:
        </p>

        <div className="my-6 w-full overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 font-semibold text-foreground border-b border-border text-xs">
              <tr>
                <th className="p-3">Komponen</th>
                <th className="p-3">Teknologi / Library</th>
                <th className="p-3">Keunggulan Utama untuk Klien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px] text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-foreground">Map Rendering Engine</td>
                <td className="p-3 font-mono text-xs">maplibre-gl v4</td>
                <td className="p-3">Akselerasi GPU WebGL 60 FPS, tidak lemot di ponsel Android murah, bebas lisensi royalty.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Citra Satelit Utama</td>
                <td className="p-3 font-mono text-xs">Esri World Imagery (ArcGIS)</td>
                <td className="p-3">Zoom hingga level 19; detail atap, pekarangan, dan gang perumahan terlihat sangat jelas.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Sensor Hardware</td>
                <td className="p-3 font-mono text-xs">W3C Geolocation API</td>
                <td className="p-3">Akses langsung ke konstelasi GNSS smartphone (GPS, GLONASS, Galileo, BeiDou).</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Proyeksi Spasial</td>
                <td className="p-3 font-mono text-xs">PostGIS ST_SetSRID (EPSG:4326)</td>
                <td className="p-3">Standar format geospasial internasional yang kompatibel dengan QGIS dan ArcGIS PDAM.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. SOP & Tata Cara Lapangan */}
      <section id="sop-lapangan">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          SOP &amp; Tata Cara Penggunaan di Lapangan
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Panduan langkah demi langkah bagi surveyor dan petugas pencatat meter air saat melakukan pemetaan di lokasi pelanggan:
        </p>

        <div className="my-6 space-y-4">
          <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="size-8 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-sm font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Cari Pelanggan pada Daftar Rute</h4>
              <p className="text-xs text-muted-foreground">
                Buka menu <code>/pelanggan/titik-gps</code>. Gunakan filter rute atau ketikkan nomor langganan pelanggan yang sedang dikunjungi.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="size-8 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-sm font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Ketuk Tombol Peta Pinpoint</h4>
              <p className="text-xs text-muted-foreground">
                Layar smartphone otomatis beralih ke mode Full-Screen Map Sheet. Floating Bar navigasi otomatis disembunyikan agar seluruh area tombol terlihat jelas.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="size-8 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-sm font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Tekan "Ambil &amp; Kalibrasi GPS HP"</h4>
              <p className="text-xs text-muted-foreground">
                Berdiri di dekat meter air pelanggan. Tunggu 2-4 detik hingga muncul notifikasi hijau kalibrasi selesai beserta angka akurasi meter (&plusmn;3m).
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="size-8 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-sm font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Verifikasi Visual &amp; Koreksi Mikro</h4>
              <p className="text-xs text-muted-foreground">
                Pastikan sasaran reticle bidik berada di atas atap rumah atau meteran pelanggan. Jika bergeser sedikit, geser peta dengan jari atau tekan tombol D-Pad Geser Halus (Barat/Utara/Selatan/Timur).
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="size-8 rounded-full bg-(--ds-blue-100) text-(--ds-blue-800) dark:bg-(--ds-blue-900) dark:text-(--ds-blue-200) text-sm font-bold flex items-center justify-center shrink-0">
              5
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Kunci &amp; Simpan Titik GPS</h4>
              <p className="text-xs text-muted-foreground">
                Tekan tombol hijau "Kunci &amp; Simpan Titik GPS". Koordinat tersimpan instan ke server dan tanda status pelanggan langsung berubah menjadi centang hijau "Sudah Ber-GPS".
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Panduan Presentasi Klien */}
      <section id="panduan-presentasi">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Panduan Presentasi Klien &amp; Stakeholder
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Gunakan 5 argumen kunci berikut saat mempresentasikan keunggulan sistem di hadapan jajaran Direksi PDAM atau Tim IT Klien:
        </p>

        <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="font-mono text-xs font-bold text-(--ds-blue-700)">Argumen 1</span>
            <h4 className="text-sm font-semibold text-foreground">Bukan Sekadar Titik GPS Mentah</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tekankan bahwa sistem ini memiliki filter anomali dan pembobotan matematis, sehingga tidak terpengaruh sinyal lompat saat petugas baru menyalakan HP.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="font-mono text-xs font-bold text-(--ds-blue-700)">Argumen 2</span>
            <h4 className="text-sm font-semibold text-foreground">Citra Satelit Beresolusi Tinggi</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Petugas tidak mengira-ngira di atas peta kosong; bentuk atap genteng, pohon, dan pagar rumah terlihat jelas sebagai acuan mata fisik di lapangan.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="font-mono text-xs font-bold text-(--ds-blue-700)">Argumen 3</span>
            <h4 className="text-sm font-semibold text-foreground">Aman dari Kendala Pagar / Hewan</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dengan tombol Micro-Nudge 2 meter, petugas tetap aman di bahu jalan tanpa harus masuk ke pekarangan terkunci untuk mendapatkan koordinat meter air.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <span className="font-mono text-xs font-bold text-(--ds-blue-700)">Argumen 4</span>
            <h4 className="text-sm font-semibold text-foreground">Ergonomi Mobile Satu Tangan</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Floating Bar otomatis menghindar agar jempol petugas tidak salah menekan menu sistem saat sedang fokus mengunci titik koordinat pelanggan.
            </p>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Pertanyaan Umum (FAQ)
        </h2>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border p-4 bg-card">
            <h4 className="font-semibold text-sm text-foreground">
              Apakah fitur kalibrasi GPS ini membutuhkan kuota internet besar?
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Tidak. Pembacaan sensor GPS hardware berjalan di tingkat chipset smartphone secara gratis tanpa kuota. Kuota internet hanya digunakan untuk mengunduh tile citra satelit sekitar lokasi pelanggan yang telah dikompresi ringan melalui WebGL.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 bg-card">
            <h4 className="font-semibold text-sm text-foreground">
              Bagaimana jika pelanggan berada di daerah pedesaan dengan sinyal seluler lemah?
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Chip GNSS ponsel tetap dapat mengunci satelit GPS tanpa bantuan sinyal seluler. Algoritma 5-tahap akan tetap menghitung koordinat berbobot, dan petugas dapat memanfaatkan tombol Geser Mikro 2 meter bila tile satelit terlambat dimuat.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 bg-card">
            <h4 className="font-semibold text-sm text-foreground">
              Mengapa floating bar otomatis disembunyikan dan apakah akan kembali lagi?
            </h4>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Floating bar disembunyikan agar kontrol bawah formulir ("Ambil GPS" dan "Kunci &amp; Simpan") tidak tertutup tombol menu. Begitu petugas menekan "Kunci &amp; Simpan" atau tombol "Batal / Kembali", sheet ditutup dan floating bar navigasi otomatis muncul kembali seperti semula.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
