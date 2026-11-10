import { describe, expect, it } from 'bun:test';
import {
  batasKelurahanFC,
  batasKecamatanFC,
  titikPelangganFC,
  ringkasanKoordinatPelanggan,
  ruteFC,
  titikPotensiFC,
  titikEksPelangganFC,
  titikPengaduanFC,
  daftarKebocoranAktifPeta,
  ringkasanLaporanPeta,
  ringkasanAsetPeta,
} from '../apps/web/src/server/services/geo/peta-wilayah.service';
import { standaloneTopNav } from '../apps/web/src/config/navigasi';
import { getPrimaryIcon, PRIMARY_ICONS } from '../apps/web/src/components/layout/navigation/sidebar/lib/Icons';

describe('Peta Wilayah Operasional — 7 Kecamatan & 21 Kelurahan + Data Verifikasi', () => {
  it('1. batasKelurahanFC returns EXACTLY 21 official kelurahan from database', async () => {
    const fc = await batasKelurahanFC();
    expect(fc).toBeDefined();
    expect(fc.type).toBe('FeatureCollection');
    expect(Array.isArray(fc.features)).toBe(true);
    expect(fc.features.length).toBe(21);

    const first = fc.features[0];
    expect(first.type).toBe('Feature');
    expect(first.geometry).toBeDefined();
    expect(typeof first.properties.id).toBe('string');
    expect(typeof first.properties.nama).toBe('string');
    expect(typeof first.properties.warna).toBe('number');
  });

  it('2. batasKecamatanFC aggregates properly into EXACTLY 7 official kecamatan', async () => {
    const fc = await batasKecamatanFC();
    expect(fc).toBeDefined();
    expect(fc.type).toBe('FeatureCollection');
    expect(Array.isArray(fc.features)).toBe(true);
    expect(fc.features.length).toBe(7);

    const names = fc.features.map((f) => f.properties.nama).sort();
    expect(names).toEqual([
      'ANDIR',
      'ASTANA ANYAR',
      'BANDUNG WETAN',
      'BOJONGLOA KIDUL',
      'LENGKONG',
      'REGOL',
      'SUMUR BANDUNG',
    ]);
  });

  it('3. ringkasanKoordinatPelanggan returns integer statistics', async () => {
    const stat = await ringkasanKoordinatPelanggan();
    expect(stat).toBeDefined();
    expect(typeof stat.total).toBe('number');
    expect(typeof stat.berkoordinat).toBe('number');
    expect(typeof stat.tanpaKoordinat).toBe('number');
  });

  it('4. titikPelangganFC returns a FeatureCollection with database points', async () => {
    const fc = await titikPelangganFC(10);
    expect(fc.type).toBe('FeatureCollection');
    expect(Array.isArray(fc.features)).toBe(true);
    expect(fc.features.length).toBeGreaterThan(0);
  });

  it('5. titikPotensiFC returns prospect points loaded from Data_verifikasi.geojson', async () => {
    const fc = await titikPotensiFC();
    expect(fc.type).toBe('FeatureCollection');
    expect(Array.isArray(fc.features)).toBe(true);
    expect(fc.features.length).toBeGreaterThan(700);

    const first = fc.features[0];
    expect(first.properties.status).toBe('PROSPEK');
    expect(first.geometry).toBeDefined();
  });

  it('6. titikEksPelangganFC returns disconnection points loaded from Data_verifikasi.geojson', async () => {
    const fc = await titikEksPelangganFC();
    expect(fc.type).toBe('FeatureCollection');
    expect(Array.isArray(fc.features)).toBe(true);
    expect(fc.features.length).toBeGreaterThan(200);

    const first = fc.features[0];
    expect(first.properties.sumberData).toBe('SURVEI_GEOJSON');
    expect(first.geometry).toBeDefined();
  });

  it('7. titikPengaduanFC returns complaints FeatureCollection', async () => {
    const fc = await titikPengaduanFC();
    expect(fc.type).toBe('FeatureCollection');
    expect(Array.isArray(fc.features)).toBe(true);
  });

  it('8. daftarKebocoranAktifPeta returns array of active leak issues', async () => {
    const daftar = await daftarKebocoranAktifPeta();
    expect(Array.isArray(daftar)).toBe(true);
  });

  it('9. ringkasanLaporanPeta returns valid KPI metrics and monthly trends', async () => {
    const ringkasan = await ringkasanLaporanPeta();
    expect(typeof ringkasan.aktif).toBe('number');
    expect(typeof ringkasan.laporan30Hari).toBe('number');
    expect(Array.isArray(ringkasan.trenBulanan)).toBe(true);
    expect(Array.isArray(ringkasan.hotspot)).toBe(true);
  });

  it('10. ringkasanAsetPeta returns asset counts reflecting 21 official kelurahan', async () => {
    const aset = await ringkasanAsetPeta();
    expect(typeof aset.totalRute).toBe('number');
    expect(typeof aset.pelangganBerkoordinat).toBe('number');
    expect(aset.kelurahanDenganGeometri).toBe(21);
  });

  it('11. Sidebar navigation includes Peta Wilayah in standaloneTopNav with correct icon', () => {
    const item = standaloneTopNav.find((n) => n.href === '/peta-wilayah');
    expect(item).toBeDefined();
    expect(item?.title).toBe('Peta Wilayah');
    expect(item?.description).toContain('wilayah');

    const icon = getPrimaryIcon('/peta-wilayah');
    expect(icon).toBeDefined();
    expect(PRIMARY_ICONS['/peta-wilayah']).toBeDefined();
  });
});
