import { db } from '../../client';
import { pengaturanKonten } from '../../schema/pengaturan';
import type { SeedModule, SeedOptions } from '../types';

export const SEED_PENGATURAN = [
  {
    kunci: 'app_contact',
    kategori: 'kontak',
    keterangan: 'Pusat Bantuan Resmi & Layanan Pelanggan PDAM',
    nilai: {
      callCenter: '022-2509030',
      whatsapp: '628112345678',
      email: 'pelayanan@tirtawening.co.id',
      website: 'https://tirtawening.co.id',
      alamatPusat: 'Jl. Badak Singa No. 10, Kota Bandung, Jawa Barat 40132',
      jamOperasional: 'Senin - Jumat 07:30 - 16:00 WIB',
    },
  },
  {
    kunci: 'cater_tolerance',
    kategori: 'cater',
    keterangan: 'Ambang Batas Toleransi Anomali Kubikasi & GPS Pencatatan Lapangan',
    nilai: {
      gpsMaxRadiusMeter: 15,
      lonjakanPersenToleransi: 50,
      penurunanPersenToleransi: 40,
      taksasiMinM3RumahKosong: 5,
      taksasiMetodeMatiAir: 'RATA_RATA_3_BULAN',
      autoFlagStandMinus: true,
    },
  },
  {
    kunci: 'sla_pengaduan_hours',
    kategori: 'pengaduan',
    keterangan: 'Standar Waktu Layanan (SLA) Pengaduan Berdasarkan Prioritas',
    nilai: {
      KRITIS: { responsHours: 1, selesaiHours: 4 },
      TINGGI: { responsHours: 2, selesaiHours: 8 },
      NORMAL: { responsHours: 4, selesaiHours: 24 },
      RENDAH: { responsHours: 8, selesaiHours: 48 },
    },
  },
  {
    kunci: 'running_text_portal',
    kategori: 'konten',
    keterangan: 'Teks Berjalan Banner Utama Portal Web Publik',
    nilai: {
      aktif: true,
      pesan: 'Selamat Datang di Portal Resmi Sistem Informasi Pembacaan Meter & Layanan Pelanggan PDAM Tirtawening. Pembayaran rekening air dapat dilakukan melalui ATM, Mobile Banking, Indomaret, dan Alfamart.',
      kecepatan: 45,
    },
  },
];

export async function seedPengaturan() {
  for (const item of SEED_PENGATURAN) {
    await db
      .insert(pengaturanKonten)
      .values({
        kunci: item.kunci,
        kategori: item.kategori,
        keterangan: item.keterangan,
        nilai: item.nilai,
        updatedAt: new Date(),
        updatedBy: 'system-seed',
      })
      .onConflictDoUpdate({
        target: pengaturanKonten.kunci,
        set: {
          kategori: item.kategori,
          keterangan: item.keterangan,
          nilai: item.nilai,
          updatedAt: new Date(),
          updatedBy: 'system-seed',
        },
      });
  }

  return {
    count: SEED_PENGATURAN.length,
    message: `Seeded ${SEED_PENGATURAN.length} konfigurasi konten & toleransi sistem.`,
  };
}

export const pengaturanModule: SeedModule = {
  id: 'pengaturan',
  name: 'Pengaturan Konten & Toleransi Sistem',
  description: 'Kontak resmi call center, parameter deviasi kubikasi meteran & SLA pengaduan',
  run: async (_options: SeedOptions) => {
    return await seedPengaturan();
  },
};
