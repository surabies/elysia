// Tipe publik dan internal DataGrid.
import type { ReactNode } from "react"
import type {
  CellValueChangedEvent,
  ColDef,
  ColGroupDef,
} from "ag-grid-community"

export type BarisData = Record<string, unknown>

export interface FilterSelect {
  /** Nama query param di endpoint, mis. "status". */
  param: string
  label: string
  opsi: { value: string; label: string }[]
}

/** Penyaring rentang tanggal (satu tombol + kalender + pintasan). Nilainya
 *  ikut `filterNilai` seperti dropdown biasa — tanggal kosong tidak terkirim
 *  karena api-client membuang param bernilai "". */
export interface FilterTanggal {
  /** Param batas bawah, mis. "tanggalDari". */
  paramDari: string
  /** Param batas atas, mis. "tanggalSampai". */
  paramSampai: string
  /** Tanggal apa yang disaring, mis. "Tanggal catat" / "Masuk". */
  label: string
}

export type OperatorFilterLanjutan = "equals" | "contains" | "startsWith"

export interface FilterLanjutanField {
  id: string
  label: string
  param: string
  operatorParam?: string
  type?: "text" | "select"
  opsi?: { value: string; label: string }[]
  operator?: { value: OperatorFilterLanjutan; label: string }[]
  placeholder?: string
}

interface DataGridBaseProps {
  /** Nama tabel: label aksesibilitas panel + dasar nama file ekspor. */
  judul: string
  columnDefs: ColDef[]
  /** Definisi berkelompok khusus untuk AG Grid; `columnDefs` tetap menjadi daftar kolom daun. */
  columnGroupDefs?: (ColDef | ColGroupDef)[]
  /** Baris ringkasan yang selalu ditampilkan di bagian bawah grid lokal. */
  pinnedBottomRowData?: BarisData[]
  /** Tinggi baris khusus untuk grid yang menampilkan daftar pendek. */
  rowHeight?: number
  /** Callback setelah nilai sel lokal berubah melalui editor grid. */
  onCellValueChanged?: (event: CellValueChangedEvent<BarisData>) => void
  /** Nama param pencarian bila endpoint mendukung (biasanya "q"). Tanpa ini kotak cari disembunyikan. */
  searchParam?: string
  searchPlaceholder?: string
  initialSearch?: string
  filters?: FilterSelect[]
  advancedFilters?: FilterLanjutanField[]
  /** Penyaring rentang tanggal; endpoint harus menerima kedua paramnya. */
  filterTanggal?: FilterTanggal
  /** Param tetap yang selalu ikut terkirim. */
  extraParams?: Record<string, string>
  tinggiClassName?: string
  /** Klik baris (pola master-detail, mis. halaman verifikasi). */
  onRowClicked?: (data: BarisData) => void
  /** Klik kanan baris — pemicu menu aksi kontekstual (halaman verifikasi).
   *  Menyediakan koordinat viewport kursor; menu default browser ditekan. */
  onRowContextMenu?: (data: BarisData, posisi: { x: number; y: number }) => void
  /** id baris yang sedang dipilih — disorot sinkron dengan panel detail. */
  idTerpilih?: string | null
  /** Naikkan nilainya untuk memaksa muat ulang data (setelah aksi verifikasi). */
  refreshKey?: number
  /** Aksi tambahan yang diletakkan bersama kontrol toolbar grid. */
  toolbarActions?: ReactNode
  /** Kontrol tambahan di depan pencarian pada toolbar grid. */
  toolbarStart?: ReactNode
  /** Konten visual tambahan di atas area tabel. */
  contentBeforeGrid?: ReactNode
  /** Pendekkan bingkai grid mengikuti jumlah baris, maksimal setinggi slotnya. */
  sesuaikanTinggiDenganBaris?: boolean
  /** Sembunyikan toolbar bawaan bila kontrol disediakan oleh halaman. */
  showToolbar?: boolean
}

export type DataGridProps = DataGridBaseProps &
  (
    | {
        /** Path list di bawah /api/v1, mis. "/pelanggan". */
        endpoint: string
        rowData?: never
      }
    | {
        /** Baris yang sudah dimuat pemanggil untuk model client-side. */
        endpoint?: never
        rowData: BarisData[]
      }
  )

export type BarisFilterLanjutan = {
  id: number
  fieldId: string
  operator: OperatorFilterLanjutan
  value: string
}

export type ParamUrut = { sortBy?: string; sortDir?: string }

export type KeadaanDaftar = {
  /** Sidik jari kueri yang menghasilkan keadaan ini — beda = basi. */
  kunci: string
  baris: BarisData[]
  halaman: number
  total: number | null
  adaLagi: boolean
  memuat: boolean
  galat: string | null
}
