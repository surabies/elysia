'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/page/PageContainer';
import {
  MetricStatCard,
  PageSectionHeader,
  PeriodFilterBar,
  StatusFeedbackBanner,
} from '@/features/dashboard/shared/components';
import { usePbpkManager } from '../hooks/use-pbpk-manager';
import { formatAngkaId } from '../lib/closing-format';
import { ClosingSubNavBar } from './ClosingSubNavBar';
import { PbpkPasangBaruDialog } from './PbpkPasangBaruDialog';

export function PbpkView() {
  const {
    periode,
    setPeriode,
    data,
    loading,
    actionLoading,
    feedback,
    setFeedback,
    searchQuery,
    setSearchQuery,
    showPbDialog,
    setShowPbDialog,
    filteredPb,
    loadData,
    handleSimpanPasangBaru,
    handleSimpanPerubahanKategori,
  } = usePbpkManager();

  // Form states: Perubahan Kategori (PK)
  const [pkNolg, setPkNolg] = React.useState('');
  const [pkTarifBaru, setPkTarifBaru] = React.useState('3C');
  const [pkNomorSk, setPkNomorSk] = React.useState('');
  const [pkAlasan, setPkAlasan] = React.useState('');

  const onSubmitPk = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await handleSimpanPerubahanKategori({
      nolg: pkNolg,
      tarifKodeBaru: pkTarifBaru,
      nomorSk: pkNomorSk.trim() || undefined,
      alasan: pkAlasan.trim() || undefined,
    });
    if (ok) {
      setPkNolg('');
      setPkNomorSk('');
      setPkAlasan('');
    }
  };

  return (
    <PageContainer className="space-y-6">
      <PageSectionHeader
        title="PBPK (Pasang Baru & Perubahan Kategori)"
        description="Pengelolaan mutasi sambungan baru dan mutasi golongan tarif yang akan diinjeksi ke DPM bulan berikutnya (N+1)."
        badge={
          <Badge variant="blue-subtle" size="md">
            Tahap 1 Pra-Closing
          </Badge>
        }
        actions={
          <>
            <PeriodFilterBar
              periode={periode}
              onPeriodeChange={setPeriode}
              onRefresh={loadData}
              loading={loading}
              label="Periode THBL"
            />
            <Button asChild variant="outline" size="default">
              <Link href="/tools-tutup/monitoring-tutup-bulan">
                <span>Ke Wizard Tutup Buku</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <ClosingSubNavBar />

      <StatusFeedbackBanner
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
      />

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricStatCard
          label="Master Pelanggan Terdaftar"
          value={
            loading
              ? '—'
              : formatAngkaId(data?.ringkasan.totalMasterPelanggan ?? 0)
          }
          unit="SL"
          description="Total sambungan aktif di database"
          icon={Users}
        />

        <MetricStatCard
          label="Pasang Baru (PB) Periode Berjalan"
          value={loading ? '—' : formatAngkaId(data?.daftarPasangBaru.length ?? 0)}
          unit="SL Baru"
          description="Siap diinjeksi ke DPM N+1"
          icon={UserPlus}
          tone="success"
        />

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label-12 text-muted-foreground">
              Status Sinkronisasi DPM N+1
            </span>
            <CheckCircle2 className="size-4 text-(--ds-green-700)" />
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <Badge variant="green-subtle" size="md">
              <CheckCircle2 className="size-3" />
              <span>Siap Carry-Over</span>
            </Badge>
          </div>
          <p className="mt-2 text-copy-12 text-muted-foreground">
            Otomatis terbit saat Tahap 7 (Buka Bulan Baru) dieksekusi.
          </p>
        </Card>
      </div>

      {/* 3. Operational Tabs */}
      <Tabs defaultValue="pasang-baru" className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="pasang-baru">
              <UserPlus className="size-3.5" />
              <span>1. Pasang Baru (PB)</span>
            </TabsTrigger>
            <TabsTrigger value="perubahan-kategori">
              <Layers className="size-3.5" />
              <span>2. Perubahan Kategori (PK)</span>
            </TabsTrigger>
            <TabsTrigger value="alur-dpm">
              <Sparkles className="size-3.5" />
              <span>3. Alur Injeksi DPM</span>
            </TabsTrigger>
          </TabsList>

          <Button
            type="button"
            size="default"
            onClick={() => setShowPbDialog(true)}
          >
            <Plus className="size-3.5" />
            <span>Input Pasang Baru (PB)</span>
          </Button>
        </div>

        {/* TAB 1: PASANG BARU */}
        <TabsContent value="pasang-baru" className="space-y-4">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-heading-16 text-foreground">
                  Daftar Sambungan Pasang Baru ({filteredPb.length} Sambungan)
                </h2>
                <p className="mt-0.5 text-copy-13 text-muted-foreground">
                  Pelanggan baru yang telah terpasang fisik di lapangan dan akan
                  mulai dibebankan pencatatan meter pada siklus berikutnya.
                </p>
              </div>

              <div className="relative w-64">
                <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  size="sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari no sambungan / nama..."
                  className="pl-8 font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No Sambungan (NOLG)</TableHead>
                    <TableHead>Nama Pelanggan</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Golongan Tarif</TableHead>
                    <TableHead>Rute Cater</TableHead>
                    <TableHead>No Seri Meter</TableHead>
                    <TableHead className="text-center">Status DPM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-copy-13 text-muted-foreground"
                      >
                        Memuat data pasang baru...
                      </TableCell>
                    </TableRow>
                  ) : filteredPb.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-copy-13 text-muted-foreground"
                      >
                        Tidak ada data pasang baru yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPb.map((p) => (
                      <TableRow key={p.nolg}>
                        <TableCell className="text-label-13-mono text-foreground">
                          {p.nolg}
                        </TableCell>
                        <TableCell className="text-label-13 text-foreground">
                          {p.nama}
                        </TableCell>
                        <TableCell className="max-w-52 truncate text-copy-13 text-muted-foreground">
                          {p.alamat}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="blue-subtle"
                            size="sm"
                            className="font-mono"
                          >
                            {p.tarifKode ?? '2A2'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-label-12-mono text-muted-foreground">
                          {p.ruteKode ?? '—'}
                        </TableCell>
                        <TableCell className="text-label-12-mono text-muted-foreground">
                          {p.noMeter ?? '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="green-subtle" size="sm">
                            Siap N+1
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: PERUBAHAN KATEGORI */}
        <TabsContent value="perubahan-kategori" className="space-y-4">
          <Card className="max-w-2xl space-y-4 p-5">
            <div>
              <h2 className="text-heading-16 text-foreground">
                Mutasi Perubahan Kategori Tarif (PK)
              </h2>
              <p className="mt-0.5 text-copy-13 text-muted-foreground">
                Pembaruan kategori golongan tarif pelanggan berdasarkan surat
                keputusan direksi atau penyesuaian fungsi bangunan.
              </p>
            </div>

            <form onSubmit={onSubmitPk} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="pk-nolg"
                  className="block text-label-13 text-foreground"
                >
                  Nomor Sambungan Pelanggan (NOLG)
                </label>
                <Input
                  id="pk-nolg"
                  value={pkNolg}
                  onChange={(e) => setPkNolg(e.target.value)}
                  placeholder="Contoh: 00302600011"
                  className="max-w-sm font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pk-tarif"
                  className="block text-label-13 text-foreground"
                >
                  Pilih Golongan Tarif Baru
                </label>
                <NativeSelect
                  id="pk-tarif"
                  value={pkTarifBaru}
                  onChange={(e) => setPkTarifBaru(e.target.value)}
                  className="max-w-sm"
                >
                  {(data?.masterTarif ?? []).map((t) => (
                    <option key={t.kode} value={t.kode}>
                      {t.kode} - {t.nama}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pk-sk"
                  className="block text-label-13 text-foreground"
                >
                  Nomor Surat Keputusan / Memo Direksi
                </label>
                <Input
                  id="pk-sk"
                  value={pkNomorSk}
                  onChange={(e) => setPkNomorSk(e.target.value)}
                  placeholder="SK-MUTASI/01/2026/045"
                  className="max-w-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pk-alasan"
                  className="block text-label-13 text-foreground"
                >
                  Alasan Perubahan
                </label>
                <Input
                  id="pk-alasan"
                  value={pkAlasan}
                  onChange={(e) => setPkAlasan(e.target.value)}
                  placeholder="Penyesuaian peruntukan rumah tinggal menjadi toko kelontong"
                />
              </div>

              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Spinner className="size-3.5" />}
                <span>Simpan Mutasi Tarif (PK)</span>
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: ALUR BISNIS INJEKSI DPM */}
        <TabsContent value="alur-dpm" className="space-y-4">
          <Card className="space-y-4 p-5">
            <h2 className="text-heading-16 text-foreground">
              Alur Bisnis PBPK ke Siklus Penagihan N+1
            </h2>
            <div className="space-y-3 rounded-lg border border-border bg-(--ds-gray-100) p-4 text-copy-13 text-muted-foreground">
              <p>
                Di sistem pembacaan meter air utilitas (Perumda Tirtawening),
                data pelanggan tidak langsung dapat dicatat secara acak. Seluruh
                pencatatan lapangan dikunci ke dalam tabel{' '}
                <span className="font-medium text-foreground">
                  Daftar Catat Meter (DPM)
                </span>{' '}
                per periode.
              </p>
              <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-3">
                <div className="space-y-1 rounded-lg border border-border bg-card p-3.5">
                  <div className="text-label-13 text-foreground">
                    Langkah 1: Input PBPK
                  </div>
                  <p className="text-copy-12">
                    Admin menginput Sambungan Baru (PB) dan Mutasi Tarif (PK) di
                    halaman ini selama bulan berjalan.
                  </p>
                </div>
                <div className="space-y-1 rounded-lg border border-border bg-card p-3.5">
                  <div className="text-label-13 text-foreground">
                    Langkah 2: Closing Periode N
                  </div>
                  <p className="text-copy-12">
                    Periode berjalan ditutup dan rekening DRD resmi diterbitkan
                    pada Tahap 5 Closing.
                  </p>
                </div>
                <div className="space-y-1 rounded-lg border border-border bg-card p-3.5">
                  <div className="text-label-13 text-foreground">
                    Langkah 3: Buka Bulan Baru N+1
                  </div>
                  <p className="text-copy-12">
                    Sistem mengeksekusi Tahap 7 (Buka Bulan Baru) yang secara
                    otomatis menyerap seluruh PB baru ke dalam target DPM rute
                    cater.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <PbpkPasangBaruDialog
        open={showPbDialog}
        onOpenChange={setShowPbDialog}
        masterTarif={data?.masterTarif ?? []}
        masterRute={data?.masterRute ?? []}
        actionLoading={actionLoading}
        onSubmit={handleSimpanPasangBaru}
      />
    </PageContainer>
  );
}
