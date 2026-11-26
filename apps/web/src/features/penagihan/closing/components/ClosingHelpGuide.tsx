'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Database,
  GitBranch,
  HelpCircle,
  Lock,
  Scale,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClosingConsoleTab } from '../types';

interface ClosingHelpGuideProps {
  onSelectTab?: (tab: ClosingConsoleTab) => void;
}

const CLOSING_PHASES = [
  {
    fase: 'Fase I: Pra-Closing (Validasi Lapangan & Mutasi)',
    rentang: 'Tahap 1 – 4',
    badgeVariant: 'blue-subtle' as const,
    ringkasan:
      'Memastikan seluruh perubahan data pelanggan, pergantian meter fisik, pemetaan rute, dan pengesahan hasil bacaan meter telah 100% bersih sebelum kalkulasi tagihan.',
    tahapan: [
      {
        no: 1,
        nama: 'PBPK (Pasang Baru & Perubahan Kategori)',
        tabelDb: 'pelanggan, water_meter, golongan_tarif',
        endpoint: 'GET/POST /api/closing/pbpk/*',
        prasyarat: 'Berita acara pemasangan SL baru / SK mutasi tarif',
        output:
          'Sambungan baru terdaftar beserta aset water meter dan golongan tarif terbaru.',
      },
      {
        no: 2,
        nama: 'Stand Angkat (Ganti Water Meter / GWM)',
        tabelDb: 'water_meter_mutasi, cater_baca_meter',
        endpoint: 'GET/POST /api/closing/stand-angkat/*',
        prasyarat: 'BA Ganti Meter lapangan telah diinput',
        output:
          'Seluruh mutasi berstatus APPROVED (0 PENDING) agar kubikasi meter lama + baru akurat.',
      },
      {
        no: 3,
        nama: 'Update Zonasi & Pemetaan Rute',
        tabelDb: 'pelanggan, rute_cater, kelurahan, daftar_catat',
        endpoint: 'POST /api/closing/update-zonasi',
        prasyarat: 'Master rute cater dan kelurahan tersedia',
        output:
          '0 pelanggan tanpa ruteKode / kelurahanKode; seluruh SL terpetakan ke rute baca.',
      },
      {
        no: 4,
        nama: 'Posting Datameter Massal (Approval V3)',
        tabelDb: 'cater_baca_meter',
        endpoint: 'POST /api/closing/posting-datameter',
        prasyarat: 'Verifikasi anomali L1 & L2 selesai',
        output:
          'Status bacaan naik menjadi APPROVED_FINAL dan siap dihitung menjadi rekening DRD.',
      },
    ],
  },
  {
    fase: 'Fase II: Eksekusi Inti (Penerbitan DRD & Penguncian Buku)',
    rentang: 'Tahap 5 – 6',
    badgeVariant: 'green-subtle' as const,
    ringkasan:
      'Menjalankan mesin kalkulasi tarif progresif 4 blok secara atomik (PostgreSQL Transaction), menerbitkan Daftar Rekening Ditagih (DRD), dan mengunci periode.',
    tahapan: [
      {
        no: 5,
        nama: 'Create Closed DRD & Kunci Periode',
        tabelDb: 'rekening_drd, periode_penagihan, cater_baca_meter',
        endpoint: 'POST /api/closing/eksekusi',
        prasyarat: 'Tahap 1–4 tuntas & tanggal jatuh tempo ditentukan',
        output:
          'Rekening DRD terbit massal, bacaan dikunci (LOCKED_BILLING), dan periode berstatus TERKUNCI.',
      },
      {
        no: 6,
        nama: 'Create Perbandingan (Rekonsiliasi Antar Bulan)',
        tabelDb: 'rekening_drd, pelanggan, golongan_tarif',
        endpoint: 'GET /api/closing/perbandingan/:periode',
        prasyarat: 'Rekening DRD periode berjalan (N) telah terbit',
        output:
          'Matriks komparasi jumlah SL, kubikasi (m³), dan omzet (Rp) periode N terhadap N-1 per golongan tarif.',
      },
    ],
  },
  {
    fase: 'Fase III: Pasca-Closing (Rollover Siklus N+1 & Sinkronisasi DPM)',
    rentang: 'Tahap 7 – 10',
    badgeVariant: 'amber-subtle' as const,
    ringkasan:
      'Membuka periode penagihan bulan berikutnya (N+1), menerbitkan target Daftar Pelanggan Menjadi (DPM), serta menormalisasi urutan baca petugas lapangan.',
    tahapan: [
      {
        no: 7,
        nama: 'Create Bulan Baru (Inisialisasi Periode N+1)',
        tabelDb: 'periode_penagihan, daftar_catat',
        endpoint: 'POST /api/closing/bulan-baru',
        prasyarat: 'Periode berjalan (N) sudah berstatus TERKUNCI',
        output:
          'Periode N+1 terbuka (BERJALAN) dan target DPM N+1 diterbitkan otomatis (Carry-Over).',
      },
      {
        no: 8,
        nama: 'Upload & Validasi Master Pelanggan',
        tabelDb: 'pelanggan, golongan_tarif, water_meter',
        endpoint: 'POST /api/closing/upload-master-pelanggan',
        prasyarat: 'Database induk pelanggan aktif',
        output:
          'Integritas kode tarif dan nomor seri meter seluruh pelanggan tervalidasi 100%.',
      },
      {
        no: 9,
        nama: 'Sync Pelanggan Baru ke Rute DPM',
        tabelDb: 'pelanggan, daftar_catat',
        endpoint: 'POST /api/closing/sync-pelanggan-baru',
        prasyarat: 'Pendaftaran Pasang Baru (PBPK) telah masuk master',
        output:
          'Pelanggan baru yang belum ada di daftar_catat otomatis diinjeksi dengan sumber PBPK.',
      },
      {
        no: 10,
        nama: 'Update Data Pelanggan (Sequencing Urutan Rute)',
        tabelDb: 'pelanggan, daftar_catat',
        endpoint: 'POST /api/closing/update-data-pelanggan',
        prasyarat: 'Seluruh pelanggan telah memiliki ruteKode',
        output:
          'Nomor urut rute (no_urut_rute & urutan DPM) terurut rapi tanpa duplikasi atau nilai kosong.',
      },
    ],
  },
  {
    fase: 'Fase IV: Rekonsiliasi & Monitoring Siklus',
    rentang: 'Tahap 11 – 12',
    badgeVariant: 'subtle' as const,
    ringkasan:
      'Audit keseimbangan matematis 4 pilar dan pengawasan menyeluruh dari satu konsol terpadu.',
    tahapan: [
      {
        no: 11,
        nama: 'Cek Selisih Pelanggan (Audit Rekonsiliasi 4 Pilar)',
        tabelDb: 'pelanggan, daftar_catat, cater_baca_meter, rekening_drd',
        endpoint: 'GET /api/closing/cek-selisih/:periode',
        prasyarat: 'Dapat dijalankan kapan saja (Pra maupun Pasca Closing)',
        output:
          'Laporan keseimbangan per rute dan deteksi dini pelanggan Unbilled (terbaca namun belum terbit DRD).',
      },
      {
        no: 12,
        nama: 'Monitoring Tutup Bulan & Konsol Orkestrasi',
        tabelDb: 'Seluruh tabel siklus penagihan',
        endpoint: 'GET /api/closing/workflow-status/:periode',
        prasyarat: 'Akses Otorisasi Supervisor / Admin Billing',
        output:
          'Status real-time 12 tahapan, indikator hambatan (blockers), dan tombol eksekusi terpusat.',
      },
    ],
  },
];

