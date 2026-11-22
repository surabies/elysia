// features/dashboard/pengaturan/components/PengaturanPengaduanView.tsx
// Halaman Tata Kelola Kebijakan Standar Operasional Prosedur (SOP) Pengaduan Berversi (Policy as Data)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  History,
  FileCheck2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { NavigasiTabPengaduan } from '@/features/dashboard/pengaduan/components/NavigasiTabPengaduan';
import type { KebijakanConfig, KebijakanPengaduan } from '@cater/types';

export function PengaturanPengaduanView() {
  const router = useRouter();

  // State Kebijakan Aktif & Riwayat dari Backend
  const [kebijakanAktif, setKebijakanAktif] = React.useState<KebijakanPengaduan | null>(null);
  const [riwayat, setRiwayat] = React.useState<KebijakanPengaduan[]>([]);
  const [sedangMemuat, setSedangMemuat] = React.useState(true);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);

  // State Form Edit Parameter
  const [daruratResponsJam, setDaruratResponsJam] = React.useState(1);
  const [daruratSelesaiJam, setDaruratSelesaiJam] = React.useState(6);
  const [tinggiResponsJam, setTinggiResponsJam] = React.useState(2);
  const [tinggiSelesaiJam, setTinggiSelesaiJam] = React.useState(24);
  const [normalResponsJam, setNormalResponsJam] = React.useState(6);
  const [normalSelesaiJam, setNormalSelesaiJam] = React.useState(48);
  const [rendahResponsJam, setRendahResponsJam] = React.useState(12);
  const [rendahSelesaiJam, setRendahSelesaiJam] = React.useState(72);

  const [slaBocorPipaJam, setSlaBocorPipaJam] = React.useState(24);
  const [slaTidakAdaAirJam, setSlaTidakAdaAirJam] = React.useState(24);

  const [batasKonfirmasiJam, setBatasKonfirmasiJam] = React.useState(72);
  const [maksBukaKembali, setMaksBukaKembali] = React.useState(2);
  const [minPanjangAlasanTolak, setMinPanjangAlasanTolak] = React.useState(10);
  const [duplikatRadiusMeter, setDuplikatRadiusMeter] = React.useState(100);
  const [duplikatJendelaJam, setDuplikatJendelaJam] = React.useState(48);
  const [wajibVerifikasiTagihan, setWajibVerifikasiTagihan] = React.useState(true);

  // Modal Dialogs
  const [dialogTerbitkanTerbuka, setDialogTerbitkanTerbuka] = React.useState(false);
  const [dialogRollbackTerbuka, setDialogRollbackTerbuka] = React.useState(false);
  const [targetVersiRollback, setTargetVersiRollback] = React.useState<number | null>(null);

  const [nomorSkBaru, setNomorSkBaru] = React.useState('');
  const [alasanPerubahanBaru, setAlasanPerubahanBaru] = React.useState('');
  const [alasanRollback, setAlasanRollback] = React.useState('');

  const [toastMessage, setToastMessage] = React.useState<{
    title: string;
    desc: string;
    type?: 'success' | 'error';
  } | null>(null);

  const triggerToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Muat Kebijakan Aktif dan Riwayat dari API
  const fetchKebijakan = React.useCallback(async () => {
    setSedangMemuat(true);
    try {
      const [resAktif, resRiwayat] = await Promise.all([
        fetch('/api/v1/pengaduan/kebijakan/aktif'),
        fetch('/api/v1/pengaduan/kebijakan/riwayat'),
      ]);

      if (resAktif.ok) {
        const jsonAktif = await resAktif.json();
        if (jsonAktif.success && jsonAktif.data) {
          const k: KebijakanPengaduan = jsonAktif.data;
          setKebijakanAktif(k);

          // Inisialisasi Form dari Config
          const cfg = k.config;
          if (cfg.slaPrioritas) {
            setDaruratResponsJam(cfg.slaPrioritas.DARURAT?.responsJam ?? 1);
            setDaruratSelesaiJam(cfg.slaPrioritas.DARURAT?.selesaiJam ?? 6);
            setTinggiResponsJam(cfg.slaPrioritas.TINGGI?.responsJam ?? 2);
            setTinggiSelesaiJam(cfg.slaPrioritas.TINGGI?.selesaiJam ?? 24);
            setNormalResponsJam(cfg.slaPrioritas.NORMAL?.responsJam ?? 6);
            setNormalSelesaiJam(cfg.slaPrioritas.NORMAL?.selesaiJam ?? 48);
            setRendahResponsJam(cfg.slaPrioritas.RENDAH?.responsJam ?? 12);
            setRendahSelesaiJam(cfg.slaPrioritas.RENDAH?.selesaiJam ?? 72);
          }

          if (cfg.slaOverridePerJenis) {
            setSlaBocorPipaJam(cfg.slaOverridePerJenis.BOCOR_PIPA_DINAS?.selesaiJam ?? 24);
            setSlaTidakAdaAirJam(cfg.slaOverridePerJenis.TIDAK_ADA_AIR?.selesaiJam ?? 24);
          }

          setBatasKonfirmasiJam(cfg.batasKonfirmasiJam ?? 72);
          setMaksBukaKembali(cfg.maksBukaKembali ?? 2);
          setMinPanjangAlasanTolak(cfg.minPanjangAlasanTolak ?? 10);
          setDuplikatRadiusMeter(cfg.duplikatRadiusMeter ?? 100);
          setDuplikatJendelaJam(cfg.duplikatJendelaJam ?? 48);
          setWajibVerifikasiTagihan(cfg.wajibVerifikasiTagihan ?? true);
        }
      }

      if (resRiwayat.ok) {
        const jsonRiwayat = await resRiwayat.json();
        if (jsonRiwayat.success && Array.isArray(jsonRiwayat.data)) {
          setRiwayat(jsonRiwayat.data);
        }
      }
    } catch (err: any) {
      console.error('[FETCH_KEBIJAKAN_ERR]', err);
      triggerToast('Gagal Memuat Kebijakan', err.message || 'Gagal tersambung ke backend.', 'error');
    } finally {
      setSedangMemuat(false);
    }
  }, []);

  React.useEffect(() => {
    fetchKebijakan();
  }, [fetchKebijakan]);

  // Simpan Draf Kebijakan
  const handleSimpanDraft = async () => {
    setSedangMenyimpan(true);
    try {
      const payloadConfig: Partial<KebijakanConfig> = {
        slaPrioritas: {
          DARURAT: { responsJam: Number(daruratResponsJam), selesaiJam: Number(daruratSelesaiJam) },
          TINGGI: { responsJam: Number(tinggiResponsJam), selesaiJam: Number(tinggiSelesaiJam) },
          NORMAL: { responsJam: Number(normalResponsJam), selesaiJam: Number(normalSelesaiJam) },
          RENDAH: { responsJam: Number(rendahResponsJam), selesaiJam: Number(rendahSelesaiJam) },
        },
        slaOverridePerJenis: {
          BOCOR_PIPA_DINAS: { responsJam: 1, selesaiJam: Number(slaBocorPipaJam) },
          TIDAK_ADA_AIR: { responsJam: 2, selesaiJam: Number(slaTidakAdaAirJam) },
        },
        batasKonfirmasiJam: Number(batasKonfirmasiJam),
        maksBukaKembali: Number(maksBukaKembali),
        minPanjangAlasanTolak: Number(minPanjangAlasanTolak),
        duplikatRadiusMeter: Number(duplikatRadiusMeter),
        duplikatJendelaJam: Number(duplikatJendelaJam),
        wajibVerifikasiTagihan: Boolean(wajibVerifikasiTagihan),
      };

      const res = await fetch('/api/v1/pengaduan/kebijakan/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomorSk: nomorSkBaru || undefined,
          alasanPerubahan: alasanPerubahanBaru || 'Pembaruan Draf Kebijakan SOP Pengaduan',
          config: payloadConfig,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan draf kebijakan.');
      }

      triggerToast('Draf Kebijakan Tersimpan', 'Parameter telah disimpan dalam status DRAFT dan siap diterbitkan.');
      await fetchKebijakan();
    } catch (err: any) {
      triggerToast('Gagal Menyimpan Draf', err.message, 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  // Terbitkan Versi Baru Berdasarkan Draf
  const handleTerbitkan = async () => {
    if (!nomorSkBaru.trim()) {
      triggerToast('Nomor SK Wajib Diisi', 'Penerbitan kebijakan wajib menyertakan dasar hukum SK Direksi.', 'error');
      return;
    }
    if (!alasanPerubahanBaru.trim()) {
      triggerToast('Alasan Perubahan Wajib Diisi', 'Mohon jelaskan latar belakang perubahan kebijakan ini.', 'error');
      return;
    }

    setSedangMenyimpan(true);
    try {
      // 1. Simpan dulu parameter form ke draft
      await handleSimpanDraft();

      // Cari draf versi yang siap terbit
      const resRiwayat = await fetch('/api/v1/pengaduan/kebijakan/riwayat');
      const jsonRiwayat = await resRiwayat.json();
      const draft = jsonRiwayat.data?.find((k: any) => k.status === 'DRAFT');

      const versiTarget = draft ? draft.versi : (kebijakanAktif?.versi ?? 1) + 1;

      // 2. Terbitkan
      const res = await fetch(`/api/v1/pengaduan/kebijakan/${versiTarget}/terbitkan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomorSk: nomorSkBaru.trim(),
          alasanPerubahan: alasanPerubahanBaru.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menerbitkan kebijakan.');
      }

      triggerToast(
        'Kebijakan Berhasil Diterbitkan',
        `Kebijakan Versi ${versiTarget} resmi AKTIF berlandaskan ${nomorSkBaru}.`
      );
      setDialogTerbitkanTerbuka(false);
      setNomorSkBaru('');
      setAlasanPerubahanBaru('');
      await fetchKebijakan();
    } catch (err: any) {
      triggerToast('Gagal Menerbitkan', err.message, 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  // Eksekusi Rollback
  const handleRollback = async () => {
    if (!targetVersiRollback) return;
    if (!alasanRollback.trim()) {
      triggerToast('Alasan Rollback Wajib', 'Mohon cantumkan alasan pengembalian kebijakan.', 'error');
      return;
    }

    setSedangMenyimpan(true);
    try {
      const res = await fetch('/api/v1/pengaduan/kebijakan/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versiTarget: targetVersiRollback,
          alasanRollback: alasanRollback.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal melakukan rollback.');
      }

      triggerToast(
        'Rollback Berhasil',
        `Kebijakan berhasil dikembalikan ke Versi ${targetVersiRollback} dan langsung aktif.`
      );
      setDialogRollbackTerbuka(false);
      setAlasanRollback('');
      setTargetVersiRollback(null);
      await fetchKebijakan();
    } catch (err: any) {
      triggerToast('Gagal Rollback', err.message, 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  if (sedangMemuat && !kebijakanAktif) {
    return (
      <PageContainer>
        <div className="flex min-h-96 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <NavigasiTabPengaduan />

        {/* Header Bersih & Status Kebijakan Dinamis */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <LifeBuoy className="size-5 text-primary" />
                Tata Kelola Kebijakan & Regulasi SOP Pengaduan
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-xs border-emerald-500/30 text-emerald-600 bg-emerald-500/5 dark:text-emerald-400"
              >
                Policy as Data
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
              Parameter durasi waktu penyelesaian (SLA), jendela konfirmasi warga, batas toleransi, dan matriks hak
              akses berlandaskan Keputusan Direksi resmi yang terikat secara berversi dan dapat di-rollback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimpanDraft}
              disabled={sedangMenyimpan}
              className="text-xs gap-1.5"
            >
              {sedangMenyimpan ? <Spinner className="size-3.5" /> : <FileText className="size-3.5" />}
              Simpan Draf
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setDialogTerbitkanTerbuka(true)}
              disabled={sedangMenyimpan}
              className="text-xs gap-1.5 bg-primary text-primary-foreground"
            >
              <FileCheck2 className="size-3.5" />
              Terbitkan Versi Baru
            </Button>
          </div>
        </div>

        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-sm ${
                toastMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-800 border-rose-500/25 dark:text-rose-300'
                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:text-emerald-300'
              }`}
            >
              {toastMessage.type === 'error' ? (
                <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{toastMessage.title}</span>
                <span className="text-[11px] opacity-90">{toastMessage.desc}</span>
              </div>
            </div>
          </div>
        )}

        {/* Kartu Ringkasan Kebijakan Aktif Saat Ini */}
        {kebijakanAktif && (
          <Card className="border-border/80 bg-gradient-to-r from-muted/30 via-card to-card shadow-sm">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs">
                    AKTIF: Versi {kebijakanAktif.versi}
                  </Badge>
                  <span className="text-xs font-bold text-foreground">
                    Dasar Hukum: {kebijakanAktif.nomorSk || 'SK Standar Direksi'}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="size-3" />
                  Berlaku sejak:{' '}
                  {new Date(kebijakanAktif.tanggalBerlaku).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1.5">
                {kebijakanAktif.alasanPerubahan || 'Pemberlakuan standar operasional penanganan pengaduan pelanggan.'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Grid Konfigurasi Parameter SOP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bagian 1: Standar SLA Berdasarkan Prioritas */}
          <Card className="border-border/80 bg-card shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Target Waktu Tanggap & Penyelesaian (SLA Prioritas)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ambang batas waktu respons awal petugas dan waktu tuntas pekerjaan fisik per tingkat prioritas.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-3.5">
              {/* DARURAT */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-destructive animate-pulse" />
                    Prioritas Darurat
                  </Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Respons: {daruratResponsJam}j · Tuntas: {daruratSelesaiJam}j
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Respons (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={daruratResponsJam}
                      onChange={(e) => setDaruratResponsJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Penyelesaian (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={daruratSelesaiJam}
                      onChange={(e) => setDaruratSelesaiJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* TINGGI */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    Prioritas Tinggi
                  </Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Respons: {tinggiResponsJam}j · Tuntas: {tinggiSelesaiJam}j
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Respons (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={tinggiResponsJam}
                      onChange={(e) => setTinggiResponsJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Penyelesaian (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={tinggiSelesaiJam}
                      onChange={(e) => setTinggiSelesaiJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* NORMAL */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-muted-foreground/60" />
                    Prioritas Normal
                  </Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Respons: {normalResponsJam}j · Tuntas: {normalSelesaiJam}j
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Respons (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={normalResponsJam}
                      onChange={(e) => setNormalResponsJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Penyelesaian (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={normalSelesaiJam}
                      onChange={(e) => setNormalSelesaiJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* RENDAH */}
              <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-muted-foreground/30" />
                    Prioritas Rendah
                  </Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Respons: {rendahResponsJam}j · Tuntas: {rendahSelesaiJam}j
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Respons (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={rendahResponsJam}
                      onChange={(e) => setRendahResponsJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Penyelesaian (Jam)</span>
                    <Input
                      type="number"
                      min={1}
                      value={rendahSelesaiJam}
                      onChange={(e) => setRendahSelesaiJam(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bagian 2: Batas Jendela Konfirmasi, Toleransi, & Kontrol Kualitas */}
          <Card className="border-border/80 bg-card shadow-none flex flex-col justify-between">
            <div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Jendela Konfirmasi, Toleransi & Deteksi Duplikat
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Aturan penutupan otomatis, batas pembukaan kembali, dan filter kebocoran berulang.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Batas Konfirmasi Pelanggan</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={batasKonfirmasiJam}
                        onChange={(e) => setBatasKonfirmasiJam(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-xs text-muted-foreground">Jam</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Tiket SELESAI ditutup otomatis jika melewati batas ini.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Maksimal Buka Kembali</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        value={maksBukaKembali}
                        onChange={(e) => setMaksBukaKembali(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-xs text-muted-foreground">Kali</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Batas pengajuan komplain ulang oleh warga.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Min. Karakter Alasan Tolak</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={5}
                        value={minPanjangAlasanTolak}
                        onChange={(e) => setMinPanjangAlasanTolak(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-xs text-muted-foreground">Huruf</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Mencegah penolakan tiket tanpa penjelasan memadai.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Radius Duplikat Kebocoran</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={10}
                        value={duplikatRadiusMeter}
                        onChange={(e) => setDuplikatRadiusMeter(Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-xs text-muted-foreground">Meter</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Deteksi otomatis laporan pada titik koordinat berdekatan.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/80 space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/10">
                    <div className="space-y-0.5 pr-2">
                      <Label className="text-xs font-medium cursor-pointer">Wajib Verifikasi Tagihan Rekening</Label>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Tiket perselisihan tagihan wajib melewati verifikasi staf billing sebelum dapat ditugaskan ke
                        lapangan.
                      </p>
                    </div>
                    <Switch
                      checked={wajibVerifikasiTagihan}
                      onCheckedChange={setWajibVerifikasiTagihan}
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Tabel Linimasa Riwayat Versi Kebijakan (Audit SK & Rollback) */}
        <Card className="border-border/80 bg-card shadow-none">
          <CardHeader className="p-4 pb-2 border-b border-border/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Riwayat Versi Kebijakan & Jejak Audit SK</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Total {riwayat.length} Versi Terekam</span>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Seluruh versi kebijakan tersimpan abadi sebagai data audit. Anda dapat melakukan *instant rollback* ke
              versi masa lalu bila diperlukan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground font-semibold">
                    <th className="p-3 w-16 text-center">Versi</th>
                    <th className="p-3 w-28">Status</th>
                    <th className="p-3 w-48">Dasar Hukum (SK)</th>
                    <th className="p-3">Catatan / Alasan Perubahan</th>
                    <th className="p-3 w-36">Tanggal Berlaku</th>
                    <th className="p-3 w-28 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {riwayat.map((item) => {
                    const isAktif = item.status === 'AKTIF';
                    const isDraft = item.status === 'DRAFT';

                    return (
                      <tr key={item.id} className={`hover:bg-muted/10 transition-colors ${isAktif ? 'bg-primary/5 font-medium' : ''}`}>
                        <td className="p-3 text-center font-mono font-bold text-foreground">
                          v{item.versi}
                        </td>
                        <td className="p-3">
                          {isAktif && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px]">
                              AKTIF
                            </Badge>
                          )}
                          {isDraft && (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5 font-mono text-[10px]">
                              DRAFT
                            </Badge>
                          )}
                          {item.status === 'ARSIP' && (
                            <Badge variant="outline" className="border-border text-muted-foreground font-mono text-[10px]">
                              ARSIP
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 font-mono text-foreground font-medium">
                          {item.nomorSk || '-'}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {item.alasanPerubahan || 'Tidak ada catatan tertulis.'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {new Date(item.tanggalBerlaku).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3 text-center">
                          {isAktif ? (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Sedang Dipakai
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setTargetVersiRollback(item.versi);
                                setDialogRollbackTerbuka(true);
                              }}
                              className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <RotateCcw className="size-3" />
                              Rollback
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Penerbitan Versi Baru */}
        <Dialog open={dialogTerbitkanTerbuka} onOpenChange={setDialogTerbitkanTerbuka}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck2 className="size-4.5 text-primary" />
                Terbitkan Kebijakan SOP Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Kebijakan baru akan langsung diaktifkan untuk seluruh tiket baru yang terbit setelah tanggal pengesahan
                ini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nomor SK Direksi / Surat Ketetapan Resmi</Label>
                <Input
                  placeholder="Contoh: SK.002/DIR/2026"
                  value={nomorSkBaru}
                  onChange={(e) => setNomorSkBaru(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Latar Belakang / Alasan Perubahan Regulasi</Label>
                <Textarea
                  rows={3}
                  placeholder="Contoh: Penyesuaian standar pelayanan prima dan percepatan respons kebocoran pipa darurat..."
                  value={alasanPerubahanBaru}
                  onChange={(e) => setAlasanPerubahanBaru(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogTerbitkanTerbuka(false)}
                disabled={sedangMenyimpan}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleTerbitkan}
                disabled={sedangMenyimpan || !nomorSkBaru.trim()}
                className="text-xs bg-primary text-primary-foreground"
              >
                {sedangMenyimpan ? <Spinner className="size-3.5" /> : 'Sahkan & Aktifkan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Rollback Kebijakan */}
        <Dialog open={dialogRollbackTerbuka} onOpenChange={setDialogRollbackTerbuka}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4.5" />
                Konfirmasi Rollback ke Versi {targetVersiRollback}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sistem akan mengarsipkan kebijakan saat ini dan memberlakukan kembali seluruh konfigurasi SLA Versi{' '}
                {targetVersiRollback}. Tiket lama tetap memegang snapshot versinya masing-masing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Alasan / Catatan Rollback</Label>
                <Textarea
                  rows={3}
                  placeholder="Contoh: Penyesuaian kesiapan personil lapangan dan instruksi direksi..."
                  value={alasanRollback}
                  onChange={(e) => setAlasanRollback(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogRollbackTerbuka(false)}
                disabled={sedangMenyimpan}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRollback}
                disabled={sedangMenyimpan || !alasanRollback.trim()}
                className="text-xs"
              >
                {sedangMenyimpan ? <Spinner className="size-3.5" /> : 'Ya, Rollback Sekarang'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
