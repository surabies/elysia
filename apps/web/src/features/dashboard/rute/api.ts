/**
 * Client API Layer untuk Modul Rute (Mutasi & Penggabungan Rute)
 */

import { api } from '@/lib/api-client';
import type { Opsi, Pelanggan, RiwayatMutasi } from './data';

export async function fetchWilayah(): Promise<Opsi[]> {
  try {
    const res = await fetch('/api/rute/wilayah');
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchWilayah error:', err);
    return [];
  }
}

export async function fetchZona(): Promise<Opsi[]> {
  try {
    const res = await fetch('/api/rute/zona');
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchZona error:', err);
    return [];
  }
}

export async function fetchPetugas(wilayahId?: string): Promise<Opsi[]> {
  try {
    const params = new URLSearchParams();
    if (wilayahId) params.append('wilayahId', wilayahId);
    const res = await fetch(`/api/rute/petugas?${params.toString()}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchPetugas error:', err);
    return [];
  }
}

export async function fetchRute(petugasId: string): Promise<Opsi[]> {
  try {
    const res = await fetch(`/api/rute/daftar?petugasId=${encodeURIComponent(petugasId)}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchRute error:', err);
    return [];
  }
}

export async function fetchRuteTujuan(kecuali?: string): Promise<Opsi[]> {
  try {
    const params = new URLSearchParams();
    if (kecuali) params.append('kecuali', kecuali);
    const res = await fetch(`/api/rute/tujuan?${params.toString()}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchRuteTujuan error:', err);
    return [];
  }
}

export async function fetchPelanggan(ruteKode: string): Promise<Pelanggan[]> {
  try {
    const res = await fetch(`/api/rute/pelanggan?ruteId=${encodeURIComponent(ruteKode)}`);
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchPelanggan error:', err);
    return [];
  }
}

export async function fetchCariPelanggan(noPel: string): Promise<Pelanggan | null> {
  try {
    const res = await fetch(`/api/rute/pelanggan/${encodeURIComponent(noPel)}`);
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch (err) {
    console.error('fetchCariPelanggan error:', err);
    return null;
  }
}

export async function postPindahRute(noPelList: string[], ruteBaru: string): Promise<boolean> {
  try {
    const res = await fetch('/api/rute/penggabungan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noPelList, ruteTujuan: ruteBaru }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Gagal memindahkan rute pelanggan');
    }
    return true;
  } catch (err: any) {
    console.error('postPindahRute error:', err);
    throw err;
  }
}

export async function postMutasiPelanggan(
  noPel: string,
  wilayah: string,
  rute: string,
  urut: number,
  zona?: string
): Promise<RiwayatMutasi> {
  try {
    const res = await fetch('/api/rute/mutasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noPel,
        wilayahId: wilayah,
        ruteKode: rute,
        noUrut: urut,
        zona,
      }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Gagal menyimpan mutasi rute');
    }
    return json.data;
  } catch (err: any) {
    console.error('postMutasiPelanggan error:', err);
    throw err;
  }
}

export async function fetchRiwayat(): Promise<RiwayatMutasi[]> {
  try {
    const res = await fetch('/api/rute/riwayat');
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.error('fetchRiwayat error:', err);
    return [];
  }
}
