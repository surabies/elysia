import { describe, it, expect, beforeAll } from 'bun:test';
import { db, pengaduan, riwayatPengaduan, user, userRoles } from '@cater/db';
import { eq, desc } from 'drizzle-orm';
import { pengaduanService } from '../packages/backend/src/services/langganan/pengaduan/pengaduan.service';

describe('Fase 6C: Pengujian 4 Skenario End-to-End Alur Pengaduan Pelanggan', () => {
  let adminId: string;
  let verifikatorId: string;
  let teknisiId: string;

  beforeAll(async () => {
    adminId = 'usr-e2e-admin-' + Date.now();
    verifikatorId = 'usr-e2e-verif-' + Date.now();
    teknisiId = 'usr-e2e-teknisi-' + Date.now();

    await db.insert(user).values([
      { id: adminId, name: 'Supervisor Pengaduan', email: `${adminId}@tirtawening.co.id` },
      { id: verifikatorId, name: 'Staf Verifikator Layanan', email: `${verifikatorId}@tirtawening.co.id` },
      { id: teknisiId, name: 'Petugas Reaksi Cepat', email: `${teknisiId}@tirtawening.co.id` },
    ]);

    await db.insert(userRoles).values([
      { userId: adminId, role: 'SUPERADMIN' },
      { userId: verifikatorId, role: 'VERIFIKATOR_1' },
      { userId: teknisiId, role: 'PELAKSANA' },
    ]);
  });

  // =========================================================================
  // SKENARIO 1: Kebocoran Pipa Dinas Darurat di Fasilitas Publik
  // =========================================================================
  it('Skenario 1: Penanganan Darurat Pipa Bocor dari Laporan hingga Konfirmasi Warga', async () => {
    // 1. Warga melaporkan kebocoran pipa dengan koordinat GPS
    const tiket = await pengaduanService.createPengaduan({
      clientRequestId: 'req-e2e-bocor-' + Date.now(),
      jenis: 'BOCOR_PIPA_DINAS',
      judul: 'Pipa pecah air menyembur ke trotoar Jl. Asia Afrika',
      deskripsi: 'Air menyembur deras menggenangi trotoar dan jalan raya',
      koordinat: { x: 107.6098, y: -6.9214 },
      pelapor: 'Ibu Siti Nurhaliza',
      kontakPelapor: '081234567890',
      prioritas: 'DARURAT',
    });

    expect(tiket.status).toBe('BARU');
    expect(tiket.prioritas).toBe('DARURAT');
    expect(tiket.targetResponsAt).toBeDefined();

    // 2. Supervisor menugaskan tim reaksi cepat
    const tiketDitugaskan = await pengaduanService.tugaskanPengaduan({
      pengaduanId: tiket.id,
      ditugaskanKeId: teknisiId,
      catatan: 'Segera meluncur dengan peralatan penambal pipa dinas',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });
    expect(tiketDitugaskan.status).toBe('DITUGASKAN');
    expect(tiketDitugaskan.responsAt).toBeDefined();

    // 3. Teknisi bergerak menuju lokasi
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'MENUJU_LOKASI',
      catatan: 'Tim sedang berada di perjalanan menuju Jl. Asia Afrika',
      aktor: { id: teknisiId, role: 'PELAKSANA' },
    });

    // 4. Teknisi mulai memperbaiki di lokasi
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIPROSES',
      catatan: 'Penggalian dan isolasi pipa bocor sedang dikerjakan',
      aktor: { id: teknisiId, role: 'PELAKSANA' },
    });

    // 5. Teknisi menyelesaikan perbaikan dengan melampirkan foto hasil pekerjaan
    const tiketSelesai = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'SELESAI',
      catatan: 'Pipa dinas telah disambung kembali menggunakan klem ganda. Kebocoran terhenti total.',
      fotoPenyelesaianUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      aktor: { id: teknisiId, role: 'PELAKSANA' },
    });
    expect(tiketSelesai.status).toBe('SELESAI');
    expect(tiketSelesai.selesaiAt).toBeDefined();
    expect(tiketSelesai.konfirmasiBatasAt).toBeDefined();

    // 6. Warga menerima notifikasi dan mengonfirmasi bahwa air sudah tidak bocor lagi
    const tiketDitutup = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DITUTUP',
      catatan: 'Terima kasih PDAM Tirtawening, perbaikan sangat cepat dan rapi!',
      sumberAksi: 'PELAPOR',
    });
    expect(tiketDitutup.status).toBe('DITUTUP');

    // 7. Verifikasi riwayat linimasa
    const detail = await pengaduanService.getDetailPengaduanFull(tiket.id);
    expect(detail.status).toBe('DITUTUP');
    expect(detail.riwayat.length).toBeGreaterThanOrEqual(5);

    // Riwayat terakhir adalah konfirmasi pelapor
    const [riwayatTerakhir] = detail.riwayat;
    expect(riwayatTerakhir.aksi).toBe('DIKONFIRMASI');
  });

  // =========================================================================
  // SKENARIO 2: Lonjakan Tagihan Rekening Air (Wajib Verifikasi & Jeda SLA)
  // =========================================================================
  it('Skenario 2: Alur Komplain Tagihan Air dengan Verifikasi & Jeda SLA Pelanggan', async () => {
    // 1. Pelanggan komplain lonjakan rekening air yang tidak wajar
    const tiket = await pengaduanService.createPengaduan({
      clientRequestId: 'req-e2e-tagihan-' + Date.now(),
      jenis: 'LONJAKAN_PEMAKAIAN_AIR',
      deskripsi: 'Tagihan bulan ini melonjak 3x lipat padahal rumah kosong 2 minggu',
      pelapor: 'Bapak Hendra Gunawan',
      kontakPelapor: '085711223344',
      nomorLangganan: '1000000001',
    });

    // Otomatis terklasifikasi sebagai NILAI_TAGIHAN_REKENING
    expect(tiket.klasifikasi).toBe('NILAI_TAGIHAN_REKENING');
    expect(tiket.status).toBe('BARU');

    // 2. Tidak boleh langsung ditugaskan ke lapangan sebelum diverifikasi admin billing
    expect(
      pengaduanService.tugaskanPengaduan({
        pengaduanId: tiket.id,
        ditugaskanKeId: teknisiId,
        aktor: { id: adminId, role: 'SUPERADMIN' },
      })
    ).rejects.toThrow();

    // 3. Staf memverifikasi data pembacaan meter historis
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'TERVERIFIKASI',
      catatan: 'Pemeriksaan historis billing menunjukkan anomali kubikasi, diteruskan untuk cek fisik meter.',
      aktor: { id: verifikatorId, role: 'VERIFIKATOR_1' },
    });

    // 4. Setelah terverifikasi, baru dapat ditugaskan
    await pengaduanService.tugaskanPengaduan({
      pengaduanId: tiket.id,
      ditugaskanKeId: teknisiId,
      catatan: 'Periksa fisik meteran dan uji kebocoran pipa instalasi dalam rumah pelanggan',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });

    // 5. Teknisi tiba di rumah pelanggan tetapi pagar terkunci (MENUNGGU_PELANGGAN / Jeda SLA)
    const tiketDijeda = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'MENUNGGU_PELANGGAN',
      catatan: 'Rumah tertutup dan pagar digembok, menunggu konfirmasi jam kunjungan dari pelanggan.',
      aktor: { id: teknisiId, role: 'PELAKSANA' },
    });
    expect(tiketDijeda.status).toBe('MENUNGGU_PELANGGAN');
    expect(tiketDijeda.jedaMulaiAt).toBeDefined();

    // 6. Pelanggan merespons dan membuat janji -> Teknisi melanjutkan pemeriksaan (DIPROSES)
    const tiketDilanjut = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIPROSES',
      catatan: 'Pelanggan sudah membukakan pintu, pengujian meteran sedang berlangsung.',
      aktor: { id: teknisiId, role: 'PELAKSANA' },
    });
    expect(tiketDilanjut.status).toBe('DIPROSES');
    expect(tiketDilanjut.jedaMulaiAt).toBeNull();
    expect(tiketDilanjut.targetSelesaiAt).toBeDefined();

    // 7. Teknisi menyelesaikan pemeriksaan
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'SELESAI',
      catatan: 'Ditemukan pelampung toren air bocor halus. Angka stand meter fisik akurat sesuai pembacaan petugas.',
      aktor: { id: teknisiId, role: 'PELAKSANA' },
    });

    // 8. Pelanggan puas atas kejelasan hasil dan memberikan rating bintang 5
    const ratingRes = await pengaduanService.beriRating(
      tiket.nomorTiket,
      5,
      'Penjelasan teknisi sangat ramah dan transparan!'
    );
    expect(ratingRes.ratingKepuasan).toBe(5);
  });

  // =========================================================================
  // SKENARIO 3: Pelanggan Tidak Merespons Konfirmasi (Penutupan Otomatis Sistem)
  // =========================================================================
  it('Skenario 3: Penutupan Otomatis Tiket karena Melewati Batas Waktu Konfirmasi', async () => {
    // 1. Pembuatan tiket dan penanganan hingga selesai
    const tiket = await pengaduanService.createPengaduan({
      clientRequestId: 'req-e2e-autoclose-' + Date.now(),
      jenis: 'AIR_KERUH_BAU_BERWARNA',
      deskripsi: 'Air kran sempat keruh setelah perbaikan pipa',
      pelapor: 'Ibu Maya',
      kontakPelapor: '081399887766',
    });

    // Teknisi memproses dan menyelesaikan perbaikan (DITUGASKAN -> DIPROSES -> SELESAI)
    await db.update(pengaduan).set({ status: 'DITUGASKAN' }).where(eq(pengaduan.id, tiket.id));
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIPROSES',
      catatan: 'Petugas mulai melakukan flushing pipa dinas di lapangan.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'SELESAI',
      catatan: 'Flushing jaringan pipa dinas telah dilakukan sampai air bening kembali.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });

    // 2. Simulasikan pelanggan tidak merespons selama 72 jam (konfirmasiBatasAt di masa lalu)
    const waktuKedaluwarsa = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await db
      .update(pengaduan)
      .set({ konfirmasiBatasAt: waktuKedaluwarsa })
      .where(eq(pengaduan.id, tiket.id));

    // 3. Cron Job harian dijalankan
    const hasilJob = await pengaduanService.tutupOtomatisKedaluwarsa({ dryRun: false });
    expect(hasilJob.berhasilDitutup).toBeGreaterThanOrEqual(1);

    // 4. Periksa tiket di database telah berstatus DITUTUP
    const [rowFinal] = await db
      .select({ status: pengaduan.status })
      .from(pengaduan)
      .where(eq(pengaduan.id, tiket.id));
    expect(rowFinal.status).toBe('DITUTUP');

    // 5. Riwayat mencatat aksi DITUTUP_OTOMATIS
    const [riwayatTerakhir] = await db
      .select()
      .from(riwayatPengaduan)
      .where(eq(riwayatPengaduan.pengaduanId, tiket.id))
      .orderBy(desc(riwayatPengaduan.createdAt))
      .limit(1);

    expect(riwayatTerakhir.aksi).toBe('DITUTUP_OTOMATIS');
  });

  // =========================================================================
  // SKENARIO 4: Siklus Reopen (Pembukaan Kembali) hingga Batas Maksimal
  // =========================================================================
  it('Skenario 4: Pembukaan Kembali Pengaduan hingga Mencapai Batas Maksimal (2 Kali)', async () => {
    // 1. Buat tiket masalah air kecil
    const tiket = await pengaduanService.createPengaduan({
      clientRequestId: 'req-e2e-reopen-' + Date.now(),
      jenis: 'TIDAK_ADA_AIR',
      deskripsi: 'Tekanan air sangat kecil di siang hari',
      pelapor: 'Bapak Rahmat',
      kontakPelapor: '082155667788',
    });

    // Tugaskan dan selesaikan putaran 1 (DITUGASKAN -> DIPROSES -> SELESAI)
    await db.update(pengaduan).set({ status: 'DITUGASKAN' }).where(eq(pengaduan.id, tiket.id));
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIPROSES',
      catatan: 'Petugas mulai memeriksa katup distribusi.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'SELESAI',
      catatan: 'Katup distribusi telah dibuka maksimal.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });

    // 2. Pelanggan membuka kembali (Reopen Putaran ke-1)
    const reopen1 = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIBUKA_KEMBALI',
      catatan: 'Air masih kecil saat jam sibuk sore hari, mohon cek kembali',
      sumberAksi: 'PELAPOR',
    });
    expect(reopen1.status).toBe('DIBUKA_KEMBALI');
    expect(reopen1.jumlahDibukaKembali).toBe(1);

    // Teknisi mengerjakan kembali dan menyelesaikan putaran 2 (DIBUKA_KEMBALI -> DIPROSES -> SELESAI)
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIPROSES',
      catatan: 'Petugas membersihkan saringan meter.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'SELESAI',
      catatan: 'Pembersihan saringan meteran telah dilaksanakan.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });

    // 3. Pelanggan membuka kembali (Reopen Putaran ke-2)
    const reopen2 = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIBUKA_KEMBALI',
      catatan: 'Masih ada hambatan pada pipa cabang dinas.',
      sumberAksi: 'PELAPOR',
    });
    expect(reopen2.status).toBe('DIBUKA_KEMBALI');
    expect(reopen2.jumlahDibukaKembali).toBe(2);

    // Teknisi menyelesaikan putaran 3 (DIBUKA_KEMBALI -> DIPROSES -> SELESAI)
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'DIPROSES',
      catatan: 'Petugas mengganti pipa cabang dinas.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });
    await pengaduanService.ubahStatusPengaduan({
      pengaduanId: tiket.id,
      statusKe: 'SELESAI',
      catatan: 'Pipa cabang dinas telah diganti baru.',
      aktor: { id: adminId, role: 'SUPERADMIN' },
    });

    // 4. Pelanggan mencoba membuka kembali untuk ke-3 kalinya -> DITOLAK karena melebihi batas (MAKS_BUKA_KEMBALI = 2)
    expect(
      pengaduanService.ubahStatusPengaduan({
        pengaduanId: tiket.id,
        statusKe: 'DIBUKA_KEMBALI',
        catatan: 'Coba buka kembali ke-3',
        sumberAksi: 'PELAPOR',
      })
    ).rejects.toThrow('batas maksimal (2 kali)');
  });
});
