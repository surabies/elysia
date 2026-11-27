/**
 * Master Data API Client
 * Menangani seluruh pemanggilan endpoint backend /api/master/* secara terpusat,
 * konsisten, dan strongly-typed.
 */

export const masterApi = {
  /** Pemetaan Petugas & Rute */
  pemetaan: {
    async getData() {
      const res = await fetch("/api/master/pemetaan-petugas");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat data pemetaan petugas dan rute");
      }
      return json.data;
    },
    async assignRute(ruteKode: string, petugasId: string | null, statusSementara = false) {
      const res = await fetch("/api/master/pemetaan-petugas/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruteKode, petugasId, statusSementara }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui penugasan rute");
      }
      return json;
    },
    async updateUrutanRute(items: { ruteKode: string; noUrut: number }[]) {
      const res = await fetch("/api/master/pemetaan-petugas/urutan-rute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan nomor urut rute");
      }
      return json;
    },
  },

  /** Master Petugas Cater */
  petugas: {
    async getAll() {
      const res = await fetch("/api/master/petugas");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat daftar petugas cater");
      }
      return json.data ?? [];
    },
    async create(payload: { id: string; nama: string; noHp?: string; aktif: boolean }) {
      const res = await fetch("/api/master/petugas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menambah petugas baru");
      }
      return json.data;
    },
    async update(id: string, payload: { nama: string; noHp?: string; aktif: boolean }) {
      const res = await fetch(`/api/master/petugas/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui data petugas");
      }
      return json.data;
    },
  },

  /** Urutan Langkah Baca Pelanggan */
  urutan: {
    async getRuteList() {
      const res = await fetch("/api/master/pemetaan-petugas");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat daftar rute");
      }
      return json.data?.rute ?? [];
    },
    async getUrutanByRute(ruteKode: string) {
      const res = await fetch(`/api/master/urut?ruteKode=${encodeURIComponent(ruteKode)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat urutan rute");
      }
      return json.data?.items ?? [];
    },
    async saveUrutan(ruteKode: string, items: { nolg: string; urutan: number }[], periode = "202601") {
      const res = await fetch("/api/master/urut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruteKode, periode, items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan urutan pelanggan");
      }
      return json;
    },
  },

  /** Master Kode Kelainan Meter */
  kelainan: {
    async getAll() {
      const res = await fetch("/api/master/kelainan");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat data kelainan meter");
      }
      return json.data ?? [];
    },
    async create(payload: {
      kodeTmss: string;
      nama: string;
      kategori: string;
      modeHitung: string;
      deskripsi?: string | null;
      aktif: boolean;
      isKendalaAkses: boolean;
      triggerBacaMandiri: boolean;
    }) {
      const res = await fetch("/api/master/kelainan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menambah kode kelainan baru");
      }
      return json.data;
    },
    async update(
      kodeTmss: string,
      payload: {
        nama: string;
        kategori?: string;
        modeHitung?: string;
        deskripsi?: string | null;
        aktif: boolean;
        isKendalaAkses: boolean;
        triggerBacaMandiri: boolean;
      }
    ) {
      const res = await fetch(`/api/master/kelainan/${encodeURIComponent(kodeTmss)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui kode kelainan");
      }
      return json.data;
    },
  },

  /** Manajemen Pengguna (Users) */
  users: {
    async getAll() {
      const res = await fetch("/api/master/users");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengambil daftar pengguna");
      }
      return json.data ?? [];
    },
    async create(payload: any) {
      const res = await fetch("/api/master/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal membuat pengguna baru");
      }
      return json.data;
    },
    async updateRole(
      userId: string,
      payload: { role?: string; status?: string; wilayahBinaan?: string | null }
    ) {
      const res = await fetch(`/api/master/users/${encodeURIComponent(userId)}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui peran pengguna");
      }
      return json.data;
    },
  },

  /** Matriks Hak Akses & Kustomisasi */
  otorisasi: {
    async getMatrix() {
      const res = await fetch("/api/master/otorisasi");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat matriks hak akses");
      }
      return json.data;
    },
    async saveMatrix(items: any[]) {
      const res = await fetch("/api/master/otorisasi", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan matriks hak akses");
      }
      return json;
    },
    async getUserOverrides(userId: string) {
      const res = await fetch(`/api/master/users/${encodeURIComponent(userId)}/hak-akses`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat hak akses khusus pengguna");
      }
      return json.data ?? [];
    },
    async saveUserOverrides(userId: string, overrides: any[]) {
      const res = await fetch(`/api/master/users/${encodeURIComponent(userId)}/hak-akses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan kustomisasi hak akses pengguna");
      }
      return json;
    },
  },
};
