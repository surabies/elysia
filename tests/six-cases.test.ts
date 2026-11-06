import { describe, it, expect } from 'bun:test';
import {
  hitungRincianHargaAir,
  usulkanPemakaianTagih,
  hitungTotalTagihan,
  type HargaBlok,
} from '../apps/web/src/server/domain/tagihan/tagihan.engine';
import {
  hitungTaksasi,
  hitungRollover,
  PEMAKAIAN_MINIMUM_PERDIR,
} from '../apps/web/src/server/domain/taksasi/taksasi.engine';
import {
  periksaJendelaLaporMandiri,
  evaluasiGeofenceMandiri,
} from '../apps/web/src/server/domain/mandiri/mandiri.engine';
import {
  hitungKubikasiGantiMeter,
} from '../apps/web/src/server/domain/gwm/gwm.engine';
import {
  evaluasiPemakaianMeter,
} from '../apps/web/src/server/domain/cater/cater-anomali.engine';
import { caterBacaMeter } from '@cater/db';

describe('Verifikasi Ketahanan 6 Kasus Kritis Bisnis PDAM', () => {
  // Master Tarif Contoh 2A2
  const blok2A2: HargaBlok[] = [
    { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2600 },
    { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 4200 },
    { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 6800 },
    { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 9200 },
  ];

  // -------------------------------------------------------------------------
  // KASUS 1: Taksasi Kondisi / Ket Catat (DK, RK, BMB, MATI, TTB, MTA)
  // -------------------------------------------------------------------------
  describe('Kasus 1: Taksasi Kondisi / Keterangan Catat Kelainan', () => {
    it('1.1. Kondisi DK (Pagar Dikunci / 2): Harus menaksir dari riwayat bulan lalu', () => {
      const usulan = usulkanPemakaianTagih({
        pemakaianRiil: 0,
        kondisi: '2', // DK
        pemakaianLalu: 22,
      });
      expect(usulan.pemakaianTagih).toBe(22);
      expect(usulan.alasan).toBe('TAKSIRAN_BULAN_LALU');

      // Tagihan dari pemakaian taksiran 22 m3
      const tagihan = hitungRincianHargaAir(usulan.pemakaianTagih, blok2A2);
      // 10x2600 (26.000) + 10x4200 (42.000) + 2x6800 (13.600) = 81.600
      expect(tagihan.total).toBe(81600);
    });

    it('1.2. Kondisi RK (Rumah Kosong / R): Jika riwayat lalu < 5 m3, tetap kena minimum 5 m3', () => {
      const usulan = usulkanPemakaianTagih({
        pemakaianRiil: 0,
        kondisi: 'R', // RUMAH KOSONG
        pemakaianLalu: 2,
      });
      expect(usulan.pemakaianTagih).toBe(PEMAKAIAN_MINIMUM_PERDIR);
      expect(usulan.alasan).toBe('TAKSIRAN_BULAN_LALU');
    });

    it('1.3. Kondisi MATI ADA AIR (7): Ditaksir lewat metode 3-Tertinggi bila ada histori', () => {
      const riwayat = [
        { id: '1', periode: '2026-04-01T00:00:00Z', pemakaianM3: 24 },
        { id: '2', periode: '2026-03-01T00:00:00Z', pemakaianM3: 28 },
        { id: '3', periode: '2026-02-01T00:00:00Z', pemakaianM3: 20 },
      ];
      const taksasi = hitungTaksasi(riwayat, '2026-05-01T00:00:00Z', {
        id: 'std',
        periode: '2026-04-01T00:00:00Z',
        standAkhir: 850,
      });
      // Rata-rata: (28 + 24 + 20) / 3 = 24 m3
      expect(taksasi.pemakaian).toBe(24);
      expect(taksasi.metode).toBe('TIGA_TERTINGGI');
    });
  });

  // -------------------------------------------------------------------------
  // KASUS 2: Stand Revisi (P - REV.PENCATAT & Audit Trail)
  // -------------------------------------------------------------------------
  describe('Kasus 2: Stand Revisi Petugas & Koreksi Administratif', () => {
    it('2.1. Skema caterBacaMeter mendukung kolom pakaiTagih dan alasanTaksir', () => {
      expect(caterBacaMeter.pakaiTagih).toBeDefined();
      expect(caterBacaMeter.alasanTaksir).toBeDefined();
      expect(caterBacaMeter.waterMeterMutasiId).toBeDefined();
    });

    it('2.2. Revisi angka meter menghasilkan pemakaian dan tagihan baru yang terhitung ulang', () => {
      // Stand awal salah catat: stml = 100, stma = 110 (pakai 10 m3)
      // Direvisi oleh verifikator menjadi: stma = 125 (pakai 25 m3)
      const stml = 100;
      const stmaRevisi = 125;
      const pakaiRevisi = stmaRevisi - stml;

      expect(pakaiRevisi).toBe(25);
      const tagihanRevisi = hitungRincianHargaAir(pakaiRevisi, blok2A2);
      // 10x2600 + 10x4200 + 5x6800 = 26.000 + 42.000 + 34.000 = 102.000
      expect(tagihanRevisi.total).toBe(102000);
    });
  });

  // -------------------------------------------------------------------------
  // KASUS 3: Stand Meter Baru atau Angkat (MB / GWM Mutasi)
  // -------------------------------------------------------------------------
  describe('Kasus 3: Stand Meter Baru & Angkat (MB / GWM)', () => {
    it('3.1. Rumus Ganti Meter menggabungkan kubikasi meter lama dan meter baru', () => {
      // Meter lama: lalu 1200, dicabut pada stand 1215 -> pakai lama = 15 m3
      // Meter baru: pasang 0, dibaca cater akhir bulan = 12 -> pakai baru = 12 m3
      // Total tagihan = 27 m3
      const mutasi = hitungKubikasiGantiMeter({
        standLalu: 1200,
        standAngkat: 1215,
        standPasang: 0,
        standBacaBaru: 12,
      });

      expect(mutasi.isValid).toBe(true);
      expect(mutasi.pakaiMeterLama).toBe(15);
      expect(mutasi.pakaiMeterBaru).toBe(12);
      expect(mutasi.totalPemakaianM3).toBe(27);
    });

    it('3.2. Meter baru dengan stand awal bawaan pabrik bukan 0 (misal pasang 0005 m3)', () => {
      const mutasi = hitungKubikasiGantiMeter({
        standLalu: 500,
        standAngkat: 510, // 10 m3
        standPasang: 5,   // bawaan pabrik 5
        standBacaBaru: 20,// 20 - 5 = 15 m3
      });

      expect(mutasi.isValid).toBe(true);
      expect(mutasi.pakaiMeterLama).toBe(10);
      expect(mutasi.pakaiMeterBaru).toBe(15);
      expect(mutasi.totalPemakaianM3).toBe(25);
    });
  });

  // -------------------------------------------------------------------------
  // KASUS 4: Stand Meter PBPK (Pasangan Baru & Pembukaan Kembali)
  // -------------------------------------------------------------------------
  describe('Kasus 4: Stand Meter PBPK (Pasang Baru & Pembukaan Kembali)', () => {
    it('4.1. Pasang Baru (PB) pertama kali dibaca: stml = 0, stma = 14 -> pakai 14 m3', () => {
      const evalPb = evaluasiPemakaianMeter({ stml: 0, stma: 14 });
      expect(evalPb.pakaiM3).toBe(14);
      expect(evalPb.isAnomali).toBe(false);
      expect(evalPb.statusVerifikasi).toBe('SUBMITTED');
    });

    it('4.2. Pasang Baru dengan pemakaian di bawah 5 m3 tetap ditagih minimum 5 m3', () => {
      const usulan = usulkanPemakaianTagih({
        pemakaianRiil: 3,
        kondisi: 'Normal',
        pemakaianLalu: null,
      });
      expect(usulan.pemakaianTagih).toBe(5);
      expect(usulan.alasan).toBe('MINIMUM_5M3');
    });
  });

  // -------------------------------------------------------------------------
  // KASUS 5: Stand Minus dan 0 (Nol)
  // -------------------------------------------------------------------------
  describe('Kasus 5: Penanganan Stand Minus dan Stand 0', () => {
    it('5.1. Stand Minus akibat Rollover (9985 -> 0015) harus terdeteksi dan dihitung 30 m3', () => {
      const rollover = hitungRollover(9985, 15, 4);
      expect(rollover.isRollover).toBe(true);
      expect(rollover.pemakaianM3).toBe(30);
    });

    it('5.2. Stand Minus akibat meter mundur/human error harus ditandai ANOMALY_NEGATIVE', () => {
      const evalMinus = evaluasiPemakaianMeter({ stml: 350, stma: 320 });
      expect(evalMinus.isAnomali).toBe(true);
      expect(evalMinus.statusVerifikasi).toBe('ANOMALY_NEGATIVE');
    });

    it('5.3. Stand 0 pada kondisi 8 (TIDAK ADA AIR) bebas tagihan air (0 m3)', () => {
      const usulan = usulkanPemakaianTagih({
        pemakaianRiil: 0,
        kondisi: '8', // TIDAK ADA AIR
        pemakaianLalu: 20,
      });
      expect(usulan.pemakaianTagih).toBe(0);
      expect(usulan.alasan).toBe('NOL_TIDAK_ADA_AIR');

      // Tagihan air Rp 0, hanya membayar beban tetap
      const total = hitungTotalTagihan({
        jmlHargaAir: 0,
        beaBeban: 15000,
        beaAdmin: 5000,
        airKotor: 0,
      });
      expect(total).toBe(20000);
    });
  });

  // -------------------------------------------------------------------------
  // KASUS 6: Stand Mandiri (Self-Reading Warga)
  // -------------------------------------------------------------------------
  describe('Kasus 6: Stand Mandiri Pelanggan (WIB & Geofence PostGIS)', () => {
    it('6.1. Pelaporan mandiri wajib pada jendela 1-25 WIB', () => {
      // 10 Agustus 2026 pukul 10:00 WIB
      const waktuValid = new Date('2026-08-10T03:00:00Z');
      const jendela = periksaJendelaLaporMandiri(waktuValid);
      expect(jendela.boleh).toBe(true);
      expect(jendela.sisaHari).toBe(15);
    });

    it('6.2. Foto meter mandiri harus berada dalam radius <= 50 meter dari titik rumah', () => {
      const geoValid = evaluasiGeofenceMandiri(24.5);
      expect(geoValid.isLokasiValid).toBe(true);

      const geoJauh = evaluasiGeofenceMandiri(85);
      expect(geoJauh.isLokasiValid).toBe(false);
      expect(geoJauh.peringatan).toContain('85 meter');
    });
  });
});
