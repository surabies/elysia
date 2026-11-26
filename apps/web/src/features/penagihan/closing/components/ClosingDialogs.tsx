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
  formatRupiahId,
  getClosingConfirmPhrase,
} from '../lib/closing-format';
import type {
  ClosingConsoleTab,
  PratinjauData,
  StandAngkatMutasiItem,
  StandAngkatVerificationStatus,
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
  onVerifyStandAngkat: (
    id: string,
    status: Exclude<StandAngkatVerificationStatus, 'PENDING'>,
  ) => void;
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

  return (
    <>
      {/* DIALOG 0: ONBOARDING RINGAN SEKALI TAMPIL (4 LANGKAH MUDAH) */}
      <Dialog
        open={activeDialog === 'onboarding'}
        onOpenChange={(open) => !open && onDismissOnboarding()}
      >
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-(--ds-blue-700)" />
              <span>Selamat Datang di Panduan Aman Tutup Buku</span>
            </DialogTitle>
            <DialogDescription>
              Halaman ini dirancang khusus agar proses penutupan periode
              penagihan berjalan aman, terarah, dan bebas dari risiko kerusakan
              data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center gap-2 text-label-13 text-foreground">
                <CheckCircle2 className="size-4 text-(--ds-blue-700)" />
                <span>1. Urutan 5 Langkah Jelas</span>
              </div>
              <p className="text-copy-12 text-muted-foreground">
                Ikuti langkah dari kiri ke kanan (Langkah 1 sampai 5). Tombol{' '}
                <strong>Lanjut</strong> baru akan terbuka setelah syarat langkah
                tersebut terpenuhi.
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center gap-2 text-label-13 text-foreground">
                <ShieldCheck className="size-4 text-(--ds-green-700)" />
                <span>2. Anti Salah Klik &amp; Data Utuh</span>
              </div>
              <p className="text-copy-12 text-muted-foreground">
                Jika terjadi gangguan jaringan atau salah klik, sistem otomatis
                membatalkan perubahan setengah jalan sehingga data tagihan tidak
                akan pernah rusak.
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center gap-2 text-label-13 text-foreground">
                <Lock className="size-4 text-(--ds-amber-700)" />
                <span>3. Konfirmasi Ganda Sebelum Kunci</span>
              </div>
              <p className="text-copy-12 text-muted-foreground">
                Sebelum buku benar-benar dikunci pada Langkah 4, Anda akan
                melihat ringkasan dampak dan diminta mengetik kode konfirmasi.
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center gap-2 text-label-13 text-foreground">
                <RefreshCw className="size-4 text-foreground" />
                <span>4. Posisi Kerja Selalu Tersimpan</span>
              </div>
              <p className="text-copy-12 text-muted-foreground">
                Apabila halaman tidak sengaja tertutup atau dimuat ulang, sistem
                otomatis mengembalikan Anda ke langkah terakhir yang sedang
                dikerjakan.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-wrap justify-between gap-2 sm:justify-between">
            <Button
              asChild
              variant="outline"
              onClick={() => {
                onDismissOnboarding();
                onOpenFullGuide?.('panduan');
              }}
            >
              <Link href="/tools-tutup/panduan">
                <BookOpen className="size-3.5" />
                <span>Lihat Halaman Panduan Lengkap</span>
              </Link>
            </Button>

            <Button type="button" onClick={onDismissOnboarding}>
              <span>Saya Mengerti, Mulai Bekerja</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1: PENGESAHAN BACAAN METER MASSAL (LANGKAH 2) */}
      <Dialog
        open={activeDialog === 'posting'}
        onOpenChange={(open) => !open && onDialogChange(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-(--ds-blue-700)" />
              <span>Sahkan Seluruh Hasil Baca Meter ({periode})</span>
            </DialogTitle>
            <DialogDescription>
              Tindakan ini akan mengesahkan seluruh angka meter hasil catat
              petugas lapangan pada periode {periode} agar siap dihitung menjadi
              tagihan air.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2 rounded-lg border border-border bg-(--ds-gray-100) p-3.5 text-label-12">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Periode Tagihan</span>
                <span className="text-label-12-mono tabular-nums text-foreground">
                  {periode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Total Pelanggan Tercatat
                </span>
                <span className="text-label-12-mono tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.pembacaan.total)} Pelanggan
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Jumlah yang Akan Disahkan
                </span>
                <span className="text-label-12-mono tabular-nums text-(--ds-amber-700)">
                  {formatAngkaId(pratinjau?.verifikasi.belumSelesai)} Pelanggan
                </span>
              </div>
            </div>
            <p className="text-copy-12 text-muted-foreground">
              Setelah disahkan, Anda masih dapat memeriksa ringkasan nilai
              tagihan pada Langkah 3 sebelum mengunci buku.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDialogChange(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onConfirmPosting}
              disabled={actionLoading}
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Ya, Sahkan Bacaan Meter</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: KONFIRMASI EKSPLISIT TUTUP BUKU & KUNCI DRD (LANGKAH 4) */}
      <Dialog
        open={activeDialog === 'closing'}
        onOpenChange={(open) => {
          if (!open) {
            onConfirmPhraseInputChange('');
            onDialogChange(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-4 text-(--ds-red-700)" />
              <span>Konfirmasi Akhir: Kunci Buku Periode {periode}</span>
            </DialogTitle>
            <DialogDescription>
              Periksa kembali ringkasan dampak di bawah ini. Setelah dikunci,
              rekening tagihan resmi akan diterbitkan dan periode {periode}{' '}
              tidak dapat dibuka kembali.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Ringkasan Dampak */}
            <div className="space-y-2 rounded-lg border border-border bg-(--ds-gray-100) p-3.5 text-label-12">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Periode yang Akan Dikunci
                </span>
                <span className="text-label-12-mono tabular-nums text-foreground">
                  {periode} (Permanen)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Jumlah Rekening Diterbitkan
                </span>
                <span className="text-label-12-mono tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.perkiraan.jumlahSl)} Pelanggan
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Total Pemakaian Air
                </span>
                <span className="text-label-12-mono tabular-nums text-foreground">
                  {formatAngkaId(pratinjau?.perkiraan.totalM3)} m³
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Total Nilai Tagihan Resmi
                </span>
                <span className="text-label-12-mono tabular-nums text-(--ds-green-700)">
                  {formatRupiahId(pratinjau?.perkiraan.totalTagihan)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">
                  Tanggal Jatuh Tempo
                </span>
                <span className="text-label-12-mono tabular-nums text-foreground">
                  {tanggalJatuhTempo}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="closing-due-date"
                className="block text-label-12 text-muted-foreground"
              >
                Ubah Tanggal Jatuh Tempo (bila diperlukan):
              </label>
              <Input
                id="closing-due-date"
                type="date"
                size="sm"
                value={tanggalJatuhTempo}
                onChange={(e) => onTanggalJatuhTempoChange(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Guard Ketik Kata Kunci Konfirmasi */}
            <div className="space-y-1.5 rounded-lg border border-(--ds-amber-300) bg-(--ds-amber-100)/60 p-3.5">
              <label
                htmlFor="closing-confirm-phrase"
                className="flex items-center gap-1.5 text-label-12 text-foreground"
              >
                <AlertTriangle className="size-3.5 text-(--ds-amber-700)" />
                <span>
                  Ketik{' '}
                  <code className="rounded bg-card px-1.5 py-0.5 font-mono text-foreground">
                    {expectedPhrase}
                  </code>{' '}
                  untuk membuka tombol kunci buku:
                </span>
              </label>
              <Input
                id="closing-confirm-phrase"
                value={confirmPhraseInput}
                onChange={(e) => onConfirmPhraseInputChange(e.target.value)}
                placeholder={expectedPhrase}
                autoComplete="off"
                className="bg-card font-mono uppercase"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
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
              onClick={onConfirmClosing}
              disabled={actionLoading || !isConfirmPhraseMatched}
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Kunci Buku &amp; Terbitkan Tagihan Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: PERSIAPAN JADWAL BULAN BARU (LANGKAH 5) */}
      <Dialog
        open={activeDialog === 'bulan-baru'}
        onOpenChange={(open) => !open && onDialogChange(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="size-4 text-foreground" />
              <span>Siapkan Jadwal Baca Bulan Baru ({targetBulanBaru})</span>
            </DialogTitle>
            <DialogDescription>
              Membuka periode penagihan baru dan menyalin daftar pelanggan aktif
              ke dalam jadwal target baca meter bulan {targetBulanBaru}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label
                htmlFor="next-period-input"
                className="block text-label-13 text-foreground"
              >
                Kode Periode Bulan Baru (Format YYYYMM)
              </label>
              <Input
                id="next-period-input"
                value={targetBulanBaru}
                onChange={(e) => onTargetBulanBaruChange(e.target.value)}
                className="max-w-xs font-mono"
                placeholder="202602"
              />
            </div>
            <p className="text-copy-12 text-muted-foreground">
              Pelanggan yang berstatus dicabut pada bulan lalu otomatis tidak
              akan dimasukkan ke jadwal bulan baru.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDialogChange(null)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onConfirmBulanBaru}
              disabled={actionLoading}
            >
              {actionLoading && <Spinner className="size-3.5" />}
              <span>Siapkan Jadwal Periode {targetBulanBaru}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: PERSETUJUAN PERGANTIAN METER / STAND ANGKAT (LANGKAH 1) */}
      <Dialog
        open={activeDialog === 'mutasi'}
        onOpenChange={(open) => !open && onDialogChange(null)}
      >
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="size-4 text-foreground" />
              <span>
                Daftar Pergantian Meter Air ({standAngkatList.length} Data)
              </span>
            </DialogTitle>
            <DialogDescription>
              Periksa angka meter lama yang dicabut (Stand Angkat) dan angka
              awal meter baru yang dipasang (Stand Pasang).
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Sambungan</TableHead>
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
                      className="py-6 text-center text-copy-13 text-muted-foreground"
                    >
                      Tidak ada pergantian meter pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  standAngkatList.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-label-13-mono text-foreground">
                        {m.nolg}
                      </TableCell>
                      <TableCell className="text-label-12-mono text-muted-foreground">
                        {m.noMeterLama}
                      </TableCell>
                      <TableCell className="text-right text-label-13-mono tabular-nums text-(--ds-amber-700)">
                        {formatAngkaId(m.standAngkat)}
                      </TableCell>
                      <TableCell className="text-label-12-mono text-muted-foreground">
                        {m.noMeterBaru}
                      </TableCell>
                      <TableCell className="text-right text-label-13-mono tabular-nums text-(--ds-green-700)">
                        {m.standPasang}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            m.statusVerifikasi === 'APPROVED'
                              ? 'green-subtle'
                              : m.statusVerifikasi === 'REJECTED'
                                ? 'red-subtle'
                                : 'subtle'
                          }
                          size="sm"
                        >
                          {m.statusVerifikasi === 'APPROVED'
                            ? 'Disetujui'
                            : m.statusVerifikasi === 'REJECTED'
                              ? 'Ditolak'
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
                              disabled={actionLoading}
                              className="text-(--ds-green-700)"
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
                              className="text-(--ds-red-700)"
                            >
                              <X className="size-3" />
                              <span>Tolak</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-label-11 text-muted-foreground">
                            Selesai
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDialogChange(null)}
            >
              Selesai &amp; Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
