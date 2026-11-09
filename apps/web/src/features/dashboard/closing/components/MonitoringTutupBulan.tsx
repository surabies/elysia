'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  Droplet,
  Calendar,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Users,
  Check,
  X,
  Layers,
  Scale,
  GitBranch,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface WorkflowStageItem {
  stageNumber: number;
  id: string;
  nama: string;
  kategori: 'PRA_CLOSING' | 'EKSEKUSI' | 'PASCA_CLOSING' | 'MONITORING';
  status: 'SELESAI' | 'SIAP' | 'PERLU_TINDAKAN' | 'TERKUNCI' | 'MENUNGGU';
  deskripsi: string;
  metrikUtama: string;
  canExecute?: boolean;
  routeUrl: string;
  detail?: Record<string, any>;
}

export interface PratinjauData {
  periode: string;
  status: 'BERJALAN' | 'TERKUNCI' | 'BELUM_ADA';
  daftarCatat: {
    total: number;
    selesai: number;
    belumSelesai: number;
    readRatePersen: number;
  };
  verifikasi: {
    total: number;
    selesaiV3: number;
    belumSelesai: number;
  };
  pembacaan: {
    total: number;
    sudahDitagih: number;
    akanDitagih: number;
  };
  perkiraan: {
    jumlahSl: number;
    totalM3: number;
    totalTagihan: number;
  };
  hambatan: Array<{
    kode: string;
    pesan: string;
    jumlah: number;
    contoh: string[];
  }>;
  bisaDitutup: boolean;
}

