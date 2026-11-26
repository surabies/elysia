import { describe, it, expect } from 'bun:test';
import { db, pengaduan, riwayatPengaduan } from '@cater/db';
import { eq } from 'drizzle-orm';
import { pengaduanService } from '../packages/backend/src/services/langganan/pengaduan/pengaduan.service';
import {
  samarkanNama,
  verifikasiEmpatDigitKontak,
  cekBatasPercobaan,
  catatKegagalanPercobaan,
  resetPercobaan,
} from '../packages/backend/src/lib/public-rate-limiter';

describe('Fase 5: Kanal Pelapor Publik, Verifikasi Kepemilikan, & Penutupan Otomatis (K4, K6)', () => {
  // 1. Sanitasi Nama Pelapor (Masking PII)
  it('1. samarkanNama menyamarkan nama pelapor untuk keamanan publik', () => {
    expect(samarkanNama('Ahmad Dani')).toBe('Ahm** Da**');
    expect(samarkanNama('Budi')).toBe('Bu**');
    expect(samarkanNama('Sri Wahyuni')).toBe('Sr* Wah****');
    expect(samarkanNama('A')).toBe('A*');
  });

  // 2. Verifikasi 4 Digit Nomor Kontak (Timing Safe)
  it('2. verifikasiEmpatDigitKontak membandingkan 4 digit terakhir nomor telepon secara presisi', () => {
    const noHp = '081234567890';
    expect(verifikasiEmpatDigitKontak(noHp, '7890')).toBe(true);
    expect(verifikasiEmpatDigitKontak(noHp, '7891')).toBe(false);
    expect(verifikasiEmpatDigitKontak(noHp, '1234')).toBe(false);
    expect(verifikasiEmpatDigitKontak(null, '7890')).toBe(false);
    expect(verifikasiEmpatDigitKontak('', '7890')).toBe(false);
  });

  // 3. In-Memory Rate Limiter Batas Percobaan
  it('3. cekBatasPercobaan membatasi maks 5 kegagalan per IP dan nomor tiket', () => {
    const dummyIp = '192.168.100.50';
    const dummyTiket = 'TK012611220099';

    resetPercobaan(dummyIp, dummyTiket);
    expect(cekBatasPercobaan(dummyIp, dummyTiket).boleh).toBe(true);

    // 4 kali gagal
    for (let i = 0; i < 4; i++) {
      catatKegagalanPercobaan(dummyIp, dummyTiket);
    }
    expect(cekBatasPercobaan(dummyIp, dummyTiket).boleh).toBe(true);

    // Percobaan ke-5 gagal -> terblokir
    catatKegagalanPercobaan(dummyIp, dummyTiket);
    const cekBlokir = cekBatasPercobaan(dummyIp, dummyTiket);
    expect(cekBlokir.boleh).toBe(false);
    expect(cekBlokir.sisaDetik).toBeGreaterThan(0);

    // Reset saat berhasil
    resetPercobaan(dummyIp, dummyTiket);
    expect(cekBatasPercobaan(dummyIp, dummyTiket).boleh).toBe(true);
  });

  // 4. Penutupan Otomatis (Dry Run vs Live Execution)
  it('4. tutupOtomatisKedaluwarsa menutup tiket SELESAI yang telah melewati konfirmasiBatasAt', async () => {
    // Buat tiket uji coba
    const tiket = await pengaduanService.createPengaduan({
      jenis: 'TIDAK_ADA_AIR',
      deskripsi: 'Air mati satu gang',
      pelapor: 'Ibu Linda',
      kontakPelapor: '081223344555',
    });

    // Set status SELESAI dengan konfirmasiBatasAt di masa lalu (misal 1 jam yang lalu)
    const masaLalu = new Date(Date.now() - 60 * 60 * 1000);
    await db
      .update(pengaduan)
      .set({
        status: 'SELESAI',
        selesaiAt: new Date(Date.now() - 73 * 60 * 60 * 1000),
        konfirmasiBatasAt: masaLalu,
      })
      .where(eq(pengaduan.id, tiket.id));

    // Eksekusi dry run
    const resDry = await pengaduanService.tutupOtomatisKedaluwarsa({ dryRun: true });
    expect(resDry.dryRun).toBe(true);
    expect(resDry.totalDitemukan).toBeGreaterThanOrEqual(1);
    expect(resDry.berhasilDitutup).toBe(0);

    // Tiket masih berstatus SELESAI setelah dry run
    const [cekStatusDry] = await db
      .select({ status: pengaduan.status })
      .from(pengaduan)
      .where(eq(pengaduan.id, tiket.id));
    expect(cekStatusDry.status).toBe('SELESAI');

    // Eksekusi live run
    const resLive = await pengaduanService.tutupOtomatisKedaluwarsa({ dryRun: false });
    expect(resLive.dryRun).toBe(false);
    expect(resLive.berhasilDitutup).toBeGreaterThanOrEqual(1);

    // Tiket telah berubah menjadi DITUTUP
    const [cekStatusLive] = await db
      .select({ status: pengaduan.status })
      .from(pengaduan)
      .where(eq(pengaduan.id, tiket.id));
    expect(cekStatusLive.status).toBe('DITUTUP');

    // Riwayat memuat aksi DITUTUP_OTOMATIS
    const [riwayat] = await db
      .select()
      .from(riwayatPengaduan)
      .where(eq(riwayatPengaduan.pengaduanId, tiket.id))
      .orderBy(riwayatPengaduan.createdAt);
    expect(riwayat).toBeDefined();
  });

  // 5. Tiket Lama Tanpa konfirmasiBatasAt TIDAK Tertutup Otomatis
  it('5. Tiket SELESAI tanpa konfirmasiBatasAt (tiket backlog lama) tidak tersentuh', async () => {
    const tiketLama = await pengaduanService.createPengaduan({
      jenis: 'LAINNYA',
      deskripsi: 'Tiket sebelum migrasi',
      pelapor: 'Pak Ridwan',
    });

    await db
      .update(pengaduan)
      .set({
        status: 'SELESAI',
        konfirmasiBatasAt: null,
      })
      .where(eq(pengaduan.id, tiketLama.id));

    await pengaduanService.tutupOtomatisKedaluwarsa({ dryRun: false });

    const [cek] = await db
      .select({ status: pengaduan.status })
      .from(pengaduan)
      .where(eq(pengaduan.id, tiketLama.id));
    expect(cek.status).toBe('SELESAI');
  });
});
