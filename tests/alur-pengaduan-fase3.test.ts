import { describe, expect, it } from 'bun:test';
import {
  tentukanKlasifikasi,
  tentukanPrioritasAwal,
  isTransisiSah,
  hitungTargetSla,
  hitungEfekJeda,
  ringkasSla,
  hitungPerubahanTransisi,
  evaluasiPembuatanTiket,
  TRANSISI_PENGADUAN,
} from '../apps/web/src/server/domain/pengaduan/alur-pengaduan.engine';
import {
  BATAS_KONFIRMASI_JAM,
  MAKS_BUKA_KEMBALI,
  MIN_PANJANG_ALASAN_TOLAK,
} from '../apps/web/src/server/domain/pengaduan/pengaduan.config';
import type { StatusPengaduan } from '@cater/types';

describe('Fase 3: Domain Engine & Alur Bisnis (K1-K5, K7, K8, B9)', () => {
  it('1. K1: Klasifikasi Pengaduan & Aturan Verifikasi Tagihan', () => {
    // Klasifikasi otomatis
    expect(tentukanKlasifikasi('LAPOR_STAND_METER')).toBe('NILAI_TAGIHAN_REKENING');
    expect(tentukanKlasifikasi('PENCATATAN_METER_TIDAK_SESUAI')).toBe('NILAI_TAGIHAN_REKENING');
    expect(tentukanKlasifikasi('LONJAKAN_PEMAKAIAN_AIR')).toBe('NILAI_TAGIHAN_REKENING');
    expect(tentukanKlasifikasi('BOCOR_PIPA_DINAS')).toBe('BUKAN_NILAI_TAGIHAN_REKENING');
    expect(tentukanKlasifikasi('TIDAK_ADA_AIR')).toBe('BUKAN_NILAI_TAGIHAN_REKENING');

    // Pengaduan tagihan wajib TERVERIFIKASI sebelum DITUGASKAN
    expect(isTransisiSah('BARU', 'DITUGASKAN', { klasifikasi: 'NILAI_TAGIHAN_REKENING' })).toBe(false);
    expect(isTransisiSah('BARU', 'TERVERIFIKASI', { klasifikasi: 'NILAI_TAGIHAN_REKENING' })).toBe(true);
    expect(isTransisiSah('TERVERIFIKASI', 'DITUGASKAN', { klasifikasi: 'NILAI_TAGIHAN_REKENING' })).toBe(true);

    // Pengaduan non-tagihan boleh langsung BARU -> DITUGASKAN
    expect(isTransisiSah('BARU', 'DITUGASKAN', { klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING' })).toBe(true);
  });

  it('2. K2: Prioritas Otomatis Per Jenis Pengaduan', () => {
    // Default otomatis bila tidak diisi
    expect(tentukanPrioritasAwal('BOCOR_PIPA_DINAS')).toBe('TINGGI');
    expect(tentukanPrioritasAwal('TIDAK_ADA_AIR')).toBe('TINGGI');
    expect(tentukanPrioritasAwal('AIR_KERUH_BAU_BERWARNA')).toBe('TINGGI');
    expect(tentukanPrioritasAwal('MUTASI_GOLONGAN_TARIF')).toBe('NORMAL');

    // Prioritas manual input dihormati
    expect(tentukanPrioritasAwal('BOCOR_PIPA_DINAS', 'DARURAT')).toBe('DARURAT');
    expect(tentukanPrioritasAwal('MUTASI_GOLONGAN_TARIF', 'RENDAH')).toBe('RENDAH');
  });

  it('3. K3: Perhitungan Efek Jeda SLA (hitungEfekJeda)', () => {
    const jedaMulai = new Date('2026-05-01T10:00:00Z');
    const targetAwal = new Date('2026-05-02T10:00:00Z'); // 24 jam kemudian
    const jedaSelesai = new Date('2026-05-01T14:30:00Z'); // 4.5 jam (270 menit)

    const efek = hitungEfekJeda({
      jedaMulaiAt: jedaMulai,
      targetSelesaiAt: targetAwal,
      jedaTotalMenitSebelumnya: 30,
      sekarang: jedaSelesai,
    });

    expect(efek.durasiMenit).toBe(270);
    expect(efek.jedaTotalMenitBaru).toBe(300); // 30 + 270
    // Target selesai digeser 4.5 jam
    expect(efek.targetSelesaiAtBaru.getTime() - targetAwal.getTime()).toBe(270 * 60 * 1000);
    expect(efek.jedaMulaiAtBaru).toBeNull();
  });

  it('4. B9: Perbaikan Ringkasan SLA (ringkasSla)', () => {
    const targetSelesai = new Date('2026-05-02T10:00:00Z');
    const targetRespons = new Date('2026-05-01T12:00:00Z');

    // Kasus 1: Tiket selesai terlambat -> melanggar = true
    const selesaiTerlambat = ringkasSla({
      status: 'SELESAI',
      targetSelesaiAt: targetSelesai,
      selesaiAt: new Date('2026-05-02T12:00:00Z'), // 2 jam lebih lambat
    });
    expect(selesaiTerlambat.melanggar).toBe(true);

    // Kasus 2: Tiket selesai tepat waktu -> melanggar = false
    const selesaiTepatWaktu = ringkasSla({
      status: 'SELESAI',
      targetSelesaiAt: targetSelesai,
      selesaiAt: new Date('2026-05-02T09:00:00Z'), // 1 jam sebelum batas
    });
    expect(selesaiTepatWaktu.melanggar).toBe(false);

    // Kasus 3: Tiket DITOLAK dari BARU -> melanggar = false dan responsTerlambat = false
    const ditolakBaru = ringkasSla({
      status: 'DITOLAK',
      targetSelesaiAt: targetSelesai,
      targetResponsAt: targetRespons,
      responsAt: null,
    }, new Date('2026-05-03T00:00:00Z'));
    expect(ditolakBaru.melanggar).toBe(false);
    expect(ditolakBaru.responsTerlambat).toBe(false);

    // Kasus 4: Tiket terjeda -> sisa menit dibekukan pada jedaMulaiAt
    const terjeda = ringkasSla({
      status: 'MENUNGGU_PELANGGAN',
      targetSelesaiAt: targetSelesai,
      jedaMulaiAt: new Date('2026-05-02T08:00:00Z'), // 2 jam sebelum batas
    }, new Date('2026-05-03T00:00:00Z')); // Sekarang sudah lewat jauh
    expect(terjeda.terjeda).toBe(true);
    expect(terjeda.sisaMenit).toBe(120); // Tetap 2 jam (120 menit)
  });

  it('5. K4, K5, K8: Side-Effects Transisi Status (hitungPerubahanTransisi)', () => {
    const now = new Date('2026-05-01T08:00:00Z');

    // 5a. BARU -> TERVERIFIKASI: mengisi responsAt dan verifikasiAt, aksi DIVERIFIKASI
    const verif = hitungPerubahanTransisi({
      statusDari: 'BARU',
      statusKe: 'TERVERIFIKASI',
      prioritas: 'NORMAL',
      jenis: 'LONJAKAN_PEMAKAIAN_AIR',
      sekarang: now,
    });
    expect(verif.aksiRiwayat).toBe('DIVERIFIKASI');
    expect(verif.patch.verifikasiAt).toEqual(now);
    expect(verif.patch.responsAt).toEqual(now);

    // 5b. SELESAI: mengisi konfirmasiBatasAt (now + BATAS_KONFIRMASI_JAM)
    const selesai = hitungPerubahanTransisi({
      statusDari: 'DIPROSES',
      statusKe: 'SELESAI',
      prioritas: 'NORMAL',
      jenis: 'BOCOR_PIPA_DINAS',
      catatan: 'Pipa dinas telah diperbaiki dengan klem 2 inch.',
      sekarang: now,
    });
    expect(selesai.patch.selesaiAt).toEqual(now);
    expect(selesai.patch.konfirmasiBatasAt?.getTime() - now.getTime()).toBe(
      BATAS_KONFIRMASI_JAM * 60 * 60 * 1000
    );

    // 5c. SELESAI gagal bila tanpa foto dan tanpa catatan
    expect(() =>
      hitungPerubahanTransisi({
        statusDari: 'DIPROSES',
        statusKe: 'SELESAI',
        prioritas: 'NORMAL',
        jenis: 'BOCOR_PIPA_DINAS',
        catatan: '',
        fotoUrl: null,
      })
    ).toThrow();

    // 5d. DITOLAK wajib alasan minimal MIN_PANJANG_ALASAN_TOLAK (10 karakter)
    expect(() =>
      hitungPerubahanTransisi({
        statusDari: 'BARU',
        statusKe: 'DITOLAK',
        prioritas: 'NORMAL',
        jenis: 'LAINNYA',
        catatan: 'Pendek', // < 10 karakter
      })
    ).toThrow();

    const tolakSah = hitungPerubahanTransisi({
      statusDari: 'BARU',
      statusKe: 'DITOLAK',
      prioritas: 'NORMAL',
      jenis: 'LAINNYA',
      catatan: 'Bukan merupakan aset jaringan Tirtawening melainkan pipa swadaya warga.',
    });
    expect(tolakSah.patch.status).toBe('DITOLAK');

    // 5e. DIBUKA_KEMBALI (Reopen) mereset SLA & menambah counter
    const reopen = hitungPerubahanTransisi({
      statusDari: 'SELESAI',
      statusKe: 'DIBUKA_KEMBALI',
      prioritas: 'NORMAL',
      jenis: 'BOCOR_PIPA_DINAS',
      jumlahDibukaKembali: 1,
      konfirmasiBatasAt: new Date(now.getTime() + 10 * 60 * 1000), // Masih dalam jendela
      catatan: 'Air masih merembes di sambungan klem pipa baru.',
      sekarang: now,
    });
    expect(reopen.aksiRiwayat).toBe('DIBUKA_KEMBALI');
    expect(reopen.patch.jumlahDibukaKembali).toBe(2);
    expect(reopen.patch.selesaiAt).toBeNull();
    expect(reopen.patch.konfirmasiBatasAt).toBeNull();
    expect(reopen.patch.targetSelesaiAt).toBeDefined();

    // DIBUKA_KEMBALI ditolak jika sudah mencapai batas MAKS_BUKA_KEMBALI
    expect(() =>
      hitungPerubahanTransisi({
        statusDari: 'SELESAI',
        statusKe: 'DIBUKA_KEMBALI',
        prioritas: 'NORMAL',
        jenis: 'BOCOR_PIPA_DINAS',
        jumlahDibukaKembali: MAKS_BUKA_KEMBALI,
        konfirmasiBatasAt: new Date(now.getTime() + 10 * 60 * 1000),
        catatan: 'Ingin buka kembali lagi ketiga kali.',
        sekarang: now,
      })
    ).toThrow();

    // 5f. DITUTUP dengan aksi riwayat spesifik
    const tutupPelapor = hitungPerubahanTransisi({
      statusDari: 'SELESAI',
      statusKe: 'DITUTUP',
      prioritas: 'NORMAL',
      jenis: 'BOCOR_PIPA_DINAS',
      sumberAksi: 'PELAPOR',
      catatan: 'Terima kasih air sudah normal kembali.',
    });
    expect(tutupPelapor.aksiRiwayat).toBe('DIKONFIRMASI');

    const tutupOtomatis = hitungPerubahanTransisi({
      statusDari: 'SELESAI',
      statusKe: 'DITUTUP',
      prioritas: 'NORMAL',
      jenis: 'BOCOR_PIPA_DINAS',
      sumberAksi: 'OTOMATIS',
    });
    expect(tutupOtomatis.aksiRiwayat).toBe('DITUTUP_OTOMATIS');
  });

  it('6. Validasi Rentang Geografis Koordinat (evaluasiPembuatanTiket)', () => {
    // Koordinat di luar batas bujur (-180..180) atau lintang (-90..90)
    const bujurInvalid = evaluasiPembuatanTiket({
      jenis: 'BOCOR_PIPA_DINAS',
      pelapor: 'Ahmad',
      koordinat: { x: 200, y: -6.91 },
    });
    expect(bujurInvalid.valid).toBe(false);
    expect(bujurInvalid.pesanError).toContain('rentang geografis');

    const lintangInvalid = evaluasiPembuatanTiket({
      jenis: 'BOCOR_PIPA_DINAS',
      pelapor: 'Ahmad',
      koordinat: { x: 107.61, y: -95 },
    });
    expect(lintangInvalid.valid).toBe(false);

    // Koordinat valid
    const valid = evaluasiPembuatanTiket({
      jenis: 'BOCOR_PIPA_DINAS',
      pelapor: 'Ahmad',
      koordinat: { x: 107.61, y: -6.91 },
    });
    expect(valid.valid).toBe(true);
  });
});
