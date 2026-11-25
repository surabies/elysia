/**
 * KPI Scorecard API Client
 * Menangani seluruh pemanggilan endpoint backend /api/kpi/* secara terpusat,
 * konsisten, dan strongly-typed.
 */

export const kpiApi = {
  /** Menambah KPI baru ke sasaran objektif tertentu */
  async createKpi(payload: {
    name: string;
    objectiveId: string;
    ownerId: string;
    direction: string;
    weight: number;
    baseline: number;
    target: number;
    value: number | null;
    format: string;
    periode?: string;
    ownerDetails?: { name: string; initials: string };
  }) {
    const res = await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menambahkan KPI");
    }
    return json;
  },

  /** Mengambil data perspektif KPI untuk periode tertentu */
  async getByPeriode(periode: string) {
    const res = await fetch(`/api/kpi?periode=${encodeURIComponent(periode)}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat data KPI");
    }
    return json.data ?? [];
  },

  /** Sinkronisasi otomatis nilai aktual KPI dari laporan transaksi database riil */
  async syncRealisasiDariDatabase(periode: string, thbl?: string) {
    const res = await fetch("/api/kpi/sync-realisasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode, thbl }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menyinkronkan data dari laporan");
    }
    return json;
  },

  /** Mengambil matriks evaluasi beban kerja & parameter insentif petugas */
  async getEvaluasiInsentif(periode: string) {
    const res = await fetch(
      `/api/kpi/evaluasi-insentif?periode=${encodeURIComponent(periode)}`
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat matriks evaluasi insentif");
    }
    return json.data;
  },

  /** Memperbarui nilai aktual KPI */
  async updateNilai(kpiId: string, periode: string, nilai: number | null) {
    const res = await fetch(`/api/kpi/${encodeURIComponent(kpiId)}/nilai`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periode, nilai }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui nilai aktual KPI");
    }
    return json.data;
  },

  /** Memperbarui bobot persentase KPI */
  async updateBobot(kpiId: string, bobot: number) {
    const res = await fetch(`/api/kpi/${encodeURIComponent(kpiId)}/bobot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bobot }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui bobot KPI");
    }
    return json.data;
  },

  /** Mengambil daftar pemilik (owner) real dari database */
  async getOwners() {
    const res = await fetch("/api/kpi/owners");
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat daftar pemilik");
    }
    return json.data ?? [];
  },

  /** Mengambil konfigurasi aturan insentif perusahaan */
  async getAturanInsentif(periode: string) {
    const res = await fetch(
      `/api/kpi/aturan-insentif?periode=${encodeURIComponent(periode)}`
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat aturan insentif");
    }
    return json.data;
  },

  /** Menyimpan perubahan aturan insentif perusahaan */
  async updateAturanInsentif(data: any) {
    const res = await fetch("/api/kpi/aturan-insentif", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menyimpan aturan insentif");
    }
    return json.data;
  },

  /** Mengambil alokasi beban kerja dan penugasan seluruh petugas */
  async getAlokasiBeban(periode: string) {
    const res = await fetch(
      `/api/kpi/alokasi-beban?periode=${encodeURIComponent(periode)}`
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memuat alokasi beban petugas");
    }
    return json.data;
  },

  /** Memperbarui alokasi beban kerja personel tertentu */
  async updateAlokasiPetugas(
    petugasId: string,
    data: {
      periode: string;
      targetSlPenugasan?: number | null;
      faktorKesulitanMedan?: number;
      statusTugas?: string;
      catatan?: string | null;
    }
  ) {
    const res = await fetch(
      `/api/kpi/alokasi-beban/${encodeURIComponent(petugasId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui alokasi petugas");
    }
    return json;
  },

  /** Memperbarui penanggung jawab (owner) KPI */
  async updatePemilik(
    kpiId: string,
    owner: { id: string; name: string; initials: string }
  ) {
    const res = await fetch(`/api/kpi/${encodeURIComponent(kpiId)}/pemilik`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pemilikId: owner.id,
        pemilikNama: owner.name,
        pemilikInisial: owner.initials,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui pemilik KPI");
    }
    return json.data;
  },
};
