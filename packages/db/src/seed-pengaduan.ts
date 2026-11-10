import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { db } from './client';
import { pengaduan, riwayatPengaduan, pelanggan, user } from './schema';
import { eq, inArray } from 'drizzle-orm';
import type {
  JenisPengaduan,
  KlasifikasiPengaduan,
  PrioritasPengaduan,
  StatusPengaduan,
  AksiPengaduan,
} from '@cater/types';

interface SeedTicketItem {
  key: string;
  kodeJenis: string;
  nomorLangganan?: string;
  klasifikasi: KlasifikasiPengaduan;
  jenis: JenisPengaduan;
  judul: string;
  deskripsi: string;
  alamatKejadian: string;
  titik: { x: number; y: number };
  prioritas: PrioritasPengaduan;
  status: StatusPengaduan;
  pelapor: string;
  kontakPelapor: string;
  ditugaskanKeUserEmail?: string;
  eskalasiKeUserEmail?: string;
  alasanEskalasi?: string;
  fotoUrl?: string;
  fotoPenyelesaianUrl?: string;
  ratingKepuasan?: number;
  ulasanPelanggan?: string;
  // SLA offset in hours relative to now
  createdHoursAgo: number;
  slaResponsHours: number;
  slaSelesaiHours: number;
  responsHoursAgo?: number; // when it was responded
  selesaiHoursAgo?: number; // when it was completed
  timeline: Array<{
    aksi: AksiPengaduan;
    statusDari?: StatusPengaduan;
    statusKe?: StatusPengaduan;
    petugasUserEmail?: string;
    catatan: string;
    isPublik: boolean;
    hoursAgo: number;
  }>;
}

