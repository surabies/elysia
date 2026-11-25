"use client"

import * as React from "react"
import { Copy, Check, ChevronRight } from "lucide-react"
import { DocsCallout } from "../components/DocsCallout"
import { Button } from "@/components/ui/button"
import type { DocHeading } from "../types"

export const kpiInsentifHeadings: DocHeading[] = [
  { id: "ikhtisar", title: "Ikhtisar & Latar Belakang", level: 2 },
  { id: "tujuan-modul", title: "Tujuan Utama Modul", level: 3 },
  { id: "peran-pengguna", title: "Peran & Hak Akses Pengguna", level: 2 },
  { id: "struktur-halaman", title: "Struktur Antarmuka & Dua Tab Kerja", level: 2 },
  { id: "tab-evaluasi", title: "Tab 1: Evaluasi & Insentif Petugas", level: 3 },
  { id: "tab-pengaturan", title: "Tab 2: Pengaturan Rumusan & Alokasi Beban", level: 3 },
  { id: "faktor-kesulitan-medan", title: "Faktor Kesulitan Medan per Rute", level: 2 },
  { id: "rumus-komposit", title: "Rumus Faktor Komposit Petugas", level: 3 },
  { id: "formula-insentif", title: "Formulasi Matematis Insentif", level: 2 },
  { id: "indeks-beban", title: "Indeks Beban Kerja (I_beban)", level: 3 },
  { id: "skor-kinerja", title: "Skor Kinerja Petugas (S_kinerja)", level: 3 },
  { id: "tiering-grade", title: "Pengali Tier Grade (M_grade)", level: 3 },
  { id: "nominal-rupiah", title: "Formula Nominal Akhir Rupiah", level: 3 },
  { id: "panduan-langkah", title: "Panduan Langkah demi Langkah", level: 2 },
  { id: "faq", title: "Pertanyaan Umum (FAQ)", level: 2 },
]

