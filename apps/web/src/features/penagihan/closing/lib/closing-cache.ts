import {
  CLOSING_SESSION_STATE_KEY,
  DEFAULT_CLOSING_PERIODE,
} from './closing-format';
import type {
  CekSelisihData,
  PbpkData,
  PerbandinganPeriodeData,
  PeriodeKerjaInfo,
  PratinjauData,
  StandAngkatMutasiItem,
  WorkflowStageItem,
} from '../types';

export interface ClosingBundleSnapshot {
  stages: WorkflowStageItem[];
  pratinjau: PratinjauData | null;
  standAngkatList: StandAngkatMutasiItem[];
  perbandingan: PerbandinganPeriodeData | null;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const FRESH_TTL_MS = 20_000;

let sharedActivePeriode: string | null = null;
let hasInitializedFromServer = false;
let periodeInfoCache: CacheEntry<PeriodeKerjaInfo> | null = null;

const bundleCache = new Map<string, CacheEntry<ClosingBundleSnapshot>>();
const pbpkCache = new Map<string, CacheEntry<PbpkData>>();
const cekSelisihCache = new Map<string, CacheEntry<CekSelisihData>>();

const periodeSubscribers = new Set<(periode: string) => void>();

function readSessionPeriode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CLOSING_SESSION_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { periode?: string };
    if (parsed.periode && /^\d{6}$/.test(parsed.periode)) {
      return parsed.periode;
    }
  } catch {
    // Abaikan jika sessionStorage diblokir
  }
  return null;
}

function persistSessionPeriode(periode: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(CLOSING_SESSION_STATE_KEY);
    const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.sessionStorage.setItem(
      CLOSING_SESSION_STATE_KEY,
      JSON.stringify({ ...prev, periode }),
    );
  } catch {
    // Abaikan
  }
}

export function getSharedClosingPeriode(options?: {
  ssrSafe?: boolean;
}): string {
  if (sharedActivePeriode) return sharedActivePeriode;
  if (!options?.ssrSafe) {
    const fromSession = readSessionPeriode();
    if (fromSession) {
      sharedActivePeriode = fromSession;
      return fromSession;
    }
  }
  if (
    periodeInfoCache?.data.periodeAktif &&
    /^\d{6}$/.test(periodeInfoCache.data.periodeAktif)
  ) {
    sharedActivePeriode = periodeInfoCache.data.periodeAktif;
    return sharedActivePeriode;
  }
  return DEFAULT_CLOSING_PERIODE;
}

export function setSharedClosingPeriode(
  periode: string,
  options?: { fromServerDefault?: boolean },
) {
  if (!/^\d{6}$/.test(periode)) return;
  if (options?.fromServerDefault) {
    if (hasInitializedFromServer || readSessionPeriode()) {
      hasInitializedFromServer = true;
      return;
    }
    hasInitializedFromServer = true;
  } else {
    hasInitializedFromServer = true;
  }

  if (sharedActivePeriode === periode) return;
  sharedActivePeriode = periode;
  persistSessionPeriode(periode);
  for (const listener of periodeSubscribers) {
    listener(periode);
  }
}

export function subscribeSharedClosingPeriode(
  listener: (periode: string) => void,
): () => void {
  periodeSubscribers.add(listener);
  return () => {
    periodeSubscribers.delete(listener);
  };
}

export function getCachedPeriodeInfo(): PeriodeKerjaInfo | null {
  return periodeInfoCache?.data ?? null;
}

export function isPeriodeInfoFresh(): boolean {
  return Boolean(
    periodeInfoCache && Date.now() - periodeInfoCache.fetchedAt < FRESH_TTL_MS,
  );
}

export function setCachedPeriodeInfo(data: PeriodeKerjaInfo) {
  periodeInfoCache = { data, fetchedAt: Date.now() };
}

export function getCachedClosingBundle(
  periode: string,
): ClosingBundleSnapshot | null {
  return bundleCache.get(periode)?.data ?? null;
}

export function isClosingBundleFresh(periode: string): boolean {
  const entry = bundleCache.get(periode);
  return Boolean(entry && Date.now() - entry.fetchedAt < FRESH_TTL_MS);
}

export function setCachedClosingBundle(
  periode: string,
  data: ClosingBundleSnapshot,
) {
  bundleCache.set(periode, { data, fetchedAt: Date.now() });
}

export function getCachedPbpkData(periode: string): PbpkData | null {
  return pbpkCache.get(periode)?.data ?? null;
}

export function isPbpkDataFresh(periode: string): boolean {
  const entry = pbpkCache.get(periode);
  return Boolean(entry && Date.now() - entry.fetchedAt < FRESH_TTL_MS);
}

export function setCachedPbpkData(periode: string, data: PbpkData) {
  pbpkCache.set(periode, { data, fetchedAt: Date.now() });
}

export function getCachedCekSelisihData(
  periode: string,
): CekSelisihData | null {
  return cekSelisihCache.get(periode)?.data ?? null;
}

export function isCekSelisihDataFresh(periode: string): boolean {
  const entry = cekSelisihCache.get(periode);
  return Boolean(entry && Date.now() - entry.fetchedAt < FRESH_TTL_MS);
}

export function setCachedCekSelisihData(periode: string, data: CekSelisihData) {
  cekSelisihCache.set(periode, { data, fetchedAt: Date.now() });
}

/**
 * Menghapus entri cache saat terjadi mutasi (simpan stand PBPK, setujui ganti meter,
 * sahkan bacaan V3, kunci buku, buka bulan baru) agar pembacaan berikutnya segar
 * namun tetap mempertahankan data sebelumnya di layar (tanpa kedipan).
 */
export function invalidateClosingCaches(periode?: string) {
  periodeInfoCache = null;
  if (periode) {
    const entryBundle = bundleCache.get(periode);
    if (entryBundle) entryBundle.fetchedAt = 0;
    const entryPbpk = pbpkCache.get(periode);
    if (entryPbpk) entryPbpk.fetchedAt = 0;
    const entrySelisih = cekSelisihCache.get(periode);
    if (entrySelisih) entrySelisih.fetchedAt = 0;
  } else {
    for (const entry of bundleCache.values()) entry.fetchedAt = 0;
    for (const entry of pbpkCache.values()) entry.fetchedAt = 0;
    for (const entry of cekSelisihCache.values()) entry.fetchedAt = 0;
  }
}
