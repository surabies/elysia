import { eq, sql } from 'drizzle-orm';
import { db } from './client';
import { aturanKondisiMeterMap } from './schema/anomali';
import { caterBacaMeter } from './schema/cater';
import { masterKondisiCatat, type ModeHitungKondisi } from './schema/kondisi';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface KondisiCatatSeedItem {
  kodeTmss: string;
  nama: string;
  kategori: 'TERBACA' | 'KENDALA_AKSES' | 'KENDALA_TEKNIS' | 'KERUSAKAN_FISIK' | 'PELANGGARAN';
  modeHitung: ModeHitungKondisi;
  isKendalaAkses: boolean;
  triggerBacaMandiri: boolean;
  deskripsi: string;
}

/**
 * Standar Resmi 32 Kode Kelainan & Kondisi Catat Meter PDAM (Sinkron dengan docs/kelainan/kode-kelainan.md).
 * Catatan penting: Kode Normal hanya 1 yaitu '-' (kode spasi ' ' telah disatukan ke '-').
 */
export const DEFAULT_KONDISI_CATAT: KondisiCatatSeedItem[] = [
  {
    kodeTmss: '-',
    nama: 'Normal',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter terbaca normal dan jelas di lokasi',
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
    kodeTmss: '1',
    nama: 'TK',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Tanah Kosong / bangunan belum dihuni sehingga meter belum dapat diakses langsung',
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
    kodeTmss: '3',
    nama: 'MTA',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter Tak Ada: water meter hilang atau dicopot di lapangan',
  },
  {
    kodeTmss: '4',
    nama: 'MB',
    kategori: 'TERBACA',
    modeHitung: 'METER_BARU',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter Baru (Pergantian water meter baru, dihitung dari stand angkat + meter baru atau override)',
  },
  {
    kodeTmss: '5',
    nama: 'TTB',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Tidak Terbaca: meter tertimbun tanah, lumpur, atau kotoran',
  },
  {
    kodeTmss: '6',
    nama: 'BMK/BMB',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Bodi Meter Kotor / Bodi Meter Buram: kaca meter berembun, kuning, atau kabur',
  },
  {
    kodeTmss: '7',
    nama: 'METER MATI AIR ADA',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meter macet / jarum register tidak berputar padahal air tetap mengalir',
  },
  {
    kodeTmss: '8',
    nama: 'TIDAK ADA AIR',
    kategori: 'KENDALA_TEKNIS',
    modeHitung: 'NOL',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Aliran air mati atau tidak mengalir sama sekali di wilayah layanan (pemakaian = 0 m³)',
  },
  {
    kodeTmss: '9',
    nama: 'LOS METER',
    kategori: 'PELANGGARAN',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Sambungan pipa langsung tanpa melalui water meter',
  },
  {
    kodeTmss: 'AA',
    nama: 'Meter Dalam Air',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meteran terendam air got, bak kontrol penuh, atau genangan galian',
  },
  {
    kodeTmss: 'C',
    nama: 'MT DIBOLAK BALIK',
    kategori: 'PELANGGARAN',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Indikasi pelanggaran posisi water meter sengaja dibolak-balik untuk menurunkan stand',
  },
  {
    kodeTmss: 'D',
    nama: 'DI CABUT',
    kategori: 'PELANGGARAN',
    modeHitung: 'NOL',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Meteran dicabut resmi oleh dinas / tim penertiban (pemakaian ditagih = 0 m³)',
  },
  {
    kodeTmss: 'E',
    nama: 'TERHALANG',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meter terhalang material, tumpukan barang, kendaraan, atau konstruksi bangunan',
  },
  {
    kodeTmss: 'F',
    nama: 'METER MUNDUR',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Angka stand meter tercatat berjalan mundur dibanding periode lalu',
  },
  {
    kodeTmss: 'G',
    nama: 'PEMBULATAN',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Penyesuaian pembulatan angka stand pembacaan meter',
  },
  {
    kodeTmss: 'H',
    nama: 'TIDAK DIPAKAI',
    kategori: 'TERBACA',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand meter tetap / pelanggan sedang tidak menggunakan air',
  },
  {
    kodeTmss: 'I',
    nama: 'MTK',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Meter Terkunci di dalam boks pelindung sehingga angka tidak tampak jelas',
  },
  {
    kodeTmss: 'J',
    nama: 'DIOPREK/DICOLOK LIDI',
    kategori: 'PELANGGARAN',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Indikasi perusakan segel / jarum meter diganjal atau dicolok benda asing',
  },
  {
    kodeTmss: 'K',
    nama: 'STAN CICILAN',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Pencatatan stand meter dengan skema cicilan lonjakan pemakaian',
  },
  {
    kodeTmss: 'M',
    nama: 'KELEBIHAN',
    kategori: 'TERBACA',
    modeHitung: 'KREDIT_TAKSASI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Stand sistem lebih tinggi dari stand fisik meter akibat akumulasi taksasi bulan sebelumnya',
  },
  {
    kodeTmss: 'N',
    nama: 'STAND TEMPEL',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Pelanggan menempelkan catatan angka stand di pagar/pintu rumah',
  },
  {
    kodeTmss: 'O',
    nama: 'METER RUSAK',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Kerusakan fisik mekanis atau kaca pecah pada water meter',
  },
  {
    kodeTmss: 'P',
    nama: 'REV.PENCATAT',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Revisi angka stand awal/akhir berdasarkan laporan koreksi petugas catat lapangan',
  },
  {
    kodeTmss: 'Q',
    nama: 'ADA ANJING',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Terdapat anjing penjaga yang menghalangi keselamatan petugas lapangan',
  },
  {
    kodeTmss: 'R',
    nama: 'RMH/TANAH KSG',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Rumah atau tanah kosong tidak berpenghuni saat dikunjungi petugas',
  },
  {
    kodeTmss: 'T',
    nama: 'METER TERBALIK',
    kategori: 'KERUSAKAN_FISIK',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Posisi pemasangan water meter terbalik terhadap arah aliran pipa',
  },
  {
    kodeTmss: 'U',
    nama: 'MUDA KEMBALI',
    kategori: 'TERBACA',
    modeHitung: 'MUDA_KEMBALI',
    isKendalaAkses: false,
    triggerBacaMandiri: false,
    deskripsi: 'Angka meter roll-over melewati batas maksimum register (mis. 9999 -> 0000 / 99999 -> 00000)',
  },
  {
    kodeTmss: 'V',
    nama: 'JAUH',
    kategori: 'KENDALA_AKSES',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: true,
    triggerBacaMandiri: true,
    deskripsi: 'Lokasi meter berada jauh di dalam persil/area tertutup yang sulit dijangkau langsung',
  },
  {
    kodeTmss: 'W',
    nama: 'STAND-KONSUMEN/PENGADUAN',
    kategori: 'TERBACA',
    modeHitung: 'SELISIH_FISIK',
    isKendalaAkses: false,
    triggerBacaMandiri: true,
    deskripsi: 'Angka stand dari pelaporan konsumen melalui layanan pengaduan pelanggan',
  },
  {
    kodeTmss: 'Z',
    nama: 'STAND-KONSUMEN',
    kategori: 'TERBACA',
    modeHitung: 'TAKSASI_HISTORI',
    isKendalaAkses: false,
    triggerBacaMandiri: true,
    deskripsi: 'Angka meter dilaporkan mandiri oleh konsumen melalui foto/WA/portal warga',
  },
];

export async function seedMasterKondisi() {
  console.log('Seeding master kondisi catat (32 kode resmi PDAM)...');
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

  // Satukan kode duplikat ' ' (spasi warisan) ke '-' (Normal tunggal) secara aman
  await db
    .update(caterBacaMeter)
    .set({ tmss: '-' })
    .where(sql`trim(coalesce(${caterBacaMeter.tmss}, '')) = ''`);
  await db
    .delete(aturanKondisiMeterMap)
    .where(eq(aturanKondisiMeterMap.kodeTmss, ' '));
  await db
    .delete(masterKondisiCatat)
    .where(eq(masterKondisiCatat.kodeTmss, ' '));

  console.log('Master 32 kondisi catat seeded & kode Normal disatukan ke "-"!');
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
