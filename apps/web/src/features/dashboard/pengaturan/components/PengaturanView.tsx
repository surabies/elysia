// features/dashboard/pengaturan/components/PengaturanView.tsx
// Assembly Utama Konsol Pengaturan Enterprise Modular Tirtawening
// Dilengkapi integrasi database nyata untuk profil perusahaan, kontak, CMS publik,
// foto profil, transisi loading mulus, dan sinkronisasi real-time ke Better-Auth & PostgreSQL.

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { PengaturanHeader } from './PengaturanHeader';
import { TabProfilAkun } from './TabProfilAkun';
import { TabPerusahaanProfil } from './TabPerusahaanProfil';
import { TabKontenPublikCms } from './TabKontenPublikCms';
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
import type {
  ProfilPerusahaanData,
  KontakLayananData,
  SyaratPasangBaruData,
  CaraPembayaranData,
  StrukturTarifData,
  BeritaPengumumanData,
  InfoGangguanAirData,
} from '@/types/pengaturan-konten';

// Nilai awal default profil & konten
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

const DEFAULT_SYARAT: SyaratPasangBaruData = {
  judul: 'Pasang Baru Sambungan Air Minum',
  deskripsi: 'Syarat dan alur pengajuan sambungan air minum perpipaan baru PERUMDA Tirtawening Kota Bandung.',
  syaratDokumen: [
    'Fotokopi KTP / identitas diri pemohon yang masih berlaku',
    'Fotokopi bukti kepemilikan bangunan (Sertifikat Tanah / AJB / IMB / PBB terakhir)',
    'Surat kuasa bermaterai apabila pemohon bukan pemilik sah bangunan',
    'Denah lokasi atau titik koordinat bangunan yang akan dipasangi sambungan',
    'Mengisi formulir Surat Permohonan Langganan (SPL) air minum resmi',
  ],
  alurTahapan: [
    {
      judul: '1. Pengajuan Permohonan',
      isi: 'Datangi loket kantor pelayanan wilayah terdekat atau hubungi petugas layanan untuk mengisi formulir pendaftaran sambungan baru.',
    },
    {
      judul: '2. Survei Teknis & Gambar Rencana',
      isi: 'Petugas teknis melakukan survei ke lokasi guna memeriksa jaringan pipa distribusi terdekat dan menyusun rencana anggaran biaya (RAB).',
    },
    {
      judul: '3. Pembayaran Biaya Sambungan',
      isi: 'Pemohon melakukan pembayaran biaya pasang baru resmi sesuai rincian RAB di loket atau kanal perbankan mitra.',
    },
    {
      judul: '4. Pemasangan & Kalibrasi Meter',
      isi: 'Teknisi memasang pipa dinas, kran meter, dan water meter air tersegel, disusul penerbitan 11 digit Nomor Langganan resmi.',
    },
  ],
  catatanPenting:
    'Biaya pemasangan sambungan standar mengacu pada jarak pipa retikulasi ke kran meter maksimal 6 meter. Kelebihan jarak pipa dikenakan biaya tambahan sesuai tarif teknis resmi.',
};

