// features/dashboard/verifikasi/lib/status-verifikasi.ts — label dan warna
// lencana kolom Status berbasis Vercel Geist Color System.
import type { BarisVerifikasi, ModeRing } from "../types";
import { GAYA_BELUM_DIBACA, type Tahap } from "./warna-tahap";

export type LabelStatus =
  | "Belum dibaca"
  | "Terverifikasi"
  | "Perlu Review"
  | "Disetujui"
  | "Tervalidasi V2"
  | "Tervalidasi V1"
  | "Menunggu";

export function labelStatus(
  row: BarisVerifikasi,
  tahap: Tahap,
  modeBelumDibaca: boolean,
  modeRing: ModeRing,
): LabelStatus {
  if (modeBelumDibaca) return "Belum dibaca";
  if (row.laporanMandiriTerverifikasi) return "Terverifikasi";
  if (modeRing === "tunggal") {
    if (row.status === "DITOLAK") return "Perlu Review";
    if (row.status === "DIVERIFIKASI" || row.status === "DIGUNAKAN")
      return "Disetujui";
  }
  if (modeRing === "berjenjang" && tahap === "V3") return "Disetujui";
  if (tahap === "V2") return "Tervalidasi V2";
  if (tahap === "V1") return "Tervalidasi V1";
  if (modeRing === "berjenjang" && tahap === "DITOLAK") return "Perlu Review";
  return "Menunggu";
}

// Kelas ditulis utuh menggunakan token Geist (Step 100 surface, Step 400 border, Step 900 text)
const KELAS_STATUS: Record<LabelStatus, string> = {
  Disetujui:
    "bg-(--verif-v3-soft) text-(--verif-v3-text) ring-1 ring-inset ring-(--verif-v3-border)",
  "Tervalidasi V2":
    "bg-(--verif-v2-soft) text-(--verif-v2-text) ring-1 ring-inset ring-(--verif-v2-border)",
  Terverifikasi:
    "bg-(--verif-v2-soft) text-(--verif-v2-text) ring-1 ring-inset ring-(--verif-v2-border)",
  "Tervalidasi V1":
    "bg-(--verif-v1-soft) text-(--verif-v1-text) ring-1 ring-inset ring-(--verif-v1-border)",
  "Perlu Review":
    "bg-(--verif-error-soft) text-(--verif-error-text) ring-1 ring-inset ring-(--verif-error-border)",
  "Belum dibaca": GAYA_BELUM_DIBACA.lencana,
  Menunggu:
    "bg-(--ds-gray-100) text-(--ds-gray-900) ring-1 ring-inset ring-(--ds-gray-400)",
};

export const kelasStatus = (label: LabelStatus) => KELAS_STATUS[label];
