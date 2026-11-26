// features/dashboard/setting-landing/components/ProfilKontakView.tsx
// Halaman Mandiri Pengaturan Profil Perusahaan & Kantor Pelayanan Wilayah 1-6

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { TabPerusahaanProfil } from '@/features/dashboard/pengaturan/components/TabPerusahaanProfil';
import type {
  ProfilPerusahaanData,
  KontakLayananData,
} from '@/types/pengaturan-konten';

const DEFAULT_PROFIL: ProfilPerusahaanData = {
  nama: 'PERUMDA Tirtawening Kota Bandung',
  singkatan: 'PERUMDA Tirtawening',
  tagline: 'Layanan Air Bersih & Sanitasi Berkelanjutan untuk Warga Kota Bandung',
  tentang:
    'PERUSAHAAN UMUM DAERAH TIRTAWENING KOTA BANDUNG adalah Badan Usaha Milik Daerah (BUMD) yang bertugas menyelenggarakan kemanfaatan umum di bidang penyediaan air minum dan pengelolaan air limbah bagi masyarakat Kota Bandung secara profesional, mandiri, dan berkeadilan sosial.',
  visi: 'Menjadi Perusahaan Air Minum yang Maju, Mandiri, dan Terpercaya dengan Pelayanan Prima bagi Warga Kota Bandung.',
  misi: [
    'Memberikan pelayanan air minum yang memenuhi standar kualitas kesehatan, kontinuitas aliran, dan kecukupan kuantitas.',
    'Meningkatkan cakupan layanan perpipaan secara merata bagi seluruh masyarakat Kota Bandung.',
    'Menerapkan tata kelola perusahaan yang baik (Good Corporate Governance) berbasis teknologi digital terintegrasi.',
    'Mendukung pelestarian sumber daya air baku dan lingkungan hidup berkelanjutan.',
  ],
  sejarah:
    'Bermula dari Stadswaterwerk Bandoeng yang didirikan pada masa pemerintahan Hindia Belanda tahun 1916, institusi ini bertransformasi menjadi Perusahaan Daerah Air Minum (PDAM) Kota Bandung pada tahun 1974, dan kini ditetapkan sebagai PERUMDA Tirtawening Kota Bandung berdasarkan Peraturan Daerah Kota Bandung.',
  alamatPusat: 'Jl. Badaksinga No. 10, Kel. Lebak Siliwangi, Kec. Coblong, Kota Bandung 40132',
  callCenter: '(022) 2509030 / (022) 2509032',
  whatsapp: '0811-200-0020',
  email: 'sekretariat@tirtawening.co.id',
  jamLayanan: 'Senin – Jumat: 08.00 – 15.00 WIB',
  website: 'https://tirtawening.co.id',
};

