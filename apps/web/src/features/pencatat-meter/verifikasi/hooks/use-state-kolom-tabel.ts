// features/dashboard/verifikasi/hooks/use-state-kolom-tabel.ts — jembatan
// antara PreferensiKolom (urutan, tampil, lebar; disimpan induk) dan state
// kontrol TanStack Table.
//
// LEBAR: saat kolom diseret, TanStack memperbarui lebar di state LOKAL
// sementara (tampilan langsung mengikuti). Begitu kursor dilepas, lebar akhir
// disimpan ke preferensi SEKALI — bukan tiap piksel.
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ColumnSizingState,
  ColumnVisibilityState,
  columnResizingState,
} from "@tanstack/react-table";
import {
  DEFINISI_KOLOM,
  KOLOM_TIDAK_BERLAKU_BELUM_DIBACA,
  jepitLebarKolom,
} from "../lib/definisi-kolom";
import type { KolomVerifikasi, PreferensiKolom } from "../lib/preferensi-kolom";

const INFO_UKURAN_AWAL: columnResizingState = {
  startOffset: null,
  startSize: null,
  deltaOffset: null,
  deltaPercentage: null,
  isResizingColumn: false,
  columnSizingStart: [],
};

export function useStateKolomTabel({
  preferensiKolom,
  modeBelumDibaca,
  onLebarKolom,
}: {
  preferensiKolom: PreferensiKolom;
  modeBelumDibaca: boolean;
  onLebarKolom: (kolom: KolomVerifikasi, lebar: number) => void;
}) {
  const [ukuranSementara, setUkuranSementara] = useState<ColumnSizingState>({});
  const [infoUkuran, setInfoUkuran] = useState<columnResizingState>(INFO_UKURAN_AWAL);

  const columnSizing = useMemo<ColumnSizingState>(
    () => ({ ...preferensiKolom.lebar, ...ukuranSementara }),
    [preferensiKolom.lebar, ukuranSementara],
  );

  const columnVisibility = useMemo<ColumnVisibilityState>(
    () =>
      Object.fromEntries(
        DEFINISI_KOLOM.map(({ id }) => [
          id,
          Boolean(preferensiKolom.tampil[id]) &&
            !(modeBelumDibaca && KOLOM_TIDAK_BERLAKU_BELUM_DIBACA.has(id)),
        ]),
      ),
    [preferensiKolom.tampil, modeBelumDibaca],
  );

  // Simpan lebar akhir tepat saat resize selesai (string → false).
  const resizeSebelumnya = useRef<string | false>(false);
  useEffect(() => {
    const kolomSebelumnya = resizeSebelumnya.current;
    resizeSebelumnya.current = infoUkuran.isResizingColumn;
    if (!kolomSebelumnya || infoUkuran.isResizingColumn) return;

    const lebar = columnSizing[kolomSebelumnya];
    if (lebar !== undefined) {
      const id = kolomSebelumnya as KolomVerifikasi;
      onLebarKolom(id, jepitLebarKolom(id, lebar));
    }
    setUkuranSementara({});
  }, [infoUkuran.isResizingColumn, columnSizing, onLebarKolom]);

  return {
    state: {
      columnOrder: preferensiKolom.urutan as string[],
      columnVisibility,
      columnSizing,
      columnResizing: infoUkuran,
    },
    onColumnSizingChange: setUkuranSementara,
    onColumnResizingChange: setInfoUkuran,
  };
}
