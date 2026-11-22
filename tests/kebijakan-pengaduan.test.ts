/**
 * Test Suite: Kebijakan Dinamis Pengaduan Berversi (Policy as Data)
 * Memverifikasi:
 * 1. Inisialisasi Versi 1 bawaan (SK.001/DIR/2026)
 * 2. Pembuatan Draft Versi 2 dengan SLA, batas konfirmasi, dan alasan tolak kustom
 * 3. Penerbitan Versi 2 (SK.002/DIR/2026) -> Tiket baru otomatis memakai parameter Versi 2
 * 4. Snapshot Versi Kebijakan pada Tiket & Aturan Transisi Status Tiket
 * 5. Rollback Kebijakan ke Versi 1 -> Tiket baru kembali ke konfigurasi Versi 1
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { kebijakanPengaduanService } from '../apps/web/src/server/services/pengaduan/kebijakan-pengaduan.service';
import { pengaduanService } from '../apps/web/src/server/services/pengaduan/pengaduan.service';
import { db, pengaduan, riwayatPengaduan, eq } from '@cater/db';

describe('Kebijakan Dinamis Pengaduan Berversi (Policy as Data)', () => {
  let createdTicketIds: string[] = [];

  beforeAll(async () => {
    await kebijakanPengaduanService.ensureKebijakanTable();
  });

  it('1. Harap menginisialisasi kebijakan Versi 1 bawaan (AKTIF)', async () => {
    const aktif = await kebijakanPengaduanService.getKebijakanAktif();
    expect(aktif).toBeDefined();
    expect(aktif.versi).toBeGreaterThanOrEqual(1);
    expect(aktif.status).toBe('AKTIF');
    expect(aktif.config).toBeDefined();
    expect(aktif.config.slaPrioritas).toBeDefined();
  });

  it('2. Dapat menyimpan Draft Versi Baru dengan parameter SOP yang disesuaikan', async () => {
    const draft = await kebijakanPengaduanService.simpanDraftKebijakan({
      nomorSk: 'SK.002/DIR/2026',
      alasanPerubahan: 'Peningkatan kecepatan penanganan bocor pipa darurat dan penyesuaian SLA',
      config: {
        batasKonfirmasiJam: 24, // Lebih cepat dari default 72 jam
        maksBukaKembali: 1, // Hanya boleh 1x buka kembali
        minPanjangAlasanTolak: 15, // Lebih ketat dari default 10 karakter
        slaOverridePerJenis: {
          BOCOR_PIPA_DINAS: {
            responsJam: 0.5, // 30 menit (bawaan prioritas DARURAT = 1 jam)
            selesaiJam: 2, // 2 jam (bawaan prioritas DARURAT = 6 jam)
          },
        },
      },
    });

    expect(draft).toBeDefined();
    expect(draft.status).toBe('DRAFT');
    expect(draft.config.batasKonfirmasiJam).toBe(24);
    expect(draft.config.maksBukaKembali).toBe(1);
    expect(draft.config.minPanjangAlasanTolak).toBe(15);
    expect(draft.config.slaOverridePerJenis?.BOCOR_PIPA_DINAS?.selesaiJam).toBe(2);
  });

  it('3. Menerbitkan Draft menjadi Kebijakan AKTIF dan mengarsipkan kebijakan sebelumnya', async () => {
    const riwayat = await kebijakanPengaduanService.getRiwayatKebijakan();
    const draft = riwayat.find((k) => k.status === 'DRAFT');
    expect(draft).toBeDefined();
    const versiDraft = draft!.versi;

    const published = await kebijakanPengaduanService.terbitkanKebijakan(versiDraft, {
      nomorSk: 'SK.002/DIR/2026',
      alasanPerubahan: 'Pemberlakuan Kebijakan Penanganan Pengaduan Dipercepat Tahun 2026',
    });

    expect(published.status).toBe('AKTIF');
    expect(published.versi).toBe(versiDraft);

    const aktif = await kebijakanPengaduanService.getKebijakanAktif();
    expect(aktif.versi).toBe(versiDraft);
    expect(aktif.status).toBe('AKTIF');
    expect(aktif.config.batasKonfirmasiJam).toBe(24);
  });

  it('4. Tiket pengaduan baru otomatis mengadopsi SLA & parameter kebijakan yang sedang aktif', async () => {
    const aktif = await kebijakanPengaduanService.getKebijakanAktif();
    const now = new Date();

    const created = await pengaduanService.createPengaduan({
      jenis: 'BOCOR_PIPA_DINAS',
      deskripsi: 'Pipa dinas bocor di depan rumah warga RT 02.',
      pelapor: 'Budi Hartono',
      kontakPelapor: '081234567890',
      koordinat: { x: 106.8456, y: -6.2088 },
      prioritas: 'DARURAT',
    });

    createdTicketIds.push(created.id);
    expect(created.kebijakanVersi).toBe(aktif.versi);

    // Hitung selisih target SLA terhadap waktu dibuat
    const targetSelesai = new Date(created.targetSelesaiAt!);
    const durasiMenit = Math.round((targetSelesai.getTime() - now.getTime()) / 60000);

    // Sesuai config versi 2: BOCOR_PIPA_DINAS selesai 120 menit (2 jam)
    expect(durasiMenit).toBeGreaterThanOrEqual(118);
    expect(durasiMenit).toBeLessThanOrEqual(122);
  });

  it('5. Memverifikasi validasi penolakan tiket mematuhi minPanjangAlasanTolak dari kebijakan aktif', async () => {
    const ticketId = createdTicketIds[0];

    // Penolakan dengan 12 karakter (< 15 karakter) harus gagal karena kebijakan versi 2 menetapkan min 15
    await expect(
      pengaduanService.ubahStatusPengaduan({
        pengaduanId: ticketId,
        statusKe: 'DITOLAK',
        catatan: 'Kurang jelas', // 12 karakter
      })
    ).rejects.toThrow(/minimal 15 karakter/);

    // Penolakan dengan alasan lengkap (>= 15 karakter) harus berhasil
    const validTolak = await pengaduanService.ubahStatusPengaduan({
      pengaduanId: ticketId,
      statusKe: 'DITOLAK',
      catatan: 'Lokasi pengaduan berada di luar wilayah operasional PDAM resmi.',
    });

    expect(validTolak.status).toBe('DITOLAK');
  });

  it('6. Rollback kebijakan mengembalikan parameter operasional ke versi sebelumnya dengan aman', async () => {
    const rolledBack = await kebijakanPengaduanService.rollbackKebijakan(1, {
      alasanRollback: 'Evaluasi kesiapan lapangan dan penyesuaian personil teknis',
    });

    expect(rolledBack.status).toBe('AKTIF');
    expect(rolledBack.versi).toBe(1);

    const aktifSekarang = await kebijakanPengaduanService.getKebijakanAktif();
    expect(aktifSekarang.versi).toBe(1);
    expect(aktifSekarang.config.batasKonfirmasiJam).toBe(72); // Nilai default versi 1
    expect(aktifSekarang.config.minPanjangAlasanTolak).toBe(10); // Nilai default versi 1

    // Buat tiket baru setelah rollback
    const postRollbackTicket = await pengaduanService.createPengaduan({
      jenis: 'BOCOR_PIPA_DINAS',
      deskripsi: 'Pipa dinas bocor kembali setelah perbaikan sementara.',
      pelapor: 'Iwan Setiawan',
      kontakPelapor: '081299988877',
      koordinat: { x: 106.85, y: -6.21 },
      prioritas: 'DARURAT',
    });

    createdTicketIds.push(postRollbackTicket.id);
    expect(postRollbackTicket.kebijakanVersi).toBe(1);

    // Di versi 1, tanpa override, prioritas DARURAT selesai dalam 6 jam (360 menit)
    const targetSelesai = new Date(postRollbackTicket.targetSelesaiAt!);
    const now = new Date();
    const durasiMenit = Math.round((targetSelesai.getTime() - now.getTime()) / 60000);
    expect(durasiMenit).toBeGreaterThanOrEqual(358);
    expect(durasiMenit).toBeLessThanOrEqual(362);
  });
});
