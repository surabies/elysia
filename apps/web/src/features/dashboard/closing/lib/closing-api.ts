import type {
  CekSelisihData,
  CreatePasangBaruPayload,
  CreatePerubahanKategoriPayload,
  PbpkData,
  PerbandinganPeriodeData,
  PratinjauData,
  StandAngkatMutasiItem,
  StandAngkatVerificationStatus,
  WorkflowStageItem,
} from '../types';

export interface ClosingBundleResponse {
  stages: WorkflowStageItem[];
  pratinjau: PratinjauData | null;
  standAngkatList: StandAngkatMutasiItem[];
  perbandingan: PerbandinganPeriodeData | null;
}

export async function fetchClosingBundle(
  periode: string,
): Promise<ClosingBundleResponse> {
  const [resStages, resPratinjau, resStandAngkat, resPerbandingan] =
    await Promise.all([
      fetch(`/api/closing/workflow-status/${periode}`).then((r) => r.json()),
      fetch(`/api/closing/pratinjau/${periode}`).then((r) => r.json()),
      fetch(`/api/closing/stand-angkat/${periode}`).then((r) => r.json()),
      fetch(`/api/closing/perbandingan/${periode}`).then((r) => r.json()),
    ]);

  return {
    stages: resStages.success ? resStages.data.stages : [],
    pratinjau: resPratinjau.success ? resPratinjau.data : null,
    standAngkatList: resStandAngkat.success ? resStandAngkat.data : [],
    perbandingan: resPerbandingan.success ? resPerbandingan.data : null,
  };
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
  return { message: json.message };
}

export async function verifyStandAngkatMutasi(
  id: string,
  status: Exclude<StandAngkatVerificationStatus, 'PENDING'>,
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
  return json.data;
}

export async function fetchPbpkData(periode: string): Promise<PbpkData> {
  const res = await fetch(`/api/closing/pbpk/${periode}`);
  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Gagal memuat data PBPK.');
  }
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
  return { message: json.message };
}

export async function fetchCekSelisihData(
  periode: string,
): Promise<CekSelisihData> {
  const res = await fetch(`/api/closing/cek-selisih/${periode}`);
  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Gagal memuat data rekonsiliasi pelanggan.');
  }
  return json.data;
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
  return { message: json.message ?? json.data?.message };
}
