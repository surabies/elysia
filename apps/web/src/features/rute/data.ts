/**
 * Data layer untuk fitur Rute (Mutasi & Penggabungan Rute)
 * Menghubungkan fungsi-fungsi front-end langsung ke Elysia API backend.
 */

import {
  fetchWilayah,
  fetchZona,
  fetchPetugas,
  fetchRute,
  fetchRuteTujuan,
  fetchPelanggan,
  fetchCariPelanggan,
  postPindahRute,
  postMutasiPelanggan,
  fetchRiwayat,
} from './api';

export type Opsi = { value: string; label: string };

export type Pelanggan = {
  urut: number;
  noPel: string;
  nama: string;
  alamat: string;
  golTarif: string;
  wilayah: string;
  rute: string;
  tglPasang: string;
};

export type Posisi = { wil: string; rute: string; urut: number };

export type RiwayatMutasi = {
  id: string;
  tglInput: string;
  noPel: string;
  nama: string;
  kodeWilayah: string;
  tglPasang: string;
  baru: Posisi;
  lama: Posisi;
  inputBy: string;
};

// Opsi wilayah default (akan diisi secara dinamis oleh getWilayah/fetchWilayah)
export const wilayahOpsi: Opsi[] = [
  { value: 'WP 1', label: 'WP 1' },
  { value: 'WP 2', label: 'WP 2' },
  { value: 'WP 3', label: 'WP 3' },
  { value: 'WP 4', label: 'WP 4' },
  { value: 'WP 5', label: 'WP 5' },
];

export async function getWilayah(): Promise<Opsi[]> {
  const data = await fetchWilayah();
  return data.length > 0 ? data : wilayahOpsi;
}

export async function getPetugas(wilayah: string): Promise<Opsi[]> {
  return await fetchPetugas(wilayah);
}

export async function getRute(petugasId: string): Promise<Opsi[]> {
  return await fetchRute(petugasId);
}

export async function getRuteTujuan(kecuali?: string): Promise<Opsi[]> {
  return await fetchRuteTujuan(kecuali);
}

export async function getZona(): Promise<Opsi[]> {
  return await fetchZona();
}

export async function getPelanggan(rute: string): Promise<Pelanggan[]> {
  return await fetchPelanggan(rute);
}

export async function cariPelanggan(noPel: string): Promise<Pelanggan | null> {
  return await fetchCariPelanggan(noPel);
}

export async function pindahRute(noPelList: string[], ruteBaru: string): Promise<boolean> {
  return await postPindahRute(noPelList, ruteBaru);
}

export async function getRiwayat(): Promise<RiwayatMutasi[]> {
  return await fetchRiwayat();
}

export async function simpanMutasi(p: Pelanggan, tujuan: Posisi, zona?: string): Promise<RiwayatMutasi> {
  return await postMutasiPelanggan(p.noPel, tujuan.wil, tujuan.rute, tujuan.urut, zona);
}
