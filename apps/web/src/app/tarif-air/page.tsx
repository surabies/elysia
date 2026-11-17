import type { Metadata } from "next"
import Link from "next/link"
import {
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Layers,
  Scale,
} from "lucide-react"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"
import { RUTE } from "@/config/site"
import {
  pengaturanService,
  DEFAULT_STRUKTUR_TARIF,
  DEFAULT_PROFIL_PERUSAHAAN,
} from "@/server/services/pengaturan/pengaturan.service"

export const metadata: Metadata = { title: "Struktur Tarif Air Minum" }
export const dynamic = "force-dynamic"

export default async function TarifAirPage() {
  const [data, profil] = await Promise.all([
    pengaturanService.getPengaturan("struktur_tarif", DEFAULT_STRUKTUR_TARIF),
    pengaturanService.getPengaturan("profil_perusahaan", DEFAULT_PROFIL_PERUSAHAAN),
  ])

  const blokProgresif = [
    { blok: "Blok I", rentang: "0 – 10 m³", desc: "Kebutuhan pokok dasar rumah tangga bersubsidi" },
    { blok: "Blok II", rentang: "11 – 20 m³", desc: "Pemakaian standar rumah tangga wajar" },
    { blok: "Blok III", rentang: "21 – 30 m³", desc: "Konsumsi di atas rata-rata kebutuhan primer" },
    { blok: "Blok IV", rentang: "> 30 m³", desc: "Pemakaian tinggi / komersial & non-subsidi" },
  ]

  return (
    <HalamanInfo
      judul={data.judul || "Struktur Tarif Air Minum"}
      deskripsi={
        data.deskripsi ||
        `Struktur tarif pemakaian air minum perpipaan berdasarkan golongan pelanggan dan blok konsumsi progresif ${profil.nama}.`
      }
    >
      {/* 1. TABEL STRUKTUR TARIF PER GOLONGAN */}
      <Bagian
        judul="Daftar Tarif Berdasarkan Golongan Pelanggan"
        subjudul="Tarif resmi yang berlaku sesuai Keputusan Walikota Bandung tentang Penyesuaian Tarif Air Minum."
      >
        <div className="motion-card-interactive gradient-card-subtle overflow-hidden rounded-xl border border-border shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-muted/50 text-muted-foreground uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Golongan Pelanggan</th>
                  <th className="px-5 py-3.5 font-semibold">Kriteria &amp; Jenis Sambungan</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Rentang Tarif Progresif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.tarif.map((t, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors duration-150 hover:bg-muted/40 cursor-default"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <span>{t.golongan}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground leading-relaxed">
                      {t.keterangan}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                      {t.tarif}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Bagian>

      {/* 2. BLOK KONSUMSI PROGRESIF & KETENTUAN */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: 4 Blok Progresif (6 kolom) */}
        <div className="space-y-4 lg:col-span-6">
          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Layers className="size-4.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Sistem 4 Blok Konsumsi Progresif
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Semakin bijak penggunaan air, semakin terjangkau tarif rata-rata yang dibayarkan:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {blokProgresif.map((b, idx) => (
                <div
                  key={idx}
                  className="gradient-card-water rounded-lg border border-border/70 p-3 space-y-1 transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {b.blok}
                    </span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-primary">
                      {b.rentang}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ketentuan Tambahan (6 kolom) */}
        <div className="space-y-4 lg:col-span-6">
          <div className="motion-card-interactive gradient-card-subtle group rounded-xl border border-border p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Scale className="size-4.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Ketentuan &amp; Komponen Tagihan
              </h3>
            </div>
            <ul className="space-y-2.5">
              {data.ketentuan.map((k, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed transition-colors hover:text-foreground"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary mt-0.5" />
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </HalamanInfo>
  )
}
