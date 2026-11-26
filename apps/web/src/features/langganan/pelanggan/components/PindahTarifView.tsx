'use client';

import * as React from 'react';
import {
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  FileText,
  UserCheck,
  Calculator,
  Loader2,
  Info,
  Clock,
  ShieldCheck,
  ClipboardList,
  Check,
  Eye,
  FileCheck,
  Upload,
  Calendar,
  XCircle,
  HelpCircle,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import type {
  DetailPelangganResponse,
  GolonganTarifItem,
  SimulasiTagihanData,
} from '../types';
import { SimulasiDampakTarif } from './SimulasiDampakTarif';

const ALASAN_PINDAH_TARIF = [
  'Alih fungsi bangunan menjadi tempat usaha / niaga',
  'Alih fungsi tempat usaha kembali menjadi hunian rumah tangga',
  'Penyesuaian hasil audit / verifikasi berkala petugas cater',
  'Permohonan mandiri pelanggan (MBR / Non-MBR)',
  'Koreksi salah input master awal',
  'Penyesuaian peruntukan sosial / tempat ibadah',
  'Lainnya (tercatat pada Berita Acara Survei)',
];

export function PindahTarifView() {
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  // Selected Customer detail state
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [detailData, setDetailData] = React.useState<DetailPelangganResponse['data'] | null>(null);

  // Master Golongan Tarif
  const [golonganList, setGolonganList] = React.useState<GolonganTarifItem[]>([]);
  const [loadingGolongan, setLoadingGolongan] = React.useState(false);

  // Active Workflow Step: 'tahap-1' | 'tahap-2' | 'tahap-3' | 'riwayat'
  const [activeTab, setActiveTab] = React.useState('tahap-1');

  // FORM TAHAP 1: Pengajuan Loket Langganan
  const [noSuratPermohonan, setNoSuratPermohonan] = React.useState('');
  const [namaPemohon, setNamaPemohon] = React.useState('');
  const [nikPemohon, setNikPemohon] = React.useState('');
  const [noHpPemohon, setNoHpPemohon] = React.useState('');
  const [usulanTarifKode, setUsulanTarifKode] = React.useState('');
  const [alasanKategori, setAlasanKategori] = React.useState(ALASAN_PINDAH_TARIF[0]);
  const [syaratKtpTerlampir, setSyaratKtpTerlampir] = React.useState(true);
  const [syaratPbbTerlampir, setSyaratPbbTerlampir] = React.useState(true);
  const [syaratSuratBermaterai, setSyaratSuratBermaterai] = React.useState(true);

  // FORM TAHAP 2: Berita Acara Survei Lapangan
  const [petugasSurvei, setPetugasSurvei] = React.useState('Tim Survei & Verifikasi Langganan');
  const [tglSurvei, setTglSurvei] = React.useState(new Date().toISOString().slice(0, 10));
  const [kondisiFisikAktual, setKondisiFisikAktual] = React.useState(
    'Fisik bangunan telah diverifikasi di lapangan. Terdapat aktivitas usaha dengan kran air aktif.'
  );
  const [kesimpulanSurvei, setKesimpulanSurvei] = React.useState<'DISETUJUI' | 'DISETUJUI_ALTERNATIF' | 'DITOLAK'>('DISETUJUI');
  const [rekomendasiTarifKode, setRekomendasiTarifKode] = React.useState('');
  const [fotoBuktiSurvei, setFotoBuktiSurvei] = React.useState('BA-Survei-Foto-Fisik.jpg');

  // FORM TAHAP 3: Otorisasi & Eksekusi (Manager Langganan)
  const [catatanOtorisasi, setCatatanOtorisasi] = React.useState('');
  const [volumeSimulasi, setVolumeSimulasi] = React.useState<number>(15);

  // Simulation results
  const [simulasiLama, setSimulasiLama] = React.useState<SimulasiTagihanData | null>(null);
  const [simulasiBaru, setSimulasiBaru] = React.useState<SimulasiTagihanData | null>(null);
  const [loadingSimulasi, setLoadingSimulasi] = React.useState(false);

  // Confirmation modal
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Muat master golongan tarif saat mount
  React.useEffect(() => {
    setLoadingGolongan(true);
    pelangganApi
      .getGolonganTarif()
      .then(setGolonganList)
      .catch((err) => toast.error('Gagal memuat master golongan tarif: ' + err.message))
      .finally(() => setLoadingGolongan(false));
  }, []);

  // Debounced Search Pelanggan
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

  // Pilih pelanggan dari pencarian
  const handlePilihPelanggan = async (nolg: string) => {
    try {
      setLoadingDetail(true);
      setSearchResults([]);
      setSearchQuery('');
      const data = await pelangganApi.getDetail(nolg);
      setDetailData(data);

      if (data?.pelanggan) {
        const p = data.pelanggan;
        setNamaPemohon(p.nama);
        setNoHpPemohon(p.noTelp ?? '');
        setNikPemohon('');
        setNoSuratPermohonan(`SR-LANG/${new Date().getFullYear()}/${p.nolg}`);
        setUsulanTarifKode('');
        setRekomendasiTarifKode('');
        setCatatanOtorisasi('');
        setActiveTab('tahap-1');
      }

      // Hitung rata-rata pemakaian dari histori pembacaan
      if (data?.riwayatBaca && data.riwayatBaca.length > 0) {
        const totalPakai = data.riwayatBaca.reduce(
          (acc, curr) => acc + (Number(curr.pakaiM3) || 0),
          0
        );
        const avg = Math.round(totalPakai / data.riwayatBaca.length);
        setVolumeSimulasi(Math.max(1, avg));
      } else {
        setVolumeSimulasi(15);
      }

      setSimulasiLama(null);
      setSimulasiBaru(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat profil pelanggan');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Tarif target yang akan dievaluasi pada simulasi dan eksekusi
  const finalTarifTargetKode = kesimpulanSurvei === 'DISETUJUI_ALTERNATIF' && rekomendasiTarifKode
    ? rekomendasiTarifKode
    : usulanTarifKode;

  // Jalankan simulasi ketika target tarif atau volume berubah
  React.useEffect(() => {
    const tarifLama = detailData?.pelanggan.tarifKode;
    if (!tarifLama || !finalTarifTargetKode || volumeSimulasi <= 0) {
      setSimulasiLama(null);
      setSimulasiBaru(null);
      return;
    }

    let active = true;
    setLoadingSimulasi(true);

    Promise.all([
      pelangganApi.hitungSimulasi(tarifLama, volumeSimulasi),
      pelangganApi.hitungSimulasi(finalTarifTargetKode, volumeSimulasi),
    ])
      .then(([lama, baru]) => {
        if (active) {
          setSimulasiLama(lama);
          setSimulasiBaru(baru);
        }
      })
      .catch((err) => {
        if (active) {
          toast.error('Gagal menghitung simulasi: ' + err.message);
        }
      })
      .finally(() => {
        if (active) setLoadingSimulasi(false);
      });

    return () => {
      active = false;
    };
  }, [detailData?.pelanggan.tarifKode, finalTarifTargetKode, volumeSimulasi]);

  // Eksekusi Otorisasi & Pindah Tarif (Manager Langganan)
  const handleEksekusiOtorisasi = async () => {
    if (!detailData?.pelanggan.nolg || !finalTarifTargetKode) return;

    if (kesimpulanSurvei === 'DITOLAK') {
      toast.error('Pengajuan tidak dapat dieksekusi karena hasil kesimpulan survei fisik DITOLAK');
      return;
    }

    try {
      setSubmitting(true);
      const res = await pelangganApi.updateTarif(detailData.pelanggan.nolg, finalTarifTargetKode, {
        alasan: alasanKategori,
        noSuratPermohonan: noSuratPermohonan.trim() || undefined,
        nikPemohon: nikPemohon.trim() || undefined,
        namaPemohon: namaPemohon.trim() || undefined,
        noHpPemohon: noHpPemohon.trim() || undefined,
        tahapPindahTarif: 'OTORISASI_MANAGER_LANGGANAN',
        petugasSurvei: petugasSurvei.trim() || undefined,
        tglSurvei,
        kesimpulanSurvei: kesimpulanSurvei === 'DISETUJUI'
          ? 'Disetujui Sesuai Usulan'
          : 'Disetujui Dengan Tarif Alternatif',
        fotoSurveiUrl: fotoBuktiSurvei.trim() || undefined,
        catatan: catatanOtorisasi.trim() || undefined,
      });

      toast.success(res.message || 'Golongan tarif berhasil diotorisasi dan diperbarui!');
      setConfirmOpen(false);

      // Refresh detail profil pelanggan
      const updated = await pelangganApi.getDetail(detailData.pelanggan.nolg);
      setDetailData(updated);
      setActiveTab('riwayat');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah golongan tarif');
    } finally {
      setSubmitting(false);
    }
  };

  const cust = detailData?.pelanggan;
  const tarifLamaObj = golonganList.find((g) => g.kode === cust?.tarifKode);
  const tarifTargetObj = golonganList.find((g) => g.kode === finalTarifTargetKode);

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
          Pindah Tarif & Reklasifikasi Pelanggan
        </h1>
        <p className="text-copy-13 text-muted-foreground mt-0.5">
          Alur 3-tahap resmi: Pengajuan Loket Langganan ➔ Berita Acara Survei Lapangan ➔ Otorisasi & Simulasi Dampak Tagihan Manager.
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
              placeholder="Ketik Nomor Langganan (NOLG), NPRS, Nama, atau Alamat..."
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
                      Tarif: {res.tarifKode ?? '-'}
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
            <span>Memuat profil pelanggan terpilih...</span>
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
                variant={cust.status === 'PELANGGAN AKTIF' ? 'green-subtle' : 'gray-subtle'}
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
                <span className="text-muted-foreground">Golongan Tarif Saat Ini:</span>
                <p className="font-mono font-bold text-foreground mt-0.5">
                  {cust.tarifKode ?? '-'} {tarifLamaObj?.nama ? `(${tarifLamaObj.nama})` : ''}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Rata-rata Konsumsi Air:</span>
                <p className="font-mono font-medium text-foreground mt-0.5">
                  {volumeSimulasi} m³ / bulan
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Kontak Pemilik:</span>
                <p className="font-mono font-medium text-foreground mt-0.5">
                  {cust.noTelp ?? '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bagian 2: Workflow 3-Tahap Pindah Tarif */}
      {cust && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-xs">
          {/* Stepper Header Visualizer */}
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Stepper Card 1 */}
              <button
                type="button"
                onClick={() => setActiveTab('tahap-1')}
                className={cn(
                  'text-left p-3 rounded-lg border transition-all cursor-pointer',
                  activeTab === 'tahap-1'
                    ? 'border-(--ds-blue-600) bg-(--ds-blue-100)/50 shadow-xs ring-1 ring-(--ds-blue-600)'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-label-11 font-mono font-bold text-(--ds-blue-700)">TAHAP 1</span>
                  {usulanTarifKode ? (
                    <Badge variant="green-subtle" size="sm">Lengkap</Badge>
                  ) : (
                    <Badge variant="blue-subtle" size="sm">Loket Langganan</Badge>
                  )}
                </div>
                <div className="font-semibold text-copy-13 text-foreground mt-1">
                  Pengajuan Reklasifikasi
                </div>
                <p className="text-copy-12 text-muted-foreground mt-0.5 line-clamp-1">
                  Surat permohonan, data pemohon & usulan tarif.
                </p>
              </button>

              {/* Stepper Card 2 */}
              <button
                type="button"
                onClick={() => setActiveTab('tahap-2')}
                className={cn(
                  'text-left p-3 rounded-lg border transition-all cursor-pointer',
                  activeTab === 'tahap-2'
                    ? 'border-(--ds-amber-600) bg-(--ds-amber-100)/50 shadow-xs ring-1 ring-(--ds-amber-600)'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-label-11 font-mono font-bold text-(--ds-amber-700)">TAHAP 2</span>
                  {kesimpulanSurvei === 'DITOLAK' ? (
                    <Badge variant="red-subtle" size="sm">Ditolak</Badge>
                  ) : (
                    <Badge variant="amber-subtle" size="sm">Survei Lapangan</Badge>
                  )}
                </div>
                <div className="font-semibold text-copy-13 text-foreground mt-1">
                  Berita Acara Survei
                </div>
                <p className="text-copy-12 text-muted-foreground mt-0.5 line-clamp-1">
                  Verifikasi fisik, foto bukti & rekomendasi teknis.
                </p>
              </button>

              {/* Stepper Card 3 */}
              <button
                type="button"
                onClick={() => setActiveTab('tahap-3')}
                className={cn(
                  'text-left p-3 rounded-lg border transition-all cursor-pointer',
                  activeTab === 'tahap-3'
                    ? 'border-(--ds-green-600) bg-(--ds-green-100)/50 shadow-xs ring-1 ring-(--ds-green-600)'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-label-11 font-mono font-bold text-(--ds-green-700)">TAHAP 3</span>
                  <Badge variant="green-subtle" size="sm">Manager Langganan</Badge>
                </div>
                <div className="font-semibold text-copy-13 text-foreground mt-1">
                  Otorisasi & Simulasi
                </div>
                <p className="text-copy-12 text-muted-foreground mt-0.5 line-clamp-1">
                  Komparasi tagihan air & pengesahan final database.
                </p>
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <TabsList className="bg-muted">
                <TabsTrigger value="tahap-1" className="text-label-12 flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  <span>1. Pengajuan Loket</span>
                </TabsTrigger>
                <TabsTrigger value="tahap-2" className="text-label-12 flex items-center gap-1.5">
                  <ClipboardList className="size-3.5" />
                  <span>2. Berita Acara Survei</span>
                </TabsTrigger>
                <TabsTrigger value="tahap-3" className="text-label-12 flex items-center gap-1.5">
                  <Calculator className="size-3.5" />
                  <span>3. Otorisasi & Simulasi</span>
                </TabsTrigger>
                <TabsTrigger value="riwayat" className="text-label-12 flex items-center gap-1.5">
                  <History className="size-3.5" />
                  <span>Riwayat Audit</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Pengajuan Loket Langganan */}
            <TabsContent value="tahap-1" className="space-y-4 pt-4">
              <div className="p-3.5 rounded-md bg-(--ds-blue-100) border border-(--ds-blue-300) text-(--ds-blue-900) text-copy-12 flex items-start gap-2.5">
                <Info className="size-4 shrink-0 mt-0.5 text-(--ds-blue-700)" />
                <div>
                  <span className="font-semibold block">SOP Tahap 1: Pengajuan Permohonan Reklasifikasi di Kantor Langganan</span>
                  Pelanggan mendatangi loket pelayanan langganan membawa persyaratan berkas (KTP pemohon, fotokopi PBB/bukti kepemilikan, dan surat permohonan tertulis). Admin loket menginput data registrasi pengajuan sebelum diteruskan ke tim survei fisik lapangan.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom Kiri: Registrasi Surat & Pemohon */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <h3 className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Data Permohonan & Identitas Pemohon
                  </h3>

                  <div className="space-y-1">
                    <Label htmlFor="noSurat" className="text-label-12 font-medium">Nomor Agenda Surat Permohonan</Label>
                    <Input
                      id="noSurat"
                      value={noSuratPermohonan}
                      onChange={(e) => setNoSuratPermohonan(e.target.value)}
                      placeholder="Contoh: SR-LANG/2026/049"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="namaPemohon" className="text-label-12 font-medium">Nama Pemohon</Label>
                      <Input
                        id="namaPemohon"
                        value={namaPemohon}
                        onChange={(e) => setNamaPemohon(e.target.value)}
                        placeholder="Nama lengkap pemohon..."
                        className="h-9 text-copy-12"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="nikPemohon" className="text-label-12 font-medium">NIK KTP (16 Digit)</Label>
                      <Input
                        id="nikPemohon"
                        value={nikPemohon}
                        onChange={(e) => setNikPemohon(e.target.value)}
                        placeholder="3273xxxxxxxxxxxx"
                        maxLength={16}
                        className="h-9 text-copy-12 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="noHpPemohon" className="text-label-12 font-medium">No. Handphone / WhatsApp Pemohon</Label>
                    <Input
                      id="noHpPemohon"
                      value={noHpPemohon}
                      onChange={(e) => setNoHpPemohon(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>
                </div>

                {/* Kolom Kanan: Usulan Tarif & Persyaratan Dokumen */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <h3 className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    Usulan Golongan Tarif & Verifikasi Berkas
                  </h3>

                  <div className="space-y-1">
                    <Label className="text-label-12 font-medium">Usulan Golongan Tarif Baru *</Label>
                    <Select value={usulanTarifKode} onValueChange={setUsulanTarifKode}>
                      <SelectTrigger className="h-9 text-copy-12">
                        <SelectValue placeholder="Pilih Usulan Tarif Baru" />
                      </SelectTrigger>
                      <SelectContent>
                        {golonganList
                          .filter((g) => g.kode !== cust.tarifKode)
                          .map((g) => (
                            <SelectItem key={g.kode} value={g.kode} className="text-copy-12">
                              {g.kode} - {g.nama}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-label-12 font-medium">Alasan Pengajuan Pindah Tarif</Label>
                    <Select value={alasanKategori} onValueChange={setAlasanKategori}>
                      <SelectTrigger className="h-9 text-copy-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALASAN_PINDAH_TARIF.map((alasan) => (
                          <SelectItem key={alasan} value={alasan} className="text-copy-12">
                            {alasan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Checklist Berkas Fisik */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <Label className="text-label-12 font-medium text-foreground">
                      Kelengkapan Berkas Fisik yang Diterima Loket:
                    </Label>
                    <div className="space-y-1.5 text-copy-12">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syaratKtpTerlampir}
                          onChange={(e) => setSyaratKtpTerlampir(e.target.checked)}
                          className="size-3.5 rounded border-gray-300 text-primary"
                        />
                        <span>Fotokopi KTP Pemohon Asli Terlampir</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syaratPbbTerlampir}
                          onChange={(e) => setSyaratPbbTerlampir(e.target.checked)}
                          className="size-3.5 rounded border-gray-300 text-primary"
                        />
                        <span>Bukti Lunas PBB Terakhir / Surat Perjanjian Sewa</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syaratSuratBermaterai}
                          onChange={(e) => setSyaratSuratBermaterai(e.target.checked)}
                          className="size-3.5 rounded border-gray-300 text-primary"
                        />
                        <span>Surat Permohonan Tertulis Bermaterai</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (!usulanTarifKode) {
                      toast.error('Silakan pilih usulan golongan tarif baru terlebih dahulu');
                      return;
                    }
                    setActiveTab('tahap-2');
                    toast.success('Pengajuan tahap 1 disimpan. Lanjutkan ke Berita Acara Survei Lapangan.');
                  }}
                  className="flex items-center gap-2"
                >
                  <span>Lanjut ke Tahap 2: Berita Acara Survei</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: Berita Acara Survei Lapangan */}
            <TabsContent value="tahap-2" className="space-y-4 pt-4">
              <div className="p-3.5 rounded-md bg-(--ds-amber-100) border border-(--ds-amber-300) text-(--ds-amber-900) text-copy-12 flex items-start gap-2.5">
                <Info className="size-4 shrink-0 mt-0.5 text-(--ds-amber-700)" />
                <div>
                  <span className="font-semibold block">SOP Tahap 2: Verifikasi Fisik oleh Tim Survei Lapangan</span>
                  Tim survei mengunjungi lokasi pelanggan untuk memverifikasi kesesuaian fisik bangunan, kran air, usaha niaga/rumah tinggal, dan kondisi meter air aktual. Hasil dituangkan dalam Berita Acara Survei Lapangan.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kolom Kiri: Pelaksana Survei & Temuan Fisik */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <h3 className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <ClipboardList className="size-4 text-(--ds-amber-700)" />
                    Pelaksanaan Survei & Verifikasi Fisik
                  </h3>

                  <div className="space-y-1">
                    <Label htmlFor="petugasSurvei" className="text-label-12 font-medium">Petugas / Tim Survei Lapangan</Label>
                    <Input
                      id="petugasSurvei"
                      value={petugasSurvei}
                      onChange={(e) => setPetugasSurvei(e.target.value)}
                      placeholder="Nama petugas pemeriksa lapangan..."
                      className="h-9 text-copy-12"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="tglSurvei" className="text-label-12 font-medium">Tanggal Pelaksanaan Survei</Label>
                    <Input
                      id="tglSurvei"
                      type="date"
                      value={tglSurvei}
                      onChange={(e) => setTglSurvei(e.target.value)}
                      className="h-9 text-copy-12 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="kondisiFisik" className="text-label-12 font-medium">Deskripsi Hasil Temuan Fisik Lapangan</Label>
                    <Textarea
                      id="kondisiFisik"
                      value={kondisiFisikAktual}
                      onChange={(e) => setKondisiFisikAktual(e.target.value)}
                      placeholder="Uraikan temuan fisik: jumlah kran, jenis usaha, luas bangunan..."
                      className="min-h-[85px] text-copy-12"
                    />
                  </div>
                </div>

                {/* Kolom Kanan: Kesimpulan Survei & Dokumentasi */}
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <h3 className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                    <FileCheck className="size-4 text-(--ds-green-700)" />
                    Kesimpulan & Rekomendasi Tarif
                  </h3>

                  <div className="space-y-1">
                    <Label className="text-label-12 font-medium">Kesimpulan Hasil Survei Lapangan *</Label>
                    <Select
                      value={kesimpulanSurvei}
                      onValueChange={(val: any) => setKesimpulanSurvei(val)}
                    >
                      <SelectTrigger className="h-9 text-copy-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DISETUJUI" className="text-copy-12">
                          Disetujui - Sesuai dengan Usulan Pelanggan ({usulanTarifKode || 'Tahap 1'})
                        </SelectItem>
                        <SelectItem value="DISETUJUI_ALTERNATIF" className="text-copy-12">
                          Disetujui Bersyarat - Dengan Rekomendasi Tarif Lain
                        </SelectItem>
                        <SelectItem value="DITOLAK" className="text-copy-12">
                          Ditolak - Tidak Sesuai Kriteria / Peruntukan
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {kesimpulanSurvei === 'DISETUJUI_ALTERNATIF' && (
                    <div className="space-y-1 p-2.5 rounded-md bg-(--ds-amber-100)/50 border border-(--ds-amber-300)">
                      <Label className="text-label-12 font-semibold text-(--ds-amber-900)">
                        Rekomendasi Golongan Tarif Koreksi *
                      </Label>
                      <Select
                        value={rekomendasiTarifKode}
                        onValueChange={setRekomendasiTarifKode}
                      >
                        <SelectTrigger className="h-8 text-copy-12 bg-background">
                          <SelectValue placeholder="Pilih tarif alternatif dari tim survei" />
                        </SelectTrigger>
                        <SelectContent>
                          {golonganList.map((g) => (
                            <SelectItem key={g.kode} value={g.kode} className="text-copy-12">
                              {g.kode} - {g.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="fotoSurvei" className="text-label-12 font-medium">
                      Dokumentasi Foto Bukti Fisik Lapangan
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="fotoSurvei"
                        value={fotoBuktiSurvei}
                        onChange={(e) => setFotoBuktiSurvei(e.target.value)}
                        placeholder="Nama berkas foto (contoh: survey-nolg-123.jpg)"
                        className="h-9 text-copy-12 font-mono"
                      />
                      <Button variant="outline" size="sm" type="button" className="h-9 px-2.5 shrink-0">
                        <Upload className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-md bg-muted/40 text-copy-12 text-muted-foreground">
                    Tarif Akhir Yang Diajukan ke Manager: <strong className="font-mono text-foreground">{finalTarifTargetKode || '(Belum dipilih)'}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('tahap-1')}
                >
                  Kembali ke Tahap 1
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (kesimpulanSurvei === 'DISETUJUI_ALTERNATIF' && !rekomendasiTarifKode) {
                      toast.error('Silakan tentukan rekomendasi golongan tarif koreksi');
                      return;
                    }
                    setActiveTab('tahap-3');
                    toast.success('Berita Acara Survei dicatat. Lanjutkan ke Otorisasi & Simulasi.');
                  }}
                  className="flex items-center gap-2"
                >
                  <span>Lanjut ke Tahap 3: Otorisasi Manager</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </TabsContent>

            {/* TAB 3: Otorisasi & Simulasi Dampak Tagihan (Manager Langganan) */}
            <TabsContent value="tahap-3" className="space-y-4 pt-4">
              <div className="p-3.5 rounded-md bg-(--ds-green-100) border border-(--ds-green-300) text-(--ds-green-900) text-copy-12 flex items-start gap-2.5">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-(--ds-green-700)" />
                <div>
                  <span className="font-semibold block">SOP Tahap 3: Otorisasi & Eksekusi Perubahan oleh Manager Langganan</span>
                  Manager Langganan memverifikasi kesesuaian dokumen permohonan dan berita acara survei, meninjau simulasi komparasi tagihan air pelanggan, serta mengesahkan status tarif baru ke database master.
                </div>
              </div>

              {/* Status Survei Banner */}
              {kesimpulanSurvei === 'DITOLAK' ? (
                <div className="p-4 rounded-lg bg-(--ds-red-100) border border-(--ds-red-300) text-(--ds-red-900) flex items-center gap-3">
                  <XCircle className="size-5 shrink-0 text-(--ds-red-700)" />
                  <div>
                    <span className="font-bold block text-copy-13">Pengajuan Ditolak Berdasarkan Hasil Survei</span>
                    <p className="text-copy-12 mt-0.5">
                      Tim survei lapangan menyatakan kondisi fisik tidak memenuhi syarat reklafikasi. Tombol eksekusi dinonaktifkan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg border border-border bg-card space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-2.5">
                    <span className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                      <Calculator className="size-4 text-primary" />
                      Parameter Simulasi Tagihan Air
                    </span>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="vol" className="text-label-12 text-muted-foreground">Volume Pemakaian:</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          id="vol"
                          type="number"
                          min={1}
                          max={5000}
                          value={volumeSimulasi}
                          onChange={(e) => setVolumeSimulasi(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 h-8 text-label-12 font-mono text-center"
                        />
                        <span className="text-label-12 font-mono text-muted-foreground">m³</span>
                      </div>
                    </div>
                  </div>

                  {/* Komparasi Simulasi Tagihan Air */}
                  {loadingSimulasi ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground text-copy-13">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      <span>Menghitung komparasi tarif dan blok progresif...</span>
                    </div>
                  ) : (
                    <SimulasiDampakTarif
                      simulasiLama={simulasiLama}
                      simulasiBaru={simulasiBaru}
                      volumeM3={volumeSimulasi}
                    />
                  )}
                </div>
              )}

              {/* Form Otorisasi Manager */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <h3 className="text-label-13 font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-(--ds-blue-700)" />
                  Catatan Otorisasi Manager Langganan
                </h3>

                <div className="space-y-1">
                  <Label htmlFor="catatanOtorisasi" className="text-label-12 font-medium">
                    Catatan Pengesahan / Dasar Surat Keputusan
                  </Label>
                  <Input
                    id="catatanOtorisasi"
                    value={catatanOtorisasi}
                    onChange={(e) => setCatatanOtorisasi(e.target.value)}
                    placeholder="Contoh: Disetujui sesuai BA Survei Lapangan No. 042/BA/2026. Golongan tarif resmi diubah."
                    className="h-9 text-copy-12"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('tahap-2')}
                >
                  Kembali ke Berita Acara Survei
                </Button>

                <Button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={
                    submitting ||
                    !finalTarifTargetKode ||
                    kesimpulanSurvei === 'DITOLAK' ||
                    finalTarifTargetKode === cust.tarifKode
                  }
                  className="flex items-center gap-2 bg-(--ds-green-700) hover:bg-(--ds-green-800) text-white"
                >
                  <Check className="size-4" />
                  <span>Sahkan & Mutasi Golongan Tarif Resmi</span>
                </Button>
              </div>
            </TabsContent>

            {/* TAB RIWAYAT: Histori & Audit Trail */}
            <TabsContent value="riwayat" className="space-y-4 pt-4">
              <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <History className="size-4 text-(--ds-blue-700)" />
                  <h3 className="text-label-13 font-semibold text-foreground">
                    Riwayat Audit Perubahan Reklasifikasi Pelanggan
                  </h3>
                </div>

                {historiLogLines.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-copy-13">
                    Belum ada riwayat mutasi tarif tercatat pada pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historiLogLines.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border bg-muted/20 text-copy-12 space-y-1 font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="blue-subtle" size="sm">
                            Entri #{historiLogLines.length - idx}
                          </Badge>
                          <span className="text-foreground font-semibold">{log}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Pengesahan Final */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-heading-18">
              <ShieldCheck className="size-5 text-(--ds-green-700)" />
              Konfirmasi Otorisasi Pindah Tarif
            </DialogTitle>
            <DialogDescription className="text-copy-13 text-muted-foreground">
              Apakah Anda yakin ingin mengesahkan pemindahan golongan tarif pelanggan ini secara permanen ke database?
            </DialogDescription>
          </DialogHeader>

          {cust && (
            <div className="my-2 p-3.5 rounded-lg border border-border bg-muted/30 space-y-2 text-copy-12">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pelanggan:</span>
                <span className="font-semibold text-foreground">{cust.nama} ({cust.nolg})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tarif Lama:</span>
                <span className="font-mono text-foreground font-bold">{cust.tarifKode ?? '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tarif Baru (Disetujui):</span>
                <Badge variant="green-subtle" size="sm" className="font-mono font-bold">
                  {finalTarifTargetKode} {tarifTargetObj?.nama ? `(${tarifTargetObj.nama})` : ''}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Petugas Survei:</span>
                <span className="text-foreground">{petugasSurvei} ({tglSurvei})</span>
              </div>
              {noSuratPermohonan && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">No. Surat Agenda:</span>
                  <span className="font-mono text-foreground">{noSuratPermohonan}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
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
              onClick={handleEksekusiOtorisasi}
              disabled={submitting}
              className="bg-(--ds-green-700) hover:bg-(--ds-green-800) text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  <span>Menyimpan Otorisasi...</span>
                </>
              ) : (
                <span>Ya, Sahkan & Eksekusi</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
