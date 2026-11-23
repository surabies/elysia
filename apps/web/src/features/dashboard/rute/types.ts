export interface OpsiItem {
  value: string;
  label: string;
}

export interface PelangganItem {
  urut: number;
  noPel: string;
  nama: string;
  alamat: string;
  golTarif: string;
  wilayah: string;
  rute: string;
  tglPasang: string;
}

export interface PosisiRute {
  wil: string;
  rute: string;
  urut: number;
}

export interface RiwayatMutasiItem {
  id: string;
  tglInput: string;
  noPel: string;
  nama: string;
  kodeWilayah: string;
  tglPasang: string;
  baru: PosisiRute;
  lama: PosisiRute;
  inputBy: string;
}

export const wilayahPelayananOpsi: OpsiItem[] = [
  { value: "WP 1", label: "WP 1 — Wilayah Pelayanan 1" },
  { value: "WP 2", label: "WP 2 — Wilayah Pelayanan 2" },
  { value: "WP 3", label: "WP 3 — Wilayah Pelayanan 3" },
  { value: "WP 4", label: "WP 4 — Wilayah Pelayanan 4" },
  { value: "WP 5", label: "WP 5 — Wilayah Pelayanan 5" },
  { value: "WP 6", label: "WP 6 — Wilayah Pelayanan 6" },
];
