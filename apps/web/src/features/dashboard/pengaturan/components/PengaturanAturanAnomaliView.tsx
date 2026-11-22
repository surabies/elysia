// apps/web/src/features/dashboard/pengaturan/components/PengaturanAturanAnomaliView.tsx
// Blueprint Komponen Pengaturan Modular Enterprise — Menggunakan Shadcn UI Tabs Standar & Full-Height Fluid Layout

'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sliders, Layers, AlertCircle, History } from 'lucide-react';
import { toast } from 'sonner';
import { useRbac } from '@/components/layout/shell/RbacContext';

// Sub-komponen Modular SSOT Aturan Anomali
import {
  PengaturanAturanAnomaliHeader,
  TabAturanEvaluasi,
  TabPemetaanTmss,
  TabBelumTerpetakan,
  TabVersiAuditLog,
  ModalEditAturan,
  ModalKonfirmasiDampak,
  type RuleItem,
  type KondisiMapItem,
  type UnmappedItem,
  type VersionItem,
  type AuditLogItem,
  type EditFormData,
  type PreviewData,
} from './aturan-anomali';

export function PengaturanAturanAnomaliView() {
  const { isSuperAdmin, hasRole } = useRbac();

  // Role Guard: Hanya SUPERADMIN dan VERIFIKATOR_2 yang dapat memodifikasi aturan
  const canEdit = React.useMemo(() => {
    return isSuperAdmin || hasRole('VERIFIKATOR_2');
  }, [isSuperAdmin, hasRole]);

  // States Data Utama
  const [rules, setRules] = React.useState<RuleItem[]>([]);
  const [versiAktif, setVersiAktif] = React.useState<number>(1);
  const [kondisiMaps, setKondisiMaps] = React.useState<KondisiMapItem[]>([]);
  const [unmappedList, setUnmappedList] = React.useState<UnmappedItem[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogItem[]>([]);
  const [versionList, setVersionList] = React.useState<VersionItem[]>([]);

  // States UI & Filter
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedRule, setSelectedRule] = React.useState<RuleItem | null>(null);
  const [previewData, setPreviewData] = React.useState<PreviewData | null>(null);
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [alasanPerubahan, setAlasanPerubahan] = React.useState('');

  // Form State untuk Edit Parameter
  const [editFormData, setEditFormData] = React.useState<EditFormData>({
    aktif: true,
    minM3: '',
    maxM3: '',
    minPersen: '',
    maxPersen: '',
    selisihMinM3: '',
    syaratPakaiLaluDibawah: '',
    syaratPeriodeBerturut: '',
    acuanPembanding: 'PAKAI_LALU',
    arahDeviasi: 'KEDUANYA',
  });

  const triggerToast = (title: string, desc: unknown, type: 'success' | 'error' = 'success') => {
    let message: string;
    if (typeof desc === 'string') {
      message = desc;
    } else if (desc && typeof desc === 'object') {
      const candidate = (desc as any).message || (desc as any).error || (desc as any).code;
      if (typeof candidate === 'string') {
        message = candidate;
      } else if (candidate && typeof candidate === 'object') {
        message = (candidate as any).message || (candidate as any).error || JSON.stringify(candidate);
      } else {
        message = JSON.stringify(desc);
      }
    } else {
      message = String(desc || '');
    }
    if (type === 'error') {
      toast.error(title, { description: message });
    } else {
      toast.success(title, { description: message });
    }
  };

  // State pemicu refresh data
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const fetchData = React.useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Muat data dari Backend API dengan lifecycle aman
  React.useEffect(() => {
    let ignore = false;

    async function loadData() {
      // Hanya aktifkan loading spinner layar penuh saat pertama kali data belum ada
      if (rules.length === 0) {
        setIsLoading(true);
      }
      try {
        const fetchOpts: RequestInit = {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        };

        const [resRules, resMaps, resUnmapped, resAudit, resVersi] = await Promise.all([
          fetch('/api/aturan-anomali', fetchOpts).then((r) => r.json()),
          fetch('/api/aturan-anomali/kondisi-map', fetchOpts).then((r) => r.json()),
          fetch('/api/aturan-anomali/kondisi-unmapped', fetchOpts).then((r) => r.json()),
          fetch('/api/aturan-anomali/audit-log', fetchOpts).then((r) => r.json()),
          fetch('/api/aturan-anomali/versi', fetchOpts).then((r) => r.json()),
        ]);

        if (ignore) return;

        if (resRules?.success) {
          const ruleList = Array.isArray(resRules.data)
            ? resRules.data
            : Array.isArray(resRules.data?.data)
              ? resRules.data.data
              : [];
          setRules(ruleList);
          setVersiAktif(resRules.versi ?? resRules.data?.versi ?? 1);
        }
        if (resMaps?.success) setKondisiMaps(resMaps.data || []);
        if (resUnmapped?.success) setUnmappedList(resUnmapped.data || []);
        if (resAudit?.success) setAuditLogs(resAudit.data || []);
        if (resVersi?.success) setVersionList(resVersi.data || []);
      } catch (err: any) {
        if (!ignore) {
          triggerToast('Gagal Memuat Data', err.message || 'Terjadi kesalahan jaringan.', 'error');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  // Handler Buka Edit Modal
  const handleSelectRule = (rule: RuleItem) => {
    setSelectedRule(rule);
    setPreviewData(null);
    setAlasanPerubahan('');
    setEditFormData({
      aktif: rule.aktif,
      minM3: rule.minM3 !== null ? String(rule.minM3) : '',
      maxM3: rule.maxM3 !== null ? String(rule.maxM3) : '',
      minPersen: rule.minPersen !== null ? String(rule.minPersen) : '',
      maxPersen: rule.maxPersen !== null ? String(rule.maxPersen) : '',
      selisihMinM3: rule.selisihMinM3 !== null ? String(rule.selisihMinM3) : '',
      syaratPakaiLaluDibawah:
        rule.syaratPakaiLaluMinM3 !== null && rule.syaratPakaiLaluMinM3 !== undefined
          ? String(rule.syaratPakaiLaluMinM3)
          : rule.syaratPakaiLaluDibawah !== null && rule.syaratPakaiLaluDibawah !== undefined
            ? String(rule.syaratPakaiLaluDibawah)
            : rule.kecualikanJikaPakaiLaluDibawah !== null && rule.kecualikanJikaPakaiLaluDibawah !== undefined
              ? String(rule.kecualikanJikaPakaiLaluDibawah)
              : '',
      syaratPeriodeBerturut:
        rule.syaratPeriodeBerturut !== null && rule.syaratPeriodeBerturut !== undefined
          ? String(rule.syaratPeriodeBerturut)
          : '',
      acuanPembanding: rule.acuanPembanding || 'PAKAI_LALU',
      arahDeviasi: rule.arah || 'KEDUANYA',
    });
  };

  // Handler Pratinjau Dry-run Dampak Perubahan Aturan
  const handleDryRunPreview = async () => {
    if (!selectedRule) return;
    setIsPreviewing(true);
    try {
      const payload = {
        ruleId: selectedRule.id,
        params: {
          aktif: editFormData.aktif,
          minM3: editFormData.minM3 !== '' ? Number(editFormData.minM3) : null,
          maxM3: editFormData.maxM3 !== '' ? Number(editFormData.maxM3) : null,
          minPersen: editFormData.minPersen !== '' ? Number(editFormData.minPersen) : null,
          maxPersen: editFormData.maxPersen !== '' ? Number(editFormData.maxPersen) : null,
          selisihMinM3: editFormData.selisihMinM3 !== '' ? Number(editFormData.selisihMinM3) : null,
          syaratPakaiLaluMinM3:
            editFormData.syaratPakaiLaluDibawah !== '' ? Number(editFormData.syaratPakaiLaluDibawah) : null,
          syaratPeriodeBerturut:
            editFormData.syaratPeriodeBerturut !== '' ? Number(editFormData.syaratPeriodeBerturut) : null,
          acuanPembanding: editFormData.acuanPembanding,
          arah: editFormData.arahDeviasi,
        },
      };

      const res = await fetch('/api/aturan-anomali/simulasi-dampak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res?.success) {
        setPreviewData(res.data);
        triggerToast('Simulasi Berhasil', 'Hasil kalkulasi dampak dry-run telah diperbarui.');
      } else {
        const errMsg = typeof res?.error === 'string' ? res.error : res?.message || 'Tidak dapat menjalankan dry-run.';
        triggerToast('Gagal Simulasi', errMsg, 'error');
      }
    } catch (err: any) {
      triggerToast('Gagal Simulasi', err?.message || 'Terjadi gangguan sistem saat simulasi.', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Simpan Perubahan Parameter secara Resmi
  const handleSaveConfirmed = async () => {
    if (!selectedRule || !alasanPerubahan.trim()) {
      triggerToast('Validasi Gagal', 'Alasan perubahan parameter aturan wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ruleId: selectedRule.id,
        alasan: alasanPerubahan.trim(),
        params: {
          aktif: editFormData.aktif,
          minM3: editFormData.minM3 !== '' ? Number(editFormData.minM3) : null,
          maxM3: editFormData.maxM3 !== '' ? Number(editFormData.maxM3) : null,
          minPersen: editFormData.minPersen !== '' ? Number(editFormData.minPersen) : null,
          maxPersen: editFormData.maxPersen !== '' ? Number(editFormData.maxPersen) : null,
          selisihMinM3: editFormData.selisihMinM3 !== '' ? Number(editFormData.selisihMinM3) : null,
          syaratPakaiLaluMinM3:
            editFormData.syaratPakaiLaluDibawah !== '' ? Number(editFormData.syaratPakaiLaluDibawah) : null,
          syaratPeriodeBerturut:
            editFormData.syaratPeriodeBerturut !== '' ? Number(editFormData.syaratPeriodeBerturut) : null,
          acuanPembanding: editFormData.acuanPembanding,
          arah: editFormData.arahDeviasi,
        },
      };

      const res = await fetch('/api/aturan-anomali/simpan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res?.success) {
        triggerToast(
          'Aturan Berhasil Diperbarui',
          `Versi v${res.data?.versi ?? res.versi} telah aktif. Evaluasi periode berjalan disesuaikan.`
        );
        setShowConfirmModal(false);
        setSelectedRule(null);
        fetchData();
      } else {
        const errMsg = typeof res?.error === 'string' ? res.error : res?.message || 'Gagal menyimpan perubahan aturan.';
        triggerToast('Gagal Menyimpan', errMsg, 'error');
      }
    } catch (err: any) {
      triggerToast('Gagal Menyimpan', err?.message || 'Terjadi kesalahan sistem saat menyimpan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // State Mutex/Loading untuk Toggle Status Cepat (Mencegah Race Condition & Double Submit)
  const [pendingToggleId, setPendingToggleId] = React.useState<string | null>(null);

  // Toggle Aktif Cepat dengan Optimistic UI & Request Locking
  const handleToggleAktif = async (rule: RuleItem) => {
    if (!canEdit) {
      triggerToast('Akses Ditolak', 'Hanya SUPERADMIN dan VERIFIKATOR_2 yang dapat mengubah status aturan.', 'error');
      return;
    }

    if (pendingToggleId) {
      // Sedang ada proses perubahan status berjalan, abaikan klik beruntun
      return;
    }

    const targetAktif = !rule.aktif;
    setPendingToggleId(rule.id);

    // 1. Optimistic Update lokal seketika agar antarmuka responsif tanpa jeda
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, aktif: targetAktif } : r))
    );

    try {
      const res = await fetch(`/api/aturan-anomali/${rule.id}/toggle-aktif`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aktif: targetAktif,
          alasan: `Toggle status aturan ${rule.kode}`,
        }),
      }).then((r) => r.json());

      if (!res?.success) {
        const errMsg = typeof res?.error === 'string' ? res.error : res?.message || 'Gagal mengubah status aktif.';
        throw new Error(errMsg);
      }

      triggerToast('Status aturan diperbarui', `Aturan ${rule.kode} kini ${targetAktif ? 'aktif' : 'nonaktif'}`);
      fetchData();
    } catch (err: any) {
      // Rollback status lokal jika gagal di backend
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, aktif: rule.aktif } : r))
      );
      triggerToast('Gagal Mengubah Status', err?.message || 'Gagal mengubah status aturan.', 'error');
    } finally {
      setPendingToggleId(null);
    }
  };

  // Filter Rules berdasarkan Pencarian
  const filteredRules = React.useMemo(() => {
    if (!searchQuery.trim()) return rules;
    const q = searchQuery.toLowerCase();
    return rules.filter(
      (r) =>
        r.kode.toLowerCase().includes(q) ||
        r.nama.toLowerCase().includes(q) ||
        (r.deskripsi || '').toLowerCase().includes(q)
    );
  }, [rules, searchQuery]);

  return (
    <div className="h-full min-h-0 min-w-0 flex flex-col flex-1 p-3 sm:p-4 gap-3 overflow-hidden">
      {/* 1. Header Seksi */}
      <PengaturanAturanAnomaliHeader
        versiAktif={versiAktif}
        canEdit={canEdit}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={fetchData}
      />

      {/* 2. Subnavigasi Tab Bergaris Bawah Vercel Geist (Garis Aksen Hitam/Putih Solid) */}
      <Tabs defaultValue="aturan" className="h-full min-h-0 flex flex-col flex-1 gap-3 overflow-hidden">
        <div className="shrink-0 overflow-x-auto no-scrollbar border-b border-border">
          <TabsList variant="line" className="h-10 w-full justify-start gap-1 p-0 bg-transparent border-0 -mb-px">
            <TabsTrigger value="aturan" className="gap-2 px-3.5 h-10 text-label-13">
              <Sliders className="size-3.5" />
              <span>Aturan Evaluasi ({rules.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pemetaan" className="gap-2 px-3.5 h-10 text-label-13">
              <Layers className="size-3.5" />
              <span>Pemetaan TMSS ({kondisiMaps.length})</span>
            </TabsTrigger>
            <TabsTrigger value="unmapped" className="gap-2 px-3.5 h-10 text-label-13">
              <AlertCircle className="size-3.5" />
              <span>Belum Terpetakan ({unmappedList.length})</span>
            </TabsTrigger>
            <TabsTrigger value="versi" className="gap-2 px-3.5 h-10 text-label-13">
              <History className="size-3.5" />
              <span>Audit Log ({auditLogs.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: ATURAN EVALUASI (TanStack Table Interaktif — Ringan, Cepat & Presisi) */}
        <TabsContent value="aturan" className="h-full min-h-0 flex-1 flex flex-col m-0 data-[state=active]:flex overflow-hidden">
          <TabAturanEvaluasi
            rules={filteredRules}
            canEdit={canEdit}
            isLoading={isLoading}
            pendingToggleId={pendingToggleId}
            onSelectRule={handleSelectRule}
            onToggleAktif={handleToggleAktif}
          />
        </TabsContent>

        {/* TAB 2: PEMETAAN TMSS (TanStack Table Interaktif — Ringan, Cepat & Presisi) */}
        <TabsContent value="pemetaan" className="h-full min-h-0 flex-1 flex flex-col m-0 data-[state=active]:flex overflow-hidden">
          <TabPemetaanTmss kondisiMaps={kondisiMaps} canEdit={canEdit} isLoading={isLoading} />
        </TabsContent>

        {/* TAB 3: BELUM TERPETAKAN */}
        <TabsContent value="unmapped" className="h-full min-h-0 flex-1 flex flex-col m-0 data-[state=active]:flex overflow-auto">
          <TabBelumTerpetakan unmappedList={unmappedList} canEdit={canEdit} />
        </TabsContent>

        {/* TAB 4: VERSI & AUDIT TRAIL LOG */}
        <TabsContent value="versi" className="h-full min-h-0 flex-1 flex flex-col m-0 data-[state=active]:flex overflow-auto">
          <TabVersiAuditLog versionList={versionList} auditLogs={auditLogs} />
        </TabsContent>
      </Tabs>

      {/* 3. Modal Dialog Edit Aturan */}
      <ModalEditAturan
        rule={selectedRule}
        formData={editFormData}
        canEdit={canEdit}
        isPreviewing={isPreviewing}
        isSubmitting={isSubmitting}
        previewData={previewData}
        alasanPerubahan={alasanPerubahan}
        onClose={() => setSelectedRule(null)}
        onFormChange={setEditFormData}
        onAlasanChange={setAlasanPerubahan}
        onPreview={handleDryRunPreview}
        onSubmit={() => {
          const baris = previewData?.jumlahBarisBerubah ?? previewData?.totalBarisBerubah ?? 0;
          if (baris > 100) {
            setShowConfirmModal(true);
          } else {
            handleSaveConfirmed();
          }
        }}
      />

      {/* 4. Modal Konfirmasi Dampak & Alasan Audit Trail */}
      <ModalKonfirmasiDampak
        open={showConfirmModal}
        previewData={previewData}
        alasanPerubahan={alasanPerubahan}
        isSubmitting={isSubmitting}
        onOpenChange={setShowConfirmModal}
        onConfirm={handleSaveConfirmed}
      />
    </div>
  );
}
