// features/dashboard/pengaturan/components/PengaturanAkunView.tsx
// Halaman Mandiri Pengaturan Profil Akun & Operator (Tanpa Tab)

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PengaturanPageHeader } from './PengaturanPageHeader';
import { TabProfilAkun } from './TabProfilAkun';
import { authClient, useSession } from '@/lib/auth-client';
import type { WilayahPelayananId, ProfilPenggunaConfig } from '../types';

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

export function PengaturanAkunView() {
  const router = useRouter();
  const { data: session } = useSession();

  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = React.useState(false);
  const [isDeletingFoto, setIsDeletingFoto] = React.useState(false);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);

  const [profilConfig, setProfilConfig] = React.useState<ProfilPenggunaConfig>({
    fotoProfil: null,
    namaPetugas: 'Wisnu Yoga Pratama',
    nppPetugas: 'DIR-BILL-2026-09',
    emailPetugas: 'admin.billing@tirtawening.co.id',
    rolePengguna: 'SUPERADMIN',
    jabatanDinas: 'Administrator Billing & Verifikasi Utama',
    wilayahDinas: 'WILAYAH_1',
  });

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

  const triggerToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSimpan = async () => {
    setSedangMenyimpan(true);
    try {
      if (session?.user?.name !== profilConfig.namaPetugas) {
        await authClient.updateUser({
          name: profilConfig.namaPetugas,
        });
      }

      triggerToast(
        'Profil Akun Berhasil Diperbarui',
        'Data identitas nama petugas dan preferensi profil pengguna telah tersimpan.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_PROFIL_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem saat memperbarui profil.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  const handleResetDefault = () => {
    setProfilConfig((prev) => ({ ...prev, wilayahDinas: 'WILAYAH_1' }));
    triggerToast('Reset Default', 'Penugasan wilayah dikembalikan ke Wilayah 1.');
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      triggerToast('Format Berkas Ditolak', 'Hanya gambar JPG, PNG, atau WebP yang diperbolehkan.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      triggerToast('Ukuran Terlalu Besar', 'Maksimal ukuran berkas asli adalah 2MB.', 'error');
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

      await authClient.updateUser({ image: compressedDataUrl });
      setProfilConfig((prev) => ({ ...prev, fotoProfil: compressedDataUrl }));
      triggerToast('Foto Profil Diperbarui', 'Foto identitas dinas Anda berhasil disimpan.');
      router.refresh();
    } catch (err: any) {
      console.error('[UPLOAD_FOTO_ERROR]', err);
      triggerToast('Gagal Memperbarui Foto', err.message || 'Terjadi gangguan sistem saat memproses foto.', 'error');
    } finally {
      setIsUploadingFoto(false);
      e.target.value = '';
    }
  };

  const handleHapusFoto = async () => {
    try {
      setIsDeletingFoto(true);
      const res = await fetch('/api/user/avatar', { method: 'DELETE' });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Gagal menghapus foto dari server.');
      }

      await authClient.updateUser({ image: null as any });
      setProfilConfig((prev) => ({ ...prev, fotoProfil: null }));
      triggerToast('Foto Profil Dihapus', 'Identitas visual kini menggunakan inisial avatar otomatis.');
      router.refresh();
    } catch (err: any) {
      console.error('[HAPUS_FOTO_ERROR]', err);
      triggerToast('Gagal Menghapus Foto', err.message || 'Terjadi gangguan saat menghapus berkas foto.', 'error');
    } finally {
      setIsDeletingFoto(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PengaturanPageHeader
          title="Pengaturan Profil Akun & Operator"
          description="Kelola informasi nama petugas, NPP dinas, email dinas, foto identitas avatar, penugasan wilayah pelayanan, dan kata sandi akun."
          badge="Modul Mandiri Profil Akun"
          onResetDefault={handleResetDefault}
          onSimpan={handleSimpan}
          sedangMenyimpan={sedangMenyimpan}
        />

        {toastMessage && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-sm ${
                toastMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-800 border-rose-500/25 dark:text-rose-300'
                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:text-emerald-300'
              }`}
            >
              {toastMessage.type === 'error' ? (
                <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{toastMessage.title}</span>
                <span className="text-xs opacity-90">{toastMessage.desc}</span>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </PageContainer>
  );
}
