"use client";

// features/dashboard/verifikasi/components/TabelVerifikasi.tsx — tabel khusus
// layar verifikasi (kotak centang + aksi massal, pewarnaan per ring, ribuan
// baris, kolom beku, navigasi papan ketik, koreksi inline per sel), dibangun di
// atas TanStack Table.
//
// PEMBAGIAN TUGAS
//   TanStack Table  → sortir, urutan/visibilitas/lebar kolom, status centang
//   lib/turunan-baris     → turunan per baris (dihitung sekali per pemuatan data)
//   tabel/kolom-verifikasi → accessor (nilai sortir) + cell (tampilan) per kolom
//   tabel/SelEditInline   → koreksi langsung ST Akhir, ST Revisi, Ket Catat, Tagihan & Popover MB
//   tabel/HeaderKolom, tabel/BarisTabel → markup <th> dan <tr>
//   hooks/use-state-kolom-tabel → jembatan PreferensiKolom ↔ state TanStack
//
// PEMILIHAN BARIS tetap dipegang induk (aksi massal & ekspor membicarakan
// himpunan yang sama); tabel hanya membacanya lewat `terpilih`.
//
// GULIR MENDATAR: `w-max min-w-full` (tumbuh mengikuti isi, tidak pernah lebih
// sempit dari wadah) dan seluruh rantai induk wajib `min-w-0`. Baris di luar
// layar dilewati lewat content-visibility: auto (lihat BarisTabel).
import * as React from "react";
import {
  useTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { useStateKolomTabel } from "../hooks/use-state-kolom-tabel";
import { LEBAR_CEKLIS } from "../lib/definisi-kolom";
import type { KolomVerifikasi, PreferensiKolom } from "../lib/preferensi-kolom";
import {
  TEMA_GRID_HEADER_ROW,
  TEMA_GRID_TABEL,
  TEMA_GRID_TH_BEKU,
  TEMA_GRID_WADAH,
} from "../lib/tema-verifikasi";
import { turunkanBaris } from "../lib/turunan-baris";
import type { BarisVerifikasi, Kerapatan, ModeRing } from "../types";
import { BarisTabel } from "./tabel/BarisTabel";
import { HeaderKolom } from "./tabel/HeaderKolom";
import { buatKolomVerifikasi } from "./tabel/kolom-verifikasi";
import type { HasilKoreksiInline, KonteksEditTabel } from "./tabel/SelEditInline";
import { verifikasiFeatures } from "./tabel/tipe-tabel";

// Dipakai PanelTabel & PanelTabelMandiri — re-export menjaga import lama.
export { KontrolKolomVerifikasi } from "./tabel/KontrolKolomVerifikasi";
export type { HasilKoreksiInline } from "./tabel/SelEditInline";

// `[&_td]` (keturunan), BUKAN `[&>td]`: kelas dipasang di <table>, sedangkan
// <td> adalah anak <tr>.
const KERAPATAN: Record<
  Kerapatan,
  { sel: string; header: string; tinggiBaris: string }
> = {
  padat: { sel: "[&_td]:py-1", header: "[&>th]:py-1.5", tinggiBaris: "0 32px" },
  normal: {
    sel: "[&_td]:py-2.5",
    header: "[&>th]:py-3",
    tinggiBaris: "0 44px",
  },
};

export interface PropsTabelVerifikasi {
  rows: BarisVerifikasi[];
  terpilih: Set<string>;
  onToggle: (id: string, rentangDariShift: boolean, indeks: number) => void;
  onToggleSemua: (pilih: boolean) => void;
  idTerpilih: string | null;
  onKlikBaris: (row: BarisVerifikasi) => void;
  onKlikKanan: (row: BarisVerifikasi, posisi: { x: number; y: number }) => void;
  ambangAnomali: number;
  modeBelumDibaca?: boolean;
  /** "tunggal" = laporan mandiri (satu ring): dua batang, bukan V1–V3. */
  modeRing?: ModeRing;
  memuat: boolean;
  kerapatan?: Kerapatan;
  /** Menggantikan teks keadaan-kosong bawaan. */
  pesanKosong?: React.ReactNode;
  preferensiKolom: PreferensiKolom;
  onLebarKolom: (kolom: KolomVerifikasi, lebar: number) => void;
  onPindahKolom: (dari: KolomVerifikasi, ke: KolomVerifikasi) => void;
  /** Apakah baris diizinkan untuk diedit inline pada sel tabel. */
  bolehEdit?: (row: BarisVerifikasi) => boolean;
  /** Khusus Role V3: apakah kolom Tagihan boleh diedit inline. */
  bolehEditTagihan?: (row: BarisVerifikasi) => boolean;
  /** Handler penyimpanan saat koreksi inline di sel selesai. */
  onSimpanKoreksi?: (
    row: BarisVerifikasi,
    hasil: HasilKoreksiInline,
  ) => Promise<void>;
}

export function TabelVerifikasi({
  rows,
  terpilih,
  onToggle,
  onToggleSemua,
  idTerpilih,
  onKlikBaris,
  onKlikKanan,
  ambangAnomali,
  modeBelumDibaca = false,
  modeRing = "berjenjang",
  memuat,
  kerapatan = "normal",
  pesanKosong,
  preferensiKolom,
  onLebarKolom,
  onPindahKolom,
  bolehEdit,
  bolehEditTagihan,
  onSimpanKoreksi,
}: PropsTabelVerifikasi) {
  const wadahRef = React.useRef<HTMLDivElement>(null);
  const [sortir, setSortir] = React.useState<SortingState>([]);
  const [idBarisPopoverMB, setIdBarisPopoverMB] = React.useState<string | null>(
    null,
  );
  const [idBarisFokusRevisi, setIdBarisFokusRevisi] = React.useState<
    string | null
  >(null);

  const editContext = React.useMemo<KonteksEditTabel | undefined>(() => {
    if (!onSimpanKoreksi || modeBelumDibaca) return undefined;
    return {
      bolehEdit,
      bolehEditTagihan,
      onSimpanKoreksi,
      idTerpilih,
      onPilihBaris: onKlikBaris,
      idBarisPopoverMB,
      onSetBarisPopoverMB: setIdBarisPopoverMB,
      idBarisFokusRevisi,
      onSetBarisFokusRevisi: setIdBarisFokusRevisi,
    };
  }, [
    onSimpanKoreksi,
    modeBelumDibaca,
    bolehEdit,
    bolehEditTagihan,
    idTerpilih,
    onKlikBaris,
    idBarisPopoverMB,
    idBarisFokusRevisi,
  ]);

  const data = React.useMemo(() => rows.map(turunkanBaris), [rows]);
  const kolom = React.useMemo(
    () =>
      buatKolomVerifikasi({
        modeRing,
        modeBelumDibaca,
        ambangAnomali,
        edit: editContext,
      }),
    [modeRing, modeBelumDibaca, ambangAnomali, editContext],
  );
  const stateKolom = useStateKolomTabel({
    preferensiKolom,
    modeBelumDibaca,
    onLebarKolom,
  });
  const rowSelection = React.useMemo<RowSelectionState>(
    () => Object.fromEntries(Array.from(terpilih, (id) => [id, true])),
    [terpilih],
  );

  const table = useTable({
    features: verifikasiFeatures,
    data,
    columns: kolom,
    getRowId: (b) => b.id,
    state: { ...stateKolom.state, sorting: sortir, rowSelection },
    onSortingChange: setSortir,
    onColumnSizingChange: stateKolom.onColumnSizingChange,
    onColumnResizingChange: stateKolom.onColumnResizingChange,
    columnResizeMode: "onChange",
    enableRowSelection: true,
    enableMultiSort: false,
    // Perilaku sortir lama: menaik ⇄ menurun (tanpa keadaan "tanpa urutan").
    enableSortingRemoval: false,
    sortDescFirst: false,
  });

  // Baris aktif selalu ditarik ke dalam pandangan.
  React.useEffect(() => {
    if (!idTerpilih || !wadahRef.current) return;
    wadahRef.current
      .querySelector<HTMLElement>(`[data-id="${CSS.escape(idTerpilih)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [idTerpilih]);

  const { sel, header: kelasHeader, tinggiBaris } = KERAPATAN[kerapatan];
  const semuaTerpilih = table.getIsAllRowsSelected();
  const sebagianTerpilih = table.getIsSomeRowsSelected();

  return (
    <div className={TEMA_GRID_WADAH}>
      <div
        ref={wadahRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-auto"
      >
        <table className={`${TEMA_GRID_TABEL} ${sel}`}>
          <colgroup>
            <col style={{ width: LEBAR_CEKLIS }} />
            {table.getVisibleLeafColumns().map((k) => (
              <col key={k.id} style={{ width: k.getSize() }} />
            ))}
          </colgroup>

          <thead className="sticky top-0 z-20">
            <tr
              className={`${TEMA_GRID_HEADER_ROW} [&>th]:border-r [&>th]:border-b [&>th]:border-border [&>th]:px-3 [&>th]:text-left [&>th]:text-label-12 [&>th]:leading-4 [&>th]:font-semibold [&>th]:tracking-wide [&>th]:whitespace-nowrap [&>th:last-child]:border-r-0 ${kelasHeader}`}
            >
              <th
                className={`${TEMA_GRID_TH_BEKU} left-0`}
                style={{ width: LEBAR_CEKLIS, minWidth: LEBAR_CEKLIS }}
              >
                <Checkbox
                  checked={
                    semuaTerpilih
                      ? true
                      : sebagianTerpilih
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(v) => onToggleSemua(v === true)}
                  aria-label="Pilih semua baris yang tampil"
                />
              </th>
              {table.getLeafHeaders().map((header) => (
                <HeaderKolom
                  key={header.id}
                  header={header}
                  onLebarKolom={onLebarKolom}
                  onPindahKolom={onPindahKolom}
                />
              ))}
            </tr>
          </thead>

          <tbody>
            {table.getRowModel().rows.map((baris) => (
              <BarisTabel
                key={baris.id}
                baris={baris}
                dipilih={baris.getIsSelected()}
                aktif={idTerpilih === baris.id}
                modeBelumDibaca={modeBelumDibaca}
                tinggiBaris={tinggiBaris}
                onKlikBaris={onKlikBaris}
                onKlikKanan={onKlikKanan}
                onToggle={onToggle}
              />
            ))}
          </tbody>
        </table>

        {rows.length === 0 && !memuat && (
          <p className="p-8 text-center text-copy-13 text-muted-foreground">
            {pesanKosong ??
              (modeBelumDibaca
                ? "Semua sambungan di daftar catat sudah punya setoran — tidak ada yang tertinggal."
                : "Tidak ada laporan yang cocok dengan saringan ini.")}
          </p>
        )}
        {memuat && (
          <p className="p-8 text-center text-copy-13 text-muted-foreground">
            Memuat…
          </p>
        )}
      </div>
    </div>
  );
}
