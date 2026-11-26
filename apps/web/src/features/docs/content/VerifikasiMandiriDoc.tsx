"use client";

import * as React from "react";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  ArrowLeft,
  Camera,
  History,
} from "lucide-react";
import { DocsCallout } from "../components/DocsCallout";
import { Button } from "@/components/ui/button";
import type { DocHeading } from "../types";

export const verifikasiMandiriHeadings: DocHeading[] = [
  { id: "ikhtisar", title: "1. Ikhtisar & Latar Belakang Lapor Mandiri", level: 2 },
  { id: "aturan-validasi", title: "2. Aturan Validasi: Jendela Waktu & Geofencing GPS", level: 2 },
  { id: "antarmuka-mandiri", title: "3. Struktur Antarmuka & Panel Verifikasi Mandiri", level: 2 },
  { id: "alur-persetujuan", title: "4. Alur Persetujuan & Override Data Lapangan", level: 2 },
  { id: "mekanisme-rollback", title: "5. Mekanisme Pembatalan (Unverify) & Pemulihan Data Petugas", level: 2 },
  { id: "penolakan-laporan", title: "6. Prosedur Penolakan Laporan (Reject) & Notifikasi Warga", level: 2 },
  { id: "panduan-langkah", title: "7. Panduan Operasional Verifikator Mandiri", level: 2 },
  { id: "faq", title: "8. Pertanyaan Umum (FAQ)", level: 2 },
];

