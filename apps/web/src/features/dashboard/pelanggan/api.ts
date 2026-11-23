/**
 * Manual ADD & Pelanggan API Client
 * Menangani seluruh pemanggilan endpoint backend /api/v1/manual-add/* secara terpusat,
 * konsisten, dan strongly-typed.
 */

export const manualAddApi = {
  /** Mengambil metrik KPI taksasi dan manual ADD untuk periode aktif */
  async getKpi(periode: string) {
    const res = await fetch(`/api/v1/manual-add/riwayat?periode=${encodeURIComponent(periode)}&limit=1`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Gagal memuat KPI manual add");
    }
    return json.data?.kpi ?? null;
  },

  /** Mengambil daftar riwayat input manual add */
  async getRiwayat(periode: string, query?: string) {
    const q = query?.trim() ? `&q=${encodeURIComponent(query.trim())}` : "";
    const res = await fetch(`/api/v1/manual-add/riwayat?periode=${encodeURIComponent(periode)}${q}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Gagal memuat riwayat manual add");
    }
    return json.data ?? null;
  },

  /** Mencari pelanggan berdasarkan nomor atau nama untuk input satuan */
  async cariPelanggan(nomor: string, periode: string) {
    const res = await fetch(
      `/api/v1/manual-add/cari-pelanggan?nomor=${encodeURIComponent(nomor)}&periode=${encodeURIComponent(periode)}`
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Gagal mencari pelanggan");
    }
    return json.data ?? [];
  },

  /** Submit input stand meter darurat satuan */
  async submitSatuan(payload: {
    pelangganId: string;
    periode: number;
    standAwal: number;
    standAkhir: number;
    pemakaian: number;
    kondisiCatat: string;
    alasanManual: string;
  }) {
    const res = await fetch("/api/v1/manual-add/satuan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menyimpan stand manual");
    }
    return json;
  },

  /** Mengambil opsi filter petugas dan rute untuk taksasi masal */
  async getMasalFilterOptions() {
    const res = await fetch("/api/v1/manual-add/masal/options");
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Gagal memuat opsi filter masal");
    }
    return json.data ?? { petugas: [], rute: [] };
  },

  /** Mengambil pratinjau data pelanggan yang akan ditaksasi masal */
  async getPreviewMasal(params: {
    periode: string;
    hanyaBelumBaca: boolean;
    petugasId?: string;
    ruteKode?: string;
  }) {
    const qs = new URLSearchParams({
      periode: params.periode,
      hanyaBelumBaca: String(params.hanyaBelumBaca),
    });
    if (params.petugasId && params.petugasId !== "all") {
      qs.append("petugasId", params.petugasId);
    }
    if (params.ruteKode && params.ruteKode !== "all") {
      qs.append("ruteKode", params.ruteKode);
    }

    const res = await fetch(`/api/v1/manual-add/masal/preview?${qs.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Gagal memuat pratinjau taksasi masal");
    }
    return json.data ?? null;
  },

  /** Eksekusi taksasi masal pelanggan terpilih */
  async eksekusiMasal(payload: {
    periode: number;
    alasanKategori: string;
    catatanBeritaAcara: string;
    items: any[];
  }) {
    const res = await fetch("/api/v1/manual-add/masal/eksekusi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || "Gagal eksekusi taksasi masal");
    }
    return json;
  },
};
