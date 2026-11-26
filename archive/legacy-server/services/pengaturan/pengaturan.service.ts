// apps/web/src/server/services/pengaturan/pengaturan.service.ts
// Layanan Pengelolaan Profil Perusahaan & CMS Konten Dinamis Terpadu

import { db, pengaturanKonten } from '@cater/db';
import { eq } from 'drizzle-orm';
import type {
  ProfilPerusahaanData,
  KontakLayananData,
  SyaratPasangBaruData,
  CaraPembayaranData,
  StrukturTarifData,
  BeritaPengumumanData,
  InfoGangguanAirData,
  SemuaPengaturanKonten,
} from '@/types/pengaturan-konten';

export const DEFAULT_PROFIL_PERUSAHAAN: ProfilPerusahaanData = {
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

export const DEFAULT_KONTAK_LAYANAN: KontakLayananData = {
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

export const DEFAULT_SYARAT_PASANG_BARU: SyaratPasangBaruData = {
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

export const DEFAULT_CARA_PEMBAYARAN: CaraPembayaranData = {
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

export const DEFAULT_STRUKTUR_TARIF: StrukturTarifData = {
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

export const DEFAULT_BERITA_PENGUMUMAN: BeritaPengumumanData = {
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
    {
      slug: 'pemberitahuan-gebyar-mbr',
      judul: 'Program Subsidi Pemasangan Baru Masyarakat Berpenghasilan Rendah (MBR)',
      ringkasan:
        'Pemerintah Kota Bandung bersama PERUMDA Tirtawening membuka program subsidi sambungan rumah tangga berbiaya terjangkau untuk wilayah prioritas.',
      tanggal: '2026-03-01',
      penulis: 'Bagian Hubungan Langganan',
      tag: 'Program Publik',
      aktif: true,
    },
  ],
};

export const DEFAULT_INFO_GANGGUAN: InfoGangguanAirData = {
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

class PengaturanService {
  async getPengaturan<T>(kunci: string, defaultValue: T): Promise<T> {
    try {
      const rows = await db
        .select()
        .from(pengaturanKonten)
        .where(eq(pengaturanKonten.kunci, kunci))
        .limit(1);

      if (rows.length > 0 && rows[0].nilai) {
        return rows[0].nilai as T;
      }
    } catch (err) {
      console.warn(`[PENGATURAN_SERVICE] Gagal mengambil pengaturan "${kunci}":`, err);
    }
    return defaultValue;
  }

  async updatePengaturan<T>(
    kunci: string,
    nilai: T,
    kategori = 'umum',
    updatedBy?: string
  ): Promise<boolean> {
    try {
      await db
        .insert(pengaturanKonten)
        .values({
          kunci,
          nilai: nilai as any,
          kategori,
          updatedAt: new Date(),
          updatedBy: updatedBy ?? 'SUPERADMIN',
        })
        .onConflictDoUpdate({
          target: pengaturanKonten.kunci,
          set: {
            nilai: nilai as any,
            kategori,
            updatedAt: new Date(),
            updatedBy: updatedBy ?? 'SUPERADMIN',
          },
        });
      return true;
    } catch (err) {
      console.error(`[PENGATURAN_SERVICE] Gagal memperbarui pengaturan "${kunci}":`, err);
      return false;
    }
  }

  async getSemuaPengaturan(): Promise<SemuaPengaturanKonten> {
    const [
      profilPerusahaan,
      kontakLayanan,
      syaratPasangBaru,
      caraPembayaran,
      strukturTarif,
      beritaPengumuman,
      infoGangguan,
    ] = await Promise.all([
      this.getPengaturan('profil_perusahaan', DEFAULT_PROFIL_PERUSAHAAN),
      this.getPengaturan('kontak_layanan', DEFAULT_KONTAK_LAYANAN),
      this.getPengaturan('syarat_pasang_baru', DEFAULT_SYARAT_PASANG_BARU),
      this.getPengaturan('cara_pembayaran', DEFAULT_CARA_PEMBAYARAN),
      this.getPengaturan('struktur_tarif', DEFAULT_STRUKTUR_TARIF),
      this.getPengaturan('berita_pengumuman', DEFAULT_BERITA_PENGUMUMAN),
      this.getPengaturan('info_gangguan', DEFAULT_INFO_GANGGUAN),
    ]);

    return {
      profilPerusahaan,
      kontakLayanan,
      syaratPasangBaru,
      caraPembayaran,
      strukturTarif,
      beritaPengumuman,
      infoGangguan,
    };
  }
}

export const pengaturanService = new PengaturanService();
