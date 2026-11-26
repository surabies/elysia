"use client";

// features/dashboard/verifikasi/components/tabel/SelStandAkhir.tsx — isi sel
// ST Akhir: ikon sumber laporan (mandiri / manual add), penanda segitiga
// Meter Baru (MB), lalu angkanya. <td>-nya sendiri `relative` (kelasSel).
import {
  PencilEdit01Icon,
  UserCircleIcon,
} from "@/components/icons/ikon-lucide";
import { HugeiconsIcon } from "@/components/icons/IconRenderer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAngka } from "../../lib/format-tabel";
import type { BarisTurunan } from "../../lib/turunan-baris";

function sumberInput(jenis: string | null | undefined) {
  if (jenis === "KONSUMEN" || jenis?.startsWith("MANDIRI")) {
    return {
      ikon: UserCircleIcon,
      label: "Laporan Mandiri konsumen",
      warna: "text-(--verif-info)",
    };
  }
  if (
    jenis === "MANUAL_SATUAN" ||
    jenis === "MANUAL_MASSAL" ||
    jenis === "MANUAL" ||
    jenis?.includes("MANUAL")
  ) {
    return {
      ikon: PencilEdit01Icon,
      label:
        jenis === "MANUAL_MASSAL"
          ? "Laporan Manual Add Masal"
          : "Laporan Manual Add",
      warna: "text-(--verif-v1)",
    };
  }
  return null;
}

export function SelStandAkhir({ baris }: { baris: BarisTurunan }) {
  const sumber = sumberInput(
    baris.row.jenisInput ?? (baris.row as any).sumberLaporan,
  );
  const standMeterBaru = baris.row.standMeterBaru ?? baris.standAkhir;

  return (
    <>
      {sumber && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`absolute top-1/2 left-3 -translate-y-1/2 ${sumber.warna}`}
              aria-label={sumber.label}
              role="img"
              tabIndex={0}
            >
              <HugeiconsIcon icon={sumber.ikon} className="size-3.5" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-copy-12">
            {sumber.label}
          </TooltipContent>
        </Tooltip>
      )}

      {baris.isMB && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="absolute top-0 right-0 h-0 w-0 border-t-8 border-l-8 border-t-(--verif-info) border-l-transparent"
              aria-label="Meter Baru (MB)"
              role="img"
              tabIndex={0}
            />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-copy-12">
            <p className="font-semibold text-foreground">Meter Baru (MB)</p>
            <p className="text-muted-foreground">
              Stand meter baru: {formatAngka(standMeterBaru)}
              {baris.row.standAngkatLama != null &&
                `, stand angkat ${formatAngka(baris.row.standAngkatLama)}`}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {baris.standAkhirDikoreksi ? (
        <span className="font-semibold text-(--verif-correction)">
          {formatAngka(baris.standAkhir)}
        </span>
      ) : (
        formatAngka(baris.standAkhir)
      )}
    </>
  );
}
