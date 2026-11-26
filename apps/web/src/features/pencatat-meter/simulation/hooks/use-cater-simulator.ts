'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { errorMessage, request } from '../lib/cater-simulator-api';
import type {
  AuditEntry,
  Customer,
  ReadingResult,
  ReadingScenario,
  RouteSummary,
} from '../types';

export function useCaterSimulator() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [routeCode, setRouteCode] = useState('');
  const [month, setMonth] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerNumber, setCustomerNumber] = useState('');
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [stml, setStml] = useState('');
  const [stma, setStma] = useState('');
  const [pakaiLalu, setPakaiLalu] = useState('');
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [condition, setCondition] = useState('Normal');
  const [method, setMethod] = useState('ONSITE');
  const [source, setSource] = useState('PETUGAS_ONSITE');
  const [duration, setDuration] = useState('20');
  const [note, setNote] = useState('');
  const [fotoMeterUrl, setFotoMeterUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedReading, setSavedReading] = useState<ReadingResult | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [stageNote, setStageNote] = useState('');
  const [adjustedStand, setAdjustedStand] = useState('');
  const [correctedStand, setCorrectedStand] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [busyAction, setBusyAction] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);

  const selectedCustomer = customers.find((customer) => customer.nolg === customerNumber) ?? null;
  const selectedRoute = routes.find((route) => route.kode === routeCode) ?? null;
  const period = month.replace('-', '');
  const hasExistingReading = Boolean(selectedCustomer?.readingId);
  const readingId = savedReading?.id ?? selectedCustomer?.readingId ?? '';

  const initialStand = useMemo(() => {
    if (!selectedCustomer) return '';
    return String(selectedCustomer.stml ?? selectedCustomer.standSebelumnya ?? '');
  }, [selectedCustomer]);

  useEffect(() => {
    let active = true;
    Promise.all([
      request<{ periodeTerakhir: string | null }>('/api/cater/stats'),
      request<RouteSummary[]>('/api/cater/routes?limit=500'),
    ])
      .then(([stats, routeResponse]) => {
        if (!active) return;
        const nextRoutes = routeResponse.data ?? [];
        setRoutes(nextRoutes);
        setRouteCode(nextRoutes[0]?.kode ?? '');
        const latestPeriod = stats.data?.periodeTerakhir;
        if (latestPeriod && /^\d{6}$/.test(latestPeriod)) {
          setMonth(`${latestPeriod.slice(0, 4)}-${latestPeriod.slice(4)}`);
        } else {
          const now = new Date();
          setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
      })
      .catch((error: unknown) => {
        if (active) setPageError(errorMessage(error, 'Gagal memuat data simulator.'));
      })
      .finally(() => {
        if (active) setLoadingRoutes(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!routeCode || !period) return;
    let active = true;
    setLoadingCustomers(true);
    setPageError(null);
    setCustomers([]);
    setCustomerNumber('');
    request<Customer[]>(
      `/api/cater/routes/${encodeURIComponent(routeCode)}/pelanggan?thbl=${encodeURIComponent(period)}&limit=2000`,
    )
      .then((response) => {
        if (!active) return;
        const list = response.data ?? [];
        setCustomers(list);
        setCustomerNumber(list[0]?.nolg ?? '');
      })
      .catch((error: unknown) => {
        if (active) setPageError(errorMessage(error, 'Gagal memuat pelanggan rute.'));
      })
      .finally(() => {
        if (active) setLoadingCustomers(false);
      });
    return () => {
      active = false;
    };
  }, [routeCode, period]);

  useEffect(() => {
    if (!selectedCustomer) return;
    setStml(initialStand);
    setStma(String(selectedCustomer.stmaTerakhir ?? ''));
    setPakaiLalu(String(selectedCustomer.pakaiLalu ?? selectedCustomer.pakaiSebelumnya ?? 0));
    setCurrentStatus(selectedCustomer.statusVerifikasi);
    setOverwriteConfirmed(false);
    setSavedReading(null);
    setSavedMessage(null);
    setOperationError(null);
  }, [selectedCustomer, initialStand]);

  useEffect(() => {
    if (!readingId) {
      setAudit([]);
      return;
    }
    let active = true;
    request<AuditEntry[]>(`/api/cater/history/${encodeURIComponent(readingId)}`)
      .then((response) => {
        if (active) {
          setAudit(response.data ?? []);
          setAuditError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) setAuditError(errorMessage(error, 'Gagal memuat audit.'));
      });
    return () => {
      active = false;
    };
  }, [readingId]);

  const refreshAudit = async (id: string) => {
    setAuditError(null);
    try {
      const response = await request<AuditEntry[]>(`/api/cater/history/${encodeURIComponent(id)}`);
      setAudit(response.data ?? []);
    } catch (error) {
      setAuditError(errorMessage(error, 'Gagal memuat riwayat audit.'));
    }
  };

  const submitReading = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOperationError(null);
    setSavedMessage(null);
    if (!selectedCustomer) {
      setOperationError('Pilih pelanggan sebelum menyimpan simulasi.');
      return;
    }
    if (hasExistingReading && !overwriteConfirmed) {
      setOperationError('Konfirmasi penimpaan bacaan periode ini terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        thbl: period,
        nolg: selectedCustomer.nolg,
        ruteKode: routeCode,
        petugasId: selectedRoute?.petugasDefault || undefined,
        stml: Number(stml),
        stma: Number(stma),
        pakaiLalu: Number(pakaiLalu),
        kondisiCatat: condition,
        metodeCatat: method,
        sumberCatat: source,
        durasiDetik: Number(duration),
        fotoMeterUrl: fotoMeterUrl || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        catatan: note,
      };
      const response = await request<ReadingResult>('/api/cater/readings/simulate', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!response.data) throw new Error('Server tidak mengembalikan hasil pembacaan.');
      setSavedReading(response.data);
      setCurrentStatus(response.data.statusVerifikasi);
      setSavedMessage(response.message || 'Simulasi tersimpan ke database operasional.');
      setStma(String(response.data.stma));
      await refreshAudit(response.data.id);
    } catch (error) {
      setOperationError(errorMessage(error, 'Gagal menyimpan simulasi.'));
    } finally {
      setSaving(false);
    }
  };

  const runStage = async (endpoint: string, body: Record<string, string | number>) => {
    if (!readingId) return;
    setBusyAction(true);
    setOperationError(null);
    setSavedMessage(null);
    try {
      const response = await request<{ statusVerifikasi?: string }>(
        `/api/cater/${endpoint}`,
        { method: 'POST', body: JSON.stringify({ caterId: readingId, ...body }) },
      );
      if (response.statusVerifikasi) {
        setCurrentStatus(response.statusVerifikasi);
        setSavedReading((current) =>
          current ? { ...current, statusVerifikasi: response.statusVerifikasi! } : current,
        );
      }
      setSavedMessage(response.message || `Tahap ${endpoint} berhasil dijalankan.`);
      await refreshAudit(readingId);
    } catch (error) {
      setOperationError(errorMessage(error, `Gagal menjalankan ${endpoint}.`));
    } finally {
      setBusyAction(false);
    }
  };

  const runCorrection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!readingId) return;
    setBusyAction(true);
    setOperationError(null);
    setSavedMessage(null);
    try {
      const response = await request<{ statusVerifikasi?: string }>('/api/cater/staff/correct', {
        method: 'POST',
        body: JSON.stringify({
          caterId: readingId,
          stmaBaru: Number(correctedStand),
          pakaiM3Baru: Number(correctedStand) - Number(stml),
          nomorTiketKomplain: ticketNumber || undefined,
          alasan: correctionReason,
        }),
      });
      if (response.statusVerifikasi) {
        setCurrentStatus(response.statusVerifikasi);
        setSavedReading((current) =>
          current ? { ...current, statusVerifikasi: response.statusVerifikasi! } : current,
        );
      }
      setSavedMessage(response.message || 'Koreksi berhasil dijalankan.');
      await refreshAudit(readingId);
    } catch (error) {
      setOperationError(errorMessage(error, 'Gagal menjalankan koreksi staf.'));
    } finally {
      setBusyAction(false);
    }
  };

  const fillScenario = (scenario: ReadingScenario) => {
    const start = Number(stml || initialStand || 0);
    const nextStand =
      scenario === 'normal'
        ? start + 10
        : scenario === 'high'
          ? start + 101
          : scenario === 'reverse'
            ? Math.max(0, start - 1)
            : start;
    setStma(String(nextStand));
    if (scenario === 'zero') setPakaiLalu('0');
    setCondition(
      scenario === 'normal'
        ? 'Normal'
        : scenario === 'zero'
          ? 'Stand Tidak Berubah'
          : 'Meter Perlu Diperiksa',
    );
  };

  return {
    routes,
    routeCode,
    setRouteCode,
    month,
    setMonth,
    customers,
    customerNumber,
    setCustomerNumber,
    loadingRoutes,
    loadingCustomers,
    pageError,
    selectedCustomer,
    selectedRoute,
    period,
    initialStand,
    stml,
    setStml,
    stma,
    setStma,
    pakaiLalu,
    setPakaiLalu,
    currentStatus,
    condition,
    setCondition,
    method,
    setMethod,
    source,
    setSource,
    duration,
    setDuration,
    note,
    setNote,
    fotoMeterUrl,
    setFotoMeterUrl,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    hasExistingReading,
    overwriteConfirmed,
    setOverwriteConfirmed,
    saving,
    savedReading,
    savedMessage,
    operationError,
    stageNote,
    setStageNote,
    adjustedStand,
    setAdjustedStand,
    correctedStand,
    setCorrectedStand,
    correctionReason,
    setCorrectionReason,
    ticketNumber,
    setTicketNumber,
    busyAction,
    readingId,
    audit,
    auditError,
    submitReading,
    runStage,
    runCorrection,
    fillScenario,
  };
}

export type CaterSimulatorState = ReturnType<typeof useCaterSimulator>;
