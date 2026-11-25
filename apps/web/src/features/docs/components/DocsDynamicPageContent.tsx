import * as React from "react"
import Link from "next/link"
import { ExternalLink, ShieldCheck, HelpCircle } from "lucide-react"
import { DocsCallout } from "./DocsCallout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { DocItemMeta } from "../types"

interface DocsDynamicPageContentProps {
  meta: DocItemMeta
}

export function DocsDynamicPageContent({ meta }: DocsDynamicPageContentProps) {
  return (
    <div className="space-y-10">
      {/* 1. Ikhtisar */}
      <section id="ikhtisar">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight first:mt-0 text-foreground">
          Ikhtisar &amp; Tujuan Halaman
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Halaman <strong>{meta.title}</strong> (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-foreground">
            {meta.routeRef}
          </code>
          ) merupakan bagian dari modul <strong>{meta.categoryTitle}</strong> pada platform M2C Tirtawening.
        </p>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          {meta.description}
        </p>

        <DocsCallout type="info" title="Akses Cepat Modul Operasional">
          <p>
            Anda dapat langsung menuju ke halaman aplikasi ini dengan mengklik tombol di bawah atau melalui menu navigasi dashboard utama.
          </p>
          <div className="pt-2">
            <Link href={meta.routeRef}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs bg-card hover:bg-muted font-medium"
              >
                <span>Buka Halaman {meta.title}</span>
                <ExternalLink className="size-3.5" />
              </Button>
            </Link>
          </div>
        </DocsCallout>
      </section>

      {/* 2. Hak Akses & Peran */}
      <section id="akses">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Peran &amp; Hak Akses Pengguna
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Berdasarkan standar keamanan Role-Based Access Control (RBAC), halaman ini hanya dapat diakses oleh peran-peran berikut:
        </p>

        <div className="my-6 w-full overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 font-semibold text-foreground border-b border-border text-xs">
              <tr>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3">Tingkat Izin</th>
                <th className="p-3">Keterangan Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px] text-muted-foreground">
              {meta.roles && meta.roles.length > 0 ? (
                meta.roles.map((role) => (
                  <tr key={role}>
                    <td className="p-3 font-mono font-medium text-foreground">
                      {role}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <ShieldCheck className="size-3" />
                        Terotorisasi
                      </span>
                    </td>
                    <td className="p-3">
                      Diberikan akses penuh/operasional sesuai tugas pokok dan fungsi di unit kerja.
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 font-mono font-medium text-foreground">
                    SUPERADMIN &amp; EXECUTIVE
                  </td>
                  <td className="p-3">Akses Khusus</td>
                  <td className="p-3">Halaman terbatas untuk pengawasan dan konfigurasi sistem.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Panduan Langkah demi Langkah */}
      <section id="panduan-langkah">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Panduan Penggunaan Langkah demi Langkah
        </h2>

        {/* Shadcn Steps Timeline */}
        <div className="mt-8 mb-12 [counter-reset:step] ml-4 border-l border-border pl-8 space-y-8">
          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Buka Halaman Modul</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Akses halaman <strong>{meta.title}</strong> melalui sidebar dashboard pada kategori <em>{meta.categoryTitle}</em> atau via URL langsung <code>{meta.routeRef}</code>.
            </p>
          </div>

          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Tentukan Parameter &amp; Filter Data</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Gunakan bilah filter di bagian atas (seperti periode tahun/bulan, wilayah kecamatan/kelurahan, atau nomor rute petugas) untuk memfokuskan data yang ingin ditampilkan.
            </p>
          </div>

          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Tinjau atau Input Data Operasional</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Periksa ringkasan tabel data atau masukkan pembaruan status sesuai Standard Operating Procedure (SOP) yang berlaku.
            </p>
          </div>

          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Simpan Perubahan atau Ekspor Hasil</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Klik tombol simpan jika melakukan perubahan, atau gunakan fitur unduh laporan (Excel / PDF) untuk kebutuhan arsip dan pelaporan manajerial.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FAQ */}
      <section id="faq">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Pertanyaan Umum (FAQ)
        </h2>

        <div className="space-y-4 mt-6">
          <div className="rounded-lg border border-border p-4 space-y-1.5 bg-card">
            <h4 className="font-semibold text-foreground text-sm">
              Bagaimana jika data di halaman ini tidak muncul atau kosong?
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Pastikan periode tagihan dan filter wilayah yang dipilih sudah memiliki transaksi baca meter aktif. Jika kendala berlanjut, hubungi admin sistem atau periksa koneksi database.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-1.5 bg-card">
            <h4 className="font-semibold text-foreground text-sm">
              Apakah setiap perubahan di halaman ini tercatat dalam audit log?
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Ya, seluruh aktivitas perubahan data, persetujuan (approval), dan koreksi transaksi otomatis dicatat pada riwayat audit sistem lengkap dengan stempel waktu dan identitas akun petugas.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