export async function seedPengaduan() {
  console.log('=== SEEDING PENGADUAN & WORKFLOW LIFECYCLE ===');

  // 1. Fetch available users for assignment & history audit
  const usersList = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user);
  const userMap = new Map<string, { id: string; name: string }>();
  for (const u of usersList) {
    if (u.email) userMap.set(u.email, { id: u.id, name: u.name });
  }

  const superAdmin = userMap.get('superadmin@pdam.co.id') ?? usersList[0];
  const verifikator1 = userMap.get('verifikator1@pdam.co.id') ?? superAdmin;
  const verifikator2 = userMap.get('verifikator2@pdam.co.id') ?? superAdmin;
  const billingStaff = userMap.get('staff.billing@pdam.co.id') ?? superAdmin;
  const dadangTeknisi = userMap.get('dadang@cater.pdam.co.id') ?? superAdmin;
  const agusTeknisi = userMap.get('agus@cater.pdam.co.id') ?? superAdmin;
  const rudyTeknisi = userMap.get('rudy@cater.pdam.co.id') ?? superAdmin;
  const daniTeknisi = userMap.get('dani@cater.pdam.co.id') ?? superAdmin;

  console.log(`Found ${usersList.length} system users for workflow audit.`);

  // 2. Clear existing demo tickets if any with prefix TK/BP/AK/TA/PM/PL/GS/LM/MG
  const sampleKeys = [
    'SEED-TIKET-01',
    'SEED-TIKET-02',
    'SEED-TIKET-03',
    'SEED-TIKET-04',
    'SEED-TIKET-05',
    'SEED-TIKET-06',
    'SEED-TIKET-07',
    'SEED-TIKET-08',
    'SEED-TIKET-09',
    'SEED-TIKET-10',
  ];

  const existingDemo = await db
    .select({ id: pengaduan.id })
    .from(pengaduan)
    .where(inArray(pengaduan.clientRequestId, sampleKeys));

  if (existingDemo.length > 0) {
    const ids = existingDemo.map((r) => r.id);
    console.log(`Cleaning up ${ids.length} existing demo tickets...`);
    await db.delete(riwayatPengaduan).where(inArray(riwayatPengaduan.pengaduanId, ids));
    await db.delete(pengaduan).where(inArray(pengaduan.id, ids));
  }

  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(wibTime.getUTCFullYear()).slice(-2);
  const mm = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(wibTime.getUTCDate()).padStart(2, '0');
  const tglStr = `${yy}${mm}${dd}`;

  // 3. Define 10 realistic tickets within service area boundary
  const ticketDefs: SeedTicketItem[] = [
    // 1. BARU - DARURAT - Pipa Bocor di Jalan Utama
    {
      key: 'SEED-TIKET-01',
      kodeJenis: 'BP',
      nomorLangganan: '00801100260',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'BOCOR_PIPA_DINAS',
      judul: 'Pipa dinas bocor deras menyembur di depan ruko',
      deskripsi:
        'Pipa dinas distribusi pecah di pinggir trotoar jalan depan toko, air menyembur deras hingga meluber ke jalan raya. Mohon segera dikirim tim reaksi cepat tanggap darurat.',
      alamatKejadian: 'Jl. ABC No. 28, Kel. Braga, Kec. Sumur Bandung',
      titik: { x: 107.61253383796151, y: -6.91650408870149 },
      prioritas: 'DARURAT',
      status: 'BARU',
      pelapor: 'Tjong A. Kwong',
      kontakPelapor: '081223344551',
      createdHoursAgo: 0.5,
      slaResponsHours: 1,
      slaSelesaiHours: 6,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          petugasUserEmail: undefined,
          catatan: 'Pengaduan darurat diterima via Formulir Portal Warga Online.',
          isPublik: true,
          hoursAgo: 0.5,
        },
      ],
    },

    // 2. TERVERIFIKASI - TINGGI - Air Keruh Berwarna Coklat
    {
      key: 'SEED-TIKET-02',
      kodeJenis: 'AK',
      nomorLangganan: '00401200610',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'AIR_KERUH_BAU_BERWARNA',
      judul: 'Air kran berwarna kecoklatan dan berbau lumpur',
      deskripsi:
        'Kran air keluar keruh coklat pekat sejak subuh tadi, endapan lumpur banyak sekali di bak penampungan dan berbau besi. Tidak layak dipakai mandi maupun konsumsi.',
      alamatKejadian: 'Jl. Lengkong Dalam No. 3, Kel. Pungkur, Kec. Regol',
      titik: { x: 107.6125823940962, y: -6.927647111571413 },
      prioritas: 'TINGGI',
      status: 'TERVERIFIKASI',
      pelapor: 'Ny. Ong Bin Giok',
      kontakPelapor: '081334455662',
      createdHoursAgo: 1.5,
      slaResponsHours: 2,
      slaSelesaiHours: 24,
      responsHoursAgo: 0.5,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          petugasUserEmail: undefined,
          catatan: 'Laporan warga masuk melalui loket call center.',
          isPublik: true,
          hoursAgo: 1.5,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'BARU',
          statusKe: 'TERVERIFIKASI',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Data pelanggan dan nomor sambungan telah diverifikasi. Dijadwalkan flushing pipa sekunder.',
          isPublik: true,
          hoursAgo: 0.5,
        },
      ],
    },

    // 3. DITUGASKAN - NORMAL - Meteran Macet
    {
      key: 'SEED-TIKET-03',
      kodeJenis: 'PM',
      nomorLangganan: '00801950265',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'PENCATATAN_METER_TIDAK_SESUAI',
      judul: 'Jarum water meter macet tidak berputar',
      deskripsi:
        'Meskipun kran dibuka penuh dan air mengalir normal ke rumah, jarum dial meteran air macet di angka 0142 m3. Khawatir perhitungan kubikasi tidak akurat saat pencatatan.',
      alamatKejadian: 'Jl. Pangarang Bawah No. 47, Kel. Cikawao, Kec. Lengkong',
      titik: { x: 107.61508247453405, y: -6.9241049186938355 },
      prioritas: 'NORMAL',
      status: 'DITUGASKAN',
      pelapor: 'Navie Arnas',
      kontakPelapor: '081556677883',
      ditugaskanKeUserEmail: 'dadang@cater.pdam.co.id',
      createdHoursAgo: 3,
      slaResponsHours: 6,
      slaSelesaiHours: 48,
      responsHoursAgo: 2,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan keluhan pelanggan via aplikasi.',
          isPublik: true,
          hoursAgo: 3,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Tiket ditugaskan ke Petugas Lapangan Bpk. Dadang untuk inspeksi mekanikal meter.',
          isPublik: true,
          hoursAgo: 2,
        },
      ],
    },

    // 4. MENUJU_LOKASI - DARURAT - Tidak Ada Air Satu Gang
    {
      key: 'SEED-TIKET-04',
      kodeJenis: 'TA',
      nomorLangganan: '00401700903',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'TIDAK_ADA_AIR',
      judul: 'Air mati total satu gang sejak sore kemarin',
      deskripsi:
        'Aliran air PDAM mati total sejak sore kemarin di sepanjang Gang H. Umar. Beberapa tetangga juga melaporkan hal yang sama, diduga ada gate valve distribusi yang macet/tertutup.',
      alamatKejadian: 'Gang H. Umar No. 25A, Kel. Ciateul, Kec. Regol',
      titik: { x: 107.60626346056021, y: -6.931807592119162 },
      prioritas: 'DARURAT',
      status: 'MENUJU_LOKASI',
      pelapor: 'Masnah Aliyah Agus',
      kontakPelapor: '081778899004',
      ditugaskanKeUserEmail: 'agus@cater.pdam.co.id',
      createdHoursAgo: 2,
      slaResponsHours: 1,
      slaSelesaiHours: 6,
      responsHoursAgo: 1.5,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan warga Gang H. Umar terkait padamnya aliran air.',
          isPublik: true,
          hoursAgo: 2,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Disposisi darurat ke tim teknis lapangan Bpk. Agus.',
          isPublik: true,
          hoursAgo: 1.5,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DITUGASKAN',
          statusKe: 'MENUJU_LOKASI',
          petugasUserEmail: 'agus@cater.pdam.co.id',
          catatan: 'Petugas sedang dalam perjalanan menuju lokasi membawa peralatan kunci valve dan pompa.',
          isPublik: true,
          hoursAgo: 0.3,
        },
      ],
    },

    // 5. DIPROSES - TINGGI - Pasangan Liar / By-pass Pipa
    {
      key: 'SEED-TIKET-05',
      kodeJenis: 'PL',
      nomorLangganan: '00402000426',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'PASANGAN_LIAR',
      judul: 'Dugaan sambungan pipa ilegal sebelum meteran air',
      deskripsi:
        'Laporan penertiban: ditemukan adanya sambungan pipa T ilegal sebelum meteran air di halaman samping bangunan ruko kosong. Air dialirkan secara ilegal ke tangki penampungan.',
      alamatKejadian: 'Jl. Ciateul No. 74-A, Kel. Ciateul, Kec. Regol',
      titik: { x: 107.60350448145476, y: -6.931848234633606 },
      prioritas: 'TINGGI',
      status: 'DIPROSES',
      pelapor: 'Afi',
      kontakPelapor: '081889900115',
      ditugaskanKeUserEmail: 'rudy@cater.pdam.co.id',
      createdHoursAgo: 6,
      slaResponsHours: 2,
      slaSelesaiHours: 24,
      responsHoursAgo: 5,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan aduan temuan pasangan ilegal diterima.',
          isPublik: true,
          hoursAgo: 6,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Ditugaskan ke Tim Pengendalian Kehilangan Air (Bpk. Rudy).',
          isPublik: true,
          hoursAgo: 5,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DITUGASKAN',
          statusKe: 'DIPROSES',
          petugasUserEmail: 'rudy@cater.pdam.co.id',
          catatan: 'Tim sedang melakukan pemutusan sambungan liar dan pengamanan barang bukti kran/pipa.',
          isPublik: true,
          hoursAgo: 2,
        },
        {
          aksi: 'CHAT',
          petugasUserEmail: 'rudy@cater.pdam.co.id',
          catatan: 'Pipa liar ukuran 3/4 inch telah disegel dengan dop permanen. Menyiapkan BAP penertiban.',
          isPublik: false,
          hoursAgo: 1,
        },
      ],
    },

    // 6. MENUNGGU_PELANGGAN - NORMAL - Lonjakan Pemakaian Air
    {
      key: 'SEED-TIKET-06',
      kodeJenis: 'LA',
      nomorLangganan: '00402200655',
      klasifikasi: 'NILAI_TAGIHAN_REKENING',
      jenis: 'LONJAKAN_PEMAKAIAN_AIR',
      judul: 'Tagihan air membengkak 3 kali lipat dari rata-rata',
      deskripsi:
        'Tagihan air bulan ini melonjak menjadi 65 m3 padahal rata-rata pemakaian 3 bulan terakhir hanya 18-20 m3. Pelanggan memohon pemeriksaan kebocoran pipa instalasi dalam rumah.',
      alamatKejadian: 'Jl. Akil No. 1A, Kel. Balonggede, Kec. Regol',
      titik: { x: 107.61040762408791, y: -6.931315305360548 },
      prioritas: 'NORMAL',
      status: 'MENUNGGU_PELANGGAN',
      pelapor: 'K. Hasikin',
      kontakPelapor: '081990011226',
      ditugaskanKeUserEmail: 'staff.billing@pdam.co.id',
      createdHoursAgo: 20,
      slaResponsHours: 6,
      slaSelesaiHours: 48,
      responsHoursAgo: 16,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Keluhan rekening tagihan masuk ke bagian billing.',
          isPublik: true,
          hoursAgo: 20,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Diserahkan ke staf billing untuk rekonsiliasi histori pemakaian kubikasi.',
          isPublik: true,
          hoursAgo: 16,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DITUGASKAN',
          statusKe: 'MENUNGGU_PELANGGAN',
          petugasUserEmail: 'staff.billing@pdam.co.id',
          catatan: 'Hasil cek menunjukkan indikasi rembesan tandon bawah. Menunggu persetujuan pelanggan untuk pembongkaran pipa dalam.',
          isPublik: true,
          hoursAgo: 8,
        },
      ],
    },

    // 7. SELESAI - NORMAL - Penggantian Stop Kran Rusak
    {
      key: 'SEED-TIKET-07',
      kodeJenis: 'GS',
      nomorLangganan: '00402300417',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'GANTI_STOP_KRAN',
      judul: 'Stop kran sebelum meteran patah dan merembes',
      deskripsi:
        'Handle stop kran sebelum meter air patah saat mau ditutup, air merembes keluar terus menerus membasahi tembok pagar rumah.',
      alamatKejadian: 'Jl. Akil No. 10 Pav, Kel. Balonggede, Kec. Regol',
      titik: { x: 107.60636734132494, y: -6.934950581914351 },
      prioritas: 'NORMAL',
      status: 'SELESAI',
      pelapor: 'Agus Mulyanto',
      kontakPelapor: '081234567897',
      ditugaskanKeUserEmail: 'dani@cater.pdam.co.id',
      ratingKepuasan: 5,
      ulasanPelanggan: 'Pelayanan cepat dan rapi. Petugas ramah, stop kran baru berfungsi dengan sangat baik.',
      fotoPenyelesaianUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      createdHoursAgo: 30,
      slaResponsHours: 6,
      slaSelesaiHours: 48,
      responsHoursAgo: 26,
      selesaiHoursAgo: 4,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Pengaduan stop kran patah dibuat warga.',
          isPublik: true,
          hoursAgo: 30,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Ditugaskan ke Bpk. Dani untuk penggantian stop kran 1/2 inch.',
          isPublik: true,
          hoursAgo: 26,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DITUGASKAN',
          statusKe: 'DIPROSES',
          petugasUserEmail: 'dani@cater.pdam.co.id',
          catatan: 'Pemasangan stop kran kuningan baru dan seal tape.',
          isPublik: true,
          hoursAgo: 6,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DIPROSES',
          statusKe: 'SELESAI',
          petugasUserEmail: 'dani@cater.pdam.co.id',
          catatan: 'Pekerjaan penggantian selesai tuntas. Aliran air normal tanpa rembesan. BAP ditandatangani pelanggan.',
          isPublik: true,
          hoursAgo: 4,
        },
      ],
    },

    // 8. DITUTUP - RENDAH - Lapor Stand Meter Mandiri
    {
      key: 'SEED-TIKET-08',
      kodeJenis: 'LM',
      nomorLangganan: '00404300110',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'LAPOR_STAND_METER',
      judul: 'Pelaporan mandiri stand meter bulan berjalan',
      deskripsi:
        'Laporan angka stand meter mandiri oleh pelanggan karena gerbang pagar digembok saat petugas cater melintas.',
      alamatKejadian: 'Jl. Murni I No. 18, Kel. Ciateul, Kec. Regol',
      titik: { x: 107.61046280807774, y: -6.932436184004481 },
      prioritas: 'RENDAH',
      status: 'DITUTUP',
      pelapor: 'Eddy Affandi',
      kontakPelapor: '081345678908',
      ditugaskanKeUserEmail: 'staff.billing@pdam.co.id',
      createdHoursAgo: 70,
      slaResponsHours: 12,
      slaSelesaiHours: 72,
      responsHoursAgo: 60,
      selesaiHoursAgo: 20,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan foto meter mandiri diunggah pelanggan via website.',
          isPublik: true,
          hoursAgo: 70,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'BARU',
          statusKe: 'SELESAI',
          petugasUserEmail: 'staff.billing@pdam.co.id',
          catatan: 'Angka stand meter 0285 m3 diverifikasi cocok dengan foto fisik.',
          isPublik: true,
          hoursAgo: 25,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'SELESAI',
          statusKe: 'DITUTUP',
          petugasUserEmail: 'staff.billing@pdam.co.id',
          catatan: 'Tiket berhasil diinput ke tagihan berjalan dan ditutup secara otomatis.',
          isPublik: true,
          hoursAgo: 20,
        },
      ],
    },

    // 9. DIPROSES (OVERDUE / MELEWATI SLA) - TINGGI - Bocor Pipa Distribusi Sekunder
    {
      key: 'SEED-TIKET-09',
      kodeJenis: 'BP',
      nomorLangganan: '00402500522',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'BOCOR_PIPA_DINAS',
      judul: 'Kebocoran pipa bawah aspal jalan raya',
      deskripsi:
        'Pipa bocor di bawah lapisan aspal jalan raya yang padat lalu lintas. Diperlukan koordinasi izin pembongkaran jalan dari Dinas Bina Marga/PU setempat.',
      alamatKejadian: 'Jl. Pungkur No. 109B, Kel. Pungkur, Kec. Regol',
      titik: { x: 107.60704058330158, y: -6.921562634776451 },
      prioritas: 'TINGGI',
      status: 'DIPROSES',
      pelapor: 'Shen Mee Che',
      kontakPelapor: '081456789019',
      ditugaskanKeUserEmail: 'dadang@cater.pdam.co.id',
      // Created 50 hours ago, SLA Selesai was 24 hours -> OVERDUE / MELANGGAR SLA
      createdHoursAgo: 50,
      slaResponsHours: 2,
      slaSelesaiHours: 24,
      responsHoursAgo: 45,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan kebocoran pipa bawah aspal diterima.',
          isPublik: true,
          hoursAgo: 50,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Ditugaskan ke Bpk. Dadang.',
          isPublik: true,
          hoursAgo: 45,
        },
        {
          aksi: 'CATATAN',
          petugasUserEmail: 'dadang@cater.pdam.co.id',
          catatan: 'Galian terkendala perizinan Dinas PU untuk buka aspal malam hari.',
          isPublik: false,
          hoursAgo: 30,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DITUGASKAN',
          statusKe: 'DIPROSES',
          petugasUserEmail: 'dadang@cater.pdam.co.id',
          catatan: 'Pekerjaan pengedukan dimulai bersama tim galian pipa distribusi.',
          isPublik: true,
          hoursAgo: 10,
        },
      ],
    },

    // 10. ESKALASI - DARURAT - Mutasi Golongan Tarif Sengketa
    {
      key: 'SEED-TIKET-10',
      kodeJenis: 'MG',
      nomorLangganan: '00801700080',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'MUTASI_GOLONGAN_TARIF',
      judul: 'Permohonan mutasi tarif Niaga ke Sosial untuk rumah ibadah',
      deskripsi:
        'Pelanggan memohon penyesuaian golongan tarif dari Niaga 2 ke Sosial A karena gedung telah diwakafkan menjadi musholla dan sarana pendidikan anak.',
      alamatKejadian: 'Jl. Dalem Kaum No. 33, Kel. Balonggede, Kec. Regol',
      titik: { x: 107.60725871469333, y: -6.9217083314801915 },
      prioritas: 'DARURAT',
      status: 'DITUGASKAN',
      pelapor: 'Wang Touw Hoa',
      kontakPelapor: '081567890120',
      ditugaskanKeUserEmail: 'verifikator2@pdam.co.id',
      eskalasiKeUserEmail: 'verifikator2@pdam.co.id',
      alasanEskalasi:
        'Memerlukan persetujuan dan verifikasi lapangan dari Manajer Pelayanan Pelanggan untuk perubahan SK golongan tarif.',
      createdHoursAgo: 8,
      slaResponsHours: 1,
      slaSelesaiHours: 6,
      responsHoursAgo: 7,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Permohonan mutasi golongan tarif masuk ke loket verifikasi.',
          isPublik: true,
          hoursAgo: 8,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'BARU',
          statusKe: 'TERVERIFIKASI',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Surat rekomendasi kelurahan dan akta wakaf telah lengkap.',
          isPublik: true,
          hoursAgo: 7,
        },
        {
          aksi: 'ESKALASI',
          statusDari: 'TERVERIFIKASI',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Berkas dieskalasi ke Manajer Verifikator 2 untuk otorisasi golongan tarif.',
          isPublik: true,
          hoursAgo: 5,
        },
      ],
    },
  ];

  console.log(`Inserting ${ticketDefs.length} workflow seed tickets...`);

  for (let idx = 0; idx < ticketDefs.length; idx++) {
    const item = ticketDefs[idx];
    const urutStr = String(idx + 1).padStart(4, '0');
    // Wilayah based on routing or default 05
    let wilayah = '01';
    if (item.nomorLangganan) {
      const [p] = await db
        .select({ ruteKode: pelanggan.ruteKode })
        .from(pelanggan)
        .where(eq(pelanggan.nolg, item.nomorLangganan));
      if (p?.ruteKode) {
        const digits = p.ruteKode.replace(/\D/g, '');
        if (digits.length >= 1) wilayah = digits.slice(0, 1).padStart(2, '0');
      }
    }

    const nomorTiket = `${item.kodeJenis}${wilayah}${tglStr}${urutStr}`;
    const createdAt = new Date(now.getTime() - item.createdHoursAgo * 60 * 60 * 1000);
    const targetResponsAt = new Date(createdAt.getTime() + item.slaResponsHours * 60 * 60 * 1000);
    const targetSelesaiAt = new Date(createdAt.getTime() + item.slaSelesaiHours * 60 * 60 * 1000);
    const responsAt = item.responsHoursAgo
      ? new Date(now.getTime() - item.responsHoursAgo * 60 * 60 * 1000)
      : null;
    const selesaiAt = item.selesaiHoursAgo
      ? new Date(now.getTime() - item.selesaiHoursAgo * 60 * 60 * 1000)
      : null;

    const assignedUser = item.ditugaskanKeUserEmail
      ? userMap.get(item.ditugaskanKeUserEmail)
      : undefined;
    const escalatedUser = item.eskalasiKeUserEmail
      ? userMap.get(item.eskalasiKeUserEmail)
      : undefined;

    const [row] = await db
      .insert(pengaduan)
      .values({
        nomorTiket,
        clientRequestId: item.key,
        nomorLangganan: item.nomorLangganan,
        pelangganId: item.nomorLangganan,
        klasifikasi: item.klasifikasi,
        jenis: item.jenis,
        judul: item.judul,
        deskripsi: item.deskripsi,
        koordinat: item.titik,
        alamatKejadian: item.alamatKejadian,
        prioritas: item.prioritas,
        status: item.status,
        pelapor: item.pelapor,
        kontakPelapor: item.kontakPelapor,
        fotoUrl: item.fotoUrl,
        fotoPenyelesaianUrl: item.fotoPenyelesaianUrl,
        ditugaskanKeId: assignedUser?.id ?? null,
        ditanganiMulai: responsAt,
        selesaiAt,
        targetResponsAt,
        targetSelesaiAt,
        responsAt,
        ratingKepuasan: item.ratingKepuasan,
        komentarKepuasan: item.ulasanPelanggan,
        createdAt,
        updatedAt: now,
      })
      .returning();

    // Insert timeline history
    for (const t of item.timeline) {
      const historyPetugas = t.petugasUserEmail ? userMap.get(t.petugasUserEmail) : undefined;
      const historyTime = new Date(now.getTime() - t.hoursAgo * 60 * 60 * 1000);

      await db.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: t.aksi,
        statusDari: t.statusDari,
        statusKe: t.statusKe,
        petugasId: historyPetugas?.id ?? null,
        catatan: t.catatan,
        isPublik: t.isPublik,
        createdAt: historyTime,
      });
    }

    console.log(
      `✓ [${row.nomorTiket}] ${row.status.padEnd(18)} (${row.prioritas}) - ${row.judul.slice(0, 45)}...`
    );
  }

  console.log('=== SEEDING PENGADUAN COMPLETED SUCCESSFULLY ===');
}

// Allow direct CLI execution
if (import.meta.main) {
  seedPengaduan()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Seed pengaduan failed:', e);
      process.exit(1);
    });
}
