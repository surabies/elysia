import { describe, it, expect } from 'bun:test';
import {
  hitungKubikasiGantiMeter,
  hitungNeracaAir,
} from './gwm.engine';

describe('Domain Engine: GWM (Ganti Water Meter & Grand Water Meter)', () => {
  it('1. Perhitungan ganti meter presisi: (Stand Angkat - Lalu) + (Stand Baru - Pasang)', () => {
    // Meter lama: Stand lalu = 1500, Dicabut pada stand angkat = 1520 -> pakai lama = 20 m3
    // Meter baru: Stand pasang = 0, Dibaca bulan ini = 8 -> pakai baru = 8 m3
    // Total = 28 m3
    const res = hitungKubikasiGantiMeter({
      standLalu: 1500,
      standAngkat: 1520,
      standPasang: 0,
      standBacaBaru: 8,
    });

    expect(res.isValid).toBe(true);
    expect(res.pakaiMeterLama).toBe(20);
    expect(res.pakaiMeterBaru).toBe(8);
    expect(res.totalPemakaianM3).toBe(28);
  });

  it('2. Menolak perhitungan jika stand angkat lebih kecil dari stand lalu', () => {
    const res = hitungKubikasiGantiMeter({
      standLalu: 1500,
      standAngkat: 1480, // Error
      standPasang: 0,
      standBacaBaru: 8,
    });

    expect(res.isValid).toBe(false);
    expect(res.pesanError).toContain('Stand angkat');
  });

  it('3. Neraca Air aman jika NRW <= 15%', () => {
    // Masuk GWM: 10.000 m3, Terjual ke pelanggan: 8.800 m3 -> Hilang: 1.200 m3 (12%)
    const res = hitungNeracaAir({
      totalDebitGwmM3: 10000,
      totalPemakaianPelangganM3: 8800,
    });

    expect(res.kehilanganAirM3).toBe(1200);
    expect(res.persentaseNrw).toBe(12);
    expect(res.statusTingkatKebocoran).toBe('AMAN');
  });

  it('4. Neraca Air kritis jika NRW > 25%', () => {
    // Masuk GWM: 10.000 m3, Terjual: 7.000 m3 -> Hilang: 3.000 m3 (30%)
    const res = hitungNeracaAir({
      totalDebitGwmM3: 10000,
      totalPemakaianPelangganM3: 7000,
    });

    expect(res.kehilanganAirM3).toBe(3000);
    expect(res.persentaseNrw).toBe(30);
    expect(res.statusTingkatKebocoran).toBe('KRITIS');
  });
});
