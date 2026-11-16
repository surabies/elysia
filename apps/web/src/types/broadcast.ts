export type KategoriBroadcast =
  | 'DARURAT'
  | 'PEMELIHARAAN'
  | 'EVENT'
  | 'INFORMASI'

export type StatusBroadcast =
  | 'DALAM_PENGERJAAN'
  | 'SELESAI'
  | 'TERJADWAL'

export type TipeMediaBroadcast =
  | 'BROSUR'
  | 'FOTO_KEGIATAN'
  | 'PETA_AREA'
  | 'DOKUMENTASI'

export interface MediaBroadcastItem {
  url: string
  judul: string
  keterangan?: string
  tipe: TipeMediaBroadcast
}

export interface WilayahTerdampakItem {
  kecamatan: string
  kelurahan: string[]
}

export interface PromoDetailsItem {
  highlightDiskon?: string
  periode?: string
  keunggulan?: string[]
  syaratKetentuan?: string[]
  langkahDaftar?: string[]
  ctaLink?: string
  ctaText?: string
}

export interface BroadcastGangguanItem {
  id: string
  judul: string
  ringkasan: string
  kategori: KategoriBroadcast
  status: StatusBroadcast
  progresPersen: number
  prioritas: 'TINGGI' | 'SEDANG' | 'NORMAL'
  waktuMulai: string
  estimasiSelesai: string
  penyebab: string
  dampak: string
  tindakanPenanganan: string
  wilayahTerdampak: WilayahTerdampakItem[]
  kontakBantuan?: {
    label: string
    nomor: string
    waLink?: string
  }
  // Media Visual: Foto kegiatan, brosur gebyar, gambar area terdampak
  gambarUtama?: string
  tipeGambarUtama?: TipeMediaBroadcast
  galeriMedia?: MediaBroadcastItem[]
  // Khusus Event / Iklan / Promo
  promoDetails?: PromoDetailsItem
  aktif: boolean
  diperbaruiPada: string
}