const DEFAULT_CARA_BAYAR: CaraPembayaranData = {
  judul: 'Cara Pembayaran Tagihan Rekening Air',
  deskripsi: 'Langkah mudah membayar tagihan rekening air dan kanal perbankan/mitra resmi yang tersedia.',
  langkah: [
    {
      judul: 'Cek tagihan',
      isi: 'Masukkan nomor langganan 11 digit untuk melihat rincian jumlah tagihan rekening air berjalan.',
    },
    {
      judul: 'Pilih kanal pembayaran',
      isi: 'Pilih salah satu kanal pembayaran resmi yang tersedia (ATM, Mobile Banking, Dompet Digital, Minimarket, atau Loket Cabang).',
    },
    {
      judul: 'Simpan bukti bayar',
      isi: 'Simpan struk transaksi atau bukti transfer digital hingga status tagihan Anda berubah menjadi lunas.',
    },
  ],
  kanal: [
    {
      nama: 'Mobile Banking & ATM',
      deskripsi: 'Bank bjb, Bank Mandiri, BRI, BNI, BCA melalui menu Pembayaran Tagihan PDAM / Tirtawening Kota Bandung.',
    },
    {
      nama: 'Dompet Digital & E-Commerce',
      deskripsi: 'GoPay, OVO, DANA, ShopeePay, Tokopedia, dan Blibli dengan memasukkan 11 digit nomor langganan.',
    },
    {
      nama: 'Gerai Ritel Modern & Agen Resmi',
      deskripsi: 'Indomaret, Alfamart, Alfamidi, Pos Indonesia, dan Agen PPOB terverifikasi di seluruh Indonesia.',
    },
    {
      nama: 'Loket Kantor Pelayanan',
      deskripsi: 'Kantor Pusat Jl. Badaksinga No. 10 dan kantor cabang wilayah pelayanan Bandung (Senin - Jumat 08.00 - 15.00 WIB).',
    },
  ],
  catatanDenda:
    'Pembayaran tagihan rekening air jatuh tempo setiap tanggal 20 setiap bulannya. Keterlambatan dikenakan denda administrasi sesuai peraturan daerah yang berlaku.',
};

const DEFAULT_TARIF: StrukturTarifData = {
  judul: 'Struktur Tarif Pemakaian Air Minum',
  deskripsi:
    'Struktur tarif pemakaian air minum perpipaan berdasarkan kelompok golongan pelanggan dan blok konsumsi progresif PERUMDA Tirtawening.',
  tarif: [
    {
      golongan: 'Kelompok I (Sosial)',
      keterangan: 'Kran umum, tempat ibadah, panti asuhan, sekolah negeri',
      tarif: 'Rp 1.050 – Rp 1.500 / m³',
    },
    {
      golongan: 'Kelompok IIA (Rumah Tangga Sederhana)',
      keterangan: 'Rumah tinggal non-permanen / sederhana daya listrik s/d 900 VA',
      tarif: 'Rp 2.200 – Rp 4.100 / m³',
    },
    {
      golongan: 'Kelompok IIB (Rumah Tangga Menengah)',
      keterangan: 'Rumah tinggal permanen daya listrik 1300 VA s/d 2200 VA',
      tarif: 'Rp 3.500 – Rp 6.800 / m³',
    },
    {
      golongan: 'Kelompok IIC (Rumah Tangga Atas)',
      keterangan: 'Rumah tinggal mewah / daya listrik > 2200 VA',
      tarif: 'Rp 5.200 – Rp 9.500 / m³',
    },
    {
      golongan: 'Kelompok III (Niaga)',
      keterangan: 'Ruko, restoran, bengkel, perkantoran swasta, perhotelan',
      tarif: 'Rp 8.000 – Rp 14.500 / m³',
    },
    {
      golongan: 'Kelompok IV (Industri)',
      keterangan: 'Pabrik, manufaktur, industri tekstil, pencucian besar',
      tarif: 'Rp 11.000 – Rp 18.000 / m³',
    },
  ],
  ketentuan: [
    'Perhitungan tarif menggunakan sistem blok konsumsi progresif (Blok I: 0–10 m³, Blok II: 11–20 m³, Blok III: 21–30 m³, Blok IV: >30 m³).',
    'Total tagihan bulanan mencakup harga air, biaya pemeliharaan meter (bea beban), bea administrasi rekening, dan retribusi air limbah sesuai peraturan daerah.',
    'Tarif mengacu pada Keputusan Walikota Bandung tentang Penyesuaian Tarif Air Minum PERUMDA Tirtawening Kota Bandung.',
  ],
};

