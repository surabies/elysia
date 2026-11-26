"use client";

// TombolCetak menunggu foto lembar cetak selesai dimuat, mengganti judul dokumen sementara,
// lalu memanggil dialog cetak browser (window.print).
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BATAS_TUNGGU_FOTO_MS = 4000;

function tungguFotoSiap(): Promise<void> {
  const gambar = Array.from(
    document.querySelectorAll<HTMLImageElement>(".lembar-cetak img")
  );
  const semua = Promise.all(
    gambar.map((img) =>
      img.complete
        ? null
        : new Promise<void>((selesai) => {
            img.addEventListener("load", () => selesai(), { once: true });
            img.addEventListener("error", () => selesai(), { once: true });
          })
    )
  ).then(() => undefined);
  const batas = new Promise<void>((selesai) =>
    setTimeout(selesai, BATAS_TUNGGU_FOTO_MS)
  );
  return Promise.race([semua, batas]);
}

export function TombolCetak({
  judulDokumen,
  className,
}: {
  judulDokumen: string;
  className?: string;
}) {
  const [menyiapkan, setMenyiapkan] = React.useState(false);

  async function cetak() {
    if (menyiapkan) return;
    setMenyiapkan(true);
    await tungguFotoSiap();

    const judulLama = document.title;
    const pulihkan = () => {
      document.title = judulLama;
      window.removeEventListener("afterprint", pulihkan);
    };
    document.title = judulDokumen;
    window.addEventListener("afterprint", pulihkan);

    setMenyiapkan(false);
    window.print();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={menyiapkan}
      onClick={cetak}
      className={cn("gap-1.5", className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
        aria-hidden
      >
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect width="12" height="8" x="6" y="14" />
      </svg>
      {menyiapkan ? "Menyiapkan..." : "Cetak Dokumen"}
    </Button>
  );
}