export interface StandAngkatMutasiItem {
  id: string;
  nolg: string;
  namaPelanggan: string | null;
  periode: number;
  tglGanti: string;
  alasan: string;
  keterangan: string | null;
  noMeterLama: string;
  standAngkat: number;
  noMeterBaru: string;
  standPasang: number;
  petugasPasang: string;
  statusVerifikasi: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface MonitoringTutupBulanProps {
  highlightStage?: string;
  initialTab?: string;
}

export function MonitoringTutupBulan({ highlightStage }: MonitoringTutupBulanProps = {}) {
  const [periode, setPeriode] = React.useState('202601');

  // Live data
  const [stages, setStages] = React.useState<WorkflowStageItem[]>([]);
  const [pratinjau, setPratinjau] = React.useState<PratinjauData | null>(null);
  const [standAngkatList, setStandAngkatList] = React.useState<StandAngkatMutasiItem[]>([]);

  // UI state
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dialogs
  const [showClosingDialog, setShowClosingDialog] = React.useState(false);
  const [showPostingDialog, setShowPostingDialog] = React.useState(false);
  const [showBulanBaruDialog, setShowBulanBaruDialog] = React.useState(false);
  const [showMutasiDialog, setShowMutasiDialog] = React.useState(false);
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = React.useState('2026-02-20');
  const [targetBulanBaru, setTargetBulanBaru] = React.useState('202602');

  const loadClosingData = React.useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [resStages, resPratinjau, resStandAngkat] = await Promise.all([
        fetch(`/api/closing/workflow-status/${periode}`).then((r) => r.json()),
        fetch(`/api/closing/pratinjau/${periode}`).then((r) => r.json()),
        fetch(`/api/closing/stand-angkat/${periode}`).then((r) => r.json()),
      ]);

      if (resStages.success) setStages(resStages.data.stages);
      if (resPratinjau.success) setPratinjau(resPratinjau.data);
      if (resStandAngkat.success) setStandAngkatList(resStandAngkat.data);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat data closing.' });
    } finally {
      setLoading(false);
    }
  }, [periode]);

  React.useEffect(() => {
    loadClosingData();
  }, [loadClosingData]);

  // Handler: Tahap 4 Posting Datameter Massal
  const handlePostingDatameter = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/closing/posting-datameter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periode }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.data.message });
        setShowPostingDialog(false);
        loadClosingData();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Gagal posting datameter.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Tahap 5 Eksekusi Closing & Lock Periode
  const handleEksekusiClosing = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/closing/eksekusi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode,
          tanggalJatuhTempo: new Date(tanggalJatuhTempo).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: 'success',
          message: `Periode ${periode} berhasil ditutup & dikunci. Total ${json.data.jumlahSl.toLocaleString('id-ID')} SL diterbitkan ke rekening DRD.`,
        });
        setShowClosingDialog(false);
        loadClosingData();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Eksekusi closing gagal.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Tahap 7 Buka Bulan Baru
  const handleBukaBulanBaru = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/closing/bulan-baru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodeLalu: periode,
          periodeBaru: targetBulanBaru,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.message });
        setShowBulanBaruDialog(false);
        setPeriode(targetBulanBaru);
      } else {
        setFeedback({ type: 'error', message: json.error || 'Gagal membuka bulan baru.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Tahap 2 Verifikasi Mutasi Stand Angkat
  const handleVerifikasiStandAngkat = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/closing/stand-angkat/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: 'success', message: json.data.message });
        loadClosingData();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Gagal verifikasi mutasi.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const isTerkunci = pratinjau?.status === 'TERKUNCI';

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] w-full bg-background p-6 space-y-6">
      {/* 1. Header & Periode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Closing Periode & Tutup Bulan
            </h1>
            <Badge
              variant={isTerkunci ? 'default' : 'outline'}
              className={cn(
                'text-xs font-semibold gap-1.5 py-0.5',
                isTerkunci
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-700'
              )}
            >
              {isTerkunci ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {isTerkunci ? 'TERKUNCI (LOCKED)' : 'PERIODE BERJALAN'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Konsol orkestrasi 12 tahapan penutupan buku billing, penerbitan rekening resmi air DRD, dan inisialisasi siklus penagihan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border">
            <span className="text-xs font-medium px-2 text-muted-foreground">Periode THBL:</span>
            <Input
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-24 h-8 text-xs font-mono text-center bg-background"
              placeholder="YYYYMM"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={loadClosingData}
              disabled={loading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Muat Ulang
            </Button>
          </div>

          <Link href="/tools-tutup/cek-selisih-pelanggan">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-dashed">
              <Scale className="w-3.5 h-3.5" />
              Menu Cek Selisih
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedback && (
        <div
          className={cn(
            'flex items-center justify-between p-3.5 rounded-md border text-xs',
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFeedback(null)}
            className="h-6 w-6 p-0"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* 2. Top Executive Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Pelanggan Aktif</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono">
              {loading ? '-' : (pratinjau?.daftarCatat.total ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">SL</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Read Rate Lapangan</span>
            <Droplet className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-600">
              {loading ? '-' : `${pratinjau?.daftarCatat.readRatePersen ?? 100}%`}
            </span>
            <span className="text-[10px] text-muted-foreground">tercatat</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Approval Verifikasi</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono">
              {loading
                ? '-'
                : Math.round(
                    ((pratinjau?.verifikasi.selesaiV3 ?? 0) /
                      Math.max(1, pratinjau?.verifikasi.total ?? 1)) *
                      100
                  )}
              %
            </span>
            <span className="text-[10px] text-muted-foreground">disahkan</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Volume Air (DRD)</span>
            <Droplet className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono">
              {loading ? '-' : (pratinjau?.perkiraan.totalM3 ?? 0).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">m³</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between text-foreground">
            <span className="text-xs font-medium font-semibold">Omzet DRD Resmi</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground">Rp</span>
            <span className="text-lg font-bold font-mono tracking-tight">
              {loading
                ? '-'
                : (pratinjau?.perkiraan.totalTagihan ?? 0).toLocaleString('id-ID')}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border bg-card">
        <div>
          <h2 className="text-sm font-semibold">Aksi Eksekusi Tutup Bulan</h2>
          <p className="text-xs text-muted-foreground">
            Sahkan hasil bacaan, kunci transaksi billing periode berjalan, atau inisialisasi siklus penagihan berikutnya.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPostingDialog(true)}
            disabled={loading || actionLoading || isTerkunci}
            className="text-xs gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Tahap 4: Posting Datameter
          </Button>

          <Button
            size="sm"
            onClick={() => setShowClosingDialog(true)}
            disabled={loading || actionLoading || isTerkunci}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            <Lock className="w-3.5 h-3.5" />
            Tahap 5: Kunci Periode & DRD
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBulanBaruDialog(true)}
            disabled={loading || actionLoading || !isTerkunci}
            className="text-xs gap-1.5"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Tahap 7: Inisialisasi Bulan Baru
          </Button>
        </div>
      </div>

      {/* Hambatan / Blockers Notice */}
      {pratinjau && pratinjau.hambatan.length > 0 && (
        <Card className="border-amber-300 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">
              Terdapat {pratinjau.hambatan.length} Catatan Kesiapan Pra-Closing:
            </span>
          </div>
          <div className="space-y-2">
            {pratinjau.hambatan.map((h, i) => (
              <div key={i} className="flex items-start justify-between text-xs text-muted-foreground pl-6">
                <div>
                  <p className="font-medium text-foreground">{h.pesan}</p>
                  {h.contoh.length > 0 && (
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      Sample No Sambungan: {h.contoh.slice(0, 8).join(', ')}...
                    </p>
                  )}
                </div>
                {h.kode === 'VERIFIKASI_BELUM_TUNTAS' && !isTerkunci && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPostingDialog(true)}
                    className="h-7 text-[11px] gap-1 shrink-0"
                  >
                    Posting Sekarang
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. 12-Stage Workflow Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Alur Kerja 12 Tahapan Tutup Bulan (Aurora Tirtawening Standards)
            </h2>
            <p className="text-xs text-muted-foreground">
              Seluruh tahapan diverifikasi secara otomatis terhadap basis data PostgreSQL riil.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stages.map((stage) => {
            let badgeColor = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
            if (stage.status === 'SELESAI') {
              badgeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800';
            } else if (stage.status === 'SIAP') {
              badgeColor = 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-800';
            } else if (stage.status === 'PERLU_TINDAKAN') {
              badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-800';
            } else if (stage.status === 'TERKUNCI') {
              badgeColor = 'bg-purple-500/10 text-purple-600 border-purple-300 dark:border-purple-800';
            }

            return (
              <Card
                key={stage.id}
                className={cn(
                  'p-4 flex flex-col justify-between space-y-3 transition-colors hover:border-foreground/30',
                  stage.id === highlightStage && 'ring-2 ring-primary border-primary bg-primary/5'
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold font-mono">
                        {stage.stageNumber}
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        {stage.kategori}
                      </span>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] font-semibold py-0.5', badgeColor)}>
                      {stage.status}
                    </Badge>
                  </div>

                  <h3 className="text-xs font-bold text-foreground leading-snug">
                    {stage.nama}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {stage.deskripsi}
                  </p>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <div className="text-[11px] font-mono font-medium text-foreground truncate mr-2">
                    {stage.metrikUtama}
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    {stage.id === 'cek-selisih-pelanggan' ? (
                      <Link href="/tools-tutup/cek-selisih-pelanggan">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 gap-1 text-primary font-medium"
                        >
                          Buka Menu <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    ) : stage.id === 'stand-angkat' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowMutasiDialog(true)}
                        className="h-7 text-xs px-2 gap-1 text-primary font-medium"
                      >
                        Review ({standAngkatList.length}) <ChevronRight className="w-3 h-3" />
                      </Button>
                    ) : (
                      <Link href={stage.routeUrl}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2 gap-1">
                          Akses <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* DIALOG 1: POSTING DATAMETER MASSAL (TAHAP 4)                   */}
      {/* ============================================================== */}
      <Dialog open={showPostingDialog} onOpenChange={setShowPostingDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Posting Datameter Massal (Tahap 4)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mengesahkan seluruh hasil pembacaan meter mobile periode {periode} yang telah diverifikasi menjadi status <strong>APPROVED_FINAL</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-muted space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periode Target:</span>
                <span className="font-bold text-foreground">{periode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Pembacaan:</span>
                <span>{pratinjau?.pembacaan.total.toLocaleString('id-ID')} SL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Belum Disahkan:</span>
                <span className="font-bold text-amber-600">
                  {pratinjau?.verifikasi.belumSelesai.toLocaleString('id-ID')} SL
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Setelah diposting, angka kubikasi pemakaian air akan dikunci untuk penghitungan DRD resmi.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPostingDialog(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handlePostingDatameter}
              disabled={actionLoading}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {actionLoading && <Spinner className="w-3.5 h-3.5" />}
              Posting & Sahkan Datameter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG 2: EKSEKUSI CLOSING & KUNCI DRD (TAHAP 5)               */}
      {/* ============================================================== */}
      <Dialog open={showClosingDialog} onOpenChange={setShowClosingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-5 h-5 text-destructive" />
              Eksekusi Tutup Bulan & Kunci Periode {periode}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Prosedur ini akan menerbitkan seluruh rekening resmi DRD dan mengunci transaksi pembacaan meter (LOCKED_BILLING). Periode yang sudah ditutup tidak dapat dimodifikasi kembali.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-muted space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rekening DRD:</span>
                <span className="font-bold">{pratinjau?.perkiraan.jumlahSl.toLocaleString('id-ID')} SL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Volume Ditagih:</span>
                <span className="font-bold">{pratinjau?.perkiraan.totalM3.toLocaleString('id-ID')} m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Omzet Tagihan:</span>
                <span className="font-bold text-emerald-600">
                  Rp {pratinjau?.perkiraan.totalTagihan.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tanggal Jatuh Tempo Pembayaran Rekening:
              </label>
              <Input
                type="date"
                value={tanggalJatuhTempo}
                onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Standar jatuh tempo penagihan Tirtawening: tanggal 20 bulan berikutnya.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClosingDialog(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleEksekusiClosing}
              disabled={actionLoading}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {actionLoading && <Spinner className="w-3.5 h-3.5" />}
              Kunci Periode & Terbitkan DRD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG 3: INISIALISASI BULAN BARU (TAHAP 7)                    */}
      {/* ============================================================== */}
      <Dialog open={showBulanBaruDialog} onOpenChange={setShowBulanBaruDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Inisialisasi Periode Baru ({targetBulanBaru})
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin membuka siklus pembacaan bulan baru {targetBulanBaru}?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Periode Baru (THBL):
              </label>
              <Input
                value={targetBulanBaru}
                onChange={(e) => setTargetBulanBaru(e.target.value)}
                className="font-mono text-xs max-w-xs"
                placeholder="202602"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sistem akan meng-generate seluruh target rute DPM untuk seluruh pelanggan aktif ke dalam siklus penagihan baru.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulanBaruDialog(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleBukaBulanBaru}
              disabled={actionLoading}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {actionLoading && <Spinner className="w-3.5 h-3.5" />}
              Ya, Inisialisasi Periode {targetBulanBaru}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG 4: REVIEW MUTASI STAND ANGKAT (TAHAP 2)                 */}
      {/* ============================================================== */}
      <Dialog open={showMutasiDialog} onOpenChange={setShowMutasiDialog}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              Review Stand Angkat & Ganti Water Meter ({standAngkatList.length} Mutasi)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pengesahan angka stand meter lama dan stand awal meter baru pada saat transaksi pergantian fisik meter.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] bg-muted/50">
                  <TableHead>No Sambungan</TableHead>
                  <TableHead>Meter Lama</TableHead>
                  <TableHead className="text-right">Stand Angkat</TableHead>
                  <TableHead>Meter Baru</TableHead>
                  <TableHead className="text-right">Stand Pasang</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standAngkatList.map((m) => (
                  <TableRow key={m.id} className="text-xs">
                    <TableCell className="font-mono font-medium">{m.nolg}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{m.noMeterLama}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-amber-600">
                      {m.standAngkat.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{m.noMeterBaru}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600">
                      {m.standPasang}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] py-0 px-2">
                        {m.statusVerifikasi}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {m.statusVerifikasi === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifikasiStandAngkat(m.id, 'APPROVED')}
                            disabled={actionLoading}
                            className="h-6 w-6 p-0 text-emerald-600"
                            title="Approve"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifikasiStandAngkat(m.id, 'REJECTED')}
                            disabled={actionLoading}
                            className="h-6 w-6 p-0 text-destructive"
                            title="Reject"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Selesai</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowMutasiDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
