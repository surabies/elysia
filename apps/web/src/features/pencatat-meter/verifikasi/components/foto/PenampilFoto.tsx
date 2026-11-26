"use client";

// features/dashboard/verifikasi/components/PenampilFoto.tsx — dua hal:
//
// 1. BingkaiPotret: frame foto UKURAN TETAP, selalu potret 3:4. Foto landscape
//    dari petugas/konsumen dipotong tengah (object-cover) — bentuk frame tidak
//    pernah berubah mengikuti file, jadi panel tidak melar-menciut.
// 2. PenampilFoto: penampil dengan zoom, geser, putar, reset. Dipakai di
//    lightbox (klik foto di panel, ada tombol Esc) dan tertanam di modal.
import * as React from "react";
import {
  Add01Icon,
  ArrowReloadHorizontalIcon,
  ImageNotFound01Icon,
  MinusSignIcon,
  RotateLeft01Icon,
  RotateRight01Icon,
  Search01Icon,
} from "@/components/icons/ikon-lucide";
import { HugeiconsIcon } from "@/components/icons/IconRenderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SKALA_MIN = 0.5;
const SKALA_MAKS = 6;
const LANGKAH = 0.25;
const batas = (n: number) =>
  Math.min(SKALA_MAKS, Math.max(SKALA_MIN, Math.round(n * 100) / 100));

