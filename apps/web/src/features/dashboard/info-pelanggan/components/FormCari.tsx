"use client";

// FormCari menyediakan bilah pencarian No. Langganan + Periode + tombol.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function periodeBulanLalu(): string {
  const tanggal = new Date();
  tanggal.setDate(1);
  tanggal.setMonth(tanggal.getMonth() - 1);
  return `${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, "0")}`;
}

export function FormCari({
  nomor,
  periode,
  memuat,
  onCari,
}: {
  nomor: string;
  periode: string;
  memuat: boolean;
  onCari: (nomor: string, periode: string) => void;
}) {
  const [n, setN] = React.useState(nomor);
  const [p, setP] = React.useState(periode);
  const [galat, setGalat] = React.useState<string | null>(null);

  const [nomorSebelum, setNomorSebelum] = React.useState(nomor);
  if (nomor !== nomorSebelum) {
    setNomorSebelum(nomor);
    setN(nomor);
  }

  React.useEffect(() => {
    setP(periode || periodeBulanLalu());
  }, [periode]);

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const nomorBersih = n.trim();
    const periodeBersih = p.trim();
    if (!periodeBersih) {
      toast.error("Periode wajib diisi.");
      return;
    }
    if (
      !/^\d{6}$/.test(periodeBersih) ||
      Number(periodeBersih.slice(4, 6)) < 1 ||
      Number(periodeBersih.slice(4, 6)) > 12
    ) {
      return setGalat("Periode harus berformat YYYYMM dengan bulan 01–12.");
    }
    if (!nomorBersih) {
      return setGalat("Isi No. Langganan terlebih dahulu.");
    }
    setGalat(null);
    onCari(nomorBersih, periodeBersih);
  }

  return (
    <form
      onSubmit={kirim}
      aria-label="Cari info pelanggan"
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <input
            type="text"
            value={n}
            onChange={(e) => {
              setN(e.target.value);
              if (galat) setGalat(null);
            }}
            placeholder="No. Langganan (contoh: 01011234)"
            aria-label="Nomor Langganan"
            className={cn(
              "h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              galat && "border-destructive focus-visible:ring-destructive"
            )}
          />
        </div>

        <div className="w-32">
          <input
            type="text"
            value={p}
            onChange={(e) => {
              setP(e.target.value);
              if (galat) setGalat(null);
            }}
            placeholder="YYYYMM"
            aria-label="Periode (YYYYMM)"
            maxLength={6}
            className="h-10 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>

        <Button
          type="submit"
          disabled={memuat}
          className="h-10 px-5 font-medium"
        >
          {memuat ? (
            <span className="flex items-center gap-2">
              <svg
                className="size-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Memuat...
            </span>
          ) : (
            "Cari Pelanggan"
          )}
        </Button>
      </div>

      {galat ? (
        <p className="text-xs font-medium text-destructive">{galat}</p>
      ) : (
        <p className="text-xs text-info-foreground/80 dark:text-muted-foreground">
          Cari berdasarkan Nomor Langganan (NOLG) dan periode tagihan.
        </p>
      )}
    </form>
  );
}
