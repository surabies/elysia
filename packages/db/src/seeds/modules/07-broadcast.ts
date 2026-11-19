import { db } from '../../client';
import { broadcast } from '../../schema/broadcast';
import type { SeedModule, SeedOptions } from '../types';

export const SEED_BROADCASTS = [
  {
    id: 'bc-cikalong-01',
    judul: 'Pemeliharaan Pipa Transmisi Jalur Cikalong - PW 5',
    ringkasan: 'Perbaikan darurat kebocoran pipa transmisi diameter 400mm di jalur distribusi selatan.',
    kategori: 'DARURAT',
    status: 'DALAM_PENGERJAAN',
    progresPersen: 75,
    prioritas: 'TINGGI',
    waktuMulai: '18 Januari 2026, 08:00 WIB',
    estimasiSelesai: '18 Januari 2026, 18:00 WIB',
    penyebab: 'Pergeseran tanah menyebabkan retakan sambungan pipa segmen Cikalong.',
    dampak: 'Penurunan debit tekanan aliran air bersih di sebagian wilayah Regol dan Astana Anyar.',
    tindakanPenanganan: 'Pemasangan clamp sleeve darurat dan pengalihan aliran melalui Booster Pump BSP 05.',
    wilayahTerdampak: [
      { kecamatan: 'REGOL', kelurahan: ['CIGERELENG', 'PASIRLUYU', 'ANCOL'] },
      { kecamatan: 'ASTANA ANYAR', kelurahan: ['PANJUNAN', 'KARASAK'] },
    ],
    lokasiWilayah: 'Pelayanan Wilayah 5',
    kontakBantuan: {
      label: 'Call Center Emergency PW5',
      nomor: '022-2509030',
      waLink: 'https://wa.me/628112345678',
    },
    aktif: true,
    tampilkanDiTicker: true,
    tampilkanDiSpotlight: true,
    urutan: 1,
    diperbaruiPada: 'Baru saja',
  },
  {
    id: 'bc-bsp03-02',
    judul: 'Optimalisasi Tekanan Air Distribusi Zona Lengkong & Regol',
    ringkasan: 'Peningkatan kapasitas pompa pendorong Booster Pump BSP 03 guna menstabilkan kontinuitas 24 jam.',
    kategori: 'PEMELIHARAAN',
    status: 'TERJADWAL',
    progresPersen: 20,
    prioritas: 'NORMAL',
    waktuMulai: '20 Januari 2026, 22:00 WIB',
    estimasiSelesai: '21 Januari 2026, 04:00 WIB',
    penyebab: 'Penggantian inverter motor pompa submersible kapasitas 120 L/s.',
    dampak: 'Aliran air mengecil sementara pada dini hari.',
    tindakanPenanganan: 'Pekerjaan dilaksanakan pada jam pemakaian minimum malam hari.',
    wilayahTerdampak: [
      { kecamatan: 'LENGKONG', kelurahan: ['CIJAGRA', 'BURANGRANG', 'CIKAWAO', 'TURANGGA'] },
    ],
    lokasiWilayah: 'Pelayanan Wilayah 5',
    kontakBantuan: {
      label: 'Pelayanan Lengkong',
      nomor: '022-2509031',
      waLink: 'https://wa.me/628112345678',
    },
    aktif: true,
    tampilkanDiTicker: true,
    tampilkanDiSpotlight: false,
    urutan: 2,
    diperbaruiPada: '1 jam yang lalu',
  },
  {
    id: 'bc-promo-mbr-03',
    judul: 'Gebyar Pasang Baru Sambungan Rumah (SR) MBR 2026',
    ringkasan: 'Subsidi biaya pemasangan sambungan air minum baru khusus masyarakat berpenghasilan rendah dengan diskon hingga 50%.',
    kategori: 'PROMO',
    status: 'SELESAI',
    progresPersen: 100,
    prioritas: 'NORMAL',
    waktuMulai: '01 Januari 2026',
    estimasiSelesai: '28 Februari 2026',
    penyebab: 'Program percepatan cakupan akses air minum perpipaan 100% Kota Bandung.',
    dampak: 'Biaya pasang baru menjadi sangat terjangkau bagi calon pelanggan persil.',
    tindakanPenanganan: 'Pendaftaran dapat dilakukan langsung di loket kantor cabang atau melalui aplikasi web.',
    wilayahTerdampak: [],
    lokasiWilayah: 'Seluruh Pelayanan Kota Bandung',
    promoDetails: {
      highlightDiskon: 'Diskon 50% Biaya Pasang Baru',
      periode: 'Januari - Februari 2026',
      keunggulan: ['Bebas biaya survei lokasi', 'Pemasangan water meter SNI baru', 'Cicilan tagihan hingga 6x'],
      syaratKetentuan: ['Fotokopi KTP & KK Kota Bandung', 'Daya listrik rumah maksimal 1300 VA', 'Melampirkan PBB terbaru'],
      ctaLink: '/pasang-baru',
      ctaText: 'Daftar Pasang Baru Sekarang',
    },
    aktif: true,
    tampilkanDiTicker: false,
    tampilkanDiSpotlight: true,
    urutan: 3,
    diperbaruiPada: 'Kemarin',
  },
  {
    id: 'bc-mandiri-04',
    judul: 'Himbauan Lapor Catat Meter Mandiri Periode Bulan Berjalan',
    ringkasan: 'Bagi pelanggan yang rumah atau pagarnya terkunci (kode DK), laporkan angka stand meter Anda via portal/mobile.',
    kategori: 'INFORMASI',
    status: 'DALAM_PENGERJAAN',
    progresPersen: 50,
    prioritas: 'NORMAL',
    waktuMulai: '15 Januari 2026',
    estimasiSelesai: '25 Januari 2026',
    penyebab: 'Jadwal pembacaan serentak petugas cater lapangan.',
    dampak: 'Mencegah penetapan tagihan berdasarkan taksasi kubikasi.',
    tindakanPenanganan: 'Foto angka stand meter lalu upload di menu Catat Mandiri.',
    wilayahTerdampak: [],
    lokasiWilayah: 'Pelayanan Wilayah 5',
    aktif: true,
    tampilkanDiTicker: true,
    tampilkanDiSpotlight: false,
    urutan: 4,
    diperbaruiPada: '3 hari yang lalu',
  },
];

