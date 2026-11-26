/**
 * Capaian Pencatatan Meter API Client
 * Menangani seluruh pemanggilan endpoint backend /api/cater/capaian/* secara terpusat,
 * konsisten, dan strongly-typed.
 */

export const capaianApi = {
  /** Mengambil seluruh payload data capaian untuk wilayah dan tahun tertentu */
  async getData(wilayah: string, tahun: number) {
    const res = await fetch(`/api/cater/capaian?wilayah=${encodeURIComponent(wilayah)}&tahun=${tahun}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat data capaian");
    }
    return json.data;
  },

  /** Mengambil log riwayat perubahan target atau baseline */
  async getRiwayat(wilayah: string, tahun: number) {
    const res = await fetch(`/api/cater/capaian/riwayat?wilayah=${encodeURIComponent(wilayah)}&tahun=${tahun}`);
    const json = await res.json();
    if (res.ok && json.success) {
      return json.data ?? [];
    }
    return [];
  },

  /** Memperbarui target individual satu bulan */
  async updateTarget(payload: {
    wilayahId: string;
    tahun: number;
    bulan: number;
    targetSl: number;
    targetM3: number;
  }) {
    const res = await fetch("/api/cater/capaian/target", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal mengubah target");
    }
    return json.data;
  },

  /** Memperbarui target tahunan secara massal (bulk 12 bulan) */
  async bulkUpdateTarget(payload: {
    wilayahId: string;
    tahun: number;
    items: Array<{ bulan: number; targetSl: number; targetM3: number }>;
  }) {
    const res = await fetch("/api/cater/capaian/target/bulk", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menerapkan target bulk");
    }
    return json.data;
  },

  /** Memperbarui baseline Desember tahun lalu (Bulan 0) */
  async updateBaseline(payload: {
    wilayahId: string;
    tahun: number;
    bulan: number;
    realisasiSl: number;
    realisasiM3: number;
    sumber: string;
    dikunci: boolean;
  }) {
    const res = await fetch("/api/cater/capaian/realisasi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal mengubah baseline");
    }
    return json.data;
  },

  /** Memperbarui pengaturan hari acuan LPS */
  async updatePengaturan(payload: {
    wilayahId: string;
    tahun: number;
    hariAcuanLps: number;
  }) {
    const res = await fetch("/api/cater/capaian/pengaturan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal mengubah pengaturan");
    }
    return json.data;
  },

  /** Menjalankan sinkronisasi ulang data transaksi fisik dari database */
  async syncTransaksiFisik(payload: {
    wilayahId: string;
    tahun: number;
  }) {
    const res = await fetch("/api/cater/capaian/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal sinkronisasi data");
    }
    return json.data;
  },
};
