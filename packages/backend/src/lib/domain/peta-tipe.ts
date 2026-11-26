export interface WilayahJalur {
  id: string
  nama: string
  d: string
  warna?: number
}

export interface ParamProyeksi {
  minLng: number
  maxLat: number
  skala: number
  offsetX: number
  offsetY: number
}

export interface PetaGeoJson {
  type: "FeatureCollection"
  features: Array<{
    type: "Feature"
    geometry: { type: string; coordinates: unknown }
    properties: Record<string, unknown>
  }>
}

export interface PetaCakupan {
  lebar: number
  tinggi: number
  kelurahan: WilayahJalur[]
  kecamatan: WilayahJalur[]
  titikPelanggan: [number, number][]
  proyeksi: ParamProyeksi
  geoJson: {
    kelurahan: PetaGeoJson
    kecamatan: PetaGeoJson
    pelanggan: PetaGeoJson
  }
}

export function proyeksikanTitik(
  p: ParamProyeksi,
  lng: number,
  lat: number
): [number, number] {
  return [
    p.offsetX + (lng - p.minLng) * p.skala,
    p.offsetY + (p.maxLat - lat) * p.skala,
  ]
}