function TombolAlat({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="flex size-7 items-center justify-center rounded-full text-foreground/80 hover:text-foreground hover:bg-muted active:scale-95 disabled:opacity-30 cursor-pointer transition-colors dark:text-white/80 dark:hover:text-white dark:hover:bg-white/15"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function PenampilFoto({
  url,
  label,
  onTutup,
  className,
}: {
  url: string;
  label: string;
  /** Bila diisi, tombol Esc muncul di pojok kanan atas. */
  onTutup?: () => void;
  className?: string;
}) {
  const wadahRef = React.useRef<HTMLDivElement>(null);
  const [skala, setSkala] = React.useState(1);
  const [putar, setPutar] = React.useState(0);
  const [geser, setGeser] = React.useState({ x: 0, y: 0 });
  const [menyeret, setMenyeret] = React.useState(false);
  const [gagal, setGagal] = React.useState(false);
  const awal = React.useRef<{
    x: number;
    y: number;
    gx: number;
    gy: number;
  } | null>(null);

  const ubahSkala = React.useCallback((delta: number) => {
    setSkala((s) => {
      const n = batas(s + delta);
      if (n <= 1) setGeser({ x: 0, y: 0 });
      return n;
    });
  }, []);

  const reset = React.useCallback(() => {
    setSkala(1);
    setPutar(0);
    setGeser({ x: 0, y: 0 });
  }, []);

  React.useEffect(() => {
    const el = wadahRef.current;
    if (!el) return;
    function saatWheel(e: WheelEvent) {
      e.preventDefault();
      ubahSkala(e.deltaY < 0 ? LANGKAH : -LANGKAH);
    }
    el.addEventListener("wheel", saatWheel, { passive: false });
    return () => el.removeEventListener("wheel", saatWheel);
  }, [ubahSkala]);

  // Pintasan hanya aktif saat penampil sedang fokus (tidak bentrok dengan
  // kotak isian di modal). Esc ditangani Dialog sendiri.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "+" || e.key === "=") ubahSkala(LANGKAH);
    else if (e.key === "-") ubahSkala(-LANGKAH);
    else if (e.key.toLowerCase() === "r")
      setPutar((p) => p + (e.shiftKey ? -90 : 90));
    else if (e.key === "0") reset();
    else return;
    e.preventDefault();
  }

  return (
    <div
      ref={wadahRef}
      tabIndex={0}
      role="group"
      aria-label={`Penampil foto: ${label}`}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        if (skala <= 1) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        awal.current = { x: e.clientX, y: e.clientY, gx: geser.x, gy: geser.y };
        setMenyeret(true);
      }}
      onPointerMove={(e) => {
        const a = awal.current;
        if (a)
          setGeser({ x: a.gx + e.clientX - a.x, y: a.gy + e.clientY - a.y });
      }}
      onPointerUp={() => {
        awal.current = null;
        setMenyeret(false);
      }}
      onPointerCancel={() => {
        awal.current = null;
        setMenyeret(false);
      }}
      onDoubleClick={() => {
        if (skala > 1) {
          reset();
        } else {
          setSkala(2);
          setGeser({ x: 0, y: 0 });
        }
      }}
      className={cn(
        "relative flex h-full w-full min-h-0 min-w-0 touch-none items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 dark:bg-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-ring select-none",
        skala > 1
          ? menyeret
            ? "cursor-grabbing"
            : "cursor-grab"
          : "cursor-zoom-in",
        className,
      )}
    >
      {gagal ? (
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground p-4">
          <HugeiconsIcon
            icon={ImageNotFound01Icon}
            strokeWidth={2}
            className="size-6 text-muted-foreground"
            aria-hidden
          />
          <p className="text-xs">Foto gagal dimuat.</p>
        </div>
      ) : (
        <img
          src={url}
          alt={label}
          draggable={false}
          onError={() => setGagal(true)}
          className="max-h-full max-w-full object-contain select-none pointer-events-none"
          style={{
            transform: `translate(${geser.x}px, ${geser.y}px) rotate(${putar}deg) scale(${skala})`,
            transition: menyeret ? "none" : "transform 150ms ease-out",
          }}
        />
      )}

      {/* Floating Toolbar Controls — Mendukung Tema Terang & Gelap */}
      <div
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/80 bg-background/90 px-2.5 py-1.5 shadow-2xl backdrop-blur-md z-20 text-foreground dark:border-white/15 dark:bg-neutral-900/90 dark:text-neutral-100"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <TombolAlat
          label="Perkecil (−)"
          onClick={() => ubahSkala(-LANGKAH)}
          disabled={skala <= SKALA_MIN}
        >
          <HugeiconsIcon
            icon={MinusSignIcon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />
        </TombolAlat>
        <span className="w-12 text-center text-xs font-mono font-semibold text-foreground dark:text-white tabular-nums select-none">
          {Math.round(skala * 100)}%
        </span>
        <TombolAlat
          label="Perbesar (+)"
          onClick={() => ubahSkala(LANGKAH)}
          disabled={skala >= SKALA_MAKS}
        >
          <HugeiconsIcon
            icon={Add01Icon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />
        </TombolAlat>
        <div className="mx-1 h-4 w-px bg-border dark:bg-white/20" />
        <TombolAlat
          label="Putar kiri (Shift+R)"
          onClick={() => setPutar((p) => p - 90)}
        >
          <HugeiconsIcon
            icon={RotateLeft01Icon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />
        </TombolAlat>
        <TombolAlat
          label="Putar kanan (R)"
          onClick={() => setPutar((p) => p + 90)}
        >
          <HugeiconsIcon
            icon={RotateRight01Icon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />
        </TombolAlat>
        <TombolAlat label="Atur ulang (0)" onClick={reset}>
          <HugeiconsIcon
            icon={ArrowReloadHorizontalIcon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />
        </TombolAlat>
      </div>
    </div>
  );
}

/// Penampil tertanam (modal verifikasi) — mengisi tinggi kolomnya.
export function FotoZoom({
  url,
  label,
  className,
}: {
  url: string;
  label: string;
  className?: string;
}) {
  return (
    <PenampilFoto
      url={url}
      label={label}
      className={cn("h-full min-h-0 w-full flex-1 bg-muted/20 dark:bg-neutral-950", className)}
    />
  );
}

export function FotoLightbox({
  url,
  label,
  buka,
  onBuka,
}: {
  url: string;
  label: string;
  buka: boolean;
  onBuka: (v: boolean) => void;
}) {
  return (
    <Dialog open={buka} onOpenChange={onBuka}>
      <DialogContent
        showCloseButton={true}
        className="h-[88dvh] max-w-[calc(100vw-2rem)] sm:max-w-5xl gap-0 overflow-hidden p-0 border border-border bg-background shadow-2xl rounded-2xl [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:bg-background/80 [&_[data-slot=dialog-close]]:border [&_[data-slot=dialog-close]]:border-border [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:hover:bg-muted [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:z-30 dark:border-white/15 dark:bg-neutral-950 dark:text-white dark:[&_[data-slot=dialog-close]]:text-white dark:[&_[data-slot=dialog-close]]:bg-black/60 dark:[&_[data-slot=dialog-close]]:border-white/20 dark:[&_[data-slot=dialog-close]]:hover:bg-white/20"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">
          Penampil foto interaktif dengan zoom, geser, dan putar. Tekan Esc untuk menutup.
        </DialogDescription>
        <PenampilFoto
          url={url}
          label={label}
          className="h-full rounded-none border-0 bg-muted/20 dark:bg-neutral-950"
        />
      </DialogContent>
    </Dialog>
  );
}

/// Frame panel: SELALU potret 3:4, apa pun orientasi file aslinya.
/// Menggunakan AspectRatio shadcn UI & isolasi overflow sudut untuk mencegah bleeding.
export function BingkaiPotret({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const [buka, setBuka] = React.useState(false);
  const [gagal, setGagal] = React.useState(false);

  return (
    <>
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-border bg-muted/30 shadow-xs [isolation:isolate] [transform:translateZ(0)] transition-all hover:shadow-md",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setBuka(true)}
          aria-label={`Perbesar ${alt}`}
          className="block w-full cursor-zoom-in text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AspectRatio ratio={3 / 4} className="w-full bg-muted/20">
            {gagal ? (
              <span className="flex size-full flex-col items-center justify-center gap-2 text-center p-3">
                <HugeiconsIcon
                  icon={ImageNotFound01Icon}
                  strokeWidth={2}
                  className="size-5 text-muted-foreground"
                  aria-hidden
                />
                <span className="text-label-12 text-muted-foreground">
                  Foto gagal dimuat.
                </span>
              </span>
            ) : (
              <img
                src={url}
                alt={alt}
                loading="lazy"
                onError={() => setGagal(true)}
                className="size-full object-cover rounded-[inherit] transition-transform duration-300 group-hover:scale-102"
              />
            )}

            {/* Icon Perbesar di Pojok Kanan Bawah — Mendukung Tema Terang & Gelap */}
            <span className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-md border border-border/80 bg-background/90 text-foreground opacity-0 shadow-sm backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-white/20 dark:bg-black/75 dark:text-white">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
            </span>
          </AspectRatio>
        </button>
      </div>
      <FotoLightbox url={url} label={alt} buka={buka} onBuka={setBuka} />
    </>
  );
}
