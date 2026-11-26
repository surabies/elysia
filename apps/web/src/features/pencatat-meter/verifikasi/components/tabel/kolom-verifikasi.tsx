// features/dashboard/verifikasi/components/tabel/kolom-verifikasi.tsx —
// definisi kolom TanStack Table untuk tabel verifikasi.
//
// Setiap kolom = accessor (nilai untuk SORTIR) + cell (tampilan). Accessor
// mengembalikan `undefined` untuk nilai kosong; dengan sortUndefined: "last"
// baris kosong selalu di dasar, naik maupun turun. Metadata presentasi
// (label, lebar, kelas sel) dibaca dari definisi-kolom.ts dan meta kolom.
import {
  createColumnHelper,
  type ColumnDef,
  type SortFn,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DEFINISI_KOLOM_PER_ID, LEBAR_KOLOM_MAKS } from "../../lib/definisi-kolom";
import { formatAngka, formatTanggalWaktu } from "../../lib/format-tabel";
import { LABEL_KONDISI_CATAT } from "../../lib/label-pencatatan";
import type { KolomVerifikasi } from "../../lib/preferensi-kolom";
import { kelasStatus, labelStatus } from "../../lib/status-verifikasi";
import type { BarisTurunan } from "../../lib/turunan-baris";
import { gayaAnomali, type Tahap } from "../../lib/warna-tahap";
import type { ModeRing } from "../../types";
import {
  SelKondisiEditable,
  SelPakaiEditable,
  SelStandAkhirEditable,
  SelStandRevisiEditable,
  SelTagihanEditable,
  type KonteksEditTabel,
} from "./SelEditInline";
import { SelRing } from "./SelRing";
import type { MetaKolom, VerifikasiFeatures } from "./tipe-tabel";

export interface OpsiKolom {
  modeRing: ModeRing;
  modeBelumDibaca: boolean;
  ambangAnomali: number;
  edit?: KonteksEditTabel;
}

const helper = createColumnHelper<VerifikasiFeatures, BarisTurunan>();

const RANK_TAHAP: Record<Tahap, number> = {
  MENUNGGU: 0,
  V1: 1,
  V2: 2,
  TERVERIFIKASI: 3,
  V3: 4,
  DITOLAK: 5,
};

/** Urut teks gaya Indonesia: abaikan kapital, angka dibaca sebagai angka. */
const urutTeks: SortFn<VerifikasiFeatures, BarisTurunan> = (a, b, kolomId) =>
  String(a.getValue(kolomId) ?? "").localeCompare(
    String(b.getValue(kolomId) ?? ""),
    "id",
    {
      numeric: true,
      sensitivity: "base",
    },
  );

function Lencana({
  kelas,
  children,
}: {
  kelas: string;
  children: React.ReactNode;
}) {
  return <Badge className={cn("rounded-full", kelas)}>{children}</Badge>;
}

/** Bagian definisi yang sama di semua kolom, diambil dari metadata statis. */
function dasar(id: KolomVerifikasi, meta: MetaKolom = {}) {
  const { label, title, minWidth, numeric } = DEFINISI_KOLOM_PER_ID[id];
  return {
    id,
    header: label,
    size: minWidth,
    minSize: minWidth,
    maxSize: LEBAR_KOLOM_MAKS,
    meta: { judul: title, angka: numeric, ...meta },
  };
}

function kolomAngka(
  id: KolomVerifikasi,
  ambil: (b: BarisTurunan) => number | null,
  meta?: MetaKolom,
) {
  return helper.accessor((b) => ambil(b) ?? undefined, {
    ...dasar(id, meta),
    sortFn: "basic",
    sortUndefined: "last",
    cell: ({ getValue }) => formatAngka(getValue() as number | undefined),
  });
}

function kolomTeks(
  id: KolomVerifikasi,
  ambil: (b: BarisTurunan) => string | null,
  meta?: MetaKolom,
) {
  return helper.accessor((b) => ambil(b) ?? undefined, {
    ...dasar(id, meta),
    sortFn: urutTeks,
    sortUndefined: "last",
    cell: ({ getValue }) => getValue() ?? "—",
  });
}

function judulStandAkhir(b: BarisTurunan): string | undefined {
  if (b.isMB) {
    const baru = formatAngka(b.row.standMeterBaru ?? b.standAkhir);
    const angkat =
      b.row.standAngkatLama != null
        ? `, stand angkat ${formatAngka(b.row.standAngkatLama)}`
        : "";
    return `Meter Baru (MB): Stand meter baru ${baru}${angkat}.`;
  }
  if (b.standAkhirDikoreksi) {
    return `Dikoreksi verifikator; stand catat awal ${formatAngka(b.row.standAkhir)}.`;
  }
  return undefined;
}

function judulKondisi(b: BarisTurunan): string | undefined {
  if (!b.kondisiDikoreksi || !b.row.kondisi) return undefined;
  const awal = LABEL_KONDISI_CATAT[b.row.kondisi] ?? b.row.kondisi;
  return `Dikoreksi verifikator; ket. catat awal ${awal}.`;
}

