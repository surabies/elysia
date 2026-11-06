import { describe, it, expect } from 'bun:test';
import { app } from '@/src/server/app';
import { bulanBaruService } from '../apps/web/src/server/services/closing/bulan-baru.service';
import { caterRuteService } from '../apps/web/src/server/services/cater/cater-rute.service';
import { pelangganService } from '../apps/web/src/server/services/pelanggan/pelanggan.service';
import { caterProgressService } from '../apps/web/src/server/services/cater/cater-progress.service';
import { mapService } from '../apps/web/src/server/services/geo/map.service';

describe('Aurora Sidebar Synchronization & Enterprise Backend Verification', () => {
  describe('1. Module 8.2: Buka Bulan Baru DPM Service & Endpoint', () => {
    it('bulanBaruService exposes bukaBulanBaru orchestration method', () => {
      expect(bulanBaruService).toBeDefined();
      expect(typeof bulanBaruService.bukaBulanBaru).toBe('function');
    });

    it('POST /api/closing/bulan-baru requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/closing/bulan-baru', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            periodeLalu: '202601',
            periodeBaru: '202602',
          }),
        })
      );
      expect(res.status).toBe(401);
    });
  });

  describe('2. Module 2: Manajemen Rute Cater (2.6, 2.7, 2.8)', () => {
    it('caterRuteService exposes pindahRute, urutkanRute, and gabungRute', () => {
      expect(caterRuteService).toBeDefined();
      expect(typeof caterRuteService.pindahRute).toBe('function');
      expect(typeof caterRuteService.urutkanRute).toBe('function');
      expect(typeof caterRuteService.gabungRute).toBe('function');
    });

    it('POST /api/cater/rute/pindah requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/rute/pindah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nolgList: ['00302600011'],
            ruteTujuan: 'CD104',
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/cater/rute/urutkan requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/rute/urutkan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruteKode: 'CD104',
            urutanList: [{ nolg: '00302600011', noUrutRute: 1 }],
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/cater/rute/gabung requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/rute/gabung', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruteSumber: 'CD104',
            ruteTujuan: 'CD105',
          }),
        })
      );
      expect(res.status).toBe(401);
    });
  });

  describe('3. Module 3: Administrasi & Pencarian Pelanggan (3.2, 3.3, 3.4, 3.5)', () => {
    it('pelangganService exposes search, detail, kontak, and golongan tarif methods', () => {
      expect(pelangganService).toBeDefined();
      expect(typeof pelangganService.searchPelanggan).toBe('function');
      expect(typeof pelangganService.getDetailPelanggan).toBe('function');
      expect(typeof pelangganService.updateKontak).toBe('function');
      expect(typeof pelangganService.updateGolonganTarif).toBe('function');
    });

    it('GET /api/cater/pelanggan/search requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/pelanggan/search?q=003&limit=5')
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/cater/pelanggan/:nolg requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/pelanggan/00302600011')
      );
      expect(res.status).toBe(401);
    });

    it('PATCH /api/cater/pelanggan/:nolg/kontak requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/pelanggan/00302600011/kontak', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noTelp: '081234567890',
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it('PATCH /api/cater/pelanggan/:nolg/tarif requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/pelanggan/00302600011/tarif', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tarifKode: '2A1',
          }),
        })
      );
      expect(res.status).toBe(401);
    });
  });

  describe('4. Module 5: Laporan & Monitoring Progress Cater (5.2, 5.3, 5.5, 5.7)', () => {
    it('caterProgressService exposes wilayah, cater, ekstrim, and pemakaian nol aggregations', () => {
      expect(caterProgressService).toBeDefined();
      expect(typeof caterProgressService.getProgressPerWilayah).toBe('function');
      expect(typeof caterProgressService.getProgressPerCater).toBe('function');
      expect(typeof caterProgressService.getIkhtisarEkstrim).toBe('function');
      expect(typeof caterProgressService.getIkhtisarPemakaianNol).toBe('function');
    });

    it('GET /api/cater/progress/wilayah/:thbl requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/progress/wilayah/202601')
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/cater/progress/cater/:thbl requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/progress/cater/202601')
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/cater/progress/ekstrim/:thbl requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/progress/ekstrim/202601')
      );
      expect(res.status).toBe(401);
    });

    it('GET /api/cater/progress/pemakaian-nol/:thbl requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/progress/pemakaian-nol/202601')
      );
      expect(res.status).toBe(401);
    });
  });

  describe('5. Module 6: Monitoring Spasial (Peta Persebaran Cater)', () => {
    it('mapService exposes getPelangganGeoJson method', () => {
      expect(mapService).toBeDefined();
      expect(typeof mapService.getPelangganGeoJson).toBe('function');
    });

    it('GET /api/cater/map/geojson requires authentication (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/cater/map/geojson?thbl=202601&ruteKode=CD104')
      );
      expect(res.status).toBe(401);
    });
  });
});
