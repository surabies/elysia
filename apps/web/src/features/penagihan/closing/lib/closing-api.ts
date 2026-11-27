import {
  getCachedCekSelisihData,
  getCachedClosingBundle,
  getCachedPbpkData,
  getCachedPeriodeInfo,
  getSharedClosingPeriode,
  invalidateClosingCaches,
  isCekSelisihDataFresh,
  isClosingBundleFresh,
  isPbpkDataFresh,
  isPeriodeInfoFresh,
  setCachedCekSelisihData,
  setCachedClosingBundle,
  setCachedPbpkData,
  setCachedPeriodeInfo,
  setSharedClosingPeriode,
} from './closing-cache';
import type {
  CekSelisihData,
  CreatePasangBaruPayload,
  CreatePerubahanKategoriPayload,
  PbpkData,
  PerbandinganPeriodeData,
  PeriodeKerjaInfo,
  PratinjauData,
  StandAngkatDecisionStatus,
  StandAngkatMutasiItem,
  WorkflowStageItem,
} from '../types';

export interface ClosingBundleResponse {
  stages: WorkflowStageItem[];
  pratinjau: PratinjauData | null;
  standAngkatList: StandAngkatMutasiItem[];
  perbandingan: PerbandinganPeriodeData | null;
}

let inFlightPeriodeInfo: Promise<PeriodeKerjaInfo | null> | null = null;
const inFlightBundle = new Map<string, Promise<ClosingBundleResponse>>();
const inFlightPbpk = new Map<string, Promise<PbpkData>>();
const inFlightCekSelisih = new Map<string, Promise<CekSelisihData>>();

export async function fetchPeriodeKerjaInfo(options?: {
  force?: boolean;
}): Promise<PeriodeKerjaInfo | null> {
  if (!options?.force && isPeriodeInfoFresh()) {
    return getCachedPeriodeInfo();
  }
  if (inFlightPeriodeInfo) {
    return inFlightPeriodeInfo;
  }

  inFlightPeriodeInfo = (async () => {
    try {
      const res = await fetch('/api/closing/periode-kerja');
      const json = await res.json();
      if (json.success && json.data) {
        const info = json.data as PeriodeKerjaInfo;
        setCachedPeriodeInfo(info);
        if (info.periodeAktif && /^\d{6}$/.test(info.periodeAktif)) {
          setSharedClosingPeriode(info.periodeAktif, {
            fromServerDefault: true,
          });
        }
        return info;
      }
      return getCachedPeriodeInfo();
    } catch {
      return getCachedPeriodeInfo();
    } finally {
      inFlightPeriodeInfo = null;
    }
  })();

  return inFlightPeriodeInfo;
}

export async function fetchClosingBundle(
  periode: string,
  options?: { force?: boolean },
): Promise<ClosingBundleResponse> {
  if (!options?.force && isClosingBundleFresh(periode)) {
    const cached = getCachedClosingBundle(periode);
    if (cached) return cached;
  }

  const existing = inFlightBundle.get(periode);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const [resStages, resPratinjau, resStandAngkat, resPerbandingan] =
        await Promise.all([
          fetch(`/api/closing/workflow-status/${periode}`).then((r) =>
            r.json(),
          ),
          fetch(`/api/closing/pratinjau/${periode}`).then((r) => r.json()),
          fetch(`/api/closing/stand-angkat/${periode}`).then((r) => r.json()),
          fetch(`/api/closing/perbandingan/${periode}`).then((r) => r.json()),
        ]);

      const bundle: ClosingBundleResponse = {
        stages: resStages.success ? resStages.data.stages : [],
        pratinjau: resPratinjau.success ? resPratinjau.data : null,
        standAngkatList: resStandAngkat.success ? resStandAngkat.data : [],
        perbandingan: resPerbandingan.success ? resPerbandingan.data : null,
      };
      setCachedClosingBundle(periode, bundle);
      return bundle;
    } finally {
      inFlightBundle.delete(periode);
    }
  })();

  inFlightBundle.set(periode, promise);
  return promise;
}

export async function fetchPbpkData(
  periode: string,
  options?: { force?: boolean },
): Promise<PbpkData> {
  if (!options?.force && isPbpkDataFresh(periode)) {
    const cached = getCachedPbpkData(periode);
    if (cached) return cached;
  }

  const existing = inFlightPbpk.get(periode);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/closing/pbpk/${periode}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Gagal memuat data PBPK.');
      }
      const data = json.data as PbpkData;
      setCachedPbpkData(periode, data);
      return data;
    } finally {
      inFlightPbpk.delete(periode);
    }
  })();

  inFlightPbpk.set(periode, promise);
  return promise;
}

