import { db } from '../../client';
import { pengaduan, riwayatPengaduan, pelanggan, user } from '../../schema';
import { eq, inArray } from 'drizzle-orm';
import type { SeedModule, SeedOptions } from '../types';

interface SeedTicketItem {
  key: string;
  kodeJenis: string;
  nomorLangganan?: string;
  klasifikasi: 'NILAI_TAGIHAN_REKENING' | 'BUKAN_NILAI_TAGIHAN_REKENING';
  jenis:
    | 'LAPOR_STAND_METER'
    | 'MUTASI_GOLONGAN_TARIF'
    | 'TIDAK_MAMPU_BAYAR'
    | 'PENCATATAN_METER_TIDAK_SESUAI'
    | 'LONJAKAN_PEMAKAIAN_AIR'
    | 'GANTI_STOP_KRAN'
    | 'BOCOR_PIPA_DINAS'
    | 'PASANGAN_LIAR'
    | 'TIDAK_ADA_AIR'
    | 'AIR_KERUH_BAU_BERWARNA'
    | 'PINDAH_JARINGAN'
    | 'LAINNYA';
  judul: string;
  deskripsi: string;
  alamatKejadian: string;
  titik: { x: number; y: number };
  prioritas: 'RENDAH' | 'NORMAL' | 'TINGGI' | 'DARURAT';
  status:
    | 'BARU'
    | 'TERVERIFIKASI'
    | 'DITUGASKAN'
    | 'MENUJU_LOKASI'
    | 'DIPROSES'
    | 'MENUNGGU_PELANGGAN'
    | 'SELESAI'
    | 'DITUTUP'
    | 'DITOLAK'
    | 'DIBUKA_KEMBALI';
  pelapor: string;
  kontakPelapor: string;
  ditugaskanKeUserEmail?: string;
  fotoUrl?: string;
  fotoPenyelesaianUrl?: string;
  ratingKepuasan?: number;
  ulasanPelanggan?: string;
  createdHoursAgo: number;
  slaResponsHours: number;
  slaSelesaiHours: number;
  responsHoursAgo?: number;
  selesaiHoursAgo?: number;
  timeline: Array<{
    aksi:
      | 'DIBUAT'
      | 'DITUGASKAN'
      | 'STATUS_DIUBAH'
      | 'CATATAN'
      | 'ESKALASI'
      | 'DIKONFIRMASI'
      | 'DIBUKA_KEMBALI'
      | 'DINILAI'
      | 'DIVERIFIKASI'
      | 'CHAT'
      | 'DITUTUP_OTOMATIS';
    statusDari?: any;
    statusKe?: any;
    petugasUserEmail?: string;
    catatan: string;
    isPublik: boolean;
    hoursAgo: number;
  }>;
}