export async function seedBroadcast() {
  for (const item of SEED_BROADCASTS) {
    await db
      .insert(broadcast)
      .values(item as any)
      .onConflictDoUpdate({
        target: broadcast.id,
        set: {
          judul: item.judul,
          ringkasan: item.ringkasan,
          kategori: item.kategori,
          status: item.status,
          progresPersen: item.progresPersen,
          prioritas: item.prioritas,
          waktuMulai: item.waktuMulai,
          estimasiSelesai: item.estimasiSelesai,
          penyebab: item.penyebab,
          dampak: item.dampak,
          tindakanPenanganan: item.tindakanPenanganan,
          wilayahTerdampak: item.wilayahTerdampak,
          lokasiWilayah: item.lokasiWilayah,
          kontakBantuan: item.kontakBantuan,
          promoDetails: item.promoDetails,
          aktif: item.aktif,
          tampilkanDiTicker: item.tampilkanDiTicker,
          tampilkanDiSpotlight: item.tampilkanDiSpotlight,
          urutan: item.urutan,
          diperbaruiPada: item.diperbaruiPada,
          updatedAt: new Date(),
        },
      });
  }

  return {
    count: SEED_BROADCASTS.length,
    message: `Seeded ${SEED_BROADCASTS.length} siaran darurat, pemeliharaan & banner promo landing page.`,
  };
}

export const broadcastModule: SeedModule = {
  id: 'broadcast',
  name: 'Siaran Broadcast & Banner Landing Page',
  description: 'Pengumuman pemeliharaan pipa, darurat air, himbauan catat mandiri & promo MBR',
  run: async (_options: SeedOptions) => {
    return await seedBroadcast();
  },
};
