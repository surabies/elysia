import { describe, it, expect } from 'bun:test';
import {
  hitungRincianHargaAir,
  hitungHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  usulkanPemakaianTagih,
  type HargaBlok,
} from './tagihan.engine';

describe('Domain Engine: Tagihan & Tarif Progresif', () => {
  // Simulasi Tarif Golongan 2A3 Tirtawening
  const blok2A3: HargaBlok[] = [
    { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 3120 },
    { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 5520 },
    { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 8880 },
    { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 11400 },
  ];

  it('1. Pemakaian 0 m3 harus menghasilkan harga air Rp 0', () => {
    const res = hitungRincianHargaAir(0, blok2A3);
    expect(res.total).toBe(0);
    expect(res.rincian.length).toBe(0);
  });

  it('2. Pemakaian 10 m3 (Blok 1 penuh): 10 x 3.120 = 31.200', () => {
    const res = hitungRincianHargaAir(10, blok2A3);
    expect(res.total).toBe(31200);
    expect(res.rincian.length).toBe(1);
    expect(res.rincian[0]!.volumeM3).toBe(10);
    expect(res.rincian[0]!.subtotal).toBe(31200);
  });

  it('3. Pemakaian 21 m3 (Lintas 3 blok): 10x3.120 + 10x5.520 + 1x8.880 = 95.280', () => {
    const res = hitungRincianHargaAir(21, blok2A3);
    // 31.200 + 55.200 + 8.880 = 95.280
    expect(res.total).toBe(95280);
    expect(res.rincian.length).toBe(3);
    expect(res.rincian[0]!.volumeM3).toBe(10);
    expect(res.rincian[1]!.volumeM3).toBe(10);
    expect(res.rincian[2]!.volumeM3).toBe(1);
    expect(res.rincian[2]!.subtotal).toBe(8880);
  });

  it('4. hitungHargaAir harus mengembalikan total yang identik', () => {
    expect(hitungHargaAir(21, blok2A3)).toBe(95280);
  });

  it('5. tentukanBlok harus menentukan blok tertinggi secara tepat', () => {
    expect(tentukanBlok(0)).toBe(1);
    expect(tentukanBlok(5)).toBe(1);
    expect(tentukanBlok(10)).toBe(1);
    expect(tentukanBlok(15)).toBe(2);
    expect(tentukanBlok(20)).toBe(2);
    expect(tentukanBlok(25)).toBe(3);
    expect(tentukanBlok(30)).toBe(3);
    expect(tentukanBlok(35)).toBe(4);
  });

  it('6. hitungTotalTagihan menjumlahkan seluruh komponen rekening', () => {
    const total = hitungTotalTagihan({
      jmlHargaAir: 95280,
      beaBeban: 15000,
      beaAdmin: 5000,
      airKotor: 8000,
      lainLain: 2000,
    });
    expect(total).toBe(125280);
  });

  it('7. usulkanPemakaianTagih harus menerapkan batas minimum Perdir 5 m3', () => {
    const res = usulkanPemakaianTagih({
      pemakaianRiil: 2,
      kondisi: 'Normal',
      pemakaianLalu: 15,
    });
    expect(res.pemakaianTagih).toBe(5);
    expect(res.alasan).toBe('MINIMUM_5M3');
  });

  it('8. usulkanPemakaianTagih kondisi tidak ada air / cabut meter harus 0 m3', () => {
    const res = usulkanPemakaianTagih({
      pemakaianRiil: 0,
      kondisi: '8', // TIDAK ADA AIR
      pemakaianLalu: 15,
    });
    expect(res.pemakaianTagih).toBe(0);
    expect(res.alasan).toBe('NOL_TIDAK_ADA_AIR');
  });

  it('9. usulkanPemakaianTagih kondisi taksir (DK / 2) harus mengambil pemakaian lalu', () => {
    const res = usulkanPemakaianTagih({
      pemakaianRiil: 0,
      kondisi: '2', // DK
      pemakaianLalu: 18,
    });
    expect(res.pemakaianTagih).toBe(18);
    expect(res.alasan).toBe('TAKSIRAN_BULAN_LALU');
  });
});
