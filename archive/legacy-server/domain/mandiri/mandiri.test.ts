import { describe, it, expect } from 'bun:test';
import {
  periksaJendelaLaporMandiri,
  evaluasiGeofenceMandiri,
  keWib,
} from './mandiri.engine';

describe('Domain Engine: Lapor Mandiri Pelanggan (WIB & Geofence)', () => {
  it('1. Konversi keWib menambahkan offset 7 jam', () => {
    // 2026-08-01 00:00:00 UTC -> 2026-08-01 07:00:00 WIB
    const utc = new Date(Date.UTC(2026, 7, 1, 0, 0, 0));
    const wib = keWib(utc);
    expect(wib.getUTCHours()).toBe(7);
  });

  it('2. Jendela pelaporan buka pada tanggal 1 WIB pukul 05:00 WIB (meski di UTC masih tanggal 31)', () => {
    // 2026-07-31 22:00:00 UTC = 2026-08-01 05:00:00 WIB
    const saat = new Date(Date.UTC(2026, 6, 31, 22, 0, 0));
    const res = periksaJendelaLaporMandiri(saat);
    expect(res.boleh).toBe(true);
    expect(res.tanggal).toBe(1);
    expect(res.periode).toBe(202608);
    expect(res.sisaHari).toBe(24);
  });

  it('3. Jendela pelaporan buka pada hari terakhir (tanggal 25)', () => {
    // 2026-08-25 05:00:00 WIB
    const saat = new Date(Date.UTC(2026, 7, 24, 22, 0, 0));
    const res = periksaJendelaLaporMandiri(saat);
    expect(res.boleh).toBe(true);
    expect(res.tanggal).toBe(25);
    expect(res.sisaHari).toBe(0);
    expect(res.pesan).toContain('TERAKHIR');
  });

  it('4. Jendela pelaporan ditutup pada tanggal 26 WIB', () => {
    // 2026-08-26 01:00:00 WIB
    const saat = new Date(Date.UTC(2026, 7, 25, 18, 0, 0));
    const res = periksaJendelaLaporMandiri(saat);
    expect(res.boleh).toBe(false);
    expect(res.tanggal).toBe(26);
    expect(res.sisaHari).toBeNull();
    expect(res.bukaBerikutnya).toBe('1 September 2026');
  });

  it('5. Evaluasi geofence valid jika jarak <= 50 meter', () => {
    const res = evaluasiGeofenceMandiri(18.5);
    expect(res.isLokasiValid).toBe(true);
    expect(res.jarakMeter).toBe(18.5);
    expect(res.peringatan).toBeUndefined();
  });

  it('6. Evaluasi geofence tidak valid jika jarak > 50 meter', () => {
    const res = evaluasiGeofenceMandiri(120);
    expect(res.isLokasiValid).toBe(false);
    expect(res.peringatan).toBeDefined();
    expect(res.peringatan).toContain('120 meter');
  });
});