export async function fetchCekSelisihData(
  periode: string,
  options?: { force?: boolean },
): Promise<CekSelisihData> {
  if (!options?.force && isCekSelisihDataFresh(periode)) {
    const cached = getCachedCekSelisihData(periode);
    if (cached) return cached;
  }

  const existing = inFlightCekSelisih.get(periode);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/closing/cek-selisih/${periode}`);
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(
          json.error || 'Gagal memuat data rekonsiliasi pelanggan.',
        );
      }
      const data = json.data as CekSelisihData;
      setCachedCekSelisihData(periode, data);
      return data;
    } finally {
      inFlightCekSelisih.delete(periode);
    }
  })();

  inFlightCekSelisih.set(periode, promise);
  return promise;
}

/**
 * Memanaskan cache tab tujuan saat hover/idle agar perpindahan tab 0ms tanpa kedipan.
 */
export function prefetchClosingRouteData(href: string, periode?: string) {
  const targetPeriode = periode || getSharedClosingPeriode();
  if (!/^\d{6}$/.test(targetPeriode)) return;

  if (href.includes('/pbpk')) {
    void fetchPbpkData(targetPeriode);
  } else if (href.includes('/cek-selisih')) {
    void fetchCekSelisihData(targetPeriode);
  } else {
    void fetchClosingBundle(targetPeriode);
  }
}

export async function postDatameterMassal(
  periode: string,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/posting-datameter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periode }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal memposting datameter.');
  }
  invalidateClosingCaches(periode);
  return json.data;
}

export async function executeClosingPeriode(
  periode: string,
  tanggalJatuhTempo: string,
): Promise<{ jumlahSl: number; totalM3?: number; totalTagihan?: number }> {
  const res = await fetch('/api/closing/eksekusi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      periode,
      tanggalJatuhTempo: new Date(tanggalJatuhTempo).toISOString(),
    }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Eksekusi closing gagal.');
  }
  invalidateClosingCaches();
  return json.data;
}

export async function initializeBulanBaru(
  periodeLalu: string,
  periodeBaru: string,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/bulan-baru', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periodeLalu, periodeBaru }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal membuka bulan baru.');
  }
  invalidateClosingCaches();
  return { message: json.message };
}

export async function verifyStandAngkatMutasi(
  id: string,
  status: StandAngkatDecisionStatus,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/stand-angkat/verifikasi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal memverifikasi mutasi stand angkat.');
  }
  invalidateClosingCaches();
  return json.data;
}

export async function submitPasangBaru(
  payload: CreatePasangBaruPayload,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/pbpk/pasang-baru', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal menyimpan sambungan pasang baru.');
  }
  invalidateClosingCaches(payload.periode);
  return { message: json.message };
}

export async function submitPerubahanKategori(
  payload: CreatePerubahanKategoriPayload,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/pbpk/perubahan-kategori', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal mengubah kategori tarif.');
  }
  invalidateClosingCaches(payload.periode);
  return { message: json.message };
}

export interface PelangganPkPreview {
  nolg: string;
  nama: string;
  alamat: string;
  status: string;
  tarifKode?: string | null;
  ruteKode?: string | null;
  noMeter?: string | null;
  noTelp?: string | null;
}

export async function fetchPelangganUntukPk(
  nolg: string,
): Promise<PelangganPkPreview> {
  const cleanNolg = nolg.trim();
  const res = await fetch(`/api/closing/pbpk/pelanggan/${encodeURIComponent(cleanNolg)}`);
  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || `Pelanggan dengan nomor ${cleanNolg} tidak ditemukan.`);
  }
  return json.data as PelangganPkPreview;
}

export async function submitBacaanPbpk(payload: {
  periode: string;
  items: Array<{ nolg: string; standAwal: number; standAkhir: number }>;
}): Promise<{ message: string; tersimpan: number }> {
  const res = await fetch('/api/closing/pbpk/baca-meter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal menyimpan angka stand meter PBPK.');
  }
  invalidateClosingCaches(payload.periode);
  return {
    message: json.message,
    tersimpan: json.tersimpan ?? payload.items.length,
  };
}

export async function executeUpdateZonasi(
  periode: string,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/update-zonasi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periode }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal menyelaraskan zonasi & rute.');
  }
  invalidateClosingCaches(periode);
  return { message: json.message ?? json.data?.message };
}

export async function executeUploadMasterPelanggan(
  periode: string,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/upload-master-pelanggan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periode }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal memvalidasi master pelanggan.');
  }
  invalidateClosingCaches(periode);
  return { message: json.message ?? json.data?.message };
}

export async function executeSyncPelangganBaru(
  periode: string,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/sync-pelanggan-baru', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periode }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal menyinkronkan pelanggan baru ke DPM.');
  }
  invalidateClosingCaches(periode);
  return { message: json.message ?? json.data?.message };
}

export async function executeUpdateDataPelanggan(
  periode: string,
): Promise<{ message: string }> {
  const res = await fetch('/api/closing/update-data-pelanggan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periode }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Gagal menormalisasi urutan pelanggan.');
  }
  invalidateClosingCaches(periode);
  return { message: json.message ?? json.data?.message };
}