export async function seedPengaduan() {
  // 1. Fetch available users for assignment & history audit
  const usersList = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user);
  const userMap = new Map<string, { id: string; name: string }>();
  for (const u of usersList) {
    if (u.email) userMap.set(u.email, { id: u.id, name: u.name });
  }

  // 2. Clear existing demo tickets if any
  const sampleKeys = [
    'SEED-TIKET-01',
    'SEED-TIKET-02',
    'SEED-TIKET-03',
    'SEED-TIKET-04',
    'SEED-TIKET-05',
  ];

  const existingDemo = await db
    .select({ id: pengaduan.id })
    .from(pengaduan)
    .where(inArray(pengaduan.clientRequestId, sampleKeys));

  if (existingDemo.length > 0) {
    const ids = existingDemo.map((r) => r.id);
    await db.delete(riwayatPengaduan).where(inArray(riwayatPengaduan.pengaduanId, ids));
    await db.delete(pengaduan).where(inArray(pengaduan.id, ids));
  }

  const now = new Date();
  const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(wibTime.getUTCFullYear()).slice(-2);
  const mm = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(wibTime.getUTCDate()).padStart(2, '0');
  const tglStr = `${yy}${mm}${dd}`;

  // 3. Define 5 realistic tickets with strict enum compatibility
  const ticketDefs: SeedTicketItem[] = [
    {
      key: 'SEED-TIKET-01',
      kodeJenis: 'BP',
      nomorLangganan: '00801100260',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'BOCOR_PIPA_DINAS',
      judul: 'Pipa dinas bocor deras menyembur di depan ruko',
      deskripsi: 'Pipa dinas distribusi pecah di trotoar depan toko, air menyembur deras hingga meluber ke jalan raya.',
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
    {
      key: 'SEED-TIKET-02',
      kodeJenis: 'AK',
      nomorLangganan: '00401200610',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'AIR_KERUH_BAU_BERWARNA',
      judul: 'Air kran berwarna kecoklatan dan berbau lumpur',
      deskripsi: 'Kran air keluar keruh coklat pekat sejak subuh tadi, endapan lumpur banyak sekali di bak penampungan.',
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
    {
      key: 'SEED-TIKET-03',
      kodeJenis: 'TA',
      nomorLangganan: '00301100060',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'TIDAK_ADA_AIR',
      judul: 'Aliran air mati total selama 2 hari',
      deskripsi: 'Air PDAM sama sekali tidak keluar sejak 2 hari yang lalu padahal tidak ada pengumuman pemeliharaan.',
      alamatKejadian: 'Gg. Kencana No. 12, Kel. Panjunan, Kec. Astana Anyar',
      titik: { x: 107.599186746672046, y: -6.9340464355937 },
      prioritas: 'TINGGI',
      status: 'DITUGASKAN',
      pelapor: 'Ahmad Sofyan',
      kontakPelapor: '081556677883',
      ditugaskanKeUserEmail: 'dadang@cater.pdam.co.id',
      createdHoursAgo: 4,
      slaResponsHours: 2,
      slaSelesaiHours: 12,
      responsHoursAgo: 2,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan masuk via loket pengaduan mobile.',
          isPublik: true,
          hoursAgo: 4,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'BARU',
          statusKe: 'TERVERIFIKASI',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Status rekening tercatat lancar, tidak ada tunggakan. Memerlukan inspeksi kran meter.',
          isPublik: true,
          hoursAgo: 3,
        },
        {
          aksi: 'DITUGASKAN',
          statusDari: 'TERVERIFIKASI',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'dadang@cater.pdam.co.id',
          catatan: 'Ditugaskan ke Petugas Dadang untuk pengecekan tekanan stop kran persil.',
          isPublik: true,
          hoursAgo: 2,
        },
      ],
    },
    {
      key: 'SEED-TIKET-04',
      kodeJenis: 'PM',
      nomorLangganan: '00602100040',
      klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING',
      jenis: 'PENCATATAN_METER_TIDAK_SESUAI',
      judul: 'Kaca meteran buram tertutup kerak lumut',
      deskripsi: 'Kaca penutup meter air berembun dan berlumut parah sehingga angka kubikasi tidak dapat terbaca.',
      alamatKejadian: 'Jl. Buah Dua No. 15, Kel. Cijagra, Kec. Lengkong',
      titik: { x: 107.628910176845096, y: -6.943396007794092 },
      prioritas: 'NORMAL',
      status: 'DIPROSES',
      pelapor: 'Hj. Siti Aminah',
      kontakPelapor: '081778899004',
      ditugaskanKeUserEmail: 'agus@cater.pdam.co.id',
      createdHoursAgo: 8,
      slaResponsHours: 4,
      slaSelesaiHours: 48,
      responsHoursAgo: 6,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Laporan temuan kondisi catat meter dari petugas cater lapangan.',
          isPublik: true,
          hoursAgo: 8,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'BARU',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'staff.billing@pdam.co.id',
          catatan: 'Diterbitkan Surat Perintah Kerja (SPK) Ganti Water Meter (GWM).',
          isPublik: true,
          hoursAgo: 6,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusDari: 'DITUGASKAN',
          statusKe: 'DIPROSES',
          petugasUserEmail: 'agus@cater.pdam.co.id',
          catatan: 'Teknisi di lapangan sedang melakukan penggantian unit meter baru.',
          isPublik: true,
          hoursAgo: 1,
        },
      ],
    },
    {
      key: 'SEED-TIKET-05',
      kodeJenis: 'PL',
      nomorLangganan: '00201100580',
      klasifikasi: 'NILAI_TAGIHAN_REKENING',
      jenis: 'LONJAKAN_PEMAKAIAN_AIR',
      judul: 'Tagihan bulan Januari membengkak 3x lipat tidak wajar',
      deskripsi: 'Biasanya tagihan air kami berkisar Rp 80.000 (15 m3), namun bulan ini terbit tagihan Rp 275.000.',
      alamatKejadian: 'Jl. Balonggede No. 44, Kel. Balonggede, Kec. Regol',
      titik: { x: 107.608799019959861, y: -6.92776899414298 },
      prioritas: 'TINGGI',
      status: 'SELESAI',
      pelapor: 'Budi Hartono',
      kontakPelapor: '081889900115',
      ditugaskanKeUserEmail: 'rudy@cater.pdam.co.id',
      ratingKepuasan: 5,
      ulasanPelanggan: 'Pelayanan sangat cepat dan solutif. Ditemukan kebocoran pipa instalasi dalam rumah.',
      createdHoursAgo: 24,
      slaResponsHours: 2,
      slaSelesaiHours: 48,
      responsHoursAgo: 20,
      selesaiHoursAgo: 2,
      timeline: [
        {
          aksi: 'DIBUAT',
          statusKe: 'BARU',
          catatan: 'Pengaduan keberatan rekening air via website portal.',
          isPublik: true,
          hoursAgo: 24,
        },
        {
          aksi: 'DITUGASKAN',
          statusKe: 'DITUGASKAN',
          petugasUserEmail: 'verifikator1@pdam.co.id',
          catatan: 'Ditugaskan ke Petugas Rudy untuk crosscheck stand meter riil di persil.',
          isPublik: true,
          hoursAgo: 20,
        },
        {
          aksi: 'STATUS_DIUBAH',
          statusKe: 'SELESAI',
          petugasUserEmail: 'rudy@cater.pdam.co.id',
          catatan: 'Stand meter fisik sesuai dengan foto cater. Ditemukan kebocoran pada instalasi pipa toren pelanggan.',
          isPublik: true,
          hoursAgo: 2,
        },
      ],
    },
  ];

  let seededCount = 0;
  for (let idx = 0; idx < ticketDefs.length; idx++) {
    const item = ticketDefs[idx];
    const urutStr = String(idx + 1).padStart(4, '0');
    let wilayah = '05';
    let validPelangganId: string | null = null;

    if (item.nomorLangganan) {
      const [p] = await db
        .select({ ruteKode: pelanggan.ruteKode, nolg: pelanggan.nolg })
        .from(pelanggan)
        .where(eq(pelanggan.nolg, item.nomorLangganan));
      if (p) {
        validPelangganId = p.nolg;
        if (p.ruteKode) {
          const digits = p.ruteKode.replace(/\D/g, '');
          if (digits.length >= 1) wilayah = digits.slice(0, 1).padStart(2, '0');
        }
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

    const [row] = await db
      .insert(pengaduan)
      .values({
        nomorTiket,
        clientRequestId: item.key,
        nomorLangganan: item.nomorLangganan,
        pelangganId: validPelangganId,
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

    seededCount++;
  }

  return {
    count: seededCount,
    message: `Seeded ${seededCount} tiket pengaduan siklus lengkap (Workflow, Timeline & SLA).`,
  };
}

export const pengaduanModule: SeedModule = {
  id: 'pengaduan',
  name: 'Layanan Pengaduan & Siklus Kerja (Workflow)',
  description: 'Tiket pengaduan riil (Pipa bocor, air mati, meter rusak, lonjakan tagihan) lengkap dengan audit trail',
  run: async (_options: SeedOptions) => {
    return await seedPengaduan();
  },
};
