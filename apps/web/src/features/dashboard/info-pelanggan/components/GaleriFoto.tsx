"use client";

// GaleriFoto menampilkan foto lapangan: stand meter, segel, rumah.
// Klik membuka lightbox dengan dialog perbesar.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { resolveFotoUrl } from "@/lib/foto-resolver";

type ItemFoto = { label: string; src: string; contoh: boolean };

function Gambar({ item, onBuka }: { item: ItemFoto; onBuka: () => void }) {
  const [gagal, setGagal] = React.useState(false);
  const ada = item.src && !gagal;

  return (
    <figure className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-panel">
      {ada ? (
        <button
          type="button"
          onClick={onBuka}
          aria-label={`Perbesar ${item.contoh ? "contoh tampilan foto" : "foto"} ${item.label}`}
          className="group relative block aspect-3/4 w-full overflow-hidden bg-muted/40 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={`${item.contoh ? "Contoh tampilan" : "Foto"} ${item.label}`}
            loading="lazy"
            onError={() => setGagal(true)}
            className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </button>
      ) : (
        <div className="flex aspect-3/4 w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
          {gagal ? "Foto gagal dimuat" : "Foto tidak dikirim"}
        </div>
      )}
      <figcaption className="border-t border-border px-3 py-2.5 text-center text-sm font-medium text-foreground">
        {item.label}
      </figcaption>
    </figure>
  );
}

export function GaleriFoto({
  foto,
  nolg,
  stand,
  nama,
}: {
  foto: { stand: string | null; segel: string | null; rumah: string | null };
  nolg?: string;
  stand?: string | number | null;
  nama?: string;
}) {
  const semua: ItemFoto[] = [
    {
      label: "Stand meter",
      src: resolveFotoUrl({
        realUrl: foto.stand,
        nolg,
        jenis: "stand",
        stand,
        nama,
      }),
      contoh: !foto.stand,
    },
    {
      label: "Segel meter",
      src: resolveFotoUrl({
        realUrl: foto.segel,
        nolg,
        jenis: "segel",
        stand,
        nama,
      }),
      contoh: !foto.segel,
    },
    {
      label: "Rumah pelanggan",
      src: resolveFotoUrl({
        realUrl: foto.rumah,
        nolg,
        jenis: "rumah",
        stand,
        nama,
      }),
      contoh: !foto.rumah,
    },
  ];

  const [terpilih, setTerpilih] = React.useState<number | null>(null);

  const maju = () =>
    setTerpilih((i) => (i == null ? null : (i + 1) % semua.length));
  const mundur = () =>
    setTerpilih((i) =>
      i == null ? null : (i - 1 + semua.length) % semua.length
    );

  React.useEffect(() => {
    if (terpilih == null) return;
    const tangani = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") maju();
      if (e.key === "ArrowLeft") mundur();
    };
    window.addEventListener("keydown", tangani);
    return () => window.removeEventListener("keydown", tangani);
  });

  const aktif = terpilih != null ? semua[terpilih] : null;

  return (
    <>
      <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Foto Lapangan
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {semua.map((item, i) => (
            <Gambar key={item.label} item={item} onBuka={() => setTerpilih(i)} />
          ))}
        </div>
      </div>

      <Dialog
        open={terpilih != null}
        onOpenChange={(b) => !b && setTerpilih(null)}
      >
        <DialogContent className="max-w-2xl p-2 sm:p-4">
          <DialogTitle className="sr-only">
            {aktif?.label ? `Foto ${aktif.label}` : "Foto lapangan"}
          </DialogTitle>
          {aktif && (
            <div className="flex flex-col gap-3">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={aktif.src}
                  alt={aktif.label}
                  className="size-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-medium">
                  {aktif.label}
                  {aktif.contoh && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (Contoh tampilan)
                    </span>
                  )}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={mundur}
                    aria-label="Foto sebelumnya"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={maju}
                    aria-label="Foto berikutnya"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
