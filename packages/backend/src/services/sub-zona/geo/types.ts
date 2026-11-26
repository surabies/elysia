export interface FC<T = Record<string, unknown>> {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    geometry: unknown
    properties: T
  }>
}

export interface RingkasanLaporanPeta {
  aktif: number
  laporan30Hari: number
  rataRataResponsJam: number | null
  rataRataPenyelesaianJam: number | null
  trenBulanan: Array<{ bulan: string; jumlah: number }>
  hotspot: Array<{ kelurahan: string; jumlah: number }>
}

export interface RingkasanAsetPeta {
  totalRute: number
  ruteDenganGeometri: number
  pelangganBerkoordinat: number
  kelurahanDenganGeometri: number
}

export interface StatistikPipaJaringan {
  totalSegmen: number
  totalPanjangKm: number
  panjangPerMaterial: Array<{ material: string; panjangKm: number; segmen: number }>
  panjangPerFungsi: Array<{ fungsi: string; panjangKm: number; segmen: number }>
  totalSumberAir: number
}

export interface SumberAirItem {
  id: string
  nama: string
  tipe: string
  wilayah: string | null
  kapasitasLps: number | null
  status: string
  keterangan: string | null
  latitude: number
  longitude: number
}

export interface KriteriaPelangganDicabut {
  tutupSementara: number
  tutupSpt: number
  disegel: number
  dicabut: number
  eksPelanggan: number
}

export interface StatistikStatusPelanggan {
  total: number
  pelangganAktif: number
  pelangganDicabut: number
  pelangganPotensial: number
  kriteriaDicabut: KriteriaPelangganDicabut
}
