'use client';

import * as React from 'react';
import {
  Search,
  UserCheck,
  User,
  MapPin,
  Power,
  FileText,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Navigation,
  Info,
  Clock,
  ShieldCheck,
  Send,
  Wrench,
  Check,
  FileCheck,
  Upload,
  ArrowRight,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { pelangganApi } from '../api';
import type { DetailPelangganResponse } from '../types';

const JENIS_BUKTI_HAK = [
  'Sertifikat Hak Milik (SHM)',
  'Akta Jual Beli (AJB)',
  'Surat Keterangan Hak Waris',
  'Surat Perjanjian Sewa Menyewa',
  'Bukti Lunas PBB Terakhir',
  'Surat Kuasa & KTP Pemilik Asli',
];

const ALASAN_PEMUTUSAN = [
  'Permohonan Mandiri (Rumah Kosong / Dijual)',
  'Penertiban Tunggakan Rekening (> 3 Bulan)',
  'Pelanggaran Teknis Sambungan Liar',
  'Permintaan Renovasi Bangunan / Pipa',
  'Peralihan Saluran Air / Tutup Dinas',
];

export function MutasiPelangganView() {
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  // Selected Customer detail state
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [detailData, setDetailData] = React.useState<DetailPelangganResponse['data'] | null>(null);

  // Active Mutasi Tab: 'balik-nama' | 'pemutusan' | 'alamat' | 'histori'
  const [activeTab, setActiveTab] = React.useState('balik-nama');

  // Form Fields: Balik Nama
  const [namaBaru, setNamaBaru] = React.useState('');
  const [nikKtpBaru, setNikKtpBaru] = React.useState('');
  const [noHpBaru, setNoHpBaru] = React.useState('');
  const [jenisDokumen, setJenisDokumen] = React.useState(JENIS_BUKTI_HAK[0]);
  const [noDokumen, setNoDokumen] = React.useState('');
  const [lampiranDokumen, setLampiranDokumen] = React.useState('');
  const [catatanBeritaAcara, setCatatanBeritaAcara] = React.useState('');

  // Form Fields: Alamat & GPS
  const [alamatBaru, setAlamatBaru] = React.useState('');
  const [rtBaru, setRtBaru] = React.useState('');
  const [rwBaru, setRwBaru] = React.useState('');
  const [latGps, setLatGps] = React.useState<string>('');
  const [lngGps, setLngGps] = React.useState<string>('');

  // Form Fields: Alur Pemutusan 3-Pihak
  // Stage 1: Order Pemutusan (Langganan)
  const [tipePemutusan, setTipePemutusan] = React.useState<'SEMENTARA' | 'PERMANEN'>('SEMENTARA');
  const [alasanPemutusan, setAlasanPemutusan] = React.useState(ALASAN_PEMUTUSAN[0]);
  const [noKtpPemohonPemutusan, setNoKtpPemohonPemutusan] = React.useState('');
  const [suratPermohonanBermaterai, setSuratPermohonanBermaterai] = React.useState('');

  // Stage 2: Eksekusi Lapangan (Zona / Distribusi)
  const [tglEksekusiFisik, setTglEksekusiFisik] = React.useState(new Date().toISOString().slice(0, 10));
  const [standAngkat, setStandAngkat] = React.useState<number>(0);
  const [noSegelPasang, setNoSegelPasang] = React.useState('');
  const [petugasTeknisiZona, setPetugasTeknisiZona] = React.useState('Ahmad Syarif (Distribusi)');
  const [fotoBuktiEksekusi, setFotoBuktiEksekusi] = React.useState('meter-cabut-bukti.jpg');

  // Form Fields: Mutasi Wilayah / Rute Pelayanan Lain
  const [ruteList, setRuteList] = React.useState<Array<{ kode: string; nama?: string }>>([]);
  const [ruteBaruKode, setRuteBaruKode] = React.useState('');
  const [noUrutRuteBaru, setNoUrutRuteBaru] = React.useState<string>('');
  const [alasanMutasiWilayah, setAlasanMutasiWilayah] = React.useState('Pemekaran & Penataan Zona Pelayanan');
  const [noSuratMutasiWilayah, setNoSuratMutasiWilayah] = React.useState('');

  // Confirmation dialog
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<'BALIK_NAMA' | 'ORDER_PEMUTUSAN' | 'EKSEKUSI_ZONA' | 'PENGESAHAN_MANAGER' | 'MUTASI_WILAYAH_GPS'>('BALIK_NAMA');
  const [submitting, setSubmitting] = React.useState(false);

  // Muat opsi rute saat inisialisasi
  React.useEffect(() => {
    pelangganApi.getRuteList().then(setRuteList).catch(() => {});
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await pelangganApi.search(searchQuery.trim(), 10);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Pilih pelanggan
  const handlePilihPelanggan = async (nolg: string) => {
    try {
      setLoadingDetail(true);
      setSearchResults([]);
      setSearchQuery('');
      const data = await pelangganApi.getDetail(nolg);
      setDetailData(data);

      if (data?.pelanggan) {
        const p = data.pelanggan;
        setNamaBaru(p.nama);
        setNikKtpBaru('');
        setNoHpBaru(p.noTelp ?? '');
        setNoDokumen('');
        setLampiranDokumen('');
        setAlamatBaru(p.alamat);
        setRtBaru(p.rt ?? '');
        setRwBaru(p.rw ?? '');
        setLatGps(p.titikLokasi?.y != null ? String(p.titikLokasi.y) : '');
        setLngGps(p.titikLokasi?.x != null ? String(p.titikLokasi.x) : '');
        setRuteBaruKode(p.ruteKode ?? '');
        setNoUrutRuteBaru(p.noUrutRute != null ? String(p.noUrutRute) : '');
        setNoSuratMutasiWilayah(`BA-MUTASI-WIL/${new Date().getFullYear()}/${p.nolg}`);
        setCatatanBeritaAcara('');
        setStandAngkat(0);
        setNoSegelPasang('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat profil pelanggan');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Ambil lokasi GPS perangkat saat ini
  const handleDapatkanGpsPerangkat = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatGps(pos.coords.latitude.toFixed(6));
        setLngGps(pos.coords.longitude.toFixed(6));
        toast.success('Koordinat GPS berhasil diambil dari perangkat');
      },
      (err) => {
        toast.error('Gagal mengambil GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Handler
  const handleExecuteAction = async () => {
    if (!detailData?.pelanggan.nolg) return;

    try {
      setSubmitting(true);
      const nolg = detailData.pelanggan.nolg;
      let payload: any = {};

      if (confirmType === 'BALIK_NAMA') {
        if (!namaBaru.trim()) {
          toast.error('Nama pemilik baru wajib diisi');
          return;
        }
        if (!nikKtpBaru.trim()) {
          toast.error('Nomor NIK KTP pemilik baru wajib diisi sebagai bukti sah');
          return;
        }
        payload = {
          nama: namaBaru.trim(),
          nikKtp: nikKtpBaru.trim(),
          noHp: noHpBaru.trim() || undefined,
          jenisDokumen,
          noDokumen: noDokumen.trim() || 'DOK-TERVERIFIKASI',
          lampiranUrl: lampiranDokumen.trim() || 'Berkas Fisik Terverifikasi Admin',
          catatan: catatanBeritaAcara.trim() || undefined,
        };
      } else if (confirmType === 'ORDER_PEMUTUSAN') {
        payload = {
          tipePemutusan: tipePemutusan === 'SEMENTARA' ? 'Segel Stop Kran Sementara' : 'Cabut Water Meter Permanen',
          alasanPemutusan,
          tahapPemutusan: 'ORDER_LANGGANAN',
          nikKtp: noKtpPemohonPemutusan.trim() || 'KTP-TERLAMPIR',
          noDokumen: suratPermohonanBermaterai.trim() || 'Surat Permohonan Bermaterai',
          lampiranUrl: 'Berkas Fisik Bermaterai di Loket Langganan',
          catatan: catatanBeritaAcara.trim() || undefined,
        };
      } else if (confirmType === 'EKSEKUSI_ZONA') {
        payload = {
          tahapPemutusan: 'EKSEKUSI_ZONA',
          tglEksekusi: tglEksekusiFisik,
          standAngkat: Number(standAngkat),
          noSegel: noSegelPasang.trim() || 'SEGAL-MERAH-DIST',
          petugasEksekusi: petugasTeknisiZona,
          fotoBuktiUrl: fotoBuktiEksekusi.trim() || 'bukti-foto-eksekusi.jpg',
          catatan: catatanBeritaAcara.trim() || undefined,
        };
      } else if (confirmType === 'PENGESAHAN_MANAGER') {
        const finalStatus = tipePemutusan === 'SEMENTARA' ? 'SEGEL SEMENTARA' : 'CABUT METER';
        payload = {
          tahapPemutusan: 'PENGESAHAN_MANAGER',
          status: finalStatus,
          catatan: `Pengesahan Pemutusan Pelanggan Resmi oleh Manager Langganan. Status: ${finalStatus}`,
        };
      } else if (confirmType === 'MUTASI_WILAYAH_GPS') {
        payload = {
          alamat: alamatBaru.trim(),
          rt: rtBaru.trim() || null,
          rw: rwBaru.trim() || null,
          ruteKodeBaru: ruteBaruKode.trim() || undefined,
          noUrutRuteBaru: noUrutRuteBaru ? parseInt(noUrutRuteBaru) : undefined,
          alasanMutasiWilayah,
          noSuratMutasiWilayah: noSuratMutasiWilayah.trim() || undefined,
          catatan: catatanBeritaAcara.trim() || undefined,
        };
        if (latGps && lngGps) {
          payload.lat = parseFloat(latGps);
          payload.lng = parseFloat(lngGps);
        }
      }

      const res = await pelangganApi.mutasiPelanggan(nolg, payload);
      toast.success(res.message || 'Perubahan administrasi berhasil disimpan');
      setConfirmOpen(false);

      // Refresh data pelanggan
      const updated = await pelangganApi.getDetail(nolg);
      setDetailData(updated);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan mutasi');
    } finally {
      setSubmitting(false);
    }
  };

  const cust = detailData?.pelanggan;

  // Parse catatan verifikasi lines
  const historiLogLines = React.useMemo(() => {
    const rawNotes = cust?.catatanVerifikasi;
    if (!rawNotes) return [];
    return rawNotes
      .split('\n')
      .map((line: string) => line.trim())
      .filter(Boolean)
      .reverse();
  }, [cust?.catatanVerifikasi]);

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 w-full">
      {/* Header Halaman */}
      <div className="border-b border-border pb-3.5">
        <h1 className="text-heading-20 sm:text-heading-24 font-bold text-foreground tracking-tight">
          Mutasi, Balik Nama & Order Pemutusan Pelanggan
        </h1>
        <p className="text-copy-13 text-muted-foreground mt-0.5">
          Proses peralihan hak balik nama dengan berkas bukti valid, alur pemutusan 3-pihak (Langganan Order ➔ Zona Eksekusi ➔ Manager Pengesahan), dan pemutakhiran spasial.
        </p>
      </div>

      {/* Bagian 1: Cari & Pilih Pelanggan */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <h2 className="text-label-14 font-semibold text-foreground">
            Langkah 1: Cari & Pilih Pelanggan
          </h2>
        </div>

        <div className="relative max-w-xl">
          <div className="relative">
            <Input
              type="text"
              placeholder="Cari NOLG, NPRS, Nama, atau Alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 text-copy-13 font-mono"
            />
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            {searching && (
              <RefreshCw className="size-4 text-primary animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Dropdown Hasil Pencarian */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden divide-y divide-border max-h-72 overflow-y-auto">
              {searchResults.map((res) => (
                <button
                  key={res.nolg}
                  type="button"
                  onClick={() => handlePilihPelanggan(res.nolg)}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-copy-13 text-foreground">
                        {res.nolg}
                      </span>
                      <span className="font-semibold text-copy-13 text-foreground">
                        {res.nama}
                      </span>
                    </div>
                    <div className="text-copy-12 text-muted-foreground mt-0.5 truncate max-w-md">
                      {res.alamat}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={res.status === 'PELANGGAN AKTIF' ? 'green-subtle' : 'gray-subtle'}
                      size="sm"
                    >
                      {res.status === 'PELANGGAN AKTIF' ? 'AKTIF' : res.status}
                    </Badge>
                    <span className="text-label-11 text-muted-foreground font-mono">
                      Rute: {res.ruteKode ?? '-'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingDetail && (
          <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-copy-13">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Memuat data pelanggan terpilih...</span>
          </div>
        )}

        {/* Profil Singkat Pelanggan */}
        {cust && !loadingDetail && (
          <div className="mt-3 p-4 rounded-lg bg-muted/30 border border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-(--ds-green-700)" />
                <span className="font-bold text-copy-14 text-foreground">
                  {cust.nama}
                </span>
                <span className="font-mono text-label-12 font-bold text-(--ds-blue-800) bg-(--ds-blue-100) px-2 py-0.5 rounded">
                  {cust.nolg}
                </span>
              </div>
              <Badge
                variant={cust.status === 'PELANGGAN AKTIF' ? 'green-subtle' : cust.status.includes('SEGEL') ? 'amber-subtle' : 'gray-subtle'}
                size="sm"
              >
                {cust.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-copy-12">
              <div>
                <span className="text-muted-foreground">Alamat Terdaftar:</span>
                <p className="font-medium text-foreground mt-0.5">{cust.alamat}</p>
                {(cust.rt || cust.rw) && (
                  <p className="text-label-11 text-muted-foreground">
                    RT {cust.rt ?? '-'} / RW {cust.rw ?? '-'}
                  </p>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Rute & Tarif:</span>
                <p className="font-mono font-medium text-foreground mt-0.5">
                  Rute: {cust.ruteKode ?? '-'} | Tarif: {cust.tarifKode ?? '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Water Meter & Kontak:</span>
                <p className="font-mono font-medium text-foreground mt-0.5">
                  No. Meter: {cust.noMeter ?? '-'} | HP: {cust.noTelp ?? '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Titik Lokasi GPS:</span>
                <p className="font-mono font-medium text-foreground mt-0.5">
                  {cust.titikLokasi ? (
                    <a
                      href={`https://www.google.com/maps?q=${cust.titikLokasi.y},${cust.titikLokasi.x}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {cust.titikLokasi.y.toFixed(5)}, {cust.titikLokasi.x.toFixed(5)}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Belum ada titik GPS</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 2: Tab Mutasi & Workflow */}
      {cust && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-xs">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-(--ds-blue-700)" />
                <h2 className="text-label-14 font-semibold text-foreground">
                  Langkah 2: Pilih Alur Administrasi Pelanggan
                </h2>
              </div>
              <TabsList className="bg-muted">
                <TabsTrigger value="balik-nama" className="flex items-center gap-1.5 text-label-12">
                  <User className="size-3.5" />
                  <span>Balik Nama (Berkas Sah)</span>
                </TabsTrigger>
                <TabsTrigger value="pemutusan" className="flex items-center gap-1.5 text-label-12">
                  <Power className="size-3.5" />
                  <span>Alur Pemutusan (3-Pihak)</span>
                </TabsTrigger>
                <TabsTrigger value="wilayah-gps" className="flex items-center gap-1.5 text-label-12">
                  <MapPin className="size-3.5" />
                  <span>Mutasi Wilayah & Titik GPS</span>
                </TabsTrigger>
                <TabsTrigger value="histori" className="flex items-center gap-1.5 text-label-12">
                  <History className="size-3.5" />
                  <span>Riwayat Berita Acara</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Balik Nama dengan Syarat Berkas Valid */}
            <TabsContent value="balik-nama" className="space-y-4 pt-4">
              <div className="p-3.5 rounded-md bg-(--ds-blue-100) border border-(--ds-blue-300) text-(--ds-blue-900) text-copy-12 flex items-start gap-2.5">
                <Info className="size-4 shrink-0 mt-0.5 text-(--ds-blue-700)" />
                <div>
                  <span className="font-semibold block">SOP Balik Nama Pelanggan:</span>
                  Proses balik nama mewajibkan pelanggan menyerahkan bukti identitas valid (KTP) dan dokumen bukti sah kepemilikan bangunan/tanah. Admin langganan wajib mencatat rincian dokumen ke database untuk mengesahkan peralihan data hak pelanggan.
                </div>
              </div>

              {/* Perbandingan Identitas Lama vs Baru */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-3.5 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-label-12 text-muted-foreground uppercase font-mono">Pemilik Saat Ini (Lama)</span>
                    <Badge variant="gray-subtle" size="sm">Data Terdaftar</Badge>
                  </div>
                  <div>
                    <Label className="text-label-12 text-muted-foreground">Nama Terdaftar:</Label>
                    <p className="font-semibold text-copy-14 text-foreground mt-0.5">{cust.nama}</p>
                  </div>
                  <div>
                    <Label className="text-label-12 text-muted-foreground">No. Handphone / WhatsApp:</Label>
                    <p className="font-mono text-copy-13 text-foreground mt-0.5">{cust.noTelp ?? '-'}</p>
                  </div>
                </div>

                <div className="space-y-3 p-3.5 rounded-lg border border-(--ds-blue-300) bg-(--ds-blue-100)/30">
                  <div className="flex items-center justify-between">
                    <span className="text-label-12 text-(--ds-blue-900) font-semibold uppercase font-mono">Pemilik Baru (Pemohon)</span>
                    <Badge variant="blue-subtle" size="sm">Wajib Berkas Sah</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="namaBaru" className="text-label-12 font-medium">Nama Lengkap Pemilik Baru *</Label>
                    <Input
                      id="namaBaru"
                      value={namaBaru}
                      onChange={(e) => setNamaBaru(e.target.value)}
                      placeholder="Nama lengkap sesuai KTP..."
                      className="h-9 text-copy-13 font-medium bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="nikKtpBaru" className="text-label-12 font-medium">NIK KTP Pemohon (16 Digit) *</Label>
                      <Input
                        id="nikKtpBaru"
                        value={nikKtpBaru}
                        onChange={(e) => setNikKtpBaru(e.target.value)}
                        placeholder="3273xxxxxxxxxxxx"
                        maxLength={16}
                        className="h-9 text-copy-13 font-mono bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="noHpBaru" className="text-label-12 font-medium">No. WhatsApp Baru *</Label>
                      <Input
                        id="noHpBaru"
                        value={noHpBaru}
                        onChange={(e) => setNoHpBaru(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="h-9 text-copy-13 font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dokumen Bukti Sah Kepemilikan */}
              <div className="p-3.5 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="size-4 text-(--ds-green-700)" />
                  <h3 className="text-label-13 font-semibold text-foreground">
                    Dokumen Validasi Peralihan Hak Kepemilikan (Disertakan ke Database)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-label-12 font-medium">Jenis Bukti Hak *</Label>
                    <Select value={jenisDokumen} onValueChange={setJenisDokumen}>
                      <SelectTrigger className="h-9 text-copy-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JENIS_BUKTI_HAK.map((doc) => (
                          <SelectItem key={doc} value={doc} className="text-copy-12">
                            {doc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="noDokumen" className="text-label-12 font-medium">Nomor Akta / Surat Bukti *</Label>
                    <Input
                      id="noDokumen"
                      value={noDokumen}
                      onChange={(e) => setNoDokumen(e.target.value)}
                      placeholder="Nomor SHM / AJB / Surat Waris..."
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="lampiranDokumen" className="text-label-12 font-medium">Nama Berkas / No. Arsip Loket *</Label>
                    <Input
                      id="lampiranDokumen"
                      value={lampiranDokumen}
                      onChange={(e) => setLampiranDokumen(e.target.value)}
                      placeholder="Contoh: BERKAS-AJB-2026-08.pdf"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <Label htmlFor="catatanNama" className="text-label-12 font-medium">
                    Catatan Tambahan Berita Acara
                  </Label>
                  <Input
                    id="catatanNama"
                    value={catatanBeritaAcara}
                    onChange={(e) => setCatatanBeritaAcara(e.target.value)}
                    placeholder="Keterangan peralihan hak atau catatan dinas loket..."
                    className="h-9 text-copy-12"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setConfirmType('BALIK_NAMA');
                    setConfirmOpen(true);
                  }}
                  disabled={submitting || !namaBaru.trim() || !nikKtpBaru.trim()}
                  className="flex items-center gap-2"
                >
                  <Check className="size-4" />
                  <span>Sahkan Balik Nama ke Database</span>
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: Alur Pemutusan 3-Pihak */}
            <TabsContent value="pemutusan" className="space-y-5 pt-4">
              {/* Stepper Pipeline Visualizer */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <Power className="size-4 text-(--ds-amber-700)" />
                    Alur Kerja 3-Pihak: Pemutusan Pelanggan Air Minum
                  </span>
                  <Badge variant="amber-subtle" size="sm">
                    Status: {cust.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {/* Step 1 */}
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-label-11 font-mono font-bold text-(--ds-blue-700)">TAHAP 1</span>
                      <Badge variant="blue-subtle" size="sm">Bag. Langganan</Badge>
                    </div>
                    <div className="font-semibold text-copy-13 text-foreground">Order Pemutusan</div>
                    <p className="text-copy-12 text-muted-foreground">
                      Pelanggan bawa KTP & Surat Bermaterai ➔ Admin buat order pemutusan.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-label-11 font-mono font-bold text-(--ds-amber-700)">TAHAP 2</span>
                      <Badge variant="amber-subtle" size="sm">Zona / Distribusi</Badge>
                    </div>
                    <div className="font-semibold text-copy-13 text-foreground">Eksekusi Lapangan</div>
                    <p className="text-copy-12 text-muted-foreground">
                      Petugas cabut meter/segel fisik, catat stand angkat akhir & foto bukti.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3 rounded-lg border border-border bg-card space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-label-11 font-mono font-bold text-(--ds-green-700)">TAHAP 3</span>
                      <Badge variant="green-subtle" size="sm">Manager Langganan</Badge>
                    </div>
                    <div className="font-semibold text-copy-13 text-foreground">Pengesahan Final</div>
                    <p className="text-copy-12 text-muted-foreground">
                      Manager Langganan verifikasi bukti eksekusi & sahkan status di master.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Interaktif Sesuai Tahap */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Kolom 1: Aksi Tahap 1 - Order Langganan */}
                <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <span className="font-mono text-label-12 font-bold text-(--ds-blue-800) bg-(--ds-blue-100) size-6 rounded-full flex items-center justify-center shrink-0">1</span>
                      <h4 className="font-semibold text-copy-13 text-foreground">Terbitkan Order Pemutusan</h4>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-label-12 font-medium">Tipe Pemutusan</Label>
                      <Select value={tipePemutusan} onValueChange={(v: any) => setTipePemutusan(v)}>
                        <SelectTrigger className="h-9 text-copy-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEMENTARA">Sementara (Segel Keran Dinas)</SelectItem>
                          <SelectItem value="PERMANEN">Permanen (Cabut Water Meter)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-label-12 font-medium">Alasan Pemutusan</Label>
                      <Select value={alasanPemutusan} onValueChange={setAlasanPemutusan}>
                        <SelectTrigger className="h-9 text-copy-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALASAN_PEMUTUSAN.map((a) => (
                            <SelectItem key={a} value={a} className="text-copy-12">{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="ktpPemohon" className="text-label-12 font-medium">No. KTP Pemohon *</Label>
                      <Input
                        id="ktpPemohon"
                        value={noKtpPemohonPemutusan}
                        onChange={(e) => setNoKtpPemohonPemutusan(e.target.value)}
                        placeholder="3273xxxxxxxxxxxx"
                        className="h-9 text-copy-12 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="suratBermaterai" className="text-label-12 font-medium">No. Surat Permohonan Bermaterai *</Label>
                      <Input
                        id="suratBermaterai"
                        value={suratPermohonanBermaterai}
                        onChange={(e) => setSuratPermohonanBermaterai(e.target.value)}
                        placeholder="Contoh: SR-MATERAI-2026/041"
                        className="h-9 text-copy-12 font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setConfirmType('ORDER_PEMUTUSAN');
                      setConfirmOpen(true);
                    }}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Send className="size-3.5" />
                    <span>Terbitkan Order ke Zona</span>
                  </Button>
                </div>

                {/* Kolom 2: Aksi Tahap 2 - Eksekusi Lapangan Zona/Distribusi */}
                <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <span className="font-mono text-label-12 font-bold text-(--ds-amber-800) bg-(--ds-amber-100) size-6 rounded-full flex items-center justify-center shrink-0">2</span>
                      <h4 className="font-semibold text-copy-13 text-foreground">Laporan Eksekusi Zona</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="tglEksekusi" className="text-label-12 font-medium">Tgl Eksekusi</Label>
                        <Input
                          id="tglEksekusi"
                          type="date"
                          value={tglEksekusiFisik}
                          onChange={(e) => setTglEksekusiFisik(e.target.value)}
                          className="h-9 text-copy-12 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="standAngkat" className="text-label-12 font-medium">Stand Angkat (m³)</Label>
                        <Input
                          id="standAngkat"
                          type="number"
                          value={standAngkat}
                          onChange={(e) => setStandAngkat(Number(e.target.value))}
                          className="h-9 text-copy-12 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="noSegel" className="text-label-12 font-medium">No. Segel / Seri Meter Angkat</Label>
                      <Input
                        id="noSegel"
                        value={noSegelPasang}
                        onChange={(e) => setNoSegelPasang(e.target.value)}
                        placeholder="Contoh: SEGAL-MERAH-0941"
                        className="h-9 text-copy-12 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="teknisiZona" className="text-label-12 font-medium">Petugas Teknisi Distribusi</Label>
                      <Input
                        id="teknisiZona"
                        value={petugasTeknisiZona}
                        onChange={(e) => setPetugasTeknisiZona(e.target.value)}
                        placeholder="Nama petugas lapangan..."
                        className="h-9 text-copy-12"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="fotoBukti" className="text-label-12 font-medium">File Bukti Foto Meter</Label>
                      <Input
                        id="fotoBukti"
                        value={fotoBuktiEksekusi}
                        onChange={(e) => setFotoBuktiEksekusi(e.target.value)}
                        placeholder="foto-segel-lapangan.jpg"
                        className="h-9 text-copy-12 font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setConfirmType('EKSEKUSI_ZONA');
                      setConfirmOpen(true);
                    }}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 text-(--ds-amber-800)"
                  >
                    <Wrench className="size-3.5" />
                    <span>Kirim Hasil Eksekusi Fisik</span>
                  </Button>
                </div>

                {/* Kolom 3: Aksi Tahap 3 - Pengesahan Manager Langganan */}
                <div className="p-4 rounded-lg border border-(--ds-green-300) bg-(--ds-green-100)/20 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                      <span className="font-mono text-label-12 font-bold text-(--ds-green-800) bg-(--ds-green-100) size-6 rounded-full flex items-center justify-center shrink-0">3</span>
                      <h4 className="font-semibold text-copy-13 text-foreground">Verifikasi Manager Langganan</h4>
                    </div>

                    <div className="p-2.5 rounded bg-background border border-border text-copy-12 space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Otoritas Pengesahan:</span>
                        <Badge variant="green-subtle" size="sm">Manager Langganan</Badge>
                      </div>
                      <p className="text-foreground">
                        Hanya <strong>Manager Langganan</strong> (Ibu Rieskha) atau Superadmin yang berhak meresmikan penutupan dinas dan mengubah status master pelanggan.
                      </p>
                    </div>

                    <div className="space-y-1 text-copy-12 text-muted-foreground">
                      <span className="font-medium text-foreground">Tindakan Pengesahan:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Mengubah status master menjadi <strong>{tipePemutusan === 'SEMENTARA' ? 'SEGEL SEMENTARA' : 'CABUT METER'}</strong>.</li>
                        <li>Mengunci stand angkat terakhir untuk kalkulasi DRD final.</li>
                        <li>Mencatat berita acara hukum pemutusan dinas.</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setConfirmType('PENGESAHAN_MANAGER');
                      setConfirmOpen(true);
                    }}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 bg-(--ds-green-700) hover:bg-(--ds-green-800) text-white"
                  >
                    <ShieldCheck className="size-4" />
                    <span>Sahkan Pemutusan Resmi</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Mutasi Wilayah, Rute & Titik GPS Geospasial */}
            <TabsContent value="wilayah-gps" className="space-y-4 pt-4">
              <div className="p-3.5 rounded-md bg-(--ds-blue-100) border border-(--ds-blue-300) text-(--ds-blue-900) text-copy-12 flex items-start gap-2.5">
                <Info className="size-4 shrink-0 mt-0.5 text-(--ds-blue-700)" />
                <div>
                  <span className="font-semibold block">SOP Mutasi Pelanggan ke Wilayah / Rute Lain:</span>
                  Mutasi pelanggan antar wilayah pelayanan dilakukan saat terjadi pemekaran zona distribusi, penataan DMA, efisiensi rute baca meter, atau permohonan pemindahan sambungan fisik. Seluruh perubahan rute, nomor urut baru, alamat, dan titik koordinat GPS fisik wajib dicatat ke berita acara resmi.
                </div>
              </div>

              {/* Seksi 1: Pemindahan Wilayah & Rute Pelayanan */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <Navigation className="size-4 text-(--ds-blue-700)" />
                    1. Pemindahan Wilayah Pelayanan & Rute Catat Meter
                  </span>
                  <Badge variant="blue-subtle" size="sm">
                    Rute Asal: <strong className="font-mono ml-1">{cust.ruteKode ?? '-'}</strong>
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-label-12 font-medium">Rute / Wilayah Tujuan Baru *</Label>
                    <Select value={ruteBaruKode} onValueChange={setRuteBaruKode}>
                      <SelectTrigger className="h-9 text-copy-12">
                        <SelectValue placeholder="Pilih rute tujuan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ruteList.map((r) => (
                          <SelectItem key={r.kode} value={r.kode} className="text-copy-12">
                            {r.kode} - {r.nama || r.kode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="noUrutBaru" className="text-label-12 font-medium">
                      Nomor Urut Rute Baru
                    </Label>
                    <Input
                      id="noUrutBaru"
                      type="number"
                      min={1}
                      value={noUrutRuteBaru}
                      onChange={(e) => setNoUrutRuteBaru(e.target.value)}
                      placeholder="Contoh: 15"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-label-12 font-medium">Alasan Mutasi Wilayah *</Label>
                    <Select value={alasanMutasiWilayah} onValueChange={setAlasanMutasiWilayah}>
                      <SelectTrigger className="h-9 text-copy-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pemekaran & Penataan Zona Pelayanan">Pemekaran & Penataan Zona Pelayanan</SelectItem>
                        <SelectItem value="Penataan Batas DMA Distribusi">Penataan Batas DMA Distribusi</SelectItem>
                        <SelectItem value="Optimalisasi Rute Pembacaan Meter">Optimalisasi Rute Pembacaan Meter</SelectItem>
                        <SelectItem value="Permohonan Pindah Domisili Persil">Permohonan Pindah Domisili Persil</SelectItem>
                        <SelectItem value="Koreksi Salah Wilayah Awal">Koreksi Salah Wilayah Awal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="noSuratWilayah" className="text-label-12 font-medium">
                      Nomor SK / Berita Acara Mutasi Wilayah
                    </Label>
                    <Input
                      id="noSuratWilayah"
                      value={noSuratMutasiWilayah}
                      onChange={(e) => setNoSuratMutasiWilayah(e.target.value)}
                      placeholder="Contoh: SK-MUTASI-WIL/2026/08"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Pemutakhiran Alamat & Titik Koordinat GPS */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="size-4 text-(--ds-green-700)" />
                    2. Pemutakhiran Alamat & Titik Koordinat GPS Fisik
                  </span>
                  {cust.titikLokasi ? (
                    <Badge variant="green-subtle" size="sm">Sudah Ada Koordinat</Badge>
                  ) : (
                    <Badge variant="amber-subtle" size="sm">Belum Ada Titik GPS</Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="alamatBaru" className="text-label-12 font-medium">
                    Alamat Lengkap (Jalan / Gang / No. Rumah) *
                  </Label>
                  <Input
                    id="alamatBaru"
                    value={alamatBaru}
                    onChange={(e) => setAlamatBaru(e.target.value)}
                    placeholder="Nama jalan, nomor rumah di wilayah baru..."
                    className="h-9 text-copy-12 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="rt" className="text-label-12 font-medium">RT</Label>
                    <Input
                      id="rt"
                      value={rtBaru}
                      onChange={(e) => setRtBaru(e.target.value)}
                      placeholder="001"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rw" className="text-label-12 font-medium">RW</Label>
                    <Input
                      id="rw"
                      value={rwBaru}
                      onChange={(e) => setRwBaru(e.target.value)}
                      placeholder="002"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lat" className="text-label-12 font-medium">Latitude GPS</Label>
                    <Input
                      id="lat"
                      value={latGps}
                      onChange={(e) => setLatGps(e.target.value)}
                      placeholder="-6.9175"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lng" className="text-label-12 font-medium">Longitude GPS</Label>
                    <Input
                      id="lng"
                      value={lngGps}
                      onChange={(e) => setLngGps(e.target.value)}
                      placeholder="107.6191"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDapatkanGpsPerangkat}
                    className="flex items-center gap-1.5 text-label-12"
                  >
                    <Navigation className="size-3.5 text-(--ds-blue-700)" />
                    <span>Ambil GPS Lokasi Perangkat Ini</span>
                  </Button>

                  {latGps && lngGps && (
                    <a
                      href={`https://www.google.com/maps?q=${latGps},${lngGps}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-label-12 text-(--ds-blue-700) hover:underline inline-flex items-center gap-1"
                    >
                      <span>Cek Koordinat di Google Maps</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setConfirmType('MUTASI_WILAYAH_GPS');
                    setConfirmOpen(true);
                  }}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-(--ds-green-700) hover:bg-(--ds-green-800) text-white"
                >
                  <Check className="size-4" />
                  <span>Sahkan Mutasi Wilayah & Titik GPS ke Database</span>
                </Button>
              </div>
            </TabsContent>

            {/* TAB 4: Riwayat Berita Acara & Audit Trail */}
            <TabsContent value="histori" className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Histori Berita Acara & Perubahan Data Resmi
                </span>
                <span className="text-label-11 text-muted-foreground font-mono">
                  {historiLogLines.length} catatan tersimpan
                </span>
              </div>

              {historiLogLines.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-copy-13">
                  Belum ada catatan mutasi atau berita acara untuk pelanggan ini.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historiLogLines.map((log: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-3 text-copy-12"
                    >
                      <span className="font-mono text-label-11 font-bold text-muted-foreground shrink-0 mt-0.5">
                        #{historiLogLines.length - idx}
                      </span>
                      <div className="space-y-0.5 flex-1 font-mono text-foreground">
                        {log}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Tindakan */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-heading-18">
              <AlertTriangle className="size-5 text-(--ds-amber-700)" />
              {confirmType === 'BALIK_NAMA' && 'Konfirmasi Pengesahan Balik Nama'}
              {confirmType === 'ORDER_PEMUTUSAN' && 'Konfirmasi Order Pemutusan ke Zona'}
              {confirmType === 'EKSEKUSI_ZONA' && 'Konfirmasi Kirim Hasil Eksekusi Zona'}
              {confirmType === 'PENGESAHAN_MANAGER' && 'Konfirmasi Pengesahan Akhir Pemutusan'}
              {confirmType === 'MUTASI_WILAYAH_GPS' && 'Konfirmasi Mutasi Wilayah & Titik GPS'}
            </DialogTitle>
            <DialogDescription className="text-copy-13 text-muted-foreground">
              Pastikan rincian dokumen dan tindakan telah diverifikasi sesuai regulasi pelayanan PDAM Tirtawening.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 p-3.5 rounded-lg bg-muted/30 border border-border space-y-2 text-copy-13">
            <div className="flex justify-between items-center font-semibold text-foreground">
              <span>{cust?.nama}</span>
              <span className="font-mono text-label-12 text-(--ds-blue-800) bg-(--ds-blue-100) px-2 py-0.5 rounded">
                {cust?.nolg}
              </span>
            </div>

            <div className="pt-2 border-t border-border space-y-1.5 text-copy-12">
              {confirmType === 'BALIK_NAMA' && (
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground">Peralihan Nama: </span>
                    <span className="font-semibold text-foreground">{cust?.nama} ➔ {namaBaru}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NIK Pemilik Baru: </span>
                    <span className="font-mono font-medium text-foreground">{nikKtpBaru}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dokumen Bukti Sah: </span>
                    <span className="font-medium text-foreground">{jenisDokumen} (No: {noDokumen || '-'})</span>
                  </div>
                </div>
              )}

              {confirmType === 'ORDER_PEMUTUSAN' && (
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground">Tipe Pemutusan: </span>
                    <span className="font-semibold text-foreground">{tipePemutusan === 'SEMENTARA' ? 'Segel Keran Sementara' : 'Cabut Water Meter'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Alasan: </span>
                    <span className="text-foreground">{alasanPemutusan}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dokumen Syarat: </span>
                    <span className="text-foreground">KTP ({noKtpPemohonPemutusan || '-'}) & Surat Bermaterai</span>
                  </div>
                </div>
              )}

              {confirmType === 'EKSEKUSI_ZONA' && (
                <div className="space-y-1">
                  <div>
                    <span className="text-muted-foreground">Stand Angkat Akhir: </span>
                    <span className="font-mono font-bold text-foreground">{standAngkat} m³</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Teknisi Lapangan: </span>
                    <span className="font-medium text-foreground">{petugasTeknisiZona}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tgl Eksekusi: </span>
                    <span className="font-mono text-foreground">{tglEksekusiFisik}</span>
                  </div>
                </div>
              )}

              {confirmType === 'PENGESAHAN_MANAGER' && (
                <div className="space-y-1">
                  <div className="p-2 rounded bg-(--ds-green-100) text-(--ds-green-900) font-semibold">
                    Status Pelanggan akan diubah resmi menjadi: {tipePemutusan === 'SEMENTARA' ? 'SEGEL SEMENTARA' : 'CABUT METER'}
                  </div>
                  <p className="text-muted-foreground">
                    Tindakan ini akan mengesahkan pemutusan sambungan secara permanen pada master data dan menutup pembacaan meter.
                  </p>
                </div>
              )}

              {confirmType === 'MUTASI_WILAYAH_GPS' && (
                <div className="space-y-1">
                  {ruteBaruKode && (
                    <div>
                      <span className="text-muted-foreground">Rute Baru: </span>
                      <span className="font-mono font-semibold text-foreground">{ruteBaruKode} {noUrutRuteBaru ? `(Urut #${noUrutRuteBaru})` : ''}</span>
                    </div>
                  )}
                  {alamatBaru && (
                    <div>
                      <span className="text-muted-foreground">Alamat Baru: </span>
                      <span className="font-semibold text-foreground">{alamatBaru} (RT {rtBaru || '-'} / RW {rwBaru || '-'})</span>
                    </div>
                  )}
                  {latGps && lngGps && (
                    <div>
                      <span className="text-muted-foreground">Koordinat: </span>
                      <span className="font-mono text-foreground">{latGps}, {lngGps}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleExecuteAction}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Terapkan & Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
