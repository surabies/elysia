'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  GitBranch,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ActiveClosingDialog } from '../hooks/use-closing-workflow';
import {
  formatAngkaId,
  formatPeriodeLabelId,
  formatRupiahId,
  getClosingConfirmPhrase,
} from '../lib/closing-format';
import type {
  ClosingConsoleTab,
  PratinjauData,
  StandAngkatDecisionStatus,
  StandAngkatMutasiItem,
} from '../types';

interface ClosingDialogsProps {
  periode: string;
  pratinjau: PratinjauData | null;
  standAngkatList: StandAngkatMutasiItem[];
  activeDialog: ActiveClosingDialog;
  onDialogChange: (dialog: ActiveClosingDialog) => void;
  actionLoading: boolean;
  tanggalJatuhTempo: string;
  onTanggalJatuhTempoChange: (val: string) => void;
  targetBulanBaru: string;
  onTargetBulanBaruChange: (val: string) => void;
  confirmPhraseInput: string;
  onConfirmPhraseInputChange: (val: string) => void;
  onConfirmPosting: () => void;
  onConfirmClosing: () => void;
  onConfirmBulanBaru: () => void;
  onVerifyStandAngkat: (id: string, status: StandAngkatDecisionStatus) => void;
  onDismissOnboarding: () => void;
  onOpenFullGuide?: (tab: ClosingConsoleTab) => void;
}

