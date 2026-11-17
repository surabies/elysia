// features/dashboard/verifikasi/lib/definisi-kolom.ts — metadata STATIS kolom
// tabel verifikasi (label, tooltip, lebar minimum). Dipakai tabel, header, dan
// popover pengaturan kolom, jadi tidak ada label yang ditulis dua kali.
import type { KolomVerifikasi } from "./preferensi-kolom";

export const LEBAR_CEKLIS = 40;
export const LEBAR_KOLOM_MAKS = 800;

export interface DefinisiKolom {
  id: KolomVerifikasi;
  label: string;
  /** Nama lengkap — tooltip header. */
  title: string;
  minWidth: number;
  numeric?: boolean;
}

export const DEFINISI_KOLOM: readonly DefinisiKolom[] = [
  {
    id: "ring",
    label: "Ring",
    title: "Tahap verifikasi (Progress bar)",
    minWidth: 76,
  },
  {
    id: "nomor",
    label: "No. Pel",
    title: "Nomor pelanggan (langganan)",
    minWidth: 132,
  },
  { id: "nama", label: "Nama", title: "Nama pelanggan", minWidth: 220 },
  { id: "alamat", label: "Alamat", title: "Alamat pelanggan", minWidth: 280 },
  {
    id: "standAwal",
    label: "ST Awal",
    title: "Stand awal aktif",
    minWidth: 88,
    numeric: true,
  },
  {
    id: "standAkhir",
    label: "ST Akhir",
    title: "Stand akhir hasil catat petugas / laporan pelanggan",
    minWidth: 88,
    numeric: true,
  },
  {
    id: "standRevisi",
    label: "ST Revisi",
    title: "Stand awal hasil revisi",
    minWidth: 88,
    numeric: true,
  },
  {
    id: "standResmi",
    label: "ST Resmi",
    title: "Stand akhir resmi setelah diverifikasi",
    minWidth: 96,
    numeric: true,
  },
  {
    id: "pakai",
    label: "Pakai",
    title: "Pemakaian periode ini (m³)",
    minWidth: 72,
    numeric: true,
  },
  {
    id: "lalu",
    label: "Lalu",
    title: "Pemakaian bulan sebelumnya (m³)",
    minWidth: 72,
    numeric: true,
  },
  {
    id: "tagihan",
    label: "Tagihan",
    title: "Pemakaian tagihan dalam m³",
    minWidth: 88,
    numeric: true,
  },
  {
    id: "deviasi",
    label: "Dev %",
    title: "Deviasi pemakaian terhadap bulan lalu",
    minWidth: 84,
    numeric: true,
  },
  { id: "rute", label: "Rute", title: "Kode rute pembacaan", minWidth: 84 },
  {
    id: "kondisi",
    label: "Ket Catat",
    title: "Keterangan saat pencatatan",
    minWidth: 140,
  },
  { id: "petugas", label: "Petugas", title: "Petugas pencatat", minWidth: 130 },
  {
    id: "tanggal",
    label: "Tgl Catat",
    title: "Tanggal dan waktu catat",
    minWidth: 155,
  },
  {
    id: "status",
    label: "Status",
    title: "Status proses verifikasi",
    minWidth: 116,
  },
];

export const DEFINISI_KOLOM_PER_ID = Object.fromEntries(
  DEFINISI_KOLOM.map((d) => [d.id, d]),
) as Record<KolomVerifikasi, DefinisiKolom>;

/** Kolom yang tidak bermakna di tab "Belum dibaca" (belum ada setoran). */
export const KOLOM_TIDAK_BERLAKU_BELUM_DIBACA: ReadonlySet<KolomVerifikasi> =
  new Set<KolomVerifikasi>([
    "standAwal",
    "standAkhir",
    "standRevisi",
    "standResmi",
    "pakai",
    "lalu",
    "tagihan",
    "deviasi",
    "kondisi",
    "tanggal",
  ]);

/** Jepit lebar ke rentang yang diizinkan kolom itu. */
export function jepitLebarKolom(id: KolomVerifikasi, lebar: number): number {
  return Math.min(
    LEBAR_KOLOM_MAKS,
    Math.max(DEFINISI_KOLOM_PER_ID[id].minWidth, lebar),
  );
}
