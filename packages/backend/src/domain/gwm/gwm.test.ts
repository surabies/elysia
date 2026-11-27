import { describe, it, expect } from 'bun:test';
import {
  hitungKubikasiGantiMeter,
  hitungKubikasiMudaKembali,
  inferDigitMeterRollover,
  hitungNeracaAir,
} from './gwm.engine';
import { evaluasiGuardBacaanMeter } from '../cater/guard-bacaan.engine';

describe('Domain Engine: GWM (Ganti Water Meter, Rollover Muda Kembali, & Guard Bacaan)', () => {
  it('1. Perhitungan ganti meter presisi: (Stand Angkat - Lalu) + (Stand Baru - Pasang)', () => {
    const res = hitungKubikasiGantiMeter({
      standLalu: 1500,
      standAngkat: 1520,
      standPasang: 0,
      standBacaBaru: 8,
    });

    expect(res.isValid).toBe(true);
    expect(res.isOverrideTanpaStandAngkat).toBe(false);
    expect(res.pakaiMeterLama).toBe(20);
    expect(res.pakaiMeterBaru).toBe(8);
    expect(res.totalPemakaianM3).toBe(28);
  });

  it('2. Menolak perhitungan MB jika stand angkat lebih kecil dari stand lalu', () => {
    const res = hitungKubikasiGantiMeter({
      standLalu: 1500,
      standAngkat: 1480,
      standPasang: 0,
      standBacaBaru: 8,
    });

    expect(res.isValid).toBe(false);
    expect(res.pesanError).toContain('Stand angkat');
  });

  it('3. Menahan MB tanpa stand angkat secara default, tetapi mengizinkan dengan Human Override eksplisit', () => {
    const defaultStrict = hitungKubikasiGantiMeter({
      standLalu: 1500,
      standAngkat: null,
      standPasang: 0,
      standBacaBaru: 12,
    });
    expect(defaultStrict.isValid).toBe(false);
    expect(defaultStrict.butuhKonfirmasiManusia).toBe(true);

    const overridden = hitungKubikasiGantiMeter({
      standLalu: 1500,
      standAngkat: null,
      standPasang: 2,
      standBacaBaru: 12,
      tanpaStandAngkat: true,
    });
    expect(overridden.isValid).toBe(true);
    expect(overridden.isOverrideTanpaStandAngkat).toBe(true);
    expect(overridden.pakaiMeterLama).toBe(0);
    expect(overridden.pakaiMeterBaru).toBe(10);
    expect(overridden.totalPemakaianM3).toBe(10);
  });

  it('4. Perhitungan Muda Kembali (Rollover) 4-digit (10.000): 9998 -> 10 menghasilkan 12 m3', () => {
    const res = hitungKubikasiMudaKembali({
      standAwal: 9998,
      standAkhir: 10,
      ukuranMeter: '1/2',
    });

    expect(res.isValid).toBe(true);
    expect(res.digit).toBe(4);
    expect(res.batasPutar).toBe(10000);
    expect(res.sisaPutaranLama).toBe(2);
    expect(res.jalanPutaranBaru).toBe(10);
    expect(res.totalPemakaianM3).toBe(12);
    expect(res.isRolloverTerjadi).toBe(true);
    expect(res.isNearRolloverZone).toBe(true);
  });

  it('5. Smart Proximity Inference: meter 2" 5-digit (99.980 -> 45) terdeteksi 100.000 (65 m3), bukan 1.000.000', () => {
    const info = inferDigitMeterRollover({
      standAwal: 99980,
      standAkhir: 45,
      ukuranMeter: '2',
    });
    expect(info.digit).toBe(5);
    expect(info.batasPutar).toBe(100000);
    expect(info.sumberDigit).toBe('PROXIMITY_STAND');

    const res = hitungKubikasiMudaKembali({
      standAwal: 99980,
      standAkhir: 45,
      ukuranMeter: '2',
    });
    expect(res.totalPemakaianM3).toBe(65);
    expect(res.isNearRolloverZone).toBe(true);
  });

  it('6. Muda Kembali 6-digit (1.000.000) dan deteksi plausibilitas jika standAwal jauh dari 9999', () => {
    const sixDigit = hitungKubikasiMudaKembali({
      standAwal: 999950,
      standAkhir: 20,
      ukuranMeter: '1/2',
    });
    expect(sixDigit.digit).toBe(6);
    expect(sixDigit.batasPutar).toBe(1000000);
    expect(sixDigit.totalPemakaianM3).toBe(70);
    expect(sixDigit.isNearRolloverZone).toBe(true);

    const implausible = hitungKubikasiMudaKembali({
      standAwal: 4421,
      standAkhir: 9,
      ukuranMeter: '1/2',
    });
    expect(implausible.isNearRolloverZone).toBe(false);
    expect(implausible.peringatanPlausibilitas).toBeDefined();
  });

  it('7. Muda Kembali bila standAkhir >= standAwal menghitung selisih maju biasa tanpa tambah 10^D', () => {
    const res = hitungKubikasiMudaKembali({
      standAwal: 25,
      standAkhir: 40,
      ukuranMeter: '1/2',
    });
    expect(res.isValid).toBe(true);
    expect(res.isRolloverTerjadi).toBe(false);
    expect(res.totalPemakaianM3).toBe(15);
  });

  it('8. Guard Bacaan Meter: memblokir MB mentah, kubikasi negatif, dan stand mundur, serta meloloskan koreksi sah', () => {
    // a. MB mentah tanpa stand angkat -> DIBLOKIR
    const rawMb = evaluasiGuardBacaanMeter({
      stml: 4421,
      stma: 9,
      pakaiM3: -4412,
      tmss: '4',
      ketCatat: 'MB',
      statusVerifikasi: 'SUBMITTED',
    });
    expect(rawMb.lolos).toBe(false);
    expect(rawMb.kodeBlokir).toBe('MB_BUTUH_STAND_ANGKAT');

    // b. MB dengan stand angkat sah -> LOLOS
    const validMb = evaluasiGuardBacaanMeter({
      stml: 4421,
      stma: 9,
      pakaiM3Revisi: 19,
      tmss: '4',
      ketCatat: 'MB',
      standAngkatRevisi: 4431,
      standMeterBaruRevisi: 9,
      statusVerifikasi: 'SUBMITTED',
    });
    expect(validMb.lolos).toBe(true);
    expect(validMb.kodeBlokir).toBeNull();

    // c. MB dengan Override Tanpa Stand Angkat -> LOLOS
    const overrideMb = evaluasiGuardBacaanMeter({
      stml: 4421,
      stma: 9,
      pakaiM3Revisi: 9,
      tmss: '4',
      ketCatat: 'MB',
      mbTanpaStandAngkat: true,
      statusVerifikasi: 'SUBMITTED',
    });
    expect(overrideMb.lolos).toBe(true);

    // d. Normal stand mundur (meskipun pakaiM3 di-0-kan legacy import) -> DIBLOKIR
    const normalMundur = evaluasiGuardBacaanMeter({
      stml: 2998,
      stma: 2898,
      pakaiM3: 0,
      ketCatat: 'Normal',
      statusVerifikasi: 'VERIFIED_L3',
    });
    expect(normalMundur.lolos).toBe(false);
    expect(normalMundur.kodeBlokir).toBe('STAND_MUNDUR_NORMAL');

    // e. Muda Kembali implausible (4421 -> 9) tanpa konfirmasi digitRollover -> DIBLOKIR
    const rolloverImplausible = evaluasiGuardBacaanMeter({
      stml: 4421,
      stma: 9,
      pakaiM3: 5588,
      tmss: 'U',
      ketCatat: 'MUDA KEMBALI',
      statusVerifikasi: 'SUBMITTED',
    });
    expect(rolloverImplausible.lolos).toBe(false);
    expect(rolloverImplausible.kodeBlokir).toBe('ROLLOVER_BUTUH_KONFIRMASI');

    // f. Muda Kembali valid di dekat batas putar (9989 -> 25) -> LOLOS
    const rolloverValid = evaluasiGuardBacaanMeter({
      stml: 9989,
      stma: 25,
      pakaiM3: 36,
      tmss: 'U',
      ketCatat: 'MUDA KEMBALI',
      ukuranMeter: '1/2',
      statusVerifikasi: 'SUBMITTED',
    });
    expect(rolloverValid.lolos).toBe(true);
  });

  it('9. Neraca Air aman jika NRW <= 15% dan kritis jika NRW > 25%', () => {
    const aman = hitungNeracaAir({
      totalDebitGwmM3: 10000,
      totalPemakaianPelangganM3: 8800,
    });
    expect(aman.kehilanganAirM3).toBe(1200);
    expect(aman.persentaseNrw).toBe(12);
    expect(aman.statusTingkatKebocoran).toBe('AMAN');

    const kritis = hitungNeracaAir({
      totalDebitGwmM3: 10000,
      totalPemakaianPelangganM3: 7000,
    });
    expect(kritis.kehilanganAirM3).toBe(3000);
    expect(kritis.persentaseNrw).toBe(30);
    expect(kritis.statusTingkatKebocoran).toBe('KRITIS');
  });
});
