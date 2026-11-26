"use client";

// Perakit halaman Info Pelanggan, tata letak SAMA dengan lembar PDF:
// pita judul (berisi bilah pencarian) → identitas → stand & pemakaian
// → grafik + rincian → foto lapangan → lokasi. Halaman ini tanpa navbar/sidebar
// bawaan, sehingga pita judul membawa tombol Kembali.
// Pita judul: biru (chart-1) di tema terang, kartu gelap di tema gelap.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BlokLokasi } from "./BlokLokasi";
import { FormCari } from "./FormCari";
import { fmtPeriode } from "../lib/format-tampilan";
import { GaleriFoto } from "./GaleriFoto";
import { KartuGrafik } from "./KartuGrafik";
import { KerangkaMemuat } from "./KerangkaMemuat";
import { LembarCetak } from "./LembarCetak";
import { PanelPembacaan } from "./PanelPembacaan";
import { ProfilPelanggan } from "./ProfilPelanggan";
import { RincianCatat } from "./RincianCatat";
import { TombolCetak } from "./TombolCetak";
import { useInfoPelanggan } from "../hooks/use-info-pelanggan";

const HALAMAN_ASAL = "/pelanggan";

export function InfoPelangganView() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [modeQuery, setModeQuery] = useState<"awal" | "aktif" | "reset">("awal");
  const sudahInisialisasi = useRef(false);
  const nomorUrl = sp.get("no") ?? "";
  const periodeUrl = sp.get("periode") ?? "";
  const nomor = modeQuery === "aktif" ? nomorUrl : "";
  const periode = modeQuery === "aktif" ? periodeUrl : "";

  const { status, data, galat } = useInfoPelanggan(nomor, periode);

  useEffect(() => {
    if (sudahInisialisasi.current) return;
    sudahInisialisasi.current = true;

    const navigasi = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const pathDokumen = navigasi
      ? new URL(navigasi.name, window.location.origin).pathname
      : "";
    if (navigasi?.type === "reload" && pathDokumen === pathname) {
      router.replace(pathname, { scroll: false });
      setModeQuery("reset");
      return;
    }

    setModeQuery("aktif");
  }, [pathname, router]);

  function cari(n: string, p: string) {
    const q = new URLSearchParams({ no: n });
    if (p) q.set("periode", p);
    setModeQuery("aktif");
    router.replace(`${pathname}?${q}`);
  }

  function kembali() {
    if (window.history.length > 1) router.back();
    else router.push(HALAMAN_ASAL);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      {/* Header bergaya landing page: latar radial glow biru + border halus, responsif penuh di tema terang & gelap */}
      <header className="relative isolate shrink-0 border-b border-border/80 bg-background/80 backdrop-blur-md overflow-hidden text-foreground">
        {/* Ambient Glow Biru Halus Khas Landing Page */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_-15%,rgba(0,112,243,0.08),rgba(16,185,129,0.03)_45%,transparent)]"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Sisi Kiri: Judul & Deskripsi */}
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Info Pelanggan
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Pencarian data master pelanggan, stand meter, foto bukti baca, dan riwayat pemakaian air.
              </p>
            </div>

            {/* Sisi Kanan: Pojok kanan di atas Form Cari Pelanggan */}
            <div className="flex flex-col items-start sm:items-end gap-2.5">
              <div className="flex items-center gap-2">
                {data && (
                  <TombolCetak
                    judulDokumen={`Info Pelanggan ${data.pelanggan.nomorLangganan}${
                      data.catat?.periode ? ` ${data.catat.periode}` : ""
                    }`}
                    className="h-8 gap-1.5 border-border/80 bg-card text-xs font-medium text-foreground shadow-none hover:bg-accent"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={kembali}
                  className="h-8 gap-1.5 border-border/80 bg-card text-xs font-medium text-foreground shadow-none hover:bg-accent cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  Kembali
                </Button>
              </div>

              {data?.catat && (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-card/80 px-2.5 py-1 text-xs text-muted-foreground">
                  <span>Periode Aktif:</span>
                  <strong className="font-mono font-semibold text-foreground">
                    {fmtPeriode(data.catat.periode)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Form Cari Pelanggan (Card Dashboard konsisten) */}
          <Card className="rounded-lg border-border/80 bg-card p-3 sm:p-4 shadow-none">
            <FormCari
              nomor={nomor}
              periode={periode}
              memuat={status === "memuat"}
              onCari={cari}
            />
          </Card>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        {status === "idle" && (
          <Card className="rounded-lg border-border/80 bg-card p-12 text-center shadow-none">
            <p className="text-sm text-muted-foreground">
              Masukkan No. Langganan di atas untuk melihat stand meter, foto
              lapangan, dan riwayat pemakaian.
            </p>
          </Card>
        )}

        {status === "memuat" && <KerangkaMemuat />}

        {status === "galat" && (
          <Card className="mx-auto w-full max-w-2xl rounded-lg border-destructive/30 bg-destructive/5 p-6 text-center shadow-none">
            <div role="alert">
              <p className="text-sm font-semibold text-destructive">{galat}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Periksa nomor langganan dan periodenya, lalu cari lagi.
              </p>
            </div>
          </Card>
        )}

        {data && (
          <>
            <ProfilPelanggan pelanggan={data.pelanggan} />
            <PanelPembacaan catat={data.catat} riwayat={data.riwayat} />
            {data.catat && (
              <div className="grid gap-4 lg:grid-cols-2">
                <KartuGrafik catat={data.catat} riwayat={data.riwayat} />
                <RincianCatat catat={data.catat} lokasi={data.lokasi} />
              </div>
            )}
            <GaleriFoto
              foto={data.foto}
              nolg={data.pelanggan.nomorLangganan}
              stand={data.catat?.standAkhir}
              nama={data.pelanggan.nama}
            />
            <BlokLokasi lokasi={data.lokasi} />
            {/* Hanya tampil saat mencetak. */}
            <LembarCetak data={data} />
          </>
        )}
      </main>
    </div>
  );
}
