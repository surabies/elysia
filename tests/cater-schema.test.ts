import { describe, it, expect } from 'bun:test';
import {
  pelanggan,
  caterBacaMeter,
  wilayahAdministrasi,
  kecamatan,
  kelurahan,
  ruteCater,
  petugasCater,
  golonganTarif,
  waterMeter,
  rekeningDrd,
} from '@cater/db';

describe('Modular Cater Drizzle Schema Integrity', () => {
  it('should export all 6 modular Cater tables from @cater/db', () => {
    expect(pelanggan).toBeDefined();
    expect(caterBacaMeter).toBeDefined();
    expect(wilayahAdministrasi).toBeDefined();
    expect(kecamatan).toBeDefined();
    expect(kelurahan).toBeDefined();
    expect(ruteCater).toBeDefined();
    expect(petugasCater).toBeDefined();
    expect(golonganTarif).toBeDefined();
    expect(waterMeter).toBeDefined();
    expect(rekeningDrd).toBeDefined();
  });

  it('pelanggan table should have required STI columns', () => {
    expect(pelanggan.nolg).toBeDefined();
    expect(pelanggan.nprs).toBeDefined();
    expect(pelanggan.nama).toBeDefined();
    expect(pelanggan.alamat).toBeDefined();
    expect(pelanggan.titikLokasi).toBeDefined();
    expect(pelanggan.tarifKode).toBeDefined();
    expect(pelanggan.ruteKode).toBeDefined();
  });

  it('caterBacaMeter table should have meter reading and spatial verification columns', () => {
    expect(caterBacaMeter.thbl).toBeDefined();
    expect(caterBacaMeter.stml).toBeDefined();
    expect(caterBacaMeter.stma).toBeDefined();
    expect(caterBacaMeter.pakaiM3).toBeDefined();
    expect(caterBacaMeter.lokasiGps).toBeDefined();
    expect(caterBacaMeter.jarakPelangganMeter).toBeDefined();
    expect(caterBacaMeter.statusVerifikasi).toBeDefined();
  });

  it('rekeningDrd table should have financial billing columns', () => {
    expect(rekeningDrd.thbl).toBeDefined();
    expect(rekeningDrd.jmlHargaAir).toBeDefined();
    expect(rekeningDrd.totalTagihan).toBeDefined();
    expect(rekeningDrd.tagNunggak).toBeDefined();
    expect(rekeningDrd.statusLunas).toBeDefined();
  });
});
