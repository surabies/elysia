import type { Metadata } from "next";
import { auth } from "@/lib/auth/index";
import { redirect } from "next/navigation";
import { db, pengaduan } from "@cater/db";
import { desc, sql } from "drizzle-orm";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpRight,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Monitoring Pengaduan Air — PDAM Tirtawening",
  description: "Manajemen dan penanganan tiket keluhan pelanggan dari portal publik.",
};

export default async function PengaduanBackofficePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Query rekapitulasi data pengaduan riil
  const daftarPengaduan = await db
    .select()
    .from(pengaduan)
    .orderBy(desc(pengaduan.createdAt))
    .limit(50)
    .catch(() => []);

  const totalTiket = daftarPengaduan.length;
  const tiketBaru = daftarPengaduan.filter(
    (p) => p.status === "BARU" || p.status === "TERVERIFIKASI"
  ).length;
  const tiketProses = daftarPengaduan.filter(
    (p) => p.status === "DIPROSES" || p.status === "MENUJU_LOKASI" || p.status === "DITUGASKAN"
  ).length;
  const tiketSelesai = daftarPengaduan.filter(
    (p) => p.status === "SELESAI" || p.status === "DITUTUP"
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <LifeBuoy className="size-4" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Monitoring Pengaduan Pelanggan
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Penanganan tiket keluhan dan laporan gangguan air minum yang masuk dari kanal portal publik warga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/publik/pengaduan"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-accent text-foreground transition-colors shadow-xs"
          >
            Buka Portal Form Warga
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/70 bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Tiket
            </span>
            <LifeBuoy className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{totalTiket}</p>
          <p className="text-xs text-muted-foreground mt-1">Keluhan terdaftar di sistem</p>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Menunggu Respon
            </span>
            <AlertTriangle className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{tiketBaru}</p>
          <p className="text-xs text-muted-foreground mt-1">Tiket baru butuh verifikasi</p>
        </div>

        <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Sedang Ditangani
            </span>
            <Clock className="size-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{tiketProses}</p>
          <p className="text-xs text-muted-foreground mt-1">Teknisi sedang di lapangan</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tuntas Ditutup
            </span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{tiketSelesai}</p>
          <p className="text-xs text-muted-foreground mt-1">Selesai diperbaiki & dinilai</p>
        </div>
      </div>

      {/* Tabel Tiket Pengaduan */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari tiket, nama, atau no langganan..."
              className="w-full h-8.5 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8.5 px-3 text-xs rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors"
            >
              <Filter className="size-3.5 text-muted-foreground" />
              Filter Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-3 px-4">No. Tiket & Tanggal</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Kategori & Judul</th>
                <th className="py-3 px-4">Prioritas</th>
                <th className="py-3 px-4">Status Penanganan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {daftarPengaduan.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <LifeBuoy className="size-8 mx-auto mb-2 opacity-30" />
                    Belum ada pengaduan air yang masuk.
                  </td>
                </tr>
              ) : (
                daftarPengaduan.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-foreground">
                        {row.nomorTiket}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "-"}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="size-3 text-muted-foreground" />
                        {row.pelapor}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        NOLG: {row.nomorLangganan || "-"} • {row.kontakPelapor || "-"}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-foreground truncate">{row.judul}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {row.jenis.replace(/_/g, " ")}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          row.prioritas === "DARURAT"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : row.prioritas === "TINGGI"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {row.prioritas}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          row.status === "SELESAI" || row.status === "DITUTUP"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : row.status === "DIPROSES" || row.status === "MENUJU_LOKASI"
                            ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-border hover:bg-accent text-foreground transition-colors"
                      >
                        Detail Tiket
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
