import { db } from './client';
import { masterKondisiCatat } from './schema/kondisi';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const DEFAULT_KONDISI_CATAT = [
  {
    kodeTmss: ' ',
    nama: 'Normal',
    kategori: 'TERBACA',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter terbaca normal dan jelas di lokasi',
  },
  {
    kodeTmss: '-',
    nama: 'Normal',
    kategori: 'TERBACA',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter terbaca normal (kode alternatif)',
  },
  {
    kodeTmss: 'H',
    nama: 'TIDAK DIPAKAI',
    kategori: 'TERBACA',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter tetap / pelanggan tidak menggunakan air sama sekali',
  },
  {
    kodeTmss: 'R',
    nama: 'RUMAH KOSONG',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Rumah atau tanah kosong, tidak berpenghuni',
  },
  {
    kodeTmss: 'N',
    nama: 'STAND TEMPEL',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Pelanggan menempelkan catatan angka stand meter di pagar atau pintu',
  },
  {
    kodeTmss: 'Z',
    nama: 'STAND-KONSUMEN',
    kategori: 'TERBACA',
    isKendalaAkses: false,
    triggerBacaMandiri: true,
    deskripsi: 'Angka meter dilaporkan secara mandiri oleh pelanggan',
  },
  {
    kodeTmss: 'P',
    nama: 'REV.PENCATAT',
    kategori: 'TERBACA',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Revisi catatan khusus dari petugas catat meter lapangan',
  },
  {
    kodeTmss: '2',
    nama: 'DK',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Dikunci: pagar atau rumah terkunci sehingga petugas tidak bisa masuk',
  },
  {
    kodeTmss: '8',
    nama: 'TIDAK ADA AIR',
    kategori: 'KENDALA_TEKNIS',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Aliran air PDAM mati atau tidak mengalir sama sekali',
  },
  {
    kodeTmss: '7',
    nama: 'MATI ADA AIR',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter macet / jarum tidak berputar padahal air mengalir',
  },
  {
    kodeTmss: '3',
    nama: 'MTA',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter Tak Ada: water meter hilang atau dicopot',
  },
  {
    kodeTmss: '5',
    nama: 'TTB',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Tidak Terbaca: meter tertimbun tanah, air, atau kotoran',
  },
  {
    kodeTmss: '6',
    nama: 'BMK/BMB',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Bodi atau kaca meter buram / kuning sehingga angka kabur',
  },
  {
    kodeTmss: 'E',
    nama: 'TERHALANG',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meter terhalang material, kendaraan, atau konstruksi bangunan',
  },
  {
    kodeTmss: 'O',
    nama: 'METER RUSAK',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Kerusakan fisik mekanis water meter',
  },
  {
    kodeTmss: 'D',
    nama: 'DICABUT',
    kategori: 'PELANGGARAN',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meteran dicabut oleh dinas / tim penertiban PDAM',
  },
  {
    kodeTmss: '4',
    nama: 'MB',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter Buram',
  },
  {
    kodeTmss: 'Q',
    nama: 'ADA ANJING',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Ada anjing penjaga yang membahayakan petugas lapangan',
  },
  {
    kodeTmss: 'F',
    nama: 'METER MUNDUR',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Angka stand meter berjalan mundur',
  },
  {
    kodeTmss: 'U',
    nama: 'MUDA KEMBALI',
    kategori: 'TERBACA',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Angka meter roll-over melewati batas maksimum (9999 -> 0000)',
  },
  {
    kodeTmss: 'T',
    nama: 'METER TERBALIK',
    kategori: 'KERUSAKAN_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Posisi pemasangan water meter terbalik arah aliran',
  },
  {
    kodeTmss: '9',
    nama: 'LOS METER',
    kategori: 'PELANGGARAN',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Sambungan langsung tanpa melalui water meter',
  },
  {
    kodeTmss: 'AA',
    nama: 'Meter Dalam Air',
    kategori: 'KENDALA_AKSES',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meteran terendam air got atau genangan galian',
  },
];

export async function seedMasterKondisi() {
  console.log('Seeding master kondisi catat (23 STI production conditions)...');
  for (const item of DEFAULT_KONDISI_CATAT) {
    await db
      .insert(masterKondisiCatat)
      .values({
        kodeTmss: item.kodeTmss,
        nama: item.nama,
        kategori: item.kategori,
        isKendalaAkses: item.isKendalaAkses,
        triggerBacaMandiri: item.triggerBacaMandiri,
        deskripsi: item.deskripsi,
        aktif: true,
      })
      .onConflictDoUpdate({
        target: masterKondisiCatat.kodeTmss,
        set: {
          nama: item.nama,
          kategori: item.kategori,
          isKendalaAkses: item.isKendalaAkses,
          triggerBacaMandiri: item.triggerBacaMandiri,
          deskripsi: item.deskripsi,
        },
      });
  }
  console.log('Master kondisi catat seeded successfully!');
}
