import { describe, test, expect, mock } from 'bun:test';

mock.module('server-only', () => ({}));

import {
  pengaturanService,
  DEFAULT_PROFIL_PERUSAHAAN,
  DEFAULT_KONTAK_LAYANAN,
  DEFAULT_SYARAT_PASANG_BARU,
  DEFAULT_CARA_PEMBAYARAN,
  DEFAULT_STRUKTUR_TARIF,
  DEFAULT_BERITA_PENGUMUMAN,
  DEFAULT_INFO_GANGGUAN,
} from '../apps/web/src/server/services/pengaturan/pengaturan.service';
import { GET as getWilayahCakupan } from '../apps/web/src/app/api/public/wilayah-cakupan/route';
import { GET as getPengaturanPublik } from '../apps/web/src/app/api/public/pengaturan/route';

describe('Pengaturan CMS Dinamis & Cakupan Wilayah Pelayanan 5 (PW5)', () => {
  test('1. PengaturanService exposes default configs for all enterprise modules', async () => {
    const profil = await pengaturanService.getPengaturan(
      'profil_perusahaan',
      DEFAULT_PROFIL_PERUSAHAAN
    );
    expect(profil.nama).toBe('PERUMDA Tirtawening Kota Bandung');
    expect(profil.misi.length).toBeGreaterThan(0);
    expect(profil.alamatPusat).toContain('Badaksinga');

    const kontak = await pengaturanService.getPengaturan(
      'kontak_layanan',
      DEFAULT_KONTAK_LAYANAN
    );
    expect(kontak.kantorCabang.length).toBe(6);

    const syarat = await pengaturanService.getPengaturan(
      'syarat_pasang_baru',
      DEFAULT_SYARAT_PASANG_BARU
    );
    expect(syarat.syaratDokumen.length).toBeGreaterThanOrEqual(4);

    const caraBayar = await pengaturanService.getPengaturan(
      'cara_pembayaran',
      DEFAULT_CARA_PEMBAYARAN
    );
    expect(caraBayar.kanal.length).toBeGreaterThanOrEqual(4);

    const tarif = await pengaturanService.getPengaturan(
      'struktur_tarif',
      DEFAULT_STRUKTUR_TARIF
    );
    expect(tarif.tarif.length).toBeGreaterThanOrEqual(5);

    const berita = await pengaturanService.getPengaturan(
      'berita_pengumuman',
      DEFAULT_BERITA_PENGUMUMAN
    );
    expect(berita.daftarBerita.length).toBeGreaterThanOrEqual(2);

    const gangguan = await pengaturanService.getPengaturan(
      'info_gangguan',
      DEFAULT_INFO_GANGGUAN
    );
    expect(gangguan.daftarGangguan.length).toBeGreaterThanOrEqual(1);
  });

  test('2. GET /api/public/pengaturan returns complete dynamic CMS configuration', async () => {
    const req = new Request('http://localhost:3000/api/public/pengaturan');
    const res = await getPengaturanPublik(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.profilPerusahaan).toBeDefined();
    expect(json.data.kontakLayanan).toBeDefined();
    expect(json.data.syaratPasangBaru).toBeDefined();
    expect(json.data.caraPembayaran).toBeDefined();
    expect(json.data.strukturTarif).toBeDefined();
    expect(json.data.beritaPengumuman).toBeDefined();
    expect(json.data.infoGangguan).toBeDefined();
  });

  test('3. GET /api/public/wilayah-cakupan returns real Pelayanan Wilayah 5 data', async () => {
    const res = await getWilayahCakupan();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.wilayah).toContain('Wilayah Pelayanan 5');
    expect(json.data.totalPelanggan).toBeGreaterThanOrEqual(20000);
    expect(json.data.totalKecamatan).toBe(7);
    expect(json.data.totalKelurahan).toBe(21);
    expect(json.data.kecamatan.length).toBe(7);

    // Verify first kecamatan is Regol or Astana Anyar with real numbers
    const regol = json.data.kecamatan.find(
      (k: any) => k.namaSingkat === 'REGOL'
    );
    expect(regol).toBeDefined();
    expect(regol.totalPelanggan).toBeGreaterThan(6000);
    expect(regol.kelurahanList.length).toBe(7);
  });
});