export function ClosingHelpGuide({ onSelectTab }: ClosingHelpGuideProps) {
  return (
    <section aria-labelledby="closing-help-title" className="space-y-6">
      {/* 1. Ringkasan Arsitektur & Skema Alur */}
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-foreground" />
              <h2
                id="closing-help-title"
                className="text-heading-20 text-foreground"
              >
                Panduan Operasional &amp; Skema Alur Closing 12 Tahap
              </h2>
            </div>
            <p className="max-w-3xl text-copy-13 text-muted-foreground">
              Dokumentasi teknis dan bisnis proses penutupan periode penagihan
              air PDAM Tirtawening. Ikuti urutan fase di bawah ini agar
              penerbitan rekening DRD dan pembukaan bulan baru berjalan tanpa
              selisih data (Zero Unbilled Discrepancy).
            </p>
          </div>

          {onSelectTab && (
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => onSelectTab('pipeline')}
            >
              <Workflow className="size-3.5" />
              <span>Kembali ke Matriks Eksekusi</span>
            </Button>
          )}
        </div>

        {/* Diagram Skema Alur 4 Fase */}
        <div className="space-y-2.5">
          <h3 className="text-label-13 text-foreground">
            Skema Arsitektur Pipeline Tutup Bulan (End-to-End Workflow)
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center justify-between">
                <Badge variant="blue-subtle" size="sm">
                  Fase 1 (Tahap 1–4)
                </Badge>
                <ShieldCheck className="size-4 text-(--ds-blue-700)" />
              </div>
              <p className="mt-2 text-label-14 text-foreground">
                Pra-Closing &amp; Validasi
              </p>
              <p className="mt-1 text-copy-12 text-muted-foreground">
                Mutasi PBPK &rarr; Approval GWM Stand Angkat &rarr; Pemetaan
                Zonasi Rute &rarr; Posting Datameter (
                <span className="font-mono text-foreground">
                  APPROVED_FINAL
                </span>
                ).
              </p>
            </div>

            <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center justify-between">
                <Badge variant="green-subtle" size="sm">
                  Fase 2 (Tahap 5–6)
                </Badge>
                <Lock className="size-4 text-(--ds-green-700)" />
              </div>
              <p className="mt-2 text-label-14 text-foreground">
                Eksekusi &amp; Kunci DRD
              </p>
              <p className="mt-1 text-copy-12 text-muted-foreground">
                Kalkulasi tarif progresif &rarr; Batch Insert{' '}
                <span className="font-mono text-foreground">rekening_drd</span>{' '}
                &rarr; Kunci Periode (<span className="font-mono">TERKUNCI</span>
                ) &rarr; Komparasi N vs N-1.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center justify-between">
                <Badge variant="amber-subtle" size="sm">
                  Fase 3 (Tahap 7–10)
                </Badge>
                <GitBranch className="size-4 text-(--ds-amber-700)" />
              </div>
              <p className="mt-2 text-label-14 text-foreground">
                Pasca-Closing &amp; Rollover
              </p>
              <p className="mt-1 text-copy-12 text-muted-foreground">
                Buka Bulan Baru (N+1) &rarr; Validasi Master &rarr; Injeksi SL
                Baru ke DPM &rarr; Normalisasi Urutan Baca Rute.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
              <div className="flex items-center justify-between">
                <Badge variant="subtle" size="sm">
                  Fase 4 (Tahap 11–12)
                </Badge>
                <Scale className="size-4 text-foreground" />
              </div>
              <p className="mt-2 text-label-14 text-foreground">
                Audit Rekonsiliasi 4 Pilar
              </p>
              <p className="mt-1 text-copy-12 text-muted-foreground">
                Verifikasi kesamaan jumlah: Master Pelanggan = Target DPM =
                Realisasi Baca = Rekening DRD Terbit.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Rumus & Aturan Matematis Inti */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-foreground" />
            <h3 className="text-heading-16 text-foreground">
              Rumus Kalkulasi Tagihan Air &amp; Stand Angkat
            </h3>
          </div>
          <p className="text-copy-13 text-muted-foreground">
            Mesin penagihan (<span className="font-mono">tagihan.engine.ts</span>
            ) menerapkan perhitungan blok progresif dan penggabungan pemakaian
            ganti meter secara presisi:
          </p>
          <div className="space-y-2 rounded-lg border border-border bg-(--ds-gray-100) p-3.5 font-mono text-label-12 text-foreground">
            <div>
              <span className="text-muted-foreground">
                // 1. Pemakaian Normal:
              </span>
              <br />
              Pakai_m3 = max(0, STMA - STML)
            </div>
            <div className="border-t border-border pt-2">
              <span className="text-muted-foreground">
                // 2. Pemakaian Ganti Water Meter (Tahap 2):
              </span>
              <br />
              Pakai_GWM = max(0, Stand_Angkat - STML) + max(0, STMA -
              Stand_Pasang)
            </div>
            <div className="border-t border-border pt-2">
              <span className="text-muted-foreground">
                // 3. Tarif Progresif 4 Blok &amp; Total Rekening DRD:
              </span>
              <br />
              Harga_Air = (m3_B1 &times; Tarif_B1) + (m3_B2 &times; Tarif_B2) +
              (m3_B3 &times; Tarif_B3) + (m3_B4 &times; Tarif_B4)
              <br />
              Total_DRD = Harga_Air + Bea_Beban + Bea_Admin + Air_Kotor
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-foreground" />
            <h3 className="text-heading-16 text-foreground">
              Hukum Rekonsiliasi 4 Pilar &amp; Rollover DPM (N+1)
            </h3>
          </div>
          <p className="text-copy-13 text-muted-foreground">
            Sebelum dan sesudah eksekusi Tahap 5, sistem memvalidasi persamaan
            keseimbangan 4 pilar serta aturan carry-over DPM bulan baru:
          </p>
          <div className="space-y-2 rounded-lg border border-border bg-(--ds-gray-100) p-3.5 font-mono text-label-12 text-foreground">
            <div>
              <span className="text-muted-foreground">
                // Persamaan Rekonsiliasi 4 Pilar (Tahap 11):
              </span>
              <br />
              Count(Master_Aktif) == Count(DPM_N) == Count(Cater_Baca_N) ==
              Count(DRD_N)
            </div>
            <div className="border-t border-border pt-2">
              <span className="text-muted-foreground">
                // Deteksi Unbilled (Wajib = 0 saat Tutup Bulan):
              </span>
              <br />
              Selisih_Unbilled = Count(Cater_Baca_N) - Count(DRD_N) = 0
            </div>
            <div className="border-t border-border pt-2">
              <span className="text-muted-foreground">
                // Formula Penerbitan DPM Bulan Baru (Tahap 7 &amp; 9):
              </span>
              <br />
              DPM(N+1) = [DPM(N) WHERE status != &apos;DICABUT&apos;] &cup;
              [Pelanggan_Baru_PBPK]
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Tabel Spesifikasi Teknis & SOP 12 Tahapan */}
      <Card className="space-y-4 p-5">
        <div>
          <h3 className="text-heading-16 text-foreground">
            Matriks Spesifikasi Teknis &amp; SOP 12 Tahapan Closing
          </h3>
          <p className="mt-0.5 text-copy-13 text-muted-foreground">
            Rincian hubungan antar tahapan, tabel database PostgreSQL yang
            dimutasi, endpoint API backend, serta syarat kelulusan tiap tahap.
          </p>
        </div>

        <div className="space-y-6">
          {CLOSING_PHASES.map((group) => (
            <div key={group.fase} className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={group.badgeVariant} size="md">
                    {group.rentang}
                  </Badge>
                  <h4 className="text-label-14 text-foreground">
                    {group.fase}
                  </h4>
                </div>
                <span className="text-copy-12 text-muted-foreground">
                  {group.ringkasan}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14 text-center">Tahap</TableHead>
                      <TableHead className="w-60">Nama Modul</TableHead>
                      <TableHead className="w-48">Tabel Database</TableHead>
                      <TableHead className="w-56">Prasyarat</TableHead>
                      <TableHead>Indikator Selesai (Output)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.tahapan.map((t) => (
                      <TableRow key={t.no}>
                        <TableCell className="text-center text-label-12-mono tabular-nums text-foreground">
                          #{t.no}
                        </TableCell>
                        <TableCell>
                          <p className="text-label-13 text-foreground">
                            {t.nama}
                          </p>
                          <p className="mt-0.5 text-label-11-mono text-muted-foreground">
                            {t.endpoint}
                          </p>
                        </TableCell>
                        <TableCell className="text-label-12-mono text-muted-foreground">
                          {t.tabelDb}
                        </TableCell>
                        <TableCell className="text-copy-12 text-muted-foreground">
                          {t.prasyarat}
                        </TableCell>
                        <TableCell className="text-copy-12 text-foreground">
                          {t.output}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Panduan Penyelesaian Masalah (Troubleshooting Hambatan Closing) */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-4 text-foreground" />
          <h3 className="text-heading-16 text-foreground">
            Penyelesaian Masalah Umum (Troubleshooting Hambatan Closing)
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-(--ds-amber-700)">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="text-label-13">
                Hambatan: VERIFIKASI_BELUM_TUNTAS
              </span>
            </div>
            <p className="text-copy-12 text-muted-foreground">
              <strong>Penyebab:</strong> Masih ada hasil bacaan meter petugas
              lapangan yang berstatus <span className="font-mono">DRAFT</span>,{' '}
              <span className="font-mono">SUBMITTED</span>, atau{' '}
              <span className="font-mono">VERIFIED_L1</span>.
            </p>
            <p className="text-copy-12 text-foreground">
              <strong>Solusi:</strong> Klik tombol{' '}
              <span className="font-mono">Tahap 4: Posting Datameter</span> pada
              Konsol Closing untuk mengesahkan seluruh bacaan menjadi{' '}
              <span className="font-mono">APPROVED_FINAL</span>.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-(--ds-amber-700)">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="text-label-13">
                Tahap 3 / 9: Pelanggan Tanpa Rute
              </span>
            </div>
            <p className="text-copy-12 text-muted-foreground">
              <strong>Penyebab:</strong> Terdapat pelanggan baru (PBPK) atau
              pelanggan migrasi yang kolom <span className="font-mono">rute_kode</span>{' '}
              atau masukannya di DPM belum terisi.
            </p>
            <p className="text-copy-12 text-foreground">
              <strong>Solusi:</strong> Klik tombol aksi{' '}
              <span className="font-mono">Sinkronkan Zonasi</span> pada kartu
              Tahap 3 dan <span className="font-mono">Sync ke DPM</span> pada
              kartu Tahap 9.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 text-(--ds-green-700)">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="text-label-13">
                Tahap 11: Ditemukan Selisih Unbilled
              </span>
            </div>
            <p className="text-copy-12 text-muted-foreground">
              <strong>Penyebab:</strong> Jumlah pembacaan di{' '}
              <span className="font-mono">cater_baca_meter</span> lebih besar
              dibanding rekening yang sudah terbit di{' '}
              <span className="font-mono">rekening_drd</span>.
            </p>
            <p className="text-copy-12 text-foreground">
              <strong>Solusi:</strong> Buka menu{' '}
              <Link
                href="/tools-tutup/cek-selisih-pelanggan"
                className="underline underline-offset-2"
              >
                Cek Selisih Pelanggan
              </Link>{' '}
              untuk menginspeksi daftar NOLG unbilled, lalu jalankan{' '}
              <span className="font-mono">Tahap 5: Kunci Periode &amp; DRD</span>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-(--ds-gray-100) p-3.5">
          <span className="text-copy-12 text-muted-foreground">
            Butuh melakukan pengecekan keseimbangan per rute atau menambahkan
            sambungan baru sekarang?
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/tools-tutup/pbpk">
                <span>Buka Modul PBPK (Tahap 1)</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/tools-tutup/cek-selisih-pelanggan">
                <span>Buka Audit 4 Pilar (Tahap 11)</span>
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
