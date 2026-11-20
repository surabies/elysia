import { db } from './client';
import { masterKondisiCatat, type ModeHitungKondisi } from './schema/kondisi';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface KondisiCatatSeedItem {
  kodeTmss: string;
  nama: string;
  kategori: string;
  modeHitung: ModeHitungKondisi;
  isKendalaAkses: boolean;
  triggerBacaMandiri: boolean;
  deskripsi: string;
}

export const DEFAULT_KONDISI_CATAT: KondisiCatatSeedItem[] = [
  {
    kodeTmss: ' ',
    nama: 'Normal',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter terbaca normal dan jelas di lokasi',
  },
  {
    kodeTmss: '-',
    nama: 'Normal',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter terbaca normal (kode alternatif)',
  },
  {
    kodeTmss: 'H',
    nama: 'TIDAK DIPAKAI',
    kategori: 'TERBACA',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter tetap / pelanggan tidak menggunakan air (ditaksir sebesar pakai_lalu)',
  },
  {
    kodeTmss: 'R',
    nama: 'RUMAH KOSONG',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Rumah atau tanah kosong, tidak berpenghuni (ditaksir sebesar pakai_lalu)',
  },
  {
    kodeTmss: 'N',
    nama: 'STAND TEMPEL',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Pelanggan menempelkan angka stand di pagar/pintu (pakai selisih fisik jika stma > stml, atau taksasi pakai_lalu jika stma == stml)',
  },
  {
    kodeTmss: 'Z',
    nama: 'STAND-KONSUMEN',
    kategori: 'TERBACA',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: true,
    deskripsi: 'Angka meter dilaporkan oleh konsumen / taksasi mandiri apabila stma == stml',
  },
  {
    kodeTmss: 'P',
    nama: 'REV.PENCATAT',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Revisi catatan khusus dari petugas catat meter lapangan / rekonsiliasi taksasi lalu',
  },
  {
    kodeTmss: '2',
    nama: 'DK',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Dikunci: pagar atau rumah terkunci sehingga petugas tidak bisa masuk',
  },
  {
    kodeTmss: '8',
    nama: 'TIDAK ADA AIR',
    kategori: 'KENDALA_TEKNIS',
    modeHitung: 'NOL',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Aliran air mati atau tidak mengalir sama sekali (pemakaian ditagih = 0 m3)',
  },
  {
    kodeTmss: '7',
    nama: 'MATI ADA AIR',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter macet / jarum tidak berputar padahal air mengalir',
  },
  {
    kodeTmss: '3',
    nama: 'MTA',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter Tak Ada: water meter hilang atau dicopot',
  },
  {
    kodeTmss: '5',
    nama: 'TTB',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Tidak Terbaca: meter tertimbun tanah, air, atau kotoran',
  },
  {
    kodeTmss: '6',
    nama: 'BMK/BMB',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Bodi atau kaca meter buram / kuning sehingga angka kabur',
  },
  {
    kodeTmss: 'E',
    nama: 'TERHALANG',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meter terhalang material, kendaraan, atau konstruksi bangunan',
  },
  {
    kodeTmss: 'O',
    nama: 'METER RUSAK',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Kerusakan fisik mekanis water meter',
  },
  {
    kodeTmss: 'D',
    nama: 'DICABUT',
    kategori: 'PELANGGARAN',
    modeHitung: 'NOL',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meteran dicabut oleh dinas / tim penertiban (pemakaian ditagih = 0 m3)',
  },
  {
    kodeTmss: '4',
    nama: 'MB',
    kategori: 'TERBACA',
    modeHitung: 'METER_BARU',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter Baru (Pergantian water meter baru, stand mulai dari 0 / stand pasang)',
  },
  {
    kodeTmss: 'Q',
    nama: 'ADA ANJING',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Ada anjing penjaga yang membahayakan petugas lapangan',
  },
  {
    kodeTmss: 'F',
    nama: 'METER MUNDUR',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Angka stand meter berjalan mundur',
  },
  {
    kodeTmss: 'U',
    nama: 'MUDA KEMBALI',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Angka meter roll-over melewati batas maksimum (9999 -> 0000)',
  },
  {
    kodeTmss: 'T',
    nama: 'METER TERBALIK',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Posisi pemasangan water meter terbalik arah aliran',
  },
  {
    kodeTmss: '9',
    nama: 'LOS METER',
    kategori: 'PELANGGARAN',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Sambungan langsung tanpa melalui water meter',
  },
  {
    kodeTmss: 'AA',
    nama: 'Meter Dalam Air',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meteran terendam air got atau genangan galian',
  },
  {
    kodeTmss: '0',
    nama: 'REV.PENGADUAN',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Revisi angka stand meter berdasarkan tindak lanjut pengaduan pelanggan',
  },
  {
    kodeTmss: 'K',
    nama: 'STAN CICILAN',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Pencatatan stand meter dengan skema cicilan pemakaian',
  },
  {
    kodeTmss: 'M',
    nama: 'KELEBIHAN',
    kategori: 'TERBACA',
    modeHitung: 'KREDIT_TAKSASI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand sistem lebih tinggi dari stand fisik meter akibat akumulasi taksasi bulan-bulan sebelumnya',
  },
];

export async function seedMasterKondisi() {
  console.log('Seeding master kondisi catat (26 STI production conditions with mode_hitung)...');
  for (const item of DEFAULT_KONDISI_CATAT) {
    await db
      .insert(masterKondisiCatat)
      .values({
        kodeTmss: item.kodeTmss,
        nama: item.nama,
        kategori: item.kategori,
        modeHitung: item.modeHitung,
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
          modeHitung: item.modeHitung,
          isKendalaAkses: item.isKendalaAkses,
          triggerBacaMandiri: item.triggerBacaMandiri,
          deskripsi: item.deskripsi,
        },
      });
  }
  console.log('Master kondisi catat seeded successfully!');
}

if (import.meta.main) {
  seedMasterKondisi()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error seeding master kondisi:', err);
      process.exit(1);
    });
}
