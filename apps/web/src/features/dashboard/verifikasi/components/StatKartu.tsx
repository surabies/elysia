// features/dashboard/verifikasi/components/StatKartu.tsx — kerangka dan sel KPI.
//
// Warna permukaan, garis, dan tipografi menggunakan token global; warna status
// hanya dipakai untuk penanda progres.
import type { LucideIcon } from "lucide-react";
import {
  HugeiconsIcon,
  type IconSvgElement,
} from "@/features/dashboard/shared/icons/IconRenderer";
import { cn } from "@/lib/Utilitas";

type Nada = "netral" | "perhatian" | "peringatan" | "info" | "sukses";

// `perhatian` tetap MERAH (dipakai halaman lain), `peringatan` = amber.
// titik: penanda status di samping label (netral = tanpa titik).
const NADA: Record<Nada, { angka: string; titik?: string; bilah: string }> = {
  netral: { angka: "text-foreground", bilah: "bg-foreground/60" },
  perhatian: {
    angka: "text-(--verif-error)",
    titik: "bg-(--verif-error)",
    bilah: "bg-(--verif-error)",
  },
  peringatan: {
    angka: "text-foreground",
    titik: "bg-(--verif-v1)",
    bilah: "bg-(--verif-v1)",
  },
  info: {
    angka: "text-foreground",
    titik: "bg-(--verif-v2)",
    bilah: "bg-(--verif-v2)",
  },
  sukses: {
    angka: "text-foreground",
    titik: "bg-(--verif-v3)",
    bilah: "bg-(--verif-v3)",
  },
};

// Ikon Hugeicons (array data) MAUPUN Lucide (komponen). `Array.isArray` memilah
// keduanya, jadi halaman lain yang masih Lucide tidak perlu diubah.
// strokeWidth disamakan (1.6) dengan ikon sidebar supaya garisnya seirama.
function Ikon({
  icon,
  className,
}: {
  icon: LucideIcon | IconSvgElement;
  className?: string;
}) {
  if (Array.isArray(icon)) {
    return (
      <HugeiconsIcon
        icon={icon as IconSvgElement}
        strokeWidth={1.6}
        className={className}
        aria-hidden
      />
    );
  }
  const Lucide = icon as LucideIcon;
  return <Lucide strokeWidth={1.6} className={className} aria-hidden />;
}

// ----------------------------------------------------------------------------
// StatGrid — kerangka
// ----------------------------------------------------------------------------
// Kelas ditulis lengkap (bukan dirangkai) karena Tailwind hanya mengenali
// nama kelas utuh.
export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// StatCard — satu sel
// ----------------------------------------------------------------------------
export function StatCard({
  label,
  nilai,
  keterangan,
  judulLengkap,
  icon,
  nada = "netral",
  progres,
}: {
  label: string;
  nilai: string;
  keterangan?: string;
  /** Nilai penuh, muncul sebagai tooltip saat kursor menyentuh angka ringkas. */
  judulLengkap?: string;
  icon: LucideIcon | IconSvgElement;
  nada?: Nada;
  /** 0–100. Bila diisi, bilah tipis digambar di dasar sel. */
  progres?: number;
}) {
  const n = NADA[nada];
  // Jaga di 0–100 supaya bilah tidak meluber bila data di luar rentang.
  const persen =
    progres === undefined ? undefined : Math.min(100, Math.max(0, progres));

  return (
    <div className="relative flex flex-col gap-2 bg-card px-4 py-4 sm:px-5">
      {/* Baris atas: [titik status] label ........ ikon netral */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-label-12 font-medium text-muted-foreground">
          {n.titik && (
            <>
              <span
                aria-hidden
                className={cn("size-1.5 shrink-0 rounded-full", n.titik)}
              />
              {/* Titik tidak terbaca pembaca layar, jadi statusnya ditulis. */}
              <span className="sr-only">({nada})</span>
            </>
          )}
          <span className="truncate">{label}</span>
        </p>
        <Ikon
          icon={icon}
          className="size-4 shrink-0 text-muted-foreground"
        />
      </div>

      {/* Angka + keterangan */}
      <div className="min-w-0">
        <p
          title={judulLengkap}
          className={cn(
            "num-display truncate text-xl leading-8",
            n.angka,
          )}
        >
          {nilai}
        </p>
        {keterangan && (
          <p className="mt-0.5 truncate text-copy-13 text-muted-foreground">
            {keterangan}
          </p>
        )}
      </div>

      {persen !== undefined && (
        <div
          role="progressbar"
          aria-label={`Progres ${label}`}
          aria-valuenow={persen}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute inset-x-0 bottom-0 h-0.5 bg-border/60"
        >
          <div
            className={cn("h-full transition-[width] duration-500", n.bilah)}
            style={{ width: `${persen}%` }}
          />
        </div>
      )}
    </div>
  );
}