export function VerifikasiMandiriDoc() {
  return (
    <div className="space-y-10">
      {/* 1. Ikhtisar */}
      <section id="ikhtisar">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight first:mt-0 text-foreground">
          1. Ikhtisar &amp; Latar Belakang Lapor Mandiri
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Halaman <strong>Verifikasi Pembacaan Pelanggan (Mandiri)</strong> (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-foreground">
            /verifikasi/baca-pelanggan
          </code>
          ) adalah modul khusus yang disediakan bagi staf verifikator kantor untuk meninjau dan memvalidasi kiriman foto angka meter air yang dilaporkan secara mandiri oleh warga melalui Web Portal Pelanggan (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-foreground">
            /lapor-meter
          </code>
          ) maupun Aplikasi Mobile Warga M2C.
        </p>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Layanan mandiri ini hadir sebagai solusi strategis untuk meniadakan taksasi fiktif dan memangkas kasus rumah terkunci / pagar tertutup (kondisi kode <code>DK</code>). Dengan adanya lapor mandiri, pelanggan dapat berpartisipasi aktif menjaga keakuratan tagihan air mereka setiap bulan.
        </p>

        <DocsCallout type="info" title="Hakikat Laporan Mandiri">
          Laporan mandiri warga yang telah disetujui (<em>Approved</em>) tidak otomatis menerbitkan tagihan resmi, melainkan disuntikkan ke dalam sistem verifikasi sebagai pembacaan bertanda <strong>KONSUMEN (Kode Z - Stand Konsumen)</strong> pada ring V1. Pengesahan final rekening tetap menjadi kewenangan bertingkat pejabat verifikasi (V3).
        </DocsCallout>
      </section>

      {/* 2. Aturan Validasi */}
      <section id="aturan-validasi">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          2. Aturan Validasi: Jendela Waktu &amp; Geofencing GPS
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Untuk mencegah kecurangan angka meteran atau pengiriman foto lama/palsu, sistem memberlakukan dua gerbang validasi otomatis di tingkat backend:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-[14px] text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" /> Jendela Waktu Lapor (1–25 WIB)
            </h3>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Pelaporan mandiri hanya dibuka pada <strong>tanggal 1 hingga tanggal 25 pukul 23:59 WIB</strong> setiap bulan penagihan berjalan. Mulai tanggal 26, sistem secara otomatis mengunci pintu masuk lapor mandiri (<em>cutoff</em>) untuk persiapan proses perhitungan tagihan resmi dan penutupan buku (Closing DRD).
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="font-semibold text-[14px] text-foreground flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> Geofencing PostGIS (&le; 50 Meter)
            </h3>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
              Saat warga mengambil foto meteran, browser/aplikasi mendeteksi koordinat GPS perangkat. Sistem menghitung jarak euclidean geospasial terhadap titik rumah resmi pelanggan di database:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-[12px] text-muted-foreground">
              <li><strong>Jarak &le; 50 meter:</strong> Titik GPS dinyatakan valid (Laporan Hijau).</li>
              <li><strong>Jarak &gt; 50 meter:</strong> Ditandai peringatan jarak di panel verifikator.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Struktur Antarmuka */}
      <section id="antarmuka-mandiri">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          3. Struktur Antarmuka &amp; Panel Verifikasi Mandiri
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Halaman verifikasi mandiri menyajikan antarmuka tabel interaktif dengan empat status utama:
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-muted/50 border-b border-border text-foreground font-semibold">
              <tr>
                <th className="p-3">Status Laporan</th>
                <th className="p-3">Arti &amp; Makna Bisnis</th>
                <th className="p-3">Aksi yang Tersedia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground/80">
              <tr>
                <td className="p-3 font-semibold text-amber-500">MENUNGGU (PENDING)</td>
                <td className="p-3">Laporan baru dikirim oleh warga dan sedang mengantre untuk diperiksa kejelasan fotonya oleh petugas verifikator kantor.</td>
                <td className="p-3">Klik Kanan → <strong>Verifikasi</strong> (Setujui) atau <strong>Tolak</strong>.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-blue-500">DIVERIFIKASI (APPROVED)</td>
                <td className="p-3">Foto telah disahkan oleh staf verifikator. Angka stand telah disuntikkan ke tabel transaksi baca meter petugas pada jenjang V1.</td>
                <td className="p-3">Klik Kanan → <strong>Batalkan Verifikasi (Unverify)</strong>.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-emerald-500">DIGUNAKAN (BILLING)</td>
                <td className="p-3">Laporan mandiri telah disahkan hingga tahap akhir V3 atau telah masuk penagihan resmi rekening air.</td>
                <td className="p-3">Terkunci (Hanya dapat di-reopen melalui alur verifikasi resmi).</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-destructive">DITOLAK (REJECTED)</td>
                <td className="p-3">Laporan ditolak (misalnya foto buram, dial tertutup lumpur, atau angka tidak sesuai). Alasan penolakan tersimpan di sistem.</td>
                <td className="p-3">Klik Kanan → <strong>Kembalikan ke Antrean</strong> jika ingin ditinjau ulang.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Alur Persetujuan & Override */}
      <section id="alur-persetujuan">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          4. Alur Persetujuan &amp; Override Data Lapangan
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Ketika verifikator menekan tombol <strong>Verifikasi (Approve)</strong> di modal mandiri:
        </p>

        <div className="space-y-3 mt-4 text-[13px] text-foreground/90">
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <strong className="text-foreground">1. Pemeriksaan Periode &amp; Status Terkunci</strong>
            <p className="text-muted-foreground mt-1">
              Sistem memverifikasi bahwa sambungan pelanggan belum berada dalam status <code>LOCKED_BILLING</code> atau <code>APPROVED_FINAL (V3)</code>. Bila sudah terkunci, sistem menolak penimpaan mandiri secara otomatis untuk melindungi kepastian tagihan.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <strong className="text-foreground">2. Pencadangan Data Petugas Eksisting (Backup Preservation)</strong>
            <p className="text-muted-foreground mt-1">
              Jika sambungan tersebut sebelumnya telah dicatat oleh petugas lapangan (atau LapDataMeter), data asli petugas (stand lalu, stand akhir, kubikasi, dan kondisi) <strong>tidak dihapus</strong>, melainkan disimpan ke dalam catatan jejak audit berformat <code>[PREV_PETUGAS:...]</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <strong className="text-foreground">3. Penulisan Angka Mandiri ke Transaksi Aktif</strong>
            <p className="text-muted-foreground mt-1">
              Data transaksi diaktifkan dengan stand mandiri, kondisi <code>STAND-KONSUMEN (Kode Z)</code>, foto meter mandiri, dan status awal <code>VERIFIED_L1</code>. Petugas pemeriksa di halaman verifikasi lapangan akan melihat indikator biru berlambang konsumen.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Mekanisme Rollback */}
      <section id="mekanisme-rollback">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          5. Mekanisme Pembatalan (Unverify) &amp; Pemulihan Data Petugas
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Jika verifikator membatalkan persetujuan laporan mandiri (<em>Unverify</em>), sistem mengeksekusi logika pemulihan otomatis (*State Reversion*) yang sangat bersih:
        </p>

        <div className="space-y-4 mt-4">
          <DocsCallout type="info" title="Skenario A: Awalnya Sudah Ada Laporan Petugas Lapangan">
            <p className="text-[13px] leading-relaxed">
              Sistem membaca catatan cadangan <code>[PREV_PETUGAS:...]</code> dan <strong>memulihkan seluruh data petugas lapangan asli</strong> (stand akhir, stand lalu, kubikasi pemakaian, dan kondisi awal). Foto mandiri dilepaskan, dan status dikembalikan ke <code>SUBMITTED</code>. Data petugas kembali utuh seperti sebelum laporan mandiri disetujui.
            </p>
          </DocsCallout>

          <DocsCallout type="warning" title="Skenario B: Awalnya Belum Ada Laporan Petugas (Murni Mandiri)">
            <p className="text-[13px] leading-relaxed">
              Karena sambungan tersebut belum pernah dicatat oleh petugas, sistem secara aman <strong>menghapus baris transaksi sementara</strong> dari tabel transaksi baca meter dan mengembalikan status sambungan pada daftar catat (DPM) ke <code>BELUM_DICATAT</code>. Tidak ada baris data hantu (*phantom records*) yang tertinggal.
            </p>
          </DocsCallout>
        </div>
      </section>

      {/* 6. Penolakan Laporan */}
      <section id="penolakan-laporan">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          6. Prosedur Penolakan Laporan (Reject) &amp; Notifikasi Warga
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Bila laporan mandiri ditolak (klik kanan → <strong>Tolak</strong>):
        </p>

        <ul className="list-disc pl-5 mt-3 space-y-1.5 text-[13px] text-foreground/90">
          <li>Verifikator <strong>wajib menyertakan alasan penolakan</strong> (misal: <em>"Foto buram tidak terbaca dial angka meter"</em> atau <em>"Angka stand tidak sesuai dengan angka pada foto"</em>).</li>
          <li>Status berubah menjadi <code>DITOLAK (REJECTED)</code>. Alasan penolakan langsung tampil saat warga mengecek status laporannya di portal publik.</li>
          <li>Foto dan angka mandiri <strong>dibersihkan dari antrean verifikasi petugas</strong>, sehingga petugas lapangan tetap akan berkunjung melakukan pencatatan fisik secara normal.</li>
        </ul>
      </section>

      {/* 7. Panduan Langkah demi Langkah */}
      <section id="panduan-langkah">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          7. Panduan Operasional Verifikator Mandiri
        </h2>

        <div className="space-y-4 mt-4">
          <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
              1
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-foreground">Buka Tab Status MENUNGGU</h4>
              <p className="text-[13px] text-muted-foreground mt-1">
                Gunakan filter status di bilah atas untuk menyaring laporan dengan status <code>MENUNGGU</code> pada periode berjalan.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
              2
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-foreground">Inspeksi Foto di Panel Kanan</h4>
              <p className="text-[13px] text-muted-foreground mt-1">
                Klik baris pelanggan. Periksa foto meteran di panel kanan. Cocokkan angka hitam pada dial meter (m³) dengan angka <code>Stand Dilaporkan</code>. Periksa juga foto pembanding bulan lalu untuk memastikan pemakaian wajar.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-xs">
              3
            </div>
            <div>
              <h4 className="text-[14px] font-semibold text-foreground">Verifikasi &amp; Koreksi Angka (Bila Perlu)</h4>
              <p className="text-[13px] text-muted-foreground mt-1">
                Klik kanan baris → pilih <strong>Verifikasi Laporan</strong>. Jika pelanggan salah ketik (misal di foto 542 tetapi diketik 524), verifikator dapat mengoreksi angka stand sebelum menekan <strong>Simpan &amp; Verifikasi</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          8. Pertanyaan Umum (FAQ)
        </h2>

        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-semibold text-[14px] text-foreground">
              Apakah pelanggan bisa melapor mandiri lebih dari satu kali dalam sebulan?
            </h4>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
              <strong>Tidak bisa</strong> jika laporan pertama berstatus <code>PENDING</code> atau <code>APPROVED</code>. Namun jika laporan sebelumnya berstatus <code>REJECTED</code> (Ditolak), pelanggan diizinkan mengirim ulang foto meteran baru selama masih dalam jendela tanggal 1–25 WIB.
            </p>
          </div>

          <div className="p-4 rounded-lg border border-border bg-card">
            <h4 className="font-semibold text-[14px] text-foreground">
              Apa yang terjadi jika warga lapor mandiri di tanggal 26 atau setelahnya?
            </h4>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
              Portal publik akan menampilkan pemberitahuan bahwa pelaporan mandiri periode berjalan telah ditutup. Warga diarahkan untuk menunggu kunjungan fisik petugas rute atau melapor pada periode bulan berikutnya mulai tanggal 1.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Nav */}
      <div className="pt-6 border-t border-border flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/docs/verifikasi-baca-petugas" className="text-primary hover:text-primary/90">
            <ArrowLeft className="size-3.5 mr-1.5" />
            Kembali ke Panduan Verifikasi Petugas
          </Link>
        </Button>

        <Button variant="outline" size="sm" asChild>
          <Link href="/verifikasi/baca-pelanggan">
            Buka Halaman Verifikasi Mandiri
            <ExternalLink className="size-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