// Kolom bertipe nilai berbeda-beda, jadi daftar ini memakai `any` pada TValue
// (pola standar TanStack untuk array kolom campuran).
export function buatKolomVerifikasi({
  modeRing,
  modeBelumDibaca,
  ambangAnomali,
  edit,
}: OpsiKolom): ColumnDef<VerifikasiFeatures, BarisTurunan, any>[] {
  const editKhususPetugas = modeRing === "berjenjang" ? edit : undefined;

  return [
    helper.accessor((b) => RANK_TAHAP[b.tahap], {
      ...dasar("ring", { tengah: true }),
      sortFn: "basic",
      cell: ({ row }) => (
        <SelRing
          row={row.original.row}
          tahap={modeBelumDibaca ? "MENUNGGU" : row.original.tahap}
          mode={modeRing}
        />
      ),
    }),

    kolomTeks("nomor", (b) => b.nomor, { kelasSel: "font-mono" }),
    kolomTeks("nama", (b) => b.nama, {
      kelasSel: "max-w-60 truncate font-medium",
      judulSel: (b) => b.nama ?? undefined,
    }),
    kolomTeks("alamat", (b) => b.alamat, {
      kelasSel: "max-w-80 truncate text-muted-foreground",
      judulSel: (b) => b.alamat ?? undefined,
    }),

    kolomAngka("standAwal", (b) => b.standAwal),

    helper.accessor((b) => b.standAkhir ?? undefined, {
      ...dasar("standAkhir", {
        kelasSel: "relative",
        judulSel: judulStandAkhir,
      }),
      sortFn: "basic",
      sortUndefined: "last",
      cell: ({ row }) => (
        <SelStandAkhirEditable baris={row.original} edit={edit} />
      ),
    }),

    helper.accessor((b) => b.standAwalRevisi ?? undefined, {
      ...dasar("standRevisi", {
        kelasSel: "relative",
        judulSel: (b) =>
          b.standAwalRevisi != null
            ? `Stand awal direvisi dari ${formatAngka(b.row.standAwal)}.`
            : undefined,
      }),
      sortFn: "basic",
      sortUndefined: "last",
      cell: ({ row }) => (
        <SelStandRevisiEditable baris={row.original} edit={editKhususPetugas} />
      ),
    }),

    kolomAngka("standResmi", (b) => b.standResmi, {
      judulSel: (b) =>
        b.row.pembacaan && b.standAkhirDikoreksi
          ? "Stand resmi hasil koreksi verifikator."
          : undefined,
    }),
    helper.accessor((b) => b.pemakaian ?? undefined, {
      ...dasar("pakai", {
        kelasSel: "relative font-medium",
        judulSel: (b) =>
          b.pemakaianDikoreksi
            ? "Pemakaian hasil koreksi / taksasi verifikator."
            : undefined,
      }),
      sortFn: "basic",
      sortUndefined: "last",
      cell: ({ row }) => (
        <SelPakaiEditable baris={row.original} edit={editKhususPetugas} />
      ),
    }),
    kolomAngka("lalu", (b) => b.pemakaianLalu, {
      kelasSel: "text-muted-foreground",
    }),

    helper.accessor((b) => b.hasilTagihan ?? undefined, {
      ...dasar("tagihan", {
        kelasSel: "relative",
        judulSel: (b) =>
          b.pemakaianTagih != null
            ? "Pemakaian Tagihan hasil penetapan V3."
            : undefined,
      }),
      sortFn: "basic",
      sortUndefined: "last",
      cell: ({ row }) => (
        <SelTagihanEditable baris={row.original} edit={editKhususPetugas} />
      ),
    }),

    helper.accessor((b) => b.persentase ?? undefined, {
      ...dasar("deviasi"),
      sortFn: "basic",
      sortUndefined: "last",
      cell: ({ row }) => {
        const persen = row.original.persentase;
        if (persen == null) return "—";
        const isAnom = row.original.isAnomali;
        const kode = row.original.kodeAnomaliUtama;
        const isWarn = kode?.startsWith("WARN_");

        if (isAnom) {
          return (
            <Lencana kelas="bg-(--verif-error-soft) text-(--verif-error-text) ring-1 ring-inset ring-(--verif-error-border)">
              {persen}%
            </Lencana>
          );
        }
        if (isWarn) {
          return (
            <Lencana kelas="bg-(--verif-v1-soft) text-(--verif-v1) ring-1 ring-inset ring-(--verif-v1-border)">
              {persen}%
            </Lencana>
          );
        }
        return `${persen}%`;
      },
    }),

    kolomTeks("rute", (b) => b.rute, {
      kelasSel: "font-mono text-muted-foreground",
    }),

    helper.accessor((b) => b.kondisiLabel ?? undefined, {
      ...dasar("kondisi", {
        kelasSel: "relative max-w-36 truncate text-muted-foreground",
        judulSel: judulKondisi,
      }),
      sortFn: urutTeks,
      sortUndefined: "last",
      cell: ({ row }) => (
        <SelKondisiEditable baris={row.original} edit={editKhususPetugas} />
      ),
    }),

    kolomTeks("petugas", (b) => b.petugas, {
      kelasSel: "max-w-32 truncate text-muted-foreground",
    }),

    helper.accessor((b) => b.waktuCatat ?? undefined, {
      ...dasar("tanggal", { kelasSel: "text-muted-foreground tabular-nums" }),
      sortFn: "basic",
      sortUndefined: "last",
      cell: ({ row }) => formatTanggalWaktu(row.original.tanggalCatat),
    }),

    helper.accessor(
      (b) => labelStatus(b.row, b.tahap, modeBelumDibaca, modeRing),
      {
        ...dasar("status", { kelasSel: "text-copy-13" }),
        sortFn: urutTeks,
        cell: ({ getValue }) => (
          <Lencana kelas={kelasStatus(getValue())}>{getValue()}</Lencana>
        ),
      },
    ),
  ];
}
