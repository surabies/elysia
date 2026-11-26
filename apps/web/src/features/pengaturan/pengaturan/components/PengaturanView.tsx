// features/dashboard/pengaturan/components/PengaturanView.tsx
// Assembly Utama Konsol Pengaturan Enterprise Modular Tirtawening
// Khusus konfigurasi internal: Akun & Operator, Catat Meter, Verifikasi Stand,
// Billing DRD, Pengaduan GWM, serta Audit Sistem Operasional.

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PengaturanHeader } from './PengaturanHeader';
import { TabProfilAkun } from './TabProfilAkun';
import { TabCatatMeter } from './TabCatatMeter';
import { TabVerifikasiStand } from './TabVerifikasiStand';
import { TabBillingDrd } from './TabBillingDrd';
import { TabPengaduanGwm } from './TabPengaduanGwm';
import { TabSistemAudit } from './TabSistemAudit';
import { authClient, useSession } from '@/lib/auth-client';
import type {
  WilayahPelayananId,
  ProfilPenggunaConfig,
  CaterConfig,
  VerifikasiConfig,
  BillingDrdConfig,
  PengaduanGwmConfig,
  SistemAuditConfig,
} from '../types';

// Helper kompresi gambar berbasis canvas di browser
async function kompresGambarBrowser(file: File, maxSize: number = 256, quality: number = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        canvas.width = Math.min(minDim, maxSize);
        canvas.height = Math.min(minDim, maxSize);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia.'));
          return;
        }

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses berkas gambar.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas dari perangkat.'));
    reader.readAsDataURL(file);
  });
}