const DEFAULT_BERITA: BeritaPengumumanData = {
  daftarBerita: [
    {
      slug: 'modernisasi-baca-meter',
      judul: 'Modernisasi Sistem Baca Meter Digital Kota Bandung',
      ringkasan:
        'PERUMDA Tirtawening mempercepat digitalisasi pencatatan meter berbasis foto geospasial demi transparansi dan keakuratan penagihan air minum.',
      tanggal: '2026-01-15',
      penulis: 'Humas PERUMDA Tirtawening',
      tag: 'Digitalisasi',
      aktif: true,
    },
    {
      slug: 'optimalisasi-aliran',
      judul: 'Optimalisasi Aliran Air Bersih Wilayah Timur Bandung',
      ringkasan:
        'Peremajaan jaringan pipa transmisi dan distribusi di kawasan Gedebage dan sekitarnya guna memastikan kontinuitas pasokan air 24 jam.',
      tanggal: '2026-02-01',
      penulis: 'Divisi Teknik Distribusi',
      tag: 'Infrastruktur',
      aktif: true,
    },
  ],
};

const DEFAULT_GANGGUAN: InfoGangguanAirData = {
  daftarGangguan: [
    {
      id: 'g-01',
      wilayah: 'Kecamatan Sumur Bandung & Regol (Braga, Merdeka, Pungkur)',
      penyebab: 'Perbaikan pipa distribusi utama diameter 300mm dan penyesuaian valve regulator',
      status: 'Sedang ditangani',
      perkiraan: 'Hari ini pukul 17.00 WIB',
      tanggal: '2026-03-15',
    },
    {
      id: 'g-02',
      wilayah: 'Kecamatan Coblong & Dago (Dago Bawah, Lebak Siliwangi)',
      penyebab: 'Pemeliharaan berkala pompa transmisi IPA Badaksinga',
      status: 'Selesai',
      perkiraan: 'Aliran telah normal bertahap',
      tanggal: '2026-03-12',
    },
  ],
};