const DEFAULT_KONTAK: KontakLayananData = {
  kantorPusat: {
    alamat: 'Jl. Badaksinga No. 10, Kel. Lebak Siliwangi, Kec. Coblong, Kota Bandung 40132',
    callCenter: '(022) 2509030 / (022) 2509032',
    whatsapp: '0811-200-0020',
    email: 'sekretariat@tirtawening.co.id',
    jamLayanan: 'Senin – Jumat: 08.00 – 15.00 WIB',
  },
  kantorCabang: [
    {
      id: 'cabang-1',
      nama: 'Kantor Pelayanan Wilayah 1 (Bandung Barat)',
      wilayah: 'Bandung Barat',
      alamat: 'Jl. Dr. Rum No. 12 / Jl. Pajajaran No. 80, Bandung',
      kontak: '(022) 6000003',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Kec. Andir, Cicendo, Sukajadi, Sukasari',
    },
    {
      id: 'cabang-2',
      nama: 'Kantor Pelayanan Wilayah 2 (Bandung Tengah)',
      wilayah: 'Bandung Tengah',
      alamat: 'Jl. Badaksinga No. 10, Bandung',
      kontak: '(022) 2509030',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Kec. Sumur Bandung, Bandung Wetan, Cibeunying',
    },
    {
      id: 'cabang-3',
      nama: 'Kantor Pelayanan Wilayah 3 (Bandung Utara)',
      wilayah: 'Bandung Utara',
      alamat: 'Jl. Ir. H. Juanda No. 290 / Jl. Siliwangi No. 12, Bandung',
      kontak: '(022) 2500001',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Kec. Coblong, Cidadap, Dago & Sekitarnya',
    },
    {
      id: 'cabang-4',
      nama: 'Kantor Pelayanan Wilayah 4 (Bandung Selatan)',
      wilayah: 'Bandung Selatan',
      alamat: 'Jl. Moh. Toha No. 180 / Jl. BKR No. 45, Bandung',
      kontak: '(022) 5200004',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Kec. Regol, Astana Anyar, Bojongloa Kaler & Kidul',
    },
    {
      id: 'cabang-5',
      nama: 'Kantor Pelayanan Wilayah 5 (Bandung Timur)',
      wilayah: 'Bandung Timur',
      alamat: 'Jl. Soekarno Hatta No. 450 / Posko Induk Gedebage, Bandung',
      kontak: '(022) 7500002',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Kec. Rancasari, Buahbatu, Gedebage, Arcamanik, Cibiru',
    },
    {
      id: 'cabang-6',
      nama: 'Kantor Pelayanan Wilayah 6 (Bandung Tenggara)',
      wilayah: 'Bandung Tenggara',
      alamat: 'Jl. Ibrahim Adjie No. 118, Bandung',
      kontak: '(022) 7300005',
      jamLayanan: 'Senin - Jumat 08.00 - 15.00 WIB',
      keterangan: 'Kec. Kiaracondong, Batununggal, Lengkong',
    },
  ],
  daruratPipa: 'Hubungi Call Center 24 Jam di (022) 2509030 atau lapor melalui menu Pengaduan Online.',
};

export function ProfilKontakView() {
  const router = useRouter();
  const [profil, setProfil] = React.useState<ProfilPerusahaanData>(DEFAULT_PROFIL);
  const [kontak, setKontak] = React.useState<KontakLayananData>(DEFAULT_KONTAK);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    let aktif = true;
    async function muatData() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data) {
          if (json.data.profilPerusahaan) setProfil(json.data.profilPerusahaan);
          if (json.data.kontakLayanan) setKontak(json.data.kontakLayanan);
        }
      } catch (err) {
        console.warn('[PROFIL_KONTAK_VIEW] Gagal mengambil konfigurasi backend:', err);
      }
    }
    muatData();
    return () => {
      aktif = false;
    };
  }, []);

  const triggerToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSimpan = async () => {
    setSedangMenyimpan(true);
    try {
      const items = [
        { kunci: 'profil_perusahaan', nilai: profil, kategori: 'cms' },
        { kunci: 'kontak_layanan', nilai: kontak, kategori: 'cms' },
      ];

      await Promise.all(
        items.map((item) =>
          fetch('/api/pengaturan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })
        )
      );

      triggerToast(
        'Profil & Kontak Berhasil Disimpan',
        'Data identitas perusahaan, alamat kantor pusat, dan 6 kantor pelayanan wilayah telah diperbarui secara publik.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_PROFIL_KONTAK_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi gangguan saat menyimpan ke basis data.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Pengaturan Profil Perusahaan & Kontak Cabang"
          description="Konfigurasi identitas resmi PERUMDA Tirtawening, sejarah, visi misi, kontak call center, serta alamat dan nomor kantor pelayanan cabang Wilayah 1–6."
          badge="Modul Mandiri Profil"
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

        <TabPerusahaanProfil
          profil={profil}
          kontak={kontak}
          onChangeProfil={setProfil}
          onChangeKontak={setKontak}
          onSimpanSemua={handleSimpan}
          sedangMenyimpan={sedangMenyimpan}
        />
      </div>
    </PageContainer>
  );
}
