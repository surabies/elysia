import { describe, expect, it } from 'bun:test';
import {
  hitungJumlahHari,
  bagiAman,
  hitungLps,
  bangunTabelProgres,
  bangunTabelTargetRealisasi,
  prosesHitungCapaian,
} from './capaian.engine';
import { TargetBulananItem, RealisasiBulananItem } from './capaian.types';

describe('Domain Engine Capaian Pencatatan', () => {
  // Fixture Excel Referensi (Lampiran Prompt)
  const fixtureTarget: TargetBulananItem[] = [
    { bulan: 1, targetSl: 22450, targetM3: 340000 },
    { bulan: 2, targetSl: 22470, targetM3: 338000 },
    { bulan: 3, targetSl: 22490, targetM3: 345000 },
    { bulan: 4, targetSl: 22510, targetM3: 340000 },
    { bulan: 5, targetSl: 22530, targetM3: 342000 },
    { bulan: 6, targetSl: 22550, targetM3: 345000 },
    { bulan: 7, targetSl: 22570, targetM3: 350000 },
    { bulan: 8, targetSl: 22590, targetM3: 348000 },
    { bulan: 9, targetSl: 22610, targetM3: 345000 },
    { bulan: 10, targetSl: 22630, targetM3: 345000 },
    { bulan: 11, targetSl: 22650, targetM3: 345000 },
    { bulan: 12, targetSl: 22670, targetM3: 345000 },
  ];

  const fixtureRealisasi: RealisasiBulananItem[] = [
    { bulan: 0, realisasiSl: 22428, realisasiM3: 345989 }, // Des 2025
    { bulan: 1, realisasiSl: 22435, realisasiM3: 328601 },
    { bulan: 2, realisasiSl: 22450, realisasiM3: 335795 },
    { bulan: 3, realisasiSl: 22475, realisasiM3: 339400 },
    { bulan: 4, realisasiSl: 22490, realisasiM3: 332150 },
    { bulan: 5, realisasiSl: 22505, realisasiM3: 336800 },
    { bulan: 6, realisasiSl: 22515, realisasiM3: 340100 },
    { bulan: 7, realisasiSl: 22520, realisasiM3: 341250 },
    { bulan: 8, realisasiSl: 22525, realisasiM3: 338900 },
    { bulan: 9, realisasiSl: 22522, realisasiM3: 335600 },
    { bulan: 10, realisasiSl: 22524, realisasiM3: 330209 },
    { bulan: 11, realisasiSl: 0, realisasiM3: 0 }, // Belum berjalan
    { bulan: 12, realisasiSl: 0, realisasiM3: 0 }, // Belum berjalan
  ];

  it('1. Perhitungan Jumlah Hari kalender tepat (termasuk tahun kabisat)', () => {
    expect(hitungJumlahHari(2026, 0)).toBe(31); // Des tahun lalu
    expect(hitungJumlahHari(2026, 1)).toBe(31); // Jan
    expect(hitungJumlahHari(2026, 2)).toBe(28); // Feb non-kabisat
    expect(hitungJumlahHari(2024, 2)).toBe(29); // Feb kabisat
    expect(hitungJumlahHari(2026, 4)).toBe(30); // Apr
  });

  it('2. Pembagian dengan nol mengembalikan null (bukan NaN atau Infinity)', () => {
    expect(bagiAman(100, 0)).toBeNull();
    expect(bagiAman(null, 10)).toBeNull();
    expect(bagiAman(330209, 22524, 2)).toBe(14.66);
  });

  it('3. Perhitungan LPS dengan hari acuan 30 hari', () => {
    // 328.601 m³ -> (328.601 * 1000) / (30 * 86.400) = 328.601.000 / 2.592.000 ≈ 126.78 LPS
    const lpsJan = hitungLps(328601, 30, 2);
    expect(lpsJan).toBe(126.78);
    expect(hitungLps(0, 30)).toBeNull();
    expect(hitungLps(null, 30)).toBeNull();
  });

  it('4. Bangun Tabel 1 (Progres Capaian Bulanan)', () => {
    const { baris, ringkasan } = bangunTabelProgres(2026, fixtureRealisasi);

    expect(baris.length).toBe(13); // Bulan 0 s.d 12

    // Des tahun lalu
    expect(baris[0].bulan).toBe(0);
    expect(baris[0].realisasiSl).toBe(22428);
    expect(baris[0].realisasiM3).toBe(345989);
    expect(baris[0].m3PerSl).toBe(15.43);
    expect(baris[0].m3PerSlPerHari).toBe(0.498); // 15.43 / 31 = 0.4977... ≈ 0.498

    // Januari 2026
    expect(baris[1].bulan).toBe(1);
    expect(baris[1].deltaSl).toBe(7); // 22435 - 22428
    expect(baris[1].deltaM3).toBe(-17388); // 328601 - 345989
    expect(baris[1].m3PerSl).toBe(14.65); // 328601 / 22435

    // Oktober 2026 (sama persis dengan database transaksi cater_baca_meter!)
    expect(baris[10].bulan).toBe(10);
    expect(baris[10].realisasiSl).toBe(22524);
    expect(baris[10].realisasiM3).toBe(330209);
    expect(baris[10].m3PerSl).toBe(14.66);

    // Bulan 11 & 12 (belum berjalan) harus null
    expect(baris[11].realisasiSl).toBeNull();
    expect(baris[11].realisasiM3).toBeNull();
    expect(baris[11].m3PerSl).toBeNull();

    // Ringkasan
    expect(ringkasan.totalHari).toBe(304); // Jan-Okt
    expect(ringkasan.netDeltaSl).toBe(96); // 22524 - 22428
    expect(ringkasan.netDeltaM3).toBe(-15780); // 330209 - 345989
  });

  it('5. Bangun Tabel 2 (Target vs Realisasi & Aturan Bebas Bug Excel)', () => {
    const { baris, ringkasan } = bangunTabelTargetRealisasi(
      fixtureTarget,
      fixtureRealisasi,
      { hariAcuanLps: 30 }
    );

    expect(baris.length).toBe(12);

    // Januari
    expect(baris[0].targetSl).toBe(22450);
    expect(baris[0].realisasiSl).toBe(22435);
    expect(baris[0].capaianSlPersen).toBe(99.93);
    expect(baris[0].targetM3).toBe(340000);
    expect(baris[0].realisasiM3).toBe(328601);
    expect(baris[0].capaianM3Persen).toBe(96.65);
    expect(baris[0].selisihM3).toBe(-11399);

    // Bulan belum berjalan (November & Desember):
    // TIDAK boleh minus target penuh (-345.000) dan TIDAK boleh 0%
    expect(baris[10].bulan).toBe(11);
    expect(baris[10].realisasiM3).toBeNull();
    expect(baris[10].capaianM3Persen).toBeNull();
    expect(baris[10].selisihM3).toBeNull();
    expect(baris[10].lps).toBeNull();

    // Baris CAPAIAN:
    // CAPAIAN (YTD) = Realisasi YTD / Target YTD ≈ 97.7%
    expect(ringkasan.capaianM3YtdPersen).toBe(97.7);

    // CAPAIAN (Tahunan) = Realisasi YTD / Target Tahunan (12 bulan) ≈ 81.37% (~81%)
    expect(ringkasan.capaianM3TahunanPersen).toBeGreaterThan(80);
    expect(ringkasan.capaianM3TahunanPersen).toBeLessThan(82);

    // JUMLAH Selisih M³ YTD = Realisasi YTD - Target YTD
    expect(ringkasan.selisihM3Ytd).toBe(-79195);
  });

  it('6. Siklus Utuh prosesHitungCapaian menghasilkan payload lengkap dan 5 grafik', () => {
    const result = prosesHitungCapaian('5', 2026, fixtureTarget, fixtureRealisasi);

    expect(result.wilayahId).toBe('5');
    expect(result.tahun).toBe(2026);
    expect(result.tabelProgres.baris.length).toBe(13);
    expect(result.tabelTargetRealisasi.baris.length).toBe(12);

    // 5 Visualisasi Grafik
    expect(result.grafik.targetVsRealisasiM3.length).toBe(12);
    expect(result.grafik.targetVsRealisasiM3PerSl.length).toBe(12);
    expect(result.grafik.slTargetVsRealisasi.length).toBe(12);
    expect(result.grafik.deltaM3.length).toBe(12);
    expect(result.grafik.m3PerSlPerHari.length).toBe(13);
  });
});
