/**
 * API Client Layer untuk Modul Rute (Mutasi & Penggabungan Rute)
 * Menangani seluruh pemanggilan endpoint backend /api/rute/* secara terpusat,
 * konsisten, dan strongly-typed.
 */

import type { OpsiItem, PelangganItem, RiwayatMutasiItem } from "./types";

export interface MutasiPelangganPayload {
  noPel: string;
  wilayahId: string;
  ruteKode: string;
  noUrut: number;
}

export const ruteApi = {
  /** Mengambil daftar opsi wilayah pelayanan */
  async getWilayah(): Promise<OpsiItem[]> {
    const res = await fetch("/api/rute/wilayah");
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat wilayah pelayanan");
    }
    return json.data ?? [];
  },

  /** Mengambil daftar petugas pencatat aktif per wilayah */
  async getPetugas(wilayahId?: string): Promise<OpsiItem[]> {
    const params = new URLSearchParams();
    if (wilayahId) params.append("wilayahId", wilayahId);
    const res = await fetch(`/api/rute/petugas?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat petugas pencatat");
    }
    return json.data ?? [];
  },

  /** Mengambil rute-rute yang ditugaskan ke petugas tertentu */
  async getRuteByPetugas(petugasId: string): Promise<OpsiItem[]> {
    const res = await fetch(`/api/rute/daftar?petugasId=${encodeURIComponent(petugasId)}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat rute petugas");
    }
    return json.data ?? [];
  },

  /** Mengambil daftar rute tujuan transfer (mengecualikan rute asal) */
  async getRuteTujuan(kecuali?: string): Promise<OpsiItem[]> {
    const params = new URLSearchParams();
    if (kecuali) params.append("kecuali", kecuali);
    const res = await fetch(`/api/rute/tujuan?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat rute tujuan");
    }
    return json.data ?? [];
  },

  /** Mengambil daftar pelanggan pada suatu rute */
  async getPelangganByRute(ruteKode: string): Promise<PelangganItem[]> {
    const res = await fetch(`/api/rute/pelanggan?ruteId=${encodeURIComponent(ruteKode)}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat daftar pelanggan");
    }
    return json.data ?? [];
  },

  /** Mencari data pelanggan berdasarkan nomor pelanggan */
  async cariPelanggan(noPel: string): Promise<PelangganItem | null> {
    const res = await fetch(`/api/rute/pelanggan/${encodeURIComponent(noPel)}`);
    if (res.status === 404) return null;
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal mencari pelanggan");
    }
    return json.data ?? null;
  },

  /** Memindahkan pelanggan secara individu ke posisi rute baru */
  async simpanMutasi(payload: MutasiPelangganPayload): Promise<RiwayatMutasiItem> {
    const res = await fetch("/api/rute/mutasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menyimpan mutasi rute");
    }
    return json.data;
  },

  /** Memindahkan sekumpulan pelanggan secara massal ke rute baru */
  async pindahRuteMassal(noPelList: string[], ruteTujuan: string): Promise<boolean> {
    const res = await fetch("/api/rute/penggabungan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noPelList, ruteTujuan }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memindahkan rute pelanggan");
    }
    return true;
  },

  /** Mengambil riwayat mutasi audit log */
  async getRiwayat(): Promise<RiwayatMutasiItem[]> {
    const res = await fetch("/api/rute/riwayat");
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat riwayat mutasi");
    }
    return json.data ?? [];
  },
};
