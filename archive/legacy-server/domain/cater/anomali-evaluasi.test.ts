import { describe, expect, it } from 'bun:test';
import {
  evaluasiAnomaliBaris,
  hitungRataHistoris,
  normalisasiTmss,
  type ReadingInput,
  type RuleDefinition,
  type KondisiMapItem,
} from './anomali-evaluator';
import { DEFAULT_ATURAN_ANOMALI } from '../../../../../../packages/db/src/seeds/modules/10-anomali';

// Mock Kondisi Map SSOT sesuai Data Seed
const MOCK_KONDISI_MAP: KondisiMapItem[] = [
  // 1. Kerusakan Fisik -> ANOM_KERUSAKAN_METER
  { kodeTmss: '3', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: '6', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: '7', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: '9', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: 'D', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: 'F', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: 'O', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: 'T', aturanAnomaliId: 'aturan-kerusakan-meter', aturanKode: 'ANOM_KERUSAKAN_METER', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  
  // 2. Kendala Akses & Teknis -> WARN_KENDALA_AKSES
  { kodeTmss: '2', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: '5', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: '8', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: 'AA', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: 'E', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: 'N', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: 'Q', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: 'R', aturanAnomaliId: 'aturan-kendala-akses', aturanKode: 'WARN_KENDALA_AKSES', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },

  // 3. TMSS 8 dipetakan ke aturan mendadak & berkepanjangan
  { kodeTmss: '8', aturanAnomaliId: 'aturan-tidak-ada-air-mendadak', aturanKode: 'ANOM_TIDAK_ADA_AIR_MENDADAK', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },
  { kodeTmss: '8', aturanAnomaliId: 'aturan-tidak-ada-air-berkepanjangan', aturanKode: 'ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN', isBaselineNormal: false, isPeriodeTidakAktif: true, aktif: true },

  // 4. Baseline Normal untuk kategori TERBACA (H dikecualikan di data)
  { kodeTmss: '-', aturanAnomaliId: 'aturan-deviasi-ring1', aturanKode: 'WARN_DEVIASI_RING1', isBaselineNormal: true, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: '', aturanAnomaliId: 'aturan-deviasi-ring1', aturanKode: 'WARN_DEVIASI_RING1', isBaselineNormal: true, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: '0', aturanAnomaliId: 'aturan-deviasi-ring1', aturanKode: 'WARN_DEVIASI_RING1', isBaselineNormal: true, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: '4', aturanAnomaliId: 'aturan-deviasi-ring1', aturanKode: 'WARN_DEVIASI_RING1', isBaselineNormal: true, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: 'P', aturanAnomaliId: 'aturan-deviasi-ring1', aturanKode: 'WARN_DEVIASI_RING1', isBaselineNormal: true, isPeriodeTidakAktif: false, aktif: true },
  { kodeTmss: 'H', aturanAnomaliId: 'aturan-deviasi-ring1', aturanKode: 'WARN_DEVIASI_RING1', isBaselineNormal: false, isPeriodeTidakAktif: false, aktif: true },
];

const RULES: RuleDefinition[] = DEFAULT_ATURAN_ANOMALI as any;

describe('Engine Evaluasi Anomali SSOT Terpusat (Tanpa Hardcode)', () => {
  it('1. Mendadak: 30 m³ lalu normal, sekarang 0 m³ dengan kode TMSS 8 memicu ANOM_TIDAK_ADA_AIR_MENDADAK', () => {
    const input: ReadingInput = {
      stml: 500,
      stma: 500,
      pakaiM3: 0,
      pakaiLalu: 30,
      kodeTmss: '8',
      prevKondisiTmss: '-', // Normal
      prevPakaiM3: 30,
    };

    const res = evaluasiAnomaliBaris(input, RULES, MOCK_KONDISI_MAP, 1);
    expect(res.isAnomali).toBe(true);
    expect(res.kodeUtama).toBe('ANOM_TIDAK_ADA_AIR_MENDADAK');
    expect(res.kodeList).toContain('ANOM_TIDAK_ADA_AIR_MENDADAK');
    expect(res.kodeList).toContain('WARN_KENDALA_AKSES');
  });

  it('2. Berlanjut: Periode lalu juga kode 8 (pemakaian 0 m³) hanya menghasilkan peringatan WARN_KENDALA_AKSES', () => {
    const input: ReadingInput = {
      stml: 500,
      stma: 500,
      pakaiM3: 0,
      pakaiLalu: 0,
      kodeTmss: '8',
      prevKondisiTmss: '8', // Berlanjut
      prevPakaiM3: 0,
    };

    const res = evaluasiAnomaliBaris(input, RULES, MOCK_KONDISI_MAP, 1);
    expect(res.isAnomali).toBe(false);
    expect(res.kodeUtama).toBe('WARN_KENDALA_AKSES');
    expect(res.kodeList).not.toContain('ANOM_PEMAKAIAN_NOL');
    expect(res.kodeList).not.toContain('ANOM_TIDAK_ADA_AIR_MENDADAK');
  });

  it('3. Berkepanjangan: Kode 8 berturut-turut >= N periode (N=3 dan N=4)', () => {
    // Kasus N=3
    const inputN3: ReadingInput = {
      stml: 500,
      stma: 500,
      pakaiM3: 0,
      pakaiLalu: 0,
      kodeTmss: '8',
      prevKondisiTmss: '8',
      prevPakaiM3: 0,
      riwayatPeriode: [
        { thbl: '202610', pakaiM3: 0, kodeTmss: '8' },
        { thbl: '202609', pakaiM3: 0, kodeTmss: '8' },
        { thbl: '202608', pakaiM3: 0, kodeTmss: '8' },
      ],
    };

    const resN3 = evaluasiAnomaliBaris(inputN3, RULES, MOCK_KONDISI_MAP, 1);
    expect(resN3.isAnomali).toBe(true);
    expect(resN3.kodeUtama).toBe('ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN');

    // Kasus N=4 dengan aturan kustom targetN=4
    const rulesN4 = RULES.map((r) =>
      r.kode === 'ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN' ? { ...r, syaratPeriodeBerturut: 4 } : r
    );

    // Riwayat hanya 3 periode (kurang dari N=4) -> tidak memicu
    const resKurang = evaluasiAnomaliBaris(inputN3, rulesN4, MOCK_KONDISI_MAP, 1);
    expect(resKurang.isAnomali).toBe(false);

    // Riwayat 4 periode -> memicu
    const inputN4: ReadingInput = {
      ...inputN3,
      riwayatPeriode: [
        { thbl: '202610', pakaiM3: 0, kodeTmss: '8' },
        { thbl: '202609', pakaiM3: 0, kodeTmss: '8' },
        { thbl: '202608', pakaiM3: 0, kodeTmss: '8' },
        { thbl: '202607', pakaiM3: 0, kodeTmss: '8' },
      ],
    };
    const resN4 = evaluasiAnomaliBaris(inputN4, rulesN4, MOCK_KONDISI_MAP, 1);
    expect(resN4.isAnomali).toBe(true);
    expect(resN4.kodeUtama).toBe('ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN');
  });

  it('4. Riwayat di bawah ambang (< 10 m³): Normal lalu 5 m³, sekarang 0 m³ kode 8 tidak memicu mendadak', () => {
    const input: ReadingInput = {
      stml: 100,
      stma: 100,
      pakaiM3: 0,
      pakaiLalu: 5,
      kodeTmss: '8',
      prevKondisiTmss: '-',
      prevPakaiM3: 5, // Di bawah ambang 10 m³
    };

    const res = evaluasiAnomaliBaris(input, RULES, MOCK_KONDISI_MAP, 1);
    expect(res.isAnomali).toBe(false);
    expect(res.kodeUtama).toBe('WARN_KENDALA_AKSES');
  });

  it('5. Pelanggan H dan R: Dikecualikan dari baseline normal lewat data flag isBaselineNormal', () => {
    const inputH: ReadingInput = {
      stml: 200,
      stma: 200,
      pakaiM3: 0,
      pakaiLalu: 15,
      kodeTmss: '8',
      prevKondisiTmss: 'H', // H tidak memiliki flag isBaselineNormal
      prevPakaiM3: 15,
    };

    const resH = evaluasiAnomaliBaris(inputH, RULES, MOCK_KONDISI_MAP, 1);
    expect(resH.isAnomali).toBe(false);
    expect(resH.kodeUtama).toBe('WARN_KENDALA_AKSES');
  });

  it('6. Meter Mundur pada Kode 8: stma < stml tetap memicu ANOM_METER_MUNDUR (kesalahan data)', () => {
    const input: ReadingInput = {
      stml: 945,
      stma: 545, // stma < stml
      pakaiM3: 0,
      pakaiLalu: 0,
      kodeTmss: '8',
      prevKondisiTmss: '8',
      prevPakaiM3: 0,
    };

    const res = evaluasiAnomaliBaris(input, RULES, MOCK_KONDISI_MAP, 1);
    expect(res.isAnomali).toBe(true);
    expect(res.kodeUtama).toBe('ANOM_METER_MUNDUR');
    expect(res.kodeList).toContain('ANOM_METER_MUNDUR');
  });

  it('7. Uji Batas Nilai Aturan: Lonjakan absolut > 75 m³ strictly greater than', () => {
    const res75 = evaluasiAnomaliBaris(
      { stml: 10, stma: 85, pakaiM3: 75, pakaiLalu: 70, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res75.kodeList).not.toContain('ANOM_LONJAKAN_M3');

    const res76 = evaluasiAnomaliBaris(
      { stml: 10, stma: 86, pakaiM3: 76, pakaiLalu: 70, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res76.kodeList).toContain('ANOM_LONJAKAN_M3');
  });

  it('8. Uji Batas Nilai Aturan: Lonjakan Relatif (≥100% dan selisih ≥30 m³)', () => {
    // Kasus 1: Selisih 29 m³ (kurang dari 30 m³) meskipun kenaikan > 100%
    const resSelisih29 = evaluasiAnomaliBaris(
      { stml: 0, stma: 54, pakaiM3: 54, pakaiLalu: 25, kodeTmss: '-' }, // kenaikan 116%, selisih 29
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(resSelisih29.kodeList).not.toContain('ANOM_LONJAKAN_PERSEN');

    // Kasus 2: Kenaikan 99% (kurang dari 100%) meskipun selisih >= 30 m³
    const resPersen99 = evaluasiAnomaliBaris(
      { stml: 0, stma: 79, pakaiM3: 79, pakaiLalu: 40, kodeTmss: '-' }, // selisih 39, persen 97.5%
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(resPersen99.kodeList).not.toContain('ANOM_LONJAKAN_PERSEN');

    // Kasus 3: Kenaikan tepat 100% dan selisih tepat 30 m³ (30 -> 60)
    const resTepat100 = evaluasiAnomaliBaris(
      { stml: 0, stma: 60, pakaiM3: 60, pakaiLalu: 30, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(resTepat100.kodeList).toContain('ANOM_LONJAKAN_PERSEN');
  });

  it('9. Uji Batas Nilai Aturan: Deviasi Ring 1 (30% s.d. 50%), Ring 2 (50% s.d. 80%), Ring 3 (>80%)', () => {
    const acuan = 50;

    // 29% deviasi (50 -> 64.5 m³): Tidak masuk deviasi apa pun
    const res29 = evaluasiAnomaliBaris(
      { stml: 0, stma: 64, pakaiM3: 64, pakaiLalu: acuan, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res29.kodeList).not.toContain('WARN_DEVIASI_RING1');
    expect(res29.isAnomali).toBe(false);

    // Tepat 30% deviasi (50 -> 65 m³): Masuk Ring 1 (Peringatan)
    const res30 = evaluasiAnomaliBaris(
      { stml: 0, stma: 65, pakaiM3: 65, pakaiLalu: acuan, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res30.kodeList).toContain('WARN_DEVIASI_RING1');
    expect(res30.isAnomali).toBe(false);

    // Tepat 50% deviasi (50 -> 75 m³): Masuk Ring 2 (Anomali Supervisor)
    const res50 = evaluasiAnomaliBaris(
      { stml: 0, stma: 75, pakaiM3: 75, pakaiLalu: acuan, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res50.kodeList).toContain('ANOM_DEVIASI_RING2');
    expect(res50.isAnomali).toBe(true);

    // Tepat 80% deviasi (30 -> 54 m³): Masuk Ring 2 (karena maxPersen: 80)
    const res80 = evaluasiAnomaliBaris(
      { stml: 0, stma: 54, pakaiM3: 54, pakaiLalu: 30, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res80.kodeList).toContain('ANOM_DEVIASI_RING2');

    // 83% deviasi (30 -> 55 m³, < 75 m³): Masuk Ring 3 (Ekstrim > 80%)
    const res81 = evaluasiAnomaliBaris(
      { stml: 0, stma: 55, pakaiM3: 55, pakaiLalu: 30, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res81.kodeList).toContain('ANOM_DEVIASI_RING3');
    expect(res81.kodeUtama).toBe('ANOM_DEVIASI_RING3');
  });

  it('10. Uji Batas Nilai Aturan: Penurunan Drastis (≥50% & Lalu ≥10 m³)', () => {
    // Acuan 20 m³, turun ke 11 m³ (turun 45%): Tidak memicu penurunan drastis
    const res45 = evaluasiAnomaliBaris(
      { stml: 0, stma: 11, pakaiM3: 11, pakaiLalu: 20, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res45.kodeList).not.toContain('ANOM_PENURUNAN_PERSEN');

    // Acuan 20 m³, turun ke 10 m³ (tepat turun 50%): Memicu ANOM_PENURUNAN_PERSEN
    const res50 = evaluasiAnomaliBaris(
      { stml: 0, stma: 10, pakaiM3: 10, pakaiLalu: 20, kodeTmss: '-' },
      RULES,
      MOCK_KONDISI_MAP,
      1
    );
    expect(res50.kodeList).toContain('ANOM_PENURUNAN_PERSEN');
  });

  it('11. Fallback RATA_HISTORIS: Mengabaikan periode TMSS 8 dengan pemakaian 0 m³', () => {
    const riwayat = [
      { pakaiM3: 30, kodeTmss: '-' }, // Aktif
      { pakaiM3: 0, kodeTmss: '8' },  // Tidak Aktif (diabaikan)
      { pakaiM3: 20, kodeTmss: '-' }, // Aktif
    ];

    const mapByKode = new Map<string, KondisiMapItem[]>();
    for (const m of MOCK_KONDISI_MAP) {
      const key = normalisasiTmss(m.kodeTmss);
      const list = mapByKode.get(key) || [];
      list.push(m);
      mapByKode.set(key, list);
    }

    const avg = hitungRataHistoris(riwayat, mapByKode);
    // (30 + 20) / 2 = 25 (Bukan (30 + 0 + 20) / 3 = 16.67)
    expect(avg).toBe(25);
  });

  it('12. Prioritas kode_anomali_utama dibaca urutan ASC dari aturan', () => {
    const input: ReadingInput = {
      stml: 200,
      stma: 100, // Mundur (urutan 1)
      pakaiM3: 100, // > 75 (urutan 2)
      pakaiLalu: 20,
      kodeTmss: '-',
    };

    const res = evaluasiAnomaliBaris(input, RULES, MOCK_KONDISI_MAP, 1);
    expect(res.kodeUtama).toBe('ANOM_METER_MUNDUR');
    expect(res.kodeList).toContain('ANOM_METER_MUNDUR');
    expect(res.kodeList).toContain('ANOM_LONJAKAN_M3');
  });

  it('13. Kegagalan Aman: Melempar galat eksplisit jika aturan kosong atau tidak ada yang aktif (mencegah false-normal)', () => {
    const input: ReadingInput = {
      stml: 100,
      stma: 120,
      pakaiM3: 20,
      pakaiLalu: 20,
      kodeTmss: '-',
    };

    // Kasus A: Array aturan kosong
    expect(() => {
      evaluasiAnomaliBaris(input, [], MOCK_KONDISI_MAP, 1);
    }).toThrow('EVALUATOR_ERROR: Tidak ada aturan anomali yang aktif');

    // Kasus B: Seluruh aturan dinonaktifkan (aktif: false)
    const inactiveRules = RULES.map((r) => ({ ...r, aktif: false }));
    expect(() => {
      evaluasiAnomaliBaris(input, inactiveRules, MOCK_KONDISI_MAP, 1);
    }).toThrow('EVALUATOR_ERROR: Tidak ada aturan anomali yang aktif');
  });

  it('14. Uji Nilai Batas Syarat Pemakaian Lalu Minimum (4, 5, dan 6 m³) pada Deviasi', () => {
    // Syarat Deviasi Ring 2 & Ring 3: syarat_pakai_lalu_min_m3 = 5 (Operator >=)
    
    // Kasus 1: Pemakaian aktif = 1 m³
    // A. Nilai Batas Bawah: pakaiLalu = 4 m³ (Di bawah ambang 5 m³) -> Harus DIABAIKAN (Normal)
    const input4: ReadingInput = {
      stml: 100,
      stma: 101,
      pakaiM3: 1,
      pakaiLalu: 4, // Deviasi -75%, namun acuan 4 < 5 m³
      kodeTmss: '-',
    };
    const res4 = evaluasiAnomaliBaris(input4, RULES, MOCK_KONDISI_MAP, 1);
    expect(res4.isAnomali).toBe(false);
    expect(res4.kodeUtama).toBeNull();

    // B. Nilai Ambang Tepat: pakaiLalu = 5 m³ (Tepat di batas ambang >= 5 m³)
    // Deviasi: |1 - 5| / 5 = 80%. Pada batas 80%, masuk ke Ring 2 (50% s.d. 80%)
    const input5: ReadingInput = {
      stml: 100,
      stma: 101,
      pakaiM3: 1,
      pakaiLalu: 5,
      kodeTmss: '-',
    };
    const res5 = evaluasiAnomaliBaris(input5, RULES, MOCK_KONDISI_MAP, 1);
    expect(res5.isAnomali).toBe(true);
    expect(res5.kodeUtama).toBe('ANOM_DEVIASI_RING2');

    // C. Nilai Batas Atas: pakaiLalu = 6 m³ (Di atas ambang >= 5 m³)
    // Deviasi: |1 - 6| / 6 = 83.33% (> 80%). Harus memicu Ring 3 (Ekstrim)
    const input6: ReadingInput = {
      stml: 100,
      stma: 101,
      pakaiM3: 1,
      pakaiLalu: 6,
      kodeTmss: '-',
    };
    const res6 = evaluasiAnomaliBaris(input6, RULES, MOCK_KONDISI_MAP, 1);
    expect(res6.isAnomali).toBe(true);
    expect(res6.kodeUtama).toBe('ANOM_DEVIASI_RING3');

    // Kasus 2: Pemakaian 0 m³ (stma === stml) dengan riwayat 5 m³
    // Karena pakaiM3 === 0, aturan deviasi dilewati (guard pakaiM3 > 0).
    // Diteruskan ke aturan pemakaian nol yang mengecualikan jika pakai_lalu < 10 m³, sehingga tetap Normal.
    const input0: ReadingInput = {
      stml: 100,
      stma: 100,
      pakaiM3: 0,
      pakaiLalu: 5,
      kodeTmss: '-',
    };
    const res0 = evaluasiAnomaliBaris(input0, RULES, MOCK_KONDISI_MAP, 1);
    expect(res0.isAnomali).toBe(false);
    expect(res0.kodeUtama).toBeNull();
  });

  it('15. Pergantian Meter Baru (MB / kode TMSS 4): stma < stml tidak memicu ANOM_METER_MUNDUR', () => {
    // Pada meter baru, meter lama dicabut (misal stand 837) dan meter baru dipasang mulai dari 0.
    // Stand catat baru terbaca 5 m³ (stma 5 < stml 837).
    const inputMb: ReadingInput = {
      stml: 837,
      stma: 5,
      pakaiM3: 5,
      pakaiLalu: 10,
      kodeTmss: '4',
    };
    const resMb = evaluasiAnomaliBaris(inputMb, RULES, MOCK_KONDISI_MAP, 1);
    expect(resMb.kodeUtama).not.toBe('ANOM_METER_MUNDUR');
    expect(resMb.kodeList).not.toContain('ANOM_METER_MUNDUR');
  });
});
