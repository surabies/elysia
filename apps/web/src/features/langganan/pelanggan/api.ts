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

/**
 * Pelanggan Administrasi API Client
 * Menangani validasi kontak, pencarian pelanggan, profil detail, dan mutasi golongan tarif.
 */
export const pelangganApi = {
  /** Mengambil daftar pelanggan untuk validasi kontak dengan filter status, rute, search, dan pagination */
  async getDaftarKontak(params: {
    q?: string;
    status?: import('./types').KontakStatusFilter;
    ruteKode?: string;
    page?: number;
    limit?: number;
  }): Promise<import('./types').DaftarKontakResponse> {
    const qs = new URLSearchParams();
    if (params.q?.trim()) qs.set('q', params.q.trim());
    if (params.status && params.status !== 'ALL') qs.set('status', params.status);
    if (params.ruteKode && params.ruteKode !== 'all') qs.set('ruteKode', params.ruteKode);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await fetch(`/api/cater/pelanggan/kontak${queryStr}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat daftar kontak pelanggan');
    }
    return json;
  },

  /** Memperbarui nomor telepon / WhatsApp pelanggan */
  async updateKontak(nolg: string, noTelp: string): Promise<import('./types').UpdateKontakResult> {
    const res = await fetch(`/api/cater/pelanggan/${encodeURIComponent(nolg)}/kontak`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noTelp }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memperbarui kontak pelanggan');
    }
    return json;
  },

  /** Pencarian cepat pelanggan (NOLG, NPRS, Nama, Alamat) */
  async search(query: string, limit: number = 30) {
    const res = await fetch(
      `/api/cater/pelanggan/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal mencari pelanggan');
    }
    return json.data ?? [];
  },

  /** Mengambil profil detail pelanggan beserta riwayat baca dan DRD */
  async getDetail(nolg: string): Promise<import('./types').DetailPelangganResponse['data']> {
    const res = await fetch(`/api/cater/pelanggan/${encodeURIComponent(nolg)}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Gagal memuat detail pelanggan ${nolg}`);
    }
    return json.data;
  },

  /** Memperbarui golongan tarif pelanggan */
  async updateTarif(
    nolg: string,
    tarifKode: string,
    options?: Partial<import('./types').UpdateTarifPayload>
  ): Promise<import('./types').UpdateTarifResult> {
    const res = await fetch(`/api/cater/pelanggan/${encodeURIComponent(nolg)}/tarif`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tarifKode, ...options }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal mengubah golongan tarif');
    }
    return json;
  },

  /** Melakukan mutasi master pelanggan (Balik Nama, Alamat, Status, GPS) */
  async mutasiPelanggan(
    nolg: string,
    payload: import('./types').MutasiPelangganPayload
  ): Promise<import('./types').MutasiPelangganResult> {
    const res = await fetch(`/api/cater/pelanggan/${encodeURIComponent(nolg)}/mutasi`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menyimpan mutasi pelanggan');
    }
    return json;
  },

  /** Mengambil daftar opsi rute cater */
  async getRuteList(): Promise<Array<{ kode: string; nama?: string }>> {
    try {
      const res = await fetch('/api/cater/routes');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        return json.data.map((r: any) => ({
          kode: r.kode,
          nama: r.nama || r.kode,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  /** Mengambil master golongan tarif beserta blok tarif progresif */
  async getGolonganTarif(): Promise<import('./types').GolonganTarifItem[]> {
    const res = await fetch('/api/publik/tarif');
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat master tarif');
    }
    return json.data ?? [];
  },

  /** Menghitung simulasi rincian tagihan air berdasarkan golongan dan volume m3 */
  async hitungSimulasi(
    kode: string,
    volume: number
  ): Promise<import('./types').SimulasiTagihanData> {
    const res = await fetch(
      `/api/publik/tarif/hitung?kode=${encodeURIComponent(kode)}&volume=${volume}`
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menghitung simulasi tagihan');
    }
    return json.data;
  },

  /** Mengambil daftar opsi golongan tarif ringkas */
  async getGolonganTarifList(): Promise<Array<{ kode: string; nama: string }>> {
    try {
      const items = await this.getGolonganTarif();
      return items.map((t) => ({
        kode: t.kode,
        nama: `${t.kode} - ${t.nama}`,
      }));
    } catch {
      return [];
    }
  },

  /** Mengambil daftar pelanggan untuk validasi titik koordinat GPS / Geotagging */
  async getDaftarGps(params: {
    q?: string;
    status?: 'ALL' | 'BER_GPS' | 'TANPA_GPS';
    ruteKode?: string;
    page?: number;
    limit?: number;
  }): Promise<import('./types').DaftarGpsResponse> {
    const qs = new URLSearchParams();
    if (params.q?.trim()) qs.set('q', params.q.trim());
    if (params.status && params.status !== 'ALL') qs.set('status', params.status);
    if (params.ruteKode && params.ruteKode !== 'all') qs.set('ruteKode', params.ruteKode);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await fetch(`/api/cater/pelanggan/geotag${queryStr}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal memuat daftar koordinat GPS pelanggan');
    }
    return json;
  },

  /** Memperbarui titik koordinat GPS pelanggan (Quick Geotag) */
  async updateGps(
    nolg: string,
    payload: { lat: number; lng: number; catatan?: string }
  ): Promise<import('./types').UpdateGpsResult> {
    const res = await fetch(`/api/cater/pelanggan/${encodeURIComponent(nolg)}/geotag`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Gagal menyimpan koordinat GPS');
    }
    return json;
  },
};