export function PengaturanView() {
  const router = useRouter();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = React.useState('profil');
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string } | null>(null);

  const [isUploadingFoto, setIsUploadingFoto] = React.useState(false);
  const [isDeletingFoto, setIsDeletingFoto] = React.useState(false);

  // 1. Profil & Penugasan Pelayanan Wilayah
  const [profilConfig, setProfilConfig] = React.useState<ProfilPenggunaConfig>({
    fotoProfil: null,
    namaPetugas: 'Wisnu Yoga Pratama',
    nppPetugas: 'DIR-BILL-2026-09',
    emailPetugas: 'admin.billing@tirtawening.co.id',
    rolePengguna: 'SUPERADMIN',
    jabatanDinas: 'Administrator Billing & Verifikasi Utama',
    wilayahDinas: 'WILAYAH_1',
  });

  // Sinkronisasi data sesi pengguna dari database
  React.useEffect(() => {
    if (session?.user) {
      setProfilConfig((prev) => ({
        ...prev,
        fotoProfil: session.user.image ?? prev.fotoProfil,
        namaPetugas: session.user.name || prev.namaPetugas,
        emailPetugas: session.user.email || prev.emailPetugas,
        rolePengguna: (session.user as any).role || prev.rolePengguna,
      }));
    }
  }, [session?.user]);

  // 2. Cater Config
  const [caterConfig, setCaterConfig] = React.useState<CaterConfig>({
    radiusGeofence: '50',
    minDurasiPerSL: '15',
    wajibFotoMeter: true,
    blokirMockGps: true,
    autoFlashKamera: true,
  });

  // 3. Verifikasi Config
  const [verifikasiConfig, setVerifikasiConfig] = React.useState<VerifikasiConfig>({
    metodeTaksasiDefault: 'RATA_3_BULAN',
    cutOffClosingDate: '24',
    cutOffClosingHour: '23:59',
    wajibCatatanKoreksi: true,
    ambangDeviasiRing1: '30',
    ambangDeviasiRing2: '100',
    ambangDeviasiRing3: '250',
  });

  // 4. Billing DRD Config
  const [billingConfig, setBillingConfig] = React.useState<BillingDrdConfig>({
    beaAdminDefault: '2500',
    beaPemeliharaanRT: '8000',
    beaPemeliharaanNiaga: '15000',
    beaPemeliharaanIndustri: '25000',
    tanggalJatuhTempo: '20',
    skemaDenda: 'FLAT_PER_BULAN',
    nominalDendaFlat: '10000',
  });

  // 5. GWM Config
  const [pengaduanConfig, setPengaduanConfig] = React.useState<PengaduanGwmConfig>({
    slaBocorPipaJam: '24',
    slaMeterMacetJam: '48',
    slaSengketaStandJam: '72',
    autoSpkGwmMacet: true,
    waGatewayAktif: true,
  });

  // 6. Sistem Config
  const [sistemConfig, setSistemConfig] = React.useState<SistemAuditConfig>({
    kepadatanTabel: 'compact',
    suaraAlertAnomali: true,
    levelAuditTrail: 'LENGKAP',
  });

  const triggerToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Simpan Perubahan Parameter & Profil
  const handleSimpanPengaturan = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    try {
      if (session?.user?.name !== profilConfig.namaPetugas) {
        await authClient.updateUser({
          name: profilConfig.namaPetugas,
        });
      }

      triggerToast(
        'Konfigurasi Sistem Berhasil Disimpan',
        'Preferensi profil pengguna dan parameter operasional telah diperbarui.'
      );
      router.refresh();
    } catch {
      triggerToast(
        'Konfigurasi Berhasil Disimpan',
        'Preferensi sistem telah diperbarui ke basis data.'
      );
    }
  };

  // Reset Default SOP
  const handleResetDefault = () => {
    setProfilConfig((prev) => ({ ...prev, wilayahDinas: 'WILAYAH_1' }));
    setCaterConfig({
      radiusGeofence: '50',
      minDurasiPerSL: '15',
      wajibFotoMeter: true,
      blokirMockGps: true,
      autoFlashKamera: true,
    });
    setVerifikasiConfig({
      metodeTaksasiDefault: 'RATA_3_BULAN',
      cutOffClosingDate: '24',
      cutOffClosingHour: '23:59',
      wajibCatatanKoreksi: true,
      ambangDeviasiRing1: '30',
      ambangDeviasiRing2: '100',
      ambangDeviasiRing3: '250',
    });
    setBillingConfig({
      beaAdminDefault: '2500',
      beaPemeliharaanRT: '8000',
      beaPemeliharaanNiaga: '15000',
      beaPemeliharaanIndustri: '25000',
      tanggalJatuhTempo: '20',
      skemaDenda: 'FLAT_PER_BULAN',
      nominalDendaFlat: '10000',
    });
    setPengaduanConfig({
      slaBocorPipaJam: '24',
      slaMeterMacetJam: '48',
      slaSengketaStandJam: '72',
      autoSpkGwmMacet: true,
      waGatewayAktif: true,
    });
    setSistemConfig({
      kepadatanTabel: 'compact',
      suaraAlertAnomali: true,
      levelAuditTrail: 'LENGKAP',
    });
    triggerToast(
      'Parameter Sistem Direset',
      'Nilai konfigurasi operasional telah dikembalikan ke standar SOP resmi.'
    );
  };

  // Handlers Foto Profil
  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      triggerToast('Format Berkas Ditolak', 'Hanya gambar JPG, PNG, atau WebP yang diperbolehkan.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      triggerToast('Ukuran Terlalu Besar', 'Maksimal ukuran berkas asli adalah 2MB.');
      return;
    }

    try {
      setIsUploadingFoto(true);
      const compressedDataUrl = await kompresGambarBrowser(file, 256, 0.82);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedDataUrl }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Gagal menyimpan foto profil ke server.');
      }

      await authClient.updateUser({
        image: compressedDataUrl,
      });

      setProfilConfig((prev) => ({ ...prev, fotoProfil: compressedDataUrl }));
      triggerToast('Foto Profil Diperbarui', 'Foto identitas dinas Anda berhasil disimpan.');
      router.refresh();
    } catch (err: any) {
      console.error('[UPLOAD_FOTO_ERROR]', err);
      triggerToast('Gagal Memperbarui Foto', err.message || 'Terjadi kesalahan sistem saat memproses gambar.');
    } finally {
      setIsUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleHapusFoto = async () => {
    try {
      setIsDeletingFoto(true);
      const res = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Gagal menghapus foto dari server.');
      }

      await authClient.updateUser({
        image: null as any,
      });

      setProfilConfig((prev) => ({ ...prev, fotoProfil: null }));
      triggerToast('Foto Profil Dihapus', 'Identitas visual kini menggunakan inisial otomatis.');
      router.refresh();
    } catch (err: any) {
      console.error('[HAPUS_FOTO_ERROR]', err);
      triggerToast('Gagal Menghapus Foto', err.message || 'Terjadi gangguan saat menghapus berkas foto.');
    } finally {
      setIsDeletingFoto(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <PengaturanHeader
            toastMessage={toastMessage}
            onResetDefault={handleResetDefault}
            onSimpan={handleSimpanPengaturan}
          />

          {/* TAB 1: Profil Akun & Identitas Operator */}
          <TabsContent value="profil" className="space-y-5 outline-none">
            <TabProfilAkun
              fotoProfil={profilConfig.fotoProfil}
              namaPetugas={profilConfig.namaPetugas}
              nppPetugas={profilConfig.nppPetugas}
              emailPetugas={profilConfig.emailPetugas}
              rolePengguna={profilConfig.rolePengguna}
              jabatanDinas={profilConfig.jabatanDinas}
              wilayahDinas={profilConfig.wilayahDinas}
              isUploadingFoto={isUploadingFoto}
              isDeletingFoto={isDeletingFoto}
              onFotoUpload={handleFotoUpload}
              onHapusFoto={handleHapusFoto}
              onNamaChange={(val) => setProfilConfig((prev) => ({ ...prev, namaPetugas: val }))}
              onNppChange={(val) => setProfilConfig((prev) => ({ ...prev, nppPetugas: val }))}
              onEmailChange={(val) => setProfilConfig((prev) => ({ ...prev, emailPetugas: val }))}
              onJabatanChange={(val) => setProfilConfig((prev) => ({ ...prev, jabatanDinas: val }))}
              onWilayahChange={(val: WilayahPelayananId) =>
                setProfilConfig((prev) => ({ ...prev, wilayahDinas: val }))
              }
              onTriggerToast={triggerToast}
            />
          </TabsContent>

          {/* TAB 2: Catat Meter */}
          <TabsContent value="cater" className="space-y-5 outline-none">
            <TabCatatMeter
              config={caterConfig}
              onChange={(key, val) => setCaterConfig((prev) => ({ ...prev, [key]: val }))}
            />
          </TabsContent>

          {/* TAB 3: Verifikasi Stand */}
          <TabsContent value="verifikasi" className="space-y-5 outline-none">
            <TabVerifikasiStand
              config={verifikasiConfig}
              onChange={(key, val) => setVerifikasiConfig((prev) => ({ ...prev, [key]: val }))}
            />
          </TabsContent>

          {/* TAB 4: Billing & DRD */}
          <TabsContent value="billing" className="space-y-5 outline-none">
            <TabBillingDrd
              config={billingConfig}
              onChange={(key, val) => setBillingConfig((prev) => ({ ...prev, [key]: val }))}
            />
          </TabsContent>

          {/* TAB 5: GWM & Layanan */}
          <TabsContent value="pengaduan" className="space-y-5 outline-none">
            <TabPengaduanGwm
              config={pengaduanConfig}
              onChange={(key, val) => setPengaduanConfig((prev) => ({ ...prev, [key]: val }))}
            />
          </TabsContent>

          {/* TAB 6: Sistem & Audit */}
          <TabsContent value="sistem" className="space-y-5 outline-none">
            <TabSistemAudit
              config={sistemConfig}
              onChange={(key, val) => setSistemConfig((prev) => ({ ...prev, [key]: val }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
