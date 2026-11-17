// features/dashboard/verifikasi/lib/seret-kolom.ts — props drag-and-drop untuk
// memindah urutan kolom. Dipakai header tabel dan popover pengaturan kolom;
// kolom asal dibawa lewat dataTransfer sehingga tidak butuh ref bersama.
import type { DragEvent } from "react";
import { DEFINISI_KOLOM_PER_ID } from "./definisi-kolom";
import type { KolomVerifikasi } from "./preferensi-kolom";

const MIME = "application/x-kolom-verifikasi";

export function propsSeretKolom(
  id: KolomVerifikasi,
  onPindah: (dari: KolomVerifikasi, ke: KolomVerifikasi) => void,
) {
  return {
    draggable: true as const,
    onDragStart(e: DragEvent) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(MIME, id);
    },
    onDragOver(e: DragEvent) {
      e.preventDefault();
    },
    onDrop(e: DragEvent) {
      e.preventDefault();
      const dari = e.dataTransfer.getData(MIME) as KolomVerifikasi;
      if (dari && dari !== id && dari in DEFINISI_KOLOM_PER_ID)
        onPindah(dari, id);
    },
  };
}