function CodeFormulaBlock({ formula }: { formula: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(formula)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-4 rounded-lg border border-border bg-muted/30 dark:bg-muted/15 p-4 font-mono text-[13px] text-foreground">
      <div className="overflow-x-auto pr-10">{formula}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute right-2 top-2 size-7 text-muted-foreground hover:text-foreground"
        title="Salin rumus"
      >
        {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  )
}

export function KpiInsentifDoc() {
  return (
    <div className="space-y-10">
      {/* 1. Ikhtisar */}
      <section id="ikhtisar">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight first:mt-0 text-foreground">
          Ikhtisar &amp; Latar Belakang
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Halaman <strong>Kinerja &amp; Insentif Petugas</strong> (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[13px] font-semibold text-foreground">
            /kpi
          </code>
          ) dirancang untuk mewujudkan evaluasi kinerja yang objektif, transparan, dan berkeadilan bagi seluruh petugas pencatat meter air (cater).
        </p>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Sistem ini menggantikan evaluasi manual konvensional yang kerap hanya mengukur persentase selesai semata tanpa mempertimbangkan berat-ringannya medan rute maupun kepatuhan terhadap standar operasional (titik GPS dan kualitas foto meteran).
        </p>

        <DocsCallout type="info" title="Prinsip Zero Manual Manipulation">
          Seluruh data capaian (jumlah SL terbaca, kepatuhan GPS &le;50 meter, kecepatan baca harian LPS, dan ketiadaan revisi) ditarik 100% otomatis dari transaksi database riil sistem. Tidak ada rekayasa atau input manual terhadap angka realisasi petugas.
        </DocsCallout>

        <div id="tujuan-modul" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            Tujuan Utama Modul
          </h3>
          <ul className="my-3 ml-6 list-disc [&>li]:mt-2 text-[14px] text-foreground/85">
            <li>
              <strong>Keadilan Beban Kerja:</strong> Memberikan apresiasi proporsional kepada petugas yang mengampu rute dengan kontur perbukitan, gang sempit, atau sebaran meteran yang sulit.
            </li>
            <li>
              <strong>Mendorong Kualitas:</strong> Mencegah praktik <em>tembak angka</em> di luar titik koordinat dengan mewajibkan akurasi GPS dan kualitas foto sebagai syarat pengali insentif.
            </li>
            <li>
              <strong>Otomatisasi Penggajian:</strong> Menyediakan estimasi insentif rupiah yang transparan setiap saat sebelum periode tutup buku bulanan.
            </li>
          </ul>
        </div>
      </section>

      {/* 2. Peran Pengguna */}
      <section id="peran-pengguna">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Peran &amp; Hak Akses Pengguna
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Modul ini dapat diakses oleh beberapa tingkatan peran pengguna dengan wewenang yang disesuaikan:
        </p>

        <div className="my-6 w-full overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 font-semibold text-foreground border-b border-border text-xs">
              <tr>
                <th className="p-3">Peran (Role)</th>
                <th className="p-3">Hak Akses Utama</th>
                <th className="p-3">Wewenang Modul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px] text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-foreground">Petugas Pencatat (PENCATAT)</td>
                <td className="p-3">Melihat realisasi dan estimasi insentif pribadi</td>
                <td className="p-3">Hanya Baca (Read-only)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Supervisor (VERIFIKATOR_1)</td>
                <td className="p-3">Memantau seluruh petugas tim dan mengecek rute</td>
                <td className="p-3">Evaluasi &amp; Validasi Lapangan</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Admin Billing &amp; Senior Manager</td>
                <td className="p-3">Mengatur faktor medan rute, status dinas, dan target khusus SL</td>
                <td className="p-3">Pengaturan Alokasi Beban</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Superadmin &amp; Direksi</td>
                <td className="p-3">Mengubah tarif dasar insentif, bobot KPI, dan integrasi scorecard</td>
                <td className="p-3">Akses Penuh (Full Control)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Struktur Halaman */}
      <section id="struktur-halaman">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Struktur Antarmuka &amp; Dua Tab Kerja
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Halaman utama dibagi menjadi dua tab kerja modular untuk memisahkan pengawasan capaian dengan konfigurasi parameter:
        </p>

        <div id="tab-evaluasi" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            Tab 1: Evaluasi &amp; Insentif Petugas (Tampilan Default)
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-muted-foreground">
            Menampilkan tabel kartu realisasi bulanan per petugas yang mencakup:
          </p>
          <ul className="my-2 ml-6 list-disc [&>li]:mt-1.5 text-[14px] text-foreground/85">
            <li><strong>Target SL Aktif</strong> vs <strong>Realisasi SL Terbaca</strong>.</li>
            <li><strong>Kepatuhan GPS</strong> (persentase bacaan dalam radius &le;50 meter).</li>
            <li><strong>Faktor Kesulitan Medan Komposit</strong> (rata-rata berbobot dari rute yang diampu).</li>
            <li><strong>Skor Kinerja Gabungan</strong> dan <strong>Grade Akhir (A, B, C, D)</strong>.</li>
            <li><strong>Estimasi Insentif (Rp)</strong> yang dihitung otomatis secara realtime.</li>
          </ul>
        </div>

        <div id="tab-pengaturan" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            Tab 2: Pengaturan Rumusan &amp; Alokasi Beban
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-muted-foreground">
            Digunakan oleh koordinator dan admin untuk mengatur parameter operasional:
          </p>
          <ul className="my-2 ml-6 list-disc [&>li]:mt-1.5 text-[14px] text-foreground/85">
            <li><strong>Sub-tab A (Tarif &amp; Threshold):</strong> Menentukan tarif dasar per SL (misal Rp 400), pagu insentif dasar (misal Rp 500.000), serta ambang batas minimal SL terbaca.</li>
            <li><strong>Sub-tab B (Alokasi Beban &amp; Faktor Kesulitan Rute):</strong> Mengatur faktor kesulitan per kode rute (1.00x s/d 1.20x), filter per petugas, status dinas (Aktif / Cuti / Sakit), dan target khusus penugasan.</li>
            <li><strong>Sub-tab C (Bobot KPI):</strong> Mengatur persentase bobot capaian (Capaian SL 40%, GPS 25%, Kualitas 20%, Kecepatan 15%).</li>
          </ul>
        </div>
      </section>

      {/* 4. Faktor Kesulitan Medan */}
      <section id="faktor-kesulitan-medan">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Faktor Kesulitan Medan per Rute
        </h2>
        <p className="leading-7 mt-3 text-[15px] text-foreground/90">
          Salah satu inovasi penting dalam sistem ini adalah penetapan faktor kesulitan medan yang <strong>melekat pada kode rute baca</strong>, bukan flat per nama petugas. Dengan demikian, jika terjadi mutasi atau rotasi penugasan rute, penilaian tetap konsisten dengan kondisi geografis lapangan.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-6">
          <div className="rounded-lg border border-border bg-card p-3.5 text-center">
            <span className="block font-mono font-bold text-base text-foreground">1.00x</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Normal / Datar</span>
            <p className="text-[11px] text-muted-foreground mt-1">Akses jalan aspal lebar, perumahan teratur, meteran mudah dijangkau.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3.5 text-center">
            <span className="block font-mono font-bold text-base text-foreground">1.05x</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Sedang</span>
            <p className="text-[11px] text-muted-foreground mt-1">Jalan perkampungan, sebagian gang paving, kontur tanah sedikit bergelombang.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3.5 text-center">
            <span className="block font-mono font-bold text-base text-foreground">1.10x</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Berat / Padat</span>
            <p className="text-[11px] text-muted-foreground mt-1">Gang sempit padat penduduk, meteran di dalam pagar terkunci atau tertimbun.</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3.5 text-center">
            <span className="block font-mono font-bold text-base text-foreground">1.20x</span>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Ekstrem / Bukit</span>
            <p className="text-[11px] text-muted-foreground mt-1">Elevasi terjal, tangga curam, sinyal seluler lemah, jarak antarrumah berjauhan.</p>
          </div>
        </div>

        <div id="rumus-komposit" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            Rumus Faktor Komposit Petugas
          </h3>
          <p className="leading-7 mt-2 text-[14px] text-muted-foreground">
            Jika seorang petugas mengampu beberapa rute dengan tingkat kesulitan berbeda, sistem menghitung rata-rata komposit berbobot sambungan (SL):
          </p>

          <CodeFormulaBlock formula="F_komposit = Σ (Target_SL_r × Faktor_Medan_r) / Σ (Target_SL_r)" />

          <p className="text-xs text-muted-foreground">
            Contoh: Petugas mengampu Rute A (1.000 SL, faktor 1.00x) dan Rute B (500 SL, faktor 1.15x).
            <br />
            <code>F_komposit = (1.000 × 1.00 + 500 × 1.15) / 1.500 = 1.575 / 1.500 = 1.05x</code>.
          </p>
        </div>
      </section>

      {/* 5. Formula Insentif */}
      <section id="formula-insentif">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Formulasi Matematis Insentif
        </h2>

        {/* Indeks Beban */}
        <div id="indeks-beban" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            A. Indeks Beban Kerja (I_beban)
          </h3>
          <CodeFormulaBlock formula="I_beban = Clamp(Target_SL_Petugas / Rata_Rata_Target_Semua_Petugas, 0.70, 1.40) × F_komposit" />
        </div>

        {/* Skor Kinerja */}
        <div id="skor-kinerja" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            B. Skor Kinerja Petugas (S_kinerja)
          </h3>
          <CodeFormulaBlock formula="S_kinerja = (40% × %Capaian_SL) + (25% × %Akurasi_GPS) + (20% × %Kualitas_Tanpa_Revisi) + (15% × %Kecepatan_LPS)" />
        </div>

        {/* Tiering Grade */}
        <div id="tiering-grade" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            C. Pengali Tier Grade (M_grade)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-center">
            <div className="p-3 rounded-lg border border-border bg-card">
              <strong className="block text-emerald-600 dark:text-emerald-400 font-bold text-sm">Grade A (&ge; 90)</strong>
              <span className="font-mono text-xs font-semibold">110% (1,10x)</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Bonus Prestasi</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <strong className="block text-blue-600 dark:text-blue-400 font-bold text-sm">Grade B (75 - 89)</strong>
              <span className="font-mono text-xs font-semibold">100% (1,00x)</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sesuai Target</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <strong className="block text-amber-600 dark:text-amber-400 font-bold text-sm">Grade C (60 - 74)</strong>
              <span className="font-mono text-xs font-semibold">65% (0,65x)</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Perlu Peningkatan</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card">
              <strong className="block text-red-600 dark:text-red-400 font-bold text-sm">Grade D (&lt; 60)</strong>
              <span className="font-mono text-xs font-semibold">0% (0,00x)</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">Pembinaan / Gugur</p>
            </div>
          </div>
        </div>

        {/* Nominal Rupiah */}
        <div id="nominal-rupiah" className="mt-6">
          <h3 className="font-heading scroll-m-20 text-base font-semibold tracking-tight text-foreground">
            D. Formula Nominal Akhir Rupiah
          </h3>
          <CodeFormulaBlock formula="Total_Insentif (Rp) = (Pagu_Dasar + [SL_Terbaca_Valid × Tarif_per_SL]) × I_beban × M_grade" />
        </div>
      </section>

      {/* 6. Panduan Langkah demi Langkah (Gaya Shadcn Steps) */}
      <section id="panduan-langkah">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Panduan Langkah demi Langkah
        </h2>

        {/* Shadcn Steps Timeline */}
        <div className="mt-8 mb-12 [counter-reset:step] ml-4 border-l border-border pl-8 space-y-8">
          {/* Step 1 */}
          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Pilih Periode Evaluasi</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Pada sudut kanan atas header cockpit, klik dropdown <strong>Periode</strong> (misal <em>Nov 2026</em>). Seluruh data transaksi dan kalkulasi insentif akan otomatis tersinkronisasi dengan periode tagihan tersebut.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Atur Faktor Kesulitan Medan per Rute</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Masuk ke <strong>Tab 2 (Pengaturan Rumusan) &rarr; Sub-tab B (Alokasi Beban)</strong>. Pilih rute baca yang bersangkutan, lalu tentukan faktor medan (1.00x s/d 1.20x) melalui preset tombol cepat. Simpan perubahan.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Tentukan Status Dinas Petugas</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Gunakan dropdown <strong>Filter Petugas</strong> untuk memilih nama petugas. Atur status dinas (<em>Aktif</em>, <em>Cuti</em>, atau <em>Sakit</em>) dan masukkan target khusus SL penugasan jika ada deviasi dari total standar rute. Klik <strong>Simpan Petugas</strong>.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative before:absolute before:-left-[45px] before:top-0 before:flex before:size-6 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-background before:text-xs before:font-semibold before:text-foreground before:content-[counter(step)] [counter-increment:step]">
            <h4 className="font-semibold text-foreground text-sm">Pantau Capaian di Tab Evaluasi</h4>
            <p className="leading-6 mt-1 text-[13px] text-muted-foreground">
              Kembali ke <strong>Tab 1 (Evaluasi &amp; Insentif Petugas)</strong>. Periksa tabel rekapitulasi untuk melihat progres baca harian, akurasi GPS, skor kinerja, grade yang diperoleh, dan rincian estimasi rupiah insentif yang cair.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq">
        <h2 className="font-heading scroll-m-20 border-b border-border pb-2 text-xl font-semibold tracking-tight text-foreground">
          Pertanyaan Umum (FAQ)
        </h2>

        <div className="space-y-4 mt-6">
          <div className="rounded-lg border border-border p-4 space-y-1.5 bg-card">
            <h4 className="font-semibold text-foreground text-sm">
              Mengapa insentif seorang petugas tertulis Rp 0 padahal sudah mencatat banyak SL?
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Periksa kolom <strong>Grade</strong> dan <strong>% Read Rate</strong>. Petugas dengan skor kinerja di bawah 60 poin (Grade D) atau tingkat keterbacaan di bawah ambang batas minimal (misal &lt;70%) otomatis terkena penalti gugur insentif (0%). Pastikan petugas mencatat di lokasi titik GPS yang tepat dan tidak menembak angka.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-1.5 bg-card">
            <h4 className="font-semibold text-foreground text-sm">
              Apakah perubahan faktor medan rute langsung berdampak pada insentif?
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Ya, seketika saat faktor medan rute disimpan, sistem langsung mengkalkulasi ulang faktor komposit berbobot dan indeks beban petugas yang mengampu rute tersebut secara realtime.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-1.5 bg-card">
            <h4 className="font-semibold text-foreground text-sm">
              Di mana saya bisa melihat Balanced Scorecard 4 Perspektif Perusahaan?
            </h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Balanced Scorecard perusahaan kini telah dipisahkan menjadi halaman mandiri. Anda dapat membukanya melalui tombol <strong>Scorecard Perusahaan &rarr;</strong> di header cockpit halaman KPI atau via menu sidebar <em>Ikhtisar &rarr; Scorecard Perusahaan</em>.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