export function ClosingDialogs({
  periode,
  pratinjau,
  standAngkatList,
  activeDialog,
  onDialogChange,
  actionLoading,
  tanggalJatuhTempo,
  onTanggalJatuhTempoChange,
  targetBulanBaru,
  onTargetBulanBaruChange,
  confirmPhraseInput,
  onConfirmPhraseInputChange,
  onConfirmPosting,
  onConfirmClosing,
  onConfirmBulanBaru,
  onVerifyStandAngkat,
  onDismissOnboarding,
  onOpenFullGuide,
}: ClosingDialogsProps) {
  const expectedPhrase = getClosingConfirmPhrase(periode);
  const isConfirmPhraseMatched =
    confirmPhraseInput.trim().toUpperCase() === expectedPhrase.toUpperCase();

  const siapDisahkanCount =
    pratinjau?.verifikasi.siapDisahkan ??
    pratinjau?.verifikasi.belumSelesai ??
    0;

  return (
    <>
      {/* DIALOG 0: RINGKASAN CARA KERJA */}
      <Dialog
        open={activeDialog === 'onboarding'}
        onOpenChange={(open) => !open && onDismissOnboarding()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
              <span>Cara Menjalankan Tutup Bulan dengan Aman</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Konsol ini menjaga setiap langkah penutupan periode penagihan agar
              terurut, akurat, dan bebas dari risiko kerusakan data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg border border-border bg-muted/35 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>1. Ikuti Tahap 1 s/d 4</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Kerjakan berurutan dari kiri ke kanan. Tombol lanjut otomatis
                terbuka begitu seluruh syarat tahap terpenuhi.
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-border bg-muted/35 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
                <span>2. Proteksi Anomali Otomatis</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Bacaan berstatus anomali atau kubikasi negatif ditahan otomatis
                agar tidak meloloskan tagihan yang salah hitung.
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-border bg-muted/35 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Lock className="size-4 text-red-600 dark:text-red-400" />
                <span>3. Konfirmasi Bertingkat</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Penguncian buku DRD pada Tahap 3 dilindungi verifikasi kata
                kunci eksplisit dan transaksi database atomik.
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-border bg-muted/35 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <RefreshCw className="size-4 text-foreground" />
                <span>4. Carry-Forward Bulan Baru</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Setelah buku dikunci, Tahap 4 otomatis menyiapkan DPM bulan
                berikutnya dengan stand akhir bulan ini sebagai stand awal.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-wrap justify-between gap-2 sm:justify-between">
            <Button
              asChild
              variant="outline"
              size="sm"
              onClick={() => {
                onDismissOnboarding();
                onOpenFullGuide?.('panduan');
              }}
            >
              <Link href="/docs/tutup-bulan">
                <BookOpen className="size-3.5" />
                <span>Buka Panduan &amp; Simulasi Interaktif</span>
              </Link>
            </Button>

            <Button type="button" size="sm" onClick={onDismissOnboarding}>
              <span>Mengerti, Tutup</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1: PENGESAHAN BACAAN METER MASSAL (LANGKAH 2) */}
      <Dialog
        open={activeDialog === 'posting'}
        onOpenChange={(open) => !open && onDialogChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
              <span>
                Sahkan Bacaan Meter {formatPeriodeLabelId(periode)}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Mengesahkan seluruh hasil bacaan meter yang valid pada periode{' '}
              <strong className="font-mono text-foreground">{periode}</strong>{' '}
              menjadi <code className="font-mono">APPROVED_FINAL</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Periode Penagihan</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatPeriodeLabelId(periode)} ({periode})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Total Pelanggan Tercatat
                </span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.pembacaan.total)} SL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Jumlah yang Akan Disahkan
                </span>
                <span className="font-mono font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatAngkaId(siapDisahkanCount)} SL
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Setelah disahkan, Anda masih dapat meninjau estimasi nilai rupiah
              tagihan pada Tahap 3 sebelum mengunci buku secara permanen.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDialogChange(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConfirmPosting}
              disabled={actionLoading}
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Ya, Sahkan Bacaan Meter</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: KONFIRMASI AKHIR TUTUP BUKU & KUNCI DRD (KONTRAK GEIST OPERASI KRITIS) */}
      <Dialog
        open={activeDialog === 'closing'}
        onOpenChange={(open) => {
          if (!open && !actionLoading) {
            onConfirmPhraseInputChange('');
            onDialogChange(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-100 text-red-700 dark:border-red-900/60 dark:bg-red-950 dark:text-red-400">
                <Lock className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Kunci Buku {formatPeriodeLabelId(periode)} ({periode})
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs leading-relaxed">
                  Menerbitkan rekening DRD resmi dan mengunci periode secara
                  permanen.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            {/* Ringkasan Dampak */}
            <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Periode yang Dikunci
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatPeriodeLabelId(periode)} ({periode})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Jumlah Rekening Diterbitkan
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.perkiraan.jumlahSl)} SL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Total Kubikasi Air
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.perkiraan.totalM3)} m³
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Total Nilai Tagihan Resmi
                </span>
                <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">
                  Tanggal Jatuh Tempo
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {tanggalJatuhTempo}
                </span>
              </div>
            </div>

            {/* Kontrak Vercel Geist: Operasi Kritis & Konfirmasi Bertingkat */}
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/30 p-4 dark:border-red-950/60 dark:bg-red-950/20">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                  <AlertTriangle className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-red-700 dark:text-red-400">
                      Operasi Kritis &amp; Konfirmasi Bertingkat
                    </h4>
                    <Badge
                      variant="destructive"
                      className="px-1.5 py-0 font-mono text-[9px]"
                    >
                      Irreversible
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Setelah dikunci, seluruh catatan bacaan meter periode{' '}
                    {periode} tidak dapat diubah kembali oleh petugas.
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-red-200/50 pt-2 dark:border-red-900/30">
                <label
                  htmlFor="closing-confirm-phrase"
                  className="block text-xs text-muted-foreground"
                >
                  Ketik kata verifikasi{' '}
                  <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-red-700 dark:bg-red-950/80 dark:text-red-400">
                    {expectedPhrase}
                  </span>{' '}
                  untuk mengaktifkan tombol eksekusi:
                </label>
                <Input
                  id="closing-confirm-phrase"
                  value={confirmPhraseInput}
                  onChange={(e) => onConfirmPhraseInputChange(e.target.value)}
                  placeholder={`Ketik ${expectedPhrase}...`}
                  autoComplete="off"
                  autoFocus
                  className="h-8 border-red-200 bg-card font-mono text-xs uppercase focus-visible:border-red-500 focus-visible:ring-red-500/20 dark:border-red-900/60"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onConfirmPhraseInputChange('');
                onDialogChange(null);
              }}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onConfirmClosing}
              disabled={actionLoading || !isConfirmPhraseMatched}
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Kunci Buku &amp; Terbitkan Tagihan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: PERSIAPAN JADWAL BULAN BARU (TAHAP 4) */}
      <Dialog
        open={activeDialog === 'bulan-baru'}
        onOpenChange={(open) => !open && onDialogChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="size-4 text-foreground" />
              <span>
                Siapkan Jadwal {formatPeriodeLabelId(targetBulanBaru)} (
                {targetBulanBaru})
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Membuka periode penagihan baru dan menyalin stand akhir{' '}
              <strong className="font-mono text-foreground">{periode}</strong>{' '}
              menjadi stand awal target baca meter bulan{' '}
              <strong className="font-mono text-foreground">
                {targetBulanBaru}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label
                htmlFor="next-period-input"
                className="block text-xs font-semibold text-foreground"
              >
                Kode Periode Bulan Baru (Format YYYYMM)
              </label>
              <Input
                id="next-period-input"
                value={targetBulanBaru}
                onChange={(e) => onTargetBulanBaruChange(e.target.value)}
                className="max-w-xs font-mono"
                placeholder="202612"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pelanggan berstatus <strong>DICABUT</strong> otomatis dilewati dan
              tidak dimasukkan ke jadwal bulan baru. Proses ini idempoten (aman
              dijalankan ulang tanpa membuat data ganda).
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDialogChange(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onConfirmBulanBaru}
              disabled={actionLoading || !/^\d{6}$/.test(targetBulanBaru)}
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Buka Jadwal {targetBulanBaru}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: PERSETUJUAN PERGANTIAN METER / STAND ANGKAT (LANGKAH 1) */}
      <Dialog
        open={activeDialog === 'mutasi'}
        onOpenChange={(open) => !open && onDialogChange(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <GitBranch className="size-4 text-foreground" />
              <span>
                Daftar Pergantian Meter Air ({standAngkatList.length} Data)
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Periksa angka meter lama yang dicabut (Stand Angkat) dan angka
              awal meter baru yang dipasang (Stand Pasang).
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. SL</TableHead>
                  <TableHead>Meter Lama</TableHead>
                  <TableHead className="text-right">Stand Angkat</TableHead>
                  <TableHead>Meter Baru</TableHead>
                  <TableHead className="text-right">Stand Pasang</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standAngkatList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-6 text-center text-xs text-muted-foreground"
                    >
                      Tidak ada pergantian meter pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  standAngkatList.map((m) => {
                    const isDataLengkap =
                      Boolean(m.noMeterBaru) && m.standAngkat !== null;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs font-medium text-foreground">
                          <div>{m.nolg}</div>
                          {m.namaPelanggan && (
                            <div className="font-sans text-[11px] text-muted-foreground">
                              {m.namaPelanggan}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {m.noMeterLama}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-amber-600 dark:text-amber-400">
                          {m.standAngkat !== null
                            ? formatAngkaId(m.standAngkat)
                            : 'Belum diisi'}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {m.noMeterBaru ?? 'Belum diisi'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatAngkaId(m.standPasang)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              m.statusVerifikasi === 'APPROVED'
                                ? 'green-subtle'
                                : m.statusVerifikasi === 'REJECTED'
                                  ? 'red-subtle'
                                  : m.statusVerifikasi ===
                                      'DATA_METER_BELUM_LENGKAP'
                                    ? 'blue-subtle'
                                    : 'amber-subtle'
                            }
                            size="sm"
                          >
                            {m.statusVerifikasi === 'APPROVED'
                              ? 'Disetujui'
                              : m.statusVerifikasi === 'REJECTED'
                                ? 'Ditolak'
                                : m.statusVerifikasi ===
                                    'DATA_METER_BELUM_LENGKAP'
                                  ? 'Data Belum Lengkap'
                                  : 'Menunggu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {m.statusVerifikasi === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  onVerifyStandAngkat(m.id, 'APPROVED')
                                }
                                disabled={actionLoading || !isDataLengkap}
                                title={
                                  !isDataLengkap
                                    ? 'No. Meter Baru dan Stand Angkat wajib lengkap sebelum disetujui'
                                    : undefined
                                }
                                className="text-emerald-700 dark:text-emerald-400"
                              >
                                <Check className="size-3" />
                                <span>Setujui</span>
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  onVerifyStandAngkat(m.id, 'REJECTED')
                                }
                                disabled={actionLoading}
                                className="text-destructive"
                              >
                                <X className="size-3" />
                                <span>Tolak</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">
                              {m.statusVerifikasi === 'DATA_METER_BELUM_LENGKAP'
                                ? 'Menunggu Teknik'
                                : 'Selesai'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDialogChange(null)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