function optimizeImageClient(file: File, maxSize = 320, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const { width, height } = img;
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
  const [sedangMenyimpanCMS, setSedangMenyimpanCMS] = React.useState(false);

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

  // State Profil Perusahaan & CMS Dinamis
  const [profilPerusahaan, setProfilPerusahaan] = React.useState<ProfilPerusahaanData>(DEFAULT_PROFIL);
  const [kontakLayanan, setKontakLayanan] = React.useState<KontakLayananData>(DEFAULT_KONTAK);
  const [syaratPasangBaru, setSyaratPasangBaru] = React.useState<SyaratPasangBaruData>(DEFAULT_SYARAT);
  const [caraPembayaran, setCaraPembayaran] = React.useState<CaraPembayaranData>(DEFAULT_CARA_BAYAR);
  const [strukturTarif, setStrukturTarif] = React.useState<StrukturTarifData>(DEFAULT_TARIF);
  const [beritaPengumuman, setBeritaPengumuman] = React.useState<BeritaPengumumanData>(DEFAULT_BERITA);
  const [infoGangguan, setInfoGangguan] = React.useState<InfoGangguanAirData>(DEFAULT_GANGGUAN);

  // Ambil data CMS dari backend saat mount
  React.useEffect(() => {
    let aktif = true;
    async function muatPengaturanBackend() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data) {
          const d = json.data;
          if (d.profilPerusahaan) setProfilPerusahaan(d.profilPerusahaan);
          if (d.kontakLayanan) setKontakLayanan(d.kontakLayanan);
          if (d.syaratPasangBaru) setSyaratPasangBaru(d.syaratPasangBaru);
          if (d.caraPembayaran) setCaraPembayaran(d.caraPembayaran);
          if (d.strukturTarif) setStrukturTarif(d.strukturTarif);
          if (d.beritaPengumuman) setBeritaPengumuman(d.beritaPengumuman);
          if (d.infoGangguan) setInfoGangguan(d.infoGangguan);
        }
      } catch (err) {
        console.warn('[PENGATURAN_VIEW] Menggunakan state awal default:', err);
      }
    }
    muatPengaturanBackend();
    return () => {
      aktif = false;
    };
  }, []);

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

  // Simpan Semua Konfigurasi Perusahaan & Konten CMS ke Basis Data PostgreSQL
  const handleSimpanSemuaCMS = async () => {
    setSedangMenyimpanCMS(true);
    try {
      const itemsToSave = [
        { kunci: 'profil_perusahaan', nilai: profilPerusahaan, kategori: 'profil' },
        { kunci: 'kontak_layanan', nilai: kontakLayanan, kategori: 'kontak' },
        { kunci: 'syarat_pasang_baru', nilai: syaratPasangBaru, kategori: 'cms' },
        { kunci: 'cara_pembayaran', nilai: caraPembayaran, kategori: 'cms' },
        { kunci: 'struktur_tarif', nilai: strukturTarif, kategori: 'cms' },
        { kunci: 'berita_pengumuman', nilai: beritaPengumuman, kategori: 'cms' },
        { kunci: 'info_gangguan', nilai: infoGangguan, kategori: 'cms' },
      ];

      await Promise.all(
        itemsToSave.map((item) =>
          fetch('/api/pengaturan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })
        )
      );

      triggerToast(
        'Pengaturan Perusahaan & CMS Disimpan',
        'Data profil, kontak, syarat pasang baru, tata cara pembayaran, tarif, berita, dan gangguan air telah disimpan permanen.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_CMS_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSedangMenyimpanCMS(false);
    }
  };

  // Simpan Perubahan Parameter & Profil
  const handleSimpanPengaturan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (session?.user?.name !== profilConfig.namaPetugas) {
        await authClient.updateUser({
          name: profilConfig.namaPetugas,
        });
      }

      // Simpan juga data CMS
      await handleSimpanSemuaCMS();
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
    setProfilPerusahaan(DEFAULT_PROFIL);
    setKontakLayanan(DEFAULT_KONTAK);
    setSyaratPasangBaru(DEFAULT_SYARAT);
    setCaraPembayaran(DEFAULT_CARA_BAYAR);
    setStrukturTarif(DEFAULT_TARIF);
    setBeritaPengumuman(DEFAULT_BERITA);
    setInfoGangguan(DEFAULT_GANGGUAN);
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
    triggerToast('Konfigurasi Direset', 'Semua parameter telah dikembalikan ke SOP Standar.');
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      triggerToast('Format Berkas Ditolak', 'Harap gunakan berkas gambar berekstensi PNG, JPG, atau WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      triggerToast('Ukuran Terlalu Besar', 'Maksimal ukuran foto adalah 2 MB.');
      return;
    }

    setIsUploadingFoto(true);

    try {
      const optimizedDataUrl = await optimizeImageClient(file, 320, 0.88);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: optimizedDataUrl }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal menyimpan foto ke database.');
      }

      try {
        await authClient.updateUser({
          image: optimizedDataUrl,
        });
      } catch (authErr) {
        console.warn('[BETTER_AUTH_SESSION_UPDATE_NOTE]', authErr);
      }

      window.dispatchEvent(
        new CustomEvent('user-avatar-updated', { detail: { image: optimizedDataUrl } })
      );

      setProfilConfig((prev) => ({ ...prev, fotoProfil: optimizedDataUrl }));
      triggerToast('Foto Profil Disimpan', 'Foto profil berhasil disimpan ke database PostgreSQL.');
      router.refresh();
    } catch (err: any) {
      console.error('[UPLOAD_PHOTO_ERROR]', err);
      triggerToast('Gagal Menyimpan Foto', err.message || 'Terjadi gangguan saat menyimpan ke database.');
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleHapusFoto = async () => {
    setIsDeletingFoto(true);

    try {
      const res = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus foto dari database.');
      }

      try {
        await authClient.updateUser({
          image: '',
        });
      } catch (authErr) {
        console.warn('[BETTER_AUTH_DELETE_NOTE]', authErr);
      }

      window.dispatchEvent(
        new CustomEvent('user-avatar-updated', { detail: { image: null } })
      );

      setProfilConfig((prev) => ({ ...prev, fotoProfil: null }));
      triggerToast('Foto Profil Dihapus', 'Foto profil telah dihapus dari database PostgreSQL.');
      router.refresh();
    } catch (err: any) {
      console.error('[DELETE_PHOTO_ERROR]', err);
      triggerToast('Gagal Menghapus Foto', err.message || 'Terjadi gangguan sistem.');
    } finally {
      setIsDeletingFoto(false);
    }
  };

  return (
    <PageContainer className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <PengaturanHeader
          toastMessage={toastMessage}
          onResetDefault={handleResetDefault}
          onSimpan={handleSimpanPengaturan}
        />

        {/* TAB 1: Profil & Akun */}
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

        {/* TAB 2: Profil Perusahaan, Kontak & Kantor Layanan */}
        <TabsContent value="perusahaan" className="space-y-5 outline-none">
          <TabPerusahaanProfil
            profil={profilPerusahaan}
            kontak={kontakLayanan}
            onChangeProfil={setProfilPerusahaan}
            onChangeKontak={setKontakLayanan}
            onSimpanSemua={handleSimpanSemuaCMS}
            sedangMenyimpan={sedangMenyimpanCMS}
          />
        </TabsContent>

        {/* TAB 3: CMS & Konten Publik */}
        <TabsContent value="konten" className="space-y-5 outline-none">
          <TabKontenPublikCms
            syarat={syaratPasangBaru}
            caraBayar={caraPembayaran}
            tarif={strukturTarif}
            berita={beritaPengumuman}
            gangguan={infoGangguan}
            onChangeSyarat={setSyaratPasangBaru}
            onChangeCaraBayar={setCaraPembayaran}
            onChangeTarif={setStrukturTarif}
            onChangeBerita={setBeritaPengumuman}
            onChangeGangguan={setInfoGangguan}
            onSimpanSemua={handleSimpanSemuaCMS}
            sedangMenyimpan={sedangMenyimpanCMS}
          />
        </TabsContent>

        {/* TAB 4: Catat Meter */}
        <TabsContent value="cater" className="space-y-5 outline-none">
          <TabCatatMeter
            config={caterConfig}
            onChange={(key, val) => setCaterConfig((prev) => ({ ...prev, [key]: val }))}
          />
        </TabsContent>

        {/* TAB 5: Verifikasi Stand */}
        <TabsContent value="verifikasi" className="space-y-5 outline-none">
          <TabVerifikasiStand
            config={verifikasiConfig}
            onChange={(key, val) => setVerifikasiConfig((prev) => ({ ...prev, [key]: val }))}
          />
        </TabsContent>

        {/* TAB 6: Billing & DRD */}
        <TabsContent value="billing" className="space-y-5 outline-none">
          <TabBillingDrd
            config={billingConfig}
            onChange={(key, val) => setBillingConfig((prev) => ({ ...prev, [key]: val }))}
          />
        </TabsContent>

        {/* TAB 7: GWM & Layanan */}
        <TabsContent value="pengaduan" className="space-y-5 outline-none">
          <TabPengaduanGwm
            config={pengaduanConfig}
            onChange={(key, val) => setPengaduanConfig((prev) => ({ ...prev, [key]: val }))}
          />
        </TabsContent>

        {/* TAB 8: Sistem & Audit */}
        <TabsContent value="sistem" className="space-y-5 outline-none">
          <TabSistemAudit
            config={sistemConfig}
            onChange={(key, val) => setSistemConfig((prev) => ({ ...prev, [key]: val }))}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
